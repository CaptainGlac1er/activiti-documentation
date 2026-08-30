---
sidebar_label: Transaction
slug: /bpmn/subprocesses/transaction
title: "Transaction SubProcess"
description: "How the transaction element is parsed and executed in Activiti - a regular sub-process with cancel end event and compensation support."
---

# Transaction SubProcess

Transaction SubProcesses group activities that should be treated as a unit. The `<transaction>` element is **parsed and modeled** by the engine, but it executes with the engine's **regular sub-process behavior** — there is no BPMN *commit* step and no database-level atomicity. The transaction is *canceled* only when execution reaches a **cancel end event** (`<endEvent><cancelEventDefinition/></endEvent>`) paired with a cancel boundary event on the transaction; reaching it cancels the transaction scope and triggers the transaction's compensation handlers. A plain error thrown by an activity does **not** cancel the transaction — it propagates outward and, if unhandled, fails the process instance.

## Overview

```xml
<transaction id="transaction1" name="Financial Transaction">
  <startEvent id="start"/>
  <serviceTask id="debitAccount" name="Debit Account"/>
  <serviceTask id="creditAccount" name="Credit Account"/>
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="debitAccount"/>
  <sequenceFlow id="flow2" sourceRef="debitAccount" targetRef="creditAccount"/>
  <sequenceFlow id="flow3" sourceRef="creditAccount" targetRef="end"/>
</transaction>
```

**BPMN 2.0 Standard:** Parsed and modeled; executed as a regular sub-process  
**Activiti Extensions:** Compensation handling, error propagation

## Key Features

### Standard BPMN Features
- **Regular Sub-Process Execution** - No commit semantics; the transaction simply completes at its normal end event
- **Cancel End Event** - Cancels the transaction scope via the cancel end event
- **Rollback Support** - Cancellation triggers the transaction's compensation flow
- **Compensation** - Undo completed activities
- **Error Handling** - Transaction-specific error events

### Activiti Extensions
- **Custom Compensation Logic** - Define rollback behavior
- **Error Event Definitions** - Custom transaction errors
- **Scope Management** - Variable isolation

## Configuration Options

### 1. Basic Transaction

Simple transaction with a commit path and a cancel path:

```xml
<process id="bankTransfer" name="Bank Transfer Process">
  <startEvent id="start"/>
  
  <transaction id="transferTransaction" name="Money Transfer">
    <startEvent id="transStart"/>
    
    <serviceTask id="validateFunds" name="Validate Available Funds" activiti:class="com.example.FundsValidator"/>
    
    <exclusiveGateway id="fundsCheck"/>
    
    <sequenceFlow id="hasFunds" sourceRef="fundsCheck" targetRef="debitSource">
      <conditionExpression>${hasSufficientFunds}</conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="noFunds" sourceRef="fundsCheck" targetRef="cancelEnd">
      <conditionExpression>${!hasSufficientFunds}</conditionExpression>
    </sequenceFlow>
    
    <serviceTask id="debitSource" name="Debit Source Account" activiti:class="com.example.AccountDebitService"/>
    
    <serviceTask id="creditDestination" name="Credit Destination Account" activiti:class="com.example.AccountCreditService"/>
    
    <serviceTask id="recordTransaction" name="Record Transaction" activiti:class="com.example.TransactionLogger"/>
    
    <endEvent id="transEnd"/>
    
    <!-- Reaching this end event cancels (rolls back) the transaction -->
    <endEvent id="cancelEnd">
      <cancelEventDefinition/>
    </endEvent>
    
    <sequenceFlow id="flow1" sourceRef="transStart" targetRef="validateFunds"/>
    <sequenceFlow id="flow2" sourceRef="validateFunds" targetRef="fundsCheck"/>
    <sequenceFlow id="flow3" sourceRef="debitSource" targetRef="creditDestination"/>
    <sequenceFlow id="flow4" sourceRef="creditDestination" targetRef="recordTransaction"/>
    <sequenceFlow id="flow5" sourceRef="recordTransaction" targetRef="transEnd"/>
  </transaction>
  
  <!-- Cancel boundary event (sibling of the transaction, attachedToRef) - required for the cancel end event -->
  <boundaryEvent id="cancelBoundary" attachedToRef="transferTransaction">
    <cancelEventDefinition/>
  </boundaryEvent>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="mainFlow" sourceRef="start" targetRef="transferTransaction"/>
  <sequenceFlow id="mainFlow2" sourceRef="transferTransaction" targetRef="end"/>
  <sequenceFlow id="cancelFlow" sourceRef="cancelBoundary" targetRef="end"/>
</process>
```

