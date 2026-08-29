---
sidebar_label: Task Service
title: "Task Service"
slug: /api-reference/engine-api/task-service
description: Complete guide to the Task Service for managing user tasks and human interactions.
---

# Task Service - User Task Management

**Module:** `activiti-core/activiti-engine`

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
Task subTask = taskService.newTask("task-456");
subTask.setParentTaskId("parent-task-id");
subTask.setName("Sub-task");
taskService.saveTask(subTask);
```

### Task Creation with Properties

```java
Task task = taskService.newTask("task-789");
task.setName("Document Approval");
task.setDescription("Approve or reject document");
task.setOwner("system");
task.setPriority(50);
task.setDueDate(new Date());
taskService.saveTask(task);

// Default priority is Task.DEFAULT_PRIORITY (0)
int currentPriority = task.getPriority();
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
    .taskUnassigned()
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
    .taskMinPriority(5)
    .taskDueBefore(new Date())
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

// Complete with transient variables (not persisted)
Map<String, Object> transientVariables = new HashMap<>();
transientVariables.put("transientFlag", true);
taskService.complete(taskId, variables, transientVariables);
```

### Updating Tasks

```java
// Get and update task
Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
task.setName("Updated Task Name");
task.setDescription("Updated description");
task.setPriority(10);
task.setDueDate(new Date(System.currentTimeMillis() + 14L * 24 * 60 * 60 * 1000));
taskService.saveTask(task);

// Update assignee
taskService.setAssignee(taskId, "new.assignee");

// Update owner
taskService.setOwner(taskId, "task.owner");

// Update priority
taskService.setPriority(taskId, 5);

// Update due date
taskService.setDueDate(taskId, new Date());
```

### Deleting Tasks

```java
// Delete standalone task
taskService.deleteTask(taskId);

// Delete task with cascade
taskService.deleteTask(taskId, true);
```

### Suspended Tasks

Tasks inherit the suspension state of their process instance: suspending a process instance suspends **every** task of the instance (`AbstractSetProcessInstanceStateCmd.updateTaskSuspensionState` applies the new state to all tasks found by `findTasksByProcessInstanceId`), and reactivating the instance reactivates them again.

> **Note:** While a task is suspended, every mutating operation implemented via `NeedsActiveTaskCmd` — claim/unclaim, complete, resolve, delegate, set/remove variables, set priority/due date, add/remove identity links — fails with `ActivitiException("Cannot execute operation: task is suspended")`; the check lives in `NeedsActiveTaskCmd.execute`, before any of that logic runs. Tasks remain fully queryable — use `suspended()` / `active()` on the query to filter by state. See [Process Instance and Definition Suspension](../../advanced/process-instance-suspension.md).

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

// Get variable names (no such TaskService method exists — use VariableScope)
Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
Set<String> varNames = ((org.activiti.engine.delegate.VariableScope) task).getVariableNames();
```

### Variable Instances & Data Objects

`VariableInstance` provides access to the variable's metadata (name, value, type, task/execution scope) alongside its value, while `DataObject` exposes managed data objects with name/description localization.

```java
// Variable instance with metadata + value
VariableInstance varInstance = taskService.getVariableInstance(taskId, "amount");
String value = (String) varInstance.getValue();
String typeName = varInstance.getTypeName();

// All variable instances (including task-local scope)
Map<String, VariableInstance> instances = taskService.getVariableInstances(taskId);

// Local-only variable instances for a batch of task ids
List<VariableInstance> locals = taskService.getVariableInstancesLocalByTaskIds(Set.of("task1", "task2"));

// Data object with localized name/description
DataObject dataObject = taskService.getDataObject(taskId, "customer");
String localizedName = taskService.getDataObject(taskId, "customer", "de", true).getName();

// All data objects visible from the task scope
Map<String, DataObject> dataObjects = taskService.getDataObjects(taskId);
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
for (String candidateUser : Arrays.asList("john.doe", "jane.doe")) {
    taskService.addCandidateUser(taskId, candidateUser);
}

// Add candidate group
taskService.addCandidateGroup(taskId, "managers");

// Add multiple candidate groups
for (String candidateGroup : Arrays.asList("managers", "admins")) {
    taskService.addCandidateGroup(taskId, candidateGroup);
}
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

// Tasks where user is candidate, in a candidate group, or assigned
List<Task> tasks = taskService.createTaskQuery()
    .taskCandidateOrAssigned("john.doe")
    .list();
```

