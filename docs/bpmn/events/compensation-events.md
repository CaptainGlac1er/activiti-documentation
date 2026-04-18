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
<!-- Compensation boundary event on activity -->
<serviceTask id="placeOrder" name="Place Order">
  <boundaryEvent id="compensateOrder" attachedToRef="placeOrder" 
                 cancelActivity="false">
    <compensateEventDefinition activityRef="placeOrder"/>
  </boundaryEvent>
</serviceTask>

<!-- Compensation throw event -->
<intermediateThrowEvent id="triggerCompensation">
  <compensateEventDefinition activityRef="placeOrder"/>
</intermediateThrowEvent>

<!-- Compensation end event -->
<endEvent id="compensateAndEnd">
  <compensateEventDefinition activityRef="placeOrder"/>
</endEvent>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** None (standard BPMN behavior)

## Key Features

### Compensation Event Types

| Type | Location | Purpose |
|------|----------|---------|
| **Boundary Compensation** | Attached to activity | Listen for compensation requests |
| **Intermediate Throw** | In flow | Trigger compensation |
| **End Event** | Process end | Compensate and terminate |

### Compensation Characteristics

| Feature | Description |
|---------|-------------|
| **Non-Interrupting** | Always `cancelActivity="false"` |
| **Completed Activities** | Only compensates completed tasks |
| **Activity Reference** | Must reference specific activity |
| **Order** | Compensates in reverse order |
| **Variables** | Original variables available |

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
<serviceTask id="placeOrder" name="Place Order" 
             activiti:class="com.example.OrderPlacer">
  
  <!-- Compensation event - always non-interrupting -->
  <boundaryEvent id="compensatePlaceOrder" attachedToRef="placeOrder" 
                 cancelActivity="false">
    <compensateEventDefinition activityRef="placeOrder"/>
  </boundaryEvent>
  
</serviceTask>

<!-- Compensation flow -->
<sequenceFlow id="compFlow" sourceRef="compensatePlaceOrder" targetRef="cancelOrder"/>

<serviceTask id="cancelOrder" name="Cancel Order" 
             activiti:class="com.example.OrderCanceler"/>
```

**Important:**
- `cancelActivity="false"` is required (compensation is always non-interrupting)
- `activityRef` must match the activity being compensated
- Compensation task runs when another activity triggers compensation

### 2. Intermediate Compensation Throw Event

Trigger compensation from anywhere in the process:

```xml
<process id="compensationProcess" name="Compensation Example">
  
  <startEvent id="start"/>
  
  <!-- Activity that might need compensation -->
  <serviceTask id="reserveInventory" name="Reserve Inventory" 
               activiti:class="com.example.InventoryReserver"/>
  
  <serviceTask id="processPayment" name="Process Payment" 
               activiti:class="com.example.PaymentProcessor"/>
  
  <!-- Decision point -->
  <exclusiveGateway id="shipmentCheck"/>
  
  <!-- Shipment successful -->
  <sequenceFlow id="success" sourceRef="shipmentCheck" targetRef="shipOrder">
    <conditionExpression>${shipmentSuccess}</conditionExpression>
  </sequenceFlow>
  
  <!-- Shipment failed - trigger compensation -->
  <sequenceFlow id="failed" sourceRef="shipmentCheck" targetRef="compensate">
    <conditionExpression>${!shipmentSuccess}</conditionExpression>
  </sequenceFlow>
  
  <!-- Throw compensation for both previous activities -->
  <intermediateThrowEvent id="compensate">
    <compensateEventDefinition activityRef="processPayment"/>
  </intermediateThrowEvent>
  
  <intermediateThrowEvent id="compensate2">
    <compensateEventDefinition activityRef="reserveInventory"/>
  </intermediateThrowEvent>
  
  <serviceTask id="shipOrder" name="Ship Order"/>
  
  <endEvent id="successEnd"/>
  <endEvent id="failureEnd"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="reserveInventory"/>
  <sequenceFlow id="flow2" sourceRef="reserveInventory" targetRef="processPayment"/>
  <sequenceFlow id="flow3" sourceRef="processPayment" targetRef="shipmentCheck"/>
  <sequenceFlow id="flow4" sourceRef="compensate" targetRef="compensate2"/>
  <sequenceFlow id="flow5" sourceRef="compensate2" targetRef="failureEnd"/>
  <sequenceFlow id="flow6" sourceRef="shipOrder" targetRef="successEnd"/>
  
