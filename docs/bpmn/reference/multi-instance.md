---
sidebar_label: Multi-Instance
slug: /bpmn/reference/multi-instance
title: "Multi-Instance Activities"
description: "Complete guide to multi-instance activities in Activiti for iterative execution with parallel or sequential processing of collections."
---

# Multi-Instance Activities

Multi-instance activities allow you to **execute an activity multiple times**, either sequentially or in parallel. This is useful for processing collections, approvals, or any scenario requiring iterative execution.

## Overview

```xml
<userTask id="reviewTask" name="Review">
  <multiInstanceLoopCharacteristics 
    isSequential="false" 
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
  </multiInstanceLoopCharacteristics>
</userTask>
```

**Key Benefits:**
- Process collections efficiently
- Parallel or sequential execution
- Built-in completion conditions
- Input/output data mapping
- Support for all activity types

## When to Use Multi-Instance

### Ideal Use Cases

1. **Approval Workflows**
   - Multiple approvers
   - Committee reviews
   - Hierarchical approvals

2. **Batch Processing**
   - Process list of items
   - Bulk operations
   - Data transformations

3. **Notifications**
   - Send to multiple recipients
   - Multi-channel communication
   - Group notifications

4. **Data Collection**
   - Gather feedback from multiple sources
   - Aggregate results
   - Parallel data fetching

### Supported Activity Types

- User Tasks
- Service Tasks
- Script Tasks
- Call Activities
- SubProcesses
- Business Rule Tasks
- Manual Tasks

## Configuration

### Using Collection (Activiti Extension)

```xml
<userTask id="reviewTask" name="Review">
  <multiInstanceLoopCharacteristics 
    isSequential="false" 
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
  </multiInstanceLoopCharacteristics>
</userTask>
```

**Parameters:**
- `activiti:collection` - The collection to iterate over
- `activiti:elementVariable` - Variable name for current element
- `isSequential` - Execution mode (true/false)

### Using Loop Cardinality (BPMN Standard)

```xml
<userTask id="reviewTask" name="Review">
  <multiInstanceLoopCharacteristics isSequential="true">
    <loopCardinality>${reviewers.size()}</loopCardinality>
  </multiInstanceLoopCharacteristics>
</userTask>
```

**Parameters:**
- `loopCardinality` - Number of iterations
- `isSequential` - Execution mode

## Execution Modes

### Sequential (One Instance at a Time)

Instances execute **one after another** in order.

```xml
<multiInstanceLoopCharacteristics 
  isSequential="true"
  activiti:collection="${items}"
  activiti:elementVariable="item">
</multiInstanceLoopCharacteristics>
```

**Characteristics:**
- Ordered execution
- Each instance waits for previous to complete
- Access to `loopCounter` variable
- Better for dependent operations
- ❌ Slower overall execution

**Use Cases:**
- Sequential approvals
- Ordered processing
- Dependent operations

### Parallel (All Instances Simultaneously)

Instances execute **concurrently** without waiting.

```xml
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${items}"
  activiti:elementVariable="item">
</multiInstanceLoopCharacteristics>
```

**Characteristics:**
- Concurrent execution
- Faster overall processing
- No ordering guarantees
- Better for independent operations
- ❌ Higher resource usage

**Use Cases:**
- Sending notifications
- Parallel API calls
- Independent approvals

## Completion Conditions

Specify when the multi-instance activity should complete.

### Basic Completion

```xml
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${reviewers}"
  activiti:elementVariable="reviewer">
  
  <!-- Complete when 3 reviews done -->
  <completionCondition>${reviewResults.size() >= 3}</completionCondition>
  
</multiInstanceLoopCharacteristics>
```

### Using Built-in Variables

