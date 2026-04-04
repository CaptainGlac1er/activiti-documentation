---
sidebar_label: Task Model
slug: /api-reference/activiti-api/task-model
description: Activiti API module documentation.
---

# Activiti API Task Model Module

## Overview

The `activiti-api-task-model` module defines all domain models, events, and payloads related to task management. This module provides the type-safe contracts for task operations and extends the process model.

## Module Structure

```
activiti-api-task-model/
└── src/main/java/org/activiti/api/task/
    ├── model/
    │   ├── events/
    │   │   ├── TaskRuntimeEvent.java
    │   │   ├── TaskCandidateUserEvent.java
    │   │   └── TaskCandidateGroupEvent.java
    │   ├── results/
    │   │   └── TaskResult.java
    │   ├── builders/
    │   │   ├── TaskPayloadBuilder.java
    │   │   ├── CompleteTaskPayloadBuilder.java
    │   │   ├── CreateTaskPayloadBuilder.java
    │   │   └── [Other Builders]
    │   ├── payloads/
    │   │   ├── CompleteTaskPayload.java
    │   │   ├── CreateTaskPayload.java
    │   │   ├── ClaimTaskPayload.java
    │   │   └── [Other Payloads]
    │   ├── Task.java
    │   ├── TaskCandidate.java
    │   ├── TaskCandidateUser.java
    │   └── TaskCandidateGroup.java
    └── runtime/
        └── events/
            ├── TaskCreatedEvent.java
            ├── TaskCompletedEvent.java
            └── [Other Runtime Events]
```

## Dependencies

```
activiti-api-task-model
├── activiti-api-model-shared
└── activiti-api-process-model
```

---

## Core Domain Models

### Task Interface

**File**: `Task.java`

```java
public interface Task extends ApplicationElement {
    enum TaskStatus {
        CREATED,
        ASSIGNED,
        SUSPENDED,
        COMPLETED,
        CANCELLED,
        DELETED
    }
    
    // Identity
    String getId();
    String getOwner();
    String getAssignee();
    
    // Metadata
    String getName();
    String getDescription();
    Date getCreatedDate();
    Date getClaimedDate();
    Date getDueDate();
    int getPriority();
    
    // Process Context
    String getProcessDefinitionId();
    String getProcessInstanceId();
    String getParentTaskId();
    TaskStatus getStatus();
    String getFormKey();
    
    // Completion Info
    Date getCompletedDate();
    Long getDuration();
    String getCompletedBy();
    
    // Versioning
    Integer getProcessDefinitionVersion();
    String getBusinessKey();
    
    // Task Type
    boolean isStandalone();
    String getTaskDefinitionKey();
    
    // Candidates
    List<String> getCandidateUsers();
    List<String> getCandidateGroups();
}
```

**Purpose**: Represents a user task in the workflow.

**Task Lifecycle**:
```
CREATED → ASSIGNED → COMPLETED
    ↓        ↓
SUSPENDED  CANCELLED
    ↓
DELETED
```

**Key Attributes**:

1. **Identity**
   - `id`: Unique task identifier
   - `owner`: Task owner (usually initiator)
   - `assignee`: Currently assigned user

2. **Metadata**
   - `name`: Task display name
   - `description`: Task description
   - `dueDate`: Expected completion date
   - `priority`: Task priority (0-100)

3. **Process Context**
   - `processInstanceId`: Parent process instance
   - `parentTaskId`: Parent task (for sub-tasks)
   - `taskDefinitionKey`: BPMN task element ID

4. **Candidates**
   - `candidateUsers`: Users who can claim
   - `candidateGroups`: Groups whose members can claim

**Usage Example**:
```java
Task task = taskRuntime.task("task-id");

System.out.println("Assignee: " + task.getAssignee());
System.out.println("Status: " + task.getStatus());
System.out.println("Due Date: " + task.getDueDate());
System.out.println("Candidates: " + task.getCandidateUsers());
```

### TaskCandidate Interface

**File**: `TaskCandidate.java`

```java
public interface TaskCandidate {
    String getTaskId();
}
```

**Purpose**: Base interface for task candidates (users and groups).

### TaskCandidateUser Interface

**File**: `TaskCandidateUser.java`

