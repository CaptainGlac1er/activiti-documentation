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
  <linkEventDefinition id="jumpToReviewLinkId">
    <target>reviewEntryPointLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<!-- Link Catch Event - the jump destination -->
<intermediateCatchEvent id="reviewEntryPoint">
  <linkEventDefinition id="reviewEntryPointLinkId">
    <source>jumpToReviewLinkId</source>
  </linkEventDefinition>
</intermediateCatchEvent>
```

**How Throw and Catch Are Paired:** the throw event's `<linkEventDefinition>` carries a `<target>` whose value is the `id` of the catch event's `<linkEventDefinition>`. The `name` attribute is parsed but **not** used for matching. The catch definition lists each contributing throw definition `id` as a `<source>` element (the process validator requires at least one). Links only work within the same process.

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** None (standard BPMN behavior)

## Key Features

### Link Event Characteristics

| Feature | Description |
|---------|-------------|
| **Same Process** | Links work only within the same process |
| **ID Matching** | The throw's `<target>` must equal the catch's `linkEventDefinition` `id` |
| **No Data Flow** | Links don't transfer data (use variables) |
| **Diagram Clarity** | Reduces crossing flow lines |
| **Multiple Sources** | One catch can have multiple throws (each a `<source>`) |
| **Single Target** | One throw goes to one catch (by `<target>` id) |
| **XML Elements** | The throw's `<linkEventDefinition>` must contain a `<target>` with the catch definition `id`; the catch's definition must contain at least one `<source>` with a throw definition `id`. The `name` attribute is parsed but not used for matching |

### Link Event vs Sequence Flow

| Aspect | Sequence Flow | Link Event |
|--------|---------------|------------|
| **Visual** | Drawn line | ID-based jump |
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
    <linkEventDefinition id="throwLinkId">
      <target>catchLinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- Link catch - receives the jump -->
  <intermediateCatchEvent id="catchLink">
    <linkEventDefinition id="catchLinkId">
      <source>throwLinkId</source>
    </linkEventDefinition>
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
    <linkEventDefinition id="throw1LinkId">
      <target>consolidateLinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- Path 2 -->
  <userTask id="task2" name="Task 2"/>
  <intermediateThrowEvent id="throw2">
    <linkEventDefinition id="throw2LinkId">
      <target>consolidateLinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- Path 3 -->
  <userTask id="task3" name="Task 3"/>
  <intermediateThrowEvent id="throw3">
    <linkEventDefinition id="throw3LinkId">
      <target>consolidateLinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- Single catch point for all paths -->
  <intermediateCatchEvent id="consolidateCatch">
    <linkEventDefinition id="consolidateLinkId">
      <source>throw1LinkId</source>
      <source>throw2LinkId</source>
      <source>throw3LinkId</source>
    </linkEventDefinition>
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
    <linkEventDefinition id="errorFromStep1LinkId">
      <target>errorHandlerLinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <intermediateThrowEvent id="errorFromStep2">
    <linkEventDefinition id="errorFromStep2LinkId">
      <target>errorHandlerLinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <intermediateThrowEvent id="errorFromStep3">
    <linkEventDefinition id="errorFromStep3LinkId">
      <target>errorHandlerLinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- Single error handling entry -->
  <intermediateCatchEvent id="errorHandler">
    <linkEventDefinition id="errorHandlerLinkId">
      <source>errorFromStep1LinkId</source>
      <source>errorFromStep2LinkId</source>
      <source>errorFromStep3LinkId</source>
    </linkEventDefinition>
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
    <linkEventDefinition id="skipTaskLinkId">
      <target>afterSkipLinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- Variables still available after link -->
  <intermediateCatchEvent id="afterSkip">
    <linkEventDefinition id="afterSkipLinkId">
      <source>skipTaskLinkId</source>
    </linkEventDefinition>
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
    <linkEventDefinition id="rejectLinkId">
      <target>rejectionPointLinkId</target>
    </linkEventDefinition>
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
    <linkEventDefinition id="rejectLink2LinkId">
      <target>rejectionPointLinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- Single rejection handling point -->
  <intermediateCatchEvent id="rejectionPoint">
    <linkEventDefinition id="rejectionPointLinkId">
      <source>rejectLinkId</source>
      <source>rejectLink2LinkId</source>
    </linkEventDefinition>
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
    <linkEventDefinition id="state1LinkId">
      <source>backToState1LinkId</source>
    </linkEventDefinition>
  </intermediateCatchEvent>
  
  <serviceTask id="processState1" name="Process State 1"/>
  
  <exclusiveGateway id="state1Decision"/>
  
  <!-- Go to State 2 -->
  <intermediateThrowEvent id="toState2">
    <linkEventDefinition id="toState2LinkId">
      <target>state2LinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- Go to State 3 -->
  <intermediateThrowEvent id="toState3">
    <linkEventDefinition id="toState3LinkId">
      <target>state3LinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- State 2 -->
  <intermediateCatchEvent id="state2">
    <linkEventDefinition id="state2LinkId">
      <source>toState2LinkId</source>
    </linkEventDefinition>
  </intermediateCatchEvent>
  
  <serviceTask id="processState2" name="Process State 2"/>
  
  <exclusiveGateway id="state2Decision"/>
  
  <!-- Back to State 1 -->
  <intermediateThrowEvent id="backToState1">
    <linkEventDefinition id="backToState1LinkId">
      <target>state1LinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- Go to State 3 -->
  <intermediateThrowEvent id="state2ToState3">
    <linkEventDefinition id="state2ToState3LinkId">
      <target>state3LinkId</target>
    </linkEventDefinition>
  </intermediateThrowEvent>
  
  <!-- State 3 -->
  <intermediateCatchEvent id="state3">
    <linkEventDefinition id="state3LinkId">
      <source>toState3LinkId</source>
      <source>state2ToState3LinkId</source>
    </linkEventDefinition>
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
    String activityId = runtimeService.getActiveActivityIds(execution.getProcessInstanceId()).stream()
        .findFirst()
        .orElse("none");
    if ("throwLink".equals(activityId) || "catchLink".equals(activityId)) {
        System.out.println("At link event: " + activityId);
    }
}
```

