---
sidebar_label: BPMN Guide
slug: /bpmn/index
description: Comprehensive guide to BPMN 2.0 elements supported by Activiti and their customizations
---

# BPMN 2.0 Elements in Activiti

This guide provides a comprehensive overview of all BPMN 2.0 elements supported by Activiti, including **Activiti-specific customizations** and extensions that go beyond the standard BPMN 2.0 specification.

## 📋 Table of Contents

- [Overview](#overview)
- [Activiti Extensions](#activiti-extensions)
- [Task Elements](#task-elements)
- [Gateway Elements](#gateway-elements)
- [Event Elements](#event-elements)
- [SubProcesses](#subprocesses)
- [Data Objects](#data-objects)
- [Common Features](#common-features)

## 🎯 Overview

Activiti fully supports the **BPMN 2.0 specification** while adding powerful extensions for enterprise workflow automation. The engine can parse, validate, execute, and visualize BPMN diagrams with both standard and custom elements.

### Key Features

- ✅ **Full BPMN 2.0 compliance** - All standard elements supported
- ✅ **Activiti extensions** - Custom properties and behaviors
- ✅ **Multi-instance support** - Parallel and sequential iterations
- ✅ **Boundary events** - Exception handling at activity level
- ✅ **Execution listeners** - Hook into lifecycle events
- ✅ **Field injection** - Dependency injection for delegates
- ✅ **Async execution** - Background job processing
- ✅ **Retry mechanisms** - Configurable job retry policies

## 🔧 Activiti Extensions

Activiti extends BPMN 2.0 with several proprietary features that enhance workflow capabilities:

### 1. **Custom Properties**
Add metadata to any BPMN element using `<activiti:property>`:
```xml
<userTask id="task1" name="Review Document">
  <activiti:property name="department" value="finance"/>
  <activiti:property name="priority" value="high"/>
</userTask>
```

### 2. **Task Listeners**
Execute custom logic at task lifecycle events:
```xml
<userTask id="task1" name="Approval">
  <activiti:taskListener event="create" class="com.example.TaskCreatedListener"/>
  <activiti:taskListener event="complete" delegateExpression="${approvalListener}"/>
</userTask>
```

**Supported Events:**
- `create` - When task is created
- `assignment` - When assignee/candidates change
- `complete` - When task is completed

### 3. **Execution Listeners**
Hook into activity execution:
```xml
<serviceTask id="service1" name="Process Data">
  <activiti:executionListener event="start" class="com.example.StartListener"/>
  <activiti:executionListener event="end" delegateExpression="${endListener}"/>
  <activiti:executionListener event="take" class="com.example.FlowListener"/>
</serviceTask>
```

**Supported Events:**
- `start` - When activity starts
- `end` - When activity completes
- `take` - When sequence flow is taken

### 4. **Field Injection**
Inject dependencies into delegates:
```xml
<serviceTask id="service1" class="com.example.MyDelegate">
  <activiti:field name="service">
    <activiti:inject>#{beanName}</activiti:inject>
  </activiti:field>
  <activiti:field name="configValue">
    <activiti:string>some value</activiti:string>
  </activiti:field>
</serviceTask>
```

### 5. **Skip Expression**
Conditionally skip activities:
```xml
<userTask id="task1" name="Optional Review">
  <activiti:skipExpression>${skipReview}</activiti:skipExpression>
</userTask>
```

### 6. **Async Execution**
Run activities asynchronously:
```xml
<serviceTask id="service1" name="Long Running Task" activiti:async="true"/>
```

**Note:** Job priority is configured at runtime via Management Service, not through BPMN properties:
```java
// Set job priority via Management Service
managementService.setJobPriority(jobId, 5);
```

### 7. **Job Retry Configuration**
Configure retry policies for failed jobs:
```xml
<serviceTask id="service1" activiti:async="true">
  <activiti:property name="failedJobRetryTimeCycle" value="R/5"/>
</serviceTask>
```

## 📝 Task Elements

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

## 🚦 Gateway Elements

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

## 🎪 Event Elements

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

## 🔀 SubProcesses

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

## 📊 Data Objects

Data objects represent information used or produced by the process.

**Activiti Customizations:**
- Data input/output associations
- Variable scope management
- Complex data types
- Item definitions

## 🔗 Common Features

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
Attach exception handling:
```xml
<serviceTask id="service1" name="Process">
  <boundaryEvent id="timeout" eventDefinitionRef="timer1" cancelActivity="true"/>
</serviceTask>
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
- [Process Extensions Guide](./advanced/process-extensions.md) - Complete documentation
- Separation of concerns for better maintainability
- Variable mapping for activities
- Constants and configuration values

## 📖 Next Steps

- Start with [User Tasks](./elements/user-task.md) for human interactions
- Explore [Service Tasks](./elements/service-task.md) for automation
- Learn about [Gateways](./gateways/) for process branching
- Understand [Events](./events/) for triggers and exceptions
- Master [Process Extensions](./advanced/process-extensions.md) for variable management

## 🛠️ Tools and Integration

- **BPMN Model API** - Programmatic model manipulation
- **BPMN Converter** - XML and JSON serialization
- **Process Validation** - Deploy-time checks
- **Image Generator** - Visual diagram rendering
- **Dynamic BPMN** - Runtime process modification

---

**Note:** All BPMN elements can be customized using Activiti's extension mechanisms. Refer to specific element documentation for detailed configuration options.
