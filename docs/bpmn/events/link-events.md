---
sidebar_label: Link Events
slug: /bpmn/events/link-events
title: "Link Events"
description: "Complete guide to Link Events in Activiti - creating internal process jumps and avoiding complex flow lines."
---

# Link Events

Link Events allow you to **create jumps within a process** without drawing sequence flows. They consist of a **Link Throw Event** (source) and a **Link Catch Event** (destination), enabling cleaner diagrams for complex workflows with multiple entry/exit points.

## Overview

```xml
<!-- Link Throw Event - the jump source -->
<intermediateThrowEvent id="jumpToReview">
  <linkEventDefinition name="ReviewLink"/>
</intermediateThrowEvent>

<!-- Link Catch Event - the jump destination -->
<intermediateCatchEvent id="reviewEntryPoint">
  <linkEventDefinition name="ReviewLink"/>
</intermediateCatchEvent>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** None (standard BPMN behavior)

## Key Features

### Link Event Characteristics

| Feature | Description |
|---------|-------------|
| **Same Process** | Links work only within the same process |
| **Name Matching** | Throw and catch must have identical names |
| **No Data Flow** | Links don't transfer data (use variables) |
| **Diagram Clarity** | Reduces crossing flow lines |
| **Multiple Sources** | One catch can have multiple throws |
| **Single Target** | One throw goes to one catch (by name) |

### Link Event vs Sequence Flow

| Aspect | Sequence Flow | Link Event |
|--------|---------------|------------|
| **Visual** | Drawn line | Named jump |
| **Complexity** | Can create spaghetti | Keeps diagram clean |
| **Data** | Automatic flow | Variables shared via process |
| **Use Case** | Simple flows | Complex branching |

## Configuration Options

### 1. Basic Link Event Pair

Simple jump from one point to another:

```xml
<process id="linkExample" name="Link Event Example">
  
  <startEvent id="start"/>
  
  <userTask id="initialTask" name="Initial Task"/>
  
  <!-- Decision point -->
  <exclusiveGateway id="decision"/>
  
  <!-- Normal path -->
  <sequenceFlow id="normalPath" sourceRef="decision" targetRef="normalTask">
    <conditionExpression>${normalFlow}</conditionExpression>
  </sequenceFlow>
  
  <userTask id="normalTask" name="Normal Task"/>
  
  <!-- Jump path using link -->
  <sequenceFlow id="jumpPath" sourceRef="decision" targetRef="throwLink">
    <conditionExpression>${!normalFlow}</conditionExpression>
  </sequenceFlow>
  
  <!-- Link throw - jumps to catch -->
  <intermediateThrowEvent id="throwLink">
    <linkEventDefinition name="SkipToReview"/>
  </intermediateThrowEvent>
  
  <!-- Link catch - receives the jump -->
  <intermediateCatchEvent id="catchLink">
    <linkEventDefinition name="SkipToReview"/>
  </intermediateCatchEvent>
  
  <userTask id="reviewTask" name="Review Task"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="initialTask"/>
  <sequenceFlow id="flow2" sourceRef="initialTask" targetRef="decision"/>
  <sequenceFlow id="flow3" sourceRef="normalTask" targetRef="reviewTask"/>
  <sequenceFlow id="flow4" sourceRef="catchLink" targetRef="reviewTask"/>
  <sequenceFlow id="flow5" sourceRef="reviewTask" targetRef="end"/>
  