**Behavior:**
- The transaction **completes** when execution reaches the normal end event (`transEnd`) — there is no special commit step
- The transaction is **canceled** only when execution reaches the cancel end event (`cancelEnd` with `<cancelEventDefinition/>`)
- A plain error from a service task does NOT cancel the transaction — it propagates outward and fails the process instance if unhandled
- Activiti does NOT automatically roll back side effects from service tasks (e.g., external API calls, database writes outside the engine)
- You must define compensation logic to undo completed activities
- Use transactions to coordinate compensating activities, not as automatic DB-style rollbacks

### 2. Transaction with Compensation

Define compensation (undo) logic for completed activities:

```xml
<process id="orderProcess" name="Order Processing">
  <startEvent id="start"/>
  
  <transaction id="orderTransaction" name="Order Processing Transaction">
    <startEvent id="transStart"/>
    
    <serviceTask id="reserveInventory" name="Reserve Inventory" 
                 activiti:class="com.example.InventoryReservationService"/>
    
    <serviceTask id="processPayment" name="Process Payment"
                 activiti:class="com.example.PaymentProcessingService"/>
    
    <serviceTask id="updateOrderStatus" name="Update Order Status" activiti:class="com.example.OrderStatusService"/>
    
    <endEvent id="transEnd"/>
    
    <!-- Reaching this end event cancels the transaction -->
    <endEvent id="cancelEnd">
      <cancelEventDefinition/>
    </endEvent>
    
    <sequenceFlow id="flow1" sourceRef="transStart" targetRef="reserveInventory"/>
    <sequenceFlow id="flow2" sourceRef="reserveInventory" targetRef="processPayment"/>
    <sequenceFlow id="flow3" sourceRef="processPayment" targetRef="updateOrderStatus"/>
    <sequenceFlow id="flow4" sourceRef="updateOrderStatus" targetRef="transEnd"/>
  </transaction>
  
  <!-- Cancel boundary event (sibling, attachedToRef) - required for the cancel end event -->
  <boundaryEvent id="cancelBoundary" attachedToRef="orderTransaction">
    <cancelEventDefinition/>
  </boundaryEvent>
  
  <!-- Compensation boundary event ON the transaction (sibling, attachedToRef) -->
  <boundaryEvent id="transactionCompensation" attachedToRef="orderTransaction">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <!-- Associations to the compensation handlers -->
  <association id="refundAssociation" sourceRef="transactionCompensation" targetRef="refundPayment"/>
  <association id="releaseAssociation" sourceRef="transactionCompensation" targetRef="releaseInventory"/>
  
  <!-- Compensation handlers - isForCompensation="true" is required on each -->
  <serviceTask id="refundPayment" name="Refund Payment" 
               activiti:class="com.example.PaymentRefundService"
               isForCompensation="true"/>
  
  <serviceTask id="releaseInventory" name="Release Inventory" 
               activiti:class="com.example.InventoryReleaseService"
               isForCompensation="true"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="mainFlow1" sourceRef="start" targetRef="orderTransaction"/>
  <sequenceFlow id="mainFlow2" sourceRef="orderTransaction" targetRef="end"/>
  <sequenceFlow id="cancelFlow" sourceRef="cancelBoundary" targetRef="end"/>
</process>
```