```java
public interface TaskCandidateUser extends TaskCandidate {
    String getUserId();
}
```

**Purpose**: Represents a user candidate for a task.

**Usage**:
```java
TaskCandidateUser candidate = ...;
String userId = candidate.getUserId();
String taskId = candidate.getTaskId();
```

### TaskCandidateGroup Interface

**File**: `TaskCandidateGroup.java`

```java
public interface TaskCandidateGroup extends TaskCandidate {
    String getGroupId();
}
```

**Purpose**: Represents a group candidate for a task.

**Usage**:
```java
TaskCandidateGroup candidate = ...;
String groupId = candidate.getGroupId();
String taskId = candidate.getTaskId();
```

---

## Event System

### TaskRuntimeEvent Interface

**File**: `TaskRuntimeEvent.java`

```java
public interface TaskRuntimeEvent<T extends Task> 
    extends RuntimeEvent<T, TaskRuntimeEvent.TaskEvents> {
    
    enum TaskEvents {
        TASK_ASSIGNED,
        TASK_COMPLETED,
        TASK_CREATED,
        TASK_UPDATED,
        TASK_ACTIVATED,
        TASK_SUSPENDED,
        TASK_CANCELLED
    }
}
```

**Purpose**: Base interface for task lifecycle events.

**Event Types**:

1. **TASK_CREATED**: Task is created
2. **TASK_ASSIGNED**: Task assigned to user
3. **TASK_COMPLETED**: Task completed
4. **TASK_UPDATED**: Task details updated
5. **TASK_ACTIVATED**: Task activated (ready)
6. **TASK_SUSPENDED**: Task suspended
7. **TASK_CANCELLED**: Task cancelled

### Specific Task Events

#### TaskCreatedEvent

```java
public interface TaskCreatedEvent extends TaskRuntimeEvent<Task> {
}
```

**Triggered When**: New task is created in process.

#### TaskAssignedEvent

```java
public interface TaskAssignedEvent extends TaskRuntimeEvent<Task> {
}
```

**Triggered When**: Task is assigned to a user.

#### TaskCompletedEvent

```java
public interface TaskCompletedEvent extends TaskRuntimeEvent<Task> {
}
```

**Triggered When**: Task is completed.

#### TaskCancelledEvent

```java
public interface TaskCancelledEvent extends TaskRuntimeEvent<Task> {
    String getReason();
}
```

**Triggered When**: Task is cancelled.

**Additional Data**: Cancellation reason.

### Task Candidate Events

#### TaskCandidateUserEvent

**File**: `TaskCandidateUserEvent.java`

```java
public interface TaskCandidateUserEvent extends 
    RuntimeEvent<TaskCandidateUser, TaskCandidateUserEvent.TaskCandidateUserEvents> {
    
    enum TaskCandidateUserEvents {
        TASK_CANDIDATE_USER_ADDED,
        TASK_CANDIDATE_USER_REMOVED
    }
}
```

**Purpose**: Events for candidate user changes.

**Specific Events**:
- `TaskCandidateUserAddedEvent`
- `TaskCandidateUserRemovedEvent`

#### TaskCandidateGroupEvent

**File**: `TaskCandidateGroupEvent.java`

```java
public interface TaskCandidateGroupEvent extends 
    RuntimeEvent<TaskCandidateGroup, TaskCandidateGroupEvent.TaskCandidateGroupEvents> {
    
    enum TaskCandidateGroupEvents {
        TASK_CANDIDATE_GROUP_ADDED,
        TASK_CANDIDATE_GROUP_REMOVED
    }
}
```

**Purpose**: Events for candidate group changes.

**Specific Events**:
- `TaskCandidateGroupAddedEvent`
- `TaskCandidateGroupRemovedEvent`

---

## Payload System

### TaskPayloadBuilder

**File**: `TaskPayloadBuilder.java`

