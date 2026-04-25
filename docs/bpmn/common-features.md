---
sidebar_label: Common Features
slug: /bpmn/common-features
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

### Async After Duration

Delay async activation:

```xml
<serviceTask id="delayedAsync" 
             activiti:async="true">
  
  <!-- Note: Job expiry is configured via Management Service or job executor settings,
       not through BPMN attributes -->
</serviceTask>
```

### Job Priority

Set execution priority via Management Service (not through BPMN properties):

```xml
<serviceTask id="priorityTask" 
             activiti:async="true"/>
```

**Runtime Configuration:**
```java
// Set job retries via Management Service
managementService.setJobRetries(jobId, 3);

// Number of retries for the job
```

**Note:** Job priority is configured at runtime through the Management Service, not via `activiti:property` in the BPMN definition. Properties are for custom metadata only.

### Failed Job Retry

Configure retry policy using `failedJobRetryTimeCycle`:

```xml
<serviceTask id="retryTask"
             activiti:async="true">
  
  <extensionElements>
    <!-- Retry 5 times -->
    <activiti:failedJobRetryTimeCycle>R/5</activiti:failedJobRetryTimeCycle>
    
    <!-- Retry with intervals -->
    <activiti:failedJobRetryTimeCycle>R3/PT1M;R2/PT5M</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>
```

**Retry Cycle Syntax:**
- `R/5` - Retry 5 times immediately
- `R3/PT1M` - Retry 3 times with 1 minute interval
- `R3/PT1M;R2/PT5M` - Retry 3 times (1min), then 2 times (5min)

**Note:** This is one of the few properties that affects engine behavior. Most other `activiti:property` elements are for custom metadata only.

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

### Custom Properties

```xml
<userTask id="task1" name="Task">
  
  <extensionElements>
    <activiti:property name="department" value="finance"/>
    <activiti:property name="sla" value="PT4H"/>
    <activiti:property name="version" value="2.0"/>
  </extensionElements>
  
</userTask>
```

**Note:** Most `activiti:property` elements are for **custom metadata only** and don't affect engine behavior. Exceptions include:
- `failedJobRetryTimeCycle` - Configures job retry policy
- Other engine-specific properties documented in their respective sections

### Custom XML Elements

```xml
<serviceTask id="task1" name="Task">
  
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
  
  <!-- Spring bean injection using expression -->
  <activiti:field name="service" expression="#{myService}"/>
  
  <!-- String value -->
  <activiti:field name="config" stringValue="configuration value"/>
  
  <!-- Expression -->
  <activiti:field name="dynamicValue" expression="${calculateValue()}"/>
  
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

**Note:** Field injection only supports `stringValue` and `expression` attributes. For Spring bean injection, use `expression="#{beanName}"`.

## Feature Availability Matrix

| Feature | User Task | Service Task | Script Task | Gateway | Event | SubProcess |
|---------|-----------|--------------|-------------|---------|-------|------------|
| Multi-Instance | | | | ❌ | ❌ | |
| Execution Listeners | | | | | | |
| Task Listeners | (see [Task Listeners](./advanced/task-listeners.md)) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Async Execution | | | | ❌ | | |
| Boundary Events | | | | ❌ | ❌ | |
| Skip Expression | | | | ❌ | ❌ | |
| Field Injection | ❌ | | ❌ | ❌ | ❌ | ❌ |
| Extension Elements | | | | | | |

## Complete Example

```xml
<userTask id="complexTask"
          name="Complex Review Task"
          activiti:assignee="${reviewer}"
          activiti:candidateGroups="reviewers"
          activiti:dueDate="${addDays(3)}"
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

    <!-- Custom properties -->
    <activiti:property name="department" value="finance"/>
    <activiti:property name="priority" value="high"/>

    <!-- Form properties -->
    <activiti:formProperty name="comment" type="string"/>
    <activiti:formProperty name="approved" type="bool"/>
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
5. **Task Listeners for User Tasks:** See [Task Listeners](./advanced/task-listeners.md)
6. **Skip Expressions for Options:** Implement conditional logic
7. **Field Injection for Dependencies:** Use DI properly
8. **Extension Elements for Metadata:** Store custom info
9. **Document Complex Configurations:** Explain why features are used

## Related Documentation

- [User Task](./elements/user-task.md)
- [Service Task](./elements/service-task.md)
- [Events](./events/index.md)
- [Async Execution](./advanced/async-execution.md)
- [Multi-Instance](./advanced/multi-instance.md)
- [Task Listeners](./advanced/task-listeners.md)
- [Variables](./advanced/variables.md)

---

