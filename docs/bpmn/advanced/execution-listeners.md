---
sidebar_label: Execution Listeners
slug: /bpmn/advanced/execution-listeners
title: "Execution Listeners"
description: "Complete guide to Execution Listeners in Activiti - monitoring and reacting to process execution events with custom logic."
---

# Execution Listeners

Execution Listeners allow you to **execute custom logic** at specific points during process execution. They are triggered by events such as activity start, activity end, or sequence flow transitions.

## 📋 Overview

```xml
<userTask id="myTask">
  <extensionElements>
    <activiti:executionListener 
      event="start" 
      class="com.example.MyExecutionListener"
      onTransaction="before-commit"
      customPropertiesResolverClass="com.example.Resolver"/>
  </extensionElements>
</userTask>
```

**BPMN 2.0 Standard:** ❌ Activiti Extension  
**Activiti Implementation:** ✅ Full support for start, end, and take events

**Important Attributes:**
- `event` - The event type (start, end, take)
- `class` - Fully qualified class name implementing ExecutionListener
- `expression` - EL/SpEL expression to evaluate
- `delegateExpression` - Spring bean method call
- `onTransaction` - Transaction timing (before-commit, committed, rolled-back)
- `customPropertiesResolverClass` - Custom properties resolver class
- `customPropertiesResolverExpression` - Custom properties resolver expression
- `customPropertiesResolverDelegateExpression` - Custom properties resolver delegate expression

## 🎯 Key Features

### Supported Events
- **`start`** - When activity/element execution begins
- **`end`** - When activity/element execution completes
- **`take`** - When sequence flow is taken (transition)

### Implementation Types
- **Class Delegate** - Java class implementing `ExecutionListener`
- **Expression** - EL/SpEL expression evaluation
- **Delegate Expression** - Spring bean method call
- **Script** - JavaScript/Groovy script execution

### Placement Options
- **Process Level** - Listen to process start/end
- **Activity Level** - Listen to task/event start/end
- **Sequence Flow Level** - Listen to transitions
- **Gateway Level** - Listen to gateway execution

## 📝 Execution Listener Interface

### Basic Interface

```java
public interface ExecutionListener extends BaseExecutionListener {
    void notify(DelegateExecution execution);
}
```

### Event Constants

```java
public interface BaseExecutionListener extends Serializable {
    String EVENTNAME_START = "start";  // Activity starts
    String EVENTNAME_END = "end";      // Activity ends
    String EVENTNAME_TAKE = "take";    // Sequence flow taken
}
```

## 🔧 Implementation Types

### 1. Class Delegate (Recommended)

Java class implementing `ExecutionListener`:

```xml
<userTask id="myTask" name="My Task">
  <extensionElements>
    <activiti:executionListener 
      event="start" 
      class="com.example.MyExecutionListener"
      onTransaction="before-commit"
      customPropertiesResolverClass="com.example.Resolver"/>
  </extensionElements>
</userTask>
```

**Transaction Timing Options:**
- `before-commit` - Execute before transaction commits
- `committed` - Execute after transaction commits
- `rolled-back` - Execute after transaction rolls back

**Java Implementation:**
```java
public class MyExecutionListener implements ExecutionListener {
    
    @Override
    public void notify(DelegateExecution execution) {
        System.out.println("Activity started: " + execution.getActivityId());
        
        // Access variables
        Object variable = execution.getVariable("myVariable");
        
        // Set variables
        execution.setVariable("timestamp", System.currentTimeMillis());
        
        // Get process instance
        String processInstanceId = execution.getProcessInstanceId();
    }
}
```

### 2. Expression

Evaluate EL/SpEL expression:

```xml
<userTask id="myTask" name="My Task">
  <extensionElements>
    <activiti:executionListener 
      event="end" 
      expression="${myService.logCompletion(execution)}"
      onTransaction="committed"
      customPropertiesResolverExpression="${resolverExpression}"/>
  </extensionElements>
</userTask>
```

**Use Cases:**
- Simple logging
- Variable updates
- Method calls with execution context

### 3. Delegate Expression

Call Spring bean method:

