---
sidebar_label: Compensation Events
slug: /bpmn/events/compensation-events
title: "Compensation Events"
description: "Complete guide to Compensation Events in Activiti - undoing completed activities and implementing rollback logic."
---

# Compensation Events

Compensation Events provide a mechanism to **undo or compensate for completed activities**. They are essential for implementing rollback logic in long-running processes where traditional transaction rollback isn't possible.

## Overview

```xml
<!-- Activity to be compensated -->
<serviceTask id="placeOrder" name="Place Order"/>

<!-- Compensation boundary event (sibling of the activity) -->
<boundaryEvent id="compensateOrder" attachedToRef="placeOrder" cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>

<!-- Association from the boundary event to the compensation handler -->
<association id="compensateOrderAssoc" sourceRef="compensateOrder" targetRef="cancelOrder"/>

<!-- Compensation handler - isForCompensation="true" is required -->
<serviceTask id="cancelOrder" name="Cancel Order" isForCompensation="true"/>

<!-- Throw compensation (activityRef omitted = broadcast within scope) -->
<intermediateThrowEvent id="triggerCompensation">
  <compensateEventDefinition/>
</intermediateThrowEvent>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** None (standard BPMN behavior)

## Key Features

### Compensation Event Types

| Type | Location | Purpose |
|------|----------|---------|
| **Boundary Compensation** | Attached to activity | Listen for compensation requests |
| **Intermediate Throw** | In flow | Trigger compensation |

**Not supported:** Compensation end events. The `CompensateEventDefinitionParseHandler` only handles `ThrowEvent` and `BoundaryEvent` — compensation on end events falls through with no behavior assigned.

### Compensation Characteristics

| Feature | Description |
|---------|-------------|
| **Interrupting Mode** | Both `cancelActivity="true"` and `cancelActivity="false"` are accepted; `false` (non-interrupting) is the typical setup |
| **Completed Activities** | Only compensates completed tasks |
| **Activity Reference** | `activityRef` is optional — if empty/null, compensation broadcasts to ALL completed activities in the current scope. When set on a **throw** event it must reference the compensation **handler** activity (subscriptions are keyed by the handler id); pointing it at the source activity matches no subscription |
| **waitForCompletion** | Attribute exists on `CompensateEventDefinition` but is **not yet implemented** (TODO in source). Always defaults to `true` |
| **Order** | Compensates in reverse order |
| **Variables** | Original variables available |
| **isForCompensation** | Compensation handler activities must have `isForCompensation="true"` attribute, otherwise the engine will throw an `ActivitiException` |

## When to Use Compensation

### Ideal Scenarios

1. **Long-Running Processes**
   - Activities complete over hours/days
   - Can't use database transactions
   - Need to undo completed work

2. **External System Integration**
   - Orders placed with vendors
   - Payments processed
   - Resources allocated

3. **Human Tasks**
   - Approvals granted
   - Reviews completed
   - Decisions made

### Example Use Case: Order Cancellation

```
Process Flow:
1. Reserve Inventory ✓ (completed)
2. Process Payment ✓ (completed)
3. Ship Order ✗ (failed)

