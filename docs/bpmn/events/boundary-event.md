---
sidebar_label: Boundary Event
slug: /bpmn/events/boundary-event
title: "Boundary Event"
description: "Complete guide to Boundary Events in Activiti - exception handling at activity level with interrupting and non-interrupting modes."
---

# Boundary Event

Boundary Events are **attached to activities** and handle exceptions, timeouts, or other events that occur during activity execution. They provide **fine-grained error handling** at the task level.

## 📋 Overview

```xml
<userTask id="task1" name="Process Order">
  <!-- Boundary event attached to task -->
  <boundaryEvent id="timeout" attachedToRef="task1" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT1H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
</userTask>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ Multiple event types, interrupting/non-interrupting

**Important:** The `attachedToRef` attribute is **required** and must reference the ID of the activity the boundary event is attached to.

## 🎯 Key Features

### Boundary Event Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Error** | Catch errors from activity | Exception handling |
| **Timer** | Timeout handling | Activity deadlines |
| **Message** | External trigger | Cancel/stop requests |
| **Signal** | Global event | System-wide triggers |
| **Compensate** | Undo operations | Transaction rollback |
| **Escalation** | Escalate issues | Management notification |

### Interrupting vs Non-Interrupting

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Interrupting** | Cancels activity | Timeouts, errors, cancellations |
| **Non-Interrupting** | Runs parallel | Logging, notifications, tracking |

## 📝 Configuration Options

### 1. Timer Boundary Event

Handle activity timeouts:

```xml
<userTask id="approvalTask" name="Approve Request" activiti:assignee="${manager}">
  
  <!-- Interrupting timer - cancels task after 24 hours -->
  <boundaryEvent id="approvalTimeout" attachedToRef="approvalTask" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT24H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
</userTask>

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
- **Cycle Timer:** `<timeCycle>RRULE:FREQ=DAILY;INTERVAL=1</timeCycle>` - iCalendar recurrence

### 2. Non-Interrupting Timer Boundary Event

Log activity without canceling:

```xml
<serviceTask id="longRunningTask" name="Process Data" activiti:class="com.example.DataProcessor">
  
  <!-- Non-interrupting timer - logs progress every hour -->
  <boundaryEvent id="progressLog" attachedToRef="longRunningTask" cancelActivity="false">
    <timerEventDefinition>
      <timeDuration>PT1H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
</serviceTask>

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
<serviceTask id="paymentTask" name="Process Payment" activiti:class="com.example.PaymentService">
  
  <!-- Error boundary event -->
  <boundaryEvent id="paymentError" attachedToRef="paymentTask" cancelActivity="true">
    <errorEventDefinition errorRef="PaymentError"/>
  </boundaryEvent>
  
</serviceTask>

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
<userTask id="reviewTask" name="Review Document" activiti:assignee="${reviewer}">
  
  <!-- Message boundary event for cancellation -->
  <boundaryEvent id="cancelReview" attachedToRef="reviewTask" cancelActivity="true">
    <messageEventDefinition messageRef="cancelMessage"/>
  </boundaryEvent>
  
</userTask>

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
<serviceTask id="processingTask" name="Process Data" activiti:class="com.example.DataProcessor">
  
  <!-- Signal boundary event for emergency stop -->
  <boundaryEvent id="emergencyStop" cancelActivity="true">
    <signalEventDefinition signalRef="emergencySignal"/>
  </boundaryEvent>
  
</serviceTask>

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
<serviceTask id="bookFlight" name="Book Flight" activiti:class="com.example.FlightBookingService" 
             activiti:cancelEndDefinition="true">
  
  <!-- Compensation boundary event -->
  <boundaryEvent id="compensateBooking" cancelActivity="false">
    <compensateEventDefinition activityRef="bookFlight"/>
  </boundaryEvent>
  
</serviceTask>

<sequenceFlow id="compFlow" sourceRef="compensateBooking" targetRef="cancelFlight"/>
<serviceTask id="cancelFlight" name="Cancel Flight Booking" activiti:class="com.example.FlightCancellationService"/>
```

### 7. Multiple Boundary Events

Attach multiple boundary events to one activity:

```xml
<userTask id="criticalTask" name="Critical Operation" activiti:assignee="${operator}">
  
  <!-- Timer boundary for timeout -->
  <boundaryEvent id="timeout" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT2H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
  <!-- Message boundary for cancellation -->
  <boundaryEvent id="cancel" cancelActivity="true">
    <messageEventDefinition messageRef="cancelMessage"/>
  </boundaryEvent>
  
  <!-- Error boundary for exceptions -->
  <boundaryEvent id="error" cancelActivity="true">
    <errorEventDefinition errorRef="OperationError"/>
  </boundaryEvent>
  
  <!-- Non-interrupting timer for logging -->
  <boundaryEvent id="logProgress" cancelActivity="false">
    <timerEventDefinition>
      <timeDuration>PT30M</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
</userTask>
```

**Behavior:**
- First triggering event wins (for interrupting events)
- Non-interrupting events run in parallel
- Multiple timeout logs can occur

## 🔧 Advanced Features

### Boundary Event on Multi-Instance

```xml
<userTask id="reviewTask" name="Review">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${reviewers}">
    
    <boundaryEvent id="reviewTimeout" cancelActivity="true">
      <timerEventDefinition>
        <timeDuration>PT4H</timeDuration>
      </timerEventDefinition>
    </boundaryEvent>
    
  </multiInstanceLoopCharacteristics>
</userTask>
```

**Behavior:**
- Each instance has its own timeout
- Timeout cancels only that instance
- Other instances continue