</process>
```

**Behavior:**
- When `throwLink` is reached, execution jumps to `catchLink`
- No sequence flow needed between them
- Variables set before throw are available after catch

### 2. Multiple Throws to One Catch

Consolidate multiple paths into one entry point:

```xml
<process id="multipleThrows" name="Multiple Throws Example">
  
  <startEvent id="start"/>
  
  <!-- Path 1 -->
  <userTask id="task1" name="Task 1"/>
  <intermediateThrowEvent id="throw1">
    <linkEventDefinition name="ConsolidatePoint"/>
  </intermediateThrowEvent>
  
  <!-- Path 2 -->
  <userTask id="task2" name="Task 2"/>
  <intermediateThrowEvent id="throw2">
    <linkEventDefinition name="ConsolidatePoint"/>
  </intermediateThrowEvent>
  
  <!-- Path 3 -->
  <userTask id="task3" name="Task 3"/>
  <intermediateThrowEvent id="throw3">
    <linkEventDefinition name="ConsolidatePoint"/>
  </intermediateThrowEvent>
  
  <!-- Single catch point for all paths -->
  <intermediateCatchEvent id="consolidateCatch">
    <linkEventDefinition name="ConsolidatePoint"/>
  </intermediateCatchEvent>
  
  <userTask id="finalTask" name="Final Task"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="task1"/>
  <sequenceFlow id="flow2" sourceRef="task1" targetRef="throw1"/>
  <sequenceFlow id="flow3" sourceRef="start" targetRef="task2"/>
  <sequenceFlow id="flow4" sourceRef="task2" targetRef="throw2"/>
  <sequenceFlow id="flow5" sourceRef="start" targetRef="task3"/>
  <sequenceFlow id="flow6" sourceRef="task3" targetRef="throw3"/>
  <sequenceFlow id="flow7" sourceRef="consolidateCatch" targetRef="finalTask"/>
  <sequenceFlow id="flow8" sourceRef="finalTask" targetRef="end"/>
  
</process>
```

**Use Case:**
- Multiple conditional paths
- Avoid crossing lines
- Single consolidation point

### 3. Link Events for Exception Handling

Jump to error handling without crossing flows:

```xml
<process id="exceptionHandling" name="Exception Handling with Links">
  
  <startEvent id="start"/>
  
  <!-- Main workflow -->
  <serviceTask id="step1" name="Step 1"/>
  <serviceTask id="step2" name="Step 2"/>
  <serviceTask id="step3" name="Step 3"/>
  
  <!-- Error detection points -->
  <exclusiveGateway id="check1"/>
  <exclusiveGateway id="check2"/>
  <exclusiveGateway id="check3"/>
  
  <!-- Error links from various points -->
  <intermediateThrowEvent id="errorFromStep1">
    <linkEventDefinition name="ErrorHandler"/>
  </intermediateThrowEvent>
  
  <intermediateThrowEvent id="errorFromStep2">
    <linkEventDefinition name="ErrorHandler"/>
  </intermediateThrowEvent>
  
  <intermediateThrowEvent id="errorFromStep3">
    <linkEventDefinition name="ErrorHandler"/>
  </intermediateThrowEvent>
  
  <!-- Single error handling entry -->
  <intermediateCatchEvent id="errorHandler">
    <linkEventDefinition name="ErrorHandler"/>
  </intermediateCatchEvent>
  
  <serviceTask id="handleError" name="Handle Error"/>
  
  <!-- Success path -->
  <endEvent id="successEnd"/>
  
  <!-- Error path -->
  <endEvent id="errorEnd">
    <errorEventDefinition errorRef="ProcessError"/>
  </endEvent>
  
  <!-- Main flows -->
  <sequenceFlow id="flow1" sourceRef="start" targetRef="step1"/>
  <sequenceFlow id="flow2" sourceRef="step1" targetRef="check1"/>
  <sequenceFlow id="flow3" sourceRef="check1" targetRef="step2">
    <conditionExpression>${!error}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow4" sourceRef="check1" targetRef="errorFromStep1">
    <conditionExpression>${error}</conditionExpression>
  </sequenceFlow>
  
  <sequenceFlow id="flow5" sourceRef="step2" targetRef="check2"/>
  <sequenceFlow id="flow6" sourceRef="check2" targetRef="step3">
    <conditionExpression>${!error}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow7" sourceRef="check2" targetRef="errorFromStep2">
    <conditionExpression>${error}</conditionExpression>
  </sequenceFlow>
  
  <sequenceFlow id="flow8" sourceRef="step3" targetRef="check3"/>
  <sequenceFlow id="flow9" sourceRef="check3" targetRef="successEnd">
    <conditionExpression>${!error}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow10" sourceRef="check3" targetRef="errorFromStep3">
    <conditionExpression>${error}</conditionExpression>
  </sequenceFlow>
  
  <!-- Error handling flow -->
  <sequenceFlow id="flow11" sourceRef="errorHandler" targetRef="handleError"/>
  <sequenceFlow id="flow12" sourceRef="handleError" targetRef="errorEnd"/>
  
  <error id="ProcessError" name="Process Error" errorCode="ERR001"/>
  
