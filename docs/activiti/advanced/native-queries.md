---
sidebar_label: Native SQL Queries
slug: /advanced/native-queries
title: "Native SQL Queries"
description: "Write custom SQL against Activiti database tables for advanced querying, reporting, and joins with application tables."
---

# Native SQL Queries

Native queries let you write **arbitrary SQL** against Activiti's database tables. This bypasses the typed query API and is essential for complex reporting, joining Activiti tables with application tables, and performance-critical scenarios where the typed API cannot express the needed logic.

## Available Native Query Types

Every engine service provides native query factory methods:

### RuntimeService

| Method | Interface | Use |
|--------|-----------|-----|
| `createNativeExecutionQuery()` | `NativeExecutionQuery` | Custom queries on `ACT_RU_EXECUTION` |
| `createNativeProcessInstanceQuery()` | `NativeProcessInstanceQuery` | Custom queries on `ACT_RU_EXECUTION` (root instances) |

### TaskService

| Method | Interface | Use |
|--------|-----------|-----|
| `createNativeTaskQuery()` | `NativeTaskQuery` | Custom queries on `ACT_RU_TASK` |

### RepositoryService

| Method | Interface | Use |
|--------|-----------|-----|
| `createNativeProcessDefinitionQuery()` | `NativeProcessDefinitionQuery` | Custom queries on `ACT_RE_PROCDEF` |
| `createNativeDeploymentQuery()` | `NativeDeploymentQuery` | Custom queries on `ACT_RE_DEPLOYMENT` |
| `createNativeModelQuery()` | `NativeModelQuery` | Custom queries on `ACT_RE_MODEL` |

### HistoryService

| Method | Interface | Use |
|--------|-----------|-----|
| `createNativeHistoricProcessInstanceQuery()` | `NativeHistoricProcessInstanceQuery` | Custom queries on `ACT_HI_PROCINST` |
| `createNativeHistoricActivityInstanceQuery()` | `NativeHistoricActivityInstanceQuery` | Custom queries on `ACT_HI_ACTINST` |
| `createNativeHistoricTaskInstanceQuery()` | `NativeHistoricTaskInstanceQuery` | Custom queries on `ACT_HI_TASKINST` |
| `createNativeHistoricVariableInstanceQuery()` | `NativeHistoricVariableInstanceQuery` | Custom queries on `ACT_HI_VARINST` |
| `createNativeHistoricDetailQuery()` | `NativeHistoricDetailQuery` | Custom queries on `ACT_HI_DETAIL` |

## API

Each native query provides:

```java
NativeTaskQuery query = taskService.createNativeTaskQuery();

// Set raw SQL
query.sql("SELECT T.ID_ FROM ACT_RU_TASK T WHERE T.NAME_ LIKE #{taskNamePattern}");

// Bind parameters with #{name} syntax
query.parameter("taskNamePattern", "approval%");

// Results
List<Task> tasks = query.list();
long count = query.count();
Task single = query.singleResult();
List<Task> page = query.listPage(0, 50);
```

### Methods

| Method | Description |
|--------|-------------|
| `.sql(String sql)` | Set the raw SQL query |
| `.parameter(String name, Object value)` | Bind a parameter value for `#{name}` substitution |
| `.list()` | Execute and return all results |
| `.count()` | Execute and return result count |
| `.singleResult()` | Execute and return one result (returns `null` if 0, throws if >1) |
| `.listPage(int firstResult, int maxResults)` | Paginated results |

## Discovering Table Names

Activiti table names may include schema prefixes or custom naming. Use `ManagementService` to discover actual table names at runtime:

```java
String taskTable = managementService.getTableName(TaskEntity.class);
String procDefTable = managementService.getTableName(ProcessDefinitionEntity.class);
```

This is the portable way to reference Activiti tables without hardcoding names.

## Examples

### Join Activiti Tasks with Application Data

