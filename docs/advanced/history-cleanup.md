---
sidebar_label: History Cleanup and Data Retention
slug: /advanced/history-cleanup
title: "History Cleanup and Data Retention"
description: "Managing history data growth in Activiti — cleanup strategies, retention policies, history levels, and archival approaches."
---

# History Cleanup and Data Retention

Activiti's history tables grow continuously as processes execute. Without cleanup, `ACT_HI_*` tables can become a significant storage and performance burden. This guide covers history levels, cleanup APIs, and retention strategies.

> **Important: with Spring Boot, the history tables are disabled by default.** `spring.activiti.db-history-used` defaults to **false** (the engine's own `isDbHistoryUsed` default is `true`), so a default Spring Boot application does not create or use any `ACT_HI_*` tables at all. Enable history with `spring.activiti.db-history-used: true` and set `spring.activiti.history-level` explicitly (the starter defaults it to `NONE`) before applying the cleanup guidance on this page. See [Spring Boot Starter](../api-reference/engine-api/spring-boot-starter.mdx) for the property reference.

## History Levels Recap

Activiti supports four history levels that control what data is persisted:

| Level | Activities | Tasks | Variables | Details (variable updates) |
|-------|-----------|-------|-----------|----------------------------|
| `NONE` | No | No | No | No |
| `ACTIVITY` | Yes | No | Yes | No |
| `AUDIT` | Yes | Yes | Yes | No |
| `FULL` | Yes | Yes | Yes (all updates) | Yes (all updates) |

Configuration:

```java
ProcessEngineConfiguration config = ...;
config.setHistoryLevel(HistoryLevel.FULL);
```

```yaml
spring:
  activiti:
    history-level: FULL
```

**Lower history levels reduce storage growth but limit audit capability.** Choose based on compliance requirements.

> **Note on the default:** the engine's `ProcessEngineConfiguration` defaults to `audit`. However, the Spring Boot starter (`ActivitiProperties`) defaults `historyLevel` to `NONE` unless you explicitly set `spring.activiti.history-level`. Configure it explicitly in Spring Boot apps.

## Cleanup API

### Deleting Historic Process Instances

```java
// Delete a single historic process instance
historyService.deleteHistoricProcessInstance(processInstanceId);

// Cascades to:
// - HistoricActivityInstance
// - HistoricTaskInstance
// - HistoricVariableInstance
// - HistoricDetail
// - HistoricIdentityLink
// - Task and process comments (ACT_HI_COMMENT)
// - Sub-process historic instances (recurses into children)
```

`deleteHistoricProcessInstance` cascades to all child history records for that instance. It removes entries from `ACT_HI_PROCINST`, `ACT_HI_ACTINST`, `ACT_HI_TASKINST`, `ACT_HI_VARINST`, `ACT_HI_DETAIL`, `ACT_HI_IDENTITYLINK`, and `ACT_HI_COMMENT` (comments), and recurses into sub-process historic instances, deleting their history as well.

### Deleting Historic Task Instances

```java
// Delete a single historic task
historyService.deleteHistoricTaskInstance(historicTaskInstanceId);
```

## Automated Cleanup Strategies

### Strategy 1: Scheduled Batch Deletion

Implement a periodic cleanup job that deletes completed processes older than a retention period:

```java
public class HistoryCleanupJob {

    @Scheduled(cron = "0 0 2 * * ?") // Run daily at 2 AM
    public void cleanup() {
        // Find completed processes older than 90 days
        List<HistoricProcessInstance> oldInstances =
            historyService.createHistoricProcessInstanceQuery()
                .finished()
                .orderByProcessInstanceEndTime()
                .asc()
                .listPage(0, 500);

        for (HistoricProcessInstance instance : oldInstances) {
            Date endTime = instance.getEndTime();
            if (isOlderThan(endTime, 90, TimeUnit.DAYS)) {
                historyService.deleteHistoricProcessInstance(instance.getId());
            } else {
                break; // Sorted ascending, remaining are recent
            }
        }
    }

    private boolean isOlderThan(Date date, long amount, TimeUnit unit) {
        return System.currentTimeMillis() - date.getTime() > unit.toMillis(amount);
    }
}
```

### Strategy 2: Native Query Batch Delete

For large tables, direct SQL is more efficient than row-by-row Java deletion:

```java
public void batchDeleteOldHistory(long daysRetention) {
    String cutoffDate = String.valueOf(
        new Date(System.currentTimeMillis() - TimeUnit.DAYS.toMillis(daysRetention)));

    String sql =
        "SELECT ID_ FROM ACT_HI_PROCINST " +
        "WHERE END_TIME_ IS NOT NULL " +
        "AND END_TIME_ < #{cutoffDate} " +
        "LIMIT 1000";

    List<String> ids = historyService.createNativeHistoricProcessInstanceQuery()
        .sql(sql)
        .parameter("cutoffDate", cutoffDate)
        .list()
        .stream()
        .map(HistoricProcessInstance::getId)
        .collect(Collectors.toList());

    for (String id : ids) {
        historyService.deleteHistoricProcessInstance(id);
    }
}
```

### Strategy 3: Database-Level Partitioning

For very high-volume deployments, use database partitioning on `END_TIME_`:

```sql
-- PostgreSQL example: monthly partitions
CREATE TABLE act_hi_procinst_y2025m01
  PARTITION OF act_hi_procinst
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Drop old partitions instead of row deletion
DROP TABLE act_hi_procinst_y2023m01;
```

This avoids the overhead of cascading deletes and vacuuming on large tables.

## Data Retention Policy Template

```yaml
# Example retention policy
history-retention:
  completed-processes: 90 days
  activity-logs: 180 days
  variable-updates: 90 days
  detail-records: 30 days
  event-log: 365 days
```

## Performance Considerations

- **Batch size**: Delete in batches of 100–500 to avoid long-running transactions and lock contention
- **Off-peak scheduling**: Run cleanup during low-traffic periods
- **Index maintenance**: Large deletes can fragment indexes; consider periodic reindexing
- **History level choice**: If full audit trails aren't needed, use `ACTIVITY` level to reduce data by ~60%
- **Event log separate from history**: `ACT_EVT_LOG` entries are not affected by `deleteHistoricProcessInstance` — manage separately

## Monitoring History Growth

Query table sizes to track growth:

```java
// Get table metadata (column info)
TableMetaData procInstMeta = managementService.getTableMetaData("ACT_HI_PROCINST");

// Query table row data in pages
TablePage procInstPage = managementService.createTablePageQuery()
    .tableName("ACT_HI_PROCINST")
    .listPage(0, 1);
```

Or use database-specific queries:

```sql
-- PostgreSQL
SELECT pg_size_pretty(pg_total_relation_size('act_hi_procinst'));

-- MySQL
SELECT table_name, ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'activiti'
  AND table_name LIKE 'act_hi_%'
ORDER BY size_mb DESC;
```

## Common Pitfalls

- **Deleting while processes run**: Only delete `finished` instances. Running processes may still write history.
- **Transaction timeouts**: Large batch deletes can exceed transaction timeouts. Use smaller batches.
- **Foreign key constraints**: Ensure deletion order respects parent-child relationships, or use `deleteHistoricProcessInstance` which handles cascading.
- **Event log not cleaned**: `ACT_EVT_LOG` persists independently of history level. Manage with a separate cleanup.
- **Binary variables**: Large `ByteArrayEntity` references in `ACT_HI_VARINST` need cleanup when the variable is deleted.

## Related Documentation

- [Database Schema](./database-schema.md) — `ACT_HI_*` table references
- [History Service](../api-reference/engine-api/history-service.md) — Full query and deletion API
- [Management Service](./management-service.md) — Table metadata and admin operations
- [Engine Configuration](../configuration.md) — History level configuration
- [Native SQL Queries](./native-queries.md) — Efficient bulk operations
