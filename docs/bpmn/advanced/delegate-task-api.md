---
sidebar_label: DelegateTask API
slug: /bpmn/advanced/delegate-task-api
title: "DelegateTask API"
description: "Complete reference for the DelegateTask API in Activiti - accessing and manipulating user tasks from task listeners and delegates."
---

# DelegateTask API

The `DelegateTask` interface provides **programmatic access to user task context** from within task listeners, JavaDelegates, and other custom code. It extends the task concept with execution context, enabling full manipulation of task properties, variables, and assignments.

## Overview

```java
public interface DelegateTask extends VariableScope {
    // Task identification
    String getId();
    String getName();
    String getDescription();
    String getTaskDefinitionKey();
    String getFormKey();
    void setFormKey(String formKey);

    // Task ownership
    String getAssignee();
    void setAssignee(String assignee);
    String getOwner();
    void setOwner(String owner);
    Set<IdentityLink> getCandidates();
    void addCandidateUser(String userId);
    void addCandidateGroup(String groupId);

    // Task properties
    Date getDueDate();
    void setDueDate(Date dueDate);
    Integer getPriority();
    void setPriority(int priority);
    String getCategory();
    void setCategory(String category);

    // Execution context
    DelegateExecution getExecution();

    // Event and listener info
    String getEventName();
    ActivitiListener getCurrentActivitiListener();
    DelegationState getDelegationState();
}
```

**BPMN 2.0 Standard:** ❌ Activiti Extension  
**Activiti Implementation:** Full API with comprehensive task manipulation

## Core Methods

### Task Identification

```java
public class TaskInfoListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        // Unique task ID
        String taskId = task.getId();
        
        // Task name (from BPMN)
        String taskName = task.getName();
        
        // Task description (if set in BPMN)
        String taskDescription = task.getDescription();
        
        // Task definition key (activity ID from BPMN)
        String taskDefinitionKey = task.getTaskDefinitionKey();
        
        // Form key (if configured)
        String formKey = task.getFormKey();
        
        // Task creation time
        Date createTime = task.getCreateTime();
    }
}
```

### Task Ownership

```java
public class TaskAssignmentListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        // Get current assignee
        String assignee = task.getAssignee();
        
        // Set assignee
        task.setAssignee("john.doe");
        
        // Get candidate users
        List<String> candidateUsers = task.getCandidateUsers();
        
        // Add candidate user
        task.addCandidateUser("jane.doe");
        
        // Delete candidate user
        task.deleteCandidateUser("john.doe");
        
        // Get candidate groups
        List<String> candidateGroups = task.getCandidateGroups();
        
        // Add candidate group
        task.addCandidateGroup("managers");
        
        // Delete candidate group
        task.deleteCandidateGroup("managers");
    }
}
```

### Task Properties

```java
public class TaskPropertyListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        // Due date
        Date dueDate = task.getDueDate();
        task.setDueDate(new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000)); // +24h

        // Priority (0-100, default 50)
        Integer priority = task.getPriority();
        task.setPriority(80); // High priority

        // Owner (different from assignee)
        String owner = task.getOwner();
        task.setOwner("system");

        // Delegation state
        DelegationState delegationState = task.getDelegationState();
        
        // Form key
        String formKey = task.getFormKey();
        task.setFormKey("approval-form.html");
    }
}
```

## Variable Access

DelegateTask inherits from `VariableScope`, providing both task-level and process-level variable access:

### Task Variables (Local Scope)

```java
public class TaskVariableListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        // Set task-local variable (only visible to this task)
        task.setVariable("taskNote", "Reviewed by manager");
        task.setVariableLocal("tempData", "temporary");
        
        // Get task-local variable
        String note = (String) task.getVariable("taskNote");
        String temp = (String) task.getVariableLocal("tempData");
        
        // Check if task has variable
        if (task.hasVariable("optional")) {
            Object value = task.getVariable("optional");
        }
        
        // Get all task variable names
        Set<String> taskVariableNames = task.getVariableNames();
        
        // Get all task variables
        Map<String, Object> taskVariables = task.getVariables();
        
        // Remove task variable
        task.removeVariable("obsolete");
        
        // Task variables persist with the task
        // Available when task is claimed/completed
    }
}
```

