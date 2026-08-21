---
sidebar_position: 1
sidebar_label: "API Reference"
slug: /cloud/api-reference/overview
title: "Cloud API Reference"
description: "Reference for the Activiti Cloud wire contracts: REST base paths and roles per service, the JSON/HAL response envelope, error format, authentication, and where the payload model classes live."
---

# Cloud API Reference

This section documents the **payloads** that cross the Activiti Cloud API boundary: the JSON request bodies and response models of the REST services, and the message payloads that travel on the broker between runtime bundles, connectors, and the messages service. It is a reference — class names, fields, types, and JSON shapes — not a tutorial.

The per-service pages document the **endpoints** (methods, paths, query parameters, semantics) and own that documentation:

- [Runtime Bundle Service](../services/runtime-bundle.md) — the write side
- [Query Service](../services/query.md) — the read side
- [Audit Service](../services/audit.md) — the event log
- [Identity Adapter Service](../services/identity-adapter.md) — identity administration
- [Messages Service](../services/messages.md) — broker-only message routing
- [Notifications GraphQL Service](../services/notifications-graphql.md) — GraphQL queries and subscriptions

This section's two detail pages:

- [Process & Task Payloads](./process-and-task-payloads.md) — the runtime bundle's REST request payloads and the response models of the runtime bundle and query services
- [Connector & Message Payloads](./connector-and-message-payloads.md) — the integration wire contracts (`IntegrationRequest`, `IntegrationResult`, `IntegrationError`) and the inbound `MessageEventPayload`

## API surface orientation

| Service | Base path(s) | Role | Endpoint documentation |
|---------|--------------|------|------------------------|
| Runtime Bundle | `/rb/v1` (user), `/rb/admin/v1` (admin) | Write side: starts and steers instances, works on tasks, replays service tasks | [Runtime Bundle Service](../services/runtime-bundle.md) |
| Query | `/query/v1` (user), `/query/admin/v1` (admin) | Read side: projected process data, inboxes, search, diagrams | [Query Service](../services/query.md) |
| Audit | `/audit/v1` (user), `/audit/admin/v1` (admin) | Event log: immutable record of every runtime event, export, purge | [Audit Service](../services/audit.md) |
| Identity Adapter | `/identity-adapter-service/v1` | Identity admin: user and group lookup, application permissions | [Identity Adapter Service](../services/identity-adapter.md) |
| Notifications GraphQL | `/notifications/graphql` (REST query), `/notifications/v2/ws/graphql` (WebSocket subscriptions) | Read side: GraphQL queries and event subscriptions | [Notifications GraphQL Service](../services/notifications-graphql.md) |
| Messages | no REST API | Broker-only: correlates `messageEvents` and emits `commandConsumer` commands | [Messages Service](../services/messages.md) |