---

## Delegation

### Delegating Tasks

```java
// Delegate task to another user
taskService.delegateTask(taskId, "delegate.user");

// Delegate and track original assignee
Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
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

> **Note:** Both the `Comment` and `Attachment` interfaces (and their `CommentEntity`/`AttachmentEntity` implementations) are `@Deprecated` in the engine. The source marks them as "going to be removed in future iterations" because comments and attachments don't belong to the Process/Task Runtime. The legacy event feed (`getTaskEvents`/`getEvent`) is served from the same `ACT_HI_COMMENT` table, and attachment rows live in `ACT_HI_ATTACHMENT` (with content in `ACT_GE_BYTEARRAY`). Treat comments, attachments, and events as legacy mechanisms — prefer variables, history queries, or event subscriptions for new applications.

### Attachments

```java
// Create attachment with InputStream (content stored in ACT_GE_BYTEARRAY)
Attachment attachment = taskService.createAttachment("file", taskId, processInstanceId,
    "contract.pdf", "Service Contract", inputStream);

// Create attachment with URL (external reference, no DB storage)
Attachment urlAttachment = taskService.createAttachment("url", taskId, processInstanceId,
    "External Doc", "Requirements", "https://docs.example.com/requirements");

// Get attachment metadata
Attachment att = taskService.getAttachment("attachment-1");

// Get attachment content stream
InputStream content = taskService.getAttachmentContent("attachment-1");

// List task attachments
List<Attachment> taskAttachments = taskService.getTaskAttachments(taskId);

// List process instance attachments
List<Attachment> processAttachments = taskService.getProcessInstanceAttachments(processInstanceId);

// Update attachment metadata
Attachment updated = taskService.getAttachment("attachment-1");
updated.setName("Updated Name");
updated.setDescription("Updated Description");
taskService.saveAttachment(updated);

// Delete attachment
taskService.deleteAttachment("attachment-1");
```

**Storage model:** InputStream attachments store content as a `ByteArrayEntity` in `ACT_GE_BYTEARRAY`. The `Attachment.contentId` references the byte array row. URL attachments store no content in the database — `contentId` is null and the `url` field holds the external reference.

### Comments

```java
// Add comment to task
taskService.addComment(taskId, processInstanceId, "Review completed successfully");

// Add comment with type (for filtering)
taskService.addComment(taskId, processInstanceId, "feedback", "Needs more information");
taskService.addComment(taskId, processInstanceId, "audit", "Escalated to manager");

// Get comments by task
List<Comment> taskComments = taskService.getTaskComments(taskId);

// Get comments by type
List<Comment> feedbackComments = taskService.getTaskComments(taskId, "feedback");

// Get all comments of a type (across all tasks)
List<Comment> allAuditComments = taskService.getCommentsByType("audit");

// Get comments by process instance
List<Comment> processComments = taskService.getProcessInstanceComments(processInstanceId);

// Get single comment
Comment comment = taskService.getComment("comment-1");

// Delete a single comment
taskService.deleteComment("comment-1");

