---
sidebar_label: Overview
slug: /api-reference/activiti-api/overview
title: "Activiti API Reference"
description: "Complete overview of Activiti API modules for process and task management with type-safe interfaces and Spring integration."
---

# Activiti API Reference

The Activiti API provides a modern, type-safe interface for process automation, enabling developers to build robust workflow solutions with clean, intuitive APIs. This API layer sits above the Engine API and is the **recommended approach** for Activiti 8 development.

> **Note:** The Activiti API (ProcessRuntime, TaskRuntime) is the preferred way to interact with Activiti 8. The Engine API (RepositoryService, RuntimeService, etc.) is still available for legacy compatibility but new projects should use the Activiti API.

## Modules

| Module | Description | Documentation |
|--------|-------------|---------------|
| **Model Shared** | Shared data models | [View](./model-shared.mdx) |
| **Process Model** | Process definition models | [View](./process-model.mdx) |
| **Process Runtime** | Process execution APIs | [View](./process-runtime.mdx) |
| **Runtime Shared** | Shared runtime interfaces | [View](./runtime-shared.mdx) |
| **Task Model** | Task definition models | [View](./task-model.mdx) |
| **Task Runtime** | Task management APIs | [View](./task-runtime.mdx) |
| **API Implementation** | Implementation details | [View](./api-implementation.md) |

## Key Features

- **Type Safety**: Full Java type definitions with payload builders for compile-time safety
- **Modern API**: Clean, intuitive interfaces using the builder pattern
- **Extensible**: Easy to customize and extend with listeners and delegates
- **Spring Integration**: Seamless Spring Boot support with auto-configuration

## Architecture

The Activiti API follows a layered architecture:

```
Application Code
    ↓
Activiti API (ProcessRuntime, TaskRuntime)
    ↓
Activiti API Implementation
    ↓
Engine API (RepositoryService, RuntimeService, TaskService)
    ↓
Activiti Engine Core
```

## Getting Started

1. Choose your API: **Process** or **Task**
2. Review the **Model** documentation for data structures
3. Check **Runtime** for execution APIs
4. See **Implementation** for integration details

## Quick Example

```java
@Autowired
private ProcessRuntime processRuntime;

public ProcessInstance startProcess() {
    return processRuntime.start(
        ProcessPayloadBuilder
            .start()
            .withProcessDefinitionKey("my-process")
            .withVariable("name", "value")
            .build()
    );
}
```

---

**Related:**
- [Core Common APIs](../core-common/)
- [Engine API](../engine-api/)
- [Architecture Overview](../../architecture/overview.md)