```xml
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${reviewers}"
  activiti:elementVariable="reviewer">
  
  <!-- Complete when all instances done -->
  <completionCondition>${nrOfCompletedInstances >= nrOfInstances}</completionCondition>
  
  <!-- Complete when 3 instances done -->
  <completionCondition>${nrOfCompletedInstances >= 3}</completionCondition>
  
  <!-- Complete when 80% done -->
  <completionCondition>${nrOfCompletedInstances / nrOfInstances >= 0.8}</completionCondition>
  
</multiInstanceLoopCharacteristics>
```

### Complex Completion

```xml
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${tasks}"
  activiti:elementVariable="task">
  
  <!-- Complete when 80% done OR all rejected -->
  <completionCondition>
    ${nrOfCompletedInstances / nrOfInstances >= 0.8 || 
     rejectedCount == nrOfInstances}
  </completionCondition>
  
</multiInstanceLoopCharacteristics>
```

### No Completion Condition (Default)

If no completion condition is specified, the multi-instance completes when **all instances have finished**.

```xml
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${items}"
  activiti:elementVariable="item">
  <!-- Completes when all items processed -->
</multiInstanceLoopCharacteristics>
```

## Built-in Variables

Multi-instance activities provide these **automatic variables**:

| Variable                 | Description                          | Sequential | Parallel |
|--------------------------|--------------------------------------|------------|----------|
| `nrOfInstances`          | Total number of instances             | ✅         | ✅       |
| `nrOfActiveInstances`    | Number of currently active instances  | ✅         | ✅       |
| `nrOfCompletedInstances` | Number of completed instances         | ✅         | ✅       |
| `loopCounter`            | Current iteration index (0-based)     | ✅         | ✅       |
| `<elementVariable>`      | Current collection element (name varies) | ✅      | ✅       |

**Notes:**
- `loopCounter` is the 0-based index of the current instance. Its variable name defaults to `loopCounter` but can be customized with `activiti:elementIndexVariable`.
- `<elementVariable>` refers to the name set via `activiti:elementVariable` (e.g., if `activiti:elementVariable="item"`, the variable is called `item`).
- All counter variables (`nrOfInstances`, `nrOfActiveInstances`, `nrOfCompletedInstances`) are set on the **multi-instance scope execution** (parent), not on individual child executions. Child executions can access them through variable inheritance.
- `loopCounter` and the element variable are **local** to each child execution.

### elementIndexVariable

By default, the loop index variable is named `loopCounter`. Use `activiti:elementIndexVariable` to customize it:

```xml
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${items}"
  activiti:elementVariable="item"
  activiti:elementIndexVariable="itemIndex">
</multiInstanceLoopCharacteristics>
```

### Using Built-in Variables

```xml
<multiInstanceLoopCharacteristics 
  isSequential="true"
  activiti:collection="${items}"
  activiti:elementVariable="item">
  
  <completionCondition>${nrOfCompletedInstances >= 5}</completionCondition>
  
</multiInstanceLoopCharacteristics>
```

```java
// In delegate
public void execute(DelegateExecution execution) {
    // Get current item (local to this child execution)
    Object currentItem = execution.getVariable("item");
    
    // Get loop counter (available in both sequential and parallel)
    Integer counter = (Integer) execution.getVariable("loopCounter");
    
    // Get completion stats (on parent execution scope)
    Integer completed = (Integer) execution.getVariable("nrOfCompletedInstances");
    Integer total = (Integer) execution.getVariable("nrOfInstances");
    Integer active = (Integer) execution.getVariable("nrOfActiveInstances");
}
```

## Input/Output Data Items

Map data to and from each instance.

**Important:** The `inputDataItem` and `outputDataItem` elements are parsed from the `name` attribute only — they do **not** support nested `<assignment>`/`<from>`/`<to>` children. Use simple attribute syntax.

### Input Data Items

The `inputDataItem` name attribute maps to the `elementVariable`. It specifies what variable name to use for the current collection element inside each instance:

```xml
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${reviewers}"
  activiti:elementVariable="reviewer">
  
  <!-- Maps collection element to 'reviewer' variable in each instance -->
  <inputDataItem name="reviewer"/>
  
</multiInstanceLoopCharacteristics>
```