```java
public class TaskPayloadBuilder {
    // Query
    public static GetTasksPayloadBuilder tasks();
    public static GetTasksPayloadBuilder tasksForProcess(ProcessInstance process);
    
    // Operations
    public static CompleteTaskPayloadBuilder complete();
    public static SaveTaskPayloadBuilder save();
    public static ClaimTaskPayloadBuilder claim();
    public static ReleaseTaskPayloadBuilder release();
    public static UpdateTaskPayloadBuilder update();
    public static DeleteTaskPayloadBuilder delete();
    public static CreateTaskPayloadBuilder create();
    public static AssignTaskPayloadBuilder assign();
    public static AssignTasksPayloadBuilder assignMultiple();
    
    // Variables
    public static CreateTaskVariablePayloadBuilder createVariable();
    public static UpdateTaskVariablePayloadBuilder updateVariable();
    public static GetTaskVariablesPayloadBuilder variables();
    
    // Candidates
    public static CandidateUsersPayloadBuilder addCandidateUsers();
    public static CandidateUsersPayloadBuilder deleteCandidateUsers();
    public static CandidateGroupsPayloadBuilder addCandidateGroups();
    public static CandidateGroupsPayloadBuilder deleteCandidateGroups();
}
```

**Purpose**: Factory for creating task-related payloads.

### Task Operation Payloads

#### CompleteTaskPayload

**File**: `CompleteTaskPayload.java`

```java
public class CompleteTaskPayload implements Payload {
    private String taskId;
    private Map<String, Object> variables;
}
```

**Purpose**: Complete a task with optional variables.

**Usage**:
```java
taskRuntime.complete(
    TaskPayloadBuilder.complete()
        .withTaskId(taskId)
        .withVariable("approved", true)
        .withVariable("comments", "Looks good")
        .build()
);
```

#### ClaimTaskPayload

**File**: `ClaimTaskPayload.java`

```java
public class ClaimTaskPayload implements Payload {
    private String taskId;
    private String assignee;
}
```

**Purpose**: Claim a task for a user.

**Usage**:
```java
// Claim as current user
taskRuntime.claim(
    TaskPayloadBuilder.claim()
        .withTaskId(taskId)
        .build()
);

// Claim as specific user (admin)
taskAdminRuntime.claim(
    TaskPayloadBuilder.claim()
        .withTaskId(taskId)
        .withAssignee("john.doe")
        .build()
);
```

#### CreateTaskPayload

**File**: `CreateTaskPayload.java`

```java
public class CreateTaskPayload implements Payload {
    private String name;
    private String description;
    private Date dueDate;
    private int priority;
    private String assignee;
    private List<String> candidateGroups;
    private List<String> candidateUsers;
    private String parentTaskId;
    private String formKey;
}
```

**Purpose**: Create a standalone task (not part of a process).

**Usage**:
```java
Task task = taskRuntime.create(
    TaskPayloadBuilder.create()
        .withName("Manual Review")
        .withDescription("Review documents")
        .withAssignee("reviewer1")
        .withDueDate(new Date(System.currentTimeMillis() + 7 * 24 * 60 * 60 * 1000))
        .withPriority(50)
        .withCandidateGroup("managers")
        .withCandidateUser("backup.reviewer")
        .build()
);
```

#### UpdateTaskPayload

**File**: `UpdateTaskPayload.java`

```java
public class UpdateTaskPayload implements Payload {
    private String taskId;
    private String name;
    private String description;
    private Date dueDate;
    private Integer priority;
    private String assignee;
    private String parentTaskId;
    private String formKey;
}
```

**Purpose**: Update task details.

**Usage**:
```java
taskRuntime.update(
    TaskPayloadBuilder.update()
        .withTaskId(taskId)
        .withName("Updated Task Name")
        .withDescription("New description")
        .withDueDate(new Date())
        .withPriority(60)
        .build()
);
```

#### DeleteTaskPayload

**File**: `DeleteTaskPayload.java`

```java
public class DeleteTaskPayload implements Payload {
    private String taskId;
    private String reason;
    
    public boolean hasReason();
}
```

**Purpose**: Delete/cancel a task.

**Usage**:
```java
taskRuntime.delete(
    TaskPayloadBuilder.delete()
        .withTaskId(taskId)
        .withReason("No longer needed")
        .build()
);
```

#### AssignTaskPayload

**File**: `AssignTaskPayload.java`

```java
public class AssignTaskPayload implements Payload {
    private String taskId;
    private String assignee;
}
```

**Purpose**: Assign a task to a different user.

