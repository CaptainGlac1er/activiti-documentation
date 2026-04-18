---
sidebar_label: Transaction
slug: /bpmn/subprocesses/transaction
title: "Transaction SubProcess"
description: "Complete guide to Transaction SubProcesses in Activiti - all-or-nothing atomic operations with compensation and rollback support."
---

# Transaction SubProcess

Transaction SubProcesses ensure **all-or-nothing execution** of a group of activities. If any activity fails, the entire transaction is rolled back, maintaining data consistency and integrity.

## Overview

```xml
<transaction id="transaction1" name="Financial Transaction">
  <startEvent id="start"/>
  <serviceTask id="debitAccount" name="Debit Account"/>
  <serviceTask id="creditAccount" name="Credit Account"/>
  <endEvent id="end"/>
</transaction>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Compensation handling, error propagation

## Key Features

### Standard BPMN Features
- **Atomic Execution** - All activities succeed or all fail
- **Rollback Support** - Automatic rollback on failure
- **Compensation** - Undo completed activities
- **Error Handling** - Transaction-specific error events

### Activiti Extensions
- **Custom Compensation Logic** - Define rollback behavior
- **Integration with DB Transactions** - Database-level atomicity
- **Error Event Definitions** - Custom transaction errors
- **Scope Management** - Variable isolation

## Configuration Options

### 1. Basic Transaction

Simple transaction with automatic rollback:

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
    
    <sequenceFlow id="noFunds" sourceRef="fundsCheck" targetRef="transEnd">
      <conditionExpression>${!hasSufficientFunds}</conditionExpression>
    </sequenceFlow>
    
    <serviceTask id="debitSource" name="Debit Source Account" activiti:class="com.example.AccountDebitService"/>
    
    <serviceTask id="creditDestination" name="Credit Destination Account" activiti:class="com.example.AccountCreditService"/>
    
    <serviceTask id="recordTransaction" name="Record Transaction" activiti:class="com.example.TransactionLogger"/>
    
    <endEvent id="transEnd"/>
    
    <sequenceFlow id="flow1" sourceRef="transStart" targetRef="validateFunds"/>
    <sequenceFlow id="flow2" sourceRef="validateFunds" targetRef="fundsCheck"/>
    <sequenceFlow id="flow3" sourceRef="debitSource" targetRef="creditDestination"/>
    <sequenceFlow id="flow4" sourceRef="creditDestination" targetRef="recordTransaction"/>
    <sequenceFlow id="flow5" sourceRef="recordTransaction" targetRef="transEnd"/>
  </transaction>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="mainFlow" sourceRef="start" targetRef="transferTransaction"/>
  <sequenceFlow id="mainFlow2" sourceRef="transferTransaction" targetRef="end"/>
</process>
```

**Behavior:**
- If any task fails, ALL changes are rolled back
- Debit, credit, and record are atomic
- Either all succeed or all are undone

### 2. Transaction with Compensation

Define compensation (undo) logic for completed activities:

```xml
<transaction id="orderTransaction" name="Order Processing Transaction">
  <startEvent id="transStart"/>
  
  <serviceTask id="reserveInventory" name="Reserve Inventory" 
               activiti:class="com.example.InventoryReservationService"
               activiti:cancelEndDefinition="true"/>
  
  <serviceTask id="processPayment" name="Process Payment"
               activiti:class="com.example.PaymentProcessingService"
               activiti:cancelEndDefinition="true"/>
  
  <serviceTask id="updateOrderStatus" name="Update Order Status" activiti:class="com.example.OrderStatusService"/>
  
  <!-- Compensation event subprocess -->
  <eventSubProcess id="compensationHandler" triggeredByCompensation="true">
    <startEvent id="compStart">
      <compensateEventDefinition activityRef="processPayment"/>
    </startEvent>
    
    <serviceTask id="refundPayment" name="Refund Payment" activiti:class="com.example.PaymentRefundService"/>
    
    <endEvent id="compEnd"/>
    
    <sequenceFlow id="compFlow1" sourceRef="compStart" targetRef="refundPayment"/>
    <sequenceFlow id="compFlow2" sourceRef="refundPayment" targetRef="compEnd"/>
  </eventSubProcess>
  
  <endEvent id="transEnd"/>
  
  <sequenceFlow id="flow1" sourceRef="transStart" targetRef="reserveInventory"/>
  <sequenceFlow id="flow2" sourceRef="reserveInventory" targetRef="processPayment"/>
  <sequenceFlow id="flow3" sourceRef="processPayment" targetRef="updateOrderStatus"/>
  <sequenceFlow id="flow4" sourceRef="updateOrderStatus" targetRef="transEnd"/>
</transaction>
```

**Compensation Behavior:**
- If `updateOrderStatus` fails, compensation is triggered
- `processPayment` is compensated (refund executed)
- `reserveInventory` is compensated (inventory released)
- Compensation happens in reverse order

### 3. Transaction with Error Handling

Handle transaction-specific errors:

