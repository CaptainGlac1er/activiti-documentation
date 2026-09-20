---
sidebar_label: Common Features
slug: /bpmn/common-features
title: "Common BPMN Features"
description: Features available across all BPMN elements in Activiti
---

# Common BPMN Features

This document describes **features available across all BPMN elements** in Activiti, including multi-instance, listeners, async execution, and extension mechanisms.

## Overview

Activiti provides powerful extensions that can be applied to most BPMN elements:

- **Multi-Instance** - Execute activities multiple times
- **Execution Listeners** - Hook into lifecycle events
- **Task Listeners** - Hook into task lifecycle
- **Async Execution** - Background processing
- **Boundary Events** - Exception handling
- **Extension Elements** - Custom metadata
- **Skip Expressions** - Conditional execution
- **Field Injection** - Dependency injection

## Async Execution

Execute activities in the **background** using job executor.

### Basic Configuration

```xml
<serviceTask id="asyncTask" 
            name="Async Task" 
            activiti:async="true"
            activiti:class="com.example.AsyncService"/>
```

### Delaying Async Execution

An async job is created with a due date of **now**, and the job executor picks
it up as soon as possible. There is no BPMN attribute to delay an async job.

To introduce a delay before the activity runs, use a timer event:

```xml
<intermediateCatchEvent id="wait">
  <timerEventDefinition>
    <timeDuration>PT10M</timeDuration>
  </timerEventDefinition>
</intermediateCatchEvent>
```

### Job Retries at Runtime

Retries are adjusted at runtime through the Management Service. When a job's
retries reach zero, it is moved to the dead letter table:

```java
// Increase the number of retries left for a job
managementService.setJobRetries(jobId, 3);

// Move a dead letter job back to the executable table
managementService.moveDeadLetterJobToExecutableJob(jobId, 3);
```

### Failed Job Retry

Configure retry policy using `failedJobRetryTimeCycle`:

```xml
<serviceTask id="retryTask"
            activiti:async="true">
  
  <extensionElements>
    <!-- Retry 5 times, 5 minutes apart -->
    <activiti:failedJobRetryTimeCycle>R5/PT5M</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>
```

**Retry Cycle Syntax:** `R{count}/{duration}`, where duration is an ISO 8601 duration:

- `R5/PT5M` - Retry 5 times, 5 minutes apart
- `R3/PT1M` - Retry 3 times, 1 minute apart
- `R1/PT30S` - Retry once, after 30 seconds

**Note:** The retry cycle is only applied to service tasks. On other elements, failed jobs fall back to the engine's default failed job wait time.

## Boundary Events

Handle **exceptions and interruptions** at activity level.

### Error Boundary Event

```xml
<serviceTask id="riskyTask" name="Risky Operation"/>

<boundaryEvent id="errorHandler" attachedToRef="riskyTask" cancelActivity="true">
  <errorEventDefinition errorRef="MyError"/>
</boundaryEvent>

<error id="MyError" name="My Error" errorCode="ERR001"/>
```

**Note:** Error boundary events are always interrupting; `cancelActivity` has no effect on them (it applies to timer, message, signal, and compensation boundary events).

### Timer Boundary Event

```xml
<userTask id="timeLimitedTask" name="Time Limited Task"/>

<boundaryEvent id="timeout" attachedToRef="timeLimitedTask" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT1H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

### Message Boundary Event (Non-Interrupting)

```xml
<serviceTask id="cancellableTask" name="Cancellable Task"/>

<boundaryEvent id="cancel" attachedToRef="cancellableTask" cancelActivity="false">
  <messageEventDefinition messageRef="cancelMessage"/>
</boundaryEvent>
```

### Multiple Boundary Events

```xml
<serviceTask id="complexTask" name="Complex Task"/>

<!-- Error boundary -->
<boundaryEvent id="errorBoundary" attachedToRef="complexTask" cancelActivity="true">
  <errorEventDefinition errorRef="TaskError"/>
</boundaryEvent>

<!-- Timer boundary -->
<boundaryEvent id="timerBoundary" attachedToRef="complexTask" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT30M</timeDuration>
  </timerEventDefinition>
</boundaryEvent>

<!-- Message boundary (non-interrupting) -->
<boundaryEvent id="messageBoundary" attachedToRef="complexTask" cancelActivity="false">
  <messageEventDefinition messageRef="updateMessage"/>
</boundaryEvent>
```

## Extension Elements

Add **custom metadata** to any BPMN element.

### Field Injection

Inject values into delegates and listeners using `<activiti:field>`:

```xml
<serviceTask id="task1" name="Task" activiti:class="com.example.MyDelegate">
  
  <extensionElements>
    <activiti:field name="department">
      <activiti:string>finance</activiti:string>
    </activiti:field>
    <activiti:field name="sla">
      <activiti:string>PT4H</activiti:string>
    </activiti:field>
  </extensionElements>
  
