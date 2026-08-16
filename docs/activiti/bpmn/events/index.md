---
sidebar_label: Events Overview
slug: /bpmn/events/index
title: "Events Overview"
description: "Complete guide to BPMN event elements for triggers, exceptions, and process responses in Activiti workflows."
---

# Events

Events represent **something that happens** during the execution of a process. They can trigger processes, interrupt activities, or signal completions.

## Overview

```xml
<startEvent id="start1" name="Process Start"/>
<intermediateCatchEvent id="wait1" name="Wait for Event"/>
<endEvent id="end1" name="Process End"/>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Enhanced event handling and subscriptions

## Event Categories

### By Position in Process

1. **[Start Events](./start-event.md)** - Initiate process instances
2. **[Intermediate Events](./intermediate-events.md)** - Occur during execution
3. **[End Events](./end-event.md)** - Terminate process/sub-process
4. **[Boundary Events](./boundary-event.md)** - Attached to activities

### By Behavior

1. **Catch Events** - Wait for event to occur
2. **Throw Events** - Trigger event occurrence
3. **Boundary Events** - Handle exceptions/interruptions

### By Event Type

1. **Message Events** - Communication with external systems
2. **Timer Events** - Time-based triggers
3. **Signal Events** - Broadcast communication
4. **Error Events** - Exception handling
5. **Link Events** - Internal process jumps
6. **Compensate Events** - Compensation handling
7. **Terminate Events** - Immediate termination
8. **Cancel Events** - Sub-process cancellation

## Event Definitions

### Message Event Definition

```xml
<messageEventDefinition messageRef="orderReceived"/>
```

**Message Reference:**
```xml
<message id="orderReceived" name="Order Received">
  <itemDefinition id="orderItem" structureRef="Order"/>
</message>
```

### Timer Event Definition

**Date Timer:**
```xml
<timerEventDefinition>
  <timeDate>${dueDate}</timeDate>
</timerEventDefinition>
```

**Duration Timer:**
```xml
<timerEventDefinition>
  <timeDuration>PT24H</timeDuration>
</timerEventDefinition>
```

**Cycle Timer (cron expression):**
```xml
<timerEventDefinition>
  <timeCycle>0 0 8 * * ?</timeCycle>
</timerEventDefinition>
```

### Signal Event Definition

```xml
<signalEventDefinition signalRef="paymentCompleted"/>
```

**Signal Reference:**
```xml
<signal id="paymentCompleted" name="Payment Completed"/>
```

### Error Event Definition

```xml
<errorEventDefinition errorRef="paymentError"/>
```

**Error Reference:**
```xml
<error id="paymentError" name="Payment Error" errorCode="PAY001"/>
```

### Link Event Definition

```xml
<linkEventDefinition id="link1"/>
```

### Compensate Event Definition

```xml
<compensateEventDefinition activityRef="reservePayment"/>
```

### Terminate Event Definition

```xml
<terminateEventDefinition/>
```

## Complete Examples

### Example 1: Start Event Variations

```xml
<!-- Standard start event -->
<startEvent id="standardStart" name="Process Started"/>

<!-- Message start event -->
<startEvent id="messageStart" name="Order Received">
  <messageEventDefinition messageRef="orderReceived"/>
</startEvent>

<!-- Timer start event: a timer job (type "timer-start-event") is created at deployment and fired by the async executor -->
<startEvent id="timerStart" name="Scheduled Start">
  <timerEventDefinition>
    <timeCycle>0 0 2 * * ?</timeCycle>
  </timerEventDefinition>
</startEvent>

<!-- Signal start event: an event subscription is created at deployment; triggered via runtimeService.signalEventReceived("orderSignal") -->
<startEvent id="signalStart" name="Signal Start">
  <signalEventDefinition signalRef="orderSignal"/>
</startEvent>

<!-- Multiple start events (any can trigger) -->
<startEvent id="altStart1">
  <messageEventDefinition messageRef="message1"/>
</startEvent>
<startEvent id="altStart2">
  <messageEventDefinition messageRef="message2"/>
</startEvent>
```

### Example 2: Intermediate Catch Events

```xml
<!-- Message catch -->
<intermediateCatchEvent id="waitForApproval" name="Wait for Approval">
  <messageEventDefinition messageRef="approvalMessage"/>
</intermediateCatchEvent>

<!-- Timer catch (duration) -->
<intermediateCatchEvent id="waitForTimeout" name="Wait 24 Hours">
  <timerEventDefinition>
    <timeDuration>PT24H</timeDuration>
  </timerEventDefinition>
</intermediateCatchEvent>

<!-- Timer catch (date) -->
<intermediateCatchEvent id="waitForDate" name="Wait Until Date">
  <timerEventDefinition>
    <timeDate>${notificationDate}</timeDate>
  </timerEventDefinition>
</intermediateCatchEvent>

<!-- Signal catch -->
<intermediateCatchEvent id="waitForSignal" name="Wait for Signal">
  <signalEventDefinition signalRef="globalSignal"/>
</intermediateCatchEvent>