</process>
```

### 4. Link Events with Variables

Variables are shared via process scope:

```xml
<process id="linkWithVariables" name="Link with Variables">
  
  <startEvent id="start"/>
  
  <serviceTask id="setVariables" name="Set Variables" 
               activiti:class="com.example.VariableSetter"/>
  
  <!-- Jump over some tasks -->
  <intermediateThrowEvent id="skipTask">
    <linkEventDefinition name="SkipToProcess"/>
  </intermediateThrowEvent>
  
  <!-- Variables still available after link -->
  <intermediateCatchEvent id="afterSkip">
    <linkEventDefinition name="SkipToProcess"/>
  </intermediateCatchEvent>
  
  <serviceTask id="useVariables" name="Use Variables" 
               activiti:class="com.example.VariableUser"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="setVariables"/>
  <sequenceFlow id="flow2" sourceRef="setVariables" targetRef="skipTask"/>
  <sequenceFlow id="flow3" sourceRef="afterSkip" targetRef="useVariables"/>
  <sequenceFlow id="flow4" sourceRef="useVariables" targetRef="end"/>
  
</process>
```

**Variable Setter:**
```java
public class VariableSetter implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        execution.setVariable("data", "important value");
        execution.setVariable("skipReason", "Optimization");
    }
}
```

**Variable User:**
```java
public class VariableUser implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        // Variables set before link are still available
        String data = (String) execution.getVariable("data");
        String reason = (String) execution.getVariable("skipReason");
        
        System.out.println("Data: " + data);
        System.out.println("Skip Reason: " + reason);
    }
}
```

## Complete Examples

### Example 1: Complex Approval Workflow

```xml
<process id="approvalWorkflow" name="Complex Approval Workflow">
  
  <startEvent id="start"/>
  
  <userTask id="submitRequest" name="Submit Request"/>
  
  <!-- Level 1 approval -->
  <userTask id="managerApproval" name="Manager Approval" 
            activiti:assignee="${manager}"/>
  
  <exclusiveGateway id="managerDecision"/>
  
  <!-- Approved - go to level 2 -->
  <sequenceFlow id="approved" sourceRef="managerDecision" targetRef="directorApproval">
    <conditionExpression>${approved}</conditionExpression>
  </sequenceFlow>
  
  <!-- Rejected - jump to end -->
  <sequenceFlow id="rejected" sourceRef="managerDecision" targetRef="rejectLink">
    <conditionExpression>${!approved}</conditionExpression>
  </sequenceFlow>
  
  <intermediateThrowEvent id="rejectLink">
    <linkEventDefinition name="RejectionPoint"/>
  </intermediateThrowEvent>
  
  <!-- Level 2 approval (for high value) -->
  <exclusiveGateway id="valueCheck"/>
  
  <sequenceFlow id="highValue" sourceRef="valueCheck" targetRef="directorApproval">
    <conditionExpression>${amount > 10000}</conditionExpression>
  </sequenceFlow>
  
  <sequenceFlow id="lowValue" sourceRef="valueCheck" targetRef="finalize">
    <conditionExpression>${amount <= 10000}</conditionExpression>
  </sequenceFlow>
  
  <userTask id="directorApproval" name="Director Approval" 
            activiti:assignee="${director}"/>
  
  <exclusiveGateway id="directorDecision"/>
  
  <!-- Director approved -->
  <sequenceFlow id="directorApproved" sourceRef="directorDecision" targetRef="finalize">
    <conditionExpression>${approved}</conditionExpression>
  </sequenceFlow>
  
  <!-- Director rejected - jump to same rejection point -->
  <sequenceFlow id="directorRejected" sourceRef="directorDecision" targetRef="rejectLink2">
    <conditionExpression>${!approved}</conditionExpression>
  </sequenceFlow>
  
  <intermediateThrowEvent id="rejectLink2">
    <linkEventDefinition name="RejectionPoint"/>
  </intermediateThrowEvent>
  
  <!-- Single rejection handling point -->
  <intermediateCatchEvent id="rejectionPoint">
    <linkEventDefinition name="RejectionPoint"/>
  </intermediateCatchEvent>
  
  <userTask id="notifyRejection" name="Notify Rejection"/>
  
  <!-- Finalization -->
  <serviceTask id="finalize" name="Finalize Request" 
               activiti:class="com.example.Finalizer"/>
  
  <endEvent id="successEnd"/>
  <endEvent id="rejectionEnd"/>
  
  <!-- Main flows -->
  <sequenceFlow id="flow1" sourceRef="start" targetRef="submitRequest"/>
  <sequenceFlow id="flow2" sourceRef="submitRequest" targetRef="managerApproval"/>
  <sequenceFlow id="flow3" sourceRef="managerApproval" targetRef="managerDecision"/>
  <sequenceFlow id="flow4" sourceRef="managerDecision" targetRef="valueCheck">
    <conditionExpression>${approved}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow5" sourceRef="directorApproval" targetRef="directorDecision"/>
  <sequenceFlow id="flow6" sourceRef="finalize" targetRef="successEnd"/>
  <sequenceFlow id="flow7" sourceRef="rejectionPoint" targetRef="notifyRejection"/>
  <sequenceFlow id="flow8" sourceRef="notifyRejection" targetRef="rejectionEnd"/>
  
