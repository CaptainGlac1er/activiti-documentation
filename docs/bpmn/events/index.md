---
sidebar_label: Events Overview
slug: /bpmn/events/index
description: Complete guide to BPMN event elements for triggers, exceptions, and process responses
---

# Events

Events represent **something that happens** during the execution of a process. They can trigger processes, interrupt activities, or signal completions.

## 📋 Overview

```xml
<startEvent id="start1" name="Process Start"/>
<intermediateCatchEvent id="wait1" name="Wait for Event"/>
<endEvent id="end1" name="Process End"/>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ Enhanced event handling and subscriptions

## 🎯 Event Categories

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
5. **Conditional Events** - Condition-based triggers
6. **Link Events** - Internal process jumps
7. **Compensate Events** - Compensation handling
8. **Terminate Events** - Immediate termination
9. **Cancel Events** - Sub-process cancellation

## 🔧 Event Definitions

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

**Cycle Timer:**
```xml
<timerEventDefinition>
  <timeCycle>RRULE:FREQ=DAILY;INTERVAL=1</timeCycle>
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

### Conditional Event Definition

```xml
<conditionalEventDefinition>
  <condition>${orderAmount > 10000}</condition>
</conditionalEventDefinition>
```

### Link Event Definition

```xml
<linkEventDefinition>
  <outgoing>link1</outgoing>
</linkEventDefinition>
```

### Compensate Event Definition

```xml
<compensateEventDefinition activityRef="reservePayment" name="Compensate Reservation"/>
```

### Terminate Event Definition

```xml
<terminateEventDefinition/>
```

## 💡 Complete Examples

### Example 1: Start Event Variations

```xml
<!-- Standard start event -->
<startEvent id="standardStart" name="Process Started"/>

<!-- Message start event -->
<startEvent id="messageStart" name="Order Received">
  <messageEventDefinition messageRef="orderReceived"/>
</startEvent>

<!-- Timer start event -->
<startEvent id="timerStart" name="Scheduled Execution">
  <timerEventDefinition>
    <timeCycle>RRULE:FREQ=DAILY;HOUR=9</timeCycle>
  </timerEventDefinition>
</startEvent>

<!-- Signal start event -->
<startEvent id="signalStart" name="External Trigger">
  <signalEventDefinition signalRef="processTrigger"/>
</startEvent>

<!-- Conditional start event -->
<startEvent id="conditionalStart" name="Condition Met">
  <conditionalEventDefinition>
    <condition>${systemReady}</condition>
  </conditionalEventDefinition>
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

<!-- Conditional catch -->
<intermediateCatchEvent id="waitForCondition" name="Wait for Condition">
  <conditionalEventDefinition>
    <condition>${status == 'READY'}</condition>
  </conditionalEventDefinition>
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
  <linkEventDefinition>
    <outgoing>section2</outgoing>
  </linkEventDefinition>
</intermediateThrowEvent>

<!-- Compensate throw -->
<intermediateThrowEvent id="compensate" name="Compensate">
  <compensateEventDefinition activityRef="bookResource"/>
</intermediateThrowEvent>
```

### Example 4: Boundary Events

```xml
<serviceTask id="externalCall" name="Call External Service" activiti:async="true">
  
  <!-- Error boundary (interrupting) -->
  <boundaryEvent id="errorBoundary" cancelActivity="true">
    <errorEventDefinition errorRef="ExternalServiceError"/>
  </boundaryEvent>
  
  <!-- Timer boundary (interrupting) -->
  <boundaryEvent id="timeoutBoundary" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT30S</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
  <!-- Message boundary (non-interrupting) -->
  <boundaryEvent id="cancelBoundary" cancelActivity="false">
    <messageEventDefinition messageRef="cancelRequest"/>
  </boundaryEvent>
  
  <!-- Signal boundary (non-interrupting) -->
  <boundaryEvent id="escalateBoundary" cancelActivity="false">
    <signalEventDefinition signalRef="escalationSignal"/>
  </boundaryEvent>
  
</serviceTask>
```

