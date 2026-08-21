---
sidebar_position: 4
sidebar_label: "Connector API Reference"
slug: /cloud/connectors/api-reference
title: "Connector API Reference"
description: "Lookup reference for the connector programming API: ConsumerConnector and Connector functions, @ConnectorBinding attributes, IntegrationRequest, the result and error builders, senders, destinations, retries, and in-bundle connectors."
---

# Connector API Reference

**Modules:** `activiti-cloud-starter-connector` (payload model, builders, senders) and `activiti-cloud-service-messaging-config` (the functional binding API, package `org.activiti.cloud.common.messaging.functional`) — Activiti Cloud 9.0.0, Spring Boot 3.5.7

This page is the API reference for the connector programming surface: the functional interfaces a connector bean implements, the `@ConnectorBinding` annotation, the `IntegrationRequest` payload and its headers, the result/error builders and senders, destination resolution, the error path, and the retry properties. It is a lookup, not a tutorial — the [Connectors Overview](overview.md), [Inbound Connectors](inbound.md), [Outbound Connectors](outbound.md), and [Building a Custom Connector App](../extension/custom-connectors.md) pages contain the working examples this reference points to.

## Connector functions

A connector function is a Spring bean that implements one of two functional interfaces from `org.activiti.cloud.common.messaging.functional` and is marked with `@ConnectorBinding` (class- or method-level). The starter's `ConnectorConfiguration` bean post-processor picks up any bean that is an instance of either interface and wires the filter pipeline around it.

| Interface | Extends | Contract | Reply model |
|-----------|---------|----------|-------------|
| `ConsumerConnector<T>` | `java.util.function.Consumer<T>` | `void accept(T t)` | Fire-and-forget: your code publishes the reply itself, through `IntegrationResultSender` / `IntegrationErrorSender` |
| `Connector<T, R>` | `java.util.function.Function<T, R>` | `R apply(T t)` | Returning: a non-null return value is published by the framework to the destination named in the message header given by `outputHeader` (default `resultDestination`); the return value is wrapped in a `Message` without copying input headers |