**Compensation Behavior:**
- A compensation-start **event subprocess is NOT supported** (the `EventSubprocessValidator` only allows error/message/signal starts); the compensation boundary event on the transaction is the canonical trigger
- When the transaction is canceled (its cancel end event is reached), the engine triggers the compensation boundary event and runs the associated handlers
- Each compensation handler must declare `isForCompensation="true"` — the engine fails with `Compensation activity could not be found (or it is missing 'isForCompensation="true"')` otherwise
- Handlers are invoked in reverse order of the compensated activities
- `processPayment` is compensated (refund executed), then `reserveInventory` (inventory released)

### 3. Transaction with Error Handling

Handle transaction-specific errors:

```xml
<process id="paymentProcess" name="Payment Process">
  <startEvent id="start"/>
  
  <transaction id="paymentTransaction" name="Payment Transaction">
    <startEvent id="transStart"/>
    
    <serviceTask id="validatePayment" name="Validate Payment Details" activiti:class="com.example.PaymentValidator"/>
    
    <serviceTask id="processCharge" name="Process Credit Card Charge" activiti:class="com.example.ChargeProcessor"/>
    
    <endEvent id="transEnd"/>
    
    <sequenceFlow id="flow1" sourceRef="transStart" targetRef="validatePayment"/>
    <sequenceFlow id="flow2" sourceRef="validatePayment" targetRef="processCharge"/>
    <sequenceFlow id="flow3" sourceRef="processCharge" targetRef="transEnd"/>
  </transaction>
  
  <!-- Error boundary event on the transaction (sibling, attachedToRef) - error boundary events are always interrupting -->
  <boundaryEvent id="paymentError" attachedToRef="paymentTransaction">
    <errorEventDefinition errorRef="PaymentError"/>
  </boundaryEvent>
  
  <userTask id="handleError" name="Handle Payment Error"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="mainFlow" sourceRef="start" targetRef="paymentTransaction"/>
  <sequenceFlow id="mainFlow2" sourceRef="paymentTransaction" targetRef="end"/>
  <sequenceFlow id="errorFlow" sourceRef="paymentError" targetRef="handleError"/>
  <sequenceFlow id="errorFlow2" sourceRef="handleError" targetRef="end"/>
</process>

<!-- Error definition (declare in the definitions fragment) -->
<error id="PaymentError" name="Payment Error" errorCode="PAY001"/>
```

### 4. Nested Transactions

Transactions within transactions:

```xml
<transaction id="outerTransaction" name="Outer Transaction">
  <startEvent id="outerStart"/>
  
  <serviceTask id="setupResources" name="Setup Resources" activiti:class="com.example.ResourceSetup"/>
  
  <transaction id="innerTransaction" name="Inner Transaction">
    <startEvent id="innerStart"/>
    
    <serviceTask id="criticalOperation1" name="Critical Operation 1" activiti:class="com.example.CriticalOp1"/>
    
    <serviceTask id="criticalOperation2" name="Critical Operation 2" activiti:class="com.example.CriticalOp2"/>
    
    <endEvent id="innerEnd"/>
    
    <sequenceFlow id="innerFlow1" sourceRef="innerStart" targetRef="criticalOperation1"/>
    <sequenceFlow id="innerFlow2" sourceRef="criticalOperation1" targetRef="criticalOperation2"/>
    <sequenceFlow id="innerFlow3" sourceRef="criticalOperation2" targetRef="innerEnd"/>
  </transaction>
  
  <serviceTask id="cleanupResources" name="Cleanup Resources" activiti:class="com.example.ResourceCleanup"/>
  
  <endEvent id="outerEnd"/>
  
  <sequenceFlow id="outerFlow1" sourceRef="outerStart" targetRef="setupResources"/>
  <sequenceFlow id="outerFlow2" sourceRef="setupResources" targetRef="innerTransaction"/>
  <sequenceFlow id="outerFlow3" sourceRef="innerTransaction" targetRef="cleanupResources"/>
  <sequenceFlow id="outerFlow4" sourceRef="cleanupResources" targetRef="outerEnd"/>
</transaction>
```

