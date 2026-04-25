---
sidebar_label: API Reference
slug: /api-reference
title: "API Reference"
description: "Complete reference for all Activiti API interfaces, classes, methods, and payload builders. Essential guide for developers implementing workflow automation."
---

# API Reference

**Community-Maintained Guide**

Complete reference for all Activiti API interfaces, classes, and methods. This documentation serves as a community-contributed guide for developers implementing workflow automation solutions.

> **Note:** This is community-contributed documentation and is not officially maintained by the Activiti team. For official documentation, please refer to the Activiti project repositories.

## Quick Navigation

| Tier | Interface/Class | Purpose |
|------|-----------------|---------|
| **API — Process** | `ProcessRuntime` | Start, query, and manage process instances |
| **API — Process** | `ProcessAdminRuntime` | Admin-level process operations |
| **API — Task** | `TaskRuntime` | Query and complete user tasks |
| **API — Task** | `TaskAdminRuntime` | Admin-level task operations |
| **Engine — Runtime** | `RuntimeService` | Low-level process instance operations |
| **Engine — Task** | `TaskService` | Low-level task management |
| **Engine — Repository** | `RepositoryService` | Process definitions, deployments, and models |
| **Engine — History** | `HistoryService` | Historic process and task queries |
| **Engine — Management** | `ManagementService` | Admin and maintenance operations |
| **Engine — Dynamic BPMN** | `DynamicBpmnService` | Runtime modification of deployed process definitions |
| **Core Common — Security** | `SecurityManager` | Authentication and authorization |
| **Core Common — EL** | `ExpressionFactoryImpl` | Unified Expression Language (JUEL) |
| **Core Common — Connectors** | `ConnectorDefinition`, `ActionDefinition` | Connector model definitions |
| **Core Common — Caching** | `ActivitiSpringCaffeineCacheConfigurer`, `TreeCache` | Spring cache and expression cache |

## Table of Contents