</process>
```

### 3. Compensation End Event

Compensate and terminate in one step:

```xml
<process id="compensateEndProcess" name="Compensate and End">
  
  <startEvent id="start"/>
  
  <serviceTask id="allocateResource" name="Allocate Resource" 
               activiti:class="com.example.ResourceAllocator"/>
  
  <serviceTask id="processData" name="Process Data" 
               activiti:class="com.example.DataProcessor"/>
  
  <exclusiveGateway id="validationCheck"/>
  
  <!-- Validation passed -->
  <sequenceFlow id="passed" sourceRef="validationCheck" targetRef="commit">
    <conditionExpression>${valid}</conditionExpression>
  </sequenceFlow>
  
  <!-- Validation failed - compensate and end -->
  <endEvent id="compensateAndEnd">
    <compensateEventDefinition activityRef="processData"/>
    <compensateEventDefinition activityRef="allocateResource"/>
  </endEvent>
  
  <serviceTask id="commit" name="Commit Changes"/>
  
  <endEvent id="successEnd"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="allocateResource"/>
  <sequenceFlow id="flow2" sourceRef="allocateResource" targetRef="processData"/>
  <sequenceFlow id="flow3" sourceRef="processData" targetRef="validationCheck"/>
  <sequenceFlow id="flow4" sourceRef="validationCheck" targetRef="compensateAndEnd">
    <conditionExpression>${!valid}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow5" sourceRef="commit" targetRef="successEnd"/>
  
</process>
```

**Note:** Multiple `compensateEventDefinition` elements compensate in reverse order of completion.

## Complete Examples

### Example 1: E-Commerce Order Process

```xml
<process id="orderProcess" name="E-Commerce Order Processing">
  
  <startEvent id="start"/>
  
  <!-- Step 1: Reserve inventory -->
  <serviceTask id="reserveInventory" name="Reserve Inventory" 
               activiti:class="com.example.InventoryService">
    <boundaryEvent id="compReserve" attachedToRef="reserveInventory" cancelActivity="false">
      <compensateEventDefinition activityRef="reserveInventory"/>
    </boundaryEvent>
  </serviceTask>
  
  <sequenceFlow id="compReserveFlow" sourceRef="compReserve" targetRef="releaseInventory"/>
  
  <serviceTask id="releaseInventory" name="Release Inventory" 
               activiti:class="com.example.InventoryReleaseService"/>
  
  <!-- Step 2: Process payment -->
  <serviceTask id="processPayment" name="Process Payment" 
               activiti:class="com.example.PaymentService">
    <boundaryEvent id="compPayment" attachedToRef="processPayment" cancelActivity="false">
      <compensateEventDefinition activityRef="processPayment"/>
    </boundaryEvent>
  </serviceTask>
  
  <sequenceFlow id="compPaymentFlow" sourceRef="compPayment" targetRef="refundPayment"/>
  
  <serviceTask id="refundPayment" name="Refund Payment" 
               activiti:class="com.example.RefundService"/>
  
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
  
  <!-- Compensation throw events -->
  <intermediateThrowEvent id="compensatePaymentEvent">
    <compensateEventDefinition activityRef="processPayment"/>
  </intermediateThrowEvent>
  
  <intermediateThrowEvent id="compensateReserveEvent">
    <compensateEventDefinition activityRef="reserveInventory"/>
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
  <sequenceFlow id="flow5" sourceRef="compensatePaymentEvent" targetRef="compensateReserveEvent"/>
  <sequenceFlow id="flow6" sourceRef="compensateReserveEvent" targetRef="failureEnd"/>
  <sequenceFlow id="flow7" sourceRef="confirmOrder" targetRef="successEnd"/>
  