**Behavior:**
- Each transaction completes when it reaches its normal end event (no commit semantics), and is canceled only when it reaches its own cancel end event
- If the inner transaction is canceled, route the flow so the outer transaction can also be canceled via its own cancel end event
- Both must complete for the full transaction to finish successfully

## Complete Real-World Example

### Scenario: E-Commerce Order Processing with Inventory and Payment

```xml
<process id="orderProcess" name="Order Processing">
  
  <startEvent id="start"/>
  
  <userTask id="receiveOrder" name="Receive Customer Order" activiti:assignee="${orderClerk}"/>
  
  <transaction id="orderTransaction" name="Process Order Transaction">
    <startEvent id="transStart"/>
    
    <!-- Step 1: Check and reserve inventory -->
    <serviceTask id="checkInventory" name="Check Inventory Availability" 
                 activiti:class="com.example.InventoryChecker"
                 activiti:resultVariable="inventoryStatus"/>
    
    <exclusiveGateway id="inventoryAvailable"/>
    
    <sequenceFlow id="available" sourceRef="inventoryAvailable" targetRef="reserveInventory">
      <conditionExpression>${inventoryStatus.available}</conditionExpression>
    </sequenceFlow>
    
    <!-- No inventory: cancel the transaction (nothing is reserved yet, so no compensation is needed) -->
    <sequenceFlow id="notAvailable" sourceRef="inventoryAvailable" targetRef="cancelEnd">
      <conditionExpression>${!inventoryStatus.available}</conditionExpression>
    </sequenceFlow>
    
    <serviceTask id="reserveInventory" name="Reserve Inventory Items" 
                  activiti:class="com.example.InventoryReservation"
                  activiti:resultVariable="reservationId"/>
    
    <!-- Step 2: Process payment -->
    <serviceTask id="validatePayment" name="Validate Payment Information" activiti:class="com.example.PaymentValidator"/>
    
    <serviceTask id="processPayment" name="Process Payment" 
                  activiti:class="com.example.PaymentProcessor"
                  activiti:resultVariable="paymentId"/>
    
    <!-- Step 3: Update order status -->
    <serviceTask id="updateOrderStatus" name="Update Order to Processing" activiti:class="com.example.OrderStatusUpdater"/>
    
    <!-- Step 4: Create shipping label -->
    <serviceTask id="createShippingLabel" name="Generate Shipping Label"
                  activiti:class="com.example.ShippingLabelGenerator"
                  activiti:resultVariable="trackingNumber"/>
    
    <!-- Step 5: Send confirmation -->
    <serviceTask id="sendConfirmation" name="Send Order Confirmation" activiti:class="com.example.OrderConfirmationService"/>
    
    <endEvent id="transEnd"/>
    
    <!-- Reaching this end event cancels the transaction and triggers compensation -->
    <endEvent id="cancelEnd">
      <cancelEventDefinition/>
    </endEvent>
    
    <sequenceFlow id="flow1" sourceRef="transStart" targetRef="checkInventory"/>
    <sequenceFlow id="flow2" sourceRef="checkInventory" targetRef="inventoryAvailable"/>
    <sequenceFlow id="flow3" sourceRef="reserveInventory" targetRef="validatePayment"/>
    <sequenceFlow id="flow4" sourceRef="validatePayment" targetRef="processPayment"/>
    <sequenceFlow id="flow5" sourceRef="processPayment" targetRef="updateOrderStatus"/>
    <sequenceFlow id="flow6" sourceRef="updateOrderStatus" targetRef="createShippingLabel"/>
    <sequenceFlow id="flow7" sourceRef="createShippingLabel" targetRef="sendConfirmation"/>
    <sequenceFlow id="flow8" sourceRef="sendConfirmation" targetRef="transEnd"/>
  </transaction>
  
  <!-- Cancel boundary event (sibling, attachedToRef) - required for the cancel end event -->
  <boundaryEvent id="cancelBoundary" attachedToRef="orderTransaction">
    <cancelEventDefinition/>
  </boundaryEvent>
  
  <!-- Compensation boundary event ON the transaction (sibling, attachedToRef) -->
  <boundaryEvent id="transactionCompensation" attachedToRef="orderTransaction">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <!-- Association to the compensation handler -->
  <association id="shippingAssociation" sourceRef="transactionCompensation" targetRef="cancelShipping"/>
  
  <!-- Compensation handler - isForCompensation="true" is required -->
  <serviceTask id="cancelShipping" name="Cancel Shipping Label" 
               activiti:class="com.example.ShippingCancellation"
               isForCompensation="true"/>
  
  <userTask id="packOrder" name="Pack Order for Shipment" activiti:assignee="${warehouseStaff}"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="mainFlow1" sourceRef="start" targetRef="receiveOrder"/>
  <sequenceFlow id="mainFlow2" sourceRef="receiveOrder" targetRef="orderTransaction"/>
  <sequenceFlow id="mainFlow3" sourceRef="orderTransaction" targetRef="packOrder"/>
  <sequenceFlow id="mainFlow4" sourceRef="packOrder" targetRef="end"/>
  <sequenceFlow id="cancelFlow" sourceRef="cancelBoundary" targetRef="packOrder"/>
</process>
```