```xml
<userTask id="myTask" name="My Task">
  <extensionElements>
    <activiti:executionListener 
      event="start" 
      delegateExpression="#{auditService.recordActivityStart(execution)}"
      onTransaction="rolled-back"
      customPropertiesResolverDelegateExpression="${resolverDelegate}"/>
  </extensionElements>
</userTask>
```

**Spring Bean:**
```java
@Component("auditService")
public class AuditService {
    
    public void recordActivityStart(DelegateExecution execution) {
        // Audit logic
    }
}
```

### 4. Script Execution Listener

Execute JavaScript or Groovy script:

```xml
<userTask id="myTask" name="My Task">
  <extensionElements>
    <activiti:executionListener 
      event="end" 
      class="org.activiti.engine.impl.bpmn.listener.ScriptExecutionListener">
      <activiti:field name="scriptFormat" stringValue="javascript"/>
      <activiti:field name="scriptField">
        <activiti:string>
execution.setVariable('completedBy', execution.getCurrentUserId());
execution.setVariable('completionTime', new Date());
        </activiti:string>
      </activiti:field>
    </activiti:executionListener>
  </extensionElements>
</userTask>
```

**Groovy Example:**
```xml
<activiti:executionListener 
  event="start" 
  class="org.activiti.engine.impl.bpmn.listener.ScriptExecutionListener">
  <activiti:field name="scriptFormat" stringValue="groovy"/>
  <activiti:field name="scriptField">
    <activiti:string>
execution.variables['startTime'] = new Date()
log.info "Task started by: ${execution.currentUserId}"
    </activiti:string>
  </activiti:field>
</activiti:executionListener>
```

## 📍 Placement Options

### 1. Process Level

Listen to process instance start/end:

```xml
<process id="myProcess" name="My Process">
  
  <extensionElements>
    <!-- Process start -->
    <activiti:executionListener 
      event="start" 
      class="com.example.ProcessStartListener"/>
    
    <!-- Process end -->
    <activiti:executionListener 
      event="end" 
      class="com.example.ProcessEndListener"/>
  </extensionElements>
  
  <startEvent id="start"/>
  <endEvent id="end"/>
  
</process>
```

**Use Cases:**
- Process initialization
- Cleanup on completion
- Process-level auditing
- Setting initial variables

### 2. Activity Level

Listen to specific activity start/end:

```xml
<userTask id="approvalTask" name="Approval Task">
  <extensionElements>
    <!-- Task start -->
    <activiti:executionListener 
      event="start" 
      class="com.example.TaskStartListener"/>
    
    <!-- Task end -->
    <activiti:executionListener 
      event="end" 
      class="com.example.TaskEndListener"/>
  </extensionElements>
</userTask>
```

**Use Cases:**
- Task-specific initialization
- Completion logging
- Variable updates on task completion
- Notifications

### 3. Sequence Flow Level

Listen to transitions between activities:

```xml
<sequenceFlow id="flow1" sourceRef="task1" targetRef="task2">
  <extensionElements>
    <activiti:executionListener 
      event="take" 
      class="com.example.FlowTakenListener"/>
  </extensionElements>
</sequenceFlow>
```

**Use Cases:**
- Track path taken
- Update variables on transition
- Conditional logic before next activity
- Audit trail of flow decisions

### 4. Gateway Level

Listen to gateway execution:

```xml
<exclusiveGateway id="decisionGateway" name="Decision">
  <extensionElements>
    <activiti:executionListener 
      event="start" 
      class="com.example.GatewayStartListener"/>
  </extensionElements>
</exclusiveGateway>
```

**Use Cases:**
- Gateway decision logging
- Pre-gateway variable preparation
- Performance monitoring

### 5. Event Level

Listen to event execution:

```xml
<intermediateCatchEvent id="waitEvent" name="Wait for Message">
  <extensionElements>
    <activiti:executionListener 
      event="start" 
      class="com.example.EventStartListener"/>
  </extensionElements>
  <messageEventDefinition messageRef="myMessage"/>
</intermediateCatchEvent>
```

## 💡 Complete Examples

### Example 1: Comprehensive Process with Listeners

