---
slug: /cloud/changelog
title: "Changelog"
sidebar_label: Changelog
description: "Release history for Activiti Cloud versions 8.1.0 through 9.0.0 plus the in-development 9.1.0, with curated summaries of new features, bug fixes, breaking changes, and notable changes per release."
---

# Changelog

This section summarizes the changes in each Activiti Cloud release from 8.1.0 through 9.0.0, plus a snapshot of what is staged for the next release (9.1.0). Each entry lists cloud-platform changes — Query service, Audit service, Runtime Bundle, connectors, GraphQL, and identity — new features, bug fixes, notable changes, and — where applicable — breaking changes with mitigations.

Engine-level changes (BPMN model API, process extension JSON, task/process runtime APIs) are covered in the [Activiti engine changelog](/changelog). Activiti Cloud releases track the same version numbers and release dates as the engine, but this changelog focuses on what changed in the cloud microservices.

## Notable Breaking Changes

Releases with platform baseline changes or behavior changes worth reviewing before upgrading:

| Release | Breaking / behavior changes | Details |
|---------|-----------------------------|---------|
| 9.1.0 (unreleased) | Query service no longer persists process variable history; orphaned integration recovery behavior changed | [View](./next.md#breaking-changes--mitigations) |
| 9.0.0 | Requires Java 25; expression evaluation moved to the `jakarta.el.ExpressionFactory` SPI | [View](./v9-0-0.md#breaking-changes--mitigations) |
| 8.8.0 | Spring Boot 3.5 baseline; connector message multiplexing/demultiplexing rework; task name/description truncation | [View](./v8-8-0.md#breaking-changes--mitigations) |
| 8.7.0 | Spring Boot 3.3 baseline; HQL injection fix replaces the querydsl dependency with a patched fork; Query and Audit Consumer split into separate starter modules | [View](./v8-7-0.md#breaking-changes--mitigations) |
| 8.2.0 | Requires Java 21; Spring Boot 3.2 / Spring Cloud 2023.0.0 baseline; JUEL module removed | [View](./v8-2-0.md#breaking-changes--mitigations) |

## Releases

| Version | Released | Highlights | Details |
|---------|----------|------------|---------|
| 9.1.0 (unreleased) | In development | Orphaned integration recovery, audit consumer channel partitioning, OOM fixes, variable-history removal | [View](./next.md) |
| 9.0.0 | 2026-03-05 | Java 25 upgrade, expression evaluation moved behind an SPI | [View](./v9-0-0.md) |
| 8.8.0 | 2026-02-25 | Linked/orphan process filtering, subprocess APIs, connector multiplexing, RabbitMQ message prefixes | [View](./v8-8-0.md) |
| 8.7.1 | 2025-08-22 | Count APIs for tasks and process instances | [View](./v8-7-1.md) |
| 8.7.0 | 2025-02-03 | Process variable filters, sorting by variables, querydsl security fix, GraphQL WebSocket rework | [View](./v8-7-0.md) |
| 8.6.0 | 2024-07-05 | GraphQL aggregated data queries, audit bulk-delete indexes, application version endpoint | [View](./v8-6-0.md) |
| 8.5.0 | 2024-05-22 | Permission-based authorization, security patch release | [View](./v8-5-0.md) |
| 8.4.0 | 2024-04-09 | Modeling code removal, `hideDisabledUser` user search parameter | [View](./v8-4-0.md) |
| 8.3.2 | 2024-06-28 | Task search performance fix (maintenance) | [View](./v8-3-2.md) |
| 8.3.1 | 2024-05-17 | Task search collection fix (maintenance) | [View](./v8-3-1.md) |
| 8.3.0 | 2024-03-05 | Task API pagination/sort fixes, idempotent BPMN message receiver | [View](./v8-3-0.md) |
| 8.2.0 | 2024-01-22 | Java 21, Spring Boot 3.2, Query service memory leak fixes | [View](./v8-2-0.md) |
| 8.1.0 | 2023-11-21 | Actor tracking in events, duplicate key constraint fixes | [View](./v8-1-0.md) |
