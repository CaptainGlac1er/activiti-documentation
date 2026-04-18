---
sidebar_label: Receive Task
slug: /bpmn/elements/receive-task
title: "Receive Task"
description: "Complete guide to Receive Tasks in Activiti - waiting for external messages to continue process execution."
---

# Receive Task

Receive Tasks represent activities that **wait for an external message** before continuing. They are similar to intermediate message catch events but are modeled as tasks, making them visible in task lists and assignable to users or systems.

## Overview

```xml
<!-- Basic receive task -->
<receiveTask id="waitForMessage" name="Wait for External Message">
  <messageEventDefinition messageRef="externalMessage"/>
</receiveTask>

<!-- Receive task with initialization -->
<receiveTask id="waitForApproval" name="Wait for Approval" activiti:initializeVariables="true">
  <messageEventDefinition messageRef="approvalMessage"/>
</receiveTask>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Variable initialization, async support

## Key Features

### Receive Task Characteristics

| Feature | Description |
|---------|-------------|
| **Message Waiting** | Pauses execution until message arrives |
| **Task Visibility** | Appears in task list (unlike intermediate events) |
| **Assignable** | Can have assignee/candidates |
| **Variable Init** | Can initialize variables on creation |
| **Async Support** | Can run asynchronously |

### Differences from Service Task

| Aspect | Service Task | Receive Task |
|--------|--------------|--------------|
| **Execution** | Active - calls external system | Passive - waits for message |
| **Blocking** | Blocks until call completes | Blocks until message arrives |
| **Use Case** | Outbound integration | Inbound integration |
| **Task List** | Usually not visible | Visible as pending task |

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

**Runtime API:**
```java
// Complete receive task by sending message
runtimeService.messageEventReceived("responseMessage", processInstanceId);

// Or via TaskRuntime (Activiti API)
processRuntime.receiveMessage(processInstanceId, new ReceiveMessagePayloadBuilder()
    .messageName("responseMessage")
    .build());
```

### 2. Receive Task with Variable Initialization

Initialize variables when task is created:

```xml
<receiveTask id="waitForPayment" name="Wait for Payment" 
             activiti:initializeVariables="true">
  <messageEventDefinition messageRef="paymentMessage"/>
  
  <extensionElements>
    <!-- Variables to initialize -->
    <activiti:field name="variables">
      <activiti:map>
        <entry key="waitStarted" value="${new Date()}"/>
        <entry key="paymentTimeout" value="PT24H"/>
      </activiti:map>
    </activiti:field>
  </extensionElements>
</receiveTask>
```

**Behavior:**
- `initializeVariables="true"` creates task variables on receive task creation
- Useful for tracking when wait started
- Can set default timeout values

### 3. Receive Task with Assignee

Assign to a user or group (for monitoring):

```xml
<receiveTask id="waitForApproval" name="Wait for Manager Approval" 
             activiti:assignee="${managerId}"
             activiti:initializeVariables="true">
  <messageEventDefinition messageRef="approvalMessage"/>
  
  <potentialOwners>
    <resourceRole idRef="approvalRole"/>
  </potentialOwners>
</receiveTask>

<resourceRole id="approvalRole" name="Approvers">
  <assignment>
    <formalExpression>${approvalGroup}</formalExpression>
  </assignment>
</resourceRole>
```

**Use Case:**
- Task appears in assignee's task list
- Shows what's waiting
- Can be claimed/reassigned if needed

### 4. Async Receive Task

Run receive task asynchronously:

```xml
<receiveTask id="waitForExternalSystem" name="Wait for External System" 
             activiti:async="true">
  <messageEventDefinition messageRef="externalMessage"/>
</receiveTask>
```

**Benefits:**
- Doesn't block database transaction
- Message correlation happens in async job executor
- Better for long waits

### 5. Receive Task with Timer Boundary

Add timeout handling:

```xml
<receiveTask id="waitForResponse" name="Wait for Response">
  <messageEventDefinition messageRef="responseMessage"/>
  
  <!-- Timeout after 24 hours -->
  <boundaryEvent id="responseTimeout" attachedToRef="waitForResponse" 
                 cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT24H</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
</receiveTask>