### Output Data Items

The `outputDataItem` name attribute specifies the variable name used to collect results from each instance. Results are aggregated into a collection:

```xml
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${reviewers}"
  activiti:elementVariable="reviewer"
  activiti:outputDataItem="reviewResult">
  
  <!-- Each instance should set 'reviewResult' variable -->
  
</multiInstanceLoopCharacteristics>
```

### Complete Input/Output Example

```xml
<userTask id="approvalTask" name="Approve Document" activiti:assignee="${approver.email}">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${approvers}"
    activiti:elementVariable="approver">
    
    <completionCondition>${nrOfCompletedInstances >= 2}</completionCondition>
    
  </multiInstanceLoopCharacteristics>
  <extensionElements>
    <activiti:formProperty name="approved" type="bool"/>
  </extensionElements>
</userTask>
```

**Note:** Each child execution receives the current collection element as the variable named by `activiti:elementVariable` (here: `approver`). To collect results, have each instance set a variable and reference it with the `outputDataItem` attribute:

```xml
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${approvers}"
  activiti:elementVariable="approver"
  activiti:outputDataItem="approvalResult">
</multiInstanceLoopCharacteristics>
```

## Complete Examples

### Example 1: Sequential Approvals

```xml
<userTask id="sequentialApproval" name="Sequential Approval" activiti:assignee="${approver.email}">
  <multiInstanceLoopCharacteristics 
    isSequential="true"
    activiti:collection="${approvalChain}"
    activiti:elementVariable="approver">
    
    <!-- Complete when all approve -->
    <completionCondition>${approvedCount == nrOfInstances}</completionCondition>
    
    <!-- The 'approver' variable contains the current element from the collection -->
    
  </multiInstanceLoopCharacteristics>
  <extensionElements>
    <activiti:formProperty name="approved" type="bool"/>
  </extensionElements>
</userTask>
```
```

### Example 2: Parallel Notifications

```xml
<serviceTask id="sendNotifications" name="Send Notifications" activiti:class="com.example.NotificationService" activiti:async="true">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${recipients}"
    activiti:elementVariable="recipient"
    activiti:outputDataItem="deliveryStatus">
    
    <!-- Complete when all sent -->
    <completionCondition>${nrOfCompletedInstances == nrOfInstances}</completionCondition>
    
    <!-- 'recipient' contains the current collection element in each instance -->
    <!-- Service task should set 'deliveryStatus' variable for output aggregation -->
    
  </multiInstanceLoopCharacteristics>
</serviceTask>
```

### Example 3: Batch Processing with Retry

```xml
<serviceTask id="batchProcess" name="Process Batch" activiti:class="com.example.BatchProcessor" activiti:async="true">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${batchItems}"
    activiti:elementVariable="item"
    activiti:outputDataItem="processResult">
    
    <!-- Complete when 95% processed successfully -->
    <completionCondition>${successCount / nrOfInstances >= 0.95}</completionCondition>
    
    <!-- 'item' contains the current collection element in each instance -->
    <!-- Service task should set 'processResult' variable for output aggregation -->
    
  </multiInstanceLoopCharacteristics>
  <extensionElements>
    <!-- Retry policy for failed items (must be in extensionElements) -->
    <activiti:failedJobRetryTimeCycle>R3/PT1M</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>

<!-- Boundary event as sibling of serviceTask, not inside it -->
<boundaryEvent id="processError" attachedToRef="batchProcess" cancelActivity="true">
  <errorEventDefinition errorRef="BatchError"/>