### Process Variables (Global Scope)

```java
public class ProcessVariableListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        // Access process execution
        DelegateExecution execution = task.getExecution();
        
        // Set process variable (visible throughout process)
        execution.setVariable("processData", "shared");
        
        // Get process variable
        Object processData = execution.getVariable("processData");
        
        // Or use task's variable scope (delegates to execution for non-local)
        task.setVariable("processWide", "also shared");
        
        // Task variables vs Process variables:
        // - Task variables: Stored with task, survive task completion
        // - Process variables: Stored with process instance
        // - getVariable() checks task first, then process
        // - getVariableLocal() only checks task
    }
}
```

### Typed Variable Access

```java
public class TypedVariableListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        // Type-safe get
        String name = task.getVariable("customerName", String.class);
        Integer count = task.getVariable("attemptCount", Integer.class);
        BigDecimal amount = task.getVariable("totalAmount", BigDecimal.class);

        // Check existence
        if (task.hasVariable("mightNotExist")) {
            Object value = task.getVariable("mightNotExist");
        }
    }
}
```

## Execution Context Access

### Getting DelegateExecution

```java
public class ExecutionContextListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        // Get execution context
        DelegateExecution execution = task.getExecution();
        
        // Access execution properties
        String executionId = execution.getId();
        String processInstanceId = execution.getProcessInstanceId();
        String processDefinitionId = execution.getProcessDefinitionId();
        String activityId = execution.getCurrentActivityId();

        // Business key
        String businessKey = execution.getProcessInstanceBusinessKey();

        // Navigate execution hierarchy
        DelegateExecution parent = execution.getParent();
        List<? extends DelegateExecution> children = execution.getExecutions();
        
        // Set process variables via execution
        execution.setVariable("processVar", "value");

        // Access engine services
        ProcessEngineConfiguration config = execution.getEngineServices();
        RuntimeService runtimeService = config.getRuntimeService();
    }
}
```

## Task Operations

### Claim and Assign

```java
public class TaskClaimListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        String event = task.getEventName();

        if ("create".equals(event)) {
            // Auto-assign based on process variable
            String assignee = (String) task.getExecution().getVariable("requestedBy");
            if (assignee != null) {
                task.setAssignee(assignee);
            } else {
                // Set candidate users
                task.addCandidateUser("user1");
                task.addCandidateUser("user2");
                task.addCandidateGroup("managers");
            }
            
            // Set due date
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_MONTH, 3);
            task.setDueDate(cal.getTime());
        }
    }
}
```

### Update Task Properties

```java
public class TaskUpdateListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        // Update based on business logic
        Object priority = task.getVariable("businessPriority");
        
        if ("HIGH".equals(priority)) {
            task.setPriority(90);
            // Due in 4 hours
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.HOUR, 4);
            task.setDueDate(cal.getTime());
        } else if ("MEDIUM".equals(priority)) {
            task.setPriority(60);
            // Due in 2 days
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_MONTH, 2);
            task.setDueDate(cal.getTime());
        } else {
            task.setPriority(30);
            // Due in 5 days
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_MONTH, 5);
            task.setDueDate(cal.getTime());
        }
        
        // Update form key based on task type
        String taskType = (String) task.getVariable("taskType");
        if ("APPROVAL".equals(taskType)) {
            task.setFormKey("approval-form.html");
        } else if ("REVIEW".equals(taskType)) {
            task.setFormKey("review-form.html");
        }
    }
}
```

### Add Comments and Attachments

```java
public class TaskAnnotationListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        String eventId = task.getEventName();

        if ("complete".equals(eventId)) {
            // Get completion comment
            String comment = (String) task.getVariable("completionComment");
            
            if (comment != null) {
                // Add comment to task
                // Note: Requires TaskService, not available in DelegateTask
                // This is typically done externally
                task.setVariable("taskComment", comment);
            }
            
            // Store completion metadata
            task.setVariable("completedBy", task.getAssignee());
            task.setVariable("completedAt", new Date());
            task.setVariable("completionNotes", comment);
        }
    }
}
```

## Complete Examples