</process>
```

**Compensation Flow:**
1. Shipment validation fails
2. Trigger compensation for `processPayment` → executes `refundPayment`
3. Trigger compensation for `reserveInventory` → executes `releaseInventory`
4. Process ends with failure

### Example 2: Multi-Step Approval with Compensation

```xml
<process id="approvalProcess" name="Approval with Compensation">
  
  <startEvent id="start"/>
  
  <!-- Step 1: Financial approval -->
  <userTask id="financialApproval" name="Financial Approval" 
            activiti:assignee="${financeManager}">
    <boundaryEvent id="compFinancial" attachedToRef="financialApproval" cancelActivity="false">
      <compensateEventDefinition activityRef="financialApproval"/>
    </boundaryEvent>
  </userTask>
  
  <sequenceFlow id="compFinancialFlow" sourceRef="compFinancial" targetRef="revokeFinancialApproval"/>
  
  <serviceTask id="revokeFinancialApproval" name="Revoke Financial Approval" 
               activiti:class="com.example.ApprovalRevoker"/>
  
  <!-- Step 2: Legal approval -->
  <userTask id="legalApproval" name="Legal Approval" 
            activiti:assignee="${legalTeam}">
    <boundaryEvent id="compLegal" attachedToRef="legalApproval" cancelActivity="false">
      <compensateEventDefinition activityRef="legalApproval"/>
    </boundaryEvent>
  </userTask>
  
  <sequenceFlow id="compLegalFlow" sourceRef="compLegal" targetRef="revokeLegalApproval"/>
  
  <serviceTask id="revokeLegalApproval" name="Revoke Legal Approval" 
               activiti:class="com.example.ApprovalRevoker"/>
  
  <!-- Step 3: Executive approval -->
  <userTask id="executiveApproval" name="Executive Approval" 
            activiti:assignee="${ceo}"/>
  
  <!-- Step 4: Final validation -->
  <exclusiveGateway id="finalCheck"/>
  
  <!-- All good -->
  <sequenceFlow id="approved" sourceRef="finalCheck" targetRef="executeContract">
    <conditionExpression>${allApproved}</conditionExpression>
  </sequenceFlow>
  
  <!-- Issue found - compensate all approvals -->
  <sequenceFlow id="rejected" sourceRef="finalCheck" targetRef="compExec">
    <conditionExpression>${!allApproved}</conditionExpression>
  </sequenceFlow>
  
  <!-- Compensation chain -->
  <intermediateThrowEvent id="compExec">
    <compensateEventDefinition activityRef="executiveApproval"/>
  </intermediateThrowEvent>
  
  <intermediateThrowEvent id="compLegalThrow">
    <compensateEventDefinition activityRef="legalApproval"/>
  </intermediateThrowEvent>
  
  <intermediateThrowEvent id="compFinancialThrow">
    <compensateEventDefinition activityRef="financialApproval"/>
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
  <sequenceFlow id="flow5" sourceRef="compExec" targetRef="compLegalThrow"/>
  <sequenceFlow id="flow6" sourceRef="compLegalThrow" targetRef="compFinancialThrow"/>
  <sequenceFlow id="flow7" sourceRef="compFinancialThrow" targetRef="failureEnd"/>
  <sequenceFlow id="flow8" sourceRef="executeContract" targetRef="successEnd"/>
  
