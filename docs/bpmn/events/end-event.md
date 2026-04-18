---
sidebar_label: End Event
slug: /bpmn/events/end-event
title: "End Event"
description: "Complete guide to End Events in Activiti - terminating process instances and sub-processes with various completion types."
---

# End Event

End Events mark the **completion** of a process or sub-process. They can be simple terminators or trigger additional actions like sending messages, signals, or throwing errors.

## Overview

```xml
<!-- Simple end event -->
<endEvent id="end1" name="Process Complete"/>

<!-- Error end event -->
<endEvent id="errorEnd">
  <errorEventDefinition errorRef="ProcessError"/>
</endEvent>

<!-- Signal end event -->
<endEvent id="signalEnd">
  <signalEventDefinition signalRef="completionSignal"/>
</endEvent>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Multiple end event types, expressions

## Key Features

### End Event Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Terminator** | Normal completion | Standard process end |
| **Error** | End with error | Exception termination |
| **Cancel** | Cancel parent sub-process | Sub-process cancellation |
| **Signal** | Send signal on end | Cross-process notification |
| **Message** | Send message on end | External system notification |
| **Terminate** | End entire process instance | Force termination of all branches |
| **Escalation** | Escalate on end | Escalation workflows |

## Configuration Options

### 1. Terminator End Event

Simple process completion:

```xml
<userTask id="finalTask" name="Final Review"/>

<sequenceFlow id="flow1" sourceRef="finalTask" targetRef="endEvent"/>

<endEvent id="endEvent" name="Process Complete"/>
```

**Behavior:**
- Normal process completion
- No additional actions
- Process instance ends

### 2. Error End Event

End process with an error:

```xml
<serviceTask id="processData" name="Process Data"/>

<sequenceFlow id="flow1" sourceRef="processData" targetRef="errorEnd"/>

<endEvent id="errorEnd">
  <errorEventDefinition errorRef="ProcessingError"/>
</endEvent>
```

**Error Definition:**
```xml
<error id="ProcessingError" name="Processing Error" errorCode="PROC001"/>
```

**Runtime Behavior:**
- Throws error when reached
- Can be caught by error boundary events
- Process instance ends with error

### 3. Signal End Event

Send a global signal on completion:

```xml
<serviceTask id="completeOrder" name="Complete Order"/>

<sequenceFlow id="flow1" sourceRef="completeOrder" targetRef="signalEnd"/>

<endEvent id="signalEnd">
  <signalEventDefinition signalRef="orderCompleted"/>
</endEvent>
```

**Signal Definition:**
```xml
<signal id="orderCompleted" name="Order Completed"/>
```

**Use Case:**
- Notify other waiting processes
- Trigger parallel process instances
- Broadcast completion status

### 4. Message End Event

Send a message to external systems:

```xml
<userTask id="approveRequest" name="Approve Request"/>

<sequenceFlow id="flow1" sourceRef="approveRequest" targetRef="messageEnd"/>

<endEvent id="messageEnd">
  <messageEventDefinition messageRef="approvalMessage"/>
</endEvent>
```

**Message Definition:**
```xml
<message id="approvalMessage" name="Approval Message"/>
```

**Runtime API:**
```java
// Message can be correlated by external systems
// No direct API call needed - message is sent automatically
```

### 5. Terminate End Event

Force termination of entire process instance:

```xml
<parallelGateway id="parallelStart"/>

<sequenceFlow id="flow1" sourceRef="parallelStart" targetRef="branch1"/>
<sequenceFlow id="flow2" sourceRef="parallelStart" targetRef="branch2"/>
<sequenceFlow id="flow3" sourceRef="parallelStart" targetRef="branch3"/>

<!-- Terminate end in one branch -->
<endEvent id="terminateEnd">
  <terminateEventDefinition/>
</endEvent>

