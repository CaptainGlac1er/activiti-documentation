---
sidebar_label: Intermediate Events
slug: /bpmn/events/intermediate-events
title: "Intermediate Events"
description: "Complete guide to Intermediate Events in Activiti - catch and throw events during process execution with various triggers."
---

# Intermediate Events

Intermediate Events occur **during process execution** between the start and end events. They can be **catch events** (waiting for something to happen) or **throw events** (triggering something to happen).

## Overview

```xml
<!-- Catch Event: Wait for message -->
<intermediateCatchEvent id="messageWait">
  <messageEventDefinition messageRef="myMessage"/>
</intermediateCatchEvent>

<!-- Throw Event: Send signal -->
<intermediateThrowEvent id="signalSend">
  <signalEventDefinition signalRef="mySignal"/>
</intermediateThrowEvent>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Multiple event types, expressions, async support

## Key Features

### Catch Events (Wait for Events)
- **Message** - Wait for external message
- **Timer** - Wait for time condition
- **Signal** - Wait for global signal
- **Conditional** - Wait for condition to be true
- **Error** - Catch errors
- **Link** - Jump from link throw event
- **Escalation** - Wait for escalation

### Throw Events (Trigger Events)
- **Message** - Send message to external system
- **Signal** - Broadcast signal globally
- **Link** - Jump to link catch event
- **Compensate** - Trigger compensation
- **Escalation** - Throw escalation

## Configuration Options

### 1. Message Intermediate Events

#### Catch Message Event

Wait for a message to arrive:

```xml
<userTask id="prepareOrder" name="Prepare Order"/>

<sequenceFlow id="flow1" sourceRef="prepareOrder" targetRef="waitForApproval"/>

<intermediateCatchEvent id="waitForApproval">
  <messageEventDefinition messageRef="approvalMessage"/>
</intermediateCatchEvent>

<sequenceFlow id="flow2" sourceRef="waitForApproval" targetRef="processOrder"/>
```

**Message Definition:**
```xml
<message id="approvalMessage" name="Approval Message"/>
```

**Runtime API:**
```java
// Send message to trigger event
runtimeService.messageEventReceived("approvalMessage", processInstanceId);
```

#### Throw Message Event

Send a message to external systems:

```xml
<serviceTask id="orderComplete" name="Complete Order"/>

<sequenceFlow id="flow1" sourceRef="orderComplete" targetRef="sendNotification"/>

<intermediateThrowEvent id="sendNotification">
  <messageEventDefinition messageRef="orderCompleteMessage"/>
</intermediateThrowEvent>

<sequenceFlow id="flow2" sourceRef="sendNotification" targetRef="endEvent"/>
```

### 2. Timer Intermediate Events

#### Duration Timer

Wait for a specific duration:

```xml
<userTask id="reviewTask" name="Review Document"/>

<sequenceFlow id="flow1" sourceRef="reviewTask" targetRef="wait24Hours"/>

<intermediateCatchEvent id="wait24Hours">
  <timerEventDefinition>
    <timeDuration>PT24H</timeDuration>
  </timerEventDefinition>
</intermediateCatchEvent>

<sequenceFlow id="flow2" sourceRef="wait24Hours" targetRef="nextTask"/>
```

**Duration Formats:**
- `PT24H` - 24 hours
- `P7D` - 7 days
- `PT30M` - 30 minutes
- `PT5S` - 5 seconds

#### Date Timer

Wait until a specific date:

```xml
<intermediateCatchEvent id="waitUntilDate">
  <timerEventDefinition>
    <timeDate>${approvalDate}</timeDate>
  </timerEventDefinition>
</intermediateCatchEvent>
```

**Expression Support:**
```xml
<timeDate>${calculateDueDate()}</timeDate>
<timeDate>#{#dateCalculator.calculate()}</timeDate>
```

#### Cycle Timer

Repeat at intervals using iCalendar recurrence rules:

```xml
<intermediateCatchEvent id="cycleTimer">
  <timerEventDefinition>
    <timeCycle>R/10/PT1H</timeCycle>
  </timerEventDefinition>