The paths in the table are as reached **through the deployed gateway** (gateway routing is documented in [Deployment Reference — API Routes](../deployment/reference.md#api-routes)). Directly against a service container, the runtime bundle, query, and audit services serve the same APIs from their own root: `/v1/...` and `/admin/v1/...`; the identity adapter from `${activiti.cloud.services.identity.url:/v1}` (default `/v1`); the notifications service from `/graphql` and `/v2/ws/graphql`.

The runtime bundle, query, audit, and identity adapter services share the same URL-authorization model: `/v1/*` is authorized for the `ACTIVITI_USER` role and `/admin/*` for the `ACTIVITI_ADMIN` role through the `authorizations.security-constraints` property (see [Identity & Security — Authorization](../architecture/identity.md#authorization)). The notifications-graphql service has no `/v1` / `/admin/v1` surface: its `/graphql` endpoint is gated by role (default `ACTIVITI_ADMIN`) and its WebSocket endpoint by the authorities configured for it (default `ACTIVITI_USER,ACTIVITI_ADMIN`).

## Wire format

### Media types

The REST services are HATEOAS-based. The controllers declare what they produce:

- The **runtime bundle** controllers declare `consumes = application/json` on their write endpoints; most controllers additionally declare `produces = { application/hal+json, application/json }` at class level (the admin task, process-instance, variable, and definition controllers, the meta, service-task, candidate, and connector-definition controllers, and `TaskController`, `TaskVariableController`, `ProcessInstanceTasksController`), while `ProcessInstanceVariableController` relies on the default content negotiation. Both paths end in the same converter, below.
- The **query service** controllers declare `produces = { application/hal+json, application/json }` (for example `ApplicationController` on `/v1/applications`, `ProcessInstanceController`, `TaskController`, and the `/admin/v1` counterparts); the exceptions are the process-instance diagram endpoint, which produces `image/svg+xml`, and the process model endpoint, which produces `application/xml`.
- The **audit service** controllers (`AuditEventsController` on `/v1/events`, `AuditEventsAdminController` on `/admin/v1/events`) declare the same `produces` pair.
- The **identity adapter** produces `application/json` only.

### The `application/json` envelope

When you accept `application/json` (the default for plain JSON clients), every response body is rendered by `AlfrescoJackson2HttpMessageConverter` (module `activiti-cloud-services-dbp-rest`, auto-configured into the runtime bundle, query, and audit REST layers) into the Alfresco-style envelope:

| Shape | JSON | Source class |
|-------|------|--------------|
| Single resource | `{ "entry": { ...entity fields... } }` | `EntryResponseContent<T>` (wraps the `EntityModel` content) |
| Paged collection | `{ "list": { "entries": [ { "entry": { ... } }, ... ], "pagination": { ... } } }` | `ListResponseContent<T>` wrapping `EntriesResponseContent<T>` |
| Unpaged collection | `{ "list": { "entries": [ { "entry": { ... } }, ... ] } }` | same, with `pagination` absent |

Pagination fields (`PaginationMetadata`):

| Field | Type | Meaning |
|-------|------|---------|
| `skipCount` | `long` | Number of items skipped. |
| `maxItems` | `long` | Page size. |
| `count` | `long` | Entries in this page. |
| `hasMoreItems` | `boolean` | Whether another page follows. |
| `totalItems` | `long` | Total matching items. |

### The `application/hal+json` form

When you accept `application/hal+json`, the standard Spring HATEOAS serializer returns the `EntityModel` / `PagedModel` representation with `_links` (and `_embedded` for collections) instead of the `entry` / `list` envelope. The runtime bundle registers the link relations through `RuntimeBundleLinkRelationProvider` (`org.activiti.cloud.services.rest.controllers`):

| Type | Item relation | Collection relation |
|------|---------------|---------------------|
| `CloudProcessDefinitionImpl` | `processDefinition` | `processDefinitions` |
| `CloudProcessInstanceImpl` | `processInstance` | `processInstances` |
| `CloudTaskImpl` | `task` | `tasks` |
| `CloudVariableInstanceImpl` | `variable` | `variables` |

The assemblers add typed links on top of those relations: process instances carry `self`, `variables`, `processInstances`, and `home`; tasks carry `self`, `claim` (or `release`/`complete` when assigned), `processInstance` (when process-bound), `parent` (when a subtask), and `home`; query-service process instances carry `self`, `tasks`, and `variables`. See [Process & Task Payloads — Response models](./process-and-task-payloads.md#response-models) for the entity fields those links wrap.

### Error format

All three REST services return errors as `ActivitiErrorMessage` (`org.activiti.api.model.shared.model`, implementation `ActivitiErrorMessageImpl`) with exactly two fields:

| Field | Type | Meaning |
|-------|------|---------|
| `code` | `int` | The HTTP status code the service is answering with. |
| `message` | `String` | Exception message. |

Under `Accept: application/json` the body is the standard envelope around it:

```json
{
  "entry": {
    "code": 404,
    "message": "Process instance not found: a1b2c3d4"
  }
}
```

Which exceptions map to which status, per service:

| Exception | Runtime bundle (`RuntimeBundleExceptionHandler`) | Query (`CommonExceptionHandlerQuery`) | Audit and common (`CommonExceptionHandler`) |
|-----------|---------------------------------------------------|----------------------------------------|----------------------------------------------|
| `ActivitiForbiddenException` | 403 | 403 | 403 |
| `NotFoundException`, `ActivitiObjectNotFoundException` | 404 | 404 (also `EntityNotFoundException`) | 404 (`NotFoundException`) |
| `IllegalStateException` | 400 | 400 | 400 |
| `ActivitiException` | 400 | — | — |
| `ActivitiIllegalArgumentException` | 409 | — | — |
| `UnprocessableEntityException` | 422 | — | — |
| `ConversionFailedException` | — | 400 (sanitized message, detail not disclosed) | — |
| `ActivitiInterchangeInfoNotFoundException` | 204 | — | — |

### Authentication

Every REST call carries an OAuth2 **Bearer** token (JWT) in the `Authorization` header; the JWT's user id, groups, and roles drive both the URL authorization above and, inside the runtime bundle, the engine's security-policy filtering of which definitions, instances, and tasks the user can see (see [Identity & Security](../architecture/identity.md)). There are no request headers of their own to set beyond `Authorization`, `Accept`, and `Content-Type: application/json` on writes.

## Where the payload classes live

The wire payloads come from two Maven reactors. The **Activiti Cloud API** reactor (`activiti-cloud-api`) holds the cloud-specific model; the **engine API** reactor (`activiti-api` in the [Activiti engine](../../activiti/index.md) repository) holds the generic payloads and the runtime-event base classes that the cloud model extends.

### `activiti-cloud-api` modules

| Maven module | Package | Contents |
|--------------|---------|----------|
| `activiti-cloud-api-model-shared` | `org.activiti.cloud.api.model.shared` | `CloudRuntimeEntity` (the service-attribution base), `CloudVariableInstance`, `QueryCloudVariableInstance` |
| | `org.activiti.cloud.api.model.shared.events` | `CloudRuntimeEvent` and the variable event interfaces |
| | `org.activiti.cloud.api.model.shared.messages` | `CloudRuntimeEventsMessageHeaders`, `IntegrationContextMessageHeaders` (header-name constants) |
| `activiti-cloud-api-model-shared-impl` | `org.activiti.cloud.api.model.shared.impl` | `CloudRuntimeEntityImpl`, `CloudVariableInstanceImpl`, `CloudRuntimeEventImpl`, ... |
| `activiti-cloud-api-process-model` | `org.activiti.cloud.api.process.model` | `CloudProcessInstance`, `CloudProcessDefinition`, `ExtendedCloudProcessDefinition`, `QueryCloudProcessInstance`, `QueryCloudSubprocessInstance`, `CloudApplication`, `CloudServiceTask`, `CloudBPMNActivity`, `CloudIntegrationContext`, `IncidentContext`, `IncidentEvent`, `IntegrationRequest`, `IntegrationResult`, `IntegrationError`, `CloudBpmnError`, `CloudStartMessageDeploymentDefinition` |
| | `org.activiti.cloud.api.process.model.events` | The `Cloud*Event` process/activity/timer/message/signal/integration event interfaces |
| `activiti-cloud-api-process-model-impl` | `org.activiti.cloud.api.process.model.impl` | `CloudProcessInstanceImpl`, `CloudProcessDefinitionImpl`, `IntegrationRequestImpl`, `IntegrationResultImpl`, `IntegrationErrorImpl`, `SyncCloudProcessDefinitionsPayload`, `SyncCloudProcessDefinitionsResult`, `CandidateUser`, `CandidateGroup`, ... |
| | `org.activiti.cloud.api.process.model.impl.events` | `Cloud*EventImpl` classes and their JSON serializers |
| `activiti-cloud-api-task-model` | `org.activiti.cloud.api.task.model` | `CloudTask`, `QueryCloudTask`, the `Cloud*TaskEvent` interfaces |
| `activiti-cloud-api-task-model-impl` | `org.activiti.cloud.api.task.model.impl` | `CloudTaskImpl`, `QueryCloudTaskImpl`, task event impls |
| `activiti-cloud-api-events` | `org.activiti.cloud.api.events` | `CloudRuntimeEventType` — the enum of event type names on the wire |
| `activiti-cloud-api-dependencies` | — | BOM only |

The `-impl` modules pair with each API module and are what gets serialized (the JSON field list of a payload is the field list of its `*Impl` class).

### Engine-side classes that appear on the wire

The cloud model extends engine API interfaces, and several engine classes are themselves wire payloads:

| Package | Comes from (engine repo) | Used for |
|---------|--------------------------|----------|
| `org.activiti.api.process.model.payloads` | `activiti-api/activiti-api-process-model` | All runtime bundle REST **request** bodies (`StartProcessPayload`, `CompleteTaskPayload`, ...) — see [Process & Task Payloads](./process-and-task-payloads.md) |
| `org.activiti.api.task.model.payloads` | `activiti-api/activiti-api-task-model` | Task REST request bodies |
| `org.activiti.api.process.model` | `activiti-api/activiti-api-process-model` | `ProcessInstance`, `ProcessDefinition`, `Task`-parent interfaces, `IntegrationContext`, `VariableDefinition` |
| `org.activiti.api.task.model` | `activiti-api/activiti-api-task-model` | `Task` interface and `TaskStatus` |
| `org.activiti.api.model.shared` | `activiti-api/activiti-api-model-shared` | `Payload` (the `getId()` marker all request payloads implement), `Result`, `ActivitiErrorMessage` |
| `org.activiti.api.model.shared.event` | `activiti-api/activiti-api-model-shared` | `RuntimeEvent` — the base of `CloudRuntimeEvent` |
| `org.activiti.api.runtime.model.impl` | `activiti-core/activiti-api-impl/activiti-api-process-model-impl` (`ActivitiErrorMessageImpl` lives in `activiti-api-model-shared-impl`) | `IntegrationContextImpl` (the serialized integration context), `ActivitiErrorMessageImpl`, `ProcessDefinitionMetaImpl` |

So an `IntegrationRequest` on the broker is a `org.activiti.cloud.api.process.model.impl.IntegrationRequestImpl` wrapping an `org.activiti.api.runtime.model.impl.IntegrationContextImpl` — one class from each reactor.

## Which payload do I need?

| You want to... | See |
|----------------|-----|
| Build a REST request body for the runtime bundle (start instance, complete task, set variables, ...) | [Process & Task Payloads](./process-and-task-payloads.md) |
| Read the response fields of `GET /rb/v1/process-instances/{id}`, `/rb/v1/tasks/{id}`, or the query service's equivalents | [Process & Task Payloads — Response models](./process-and-task-payloads.md#response-models) |
| Build or consume a connector message (`IntegrationRequest`, `IntegrationResult`, `IntegrationError`) | [Connector & Message Payloads](./connector-and-message-payloads.md) |
| Publish an inbound message event to the `messageEvents` destination | [Connector & Message Payloads — Inbound: MessageEventPayload](./connector-and-message-payloads.md#inbound-messageeventpayload) |
| Consume the `engineEvents` stream (query, audit, or your own service) | [Event-Driven Design](../architecture/event-driven.md) (event types, headers, ordering) and [Connector & Message Payloads — The runtime event model](./connector-and-message-payloads.md#the-runtime-event-model) |
| Sync process definitions to the read models after a runtime deployment | [Deploying Processes at Runtime](../extension/deploying-processes.md) (uses `SyncCloudProcessDefinitionsPayload`, documented in [Process & Task Payloads](./process-and-task-payloads.md#process-definition-sync-payloads)) |

## Related

- [Architecture Overview](../architecture/overview.md)
- [Event-Driven Design](../architecture/event-driven.md)
- [Identity & Security](../architecture/identity.md)
- [Deploying Processes at Runtime](../extension/deploying-processes.md)
- [Building a Custom Connector App](../extension/custom-connectors.md)