</process>
```

### Example 3: Saga Pattern Implementation

```xml
<process id="sagaProcess" name="Saga Pattern - Distributed Transaction">
  
  <startEvent id="start"/>
  
  <!-- Step 1: Create order -->
  <serviceTask id="createOrder" name="Create Order" 
               activiti:class="com.example.OrderCreator">
    <boundaryEvent id="compOrder" attachedToRef="createOrder" cancelActivity="false">
      <compensateEventDefinition activityRef="createOrder"/>
    </boundaryEvent>
  </serviceTask>
  
  <sequenceFlow id="compOrderFlow" sourceRef="compOrder" targetRef="cancelOrder"/>
  <serviceTask id="cancelOrder" name="Cancel Order" 
               activiti:class="com.example.OrderCanceler"/>
  
  <!-- Step 2: Reserve inventory -->
  <serviceTask id="reserveInventory" name="Reserve Inventory" 
               activiti:class="com.example.InventoryReserver">
    <boundaryEvent id="compInventory" attachedToRef="reserveInventory" cancelActivity="false">
      <compensateEventDefinition activityRef="reserveInventory"/>
    </boundaryEvent>
  </serviceTask>
  
  <sequenceFlow id="compInventoryFlow" sourceRef="compInventory" targetRef="releaseInventory"/>
  <serviceTask id="releaseInventory" name="Release Inventory" 
               activiti:class="com.example.InventoryReleaser"/>
  
  <!-- Step 3: Process payment -->
  <serviceTask id="processPayment" name="Process Payment" 
               activiti:class="com.example.PaymentProcessor">
    <boundaryEvent id="compPayment" attachedToRef="processPayment" cancelActivity="false">
      <compensateEventDefinition activityRef="processPayment"/>
    </boundaryEvent>
  </serviceTask>
  
  <sequenceFlow id="compPaymentFlow" sourceRef="compPayment" targetRef="refundPayment"/>
  <serviceTask id="refundPayment" name="Refund Payment" 
               activiti:class="com.example.PaymentRefunder"/>
  
  <!-- Step 4: Arrange delivery -->
  <serviceTask id="arrangeDelivery" name="Arrange Delivery" 
               activiti:class="com.example.DeliveryArranger">
    <boundaryEvent id="compDelivery" attachedToRef="arrangeDelivery" cancelActivity="false">
      <compensateEventDefinition activityRef="arrangeDelivery"/>
    </boundaryEvent>
  </serviceTask>
  
  <sequenceFlow id="compDeliveryFlow" sourceRef="compDelivery" targetRef="cancelDelivery"/>
  <serviceTask id="cancelDelivery" name="Cancel Delivery" 
               activiti:class="com.example.DeliveryCanceler"/>
  
  <!-- Step 5: Final validation -->
  <exclusiveGateway id="finalValidation"/>
  
  <!-- Success -->
  <sequenceFlow id="success" sourceRef="finalValidation" targetRef="confirmSaga">
    <conditionExpression>${success}</conditionExpression>
  </sequenceFlow>
  
  <!-- Failure - use compensation end event -->
  <endEvent id="compensateAndEnd">
    <compensateEventDefinition activityRef="arrangeDelivery"/>
    <compensateEventDefinition activityRef="processPayment"/>
    <compensateEventDefinition activityRef="reserveInventory"/>
    <compensateEventDefinition activityRef="createOrder"/>
  </endEvent>
  
  <serviceTask id="confirmSaga" name="Confirm Saga Completion"/>
  <endEvent id="successEnd"/>
  
  <!-- Main flow -->
  <sequenceFlow id="flow1" sourceRef="start" targetRef="createOrder"/>
  <sequenceFlow id="flow2" sourceRef="createOrder" targetRef="reserveInventory"/>
  <sequenceFlow id="flow3" sourceRef="reserveInventory" targetRef="processPayment"/>
  <sequenceFlow id="flow4" sourceRef="processPayment" targetRef="arrangeDelivery"/>
  <sequenceFlow id="flow5" sourceRef="arrangeDelivery" targetRef="finalValidation"/>
  <sequenceFlow id="flow6" sourceRef="finalValidation" targetRef="compensateAndEnd">
    <conditionExpression>${!success}</conditionExpression>
  </sequenceFlow>
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
<serviceTask id="placeOrder" name="Place Order">
  <boundaryEvent id="compOrder" attachedToRef="placeOrder" cancelActivity="false">
    <compensateEventDefinition activityRef="placeOrder"/>
  </boundaryEvent>
