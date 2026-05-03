---
name: java-api-reference
description: Reference for Activiti Java APIs — ProcessRuntime, TaskRuntime, engine services, delegates, payloads, and testing
license: Apache-2.0
compatibility: opencode
metadata:
  audience: documentation
  workflow: validation
---

## What I Do

I provide a structured reference for validating Java code examples in Activiti documentation. When loaded, I give agents the API surface, method signatures, and type information needed to verify code accuracy.

---

## Modern API (Recommended)

### ProcessRuntime

**Package:** `org.activiti.api.process.runtime`

| Method | Signature | Notes |
|--------|-----------|-------|
| `start` | `ProcessInstance start(StartProcessPayload)` | Start a process instance |
| `create` | `ProcessInstance create(CreateProcessInstancePayload)` | Create without starting |
| `startCreatedProcess` | `ProcessInstance startCreatedProcess(String id, StartProcessPayload)` | Start a created process |
| `processInstance` | `ProcessInstance processInstance(String processInstanceId)` | Get a process instance |
| `processInstances` | `Page<ProcessInstance> processInstances(Pageable)` | Query with pagination |
| `processDefinition` | `ProcessDefinition processDefinition(String id)` | Get a process definition |
| `processDefinitions` | `Page<ProcessDefinition> processDefinitions(Pageable)` | Query with pagination |
| `suspend` | `ProcessInstance suspend(SuspendProcessPayload)` | Suspend a process instance |
| `resume` | `ProcessInstance resume(ResumeProcessPayload)` | Resume a process instance |
| `delete` | `ProcessInstance delete(DeleteProcessPayload)` | Delete a process instance |
| `update` | `ProcessInstance update(UpdateProcessPayload)` | Update process instance name/description |
| `signal` | `void signal(SignalPayload)` | Send a signal |
| `receive` | `void receive(ReceiveMessagePayload)` | Receive a message |
| `start` (message) | `ProcessInstance start(StartMessagePayload)` | Start via message |
| `variables` | `List<VariableInstance> variables(GetVariablesPayload)` | Get process variables |
| `setVariables` | `void setVariables(SetProcessVariablesPayload)` | Set process variables |
| `removeVariables` | `void removeVariables(RemoveProcessVariablesPayload)` | Remove process variables |
| `configuration` | `ProcessRuntimeConfiguration configuration()` | Get runtime configuration |

### ProcessAdminRuntime

**Package:** `org.activiti.api.process.runtime`
Admin variant — bypasses some permission checks. Available only to admin users.

### TaskRuntime

**Package:** `org.activiti.api.task.runtime`

| Method | Signature | Notes |
|--------|-----------|-------|
| `task` | `Task task(String taskId)` | Get a task |
| `tasks` | `Page<Task> tasks(Pageable)` | Query with pagination |
| `create` | `Task create(CreateTaskPayload)` | Create a standalone task |
| `claim` | `Task claim(ClaimTaskPayload)` | Claim a task |
| `release` | `Task release(ReleaseTaskPayload)` | Release a claimed task |
| `complete` | `Task complete(CompleteTaskPayload)` | Complete a task |
| `assign` | `Task assign(AssignTaskPayload)` | Assign a task to user |
| `save` | `void save(SaveTaskPayload)` | Save task updates |
| `update` | `Task update(UpdateTaskPayload)` | Update task properties |
| `delete` | `Task delete(DeleteTaskPayload)` | Delete a task |
| `createVariable` | `void createVariable(CreateTaskVariablePayload)` | Create task variable |
| `updateVariable` | `void updateVariable(UpdateTaskVariablePayload)` | Update task variable |
| `variables` | `List<VariableInstance> variables(GetTaskVariablesPayload)` | Get task variables |
| `addCandidateUsers` | `void addCandidateUsers(CandidateUsersPayload)` | Add candidate users |
| `deleteCandidateUsers` | `void deleteCandidateUsers(CandidateUsersPayload)` | Remove candidate users |
| `addCandidateGroups` | `void addCandidateGroups(CandidateGroupsPayload)` | Add candidate groups |
| `deleteCandidateGroups` | `void deleteCandidateGroups(CandidateGroupsPayload)` | Remove candidate groups |
| `userCandidates` | `List<String> userCandidates(String taskId)` | Get candidate users |
| `groupCandidates` | `List<String> groupCandidates(String taskId)` | Get candidate groups |
| `configuration` | `TaskRuntimeConfiguration configuration()` | Get runtime configuration |

### TaskAdminRuntime

**Package:** `org.activiti.api.task.runtime`
Admin variant — bypasses some permission checks. Available only to admin users.

### Payload Builders

All payloads are built using fluent builder patterns:

```java
// Process payload — verify builder class names against source
org.activiti.api.process.model.builders.StartProcessPayloadBuilder
org.activiti.api.process.model.builders.CreateProcessInstancePayloadBuilder
org.activiti.api.process.model.builders.SignalPayloadBuilder
org.activiti.api.process.model.builders.ReceiveMessagePayloadBuilder

// Task payload — verify builder class names against source
org.activiti.api.task.model.builders.CompleteTaskPayloadBuilder
org.activiti.api.task.model.builders.CreateTaskPayloadBuilder
org.activiti.api.task.model.builders.ClaimTaskPayloadBuilder
org.activiti.api.task.model.builders.AssignTaskPayloadBuilder
```

### Pagination

**Package:** `org.activiti.api.runtime.shared`
- `Page<T>` — paginated results
- `Pageable` — pagination request
- `Order` — sort order

### Events