```xml
<process id="orderProcess" name="Order Processing">
  
  <!-- Process-level listeners -->
  <extensionElements>
    <activiti:executionListener 
      event="start" 
      class="com.example.OrderProcessStartListener"/>
    <activiti:executionListener 
      event="end" 
      class="com.example.OrderProcessEndListener"/>
  </extensionElements>
  
  <startEvent id="start"/>
  
  <userTask id="enterOrder" name="Enter Order Details">
    <extensionElements>
      <activiti:executionListener 
        event="start" 
        class="com.example.TaskStartListener">
        <activiti:field name="taskName" stringValue="Enter Order"/>
      </activiti:executionListener>
      
      <activiti:executionListener 
        event="end" 
        expression="${orderService.validateOrder(execution)}"/>
    </extensionElements>
  </userTask>
  
  <sequenceFlow id="toValidation" sourceRef="enterOrder" targetRef="validateOrder">
    <extensionElements>
      <activiti:executionListener 
        event="take" 
        class="com.example.FlowTransitionListener"/>
    </extensionElements>
  </sequenceFlow>
  
  <serviceTask id="validateOrder" name="Validate Order" 
               activiti:class="com.example.OrderValidator">
    <extensionElements>
      <activiti:executionListener 
        event="start" 
        delegateExpression="#{metricsService.recordTaskStart('validateOrder')}"/>
      
      <activiti:executionListener 
        event="end" 
        delegateExpression="#{metricsService.recordTaskEnd('validateOrder')}"/>
    </extensionElements>
  </serviceTask>
  
  <exclusiveGateway id="validationCheck" name="Valid?"/>
  
  <sequenceFlow id="validFlow" sourceRef="validationCheck" targetRef="processOrder">
    <conditionExpression>${validationResult.valid == true}</conditionExpression>
    <extensionElements>
      <activiti:executionListener 
        event="take" 
        class="com.example.ValidationPassedListener"/>
    </extensionElements>
  </sequenceFlow>
  
  <sequenceFlow id="invalidFlow" sourceRef="validationCheck" targetRef="rejectOrder">
    <conditionExpression>${validationResult.valid == false}</conditionExpression>
    <extensionElements>
      <activiti:executionListener 
        event="take" 
        class="com.example.ValidationFailedListener"/>
    </extensionElements>
  </sequenceFlow>
  
  <serviceTask id="processOrder" name="Process Order"/>
  <serviceTask id="rejectOrder" name="Reject Order"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="enterOrder"/>
  <sequenceFlow id="flow2" sourceRef="processOrder" targetRef="end"/>
  <sequenceFlow id="flow3" sourceRef="rejectOrder" targetRef="end"/>
  
</process>
```

### Example 2: Script-Based Listeners

```xml
<process id="scriptListenerProcess" name="Script Listener Example">
  
  <startEvent id="start"/>
  
  <userTask id="dataEntry" name="Data Entry">
    <extensionElements>
      <!-- Set start time using JavaScript -->
      <activiti:executionListener 
        event="start" 
        class="org.activiti.engine.impl.bpmn.listener.ScriptExecutionListener">
        <activiti:field name="scriptFormat" stringValue="javascript"/>
        <activiti:field name="scriptField">
          <activiti:string>
execution.setVariable('taskStartTime', new Date());
execution.setVariable('startedBy', execution.getCurrentUserId());
          </activiti:string>
        </activiti:field>
      </activiti:executionListener>
      
      <!-- Calculate duration using Groovy -->
      <activiti:executionListener 
        event="end" 
        class="org.activiti.engine.impl.bpmn.listener.ScriptExecutionListener">
        <activiti:field name="scriptFormat" stringValue="groovy"/>
        <activiti:field name="scriptField">
          <activiti:string>
def startTime = execution.getVariable('taskStartTime')
def endTime = new Date()
def duration = endTime.time - startTime.time
execution.setVariable('taskDuration', duration)
log.info "Task completed in ${duration}ms by ${execution.getCurrentUserId()}"
          </activiti:string>
        </activiti:field>
      </activiti:executionListener>
    </extensionElements>
  </userTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="dataEntry"/>
  <sequenceFlow id="flow2" sourceRef="dataEntry" targetRef="end"/>
  
</process>
```

