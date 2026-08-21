---
sidebar_position: 3
sidebar_label: "Connector & Message Payloads"
slug: /cloud/api-reference/connector-and-message-payloads
title: "Connector & Message Payloads"
description: "Reference for the Activiti Cloud integration wire contracts: IntegrationRequest, IntegrationResult, IntegrationError and their builders, the inbound MessageEventPayload with its header contract, and the CloudRuntimeEvent shape on the broker."
---

# Connector & Message Payloads

This page references the payloads that travel on the message broker between the [runtime bundle](../services/runtime-bundle.md), [connector applications](../extension/custom-connectors.md), and the [messages service](../services/messages.md):

- **Outbound** — a service task publishes an `IntegrationRequest`; the connector replies with an `IntegrationResult` (success) or `IntegrationError` (failure).
- **Inbound** — a connector (or any external publisher) sends a `MessageEventPayload` to the `messageEvents` destination to start or resume a process.
- **Runtime events** — every engine action is published as a `CloudRuntimeEvent` on `engineEvents`.

The message *flow*, destinations, and configuration are documented elsewhere: [Connectors Overview](../connectors/overview.md), [Outbound Connectors](../connectors/outbound.md), [Inbound Connectors](../connectors/inbound.md), [Event-Driven Design](../architecture/event-driven.md). This page is the field-by-field contract.

All payloads serialize with plain Jackson defaults — the classes carry **no** `@JsonProperty` / `@JsonInclude` annotations, so the JSON field names are exactly the camelCase property names of the `*Impl` classes listed below. One exception: `IntegrationContextImpl`'s `hasEphemeralVariables()` carries `@JsonProperty("ephemeralVariables")`, so the context serializes an `ephemeralVariables` field (documented below). `null` fields are included in the JSON (there is no inclusion filtering).

## Outbound: the integration request/response contract

### `IntegrationRequest`

Interface: `org.activiti.cloud.api.process.model.IntegrationRequest`; serialized class: `org.activiti.cloud.api.process.model.impl.IntegrationRequestImpl` (both in `activiti-cloud-api-process-model` / `-impl`). Published by the runtime bundle **after the engine transaction commits** on the destination named by the service task `implementation` attribute (the connector type). A connector consumes it through its `@ConnectorBinding` function (see [Outbound Connectors](../connectors/outbound.md)).

Top-level fields (own + inherited from `CloudRuntimeEntityImpl`), as built by the bundle's `IntegrationRequestBuilder`:

| Field | Type | Set by | Meaning |
|-------|------|--------|---------|
| `integrationContext` | `IntegrationContext` (below) | runtime bundle | The full context of the waiting execution. |
| `resultDestination` | `String` | runtime bundle | Destination the connector must publish its `IntegrationResult` to (from the bundle's `integrationResultsConsumer` binding; default `integrationResult`). |
| `errorDestination` | `String` | runtime bundle | Destination for the `IntegrationError` (from `integrationErrorsConsumer`; default `integrationError`). |
| `appName` | `String` | runtime bundle | The bundle's `activiti.cloud.application.name`. |
| `appVersion` | `String` | runtime bundle | Copied from `integrationContext.appVersion` by the `IntegrationRequestImpl` constructor — not stamped from a bundle property. |
| `serviceName` | `String` | runtime bundle | `spring.application.name` of the bundle. |
| `serviceFullName` | `String` | runtime bundle | Always equal to `serviceName`. |
| `serviceType` | `String` | runtime bundle | `activiti.cloud.service.type` (empty by default; supplied by the deployment). |
| `serviceVersion` | `String` | runtime bundle | `activiti.cloud.service.version` (empty by default). |

There is **no `actionName` field**. What a connector needs to know *which action* was requested is carried by these `integrationContext` fields:

`integrationContext` (`org.activiti.api.process.model.IntegrationContext`, serialized class `org.activiti.api.runtime.model.impl.IntegrationContextImpl` from the engine API):

| Field | Type | Meaning |
|-------|------|---------|
| `id` | `String` | Integration context id (UUID); also sent as the `integrationContextId` header. |
| `processInstanceId` | `String` | Waiting instance. |
| `rootProcessInstanceId` | `String` | The root instance of the hierarchy (equals `processInstanceId` for top-level instances). |
| `parentProcessInstanceId` | `String` | Parent instance for subprocesses. |
| `executionId` | `String` | Engine execution suspended at the service task. |
| `processDefinitionId` | `String` | `key:version:uuid` of the definition. |
| `processDefinitionKey` | `String` | Definition key. |
| `processDefinitionVersion` | `Integer` | Definition version. |
| `businessKey` | `String` | Business key of the instance. |
| `connectorType` | `String` | The service task `implementation` string — the broker destination and the `connectorType` header the binding filters on. This is the "action" identifier. |
| `clientName` | `String` | The service task `name` attribute, expression-evaluated against the execution. |
| `clientId` | `String` | The service task flow-node id. |
| `clientType` | `String` | Always `ServiceTask`. |
| `appVersion` | `String` | Application version of the instance (`"1"` when unset). |
| `inBoundVariables` | `Map<String, Object>` | The input variables selected by the process-extensions mapping (see [Outbound Connectors — payload mapping](../connectors/outbound.md#requestresponse-payload-mapping)). |
| `outBoundVariables` | `Map<String, Object>` | Empty on the wire in the request; the result fills it. |
| `ephemeralVariables` | `Boolean` | Set by the engine's `IntegrationContextBuilder` from the process-extensions mapping; serialized via `@JsonProperty` on `hasEphemeralVariables()`. |

Message headers set on the `IntegrationRequest` message (constants in `IntegrationContextMessageHeaders`, applied by `IntegrationContextMessageBuilderAppender` in the runtime bundle connectors module):

| Header | Source field |
|--------|--------------|
| `connectorType` | `integrationContext.connectorType` |
| `businessKey` | `integrationContext.businessKey` |
| `integrationContextId` | `integrationContext.id` |
| `processInstanceId` | `integrationContext.processInstanceId` |
| `parentProcessInstanceId` | `integrationContext.parentProcessInstanceId` |
| `rootProcessInstanceId` | `integrationContext.rootProcessInstanceId` |
| `processDefinitionId` | `integrationContext.processDefinitionId` |
| `processDefinitionKey` | `integrationContext.processDefinitionKey` |
| `processDefinitionVersion` | `integrationContext.processDefinitionVersion` |
| `executionId` | `integrationContext.executionId` |
| `appVersion` | `integrationContext.appVersion` |
| `spring.cloud.function.destination` | The resolved destination (function-router routing) |

### `IntegrationResult`

Interface: `org.activiti.cloud.api.process.model.IntegrationResult`; serialized class: `org.activiti.cloud.api.process.model.impl.IntegrationResultImpl`. Published by the connector to the request's `resultDestination`. The runtime bundle maps the `outBoundVariables` into process variables (per the extensions mapping) and triggers the waiting execution.

| Field | Type | Meaning |
|-------|------|---------|
| `integrationRequest` | `IntegrationRequest` | The original request, echoed back. |
| `integrationContext` | `IntegrationContext` | The request's context, with `outBoundVariables` populated. |
| `appName`, `appVersion`, `serviceName`, `serviceFullName`, `serviceType`, `serviceVersion` | `String` | The **connector's** identity (stamped from its `ConnectorProperties`), so the bundle and audit trail can attribute the reply. |

Built with `org.activiti.cloud.connectors.starter.model.IntegrationResultBuilder` (module `activiti-cloud-starter-connector`) — the same usage as the worked example in [Building a Custom Connector App](../extension/custom-connectors.md):

```java
import java.util.Map;
import org.activiti.cloud.api.process.model.IntegrationRequest;
import org.activiti.cloud.api.process.model.IntegrationResult;
import org.activiti.cloud.connectors.starter.configuration.ConnectorProperties;
import org.activiti.cloud.connectors.starter.model.IntegrationResultBuilder;
import org.springframework.messaging.Message;

// inside the connector function, for each consumed IntegrationRequest:
Message<IntegrationResult> message = IntegrationResultBuilder
    .resultFor(request, connectorProperties)          // reuses the request's IntegrationContext
    .withOutboundVariables(Map.of("paymentId", "PAY-555"))
    .buildMessage();                                   // adds targetAppName / targetService headers
integrationResultSender.send(message);                 // resolves the destination and publishes
```

Builder methods:

| Method | Signature | Effect |
|--------|-----------|--------|
| `resultFor` | `static IntegrationResultBuilder resultFor(IntegrationRequest, ConnectorProperties)` | Entry point; copies the request's `IntegrationContext` and stamps the connector identity from the properties. |
| `withOutboundVariables` | `IntegrationResultBuilder withOutboundVariables(Map<String, Object>)` | Adds the result variables to the context's `outBoundVariables`. |
| `build` | `IntegrationResult build()` | Returns the payload only (no headers). |
| `buildMessage` | `Message<IntegrationResult> buildMessage()` | Payload + headers `targetAppName` (= the request's `appName`) and `targetService` (= the request's `serviceFullName`). |

### `IntegrationError`

Interface: `org.activiti.cloud.api.process.model.IntegrationError`; serialized class: `org.activiti.cloud.api.process.model.impl.IntegrationErrorImpl`. Published by the connector (or by the starter's default error handler when the connector function throws) to the request's `errorDestination`.

| Field | Type | Meaning |
|-------|------|---------|
| `integrationRequest` | `IntegrationRequest` | The original request, echoed back. |
| `integrationContext` | `IntegrationContext` | The request's context. |
| `errorCode` | `String` | The `errorCode` of the cause when it is a `CloudBpmnError`, else `null`. |
| `errorMessage` | `String` | Message of the **root cause** of the thrown `Throwable`. |
| `errorClassName` | `String` | Fully qualified class name of the thrown `Throwable` (not the root cause). |
| `stackTraceElements` | `List<StackTraceElement>` | Stack trace of the root cause. |
| `appVersion`, `serviceName`, `serviceFullName`, `serviceType`, `serviceVersion` | `String` | The connector's identity (stamped from its `ConnectorProperties` by `IntegrationErrorBuilder`). |
| `appName` | `String` | Serialized as `null`: unlike the result, neither the builder nor `IntegrationErrorImpl` sets it (the request's `appName` is not copied). Route attribution uses the `targetAppName` header instead. |

Built with `org.activiti.cloud.connectors.starter.model.IntegrationErrorBuilder`:

```java
import org.activiti.cloud.api.process.model.CloudBpmnError;
import org.activiti.cloud.api.process.model.IntegrationError;
import org.activiti.cloud.api.process.model.IntegrationRequest;
import org.activiti.cloud.connectors.starter.configuration.ConnectorProperties;
import org.activiti.cloud.connectors.starter.model.IntegrationErrorBuilder;
import org.springframework.messaging.Message;

Message<IntegrationError> message = IntegrationErrorBuilder
    .errorFor(request, connectorProperties,
              new CloudBpmnError("PAYMENT_DECLINED", "Gateway rejected the payment"))
    .buildMessage();                                    // adds content-type + targetAppName / targetService
integrationErrorSender.send(message);
```

Builder methods:

| Method | Signature | Effect |
|--------|-----------|--------|
| `errorFor` | `static IntegrationErrorBuilder errorFor(IntegrationRequest, ConnectorProperties, Throwable)` | Entry point; wraps any `Throwable`. |
| `build` | `IntegrationError build()` | Returns the payload; requires both request and error to be non-null. |
| `buildMessage` | `Message<IntegrationError> buildMessage()` | Payload + headers `Content-Type: application/json`, `targetAppName`, `targetService`. |

When the error cause is a `CloudBpmnError` (`org.activiti.cloud.api.process.model.CloudBpmnError`, a `RuntimeException` carrying an `errorCode` — constructors `(errorCode)`, `(errorCode, message)`, `(errorCode, cause)`, `(errorCode, message, cause)`), the runtime bundle propagates a **BPMN error** on the waiting execution, so a boundary error event with the matching `errorCode` fires. Any other error class leaves the execution waiting and the bundle logs a warning. See [Outbound Connectors — Error handling](../connectors/outbound.md#error-handling).

### Where replies go

Destination resolution (override → `resultDestination`/`errorDestination` from the request → `integrationResult[_error] + separator + serviceFullName` fallback) is implemented in the connector starter and documented in [Building a Custom Connector App — What the starter wires](../extension/custom-connectors.md#3-what-the-starter-wires).

## Inbound: `MessageEventPayload`

`org.activiti.api.process.model.payloads.MessageEventPayload` (engine API module `activiti-api-process-model`). The payload a manual publisher sends to the `messageEvents` destination to start a process (message start event) or resume a waiting instance (message catch event). The [messages service](../services/messages.md) correlates it with the subscription events the runtime bundle publishes and emits a `StartMessagePayload` or `ReceiveMessagePayload` command to the bundle's `commandConsumer` — see [Inbound Connectors](../connectors/inbound.md) for the correlation model.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `name` | `String` | yes | The BPMN `<message>` name to match. |
| `correlationKey` | `String` | for catch events | Must equal the waiting instance's correlation key; `null` for message starts. |
| `businessKey` | `String` | optional | Business key for the started instance. |
| `variables` | `Map<String, Object>` | optional | Variables delivered with the message. |

The no-arg constructor generates the `id` (UUID) automatically; the four-argument constructor is `MessageEventPayload(String name, String correlationKey, String businessKey, Map<String, Object> variables)`.

### The full header contract

Correlation and routing live in the **headers**, not the payload. The constants are `MessageEventHeaders` in both the messages service core (`org.activiti.cloud.services.messages.core.integration`) and the runtime bundle's messages-events module; a manual publisher must set at least the first group itself (the runtime bundles add the attribution headers automatically through their producers):

| Header | Required | Meaning |
|--------|----------|---------|
| `messageEventType` | yes — the messages service discards messages without it | `MESSAGE_SENT` from a connector; the bundle emits `START_MESSAGE_DEPLOYED` and `MESSAGE_WAITING` for the subscription side. |
| `messageEventName` | yes | The BPMN message name; part of the correlation id `appName:messageEventName[:messageEventCorrelationKey]`. |
| `appName` | yes | The `activiti.cloud.application.name` of the runtime bundle that owns the process; first part of the correlation id. |
| `messageEventCorrelationKey` | for catch events | Appended to the correlation id when present. |
| `messageEventId` | yes (for dedup) | Unique event id; the idempotent receiver interceptor discards duplicates keyed on it — derive it from the external event identity. |
| `messageEventBusinessKey` | recommended | The payload's business key, mirrored for routing. |
| `appVersion` | optional | Application version attribution. |
| `serviceName`, `serviceFullName`, `serviceType`, `serviceVersion` | optional | Service attribution (the bundle's own producers set these). |
| `messageEventOutputDestination` | set by the bundle, not by connectors | The destination of the *owning* bundle's `commandConsumer` binding; used to route the resulting command back. |
| `messagePayloadType` | optional | Payload type discriminator. |

The worked example in [Inbound Connectors — Publishing a message event](../connectors/inbound.md#publishing-a-message-event) sets these headers on a `MessageEventPayload` and sends it through a `messageEventsOutput` binding.

## The runtime event model

`CloudRuntimeEvent` (`org.activiti.cloud.api.model.shared.events.CloudRuntimeEvent`, serialized as `CloudRuntimeEventImpl`) is the JSON object every `engineEvents` message carries (an array of them, aggregated per engine transaction). Field list (own + inherited from the engine `RuntimeEvent` base):

| Field | Type | Meaning |
|-------|------|---------|
| `id` | `String` | Event id (UUID). |
| `timestamp` | `long` | Event time, epoch millis. |
| `eventType` | `String` | One of the `CloudRuntimeEventType` enum values (`org.activiti.cloud.api.events`). |
| `entity` | object | The entity payload: `CloudProcessInstance`, `CloudTask`, `CloudBPMNActivity`, `CloudVariableInstance`, ... |
| `entityId` | `String` | Id of the entity the event is about. |
| `actor` | `String` | User who caused the action; `service_user` for unauthenticated engine actions. |
| `messageId` | `String` | `null` on the wire — the engine never sets it. The audit consumer assigns the broker message id at consume time. |
| `sequenceNumber` | `Integer` | `null` on the wire — the audit consumer assigns the event's position within the consumed batch. |
| `processInstanceId` | `String` | Affected process instance. |
| `parentProcessInstanceId` | `String` | Parent instance for subprocesses. |
| `processDefinitionId` | `String` | Definition id. |
| `processDefinitionKey` | `String` | Definition key. |
| `processDefinitionVersion` | `Integer` | Definition version. |
| `businessKey` | `String` | Business key. |
| `appName`, `appVersion`, `serviceName`, `serviceFullName`, `serviceType`, `serviceVersion` | `String` | The producing runtime bundle's identity. |

The event type list, the `engineEvents` message headers (`eventType`, `messagePayloadType`, the `root*` coordinates, `deploymentId`, `routingKey`, ...), per-transaction aggregation and chunking, destination naming, partitioning and ordering, and delivery semantics are owned by [Event-Driven Design](../architecture/event-driven.md) — that page is the reference for anything about the stream itself. The [audit service](../services/audit.md) persists these events verbatim and returns them through its REST API.

## JSON on the broker

`IntegrationRequest` as published by the runtime bundle (field names are the serialized property names; no Jackson annotations):

```json
{
  "integrationContext": {
    "id": "3f2b7c1e-9d4a-4c5b-8e6f-1a2b3c4d5e6f",
    "processInstanceId": "a1b2c3d4-0000-4000-8000-000000000001",
    "rootProcessInstanceId": "a1b2c3d4-0000-4000-8000-000000000001",
    "parentProcessInstanceId": null,
    "executionId": "a1b2c3d4-0000-4000-8000-000000000007",
    "processDefinitionId": "orderProcess:2:6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
    "processDefinitionKey": "orderProcess",
    "processDefinitionVersion": 2,
    "businessKey": "ORDER-2026-0007",
    "clientId": "processPaymentTask",
    "clientName": "Process payment",
    "clientType": "ServiceTask",
    "connectorType": "payments.processPayment",
    "appVersion": "1",
    "inBoundVariables": {
      "orderId": "ORDER-2026-0007",
      "amount": 199.9,
      "currency": "EUR"
    },
    "outBoundVariables": {}
  },
  "resultDestination": "integrationResult",
  "errorDestination": "integrationError",
  "appName": "default-app",
  "appVersion": "1",
  "serviceName": "order-bundle",
  "serviceFullName": "order-bundle",
  "serviceType": "runtime-bundle",
  "serviceVersion": "1.0.0"
}
```

`IntegrationResult` as published by the connector back to `integrationResult`. Note that the builder reuses the request's `IntegrationContext` object, so `withOutboundVariables` mutates it in place — the context is serialized **twice** (top level and inside `integrationRequest`) with the filled `outBoundVariables` in both places:

```json
{
  "integrationRequest": {
    "integrationContext": {
      "id": "3f2b7c1e-9d4a-4c5b-8e6f-1a2b3c4d5e6f",
      "processInstanceId": "a1b2c3d4-0000-4000-8000-000000000001",
      "rootProcessInstanceId": "a1b2c3d4-0000-4000-8000-000000000001",
      "parentProcessInstanceId": null,
      "executionId": "a1b2c3d4-0000-4000-8000-000000000007",
      "processDefinitionId": "orderProcess:2:6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
      "processDefinitionKey": "orderProcess",
      "processDefinitionVersion": 2,
      "businessKey": "ORDER-2026-0007",
      "clientId": "processPaymentTask",
      "clientName": "Process payment",
      "clientType": "ServiceTask",
      "connectorType": "payments.processPayment",
      "appVersion": "1",
      "inBoundVariables": {
        "orderId": "ORDER-2026-0007",
        "amount": 199.9,
        "currency": "EUR"
      },
      "outBoundVariables": {
        "paymentId": "PAY-555",
        "status": "APPROVED"
      }
    },
    "resultDestination": "integrationResult",
    "errorDestination": "integrationError",
    "appName": "default-app",
    "appVersion": "1",
    "serviceName": "order-bundle",
    "serviceFullName": "order-bundle",
    "serviceType": "runtime-bundle",
    "serviceVersion": "1.0.0"
  },
  "integrationContext": {
    "id": "3f2b7c1e-9d4a-4c5b-8e6f-1a2b3c4d5e6f",
    "processInstanceId": "a1b2c3d4-0000-4000-8000-000000000001",
    "rootProcessInstanceId": "a1b2c3d4-0000-4000-8000-000000000001",
    "parentProcessInstanceId": null,
    "executionId": "a1b2c3d4-0000-4000-8000-000000000007",
    "processDefinitionId": "orderProcess:2:6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
    "processDefinitionKey": "orderProcess",
    "processDefinitionVersion": 2,
    "businessKey": "ORDER-2026-0007",
    "clientId": "processPaymentTask",
    "clientName": "Process payment",
    "clientType": "ServiceTask",
    "connectorType": "payments.processPayment",
    "appVersion": "1",
    "inBoundVariables": {
      "orderId": "ORDER-2026-0007",
      "amount": 199.9,
      "currency": "EUR"
    },
    "outBoundVariables": {
      "paymentId": "PAY-555",
      "status": "APPROVED"
    }
  },
  "appName": "default-app",
  "appVersion": "1",
  "serviceName": "payment-connector",
  "serviceFullName": "payment-connector",
  "serviceType": "connector",
  "serviceVersion": "1.0.0"
}
```

The message headers of the result carry `targetAppName` (`default-app`) and `targetService` (`order-bundle`) so the function router and the bundle's consumer can attribute the reply (see [Building a Custom Connector App](../extension/custom-connectors.md)).

## Related

- [Cloud API Reference](./overview.md)
- [Process & Task Payloads](./process-and-task-payloads.md)
- [Connectors Overview](../connectors/overview.md)
- [Outbound Connectors](../connectors/outbound.md)
- [Inbound Connectors](../connectors/inbound.md)
- [Building a Custom Connector App](../extension/custom-connectors.md)
- [Messages Service](../services/messages.md)
- [Event-Driven Design](../architecture/event-driven.md)