Process events: `org.activiti.api.process.runtime.events.*`
Task events: `org.activiti.api.task.runtime.events.*`
Common: `Completed`, `Created`, `Started`, `Failed` suffixes.

---

## Legacy Engine API (Internal)

All marked `@Internal` in source but still widely used.

### Engine Services

| Service | Package | Key Methods |
|---------|---------|-------------|
| `RuntimeService` | `org.activiti.engine.RuntimeService` | `startProcessInstanceByKey`, `createProcessInstanceQuery`, `setVariable`, `getVariable`, `signal`, `messageEventReceived` |
| `TaskService` | `org.activiti.engine.TaskService` | `createTaskQuery`, `complete`, `claim`, `setAssignee`, `addCandidateUser`, `addCandidateGroup`, `createComment`, `createAttachment` |
| `RepositoryService` | `org.activiti.engine.RepositoryService` | `createDeployment`, `createProcessDefinitionQuery`, `getProcessModel`, `deleteDeployment` |
| `HistoryService` | `org.activiti.engine.HistoryService` | `createHistoricProcessInstanceQuery`, `createHistoricActivityInstanceQuery`, `createHistoricTaskInstanceQuery`, `createHistoricVariableInstanceQuery`, `createHistoricDetailQuery` |
| `ManagementService` | `org.activiti.engine.ManagementService` | `createTablePageQuery`, `executeCommand`, `setJobRetries`, `setJobRetryTimeOffset` |
| `DynamicBpmnService` | `org.activiti.engine.DynamicBpmnService` | `changeStartFormKey`, `changeActivityName`, `disableStartMessageEvent` |

**DO NOT DOCUMENT:**
- `IdentityService` — does not exist in Activiti 8.x
- `FormService` — does not exist in Activiti 8.x

### ProcessEngine & Configuration

| Class | Package | Key Methods |
|-------|---------|-------------|
| `ProcessEngine` | `org.activiti.engine.ProcessEngine` | `getRuntimeService()`, `getTaskService()`, `getRepositoryService()`, `getHistoryService()`, `getManagementService()`, `getDynamicBpmnService()` |
| `ProcessEngineConfiguration` | `org.activiti.engine.ProcessEngineConfiguration` | `createStandaloneProcessEngineConfiguration()`, `createProcessEngineConfigurationFromResourceDefault()`, `buildProcessEngine()` |
| `ProcessEngines` | `org.activiti.engine.ProcessEngines` | `getDefaultProcessEngine()`, `init()` |

### Delegates

| Interface | Package | Method |
|-----------|---------|--------|
| `JavaDelegate` | `org.activiti.engine.delegate` | `void execute(DelegateExecution execution)` |
| `DelegateExecution` | `org.activiti.engine.delegate` | `getVariable(String)`, `setVariable(String, Object)`, `getCurrentActivityId()`, `getProcessInstanceId()`, `getEngineServices()` |
| `DelegateTask` | `org.activiti.engine.delegate` | `setAssignee(String)`, `addCandidateUser(String)`, `addCandidateGroup(String)`, `setVariable(String, Object)` |
| `ExecutionListener` | `org.activiti.engine.delegate` | `void notify(DelegateExecution execution)` |
| `TaskListener` | `org.activiti.engine.delegate` | `void notify(DelegateTask task)` |

### Entity Interfaces

Key entities from `org.activiti.engine.runtime`, `.task`, `.repository`, `.history`:
- `ProcessInstance`, `Execution`, `Task`, `Job`
- `ProcessDefinition`, `Deployment`, `Model`
- `HistoricProcessInstance`, `HistoricActivityInstance`, `HistoricTaskInstance`, `HistoricVariableInstance`, `HistoricDetail`

---

## Testing Infrastructure

### JUnit 4

```java
org.activiti.engine.test.ActivitiRule — class rule for engine
org.activiti.engine.test.ActivitiGroupRule — group rule for parallel tests
org.activiti.engine.test.Deployment — annotation for test deployments
org.activiti.engine.test.ActivitiTestCase — base test class
```

### JUnit 5 / Spring

```java
org.activiti.engine.test.Extensions.ActivitiSpringTest — JUnit 5 extension
@ExtendWith(ActivitiSpringTest.class)
@SpringBootTest
```

### Mocking

```java
org.activiti.engine.test.mock.MockProvider — custom mock registration
org.activiti.engine.test.mock.MockTask — mock task implementation
```

---

## Expression Language

- Activiti uses **JUEL** (Jakarta Unified Expression Language)
- Syntax: `${...}` in BPMN attributes and expressions
- `#{...}` is **NOT** Activiti syntax (that is Spring SpEL / Flowable)
- Variables accessible: process variables, task variables, beans

---

## Security & Identity

**No IdentityService.** Identity is handled by:

| Class | Package | Purpose |
|-------|---------|---------|
| `UserGroupManager` | `org.activiti.api.runtime.shared.identity` | Abstracts user/group operations |
| `ActivitiUserGroupManagerImpl` | `org.activiti.spring.identity` | Spring Security implementation |
| `ExtendedInMemoryUserDetailsManager` | `org.activiti.spring.identity` | In-memory user store for testing |
| `SecurityManager` | `org.activiti.api.runtime.shared.security` | Security context management |
| `PrincipalIdentityProvider` | `org.activiti.api.runtime.shared.security` | User identity provider |
| `PrincipalGroupsProvider` | `org.activiti.api.runtime.shared.security` | Group membership provider |

---

## When to Use Me

Load this skill when:
- Creating documentation with Java code examples
- Validating API references against source
- Checking method signatures, types, and imports
- Reviewing payload usage and builder patterns
- Verifying test infrastructure examples
