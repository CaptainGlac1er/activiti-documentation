---
sidebar_label: Event SubProcess
slug: /bpmn/subprocesses/event-subprocess
title: "Event SubProcess"
description: "Complete guide to Event SubProcesses in Activiti - interrupting and non-interrupting event handling for exceptions and compensation."
---

# Event SubProcess

Event SubProcesses are **specialized subprocesses** that are triggered by events occurring within their scope. They're primarily used for **exception handling**, **compensation**, and **asynchronous event processing**.

## Overview

```xml
<eventSubProcess id="errorHandler">
  <startEvent id="errorStart">
    <errorEventDefinition errorRef="Error001"/>
  </startEvent>
  <userTask id="handleError" name="Handle Error"/>
  <endEvent id="errorEnd"/>
  <sequenceFlow id="flow1" sourceRef="errorStart" targetRef="handleError"/>
  <sequenceFlow id="flow2" sourceRef="handleError" targetRef="errorEnd"/>
</eventSubProcess>
```

**BPMN 2.0 Standard:** Fully Supported

**Important:** The `EventSubProcess` class in Activiti extends `SubProcess` with no additional fields. The trigger type (error, message, timer, signal, compensation) is determined entirely by the start event definition **inside** the event subprocess, not by attributes on the `<eventSubProcess>` element itself. Similarly, interrupting vs non-interrupting behavior is controlled by the `isInterrupting` attribute on the **inner `<startEvent>`**, not on the event subprocess.

## Key Features

### Types of Event SubProcesses

| Type | Trigger (on start event) | Behavior | Use Case |
|------|--------------------------|----------|----------|
| **Interrupting** | Any event with `isInterrupting="true"` (default) on start event | Cancels parent activities | Exception handling |
| **Non-Interrupting** | Any event with `isInterrupting="false"` on start event | Runs parallel to parent | Logging, notifications |
| **Error** | `<errorEventDefinition errorRef="..."/>` | Catches errors | Error recovery |
| **Message** | `<messageEventDefinition messageRef=""/>` | Waits for message | External triggers |
| **Timer** | `<timerEventDefinition>` | Time-based trigger | Timeouts, delays |
| **Signal** | `<signalEventDefinition signalRef=""/>` | Global broadcast | Cross-process communication |
| **Compensation** | `<compensateEventDefinition activityRef=""/>` | Undo operations | Transaction rollback |

## Configuration Options

### 1. Interrupting Event SubProcess

Cancels parent activities when triggered. By default, start events in event subprocesses are interrupting. Set `isInterrupting="true"` explicitly for clarity:

```xml
<subProcess id="mainProcess" name="Main Process">
  <startEvent id="start"/>
  <userTask id="task1" name="Long Running Task"/>
  <endEvent id="end"/>

  <!-- Interrupting event subprocess (default behavior) -->
  <eventSubProcess id="timeoutHandler">
    <startEvent id="timerStart" isInterrupting="true">
      <timerEventDefinition>
        <timeDuration>PT5M</timeDuration>
      </timerEventDefinition>
    </startEvent>
    <userTask id="handleTimeout" name="Handle Timeout"/>
    <endEvent id="timeoutEnd"/>

    <sequenceFlow id="timeoutFlow1" sourceRef="timerStart" targetRef="handleTimeout"/>
    <sequenceFlow id="timeoutFlow2" sourceRef="handleTimeout" targetRef="timeoutEnd"/>
  </eventSubProcess>

  <sequenceFlow id="flow1" sourceRef="start" targetRef="task1"/>
  <sequenceFlow id="flow2" sourceRef="task1" targetRef="end"/>
</subProcess>
```

**Behavior:**
- Timer starts when subprocess begins
- After 5 minutes, event subprocess triggers
- **Cancels** the "Long Running Task"
- Executes timeout handling logic

### 2. Non-Interrupting Event SubProcess

Runs parallel without canceling parent:

```xml
<subProcess id="trackedProcess" name="Tracked Process">
  <startEvent id="start"/>
  <serviceTask id="task1" name="Process Data"/>
  <endEvent id="end"/>

  <!-- Non-interrupting message event subprocess -->
  <eventSubProcess id="cancelHandler">
    <startEvent id="messageStart" isInterrupting="false">
      <messageEventDefinition messageRef="cancelMessage"/>
    </startEvent>
    <serviceTask id="logCancel" name="Log Cancellation Request"/>
    <endEvent id="cancelEnd"/>

    <sequenceFlow id="cancelFlow1" sourceRef="messageStart" targetRef="logCancel"/>
    <sequenceFlow id="cancelFlow2" sourceRef="logCancel" targetRef="cancelEnd"/>
  </eventSubProcess>

  <sequenceFlow id="flow1" sourceRef="start" targetRef="task1"/>
  <sequenceFlow id="flow2" sourceRef="task1" targetRef="end"/>
</subProcess>
```