Compensation:
- Cancel Shipment (N/A - not started)
- Refund Payment (compensate #2)
- Release Inventory (compensate #1)
```

## Configuration Options

### 1. Compensation Boundary Event

Define compensation handler on an activity:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<serviceTask id="placeOrder" name="Place Order" 
             activiti:class="com.example.OrderPlacer"/>

<!-- Compensation boundary event (sibling of the activity) -->
<boundaryEvent id="compensatePlaceOrder" attachedToRef="placeOrder" 
               cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>

<!-- Association from the boundary event to the compensation handler -->
<association id="compensatePlaceOrderAssoc" sourceRef="compensatePlaceOrder" targetRef="cancelOrder"/>

<!-- Compensation handler - isForCompensation="true" is required -->
<serviceTask id="cancelOrder" name="Cancel Order" 
             activiti:class="com.example.OrderCanceler" isForCompensation="true"/>
```

**Important:**
- The boundary event must be a **sibling** of the activity (with `attachedToRef`); nested inside the activity element it is dropped by the parser
- The handler is linked with an `<association>` and must declare `isForCompensation="true"` — otherwise the engine throws `Compensation activity could not be found (or it is missing 'isForCompensation="true"')` when the activity completes
- `cancelActivity` accepts both `true` and `false`; `false` is the typical (non-interrupting) setup
- The compensation handler runs when a throw-compensation event is triggered (after the activity has completed)

### 2. Intermediate Compensation Throw Event

Trigger compensation from anywhere in the process:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="compensationProcess" name="Compensation Example">
  
  <startEvent id="start"/>
  
  <!-- Activities that might need compensation -->
  <serviceTask id="reserveInventory" name="Reserve Inventory" 
               activiti:class="com.example.InventoryReserver"/>
  
  <serviceTask id="processPayment" name="Process Payment" 
               activiti:class="com.example.PaymentProcessor"/>
  
  <!-- Compensation boundary events (siblings of the activities) -->
  <boundaryEvent id="compReserve" attachedToRef="reserveInventory" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <boundaryEvent id="compPayment" attachedToRef="processPayment" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <!-- Associations from the boundary events to the compensation handlers -->
  <association id="compReserveAssoc" sourceRef="compReserve" targetRef="releaseInventory"/>
  
  <association id="compPaymentAssoc" sourceRef="compPayment" targetRef="refundPayment"/>
  
  <!-- Compensation handlers - isForCompensation="true" is required -->
  <serviceTask id="releaseInventory" name="Release Inventory" 
               activiti:class="com.example.InventoryRelease" isForCompensation="true"/>
  
  <serviceTask id="refundPayment" name="Refund Payment" 
               activiti:class="com.example.PaymentRefund" isForCompensation="true"/>
  
  <!-- Decision point -->
  <exclusiveGateway id="shipmentCheck"/>
  
  <!-- Shipment successful -->
  <sequenceFlow id="success" sourceRef="shipmentCheck" targetRef="shipOrder">
    <conditionExpression>${shipmentSuccess}</conditionExpression>
  </sequenceFlow>
  
  <!-- Shipment failed - trigger compensation for both previous activities -->
  <sequenceFlow id="failed" sourceRef="shipmentCheck" targetRef="compensate">
    <conditionExpression>${!shipmentSuccess}</conditionExpression>
  </sequenceFlow>
  
  <!-- Throw compensation (activityRef omitted = broadcast within scope) -->
  <intermediateThrowEvent id="compensate">
    <compensateEventDefinition/>
  </intermediateThrowEvent>
  
  <serviceTask id="shipOrder" name="Ship Order"/>
  
  <endEvent id="successEnd"/>
  <endEvent id="failureEnd"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="reserveInventory"/>
  <sequenceFlow id="flow2" sourceRef="reserveInventory" targetRef="processPayment"/>
  <sequenceFlow id="flow3" sourceRef="processPayment" targetRef="shipmentCheck"/>
  <sequenceFlow id="flow4" sourceRef="compensate" targetRef="failureEnd"/>
  <sequenceFlow id="flow5" sourceRef="shipOrder" targetRef="successEnd"/>
  
</process>
```

**How it works:** When `reserveInventory` and `processPayment` complete, the engine registers a compensation subscription for each (via the boundary events and associations). The throw event without `activityRef` broadcasts the compensation to the current scope: the handlers run in reverse order of completion (`refundPayment` first, then `releaseInventory`).

### 3. Compensation End Event (Not Supported)

There is no compensation end event element in Activiti — a `compensateEventDefinition` on an end event gets no behavior (the `CompensateEventDefinitionParseHandler` only handles throw events and boundary events). Boundary/throw compensation is the supported mechanism: to compensate and then terminate, place a throw-compensation event in the flow before the end event (as in the examples below).

**Note:** `activityRef` is optional. When omitted, the compensation event broadcasts to ALL completed activities in the current compensation scope.

**Note:** `waitForCompletion` attribute exists on `CompensateEventDefinition` but is not yet implemented (marked as TODO in source code).

## Complete Examples

### Example 1: E-Commerce Order Process

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="orderProcess" name="E-Commerce Order Processing">
  
  <startEvent id="start"/>
  
  <!-- Step 1: Reserve inventory -->
  <serviceTask id="reserveInventory" name="Reserve Inventory" 
               activiti:class="com.example.InventoryService"/>
  
  <boundaryEvent id="compReserve" attachedToRef="reserveInventory" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <association id="compReserveAssoc" sourceRef="compReserve" targetRef="releaseInventory"/>
  
  <serviceTask id="releaseInventory" name="Release Inventory" 
               activiti:class="com.example.InventoryReleaseService" isForCompensation="true"/>
  
  <!-- Step 2: Process payment -->
  <serviceTask id="processPayment" name="Process Payment" 
               activiti:class="com.example.PaymentService"/>
  
  <boundaryEvent id="compPayment" attachedToRef="processPayment" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <association id="compPaymentAssoc" sourceRef="compPayment" targetRef="refundPayment"/>
  
  <serviceTask id="refundPayment" name="Refund Payment" 
               activiti:class="com.example.RefundService" isForCompensation="true"/>
  
  <!-- Step 3: Create shipment -->
  <serviceTask id="createShipment" name="Create Shipment" 
               activiti:class="com.example.ShipmentService"/>
  
  <!-- Step 4: Validate shipment -->
  <exclusiveGateway id="shipmentValidation"/>
  
  <!-- Success path -->
  <sequenceFlow id="valid" sourceRef="shipmentValidation" targetRef="confirmOrder">
    <conditionExpression>${shipmentValid}</conditionExpression>
  </sequenceFlow>
  
  <!-- Failure path - trigger compensation -->
  <sequenceFlow id="invalid" sourceRef="shipmentValidation" targetRef="compensatePaymentEvent">
    <conditionExpression>${!shipmentValid}</conditionExpression>
  </sequenceFlow>
  
  <!-- Throw compensation (activityRef omitted = broadcast within scope) -->
  <intermediateThrowEvent id="compensatePaymentEvent">
    <compensateEventDefinition/>
  </intermediateThrowEvent>
  
  <serviceTask id="confirmOrder" name="Confirm Order" 
               activiti:class="com.example.OrderConfirmationService"/>
  
  <endEvent id="successEnd"/>
  <endEvent id="failureEnd"/>
  
  <!-- Main flow -->
  <sequenceFlow id="flow1" sourceRef="start" targetRef="reserveInventory"/>
  <sequenceFlow id="flow2" sourceRef="reserveInventory" targetRef="processPayment"/>
  <sequenceFlow id="flow3" sourceRef="processPayment" targetRef="createShipment"/>
  <sequenceFlow id="flow4" sourceRef="createShipment" targetRef="shipmentValidation"/>
  <sequenceFlow id="flow5" sourceRef="compensatePaymentEvent" targetRef="failureEnd"/>
  <sequenceFlow id="flow6" sourceRef="confirmOrder" targetRef="successEnd"/>
  
</process>
```

**Compensation Flow:**
1. Shipment validation fails
2. The throw-compensation event broadcasts within scope → handlers run in reverse order of completion: `refundPayment` (compensates #2), then `releaseInventory` (compensates #1)
3. Process ends with failure

### Example 2: Multi-Step Approval with Compensation

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="approvalProcess" name="Approval with Compensation">
  
  <startEvent id="start"/>
  
  <!-- Step 1: Financial approval -->
  <userTask id="financialApproval" name="Financial Approval" 
            activiti:assignee="${financeManager}"/>
  
  <boundaryEvent id="compFinancial" attachedToRef="financialApproval" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <association id="compFinancialAssoc" sourceRef="compFinancial" targetRef="revokeFinancialApproval"/>
  
  <serviceTask id="revokeFinancialApproval" name="Revoke Financial Approval" 
               activiti:class="com.example.ApprovalRevoker" isForCompensation="true"/>
  
  <!-- Step 2: Legal approval -->
  <userTask id="legalApproval" name="Legal Approval" 
            activiti:assignee="${legalTeam}"/>
  
  <boundaryEvent id="compLegal" attachedToRef="legalApproval" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <association id="compLegalAssoc" sourceRef="compLegal" targetRef="revokeLegalApproval"/>
  
  <serviceTask id="revokeLegalApproval" name="Revoke Legal Approval" 
               activiti:class="com.example.ApprovalRevoker" isForCompensation="true"/>
  
  <!-- Step 3: Executive approval -->
  <userTask id="executiveApproval" name="Executive Approval" 
            activiti:assignee="${ceo}"/>
  
  <boundaryEvent id="compExecutive" attachedToRef="executiveApproval" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <association id="compExecutiveAssoc" sourceRef="compExecutive" targetRef="revokeExecutiveApproval"/>
  
  <serviceTask id="revokeExecutiveApproval" name="Revoke Executive Approval" 
               activiti:class="com.example.ApprovalRevoker" isForCompensation="true"/>
  
  <!-- Step 4: Final validation -->
  <exclusiveGateway id="finalCheck"/>
  
  <!-- All good -->
  <sequenceFlow id="approved" sourceRef="finalCheck" targetRef="executeContract">
    <conditionExpression>${allApproved}</conditionExpression>
  </sequenceFlow>
  
  <!-- Issue found - compensate all approvals (activityRef omitted = broadcast within scope) -->
  <sequenceFlow id="rejected" sourceRef="finalCheck" targetRef="compensateApprovals">
    <conditionExpression>${!allApproved}</conditionExpression>
  </sequenceFlow>
  
  <intermediateThrowEvent id="compensateApprovals">
    <compensateEventDefinition/>
  </intermediateThrowEvent>
  
  <serviceTask id="executeContract" name="Execute Contract" 
               activiti:class="com.example.ContractExecutor"/>
  
  <endEvent id="successEnd"/>
  <endEvent id="failureEnd"/>
  
  <!-- Main flow -->
  <sequenceFlow id="flow1" sourceRef="start" targetRef="financialApproval"/>
  <sequenceFlow id="flow2" sourceRef="financialApproval" targetRef="legalApproval"/>
  <sequenceFlow id="flow3" sourceRef="legalApproval" targetRef="executiveApproval"/>
  <sequenceFlow id="flow4" sourceRef="executiveApproval" targetRef="finalCheck"/>
  <sequenceFlow id="flow5" sourceRef="compensateApprovals" targetRef="failureEnd"/>
  <sequenceFlow id="flow6" sourceRef="executeContract" targetRef="successEnd"/>
  
</process>
```

### Example 3: Saga Pattern Implementation

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="sagaProcess" name="Saga Pattern - Distributed Transaction">
  
  <startEvent id="start"/>
  
  <!-- Step 1: Create order -->
  <serviceTask id="createOrder" name="Create Order" 
               activiti:class="com.example.OrderCreator"/>
  
  <boundaryEvent id="compOrder" attachedToRef="createOrder" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <association id="compOrderAssoc" sourceRef="compOrder" targetRef="cancelOrder"/>
  <serviceTask id="cancelOrder" name="Cancel Order" 
               activiti:class="com.example.OrderCanceler" isForCompensation="true"/>
  
  <!-- Step 2: Reserve inventory -->
  <serviceTask id="reserveInventory" name="Reserve Inventory" 
               activiti:class="com.example.InventoryReserver"/>
  
  <boundaryEvent id="compInventory" attachedToRef="reserveInventory" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <association id="compInventoryAssoc" sourceRef="compInventory" targetRef="releaseInventory"/>
  <serviceTask id="releaseInventory" name="Release Inventory" 
               activiti:class="com.example.InventoryReleaser" isForCompensation="true"/>
  
  <!-- Step 3: Process payment -->
  <serviceTask id="processPayment" name="Process Payment" 
               activiti:class="com.example.PaymentProcessor"/>
  
  <boundaryEvent id="compPayment" attachedToRef="processPayment" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <association id="compPaymentAssoc" sourceRef="compPayment" targetRef="refundPayment"/>
  <serviceTask id="refundPayment" name="Refund Payment" 
               activiti:class="com.example.PaymentRefunder" isForCompensation="true"/>
  
  <!-- Step 4: Arrange delivery -->
  <serviceTask id="arrangeDelivery" name="Arrange Delivery" 
               activiti:class="com.example.DeliveryArranger"/>
  
  <boundaryEvent id="compDelivery" attachedToRef="arrangeDelivery" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <association id="compDeliveryAssoc" sourceRef="compDelivery" targetRef="cancelDelivery"/>
  <serviceTask id="cancelDelivery" name="Cancel Delivery" 
               activiti:class="com.example.DeliveryCanceler" isForCompensation="true"/>
  
  <!-- Step 5: Final validation -->
  <exclusiveGateway id="finalValidation"/>
  
  <!-- Success -->
  <sequenceFlow id="success" sourceRef="finalValidation" targetRef="confirmSaga">
    <conditionExpression>${success}</conditionExpression>
  </sequenceFlow>
  
  <!-- Failure - throw compensation for all completed steps (activityRef omitted = broadcast within scope) -->
  <sequenceFlow id="invalid" sourceRef="finalValidation" targetRef="compensatePaymentEvent">
    <conditionExpression>${!success}</conditionExpression>
  </sequenceFlow>
  
  <intermediateThrowEvent id="compensatePaymentEvent">
    <compensateEventDefinition/>
  </intermediateThrowEvent>
  
  <serviceTask id="confirmSaga" name="Confirm Saga" 
               activiti:class="com.example.SagaConfirmer"/>

  <endEvent id="successEnd"/>
  <endEvent id="failureEnd"/>

  <sequenceFlow id="flow6" sourceRef="compensatePaymentEvent" targetRef="failureEnd"/>
  <sequenceFlow id="flow7" sourceRef="confirmSaga" targetRef="successEnd"/>
  
</process>
```

**Saga Pattern Benefits:**
- Each step has compensating action
- Failure triggers reverse-order compensation
- Maintains data consistency across distributed systems

## Compensation Handler Implementation

### Java Delegate for Compensation

```java
public class OrderCanceler implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get original activity variables
        String orderId = (String) execution.getVariable("orderId");
        String reason = "Compensation - Shipment Failed";
        
        // Perform compensation logic
        System.out.println("Compensating: Canceling order " + orderId);
        System.out.println("Reason: " + reason);
        
        // Call external system to cancel
        orderService.cancelOrder(orderId, reason);
        
        // Set compensation complete flag
        execution.setVariable("orderCompensated", true);
    }
}
```

### Accessing Original Variables

```java
public class PaymentRefunder implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Original payment variables are still available
        String paymentId = (String) execution.getVariable("paymentId");
        BigDecimal amount = (BigDecimal) execution.getVariable("paymentAmount");
        String customerId = (String) execution.getVariable("customerId");
        
        // Perform refund
        paymentService.refund(paymentId, amount, "Compensation");
        
        // Log compensation
        execution.setVariable("refundId", paymentService.getRefundId(paymentId));
    }
}
```

## Runtime Behavior

### Compensation Execution Order

```java
// When multiple compensations are triggered, they execute in REVERSE order
// of the original activity completion

// Original order:
// 1. reserveInventory (completed first)
// 2. processPayment (completed second)
// 3. createShipment (completed third)

// Compensation order (reverse):
// 1. createShipment compensation (executed first)
// 2. processPayment compensation (executed second)
// 3. reserveInventory compensation (executed third)
```

### Monitoring Compensation

```java
// Compensation activities appear in task/query like normal activities
List<Task> compensationTasks = taskService.createTaskQuery()
    .processInstanceId(processInstanceId)
    .list();

for (Task task : compensationTasks) {
    if (task.getName().contains("Cancel") || task.getName().contains("Refund")) {
        System.out.println("Compensation task: " + task.getName());
    }
}
```

## Best Practices

### 1. Always Define Compensation Handlers

```xml
<!-- GOOD: Compensation handler defined -->
<serviceTask id="placeOrder" name="Place Order"/>

<boundaryEvent id="compOrder" attachedToRef="placeOrder" cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>

<association id="compOrderAssoc" sourceRef="compOrder" targetRef="cancelOrder"/>
<serviceTask id="cancelOrder" name="Cancel Order" isForCompensation="true"/>

<!-- BAD: No compensation handler -->
<serviceTask id="otherOrder" name="Place Order"/>
<!-- Compensation will fail with no handler -->
```

### 2. Make Compensation Idempotent

```java
// GOOD: Can be called multiple times safely
public class SafeCompensator implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        String orderId = (String) execution.getVariable("orderId");
        
        // Check if already compensated
        if (!orderService.isCompensated(orderId)) {
            orderService.cancelOrder(orderId);
            orderService.markCompensated(orderId);
        }
    }
}

// BAD: Not idempotent
public class UnsafeCompensator implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        String orderId = (String) execution.getVariable("orderId");
        orderService.cancelOrder(orderId); // Might fail if already canceled
    }
}
```

### 3. Log Compensation Execution

```java
public class LoggedCompensator implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        String activityId = execution.getCurrentActivityId();
        String processInstanceId = execution.getProcessInstanceId();
        
        logger.info("Compensation started: activity={}, process={}", 
                   activityId, processInstanceId);
        
        try {
            performCompensation(execution);
            logger.info("Compensation completed: activity={}", activityId);
        } catch (Exception e) {
            logger.error("Compensation failed: activity={}", activityId, e);
            throw e;
        }
    }
}
```

### 4. Use Meaningful Compensation Names

```xml
<!-- GOOD: Clear purpose -->
<serviceTask id="refundPayment" name="Refund Payment"/>
<serviceTask id="releaseInventory" name="Release Reserved Inventory"/>

<!-- BAD: Generic -->
<serviceTask id="comp1" name="Compensation"/>
<serviceTask id="comp2" name="Undo"/>
```

### 5. Test Compensation Paths

```java
@Test
public void testCompensationFlow() {
    // Start process
    String processInstanceId = runtimeService.startProcessInstanceByKey("orderProcess");
    
    // Complete activities
    // ...
    
    // Trigger failure
    runtimeService.setVariable(processInstanceId, "shipmentValid", false);
    
    // Verify compensation executed
    List<HistoricActivityInstance> compensationActivities = 
        historyService.createHistoricActivityInstanceQuery()
            .processInstanceId(processInstanceId)
            .activityIdIn("refundPayment", "releaseInventory")
            .list();
    
    assertEquals(2, compensationActivities.size());
}
```

## Common Pitfalls

### 1. Forgetting Compensation Handler

**Problem:** No activity to handle compensation

```xml
<!-- WRONG: Compensation boundary event with no associated handler -->
<serviceTask id="placeOrder" name="Place Order"/>

<boundaryEvent id="compOrder" attachedToRef="placeOrder" cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>

<!-- No association to an isForCompensation="true" handler! -->

<!-- CORRECT: Define the handler and link it with an association -->
<serviceTask id="placeOrder" name="Place Order"/>

<boundaryEvent id="compOrder" attachedToRef="placeOrder" cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>

<association id="compFlow" sourceRef="compOrder" targetRef="cancelOrder"/>
<serviceTask id="cancelOrder" name="Cancel Order" isForCompensation="true"/>
```

**Error:** `ActivitiException: Compensation activity could not be found (or it is missing 'isForCompensation="true"')` — thrown when the activity completes and its compensation boundary event cannot resolve a handler. Note that a sequence flow from the boundary event to a handler is **not** enough — the engine resolves the handler through the `<association>` and requires `isForCompensation="true"` on the target.

### 2. Trying to Compensate Incomplete Activities

**Problem:** Compensation only works on completed activities

```xml
<!-- Compensation only triggers for activities that completed before failure.
     If step2 fails, step1 is only compensated if it already completed. -->
<serviceTask id="step1" name="Step 1"/>
<serviceTask id="step2" name="Step 2"/>

<boundaryEvent id="step1Comp" attachedToRef="step1" cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>
<association id="step1Assoc" sourceRef="step1Comp" targetRef="undoStep1"/>
<serviceTask id="undoStep1" name="Undo Step 1" isForCompensation="true"/>

<!-- If activityRef is set, it must reference the compensation HANDLER (undoStep1),
     not the source activity — subscriptions are keyed by the handler id. -->
<intermediateThrowEvent id="comp">
  <compensateEventDefinition activityRef="undoStep1"/>
</intermediateThrowEvent>
```

**Note:** The engine no longer validates `activityRef` at deploy time (the legacy check is disabled in the source), so pointing it at a regular activity such as `step1` deploys without error — and then silently matches no subscription, making the throw a no-op.

### 3. Interrupting vs Non-Interrupting Compensation

**Problem:** It is often assumed that compensation must be non-interrupting — but both values are accepted

```xml
<!-- Interrupting: cancelActivity="true" is accepted -->
<serviceTask id="placeOrder" name="Place Order"/>

<boundaryEvent id="compOrderInterrupting" attachedToRef="placeOrder" cancelActivity="true">
  <compensateEventDefinition/>
</boundaryEvent>

<association id="compOrderAssoc" sourceRef="compOrderInterrupting" targetRef="cancelOrder"/>
<serviceTask id="cancelOrder" name="Cancel Order" isForCompensation="true"/>

<!-- Non-interrupting: cancelActivity="false" (the typical compensation setup) -->
<serviceTask id="bookFlight" name="Book Flight"/>

<boundaryEvent id="compFlight" attachedToRef="bookFlight" cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>

<association id="compFlightAssoc" sourceRef="compFlight" targetRef="cancelFlight"/>
<serviceTask id="cancelFlight" name="Cancel Flight" isForCompensation="true"/>
```

With `cancelActivity="false"`, the activity completes normally and registers a compensation subscription that a later throw-compensation event can trigger. With `cancelActivity="true"`, the boundary event cancels the attached activity when it fires and removes the compensation subscription matching `activityRef`. Note that only one compensation boundary event is allowed per activity (the validator flags multiple).

### 4. Circular Compensation

**Problem:** Compensation triggers compensation

```xml
<!-- WRONG: compensation handler loops back into the compensated flow -->
<serviceTask id="activity1" name="Activity 1"/>
<boundaryEvent id="comp1" attachedToRef="activity1" cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>
<association id="comp1Assoc" sourceRef="comp1" targetRef="undoActivity1"/>
<serviceTask id="undoActivity1" name="Undo Activity 1" isForCompensation="true"/>

<serviceTask id="activity2" name="Activity 2"/>
<boundaryEvent id="comp2" attachedToRef="activity2" cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>
<association id="comp2Assoc" sourceRef="comp2" targetRef="undoActivity2"/>
<serviceTask id="undoActivity2" name="Undo Activity 2" isForCompensation="true"/>
<sequenceFlow id="comp2Flow" sourceRef="undoActivity2" targetRef="activity1"/>  <!-- Back to activity1 - loop! -->

<!-- CORRECT: Linear compensation flow (handler does not re-enter the process flow) -->
<sequenceFlow id="comp2Flow" sourceRef="undoActivity2" targetRef="endEvent"/>
```

## Comparison with Alternatives

### Compensation vs Error Handling

| Aspect | Error Handling | Compensation |
|--------|----------------|--------------|
| **Timing** | During activity | After completion |
| **Use Case** | Activity failures | Business rollback |
| **Scope** | Single activity | Multiple activities |
| **Order** | Immediate | Reverse order |

### Compensation vs Transaction Rollback

| Aspect | Transaction Rollback | Compensation |
|--------|---------------------|---------------|
| **Scope** | Database transaction | Business process |
| **Timing** | Immediate | Can be delayed |
| **External Systems** | Not supported | Supported |
| **Use Case** | Short operations | Long-running processes |

## Related Documentation

- [Boundary Events](./boundary-event.md) - Event attachment
- [Intermediate Events](./intermediate-events.md) - Throw events
- [End Events](./end-event.md) - Process termination
- [Error Handling](../reference/error-handling.md) - Alternative rollback

---

**Source:** `BoundaryCompensateEventActivityBehavior.java`, `IntermediateThrowCompensationEventActivityBehavior.java`