```java
String sql =
    "SELECT T.* FROM ACT_RU_TASK T " +
    "JOIN orders O ON T.PROC_INST_ID_ = O.process_instance_id " +
    "WHERE O.customer_id = #{customerId} " +
    "AND T.ASSIGNEE_ = #{assignee}";

List<Task> tasks = taskService.createNativeTaskQuery()
    .sql(sql)
    .parameter("customerId", "CUST-42")
    .parameter("assignee", "jsmith")
    .list();
```

### Count Running Processes by Definition Key

```java
String sql =
    "SELECT COUNT(*) FROM ACT_RU_EXECUTION E " +
    "JOIN ACT_RE_PROCDEF P ON E.PROC_DEF_ID_ = P.ID_ " +
    "WHERE P.KEY_ = #{processKey} " +
    "AND E.SUPER_EXEC_ IS NULL";

long count = runtimeService.createNativeProcessInstanceQuery()
    .sql(sql)
    .parameter("processKey", "orderManagement")
    .count();
```

### Paginated History Query

```java
String sql =
    "SELECT H.* FROM ACT_HI_PROCINST H " +
    "WHERE H.END_TIME_ IS NOT NULL " +
    "AND H.DURATION_ > #{minDuration} " +
    "ORDER BY H.END_TIME_ DESC";

List<HistoricProcessInstance> recent =
    historyService.createNativeHistoricProcessInstanceQuery()
        .sql(sql)
        .parameter("minDuration", 86400000) // 24 hours in ms
        .listPage(0, 100);
```

### Dynamic Table Name with ManagementService

```java
String taskTable = managementService.getTableName(TaskEntity.class);
String executionTable = managementService.getTableName(ExecutionEntity.class);

String sql =
    "SELECT T.* FROM " + taskTable + " T " +
    "JOIN " + executionTable + " E ON T.PROC_INST_ID_ = E.ID_ " +
    "WHERE E.BUSINESS_KEY_ = #{businessKey}";

List<Task> tasks = taskService.createNativeTaskQuery()
    .sql(sql)
    .parameter("businessKey", "ORD-12345")
    .list();
```

## SQL Injection Warning

Native queries use `#{parameterName}` substitution, **not** string concatenation. Always use parameters for user-controlled values:

```java
// CORRECT — parameterized
query.sql("SELECT * FROM ACT_RU_TASK WHERE ASSIGNEE_ = #{assignee}")
     .parameter("assignee", userInput);

// DANGEROUS — string concatenation
query.sql("SELECT * FROM ACT_RU_TASK WHERE ASSIGNEE_ = '" + userInput + "'");
```

## Database Portability

Native queries write raw SQL, which may differ between databases:

- **MySQL**: backtick quoting, `LIMIT` syntax
- **PostgreSQL**: double-quote identifiers, `LIMIT` syntax
- **Oracle**: `ROWNUM` for pagination, different date functions
- **SQL Server**: `TOP` for limits, different date functions

Consider these factors when writing queries for multi-database deployments.

## When to Use Native Queries

| Scenario | Use Native Query? |
|----------|-------------------|
| Simple filtering by known fields | No — use typed API |
| Joining Activiti tables with application tables | **Yes** |
| Complex aggregations across history | **Yes** |
| Database-specific optimization | **Yes** |
| Full-text search on process variables | **Yes** |
| Standard task/process queries | No — typed API is sufficient |

## Related Documentation

- [Task Service](../api-reference/engine-api/task-service.md) — Typed task query API
- [Runtime Service](../api-reference/engine-api/runtime-service.md) — Typed execution and process instance queries
- [Repository Service](../api-reference/engine-api/repository-service.md) — Typed process definition and deployment queries
- [History Service](../api-reference/engine-api/history-service.md) — Typed historic queries
- [Management Service](./management-service.md) — Table name discovery and admin operations
- [Database Schema](./database-schema.md) — Table reference with columns and relationships