- [Process Runtime API](#process-runtime-api)
- [Task Runtime API](#task-runtime-api)
- [Payload Builders](#payload-builders)
- [Event Interfaces](#event-interfaces)
- [Model Interfaces](#model-interfaces)
- [Security API](#security-api)
- [Query API](#query-api)
- [Exception Types](#exception-types)
- [Configuration Interfaces](#configuration-interfaces)
- [Engine API Services](#engine-api-services)
- [Core Common](#core-common)

---

## Process Runtime API

### ProcessRuntime Interface

Main interface for process operations at user level.

```java
public interface ProcessRuntime {
    
    // Configuration
    ProcessRuntimeConfiguration configuration();
    
    // Process Definition Operations
    ProcessDefinition processDefinition(String processDefinitionId);
    Page<ProcessDefinition> processDefinitions(Pageable pageable);
    Page<ProcessDefinition> processDefinitions(Pageable pageable, List<String> include);
    Page<ProcessDefinition> processDefinitions(Pageable pageable, GetProcessDefinitionsPayload payload);
    Page<ProcessDefinition> processDefinitions(Pageable pageable, GetProcessDefinitionsPayload payload, List<String> include);
    
    // Process Instance Operations
    ProcessInstance start(StartProcessPayload startProcessPayload);
    ProcessInstance startCreatedProcess(String processInstanceId, StartProcessPayload startProcessPayload);
    ProcessInstance create(CreateProcessInstancePayload startProcessPayload);
    Page<ProcessInstance> processInstances(Pageable pageable);
    Page<ProcessInstance> processInstances(Pageable pageable, GetProcessInstancesPayload payload);
    ProcessInstance processInstance(String processInstanceId);
    
    // Lifecycle Operations
    ProcessInstance suspend(SuspendProcessPayload suspendProcessPayload);
    ProcessInstance resume(ResumeProcessPayload resumeProcessPayload);
    ProcessInstance delete(DeleteProcessPayload deleteProcessPayload);
    ProcessInstance update(UpdateProcessPayload updateProcessPayload);
    
    // Event Operations
    void signal(SignalPayload signalPayload);
    void receive(ReceiveMessagePayload messagePayload);
    ProcessInstance start(StartMessagePayload messagePayload);
    
    // Variable Operations
    List<VariableInstance> variables(GetVariablesPayload getVariablesPayload);
    void removeVariables(RemoveProcessVariablesPayload removeProcessVariablesPayload);
    void setVariables(SetProcessVariablesPayload setProcessVariablesPayload);
    
    // Metadata Operations
    ProcessDefinitionMeta processDefinitionMeta(String processDefinitionKey);
    ProcessInstanceMeta processInstanceMeta(String processInstanceId);
    
    // Deployment Operations
    Deployment selectLatestDeployment();
}
```

### ProcessAdminRuntime Interface

Admin-level process operations with elevated privileges.

```java
public interface ProcessAdminRuntime {
    
    // Process Definition Operations
    ProcessDefinition processDefinition(String processDefinitionId);
    Page<ProcessDefinition> processDefinitions(Pageable pageable);
    Page<ProcessDefinition> processDefinitions(Pageable pageable, GetProcessDefinitionsPayload payload);
    
    // Process Instance Operations
    ProcessInstance start(StartProcessPayload startProcessPayload);
    Page<ProcessInstance> processInstances(Pageable pageable);
    Page<ProcessInstance> processInstances(Pageable pageable, GetProcessInstancesPayload payload);
    ProcessInstance processInstance(String processInstanceId);
    
    // Lifecycle Operations
    ProcessInstance delete(DeleteProcessPayload deleteProcessPayload);
    ProcessInstance suspend(SuspendProcessPayload suspendProcessPayload);
    ProcessInstance resume(ResumeProcessPayload resumeProcessPayload);
    ProcessInstance update(UpdateProcessPayload updateProcessPayload);
    
    // Event Operations
    void signal(SignalPayload signalPayload);
    void receive(ReceiveMessagePayload messagePayload);
    ProcessInstance start(StartMessagePayload messagePayload);
    
    // Variable Operations
    List<VariableInstance> variables(GetVariablesPayload getVariablesPayload);
    void removeVariables(RemoveProcessVariablesPayload removeProcessVariablesPayload);
    void setVariables(SetProcessVariablesPayload setProcessVariablesPayload);
}
```

### Method Details

#### start(StartProcessPayload)

Starts a new process instance.

**Example:**
```java
ProcessInstance instance = processRuntime.start(
    ProcessPayloadBuilder.start()
        .withProcessDefinitionKey("orderProcess")
        .withBusinessKey("ORDER-001")
        .withVariable("amount", 1000)
        .build()
);
```

#### processInstance(String processInstanceId)

Retrieves a process instance by ID. Throws `NotFoundException` if not found.

**Example:**
```java
ProcessInstance instance = processRuntime.processInstance("instance-123");
System.out.println("Status: " + instance.getStatus());
```

#### suspend(SuspendProcessPayload)

Suspends a running process instance.

**Example:**
```java
ProcessInstance suspended = processRuntime.suspend(
    ProcessPayloadBuilder.suspend(instanceId)
);
```

#### resume(ResumeProcessPayload)

Resumes a suspended process instance.

**Example:**
```java
ProcessInstance resumed = processRuntime.resume(
    ProcessPayloadBuilder.resume(instanceId)
);
```

#### delete(DeleteProcessPayload)

Deletes a process instance.

**Example:**
```java
ProcessInstance deleted = processRuntime.delete(
    ProcessPayloadBuilder.delete()
        .withProcessInstanceId(instanceId)
        .withReason("Customer request")
        .build()
);
```

#### setVariables(SetProcessVariablesPayload)

Sets or updates process variables.

**Example:**
```java
processRuntime.setVariables(
    ProcessPayloadBuilder.setVariables()
        .withProcessInstanceId(instanceId)
        .withVariable("status", "approved")
        .withVariable("reviewer", "john.doe")
        .build()
);
```

#### variables(GetVariablesPayload)

Retrieves process variables.

**Example:**
```java
List<VariableInstance> variables = processRuntime.variables(
    ProcessPayloadBuilder.variables()
        .withProcessInstanceId(instanceId)
        .build()
);
```

#### signal(SignalPayload)

Sends a signal event to running processes.

**Example:**
```java
processRuntime.signal(
    SignalPayloadBuilder.signal()
        .withName("approvalSignal")
        .withVariable("approvedBy", "manager")
        .build()
);
```

#### receive(ReceiveMessagePayload)

Sends a message to a process instance.

**Example:**
```java
processRuntime.receive(
    MessagePayloadBuilder.receive("paymentReceived")
        .withCorrelationKey("ORDER-123")
        .withVariable("amount", 500.00)
        .build()
);
```

---

## Task Runtime API

### TaskRuntime Interface

Main interface for task operations at user level.

```java
public interface TaskRuntime {
    
    // Configuration
    TaskRuntimeConfiguration configuration();
    
    // Task Query Operations
    Task task(String taskId);
    Page<Task> tasks(Pageable pageable);
    Page<Task> tasks(Pageable pageable, GetTasksPayload getTasksPayload);
    
    // Task Lifecycle Operations
    Task create(CreateTaskPayload createTaskPayload);
    Task claim(ClaimTaskPayload claimTaskPayload);
    Task release(ReleaseTaskPayload releaseTaskPayload);
    Task complete(CompleteTaskPayload completeTaskPayload);
    Task update(UpdateTaskPayload updateTaskPayload);
    Task delete(DeleteTaskPayload deleteTaskPayload);
    
    // Task Assignment Operations
    Task assign(AssignTaskPayload assignTaskPayload);
    
    // Variable Operations
    void createVariable(CreateTaskVariablePayload createTaskVariablePayload);
    void updateVariable(UpdateTaskVariablePayload updateTaskVariablePayload);
    List<VariableInstance> variables(GetTaskVariablesPayload getTaskVariablesPayload);
    void save(SaveTaskPayload saveTaskPayload);
    
    // Candidate Operations
    void addCandidateUsers(CandidateUsersPayload candidateUsersPayload);
    void deleteCandidateUsers(CandidateUsersPayload candidateUsersPayload);
    void addCandidateGroups(CandidateGroupsPayload candidateGroupsPayload);
    void deleteCandidateGroups(CandidateGroupsPayload candidateGroupsPayload);
    List<String> userCandidates(String taskId);
    List<String> groupCandidates(String taskId);
}
```

### TaskAdminRuntime Interface

Admin-level task operations with elevated privileges.

```java
public interface TaskAdminRuntime {
    
    // Task Query Operations
    Task task(String taskId);
    Page<Task> tasks(Pageable pageable);
    Page<Task> tasks(Pageable pageable, GetTasksPayload getTasksPayload);
    Task lastCreatedTaskByProcessInstanceIdAndTaskDefinitionKey(String processInstanceId, String taskDefinitionKey);
    
    // Task Lifecycle Operations
    Task claim(ClaimTaskPayload claimTaskPayload);
    Task release(ReleaseTaskPayload releaseTaskPayload);
    Task complete(CompleteTaskPayload completeTaskPayload);
    Task update(UpdateTaskPayload updateTaskPayload);
    Task delete(DeleteTaskPayload deleteTaskPayload);
    
    // Task Assignment Operations
    Task assign(AssignTaskPayload assignTaskPayload);
    Page<Task> assignMultiple(AssignTasksPayload assignTasksPayload);
    
    // Variable Operations
    void createVariable(CreateTaskVariablePayload createTaskVariablePayload);
    void updateVariable(UpdateTaskVariablePayload updateTaskVariablePayload);
    List<VariableInstance> variables(GetTaskVariablesPayload getTaskVariablesPayload);
    
    // Candidate Operations
    void addCandidateUsers(CandidateUsersPayload candidateUsersPayload);
    void deleteCandidateUsers(CandidateUsersPayload candidateUsersPayload);
    void addCandidateGroups(CandidateGroupsPayload candidateGroupsPayload);
    void deleteCandidateGroups(CandidateGroupsPayload candidateGroupsPayload);
    List<String> userCandidates(String taskId);
    List<String> groupCandidates(String taskId);
}
```

### Method Details

#### task(String taskId)

Retrieves a task by ID.

**Parameters:**
- `taskId`: The unique identifier of the task

**Returns:**
- `Task`: The task details

**Throws:**
- `NotFoundException`: If task doesn't exist or user doesn't have access

**Example:**
```java
Task task = taskRuntime.task("task-123");
System.out.println("Assignee: " + task.getAssignee());
```

#### tasks(Pageable)

Retrieves tasks for the current user.

**Example:**
```java
Page<Task> tasks = taskRuntime.tasks(
    Pageable.of(0, 10, Order.by("createdDate", Order.Direction.DESC))
);
```

#### tasks(Pageable, GetTasksPayload)

Retrieves tasks with filters.

**Example:**
```java
Page<Task> tasks = taskRuntime.tasks(
    Pageable.of(0, 20),
    TaskPayloadBuilder.tasks()
        .withAssignee("john.doe")
        .withGroup("managers")
        .build()
);
```

#### claim(ClaimTaskPayload)

Claims a task for the current user. Throws `IllegalStateException` if user is not authenticated or not a candidate.

**Example:**
```java
Task claimed = taskRuntime.claim(
    TaskPayloadBuilder.claim()
        .withTaskId(taskId)
        .build()
);
```

#### complete(CompleteTaskPayload)

Completes a task. Throws `IllegalStateException` if task is not assigned to current user.

**Example:**
```java
Task completed = taskRuntime.complete(
    TaskPayloadBuilder.complete()
        .withTaskId(taskId)
        .withVariable("approved", true)
        .withVariable("comments", "Looks good")
        .build()
);
```

#### update(UpdateTaskPayload)

Updates task details.

**Example:**
```java
Task updated = taskRuntime.update(
    TaskPayloadBuilder.update()
        .withTaskId(taskId)
        .withName("Updated Task")
        .withDescription("New description")
        .withDueDate(new Date())
        .withPriority(50)
        .build()
);
```

#### release(ReleaseTaskPayload)

Releases a claimed task. Throws `IllegalStateException` if current user is not the assignee.

**Example:**
```java
Task released = taskRuntime.release(
    TaskPayloadBuilder.release()
        .withTaskId(taskId)
        .build()
);
```

#### assign(AssignTaskPayload)

Assigns a task to another user. Throws `IllegalStateException` if current user is not the assignee or new assignee is not a candidate.

**Example:**
```java
Task assigned = taskRuntime.assign(
    TaskPayloadBuilder.assign()
        .withTaskId(taskId)
        .withAssignee("jane.doe")
        .build()
);
```

#### create(CreateTaskPayload)

Creates a standalone task (not part of a process).

**Example:**
```java
Task created = taskRuntime.create(
    TaskPayloadBuilder.create()
        .withName("Manual Task")
        .withDescription("Ad-hoc task")
        .withAssignee("john.doe")
        .withPriority(30)
        .withCandidateGroup("team")
        .build()
);
```

#### addCandidateUsers(CandidateUsersPayload)

Adds candidate users to a task.

**Example:**
```java
taskRuntime.addCandidateUsers(
    TaskPayloadBuilder.addCandidateUsers()
        .withTaskId(taskId)
        .withCandidateUser("user1")
        .withCandidateUser("user2")
        .build()
);
```

#### addCandidateGroups(CandidateGroupsPayload)

Adds candidate groups to a task.

**Example:**
```java
taskRuntime.addCandidateGroups(
    TaskPayloadBuilder.addCandidateGroups()
        .withTaskId(taskId)
        .withCandidateGroup("managers")
        .withCandidateGroup("reviewers")
        .build()
);
```

---

## Payload Builders

### ProcessPayloadBuilder

Factory class for creating process-related payloads.

```java
public class ProcessPayloadBuilder {
    
    // Start process
    public static StartProcessPayloadBuilder start();
    public static StartProcessPayloadBuilder start(StartProcessPayload from);
    
    // Create process instance
    public static CreateProcessPayloadBuilder create();
    public static CreateProcessPayloadBuilder create(CreateProcessInstancePayload from);
    
    // Delete process
    public static DeleteProcessPayloadBuilder delete();
    public static DeleteProcessPayload delete(String processInstanceId);
    public static DeleteProcessPayload delete(ProcessInstance processInstance);
    
    // Suspend process
    public static SuspendProcessPayloadBuilder suspend();
    public static SuspendProcessPayload suspend(String processInstanceId);
    public static SuspendProcessPayload suspend(ProcessInstance processInstance);
    
    // Resume process
    public static ResumeProcessPayloadBuilder resume();
    public static ResumeProcessPayload resume(String processInstanceId);
    public static ResumeProcessPayload resume(ProcessInstance processInstance);
    
    // Update process
    public static UpdateProcessPayloadBuilder update();
    
    // Variables
    public static GetVariablesPayloadBuilder variables();
    public static SetVariablesPayloadBuilder setVariables();
    public static SetVariablesPayloadBuilder setVariables(ProcessInstance processInstance);
    public static SetVariablesPayloadBuilder setVariables(String processInstanceId);
    public static RemoveVariablesPayloadBuilder removeVariables();
    
    // Events
    public static SignalPayloadBuilder signal();
    
    // Queries
    public static GetProcessDefinitionsPayloadBuilder processDefinitions();
    public static GetProcessInstancesPayloadBuilder processInstances();
    public static GetProcessInstancesPayload subprocesses(String parentProcessInstanceId);
    public static GetProcessInstancesPayload subprocesses(ProcessInstance parentProcessInstance);
}
```

### TaskPayloadBuilder

Factory class for creating task-related payloads.

```java
public class TaskPayloadBuilder {
    
    // Query tasks
    public static GetTasksPayloadBuilder tasks();
    public static GetTasksPayloadBuilder tasksForProcess(ProcessInstance processInstance);
    
    // Complete task
    public static CompleteTaskPayloadBuilder complete();
    
    // Save task variables
    public static SaveTaskPayloadBuilder save();
    
    // Claim task
    public static ClaimTaskPayloadBuilder claim();
    
    // Release task
    public static ReleaseTaskPayloadBuilder release();
    
    // Variables
    public static CreateTaskVariablePayloadBuilder createVariable();
    public static UpdateTaskVariablePayloadBuilder updateVariable();
    public static GetTaskVariablesPayloadBuilder variables();
    
    // Update task
    public static UpdateTaskPayloadBuilder update();
    
    // Delete task
    public static DeleteTaskPayloadBuilder delete();
    
    // Create task
    public static CreateTaskPayloadBuilder create();
    
    // Assign task
    public static AssignTaskPayloadBuilder assign();
    public static AssignTasksPayloadBuilder assignMultiple();
    
    // Candidates
    public static CandidateUsersPayloadBuilder addCandidateUsers();
    public static CandidateUsersPayloadBuilder deleteCandidateUsers();
    public static CandidateGroupsPayloadBuilder addCandidateGroups();
    public static CandidateGroupsPayloadBuilder deleteCandidateGroups();
}
```

### MessagePayloadBuilder

Factory class for creating message-related payloads.

```java
public class MessagePayloadBuilder {
    
    // Start message
    public static StartMessagePayloadBuilder start(String name);
    public static StartMessagePayloadBuilder from(StartMessagePayload startMessagePayload);
    
    // Receive message
    public static ReceiveMessagePayloadBuilder receive(String name);
    public static ReceiveMessagePayloadBuilder from(ReceiveMessagePayload receiveMessagePayload);
    
    // Message event
    public static MessageEventPayloadBuilder event(String name);
    public static MessageEventPayloadBuilder from(MessageEventPayload messageEventPayload);
}
```

---

## Event Interfaces

### Process Events

#### ProcessRuntimeEvent

Base interface for process runtime events.

```java
public interface ProcessRuntimeEvent<T extends ProcessInstance> 
    extends RuntimeEvent<T, ProcessRuntimeEvent.ProcessEvents> {
    
    enum ProcessEvents {
        PROCESS_CREATED,
        PROCESS_STARTED,
        PROCESS_COMPLETED,
        PROCESS_CANCELLED,
        PROCESS_SUSPENDED,
        PROCESS_RESUMED,
        PROCESS_UPDATED,
        PROCESS_DELETED
    }
}
```

> **Note:** The `PROCESS_DELETED` enum value has no corresponding `ProcessDeletedEvent` interface in the Activiti source code. Use `ProcessCancelledEvent` for cancelled process instances.

#### ExtendedProcessRuntimeEvent

Extended process event with nested process information.

```java
public interface ExtendedProcessRuntimeEvent<T extends ProcessInstance> 
    extends ProcessRuntimeEvent<T> {
    
    String getNestedProcessInstanceId();
    String getNestedProcessDefinitionId();
}
```

#### Specific Process Events

```java
public interface ProcessCreatedEvent extends ProcessRuntimeEvent<ProcessInstance> {}
public interface ProcessStartedEvent extends ExtendedProcessRuntimeEvent<ProcessInstance> {}
public interface ProcessCompletedEvent extends ProcessRuntimeEvent<ProcessInstance> {}
public interface ProcessCancelledEvent extends ProcessRuntimeEvent<ProcessInstance> {
    String getCause();
}
public interface ProcessSuspendedEvent extends ProcessRuntimeEvent<ProcessInstance> {}
public interface ProcessResumedEvent extends ProcessRuntimeEvent<ProcessInstance> {}
public interface ProcessUpdatedEvent extends ProcessRuntimeEvent<ProcessInstance> {}
```

### Task Events

#### TaskRuntimeEvent

Base interface for task runtime events.

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

#### Specific Task Events

```java
public interface TaskCreatedEvent extends TaskRuntimeEvent<Task> {}
public interface TaskAssignedEvent extends TaskRuntimeEvent<Task> {}
public interface TaskCompletedEvent extends TaskRuntimeEvent<Task> {}
public interface TaskUpdatedEvent extends TaskRuntimeEvent<Task> {}
public interface TaskActivatedEvent extends TaskRuntimeEvent<Task> {}
public interface TaskSuspendedEvent extends TaskRuntimeEvent<Task> {}
public interface TaskCancelledEvent extends TaskRuntimeEvent<Task> {
    String getReason();
}
```

### Variable Events

#### VariableEvent

Base interface for variable events.

```java
public interface VariableEvent extends RuntimeEvent<VariableInstance, VariableEvent.VariableEvents> {
    
    enum VariableEvents {
        VARIABLE_CREATED,
        VARIABLE_UPDATED,
        VARIABLE_DELETED
    }
}
```

#### Specific Variable Events

```java
public interface VariableCreatedEvent extends VariableEvent {}
public interface VariableUpdatedEvent extends VariableEvent {
    <T> T getPreviousValue();
}
public interface VariableDeletedEvent extends VariableEvent {}
```

### BPMN Events

#### BPMNActivityEvent

```java
public interface BPMNActivityEvent extends RuntimeEvent<BPMNActivity, BPMNActivityEvent.ActivityEvents> {
    enum ActivityEvents {
        ACTIVITY_STARTED,
        ACTIVITY_CANCELLED,
        ACTIVITY_COMPLETED
    }
}
```

#### BPMNTimerEvent

```java
public interface BPMNTimerEvent extends RuntimeEvent<BPMNTimer, BPMNTimerEvent.TimerEvents> {
    enum TimerEvents {
        TIMER_SCHEDULED,
        TIMER_FIRED,
        TIMER_CANCELLED,
        TIMER_EXECUTED,
        TIMER_FAILED,
        TIMER_RETRIES_DECREMENTED
    }
}
```

#### BPMNMessageEvent

```java
public interface BPMNMessageEvent extends RuntimeEvent<BPMNMessage, BPMNMessageEvent.MessageEvents> {
    enum MessageEvents {
        MESSAGE_WAITING,
        MESSAGE_RECEIVED,
        MESSAGE_SENT
    }
}
```

---

## Model Interfaces

### ProcessInstance

Represents a running process instance.

```java
public interface ProcessInstance extends ApplicationElement {
    
    enum ProcessInstanceStatus {
        CREATED,
        RUNNING,
        SUSPENDED,
        CANCELLED,
        COMPLETED
    }
    
    String getId();
    String getName();
    Date getStartDate();
    Date getCompletedDate();
    String getInitiator();
    String getBusinessKey();
    ProcessInstanceStatus getStatus();
    String getProcessDefinitionId();
    String getProcessDefinitionKey();
    String getParentId();
    Integer getProcessDefinitionVersion();
    String getProcessDefinitionName();
}
```

### ProcessDefinition

Represents a deployed process definition.

```java
public interface ProcessDefinition extends ApplicationElement {
    
    String getId();
    String getName();
    String getKey();
    String getDescription();
    int getVersion();
    String getFormKey();
    String getCategory();
}
```

### Task

Represents a user task.

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
    
    String getId();
    String getOwner();
    String getAssignee();
    String getName();
    String getDescription();
    Date getCreatedDate();
    Date getClaimedDate();
    Date getDueDate();
    int getPriority();
    String getProcessDefinitionId();
    String getProcessInstanceId();
    String getParentTaskId();
    TaskStatus getStatus();
    String getFormKey();
    Date getCompletedDate();
    Long getDuration();
    Integer getProcessDefinitionVersion();
    String getBusinessKey();
    boolean isStandalone();
    String getTaskDefinitionKey();
    List<String> getCandidateUsers();
    List<String> getCandidateGroups();
    String getCompletedBy();
}
```

### VariableInstance

Represents a process or task variable.

```java
public interface VariableInstance {
    
    String getName();
    String getType();
    String getProcessInstanceId();
    String getTaskId();
    boolean isTaskVariable();
    <T> T getValue();
}
```

### Deployment

Represents a process deployment.

```java
public interface Deployment {
    
    String getId();
    String getName();
    Integer getVersion();
    String getProjectReleaseVersion();
}
```

---

## Security API

### SecurityManager

Interface for security operations.

```java
public interface SecurityManager {
    
    String getAuthenticatedUserId();
    List<String> getAuthenticatedUserGroups() throws SecurityException;
    List<String> getAuthenticatedUserRoles() throws SecurityException;
}
```

### PrincipalIdentityProvider

Provider for extracting user identity from principal.

```java
public interface PrincipalIdentityProvider {
    
    default String getUserId(Principal principal) {
        return Optional.of(principal)
                       .map(Principal::getName)
                       .orElseThrow(() -> new SecurityException("Invalid security principal name"));
    }
}
```

### PrincipalGroupsProvider

Provider for extracting user groups from principal.

```java
public interface PrincipalGroupsProvider {
    
    List<String> getGroups(Principal principal);
}
```

### PrincipalRolesProvider

Provider for extracting user roles from principal.

```java
public interface PrincipalRolesProvider {
    
    List<String> getRoles(Principal principal);
}
```

---

## Query API

### Pageable

Configuration for paginated queries.

```java
public class Pageable {
    
    public static Pageable of(int startIndex, int maxItems);
    public static Pageable of(int startIndex, int maxItems, Order order);
    
    int getStartIndex();
    int getMaxItems();
    Order getOrder();
}
```

### Order

Configuration for result ordering.

```java
public class Order {
    
    public enum Direction {
        ASC,
        DESC
    }
    
    public static Order by(String property, Direction direction);
    
    String getProperty();
    Direction getDirection();
}
```

### Page

Paginated result container.

```java
public interface Page<T> {
    
    List<T> getContent();
    int getTotalItems();
}
```

---

## Exception Types

### NotFoundException

Thrown when a requested resource is not found.

```java
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message);
}
```

### UnprocessableEntityException

Thrown when the request entity is invalid.

```java
public class UnprocessableEntityException extends IllegalArgumentException {
    public UnprocessableEntityException(String message);
}
```

---

## Configuration Interfaces

### ProcessRuntimeConfiguration

Configuration for process runtime.

```java
public interface ProcessRuntimeConfiguration {
    
    List<ProcessRuntimeEventListener<?>> processEventListeners();
    List<VariableEventListener<?>> variableEventListeners();
}
```

### TaskRuntimeConfiguration

Configuration for task runtime.

```java
public interface TaskRuntimeConfiguration {
    
    List<TaskRuntimeEventListener<?>> taskRuntimeEventListeners();
    List<VariableEventListener<?>> variableEventListeners();
}
```

---

## Engine API Services

The Engine API (`org.activiti.engine`) provides low-level services that operate directly on the process engine. These are marked with `@Internal` and are primarily used internally by the higher-level `activiti-api` runtimes. Applications should prefer the API tier unless direct engine access is required.

### RuntimeService

Service for managing runtime process instances and executions.

```java
@Internal
public interface RuntimeService {

    ProcessInstanceBuilder createProcessInstanceBuilder();
    ProcessInstance startCreatedProcessInstance(ProcessInstance createdProcessInstance, Map<String, Object> variables);
    ProcessInstance startProcessInstanceByKey(String processDefinitionKey);
    ProcessInstance startProcessInstanceByKey(String processDefinitionKey, Map<String, Object> variables);
    ProcessInstance startProcessInstanceByKey(String processDefinitionKey, String businessKey, Map<String, Object> variables);
    ProcessInstance startProcessInstanceById(String processDefinitionId);
    ProcessInstance startProcessInstanceById(String processDefinitionId, Map<String, Object> variables);
    ProcessInstance startProcessInstanceById(String processDefinitionId, String businessKey, Map<String, Object> variables);
    // ... additional query, variable, signal, and message methods
}
```

### TaskService

Service for task and form-related operations.

```java
@Internal
public interface TaskService {

    Task newTask();
    Task newTask(String taskId);
    Task saveTask(Task task);
    void deleteTask(String taskId);
    void deleteTask(String taskId, boolean cascade);
    TaskQuery createTaskQuery();
    NativeTaskQuery createNativeTaskQuery();
    // ... additional assignment, variable, comment, and attachment methods
}
```

### RepositoryService

Service providing access to the repository of process definitions, deployments, and models.

```java
@Internal
public interface RepositoryService {

    DeploymentBuilder createDeployment();
    void deleteDeployment(String deploymentId);
    void deleteDeployment(String deploymentId, boolean cascade);
    void setDeploymentCategory(String deploymentId, String category);
    void setDeploymentKey(String deploymentId, String key);
    // ... additional process definition, model, and deployment query methods
}
```

### HistoryService

Service exposing information about ongoing and past process instances. History data remains permanent in the persistent storage.

```java
@Internal
public interface HistoryService {

    HistoricProcessInstanceQuery createHistoricProcessInstanceQuery();
    HistoricActivityInstanceQuery createHistoricActivityInstanceQuery();
    HistoricTaskInstanceQuery createHistoricTaskInstanceQuery();
    HistoricDetailQuery createHistoricDetailQuery();
    HistoricVariableInstanceQuery createHistoricVariableInstanceQuery();
    // ... additional native query and cleanup methods
}
```

### ManagementService

Service for admin and maintenance operations on the process engine. Typically used in operational consoles rather than application code.

```java
@Internal
public interface ManagementService {

    Map<String, Long> getTableCount();
    String getTableName(Class<?> activitiEntityClass);
    TableMetaData getTableMetaData(String tableName);
    TablePageQuery createTablePageQuery();
    JobQuery createJobQuery();
    TimerJobQuery createTimerJobQuery();
    SuspendedJobQuery createSuspendedJobQuery();
    DeadLetterJobQuery createDeadLetterJobQuery();
    // ... additional SQL execution and command methods
}
```

### DynamicBpmnService

Service for runtime modification of deployed process definitions without re-deployment.

```java
public interface DynamicBpmnService {

    ObjectNode getProcessDefinitionInfo(String processDefinitionId);
    ObjectNode getProcessDefinitionInfo(ProcessDefinition processDefinition);
    void saveProcessDefinitionInfo(String processDefinitionId, ObjectNode infoNode);
    ObjectNode changeServiceTaskClassName(String id, String className);
    ObjectNode changeServiceTaskExpression(String id, String expression);
    ObjectNode changeUserTaskName(String id, String name);
    ObjectNode changeUserTaskAssignee(String id, String assignee);
    // ... additional task modification and localization methods
}
```

---

## Core Common

The `activiti-core-common` module provides shared infrastructure used across the API and engine layers.

### Security

#### SecurityManager

Defined in `org.activiti.api.runtime.shared.security`. Provides the contract for retrieving the current authenticated user's identity, groups, and roles.

```java
public interface SecurityManager {

    String getAuthenticatedUserId();
    List<String> getAuthenticatedUserGroups() throws SecurityException;
    List<String> getAuthenticatedUserRoles() throws SecurityException;
}
```

The default Spring implementation is `LocalSpringSecurityManager` in `org.activiti.core.common.spring.security`.

### Expression Language

Activiti ships a fork of Jakarta Expression Language (JUEL) under `org.activiti.core.el.juel`. The main entry point is `ExpressionFactoryImpl`, which extends the standard `jakarta.el.ExpressionFactory`.

### Connectors

The `activiti-connector-model` module defines POJOs for connector configuration:

- `ConnectorDefinition` — top-level connector descriptor
- `ActionDefinition` — individual action within a connector
- `VariableDefinition` — input/output variable for an action

### Caching

Two caching subsystems are available in core-common:

- `ActivitiSpringCaffeineCacheConfigurer` — interface for configuring Spring Caffeine caches with per-cache predicates and builder functions
- `TreeCache` — interface for the expression language parser's internal AST caching

---

**End of API Reference**

For implementation examples, see [Quick Start Guide](../quickstart.md) and [Best Practices](../best-practices/guide.md).