// Delete all comments for a task
taskService.deleteComments(taskId, processInstanceId);
```

**Comment interface fields:**

| Field | Description |
|-------|-------------|
| `getId()` | Comment ID |
| `getUserId()` | User who created the comment |
| `getTaskId()` | Task ID |
| `getProcessInstanceId()` | Process instance ID |
| `getFullMessage()` | Comment text |
| `getType()` | Comment type (custom, for filtering) |
| `getTime()` | Timestamp |

Comments are stored in `ACT_HI_COMMENT` and persist after process completion. There is no `getAttachmentsByType()` — type filtering is available for comments only.

### Task Events

`getTaskEvents()` is a legacy alias over the comment store — there is no dedicated event table. Event rows live in `ACT_HI_COMMENT` and are distinguished by `TYPE_ = 'event'`:

```java
// Returns the task's ACT_HI_COMMENT rows of any type (comment and event)
List<Event> events = taskService.getTaskEvents(taskId);

// Get a specific event
Event event = taskService.getEvent("event-1");
```

`GetTaskEventsCmd` delegates to the comment data manager (`findEventsByTaskId`), whose SQL (`selectEventsByTaskId`) queries `ACT_HI_COMMENT` by `TASK_ID_` **without** a `TYPE_` filter — so `getTaskEvents(taskId)` returns the task's comment rows *plus* its event rows. In contrast, `getTaskComments(taskId)` (`selectCommentsByTaskId`) filters `TYPE_ = 'comment'` and returns only comment rows.

The engine populates the `Event.ACTION_*` constants on the rows it writes:

- `AddCommentCmd` stamps `action = Event.ACTION_ADD_COMMENT` on every comment it creates.
- When history is enabled, `DefaultHistoryManager` writes `TYPE_ = 'event'` rows as a side effect of identity-link and attachment operations:
  - `addUserIdentityLink` / `deleteUserIdentityLink` → `ACTION_ADD_USER_LINK` / `ACTION_DELETE_USER_LINK`
  - `addGroupIdentityLink` / `deleteGroupIdentityLink` → `ACTION_ADD_GROUP_LINK` / `ACTION_DELETE_GROUP_LINK`
  - `createAttachment` / `deleteAttachment` → `ACTION_ADD_ATTACHMENT` / `ACTION_DELETE_ATTACHMENT`

Each row carries an `action` (one of the `Event.ACTION_*` constants) rather than a type. To filter by type, use the typed overload: `getTaskComments(taskId, "event")` returns only the event rows for that task.

### Subtasks

Tasks can have a parent-child hierarchy:

```java
// Create a standalone parent task
Task parent = taskService.newTask("parent-1");
taskService.saveTask(parent);

// Create a child task
Task child = taskService.newTask("child-1");
child.setParentTaskId("parent-1");
taskService.saveTask(child);

// Query subtasks
List<Task> subTasks = taskService.getSubTasks("parent-1");
```

Subtasks are standalone tasks linked to a parent. Completing a subtask does not affect the parent. Subtasks are useful for breaking down complex work items.

---

## API Reference

### TaskService Methods

```java
// Task Creation
Task newTask();
Task newTask(String taskId);
void saveTask(Task task);
void deleteTask(String taskId);
void deleteTask(String taskId, boolean cascade);
void deleteTask(String taskId, String deleteReason);
void deleteTask(String taskId, String deleteReason, boolean cancel);
void deleteTasks(Collection<String> taskIds);
void deleteTasks(Collection<String> taskIds, boolean cascade);
void deleteTasks(Collection<String> taskIds, String deleteReason);
void deleteTasks(Collection<String> taskIds, String deleteReason, boolean cancel);

// Task Queries
TaskQuery createTaskQuery();
NativeTaskQuery createNativeTaskQuery();

// Task Assignment
void claim(String taskId, String userId);
void unclaim(String taskId);
void setAssignee(String taskId, String userId);
void setOwner(String taskId, String userId);

// Identity Links
List<IdentityLink> getIdentityLinksForTask(String taskId);
void addUserIdentityLink(String taskId, String userId, String identityLinkType);
void addUserIdentityLink(String taskId, String userId, String identityLinkType, byte[] details);
void addGroupIdentityLink(String taskId, String groupId, String identityLinkType);
void deleteUserIdentityLink(String taskId, String userId, String identityLinkType);
void deleteGroupIdentityLink(String taskId, String groupId, String identityLinkType);