**Behavior:**
- Main process continues normally
- When "cancelMessage" arrives, event subprocess triggers
- **Does NOT cancel** the main task
- Logs the cancellation request in parallel

### 3. Error Event SubProcess

Catches and handles errors:

```xml
<process id="errorHandlingProcess" name="Error Handling Process">
  <startEvent id="start"/>

  <subProcess id="riskyOperation" name="Risky Operation">
    <startEvent id="subStart"/>
    <serviceTask id="riskyTask" name="Risky Service Call" activiti:class="com.example.RiskyService"/>
    <endEvent id="subEnd"/>

    <!-- Error event subprocess -->
    <eventSubProcess id="errorHandler">
      <startEvent id="errorStart">
        <errorEventDefinition errorRef="ApplicationError"/>
      </startEvent>
      <userTask id="handleError" name="Handle Application Error"/>
      <endEvent id="errorEnd"/>

      <sequenceFlow id="errorFlow1" sourceRef="errorStart" targetRef="handleError"/>
      <sequenceFlow id="errorFlow2" sourceRef="handleError" targetRef="errorEnd"/>
    </eventSubProcess>

    <sequenceFlow id="subFlow1" sourceRef="subStart" targetRef="riskyTask"/>
    <sequenceFlow id="subFlow2" sourceRef="riskyTask" targetRef="subEnd"/>
  </subProcess>

  <endEvent id="end"/>

  <sequenceFlow id="mainFlow1" sourceRef="start" targetRef="riskyOperation"/>
  <sequenceFlow id="mainFlow2" sourceRef="riskyOperation" targetRef="end"/>
</process>
```

**Error Definition:**
```xml
<definitions>
  <error id="ApplicationError" name="Application Error" errorCode="APP001"/>

  <!-- Process definition here -->
</definitions>
```

### 4. Message Event SubProcess

Waits for external messages:

```xml
<subProcess id="orderProcess" name="Order Processing">
  <startEvent id="start"/>
  <userTask id="prepareOrder" name="Prepare Order"/>
  <endEvent id="end"/>

  <!-- Message event subprocess for cancellation -->
  <eventSubProcess id="cancelOrder">
    <startEvent id="cancelStart">
      <messageEventDefinition messageRef="cancelOrderMessage"/>
    </startEvent>
    <serviceTask id="refundOrder" name="Process Refund" activiti:class="com.example.RefundService"/>
    <endEvent id="cancelEnd"/>

    <sequenceFlow id="cancelFlow1" sourceRef="cancelStart" targetRef="refundOrder"/>
    <sequenceFlow id="cancelFlow2" sourceRef="refundOrder" targetRef="cancelEnd"/>
  </eventSubProcess>

  <sequenceFlow id="flow1" sourceRef="start" targetRef="prepareOrder"/>
  <sequenceFlow id="flow2" sourceRef="prepareOrder" targetRef="end"/>
</subProcess>
```

**Message Definition:**
```xml
<message id="cancelOrderMessage" name="Cancel Order Message"/>
```

### 5. Signal Event SubProcess

Responds to global signals:

```xml
<subProcess id="monitoredProcess" name="Monitored Process">
  <startEvent id="start"/>
  <serviceTask id="task1" name="Process Data"/>
  <endEvent id="end"/>

  <!-- Signal event subprocess -->
  <eventSubProcess id="emergencyStop">
    <startEvent id="signalStart">
      <signalEventDefinition signalRef="EmergencyStop"/>
    </startEvent>
    <serviceTask id="cleanup" name="Emergency Cleanup" activiti:class="com.example.CleanupService"/>
    <endEvent id="signalEnd"/>

    <sequenceFlow id="signalFlow1" sourceRef="signalStart" targetRef="cleanup"/>
    <sequenceFlow id="signalFlow2" sourceRef="cleanup" targetRef="signalEnd"/>
  </eventSubProcess>

  <sequenceFlow id="flow1" sourceRef="start" targetRef="task1"/>
  <sequenceFlow id="flow2" sourceRef="task1" targetRef="end"/>
</subProcess>
```

**Signal Definition:**
```xml
<signal id="EmergencyStop" name="Emergency Stop"/>
```

