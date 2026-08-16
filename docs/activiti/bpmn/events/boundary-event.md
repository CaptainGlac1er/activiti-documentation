---
sidebar_label: Boundary Event
slug: /bpmn/events/boundary-event
title: "Boundary Event"
description: "Complete guide to Boundary Events in Activiti - exception handling at activity level with interrupting and non-interrupting modes."
---

# Boundary Event

Boundary Events are **attached to activities** and handle exceptions, timeouts, or other events that occur during activity execution. They provide **fine-grained error handling** at the task level.

## Overview

```xml
<userTask id="task1" name="Process Order"/>

<!-- Boundary event as sibling of the task -->
<boundaryEvent id="timeout" attachedToRef="task1" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT1H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Multiple event types, interrupting/non-interrupting

**Important:** The `attachedToRef` attribute is **required** and must reference the ID of the activity the boundary event is attached to.

## Key Features

### Boundary Event Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Error** | Catch errors from activity | Exception handling |
| **Timer** | Timeout handling | Activity deadlines |
| **Message** | External trigger | Cancel/stop requests |
| **Signal** | Global event | System-wide triggers |
| **Cancel** | Cancel transactional sub-process | Sub-process cancellation |
| **Compensate** | Undo operations | Transaction rollback |

**Not supported:** Escalation boundary events (no `EscalationEventDefinition` class exists).

### Interrupting vs Non-Interrupting

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Interrupting** | Cancels activity | Timeouts, errors, cancellations |
| **Non-Interrupting** | Runs parallel | Logging, notifications, tracking |

## Configuration Options

### 1. Timer Boundary Event

Handle activity timeouts:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<userTask id="approvalTask" name="Approve Request" activiti:assignee="${manager}"/>

<!-- Interrupting timer - cancels task after 24 hours -->
<boundaryEvent id="approvalTimeout" attachedToRef="approvalTask" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT24H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>

<sequenceFlow id="timeoutFlow" sourceRef="approvalTimeout" targetRef="escalateTask"/>
<userTask id="escalateTask" name="Escalate to Director"/>
```

**Timer Formats:**
- `PT24H` - 24 hours
- `P7D` - 7 days
- `PT30M` - 30 minutes
- Expression: `${calculateTimeout()}`

**Timer Types:**
- **Duration Timer:** `<timeDuration>PT24H</timeDuration>` - Relative duration
- **Date Timer:** `<timeDate>${dueDate}</timeDate>` - Absolute date
- **Cycle Timer:** `<timeCycle>R/PT1H</timeCycle>` - Repeat (use `R[<n>]/<ISO-8601 duration>` or a cron expression; iCal/RRULE is not supported)

### 2. Non-Interrupting Timer Boundary Event

Log activity without canceling:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<serviceTask id="longRunningTask" name="Process Data" activiti:class="com.example.DataProcessor"/>

<!-- Non-interrupting timer - logs progress every hour (cycle timer; a one-shot timeDuration would only log once) -->
<boundaryEvent id="progressLog" attachedToRef="longRunningTask" cancelActivity="false">
  <timerEventDefinition>
    <timeCycle>R/PT1H</timeCycle>
  </timerEventDefinition>
</boundaryEvent>

<sequenceFlow id="logFlow" sourceRef="progressLog" targetRef="logActivity"/>
<serviceTask id="logActivity" name="Log Progress" activiti:class="com.example.ProgressLogger"/>
```

**Behavior:**
- Main task continues running
- Logging happens every hour
- Multiple log activities can execute

### 3. Error Boundary Event

Catch errors from activities:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<serviceTask id="paymentTask" name="Process Payment" activiti:class="com.example.PaymentService"/>

<!-- Error boundary event -->
<boundaryEvent id="paymentError" attachedToRef="paymentTask" cancelActivity="true">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>

<sequenceFlow id="errorFlow" sourceRef="paymentError" targetRef="handleError"/>
<userTask id="handleError" name="Handle Payment Error"/>
```

