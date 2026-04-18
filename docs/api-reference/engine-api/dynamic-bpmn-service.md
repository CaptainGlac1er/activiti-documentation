---
sidebar_label: Dynamic BPMN Service
slug: /api-reference/engine-api/dynamic-bpmn-service
title: "DynamicBpmnService"
description: "Complete guide to DynamicBpmnService in Activiti - modifying BPMN element properties at runtime without redeployment."
---

# DynamicBpmnService

The `DynamicBpmnService` provides **runtime modification capabilities** for BPMN element properties. It allows you to change task configurations, expressions, and properties on active process instances without redeploying the process definition.

## Overview

```java
public interface DynamicBpmnService {
    // Get process definition info
    ObjectNode getProcessDefinitionInfo(String processDefinitionId);
    
    // Modify service tasks
    ObjectNode changeServiceTaskClassName(String id, String className);
    ObjectNode changeServiceTaskExpression(String id, String expression);
    ObjectNode changeServiceTaskDelegateExpression(String id, String expression);
    
    // Modify script tasks
    ObjectNode changeScriptTaskScript(String id, String script);
    
    // Modify user tasks
    ObjectNode changeUserTaskName(String id, String name);
    ObjectNode changeUserTaskDescription(String id, String description);
    ObjectNode changeUserTaskAssignee(String id, String assignee);
    // ... and more
    
    // Modify sequence flows
    ObjectNode changeSequenceFlowCondition(String id, String condition);
}
```

**BPMN 2.0 Standard:** ❌ Activiti Extension  
**Activiti Implementation:** Runtime property modification

## Key Features

### Modifiable Elements

| Element Type | Modifiable Properties |
|--------------|----------------------|
| **Service Task** | Class name, expression, delegate expression |
| **Script Task** | Script content |
| **User Task** | Name, description, assignee, owner, form key, due date, priority, category, candidates |
| **Sequence Flow** | Condition expression |
| **DMN Task** | Decision table key |
| **Localization** | Names, descriptions per language |

### Use Cases

- **Emergency Fixes** - Change task behavior without redeployment
- **A/B Testing** - Modify conditions for different user groups
- **Configuration** - Update assignees, priorities dynamically
- **Debugging** - Change script logic on-the-fly
- **Personalization** - Adapt process for specific instances

## Basic Usage

### Getting Process Definition Info

```java
DynamicBpmnService dynamicBpmnService = processEngine.getDynamicBpmnService();

// Get info for a process definition
ObjectNode info = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);

// Access element properties
String serviceName = info.get("serviceTaskId").get("name").asText();
```

### Modifying Service Task Class

```java
public class ServiceTaskModificationExample {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void changeServiceTaskImplementation(String processDefinitionId, 
                                                String serviceTaskId,
                                                String newClassName) {
        // Change the class name for a service task
        ObjectNode result = dynamicBpmnService.changeServiceTaskClassName(
            serviceTaskId, 
            newClassName
        );
        
        // Result contains modification details
        System.out.println("Modification result: " + result.toString());
    }
    
    public void changeServiceTaskWithInfoNode(String processDefinitionId,
                                             String serviceTaskId,
                                             String newClassName) {
        // Get current info
        ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
        
        // Change with info node (for tracking)
        dynamicBpmnService.changeServiceTaskClassName(
            serviceTaskId, 
            newClassName, 
            infoNode
        );
        
        // Save the modified info
        dynamicBpmnService.saveProcessDefinitionInfo(processDefinitionId, infoNode);
    }
}
```

### Modifying Service Task Expression

```java
public class ServiceTaskExpressionExample {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void changeToExpression(String serviceTaskId, String expression) {
        // Change from class to expression
        ObjectNode result = dynamicBpmnService.changeServiceTaskExpression(
            serviceTaskId,
            "${orderService.processOrder()}"
        );
    }
    
    public void changeToDelegateExpression(String serviceTaskId, String delegateExpression) {
        // Change to delegate expression
        ObjectNode result = dynamicBpmnService.changeServiceTaskDelegateExpression(
            serviceTaskId,
            "#{paymentService.processPayment()}"
        );
    }
}
```