</serviceTask>

<sequenceFlow id="compFlow" sourceRef="compOrder" targetRef="cancelOrder"/>
<serviceTask id="cancelOrder" name="Cancel Order"/>

<!-- BAD: No compensation handler -->
<serviceTask id="placeOrder" name="Place Order"/>
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
        String activityId = execution.getActivityId();
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
<!-- WRONG: Compensation event with no handler -->
<serviceTask id="placeOrder" name="Place Order">
  <boundaryEvent id="compOrder" attachedToRef="placeOrder" cancelActivity="false">
    <compensateEventDefinition activityRef="placeOrder"/>
  </boundaryEvent>
</serviceTask>

<!-- No sequence flow from compOrder! -->

<!-- CORRECT: Define handler -->
<serviceTask id="placeOrder" name="Place Order">
  <boundaryEvent id="compOrder" attachedToRef="placeOrder" cancelActivity="false">
    <compensateEventDefinition activityRef="placeOrder"/>
  </boundaryEvent>
</serviceTask>

<sequenceFlow id="compFlow" sourceRef="compOrder" targetRef="cancelOrder"/>
<serviceTask id="cancelOrder" name="Cancel Order"/>
```

**Error:** `ActivitiException: no compensation flow found for activity 'placeOrder'`

### 2. Trying to Compensate Incomplete Activities

**Problem:** Compensation only works on completed activities

```xml
<!-- WRONG: Can't compensate activity that didn't complete -->
<serviceTask id="step1" name="Step 1"/>
<serviceTask id="step2" name="Step 2"/>

<!-- If step2 fails, can't compensate step1 if it didn't complete -->
<intermediateThrowEvent id="comp">
  <compensateEventDefinition activityRef="step1"/>  <!-- Only if step1 completed -->
</intermediateThrowEvent>

<!-- CORRECT: Understand completion requirement -->
<!-- Compensation only triggers for activities that completed before failure -->
```

### 3. Using Interrupting Compensation

**Problem:** Compensation must be non-interrupting

```xml
<!-- WRONG: cancelActivity="true" not allowed -->
<serviceTask id="placeOrder" name="Place Order">
  <boundaryEvent id="compOrder" attachedToRef="placeOrder" cancelActivity="true">
    <compensateEventDefinition activityRef="placeOrder"/>
  </boundaryEvent>
</serviceTask>

<!-- CORRECT: Always cancelActivity="false" -->
<serviceTask id="placeOrder" name="Place Order">
  <boundaryEvent id="compOrder" attachedToRef="placeOrder" cancelActivity="false">
    <compensateEventDefinition activityRef="placeOrder"/>
  </boundaryEvent>
</serviceTask>
```

### 4. Circular Compensation

**Problem:** Compensation triggers compensation

```xml
<!-- WRONG: Circular compensation -->
<serviceTask id="activity1" name="Activity 1">
  <boundaryEvent id="comp1" attachedToRef="activity1" cancelActivity="false">
    <compensateEventDefinition activityRef="activity1"/>
  </boundaryEvent>
</serviceTask>

<sequenceFlow id="flow1" sourceRef="comp1" targetRef="activity2"/>

<serviceTask id="activity2" name="Activity 2">
  <boundaryEvent id="comp2" attachedToRef="activity2" cancelActivity="false">
    <compensateEventDefinition activityRef="activity2"/>
  </boundaryEvent>
</serviceTask>

<sequenceFlow id="flow2" sourceRef="comp2" targetRef="activity1"/>  <!-- Back to activity1! -->

<!-- CORRECT: Linear compensation flow -->
<sequenceFlow id="flow2" sourceRef="comp2" targetRef="endEvent"/>
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
- [End Events](./end-event.md) - Compensation end events
- [Error Handling](../advanced/error-handling.md) - Alternative rollback

---

**Source:** `BoundaryCompensateEventActivityBehavior.java`, `IntermediateThrowCompensationEventActivityBehavior.java`