```xml
<transaction id="paymentTransaction" name="Payment Transaction">
  <startEvent id="transStart"/>
  
  <serviceTask id="validatePayment" name="Validate Payment Details" activiti:class="com.example.PaymentValidator"/>
  
  <serviceTask id="processCharge" name="Process Credit Card Charge" activiti:class="com.example.ChargeProcessor"/>
  
  <!-- Error boundary event on transaction -->
  <boundaryEvent id="paymentError" cancelActivity="true">
    <errorEventDefinition errorRef="PaymentError"/>
  </boundaryEvent>
  
  <endEvent id="transEnd"/>
  
  <sequenceFlow id="flow1" sourceRef="transStart" targetRef="validatePayment"/>
  <sequenceFlow id="flow2" sourceRef="validatePayment" targetRef="processCharge"/>
  <sequenceFlow id="flow3" sourceRef="processCharge" targetRef="transEnd"/>
  <sequenceFlow id="errorFlow" sourceRef="paymentError" targetRef="handleError"/>
</transaction>

<!-- Error definition -->
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
- Inner transaction failure rolls back inner operations
- Outer transaction also rolls back if inner fails
- Both must succeed for complete transaction

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
    
    <sequenceFlow id="notAvailable" sourceRef="inventoryAvailable" targetRef="transEnd">
      <conditionExpression>${!inventoryStatus.available}</conditionExpression>
    </sequenceFlow>
    
    <serviceTask id="reserveInventory" name="Reserve Inventory Items" 
                 activiti:class="com.example.InventoryReservation"
                 activiti:cancelEndDefinition="true"
                 activiti:resultVariable="reservationId"/>
    
    <!-- Step 2: Process payment -->
    <serviceTask id="validatePayment" name="Validate Payment Information" activiti:class="com.example.PaymentValidator"/>
    
    <serviceTask id="processPayment" name="Process Payment" 
                 activiti:class="com.example.PaymentProcessor"
                 activiti:cancelEndDefinition="true"
                 activiti:resultVariable="paymentId"/>
    
    <!-- Step 3: Update order status -->
    <serviceTask id="updateOrderStatus" name="Update Order to Processing" activiti:class="com.example.OrderStatusUpdater"/>
    
    <!-- Step 4: Create shipping label -->
    <serviceTask id="createShippingLabel" name="Generate Shipping Label"
                 activiti:class="com.example.ShippingLabelGenerator"
                 activiti:cancelEndDefinition="true"
                 activiti:resultVariable="trackingNumber"/>
    
    <!-- Step 5: Send confirmation -->
    <serviceTask id="sendConfirmation" name="Send Order Confirmation" activiti:class="com.example.OrderConfirmationService"/>
    
    <!-- Compensation handler for rollback -->
    <eventSubProcess id="compensationHandler" triggeredByCompensation="true">
      <startEvent id="compStart">
        <compensateEventDefinition activityRef="createShippingLabel"/>
      </startEvent>
      
      <serviceTask id="cancelShipping" name="Cancel Shipping Label" activiti:class="com.example.ShippingCancellation"/>
      
      <endEvent id="compEnd"/>
      
      <sequenceFlow id="compFlow1" sourceRef="compStart" targetRef="cancelShipping"/>
      <sequenceFlow id="compFlow2" sourceRef="cancelShipping" targetRef="compEnd"/>
    </eventSubProcess>
    
    <endEvent id="transEnd"/>
    
    <sequenceFlow id="flow1" sourceRef="transStart" targetRef="checkInventory"/>
    <sequenceFlow id="flow2" sourceRef="checkInventory" targetRef="inventoryAvailable"/>
    <sequenceFlow id="flow3" sourceRef="reserveInventory" targetRef="validatePayment"/>
    <sequenceFlow id="flow4" sourceRef="validatePayment" targetRef="processPayment"/>
    <sequenceFlow id="flow5" sourceRef="processPayment" targetRef="updateOrderStatus"/>
    <sequenceFlow id="flow6" sourceRef="updateOrderStatus" targetRef="createShippingLabel"/>
    <sequenceFlow id="flow7" sourceRef="createShippingLabel" targetRef="sendConfirmation"/>
    <sequenceFlow id="flow8" sourceRef="sendConfirmation" targetRef="transEnd"/>
  </transaction>
  
  <userTask id="packOrder" name="Pack Order for Shipment" activiti:assignee="${warehouseStaff}"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="mainFlow1" sourceRef="start" targetRef="receiveOrder"/>
  <sequenceFlow id="mainFlow2" sourceRef="receiveOrder" targetRef="orderTransaction"/>
  <sequenceFlow id="mainFlow3" sourceRef="orderTransaction" targetRef="packOrder"/>
  <sequenceFlow id="mainFlow4" sourceRef="packOrder" targetRef="end"/>
</process>
```

**Transaction Guarantees:**
- Inventory reserved, payment processed, order updated, label created - ALL succeed
- ❌ If ANY step fails, ALL changes are rolled back:
  - Payment refunded
  - Inventory released
  - Shipping label cancelled
  - Order status reverted

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
// Transaction failures are automatic
// Compensation is triggered by the engine
// Custom error handling via boundary events
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
- Database consistency
- API integrations

## Related Documentation

- [Regular SubProcess](./regular-subprocess.md) - Embedded subprocesses
- [Event SubProcess](./event-subprocess.md) - Event-triggered subprocesses
- [Ad-hoc SubProcess](./adhoc-subprocess.md) - Flexible activity execution
- [Service Task](../elements/service-task.md) - Automated tasks
- [Error Events](../events/index.md) - Error handling

---

**Last Updated: 2026
