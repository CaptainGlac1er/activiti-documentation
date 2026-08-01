---
sidebar_label: Process Engine Bootstrap
slug: /api-reference/engine-api/process-engine-bootstrap
title: "Process Engine Bootstrap"
description: "Creating, configuring, and managing the lifecycle of the Activiti ProcessEngine - including the ProcessEngines registry for standalone (non-Spring) usage."
---

# Process Engine Bootstrap

This page covers the lifecycle of the `ProcessEngine` itself: creating it from a configuration, registering it in the `ProcessEngines` static registry, and shutting it down. It focuses on **standalone (non-Spring Boot)** usage. If you are using Spring Boot, the starter creates and manages the engine for you via auto-configuration — see [Spring Boot Starter](./spring-boot-starter.mdx).

## Building the Engine

The entry point is `ProcessEngineConfiguration`. You build a `ProcessEngine` by obtaining a configuration factory method, customizing it, then calling `buildProcessEngine()`.

### Factory Methods

| Factory method | Description |
|----------------|-------------|
| `createStandaloneProcessEngineConfiguration()` | Standalone engine with a JDBC data source |
| `createStandaloneInMemProcessEngineConfiguration()` | In-memory engine, ideal for tests |
| `createProcessEngineConfigurationFromResourceDefault()` | Build from `activiti.cfg.xml` on the classpath |
| `createProcessEngineConfigurationFromResource(path)` | Build from a specific config resource |
| `createProcessEngineConfigurationFromResource(path, beanName)` | Build from a resource with a named bean |
| `createProcessEngineConfigurationFromInputStream(is)` | Build from an input stream |
| `createProcessEngineConfigurationFromInputStream(is, beanName)` | Build from an input stream with a named bean |

### Programmatic Standalone Engine

```java
ProcessEngine processEngine = ProcessEngineConfiguration
    .createStandaloneProcessEngineConfiguration()
    .setJdbcUrl("jdbc:h2:mem:activiti;DB_CLOSE_DELAY=1000")
    .setJdbcDriver("org.h2.Driver")
    .setJdbcUsername("sa")
    .setJdbcPassword("")
    .setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE)
    .buildProcessEngine();
```

### In-Memory Engine (Testing)

```java
ProcessEngine processEngine = ProcessEngineConfiguration
    .createStandaloneInMemProcessEngineConfiguration()
    .buildProcessEngine();
```

## Database Schema Management

The `setDatabaseSchemaUpdate` accepts string constants:

| Constant | Value | Behavior |
|----------|-------|----------|
| `DB_SCHEMA_UPDATE_FALSE` | `"false"` | No schema validation/creation |
| `DB_SCHEMA_UPDATE_TRUE` | `"true"` | Create/update tables automatically |
| `DB_SCHEMA_UPDATE_CREATE_DROP` | `"create-drop"` | Create on startup, drop on close |

> **Note:** The `true` and `create-drop` modes create tables using the **default names** regardless of any configured table prefix.

## ProcessEngine Services

Once built, the engine exposes all high-level services:

```java
RepositoryService repositoryService    = processEngine.getRepositoryService();
RuntimeService runtimeService          = processEngine.getRuntimeService();
TaskService taskService                = processEngine.getTaskService();
HistoryService historyService          = processEngine.getHistoryService();
ManagementService managementService    = processEngine.getManagementService();
DynamicBpmnService dynamicBpmnService  = processEngine.getDynamicBpmnService();
ProcessEngineConfiguration configuration = processEngine.getProcessEngineConfiguration();
```

## The ProcessEngines Registry

`ProcessEngines` is a static registry that caches process engines by name for server environments (e.g. a webapp). It has **no lazy initialization** — you must call `init()` or build/register engines yourself before use.

```java
// Initialize all engines found by activiti.cfg.xml resources on the classpath
ProcessEngines.init();

// Retrieve the default engine
ProcessEngine engine = ProcessEngines.getDefaultProcessEngine();

// Retrieve a named engine
ProcessEngine engine = ProcessEngines.getProcessEngine("myEngine");

// All registered engines
Map<String, ProcessEngine> engines = ProcessEngines.getProcessEngines();
```

### Registering a Manually-Built Engine

```java
ProcessEngines.registerProcessEngine(processEngine);
// ... use ...
ProcessEngines.unregister(processEngine);
```

Engines registered this way are closed when `ProcessEngines.destroy()` is called.

### Engine Info

`ProcessEngines` tracks initialization results:

```java
List<ProcessEngineInfo> infos = ProcessEngines.getProcessEngineInfos();
ProcessEngineInfo info = ProcessEngines.getProcessEngineInfo("myEngine");
```

## Lifecycle & Shutdown

Always close the engine to release database connections and executor threads:

```java
// Close a single engine
processEngine.close();

// Close all registered engines and reset the registry
ProcessEngines.destroy();
```

- `close()` releases resources held by that engine.
- `ProcessEngines.destroy()` closes every engine that was registered via `init()` or `registerProcessEngine(...)`.

## Related Documentation

- [Engine Configuration](../../configuration.md) — detailed `ProcessEngineConfiguration` properties
- [Engine Overview](./engine-core.mdx) — the engine module as a whole
- [Spring Boot Starter](./spring-boot-starter.mdx) — Spring-managed engine lifecycle
- [Repository Service](./repository-service.md) — services you use after bootstrap

---