**Usage**:
```java
taskRuntime.assign(
    TaskPayloadBuilder.assign()
        .withTaskId(taskId)
        .withAssignee("new.assignee")
        .build()
);
```

#### AssignTasksPayload

**File**: `AssignTasksPayload.java`

```java
public class AssignTasksPayload implements Payload {
    private List<String> taskIds;
    private String assignee;
}
```

**Purpose**: Batch assign multiple tasks.

**Usage**:
```java
taskAdminRuntime.assignMultiple(
    TaskPayloadBuilder.assignMultiple()
        .withTaskId("task1")
        .withTaskId("task2")
        .withTaskId("task3")
        .withAssignee("new.manager")
        .build()
);
```

### Variable Payloads

#### CreateTaskVariablePayload

**File**: `CreateTaskVariablePayload.java`

```java
public class CreateTaskVariablePayload implements Payload {
    private String taskId;
    private String name;
    private Object value;
}
```

**Purpose**: Create a task-scoped variable.

**Usage**:
```java
taskRuntime.createVariable(
    TaskPayloadBuilder.createVariable()
        .withTaskId(taskId)
        .withVariable("reviewNotes", "Needs attention")
        .build()
);
```

#### UpdateTaskVariablePayload

**File**: `UpdateTaskVariablePayload.java`

```java
public class UpdateTaskVariablePayload implements Payload {
    private String taskId;
    private String name;
    private Object value;
}
```

**Purpose**: Update a task-scoped variable.

**Usage**:
```java
taskRuntime.updateVariable(
    TaskPayloadBuilder.updateVariable()
        .withTaskId(taskId)
        .withVariable("reviewNotes", "Updated notes")
        .build()
);
```

#### SaveTaskPayload

**File**: `SaveTaskPayload.java`

```java
public class SaveTaskPayload implements Payload {
    private String taskId;
    private Map<String, Object> variables;
}
```

**Purpose**: Save multiple task variables.

**Usage**:
```java
taskRuntime.save(
    TaskPayloadBuilder.save()
        .withTaskId(taskId)
        .withVariable("field1", "value1")
        .withVariable("field2", "value2")
        .build()
);
```

### Candidate Payloads

#### CandidateUsersPayload

**File**: `CandidateUsersPayload.java`

```java
public class CandidateUsersPayload implements Payload {
    private String taskId;
    private List<String> candidateUsers;
}
```

**Purpose**: Add/remove candidate users.

**Usage**:
```java
// Add candidates
taskRuntime.addCandidateUsers(
    TaskPayloadBuilder.addCandidateUsers()
        .withTaskId(taskId)
        .withCandidateUser("user1")
        .withCandidateUser("user2")
        .build()
);

// Remove candidates
taskRuntime.deleteCandidateUsers(
    TaskPayloadBuilder.deleteCandidateUsers()
        .withTaskId(taskId)
        .withCandidateUsers(List.of("user1", "user2"))
        .build()
);
```

#### CandidateGroupsPayload

**File**: `CandidateGroupsPayload.java`

```java
public class CandidateGroupsPayload implements Payload {
    private String taskId;
    private List<String> candidateGroups;
}
```

**Purpose**: Add/remove candidate groups.

**Usage**:
```java
// Add candidate groups
taskRuntime.addCandidateGroups(
    TaskPayloadBuilder.addCandidateGroups()
        .withTaskId(taskId)
        .withCandidateGroup("managers")
        .withCandidateGroup("reviewers")
        .build()
);
```

### Query Payloads

#### GetTasksPayload

**File**: `GetTasksPayload.java`

```java
public class GetTasksPayload implements Payload {
    private String assigneeId;
    private List<String> groups;
    private String processInstanceId;
    private String parentTaskId;
    
    public boolean isStandalone();
}
```

**Purpose**: Filter tasks for queries.

**Filter Options**:
- By assignee
- By candidate groups
- By process instance
- By parent task (sub-tasks)
- Standalone tasks only

**Usage**:
```java
Page<Task> tasks = taskRuntime.tasks(
    Pageable.of(0, 20),
    TaskPayloadBuilder.tasks()
        .withAssignee("john.doe")
        .withGroup("managers")
        .withProcessInstanceId(processInstanceId)
        .build()
);
```

---

## Task Result