### Nested Boundary Events

```xml
<subProcess id="subProcess1" name="Sub Process">
  <startEvent id="subStart"/>
  
  <userTask id="subTask" name="Sub Task">
    <boundaryEvent id="subTimeout" cancelActivity="true">
      <timerEventDefinition>
        <timeDuration>PT1H</timeDuration>
      </timerEventDefinition>
    </boundaryEvent>
  </userTask>
  
  <endEvent id="subEnd"/>
  
  <!-- Boundary event on subprocess -->
  <boundaryEvent id="subProcessTimeout" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT8H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
  <sequenceFlow id="subFlow1" sourceRef="subStart" targetRef="subTask"/>
  <sequenceFlow id="subFlow2" sourceRef="subTask" targetRef="subEnd"/>
</subProcess>
```

## 💡 Complete Examples

### Example 1: Order Processing with Timeouts

```xml
<process id="orderProcess" name="Order Processing">
  
  <startEvent id="start"/>
  
  <userTask id="receiveOrder" name="Receive Order" activiti:assignee="${orderClerk}">
    
    <!-- Timeout after 2 hours -->
    <boundaryEvent id="receiveTimeout" cancelActivity="true">
      <timerEventDefinition>
        <timeDuration>PT2H</timeDuration>
      </timerEventDefinition>
    </boundaryEvent>
  </userTask>
  
  <userTask id="escalateReceive" name="Escalate Order Reception"/>
  
  <serviceTask id="validateOrder" name="Validate Order" activiti:class="com.example.OrderValidator">
    
    <!-- Error boundary for validation errors -->
    <boundaryEvent id="validationError" cancelActivity="true">
      <errorEventDefinition errorRef="ValidationError"/>
    </boundaryEvent>
  </serviceTask>
  
  <userTask id="handleValidationError" name="Handle Validation Error"/>
  
  <userTask id="approveOrder" name="Approve Order" activiti:assignee="${manager}">
    
    <!-- Multiple boundary events -->
    <boundaryEvent id="approvalTimeout" cancelActivity="true">
      <timerEventDefinition>
        <timeDuration>PT24H</timeDuration>
      </timerEventDefinition>
    </boundaryEvent>
    
    <boundaryEvent id="approvalCancel" cancelActivity="true">
      <messageEventDefinition messageRef="cancelApproval"/>
    </boundaryEvent>
  </userTask>
  
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
<process id="paymentProcess" name="Payment Processing">
  
  <startEvent id="start"/>
  
  <serviceTask id="reserveFunds" name="Reserve Funds" 
               activiti:class="com.example.FundsReservation"
               activiti:cancelEndDefinition="true">
    
    <boundaryEvent id="reservationError" cancelActivity="true">
      <errorEventDefinition errorRef="ReservationError"/>
    </boundaryEvent>
  </serviceTask>
  
  <serviceTask id="processPayment" name="Process Payment"
               activiti:class="com.example.PaymentProcessor"
               activiti:cancelEndDefinition="true">
    
    <boundaryEvent id="paymentError" cancelActivity="true">
      <errorEventDefinition errorRef="PaymentError"/>
    </boundaryEvent>
  </serviceTask>
  
  <serviceTask id="confirmPayment" name="Confirm Payment" activiti:class="com.example.PaymentConfirmation"/>
  
  <!-- Compensation event subprocess -->
  <eventSubProcess id="compensationHandler" triggeredByCompensation="true">
    <startEvent id="compStart">
      <compensateEventDefinition activityRef="processPayment"/>
    </startEvent>
    
    <serviceTask id="refundPayment" name="Refund Payment" activiti:class="com.example.PaymentRefund"/>
    
    <endEvent id="compEnd"/>
    
    <sequenceFlow id="compFlow1" sourceRef="compStart" targetRef="refundPayment"/>
    <sequenceFlow id="compFlow2" sourceRef="refundPayment" targetRef="compEnd"/>
  </eventSubProcess>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="reserveFunds"/>
  <sequenceFlow id="flow2" sourceRef="reserveFunds" targetRef="processPayment"/>
  <sequenceFlow id="flow3" sourceRef="processPayment" targetRef="confirmPayment"/>
  <sequenceFlow id="flow4" sourceRef="confirmPayment" targetRef="end"/>
</process>
```

## 🔍 Runtime API

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

## 📊 Best Practices

1. **Use Interrupting for Critical Events** - Timeouts, errors, cancellations
2. **Use Non-Interrupting for Logging** - Progress tracking, audit trails
3. **Clear Timeout Values** - Reasonable timeout durations
4. **Multiple Boundary Events** - Handle different scenarios
5. **Error Definitions** - Clear error codes and messages
6. **Compensation Logic** - Define undo operations
7. **Testing** - Test all boundary event scenarios

## ⚠️ Common Pitfalls

- **Too Many Boundary Events** - Can make process complex
- **Conflicting Events** - Multiple interrupting events competing
- **Missing Error Handling** - Not catching all error types
- **Timer Precision** - Timers may not fire exactly on time
- **Non-Interrupting Confusion** - Understanding parallel execution
- **Compensation Order** - Reverse order of completion

## 🔗 Related Documentation

- [Start Events](./start-event.md) - Process initiation
- [Intermediate Events](./intermediate-events.md) - Events during execution
- [End Events](./end-event.md) - Process termination
- [Event SubProcess](../subprocesses/event-subprocess.md) - Event-triggered subprocesses
- [User Task](../elements/user-task.md) - Human tasks with boundary events

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
