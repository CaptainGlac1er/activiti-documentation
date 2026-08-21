---
sidebar_position: 2
sidebar_label: "Process & Task Payloads"
slug: /cloud/api-reference/process-and-task-payloads
title: "Process & Task Payloads"
description: "Reference for the runtime bundle REST request payloads (start, update, complete, assign, variables, candidates) and the process instance, task, and variable response models of the runtime bundle and query services."
---

# Process & Task Payloads

This page references the JSON payloads of the [runtime bundle's](../services/runtime-bundle.md) REST API:

- **Request payloads** — the `@RequestBody` classes of the `/v1` and `/admin/v1` controllers. All of them live in the engine API packages `org.activiti.api.process.model.payloads` and `org.activiti.api.task.model.payloads` (module `activiti-api` of the [Activiti engine](../../activiti/index.md), not in `activiti-cloud-api`), and all implement `org.activiti.api.model.shared.Payload`.
- **Response models** — the entity classes wrapped in the `entry` / `list` envelope (see [Cloud API Reference — Wire format](./overview.md#wire-format)): the runtime bundle returns its own `Cloud*` representations of the engine state, while the [query service](../services/query.md) returns its read-model entities, which are the same interfaces re-implemented over JPA tables.

Conventions shared by every request payload:

- Every payload carries an `id` (`String`, UUID) that the no-arg constructor generates. There is **no setter** for it, so sending an `id` in the body has no effect — omit it.
- The OpenAPI model shows an extra `payloadType` field on some payloads; that annotation exists only for Swagger model documentation (`PayloadApiModels` in the runtime bundle starter). The deserialized class has no such field — **do not send `payloadType`**.
- Where an endpoint takes the target id from the path (for example `PUT /v1/process-instances/{processInstanceId}`), the controller overwrites the matching body field with the path value; the path wins.
- Dates are ISO-8601 (`java.util.Date` serialized by Jackson, e.g. `2026-08-15T10:15:30.000+00:00`).
- Variable values are a free-form JSON `Map<String, Object>`: scalars, numbers, booleans, strings, arrays, and nested objects are all accepted and stored by the engine.

The endpoint tables below are pointers only — full method/path/parameter documentation belongs to the service pages ([runtime bundle](../services/runtime-bundle.md), [query](../services/query.md)).

## Process instance payloads

Package: `org.activiti.api.process.model.payloads` (artifact `activiti-api-process-model`).

### `StartProcessPayload`

Starts a new process instance. Used by `POST /v1/process-instances` and `POST /admin/v1/process-instances`, and (deprecated) `POST /v1/process-instances/{processInstanceId}/start`. See [Runtime Bundle Service — Process instances](../services/runtime-bundle.md#process-instances).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `processDefinitionId` | `String` | one of id/key | Definition to start, by id (`key:version:uuid`). |
| `processDefinitionKey` | `String` | one of id/key | Definition to start, by key — the latest version is resolved. |
| `name` | `String` | optional | Human-readable name of the instance. |
| `businessKey` | `String` | optional | Business key; correlation handle for the instance. |
| `variables` | `Map<String, Object>` | optional (defaults to `{}`) | Initial process variables. |
| `linkedProcessInstanceId` | `String` | optional | Starts this instance linked to another one (consumed by the engine for linked-instance starts). |
| `linkedProcessInstanceType` | `String` | optional | Type of that link. |

```json
{
  "processDefinitionKey": "leaveRequestProcess",
  "name": "Leave request for jdoe",
  "businessKey": "LEAVE-2026-0042",
  "variables": {
    "employeeId": "jdoe",
    "startDate": "2026-08-24",
    "days": 5
  }
}
```

The response is the started `CloudProcessInstance` — see [Response models](#response-models).

### `CreateProcessInstancePayload`

Creates an instance in the `CREATED` state without starting it. Used by the **deprecated** `POST /v1/process-instances/create`. Prefer `StartProcessPayload`. See [Runtime Bundle Service — Process instances](../services/runtime-bundle.md#process-instances).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `processDefinitionId` | `String` | one of id/key | Definition, by id. |
| `processDefinitionKey` | `String` | one of id/key | Definition, by key. |
| `name` | `String` | optional | Instance name. |
| `businessKey` | `String` | optional | Business key. |

### `UpdateProcessPayload`

Updates instance metadata. Used by `PUT /v1/process-instances/{processInstanceId}` and its admin variant. The path value of `processInstanceId` overwrites the body field.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `processInstanceId` | `String` | set from the path | Target instance. |
| `name` | `String` | optional | New instance name. |
| `description` | `String` | optional | New description. |
| `businessKey` | `String` | optional | New business key. |

### `SignalPayload`

Sends a signal to running processes waiting on a signal event. Used by `POST /v1/process-instances/signal` (200 on success). See [Runtime Bundle Service — Process instances](../services/runtime-bundle.md#process-instances).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `name` | `String` | yes | Signal name (must match a BPMN `signal` element). |
| `variables` | `Map<String, Object>` | optional (defaults to `{}`) | Variables delivered with the signal. |

### `StartMessagePayload`

Starts a process through a message start event. Used by `POST /v1/process-instances/message` (and the admin variant). For the broker-based equivalent, see [Connector & Message Payloads — Inbound](./connector-and-message-payloads.md#inbound-messageeventpayload).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `name` | `String` | yes | BPMN message name (must match a `<message>` element). |
| `businessKey` | `String` | optional | Business key for the started instance. |
| `variables` | `Map<String, Object>` | optional (defaults to `{}`) | Start variables. |

### `ReceiveMessagePayload`

Delivers a correlated message to a waiting process instance (intermediate message catch event). Used by `PUT /v1/process-instances/message` (200 on success).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `name` | `String` | yes | BPMN message name. |
| `correlationKey` | `String` | yes | Must equal the waiting instance's `activiti:correlationKey`. |
| `variables` | `Map<String, Object>` | optional (defaults to `{}`) | Variables delivered with the message. |

### Command-channel payloads (no REST body)

The remaining process payloads are built **inside** the runtime bundle from path variables or used on the broker command channel — they are never request bodies:

| Class | Fields | Where it appears |
|-------|--------|------------------|
| `SuspendProcessPayload` | `processInstanceId` | Built by `POST /v1/process-instances/{processInstanceId}/suspend` from the path id. |
| `ResumeProcessPayload` | `processInstanceId` | Built by `.../resume` from the path id. |
| `DeleteProcessPayload` | `processInstanceId`, `reason` | Built by `DELETE /v1/process-instances/{processInstanceId}` (cancel) and the admin `destroy` endpoint. |
| `GetProcessInstancesPayload` | `processDefinitionKeys` (`Set<String>`), `businessKey`, `suspendedOnly`, `activeOnly`, `parentProcessInstanceId` | Internal query payload behind `GET /v1/process-instances` and `.../subprocesses`. |
| `GetProcessDefinitionsPayload` | `processDefinitionIds` (`Set<String>`), `processDefinitionKeys` (`Set<String>`), `latestVersionOnly` (`boolean`) | Internal query payload behind the definition list endpoints. (A deprecated singular `getProcessDefinitionId()` still returns the first set element.) |
| `GetVariablesPayload` | `processInstanceId` | Internal payload behind `GET /v1/process-instances/{id}/variables`. |

## Process variable payloads

Package: `org.activiti.api.process.model.payloads`.

### `SetProcessVariablesPayload`

Creates or updates process-instance variables. Used by `PUT /v1/process-instances/{processInstanceId}/variables` and the admin variant (200 on success). See [Runtime Bundle Service — Variables](../services/runtime-bundle.md#variables).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `processInstanceId` | `String` | set from the path | Target instance. |
| `variables` | `Map<String, Object>` | yes | Variables to set; existing names are updated, new ones created. |

### `RemoveProcessVariablesPayload`

Removes process variables. **Admin only**: `DELETE /admin/v1/process-instances/{processInstanceId}/variables`.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `processInstanceId` | `String` | set from the path | Target instance. |
| `variableNames` | `List<String>` | yes | Names of the variables to remove. |

## Task payloads

Package: `org.activiti.api.task.model.payloads` (artifact `activiti-api-task-model`).

### `CreateTaskPayload`

Creates a standalone task (not bound to a process). Used by `POST /v1/tasks`. See [Runtime Bundle Service — Tasks](../services/runtime-bundle.md#tasks).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `name` | `String` | yes | Task name. |
| `description` | `String` | optional | Task description. |
| `dueDate` | `Date` | optional | Due date (ISO-8601). |
| `priority` | `int` | optional (primitive, `0` when omitted) | Task priority. |
| `assignee` | `String` | optional | Initial assignee user id. |
| `candidateUsers` | `List<String>` | optional | Initial candidate users. |
| `candidateGroups` | `List<String>` | optional | Initial candidate groups. |
| `parentTaskId` | `String` | optional | Parent task, to create a subtask. |
| `formKey` | `String` | optional | Form key of the user task definition. |

### `UpdateTaskPayload`

Updates task fields. Used by `PUT /v1/tasks/{taskId}` and the admin variant.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `taskId` | `String` | set from the path | Target task. |
| `name` | `String` | optional | New name. |
| `description` | `String` | optional | New description. |
| `dueDate` | `Date` | optional | New due date. |
| `priority` | `Integer` | optional | New priority (nullable, unlike `CreateTaskPayload`). |
| `assignee` | `String` | optional | New assignee. |
| `parentTaskId` | `String` | optional | New parent task. |
| `formKey` | `String` | optional | New form key. |

### `CompleteTaskPayload`

Completes the task, optionally setting variables. Used by `POST /v1/tasks/{taskId}/complete` (the body is **optional** — send `{}` or omit it) and the admin variant. Returns the `CloudTask`.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `taskId` | `String` | set from the path | Target task. |
| `variables` | `Map<String, Object>` | optional | Variables set on the instance at completion (available to the next gateway condition). |

```json
{
  "variables": {
    "approved": true,
    "comment": "Enjoy your holiday"
  }
}
```

### `SaveTaskPayload`

Persists task variables without completing the task. Used by `POST /v1/tasks/{taskId}/save`.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `taskId` | `String` | set from the path | Target task. |
| `variables` | `Map<String, Object>` | yes | Variables to persist. |

### `AssignTaskPayload`

Assigns the task to a specific user. Used by `POST /v1/tasks/{taskId}/assign` and the admin variant.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `taskId` | `String` | set from the path | Target task. |
| `assignee` | `String` | yes | User id to assign to. |

### `AssignTasksPayload`

Bulk-assigns several tasks to one user. **Admin only**: `POST /admin/v1/tasks/assign` — returns the paged list of assigned `CloudTask`s.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `taskIds` | `List<String>` | yes | Task ids to assign. |
| `assignee` | `String` | yes | User id to assign to. |

### `CandidateUsersPayload`

Adds or removes candidate users. Used by `POST /v1/tasks/{taskId}/candidate-users` (add) and `DELETE /v1/tasks/{taskId}/candidate-users` (remove), plus the admin variants.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `taskId` | `String` | set from the path | Target task. |
| `candidateUsers` | `List<String>` | yes | User ids to add/remove. |

### `CandidateGroupsPayload`

Adds or removes candidate groups. Used by `POST /v1/tasks/{taskId}/candidate-groups` (add) and `DELETE /v1/tasks/{taskId}/candidate-groups` (remove), plus the admin variants.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `taskId` | `String` | set from the path | Target task. |
| `candidateGroups` | `List<String>` | yes | Group names to add/remove. |

### Command-channel payloads (no REST body)

| Class | Fields | Where it appears |
|-------|--------|------------------|
| `ClaimTaskPayload` | `taskId`, `assignee` | Built by `POST /v1/tasks/{taskId}/claim` (assignee = authenticated user). |
| `ReleaseTaskPayload` | `taskId` | Built by `POST /v1/tasks/{taskId}/release`. |
| `DeleteTaskPayload` | `taskId`, `reason` | Built by `DELETE /v1/tasks/{taskId}`. |
| `GetTasksPayload` | `assigneeId`, `groups` (`List<String>`), `processInstanceId`, `parentTaskId` | Internal query payload behind `GET /v1/tasks` and `GET /v1/process-instances/{id}/tasks` (the `isStandalone()` helper is `processInstanceId == null`). |

## Task variable payloads

Package: `org.activiti.api.task.model.payloads`.

### `CreateTaskVariablePayload`

Creates a task-local variable. Used by `POST /v1/tasks/{taskId}/variables` (admin variant exists). See [Runtime Bundle Service — Variables](../services/runtime-bundle.md#variables).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `taskId` | `String` | set from the path | Target task. |
| `name` | `String` | yes | Variable name. |
| `value` | `Object` | yes | Variable value (any JSON). |

### `UpdateTaskVariablePayload`

Updates an existing task variable. Used by `PUT /v1/tasks/{taskId}/variables/{variableName}` (admin variant exists).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `taskId` | `String` | set from the path | Target task. |
| `name` | `String` | set from the path | Variable name (the path value wins). |
| `value` | `Object` | yes | New value. |

### Command-channel payloads (no REST body)

`GetTaskVariablesPayload` (`taskId`) is built internally by `GET /v1/tasks/{taskId}/variables`.

## Process definition sync payloads

These are not REST request bodies: they travel on the broker `commandConsumer` channel or are called in-process. The full deployment-and-sync flow is documented in [Deploying Processes at Runtime](../extension/deploying-processes.md).

### `SyncCloudProcessDefinitionsPayload`

Package: `org.activiti.cloud.api.process.model.impl` (this one **is** in `activiti-cloud-api`). Triggers a re-emission of `PROCESS_DEPLOYED` events so the query and audit read models converge after a runtime deployment. Consumed by `ProcessDefinitionsSyncService.syncProcessDefinitions(...)` in the bundle, or by the `commandConsumer` command path through the `ProcessRuntimeGateway`.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `processDefinitionKeys` | `List<String>` | optional | Restrict the sync to these keys; empty/null means **all** definitions in the bundle. |
| `excludedProcessDefinitionIds` | `List<String>` | optional | Definition ids removed from the selection. |

Built with the static builder (the setters copy the lists, so they are immutable after `build()`):

```java
import java.util.List;
import org.activiti.cloud.api.process.model.impl.SyncCloudProcessDefinitionsPayload;

SyncCloudProcessDefinitionsPayload payload = SyncCloudProcessDefinitionsPayload.builder()
    .processDefinitionKeys(List.of("orderProcess"))
    .excludedProcessDefinitionIds(List.of())
    .build();
```

### `SyncCloudProcessDefinitionsResult`

Package: `org.activiti.cloud.api.process.model.impl`. The reply of the command path: extends `org.activiti.api.model.shared.Result<List<String>>`, so the JSON is `{ "payload": { ...the request payload... }, "entity": [ ...definition ids re-emitted... ] }`.

### `ReplayServiceTaskRequest`

Package: `org.activiti.cloud.services.rest.api` (runtime bundle REST module — the only payload defined in the cloud REST layer itself). Body of `POST /admin/v1/executions/{executionId}/replay/service-task`, which re-sends the `IntegrationRequest` of a stuck or failed service task. See [Runtime Bundle Service — Service tasks (admin)](../services/runtime-bundle.md#service-tasks-admin).

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `flowNodeId` | `String` | yes (`@NotEmpty`) | Id of the service task (flow node) to replay. |

## Response models

The runtime bundle and the query service both answer `GET .../process-instances/{id}`, `GET .../tasks/{id}`, and the variable lists, but they return **different classes**:

| Resource | Runtime bundle (`/rb/v1`) returns | Query service (`/query/v1`) returns |
|----------|-----------------------------------|-------------------------------------|
| Process instance | `CloudProcessInstance` (`org.activiti.cloud.api.process.model`, serialized as `CloudProcessInstanceImpl`) — the engine state at commit time | `QueryCloudProcessInstance` (implemented by the JPA `ProcessInstanceEntity`, `org.activiti.cloud.services.query.model`) — the projected, eventually consistent state |
| Task | `CloudTask` (`org.activiti.cloud.api.task.model`, serialized as `CloudTaskImpl`) | `QueryCloudTask` (implemented by the JPA `TaskEntity`) |
| Process variable | `CloudVariableInstance` (`org.activiti.cloud.api.model.shared`, serialized as `CloudVariableInstanceImpl`) | `QueryCloudVariableInstance` (implemented by the JPA `ProcessVariableEntity` / `TaskVariableEntity`) |
| Process definition | `ExtendedCloudProcessDefinition` (serialized as `CloudProcessDefinitionImpl` plus `variableDefinitions` / `constantValues` when requested with `?include=variables,constant-values`) | `ProcessDefinitionEntity` |

Both flavors embed the same six service-attribution fields from `CloudRuntimeEntity` / `ActivitiEntityMetadata`: `appName`, `appVersion`, `serviceName`, `serviceFullName`, `serviceType`, `serviceVersion`. They are omitted from the field tables below.

### Process instance

`CloudProcessInstance` extends the engine `ProcessInstance` interface. `CloudProcessInstanceImpl` adds `suspendedDate` and `rootProcessInstanceId` beyond the interface.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | Instance id (UUID). |
| `name` | `String` | Instance name. |
| `startDate` | `Date` | When the instance started. |
| `completedDate` | `Date` | `null` while running. |
| `suspendedDate` | `Date` | `null` unless suspended (runtime bundle only). |
| `initiator` | `String` | User who started the instance. |
| `businessKey` | `String` | Business key. |
| `status` | `String` | `CREATED`, `RUNNING`, `SUSPENDED`, `CANCELLED`, `COMPLETED`. |
| `processDefinitionId` | `String` | `key:version:uuid`. |
| `processDefinitionKey` | `String` | Definition key. |
| `processDefinitionVersion` | `Integer` | Definition version. |
| `processDefinitionName` | `String` | Definition name. |
| `parentId` | `String` | Parent instance id for subprocesses. |
| `rootProcessInstanceId` | `String` | Root instance id (present on both models). |

Query-service extras on `ProcessInstanceEntity`: `lastModified` (`Date`), `linkedProcessInstanceId`, `linkedProcessInstanceType` (orphan-link bookkeeping, see [Query Service](../services/query.md)), and `subprocesses` / `linkedProcesses` as sets of `QueryCloudSubprocessInstance` (`id`, `processDefinitionName`).

### Task

`CloudTask` extends the engine `Task` interface.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | Task id. |
| `name` | `String` | Task name. |
| `description` | `String` | Task description. |
| `assignee` | `String` | Assigned user id, `null` when unassigned. |
| `owner` | `String` | Task owner. |
| `createdDate` | `Date` | Creation timestamp. |
| `claimedDate` | `Date` | When claimed, `null` otherwise. |
| `dueDate` | `Date` | Due date. |
| `priority` | `int` | Task priority. |
| `status` | `String` | `CREATED`, `ASSIGNED`, `SUSPENDED`, `COMPLETED`, `CANCELLED`, `DELETED`. |
| `processInstanceId` | `String` | `null` for standalone tasks. |
| `processDefinitionId` | `String` | Definition id (process-bound tasks). |
| `processDefinitionVersion` | `Integer` | Definition version. |
| `businessKey` | `String` | Business key of the instance. |
| `taskProcessRootProcessInstanceId` | `String` | Root instance of the process the task belongs to. |
| `parentTaskId` | `String` | Parent task id for subtasks. |
| `formKey` | `String` | Form key. |
| `taskDefinitionKey` | `String` | Id of the user task element in the BPMN. |
| `candidateUsers` | `List<String>` | Candidate user ids. |
| `candidateGroups` | `List<String>` | Candidate group names. |
| `completedBy` | `String` | User who completed the task. |
| `completedDate` | `Date` | Completion timestamp. |
| `duration` | `Long` | Duration in milliseconds. |
| `standalone` | `boolean` | `true` for tasks not bound to a process instance. |

Query-service extras on `TaskEntity`: `lastModified` (`Date`), `rootProcessInstanceId` (`String`), `processDefinitionName` (`String`), `permissions` (`List` of `VIEW`/`CLAIM`/`RELEASE`/`UPDATE` — populated when the entity is fetched through the security-checked endpoints), and `processVariables` (`Set<ProcessVariableEntity>`, populated when `variableKeys` is requested).

### Variable

Runtime bundle (`CloudVariableInstanceImpl`) — the `value` is the raw JSON value:

| Field | Type | Notes |
|-------|------|-------|
| `name` | `String` | Variable name. |
| `type` | `String` | Engine variable type name (`string`, `integer`, `boolean`, `date`, `json`, ...). |
| `processInstanceId` | `String` | Owning instance. |
| `taskId` | `String` | Owning task for task variables, `null` for process variables. |
| `value` | `Object` | The variable value (any JSON). |

Query service (`ProcessVariableEntity` / `TaskVariableEntity`) — the value is **wrapped** in a `VariableValue` object, plus read-model metadata:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `long` | Sequence id (the query model assigns its own ids). |
| `name` | `String` | Variable name. |
| `type` | `String` | Variable type. |
| `value` | `{ "value": ... }` | The value wrapped in an object, e.g. `{ "value": true }`. |
| `processInstanceId` | `String` | Owning instance. |
| `taskId` | `String` | Task variables only. |
| `executionId` | `String` | Engine execution id, `null` in most cases. |
| `variableDefinitionId` | `String` | Link to the `VariableDefinition` when the variable is declared in the process extensions. |
| `processDefinitionKey` | `String` | Definition key. |
| `createTime` | `Date` | When the variable was created. |
| `lastUpdatedTime` | `Date` | Last update. |
| `ephemeral` | `boolean` | Whether the variable is ephemeral (declared `ephemeral` in the process extensions; such variables are excluded from integration-audit event payloads). |

### Process definition

`CloudProcessDefinition` extends the engine `ProcessDefinition` interface; the list endpoints return `ExtendedCloudProcessDefinition`, which adds two fields:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | `key:version:uuid`. |
| `name` | `String` | Definition name. |
| `key` | `String` | Process key. |
| `description` | `String` | BPMN description. |
| `version` | `int` | Version number. |
| `formKey` | `String` | Start form key. |
| `category` | `String` | The BPMN `targetNamespace`. |
| `variableDefinitions` | `List<VariableDefinition>` | Only with `?include=variables`: `id`, `name`, `description`, `type`, `required`, `display`, `displayName`, `analytics` (`org.activiti.api.process.model.VariableDefinition`). |
| `constantValues` | `Map<String, Object>` | Only with `?include=constant-values`: constant start-variable values. |

The definition `meta` endpoint (`GET /v1/process-definitions/{id}/meta`) returns `ProcessDefinitionMeta` with `processDefinitionKey`, `usersIds`, `groupIds`, and `connectorsIds` (implementation `ProcessDefinitionMetaImpl`, `org.activiti.api.runtime.model.impl`).

### Application

The query service's `GET /v1/applications` returns `ApplicationEntity` implementing `CloudApplication`: `id`, `name`, `version`, plus the service-attribution fields.

## Related

- [Cloud API Reference](./overview.md) — envelope, errors, authentication, module map
- [Runtime Bundle Service](../services/runtime-bundle.md)
- [Query Service](../services/query.md)
- [Connector & Message Payloads](./connector-and-message-payloads.md)
- [Deploying Processes at Runtime](../extension/deploying-processes.md)
- [Activiti Engine Documentation](../../activiti/index.md)
