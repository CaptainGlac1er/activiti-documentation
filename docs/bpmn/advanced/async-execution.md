---
sidebar_label: Async Execution
slug: /bpmn/advanced/async-execution
title: "Async Execution"
description: "Complete guide to asynchronous execution in Activiti - background job processing, retry policies, and scalability optimization."
---

# Async Execution

Asynchronous execution allows activities to run in the **background** using Activiti's job executor, preventing blocking of process engine threads and improving scalability.

## Overview

```xml
<serviceTask id="asyncTask" 
             name="Background Task" 
             activiti:async="true"
             activiti:class="com.example.AsyncService"/>
```

**Key Benefits:**
- Non-blocking execution
- Better resource utilization
- Improved scalability
- Automatic retry on failure
- Job persistence across restarts

## When to Use Async

### **Use Async For:**
- Long-running operations (> 1 second)
- External system calls (APIs, databases)
- Batch processing
- Email/SMS notifications
- File processing
- Complex calculations
- Operations that may fail and need retry

### ❌ **Don't Use Async For:**
- Simple variable assignments
- Fast in-memory operations
- Critical path activities requiring immediate completion
- Operations that must complete within the same transaction

## Configuration

### Basic Async Task

```xml
<serviceTask id="asyncService" 
             name="Async Service" 
             activiti:async="true"
             activiti:class="com.example.MyService"/>
```

### Async with Retry Policy

```xml
<serviceTask id="retryableTask" 
             name="Retryable Task" 
             activiti:async="true">
  
  <!-- Retry 5 times immediately -->
  <activiti:property name="failedJobRetryTimeCycle" value="R/5"/>
  
</serviceTask>
```

### Async with Exponential Backoff

```xml
<serviceTask id="backoffTask" 
             name="Task with Backoff" 
             activiti:async="true">
  
  <!-- Retry with increasing intervals -->
  <activiti:property name="failedJobRetryTimeCycle" 
                     value="R3/PT1M;R2/PT5M;R1/PT30M"/>
  
</serviceTask>
```

**Retry Cycle Syntax:**
- `R/5` - Retry 5 times immediately
- `R3/PT1M` - Retry 3 times with 1 minute interval
- `R3/PT1M;R2/PT5M` - Retry 3 times (1min), then 2 times (5min)
- `R5/PT10S;R3/PT1M;R2/PT5M` - Progressive backoff strategy

## Async Execution Flow

```
Process Execution
       │
       ▼
┌─────────────────┐
│ Async Activity  │
│ activiti:async  │
│     =true       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Job Created     │
│ (Persisted to   │
│    Database)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process         │
│ Continues       │
│ (Non-blocking)  │
└─────────────────┘

         │
         ▼
┌─────────────────┐
│ Job Executor    │
│ (Background     │
│    Thread)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Job Executed    │
│ (Retry if fail) │
└─────────────────┘
```

## Async on Different Elements

### Service Task

```xml
<serviceTask id="asyncService" 
             name="Async Service" 
             activiti:async="true"
             activiti:class="com.example.ExternalApiService"/>
```

### User Task

```xml
<userTask id="asyncUserTask" 
          name="Async User Task" 
          activiti:async="true"
          activiti:assignee="${manager}"/>
```

### Script Task

```xml
<scriptTask id="asyncScript" 
            name="Async Script" 
            activiti:async="true"
            activiti:scriptFormat="javascript">
  <script>
    // Long-running script
  </script>
</scriptTask>
```

### Call Activity

```xml
<callActivity id="asyncCall" 
              name="Async SubProcess" 
              activiti:async="true"
              activiti:calledElement="subProcess"/>
```

### Business Rule Task

```xml
<businessRuleTask id="asyncRules" 
                  name="Async Rules" 
                  activiti:async="true"
                  activiti:implementation="dmn:complex-decision.dmn"/>
```

### Manual Task

```xml
<manualTask id="asyncManual" 
            name="Async Manual" 
            activiti:async="true"/>
```

### SubProcess

```xml
<subProcess id="asyncSubProcess" 
            name="Async SubProcess" 
            activiti:async="true">
  <startEvent id="subStart"/>
  <task id="subTask"/>
  <endEvent id="subEnd"/>
</subProcess>
```

## Async Executor Configuration

### Spring Boot Configuration

**Note:** Activiti 8 uses `AsyncExecutor` (not `JobExecutor` from older versions).

