---
slug: /cloud/changelog/next
title: "9.1.0 (unreleased)"
sidebar_label: "9.1.0 (unreleased)"
description: "Changes currently staged on the Activiti Cloud develop branch for the next release (9.1.0): orphaned integration recovery, audit consumer channel partitioning, and several OOM fixes."
---

# Version 9.1.0 (unreleased)

The changes below are currently staged on the `develop` branch of `activiti-cloud` for the next release, version `9.1.0`. This page is a point-in-time snapshot — **last checked at commit `c21c60f688` (2026-08-12)** — and the final release content may differ.

As with the [engine 9.1.0 release](/changelog/next), the cloud platform inherits the engine baseline changes: Spring Boot 4.0, Jackson 3 for JSON handling, and Java 25.

## Breaking Changes & Mitigations

- **Process variable history no longer persisted in the Query service** — the query-service stopped persisting the history of process variable changes, so historic variable values are no longer available from the Query service. **Mitigation:** if you rely on variable history, read it from the Audit service or persist it in your own read model.
- **Orphaned integration recovery threshold** — integrations are only considered orphaned after **3 hours** (previously a shorter window), with clearer error messages. **Mitigation:** monitoring that expects faster recovery should account for the 3-hour threshold.
- **Spring Boot 4.0 baseline** (inherited from the engine 9.1.0 dependency upgrades). **Mitigation:** review the Spring Boot 3 to 4 migration guide if you pin Spring dependencies yourself.

## New Features

- **Orphaned integration recovery** — the Runtime Bundle detects integrations (service tasks / connector calls) whose owning process instance or transaction was lost, and recovers them instead of leaving the process stuck.
- **Audit consumer channel partitioning** — audit message processing in the Audit service consumer is partitioned across channels to improve throughput on busy instances.
- **Graceful shutdown for the partitioned query consumer** — the Query consumer drains in-flight messages before shutting down.
- **Pre-provisioned connector event bus** — the connector event bus is provisioned from configuration at startup instead of on first use.
- **Connector binding timeout error handler** — connector bindings support a configurable timeout error handler for integration results.
- **Task endpoint logging** — the task REST endpoints log requests for easier troubleshooting.

## Bug Fixes

- Fixed an `OutOfMemoryError` in the Audit service export endpoint (large exports).
- Fixed a Query REST `OutOfMemoryError` caused by N+1 integration-context queries in the admin service task API.
- Fixed a Jackson serialisation issue in connector payloads.
- Inbound variables are now cleaned from integration results and integration errors before publication.
- Fixed `count(*)` usage in the query service with a `LIMIT 1` existence check for better performance.

## Performance

- New `parent_id` index on the Query service process instance table.
- Unused `audit_event` indexes dropped.
- Improved audit events pagination performance on large tables.
- Function-router query consumer concurrency defaults to 1.

## Related Links

- [GitHub repository](https://github.com/Activiti/activiti-cloud)
- [Engine 9.1.0 changelog](/changelog/next)
- [Previous release: 9.0.0](./v9-0-0.md)
