---
sidebar_label: Regular SubProcess
slug: /bpmn/subprocesses/regular-subprocess
description: Complete guide to Regular (Embedded) SubProcesses in Activiti
---

# Regular SubProcess

Regular SubProcesses (also called **Embedded SubProcesses**) are containers that group related activities into a single, collapsible unit within a process. They help organize complex workflows and improve readability.

## 📋 Overview

```xml
<subProcess id="subProcess1" name="Order Processing">
  <startEvent id="start1"/>
  <userTask id="task1" name="Review Order"/>
  <endEvent id="end1"/>
</subProcess>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ Multi-instance, listeners, boundary events

## 🎯 Key Features

### Standard BPMN Features
- **Activity Grouping** - Organize related tasks
- **Collapsible Diagram** - Improve readability
- **Sequence Flow** - Internal process logic
- **Data Objects** - Local data storage
- **Boundary Events** - Exception handling

### Activiti Extensions
- **Multi-Instance** - Execute subprocess multiple times
- **Execution Listeners** - Lifecycle hooks
- **Extension Elements** - Custom metadata
- **Variable Scope** - Isolated variable context

## 📝 Configuration Options

### 1. Basic SubProcess

Create a simple embedded subprocess:

```xml
<process id="orderProcess" name="Order Process">
  <startEvent id="start"/>
  
  <subProcess id="processOrder" name="Process Order">
    <startEvent id="subStart"/>
    <userTask id="reviewTask" name="Review Order"/>
    <serviceTask id="validateTask" name="Validate Order"/>
    <endEvent id="subEnd"/>
  </subProcess>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="processOrder"/>
  <sequenceFlow id="flow2" sourceRef="processOrder" targetRef="end"/>
</process>
```

**Key Points:**
- SubProcess has its own `id` and `name`
- Contains start and end events
- Internal flows are isolated from parent process
- Variables can be scoped to subprocess

### 2. SubProcess with Multi-Instance

Execute subprocess for multiple items:

```xml
<subProcess id="processItems" name="Process Order Items">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${orderItems}"
    activiti:elementVariable="item">
    
    <startEvent id="miStart"/>
    <userTask id="processItem" name="Process Item"/>
    <endEvent id="miEnd"/>
    
  </multiInstanceLoopCharacteristics>
</subProcess>
```

**Use Cases:**
- Processing multiple order items
- Batch operations
- Parallel subprocess execution

### 3. SubProcess with Boundary Events

Add exception handling at subprocess level:

```xml
<subProcess id="criticalProcess" name="Critical Operation">
  <startEvent id="start1"/>
  <userTask id="task1" name="Perform Operation"/>
  <endEvent id="end1"/>
  
  <!-- Timer boundary event on subprocess -->
  <boundaryEvent id="timeout" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT1H</timeDuration>
    </timerEventDefinition>
    <sequenceFlow id="timeoutFlow" targetRef="handleTimeout"/>
  </boundaryEvent>
</subProcess>
```

### 4. SubProcess with Execution Listeners

Hook into subprocess lifecycle:

```xml
<subProcess id="trackedProcess" name="Tracked Operation">
  <activiti:executionListener event="start" class="com.example.SubProcessStartListener"/>
  <activiti:executionListener event="end" class="com.example.SubProcessEndListener"/>
  
  <startEvent id="start1"/>
  <userTask id="task1" name="Task"/>
  <endEvent id="end1"/>
</subProcess>
```

**Supported Events:**
- `start` - When subprocess begins
- `end` - When subprocess completes
- `take` - When sequence flow is taken

## 🔍 Variable Scope

SubProcesses have their own **variable scope**:

```xml
<subProcess id="scopedProcess" name="Scoped Process">
  <!-- Local variables -->
  <dataObject id="localVar" name="localVariable"/>
  
  <startEvent id="start1"/>
  <serviceTask id="task1">
    <ioSpecification>
      <inputDataItem name="input"/>
      <outputDataItem name="output"/>
    </ioSpecification>
  </serviceTask>
  <endEvent id="end1"/>
</subProcess>
```

**Variable Visibility:**
- **Local Variables:** Only accessible within subprocess
- **Inherited Variables:** Accessible from parent process
- **Data Associations:** Control variable flow in/out

### Data Input/Output Associations

```xml
<subProcess id="dataProcess" name="Data Processing">
  <!-- Input association -->
  <dataInputAssociation>
    <sourceRef>parentVariable</sourceRef>
    <targetRef>localInput</targetRef>
  </dataInputAssociation>
  
  <!-- Output association -->
  <dataOutputAssociation>
    <sourceRef>localOutput</sourceRef>
    <targetRef>parentResult</targetRef>
  </dataOutputAssociation>
  
  <startEvent id="start1"/>
  <task id="task1"/>
  <endEvent id="end1"/>