### Example 3: Field Injection in Listeners

```xml
<process id="fieldInjectionProcess" name="Field Injection Example">
  
  <extensionElements>
    <activiti:executionListener 
      event="start" 
      class="com.example.ConfigurableListener">
      <!-- Inject configuration fields -->
      <activiti:field name="environment" stringValue="production"/>
      <activiti:field name="logLevel" stringValue="DEBUG"/>
      <activiti:field name="timeout" stringExpression="${systemConfig.timeout}"/>
      
      <!-- Inject bean reference -->
      <activiti:field name="auditService">
        <activiti:bean>com.example.AuditService</activiti:bean>
      </activiti:field>
    </activiti:executionListener>
  </extensionElements>
  
  <startEvent id="start"/>
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="end"/>
  
</process>
```

**Java Listener with Fields:**
```java
public class ConfigurableListener implements ExecutionListener {
    
    private String environment;
    private String logLevel;
    private Long timeout;
    private AuditService auditService;
    
    @Override
    public void notify(DelegateExecution execution) {
        System.out.println("Environment: " + environment);
        System.out.println("Log Level: " + logLevel);
        System.out.println("Timeout: " + timeout);
        
        auditService.logProcessStart(execution, environment);
    }
    
    // Setters for field injection
    public void setEnvironment(String environment) {
        this.environment = environment;
    }
    
    public void setLogLevel(String logLevel) {
        this.logLevel = logLevel;
    }
    
    public void setTimeout(Long timeout) {
        this.timeout = timeout;
    }
    
    public void setAuditService(AuditService auditService) {
        this.auditService = auditService;
    }
}
```

### Example 4: Multiple Listeners on Same Element

```xml
<userTask id="multiListenerTask" name="Multi-Listener Task">
  <extensionElements>
    <!-- First listener - start -->
    <activiti:executionListener 
      event="start" 
      class="com.example.FirstStartListener"/>
    
    <!-- Second listener - start (both will be called) -->
    <activiti:executionListener 
      event="start" 
      class="com.example.SecondStartListener"/>
    
    <!-- Listener - end -->
    <activiti:executionListener 
      event="end" 
      class="com.example.EndListener"/>
  </extensionElements>
</userTask>
```

**Note:** Multiple listeners of the same event type are executed in declaration order.

## 🔍 DelegateExecution API

### Accessing Variables

```java
public void notify(DelegateExecution execution) {
    // Get variable
    Object variable = execution.getVariable("myVariable");
    
    // Get variable with type
    String stringVar = (String) execution.getVariable("name");
    
    // Get local variable (activity scope)
    Object localVar = execution.getVariableLocal("temp");
    
    // Set variable (process scope)
    execution.setVariable("result", "completed");
    
    // Set local variable
    execution.setVariableLocal("counter", 1);
    
    // Remove variable
    execution.removeVariable("temporary");
    
    // Get all variable names
    Set<String> variableNames = execution.getVariableNames();
}
```

### Execution Context

```java
public void notify(DelegateExecution execution) {
    // Current activity ID
    String activityId = execution.getActivityId();
    
    // Process instance ID
    String processInstanceId = execution.getProcessInstanceId();
    
    // Process definition ID
    String processDefinitionId = execution.getProcessDefinitionId();
    
    // Current user (if available)
    String currentUser = execution.getCurrentUserId();
    
    // Execution ID
    String executionId = execution.getId();
    
    // Parent execution (for subprocesses)
    Execution parent = execution.getParent();
    
    // Child executions
    List<Execution> children = execution.getChildExecutions();
}
```

### Flow Control

```java
public void notify(DelegateExecution execution) {
    // Get incoming sequence flows
    List<String> incomingFlows = execution.getIncomingFlowIds();
    
    // Get outgoing sequence flows
    List<String> outgoingFlows = execution.getOutgoingFlowIds();
    
    // Check if multi-instance
    boolean isMultiInstance = execution.isMultiInstanceRoot();
}
```

### Business Key

