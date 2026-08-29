---
sidebar_label: Features Overview
slug: /features
title: "Activiti Features"
description: "Catalog of features you can use and implement with Activiti — process data, listeners, execution, error handling, runtime control, security, and operations."
---

# Activiti Features

A catalog of the features you can use and implement with Activiti. Each row links to a complete guide with examples. Features are grouped by what they let you do.

## Process Data

| Feature | What you can do | Guide |
|---------|-----------------|-------|
| Variables & Scope | Pass data through the process with global, local, and scoped variables | [Variables](../bpmn/reference/variables.md) |
| Process Extensions | Define variables, assignments, templates, and mappings in `*-extensions.json` sidecars | [Process Extensions](../bpmn/reference/process-extensions.md) |
| JPA Process Variables | Persist process variables in your own JPA entities | [JPA Variables](../bpmn/integration/jpa-process-variables.md) |
| Common BPMN Features | Attributes available across elements: `activiti:async`, `exclusive`, `skipExpression`, and more | [Common Features](../bpmn/common-features.md) |

## Executing Code & Integration

| Feature | What you can do | Guide |
|---------|-----------------|-------|
| JavaDelegate | Implement custom business logic in service tasks | [JavaDelegate](../bpmn/reference/java-delegate.md) |
| DelegateExecution API | Access and manipulate the process execution context | [DelegateExecution API](../bpmn/reference/delegate-execution-api.md) |
| DelegateTask API | Access and manipulate user tasks from listeners and delegates | [DelegateTask API](../bpmn/reference/delegate-task-api.md) |
| Business Rules (DMN) | Evaluate decision models from a business rule task | [Business Rule Task](../bpmn/elements/business-rule-task.md) |
| Connectors | Call external systems through typed integration contracts | [Connectors](../bpmn/integration/connectors.md) |
| Spring Integration | Bridge process events to Spring Integration channels | [Spring Integration](../bpmn/integration/spring-integration.md) |

## Hooking into Process Events

| Feature | What you can do | Guide |
|---------|-----------------|-------|
| Task Listeners | React to user task lifecycle events (create, assignment, complete, delete) | [Task Listeners](../bpmn/reference/task-listeners.md) |
| Execution Listeners | React to activity start, end, and flow-take events | [Execution Listeners](../bpmn/reference/execution-listeners.md) |
| Process Event Listeners | Hook process-level events on the process definition itself | [Process Event Listeners](../bpmn/reference/process-event-listeners.md) |
| Engine Event System | Subscribe to 35+ engine event types globally for auditing, metrics, and notifications | [Engine Event System](../advanced/engine-event-system.md) |

## Flow, Timing & Error Handling

| Feature | What you can do | Guide |
|---------|-----------------|-------|
| Async Execution | Run activities in the background with the job executor | [Async Execution](../bpmn/reference/async-execution.md) |
| Multi-Instance | Iterate activities over collections, sequentially or in parallel | [Multi-Instance](../bpmn/reference/multi-instance.md) |
| Business Calendars | Timer expressions, ISO 8601 durations, cycles, and CRON schedules | [Business Calendars](../bpmn/reference/business-calendars.md) |
| Error Handling | Boundary events, error propagation, and exception mapping | [Error Handling](../bpmn/reference/error-handling.md) |
| Compensation | Undo work with compensation events | [Compensation Events](../bpmn/events/compensation-events.md) |
| Events | Message, timer, signal, link, and boundary events | [Events Overview](../bpmn/events/index.md) |

## Runtime Control & Monitoring

| Feature | What you can do | Guide |
|---------|-----------------|-------|
| Process Instance Suspension | Pause and resume instances and definitions | [Suspension](../advanced/process-instance-suspension.md) |
| Create-then-Start | Two-phase instance lifecycle for pre-authorization | [Create-then-Start](../advanced/create-then-start.md) |
| Runtime Process Control | Update business keys, unstick executions, manage identity links at runtime | [Runtime Control](../advanced/runtime-process-control.md) |
| Task Delegation | Delegate-resolve pattern for approval and review workflows | [Task Delegation](../advanced/task-delegation.md) |
| Token Lifecycle | Understand how execution tokens flow, wait, and are cleaned up | [Token Lifecycle](../advanced/token-lifecycle.md) |
| Execution Debug Tree | Visualize the execution hierarchy of complex processes | [Debug Tree](../advanced/execution-debug-tree.md) |
| Event Subscription Querying | Query pending message, signal, and compensate subscriptions | [Subscription Querying](../advanced/event-subscription-querying.md) |
| Database Event Logging | Persistent audit trail of all engine operations | [Event Logging](../advanced/database-event-logging.md) |
| Historic Variable Updates | Track every variable change across an instance's lifecycle | [Variable Updates](../advanced/historic-variable-updates.md) |

## Security & Multi-Tenancy

| Feature | What you can do | Guide |
|---------|-----------------|-------|
| Process Definition Authorization | Control who can start a process definition | [Definition Authorization](../advanced/process-definition-authorization.md) |
| Process Identity Links | Associate users and groups with process instances | [Identity Links](../advanced/process-identity-links.md) |
| Security Policies | Declarative, policy-based access control with Spring Security | [Security Policies](../advanced/security-policies.md) |
| Multi-Tenancy | Tenant isolation strategies and per-tenant configuration | [Multi-Tenancy](../advanced/multi-tenancy.md) |

## Deployment & Operations

| Feature | What you can do | Guide |
|---------|-----------------|-------|
| Auto-Deployment Modes | Control classpath BPMN deployment strategy in Spring Boot | [Deployment Modes](../advanced/auto-deployment-modes.md) |
| Deployment Builder | Programmatic deployments with filtering, tenants, and scheduling | [Deployment Builder](../advanced/deployment-builder.md) |
| Model API | Stage, edit, and deploy process models | [Model API](../advanced/model-api.md) |
| Management Service | Job management, dead letter recovery, and engine introspection | [Management Service](../advanced/management-service.md) |
| Job Lifecycle & Recovery | Async executor architecture, retries, and failure recovery | [Job Lifecycle](../advanced/job-lifecycle.md) |
| History Cleanup | Manage history growth: retention, cleanup, and archival | [History Cleanup](../advanced/history-cleanup.md) |
| Native SQL Queries | Run custom SQL against engine tables for reporting | [Native Queries](../advanced/native-queries.md) |

## Extensibility & Testing

| Feature | What you can do | Guide |
|---------|-----------------|-------|
| Custom Parse Handlers | Extend how BPMN elements are parsed at deployment | [Parse Handlers](../advanced/custom-parse-handlers.md) |
| Custom Validators | Enforce organization-specific process rules at deployment time | [Custom Validators](../advanced/custom-validators.md) |
| Testing Infrastructure | BDD assertions, async testing, mocking, and clock manipulation | [Testing](../advanced/testing-infrastructure.md) |

## Where to Go Next

- [BPMN Element Reference](../bpmn/index.md) — look up a specific BPMN element
- [Quick Start](../quickstart.md) — run your first workflow
- [API Reference](../api-reference/overview.md) — look up methods and payloads
- [Implementation Patterns](../implementation-patterns.md) — architectural guidance for production systems