## User Task Modifications

### Changing Task Name and Description

```java
public class UserTaskLabelModification {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void updateTaskLabels(String userTaskId) {
        // Change task name
        ObjectNode nameResult = dynamicBpmnService.changeUserTaskName(
            userTaskId,
            "Review Customer Application"
        );
        
        // Change task description
        ObjectNode descResult = dynamicBpmnService.changeUserTaskDescription(
            userTaskId,
            "Review the customer's application and supporting documents"
        );
    }
}
```

### Modifying Assignee and Owner

```java
public class TaskAssignmentModification {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void changeTaskAssignee(String userTaskId, String newAssignee) {
        // Change the default assignee expression
        ObjectNode result = dynamicBpmnService.changeUserTaskAssignee(
            userTaskId,
            newAssignee  // Can be literal or expression like "${managerId}"
        );
    }
    
    public void changeTaskOwner(String userTaskId, String newOwner) {
        // Change the task owner
        ObjectNode result = dynamicBpmnService.changeUserTaskOwner(
            userTaskId,
            newOwner
        );
    }
}
```

### Modifying Candidate Users and Groups

```java
public class TaskCandidateModification {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void addCandidateUser(String userTaskId, String candidateUser) {
        // Add candidate user (false = don't overwrite existing)
        ObjectNode result = dynamicBpmnService.changeUserTaskCandidateUser(
            userTaskId,
            candidateUser,
            false  // overwriteOtherChangedEntries
        );
    }
    
    public void setCandidateGroup(String userTaskId, String candidateGroup) {
        // Set candidate group (true = overwrite existing)
        ObjectNode result = dynamicBpmnService.changeUserTaskCandidateGroup(
            userTaskId,
            candidateGroup,
            true  // overwriteOtherChangedEntries
        );
    }
}
```

### Changing Task Properties

```java
public class TaskPropertyModification {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void updateTaskProperties(String userTaskId) {
        // Change form key
        dynamicBpmnService.changeUserTaskFormKey(
            userTaskId,
            "approval-form-v2.html"
        );
        
        // Change due date expression
        dynamicBpmnService.changeUserTaskDueDate(
            userTaskId,
            "${dueDate}"  // Expression or literal date
        );
        
        // Change priority expression
        dynamicBpmnService.changeUserTaskPriority(
            userTaskId,
            "50"  // String representation
        );
        
        // Change category
        dynamicBpmnService.changeUserTaskCategory(
            userTaskId,
            "approval"
        );
    }
}
```

## Script Task Modifications

### Changing Script Content

```java
public class ScriptTaskModification {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void updateScript(String scriptTaskId, String newScript) {
        // Change script content
        ObjectNode result = dynamicBpmnService.changeScriptTaskScript(
            scriptTaskId,
            "total = quantity * price;\nexecution.setVariable('total', total);"
        );
        
        System.out.println("Script updated: " + result.toString());
    }
    
    public void updateScriptWithTracking(String scriptTaskId, String newScript) {
        // Get info node
        ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
        
        // Update with tracking
        dynamicBpmnService.changeScriptTaskScript(
            scriptTaskId,
            newScript,
            infoNode
        );
        
        // Save changes
        dynamicBpmnService.saveProcessDefinitionInfo(processDefinitionId, infoNode);
    }
}
```

## Sequence Flow Modifications

### Changing Flow Conditions

```java
public class SequenceFlowModification {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void updateFlowCondition(String sequenceFlowId, String newCondition) {
        // Change sequence flow condition
        ObjectNode result = dynamicBpmnService.changeSequenceFlowCondition(
            sequenceFlowId,
            "${orderAmount > 1000}"  // New condition expression
        );
        
        System.out.println("Condition updated: " + result.toString());
    }
    
    public void updateFlowConditionWithTracking(String sequenceFlowId, String newCondition) {
        ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
        
        dynamicBpmnService.changeSequenceFlowCondition(
            sequenceFlowId,
            newCondition,
            infoNode
        );
        
        dynamicBpmnService.saveProcessDefinitionInfo(processDefinitionId, infoNode);
    }
}
```