</serviceTask>
```

**Note:** Field injection provides values to delegates at runtime. Other extension elements like `failedJobRetryTimeCycle` are documented in their respective sections.

### Custom XML Elements

```xml
<serviceTask id="task1" name="Task"
             xmlns:custom="http://example.com/custom">
  
  <extensionElements>
    <custom:myExtension>
      <custom:property name="key" value="value"/>
      <custom:nestedElement>content</custom:nestedElement>
    </custom:myExtension>
  </extensionElements>
  
</serviceTask>
```

## Skip Expression

**Conditionally skip** activity execution.

### Configuration

```xml
<userTask id="optionalTask" 
          name="Optional Task"
          activiti:skipExpression="${skipOptionalTasks}"/>

<serviceTask id="conditionalService" 
             activiti:skipExpression="${!executeService}"/>
```

### Use Cases

- Optional approval steps
- Conditional validations
- Feature flags
- A/B testing

## Field Injection

**Inject dependencies** into delegates (Service Tasks).

### Configuration

```xml
<serviceTask id="task1" 
            name="Task" 
            activiti:class="com.example.MyDelegate">
  
  <extensionElements>
    <!-- Spring bean injection using expression -->
    <activiti:field name="service" expression="${myService}"/>
    
    <!-- String value -->
    <activiti:field name="config" stringValue="configuration value"/>
    
    <!-- Expression -->
    <activiti:field name="dynamicValue" expression="${calculateValue()}"/>
  </extensionElements>
</serviceTask>
```

### Implementation

```java
public class MyDelegate implements JavaDelegate {
    
    private MyService service;
    private String config;
    
    // Setter injection (called by Activiti)
    public void setService(MyService service) {
        this.service = service;
    }
    
    public void execute(DelegateExecution execution) {
        // Use injected dependencies
        service.doSomething(config);
    }
}
```

**Note:** Field values are provided via the `stringValue` or `expression` attributes, or via `<activiti:string>` / `<activiti:expression>` child elements. In a Spring context, `expression="${beanName}"` resolves to a Spring bean.

## Feature Availability Matrix

| Feature | User Task | Service Task | Script Task | Gateway | Event | SubProcess |
|---------|-----------|--------------|-------------|---------|-------|------------|
| Multi-Instance | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Execution Listeners | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Task Listeners | (see [Task Listeners](./reference/task-listeners.md)) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Async Execution | ✅ | ✅ | ✅ | ❌ | ✅ (catch) | ✅ |
| Boundary Events | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Skip Expression | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Field Injection | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Extension Elements | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Notes:**

- ✅ = supported, ❌ = not supported.
- `activiti:skipExpression` is only valid on `serviceTask` and `userTask` elements.
- `activiti:failedJobRetryTimeCycle` applies to activities that run as async jobs (see [Async Execution](./reference/async-execution.md)).

## Complete Example

```xml
<userTask id="complexTask"
          name="Complex Review Task"
          activiti:assignee="${reviewer}"
          activiti:candidateGroups="reviewers"
          activiti:dueDate="${dueDate}"
          activiti:skipExpression="${skipReview}"
          activiti:formKey="review-form.html">

  <!-- Multi-instance with collection -->
  <multiInstanceLoopCharacteristics
    isSequential="false"
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
    <completionCondition>${approvedCount >= 2}</completionCondition>
  </multiInstanceLoopCharacteristics>

  <!-- Extension elements -->
  <extensionElements>
    <!-- Task listeners -->
    <activiti:taskListener event="create" class="com.example.TaskCreatedListener"/>
    <activiti:taskListener event="complete" delegateExpression="${completionListener}"/>

    <!-- Execution listeners -->
    <activiti:executionListener event="start" class="com.example.StartListener"/>
    <activiti:executionListener event="end" class="com.example.EndListener"/>

    <!-- Form properties -->
    <activiti:formProperty name="comment" type="string"/>
    <activiti:formProperty name="approved" type="boolean"/>
  </extensionElements>

</userTask>

<!-- Boundary event (sibling of userTask, not a nested child) -->
<boundaryEvent id="timeout" attachedToRef="complexTask" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT24H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

## Best Practices

1. **Use Listeners Sparingly:** Too many listeners impact performance
2. **Async for Long Operations:** Prevent blocking
3. **Boundary Events for Errors:** Handle exceptions locally
4. **Multi-Instance for Collections:** Process lists efficiently
5. **Task Listeners for User Tasks:** See [Task Listeners](./reference/task-listeners.md)
6. **Skip Expressions for Options:** Implement conditional logic
7. **Field Injection for Dependencies:** Use DI properly
8. **Extension Elements for Metadata:** Store custom info
9. **Document Complex Configurations:** Explain why features are used

## Related Documentation

- [User Task](./elements/user-task.md)
- [Service Task](./elements/service-task.md)
- [Events](./events/index.md)
- [Async Execution](./reference/async-execution.md)
- [Multi-Instance](./reference/multi-instance.md)
- [Task Listeners](./reference/task-listeners.md)
- [Variables](./reference/variables.md)

---