**Transaction Guarantees:**
- The transaction completes only when execution reaches `transEnd` (no commit semantics); it is canceled only when execution reaches the cancel end event (`cancelEnd`) — a plain error from a step does not cancel it
- On cancellation, the engine triggers the compensation boundary event and runs the associated `isForCompensation="true"` handlers
- Activiti does NOT automatically undo side effects from service tasks (payments, inventory changes, etc.)
- You must explicitly define compensation handlers to reverse completed activities
- The transaction subprocess provides structured compensation flow, not automatic rollback

## Runtime API

### Starting Transactions

```java
// Start process with transaction
ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("orderProcess");

// Transaction automatically begins when reached
```

### Transaction Status

```java
// Check if execution is in a transaction
boolean inTransaction = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .activityId("orderTransaction")
    .count() > 0;
```

### Handling Transaction Failures

```java
// Cancellation happens when the transaction reaches its cancel end event
// The engine then triggers the compensation boundary event and its handlers
// Custom error handling via boundary events (e.g., catch an error and route to the cancel end event)
```

## Best Practices

1. **Keep Transactions Short** - Minimize lock duration
2. **Define Compensation** - Clear rollback logic for each activity
3. **Test Failure Scenarios** - Verify rollback works correctly
4. **Use for Critical Operations** - Financial, inventory, order processing
5. **Document Transaction Boundaries** - Clear start and end points
6. **Handle Errors Gracefully** - Use boundary events for errors
7. **Avoid User Tasks** - Transactions should be automated

## Common Pitfalls

- **Long-Running Transactions** - Holding locks too long
- **Missing Compensation** - Not defining rollback logic
- **User Tasks in Transactions** - Blocking transaction completion
- **Nested Transaction Complexity** - Hard to debug
- **Ignoring Errors** - Not handling transaction failures
- **Overusing Transactions** - Not needed for every process
- **Testing Gaps** - Only testing success paths

## Use Cases

### 1. **Financial Operations**
- Bank transfers
- Payment processing
- Account updates

### 2. **Inventory Management**
- Stock reservations
- Order fulfillment
- Warehouse operations

### 3. **Order Processing**
- E-commerce orders
- Purchase orders
- Sales transactions

### 4. **Data Synchronization**
- Multi-system updates
- Coordinated compensating updates when a step fails
- API integrations

## Related Documentation

- [Regular SubProcess](./regular-subprocess.md) - Embedded subprocesses
- [Event SubProcess](./event-subprocess.md) - Event-triggered subprocesses
- [Ad-hoc SubProcess](./adhoc-subprocess.md) - Flexible activity execution
- [Service Task](../elements/service-task.md) - Automated tasks
- [Error Events](../events/index.md) - Error handling

---