<sequenceFlow id="timeoutFlow" sourceRef="responseTimeout" targetRef="handleTimeout"/>
<sequenceFlow id="responseFlow" sourceRef="waitForResponse" targetRef="processResponse"/>
```

## Complete Examples

### Example 1: Request-Response Pattern

```xml
<process id="requestResponseProcess" name="Request-Response Process">
  
  <startEvent id="start"/>
  
  <!-- Send request to external system -->
  <serviceTask id="sendRequest" name="Send Request" 
               activiti:class="com.example.ExternalSystemClient">
    <extensionElements>
      <activiti:field name="operation" stringValue="createOrder"/>
    </extensionElements>
  </serviceTask>
  
  <!-- Wait for acknowledgment -->
  <receiveTask id="waitForAck" name="Wait for Acknowledgment" 
               activiti:initializeVariables="true">
    <messageEventDefinition messageRef="ackMessage"/>
    
    <extensionElements>
      <activiti:field name="variables">
        <activiti:map>
          <entry key="requestTime" value="${new Date()}"/>
        </activiti:map>
      </activiti:field>
    </extensionElements>
  </receiveTask>
  
  <!-- Timeout handling -->
  <boundaryEvent id="ackTimeout" attachedToRef="waitForAck" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT5M</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
  <!-- Process acknowledgment -->
  <serviceTask id="processAck" name="Process Acknowledgment" 
               activiti:class="com.example.AckProcessor"/>
  
  <!-- Handle timeout -->
  <serviceTask id="handleTimeout" name="Handle Timeout" 
               activiti:class="com.example.TimeoutHandler"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="sendRequest"/>
  <sequenceFlow id="flow2" sourceRef="sendRequest" targetRef="waitForAck"/>
  <sequenceFlow id="flow3" sourceRef="waitForAck" targetRef="processAck"/>
  <sequenceFlow id="flow4" sourceRef="ackTimeout" targetRef="handleTimeout"/>
  <sequenceFlow id="flow5" sourceRef="processAck" targetRef="end"/>
  <sequenceFlow id="flow6" sourceRef="handleTimeout" targetRef="end"/>
  
  <!-- Message definition -->
  <message id="ackMessage" name="Acknowledgment Message"/>
  
</process>
```

**Runtime Usage:**
```java
// Start process
String processInstanceId = runtimeService.startProcessInstanceByKey("requestResponseProcess");

// External system sends acknowledgment
runtimeService.messageEventReceived("ackMessage", processInstanceId);
```

### Example 2: Multi-Step External Integration

```xml
<process id="multiStepIntegration" name="Multi-Step External Integration">
  
  <startEvent id="start"/>
  
  <!-- Step 1: Submit data -->
  <serviceTask id="submitData" name="Submit Data" 
               activiti:class="com.example.DataSubmitter"/>
  
  <!-- Step 2: Wait for validation -->
  <receiveTask id="waitForValidation" name="Wait for Validation" 
               activiti:assignee="${validatorUser}"
               activiti:initializeVariables="true">
    <messageEventDefinition messageRef="validationComplete"/>
  </receiveTask>
  
  <!-- Step 3: Process validated data -->
  <serviceTask id="processValidated" name="Process Validated Data" 
               activiti:class="com.example.DataProcessor"/>
  
  <!-- Step 4: Wait for approval -->
  <receiveTask id="waitForApproval" name="Wait for Approval" 
               activiti:candidateGroups="${approvalGroup}">
    <messageEventDefinition messageRef="approvalReceived"/>
  </receiveTask>
  
  <!-- Step 5: Finalize -->
  <serviceTask id="finalize" name="Finalize" 
               activiti:class="com.example.Finalizer"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="submitData"/>
  <sequenceFlow id="flow2" sourceRef="submitData" targetRef="waitForValidation"/>
  <sequenceFlow id="flow3" sourceRef="waitForValidation" targetRef="processValidated"/>
  <sequenceFlow id="flow4" sourceRef="processValidated" targetRef="waitForApproval"/>
  <sequenceFlow id="flow5" sourceRef="waitForApproval" targetRef="finalize"/>
  <sequenceFlow id="flow6" sourceRef="finalize" targetRef="end"/>
  
  <message id="validationComplete" name="Validation Complete"/>
  <message id="approvalReceived" name="Approval Received"/>
  