```java
public void notify(DelegateExecution execution) {
    // Get business key
    String businessKey = execution.getProcessInstance().getBusinessKey();
    
    // Set business key (only at process level)
    if (execution.getRootProcessInstance() != null) {
        // Can update business key
    }
}
```

## 📊 Best Practices

### 1. Keep Listeners Focused

```java
// GOOD: Single responsibility
public class AuditListener implements ExecutionListener {
    public void notify(DelegateExecution execution) {
        auditService.log(execution);
    }
}

// BAD: Too many responsibilities
public class DoEverythingListener implements ExecutionListener {
    public void notify(DelegateExecution execution) {
        auditService.log(execution);
        metricsService.record(execution);
        notificationService.send(execution);
        cleanupService.run(execution);
    }
}
```

### 2. Use Appropriate Event Types

```xml
<!-- GOOD: Right event for the job -->
<activiti:executionListener event="start" class="InitListener"/>
<activiti:executionListener event="end" class="CleanupListener"/>
<activiti:executionListener event="take" class="TransitionListener"/>

<!-- BAD: Wrong event -->
<activiti:executionListener event="start" class="CleanupListener"/>
```

### 3. Handle Exceptions

```java
public class SafeExecutionListener implements ExecutionListener {
    @Override
    public void notify(DelegateExecution execution) {
        try {
            // Business logic
            processExecution(execution);
        } catch (Exception e) {
            // Log but don't break process
            logger.error("Listener error", e);
        }
    }
}
```

### 4. Use Field Injection for Configuration

```xml
<!-- GOOD: Configurable -->
<activiti:executionListener class="ConfigurableListener">
  <activiti:field name="environment" stringValue="production"/>
</activiti:executionListener>

<!-- BAD: Hardcoded -->
<activiti:executionListener class="HardcodedListener"/>
```

### 5. Document Listener Purpose

```xml
<!-- GOOD: Documented -->
<!-- 
  Listener: Records task start time for SLA monitoring
  Event: start
  Scope: Activity-level
-->
<activiti:executionListener 
  event="start" 
  class="SLAMonitorListener"/>
```

## ⚠️ Common Pitfalls

### 1. Modifying Variables Incorrectly

**Problem:** Using local vs global variables

```java
// BAD: Local variable not accessible after activity
execution.setVariableLocal("temp", value);

// GOOD: Process variable accessible throughout
execution.setVariable("temp", value);
```

### 2. Blocking Execution

**Problem:** Long-running operations in listeners

```java
// BAD: Blocks process execution
public void notify(DelegateExecution execution) {
    Thread.sleep(10000); // Blocks!
}

// GOOD: Async operation
public void notify(DelegateExecution execution) {
    executorService.submit(() -> {
        // Long-running task
    });
}
```

### 3. Assuming User Context

**Problem:** `getCurrentUserId()` may be null

```java
// BAD: No null check
String user = execution.getCurrentUserId();
userService.notify(user); // NPE!

// GOOD: Null-safe
String user = execution.getCurrentUserId();
if (user != null) {
    userService.notify(user);
}
```

### 4. Listener Order Dependencies

**Problem:** Relying on execution order

```xml
<!-- BAD: Order not guaranteed across deployments -->
<activiti:executionListener event="start" class="FirstListener"/>
<activiti:executionListener event="start" class="SecondListener"/>
<!-- SecondListener expects FirstListener to set variables -->
```

### 5. Catching Exceptions in Process

**Problem:** Listener exceptions break process

```java
// BAD: Uncaught exception
public void notify(DelegateExecution execution) {
    riskyOperation(); // Throws exception -> process fails
}

// GOOD: Protected
public void notify(DelegateExecution execution) {
    try {
        riskyOperation();
    } catch (Exception e) {
        logger.error("Operation failed", e);
    }
}
```

## 🔗 Related Documentation

- [Task Listeners](./task-listeners.md) - Task-specific listeners
- [Variables](./variables.md) - Variable scope and management
- [Service Task](../elements/service-task.md) - Java delegates
- [Process Extensions](./process-extensions.md) - Custom properties
- [Events Overview](../events/index.md) - BPMN events

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
