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

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Multiple start event types, candidate starters

## Key Features

### Standard BPMN Features
- **None** - Manual start (supported)
- **Message** - Event-driven start (supported within event sub-processes)
- **Timer** - Scheduled start (**only within event sub-processes**, not as main process start)
- **Signal** - Broadcast start (**only within event sub-processes**, not as main process start)
- **Conditional** - Condition-based start (**NOT supported** — no `ConditionalEventDefinition` class exists)

**Unsupported as standalone process starts:** Timer, Signal, Conditional, and Multiple event definitions.
The `StartEventParseHandler` only handles: (1) message start events within event sub-processes, (2) error start events within event sub-processes, (3) none start events for main processes.

### Activiti Customizations
- **Form Key** - Startup form
- **Initiator** - Automatic variable
- **Multiple Start Events** - Any can trigger
- **Async Timer** - Background scheduling
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

**NOT supported as a main process start event.** Timer start events are only supported within event sub-processes.

The `StartEventParseHandler` does not assign any behavior to timer start events on main processes. If you define a timer start event outside of an event sub-process, the process will be treated as having a none start event.

### 4. Signal Start Event

**NOT supported as a main process start event.** Signal start events are only supported within event sub-processes.

The `StartEventParseHandler` does not assign any behavior to signal start events on main processes.

### 5. Conditional Start Event

**NOT supported.** There is no `ConditionalEventDefinition` model class, parse handler, or activity behavior in the Activiti codebase.

### 6. Multiple Event Definitions

**NOT supported on main process start events.** The parser only handles a single event definition on main process start events, and only for none start events (no event definitions).

Within event sub-processes, only message and error start event definitions are handled.

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
<startEvent id="initiatorStart" name="Track Initiator"/>
```

**Automatic Variable:**
- `initiator` - Set to current user when process starts
- Available in all subsequent tasks

## Complete Examples

### Example 1: Multiple Start Events

```xml
<!-- Process can be started manually or by message -->

<startEvent id="manualStart" name="Manual Start"/>

<startEvent id="messageStart" name="Order Received">
  <messageEventDefinition messageRef="newOrder"/>
</startEvent>
```

**Note:** Timer, signal, and conditional start events are only supported within event sub-processes. Use a none start event or message start event for main process initiation.

### Example 2: Message Start with Correlation

```xml
<startEvent id="orderStart" name="Order Received">
  <messageEventDefinition messageRef="orderMessage"/>
  <activiti:formKey="order-entry-form.html"/>
</startEvent>

<message id="orderMessage" name="Order Message">
  <itemDefinition id="orderItem" structureRef="Order"/>
</message>
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

### Example 3: Scheduled Process via Event Sub-Process

**Note:** Timer start events are not supported as main process starts. Use an event sub-process instead:

```xml
<!-- Main process with none start -->
<startEvent id="mainStart"/>

<!-- Event sub-process for scheduled triggering -->
<eventSubProcess id="scheduledSubProcess">
  <startEvent id="timerStart">
    <timerEventDefinition>
      <timeCycle>RRULE:FREQ=DAILY;HOUR=23;MINUTE=0</timeCycle>
    </timerEventDefinition>
  </startEvent>

  <serviceTask id="generateReport" 
               name="Generate Report" 
               activiti:class="com.example.ReportGenerator"
               activiti:async="true"/>

  <endEvent id="reportEnd"/>
  
  <sequenceFlow id="subFlow1" sourceRef="timerStart" targetRef="generateReport"/>
  <sequenceFlow id="subFlow2" sourceRef="generateReport" targetRef="reportEnd"/>
</eventSubProcess>
```

### Example 4: Conditional Start

**NOT supported.** There is no `ConditionalEventDefinition` class in the Activiti codebase. Conditional start events will not function.

### Example 5: Start Event with Initial Variables

```xml
<startEvent id="initializedStart" name="Initialized Start" 
            activiti:formKey="initialization-form.html">
  
  <activiti:formProperty name="projectName" type="string" required="true"/>
  <activiti:formProperty name="budget" type="double" required="true"/>
  <activiti:formProperty name="deadline" type="date" required="true"/>
  <activiti:formProperty name="teamSize" type="int">
    <activiti:default>5</activiti:default>
  </activiti:formProperty>
</startEvent>
```

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

// Check for message start events
List<Message> messages = repositoryService
    .createMessageQuery()
    .processDefinitionKey("processKey")
    .list();
```

## Best Practices

1. **Choose Appropriate Type:** Match start event to use case
2. **Multiple Starts:** Provide flexibility with multiple start events
3. **Message Correlation:** Design clear correlation keys
4. **Timer Performance:** Avoid too many concurrent timers
5. **Form Integration:** Use forms for data collection
6. **Documentation:** Describe how process should be started
7. **Security:** Restrict who can start sensitive processes
8. **Initiator Tracking:** Leverage automatic initiator variable

## Common Pitfalls

- **No Start Event:** Process must have at least one
- **Conflicting Timers:** Multiple timers causing issues
- **Message Duplication:** Same message starting multiple instances
- **Timer Memory:** Too many scheduled timers
- **Missing Correlation:** Messages without proper correlation
- **Complex Conditions:** Hard to test conditional starts

## Related Documentation

- [Events Overview](./index.md)
- [Intermediate Events](./intermediate-events.md)
- [Intermediate Events](./intermediate-events.md#1-message-intermediate-events) - Message events during process execution
- [Intermediate Events](./intermediate-events.md#2-timer-intermediate-events) - Timer events during process execution
- [Runtime Service](../../api-reference/engine-api/runtime-service.md)

---

