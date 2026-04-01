---
sidebar_label: Task Service
slug: /core-services/task-service
description: Complete guide to the Task Service for managing user tasks and human interactions.
---

# Task Service - User Task Management

**Module:** `activiti-core/activiti-engine`

**Target Audience:** Senior Software Engineers, Application Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Task Creation](#task-creation)
- [Task Queries](#task-queries)
- [Task Operations](#task-operations)
- [Task Variables](#task-variables)
- [Candidate Users & Groups](#candidate-users--groups)
- [Delegation](#delegation)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The **TaskService** manages user tasks in the Activiti engine. It provides operations for creating, querying, claiming, completing, and managing tasks that require human interaction.

### Key Responsibilities

- Create and manage user tasks
- Handle task assignment and claiming
- Manage task variables
- Support candidate users and groups
- Enable task delegation
- Provide task queries and filtering

### Core Concepts

```
Task
    ├── Assignee (current owner)
    ├── Candidate Users (can claim)
    ├── Candidate Groups (can claim)
    ├── Variables (task-specific data)
    ├── Comments (task notes)
    └── Attachments (files)
```

---

## Task Creation

### Automatic Task Creation

Tasks are automatically created when a process reaches a user task element in the BPMN diagram:

```xml
<!-- BPMN User Task -->
<userTask id="approveOrder" name="Approve Order">
    <potentialOwner>
        <resourceAssignmentExpression>
            <formalExpression>${managers}</formalExpression>
        </resourceAssignmentExpression>
    </potentialOwner>
</userTask>
```

### Manual Task Creation

```java
// Create standalone task (not linked to process)
Task task = taskService.newTask("task-123");
task.setName("Manual Review");
task.setDescription("Review submitted documents");
taskService.saveTask(task);

// Create task with parent
Task task = taskService.newTask("task-456", "parent-task-id");
task.setName("Sub-task");
taskService.saveTask(task);
```

### Task Builder Pattern

```java
Task task = Tasks.newTask(taskService)
    .id("task-789")
    .name("Document Approval")
    .description("Approve or reject document")
    .owner("system")
    .priority(TaskPriority.HIGH)
    .dueDate(LocalDate.now().plusDays(7))
    .build();

taskService.saveTask(task);
```

---

## Task Queries

### Basic Task Queries

```java
// Get all tasks
List<Task> allTasks = taskService.createTaskQuery().list();

// Get tasks for assignee
List<Task> myTasks = taskService.createTaskQuery()
    .taskAssignee("john.doe")
    .list();

// Get unclaimed tasks
List<Task> unclaimedTasks = taskService.createTaskQuery()
    .taskAssigneeNull()
    .list();

// Get tasks by name
List<Task> approvalTasks = taskService.createTaskQuery()
    .taskName("Approve Order")
    .list();
```

### Advanced Task Queries

```java
// Multiple criteria
List<Task> tasks = taskService.createTaskQuery()
    .taskAssignee("john.doe")
    .taskNameLike("%Approval%")
    .taskPriorityGreaterThanOrEqual(5)
    .taskDueDateBefore(LocalDate.now())
    .orderByTaskDueDate()
    .asc()
    .list();

// Candidate user tasks
List<Task> candidateTasks = taskService.createTaskQuery()
    .taskCandidateUser("john.doe")
    .list();

// Candidate group tasks
List<Task> groupTasks = taskService.createTaskQuery()
    .taskCandidateGroup("managers")
    .list();

// Process instance filter
List<Task> processTasks = taskService.createTaskQuery()
    .processInstanceId("process-instance-123")
    .list();

// Execution filter
List<Task> executionTasks = taskService.createTaskQuery()
    .executionId("execution-456")
    .list();
```

### Task Query with Pagination

```java
// Get page of tasks
List<Task> tasks = taskService.createTaskQuery()
    .taskAssignee("john.doe")
    .orderByTaskCreateTime()
    .desc()
    .listPage(0, 10);

// Count tasks
long taskCount = taskService.createTaskQuery()
    .taskAssignee("john.doe")
    .count();
```

### Single Result Query

```java
// Get specific task
Task task = taskService.createTaskQuery()
    .taskId("task-123")
    .singleResult();

// Get first unclaimed task
Task firstTask = taskService.createTaskQuery()
    .taskCandidateUser("john.doe")
    .orderByTaskCreateTime()
    .asc()
    .singleResult();
```

---

## Task Operations

### Claiming Tasks

```java
// Claim task (assign to user)
taskService.claim(taskId, "john.doe");

// Claim with validation
Task task = taskService.createTaskQuery()
    .taskId(taskId)
    .singleResult();

if (task.getAssignee() == null) {
    taskService.claim(taskId, "john.doe");
} else {
    throw new IllegalStateException("Task already claimed");
}
```

### Unclaiming Tasks

```java
// Unclaim task (remove assignee)
taskService.unclaim(taskId);

// Unclaim and reassign
taskService.unclaim(taskId);
taskService.claim(taskId, "jane.doe");
```

### Completing Tasks

```java
// Complete without variables
taskService.complete(taskId);

// Complete with variables
Map<String, Object> variables = new HashMap<>();
variables.put("approved", true);
variables.put("approvalDate", Instant.now());
variables.put("approver", "john.doe");

taskService.complete(taskId, variables);

// Complete and skip to specific activity
taskService.complete(taskId, variables, "nextActivityId");
```

### Updating Tasks

```java
// Get and update task
Task task = taskService.getTask(taskId);
task.setName("Updated Task Name");
task.setDescription("Updated description");
task.setPriority(10);
task.setDueDate(LocalDate.now().plusDays(14));
taskService.saveTask(task);

// Update assignee
taskService.setAssignee(taskId, "new.assignee");

// Update owner
taskService.setOwner(taskId, "task.owner");

// Update priority
taskService.setPriority(taskId, 5);

// Update due date
taskService.setDueDate(taskId, LocalDate.now().plusDays(7));

// Update follow date
taskService.setFollowUpDate(taskId, LocalDate.now().plusDays(1));
```

### Deleting Tasks

```java
// Delete standalone task
taskService.deleteTask(taskId);

// Delete task with cascade
taskService.deleteTask(taskId, true);
```

---

## Task Variables

### Setting Task Variables

```java
// Set task-level variable
taskService.setVariable(taskId, "reviewComment", "Looks good");

// Set task variable (local to task)
taskService.setVariableLocal(taskId, "tempData", data);

// Set multiple variables
Map<String, Object> variables = new HashMap<>();
variables.put("comment1", "First comment");
variables.put("comment2", "Second comment");

taskService.setVariables(taskId, variables);
```

### Getting Task Variables

```java
// Get single variable
String comment = (String) taskService.getVariable(taskId, "reviewComment");

// Get all task variables
Map<String, Object> allVars = taskService.getVariables(taskId);

// Get local variables only
Map<String, Object> localVars = taskService.getVariablesLocal(taskId);

// Get variable names
List<String> varNames = taskService.getVariableNames(taskId);
```

### Variable Scope

```java
// Task scope (only available to this task)
taskService.setVariableLocal(taskId, "taskVar", "value");

// Execution scope (available to execution and children)
runtimeService.setVariable(executionId, "execVar", "value");

// Process scope (available to entire process)
runtimeService.setVariable(processInstanceId, "processVar", "value");
```

---

## Candidate Users & Groups

### Setting Candidates

```java
// Add candidate user
taskService.addCandidateUser(taskId, "john.doe");

// Add multiple candidate users
taskService.addCandidateUsers(taskId, Arrays.asList("john.doe", "jane.doe"));

// Add candidate group
taskService.addCandidateGroup(taskId, "managers");

// Add multiple candidate groups
taskService.addCandidateGroups(taskId, Arrays.asList("managers", "admins"));
```

### Removing Candidates

```java
// Remove candidate user
taskService.deleteCandidateUser(taskId, "john.doe");

// Remove candidate group
taskService.deleteCandidateGroup(taskId, "managers");
```

### Querying by Candidates

```java
// Tasks where user is candidate
List<Task> myCandidateTasks = taskService.createTaskQuery()
    .taskCandidateUser("john.doe")
    .list();

// Tasks where group is candidate
List<Task> groupCandidateTasks = taskService.createTaskQuery()
    .taskCandidateGroup("managers")
    .list();

// Tasks where user is in candidate group
List<Task> tasks = taskService.createTaskQuery()
    .taskCandidateGroupMember("john.doe")
    .list();
```

---

## Delegation

### Delegating Tasks

```java
// Delegate task to another user
taskService.delegateTask(taskId, "delegate.user");

// Delegate and track original assignee
Task task = taskService.getTask(taskId);
String originalAssignee = task.getAssignee();
taskService.delegateTask(taskId, "temp.user");

// Revoke delegation (return to original)
taskService.resolveTask(taskId);
```

### Delegation Workflow

```java
public class TaskDelegationService {
    
    @Autowired
    private TaskService taskService;
    
    public void delegateWork(TaskRequest request) {
        String taskId = request.getTaskId();
        String delegate = request.getDelegateUser();
        
        // Store delegation info
        taskService.addComment(taskId, null, 
            "Delegated to " + delegate + " by " + request.getOriginalUser());
        
        // Delegate task
        taskService.delegateTask(taskId, delegate);
        
        // Notify
        sendDelegationNotification(request.getOriginalUser(), delegate, taskId);
    }
    
    public void returnDelegatedWork(String taskId, String originalUser) {
        // Resolve delegation
        taskService.resolveTask(taskId);
        
        // Add comment
        taskService.addComment(taskId, null,
            "Delegation resolved, returned to " + originalUser);
    }
}
```

---

## Comments and Attachments

### Adding Comments

```java
// Add comment to task
taskService.addComment(taskId, executionId, "Review completed successfully");

// Add comment with user
taskService.addComment(taskId, executionId, "Needs more information", "john.doe");
```

### Querying Comments

```java
// Get all comments for task
List<Comment> comments = taskService.getComments(taskId);

// Get all comments for execution
List<Comment> executionComments = taskService.getComments(null, executionId);
```

### Attachments

```java
// Create attachment
taskService.createAttachment("attachment-1", taskId, executionId, 
    "Document", "contract.pdf", inputStream);

// Get attachment
InputStream attachment = taskService.getAttachment("attachment-1");

// Delete attachment
taskService.deleteAttachment("attachment-1");
```

---

## API Reference

### TaskService Methods

```java
// Task Creation
Task newTask(String id);
Task newTask(String id, String parentTaskId);
void saveTask(Task task);
void deleteTask(String taskId);
void deleteTask(String taskId, boolean cascadeDelete);

// Task Queries
TaskQuery createTaskQuery();
Task getTask(String taskId);

// Task Assignment
void claim(String taskId, String assignee);
void unclaim(String taskId);
void setAssignee(String taskId, String assignee);
void setOwner(String taskId, String owner);

// Task Completion
void complete(String taskId);
void complete(String taskId, Map<String, Object> variables);
void complete(String taskId, Map<String, Object> variables, String nextActivityId);

// Task Updates
void setPriority(String taskId, int priority);
void setDueDate(String taskId, Date dueDate);
void setFollowUpDate(String taskId, Date followUpDate);

// Candidates
void addCandidateUser(String taskId, String candidateUser);
void addCandidateUsers(String taskId, Collection<String> candidateUsers);
void addCandidateGroup(String taskId, String candidateGroup);
void addCandidateGroups(String taskId, Collection<String> candidateGroups);
void deleteCandidateUser(String taskId, String candidateUser);
void deleteCandidateGroup(String taskId, String candidateGroup);

// Delegation
void delegateTask(String taskId, String assignee);
void resolveTask(String taskId);

// Variables
Object getVariable(String taskId, String variableName);
Map<String, Object> getVariables(String taskId);
void setVariable(String taskId, String variableName, Object value);
void setVariables(String taskId, Map<String, Object> variables);

// Comments
void addComment(String taskId, String executionId, String message);
List<Comment> getComments(String taskId);
List<Comment> getComments(String taskId, String executionId);
```

### TaskQuery

```java
TaskQuery createTaskQuery();

// Filtering
.taskId(String id)
.taskIdIn(Collection<String> taskIds)
.taskName(String name)
.taskNameLike(String name)
.taskDescription(String description)
.taskDescriptionLike(String description)
.taskAssignee(String assignee)
.taskAssigneeLike(String assignee)
.taskAssigneeNull()
.taskOwner(String owner)
.taskCandidateUser(String candidateUser)
.taskCandidateGroup(String candidateGroup)
.taskCandidateGroupMember(String user)
.processInstanceId(String id)
.processInstanceBusinessKey(String key)
.executionId(String id)
.taskPriority(int priority)
.taskPriorityGreaterThanOrEqual(int priority)
.taskPriorityLessThanOrEqual(int priority)
.taskDueDate(Date dueDate)
.taskDueDateBefore(Date before)
.taskDueDateAfter(Date after)
.taskDueDateNull()
.taskFollowUpDate(Date followUpDate)
.taskFollowUpDateBefore(Date before)
.taskFollowUpDateAfter(Date after)
.taskFollowUpDateNull()
.taskCreatedBefore(Date before)
.taskCreatedAfter(Date after)
.tenantIdIn(Collection<String> tenantIds)

// Ordering
.orderByTaskId()
.orderByTaskName()
.orderByTaskAssignee()
.orderByTaskOwner()
.orderByTaskCreateTime()
.orderByTaskDueDate()
.orderByTaskPriority()
.orderByTaskFollowUpDate()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()
```

---

## Usage Examples

### Task Dashboard Service

```java
@Service
public class TaskDashboardService {
    
    @Autowired
    private TaskService taskService;
    
    public DashboardData getDashboardData(String userId) {
        DashboardData dashboard = new DashboardData();
        
        // My assigned tasks
        dashboard.setAssignedTasks(taskService.createTaskQuery()
            .taskAssignee(userId)
            .list());
        
        // My candidate tasks
        dashboard.setCandidateTasks(taskService.createTaskQuery()
            .taskCandidateUser(userId)
            .list());
        
        // Overdue tasks
        dashboard.setOverdueTasks(taskService.createTaskQuery()
            .taskAssignee(userId)
            .taskDueDateBefore(new Date())
            .list());
        
        // Task counts
        dashboard.setAssignedCount(taskService.createTaskQuery()
            .taskAssignee(userId)
            .count());
        
        dashboard.setOverdueCount(taskService.createTaskQuery()
            .taskAssignee(userId)
            .taskDueDateBefore(new Date())
            .count());
        
        return dashboard;
    }
}
```

### Task Claiming Service

```java
@Service
public class TaskClaimingService {
    
    @Autowired
    private TaskService taskService;
    
    public void claimTask(String taskId, String userId) {
        // Check if task exists
        Task task = taskService.getTask(taskId);
        
        // Check if already claimed
        if (task.getAssignee() != null) {
            throw new TaskAlreadyClaimedException(
                "Task " + taskId + " is already claimed by " + task.getAssignee());
        }
        
        // Check if user is candidate
        boolean isCandidate = taskService.createTaskQuery()
            .taskId(taskId)
            .taskCandidateUser(userId)
            .count() > 0;
        
        if (!isCandidate) {
            throw new UnauthorizedException(
                "User " + userId + " is not a candidate for task " + taskId);
        }
        
        // Claim task
        taskService.claim(taskId, userId);
        
        // Add comment
        taskService.addComment(taskId, null, 
            "Task claimed by " + userId);
        
        log.info("Task {} claimed by {}", taskId, userId);
    }
}
```

### Task Completion Service

```java
@Service
public class TaskCompletionService {
    
    @Autowired
    private TaskService taskService;
    
    public void completeTask(TaskCompletionRequest request) {
        String taskId = request.getTaskId();
        
        // Verify assignee
        Task task = taskService.getTask(taskId);
        if (!task.getAssignee().equals(request.getUserId())) {
            throw new UnauthorizedException(
                "Only assignee can complete the task");
        }
        
        // Prepare completion variables
        Map<String, Object> variables = new HashMap<>();
        variables.put("completedBy", request.getUserId());
        variables.put("completedAt", Instant.now());
        variables.put("completionNotes", request.getNotes());
        
        // Add business variables
        if (request.getBusinessVariables() != null) {
            variables.putAll(request.getBusinessVariables());
        }
        
        // Add comment
        taskService.addComment(taskId, null, 
            "Task completed by " + request.getUserId() + 
            ". Notes: " + request.getNotes());
        
        // Complete task
        taskService.complete(taskId, variables);
        
        log.info("Task {} completed by {}", taskId, request.getUserId());
    }
}
```

---

## Best Practices

### 1. Use Meaningful Task Names

```java
// GOOD
task.setName("Approve Purchase Order");

// BAD
task.setName("task1");
```

### 2. Set Due Dates

```java
// GOOD
task.setDueDate(LocalDate.now().plusDays(7));

// BAD
// No due date set
```

### 3. Use Candidate Groups

```java
// GOOD - Flexible assignment
taskService.addCandidateGroup(taskId, "department-managers");

// BAD - Hardcoded users
taskService.addCandidateUser(taskId, "john.doe");
taskService.addCandidateUser(taskId, "jane.doe");
```

### 4. Add Comments on Changes

```java
// GOOD
taskService.claim(taskId, userId);
taskService.addComment(taskId, null, "Claimed for processing");

// BAD
taskService.claim(taskId, userId);
```

### 5. Validate Before Completing

```java
// GOOD
Task task = taskService.getTask(taskId);
if (!task.getAssignee().equals(userId)) {
    throw new UnauthorizedException("Not assigned to you");
}
taskService.complete(taskId, variables);

// BAD
taskService.complete(taskId, variables);
```

---

## See Also

- [Parent Documentation](README.md)
- [Runtime Service](runtime-service.md)
- [History Service](history-service.md)
- [Best Practices](../best-practices/overview.md)