`T` is the payload type the binding consumes (for the platform's outbound path: `IntegrationRequest`). For a `ConsumerConnector<IntegrationRequest>` the framework publishes nothing on your behalf; for `Connector<T, R>` the framework sends the reply only when the return value is non-null **and** the `outputHeader` header carries a destination — otherwise the response is returned on the integration flow's bridge (a no-op in the consumer case, where `accept` returns `void`).

The same package holds the internal gateway interfaces the framework uses to bridge your function into a Spring Integration flow — `ConsumerGateway` (`Consumer<Message<?>>`) for consumer functions and `ConnectorGateway` (`Function<Message<?>, Message<?>>`) for returning functions — plus the general-purpose `FunctionBinding` / `ConditionalFunctionBinding` annotations used by the platform's own services. You do not implement these directly.

## `@ConnectorBinding`

`org.activiti.cloud.common.messaging.functional.ConnectorBinding` — `@Retention(RUNTIME)`, `@Target({METHOD, TYPE})`, `@Qualifier`.

| Attribute | Type | Default | Semantics |
|-----------|------|---------|-----------|
| `input` | `String` | `""` | The input channel the function consumes from. Must name a channel declared with `@InputBinding` (see below); Spring Cloud Stream binds that channel to the broker via `spring.cloud.stream.bindings.<channel>.*` |
| `output` | `String` | `""` | Output channel for a returning `Connector<T, R>` function's reply |
| `condition` | `String` | the `appVersion` range check below | SpEL message filter, evaluated after `${...}` placeholders are resolved from the application environment. A rejected message is requeued up to `retry` times (or discarded, see [Retry](#retry-properties)). `""` accepts everything |
| `outputHeader` | `String` | `"resultDestination"` | Name of the header read from the incoming message to find the reply destination of a returning function |
| `connectorType` | `String` | `""` | When non-empty, the message's `connectorType` header must equal this value **exactly** (the service task `implementation` string). A mismatch is discarded silently — never retried — which is how one binding can serve many connector types |
| `retry` | `int` | `0` | Max attempts for a message rejected by the `condition` filter. `0` falls back to `activiti.connector.retry.default.max` (default `-1` = no retry) |
| `retryDelay` | `long` | `0` | Seconds to sleep between retries. `0` falls back to `activiti.connector.retry.default.delay` (default `0`) |

The default `condition`, verbatim from the annotation:

```text
headers.containsKey('appVersion') and T(Integer).valueOf(headers['appVersion']) >= ${application.min.version} and (T(Integer).valueOf(headers['appVersion']) <= ${application.max.version} or ${application.max.version} == -1)
```

Notes on the default:

- It is a SpEL expression evaluated against the message (the `headers` map is in scope), after the bean factory resolves the embedded `${application.min.version}` / `${application.max.version}` placeholders from the environment. An application that keeps the default condition must therefore define both properties; the reference connector instead sets `condition = ""` to skip the check entirely.
- A message without an `appVersion` header fails the first clause and is rejected.
- A message `appVersion` of `-1` passes as a wildcard only when `application.min.version` is `-1` (its default, so the min clause holds) **and** `application.max.version` is `-1` (no upper bound).

Filter pipeline, in the order the framework applies it:

1. **`condition` filter.** Rejected messages either enter the retry loop (when the effective retry count is `> 0`: republished to the message's `spring.cloud.function.destination` header after `retryDelay` seconds, with the `x-retry-count` header incremented; the loop stops when `x-retry-count` reaches `retry - 1`) or are diverted to the framework's discard channel (`connectorBindingSelectorDiscardChannel`), which has no subscriber registered in the framework, so the message is dropped silently.
2. **`connectorType` filter.** Exact string match on the `connectorType` header against the annotation's `connectorType`. Mismatches go straight to the discard channel — no retry, no log at default level.
3. **The function itself.** Invoked through the function registry; exceptions propagate to the Spring Cloud Stream error handler (see [The error path](#the-error-path)).

## `@InputBinding` and channel interfaces

`org.activiti.cloud.common.messaging.functional.InputBinding` — `@Retention(RUNTIME)`, `@Target(METHOD)`, meta-annotated `@Qualifier @Bean`; its `String[] value()` is an `@AliasFor` of the bean name. It marks a channel interface method as a Spring Cloud Stream input binding.

The canonical shape — interface, constant, default method returning a publish-subscribe channel — as used by the reference connector (`ExampleConnectorChannels` in `example-cloud-connector`):

```java
package org.example.payment;

import org.activiti.cloud.common.messaging.functional.InputBinding;
import org.springframework.integration.dsl.MessageChannels;
import org.springframework.messaging.SubscribableChannel;

public interface PaymentConnectorChannels {
    String PAYMENT_CONNECTOR = "payment-connector";

    @InputBinding(PAYMENT_CONNECTOR)
    default SubscribableChannel paymentConnector() {
        return MessageChannels.publishSubscribe(PAYMENT_CONNECTOR).getObject();
    }
}
```

The constant (`PAYMENT_CONNECTOR`) is what `@ConnectorBinding(input = ...)` references; the binding name is the same string, so the broker wiring lives in `spring.cloud.stream.bindings.payment-connector.*` (destination, group, content type). A `@Configuration` class implements the interface to register the channels as beans. The complete worked example, including multi-action destinations and the function-router variant, is in [Building a Custom Connector App](../extension/custom-connectors.md#2-the-input-channel).

## `IntegrationRequest`

`org.activiti.cloud.api.process.model.IntegrationRequest` — the payload the runtime bundle publishes when a connector service task is reached. It is published **after the engine transaction commits**, on the binding/destination named after the service task `implementation` string.

| Member | Type | Meaning |
|--------|------|---------|
| `getIntegrationContext()` | `org.activiti.api.process.model.IntegrationContext` | Correlation and variable context; the interface belongs to the **engine** API (`activiti-api-process-model`), shared by request, result, and error payloads |
| `getResultDestination()` | `String` | Destination the bundle asks success replies to go to — the destination of the bundle's own `integrationResultsConsumer` binding (default destination `integrationResult`) |
| `getErrorDestination()` | `String` | Same for failures — the bundle's `integrationErrorsConsumer` binding (default destination `integrationError`) |
| `getAppVersion()` | `String` | Inherited from `CloudRuntimeEntity` → `ApplicationElement`; copied from the context at construction — the process instance's application version, which the engine's `IntegrationContextBuilder` defaults to `"1"` when the instance carries none |
| `getAppName()` | `String` | Inherited; the bundle's `activiti.cloud.application.name` |
| `getServiceName()` / `getServiceFullName()` | `String` | Inherited; the bundle's `spring.application.name` (both return the same value) |
| `getServiceType()` | `String` | Inherited; the bundle's `activiti.cloud.service.type` (`runtime-bundle`) |
| `getServiceVersion()` | `String` | Inherited; the bundle's `activiti.cloud.service.version` |

The message itself carries these headers, set by the bundle's `IntegrationContextMessageBuilderAppender` (values from the context) plus the standard service-attribution headers:

| Header | Value |
|--------|-------|
| `connectorType` | The service task `implementation` string; the value your `@ConnectorBinding(connectorType = ...)` must match |
| `appVersion` | `integrationContext.getAppVersion()`; the input to the default `condition` |
| `integrationContextId` | Id of the persisted integration context row; the starter's error handler only converts failed messages that carry this header |
| `businessKey` | Instance business key |
| `rootProcessInstanceId` / `processInstanceId` / `parentProcessInstanceId` | Instance coordinates |
| `executionId` | Execution the service task runs on |
| `processDefinitionId` / `processDefinitionKey` / `processDefinitionVersion` | Definition coordinates |

`IntegrationContext` (engine API) members, for reference when reading the request:

| Member | Type | Meaning |
|--------|------|---------|
| `getId()` | `String` | Integration context id (the `integrationContextId` header) |
| `getProcessInstanceId()` / `getRootProcessInstanceId()` / `getParentProcessInstanceId()` | `String` | Instance coordinates |
| `getExecutionId()` | `String` | Execution of the service task |
| `getProcessDefinitionId()` / `getProcessDefinitionKey()` / `getProcessDefinitionVersion()` | `String` / `String` / `Integer` | Definition coordinates |
| `getBusinessKey()` | `String` | Instance business key |
| `getConnectorType()` | `String` | The `implementation` string |
| `getAppVersion()` | `String` | Application version of the runtime bundle |
| `getClientId()` / `getClientName()` / `getClientType()` | `String` | Flow node id, resolved task name, `ServiceTask` |
| `getInBoundVariables()` | `Map<String, Object>` | Inbound variables selected by the process-extensions mapping |
| `getOutBoundVariables()` | `Map<String, Object>` | Outbound variables (populated by the connector) |
| `addOutBoundVariable(String, Object)` / `addOutBoundVariables(Map<String, Object>)` | `void` | Add outbound variables |
| `getInBoundVariable(String)` / `getInBoundVariable(String, Class<T>)` | `<T> T` | Read one inbound variable, optionally typed |
| `getOutBoundVariable(String)` / `getOutBoundVariable(String, Class<T>)` | `<T> T` | Read one outbound variable, optionally typed |

The payload model and its JSON shape are documented in [Connector and Message Payloads](../api-reference/connector-and-message-payloads.md).

## `IntegrationResultBuilder`

`org.activiti.cloud.connectors.starter.model.IntegrationResultBuilder` — builds the success reply. The constructor is private; use the static factory.

| Method | Signature | Behavior |
|--------|-----------|----------|
| `resultFor` | `static IntegrationResultBuilder resultFor(IntegrationRequest integrationRequest, ConnectorProperties connectorProperties)` | Creates the builder over a new `IntegrationResultImpl` reusing the request's `IntegrationContext`; when `connectorProperties` is non-null, stamps `appName`, `appVersion`, `serviceName`, `serviceFullName`, `serviceType`, and `serviceVersion` from it (the connector's identity, not the bundle's) |
| `withOutboundVariables` | `IntegrationResultBuilder withOutboundVariables(Map<String, Object> variables)` | Adds the map to the context's outbound variables (`addOutBoundVariables`); returns the builder |
| `build` | `IntegrationResult build()` | Returns the payload without wrapping it in a message |
| `buildMessage` | `Message<IntegrationResult> buildMessage()` | Wraps the payload and sets the reply headers (below) |
| `getMessageBuilder` | `MessageBuilder<IntegrationResult> getMessageBuilder()` | The `MessageBuilder` before `build()` — use it to add extra headers before building |

Headers added by `buildMessage()` / `getMessageBuilder()`:

| Header | Value |
|--------|-------|
| `targetAppName` | `request.getAppName()` (the requesting bundle's application name) |
| `targetService` | `request.getServiceFullName()` (the requesting bundle's `spring.application.name`) |

## `IntegrationErrorBuilder`

`org.activiti.cloud.connectors.starter.model.IntegrationErrorBuilder` — builds the failure reply. Same structure; the `error` argument is any `Throwable`.

| Method | Signature | Behavior |
|--------|-----------|----------|
| `errorFor` | `static IntegrationErrorBuilder errorFor(IntegrationRequest integrationRequest, ConnectorProperties connectorProperties, Throwable error)` | Creates the builder; `build()` requires both `integrationRequest` and `error` to be non-null |
| `build` | `IntegrationError build()` | Builds an `IntegrationErrorImpl` from the request and the throwable; stamps `appVersion`, `serviceName`, `serviceFullName`, `serviceType`, `serviceVersion` from `connectorProperties` when non-null |
| `buildMessage` | `Message<IntegrationError> buildMessage()` | Wraps the payload and sets the error headers (below) |
| `getMessageBuilder` | `MessageBuilder<IntegrationError> getMessageBuilder()` | The `MessageBuilder` before `build()` |

Headers added: `Content-Type: application/json`, plus the same `targetAppName` / `targetService` as the result builder.

How the throwable is mapped into the `IntegrationError` payload (from `IntegrationErrorImpl`):

| Payload field | Source |
|---------------|--------|
| `errorClassName` | `error.getClass().getName()` |
| `errorCode` | The throwable's `errorCode` **when it is a `CloudBpmnError`** (`org.activiti.cloud.api.process.model.CloudBpmnError`), otherwise `null`. `CloudBpmnError` constructors: `(String errorCode)`, `(String errorCode, String message)`, `(String errorCode, Throwable cause)`, `(String errorCode, String message, Throwable cause)`; the error code must be non-null and non-empty |
| `errorMessage` | The **root cause's** message — the cause chain is unwrapped before reading |
| `stackTraceElements` | The **root cause's** stack trace |

Which error class the runtime bundle acts on (BPMN error propagation vs. warn-and-wait) is decided by `errorClassName` — see [The error path](#the-error-path).

## Senders and destination resolution

| Interface | Method | Behavior |
|-----------|--------|----------|
| `org.activiti.cloud.connectors.starter.channels.IntegrationResultSender` | `void send(Message<IntegrationResult> message)` | Resolves the destination from the message payload's `IntegrationRequest` and publishes through `StreamBridge`, tagging the message with the `spring.cloud.function.destination` header set to the resolved destination |
| `org.activiti.cloud.connectors.starter.channels.IntegrationErrorSender` | `void send(Message<IntegrationError> message)` | Same, for errors |

Both implementations are wired by `ActivitiCloudConnectorAutoConfiguration` (all beans `@ConditionalOnMissingBean`, so you can replace them). There is no `withDestination(...)` on the builders: destination choice is made by the sender through `IntegrationResultDestinationBuilder` / `IntegrationErrorDestinationBuilder` (`String buildDestination(IntegrationRequest event)`), in this order — first non-empty wins:

1. **Override** — `ConnectorProperties.getResultDestinationOverride()` / `getErrorDestinationOverride()` (properties `activiti.cloud.connector.result-destination-override` / `error-destination-override`, bound from the environment variables `ACT_INT_RES_CONSUMER` / `ACT_INT_ERR_CONSUMER`, empty by default). When set, it wins over everything for every request the connector replies to.
2. **Per-request destination** — `request.getResultDestination()` / `request.getErrorDestination()`, which the bundle fills from its own `integrationResultsConsumer` / `integrationErrorsConsumer` bindings.
3. **Fallback** — `integrationResult` (or `integrationError`) + `mqDestinationSeparator` + the request's `serviceFullName`.

The bundle-side default destinations and scopes (from `activiti-cloud-messaging.properties`):

| Property | Default | Environment variable |
|----------|---------|----------------------|
| `activiti.cloud.messaging.destinations.integrationResult.name` | `integrationResult` | `ACT_INT_RES_CONSUMER` |
| `activiti.cloud.messaging.destinations.integrationResult.scope` | `${spring.application.name}` | — |
| `activiti.cloud.messaging.destinations.integrationError.name` | `integrationError` | `ACT_INT_ERR_CONSUMER` |
| `activiti.cloud.messaging.destinations.integrationError.scope` | `${spring.application.name}` | — |
| `activiti.cloud.messaging.destination-separator` | `_` | `ACT_MESSAGING_DEST_SEPARATOR` |

In the default configuration a reply therefore lands on the requesting bundle's `integrationResult` / `integrationError` destination, consumed by its `integrationResultsConsumer` / `integrationErrorsConsumer` bindings (consumer group = the bundle's `spring.application.name`). Note the same `ACT_INT_RES_CONSUMER` / `ACT_INT_ERR_CONSUMER` variables that scope the bundle's consumer destinations also feed the connector's override properties — setting them redirects both sides together.

## The error path

What happens when your connector function fails, and how the bundle treats the resulting `IntegrationError`:

1. **Function throws.** The failure reaches the binder's error channel. The connector starter loads `activiti-cloud-connector.properties`, which sets the default Spring Cloud Stream error handler:

   ```properties
   spring.cloud.stream.default.error-handler-definition=integrationRequestErrorChannelListener
   ```

   The `integrationRequestErrorChannelListener` bean (`IntegrationRequestErrorChannelListener`, a `Consumer<ErrorMessage>`) delegates to the `integrationErrorHandler` bean (`IntegrationErrorHandlerImpl`), which: takes the failed message, checks that its `integrationContextId` header is present (so unrelated failed messages are not converted), deserializes the original `IntegrationRequest` from the payload, and publishes an `IntegrationError` — built with `IntegrationErrorBuilder.errorFor(request, connectorProperties, cause)` where `cause` is the failure (or its cause) — through `IntegrationErrorSender`. The worked example (a thrown `CloudBpmnError` plus the automatic path for an uncaught exception) is in [Outbound Connectors, error handling](outbound.md#error-handling).
2. **You publish the error yourself.** Catching the failure and calling `integrationErrorSender.send(IntegrationErrorBuilder.errorFor(...).buildMessage())` skips the error handler entirely — the same `IntegrationError` payload and destination resolution apply.
3. **The bundle receives it** on its `integrationErrorsConsumer` binding (destination `integrationError`) in `ServiceTaskIntegrationErrorEventHandler`:
   - `errorClassName` equals `org.activiti.cloud.api.process.model.CloudBpmnError` **and** the waiting execution is still on the recorded activity: the bundle runs `PropagateCloudBpmnErrorCmd` — the BPMN error is thrown on the execution, so a boundary error event or error end event with a matching `errorCode` catches it — and aggregates an `INTEGRATION_ERROR_RECEIVED` audit event (closing variant).
   - Any other `errorClassName`: the bundle logs a warning, deletes the integration context, and aggregates `INTEGRATION_ERROR_RECEIVED`; the execution stays waiting at the service task.
   - No waiting execution, or activity id mismatch: the context is deleted and the error is logged as ignored.
    - `ActivitiOptimisticLockingException` while applying the error is retried in place: `@Retryable(value = ActivitiOptimisticLockingException.class, maxAttemptsExpression = "${activiti.cloud.integration.error.retry.max-attempts:3}", backoff = @Backoff(delayExpression = "${activiti.cloud.integration.error.retry.backoff.delay:0}"))`.

The same handlers, from the connector's point of view, are documented end to end in [Outbound Connectors](outbound.md); the replay endpoint for a stuck task (`POST /admin/v1/executions/{executionId}/replay/service-task`) is documented there as well.

## Retry properties

Connector-side and bundle-side retry knobs, compactly (detailed behavior in [Outbound Connectors, error handling](outbound.md#error-handling)):

| Property | Default | Side | Effect |
|----------|---------|------|--------|
| `activiti.connector.retry.default.max` | `-1` (no retry) | Connector | Fallback max attempts when `@ConnectorBinding(retry = 0)`; applies to messages rejected by the `condition` filter |
| `activiti.connector.retry.default.delay` | `0` (seconds) | Connector | Fallback delay between retries when `@ConnectorBinding(retryDelay = 0)` |
| `activiti.cloud.integration.result.retry.max-attempts` | `3` | Runtime bundle | Retry attempts when applying an `IntegrationResult` hits `ActivitiOptimisticLockingException` |
| `activiti.cloud.integration.result.retry.backoff.delay` | `0` (ms) | Runtime bundle | Backoff delay for the above |
| `activiti.cloud.integration.error.retry.max-attempts` | `3` | Runtime bundle | Same, for `IntegrationError` |
| `activiti.cloud.integration.error.retry.backoff.delay` | `0` (ms) | Runtime bundle | Backoff delay for the above |
| `activiti.cloud.messaging.function-router.max-retries` | `3` | Function router | Retries for failed function invocations routed through the function router |
| `activiti.cloud.messaging.function-router.retry-interval` | `10ms` | Function router | Interval between the above |

There is no automatic retry for a failed external call and no built-in circuit breaker: timeouts, non-2xx handling, and retries of the call itself are the connector's responsibility.

## Local (in-process) connectors

You do not need a broker round-trip when the logic can live in the runtime bundle. The engine API interface `org.activiti.api.process.runtime.connector.Connector` (a `Function<IntegrationContext, IntegrationContext>` over the engine's `org.activiti.api.process.model.IntegrationContext`) is the local shortcut:

```java
package org.example.bundle;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.springframework.stereotype.Component;

@Component("payments.processPayment")
public class LocalPaymentConnector implements Connector {

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        String orderId = integrationContext.getInBoundVariable("orderId");
        // ... local call ...
        integrationContext.addOutBoundVariable("paymentId", "PAY-555");
        return integrationContext;
    }
}
```

The matching rule, verified in the engine's `DefaultServiceTaskBehavior.hasConnectorBean`: the bundle calls it in-process only when `applicationContext.containsBean(implementation)` **and** the bean is an instance of `Connector` — the **bean name must be exactly the service task `implementation` string** (hence the `@Component("payments.processPayment")` name). When the bean is found, `MQServiceTaskBehavior` delegates to the default behavior: the call runs synchronously on the engine thread, no `IntegrationRequest` is published, no integration context row is stored, and a failure is an engine exception rather than an `IntegrationError` message. In-bound/out-bound variables use the same process-extensions mapping as the cloud path. The trade-offs (isolation, scaling, blast radius, versioning) and the full in-bundle example are in [Building a Custom Connector App, in-bundle connectors](../extension/custom-connectors.md#inbundle-connectors).

:::caution
Do not confuse the two `Connector` types: `org.activiti.cloud.common.messaging.functional.Connector<T, R>` is the returning **messaging** function (this page), while `org.activiti.api.process.runtime.connector.Connector` is the engine's **in-process** local connector (this section).
:::

## Related

- [Connectors Overview](overview.md) — concepts, connector definitions, and the request/result model
- [Inbound Connectors](inbound.md) — external events into the platform
- [Outbound Connectors](outbound.md) — service tasks calling external systems, with the worked error example
- [Building a Custom Connector App](../extension/custom-connectors.md) — the end-to-end build guide
- [Connector and Message Payloads](../api-reference/connector-and-message-payloads.md) — payload model and JSON shapes
- [Runtime Bundle Service](../services/runtime-bundle.md) — the write side that sends requests and consumes replies
