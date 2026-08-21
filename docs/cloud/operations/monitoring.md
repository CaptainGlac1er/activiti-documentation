---
sidebar_position: 2
sidebar_label: "Monitoring & Observability"
slug: /cloud/operations/monitoring
title: "Monitoring & Observability"
description: "How to monitor a deployed Activiti Cloud platform: what the services expose out of the box, actuator authentication, tracing, and the operational signals that matter."
---

# Monitoring & Observability

Every Activiti Cloud service is a Spring Boot application, and the service starters ship **Spring Boot Actuator** through the shared `activiti-cloud-services-monitoring` module. Out of the box each service exposes two web endpoints — `/actuator/health` and `/actuator/info` — with the health details restricted to the `ACTIVITI_ADMIN` role, and (apart from those two) anything under `/actuator/**` requires an authenticated JWT. Tracing (Micrometer → Brave → Zipkin) is disabled by default and its export bridge is present only in the example applications.

Beyond the standard endpoints, the signals that matter operationally in this platform are **consumer lag** on the broker and **queue depth** on the per-application destinations — the read side is a projection of the event stream, and a stalled reader degrades visibility, not process execution.

## What ships out of the box

### The monitoring module

`activiti-cloud-services-monitoring` (in `activiti-cloud-service-common`) contains a single auto-configuration, `ActivitiMonitoringAutoConfiguration`, which adds `spring-boot-starter-actuator` to the classpath and loads `activiti-monitoring.properties`:

| Property | Value set | Effect |
|---|---|---|
| `management.endpoints.web.exposure.include` | `health,info` | Only the health and info endpoints are exposed over HTTP. Nothing else (metrics, env, beans, ...) is web-exposed by default, even though the full actuator is on the classpath. |
| `management.endpoint.health.show-details` | `when-authorized` | The per-indicator breakdown of `/actuator/health` is included only for authorized callers; everyone else gets the overall status. |
| `management.endpoint.health.roles` | `ACTIVITI_ADMIN` | The role Spring Boot applies to the restricted health access. |

These are property-source defaults — any service can override them in its own configuration.

### Which services pull it in

| Service | Starter(s) | Monitoring module |
|---|---|---|
| Runtime bundle | `activiti-cloud-starter-runtime-bundle` | yes |
| Query | `activiti-cloud-starter-query`, `-query-rest`, `-query-consumer` | yes (all three) |
| Audit | `activiti-cloud-starter-audit`, `-audit-rest`, `-audit-consumer` | yes (all three) |
| Messages | `activiti-cloud-starter-messages-jdbc` / `-hazelcast` / `-redis` | yes (via the `activiti-cloud-starters-messages` parent) |
| Notifications GraphQL | `activiti-cloud-starter-notifications-graphql` | yes |
| Connector | `activiti-cloud-starter-connector` | yes |
| Identity adapter | (no platform starter) | **no** — the [example app](../services/identity-adapter.md) adds `spring-boot-starter-actuator` directly |

### What a deployed service exposes by default

- **`GET /actuator/health`** — reachable **without a token**: the platform's security chain explicitly excludes `/actuator/health/**` from its authenticated actuator rule, so load-balancer and Kubernetes probes work unauthenticated. Without a token you get the overall status (`"UP"` / `"DOWN"`); with a valid `ACTIVITI_ADMIN` JWT you get the per-indicator details.
- **`GET /actuator/info`** — also unauthenticated; the standard Spring Boot info payload (empty unless you add `info.*` properties or info contributors).
- **Nothing else** by default. To expose more (say, `metrics`), extend `management.endpoints.web.exposure.include` on that service — and remember that any endpoint you add under `/actuator/**` requires an authenticated JWT (below).

The health aggregation is the standard Spring Boot set, with two platform specifics:

| Indicator | Present when |
|---|---|
| `ping`, `diskSpace` | Always (web applications) |
| `db` | The service has a datasource — runtime bundle, query, audit |
| `rabbit` | `activiti.cloud.messaging.broker=rabbitmq` (the default). The messaging starter's `ActivitiMessagingEnvironmentPostProcessor` sets `management.health.rabbit.enabled` from the selected broker, so a Kafka deployment carries no rabbit indicator at all. |
| `bindings` | Spring Cloud Stream's standard indicator — reports the state of each bound producer/consumer |

