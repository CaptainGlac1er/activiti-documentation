---
sidebar_label: Process Event Listeners
slug: /bpmn/reference/process-event-listeners
title: "Process Event Listeners"
description: "Complete guide to process-level event listeners in Activiti - hooking BPMN process definitions into the engine event system with class, delegate expression, and throw-event listeners."
---

# Process Event Listeners

Process Event Listeners let you **hook a process definition into the Activiti engine event system** without writing any Java wiring code. A listener declared in the process XML is registered when the process is deployed and receives every engine event (`ActivitiEvent`) that the engine dispatches and that belongs to that process definition.

Unlike [Execution Listeners](./execution-listeners.md) and [Task Listeners](./task-listeners.md), which react to *BPMN element lifecycle events* (start/end/take, create/assignment/complete), process event listeners react to the engine's **entity and execution event types** — `PROCESS_STARTED`, `TASK_ASSIGNED`, `ACTIVITY_STARTED`, `ENTITY_CREATED`, and so on.

## Overview

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="orderProcess" name="Order Process">
  <extensionElements>
    <!-- Receive every engine event that belongs to this process -->
    <activiti:eventListener class="com.example.OrderAuditListener"/>

    <!-- Receive a single event type, resolved to a Spring bean -->
    <activiti:eventListener events="TASK_ASSIGNED" delegateExpression="${taskAssignedNotifier}"/>
  </extensionElements>

  <startEvent id="start"/>
  <endEvent id="end"/>
  <sequenceFlow id="flow1" sourceRef="start" targetRef="end"/>
</process>
```

**BPMN 2.0 Standard:** ❌ Activiti Extension
**Placement:** Inside the `<extensionElements>` of the **top-level** `<process>` element

**How it works at runtime:**

1. **Deploy time** — `BpmnParse` creates an `ActivitiEventSupport` for the deployed `BpmnModel` and `ProcessParseHandler` registers each `<activiti:eventListener>` on it, scoped to the event types listed in the `events` attribute.
2. **Runtime** — whenever the engine dispatches an event (task assigned, activity started, entity created, ...), the `ActivitiEventDispatcher` first notifies the global, engine-wide listeners and then resolves the `BpmnModel` of the event's process definition and dispatches the same event to the listeners declared in that process's XML.

A listener declared in process A therefore **only receives events that carry process A's definition id** — other process definitions never see them.

**Important Attributes:**
- `events` - Comma-separated list of event type names the listener should receive (see [Valid Event Types](#valid-event-types)). Omit for *all* events.
- `class` - Fully qualified class name implementing `org.activiti.engine.delegate.event.ActivitiEventListener`
- `delegateExpression` - EL expression resolving to a Spring bean implementing `ActivitiEventListener`
- `entityType` - Restrict delivery to events about a specific entity type (see [entityType filtering](#entitytype-filtering))
- `throwEvent` - Make the listener *throw a BPMN event* (`signal`, `globalSignal`, `message`, `error`) instead of running custom code (see [Throw-Event Listeners](#throw-event-listeners))

## XML Syntax

### Class-Based Listener

Reference a fully qualified class name. The class is instantiated by the engine via reflection (with a no-arg constructor) when the first event is dispatched, and the instance is cached and reused for that process definition:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="orderProcess" name="Order Process">
  <extensionElements>
    <activiti:eventListener
      events="PROCESS_STARTED,PROCESS_COMPLETED"
      class="com.example.OrderLifecycleListener"/>
  </extensionElements>

  <startEvent id="start"/>
  <endEvent id="end"/>
  <sequenceFlow id="flow1" sourceRef="start" targetRef="end"/>
</process>
```

The class must implement `org.activiti.engine.delegate.event.ActivitiEventListener`:

```java
package com.example;

import org.activiti.engine.delegate.event.ActivitiEvent;
import org.activiti.engine.delegate.event.ActivitiEventListener;
import org.activiti.engine.delegate.event.ActivitiEventType;

public class OrderLifecycleListener implements ActivitiEventListener {

  @Override
  public void onEvent(ActivitiEvent event) {
    if (event.getType() == ActivitiEventType.PROCESS_STARTED) {
      System.out.println("Process started: " + event.getProcessInstanceId());
    } else if (event.getType() == ActivitiEventType.PROCESS_COMPLETED) {
      System.out.println("Process completed: " + event.getProcessInstanceId());
    }
  }

  /**
   * When false, exceptions thrown by onEvent() are logged and swallowed,
   * and the engine operation continues. When true, the exception aborts
   * the operation that dispatched the event.
   */
  @Override
  public boolean isFailOnException() {
    return false;
  }
}
```