**Error Definition:**
```xml
<error id="PaymentError" name="Payment Error" errorCode="PAY001"/>
```

### 4. Message Boundary Event

Wait for external messages:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<userTask id="reviewTask" name="Review Document" activiti:assignee="${reviewer}"/>

<!-- Message boundary event for cancellation -->
<boundaryEvent id="cancelReview" attachedToRef="reviewTask" cancelActivity="true">
  <messageEventDefinition messageRef="cancelMessage"/>
</boundaryEvent>

<sequenceFlow id="cancelFlow" sourceRef="cancelReview" targetRef="skipReview"/>
<endEvent id="skipReview"/>
```

**Message Definition:**
```xml
<message id="cancelMessage" name="Cancel Review"/>
```

**Runtime API:**
```java
// Send message to cancel task
runtimeService.messageEventReceived("cancelMessage", executionId);
```

### 5. Signal Boundary Event

Respond to global signals:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<serviceTask id="processingTask" name="Process Data" activiti:class="com.example.DataProcessor"/>

<!-- Signal boundary event for emergency stop -->
<boundaryEvent id="emergencyStop" attachedToRef="processingTask" cancelActivity="true">
  <signalEventDefinition signalRef="emergencySignal"/>
</boundaryEvent>

<sequenceFlow id="stopFlow" sourceRef="emergencyStop" targetRef="cleanupTask"/>
<serviceTask id="cleanupTask" name="Emergency Cleanup" activiti:class="com.example.CleanupService"/>
```

**Signal Definition:**
```xml
<signal id="emergencySignal" name="Emergency Stop"/>
```

### 6. Compensate Boundary Event

Trigger compensation (undo):

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<serviceTask id="bookFlight" name="Book Flight" activiti:class="com.example.FlightBookingService"/>

<!-- Compensation boundary event (sibling of the activity) -->
<boundaryEvent id="compensateBooking" attachedToRef="bookFlight" cancelActivity="false">
  <compensateEventDefinition/>
</boundaryEvent>

<!-- Association links the boundary event to the compensation handler -->
<association id="compensateBookingAssoc" sourceRef="compensateBooking" targetRef="cancelFlight"/>

<!-- Compensation handler - isForCompensation="true" is required -->
<serviceTask id="cancelFlight" name="Cancel Flight Booking" activiti:class="com.example.FlightCancellationService" isForCompensation="true"/>
```

**How it works:** When `bookFlight` completes, the engine resolves the handler via the `<association>` and registers a compensation subscription for it. A later throw-compensation event (see [Compensation Events](./compensation-events.md)) executes `cancelFlight`. If the associated handler is missing or lacks `isForCompensation="true"`, the engine throws `Compensation activity could not be found (or it is missing 'isForCompensation="true"')` when the activity completes.

### 7. Multiple Boundary Events

Attach multiple boundary events to one activity:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<userTask id="criticalTask" name="Critical Operation" activiti:assignee="${operator}"/>

<!-- Timer boundary for timeout -->
<boundaryEvent id="timeout" attachedToRef="criticalTask" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT2H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>

<!-- Message boundary for cancellation -->
<boundaryEvent id="cancel" attachedToRef="criticalTask" cancelActivity="true">
  <messageEventDefinition messageRef="cancelMessage"/>
</boundaryEvent>

<!-- Error boundary for exceptions -->
<boundaryEvent id="error" attachedToRef="criticalTask" cancelActivity="true">
  <errorEventDefinition errorRef="OperationError"/>
</boundaryEvent>

<!-- Non-interrupting timer for logging -->
<boundaryEvent id="logProgress" attachedToRef="criticalTask" cancelActivity="false">
  <timerEventDefinition>
    <timeDuration>PT30M</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

**Behavior:**
- First triggering event wins (for interrupting events)
- Non-interrupting events run in parallel
- Multiple timeout logs can occur

## Advanced Features

### Boundary Event on Multi-Instance

Boundary events attach to the multi-instance activity as a whole, not inside `multiInstanceLoopCharacteristics`:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<userTask id="reviewTask" name="Review">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${reviewers}">
  </multiInstanceLoopCharacteristics>
</userTask>

<!-- Boundary event as sibling of the userTask, not inside multiInstanceLoopCharacteristics -->
<boundaryEvent id="reviewTimeout" attachedToRef="reviewTask" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT4H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

**Behavior:**
- The boundary event attaches to the multi-instance activity as a whole, not to individual instances.
- A single timer is created for the entire multi-instance activity.
- When the boundary event fires, it affects the multi-instance activity as a unit.

### Nested Boundary Events

Boundary events inside subprocesses must be siblings of the activity within the subprocess, not nested inside it. A boundary event attached to the subprocess itself must be a sibling of the `<subProcess>` element:

```xml
<subProcess id="subProcess1" name="Sub Process">
  <startEvent id="subStart"/>
  
  <userTask id="subTask" name="Sub Task"/>
  
  <!-- Boundary event as sibling of userTask within the subprocess -->
  <boundaryEvent id="subTimeout" attachedToRef="subTask" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT1H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
  <endEvent id="subEnd"/>
  
  <sequenceFlow id="subFlow1" sourceRef="subStart" targetRef="subTask"/>
  <sequenceFlow id="subFlow2" sourceRef="subTask" targetRef="subEnd"/>