## Endpoints and authentication

The rule comes from `CommonSecurityAutoConfiguration` (in `activiti-cloud-services-common-security`, auto-configured for any web service that pulls in the platform's security modules):

- `/actuator/**` → **authenticated** (OAuth2 JWT required)
- **except** `/actuator/health/**` and `/actuator/info/**`, which are excluded from the authenticated matcher (the remainder of the chain is `permitAll`)

Which services the rule actually applies to depends on the classpath — the security auto-configuration is not on every starter:

| Service / starter | Actuator auth rule active? |
|---|---|
| Runtime bundle (`activiti-cloud-starter-runtime-bundle`) | yes |
| Query with REST (`-query-rest`, `-query`) | yes |
| Query consumer-only (`-query-consumer`) | no — no security auto-configuration |
| Audit with REST (`-audit-rest`, `-audit`) | yes |
| Audit consumer-only (`-audit-consumer`) | no |
| Messages (all starters) | no |
| Notifications GraphQL (`-notifications-graphql`) | yes |
| Identity adapter (example app) | yes |
| Connector (`-connector`) | no — the starter has no security module |

For the services with the rule, the practical result: **health and info are probe-able without credentials; any other actuator endpoint you enable (metrics, loggers, ...) answers 401/403 without a bearer token.** For services without the rule, actuator follows whatever security the application itself configures (none by default) — a consumer-only or messages service with extra endpoints exposed is effectively open, so keep them behind your network policy if you enable them.

## Tracing

- **Disabled by default everywhere.** Every starter that ships a `metadata.properties` (runtime bundle, query consumer and rest, audit consumer, connector, notifications-graphql) includes the line `spring.zipkin.enabled=false` with the comment *"disables zipkin reporting"*.
- **The export bridge is example-app only.** Exporting traces to Zipkin requires the `activiti-cloud-services-tracing` module (`micrometer-tracing-bridge-brave`). Only the example applications pull it in: the example runtime bundle, the example query (all sub-apps), and the example connector. The identity-adapter example sets the zipkin properties but does not declare the bridge.
- The example applications ship this block (shown from the example runtime bundle; the identity-adapter and connector examples are identical):

  ```properties
  spring.zipkin.enabled=false
  spring.zipkin.base-url=http://zipkin:80/
  spring.zipkin.sender.type=web
  management.tracing.sampling.probability=1.0
  ```

- To turn tracing on, set `spring.zipkin.enabled=true` (and, for your own applications, put the tracing module on the classpath) and run a Zipkin-compatible collector: `base-url` points at a `zipkin` host that the standard deployment does not ship — it is not among the [deployed components](../deployment/reference.md#deployed-components) — so you provide it. `management.tracing.sampling.probability` controls sampling (the examples set `1.0` — sample everything).

## What to watch

### Consumer lag — the primary read-side health signal

The read side (query, audit, notifications) is a projection of the `engineEvents` stream: a consumer that stops processing does not stop processes — it just stops seeing them. Consumer lag is therefore the first thing to alert on, and the most informative signal in the whole platform (the same stands for any [custom consumer](../extension/custom-read-models.md#production-notes)).

The bindings to watch (names from the [destination topology](../architecture/event-driven.md#destination-topology)):

| Consumer | Binding | Destination | Group |
|---|---|---|---|
| Query service | `queryConsumer` | `engineEvents` | `query` |
| Audit service | `auditConsumer` | `engineEvents` | `audit` |
| Notifications GraphQL | `graphQLEngineEventsConsumerSource` | `engineEvents` | none set (anonymous queue) |
| Runtime bundle — commands | `commandConsumer` | `commandConsumer_<appName>` | `spring.application.name` |
| Runtime bundle — async jobs | `asyncExecutorJobsInput` | `asyncExecutorJobs_<appName>` | `spring.application.name` |
| Runtime bundle — connector results | `integrationResultsConsumer` / `integrationErrorsConsumer` | `integrationResult_<serviceName>` / `integrationError_<serviceName>` | `spring.application.name` |

`<appName>` is `activiti.cloud.application.name`, `<serviceName>` is `spring.application.name` (see [destination naming](../architecture/event-driven.md#naming-convention)). On RabbitMQ each consumer group gets its own durable queue named `<destination>.<group>` — the message count on those queues is the lag; on Kafka it is the standard consumer-group lag.

A growing lag means one of:

- **The consumer is down or crashed.** Restart it — the durable per-group queues (Rabbit `required-groups`) mean it catches up from where it stopped, and [late consumers are a supported mode](../architecture/event-driven.md#delivery-semantics).
- **Batches are failing.** The query and audit handlers process each batch in a single transaction and roll back on any error. The platform ships **no dead-letter queue**, so what a poison message does depends on the error handler you configure (`spring.cloud.stream.default.error-handler-definition`) — left unconfigured, a rethrow blocks the partition and looks exactly like a stuck consumer. Plan for idempotent handlers plus a handler that logs and moves on.
- **The consumer is simply slower than the producer.** Raise `spring.cloud.stream.bindings.queryConsumer.consumer.concurrency` (env `ACT_QUERY_CONSUMER_CONCURRENCY`) and, on Rabbit, the consumer prefetch.

The consequence of lag is bounded: the query/audit/notifications data goes stale (eventual consistency) while process execution itself continues unaffected.

### Broker queue depth beyond `engineEvents`

- **`commandConsumer_<appName>`** — commands are the correlated-message and runtime-gateway traffic (the messages service delivers BPMN messages through this destination). A growing depth means the bundle is not processing commands: instances waiting for correlated messages keep waiting, and runtime-gateway command calls run into the reply timeout (`activiti.cloud.process-runtime-gateway.reply-timeout`, default 30 seconds).
- **`asyncExecutorJobs_<appName>`** — in a standard runtime bundle the engine's job acquisition is message-based: scheduled jobs are produced to this destination and consumed back by the same bundle (group `spring.application.name`). Depth here is the pending job backlog (see below).
- **`integrationResult_<serviceName>` / `integrationError_<serviceName>`** — connector replies piling up means the bundle's integration consumption is stalled; processes sit at their service tasks.

### `/actuator/health` aggregation

Per service, health aggregates `db` (engine/read database reachable), `rabbit` (Rabbit deployments only), `bindings` (producers/consumers bound), and the standard indicators. Two platform-specific behaviors:

- The runtime bundle **fails fast at startup without a reachable broker** — the messaging defaults (`activiti-cloud-messaging.properties`) set `activiti.cloud.messaging.rabbitmq.missing-durable-queues-fatal=true`, and the messaging auto-configuration applies it to every grouped Rabbit listener container — so a startup against a broker missing the expected durable queues fails the application. A missing broker shows up as a crash loop, not a degraded health.
- A healthy-looking query service with "missing" data is a **consumer** problem, not a health problem — go to the lag section above (also [query service troubleshooting](../services/query.md#consistency-and-troubleshooting)).

### The job executor

The runtime bundle exposes **no actuator health indicator or endpoint specific to the async job executor** — the bundle's sources define no custom `HealthIndicator` or `@Endpoint`. What you can observe instead:

- **The `asyncExecutorJobs_<appName>` queue depth** (above). In a standard bundle the engine's job manager is message-based — a scheduled job is produced to the destination as a message (payload: the job id) and executed when the bundle consumes it — so a growing queue is jobs not being picked up, and a job that throws is rethrown through the messaging layer.
- **The engine's job tables** in the bundle's database (`ACT_RU_JOB`, `ACT_RU_TIMER_JOB` — see the engine's [database schema](../../activiti/advanced/database-schema.md)): due dates, lock expirations, and retry counts for everything pending.
- **Audit events.** Failed or retried jobs surface as entries: `TIMER_FIRED`, `TIMER_FAILED`, `TIMER_RETRIES_DECREMENTED`, `TIMER_CANCELLED` (see [Audit Service](../services/audit.md)) — the audit trail is where you see *what* failed, not just *that* the queue is deep.

## Related

- [Custom Event Consumers & Read Models](../extension/custom-read-models.md)
- [Event-Driven Design](../architecture/event-driven.md)
- [Deployment Reference](../deployment/reference.md)
- [Runtime Bundle Service](../services/runtime-bundle.md)
- [Query Service](../services/query.md)