</process>
```

**Benefits:**
- Clean diagram without crossing lines
- Single rejection handling point
- Multiple rejection paths consolidated

### Example 2: State Machine Pattern

```xml
<process id="stateMachine" name="State Machine with Links">
  
  <startEvent id="start"/>
  
  <!-- State 1 -->
  <intermediateCatchEvent id="state1">
    <linkEventDefinition name="State1"/>
  </intermediateCatchEvent>
  
  <serviceTask id="processState1" name="Process State 1"/>
  
  <exclusiveGateway id="state1Decision"/>
  
  <!-- Go to State 2 -->
  <intermediateThrowEvent id="toState2">
    <linkEventDefinition name="State2"/>
  </intermediateThrowEvent>
  
  <!-- Go to State 3 -->
  <intermediateThrowEvent id="toState3">
    <linkEventDefinition name="State3"/>
  </intermediateThrowEvent>
  
  <!-- State 2 -->
  <intermediateCatchEvent id="state2">
    <linkEventDefinition name="State2"/>
  </intermediateCatchEvent>
  
  <serviceTask id="processState2" name="Process State 2"/>
  
  <exclusiveGateway id="state2Decision"/>
  
  <!-- Back to State 1 -->
  <intermediateThrowEvent id="backToState1">
    <linkEventDefinition name="State1"/>
  </intermediateThrowEvent>
  
  <!-- Go to State 3 -->
  <intermediateThrowEvent id="state2ToState3">
    <linkEventDefinition name="State3"/>
  </intermediateThrowEvent>
  
  <!-- State 3 -->
  <intermediateCatchEvent id="state3">
    <linkEventDefinition name="State3"/>
  </intermediateCatchEvent>
  
  <serviceTask id="processState3" name="Process State 3"/>
  
  <endEvent id="end"/>
  
  <!-- Initial flow -->
  <sequenceFlow id="flow1" sourceRef="start" targetRef="state1"/>
  <sequenceFlow id="flow2" sourceRef="state1" targetRef="processState1"/>
  <sequenceFlow id="flow3" sourceRef="processState1" targetRef="state1Decision"/>
  
  <!-- State 1 transitions -->
  <sequenceFlow id="flow4" sourceRef="state1Decision" targetRef="toState2">
    <conditionExpression>${goToState2}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow5" sourceRef="state1Decision" targetRef="toState3">
    <conditionExpression>${goToState3}</conditionExpression>
  </sequenceFlow>
  
  <!-- State 2 flows -->
  <sequenceFlow id="flow6" sourceRef="state2" targetRef="processState2"/>
  <sequenceFlow id="flow7" sourceRef="processState2" targetRef="state2Decision"/>
  
  <!-- State 2 transitions -->
  <sequenceFlow id="flow8" sourceRef="state2Decision" targetRef="backToState1">
    <conditionExpression>${backToState1}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow9" sourceRef="state2Decision" targetRef="state2ToState3">
    <conditionExpression>${goToState3}</conditionExpression>
  </sequenceFlow>
  
  <!-- State 3 flows -->
  <sequenceFlow id="flow10" sourceRef="state3" targetRef="processState3"/>
  <sequenceFlow id="flow11" sourceRef="processState3" targetRef="end"/>
  