### Example 1: Dynamic Task Configuration

```java
@Component
public class DynamicTaskConfigurer implements TaskListener {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private RuleEngine ruleEngine;
    
    @Override
    public void notify(DelegateTask task) {
        String event = task.getEventName();

        if ("create".equals(event)) {
            configureNewTask(task);
        } else if ("assignment".equals(event)) {
            handleReassignment(task);
        } else if ("complete".equals(event)) {
            recordCompletion(task);
        }
    }
    
    private void configureNewTask(DelegateTask task) {
        // 1. Determine assignee based on rules
        Map<String, Object> context = buildContext(task);
        String assignee = ruleEngine.determineAssignee(context);
        
        if (assignee != null) {
            task.setAssignee(assignee);
        } else {
            // 2. Set candidate groups
            List<String> candidateGroups = ruleEngine.determineCandidateGroups(context);
            for (String group : candidateGroups) {
                task.addCandidateGroup(group);
            }
        }
        
        // 3. Set dynamic due date
        Long slaHours = (Long) task.getVariable("slaHours");
        if (slaHours != null) {
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.HOUR, slaHours.intValue());
            task.setDueDate(cal.getTime());
        }
        
        // 4. Set priority
        Object priority = task.getVariable("businessPriority");
        if (priority != null) {
            int taskPriority = convertPriority(priority.toString());
            task.setPriority(taskPriority);
        }
        
        // 5. Set form key
        String taskType = (String) task.getVariable("taskType");
        String formKey = determineFormKey(taskType);
        task.setFormKey(formKey);
        
        // 6. Initialize task variables
        task.setVariable("taskCreated", new Date());
        task.setVariable("assignmentCount", 0);
        task.setVariable("comments", new ArrayList<String>());
    }
    
    private void handleReassignment(DelegateTask task) {
        // Track reassignment
        Integer count = (Integer) task.getVariable("assignmentCount");
        task.setVariable("assignmentCount", (count == null ? 0 : count) + 1);
        
        // Log reassignment
        Map<String, Object> logEntry = new HashMap<>();
        logEntry.put("timestamp", new Date());
        logEntry.put("newAssignee", task.getAssignee());
        logEntry.put("previousAssignee", task.getVariable("lastAssignee"));
        
        List<Map<String, Object>> auditTrail = 
            (List<Map<String, Object>>) task.getVariable("assignmentAuditTrail");
        
        if (auditTrail == null) {
            auditTrail = new ArrayList<>();
        }
        
        auditTrail.add(logEntry);
        task.setVariable("assignmentAuditTrail", auditTrail);
        
        // Update last assignee
        task.setVariable("lastAssignee", task.getAssignee());
        
        // Reset SLA on reassignment?
        Boolean resetSla = (Boolean) task.getVariable("resetSlaOnReassignment");
        if (Boolean.TRUE.equals(resetSla)) {
            Long slaHours = (Long) task.getVariable("slaHours");
            if (slaHours != null) {
                Calendar cal = Calendar.getInstance();
                cal.add(Calendar.HOUR, slaHours.intValue());
                task.setDueDate(cal.getTime());
            }
        }
    }
    
    private void recordCompletion(DelegateTask task) {
        // Record completion time
        task.setVariable("taskCompleted", new Date());
        task.setVariable("completedBy", task.getAssignee());
        
        // Calculate duration
        Date created = (Date) task.getVariable("taskCreated");
        if (created != null) {
            long duration = System.currentTimeMillis() - created.getTime();
            task.setVariable("taskDuration", duration);
            task.setVariable("taskDurationHours", duration / (1000 * 60 * 60));
        }
        
        // Copy task variables to process variables
        task.getExecution().setVariable("lastTaskCompleted", task.getName());
        task.getExecution().setVariable("lastTaskCompletedAt", new Date());
        task.getExecution().setVariable("lastTaskCompletedBy", task.getAssignee());
    }
    
    private Map<String, Object> buildContext(DelegateTask task) {
        Map<String, Object> context = new HashMap<>();
        context.put("taskName", task.getName());
        context.put("processVariables", task.getVariables());
        context.put("processDefinitionId", task.getExecution().getProcessDefinitionId());
        return context;
    }
    
    private int convertPriority(String priority) {
        switch (priority.toUpperCase()) {
            case "CRITICAL": return 100;
            case "HIGH": return 80;
            case "MEDIUM": return 50;
            case "LOW": return 20;
            default: return 50;
        }
    }
    
    private String determineFormKey(String taskType) {
        // Map task types to forms
        return taskType + "-form.html";
    }
}
```

