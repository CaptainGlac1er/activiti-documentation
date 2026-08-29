---
sidebar_label: Runtime Capabilities Overview
slug: /advanced/topics
title: "Runtime Capabilities & Operations"
description: "Overview of Activiti runtime capabilities — events and monitoring, process lifecycle control, and authorization — plus operations and extensibility topics."
---

# Runtime Capabilities & Operations

This section covers the capabilities you can build with beyond standard BPMN usage: monitoring, lifecycle control, and access control. Operations and extensibility topics are covered in their own sidebar sections.

## Runtime Capabilities

### Engine Events and Monitoring

- [Engine Event System](./engine-event-system.md) — Global event listeners for 35+ event types: audit, metrics, notifications
- [Database Event Logging](./database-event-logging.md) — Persistent sequential event trail for forensics and compliance
- [Historic Variable Updates](./historic-variable-updates.md) — Complete audit trail of every variable change
- [Execution Debug Tree](./execution-debug-tree.md) — Visualize execution hierarchy for complex processes
- [Event Subscription Querying](./event-subscription-querying.md) — Query pending message, signal, and compensate subscriptions
- [Token Lifecycle](./token-lifecycle.md) — How execution tokens flow through processes, wait states, and cleanup

### Process Lifecycle Control

- [Process Instance Suspension](./process-instance-suspension.md) — Pause/restart instances and definitions for maintenance and emergency halts
- [Create-then-Start Process](./create-then-start.md) — Two-phase instance lifecycle for pre-authorization
- [Runtime Process Control](./runtime-process-control.md) — Update business keys, trigger stuck executions, manage identity links
- [Task Delegation](./task-delegation.md) — Delegate-resolve pattern for approval workflows

### Authorization and Security

- [Process Definition Authorization](./process-definition-authorization.md) — Candidate starters for process-level access control, event-based reactive authorization, and ProcessRuntime filtering
- [Process-Level Identity Links](./process-identity-links.md) — Runtime user/group associations with process instances
- [Security Policies](./security-policies.md) — Declarative policy-based access control with Spring Security integration, role management, and fine-grained authorization

## See Also

### Operations & Administration

- [Database Schema Reference](./database-schema.md) — Complete reference for all ACT_* tables, ByteArrayEntity shared blob architecture, and cascade deletion
- [Management Service](./management-service.md) — Admin operations: job management, dead letter recovery, database introspection, event log querying
- [Job Lifecycle & Recovery](./job-lifecycle.md) — Async job state machine, failure handling, retry policies, distributed locking, and recovery procedures
- [Multi-Tenancy](./multi-tenancy.md) — Tenant isolation strategies: shared schema, per-tenant schemas, per-tenant databases with async executor and mail server configuration
- [Native SQL Queries](./native-queries.md) — Custom SQL against Activiti tables for advanced reporting, joins, and performance-critical queries
- [Optimistic Locking and Concurrency](./optimistic-locking.md) — Revision-based locking, RetryInterceptor auto-retry, JTA behavior, cluster tuning
- [History Cleanup and Data Retention](./history-cleanup.md) — Cleanup strategies, retention policies, batch deletion, and archival approaches

### Deployment & Configuration

- [Spring Auto-Deployment Modes](./auto-deployment-modes.md) — Five deployment strategies for classpath scanning
- [Advanced Deployment Builder](./deployment-builder.md) — Programmatic deployments with filtering, tenants, and scheduled activation
- [Model API](./model-api.md) — Model staging, editing, and deployment workflow

### Extensibility & Testing

- [Custom BPMN Parse Handlers](./custom-parse-handlers.md) — Modify how BPMN elements are parsed during deployment, ActivityBehavior class hierarchy, and the leave() lifecycle
- [Custom Validators](./custom-validators.md) — Write and register custom BPMN validators to enforce organization-specific process rules at deployment time
- [Testing Infrastructure](./testing-infrastructure.md) — BDD-style assertions, async flow testing, mocking service tasks, Spring integration, and clock manipulation for timer testing

### Cross-References

- [Process Features](../features/index.md) — Async execution, multi-instance, listeners, delegates, variables, error handling, business calendars, and process extensions are covered in the **Process Features** section.
- [BPMN Element Reference](../bpmn/index.md) — Element-by-element BPMN documentation.
- [Integration](../bpmn/integration/index.md) — Connectors, Spring Integration bridge, and JPA variables are covered in the **BPMN Integration** section.
- [DMN Integration](../bpmn/elements/business-rule-task.md) — Decision model patterns and external DMN engine integration.