## DMN Task Modifications

### Changing Decision Table Key

```java
public class DmnTaskModification {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void updateDecisionTable(String dmnTaskId, String newDecisionKey) {
        // Change DMN decision table reference
        ObjectNode result = dynamicBpmnService.changeDmnTaskDecisionTableKey(
            dmnTaskId,
            newDecisionKey
        );
    }
}
```

## Localization Modifications

### Changing Localized Text

```java
public class LocalizationModification {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void updateLocalizedNames(String elementId) {
        // Update name in English
        dynamicBpmnService.changeLocalizationName(
            "en",
            elementId,
            "Review Order"
        );
        
        // Update name in Spanish
        dynamicBpmnService.changeLocalizationName(
            "es",
            elementId,
            "Revisar Pedido"
        );
        
        // Update description in English
        dynamicBpmnService.changeLocalizationDescription(
            "en",
            elementId,
            "Please review the order details"
        );
    }
    
    public void getLocalizedProperties(String elementId) {
        // Get localization properties
        ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
        ObjectNode localizedProps = dynamicBpmnService.getLocalizationElementProperties(
            "en",
            elementId,
            infoNode
        );
    }
}
```

## Complete Examples

### Example 1: Emergency Task Reassignment

```java
@Service
public class EmergencyReassignmentService {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    @Autowired
    private RuntimeService runtimeService;
    
    /**
     * Reassign all pending approval tasks to a backup approver
     */
    public void emergencyReassignment(String processDefinitionKey, String backupApprover) {
        // Find all active instances
        List<ProcessInstance> instances = runtimeService.createProcessInstanceQuery()
            .processDefinitionKey(processDefinitionKey)
            .active()
            .list();
        
        for (ProcessInstance instance : instances) {
            try {
                // Change the assignee for the approval task
                ObjectNode result = dynamicBpmnService.changeUserTaskAssignee(
                    "managerApproval",
                    backupApprover
                );
                
                log.info("Reassigned tasks in process {} to {}", 
                        instance.getId(), backupApprover);
                
            } catch (Exception e) {
                log.error("Failed to reassign in process {}", instance.getId(), e);
            }
        }
    }
}
```

### Example 2: Dynamic Condition Update

```java
@Service
public class DynamicConditionService {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    /**
     * Update approval threshold based on business rules
     */
    public void updateApprovalThreshold(String sequenceFlowId, double newThreshold) {
        String condition = String.format("${orderAmount > %.2f}", newThreshold);
        
        ObjectNode result = dynamicBpmnService.changeSequenceFlowCondition(
            sequenceFlowId,
            condition
        );
        
        log.info("Updated approval threshold to {}: {}", newThreshold, result.toString());
    }
    
    /**
     * A/B testing - different conditions for different user groups
     */
    public void setupAbTesting(String sequenceFlowId, String userId) {
        String condition;
        
        if (userId.startsWith("groupA")) {
            condition = "${orderAmount > 1000}";
        } else {
            condition = "${orderAmount > 500}";
        }
        
        dynamicBpmnService.changeSequenceFlowCondition(sequenceFlowId, condition);
    }
}
```

### Example 3: Runtime Script Update

```java
@Service
public class RuntimeScriptUpdateService {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    /**
     * Update calculation script without redeployment
     */
    public void updateCalculationScript(String scriptTaskId, String newFormula) {
        String script = String.format(
            "total = quantity * price;\ndiscount = total * %s;\nfinalTotal = total - discount;\n" +
            "execution.setVariable('finalTotal', finalTotal);",
            newFormula
        );
        
        ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
        
        dynamicBpmnService.changeScriptTaskScript(scriptTaskId, script, infoNode);
        
        dynamicBpmnService.saveProcessDefinitionInfo(processDefinitionId, infoNode);
        
        log.info("Updated calculation script with formula: {}", newFormula);
    }
}
```