</subProcess>

<!-- Boundary event on the subprocess itself - sibling of the subProcess element -->
<boundaryEvent id="subProcessTimeout" attachedToRef="subProcess1" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT8H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

## Complete Examples

### Example 1: Order Processing with Timeouts

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="orderProcess" name="Order Processing">
  
  <startEvent id="start"/>
  
  <userTask id="receiveOrder" name="Receive Order" activiti:assignee="${orderClerk}"/>
  
  <!-- Timeout after 2 hours -->
  <boundaryEvent id="receiveTimeout" attachedToRef="receiveOrder" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT2H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
  <userTask id="escalateReceive" name="Escalate Order Reception"/>
  
  <serviceTask id="validateOrder" name="Validate Order" activiti:class="com.example.OrderValidator"/>
  
  <!-- Error boundary for validation errors -->
  <boundaryEvent id="validationError" attachedToRef="validateOrder" cancelActivity="true">
    <errorEventDefinition errorRef="ValidationError"/>
  </boundaryEvent>
  
  <userTask id="handleValidationError" name="Handle Validation Error"/>
  
  <userTask id="approveOrder" name="Approve Order" activiti:assignee="${manager}"/>
  
  <!-- Multiple boundary events on approveOrder -->
  <boundaryEvent id="approvalTimeout" attachedToRef="approveOrder" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT24H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
  <boundaryEvent id="approvalCancel" attachedToRef="approveOrder" cancelActivity="true">
    <messageEventDefinition messageRef="cancelApproval"/>
  </boundaryEvent>
  
  <userTask id="escalateApproval" name="Escalate Approval"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="receiveOrder"/>
  <sequenceFlow id="flow2" sourceRef="receiveTimeout" targetRef="escalateReceive"/>
  <sequenceFlow id="flow3" sourceRef="escalateReceive" targetRef="validateOrder"/>
  <sequenceFlow id="flow4" sourceRef="receiveOrder" targetRef="validateOrder"/>
  <sequenceFlow id="flow5" sourceRef="validationError" targetRef="handleValidationError"/>
  <sequenceFlow id="flow6" sourceRef="handleValidationError" targetRef="end"/>
  <sequenceFlow id="flow7" sourceRef="validateOrder" targetRef="approveOrder"/>
  <sequenceFlow id="flow8" sourceRef="approvalTimeout" targetRef="escalateApproval"/>
  <sequenceFlow id="flow9" sourceRef="approvalCancel" targetRef="end"/>
  <sequenceFlow id="flow10" sourceRef="escalateApproval" targetRef="end"/>
  <sequenceFlow id="flow11" sourceRef="approveOrder" targetRef="end"/>