```yaml
# application.yml
spring:
  activiti:
    async-executor-activate: true  # Enable async executor (default: true)
    history-level: FULL            # History tracking level
    database-schema-update: true   # Auto-update database schema
    
    # Detailed async executor configuration
    async-executor:
      core-pool-size: 3            # Minimum threads (default: 2)
      max-pool-size: 10           # Maximum threads (default: 10)
      queue-size: 100             # Job queue size (default: 100)
      number-of-retries: 3        # Default retry count (default: 3)
      retry-wait-time-in-millis: 5000  # Wait between retries (default: 500)
      
      # Job acquisition settings
      max-async-jobs-due-per-acquisition: 10  # Jobs per query (default: 1)
      default-async-job-acquire-wait-time-in-millis: 10000  # Wait between queries (default: 10000)
      
      # Lock settings
      async-job-lock-time-in-millis: 300000  # Job lock time (default: 300000 = 5min)
      timer-lock-time-in-millis: 300000      # Timer lock time (default: 300000)
      
      # Advanced settings
      message-queue-mode: false  # Use message queue for distributed setup
      keep-alive-time: 5000      # Thread keep-alive (default: 5000)
      seconds-to-wait-on-shutdown: 60  # Graceful shutdown time (default: 60)
```

**Available Properties:**

**Basic (`spring.activiti`):**
- `async-executor-activate` - Enable async executor (default: true)
- `history-level` - History tracking (NONE, ACTIVITY, FULL)
- `database-schema-update` - Auto-update DB schema

**Advanced (`spring.activiti.async-executor`):**
- `core-pool-size` - Minimum thread pool size (default: 2)
- `max-pool-size` - Maximum thread pool size (default: 10)
- `queue-size` - Job queue capacity (default: 100)
- `number-of-retries` - Default retry count for failed jobs (default: 3)
- `retry-wait-time-in-millis` - Wait time between retries (default: 500ms)
- `max-async-jobs-due-per-acquisition` - Jobs fetched per query (default: 1)
- `default-async-job-acquire-wait-time-in-millis` - Wait between acquisitions (default: 10s)
- `async-job-lock-time-in-millis` - How long a job is locked (default: 5min)
- `message-queue-mode` - Enable distributed message queue mode (default: false)

### Programmatic Configuration

```java
@Bean
public ProcessEngineConfiguration processEngineConfiguration() {
    ProcessEngineConfiguration config = ProcessEngineConfiguration
        .createStandaloneInMemProcessEngineConfiguration();
    
    // Enable async execution
    config.setAsyncExecutorActivate(true);
    
    // Configure async executor thread pool
    config.setAsyncExecutorCorePoolSize(3);
    config.setAsyncExecutorMaxPoolSize(10);
    config.setAsyncExecutorThreadPoolQueueSize(1000);
    
    // Configure job acquisition
    config.setAsyncExecutorMaxAsyncJobsDuePerAcquisition(10);
    config.setAsyncExecutorDefaultAsyncJobAcquireWaitTime(1000);
    
    return config;
}
```

### AsyncExecutor vs JobExecutor

**Activiti 7 and earlier:**
- Used `JobExecutor` for async processing
- Configuration: `jobExecutorEnable`, `jobExecutorThreads`

**Activiti 8+:**
- Uses `AsyncExecutor` (newer implementation)
- Configuration: `asyncExecutorActivate`, `asyncExecutorCorePoolSize`
- Better performance and scalability
- Supports message queue mode for distributed setups

## Job Management

### Querying Jobs

```java
// Get all jobs
List<Job> jobs = managementService.createJobQuery().list();

// Get jobs for process instance
List<Job> processJobs = managementService.createJobQuery()
    .processInstanceId("processInstanceId")
    .list();

// Get jobs by process definition
List<Job> defJobs = managementService.createJobQuery()
    .processDefinitionId("processDefId")
    .list();

// Count jobs
long jobCount = managementService.createJobQuery().count();
```

### Job Control

```java
// Retry failed job
managementService.retryJob(jobId);

// Retry multiple jobs
managementService.retryJobs(jobIds);

// Delete job
managementService.deleteJob(jobId);

// Set job retries
managementService.setJobRetries(jobId, 3);

// Set job priority (higher = more important)
managementService.setJobPriority(jobId, 10);
```

**Note:** In Activiti 8, the `AsyncExecutor` automatically handles job acquisition and execution. Manual job locking/unlocking is typically not needed unless implementing custom execution strategies.

## Advanced Patterns

### Pattern 1: Async After Duration

Delay async activation:

```xml
<serviceTask id="delayedAsync" 
             name="Delayed Async" 
             activiti:async="true">
  
  <!-- Job will be activated after specified duration -->
  <!-- Note: Configure via Management Service at runtime -->
  
</serviceTask>
```

