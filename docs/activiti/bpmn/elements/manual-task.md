---
sidebar_label: Manual Task
slug: /bpmn/elements/manual-task
title: "Manual Task"
description: "Complete guide to ManualTask elements for tasks performed outside the workflow engine with external tools or procedures."
---

# Manual Task

Manual Tasks represent work that is performed **outside the workflow engine**, typically by a human operator using external tools or procedures. Unlike User Tasks, Manual Tasks do not create task entities in the engine.

## Overview

```xml
<manualTask id="manual1" name="Manual Verification"/>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Execution listeners, documentation

## Key Features

### Standard BPMN Features

- **Documentation** - Manual procedures
- **Input/Output Data** - Data associations
- **Multi-instance** - Parallel executions

### Activiti Customizations

- **Execution Listeners** - Track when the task is passed through
- **Documentation** - Standard BPMN `<documentation>` child element
- **Async Execution** - Supports `activiti:async="true"` (inherited from `FlowNode`)

## Configuration Options

**Important:** Manual Tasks are **pass-through** activities. The process engine does not pause execution at a manual task — it continues immediately to the next element. No `TaskEntity` is created, so the task is **not** visible in the task list. In the diagram, the element serves as a documentation marker.

### Documentation

Documentation is provided as a standard BPMN `<documentation>` child element (not an attribute):

```xml
<manualTask id="manualReview" name="Manual Data Review">
  <documentation>Review data in external system and verify accuracy</documentation>
</manualTask>
```

### With Execution Listeners

Execution listeners can track when the engine passes through the task:

```xml
<manualTask id="trackedManual" name="Tracked Manual Task">
  <extensionElements>
    <activiti:executionListener event="start" class="com.example.ManualTaskStartedListener"/>
    <activiti:executionListener event="end" class="com.example.ManualTaskCompletedListener"/>
  </extensionElements>
</manualTask>
```

## Complete Examples

### Example 1: External System Verification

```xml
<manualTask id="verifyInExternalSystem" name="Verify in Legacy System">
  <documentation>Log into legacy system and verify customer data matches</documentation>
  <extensionElements>
    <activiti:executionListener event="start" delegateExpression="${manualTaskNotifier.notifyStart()}"/>
  </extensionElements>
</manualTask>
```

### Example 2: Physical Action

```xml
<manualTask id="physicalInspection" name="Physical Inventory Check">
  <documentation>Walk warehouse floor and count items manually</documentation>
</manualTask>
```

## Runtime API Usage

**Important:** Manual Tasks are pass-through (see [Configuration Options](#configuration-options)), so no runtime action is needed — and since no `TaskEntity` is created, `taskService.complete()` does not apply.

## Best Practices

1. **Clear Documentation:** Describe exact manual procedures
2. **Execution Listeners:** Track when tasks start/complete
3. **External Integration:** Connect to external systems where possible
4. **Timeout Handling:** Add boundary events for delays
5. **Audit Trail:** Log manual task completion
6. **Training:** Ensure users understand procedures

## Related Documentation

- [User Task](./user-task.md)
- [Service Task](./service-task.md)
- [Task Listeners](../reference/task-listeners.md)

---