### 6. Compensation Event SubProcess

Handles compensation (undo) operations:

```xml
<process id="compensationProcess" name="Process with Compensation">
  <startEvent id="start"/>

  <subProcess id="transactionalProcess" name="Transactional Process">
    <startEvent id="subStart"/>

    <serviceTask id="bookFlight" name="Book Flight" activiti:class="com.example.FlightBookingService"/>

    <serviceTask id="bookHotel" name="Book Hotel" activiti:class="com.example.HotelBookingService"/>

    <endEvent id="subEnd"/>

    <!-- Compensation event subprocess -->
    <eventSubProcess id="compensationHandler">
      <startEvent id="compStart">
        <compensateEventDefinition activityRef="bookHotel"/>
      </startEvent>
      <serviceTask id="cancelHotel" name="Cancel Hotel Booking" activiti:class="com.example.HotelCancellationService"/>
      <endEvent id="compEnd"/>

      <sequenceFlow id="compFlow1" sourceRef="compStart" targetRef="cancelHotel"/>
      <sequenceFlow id="compFlow2" sourceRef="cancelHotel" targetRef="compEnd"/>
    </eventSubProcess>

    <sequenceFlow id="subFlow1" sourceRef="subStart" targetRef="bookFlight"/>
    <sequenceFlow id="subFlow2" sourceRef="bookFlight" targetRef="bookHotel"/>
    <sequenceFlow id="subFlow3" sourceRef="bookHotel" targetRef="subEnd"/>
  </subProcess>

  <endEvent id="end"/>

  <sequenceFlow id="mainFlow1" sourceRef="start" targetRef="transactionalProcess"/>
  <sequenceFlow id="mainFlow2" sourceRef="transactionalProcess" targetRef="end"/>
</process>
```

## Complete Real-World Example

### Scenario: E-Commerce Order Processing with Event Handling

```xml
<process id="orderProcess" name="E-Commerce Order Process">

  <!-- Message definitions -->
  <message id="cancelOrder" name="Cancel Order"/>
  <message id="expediteOrder" name="Expedite Order"/>

  <!-- Signal definition for system-wide emergency -->
  <signal id="systemEmergency" name="System Emergency"/>

  <!-- Error definition -->
  <error id="paymentError" name="Payment Error" errorCode="PAY001"/>

  <startEvent id="start"/>

  <subProcess id="orderFulfillment" name="Order Fulfillment">
    <startEvent id="fulfillStart"/>

    <serviceTask id="checkInventory" name="Check Inventory" activiti:class="com.example.InventoryService"/>

    <exclusiveGateway id="inventoryCheck"/>

    <sequenceFlow id="noStock" sourceRef="inventoryCheck" targetRef="notifyBackorder">
      <conditionExpression>${!inStock}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="inStock" sourceRef="inventoryCheck" targetRef="processPayment">
      <conditionExpression>${inStock}</conditionExpression>
    </sequenceFlow>

    <userTask id="notifyBackorder" name="Notify Backorder"/>
    <serviceTask id="processPayment" name="Process Payment" activiti:class="com.example.PaymentService"/>

    <userTask id="shipOrder" name="Ship Order"/>

    <endEvent id="fulfillEnd"/>

    <!-- Timer event subprocess for order timeout -->
    <eventSubProcess id="orderTimeout">
      <startEvent id="timeoutStart">
        <timerEventDefinition>
          <timeDuration>PT24H</timeDuration>
        </timerEventDefinition>
      </startEvent>
      <serviceTask id="cancelTimeout" name="Cancel Timed Out Order" activiti:class="com.example.OrderCancellationService"/>
      <endEvent id="timeoutEnd"/>

      <sequenceFlow id="timeoutFlow1" sourceRef="timeoutStart" targetRef="cancelTimeout"/>
      <sequenceFlow id="timeoutFlow2" sourceRef="cancelTimeout" targetRef="timeoutEnd"/>
    </eventSubProcess>

    <!-- Message event subprocess for order cancellation -->
    <eventSubProcess id="orderCancellation">
      <startEvent id="cancelStart">
        <messageEventDefinition messageRef="cancelOrder"/>
      </startEvent>
      <serviceTask id="processRefund" name="Process Refund" activiti:class="com.example.RefundService"/>
      <endEvent id="cancelEnd"/>

      <sequenceFlow id="cancelFlow1" sourceRef="cancelStart" targetRef="processRefund"/>
      <sequenceFlow id="cancelFlow2" sourceRef="processRefund" targetRef="cancelEnd"/>
    </eventSubProcess>

    <!-- Non-interrupting message event subprocess for expediting -->
    <eventSubProcess id="orderExpedite">
      <startEvent id="expediteStart" isInterrupting="false">
        <messageEventDefinition messageRef="expediteOrder"/>
      </startEvent>
      <serviceTask id="updatePriority" name="Update Order Priority" activiti:class="com.example.PriorityUpdateService"/>
      <endEvent id="expediteEnd"/>

      <sequenceFlow id="expediteFlow1" sourceRef="expediteStart" targetRef="updatePriority"/>
      <sequenceFlow id="expediteFlow2" sourceRef="updatePriority" targetRef="expediteEnd"/>
    </eventSubProcess>

    <!-- Signal event subprocess for emergency stop -->
    <eventSubProcess id="emergencyStop">
      <startEvent id="emergencyStart">
        <signalEventDefinition signalRef="systemEmergency"/>
      </startEvent>
      <serviceTask id="emergencyCleanup" name="Emergency Cleanup" activiti:class="com.example.EmergencyCleanupService"/>
      <endEvent id="emergencyEnd"/>

      <sequenceFlow id="emergencyFlow1" sourceRef="emergencyStart" targetRef="emergencyCleanup"/>
      <sequenceFlow id="emergencyFlow2" sourceRef="emergencyCleanup" targetRef="emergencyEnd"/>
    </eventSubProcess>

    <sequenceFlow id="flow1" sourceRef="fulfillStart" targetRef="checkInventory"/>
    <sequenceFlow id="flow2" sourceRef="checkInventory" targetRef="inventoryCheck"/>
    <sequenceFlow id="flow3" sourceRef="notifyBackorder" targetRef="fulfillEnd"/>
    <sequenceFlow id="flow4" sourceRef="processPayment" targetRef="shipOrder"/>
    <sequenceFlow id="flow5" sourceRef="shipOrder" targetRef="fulfillEnd"/>
  </subProcess>

  <endEvent id="end"/>

  <sequenceFlow id="mainFlow1" sourceRef="start" targetRef="orderFulfillment"/>
  <sequenceFlow id="mainFlow2" sourceRef="orderFulfillment" targetRef="end"/>
</process>
```