<sequenceFlow id="flow4" sourceRef="branch1" targetRef="terminateEnd"/>
```

**Behavior:**
- Ends ALL active branches
- Ignores waiting gateways
- Force terminates process instance
- Useful for early completion scenarios

### 6. Cancel End Event

Cancel parent sub-process:

```xml
<subProcess id="parentSubProcess" name="Parent Process">
  
  <startEvent id="subStart"/>
  
  <subProcess id="childSubProcess" name="Child Process">
    <startEvent id="childStart"/>
    <task id="childTask"/>
    
    <!-- Cancel end event -->
    <endEvent id="cancelEnd">
      <cancelEventDefinition/>
    </endEvent>
    
    <sequenceFlow id="childFlow1" sourceRef="childStart" targetRef="childTask"/>
    <sequenceFlow id="childFlow2" sourceRef="childTask" targetRef="cancelEnd"/>
  </subProcess>
  
  <endEvent id="subEnd"/>
  
  <sequenceFlow id="subFlow1" sourceRef="subStart" targetRef="childSubProcess"/>
  <sequenceFlow id="subFlow2" sourceRef="childSubProcess" targetRef="subEnd"/>
</subProcess>
```

**Behavior:**
- Cancels parent sub-process
- Triggers compensation if defined
- Only works within sub-process context

### 7. Escalation End Event

Escalate on process completion:

```xml
<endEvent id="escalationEnd">
  <escalationEventDefinition escalationCode="ESCALATION_001"/>
</endEvent>
```

**Use Case:**
- Notify management of completion
- Trigger escalation workflows
- Report to external systems

## Advanced Features

### Multiple End Events

A process can have multiple end events:

```xml
<exclusiveGateway id="decisionGateway"/>

<sequenceFlow id="flow1" sourceRef="decisionGateway" targetRef="successEnd">
  <conditionExpression>${success}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="flow2" sourceRef="decisionGateway" targetRef="errorEnd">
  <conditionExpression>${!success}</conditionExpression>
</sequenceFlow>

<endEvent id="successEnd">
  <signalEventDefinition signalRef="processSuccess"/>
</endEvent>

<endEvent id="errorEnd">
  <errorEventDefinition errorRef="ProcessError"/>
</endEvent>
```

### End Event with Variables

Set variables before ending:

```xml
<serviceTask id="setEndVariables" name="Set End Variables" activiti:class="com.example.VariableSetter"/>

<sequenceFlow id="flow1" sourceRef="setEndVariables" targetRef="endEvent"/>

<endEvent id="endEvent"/>
```

**Variable Setter Example:**
```java
public class VariableSetter implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        execution.setVariable("completionTime", new Date());
        execution.setVariable("status", "COMPLETED");
    }
}
```

## Complete Examples

### Example 1: Order Process with Multiple End Events

```xml
<process id="orderProcess" name="Order Processing">
  
  <startEvent id="start"/>
  
  <userTask id="receiveOrder" name="Receive Order"/>
  
  <serviceTask id="validateOrder" name="Validate Order"/>
  
  <exclusiveGateway id="validationCheck"/>
  
  <sequenceFlow id="valid" sourceRef="validationCheck" targetRef="processOrder">
    <conditionExpression>${valid}</conditionExpression>
  </sequenceFlow>
  
  <sequenceFlow id="invalid" sourceRef="validationCheck" targetRef="rejectEnd">
    <conditionExpression>${!valid}</conditionExpression>
  </sequenceFlow>
  
  <serviceTask id="processOrder" name="Process Order"/>
  
  <serviceTask id="shipOrder" name="Ship Order"/>
  
  <!-- Success end with signal -->
  <endEvent id="successEnd">
    <signalEventDefinition signalRef="orderShipped"/>
  </endEvent>
  
  <!-- Error end for rejection -->
  <endEvent id="rejectEnd">
    <errorEventDefinition errorRef="OrderRejected"/>
  </endEvent>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="receiveOrder"/>
  <sequenceFlow id="flow2" sourceRef="receiveOrder" targetRef="validateOrder"/>
  <sequenceFlow id="flow3" sourceRef="validateOrder" targetRef="validationCheck"/>
  <sequenceFlow id="flow4" sourceRef="processOrder" targetRef="shipOrder"/>
  <sequenceFlow id="flow5" sourceRef="shipOrder" targetRef="successEnd"/>