// Task Completion
void complete(String taskId);
void complete(String taskId, Map<String, Object> variables);
void complete(String taskId, Map<String, Object> variables, Map<String, Object> transientVariables);
void complete(String taskId, Map<String, Object> variables, boolean localScope);

// Task Updates
void setPriority(String taskId, int priority);
void setDueDate(String taskId, Date dueDate);

// Candidates
void addCandidateUser(String taskId, String userId);
void addCandidateGroup(String taskId, String groupId);
void deleteCandidateUser(String taskId, String userId);
void deleteCandidateGroup(String taskId, String groupId);

// Delegation
void delegateTask(String taskId, String userId);
void resolveTask(String taskId);
void resolveTask(String taskId, Map<String, Object> variables);
void resolveTask(String taskId, Map<String, Object> variables, Map<String, Object> transientVariables);

// Variables
Object getVariable(String taskId, String variableName);
<T> T getVariable(String taskId, String variableName, Class<T> variableClass);
Object getVariableLocal(String taskId, String variableName);
<T> T getVariableLocal(String taskId, String variableName, Class<T> variableClass);
boolean hasVariable(String taskId, String variableName);
boolean hasVariableLocal(String taskId, String variableName);
Map<String, Object> getVariables(String taskId);
Map<String, Object> getVariables(String taskId, Collection<String> variableNames);
Map<String, Object> getVariablesLocal(String taskId);
Map<String, Object> getVariablesLocal(String taskId, Collection<String> variableNames);
void setVariable(String taskId, String variableName, Object value);
void setVariables(String taskId, Map<String, ? extends Object> variables);
void setVariableLocal(String taskId, String variableName, Object value);
void setVariablesLocal(String taskId, Map<String, ? extends Object> variables);
void removeVariable(String taskId, String variableName);
void removeVariableLocal(String taskId, String variableName);
void removeVariables(String taskId, Collection<String> variableNames);
void removeVariablesLocal(String taskId, Collection<String> variableNames);

// Variable Instances
VariableInstance getVariableInstance(String taskId, String variableName);
VariableInstance getVariableInstanceLocal(String taskId, String variableName);
Map<String, VariableInstance> getVariableInstances(String taskId);
Map<String, VariableInstance> getVariableInstances(String taskId, Collection<String> variableNames);
Map<String, VariableInstance> getVariableInstancesLocal(String taskId);
Map<String, VariableInstance> getVariableInstancesLocal(String taskId, Collection<String> variableNames);
List<VariableInstance> getVariableInstancesLocalByTaskIds(Set<String> taskIds);

// Data Objects
DataObject getDataObject(String taskId, String dataObjectName);
DataObject getDataObject(String taskId, String dataObjectName, String locale, boolean withLocalizationFallback);
Map<String, DataObject> getDataObjects(String taskId);
Map<String, DataObject> getDataObjects(String taskId, String locale, boolean withLocalizationFallback);
Map<String, DataObject> getDataObjects(String taskId, Collection<String> dataObjectNames);
Map<String, DataObject> getDataObjects(String taskId, Collection<String> dataObjectNames, String locale, boolean withLocalizationFallback);


// Comments
Comment addComment(String taskId, String processInstanceId, String message);
Comment addComment(String taskId, String processInstanceId, String type, String message);
Comment getComment(String commentId);
List<Comment> getTaskComments(String taskId);
List<Comment> getTaskComments(String taskId, String type);
List<Comment> getProcessInstanceComments(String processInstanceId);
List<Comment> getProcessInstanceComments(String processInstanceId, String type);
List<Comment> getCommentsByType(String type);
void deleteComment(String commentId);
void deleteComments(String taskId, String processInstanceId);

// Task Events (legacy, see "Task Events" section above)
List<Event> getTaskEvents(String taskId);
Event getEvent(String eventId);