## Runtime API

### Sending Messages to Event SubProcess

```java
// Send message to trigger event subprocess (correlate with a specific execution)
runtimeService.messageEventReceived("cancelOrder", executionId);

// Or with variables
runtimeService.messageEventReceived("cancelOrder", executionId, variables);

// Start a new process instance by message
runtimeService.startProcessInstanceByMessage("cancelOrder");
```

### Sending Signals

```java
// Send global signal
runtimeService.signalEventReceived("systemEmergency");

// Send signal with variables
runtimeService.signalEventReceived("systemEmergency", Map.of("reason", "Maintenance"));
```

### Triggering Timer Events

```java
// Timer events are automatic based on duration
// But you can also use date-based timers
Map<String, Object> vars = Map.of(
    "timeoutDate", ZonedDateTime.now().plusHours(2)
);
runtimeService.startProcessInstanceByKey("orderProcess", vars);
```

## Best Practices

1. **Use Interrupting for Critical Events** - Errors, cancellations, timeouts
2. **Use Non-Interrupting for Logging** - Audit trails, notifications
3. **Keep Event SubProcesses Simple** - Single responsibility
4. **Document Event Triggers** - Clear message/signal/error definitions
5. **Test Event Scenarios** - Verify event subprocesses trigger correctly
6. **Avoid Nested Event SubProcesses** - Can become complex and hard to debug
7. **Use Meaningful Names** - Clear event subprocess and event names

## Common Pitfalls

- **Event Not Triggering** - Check message/signal/error definitions match
- **Wrong Interrupting Setting** - Verify `isInterrupting` attribute is on the **start event**, not the event subprocess
- **Scope Confusion** - Event subprocess only works within its parent scope
- **Timer Precision** - Timers may not fire exactly on time
- **Signal Broadcasting** - Signals trigger ALL matching event subprocesses
- **Error Handling** - Ensure errors are properly defined and referenced

## Related Documentation

- [Regular SubProcess](./regular-subprocess.md) - Embedded subprocesses
- [Ad-hoc SubProcess](./adhoc-subprocess.md) - Flexible activity execution
- [Transaction](./transaction.md) - Atomic subprocesses
- [Boundary Events](../events/boundary-event.md) - Activity-level event handling
- [Start Events](../events/start-event.md) - Process initiation events

---
