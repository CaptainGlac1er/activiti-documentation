---
sidebar_label: BPMN Guide
title: "BPMN 2.0 Elements in Activiti"
slug: /bpmn/index
description: Comprehensive guide to BPMN 2.0 elements supported by Activiti and their customizations
---

# BPMN 2.0 Elements in Activiti

This guide provides a comprehensive overview of all BPMN 2.0 elements supported by Activiti, including **Activiti-specific customizations** and extensions that go beyond the standard BPMN 2.0 specification.

## Table of Contents

- [Quick Reference](#quick-reference)
  - [Task Elements](#task-elements)
  - [Gateway Elements](#gateway-elements)
  - [Event Elements](#event-elements)
  - [SubProcess Elements](#subprocess-elements)
  - [Data & Artifact Elements](#data--artifact-elements)
- [Quick Selection Guides](#quick-selection-guides)
  - [Task Selection Guide](#task-selection-guide)
  - [Gateway Selection Guide](#gateway-selection-guide)
  - [Event Selection Guide](#event-selection-guide)
- [Feature Matrix](#feature-matrix)
- [Common Activiti Extensions](#common-activiti-extensions)
- [Overview](#overview)
- [Activiti Extensions](#activiti-extensions)
- [Task Elements (Detailed)](#task-elements-detailed)
- [Gateway Elements (Detailed)](#gateway-elements-detailed)
- [Event Elements (Detailed)](#event-elements-detailed)
- [SubProcesses](#subprocesses)
- [Data Objects](#data-objects)
- [Common Features](#common-features)
- [Next Steps](#next-steps)
- [Tools and Integration](#tools-and-integration)

---

## Quick Reference

### Task Elements

| Element | Description | Activiti Extensions | Documentation |
|---------|-------------|---------------------|---------------|
| **User Task** | Human-performed work | Assignee, candidates, forms, listeners | [User Task](./elements/user-task.md) |
| **Service Task** | Automated system work | Class, delegate, expression, connectors | [Service Task](./elements/service-task.md) |
| **Script Task** | Execute scripts | Multiple languages, async | [Script Task](./elements/script-task.md) |
| **Business Rule Task** | Execute business rules | DMN, Drools integration | [Business Rule Task](./elements/business-rule-task.md) |
| **Manual Task** | External manual work | Documentation, listeners | [Manual Task](./elements/manual-task.md) |
| **Call Activity** | Reference sub-process | Variable mapping, cases | [Call Activity](./elements/call-activity.md) |

### Gateway Elements

| Element | Description | Symbol | Documentation |
|---------|-------------|--------|---------------|
| **Exclusive Gateway** | XOR - one path | X | [Exclusive Gateway](./gateways/exclusive-gateway.md) |
| **Parallel Gateway** | AND - all paths | ⊞ | [Parallel Gateway](./gateways/parallel-gateway.md) |
| **Inclusive Gateway** | OR - one or more | ⦿ | [Inclusive Gateway](./gateways/inclusive-gateway.md) |
| **Event-Based Gateway** | Route by events | ⏣ | [Event-Based Gateway](./gateways/event-gateway.md) |
| **Complex Gateway** | Advanced conditions | ⊟ | [Complex Gateway](./gateways/complex-gateway.md) |

### Event Elements

#### Start Events

| Type | Description | Use Case |
|------|-------------|----------|
| **None** | Standard start | Manual process initiation |
| **Message** | Wait for message | Event-driven processes |
| **Timer** | Time-based start | Scheduled processes |
| **Signal** | Global signal | Broadcast triggers |
| **Conditional** | Condition met | Dynamic starts |

#### Intermediate Events

| Type | Catch/Throw | Description | Documentation |
|------|-------------|-------------|---------------|
| **Message** | Both | Communication | [Intermediate Events](./events/intermediate-events.md) |
| **Timer** | Catch | Wait for time | [Intermediate Events](./events/intermediate-events.md) |
| **Signal** | Both | Broadcast | [Intermediate Events](./events/intermediate-events.md) |
| **Link** | Both | Internal jumps | [Intermediate Events](./events/intermediate-events.md) |
| **Compensate** | Throw | Compensation | [Intermediate Events](./events/intermediate-events.md) |

**Unsupported:** Conditional, Error, and Escalation events are NOT supported as intermediate catch/throw events.

#### End Events

| Type | Description | Use Case | Documentation |
|------|-------------|----------|---------------|
| **None** | Normal completion | Standard end | [End Event](./events/end-event.md) |
| **Error** | End with error | Exception end | [End Event](./events/end-event.md) |
| **Message** | Send message | Communication | [End Event](./events/end-event.md) |
| **Terminate** | End all | Force termination | [End Event](./events/end-event.md) |

**Unsupported:** Signal and Escalation end events are NOT supported.

#### Boundary Events

| Type | Interrupting | Description | Documentation |
|------|--------------|-------------|---------------|
| **Error** | Yes | Exception handling | [Boundary Event](./events/boundary-event.md) |
| **Timer** | Both | Timeout handling | [Boundary Event](./events/boundary-event.md) |
| **Message** | Both | External trigger | [Boundary Event](./events/boundary-event.md) |
| **Signal** | Both | Global event | [Boundary Event](./events/boundary-event.md) |
| **Compensate** | No | Compensation | [Boundary Event](./events/boundary-event.md) |

### SubProcess Elements

| Element | Description | Documentation |
|---------|-------------|---------------|
| **Regular SubProcess** | Embedded flow | [Regular SubProcess](./subprocesses/regular-subprocess.md) |
| **Event SubProcess** | Event-triggered | [Event SubProcess](./subprocesses/event-subprocess.md) |
| **Ad-hoc SubProcess** | Arbitrary order | [Ad-hoc SubProcess](./subprocesses/adhoc-subprocess.md) |
| **Transaction** | Atomic unit | [Transaction](./subprocesses/transaction.md) |

### Data & Artifact Elements

| Element | Description |
|---------|-------------|
| **Data Object** | Process data |
| **Data Store** | External data |
| **Input Data** | Activity input |
| **Output Data** | Activity output |
| **Data Association** | Data flow |
| **Group** | Visual grouping |
| **Annotation** | Documentation |
| **Association** | Relationships |
| **Lane** | Swimlane division |
| **Pool** | Participant separation |

---

## Quick Selection Guides

### Task Selection Guide

| Use Case | Recommended Element |
|----------|-------------------|
| Human approval | User Task |
| API call | Service Task (class/delegate) |
| Simple calculation | Script Task |
| Business rules | Business Rule Task (DMN) |
| External system | Service Task (connector) |
| Email sending | Service Task (mail) |
| Sub-process | Call Activity |
| Manual work | Manual Task |

### Gateway Selection Guide

| Decision Type | Recommended Gateway |
|---------------|-------------------|
| If-then-else | Exclusive Gateway |
| Parallel work | Parallel Gateway |
| Multiple options | Inclusive Gateway |
| Event-based | Event-Based Gateway |

### Event Selection Guide

| Trigger Type | Recommended Event |
|--------------|------------------|
| External message | Message Event |
| Time-based | Timer Event |
| Global broadcast | Signal Event |
| Condition | Conditional Event |
| Exception | Error Event |
| Timeout | Timer Boundary Event |

---

## Feature Matrix

| Feature | User Task | Service Task | Script Task | Gateway | Event |
|---------|-----------|--------------|-------------|---------|-------|
| Async Execution | | | | ❌ | (catch) |
| Multi-Instance | | | | ❌ | ❌ |
| Boundary Events | | | | ❌ | ❌ |
| Execution Listeners | | | | | |
| Skip Expression | | | | ❌ | ❌ |
| Field Injection | ❌ | | ❌ | ❌ | ❌ |
| Form Integration | | ❌ | ❌ | ❌ | ❌ |
| Retry Configuration | ❌ | | | ❌ | ❌ |

---

## Common Activiti Extensions

### Available on All Activities

| Extension | Description | Example |
|-----------|-------------|---------|
| **async** | Background execution | `activiti:async="true"` |
| **exclusive** | Locking mode | `activiti:exclusive="true"` |
| **skipExpression** | Conditional skip | `activiti:skipExpression="${flag}"` |
| **executionListener** | Lifecycle hooks | `<activiti:executionListener/>` |
| **multiInstance** | Iteration | `<multiInstanceLoopCharacteristics/>` |
| **boundaryEvents** | Exception handling | `<boundaryEvent/>` |
| **extensionElements** | Custom metadata | `<extensionElements/>` |

**Note:** Job expiry and priority are configured via Management Service at runtime, not through BPMN attributes.

### User Task Extensions

| Extension | Description |
|-----------|-------------|
| **assignee** | Direct assignment |
| **owner** | Task owner |
| **candidateUsers** | Potential users |
| **candidateGroups** | Potential groups |
| **formKey** | Form integration |
| **dueDate** | Deadline |
| **priority** | Importance |
| **taskListener** | Task lifecycle |
| **formProperty** | Form fields |

### Service Task Extensions

| Extension | Description |
|-----------|-------------|
| **class** | Java class |
| **delegateExpression** | Spring bean |
| **expression** | EL/SpEL |
| **resultVariableName** | Output variable |
| **field** | Dependency injection |
| **type** | Connector type |
| **operationRef** | Operation reference |

### Script Task Extensions

| Extension | Description |
|-----------|-------------|
| **scriptFormat** | Language |
| **script** | Inline code |
| **resource** | External script |
| **resultVariable** | Output |
| **autoStoreVariables** | Auto-persist script variable changes |

---

## Overview

Activiti fully supports the **BPMN 2.0 specification** while adding powerful extensions for enterprise workflow automation. The engine can parse, validate, execute, and visualize BPMN diagrams with both standard and custom elements.

### Key Features

- **Full BPMN 2.0 compliance** - All standard elements supported
- **Activiti extensions** - Custom properties and behaviors
- **Multi-instance support** - Parallel and sequential iterations
- **Boundary events** - Exception handling at activity level
- **Execution listeners** - Hook into lifecycle events
- **Field injection** - Dependency injection for delegates
- **Async execution** - Background job processing
- **Retry mechanisms** - Configurable job retry policies

## Activiti Extensions

Activiti extends BPMN 2.0 with several proprietary features that enhance workflow capabilities:

### 1. **Custom Properties**
Add metadata to any BPMN element using `<activiti:property>`:
```xml
<userTask id="task1" name="Review Document">
  <extensionElements>
    <activiti:property name="department" value="finance"/>
    <activiti:property name="priority" value="high"/>
  </extensionElements>
</userTask>
```

### 2. **Task Listeners**
Execute custom logic at task lifecycle events:
```xml
<userTask id="task1" name="Approval">
  <extensionElements>
    <activiti:taskListener event="create" class="com.example.TaskCreatedListener"/>
    <activiti:taskListener event="complete" delegateExpression="${approvalListener}"/>
  </extensionElements>
</userTask>
```

**Supported Events:**
- `create` - When task is created
- `assignment` - When assignee/candidates change
- `complete` - When task is completed
- `delete` - When task is deleted
- `all` - All of the above events

### 3. **Execution Listeners**
Hook into activity execution:
```xml
<serviceTask id="service1" name="Process Data">
  <extensionElements>
    <activiti:executionListener event="start" class="com.example.StartListener"/>
    <activiti:executionListener event="end" delegateExpression="${endListener}"/>
    <activiti:executionListener event="take" class="com.example.FlowListener"/>
  </extensionElements>
</serviceTask>
```

**Supported Events:**
- `start` - When activity starts
- `end` - When activity completes
- `take` - When sequence flow is taken

### 4. **Field Injection**
Inject dependencies into delegates:
```xml
<serviceTask id="service1" activiti:class="com.example.MyDelegate">
  <extensionElements>
    <activiti:field name="service" expression="#{beanName}"/>
    <activiti:field name="configValue" stringValue="some value"/>
  </extensionElements>
</serviceTask>
```

### 5. **Skip Expression**
Conditionally skip activities:
```xml
<userTask id="task1" name="Optional Review" activiti:skipExpression="${skipReview}"/>
```

### 6. **Async Execution**
Run activities asynchronously:
```xml
<serviceTask id="service1" name="Long Running Task" activiti:async="true"/>
```

**Note:** Job priority is configured at runtime via Management Service, not through BPMN properties:
```java
// Set job retries via Management Service
managementService.setJobRetries(jobId, 3);
```

### 7. **Job Retry Configuration**
Configure retry policies for failed jobs:
```xml
<serviceTask id="service1" activiti:async="true">
  <extensionElements>
    <activiti:failedJobRetryTimeCycle>R/5</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>
```

## Task Elements (Detailed)

Tasks represent work performed in a process. Activiti supports all standard BPMN task types:

### [User Task](./elements/user-task.md)
Human-performed tasks with assignment and candidate support.

**Activiti Customizations:**
- Assignee and owner expressions
- Candidate users and groups
- Custom identity links
- Form key integration
- Due date and priority
- Task listeners
- Skip expressions

### [Service Task](./elements/service-task.md)
Automated tasks that execute code or call external services.

**Activiti Customizations:**
- Class implementation
- Delegate expression
- Field injection
- Operation reference for connectors
- DMN decision support
- Mail task support
- Async execution
- Custom properties

### [Script Task](./elements/script-task.md)
Execute scripts in various languages (JavaScript, Groovy, etc.).

**Activiti Customizations:**
- Multiple script languages
- Script format options (inline, resource, field)
- Script listeners
- Variable scope control

### [Business Rule Task](./elements/business-rule-task.md)
Execute business rules using Drools or custom implementations.

**Activiti Customizations:**
- Rule decision table support
- Custom rule engine integration
- Decision ref for DMN

### [Manual Task](./elements/manual-task.md)
Tasks performed outside the workflow engine.

**Activiti Customizations:**
- Documentation for manual procedures
- Execution listeners for tracking

### [Call Activity](./elements/call-activity.md)
Reference and execute global tasks or sub-processes.

**Activiti Customizations:**
- Called element configuration
- Variable mapping
- Case support
- Dynamic process selection

## Gateway Elements (Detailed)

Gateways control the divergence and convergence of sequence flows.

### [Exclusive Gateway](./gateways/exclusive-gateway.md)
XOR gateway - only one path is taken based on conditions.

**Activiti Customizations:**
- Condition expressions on sequence flows
- Default flow support
- Expression language integration

### [Parallel Gateway](./gateways/parallel-gateway.md)
AND gateway - all paths are taken simultaneously.

**Activiti Customizations:**
- Complex parallel execution
- Multi-instance integration

### [Inclusive Gateway](./gateways/inclusive-gateway.md)
OR gateway - one or more paths can be taken.

**Activiti Customizations:**
- Multiple condition evaluation
- Dynamic path selection

### [Event-Based Gateway](./gateways/event-gateway.md)
Route based on events (messages, timers, errors).

**Activiti Customizations:**
- Non-interrupting events
- Complex event handling

### [Complex Gateway](./gateways/complex-gateway.md)
Advanced routing with conditions and dependencies.

**Activiti Customizations:**
- Activation conditions
- Completion conditions

## Event Elements (Detailed)

Events represent something that happens during process execution.

### [Start Event](./events/start-event.md)
Initiates a process instance.

**Activiti Customizations:**
- Message start events
- Timer start events
- Signal start events
- Conditional start events
- Candidate starters
- Form key support

### [Intermediate Events](./events/intermediate-events.md)
Events that occur during process execution.

**Catch Events:**
- **Message** - Wait for external message
- **Timer** - Wait for time condition
- **Signal** - Wait for signal
- **Conditional** - Wait for condition
- **Link** - Jump from link throw event

**Throw Events:**
- **Message** - Send message
- **Signal** - Send signal
- **Link** - Jump to link catch event

**Activiti Customizations:**
- Event subscriptions
- Timer date and duration expressions
- Error event handling
- Compensate events

### [End Event](./events/end-event.md)
Terminates a process or sub-process.

**Types:**
- **Terminator** - Normal completion
- **Error** - End with error
- **Cancel** - Cancel parent sub-process
- **Signal** - Send signal on end
- **Message** - Send message on end
- **Terminate** - End entire process instance

**Activiti Customizations:**
- Multiple end events support
- Error code and message configuration

### [Boundary Event](./events/boundary-event.md)
Events attached to activities for exception handling.

**Activiti Customizations:**
- Interrupting and non-interrupting
- Error boundary events
- Timer boundary events
- Message boundary events
- Signal boundary events
- Compensation boundary events

## SubProcesses

Sub-processes group activities into logical units.

### [Regular SubProcess](./subprocesses/regular-subprocess.md)
Embedded sub-process with visible internal flow.

**Activiti Customizations:**
- Transaction support
- Ad-hoc sub-processes
- Multi-instance support

### [Event SubProcess](./subprocesses/event-subprocess.md)
Triggered by events within an activity.

**Types:**
- **Non-interrupting** - Runs parallel to parent
- **Interrupting** - Cancels parent activities

**Activiti Customizations:**
- Event correlation
- Scope management

### [Ad-hoc SubProcess](./subprocesses/adhoc-subprocess.md)
Activities executed in arbitrary order.

**Activiti Customizations:**
- Completion conditions
- User-driven activity selection

## Data Objects

Data objects represent information used or produced by the process.

**Activiti Customizations:**
- Data input/output associations
- Variable scope management
- Complex data types
- Item definitions

## Common Features

All BPMN elements support these common Activiti features:

### Multi-Instance
Execute activities multiple times:

**Using Collection (Activiti Extension):**
```xml
<userTask id="task1" name="Review">
  <multiInstanceLoopCharacteristics
    isSequential="false"
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
  </multiInstanceLoopCharacteristics>
</userTask>
```

**Using Loop Cardinality (BPMN Standard):**
```xml
<userTask id="task1" name="Review">
  <multiInstanceLoopCharacteristics isSequential="true">
    <loopCardinality>${reviewers.size()}</loopCardinality>
  </multiInstanceLoopCharacteristics>
</userTask>
```

### Boundary Events
Attach exception handling (boundary events are siblings, not children):
```xml
<serviceTask id="service1" name="Process"/>
<boundaryEvent id="timeout" attachedToRef="service1" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT1H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

### Extension Elements
Add custom metadata:
```xml
<userTask id="task1">
  <extensionElements>
    <activiti:formProperty name="field1" type="string"/>
  </extensionElements>
</userTask>
```

### Process Extensions (*.extension.json)
Define variables, mappings, and constants separately from BPMN:
- [Process Extensions Guide](./reference/process-extensions.md) - Complete documentation
- Separation of concerns for better maintainability
- Variable mapping for activities
- Constants and configuration values

## Next Steps

- Start with [User Tasks](./elements/user-task.md) for human interactions
- Explore [Service Tasks](./elements/service-task.md) for automation
- Learn about [Gateways](./gateways/) for process branching
- Understand [Events](./events/) for triggers and exceptions
- Master [Process Extensions](./reference/process-extensions.md) for variable management

## Tools and Integration

- **BPMN Model API** - Programmatic model manipulation
- **BPMN Converter** - XML and JSON serialization
- **Process Validation** - Deploy-time checks
- **Image Generator** - Visual diagram rendering
- **Dynamic BPMN** - Runtime process modification

## Related Resources

- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [Activiti BPMN Model API](../api-reference/engine-api/bpmn-model.mdx)
- [Process Validation](../api-reference/engine-api/process-validation.md)

---

**Note:** All BPMN elements can be customized using Activiti's extension mechanisms. Refer to specific element documentation for detailed configuration options.