</intermediateCatchEvent>
```

**Cycle Formats:**
- `R/10/PT1H` - Repeat 10 times, every 1 hour
- `R/PT5M` - Repeat indefinitely, every 5 minutes
- `R5/PT1D` - Repeat 5 times, every day
- `RRULE:FREQ=DAILY;INTERVAL=1` - iCalendar format

**Timer Event Types Summary:**
| Type | Element | Description | Example |
|------|---------|-------------|---------|
| Duration | `<timeDuration>` | Relative time period | `PT24H`, `P7D` |
| Date | `<timeDate>` | Absolute date/time | `${dueDate}` |
| Cycle | `<timeCycle>` | Recurrence pattern | `R5/PT1H` |

### 3. Signal Intermediate Events

#### Catch Signal Event

Wait for a global signal:

```xml
<intermediateCatchEvent id="waitForSignal">
  <signalEventDefinition signalRef="emergencySignal"/>
</intermediateCatchEvent>
```

**Signal Definition:**
```xml
<signal id="emergencySignal" name="Emergency Signal"/>
```

**Runtime API:**
```java
// Broadcast signal to all waiting processes
runtimeService.signalEventReceived("emergencySignal");
```

#### Throw Signal Event

Send a global signal:

```xml
<intermediateThrowEvent id="sendSignal">
  <signalEventDefinition signalRef="completionSignal"/>
</intermediateThrowEvent>
```

**Use Case:** Notify other processes of completion

### 4. Conditional Intermediate Events

Wait for a condition to become true:

```xml
<intermediateCatchEvent id="waitForCondition">
  <conditionalEventDefinition>
    <condition>${orderStatus == 'APPROVED'}</condition>
  </conditionalEventDefinition>
</intermediateCatchEvent>
```

**Configuration:**
- Condition is evaluated periodically
- Process continues when condition becomes true
- Can be interrupting or non-interrupting

### 5. Error Intermediate Events

Catch errors from downstream activities:

```xml
<intermediateCatchEvent id="catchError">
  <errorEventDefinition errorRef="PaymentError"/>
</intermediateCatchEvent>
```

**Error Definition:**
```xml
<error id="PaymentError" name="Payment Error" errorCode="PAY001"/>
```

### 6. Link Intermediate Events

Create internal process jumps:

#### Link Throw Event

```xml
<intermediateThrowEvent id="jumpToReview">
  <linkEventDefinition name="ReviewLink"/>
</intermediateThrowEvent>
```

#### Link Catch Event

```xml
<intermediateCatchEvent id="reviewEntryPoint">
  <linkEventDefinition name="ReviewLink"/>
</intermediateCatchEvent>
```

**Use Case:** Avoid complex flow lines, create clear jump points

### 7. Compensate Intermediate Events

Trigger compensation (undo) operations:

```xml
<intermediateThrowEvent id="compensatePayment">
  <compensateEventDefinition activityRef="processPayment"/>
</intermediateThrowEvent>
```

**Use Case:** Rollback completed activities

### 8. Escalation Intermediate Events

#### Catch Escalation

```xml
<intermediateCatchEvent id="catchEscalation">
  <escalationEventDefinition escalationCode="ESCALATION_001"/>
</intermediateCatchEvent>
```

#### Throw Escalation

```xml
<intermediateThrowEvent id="throwEscalation">
  <escalationEventDefinition escalationCode="ESCALATION_001"/>
</intermediateThrowEvent>
```

## Advanced Features

### Non-Interrupting Boundary Events

Events that don't cancel the current activity:

```xml
<!-- Non-interrupting timer boundary event on a UserTask -->
<userTask id="longRunningTask" name="Long Running Task">
  <boundaryEvent id="progressUpdate" cancelActivity="false">
    <timerEventDefinition>
      <timeDuration>PT1H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
</userTask>
```

### Multi-Instance with Events

```xml
<userTask id="reviewTask" name="Review">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${reviewers}">
    
    <startEvent id="miStart"/>
    <task id="miTask"/>
    <endEvent id="miEnd"/>
    
    <!-- Event within multi-instance -->
    <intermediateCatchEvent id="waitForAll">
      <timerEventDefinition>
        <timeDuration>PT30M</timeDuration>
      </timerEventDefinition>
    </intermediateCatchEvent>
    
  </multiInstanceLoopCharacteristics>
