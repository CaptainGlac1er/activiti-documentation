---
sidebar_label: Optimistic Locking and Concurrency
slug: /advanced/optimistic-locking
title: "Optimistic Locking and Concurrency"
description: "How Activiti handles concurrent access, optimistic locking exceptions, automatic retries, and configuration for high-throughput environments."
---

# Optimistic Locking and Concurrency

Activiti uses **revision-based optimistic locking** to handle concurrent access to workflow data. Every persistent entity tracks a `rev_` column that is incremented on each update. When two transactions attempt to modify the same entity simultaneously, the second one fails with `ActivitiOptimisticLockingException`.

## How It Works

```
Transaction A                          Transaction B
─────────────                          ─────────────
Read task (rev_ = 1)
                                       Read task (rev_ = 1)
Update task → rev_ = 2
  UPDATE ... WHERE rev_ = 1
  → 1 row updated ✓
                                       Update task → rev_ = 3
                                         UPDATE ... WHERE rev_ = 1
                                         → 0 rows updated
                                         → ActivitiOptimisticLockingException
```

The `DbSqlSession` checks the number of affected rows after each update. If `updatedRecords == 0`, it means another transaction modified the entity first, and `ActivitiOptimisticLockingException` is thrown.

## Automatic Retry: RetryInterceptor

The engine includes a `RetryInterceptor` in the command chain that **automatically retries** failed commands:

| Setting | Default | Description |
|---------|---------|-------------|
| `numOfRetries` | 3 | Number of retry attempts before giving up |
| `waitTimeInMs` | 50 | Initial wait time between retries (milliseconds) |
| `waitIncreaseFactor` | 5 | Exponential backoff multiplier |

The retry pattern is: **50ms → 250ms → 1250ms**. After 3 failed retries, the interceptor throws `ActivitiException("3 retries failed with ActivitiOptimisticLockingException. Giving up.")`.

### Configuring Retries

The `RetryInterceptor` is configured internally by the engine. Its default values (3 retries, 50ms base wait, 5x backoff factor) are built into the command interceptor chain and are not exposed as top-level configuration properties on `ProcessEngineConfiguration`.

For **async job retry** specifically (failed jobs that need to be retried after exceptions during execution), Spring Boot provides these properties:

```yaml
spring.activiti.async-executor:
  number-of-retries: 3            # max retries per failed job
  retry-wait-time-in-millis: 500  # wait time between job retries
```

These control the `AsyncExecutorProperties` which configure the async job executor's retry behavior — distinct from the `RetryInterceptor`'s optimistic-locking retry mechanism.

## JTA Transactions: JtaRetryInterceptor

When running inside a JTA transaction manager, Activiti uses `JtaRetryInterceptor` instead. It **disables automatic retries** because:

1. The first `ActivitiOptimisticLockingException` marks the JTA transaction as **rollback-only**
2. A retry within the same transaction would fail again
3. The application must handle retry at a higher level (e.g., Spring `@Retryable`)

`JtaRetryInterceptor` checks `transactionManager.getStatus() == Status.STATUS_NO_TRANSACTION`. If inside a transaction, it passes commands directly to the next interceptor without retry logic.

## Which Operations Can Fail

Any concurrent write to the same entity can trigger optimistic locking:

| Operation | Entity | Typical Cause |
|-----------|--------|---------------|
| `taskService.complete()` | `TaskEntity` | Two threads completing the same task |
| `taskService.setAssignee()` | `TaskEntity` | Concurrent claim/assignment |
| `runtimeService.setVariable()` | `VariableInstanceEntity` | Concurrent variable updates |
| `runtimeService.deleteProcessInstance()` | `ExecutionEntity` | Concurrent deletion |
| Async job execution | `JobEntity` | Multiple executor nodes acquiring same job |
| Timer job execution | `TimerJobEntity` | Clustered nodes racing on timer |

## Handling in Application Code

If you encounter `ActivitiOptimisticLockingException` at the application level (beyond the interceptor's retry limit), implement retry at your own layer:

```java
int attempts = 0;
int maxAttempts = 5;

while (attempts < maxAttempts) {
    try {
        taskService.complete(taskId, variables);
        break;
    } catch (ActivitiOptimisticLockingException e) {
        attempts++;
        if (attempts >= maxAttempts) throw e;
        Thread.sleep(100 * attempts); // exponential backoff
    }
}
```

With Spring:

```java
@Retryable(
    value = ActivitiOptimisticLockingException.class,
    maxAttempts = 5,
    backoff = @Backoff(delay = 100, multiplier = 5)
)
public void completeTask(String taskId, Map<String, Object> variables) {
    taskService.complete(taskId, variables);
}
```

## Clustered Deployments

In clustered environments, optimistic locking is expected behavior:

- **Async executor** — Multiple nodes compete for jobs. `AcquireAsyncJobsDueRunnable`, `AcquireTimerJobsRunnable`, and `ExecuteAsyncRunnable` all catch `ActivitiOptimisticLockingException` as normal and skip the conflicted job. The next acquisition cycle will pick it up.
- **Job locking** — Jobs have `lockOwner` and `lockExpirationTime` fields that prevent concurrent processing within the lock window. Optimistic locking handles race conditions outside the lock window.
- **Reducing conflicts** — Lower `maxAsyncJobsDuePerAcquisition` to reduce the number of jobs a single node tries to claim concurrently. Setting it to 1 eliminates job acquisition races but reduces throughput.

### Tuning for Clusters

The `AsyncExecutorProperties` class provides these relevant properties (prefix `spring.activiti.async-executor`):

```yaml
spring.activiti.async-executor:
  max-async-jobs-due-per-acquisition: 1  # lower = fewer conflicts (default: 1)
  timer-lock-time-in-millis: 300000       # job lock duration, ms (default: 5 min)
  async-job-lock-time-in-millis: 300000   # async job lock duration, ms (default: 5 min)
```

Lowering `max-async-jobs-due-per-acquisition` reduces the number of jobs a single node tries to claim concurrently, which reduces optimistic locking conflicts at the cost of throughput. Setting it to 1 eliminates acquisition races but processes jobs one at a time per node.

## Revision Column

The `rev_` column exists on all runtime entity tables:

| Table | Column |
|-------|--------|
| `ACT_RU_TASK` | `REV_` |
| `ACT_RU_EXECUTION` | `REV_` |
| `ACT_RU_VARIABLE` | `REV_` |
| `ACT_RU_JOB` | `REV_` |
| `ACT_RU_IDENTITYLINK` | `REV_` |
| `ACT_RU_EVENT_SUBSCR` | `REV_` |

All MyBatis update statements include `AND REV_ = ?` in the WHERE clause, ensuring the update only succeeds if no other transaction has modified the row.

## Related Documentation

- [Job Lifecycle & Recovery](./job-lifecycle.md) — Job states, failure handling, dead letter recovery
- [Async Execution](../bpmn/reference/async-execution.md) — Async boundaries and executor configuration
- [Multi-Tenancy](./multi-tenancy.md) — Tenant-aware async executors
- [Engine Configuration](../configuration.md) — Retry and executor tuning properties
