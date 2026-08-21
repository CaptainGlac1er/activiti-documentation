---
sidebar_position: 4
sidebar_label: "Standalone vs. Cloud"
slug: /cloud/getting-started/standalone-vs-cloud
title: "Standalone Engine vs. Cloud"
description: "A decision and migration guide between the standalone Activiti engine and Activiti Cloud: scenario-based selection criteria, a section-by-section mapping of what changes when you move, what does not change, and a migration checklist."
---

# Standalone Engine vs. Cloud

The [Activiti Cloud Overview](overview.md#how-it-differs-from-the-standalone-activiti-engine) contains the high-level comparison table, and [When to choose Cloud versus the standalone engine](overview.md#when-to-choose-cloud-versus-the-standalone-engine) the shortlist of criteria. This page goes deeper: it turns those criteria into scenario-based decision guidance, maps a standalone application onto the cloud platform section by section, and ends with a migration checklist.

The two editions share the same engine — same BPMN semantics, same process model, same variables, same extension files — so a move between them is an *architecture* change, not a model rewrite. The standalone edition (documented in the [Activiti module](../../activiti/index.md)) is the engine embedded in one Spring Boot application; Activiti Cloud is that engine surrounded by a service architecture (runtime bundle, query, audit, messages, connectors) on Kubernetes, with a broker as the backbone.

## Decision guide

Use the shortlist in the [overview](overview.md#when-to-choose-cloud-versus-the-standalone-engine) as a first pass, then work through the scenarios below. Each criterion names the concrete situation that tips the decision.

### Choose standalone when

| Criterion | The scenario it covers |
|-----------|------------------------|
| **Ownership** | One application — and one team — owns the workflow. Only that application starts, drives, and reads its processes; no other service ever needs to. Duplicating the engine per application is not a concern because there is only one application. |
| **Consistency** | Reads must reflect writes within the same request. In-process, the query runs against the same database the engine just committed to; there is no broker hop, no read model, no lag to design around. |
| **Infrastructure** | You do not run Kubernetes and do not want to operate a cluster, a messaging broker (RabbitMQ/Kafka), and five or more services. A single deployable with one database is the whole platform. |
| **Latency shape** | The workflow is part of a request/response flow where every hop must stay inside one JVM — a synchronous orchestration with tight end-to-end latency budgets, where a broker round-trip per external call is unacceptable. |
| **Data access** | Your reporting, audit, and admin tools need *arbitrary* queries against the engine database (native SQL, history tables, ad-hoc joins). Standalone gives you the engine DB directly; Cloud exposes a fixed read model. |
| **Identity** | The application already has its own Spring Security setup (or none) and no shared identity provider to integrate with. |
| **Integration scale** | External integrations are few and stable; a couple of HTTP clients or a Spring Integration flow inside the application is enough, and none of them need independent scaling or independent release cycles. |

### Choose Cloud when

| Criterion | The scenario it covers |
|-----------|------------------------|
| **Shared platform** | Multiple applications or teams start, query, or react to the *same* processes — HR, finance, and a portal all driving one order-fulfillment platform. Cloud gives one shared write side instead of N duplicated engine instances, and a single event stream everyone can consume. |
| **Team topology** | Process teams should deploy processes without touching the platform, and integration teams should deploy connectors without touching processes. Cloud's unit of change is a runtime bundle or a connector application, not the whole application. |
| **Integration surface and scale** | Processes must integrate with many external systems at volume (webhooks in, payment/email/CRM APIs out). Connectors isolate each integration's clients and credentials, scale independently of the engine, contain failures in the broker queue instead of the engine thread pool, and can be re-released without redeploying processes. Inbound events arrive as broker events correlated by the [messages service](../services/messages.md). |
| **Availability and SLAs** | Process execution, read traffic, and event history must scale and fail independently. In Cloud, a dead query service degrades visibility, not execution (events accumulate in the broker and are replayed on restart); scaling out the runtime bundle or the query consumers is a deployment change, not a redesign. Per-instance event ordering is available in partitioned mode. |
| **Who operates it** | A platform team owns the cluster, broker, Keycloak realm, and service fleet; product teams ship bundles and connectors through normal image pipelines (Helm). If you have no one to operate that fleet, the operational cost of Cloud is real — see [what Cloud requires](#what-cloud-requires). |
| **Data compliance** | Ownership of each data store is explicit and separated: the runtime bundle owns the engine database, the query service owns its read-model database, the audit service owns an immutable, actor-attributed event log. Compliance can demand (or forbid) access per store, and the audit trail is a first-class, append-only artifact rather than a history table inside the application's database. |
| **External visibility** | Other services, front ends, or BI tools must consume process state over HTTP (query/audit REST APIs, GraphQL subscriptions) without sharing your JVM. |

### What Cloud requires

Cloud is a platform, not a dependency. Before committing, verify the runtime prerequisites — verified against the local install tooling and the [Deployment Reference](../deployment/reference.md):

| Requirement | What it is |
|-------------|------------|
| Kubernetes cluster | The stack deploys with Helm (the `activiti-cloud-full-chart` chart); the local setup script drives `helm upgrade --install` into its own namespace (`pr-<env>-<broker>-<p\|n>-<d\|o>`) |
| Messaging broker | RabbitMQ (default) or Kafka, selected at install time; deployed by the chart, or your own. All inter-service communication goes through it |
| Keycloak | A realm issuing bearer tokens (source default realm `activiti`; the local install script defaults it to `alfresco`) with the `activiti-keycloak` client and a client secret; every service validates tokens from it |
| API gateway | The single entry point; routes by path prefix (`/rb`, `/query`, `/audit`, ...) and enforces the role-based URL constraints |
| Databases | One per read/write owner: engine database (runtime bundle), query database (query service), audit database (audit service), plus the messages service store |
| Toolchain | Java 25 and Maven to build bundles and connectors (the platform runs Spring Boot 3.5.7); `kubectl`, `helm`, `yq`, `git` for the deployment |

The full stack can be stood up locally in one command — [Local Development Setup](local-setup.md) is a good trial before committing to the architecture.

## What changes when you move

A section-by-section mapping of a standalone application onto the cloud platform. The general rule: **your models move as-is; your Java moves where the engine lives; your call sites become HTTP.**

### Engine access: in-process API → REST against the bundle

| | Standalone | Cloud |
|---|------------|-------|
| Start an instance | `processRuntime.start(new StartProcessPayload(...))` in the same JVM | `POST /rb/v1/process-instances` with the same `StartProcessPayload` JSON, through the gateway |
| Complete a task | `taskRuntime.complete(...)` in the same JVM | `POST /rb/v1/tasks/{taskId}/complete` |
| Deliver a message / signal | `ReceiveMessagePayload` / `SignalPayload` in-JVM | `PUT /rb/v1/process-instances/message`, `POST /rb/v1/process-instances/signal` |
| Read state | Same call site, same database, same transaction | Query service `GET /query/v1/...` (REST) or the [notifications GraphQL](../services/notifications-graphql.md) endpoint; the [runtime bundle API](../services/runtime-bundle.md) for the authoritative just-committed state |
| React to events | Typed listener beans (`ProcessRuntimeEventListener<ProcessStartedEvent>`) registered as Spring components | No in-JVM listeners outside your own bundle: consume the `engineEvents` stream (a [custom read model](../extension/custom-read-models.md)) or subscribe through GraphQL |

Two things to internalize:

1. **The payloads are the same objects.** The modern engine API — `ProcessRuntime` / `TaskRuntime` (verified against the engine source, `org.activiti.api.process.runtime` / `org.activiti.api.task.runtime`) — is command-payload driven, and the cloud REST API is literally those payloads over HTTP. The engine module's [API Reference](../../activiti/api-reference/overview.md) doubles as a map of the write-side endpoints.
2. **Reads are eventually consistent.** In Cloud, the query and audit services rebuild their stores from broker events, so a read issued immediately after a write can still see the previous state. Use the response returned by the write call for the just-happened state, and design polling or subscriptions for everything else: [Event-Driven Design](../architecture/event-driven.md#what-this-means-for-your-architecture) and [Query Service, consistency and troubleshooting](../services/query.md#consistency-and-troubleshooting).

Inside your **own** custom runtime bundle the engine beans are still injectable — `RepositoryService`, `RuntimeService`, and the runtimes — for in-JVM logic. What no longer exists is *other applications* reaching into the engine: every cross-application access goes through the gateway.

### Deployment: classpath and `RepositoryService` → packaged bundle, plus an explicit sync

| | Standalone | Cloud |
|---|------------|-------|
| How processes arrive | Starter auto-deploys the classpath (`classpath*:**/processes/`, suffixes `**.bpmn20.xml` / `**.bpmn`, deployment name `SpringAutoDeployment`) plus any programmatic `repositoryService.createDeployment()...deploy()` (your own REST endpoint if you need one) | Same auto-deployment, packaged **with the bundle** — the reference stack has no REST deployment endpoint at all; a bad model is skipped (`deployment-mode=never-fail`) rather than failing startup |
| Runtime deployment (editor) | `deploy()` is enough — the app reads its own engine | `deploy()` **plus** `ProcessDefinitionsSyncService.syncProcessDefinitions(...)` to re-emit `PROCESS_DEPLOYED` events, otherwise the query and audit read models never learn about the new version |
| Versioning | Same engine semantics: new deployment per `deploy()`, running instances keep their version | Same, plus every instance carries the bundle's application version (`appVersion`), which the query service exposes for filtering |
| Rollback | Redeploy the old resources, or start old versions by definition id | No built-in rollback or undeploy either: old versions stay deployed and addressable; pin starts by definition id in bundle code, or redeploy the previous XML as a new higher version |

The editor-backend pattern (a controller that deploys + syncs, version semantics, production notes) is worked out in [Deploying Processes at Runtime](../extension/deploying-processes.md); building the bundle itself is [Custom Runtime Bundle](../extension/custom-runtime-bundle.md). Application versioning and rollback strategy across releases is covered in [Applications](../operations/applications.md).

### Queries: direct database → the query read model

Standalone, your application *is* the client of the engine database: JPA entities, `HistoryService`, native queries, any join. In Cloud, external clients get the query service's read model instead:

- **What's available:** paged REST over process instances, tasks, process definitions, variables, and applications — with predicate filtering, `POST /v1/.../search` bodies, `variableKeys` embedding, diagram rendering, and admin variants (`/admin/v1`) that skip policy filtering. The read model also stores integration contexts and applications. Full surface: [Query Service](../services/query.md).
- **What's *not* available:** arbitrary native queries against the engine database from any other service (the query and audit services "never talk to the engine database"), engine history tables as such (the closest substitute is the immutable [audit service](../services/audit.md) event log), and the engine Model API rows (modeler state stays bundle-local).
- **The escape hatch:** inside your own custom bundle you can still inject the engine services and query in-JVM — but that capability dies at the bundle boundary, so treat it as implementation detail, not platform API.

If your reporting needs a shape the read model does not serve, the platform answer is a [custom read model](../extension/custom-read-models.md) — another consumer of `engineEvents` — not database access to the engine.

### Integration: Spring Integration and direct calls → connectors over the broker

Standalone, external work happens in-JVM: the starter ships a Spring Integration DSL (`org.activiti.spring.integration.Activiti` — `inboundGateway(...)`, `signallingMessageHandler(...)`, see [Spring Integration in the engine docs](../../activiti/bpmn/integration/spring-integration.md)), service delegates make direct HTTP calls, and your application holds the credentials.

In Cloud, the integration boundary is the broker. An outbound service task `implementation="paymentGateway.approvePayment"` makes the runtime bundle publish an `IntegrationRequest`; a connector *application* consumes it, calls the external system with its own clients, and publishes an `IntegrationResult` or `IntegrationError` back. Inbound, an external event becomes a connector that publishes to the platform (message events through the messages service, or the process REST API). The [Connectors Overview](../connectors/overview.md) covers the architecture; the programming API is in the [Connector API Reference](../connectors/api-reference.md); building an application end to end is [Building a Custom Connector App](../extension/custom-connectors.md).

The decision rule is in the [Connectors Overview](../connectors/overview.md#connectors-vs-calling-a-service-directly): cross a system boundary (credentials, independent scaling, failure isolation) → connector application; keep it in the bundle (synchronous, in-JVM, your own logic) → delegate or local `Connector` bean. In-bundle delegates do not disappear in Cloud — see below.

### Security: embedded authentication → Keycloak, roles, and per-service policies

| Layer | Standalone | Cloud |
|-------|------------|-------|
| Authentication | Your application's Spring Security chain (or none); the engine takes its principal from the security context through `SecurityContextPrincipalProvider` / `SecurityManager` | Keycloak bearer tokens validated by every service; the JWT `preferred_username` becomes the engine's acting user, so instances and audit events carry the real actor |
| URL authorization | Your app's route protection | `authorizations.security-constraints` per service: `ACTIVITI_USER` on `/v1/*`, `ACTIVITI_ADMIN` on `/admin/*` by default |
| Data scoping | The engine's `activiti-spring-security-policies` module (`SecurityPoliciesManager` model: users/groups × keys × READ/WRITE) and BPMN candidate users/groups | The **same** `activiti.security.policies` model, but applied per service — the runtime bundle filters engine queries, the query service filters the read model, the audit service filters the event log. Configuring a policy means configuring it in every service that should enforce it |
| User/group directory | Your `UserGroupManager` / `PrincipalIdentityProvider` beans | The identity adapter (or your own bridge) serves user/group lookup from Keycloak |

The mechanics: [Identity and Security](../architecture/identity.md) for tokens, roles, and realm expectations; [Security Policies](../architecture/security-policies.md) for what the policies gate and the `ACTIVITI_USER`/`ACTIVITI_ADMIN` visibility subtleties; the engine-side model is documented in [Security Policies and Authorization (engine)](../../activiti/advanced/security-policies.md).

### What does *not* change

- **BPMN semantics.** Same engine, same elements, same behaviors — the [BPMN reference](/docs/bpmn/index) applies to both editions unchanged.
- **Process extension files.** The `*-extensions.json` sidecars (variable definitions, connector mappings, templates, assignments) use the same schema and are scanned the same way in a bundle (`spring.activiti.process.extensions.dir`, falling back to the process-definition location prefix): [Process Extensions](../../activiti/bpmn/reference/process-extensions.md).
- **Expressions.** The same `${...}` EL evaluation in task attributes, conditions, and listeners.
- **Delegates.** `JavaDelegate` classes and `activiti:class` / `activiti:delegateExpression` beans run in-process *inside your custom runtime bundle* exactly as they do standalone — the engine is embedded there; [Java Delegate (engine)](../../activiti/bpmn/reference/java-delegate.md), and bundles "host your BPMN models, delegates, and any custom controllers" by design ([Custom Runtime Bundle](../extension/custom-runtime-bundle.md#adding-your-own-code)).
- **Variables.** Same variable model, types, and lifecycle.

## The engine version question

Activiti Cloud does not track the engine's moving head — it ships a specific engine release:

| Fact | Value |
|------|-------|
| Cloud platform version | 9.0.0 |
| Engine pinned by the platform | `9.0.0` — the cloud BOMs import `org.activiti:activiti-api-dependencies:9.0.0` with `activiti.version=9.0.0` |
| Engine release date | 2026-03-05 — the same day as the cloud 9.0.0 release |
| Standalone engine since then | The engine's default branch has moved on to `9.1.0-SNAPSHOT` (latest pre-release tag `9.1.0-alpha.14`, 2026-04-22) |

The implications:

- A Cloud deployment runs exactly engine 9.0.0 semantics. When you verify an engine API, attribute, or BPMN behavior against the platform, check the engine's `9.0.0` tag — not the engine HEAD, which is already ahead.
- New engine features (9.1.x) reach standalone users first; Cloud users receive them with a future cloud platform release. If a roadmap item depends on an engine feature newer than 9.0.0, plan for the platform release that carries it.
- The platform's own toolchain is pinned too: Java 25, Spring Boot 3.5.7 — a bundle or connector you build must match.

## Migration checklist

A concrete order of operations for moving a standalone application to Cloud:

1. **Inventory engine API usage.** List every in-JVM touchpoint: `ProcessRuntime`/`TaskRuntime` calls, direct engine services (`RuntimeService`, `TaskService`, `HistoryService`, `RepositoryService`), typed event listeners, Spring Integration flows, and — the big one — every query your UIs, reports, and admin tools run against the engine database.
2. **Map writes to the runtime bundle REST API.** Each command becomes an endpoint and payload (`StartProcessPayload`, `CompleteTaskPayload`, message/signal payloads, ...). The engine module's [API Reference](../../activiti/api-reference/overview.md) lists the payloads; the platform's [API overview](../api-reference/overview.md) maps them onto the gateway routes.
3. **Map reads to the query model.** Every report, dashboard, and admin screen must be expressible against [Query Service](../services/query.md) (or [Audit Service](../services/audit.md) for history, or [notifications GraphQL](../services/notifications-graphql.md) for push). Gaps become custom read models, not database access.
4. **Stand up the platform prerequisites.** Kubernetes cluster, broker (RabbitMQ/Kafka), Keycloak realm and `activiti-keycloak` client, gateway, databases — the [Local Development Setup](local-setup.md) does all of this in one command against a local cluster; production parameters live in the [Deployment Reference](../deployment/reference.md).
5. **Package the processes into a runtime bundle.** Create the custom bundle (BPMN under `processes/`, extension sidecars, connector definition JSON under `connectors/`), build and deploy its image. If processes must be deployable from a modeler at runtime, add the deploy-plus-sync endpoint now. See [Custom Runtime Bundle](../extension/custom-runtime-bundle.md) and [Deploying Processes at Runtime](../extension/deploying-processes.md).
6. **Move external calls into connectors** (or keep genuinely in-JVM logic as delegates / local `Connector` beans in the bundle). One connector application per integration domain; credentials stay out of the bundle image. See [Connectors](../connectors/overview.md) and the [Connector API Reference](../connectors/api-reference.md).
7. **Configure security.** Realm roles for users, the `authorizations.security-constraints` per service, and `activiti.security.policies` in every service that must filter on them. See [Identity and Security](../architecture/identity.md) and [Security Policies](../architecture/security-policies.md).
8. **Verify read-model coverage and design for the lag.** Before cutover, confirm every migrated screen reads from a query/audit/GraphQL endpoint, and that no flow assumes a read sees its own write. Use write-call responses for just-committed state. See [Query Service, consistency and troubleshooting](../services/query.md#consistency-and-troubleshooting).

## Going back

The reverse move is supported by the same logic in reverse: the [overview's criteria](overview.md#when-to-choose-cloud-versus-the-standalone-engine) are symmetric, so teams whose platform usage has consolidated into a single application — one owner, no shared consumers, no need for independently scaled readers or isolated connectors — can embed the engine again. The models, extension files, delegates, and variables port unchanged; the rework is concentrated in re-pointing HTTP call sites at the in-process runtimes and restoring direct database queries.

## Related

- [Activiti Cloud Overview](overview.md) — the platform, and the high-level comparison this page extends
- [Local Development Setup](local-setup.md) — try the full stack before committing
- [Your First Workflow](first-workflow.md) — the first cloud API calls
- [Architecture Overview](../architecture/overview.md) and [Event-Driven Design](../architecture/event-driven.md) — why the platform is shaped this way
- [Standalone engine documentation](../../activiti/index.md) — the embedded edition: quick start, API reference, advanced topics
- [BPMN reference](/docs/bpmn/index) — shared by both editions