// Attachments (Attachment is @Deprecated — see note above)
Attachment createAttachment(String attachmentType, String taskId, String processInstanceId, String attachmentName, String attachmentDescription, InputStream content);
Attachment createAttachment(String attachmentType, String taskId, String processInstanceId, String attachmentName, String attachmentDescription, String url);
Attachment getAttachment(String attachmentId);
InputStream getAttachmentContent(String attachmentId);
List<Attachment> getTaskAttachments(String taskId);
List<Attachment> getProcessInstanceAttachments(String processInstanceId);
void saveAttachment(Attachment attachment);
void deleteAttachment(String attachmentId);

// Subtasks
List<Task> getSubTasks(String parentTaskId);
```

### TaskQuery

```java
TaskQuery createTaskQuery();

// Filtering
.taskId(String id)
.taskName(String name)
.taskNameIn(List<String> nameList)
.taskNameInIgnoreCase(List<String> nameList)
.taskNameLike(String name)
.taskNameLikeIgnoreCase(String nameLike)
.taskDescription(String description)
.taskDescriptionLike(String description)
.taskDescriptionLikeIgnoreCase(String descriptionLike)
.taskCategory(String category)
.taskDefinitionKey(String key)
.taskDefinitionKeyLike(String keyLike)
.taskDelegationState(DelegationState delegationState)
.taskAssignee(String assignee)
.taskAssigneeLike(String assignee)
.taskAssigneeLikeIgnoreCase(String assigneeLikeIgnoreCase)
.taskAssigneeIds(List<String> assigneeListIds)
.taskUnassigned()
.taskOwner(String owner)
.taskOwnerLike(String ownerLike)
.taskOwnerLikeIgnoreCase(String ownerLikeIgnoreCase)
.taskCandidateUser(String candidateUser)
.taskCandidateUser(String candidateUser, List<String> userGroups)
.taskCandidateOrAssigned(String userIdForCandidateAndAssignee)
.taskCandidateOrAssigned(String userIdForCandidateAndAssignee, List<String> userGroups)
.taskInvolvedUser(String involvedUser)
.taskInvolvedGroupsIn(List<String> involvedGroups)
.taskCandidateGroup(String candidateGroup)
.taskCandidateGroupIn(List<String> candidateGroups)
.taskParentTaskId(String parentTaskId)
.excludeSubtasks()
.suspended()
.active()
.processInstanceId(String id)
.processInstanceIdIn(List<String> processInstanceIds)
.processInstanceBusinessKey(String key)
.processInstanceBusinessKeyLike(String keyLike)
.processInstanceBusinessKeyLikeIgnoreCase(String keyLikeIgnoreCase)
.executionId(String id)
.taskPriority(Integer priority)
.taskMinPriority(Integer minPriority)
.taskMaxPriority(Integer maxPriority)
.taskDueDate(Date dueDate)
.taskDueBefore(Date before)
.taskDueAfter(Date after)
.withoutTaskDueDate()
.taskCreatedOn(Date date)
.taskCreatedBefore(Date before)
.taskCreatedAfter(Date after)
.taskTenantId(String tenantId)
.taskTenantIdLike(String tenantIdLike)
.taskWithoutTenantId()
.processDefinitionKey(String key)
.processDefinitionKeyLike(String keyLike)
.processDefinitionKeyLikeIgnoreCase(String keyLikeIgnoreCase)
.processDefinitionKeyIn(List<String> keys)
.processDefinitionId(String id)
.processDefinitionName(String name)
.processDefinitionNameLike(String nameLike)
.processCategoryIn(List<String> categories)
.processCategoryNotIn(List<String> categories)
.deploymentId(String deploymentId)
.deploymentIdIn(List<String> deploymentIds)