</process>
```

### Example 2: Payment Processing with Compensation

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="paymentProcess" name="Payment Processing">
  
  <startEvent id="start"/>
  
  <serviceTask id="reserveFunds" name="Reserve Funds" 
               activiti:class="com.example.FundsReservation"/>
  
  <boundaryEvent id="reservationError" attachedToRef="reserveFunds" cancelActivity="true">
    <errorEventDefinition errorRef="ReservationError"/>
  </boundaryEvent>
  
  <serviceTask id="processPayment" name="Process Payment"
               activiti:class="com.example.PaymentProcessor"/>
  
  <boundaryEvent id="paymentError" attachedToRef="processPayment" cancelActivity="true">
    <errorEventDefinition errorRef="PaymentError"/>
  </boundaryEvent>
  
  <serviceTask id="confirmPayment" name="Confirm Payment" activiti:class="com.example.PaymentConfirmation"/>
  
  <!-- Compensation boundary event for processPayment -->
  <boundaryEvent id="compensatePayment" attachedToRef="processPayment" cancelActivity="false">
    <compensateEventDefinition/>
  </boundaryEvent>
  
  <!-- Association links the boundary event to the compensation handler -->
  <association id="compensatePaymentAssoc" sourceRef="compensatePayment" targetRef="refundPayment"/>
  
  <!-- Compensation handler - isForCompensation="true" is required -->
  <serviceTask id="refundPayment" name="Refund Payment" activiti:class="com.example.PaymentRefund" isForCompensation="true"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="reserveFunds"/>
  <sequenceFlow id="flow2" sourceRef="reserveFunds" targetRef="processPayment"/>
  <sequenceFlow id="flow3" sourceRef="processPayment" targetRef="confirmPayment"/>
  <sequenceFlow id="flow4" sourceRef="confirmPayment" targetRef="end"/>
</process>
```

**Note:** Compensation is **not** triggered via event sub-processes — the engine's `EventSubprocessValidator` only accepts `error`, `message`, or `signal` start event definitions on event subprocesses. The supported mechanism is a compensation boundary event + `<association>` + an `isForCompensation="true"` handler, triggered by a throw-compensation event. See [Compensation Events](./compensation-events.md).

## Runtime API

### Sending Messages to Boundary Events

```java
// Correlate message with boundary event
runtimeService.messageEventReceived("cancelApproval", executionId);
```

### Handling Timer Boundary Events

```java
// Timer boundary events are automatic
// Can be managed via Job API
List<Job> timerJobs = managementService.createJobQuery()
    .processInstanceId(processInstanceId)
    .list();
```

### Error Handling

```java
// Errors from boundary events can be caught
// by error intermediate events or propagated
```

## Best Practices

1. **Use Interrupting for Critical Events** - Timeouts, errors, cancellations
2. **Use Non-Interrupting for Logging** - Progress tracking, audit trails
3. **Clear Timeout Values** - Reasonable timeout durations
4. **Multiple Boundary Events** - Handle different scenarios
5. **Error Definitions** - Clear error codes and messages
6. **Compensation Logic** - Define undo operations
7. **Testing** - Test all boundary event scenarios

## Common Pitfalls

- **Too Many Boundary Events** - Can make process complex
- **Conflicting Events** - Multiple interrupting events competing
- **Missing Error Handling** - Not catching all error types
- **Timer Precision** - Timers may not fire exactly on time
- **Non-Interrupting Confusion** - Understanding parallel execution
- **Compensation Order** - Reverse order of completion

## Related Documentation

- [Start Events](./start-event.md) - Process initiation
- [Intermediate Events](./intermediate-events.md) - Events during execution
- [End Events](./end-event.md) - Process termination
- [Event SubProcess](../subprocesses/event-subprocess.md) - Event-triggered subprocesses
- [User Task](../elements/user-task.md) - Human tasks with boundary events

---

