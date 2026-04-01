---
sidebar_label: Manual Task
slug: /bpmn/elements/manual-task
description: Guide to ManualTask elements for tasks performed outside the workflow engine
---

# Manual Task

Manual Tasks represent work that is performed **outside the workflow engine**, typically by a human operator using external tools or procedures.

## 📋 Overview

```xml
<manualTask id="manual1" name="Manual Verification"/>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ Execution listeners, documentation

## 🎯 Key Features

### Standard BPMN Features
- **Documentation** - Manual procedures
- **Input/Output Data** - Data associations
- **Multi-instance** - Parallel executions

### Activiti Customizations
- **Execution Listeners** - Track manual completion
- **Async Execution** - Background monitoring
- **Custom Properties** - Metadata extension
- **Skip Expression** - Conditional execution

## 📝 Configuration Options

### Basic Manual Task

```xml
<manualTask id="manualReview" 
            name="Manual Data Review"
            activiti:documentation="Review data in external system and verify accuracy"/>
```

### With Execution Listeners

```xml
<manualTask id="trackedManual" 
            name="Tracked Manual Task">
  
  <activiti:executionListener event="start" class="com.example.ManualTaskStartedListener"/>
  <activiti:executionListener event="end" class="com.example.ManualTaskCompletedListener"/>
</manualTask>
```

### Async Manual Task

```xml
<manualTask id="asyncManual" 
            name="Async Manual Task"
            activiti:async="true"
            activiti:documentation="Complete this task in the external system"/>
```

## 💡 Complete Examples

### Example 1: External System Verification

```xml
<manualTask id="verifyInExternalSystem" 
            name="Verify in Legacy System"
            activiti:documentation="Log into legacy system and verify customer data matches">
  
  <activiti:executionListener event="start" delegateExpression="${manualTaskNotifier.notifyStart()}"/>
  
  <activiti:property name="externalSystem" value="legacyCRM"/>
  <activiti:property name="procedure" value="verification"/>
</manualTask>
```

### Example 2: Physical Action

```xml
<manualTask id="physicalInspection" 
            name="Physical Inventory Check"
            activiti:documentation="Walk warehouse floor and count items manually">
  
  <activiti:property name="location" value="warehouse-A"/>
  <activiti:property name="checklist" value="inventory-checklist-v2"/>
</manualTask>
```

## 🔍 Runtime API Usage

### Completing Manual Tasks

```java
// Manual tasks are completed when the external work is done
taskService.complete(taskId);

// Or with variables
taskService.complete(taskId, Map.of("verified", true, "notes", "All items checked"));
```

## 📊 Best Practices

1. **Clear Documentation:** Describe exact manual procedures
2. **Execution Listeners:** Track when tasks start/complete
3. **External Integration:** Connect to external systems where possible
4. **Timeout Handling:** Add boundary events for delays
5. **Audit Trail:** Log manual task completion
6. **Training:** Ensure users understand procedures

## 🔗 Related Documentation

- [User Task](./user-task.md)
- [Service Task](./service-task.md)
- [Task Listeners](../advanced/task-listeners.md)

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated:** 2024