### Example 2: Task Validation Listener

```java
@Component
public class TaskValidationListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        String event = task.getEventName();

        if ("complete".equals(event)) {
            // Validate required variables before completion
            List<String> missingVariables = new ArrayList<>();
            
            String requiredVars = (String) task.getVariable("requiredCompletionVariables");
            if (requiredVars != null) {
                String[] varArray = requiredVars.split(",");
                for (String varName : varArray) {
                    varName = varName.trim();
                    if (!task.hasVariable(varName)) {
                        missingVariables.add(varName);
                    }
                }
            }
            
            if (!missingVariables.isEmpty()) {
                // Prevent completion by throwing exception
                throw new ActivitiException(
                    "Missing required variables: " + String.join(", ", missingVariables)
                );
            }
            
            // Validate variable values
            Object status = task.getVariable("completionStatus");
            if (!"APPROVED".equals(status) && !"REJECTED".equals(status)) {
                throw new ActivitiException("Invalid completion status: " + status);
            }
            
            // Validation passed - add audit record
            task.setVariable("validationPassed", true);
            task.setVariable("validatedAt", new Date());
        }
    }
}
```

### Example 3: Multi-Task Coordination

```java
@Component
public class TaskCoordinationListener implements TaskListener {
    
    @Override
    public void notify(DelegateTask task) {
        String event = task.getEventName();

        if ("create".equals(event)) {
            // Register this task in coordination list
            DelegateExecution execution = task.getExecution();
            
            List<String> activeTasks = 
                (List<String>) execution.getVariable("activeReviewTasks");
            
            if (activeTasks == null) {
                activeTasks = new ArrayList<>();
                execution.setVariable("activeReviewTasks", activeTasks);
            }
            
            activeTasks.add(task.getId());
            
            // Check if this is first task
            if (activeTasks.size() == 1) {
                execution.setVariable("reviewStartTime", new Date());
            }
        } else if ("complete".equals(event)) {
            // Unregister completed task
            DelegateExecution execution = task.getExecution();
            
            List<String> activeTasks = 
                (List<String>) execution.getVariable("activeReviewTasks");
            
            if (activeTasks != null) {
                activeTasks.remove(task.getId());
                
                // Check if all tasks completed
                if (activeTasks.isEmpty()) {
                    execution.setVariable("reviewEndTime", new Date());
                    execution.setVariable("allReviewsComplete", true);
                    
                    // Calculate total duration
                    Date startTime = (Date) execution.getVariable("reviewStartTime");
                    if (startTime != null) {
                        long duration = System.currentTimeMillis() - startTime.getTime();
                        execution.setVariable("reviewDuration", duration);
                    }
                }
            }
            
            // Store completion info
            Map<String, Object> completionInfo = new HashMap<>();
            completionInfo.put("taskId", task.getId());
            completionInfo.put("taskName", task.getName());
            completionInfo.put("completedBy", task.getAssignee());
            completionInfo.put("completedAt", new Date());
            
            List<Map<String, Object>> completedTasks = 
                (List<Map<String, Object>>) execution.getVariable("completedReviewTasks");
            
            if (completedTasks == null) {
                completedTasks = new ArrayList<>();
                execution.setVariable("completedReviewTasks", completedTasks);
            }
            
            completedTasks.add(completionInfo);
        }
    }
}
```

## Best Practices

### 1. Check Event Type

```java
// GOOD: Check event
public void notify(DelegateTask task) {
    if ("create".equals(task.getEventName())) {
        configureTask(task);
    }
}

// BAD: Assume event
public void notify(DelegateTask task) {
    // This runs on ALL events
    configureTask(task);
}
```

### 2. Handle Null Safely