**Requirements:**
- Class must implement `org.activiti.engine.delegate.event.ActivitiEventListener`
- Class must be on the classpath and have a no-arg constructor
- Spring annotations (`@Autowired`, `@Component`, ...) are **not** processed — the engine instantiates the class with plain reflection

### Delegate Expression Listener

Reference a Spring bean (or any bean resolvable by the engine's expression manager):

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<process id="orderProcess" name="Order Process">
  <extensionElements>
    <activiti:eventListener
      events="TASK_ASSIGNED"
      delegateExpression="${taskAssignedNotifier}"/>
  </extensionElements>

  <startEvent id="start"/>
  <userTask id="approval" name="Approval"/>
  <endEvent id="end"/>
  <sequenceFlow id="flow1" sourceRef="start" targetRef="approval"/>
  <sequenceFlow id="flow2" sourceRef="approval" targetRef="end"/>
</process>
```

```java
@Component("taskAssignedNotifier")
public class TaskAssignedNotifier implements ActivitiEventListener {

  @Override
  public void onEvent(ActivitiEvent event) {
    if (event instanceof ActivitiEntityEvent) {
      Object task = ((ActivitiEntityEvent) event).getEntity();
      System.out.println("Task assigned: " + task);
    }
  }

  @Override
  public boolean isFailOnException() {
    return true; // failure aborts the task-assignment operation
  }
}
```

**Note:** the expression is resolved **without an execution variable scope** — process variables are not available. The expression must name a bean directly (e.g. `${taskAssignedNotifier}`); it cannot be assembled dynamically from process variables.

### Full Attribute Reference

| Attribute | Required | Description |
|-----------|----------|-------------|
| `class` | one of `class`, `delegateExpression`, `throwEvent` | Fully qualified class name of an `ActivitiEventListener` implementation |
| `delegateExpression` | one of `class`, `delegateExpression`, `throwEvent` | EL expression (`${...}`) resolving to an `ActivitiEventListener` bean |
| `throwEvent` | one of `class`, `delegateExpression`, `throwEvent` | `signal`, `globalSignal`, `message`, or `error` — throw a BPMN event instead of running custom code |
| `signalName` | with `throwEvent="signal"` or `throwEvent="globalSignal"` | Name of the signal to throw (must match a `<signal>` / signal catch event) |
| `messageName` | with `throwEvent="message"` | Name of the message to throw (must match a `<message>` / message catch event) |
| `errorCode` | with `throwEvent="error"` | Error code propagated to a boundary error event or error event sub-process. A handler without a matching code accepts any error |
| `events` | optional | Comma-separated `ActivitiEventType` names. Omit (or leave empty) to receive **all** event types. No spaces after commas |
| `entityType` | optional | `attachment`, `comment`, `execution`, `identity-link`, `job`, `process-definition`, `process-instance`, `task` — only deliver events about this entity type |

**Not supported on `<activiti:eventListener>`** (the parser ignores these, unlike `<activiti:executionListener>`/`<activiti:taskListener>`): `expression`, the singular `event` attribute, `onTransaction`, `customPropertiesResolver*` attributes, and `<activiti:field>` child elements.

When more than one of `class`, `delegateExpression`, and `throwEvent` is present, `class` wins, then `delegateExpression`, then `throwEvent`.

### The Listener Interface

```java
package org.activiti.engine.delegate.event;

public interface ActivitiEventListener {

  /** Called when an event has been fired. */
  void onEvent(ActivitiEvent event);

  /** Whether the engine operation should fail when onEvent() throws. */
  boolean isFailOnException();
}
```

`ActivitiEvent` exposes `getType()` (`ActivitiEventType`), `getExecutionId()`, `getProcessInstanceId()`, and `getProcessDefinitionId()`. Entity events implement `ActivitiEntityEvent`, which adds `getEntity()`:

```java
package org.activiti.engine.delegate.event;

public interface ActivitiEntityEvent extends ActivitiEvent {
  Object getEntity();
}
```

### entityType Filtering

When `entityType` is set, the engine only delivers events that target an entity of that type. This lets one process run several listeners, each responsible for one entity kind:

```xml
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<extensionElements>
  <activiti:eventListener events="ENTITY_CREATED" delegateExpression="${jobListener}" entityType="job"/>
  <activiti:eventListener events="ENTITY_CREATED" delegateExpression="${taskListener}" entityType="task"/>
</extensionElements>
```

Valid values (mapped to engine types):

| `entityType` value | Event entity |
|--------------------|--------------|
| `attachment` | `org.activiti.engine.task.Attachment` |
| `comment` | `org.activiti.engine.task.Comment` |
| `execution` | `org.activiti.engine.runtime.Execution` |
| `identity-link` | `org.activiti.engine.task.IdentityLink` |
| `job` | `org.activiti.engine.runtime.Job` |
| `process-definition` | `org.activiti.engine.repository.ProcessDefinition` |
| `process-instance` | `org.activiti.engine.runtime.ProcessInstance` |
| `task` | `org.activiti.engine.task.Task` |

Any other value fails deployment with `ActivitiIllegalArgumentException: Unsupported entity-type for an ActivitiEventListener: <value>`.

## Throw-Event Listeners

Instead of running custom code, a listener can **throw a BPMN event** into the process when a given engine event occurs. This is useful to translate engine-level occurrences (a task was assigned, an activity completed) into BPMN event handling (signal, message, error) without any Java listener:

```xml
<activiti:eventListener events="TASK_ASSIGNED" throwEvent="signal" signalName="Signal"/>
```

| `throwEvent` value | Throws | Delivery scope |
|--------------------|--------|----------------|
| `signal` | A signal event | Signal catch events **of the same process instance** |
| `globalSignal` | A signal event | **All** process instances subscribing to the signal (tenant-scoped when the event carries a process definition) |
| `message` | A message event | Message catch events **of the same process instance** |
| `error` | A BPMN error | Nearest boundary error event / error event sub-process (or the call activity parent) that matches the `errorCode` |

### Signal Example

```xml
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:activiti="http://activiti.org/bpmn">

  <signal id="mySignal" name="Signal"/>

  <process id="signalProcess">
    <extensionElements>
      <activiti:eventListener events="TASK_ASSIGNED" throwEvent="signal" signalName="Signal"/>
    </extensionElements>

    <startEvent id="start"/>
    <sequenceFlow id="flow1" sourceRef="start" targetRef="subProcess"/>

    <subProcess id="subProcess">
      <startEvent id="subStart"/>
      <sequenceFlow id="flow2" sourceRef="subStart" targetRef="subTask"/>
      <userTask id="subTask"/>
      <sequenceFlow id="flow3" sourceRef="subTask" targetRef="subEnd"/>
      <endEvent id="subEnd"/>
    </subProcess>

    <boundaryEvent id="boundary" attachedToRef="subProcess" cancelActivity="false">
      <signalEventDefinition signalRef="mySignal"/>
    </boundaryEvent>
    <sequenceFlow id="flow4" sourceRef="boundary" targetRef="boundaryTask"/>

    <userTask id="boundaryTask"/>
    <sequenceFlow id="flow5" sourceRef="subProcess" targetRef="end"/>
    <endEvent id="end"/>
  </process>
</definitions>
```

Assigning the task in `subProcess` dispatches `TASK_ASSIGNED`, which triggers the listener to throw the `Signal` signal. The non-interrupting boundary signal event on `subProcess` catches it and the process continues at `boundaryTask`.

Because signal delivery is **process-instance scoped** for `throwEvent="signal"`, the triggering event must belong to an ongoing process instance — otherwise the engine fails the operation with `Cannot throw process-instance scoped signal, since the dispatched event is not part of an ongoing process instance`. Use `throwEvent="globalSignal"` to reach every process instance instead of one: if the triggering event carries a process definition with a non-empty tenant, only that tenant's subscribers are signaled; otherwise all signal subscribers across all tenants are reached.

**Keep the trigger narrow:** the listener fires on *every* `TASK_ASSIGNED` event of this process definition — assigning `boundaryTask` would throw the signal again and trigger the boundary once more. In a production process, choose an event type that occurs once per lifecycle (or use a custom listener that filters, e.g. by activity id) instead of a broad event on a re-entrant path.

### Message Example

```xml
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:activiti="http://activiti.org/bpmn">

  <message id="myMessage" name="Message"/>

  <process id="messageProcess">
    <extensionElements>
      <activiti:eventListener events="TASK_ASSIGNED" throwEvent="message" messageName="Message"/>
    </extensionElements>

    <startEvent id="start"/>
    <sequenceFlow id="flow1" sourceRef="start" targetRef="subProcess"/>

    <subProcess id="subProcess">
      <startEvent id="subStart"/>
      <sequenceFlow id="flow2" sourceRef="subStart" targetRef="subTask"/>
      <userTask id="subTask"/>
      <sequenceFlow id="flow3" sourceRef="subTask" targetRef="subEnd"/>
      <endEvent id="subEnd"/>
    </subProcess>

    <boundaryEvent id="boundary" attachedToRef="subProcess" cancelActivity="false">
      <messageEventDefinition messageRef="myMessage"/>
    </boundaryEvent>
    <sequenceFlow id="flow4" sourceRef="boundary" targetRef="boundaryTask"/>

    <userTask id="boundaryTask"/>
    <sequenceFlow id="flow5" sourceRef="subProcess" targetRef="end"/>
    <endEvent id="end"/>
  </process>
</definitions>
```

Message delivery is also **process-instance scoped** and requires the triggering event to carry a process instance id. As with the signal example, the listener fires on every `TASK_ASSIGNED` event of the process — assign the trigger event type carefully on re-entrant paths.

### Error Example

```xml
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:activiti="http://activiti.org/bpmn">

  <error id="escalationError" errorCode="123"/>

  <process id="errorProcess">
    <extensionElements>
      <activiti:eventListener events="TASK_ASSIGNED" throwEvent="error" errorCode="123"/>
    </extensionElements>

    <startEvent id="start"/>
    <sequenceFlow id="flow1" sourceRef="start" targetRef="userTask"/>

    <userTask id="userTask"/>

    <boundaryEvent id="catchError" attachedToRef="userTask">
      <errorEventDefinition errorRef="escalationError"/>
    </boundaryEvent>
    <sequenceFlow id="flow3" sourceRef="catchError" targetRef="end"/>

    <sequenceFlow id="flow4" sourceRef="userTask" targetRef="end"/>
    <endEvent id="end"/>
  </process>
</definitions>
```

The engine resolves the execution from the triggering event's `executionId` and propagates the error from there. If the event carries no execution (or the execution can no longer be found), the operation fails with `No execution context active and event is not related to an execution. No compensation event can be thrown.`. Matching follows the usual BPMN error rules: a handler whose `errorCode` equals the thrown code matches, and a handler **without** an error code accepts any error. A `errorRef` that names a declared `<error>` element is resolved to that element's `errorCode`. If no matching handler exists in the process (or, for called processes, in the parent process), a `BpmnError` is raised — the assignment operation fails and no state change is committed.

Here the boundary error event is **interrupting** (the default), so assigning `userTask` cancels the task and the process ends. If the process had another task whose assignment would re-trigger the listener, the second throw would fail with a `BpmnError` unless an error handler exists on that path — scope the trigger event type accordingly.

**All four throw-variants are fail-on-exception listeners**: if delivery fails, the engine operation that dispatched the triggering event is aborted.

## Valid Event Types

The `events` attribute accepts any comma-separated list of names from the engine's `ActivitiEventType` enum. Names are matched exactly — an unknown name fails deployment with `ActivitiIllegalArgumentException: Invalid event-type: <name>`.

### Entity Lifecycle Events

| Event | Meaning |
|-------|---------|
| `ENTITY_CREATED` | A new entity is created |
| `ENTITY_INITIALIZED` | A new entity is created **and** all child entities created as a result are created and initialized |
| `ENTITY_UPDATED` | An existing entity is updated |
| `ENTITY_DELETED` | An existing entity is deleted |
| `ENTITY_SUSPENDED` | An existing entity is suspended |
| `ENTITY_ACTIVATED` | An existing entity is activated |

### Activity Events

| Event | Meaning |
|-------|---------|
| `ACTIVITY_STARTED` | An activity is starting to execute (dispatched right before execution) |
| `ACTIVITY_COMPLETED` | An activity has been completed successfully |
| `ACTIVITY_CANCELLED` | An activity was cancelled because of a boundary event |
| `ACTIVITY_SIGNALED` | An activity received a signal (dispatched after it has responded) |
| `ACTIVITY_COMPENSATE` | An activity is about to be executed as compensation |
| `ACTIVITY_MESSAGE_SENT` | A message was sent via a message intermediate throw or message end event |
| `ACTIVITY_MESSAGE_WAITING` | A boundary, intermediate, or subprocess start message catch event is waiting for a message |
| `ACTIVITY_MESSAGE_RECEIVED` | An activity received a message event (dispatched before the message is actually received) |
| `ACTIVITY_ERROR_RECEIVED` | An activity received an error event (dispatched before the error is actually received) |

### Process Events

| Event | Meaning |
|-------|---------|
| `PROCESS_STARTED` | A process instance has been started (dispatched after the related `ENTITY_INITIALIZED`) |
| `PROCESS_COMPLETED` | A process has completed (dispatched after the last `ACTIVITY_COMPLETED`) |
| `PROCESS_COMPLETED_WITH_ERROR_END_EVENT` | A process completed with an error end event |
| `PROCESS_CANCELLED` | A process instance was deleted/cancelled |

### Task Events

| Event | Meaning |
|-------|---------|
| `TASK_CREATED` | A task has been created (fully initialized, before `TaskListener.EVENTNAME_CREATE`) |
| `TASK_ASSIGNED` | A task has been assigned (dispatched alongside an `ENTITY_UPDATED` event) |
| `TASK_COMPLETED` | A task has been completed (before the task entity is deleted and before the process moves on) |

### Job, Timer, and Sequence Flow Events

| Event | Meaning |
|-------|---------|
| `TIMER_SCHEDULED` | A timer has been scheduled |
| `TIMER_FIRED` | A timer has fired successfully |
| `JOB_CANCELED` | A job was cancelled (e.g. the bound user task was completed early) |
| `JOB_EXECUTION_SUCCESS` | A job was executed successfully |
| `JOB_EXECUTION_FAILURE` | A job execution failed (event is an `ActivitiExceptionEvent`) |
| `JOB_RETRIES_DECREMENTED` | The retry count on a job was decremented |
| `SEQUENCEFLOW_TAKEN` | The engine followed a sequence flow from source to target activity |

### Variable Events

| Event | Meaning |
|-------|---------|
| `VARIABLE_CREATED` | A new variable has been created |
| `VARIABLE_UPDATED` | An existing variable has been updated |
| `VARIABLE_DELETED` | An existing variable has been deleted |

### History Events (require history level >= ACTIVITY)

| Event | Meaning |
|-------|---------|
| `HISTORIC_ACTIVITY_INSTANCE_CREATED` | A `HistoricActivityInstance` was created |
| `HISTORIC_ACTIVITY_INSTANCE_ENDED` | A `HistoricActivityInstance` was marked as ended |
| `HISTORIC_PROCESS_INSTANCE_CREATED` | A `HistoricProcessInstance` was created |
| `HISTORIC_PROCESS_INSTANCE_ENDED` | A `HistoricProcessInstance` was marked as ended |

### Engine, Custom, Error, and Identity Events

| Event | Meaning |
|-------|---------|
| `ENGINE_CREATED` | The process engine has been created and is ready for use |
| `ENGINE_CLOSED` | The process engine has been closed and cannot be used anymore |
| `CUSTOM` | Custom events dispatched via the public API (never thrown by the engine itself) |
| `UNCAUGHT_BPMN_ERROR` | A BPMN error was thrown but not caught within the process |
| `MEMBERSHIP_CREATED` | A new membership was created |
| `MEMBERSHIP_DELETED` | A single membership was deleted |
| `MEMBERSHIPS_DELETED` | All memberships of a group were deleted (no individual `MEMBERSHIP_DELETED` events) |

## Complete Example

A small process that combines all three listener styles: an `ActivitiEventListener` class for process lifecycle events, a Spring bean for task events, and a throw-error listener that escalates when a task gets assigned.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:activiti="http://activiti.org/bpmn"
             targetNamespace="http://www.example.org/order">

  <error id="escalationError" errorCode="123"/>

  <process id="orderProcess" name="Order Process">
    <extensionElements>
      <!-- Class-based: all events of this process -->
      <activiti:eventListener class="com.example.OrderAuditListener"/>

      <!-- Delegate expression: task events only -->
      <activiti:eventListener events="TASK_CREATED,TASK_ASSIGNED"
                              delegateExpression="${taskNotifier}"/>

      <!-- Throw event: escalate when the review task is assigned -->
      <activiti:eventListener events="TASK_ASSIGNED"
                              throwEvent="error" errorCode="123"/>
    </extensionElements>

    <startEvent id="start"/>
    <sequenceFlow id="flow1" sourceRef="start" targetRef="review"/>

    <userTask id="review" name="Review Order"/>

    <boundaryEvent id="escalation" attachedToRef="review">
      <errorEventDefinition errorRef="escalationError"/>
    </boundaryEvent>
    <sequenceFlow id="flow2" sourceRef="escalation" targetRef="done"/>

    <sequenceFlow id="flow3" sourceRef="review" targetRef="done"/>
    <endEvent id="done"/>
  </process>
</definitions>
```

```java
package com.example;

import org.activiti.engine.delegate.event.ActivitiEvent;
import org.activiti.engine.delegate.event.ActivitiEventListener;
import org.activiti.engine.delegate.event.ActivitiEventType;

public class OrderAuditListener implements ActivitiEventListener {

  @Override
  public void onEvent(ActivitiEvent event) {
    switch (event.getType()) {
      case PROCESS_STARTED:
        System.out.println("Auditing: process instance " + event.getProcessInstanceId() + " started");
        break;
      case PROCESS_COMPLETED:
        System.out.println("Auditing: process instance " + event.getProcessInstanceId() + " completed");
        break;
      default:
        break;
    }
  }

  @Override
  public boolean isFailOnException() {
    return false; // audit failures should not break the order process
  }
}
```

```java
package com.example;

import org.activiti.engine.delegate.event.ActivitiEntityEvent;
import org.activiti.engine.delegate.event.ActivitiEvent;
import org.activiti.engine.delegate.event.ActivitiEventListener;
import org.activiti.engine.task.Task;

@Component("taskNotifier")
public class TaskNotifier implements ActivitiEventListener {

  @Override
  public void onEvent(ActivitiEvent event) {
    if (event instanceof ActivitiEntityEvent) {
      Object entity = ((ActivitiEntityEvent) event).getEntity();
      if (entity instanceof Task) {
        Task task = (Task) entity;
        System.out.println("Task '" + task.getName() + "' " + event.getType()
            + ", assignee: " + task.getAssignee());
      }
    }
  }

  @Override
  public boolean isFailOnException() {
    return true;
  }
}
```

**What happens at runtime:** starting the process fires `PROCESS_STARTED` (and the related entity events), which `OrderAuditListener` logs. When the `review` task is created, `TaskNotifier` receives `TASK_CREATED`; when it is assigned, `TaskNotifier` receives `TASK_ASSIGNED` and the error-throwing listener propagates error `123` from the task's execution — the interrupting `escalation` boundary event catches it, the task is cancelled, and the process ends at `done`, firing `PROCESS_COMPLETED` (again logged by `OrderAuditListener`).

## Relationship to the Engine Event System

The `<activiti:eventListener>` element is the **BPMN-level front end** of the same event mechanism documented in [Engine Event System](../../advanced/engine-event-system.md). Both approaches consume `ActivitiEvent` objects dispatched by the `ActivitiEventDispatcher`, and a single engine event is delivered **twice** when both are present:

| Aspect | Engine-wide listeners | Process event listeners |
|--------|-----------------------|-------------------------|
| Registration | `ProcessEngineConfigurationImpl.setEventListeners(...)` or the `ActivitiEventDispatcher` API (Java/XML configuration) | `<activiti:eventListener>` in the process XML |
| Scope | Every process definition and every engine event | Only events that carry *this* process definition's id |
| Per-process filtering | No — you filter in code (`event.getProcessDefinitionId()`) | Yes — declared per process definition |

Use the engine event system for cross-process concerns (metrics, auditing, job execution failures) and process event listeners for concerns that belong to one specific process model. The event type names are identical in both.

## Common Pitfalls

### 1. Wrong Placement — Inside a Sub-Process

Listeners must be declared in the `<extensionElements>` of the **top-level** `<process>`. An `<activiti:eventListener>` placed inside a `<subProcess>`'s extension elements causes the **deployment to fail**: during XML-to-model conversion the converter unconditionally casts the element containing the listener to `Process` (`ActivitiEventListenerParser`), and a sub-process is not a `Process` — parsing aborts with a `ClassCastException` (`org.activiti.bpmn.model.SubProcess cannot be cast to org.activiti.bpmn.model.Process`, reported as `Error processing BPMN document`). Move the listener to the top-level process.

### 2. `expression` Is Not Supported

Unlike execution and task listeners, `<activiti:eventListener>` has **no `expression` attribute**. A listener with only `expression` fails validation with `EVENT_LISTENER_IMPLEMENTATION_MISSING` (or is silently skipped with a warning when validation is disabled). Use `class` or `delegateExpression`.

### 3. Spaces After Commas in `events`

Tokens are matched against the `ActivitiEventType` names exactly and are **not trimmed**. `events="TASK_ASSIGNED, TASK_CREATED"` fails deployment with `Invalid event-type:  TASK_CREATED`. Write `events="TASK_ASSIGNED,TASK_CREATED"`.

### 4. Process Variables Are Not Available in `delegateExpression`

The expression is resolved without an execution variable scope, so dynamic bean references built from process variables (e.g. a bean name stored in a variable) are impossible. The expression must resolve to a known `ActivitiEventListener` bean.

### 5. Invalid Class or Bean Fails at Runtime, Not at Deploy

Deployment succeeds even if `class` does not exist or `delegateExpression` references a missing bean. The failure surfaces when the first event is dispatched — and how it surfaces depends on the problem:

- **Class exists but does not implement `ActivitiEventListener`** (or the expression resolves to something that is not one) → `ActivitiIllegalArgumentException` (e.g. `Class com.example.MyListener does not implement org.activiti.engine.delegate.event.ActivitiEventListener`). The wrapper forces `isFailOnException() = true` for this case, so the exception **aborts the engine operation**.
- **Class cannot be loaded, or the bean does not exist** → the exception originates from instantiation/expression resolution before a delegate is available, so the wrapper cannot report fail-on-exception from the delegate. The exception is then **logged as a warning and swallowed** — the engine operation continues, the listener stays dead, and a new warning is logged on every subsequent event.

In both cases, fix the class name / bean reference and re-deploy (or re-start the process) — the class instance is cached per process definition once successfully created.

### 6. Listener Exceptions Abort Engine Operations

If `isFailOnException()` returns `true` (always the case for throw-event listeners), an exception in `onEvent()` fails the operation that dispatched the event — a task assignment fails if your `TASK_ASSIGNED` listener throws. Return `false` and catch exceptions yourself when the listener is auxiliary (logging, metrics).

### 7. Throw-Event Scope Limits

- `signal` and `message` are process-instance scoped: the triggering event must belong to an ongoing process instance, and delivery only reaches catch events **of that same instance**.
- `error` requires the triggering event to carry an `executionId` — events without one cannot throw errors (`No execution context active and event is not related to an execution. No compensation event can be thrown.`).
- No matching catch event for a thrown error raises a `BpmnError`; a `globalSignal` with no subscribers is silently ignored.

### 8. Process-Definition-Deletion Events Are Not Delivered

`ENTITY_DELETED` events for the process definition itself are not dispatched to process-scoped listeners (the definition no longer exists to route the event to). Use an engine-wide listener if you need to observe definition deletion.

## Related Documentation

- [Execution Listeners](./execution-listeners.md) - Activity-level BPMN listeners (start/end/take)
- [Task Listeners](./task-listeners.md) - User task lifecycle listeners (create/assignment/complete/delete)
- [Engine Event System](../../advanced/engine-event-system.md) - Engine-wide event listeners, event types, and dispatching
- [Error Handling](./error-handling.md) - Boundary error events and error propagation
- [Java Delegate](./java-delegate.md) - Java delegates for service tasks