</process>
```

**Use Case:**
- Complex state transitions
- Avoids spaghetti diagram
- Clear state entry points

## Runtime Behavior

### Link Event Execution

```java
// Link events execute automatically - no special API needed
// When throw event is reached, execution jumps to catch event

// Start process
String processInstanceId = runtimeService.startProcessInstanceByKey("linkExample");

// Execution automatically follows link events
// Variables persist across link jumps
```

### Monitoring Link Events

```java
// Link events appear in runtime execution query
List<Execution> executions = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .list();

// Check current activity (could be a link event)
for (Execution execution : executions) {
    String activityId = execution.getActivityId();
    if ("throwLink".equals(activityId) || "catchLink".equals(activityId)) {
        System.out.println("At link event: " + activityId);
    }
}
```

## Best Practices

### 1. Use Descriptive Link Names

```xml
<!-- GOOD: Clear purpose -->
<linkEventDefinition name="SkipToFinalApproval"/>
<linkEventDefinition name="RouteToErrorHandler"/>

<!-- BAD: Generic -->
<linkEventDefinition name="Link1"/>
<linkEventDefinition name="Jump"/>
```

### 2. Consolidate Similar Paths

```xml
<!-- GOOD: Multiple throws to one catch -->
<intermediateThrowEvent id="error1">
  <linkEventDefinition name="ErrorHandler"/>
</intermediateThrowEvent>

<intermediateThrowEvent id="error2">
  <linkEventDefinition name="ErrorHandler"/>
</intermediateThrowEvent>

<intermediateCatchEvent id="errorCatch">
  <linkEventDefinition name="ErrorHandler"/>
</intermediateCatchEvent>

<!-- BAD: Separate error handling for each -->
<intermediateThrowEvent id="error1">
  <linkEventDefinition name="Error1Handler"/>
</intermediateThrowEvent>

<intermediateCatchEvent id="error1Catch">
  <linkEventDefinition name="Error1Handler"/>
</intermediateCatchEvent>
```

### 3. Avoid Circular Links

```xml
<!-- BAD: Infinite loop -->
<intermediateThrowEvent id="loop1">
  <linkEventDefinition name="Loop"/>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition name="Loop"/>
</intermediateCatchEvent>

<sequenceFlow id="back" sourceRef="catch1" targetRef="loop1"/>

<!-- GOOD: Controlled loop with exit -->
<intermediateThrowEvent id="loop1">
  <linkEventDefinition name="RetryLoop"/>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition name="RetryLoop"/>
</intermediateCatchEvent>

<exclusiveGateway id="checkRetries"/>

<sequenceFlow id="retry" sourceRef="checkRetries" targetRef="loop1">
  <conditionExpression>${retryCount < 3}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="exit" sourceRef="checkRetries" targetRef="nextTask">
  <conditionExpression>${retryCount >= 3}</conditionExpression>
</sequenceFlow>
```

### 4. Document Link Purpose

```xml
<!-- GOOD: Documented -->
<!-- 
  Link: Skip validation for trusted sources
  Throw: After source check
  Catch: Before processing
-->
<intermediateThrowEvent id="skipValidation">
  <linkEventDefinition name="TrustedSourceBypass"/>
</intermediateThrowEvent>

<!-- BAD: No context -->
<intermediateThrowEvent id="throw1">
  <linkEventDefinition name="Link1"/>