## Best Practices

### 1. Use Descriptive Link IDs

The definition `id` values (and the `<target>` references) are what tie a throw to its catch, so make them descriptive:

```xml
<!-- GOOD: Clear purpose -->
<intermediateThrowEvent id="skipValidation">
  <linkEventDefinition id="skipToFinalApprovalLinkId">
    <target>finalApprovalLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<!-- BAD: Generic -->
<intermediateThrowEvent id="throw1">
  <linkEventDefinition id="link1LinkId">
    <target>link1CatchLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>
```

### 2. Consolidate Similar Paths

```xml
<!-- GOOD: Multiple throws to one catch -->
<intermediateThrowEvent id="error1">
  <linkEventDefinition id="error1LinkId">
    <target>errorHandlerLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<intermediateThrowEvent id="error2">
  <linkEventDefinition id="error2LinkId">
    <target>errorHandlerLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<intermediateCatchEvent id="errorCatch">
  <linkEventDefinition id="errorHandlerLinkId">
    <source>error1LinkId</source>
    <source>error2LinkId</source>
  </linkEventDefinition>
</intermediateCatchEvent>

<!-- BAD: Separate error handling for each -->
<intermediateThrowEvent id="error1">
  <linkEventDefinition id="error1LinkId">
    <target>error1HandlerLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<intermediateCatchEvent id="error1Catch">
  <linkEventDefinition id="error1HandlerLinkId">
    <source>error1LinkId</source>
  </linkEventDefinition>
</intermediateCatchEvent>
```

### 3. Avoid Circular Links

```xml
<!-- BAD: Infinite loop -->
<intermediateThrowEvent id="loop1">
  <linkEventDefinition id="loop1LinkId">
    <target>catch1LinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition id="catch1LinkId">
    <source>loop1LinkId</source>
  </linkEventDefinition>
</intermediateCatchEvent>

<sequenceFlow id="back" sourceRef="catch1" targetRef="loop1"/>

<!-- GOOD: Controlled loop with exit -->
<intermediateThrowEvent id="loop1">
  <linkEventDefinition id="loop1LinkId">
    <target>catch1LinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition id="catch1LinkId">
    <source>loop1LinkId</source>
  </linkEventDefinition>
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
  Throw: After source check (definition id "skipValidationLinkId")
  Catch: Before processing (definition id "processingLinkId")
-->
<intermediateThrowEvent id="skipValidation">
  <linkEventDefinition id="skipValidationLinkId">
    <target>processingLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<!-- BAD: No context -->
<intermediateThrowEvent id="throw1">
  <linkEventDefinition id="link1LinkId">
    <target>link1CatchLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>
```