```java
// GOOD: Null-safe
String assignee = task.getAssignee();
if (assignee != null) {
    processAssignee(assignee);
}

// BAD: No null check
processAssignee(task.getAssignee()); // NPE risk
```

### 3. Use Task Variables Appropriately

```java
// GOOD: Task-specific data in task variables
task.setVariable("reviewNotes", "Looks good");
task.setVariable("reviewerComments", comments);

// BAD: Process-wide data in task variables
task.setVariable("orderId", orderId); // Use execution.setVariable()
```

### 4. Document Listener Behavior

```java
/**
 * Task Listener for dynamic task configuration.
 * 
 * Events:
 * - create: Sets assignee, due date, priority, form key
 * - assignment: Tracks reassignments, resets SLA
 * - complete: Records completion metrics
 * 
 * Variables set:
 * - taskCreated: Date
 * - assignmentCount: Integer
 * - taskDuration: Long (milliseconds)
 */
@Component
public class DocumentedListener implements TaskListener {
    // Implementation
}
```

## Common Pitfalls

### 1. Modifying Collections During Iteration

```java
// BAD: ConcurrentModificationException
for (String user : task.getCandidateUsers()) {
    task.deleteCandidateUser(user); // Exception!
}

// GOOD: Collect first, then modify
List<String> toRemove = new ArrayList<>(task.getCandidateUsers());
for (String user : toRemove) {
    task.deleteCandidateUser(user);
}
```

### 2. Confusing Task and Process Variables

```java
// Problem: Variable scope confusion
task.setVariable("data", "task-level");
Object value = task.getExecution().getVariable("data"); // null!

// Solution: Use correct scope
task.setVariable("data", "task-level"); // Task variable
task.getExecution().setVariable("data", "process-level"); // Process variable
```

### 3. Setting Assignee and Candidates Together

```java
// BAD: Conflicting ownership
task.setAssignee("john");
task.addCandidateUser("jane"); // Candidates ignored when assignee set

// GOOD: Either assignee OR candidates
if (autoAssign) {
    task.setAssignee("john");
} else {
    task.addCandidateUser("john");
    task.addCandidateUser("jane");
}
```

## API Reference Summary

| Method | Purpose | Notes |
|--------|---------|-------|
| `getId()` | Get task ID | Unique identifier |
| `getName()` | Get task name | From BPMN |
| `getDescription()` | Get task description | From BPMN |
| `getTaskDefinitionKey()` | Get task definition key | Activity ID from BPMN |
| `getCreateTime()` | Get creation time | - |
| `getAssignee()` | Get assignee | Null if not claimed |
| `setAssignee(String)` | Set assignee | Clears candidates |
| `getOwner()` | Get owner | - |
| `setOwner(String)` | Set owner | - |
| `addCandidateUser(String)` | Add candidate user | - |
| `addCandidateGroup(String)` | Add candidate group | - |
| `getCandidates()` | Get all identity links | Set of IdentityLink |
| `getDueDate()` | Get due date | Can be null |
| `setDueDate(Date)` | Set due date | - |
| `getPriority()` | Get priority | 0-100, default 50 |
| `setPriority(int)` | Set priority | - |
| `getFormKey()` | Get form key | For task forms |
| `setFormKey(String)` | Set form key | - |
| `getExecution()` | Get execution | Access process context |
| `getEventName()` | Get task listener event | create, assignment, complete, delete |
| `getCurrentActivitiListener()` | Get current listener | ActivitiListener instance |
| `getDelegationState()` | Get delegation state | DelegationState enum |
| `getTenantId()` | Get tenant ID | For multi-tenant |
| `isSuspended()` | Check if suspended | - |
| `getVariable(String)` | Get variable | Task then process scope |
| `setVariable(String, Object)` | Set variable | Task scope |
| `getVariables()` | Get all variables | Task variables only |

## Related Documentation

- [Task Listeners](./task-listeners.md) - Using DelegateTask in listeners
- [DelegateExecution API](./delegate-execution-api.md) - Execution context
- [User Task](../elements/user-task.md) - User task configuration
- [JavaDelegate](./java-delegate.md) - Service task delegates

---

**Source:** `DelegateTask.java`