</intermediateThrowEvent>
```

### 5. Use for Diagram Clarity, Not Logic

```xml
<!-- GOOD: Reduces crossing lines -->
<intermediateThrowEvent id="jump">
  <linkEventDefinition name="Consolidate"/>
</intermediateThrowEvent>

<!-- BAD: Obscures flow logic -->
<intermediateThrowEvent id="mysteryJump">
  <linkEventDefinition name="UnknownDestination"/>
</intermediateThrowEvent>
```

## Common Pitfalls

### 1. Mismatched Link Names

**Problem:** Throw and catch names don't match

```xml
<!-- WRONG: Names don't match -->
<intermediateThrowEvent id="throw1">
  <linkEventDefinition name="MyLink"/>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition name="MyLink2"/>  <!-- Different! -->
</intermediateCatchEvent>

<!-- CORRECT: Same name -->
<intermediateThrowEvent id="throw1">
  <linkEventDefinition name="MyLink"/>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition name="MyLink"/>  <!-- Same -->
</intermediateCatchEvent>
```

**Error:** `ActivitiException: no link catch event found for link name 'MyLink'`

### 2. Using Links Across Processes

**Problem:** Links don't work across process boundaries

```xml
<!-- WRONG: Link in called process -->
<callActivity id="callSub" calledElement="subProcess">
  <intermediateThrowEvent id="throw1">
    <linkEventDefinition name="CrossProcess"/>  <!-- Won't work -->
  </intermediateThrowEvent>
</callActivity>

<!-- CORRECT: Link within same process -->
<intermediateThrowEvent id="throw1">
  <linkEventDefinition name="WithinProcess"/>  <!-- Works -->
</intermediateThrowEvent>
```

### 3. Forgetting Variables Persist

**Problem:** Assuming variables are lost across links

```xml
<!-- Link events DON'T clear variables -->
<serviceTask id="setVar" activiti:class="com.example.SetVariable"/>

<intermediateThrowEvent id="throw1">
  <linkEventDefinition name="Jump"/>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition name="Jump"/>
</intermediateCatchEvent>

<!-- Variable set before throw is still available after catch -->
<serviceTask id="getVar" activiti:class="com.example.GetVariable"/>
```

### 4. Creating Unreachable Catch Events

**Problem:** Catch event with no corresponding throw

```xml
<!-- WRONG: Orphan catch -->
<intermediateCatchEvent id="orphanCatch">
  <linkEventDefinition name="NeverThrown"/>
</intermediateCatchEvent>

<!-- CORRECT: Ensure throw exists -->
<intermediateThrowEvent id="theThrow">
  <linkEventDefinition name="ProperlyLinked"/>
</intermediateThrowEvent>

<intermediateCatchEvent id="theCatch">
  <linkEventDefinition name="ProperlyLinked"/>
</intermediateCatchEvent>
```

## Comparison with Alternatives

### Link Events vs Sequence Flows

| Aspect | Sequence Flow | Link Events |
|--------|---------------|-------------|
| **Visual Clarity** | Can create spaghetti | Clean jumps |
| **Distance** | Any distance | Any distance |
| **Crossing** | Lines cross | No crossing |
| **Multiple Sources** | One source | Multiple sources |
| **Use Case** | Simple flows | Complex branching |

### Link Events vs Sub-Processes

| Aspect | Sub-Process | Link Events |
|--------|-------------|-------------|
| **Encapsulation** | Yes | No |
| **Reusability** | Yes | No |
| **Variable Scope** | Can be local | Process scope |
| **Use Case** | Repeated logic | Flow simplification |

## Related Documentation

- [Intermediate Events](./intermediate-events.md) - Other intermediate event types
- [Sequence Flows](../elements/sequence-flows.md) - Alternative flow mechanism
- [Sub-Processes](../subprocesses/index.md) - Encapsulation alternative
- [Gateways](../gateways/index.md) - Flow control

---

**Source:** `IntermediateCatchLinkEventActivityBehavior.java`, `IntermediateThrowLinkEventActivityBehavior.java`