**Runtime Configuration:**
```java
// Set async after duration
managementService.setJobLockTime(jobId, 60000); // 60 seconds
```

### Pattern 2: Conditional Async

```xml
<serviceTask id="conditionalAsync" 
             name="Conditional Async" 
             activiti:async="${useAsyncMode}"
             activiti:class="com.example.ConditionalService"/>
```

### Pattern 3: Async with Boundary Events

```xml
<serviceTask id="asyncWithTimeout" 
             name="Async with Timeout" 
             activiti:async="true">
  
  <!-- Timer boundary event -->
  <boundaryEvent id="timeout" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT5M</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
  
  <!-- Error boundary event -->
  <boundaryEvent id="errorHandler" cancelActivity="true">
    <errorEventDefinition errorRef="AsyncError"/>
  </boundaryEvent>
  
</serviceTask>
```

### Pattern 4: Multi-Instance Async

```xml
<userTask id="asyncMultiInstance" 
          name="Async Reviews" 
          activiti:async="true">
  
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
    
    <completionCondition>${nrOfCompletedInstances >= 3}</completionCondition>
    
  </multiInstanceLoopCharacteristics>
  
</userTask>
```

## Monitoring and Debugging

### Job Tables

Activiti stores job information in database tables:

- `ACT_RU_JOB` - Active async jobs
- `ACT_RU_TIMER_JOB` - Timer jobs
- `ACT_HI_JOB_LOG` - Historical job execution log

### Query Job History

```java
// Get job execution history
List<HistoricJobLog> jobLogs = historyService.createHistoricJobLogQuery()
    .processInstanceId("processInstanceId")
    .list();

// Get failed job details
for (HistoricJobLog log : jobLogs) {
    System.out.println("Job: " + log.getJobId());
    System.out.println("Message: " + log.getJobDefinitionId());
    System.out.println("Retries: " + log.getRetries());
    System.out.println("Exception: " + log.getExceptionMessage());
}
```

### AsyncExecutor Metrics

```java
// Get async executor configuration
ProcessEngineConfiguration config = processEngine.getProcessEngineConfiguration();

// Check if async executor is active
boolean isActive = config.isAsyncExecutorActivate();

// Get thread pool settings
int corePoolSize = config.getAsyncExecutorCorePoolSize();
int maxPoolSize = config.getAsyncExecutorMaxPoolSize();
```

**Note:** Activiti 8's `AsyncExecutor` provides better monitoring capabilities through Spring Boot Actuator when used with the Spring Boot starter.

## Common Pitfalls

### 1. **Too Many Async Tasks**
```xml
<!-- BAD: Everything async -->
<serviceTask activiti:async="true"/>
<userTask activiti:async="true"/>
<scriptTask activiti:async="true"/>
```

**Solution:** Only async long-running operations

### 2. **No Retry Configuration**
```xml
<!-- BAD: No retry policy -->
<serviceTask id="unreliableApi" 
             activiti:async="true"
             activiti:class="com.example.ExternalApi"/>
```

**Solution:** Always add retry policy for external calls

### 3. **Transaction Issues**
```java
// BAD: Modifying process variables outside transaction
public void execute(DelegateExecution execution) {
    // This may not be persisted correctly
    execution.setVariable("result", calculate());
}
```

**Solution:** Use proper transaction management

### 4. **Ignoring Job Failures**
```java
// BAD: No error handling
try {
    riskyOperation();
} catch (Exception e) {
    // Silent failure
}
```

**Solution:** Throw exceptions to trigger retry or boundary events

## Best Practices

1. **Use Async for Long Operations:** Prevent blocking engine threads
2. **Configure Retry Policies:** Handle transient failures gracefully
3. **Add Boundary Events:** Implement timeout and error handling
4. **Monitor Job Queue:** Watch for backlog buildup
5. **Set Appropriate Thread Count:** Balance throughput and resources
6. **Log Job Execution:** Track async operations for debugging
7. **Test Retry Scenarios:** Verify retry behavior works correctly
8. **Use Job Priorities:** Important jobs should have higher priority
9. **Avoid Stateful Jobs:** Jobs should be idempotent and stateless
10. **Document Async Behavior:** Explain why tasks are async

## Related Documentation

- [Service Task](../elements/service-task.md) - Async service tasks
- [Common Features](../common-features.md) - Listeners and extensions
- [Events](../events/index.md) - Boundary events for error handling
- [Multi-Instance](../advanced/multi-instance.md) - Async multi-instance

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