### 5. Use for Diagram Clarity, Not Logic

```xml
<!-- GOOD: Reduces crossing lines -->
<intermediateThrowEvent id="jump">
  <linkEventDefinition id="jumpLinkId">
    <target>consolidateLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<!-- BAD: Obscures flow logic -->
<intermediateThrowEvent id="mysteryJump">
  <linkEventDefinition id="mysteryJumpLinkId">
    <target>unknownLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>
```

## Common Pitfalls

### 1. Mismatched Link IDs

**Problem:** The throw's `<target>` doesn't point at the catch's definition `id`

```xml
<!-- WRONG: Target does not match the catch definition id -->
<intermediateThrowEvent id="throw1">
  <linkEventDefinition id="throw1LinkId">
    <target>someOtherLinkId</target>  <!-- No catch definition has this id -->
  </linkEventDefinition>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition id="catch1LinkId">
    <source>throw1LinkId</source>
  </linkEventDefinition>
</intermediateCatchEvent>

<!-- CORRECT: Target equals the catch definition id -->
<intermediateThrowEvent id="throw1">
  <linkEventDefinition id="throw1LinkId">
    <target>catch1LinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition id="catch1LinkId">
    <source>throw1LinkId</source>
  </linkEventDefinition>
</intermediateCatchEvent>
```

**Error:** At throw time, `LinkThrowEventFlowNodeHelper.findRelatedIntermediateCatchEventForLinkEvent` returns `null`, the execution's current flow element is set to `null`, and the engine fails with a `NullPointerException` while continuing the process. Deployment validation also rejects a throw without any `<target>` (`LINK_EVENT_DEFINITION_MISSING_TARGET`) and a catch without any `<source>` (`LINK_EVENT_DEFINITION_MISSING_SOURCE`).

### 2. Using Links Across Processes

**Problem:** Links don't work across process boundaries

```xml
<!-- WRONG: Link in called process -->
<callActivity id="callSub" calledElement="subProcess">
  <intermediateThrowEvent id="throw1">
    <linkEventDefinition id="throw1LinkId">
      <target>crossProcessLinkId</target>  <!-- Won't work -->
    </linkEventDefinition>
  </intermediateThrowEvent>
</callActivity>

<!-- CORRECT: Link within same process -->
<intermediateThrowEvent id="throw1">
  <linkEventDefinition id="withinProcessLinkId">
    <target>withinProcessCatchLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>
```

### 3. Forgetting Variables Persist

**Problem:** Assuming variables are lost across links

```xml
<!-- Link events DON'T clear variables -->
<serviceTask id="setVar" activiti:class="com.example.SetVariable"/>

<intermediateThrowEvent id="throw1">
  <linkEventDefinition id="throw1LinkId">
    <target>catch1LinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<intermediateCatchEvent id="catch1">
  <linkEventDefinition id="catch1LinkId">
    <source>throw1LinkId</source>
  </linkEventDefinition>
</intermediateCatchEvent>

<!-- Variable set before throw is still available after catch -->
<serviceTask id="getVar" activiti:class="com.example.GetVariable"/>
```

### 4. Creating Unreachable Catch Events

**Problem:** Catch event with no corresponding throw

```xml
<!-- WRONG: Orphan catch - no throw targets this link id -->
<intermediateCatchEvent id="orphanCatch">
  <linkEventDefinition id="orphanLinkId">
    <source>unrelatedThrowLinkId</source>
  </linkEventDefinition>
</intermediateCatchEvent>

<!-- CORRECT: Ensure a throw's target points at the catch's link id -->
<intermediateThrowEvent id="theThrow">
  <linkEventDefinition id="theThrowLinkId">
    <target>theCatchLinkId</target>
  </linkEventDefinition>
</intermediateThrowEvent>

<intermediateCatchEvent id="theCatch">
  <linkEventDefinition id="theCatchLinkId">
    <source>theThrowLinkId</source>
  </linkEventDefinition>
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
