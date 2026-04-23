---
sidebar_label: Receive Task
slug: /bpmn/elements/receive-task
title: "Receive Task"
description: "Complete guide to Receive Tasks in Activiti - waiting for external messages to continue process execution."
---

# Receive Task

Receive Tasks represent activities that **wait for an external message** before continuing. They are similar to intermediate message catch events but are modeled as tasks for semantic clarity in BPMN diagrams.

## Overview

```xml
<!-- Basic receive task -->
<receiveTask id="waitForMessage" name="Wait for External Message">
  <messageEventDefinition messageRef="externalMessage"/>
</receiveTask>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Async support

## Key Features

### Receive Task Characteristics

| Feature | Description |
|---------|-------------|
| **Wait State** | Pauses execution until signaled to continue |
| **Task Visibility** | Does **not** appear in task list (same as intermediate events) |
| **Continuation** | Advanced via `RuntimeService.trigger(executionId)` |

### Differences from Service Task

| Aspect | Service Task | Receive Task |
|--------|--------------|--------------|
| **Execution** | Active - calls external system | Passive - waits for signal |
| **Blocking** | Blocks until call completes | Waits until signaled |
| **Use Case** | Outbound integration | Inbound / request-response |
| **Task List** | Not visible | Not visible |

## Configuration Options

### 1. Basic Receive Task

Wait for a message:

```xml
<serviceTask id="sendRequest" name="Send Request" activiti:class="com.example.RequestSender"/>

<sequenceFlow id="flow1" sourceRef="sendRequest" targetRef="waitForResponse"/>

<receiveTask id="waitForResponse" name="Wait for Response">
  <messageEventDefinition messageRef="responseMessage"/>
</receiveTask>

<sequenceFlow id="flow2" sourceRef="waitForResponse" targetRef="processResponse"/>
```

**Message Definition:**
```xml
<message id="responseMessage" name="Response Message"/>
```

## Runtime API

### Signaling Receive Task

```java
// Find the execution waiting at the receive task
RuntimeService runtimeService = processEngine.getRuntimeService();

Execution execution = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .activityId("waitForResponse")
    .singleResult();

// Trigger to continue (no variables)
runtimeService.trigger(execution.getId());

// Trigger with variables
Map<String, Object> variables = Map.of("data", "value");
runtimeService.trigger(execution.getId(), variables);
```

**Note:** Receive tasks do **not** create `TaskEntity` instances, so they cannot be queried via `TaskService.createTaskQuery()`. Use `RuntimeService.createExecutionQuery().activityId(...)` to find the waiting execution.

## Best Practices

### 1. Use for Inbound Integration

```xml
<!-- GOOD: Waiting for external system -->
<receiveTask id="waitForPayment" name="Wait for Payment">
  <messageEventDefinition messageRef="paymentReceived"/>
</receiveTask>

<!-- BAD: Use service task for outbound -->
<receiveTask id="callExternalApi" name="Call API">
  <!-- Should be serviceTask -->
</receiveTask>
```

### 2. Always Add Timeouts

```xml
<!-- GOOD: With timeout -->
<receiveTask id="waitForResponse" name="Wait for Response">
  <messageEventDefinition messageRef="response"/>
  <boundaryEvent id="timeout" attachedToRef="waitForResponse" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT1H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
</receiveTask>

<!-- BAD: No timeout - can wait forever -->
<receiveTask id="waitForResponse" name="Wait for Response">
  <messageEventDefinition messageRef="response"/>
</receiveTask>
```

### 3. Track Waiting Executions

```java
// Find waiting receive tasks via execution query
List<Execution> waiting = runtimeService.createExecutionQuery()
    .activityId("waitForApproval")
    .list();
```

### 4. Clear Message Names

```xml
<!-- GOOD: Descriptive -->
<message id="paymentConfirmation" name="Payment Confirmation"/>

<!-- BAD: Generic -->
<message id="msg1" name="Message"/>
```

## Common Pitfalls

### 1. Confusing with Service Task

**Problem:** Using receive task for outbound calls

```xml
<!-- WRONG: Receive task doesn't call anything -->
<receiveTask id="callApi" name="Call API">
  <messageEventDefinition messageRef="apiResponse"/>
</receiveTask>

<!-- CORRECT: Use service task -->
<serviceTask id="callApi" name="Call API" 
             activiti:class="com.example.ApiClient"/>
```

### 2. Missing Message Definition

**Problem:** Forgetting to define the message

```xml
<!-- WRONG: Message not defined -->
<receiveTask id="waitForMsg" name="Wait">
  <messageEventDefinition messageRef="undefinedMessage"/>
</receiveTask>

<!-- CORRECT: Define message -->
<message id="undefinedMessage" name="Undefined Message"/>

<receiveTask id="waitForMsg" name="Wait">
  <messageEventDefinition messageRef="undefinedMessage"/>
</receiveTask>
```

### 3. No Timeout Handling

**Problem:** Process stuck if message never arrives

```xml
<!-- WRONG: No timeout -->
<receiveTask id="waitForResponse" name="Wait">
  <messageEventDefinition messageRef="response"/>
</receiveTask>

<!-- CORRECT: Add boundary timer -->
<receiveTask id="waitForResponse" name="Wait">
  <messageEventDefinition messageRef="response"/>
  <boundaryEvent id="timeout" attachedToRef="waitForResponse" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT1H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
</receiveTask>
```

### 4. Assuming Message Subscription

**Problem:** Expecting `messageEventReceived()` to work on a receive task

```xml
<!-- The messageEventDefinition inside a receiveTask does NOT create a message subscription -->
<receiveTask id="waitForResponse" name="Wait">
  <messageEventDefinition messageRef="response"/>
</receiveTask>
```

**Solution:** Use `RuntimeService.trigger(executionId)` to advance the receive task, or use an intermediate message catch event if you need actual message correlation.

## Comparison with Alternatives

### Receive Task vs Intermediate Message Catch Event

| Aspect | Receive Task | Intermediate Message Catch Event |
|--------|--------------|----------------------------------|
| **Creates TaskEntity** | No | No |
| **Task List Visible** | No | No |
| **Message Subscription** | No | Yes |
| **Continuation** | `RuntimeService.trigger(executionId)` | `RuntimeService.messageEventReceived(name, processInstanceId)` |
| **Use Case** | Wait for external trigger / request-response | Wait for specific named message |

### When to Use Each

**Use Receive Task when:**
- Modeling a request-response pattern (service task sends, receive task waits)
- You want semantic clarity in the BPMN diagram that the process is "waiting"
- You'll advance the process programmatically via `RuntimeService.trigger(executionId)`

**Use Intermediate Message Catch Event when:**
- You need actual message subscription and correlation
- Multiple processes may be waiting for different messages
- You want the engine to match incoming messages to waiting executions

## Related Documentation

- [Service Task](./service-task.md) - Active external calls
- [Intermediate Events](../events/intermediate-events.md) - Message catch events
- [Boundary Events](../events/boundary-event.md) - Timeout handling
- [Message Events](../events/index.md) - Message definitions

---

**Source:** `ReceiveTaskActivityBehavior.java`
