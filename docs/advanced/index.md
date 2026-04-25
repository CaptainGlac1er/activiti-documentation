---
sidebar_label: Advanced Topics Overview
slug: /advanced/topics
title: "Advanced Topics"
description: "Overview of advanced Activiti features for power users."
---

# Advanced Topics

This section covers advanced capabilities of the Activiti engine that go beyond standard BPMN usage. These features are essential for production deployments, complex integrations, and operational tooling.

## Available Topics

### Engine Events and Monitoring

- [Engine Event System](./engine-event-system.md) — Global event listeners for 35+ event types: audit, metrics, notifications
- [Database Event Logging](./database-event-logging.md) — Persistent sequential event trail for forensics and compliance
- [Historic Variable Updates](./historic-variable-updates.md) — Complete audit trail of every variable change
- [Execution Debug Tree](./execution-debug-tree.md) — Visualize execution hierarchy for complex processes

### Process Lifecycle Control

- [Process Instance Suspension](./process-instance-suspension.md) — Pause/restart instances and definitions for maintenance and emergency halts
- [Create-then-Start Process](./create-then-start.md) — Two-phase instance lifecycle for pre-authorization
- [Runtime Process Control](./runtime-process-control.md) — Update business keys, trigger stuck executions, manage identity links

### Deployment and Configuration

- [Spring Auto-Deployment Modes](./auto-deployment-modes.md) — Five deployment strategies for classpath scanning
- [Advanced Deployment Builder](./deployment-builder.md) — Programmatic deployments with filtering, tenants, and scheduled activation
- [Model API](./model-api.md) — Model staging, editing, and deployment workflow

### Authorization and Identity

- [Process Definition Authorization](./process-definition-authorization.md) — Candidate starters for process-level access control
- [Process-Level Identity Links](./process-identity-links.md) — Runtime user/group associations with process instances
- [Task Delegation](./task-delegation.md) — Delegate-resolve pattern for approval workflows

### Engine Extensibility

- [Custom BPMN Parse Handlers](./custom-parse-handlers.md) — Modify how BPMN elements are parsed during deployment

### See Also

- [Advanced BPMN](../bpmn/reference/async-execution.md) — Async execution, multi-instance, listeners, delegates, variables, error handling, and process extensions are covered in the **BPMN Reference** section.
