---
sidebar_label: Start Event
slug: /bpmn/events/start-event
title: "Start Event"
description: "Complete guide to StartEvent elements for initiating process instances with various triggers and configurations."
---

# Start Event

Start Events **initiate process instances** and define how a process can be started. They are the entry points of BPMN processes and support multiple trigger types.

## Overview

```xml
<startEvent id="start1" name="Process Start"/>
```

**BPMN 2.0 Standard:** Partially Supported  
**Activiti Extensions:** Form key, initiator variable

## Key Features

### Standard BPMN Features
- **None** - Manual start (supported)
- **Message** - Event-driven start (supported as a main process start via `startProcessInstanceByMessage`, and within event sub-processes)
- **Timer** - Scheduled start (**supported** as a main process start — the engine schedules a `timer-start-event` timer job at deployment for each top-level timer start event; **not supported** within event sub-processes)
- **Signal** - Broadcast start (supported as a main process start event; **NOT supported** within event sub-processes)
- **Conditional** - Condition-based start (**NOT supported** — no `ConditionalEventDefinition` class exists)

**Unsupported as standalone process starts:** Conditional start events. Timer start events are supported for main processes (see section 3).
The `StartEventParseHandler` only assigns behaviors for: (1) message start events within event sub-processes, (2) error start events within event sub-processes, (3) none start events for main processes. A signal start event on a main process also receives no behavior from this handler — it is started through the signal subscription mechanism instead (see section 4). A timer start event on a main process likewise receives no behavior — it is started when its deployment-time timer job (type `timer-start-event`) fires (see section 3).

### Activiti Customizations
- **Form Key** - Startup form
- **Initiator** - Automatic variable
- **Multiple Start Events** - Any can trigger
- **Custom Properties** - Metadata

## Start Event Types

### 1. None Start Event (Manual)

```xml
<startEvent id="manualStart" name="Process Started"/>
```

**Runtime Usage:**
```java
// Start process manually
runtimeService.startProcessInstanceByKey("processKey");

// Start with variables
runtimeService.startProcessInstanceByKey("processKey", 
    Map.of("variable1", "value1"));
```

### 2. Message Start Event

```xml
<startEvent id="messageStart" name="Order Received">
  <messageEventDefinition messageRef="orderReceived"/>
</startEvent>
```

**Message Definition:**
```xml
<message id="orderReceived" name="Order Received"/>
```

**Runtime Usage:**
```java
// Start by message
ProcessInstance process = runtimeService
    .startProcessInstanceByMessage("orderReceived", 
        Map.of("orderId", "123"));
```

### 3. Timer Start Event

**Supported as a main process start event.** For every top-level `<startEvent>` with a `<timerEventDefinition>`, the engine schedules a timer job of type `timer-start-event` at deployment; when the timer fires, the engine starts a new process instance automatically — no manual API call is needed. The timer expression (`timeDate`, `timeDuration`, `timeCycle`) is resolved at deployment time, so a `timeDate` expression cannot reference process variables (no instance exists yet). Timer start events are **not supported** within event sub-processes.

```xml
<startEvent id="timerStart" name="Timer Start">
  <timerEventDefinition>
    <timeDuration>PT2H</timeDuration>
  </timerEventDefinition>
</startEvent>
```

The scheduled job is a regular timer job and can be listed through `managementService.createTimerJobQuery()`.

### 4. Signal Start Event

**Supported as a main process start event.** A top-level start event with a `<signalEventDefinition>` starts a new process instance when the signal is received. At deployment, the `EventSubscriptionManager` registers a signal subscription for the process definition, and at runtime `runtimeService.signalEventReceived(...)` triggers it: the engine's `SignalEventHandler` starts a new process instance (the subscription carries a `processDefinitionId` and no `executionId`).

```xml
<startEvent id="signalStart" name="Signal Start">
  <signalEventDefinition signalRef="orderSignal"/>
</startEvent>
```

**Signal Definition:**
```xml
<signal id="orderSignal" name="Order Signal"/>
```

**Runtime Usage:**
```java
// Start a new process instance by signal
runtimeService.signalEventReceived("orderSignal");

// Start with variables
runtimeService.signalEventReceived("orderSignal", Map.of("orderId", "123"));
```