### Example 4: Bulk Task Property Update

```java
@Service
public class BulkTaskUpdateService {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    /**
     * Update properties for multiple tasks at once
     */
    public void bulkUpdateTaskProperties(String processDefinitionId, Map<String, Map<String, String>> updates) {
        ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
        
        for (Map.Entry<String, Map<String, String>> entry : updates.entrySet()) {
            String taskId = entry.getKey();
            Map<String, String> properties = entry.getValue();
            
            if (properties.containsKey("name")) {
                dynamicBpmnService.changeUserTaskName(taskId, properties.get("name"), infoNode);
            }
            
            if (properties.containsKey("description")) {
                dynamicBpmnService.changeUserTaskDescription(taskId, properties.get("description"), infoNode);
            }
            
            if (properties.containsKey("assignee")) {
                dynamicBpmnService.changeUserTaskAssignee(taskId, properties.get("assignee"), infoNode);
            }
            
            if (properties.containsKey("formKey")) {
                dynamicBpmnService.changeUserTaskFormKey(taskId, properties.get("formKey"), infoNode);
            }
        }
        
        // Save all changes
        dynamicBpmnService.saveProcessDefinitionInfo(processDefinitionId, infoNode);
    }
}
```

## Using ObjectNode for Tracking

### Get and Save Process Definition Info

```java
public class ProcessDefinitionInfoTracking {
    
    @Autowired
    private DynamicBpmnService dynamicBpmnService;
    
    public void modifyWithTracking(String processDefinitionId) {
        // 1. Get current state
        ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
        
        // 2. Make modifications with infoNode
        dynamicBpmnService.changeUserTaskName("task1", "New Name", infoNode);
        dynamicBpmnService.changeUserTaskAssignee("task1", "newUser", infoNode);
        dynamicBpmnService.changeServiceTaskClassName("service1", "NewClass", infoNode);
        
        // 3. Save modified state
        dynamicBpmnService.saveProcessDefinitionInfo(processDefinitionId, infoNode);
        
        // 4. Get element properties
        ObjectNode elementProps = dynamicBpmnService.getBpmnElementProperties("task1", infoNode);
    }
}
```

## Best Practices

### 1. Use InfoNode for Tracking

```java
// GOOD: Track changes with infoNode
ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
dynamicBpmnService.changeUserTaskName(taskId, newName, infoNode);
dynamicBpmnService.saveProcessDefinitionInfo(processDefinitionId, infoNode);

// BAD: No tracking
dynamicBpmnService.changeUserTaskName(taskId, newName);
```

### 2. Validate Before Modifying

```java
// GOOD: Validate first
if (isValidTaskId(taskId)) {
    dynamicBpmnService.changeUserTaskName(taskId, newName);
}

// BAD: No validation
dynamicBpmnService.changeUserTaskName(taskId, newName);
```

### 3. Log All Modifications

```java
// GOOD: Comprehensive logging
log.info("Changing task {} name from {} to {}", taskId, oldName, newName);
ObjectNode result = dynamicBpmnService.changeUserTaskName(taskId, newName);
log.info("Modification result: {}", result.toString());

// BAD: No logging
dynamicBpmnService.changeUserTaskName(taskId, newName);
```

### 4. Test Modifications First

```java
// GOOD: Test on non-production first
String testProcessDefId = getTestProcessDefinitionId();
dynamicBpmnService.changeServiceTaskClassName(taskId, newClass, 
    dynamicBpmnService.getProcessDefinitionInfo(testProcessDefId));

// Verify works correctly
// Then apply to production

// BAD: Direct production modification
```

### 5. Use Expressions for Flexibility

```java
// GOOD: Expression allows runtime evaluation
dynamicBpmnService.changeUserTaskAssignee(taskId, "${dynamicAssignee}");

// BAD: Hardcoded value
dynamicBpmnService.changeUserTaskAssignee(taskId, "john.doe");
```

## Common Pitfalls

### 1. Modifying Non-Existent Elements