</process>
```

### Example 2: Parallel Process with Terminate End

```xml
<process id="parallelProcess" name="Parallel Processing">
  
  <startEvent id="start"/>
  
  <parallelGateway id="parallelStart"/>
  
  <!-- Branch 1: Quick completion -->
  <serviceTask id="quickTask" name="Quick Task"/>
  <endEvent id="terminateEnd">
    <terminateEventDefinition/>
  </endEvent>
  
  <!-- Branch 2: Long running (will be terminated) -->
  <serviceTask id="longTask" name="Long Running Task"/>
  <endEvent id="normalEnd"/>
  
  <!-- Branch 3: Another long running (will be terminated) -->
  <serviceTask id="anotherTask" name="Another Task"/>
  <endEvent id="anotherEnd"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="parallelStart"/>
  <sequenceFlow id="flow2" sourceRef="parallelStart" targetRef="quickTask"/>
  <sequenceFlow id="flow3" sourceRef="parallelStart" targetRef="longTask"/>
  <sequenceFlow id="flow4" sourceRef="parallelStart" targetRef="anotherTask"/>
  <sequenceFlow id="flow5" sourceRef="quickTask" targetRef="terminateEnd"/>
  <sequenceFlow id="flow6" sourceRef="longTask" targetRef="normalEnd"/>
  <sequenceFlow id="flow7" sourceRef="anotherTask" targetRef="anotherEnd"/>
</process>
```

**Behavior:**
- When `terminateEnd` is reached, ALL branches end immediately
- `longTask` and `anotherTask` are terminated
- Process instance ends

### Example 3: Sub-Process with Cancel End

```xml
<process id="mainProcess" name="Main Process">
  
  <startEvent id="start"/>
  
  <subProcess id="orderSubProcess" name="Order Sub-Process">
    <startEvent id="subStart"/>
    
    <serviceTask id="checkInventory" name="Check Inventory"/>
    
    <exclusiveGateway id="inventoryCheck"/>
    
    <sequenceFlow id="inStock" sourceRef="inventoryCheck" targetRef="processOrder">
      <conditionExpression>${inStock}</conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="outOfStock" sourceRef="inventoryCheck" targetRef="cancelEnd">
      <conditionExpression>${!inStock}</conditionExpression>
    </sequenceFlow>
    
    <serviceTask id="processOrder" name="Process Order"/>
    
    <endEvent id="subEnd"/>
    
    <!-- Cancel end event -->
    <endEvent id="cancelEnd">
      <cancelEventDefinition/>
    </endEvent>
    
    <sequenceFlow id="subFlow1" sourceRef="subStart" targetRef="checkInventory"/>
    <sequenceFlow id="subFlow2" sourceRef="checkInventory" targetRef="inventoryCheck"/>
    <sequenceFlow id="subFlow3" sourceRef="processOrder" targetRef="subEnd"/>
  </subProcess>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="mainFlow1" sourceRef="start" targetRef="orderSubProcess"/>
  <sequenceFlow id="mainFlow2" sourceRef="orderSubProcess" targetRef="end"/>
</process>
```

## Runtime API

### Querying Completed Processes

```java
// Get completed process instances
List<ProcessInstance> completed = runtimeService.createProcessInstanceQuery()
    .finished()
    .list();

// Get process instance with end event info
ProcessInstance instance = runtimeService.createProcessInstanceQuery()
    .processInstanceId("instanceId")
    .singleResult();
```

### Handling End Event Signals

```java
// Listen for signals from end events
// Signals are broadcast to all waiting processes
runtimeService.signalEventReceived("orderShipped");
```

## Best Practices

1. **Use Terminator for Normal End** - Simple completion
2. **Signal for Notifications** - Cross-process communication
3. **Terminate for Early Exit** - Force end all branches
4. **Error for Exceptions** - Clear error indication
5. **Multiple End Events** - Different completion scenarios
6. **Clear Naming** - Descriptive end event names
7. **Document Behavior** - Explain end event effects

## Common Pitfalls

- **Terminate Misuse** - Can unexpectedly kill parallel branches
- **Error Not Caught** - Errors may propagate unexpectedly
- **Signal Broadcasting** - Affects ALL waiting processes
- **Cancel Scope** - Only works in sub-process context
- **Multiple Terminators** - Can cause confusion
- **Missing End Events** - Process must have at least one

## Related Documentation

- [Start Events](./start-event.md) - Process initiation
- [Intermediate Events](./intermediate-events.md) - Events during execution
- [Boundary Events](./boundary-event.md) - Activity-level events
- [Gateways](../gateways/index.md) - Flow control
- [SubProcesses](../subprocesses/index.md) - Process containers

---