// Variable value filters
.taskVariableValueEquals(String name, Object value)
.taskVariableValueEquals(Object value)
.taskVariableValueEqualsIgnoreCase(String name, String value)
.taskVariableValueNotEquals(String name, Object value)
.taskVariableValueNotEqualsIgnoreCase(String name, String value)
.taskVariableValueGreaterThan(String name, Object value)
.taskVariableValueGreaterThanOrEqual(String name, Object value)
.taskVariableValueLessThan(String name, Object value)
.taskVariableValueLessThanOrEqual(String name, Object value)
.taskVariableValueLike(String name, String value)
.taskVariableValueLikeIgnoreCase(String name, String value)
.processVariableValueEquals(String name, Object value)
.processVariableValueEquals(Object value)
.processVariableValueEqualsIgnoreCase(String name, String value)
.processVariableValueNotEquals(String name, Object value)
.processVariableValueNotEqualsIgnoreCase(String name, String value)
.processVariableValueGreaterThan(String name, Object value)
.processVariableValueGreaterThanOrEqual(String name, Object value)
.processVariableValueLessThan(String name, Object value)
.processVariableValueLessThanOrEqual(String name, Object value)
.processVariableValueLike(String name, String value)
.processVariableValueLikeIgnoreCase(String name, String value)
.includeTaskLocalVariables()
.includeProcessVariables()
.limitTaskVariables(Integer taskVariablesLimit)

// Composite (OR) clauses — clauses between or() and endOr() are OR-ed together, then AND-ed with the rest of the query
.or()
.endOr()

// Localization
.locale(String locale)
.withLocalizationFallback()

// Ordering
.orderByTaskId()
.orderByTaskName()
.orderByTaskDescription()
.orderByTaskAssignee()
.orderByTaskOwner()
.orderByTaskCreateTime()
.orderByTaskDueDate()
.orderByTaskPriority()
.orderByTaskDefinitionKey()
.orderByProcessInstanceId()
.orderByExecutionId()
.orderByProcessDefinitionId()
.orderByTenantId()
.orderByDueDateNullsFirst()
.orderByDueDateNullsLast()

.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()
```

**Task definition key semantics:** a task's definition key is the **BPMN `id`** of its user task element — when the engine enters a user task, `UserTaskActivityBehavior.execute` calls `task.setTaskDefinitionKey(userTask.getId())`. So `taskDefinitionKey("approveOrder")` matches every task created from `<userTask id="approveOrder" .../>`, across all process definition versions. That makes it the stable key to query/filter tasks of a given activity — unlike `taskId` (unique per task) or `processDefinitionId` (changes on every deployment).

**Explicit group candidates:** the two-argument overloads `taskCandidateUser(userId, groups)` and `taskCandidateOrAssigned(userId, groups)` also match tasks whose candidate group is one of the explicitly given groups (`I.GROUP_ID_ IN (...)` in the query SQL). When no `UserGroupManager` is configured on the process engine — the `dbIdentityUsed=false` mode referenced in the javadoc — group membership is not resolved from the identity store, so these overloads are how you include group candidates by passing the user's groups explicitly.

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
            .taskDueBefore(new Date())
            .list());

        // Task counts
        dashboard.setAssignedCount(taskService.createTaskQuery()
            .taskAssignee(userId)
            .count());

        dashboard.setOverdueCount(taskService.createTaskQuery()
            .taskAssignee(userId)
            .taskDueBefore(new Date())
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
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        
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
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
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
task.setDueDate(new Date(System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000));

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

> **Note:** The `Comment` API is `@Deprecated` in the engine (see [Comments and Attachments](#comments-and-attachments)). In legacy applications, adding a comment on state changes is still a useful audit pattern; in new applications prefer recording the change via variables or engine events.

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
Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
if (!task.getAssignee().equals(userId)) {
    throw new UnauthorizedException("Not assigned to you");
}
taskService.complete(taskId, variables);

// BAD
taskService.complete(taskId, variables);
```

---

## Related Documentation

- [Parent Documentation](README.md)
- [Runtime Service](runtime-service.md)
- [History Service](history-service.md)
- [Best Practices](../../best-practices/guide.md)
