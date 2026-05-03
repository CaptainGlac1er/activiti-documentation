---
sidebar_label: Management Service
slug: /api-reference/engine-api/management-service
title: "Management Service"
description: Reference documentation for the Activiti ManagementService - engine administration and maintenance operations.
---

# Management Service
The `ManagementService` provides administrative and maintenance operations for the Activiti process engine. These operations are typically used in operational consoles, monitoring tools, and for engine administration rather than in workflow-driven applications.

## Table of Contents

- [Overview](#overview)
- [Job Management](#job-management)
- [Engine Metrics](#engine-metrics)
- [Database Operations](#database-operations)
- [Performance Monitoring](#performance-monitoring)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

```java
ManagementService managementService = processEngine.getManagementService();
```

**Key Capabilities:**
- Database schema inspection and table metadata
- Job management (query, execute, delete, retry)
- Timer job operations
- Dead letter job handling
- Event log access
- Custom SQL execution
- Engine properties management

---

## Database Operations

### Get Table Counts

Retrieve the row count for each Activiti database table:

```java
Map<String, Long> tableCounts = managementService.getTableCount();

for (Map.Entry<String, Long> entry : tableCounts.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}
```

**Returns:** Map of `{table name, row count}` entries

### Get Table Name

Get the actual table name (including any configured prefix) for an Activiti entity:

```java
String taskTableName = managementService.getTableName(Task.class);
String executionTableName = managementService.getTableName(Execution.class);
```

**Returns:** Fully qualified table name

### Get Table Metadata

Retrieve detailed metadata (column names, types, etc.) for a specific table:

```java
TableMetaData metaData = managementService.getTableMetaData("ACT_RU_TASK");

if (metaData != null) {
    for (TableColumn column : metaData.getColumns()) {
        System.out.println(column.getName() + " - " + column.getType());
    }
}
```

**Returns:** `TableMetaData` or `null` if table doesn't exist

### Query Table Pages

Fetch paginated sections of table data:

```java
TablePageQuery tablePageQuery = managementService.createTablePageQuery();

TablePage<Task> taskPage = tablePageQuery
    .tableName("ACT_RU_TASK")
    .firstPage()
    .query();

for (Task task : taskPage.getResults()) {
    System.out.println(task.getName());
}
```

---

## Job Management

For detailed information about async execution, job architecture, and configuration, see [Async Execution](./async-execution.md).

### Query Jobs

Create and execute job queries:

```java
JobQuery jobQuery = managementService.createJobQuery();

// Query all jobs
List<Job> allJobs = jobQuery.list();

// Query jobs for specific process instance
List<Job> processJobs = jobQuery
    .processInstanceId("process-instance-id")
    .list();

// Query failed jobs
List<Job> failedJobs = jobQuery
    .withException()
    .list();

// Query jobs with exception message
List<Job> jobsWithException = jobQuery
    .exceptionMessage("NullPointerException")
    .list();

// Query unlocked jobs only
List<Job> unlockedJobs = jobQuery
    .unlocked()
    .list();
```

**Available Filters:**
- `jobId(String)` - Specific job ID
- `processInstanceId(String)` - Process instance
- `executionId(String)` - Execution ID
- `processDefinitionId(String)` - Process definition
- `timers()` - Timer jobs only
- `messages()` - Message jobs only
- `duedateLowerThan(Date)` - Due date filter
- `duedateHigherThan(Date)` - Due date filter
- `withException()` - Failed jobs
- `exceptionMessage(String)` - Exception message
- `locked()` / `unlocked()` - Lock status
- `jobTenantId(String)` - Tenant ID

**Sorting:**
- `orderByJobId()`
- `orderByJobDuedate()`
- `orderByJobRetries()`
- `orderByProcessInstanceId()`
- `orderByExecutionId()`
- `orderByTenantId()`

**See also:** [Async Execution - Job Management](./async-execution.md#querying-jobs) for monitoring and analysis examples.

### Execute a Job

Force synchronous execution of a specific job (useful for testing or administration):

```java
// Execute a single job by ID
managementService.executeJob("job-id-123");
```

**Note:** This executes **one specific job**, not all jobs. The job will execute even if the process definition/instance is suspended.

**Throws:** `ActivitiObjectNotFoundException` if job doesn't exist

### Delete Jobs

Remove jobs from the system:

```java
// Delete a regular job
managementService.deleteJob("job-id-123");

// Delete a timer job
managementService.deleteTimerJob("timer-job-id-456");

// Delete a dead letter job
managementService.deleteDeadLetterJob("dead-letter-job-id-789");
```

**Throws:** `ActivitiObjectNotFoundException` if job doesn't exist

### Set Job Retries

Modify the number of retries for a job:

```java
// Increase retries for a failing job
managementService.setJobRetries("job-id-123", 5);

// Set retries for a timer job
managementService.setTimerJobRetries("timer-job-id-456", 3);
```

**Use Case:** When a job has failed and reached 0 retries, use this to give it more attempts.

### Get Job Exception Stacktrace

Retrieve the exception stacktrace from a failed job:

```java
// Get stacktrace for regular job
String stacktrace = managementService.getJobExceptionStacktrace("job-id-123");

// Get stacktrace for timer job
String timerStacktrace = managementService.getTimerJobExceptionStacktrace("timer-job-id-456");

// Get stacktrace for suspended job
String suspendedStacktrace = managementService.getSuspendedJobExceptionStacktrace("suspended-job-id-789");

// Get stacktrace for dead letter job
String deadLetterStacktrace = managementService.getDeadLetterJobExceptionStacktrace("dead-letter-job-id-101");
```

**Returns:** Full stacktrace string or `null` if no exception

---

## Timer Job Operations

### Query Timer Jobs

```java
TimerJobQuery timerJobQuery = managementService.createTimerJobQuery();

List<TimerJob> timerJobs = timerJobQuery
    .processInstanceId("process-id")
    .list();
```

### Move Timer to Executable Job

Move a timer job to the executable job table:

```java
Job executableJob = managementService.moveTimerToExecutableJob("timer-job-id-123");
```

**Use Case:** Force immediate execution of a timer job.

**Throws:** `ActivitiObjectNotFoundException` if timer job doesn't exist

---

## Dead Letter Job Operations

### Query Dead Letter Jobs

```java
DeadLetterJobQuery deadLetterQuery = managementService.createDeadLetterJobQuery();

List<Job> deadLetterJobs = deadLetterQuery
    .processInstanceId("process-id")
    .list();
```

### Move Job to Dead Letter

Manually move a job to the dead letter table:

```java
Job deadLetterJob = managementService.moveJobToDeadLetterJob("job-id-123");
```

**Use Case:** Move a problematic job to dead letter for later analysis.

**Throws:** `ActivitiObjectNotFoundException` if job doesn't exist

### Move Dead Letter to Executable

Restore a dead letter job back to executable status:

```java
Job restoredJob = managementService.moveDeadLetterJobToExecutableJob("dead-letter-job-id", 3);
```

**Parameters:**
- `jobId` - ID of the dead letter job
- `retries` - Number of retries to set (must be > 0)

**Throws:** `ActivitiObjectNotFoundException` if job doesn't exist

---

## Suspended Job Operations

### Query Suspended Jobs

```java
SuspendedJobQuery suspendedQuery = managementService.createSuspendedJobQuery();

List<SuspendedJob> suspendedJobs = suspendedQuery.list();
```

---

## Event Log Operations

### Get Event Log Entries

Retrieve engine event log entries (requires event logging enabled in configuration):

```java
// Get all event log entries (use with caution - can be huge!)
List<EventLogEntry> allEvents = managementService.getEventLogEntries(null, null);

// Get paginated events
List<EventLogEntry> events = managementService.getEventLogEntries(0L, 100L);

// Get events for specific process instance
List<EventLogEntry> processEvents = managementService.getEventLogEntriesByProcessInstanceId("process-instance-id");
```

**Parameters:**
- `startLogNr` - Starting log number (null for beginning)
- `pageSize` - Number of entries to return (null for all)

### Delete Event Log Entry

Remove a specific event log entry (typically for testing):

```java
managementService.deleteEventLogEntry(12345L);
```

**Warning:** Deleting log entries defeats the purpose of event logging.

---

## Engine Properties

### Get Properties

Retrieve engine configuration properties:

```java
Map<String, String> properties = managementService.getProperties();

for (Map.Entry<String, String> entry : properties.entrySet()) {
    System.out.println(entry.getKey() + " = " + entry.getValue());
}
```

---

## Custom Command Execution

### Execute Custom Command

Run a custom command with the engine:

```java
// Execute with default configuration
CustomResult result = managementService.executeCommand(new CustomCommand<CustomResult>() {
    @Override
    public CustomResult execute(CommandContext commandContext) {
        // Your custom logic here
        return new CustomResult();
    }
});

// Execute with specific configuration
CustomResult result = managementService.executeCommand(
    new CommandConfig(),
    new CustomCommand<CustomResult>() {
        @Override
        public CustomResult execute(CommandContext commandContext) {
            return new CustomResult();
        }
    }
);
```

### Execute Custom SQL

Run custom SQL queries:

```java
List<Map<String, Object>> results = managementService.executeCustomSql(
    new CustomSqlExecution<Map<String, Object>, List<Map<String, Object>>>() {
        @Override
        public String getSql() {
            return "SELECT * FROM ACT_RU_TASK WHERE ASSIGNEE_ = 'john'";
        }

        @Override
        public List<Map<String, Object>> map(ResultSet resultSet) throws SQLException {
            // Map result set to desired format
            List<Map<String, Object>> results = new ArrayList<>();
            while (resultSet.next()) {
                Map<String, Object> row = new HashMap<>();
                row.put("TASK_ID", resultSet.getString("ID_"));
                row.put("TASK_NAME", resultSet.getString("NAME_"));
                results.add(row);
            }
            return results;
        }
    }
);
```

---

## Database Schema Upgrade

Perform programmatic schema upgrade:

```java
try (Connection connection = dataSource.getConnection()) {
    String upgradeResult = managementService.databaseSchemaUpgrade(connection, null, null);
    System.out.println("Schema upgrade result: " + upgradeResult);
}
```

**Parameters:**
- `connection` - JDBC connection
- `catalog` - Database catalog (optional)
- `schema` - Database schema (optional)

---

## Engine Metrics

### Job Execution Metrics

Track job execution performance:

```java
public void monitorFailedJobs(ManagementService managementService) {
    List<Job> failedJobs = managementService.createJobQuery()
        .withException()
        .list();

    for (Job job : failedJobs) {
        System.out.println("Failed Job: " + job.getId());
        System.out.println("Exception: " + managementService.getJobExceptionStacktrace(job.getId()));
        System.out.println("Retries: " + job.getRetries());
    }
}
```

### 2. Retry Failed Jobs

```java
public void retryFailedJobs(ManagementService managementService, int maxRetries) {
    List<Job> failedJobs = managementService.createJobQuery()
        .withException()
        .list();

    for (Job job : failedJobs) {
        if (job.getRetries() < maxRetries) {
            managementService.setJobRetries(job.getId(), job.getRetries() + 1);
            System.out.println("Retries set for job: " + job.getId());
        }
    }
}
```

### 3. Database Health Check

```java
public Map<String, Long> getDatabaseHealth(ManagementService managementService) {
    Map<String, Long> tableCounts = managementService.getTableCount();

    // Check for unusually high counts
    for (Map.Entry<String, Long> entry : tableCounts.entrySet()) {
        if (entry.getValue() > 1000000) {
            System.err.println("Table " + entry.getKey() + " has " + entry.getValue() + " rows");
        }
    }

    return tableCounts;
}
```

### 4. Clean Up Old Dead Letter Jobs

```java
public void cleanupOldDeadLetterJobs(ManagementService managementService, Date cutoffDate) {
    List<Job> deadLetterJobs = managementService.createDeadLetterJobQuery()
        .list();

    for (Job job : deadLetterJobs) {
        if (job.getCreateTime().before(cutoffDate)) {
            managementService.deleteDeadLetterJob(job.getId());
            System.out.println("Deleted old dead letter job: " + job.getId());
        }
    }
}
```

### 5. Move Timer Job for Immediate Execution

```java
public void executeTimerJobNow(ManagementService managementService, String timerJobId) {
    try {
        Job executableJob = managementService.moveTimerToExecutableJob(timerJobId);
        managementService.executeJob(executableJob.getId());
        System.out.println("Timer job executed immediately");
    } catch (ActivitiObjectNotFoundException e) {
        System.err.println("Timer job not found: " + timerJobId);
    }
}
```

---

## API Reference

### Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getTableCount()` | Get row counts for all tables | `Map<String, Long>` |
| `getTableName(Class<?>)` | Get table name for entity | `String` |
| `getTableMetaData(String)` | Get table column metadata | `TableMetaData` |
| `createTablePageQuery()` | Create paginated table query | `TablePageQuery` |

### Job Query Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `createJobQuery()` | Query executable jobs | `JobQuery` |
| `createTimerJobQuery()` | Query timer jobs | `TimerJobQuery` |
| `createSuspendedJobQuery()` | Query suspended jobs | `SuspendedJobQuery` |
| `createDeadLetterJobQuery()` | Query dead letter jobs | `DeadLetterJobQuery` |

### Job Execution Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `executeJob(String)` | Execute specific job | `void` |
| `moveTimerToExecutableJob(String)` | Move timer to executable | `Job` |
| `moveJobToDeadLetterJob(String)` | Move job to dead letter | `Job` |
| `moveDeadLetterJobToExecutableJob(String, int)` | Restore dead letter job | `Job` |

### Job Management Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `deleteJob(String)` | Delete executable job | `void` |
| `deleteTimerJob(String)` | Delete timer job | `void` |
| `deleteDeadLetterJob(String)` | Delete dead letter job | `void` |
| `setJobRetries(String, int)` | Set job retry count | `void` |
| `setTimerJobRetries(String, int)` | Set timer job retry count | `void` |

### Exception Inspection Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getJobExceptionStacktrace(String)` | Get job exception | `String` |
| `getTimerJobExceptionStacktrace(String)` | Get timer job exception | `String` |
| `getSuspendedJobExceptionStacktrace(String)` | Get suspended job exception | `String` |
| `getDeadLetterJobExceptionStacktrace(String)` | Get dead letter job exception | `String` |

### Event Log Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getEventLogEntries(Long, Long)` | Get event log entries | `List<EventLogEntry>` |
| `getEventLogEntriesByProcessInstanceId(String)` | Get events for process | `List<EventLogEntry>` |
| `deleteEventLogEntry(long)` | Delete event log entry | `void` |

### Advanced Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getProperties()` | Get engine properties | `Map<String, String>` |
| `executeCommand(Command<T>)` | Execute custom command | `T` |
| `executeCommand(CommandConfig, Command<T>)` | Execute with config | `T` |
| `executeCustomSql(CustomSqlExecution)` | Execute custom SQL | `ResultType` |
| `databaseSchemaUpgrade(Connection, String, String)` | Upgrade schema | `String` |

---

## Important Notes

### Best Practices

1. **Use for Administration Only** - ManagementService is for ops/maintenance, not workflow logic
2. **Query Before Delete** - Always verify jobs exist before deletion
3. **Handle Exceptions** - Catch `ActivitiObjectNotFoundException`
4. **Paginate Large Queries** - Use page/size for table queries
5. **Monitor Dead Letter** - Regularly check and handle dead letter jobs
6. **Event Logging** - Enable through engine configuration if you need audit trails; see [Engine Configuration](../../configuration.md) for details

---

## Configuration

Event logging can be enabled in `ProcessEngineConfiguration` through the appropriate configuration mechanism. Consult the [Engine Configuration](../../configuration.md) documentation for available options.

---

## See Also

- [History Service](./history-service.md) - Historical data queries
- [Runtime Service](./runtime-service.md) - Process execution
- [Engine Configuration](../../configuration.md) - Setup and configuration

---

**Source:** `org.activiti.engine.ManagementService`  