<!-- Multiple event definitions (any can trigger) -->
<intermediateCatchEvent id="multiEvent" name="Wait for Any">
  <messageEventDefinition messageRef="message1"/>
  <timerEventDefinition>
    <timeDuration>PT1H</timeDuration>
  </timerEventDefinition>
</intermediateCatchEvent>
```

### Example 3: Intermediate Throw Events

```xml
<!-- Message throw -->
<intermediateThrowEvent id="sendNotification" name="Send Notification">
  <messageEventDefinition messageRef="notificationSent"/>
</intermediateThrowEvent>

<!-- Signal throw -->
<intermediateThrowEvent id="broadcastSignal" name="Broadcast Signal">
  <signalEventDefinition signalRef="processCompleted"/>
</intermediateThrowEvent>

<!-- Link throw -->
<intermediateThrowEvent id="jumpToSection" name="Jump">
  <linkEventDefinition name="section2"/>
</intermediateThrowEvent>

<!-- Compensate throw -->
<intermediateThrowEvent id="compensate" name="Compensate">
  <compensateEventDefinition activityRef="bookResource"/>
</intermediateThrowEvent>
```

### Example 4: Boundary Events

```xml
<serviceTask id="externalCall" name="Call External Service" activiti:async="true"/>

<!-- Error boundary (interrupting) -->
<boundaryEvent id="errorBoundary" attachedToRef="externalCall" cancelActivity="true">
  <errorEventDefinition errorRef="ExternalServiceError"/>
</boundaryEvent>

<!-- Timer boundary (interrupting) -->
<boundaryEvent id="timeoutBoundary" attachedToRef="externalCall" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT30S</timeDuration>
  </timerEventDefinition>
</boundaryEvent>

<!-- Message boundary (non-interrupting) -->
<boundaryEvent id="cancelBoundary" attachedToRef="externalCall" cancelActivity="false">
  <messageEventDefinition messageRef="cancelRequest"/>
</boundaryEvent>

<!-- Signal boundary (non-interrupting) -->
<boundaryEvent id="escalateBoundary" attachedToRef="externalCall" cancelActivity="false">
  <signalEventDefinition signalRef="escalationSignal"/>
</boundaryEvent>
```

### Example 5: End Events

```xml
<!-- Normal completion -->
<endEvent id="normalEnd" name="Completed"/>

<!-- Error end -->
<endEvent id="errorEnd" name="Failed with Error">
  <errorEventDefinition errorRef="ProcessError"/>
</endEvent>

<!-- Signal end events are NOT supported — they fall through to none end event behavior -->

<!-- Message end -->
<endEvent id="messageEnd" name="Send Completion Message">
  <messageEventDefinition messageRef="completionNotification"/>
</endEvent>

<!-- Terminate end (ends entire process) -->
<endEvent id="terminateEnd" name="Terminate Process">
  <terminateEventDefinition/>
</endEvent>

<!-- Multiple end events -->
<endEvent id="end1"/>
<endEvent id="end2"/>
```

### Example 6: Event Sub-Processes

```xml
<!-- Non-interrupting event sub-process (NOT SUPPORTED: signal start events inside event sub-processes are never triggered; shown for illustration only — see Start Events, section 4) -->
<subProcess id="loggingSubProcess" triggeredByEvent="true">
  <startEvent id="logSignal" isInterrupting="false">
    <signalEventDefinition signalRef="logEvent"/>
  </startEvent>
  <serviceTask id="logActivity" name="Log Event" activiti:class="com.example.Logger"/>
  <endEvent id="logEnd"/>
</subProcess>

<!-- Interrupting event sub-process -->
<subProcess id="escalationSubProcess" triggeredByEvent="true">
  <startEvent id="escalationMessage" isInterrupting="true">
    <messageEventDefinition messageRef="escalationMsg"/>
  </startEvent>
  <message id="escalationMsg" name="Escalation Message"/>
  <userTask id="escalationTask" name="Handle Escalation"/>
  <endEvent id="escalationEnd"/>
</subProcess>
```

## Activiti Customizations

### Message Correlation

```xml
<message id="orderMessage" name="Order Message">
  <itemDefinition structureRef="Order"/>
</message>

<intermediateCatchEvent id="waitForOrder">
  <messageEventDefinition messageRef="orderMessage"/>
</intermediateCatchEvent>
```

**Runtime Message Correlation:**
```java
// Send message to correlate
runtimeService.messageEventReceived("orderMessage", processInstanceId, 
    Map.of("orderId", "12345"));
```

**Message Name Expressions and Correlation Keys:**

Two `activiti:` attributes refine `<messageEventDefinition>`:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<intermediateCatchEvent id="waitForOrder">
  <messageEventDefinition messageRef="orderMessage" activiti:correlationKey="${orderId}"/>
</intermediateCatchEvent>

<intermediateCatchEvent id="waitForDynamicMessage">
  <messageEventDefinition activiti:messageExpression="${orderStatusMessage}"/>
</intermediateCatchEvent>
```