</boundaryEvent>
```

### Example 4: Multi-Instance SubProcess

```xml
<subProcess id="miSubProcess" name="Multi-Instance SubProcess">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${regions}"
    activiti:elementVariable="region">
    
    <completionCondition>${nrOfCompletedInstances == nrOfInstances}</completionCondition>
    
  </multiInstanceLoopCharacteristics>
  
  <startEvent id="subStart"/>
  
  <sequenceFlow id="subFlow1" sourceRef="subStart" targetRef="subTask1"/>
  
  <serviceTask id="subTask1" name="Process Region" activiti:class="com.example.RegionProcessor">
  </serviceTask>
  
  <sequenceFlow id="subFlow2" sourceRef="subTask1" targetRef="subEnd"/>
  
  <endEvent id="subEnd"/>
  
</subProcess>
```

### Example 5: Voting/Consensus

```xml
<userTask id="votingTask" name="Vote on Proposal" activiti:assignee="${voter.email}">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${voters}"
    activiti:elementVariable="voter"
    activiti:outputDataItem="voteResult">
    
    <!-- Complete when majority votes OR all voted -->
    <completionCondition>
      ${yesVotes > nrOfInstances / 2 || 
       noVotes > nrOfInstances / 2 ||
       nrOfCompletedInstances == nrOfInstances}
    </completionCondition>
    
    <!-- 'voter' contains the current collection element in each instance -->
    <!-- User task should set 'vote' variable, collected into 'voteResult' via outputDataItem -->
    
  </multiInstanceLoopCharacteristics>
  <extensionElements>
    <activiti:formProperty name="vote" type="string"/>
    <activiti:formProperty name="comment" type="string"/>
  </extensionElements>
</userTask>
```

## Advanced Features

### Combining with Async Execution

```xml
<serviceTask id="asyncMiTask" name="Async Multi-Instance" activiti:class="com.example.AsyncProcessor" activiti:async="true">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${items}"
    activiti:elementVariable="item">
    
    <completionCondition>${nrOfCompletedInstances == nrOfInstances}</completionCondition>
    
  </multiInstanceLoopCharacteristics>
  <extensionElements>
    <!-- Each instance runs as async job -->
    <activiti:failedJobRetryTimeCycle>R/3</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>
```

### Multi-Instance with Listeners

Listeners must be inside `extensionElements`:

```xml
<userTask id="miWithListeners" name="Tracked Multi-Instance">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${items}"
    activiti:elementVariable="item">
    
  </multiInstanceLoopCharacteristics>
  <extensionElements>
    <!-- Track when multi-instance starts -->
    <activiti:executionListener event="start" class="com.example.MIStartListener"/>
    <!-- Track when multi-instance completes -->
    <activiti:executionListener event="end" class="com.example.MIEndListener"/>
  </extensionElements>
</userTask>
```

### Nested Multi-Instance

```xml
<subProcess id="outerMI" name="Outer Multi-Instance">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${departments}"
    activiti:elementVariable="department">
    
  </multiInstanceLoopCharacteristics>
  
  <userTask id="innerMI" name="Inner Multi-Instance" activiti:assignee="${member.email}">
    <multiInstanceLoopCharacteristics 
      isSequential="false"
      activiti:collection="${department.members}"
      activiti:elementVariable="member">
      
    </multiInstanceLoopCharacteristics>

  </userTask>
  
</subProcess>
```

## Best Practices

### 1. Choose Execution Mode Wisely

```xml
<!-- GOOD: Independent operations in parallel -->
<multiInstanceLoopCharacteristics isSequential="false">
  <!-- Send notifications -->
</multiInstanceLoopCharacteristics>

<!-- GOOD: Dependent operations sequentially -->
<multiInstanceLoopCharacteristics isSequential="true">
  <!-- Hierarchical approvals -->
</multiInstanceLoopCharacteristics>
```

### 2. Set Appropriate Completion Conditions

```xml
<!-- GOOD: Clear completion criteria -->
<completionCondition>${nrOfCompletedInstances >= requiredCount}</completionCondition>

<!-- BAD: No completion condition for large collections -->
<multiInstanceLoopCharacteristics activiti:collection="${largeList}">
  <!-- Will wait for ALL items -->
