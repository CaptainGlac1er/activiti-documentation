---
sidebar_label: Gateways Overview
slug: /bpmn/gateways/index
title: "Gateways Overview"
description: "Complete guide to BPMN gateway elements for process branching, merging, and flow control in Activiti workflows."
---

# Gateways

Gateways control the **divergence and convergence of sequence flows** in a BPMN process. They determine which paths are taken based on conditions, parallel execution, or events.

## Overview

```xml
<exclusiveGateway id="gateway1" name="Decision Point"/>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Enhanced condition evaluation

## Gateway Types

### 1. [Exclusive Gateway (XOR)](./exclusive-gateway.md)
Only **one path** is taken based on conditions.

```xml
<exclusiveGateway id="decision" name="Approval Decision"/>
```

**Use Cases:**
- If-then-else logic
- Mutually exclusive choices
- Conditional branching

### 2. [Parallel Gateway (AND)](./parallel-gateway.md)
**All paths** are taken simultaneously.

```xml
<parallelGateway id="parallel" name="Parallel Processing"/>
```

**Use Cases:**
- Concurrent operations
- Splitting work into parallel tasks
- Waiting for multiple completions

### 3. [Inclusive Gateway (OR)](./inclusive-gateway.md)
**One or more paths** can be taken.

```xml
<inclusiveGateway id="inclusive" name="Multiple Options"/>
```

**Use Cases:**
- Multiple independent conditions
- Optional parallel paths
- Complex decision logic

### 4. [Event-Based Gateway](./event-gateway.md)
Route based on **events** (messages, timers, errors).

```xml
<eventBasedGateway id="eventDecision" name="Wait for Event"/>
```

**Use Cases:**
- Asynchronous decisions
- Competing events
- Timeout handling

### 5. [Complex Gateway](./complex-gateway.md)
Advanced routing with **conditions and dependencies**.

```xml
<complexGateway id="complex" name="Complex Decision"/>
```

**Use Cases:**
- Multi-condition evaluation
- Completion dependencies
- Advanced flow control

## Common Features

### Condition Expressions

All gateways (except parallel) support conditions on outgoing sequence flows:

```xml
<sequenceFlow id="flow1" sourceRef="gateway1" targetRef="task1">
  <conditionExpression>${amount > 1000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="flow2" sourceRef="gateway1" targetRef="task2">
  <conditionExpression>${amount <= 1000}</conditionExpression>
</sequenceFlow>
```

**Expression Types:**
- **EL Expressions:** `${variable.method()}`
- **SpEL Expressions:** `#{#variable.method()}`
- **Formal Expressions:** `<formalExpression>expression</formalExpression>`

### Default Flow

Specify a default path when no conditions match:

```xml
<exclusiveGateway id="gateway1" activiti:defaulFlow="flow1"/>
```

Or on the gateway element:
```xml
<exclusiveGateway id="gateway1">
  <default>flow1</default>
</exclusiveGateway>
```

### Multi-Instance Integration

Gateways work seamlessly with multi-instance activities:

```xml
<parallelGateway id="split"/>

<userTask id="reviewTask">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
  </multiInstanceLoopCharacteristics>
</userTask>

<parallelGateway id="join"/>
```

## Complete Examples

### Example 1: Exclusive Gateway with Multiple Conditions

```xml
<!-- Decision based on order amount -->
<exclusiveGateway id="amountDecision" name="Order Amount Check"/>

<sequenceFlow id="smallOrder" sourceRef="amountDecision" targetRef="standardProcessing">
  <conditionExpression>${orderAmount < 100}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="mediumOrder" sourceRef="amountDecision" targetRef="managerApproval">
  <conditionExpression>${orderAmount >= 100 && orderAmount < 1000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="largeOrder" sourceRef="amountDecision" targetRef="directorApproval">
  <conditionExpression>${orderAmount >= 1000}</conditionExpression>
</sequenceFlow>

<!-- Default flow (should not be reached with above conditions) -->
<sequenceFlow id="defaultFlow" sourceRef="amountDecision" targetRef="errorHandling">
  <conditionExpression>${false}</conditionExpression>
</sequenceFlow>
```

### Example 2: Parallel Gateway for Concurrent Processing

```xml
<!-- Split into parallel paths -->
<parallelGateway id="parallelSplit" name="Start Parallel Processing"/>

<sequenceFlow id="flow1" sourceRef="parallelSplit" targetRef="checkInventory"/>
<sequenceFlow id="flow2" sourceRef="parallelSplit" targetRef="validatePayment"/>
<sequenceFlow id="flow3" sourceRef="parallelSplit" targetRef="notifyCustomer"/>

<!-- Service tasks execute in parallel -->
<serviceTask id="checkInventory" name="Check Inventory" activiti:async="true"/>
<serviceTask id="validatePayment" name="Validate Payment" activiti:async="true"/>
<serviceTask id="notifyCustomer" name="Notify Customer" activiti:async="true"/>

<!-- Wait for all to complete -->
<parallelGateway id="parallelJoin" name="Wait for All"/>

<sequenceFlow id="join1" sourceRef="checkInventory" targetRef="parallelJoin"/>
<sequenceFlow id="join2" sourceRef="validatePayment" targetRef="parallelJoin"/>
<sequenceFlow id="join3" sourceRef="notifyCustomer" targetRef="parallelJoin"/>
```

### Example 3: Inclusive Gateway for Optional Paths

```xml
<!-- Multiple independent conditions -->
<inclusiveGateway id="notificationDecision" name="Notification Options"/>

<sequenceFlow id="emailFlow" sourceRef="notificationDecision" targetRef="sendEmail">
  <conditionExpression>${sendEmail}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="smsFlow" sourceRef="notificationDecision" targetRef="sendSMS">
  <conditionExpression>${sendSMS}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="pushFlow" sourceRef="notificationDecision" targetRef="sendPush">
  <conditionExpression>${sendPushNotification}</conditionExpression>
</sequenceFlow>

<!-- All selected notifications execute in parallel -->
<serviceTask id="sendEmail" name="Send Email" activiti:type="mail"/>
<serviceTask id="sendSMS" name="Send SMS" activiti:class="com.example.SmsService"/>
<serviceTask id="sendPush" name="Send Push" activiti:class="com.example.PushService"/>

<!-- Wait for selected paths to complete -->
<inclusiveGateway id="notificationJoin" name="Notifications Complete"/>
```

### Example 4: Event-Based Gateway for Asynchronous Decisions

```xml
<!-- Wait for one of several events -->
<eventBasedGateway id="eventDecision" name="Wait for Response" instant="false"/>

<!-- Message event: customer responds -->
<sequenceFlow id="responseFlow" sourceRef="eventDecision" targetRef="messageCatch"/>
<intermediateCatchEvent id="messageCatch">
  <messageEventDefinition messageRef="customerResponse"/>
</intermediateCatchEvent>

<!-- Timer event: timeout after 24 hours -->
<sequenceFlow id="timeoutFlow" sourceRef="eventDecision" targetRef="timerCatch"/>
<intermediateCatchEvent id="timerCatch">
  <timerEventDefinition>
    <timeDuration>PT24H</timeDuration>
  </timerEventDefinition>
</intermediateCatchEvent>

<!-- Non-interrupting: send reminder (doesn't block) -->
<sequenceFlow id="reminderFlow" sourceRef="eventDecision" targetRef="sendReminder" 
              activiti:gatewayDirection="Dividing"/>
<serviceTask id="sendReminder" name="Send Reminder" activiti:async="true"/>
```

## Best Practices

1. **Always Define Conditions:** Ensure all paths have clear conditions
2. **Use Default Flows:** Provide fallback when no conditions match
3. **Balance Parallel Gateways:** Ensure split and join are balanced
4. **Avoid Complex Logic:** Keep conditions simple and readable
5. **Name Gateways Clearly:** Use descriptive names for decisions
6. **Document Decision Logic:** Add documentation for complex gateways
7. **Test All Paths:** Verify each branch executes correctly
8. **Use Async for Parallel:** Prevent blocking in parallel branches
9. **Handle Timeouts:** Add timer events for long waits
10. **Monitor Gateway Usage:** Track which paths are taken most

## Common Pitfalls

- **Missing Conditions:** All flows should have conditions (except parallel)
- **Unbalanced Gateways:** Split/join must match in type and count
- **Deadlocks:** Circular dependencies in complex gateways
- **No Default Flow:** Unmatched conditions cause errors
- **Complex Conditions:** Hard to maintain and debug
- **Parallel Without Join:** Lost synchronizations
- **Event Gateway Misuse:** Wrong gateway type for scenario

## Runtime API Usage

### Inspecting Gateway Execution

```java
// Get active executions at gateway
List<Execution> executions = runtimeService.createExecutionQuery()
    .activityId("gateway1")
    .list();

// Check which path was taken
List<HistoricActivityInstance> activities = historyService.createHistoricActivityInstanceQuery()
    .processInstanceId(processInstanceId)
    .activityIdIn("flow1", "flow2", "flow3")
    .list();
```

### Dynamic Gateway Configuration

```java
// Change gateway behavior at runtime (advanced)
DynamicBpmnService dynamicBpmnService = processEngine.getDynamicBpmnService();

// Add/remove sequence flows
dynamicBpmnService.addSequenceFlow(processDefinitionId, "gateway1", "newTarget");
```

## Related Documentation

- [Exclusive Gateway](./exclusive-gateway.md)
- [Parallel Gateway](./parallel-gateway.md)
- [Inclusive Gateway](./inclusive-gateway.md)
- [Event-Based Gateway](./event-gateway.md)
- [Complex Gateway](./complex-gateway.md)
- [Sequence Flows](../elements/sequence-flows.md)
- [Process Validation](../../api-reference/engine-api/process-validation.md)

---

**Last Updated: 2026