</subProcess>
```

## 💡 Complete Examples

### Example 1: Order Processing SubProcess

```xml
<process id="orderManagement" name="Order Management">
  <startEvent id="start"/>
  
  <subProcess id="validateOrder" name="Validate Order">
    <startEvent id="valStart"/>
    
    <sequenceFlow id="val1" sourceRef="valStart" targetRef="checkStock"/>
    
    <serviceTask id="checkStock" name="Check Stock Availability" activiti:class="com.example.StockValidator"/>
    
    <exclusiveGateway id="stockGateway"/>
    
    <sequenceFlow id="val2" sourceRef="checkStock" targetRef="stockGateway"/>
    <sequenceFlow id="val3" sourceRef="stockGateway" targetRef="inStockTask">
      <conditionExpression>${inStock}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="val4" sourceRef="stockGateway" targetRef="outOfStockTask">
      <conditionExpression>${!inStock}</conditionExpression>
    </sequenceFlow>
    
    <userTask id="inStockTask" name="Confirm Stock"/>
    <userTask id="outOfStockTask" name="Handle Backorder"/>
    
    <endEvent id="valEnd"/>
    
    <sequenceFlow id="val5" sourceRef="inStockTask" targetRef="valEnd"/>
    <sequenceFlow id="val6" sourceRef="outOfStockTask" targetRef="valEnd"/>
  </subProcess>
  
  <subProcess id="processPayment" name="Process Payment">
    <startEvent id="payStart"/>
    <serviceTask id="paymentTask" name="Charge Card" activiti:class="com.example.PaymentProcessor"/>
    <endEvent id="payEnd"/>
    
    <sequenceFlow id="pay1" sourceRef="payStart" targetRef="paymentTask"/>
    <sequenceFlow id="pay2" sourceRef="paymentTask" targetRef="payEnd"/>
  </subProcess>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="main1" sourceRef="start" targetRef="validateOrder"/>
  <sequenceFlow id="main2" sourceRef="validateOrder" targetRef="processPayment"/>
  <sequenceFlow id="main3" sourceRef="processPayment" targetRef="end"/>
</process>
```

### Example 2: Multi-Instance SubProcess

```xml
<process id="batchProcess" name="Batch Processing">
  <startEvent id="start"/>
  
  <subProcess id="processBatch" name="Process Batch Items">
    <multiInstanceLoopCharacteristics 
      isSequential="false"
      activiti:collection="${batchItems}"
      activiti:elementVariable="item">
      
      <startEvent id="miStart"/>
      
      <serviceTask id="processItem" name="Process Item">
        <activiti:field name="item">
          <activiti:expression>${item}</activiti:expression>
        </activiti:field>
      </serviceTask>
      
      <endEvent id="miEnd"/>
      
      <sequenceFlow id="miFlow" sourceRef="miStart" targetRef="processItem"/>
      <sequenceFlow id="miFlow2" sourceRef="processItem" targetRef="miEnd"/>
      
    </multiInstanceLoopCharacteristics>
  </subProcess>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="processBatch"/>
  <sequenceFlow id="flow2" sourceRef="processBatch" targetRef="end"/>
</process>
```

## 🔧 Runtime API

### Querying SubProcess Instances

```java
// Get subprocess instances
List<Execution> subprocessExecutions = runtimeService.createExecutionQuery()
    .processInstanceId("mainProcessInstanceId")
    .activityId("subProcessId")
    .list();

// Get activities within subprocess
List<Activity> subprocessActivities = runtimeService.getActivities(subprocessExecutions.get(0).getId());
```

### Managing SubProcess Variables

```java
// Set variable in subprocess
runtimeService.setVariable(executionId, "localVariable", "value");

// Get subprocess variables
Map<String, Object> subprocessVars = runtimeService.getVariables(executionId);

// Set variable in parent process (accessible to subprocess)
runtimeService.setVariable(processInstanceId, "sharedVariable", "value");
```

## 📊 Best Practices

1. **Keep It Focused** - Each subprocess should have a single responsibility
2. **Use Meaningful Names** - Clear subprocess names improve understanding
3. **Limit Nesting** - Avoid deeply nested subprocesses (max 2-3 levels)
4. **Document Interfaces** - Clearly define input/output variables
5. **Use Multi-Instance** - For repetitive subprocess execution
6. **Add Boundary Events** - Handle exceptions at subprocess level
7. **Scope Variables Properly** - Use local variables when appropriate

## ⚠️ Common Pitfalls

- **Variable Scope Confusion** - Understanding which variables are local vs inherited
- **Over-nesting** - Too many levels of subprocesses makes processes hard to follow
- **Missing Error Handling** - Not adding boundary events for exceptions
- **Performance Issues** - Large subprocesses with many activities can slow execution
- **Testing Difficulty** - Subprocesses can be harder to test in isolation

## 🔗 Related Documentation

- [Event SubProcess](./event-subprocess.md) - Event-triggered subprocesses
- [Ad-hoc SubProcess](./adhoc-subprocess.md) - Flexible activity execution
- [Transaction](./transaction.md) - Atomic subprocesses
- [Call Activity](../elements/call-activity.md) - Reusable global subprocesses
- [Multi-Instance](../advanced/multi-instance.md) - Iterative execution

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