</multiInstanceLoopCharacteristics>
```

### 3. Use elementVariable and outputDataItem

```xml
<!-- GOOD: Use elementVariable to pass data, outputDataItem to collect results -->
<multiInstanceLoopCharacteristics
  isSequential="false"
  activiti:collection="${items}"
  activiti:elementVariable="item"
  activiti:outputDataItem="result">
</multiInstanceLoopCharacteristics>

<!-- BAD: Relying on global variables without clear mapping -->
<!-- Hard to track which instance set what -->
```

### 4. Handle Errors Appropriately

```xml
<!-- GOOD: Error handling for async MI -->
<serviceTask id="miTask" activiti:async="true">
  <multiInstanceLoopCharacteristics ... />
  <extensionElements>
    <activiti:failedJobRetryTimeCycle>R/3</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>
<!-- Boundary event as sibling -->
<boundaryEvent id="error" attachedToRef="miTask" ... />
```

### 5. Monitor Performance

```xml
<!-- GOOD: Limit parallel instances for large collections -->
<multiInstanceLoopCharacteristics 
  isSequential="false"
  activiti:collection="${items.subList(0, 100)}">
  <!-- Process in batches -->
</multiInstanceLoopCharacteristics>
```

## Common Pitfalls

### 1. Variable Scope Confusion

```java
// BAD: Using same variable name without understanding scope
public void execute(DelegateExecution execution) {
    // 'item' is the current element, not a process variable
    Object item = execution.getVariable("item");
}

// GOOD: Use elementVariable name explicitly
// In BPMN: activiti:elementVariable="currentItem"
Object currentItem = execution.getVariable("currentItem");
```

### 2. Missing Completion Condition

```xml
<!-- BAD: Large collection without completion condition -->
<multiInstanceLoopCharacteristics 
  activiti:collection="${thousandItems}">
  <!-- Waits for ALL 1000 items! -->
</multiInstanceLoopCharacteristics>

<!-- GOOD: Specify when to stop -->
<multiInstanceLoopCharacteristics 
  activiti:collection="${thousandItems}">
  <completionCondition>${nrOfCompletedInstances >= 100}</completionCondition>
</multiInstanceLoopCharacteristics>
```

### 3. Sequential vs Parallel Confusion

```xml
<!-- BAD: Using sequential for independent operations -->
<multiInstanceLoopCharacteristics isSequential="true">
  <!-- Sending 100 emails one by one - slow! -->
</multiInstanceLoopCharacteristics>

<!-- GOOD: Use parallel for independent operations -->
<multiInstanceLoopCharacteristics isSequential="false">
  <!-- Sending 100 emails concurrently - fast! -->
</multiInstanceLoopCharacteristics>
```

### 4. Not Using Built-in Variables

```java
// BAD: Manually tracking completion
public void execute(DelegateExecution execution) {
    Integer count = (Integer) execution.getVariable("myCount");
    count++;
    execution.setVariable("myCount", count);
}

// GOOD: Use built-in variables
// In completion condition: ${nrOfCompletedInstances >= 5}
```

## Troubleshooting

### Multi-Instance Not Completing

**Problem:** Activity hangs indefinitely

**Solutions:**
1. Check completion condition syntax
2. Verify collection is not empty
3. Ensure instances are actually completing
4. Check for errors in individual instances

### Wrong Number of Instances

**Problem:** Different count than expected

**Solutions:**
1. Verify collection size before multi-instance
2. Check if collection is filtered correctly
3. Ensure elementVariable is set properly

### Performance Issues

**Problem:** Slow execution

**Solutions:**
1. Use parallel instead of sequential
2. Add async execution for service tasks
3. Limit collection size
4. Use completion condition to stop early

## Related Documentation

- [Common Features](../common-features.md) - Other BPMN extensions
- [Variables](./variables.md) - Understanding variable scope
- [Async Execution](./async-execution.md) - Background processing
- [User Task](../elements/user-task.md) - Multi-instance user tasks
- [Service Task](../elements/service-task.md) - Multi-instance service tasks

---