</userTask>
```

## Complete Examples

### Example 1: Order Processing with Timer

```xml
<process id="orderProcess" name="Order Processing">
  <startEvent id="start"/>
  
  <userTask id="receiveOrder" name="Receive Order"/>
  
  <serviceTask id="validateOrder" name="Validate Order"/>
  
  <!-- Wait 24 hours for payment -->
  <intermediateCatchEvent id="waitForPayment">
    <timerEventDefinition>
      <timeDuration>PT24H</timeDuration>
    </timerEventDefinition>
  </intermediateCatchEvent>
  
  <!-- Catch payment message -->
  <intermediateCatchEvent id="paymentReceived">
    <messageEventDefinition messageRef="paymentMessage"/>
  </intermediateCatchEvent>
  
  <exclusiveGateway id="paymentCheck"/>
  
  <serviceTask id="processOrder" name="Process Order"/>
  
  <!-- Send completion signal -->
  <intermediateThrowEvent id="notifyCompletion">
    <signalEventDefinition signalRef="orderComplete"/>
  </intermediateThrowEvent>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="receiveOrder"/>
  <sequenceFlow id="flow2" sourceRef="receiveOrder" targetRef="validateOrder"/>
  <sequenceFlow id="flow3" sourceRef="validateOrder" targetRef="waitForPayment"/>
  <sequenceFlow id="flow4" sourceRef="waitForPayment" targetRef="paymentCheck"/>
  <sequenceFlow id="flow5" sourceRef="paymentReceived" targetRef="paymentCheck"/>
  <sequenceFlow id="flow6" sourceRef="paymentCheck" targetRef="processOrder">
    <conditionExpression>${paymentReceived}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow7" sourceRef="processOrder" targetRef="notifyCompletion"/>
  <sequenceFlow id="flow8" sourceRef="notifyCompletion" targetRef="end"/>
</process>
```

### Example 2: Conditional Wait

```xml
<process id="approvalProcess" name="Approval Process">
  <startEvent id="start"/>
  
  <userTask id="submitRequest" name="Submit Request"/>
  
  <!-- Wait until approved -->
  <intermediateCatchEvent id="waitForApproval">
    <conditionalEventDefinition>
      <condition>${requestStatus == 'APPROVED'}</condition>
    </conditionalEventDefinition>
  </intermediateCatchEvent>
  
  <serviceTask id="processRequest" name="Process Request"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="submitRequest"/>
  <sequenceFlow id="flow2" sourceRef="submitRequest" targetRef="waitForApproval"/>
  <sequenceFlow id="flow3" sourceRef="waitForApproval" targetRef="processRequest"/>
  <sequenceFlow id="flow4" sourceRef="processRequest" targetRef="end"/>
</process>
```

## Runtime API

### Sending Messages

```java
// Correlate message with process instance
runtimeService.messageEventReceived("paymentMessage", processInstanceId);

// Correlate with variables
Map<String, Object> variables = Map.of("orderId", "12345");
runtimeService.messageEventReceived("paymentMessage", processInstanceId, variables);
```

### Sending Signals

```java
// Broadcast signal to all waiting processes
runtimeService.signalEventReceived("orderComplete");

// Signal with variables
Map<String, Object> signalVars = Map.of("orderId", "12345");
runtimeService.signalEventReceived("orderComplete", signalVars);
```

### Timer Management

```java
// Timers are automatic based on duration/date
// Can be managed via Job API for async timers
List<Job> timerJobs = managementService.createJobQuery()
    .processInstanceId(processInstanceId)
    .list();
```

## Best Practices

1. **Use Messages for External Triggers** - Clear integration points
2. **Use Signals for Internal Communication** - Cross-process coordination
3. **Timer Precision** - Understand timer accuracy limitations
4. **Conditional Events** - Use for polling external systems
5. **Link Events** - Simplify complex flow diagrams
6. **Non-Interrupting** - For logging and notifications
7. **Clear Naming** - Descriptive event and message names

## Common Pitfalls

- **Message Not Correlating** - Check message name matches
- **Timer Not Firing** - Verify duration format
- **Signal Broadcasting** - Affects ALL waiting processes
- **Conditional Polling** - Can cause performance issues
- **Link Name Mismatch** - Throw and catch must match
- **Error Handling** - Not catching all error types

## Related Documentation

- [Start Events](./start-event.md) - Process initiation
- [End Events](./end-event.md) - Process termination
- [Boundary Events](./boundary-event.md) - Activity-level events
- [Service Task](../elements/service-task.md) - Automated tasks
- [User Task](../elements/user-task.md) - Human tasks

---

**Last Updated: 2026