</process>
```

### Example 3: Receive Task with Correlation

```xml
<process id="correlatedProcess" name="Correlated Message Process">
  
  <startEvent id="start"/>
  
  <userTask id="enterOrderId" name="Enter Order ID"/>
  
  <!-- Wait for order confirmation with correlation -->
  <receiveTask id="waitForConfirmation" name="Wait for Order Confirmation" 
               activiti:async="true">
    <messageEventDefinition messageRef="orderConfirmation"/>
  </receiveTask>
  
  <serviceTask id="processConfirmation" name="Process Confirmation" 
               activiti:class="com.example.ConfirmationProcessor"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="enterOrderId"/>
  <sequenceFlow id="flow2" sourceRef="enterOrderId" targetRef="waitForConfirmation"/>
  <sequenceFlow id="flow3" sourceRef="waitForConfirmation" targetRef="processConfirmation"/>
  <sequenceFlow id="flow4" sourceRef="processConfirmation" targetRef="end"/>
  
  <!-- Message with correlation key -->
  <message id="orderConfirmation" name="Order Confirmation">
    <itemBasedOperation>
      <dataInputAssociation>
        <sourceRef>Message</sourceRef>
        <targetRef>orderData</targetRef>
      </dataInputAssociation>
    </itemBasedOperation>
  </message>
  
</process>
```

**Runtime with Correlation:**
```java
// Correlate message with variables
Map<String, Object> businessKeys = Map.of("orderId", "12345");
runtimeService.correlateMessage("orderConfirmation", businessKeys);
```

## Runtime API

### Completing Receive Task

```java
// Engine API - message correlation
RuntimeService runtimeService = processEngine.getRuntimeService();

// Simple message correlation
runtimeService.messageEventReceived("messageName", processInstanceId);

// With variables
Map<String, Object> variables = Map.of("data", "value");
runtimeService.messageEventReceived("messageName", processInstanceId, variables);

// Activiti API
@Autowired
private ProcessRuntime processRuntime;

processRuntime.receiveMessage(new ReceiveMessagePayloadBuilder()
    .processInstanceId(processInstanceId)
    .messageName("messageName")
    .variables(variables)
    .build());
```

### Querying Receive Tasks

```java
// Receive tasks appear in task query
TaskService taskService = processEngine.getTaskService();

List<Task> receiveTasks = taskService.createTaskQuery()
    .taskDefinitionKey("waitForResponse")
    .list();

// Check task type
for (Task task : receiveTasks) {
    String taskType = task.getTaskDefinitionKey();
    // Receive tasks are visible like any other task
}
```

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

### 3. Use Async for Long Waits

```xml
<!-- GOOD: Async for long waits -->
<receiveTask id="waitForApproval" name="Wait for Approval" activiti:async="true">
  <messageEventDefinition messageRef="approval"/>
</receiveTask>

<!-- BAD: Sync blocks transaction -->
<receiveTask id="waitForApproval" name="Wait for Approval">
  <messageEventDefinition messageRef="approval"/>
</receiveTask>
```

### 4. Initialize Variables for Tracking

```xml
<!-- GOOD: Track when wait started -->
<receiveTask id="waitForData" name="Wait for Data" 
             activiti:initializeVariables="true">
  <messageEventDefinition messageRef="dataReceived"/>
  <extensionElements>
    <activiti:field name="variables">
      <activiti:map>
        <entry key="waitStarted" value="${new Date()}"/>
      </activiti:map>
    </activiti:field>
  </extensionElements>
</receiveTask>
```

### 5. Clear Message Names

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

### 4. Blocking Database Transaction

**Problem:** Sync receive task holds DB connection

```xml
<!-- WRONG: Long wait blocks transaction -->
<receiveTask id="waitForDays" name="Wait Days">
  <messageEventDefinition messageRef="lateResponse"/>
</receiveTask>

<!-- CORRECT: Use async -->
<receiveTask id="waitForDays" name="Wait Days" activiti:async="true">
  <messageEventDefinition messageRef="lateResponse"/>
</receiveTask>
```

## Comparison with Alternatives

### Receive Task vs Intermediate Message Catch Event

| Aspect | Receive Task | Intermediate Message Catch Event |
|--------|--------------|----------------------------------|
| **Task List** | Visible | Not visible |
| **Assignable** | Yes | No |
| **Human Monitoring** | Yes | No |
| **Use Case** | Monitored waits | Pure system waits |
| **Variables** | Can initialize | No initialization |

### When to Use Each

**Use Receive Task when:**
- You need to monitor waiting tasks
- Tasks should appear in dashboards
- Users might need to intervene
- You want to track wait times per task

**Use Intermediate Message Catch Event when:**
- Pure system-to-system integration
- No human monitoring needed
- Simple message waiting
- Don't want task list clutter

## Related Documentation

- [Service Task](./service-task.md) - Active external calls
- [Intermediate Events](../events/intermediate-events.md) - Message catch events
- [Boundary Events](../events/boundary-event.md) - Timeout handling
- [Message Events](../events/index.md) - Message definitions

---

**Last Updated:** 2026  
**Source:** `ReceiveTaskActivityBehavior.java`