**Signal start events inside event sub-processes are NOT supported** — the engine creates neither a subscription nor an activity behavior for them (see [Event SubProcess — Signal Event SubProcess (Not Supported)](../subprocesses/event-subprocess.md#5-signal-event-subprocess-not-supported)).

### 5. Conditional Start Event

**NOT supported.** There is no `ConditionalEventDefinition` model class, parse handler, or activity behavior in the Activiti codebase.

### 6. Multiple Event Definitions

**NOT supported on main process start events.** The parser only handles a single event definition on main process start events, and only for none start events (no event definitions).

Within event sub-processes, only message and error start event definitions are handled.

### 7. Candidate Starters (Who Can Start the Process)

Start event types control *how* a process is triggered; candidate starters control *who* may start it. They are declared on the `<process>` element and apply to every start event of the process.

**Activiti extension** — comma-separated `activiti:candidateStarterUsers` / `activiti:candidateStarterGroups` attributes, read by `ProcessParser` into the process's `candidateStarterUsers` / `candidateStarterGroups` lists:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="onboarding" name="Onboarding"
         activiti:candidateStarterUsers="user1, user2"
         activiti:candidateStarterGroups="group1, group2">
  <startEvent id="onboardingStart" name="Onboarding Started"/>
  ...
</process>
```

**Standard BPMN alternative** — a `<potentialStarter>` element as a child of `<process>`, read by `PotentialStarterParser`. `user(...)` entries authorize users, `group(...)` entries authorize groups, and plain values are treated as group names; comma-separated entries are allowed:

```xml
<process id="onboarding" name="Onboarding">
  <potentialStarter>
    <resourceAssignmentExpression>
      <formalExpression>user(bob), group(managers)</formalExpression>
    </resourceAssignmentExpression>
  </potentialStarter>
  <startEvent id="onboardingStart" name="Onboarding Started"/>
  ...
</process>
```

Each entry becomes a `candidate` identity link on the process definition at deployment — see [Process Definition Candidate Starters and Authorization](../../advanced/process-definition-authorization.md). The query side is `ProcessDefinitionQuery`:

```java
List<ProcessDefinition> startable = repositoryService
    .createProcessDefinitionQuery()
    .startableByUser("user1")
    .startableByGroups(List.of("group1", "group2"))
    .list();
```

When no candidate starters are declared at all, the Spring Boot starter adds the `"*"` (everyone) group by default — see [Default Authorization (Everyone Can Start)](../../advanced/process-definition-authorization.md#default-authorization-everyone-can-start).

## Activiti Customizations

### Form Key

```xml
<startEvent id="formStart" name="Start with Form" 
            activiti:formKey="startup-form.html"/>
```

**Use Cases:**
- Collect initial data
- User-friendly process initiation
- Dynamic variable input

### Initiator Variable

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<startEvent id="initiatorStart" name="Track Initiator"
            activiti:initiator="owner"/>
```

**`activiti:initiator` attribute:** the attribute value is the **name** of a process variable that the engine sets to the **authenticated user** at process start. `ProcessInstanceHelper` reads the attribute from the start event, and `ExecutionEntityManagerImpl` sets that variable to `Authentication.getAuthenticatedUserId()` when the process instance is created — e.g., `activiti:initiator="owner"` makes `owner` available as a process variable in all subsequent tasks and expressions. The variable name is not fixed; it is whatever the attribute says.

**`${initiator}` EL reference:** independently of the attribute, the EL name `initiator` always resolves to the process instance's start user (`startUserId`, the authenticated user at start) via `ProcessInitiatorELResolver`, so `${initiator}` works in any expression even when the attribute is absent.

### Form Properties

Form properties define the fields collected at process start time. They are configured via extension JSON, not as child elements of `<startEvent>`.

```xml
<startEvent id="formStart" name="Start with Form" 
            activiti:formKey="order-entry-form.html"/>
```

**order-entry-form-extensions.json:**
```json
{
  "extensions": {
    "orderProcess": {
      "formProperties": {
        "formStart": {
          "properties": [
            { "name": "teamSize", "type": "int", "required": true }
          ]
        }
      }
    }
  }
}
```

## Complete Examples

### Example 1: Multiple Start Events

```xml
<!-- Process can be started manually or by message -->

<startEvent id="manualStart" name="Manual Start"/>

<startEvent id="messageStart" name="Order Received">
  <messageEventDefinition messageRef="newOrder"/>
</startEvent>
```

**Note:** Conditional start events are NOT supported anywhere. Timer start events ARE supported as main process start events (see section 3) but NOT within event sub-processes. Signal start events ARE supported as main process start events (see section 4); they are NOT supported within event sub-processes.

### Example 2: Message Start with Form

```xml
<startEvent id="orderStart" name="Order Received" 
            activiti:formKey="order-entry-form.html">
  <messageEventDefinition messageRef="orderMessage"/>
</startEvent>

<message id="orderMessage" name="Order Message"/>
```

**Runtime Correlation:**
```java
// Start with correlated data
ProcessInstance process = runtimeService
    .startProcessInstanceByMessage("orderMessage", 
        Map.of(
            "orderId", "ORD-123",
            "customer", customerData,
            "items", orderItems
        ));
```

### Example 3: Message Start in Event Sub-Process

**Note:** Only message and error start events are supported inside event sub-processes (timer start events are not). For main processes, timer start is supported (see section 3).

```xml
<!-- Main process with none start -->
<startEvent id="mainStart"/>

<!-- Event sub-process triggered by message -->
<subProcess id="messageSubProcess" triggeredByEvent="true">
  <startEvent id="messageStart">
    <messageEventDefinition messageRef="triggerMessage"/>
  </startEvent>

  <message id="triggerMessage" name="Trigger Message"/>

  <serviceTask id="handleMessage" 
               name="Handle Message" 
               activiti:class="com.example.MessageHandler"
               activiti:async="true"/>

  <endEvent id="messageEnd"/>
  
  <sequenceFlow id="subFlow1" sourceRef="messageStart" targetRef="handleMessage"/>
  <sequenceFlow id="subFlow2" sourceRef="handleMessage" targetRef="messageEnd"/>
</subProcess>
```

### Example 4: Start with Initial Variables

Initial variables for a process are set at runtime, not through BPMN XML. Use the API to provide variables when starting the process:

```java
// Set initial variables when starting
Map<String, Object> variables = new HashMap<>();
variables.put("orderId", "ORD-123");
variables.put("customerName", "Acme Corp");

ProcessInstance process = runtimeService
    .startProcessInstanceByKey("orderProcess", variables);
```

Form properties on start events only define what the form collects — they do not set default values in the BPMN XML. Default values are configured in the form extension JSON or at runtime.

### Example 5: Form-Based Start Event

```xml
<startEvent id="taskForm" name="Start Task" 
            activiti:formKey="task-start-form.html"/>
```

The form collects initial data and passes it as process variables. The `activiti:formKey` attribute references the form definition.

## Runtime API Usage

### Starting Processes

```java
// By key
ProcessInstance process = runtimeService
    .startProcessInstanceByKey("processKey");

// By key with variables
ProcessInstance process = runtimeService
    .startProcessInstanceByKey("processKey", 
        Map.of("var1", "value1", "var2", 123));

// By message
ProcessInstance process = runtimeService
    .startProcessInstanceByMessage("messageName");

// By message with variables
ProcessInstance process = runtimeService
    .startProcessInstanceByMessage("messageName", 
        Map.of("correlationKey", "value"));

// By definition key
ProcessInstance process = runtimeService
    .startProcessInstanceById(processDefinitionId);
```

### Querying Startable Processes

```java
// Get process definitions
List<ProcessDefinition> definitions = repositoryService
    .createProcessDefinitionQuery()
    .active()
    .list();

// Check for message start events via the BpmnModel
BpmnModel model = repositoryService.getBpmnModel(definition.getId());
for (FlowElement element : model.getMainProcess().getFlowElements()) {
    if (element instanceof StartEvent) {
        StartEvent startEvent = (StartEvent) element;
        if (startEvent.getEventDefinitions() != null
                && startEvent.getEventDefinitions().get(0) instanceof MessageEventDefinition) {
            String messageRef = ((MessageEventDefinition) startEvent.getEventDefinitions().get(0)).getMessageRef();
        }
    }
}
```

## Best Practices

1. **Choose Appropriate Type:** Match start event to use case
2. **Multiple Starts:** Provide flexibility with multiple start events
3. **Message Correlation:** Design clear correlation keys
4. **Form Integration:** Use forms for data collection
5. **Documentation:** Describe how process should be started
6. **Security:** Restrict who can start sensitive processes
7. **Initiator Tracking:** Leverage automatic initiator variable

## Common Pitfalls

- **No Start Event:** Process must have at least one
- **Message Duplication:** Same message starting multiple instances
- **Missing Correlation:** Messages without proper correlation
- **Unsupported Types:** Conditional start events and multiple event definitions are not supported on main process start events. Timer start events **are** supported on main processes (see [Timer Start Event](#3-timer-start-event)) but **not** inside event sub-processes

## Related Documentation

- [Events Overview](./index.md)
- [Intermediate Events](./intermediate-events.md)
- [Intermediate Events](./intermediate-events.md#1-message-intermediate-events) - Message events during process execution
- [Intermediate Events](./intermediate-events.md#2-timer-intermediate-events) - Timer events during process execution
- [Runtime Service](../../api-reference/engine-api/runtime-service.md)

---