### Example 5: End Events

```xml
<!-- Normal completion -->
<endEvent id="normalEnd" name="Completed"/>

<!-- Error end -->
<endEvent id="errorEnd" name="Failed with Error">
  <errorEventDefinition errorRef="ProcessError"/>
</endEvent>

<!-- Signal end -->
<endEvent id="signalEnd" name="Completed with Signal">
  <signalEventDefinition signalRef="processFinished"/>
</endEvent>

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
<!-- Non-interrupting event sub-process -->
<eventSubProcess id="loggingSubProcess" isInterrupting="false">
  <startEvent id="logSignal">
    <signalEventDefinition signalRef="logEvent"/>
  </startEvent>
  <serviceTask id="logActivity" name="Log Event" activiti:class="com.example.Logger"/>
  <endEvent id="logEnd"/>
</eventSubProcess>

<!-- Interrupting event sub-process -->
<eventSubProcess id="escalationSubProcess" isInterrupting="true">
  <startEvent id="escalationTimer">
    <timerEventDefinition>
      <timeDuration>PT72H</timeDuration>
    </timerEventDefinition>
  </startEvent>
  <userTask id="escalationTask" name="Handle Escalation"/>
  <endEvent id="escalationEnd"/>
</eventSubProcess>
```

## 🔍 Activiti Customizations

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
runtimeService.sendMessage("orderMessage", processInstanceId, 
    Map.of("orderId", "12345"));
```

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

**iCalendar Recurrence Format:**
```xml
<timeCycle>RRULE:FREQ=DAILY;INTERVAL=1;COUNT=10</timeCycle>
```

### Signal Broadcasting

Signals are global and can trigger multiple processes:

```java
// Broadcast signal
runtimeService.signalEventReceived("globalSignal");

// Broadcast with variables
runtimeService.signalEventReceived("globalSignal", 
    Map.of("signalData", "value"));
```

### Error Handling

**Define Errors:**
```xml
<error id="PaymentError" name="Payment Failed" errorCode="PAY001"/>
<error id="ValidationError" name="Validation Failed" errorCode="VAL001"/>
```

**Catch Errors:**
```xml
<boundaryEvent id="catchPaymentError" cancelActivity="true">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>
```

**Throw Errors:**
```java
// In JavaDelegate
throw new ActivitiException("PAY001", "Payment failed");
```

## 📊 Best Practices

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

## ⚠️ Common Pitfalls

- **Uncorrelated Messages:** Messages without proper correlation
- **Timer Memory:** Too many pending timers consume memory
- **Signal Confusion:** Signals affect all processes
- **Missing Error Handlers:** Uncaught errors fail processes
- **Boundary Event Overuse:** Too many boundary events complicate flow
- **Interrupting vs Non-Interrupting:** Wrong choice causes issues
- **Link Event Scope:** Links only work within same process

## 🔍 Runtime API Usage

### Sending Messages

```java
// Send message to specific process instance
runtimeService.sendMessage("orderReceived", processInstanceId);

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
    .jobType(JobType.TIMER)
    .list();

// Delete timer job
managementService.deleteJob(timerJobId);
```

### Error Handling

```java
// Throw error from JavaDelegate
public void execute(DelegateExecution execution) {
    throw new ActivitiError("PAY001", "Payment failed");
}
```

## 🔗 Related Documentation

- [Start Events](./start-event.md)
- [Intermediate Events](./intermediate-events.md)
- [End Events](./end-event.md)
- [Boundary Events](./boundary-event.md)
- [Event Sub-Processes](../subprocesses/event-subprocess.md)
- [Intermediate Events](./intermediate-events.md#1-message-intermediate-events) - Message catch and throw events
- [Error Handling](../advanced/error-handling.md)
- [Execution Listeners](../advanced/execution-listeners.md)

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