### TaskResult Class

**File**: `TaskResult.java`

```java
public class TaskResult extends Result<Task> {
    public TaskResult() { }
    
    public TaskResult(Payload payload, Task entity) {
        super(payload, entity);
    }
}
```

**Purpose**: Wrapper for task operation results.

**Usage**:
```java
TaskResult result = (TaskResult) taskRuntime.complete(payload);
Task completedTask = result.getEntity();
Payload usedPayload = result.getPayload();
```

---

## Design Patterns

### 1. Builder Pattern

All payloads use fluent builders:
```java
TaskPayloadBuilder.complete()
    .withTaskId(taskId)
    .withVariable("result", true)
    .build()
```

### 2. Factory Pattern

TaskPayloadBuilder provides factory methods:
```java
public static CompleteTaskPayloadBuilder complete() { ... }
public static CreateTaskPayloadBuilder create() { ... }
```

### 3. Template Method Pattern

Event hierarchy:
```java
public interface TaskRuntimeEvent<T extends Task> 
    extends RuntimeEvent<T, TaskEvents> {
    // Template for all task events
}
```

### 4. Strategy Pattern

Different operations use different payloads:
```java
// Claim strategy
ClaimTaskPayload

// Complete strategy
CompleteTaskPayload

// Update strategy
UpdateTaskPayload
```

---

## Task Assignment Flow

```
┌─────────────────┐
│ Task Created    │
│ (CREATED)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Candidate Users │
│ & Groups Set    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Claims     │
│ (ASSIGNED)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Task Work       │
│ In Progress     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Task Completed  │
│ (COMPLETED)     │
└─────────────────┘
```

---

## Performance Considerations

### 1. Task Query Optimization

Use specific filters:
```java
// Good - specific query
.withAssignee("john.doe")
.withProcessInstanceId(instanceId)

// Bad - broad query
tasks(Pageable.of(0, 1000))
```

### 2. Batch Operations

Use batch APIs:
```java
// Good - batch assign
assignMultiple(payloadWithMultipleTaskIds)

// Bad - individual assigns
for (String taskId : taskIds) {
    assign(taskId);
}
```

### 3. Variable Access

Minimize variable queries:
```java
// Good - get all at once
save(payloadWithMultipleVariables)

// Bad - individual saves
createVariable(var1);
createVariable(var2);
createVariable(var3);
```

---

## Testing Guidelines

### Task Model Testing

```java
@Test
void taskShouldHaveUniqueStatus() {
    Task task = createTask();
    
    assertNotNull(task.getStatus());
    assertTrue(EnumSet.allOf(TaskStatus.class).contains(task.getStatus()));
}

@Test
void taskShouldTrackCandidateChanges() {
    Task task = createTask();
    
    task.addCandidateUser("user1");
    assertTrue(task.getCandidateUsers().contains("user1"));
    
    task.removeCandidateUser("user1");
    assertFalse(task.getCandidateUsers().contains("user1"));
}
```

### Payload Testing

```java
@Test
void completeTaskPayloadShouldValidateTaskId() {
    assertThrows(IllegalArgumentException.class, () -> {
        TaskPayloadBuilder.complete()
            .withTaskId(null)
            .build();
    });
}
```

---

## Common Pitfalls

### 1. Task vs Process Variables

```java
// Task variable
taskRuntime.createVariable(...);

// Process variable
processRuntime.setVariables(...);

// Different scopes!
```

### 2. Standalone vs Process Tasks

```java
// Standalone task
Task task = taskRuntime.create(createPayload);

// Process task (created by process)
// Cannot create directly
```

### 3. Candidate Management

```java
// Bad - clearing all candidates
task.setCandidateUsers(new ArrayList<>());

// Good - adding specific candidates
taskRuntime.addCandidateUsers(payload);
```

---

## Version Information

- **Module Version**: 8.7.2-SNAPSHOT
- **Java Version**: 11+
- **Dependencies**: 
  - activiti-api-model-shared
  - activiti-api-process-model

---

## Related Documentation

- [Task Runtime Module](task-runtime.md)
- [Process Model Module](process-model.md)
- [Main Module Docs](../overview.md)

---

**Last Updated: 2026  
**Maintained by**: Activiti Community