- **`activiti:messageExpression`** — the expression is evaluated at execution time and used as the message name of the subscription. `messageRef` takes precedence: the expression is only used when no `messageRef` is present.
- **`activiti:correlationKey`** — the expression is evaluated when the subscription is created and stored on the message subscription (its `configuration`). It identifies the subscription: creating a second subscription with the same message name and correlation key fails at execution time with a duplicate-subscription error. The key is also carried on the engine's `MESSAGE_SENT`/`MESSAGE_RECEIVED` events.
- The correlation key does not change message matching: `runtimeService.messageEventReceived(...)` still selects the subscription by message name and process instance — the key identifies *which* subscription, not *where* the message is sent.

### Timer Expressions

**Dynamic Timer Duration:**
```xml
<timerEventDefinition>
  <timeDuration>${calculateTimeout()}</timeDuration>
</timerEventDefinition>
```

**ISO 8601 Duration Format:**
- `PT1H` - 1 hour
- `PT30M` - 30 minutes
- `P1D` - 1 day
- `P2W` - 2 weeks

**Cycle Timer Format:**
- ISO 8601 repeat: `R[<n>]/<ISO-8601 duration>` (e.g. `R5/PT24H`) or a cron expression (e.g. `0 0 8 * * ?`)
- iCalendar `RRULE` format is NOT supported

### Signal Broadcasting

Signals are global and can trigger multiple processes:

```java
// Broadcast signal
runtimeService.signalEventReceived("globalSignal");

// Broadcast with variables
runtimeService.signalEventReceived("globalSignal", 
    Map.of("signalData", "value"));
```

> **Note:** Signals are global by default. A signal can be scoped to a single process instance by adding `activiti:scope="processInstance"` to the `<signal>` definition — this limits matching subscriptions to that instance. Alternatively, `activiti:signalExpression` can be used on the `<signalEventDefinition>` to evaluate an expression as the signal name.

### Error Handling

**Define Errors:**
```xml
<error id="PaymentError" name="Payment Failed" errorCode="PAY001"/>
<error id="ValidationError" name="Validation Failed" errorCode="VAL001"/>
```

**Catch Errors:**
```xml
<!-- Attached to the activity that throws the error (e.g., a serviceTask with id="paymentTask") -->
<boundaryEvent id="catchPaymentError" attachedToRef="paymentTask" cancelActivity="true">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>
```

**Throw Errors:**
```java
// In JavaDelegate
throw new BpmnError("PAY001", "Payment failed");
```

## Best Practices

1. **Use Appropriate Event Types:** Match event to use case
2. **Define Clear Messages:** Use descriptive message names
3. **Handle Timeouts:** Add timer boundaries for long operations
4. **Non-Interrupting Events:** Use for logging/monitoring
5. **Event Sub-Processes:** Group related exception handling
6. **Signal Scope:** Understand global vs process-local
7. **Error Codes:** Use meaningful error codes
8. **Timer Performance:** Avoid too many concurrent timers
9. **Message Correlation:** Design correlation keys carefully
10. **Document Events:** Explain event purposes

## Common Pitfalls

- **Uncorrelated Messages:** Messages without proper correlation
- **Timer Memory:** Too many pending timers consume memory
- **Signal Confusion:** Signals affect all processes
- **Missing Error Handlers:** Uncaught errors fail processes
- **Boundary Event Overuse:** Too many boundary events complicate flow
- **Interrupting vs Non-Interrupting:** Wrong choice causes issues
- **Link Event Scope:** Links only work within same process

## Runtime API Usage

### Sending Messages

```java
// Send message to specific process instance
runtimeService.messageEventReceived("orderReceived", processInstanceId);

// Send message to start process
ProcessInstance process = runtimeService.startProcessInstanceByMessage("orderReceived");

// Send message with variables
runtimeService.messageEventReceived("orderReceived", 
    processInstanceId,
    Map.of("orderId", "123", "amount", 500.0));
```

### Broadcasting Signals

```java
// Broadcast signal (all waiting processes)
runtimeService.signalEventReceived("paymentCompleted");

// Signal with variables
runtimeService.signalEventReceived("paymentCompleted", 
    Map.of("transactionId", "txn123"));
```

### Timer Management

```java
// Get timer jobs
List<Job> timerJobs = managementService.createJobQuery()
    .timers()
    .list();

// Delete timer job
managementService.deleteJob(timerJobId);
```

### Error Handling

```java
// Throw error from JavaDelegate
public void execute(DelegateExecution execution) {
throw new BpmnError("PAY001", "Payment failed");
}
```

## Related Documentation

- [Start Events](./start-event.md)
- [Intermediate Events](./intermediate-events.md)
- [End Events](./end-event.md)
- [Boundary Events](./boundary-event.md)
- [Event Sub-Processes](../subprocesses/event-subprocess.md)
- [Intermediate Events](./intermediate-events.md#1-message-intermediate-events) - Message catch and throw events
- [Error Handling](../reference/error-handling.md)
- [Execution Listeners](../reference/execution-listeners.md)

---