```java
// Problem: Task ID doesn't exist
try {
    dynamicBpmnService.changeUserTaskName("nonExistentTask", "New Name");
    // Throws exception
} catch (ActivitiException e) {
    log.error("Task not found", e);
}

// Solution: Verify element exists first
ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
if (infoNode.has("nonExistentTask")) {
    dynamicBpmnService.changeUserTaskName("nonExistentTask", "New Name", infoNode);
}
```

### 2. Forgetting to Save InfoNode

```java
// Problem: Changes not persisted
ObjectNode infoNode = dynamicBpmnService.getProcessDefinitionInfo(processDefinitionId);
dynamicBpmnService.changeUserTaskName(taskId, newName, infoNode);
// Forgot to save!

// Solution: Always save
dynamicBpmnService.saveProcessDefinitionInfo(processDefinitionId, infoNode);
```

### 3. Invalid Expression Syntax

```java
// Problem: Malformed expression
dynamicBpmnService.changeSequenceFlowCondition(flowId, "${orderAmount > 1000");
// Missing closing brace

// Solution: Validate expression
if (isValidExpression("${orderAmount > 1000}")) {
    dynamicBpmnService.changeSequenceFlowCondition(flowId, "${orderAmount > 1000}");
}
```

### 4. Modifying Running Instances

```java
// Problem: Changes may not affect already-running instances
// DynamicBpmnService typically affects new instances or specific scope

// Solution: Understand scope of changes
// Check if changes apply to:
// - New process instances only
// - Active instances
// - Specific instance
```

## API Reference

### Service Task Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `changeServiceTaskClassName` | `id`, `className` | `ObjectNode` | Change implementation class |
| `changeServiceTaskExpression` | `id`, `expression` | `ObjectNode` | Change expression |
| `changeServiceTaskDelegateExpression` | `id`, `expression` | `ObjectNode` | Change delegate expression |

### User Task Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `changeUserTaskName` | `id`, `name` | `ObjectNode` | Change task name |
| `changeUserTaskDescription` | `id`, `description` | `ObjectNode` | Change description |
| `changeUserTaskAssignee` | `id`, `assignee` | `ObjectNode` | Change assignee |
| `changeUserTaskOwner` | `id`, `owner` | `ObjectNode` | Change owner |
| `changeUserTaskCandidateUser` | `id`, `user`, `overwrite` | `ObjectNode` | Add/change candidate user |
| `changeUserTaskCandidateGroup` | `id`, `group`, `overwrite` | `ObjectNode` | Add/change candidate group |
| `changeUserTaskFormKey` | `id`, `formKey` | `ObjectNode` | Change form key |
| `changeUserTaskDueDate` | `id`, `dueDate` | `ObjectNode` | Change due date |
| `changeUserTaskPriority` | `id`, `priority` | `ObjectNode` | Change priority |
| `changeUserTaskCategory` | `id`, `category` | `ObjectNode` | Change category |

### Other Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `changeScriptTaskScript` | `id`, `script` | `ObjectNode` | Change script content |
| `changeSequenceFlowCondition` | `id`, `condition` | `ObjectNode` | Change flow condition |
| `changeDmnTaskDecisionTableKey` | `id`, `key` | `ObjectNode` | Change DMN decision key |
| `changeLocalizationName` | `lang`, `id`, `value` | `ObjectNode` | Change localized name |
| `changeLocalizationDescription` | `lang`, `id`, `value` | `ObjectNode` | Change localized description |
| `getProcessDefinitionInfo` | `processDefinitionId` | `ObjectNode` | Get process info |
| `saveProcessDefinitionInfo` | `processDefinitionId`, `infoNode` | `void` | Save process info |

## Related Documentation

- [Runtime Service](./runtime-service.md) - Process instance management
- [Repository Service](./repository-service.md) - Process definitions
- [User Task](../../bpmn/elements/user-task.md) - User task configuration
- [Service Task](../../bpmn/elements/service-task.md) - Service task configuration
- [Script Task](../../bpmn/elements/script-task.md) - Script task configuration

---

**Last Updated:** 2026  
**Source:** `DynamicBpmnService.java`
