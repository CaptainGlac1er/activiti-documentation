---
slug: /changelog
title: "Changelog"
sidebar_label: Changelog
description: "Release history for Activiti API versions 8.1.0 through 9.0.0 plus the in-development 9.1.0, with curated summaries of new features, bug fixes, breaking changes, and notable changes per release."
---

# Changelog

This section summarizes the changes in each Activiti API release newer than 8.0.0, from 8.1.0 through 9.0.0, plus a snapshot of what is staged for the next release (9.1.0). Each entry lists new features, bug fixes, notable changes, and — where applicable — breaking changes with mitigations.

> **Note on version lines:** The 8.1.x line is a **maintenance line** that continued in parallel with the main 8.2.0+ release line. Some fix releases contain no functional changes beyond the release itself.

## Notable Breaking Changes

Releases with JDK baseline changes, behavior changes, or API changes worth reviewing before upgrading:

| Release | Breaking / behavior changes | Details |
|---------|-----------------------------|---------|
| 9.1.0 (unreleased) | Spring Boot 4.0 baseline; Jackson 3 for JSON variables; PostgreSQL/Oracle schema changes | [View](./next.md#breaking-changes--mitigations) |
| 9.0.0 | Requires Java 25; expression evaluation moved to the `jakarta.el.ExpressionFactory` SPI | [View](./v9-0-0.md#breaking-changes--mitigations) |
| 8.8.0 | Spring Boot 3.5 baseline; multi-instance collections evaluated once; catch-all error boundaries processed last; task name/description truncation; deprecated single-id payload getter | [View](./v8-8-0.md#breaking-changes--mitigations) |
| 8.7.0 | Spring Boot 3.3 baseline; validation errors now carry machine-readable keys and params; stricter link event validation | [View](./v8-7-0.md#breaking-changes--mitigations) |
| 8.4.0 | Variable values are now parsed and validated against the type declared in the process extension JSON | [View](./v8-4-0.md#breaking-changes--mitigations) |
| 8.3.0 | Nashorn bundled in the core — JavaScript script tasks work without an external script engine | [View](./v8-3-0.md#breaking-changes--mitigations) |
| 8.2.0 | Requires Java 21; Spring Boot 3.2 baseline; error propagation behavior change in called activities | [View](./v8-2-0.md#breaking-changes--mitigations) |
| 8.1.1 | Error propagation and boundary event behavior fixes (backports); MySQL identity link column type change | [View](./v8-1-1.md#breaking-changes--mitigations) |

Releases 8.1.0, 8.1.2, 8.3.1, 8.3.2, 8.5.0, and 8.6.0 have no breaking changes.

## Releases

| Version | Released | Highlights | Details |
|---------|----------|------------|---------|
| 9.1.0 (unreleased) | In development | Spring Boot 4.0, Jackson 3, `setVariablesTask` service task, `nextTask` API | [View](./next.md) |
| 9.0.0 | 2026-03-05 | Java 25 upgrade, expression evaluation moved behind an SPI | [View](./v9-0-0.md) |
| 8.8.0 | 2026-02-25 | Ephemeral variables, root process instance id, JSON Patch array support | [View](./v8-8-0.md) |
| 8.7.0 | 2025-02-03 | BPMN link events, JSON Patch variable mapping, deployment cache limit | [View](./v8-7-0.md) |
| 8.6.0 | 2024-07-05 | XmlUnit security upgrade, Activiti 5 task visibility fix | [View](./v8-6-0.md) |
| 8.5.0 | 2024-05-22 | Spring Boot security patch release | [View](./v8-5-0.md) |
| 8.4.0 | 2024-04-09 | BigDecimal variable type, Java 8 date support | [View](./v8-4-0.md) |
| 8.3.2 | 2024-06-28 | Release-only tag, no functional changes | [View](./v8-3-2.md) |
| 8.3.1 | 2024-05-17 | Release-only tag, no functional changes | [View](./v8-3-1.md) |
| 8.3.0 | 2024-03-05 | Nashorn (JavaScript) script engine, decimal primitive type | [View](./v8-3-0.md) |
| 8.2.0 | 2024-01-22 | Java 21, Spring Boot 3.2 | [View](./v8-2-0.md) |
| 8.1.2 | 2024-08-23 | Task query performance fixes, schema script corrections | [View](./v8-1-2.md) |
| 8.1.1 | 2024-07-02 | Maintenance release: boundary events, called activities, listener fixes | [View](./v8-1-1.md) |
| 8.1.0 | 2023-11-21 | Identity link user details attribute | [View](./v8-1-0.md) |
