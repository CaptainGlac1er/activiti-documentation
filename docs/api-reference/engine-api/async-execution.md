---
sidebar_label: Async Execution
slug: /api-reference/engine-api/async-execution
title: "Async Execution"
description: "Complete guide to asynchronous job execution in Activiti - configuration, architecture, and best practices for timers, async continuations, and background tasks."
---

# Async Execution

The **Async Execution** framework is a critical component of the Activiti engine that handles **asynchronous job execution**, including timers, message correlations, and async continuations. It runs in the background, processing jobs from the database and executing them according to their scheduled times.

## Overview

```java
// Async executor configuration
ProcessEngineConfiguration configuration = ProcessEngineConfiguration
    .createStandaloneProcessEngineConfiguration();

configuration.setAsyncExecutorActivate(true);  // Enable async executor
configuration.setAsyncExecutorNumberOfRetries(3);
configuration.setAsyncExecutorMaxAsyncJobsDuePerAcquisition(10);
```

**Key Responsibilities:**
- Execute async service tasks
- Process timer events
- Correlate messages
- Handle job retries
- Manage dead letter jobs

## Architecture

### Component Structure

```
┌─────────────────────────────────────┐
│        ProcessEngine                │
├─────────────────────────────────────┤
│  AsyncExecutor                      │
│  ├─ Acquisition Threads             │
│  │   ├─ Async Job Acquisition       │
│  │   └─ Timer Job Acquisition       │
│  ├─ Job Worker Threads              │
│  └─ Retry & Cleanup Mechanism       │
├─────────────────────────────────────┤
│  Job Tables                         │
│  ├─ ACT_RU_JOB (Executable Jobs)    │
│  ├─ ACT_RU_TIMER_JOB (Timer Jobs)   │
│  ├─ ACT_RU_SUSPENDED_JOB            │
│  └─ ACT_GE_JOB_DEFINITION (Dead Letter) │
└─────────────────────────────────────┘
```

### Job Types

| Job Type | Description | Source | Table |
|----------|-------------|--------|-------|
| **Executable** | Async service tasks, script tasks | `activiti:async="true"` | `ACT_RU_JOB` |
| **Timer** | Timer events, due dates | `<timerEventDefinition>` | `ACT_RU_TIMER_JOB` |
| **Message** | Message correlations | `<messageEventDefinition>` | `ACT_RU_JOB` |
| **Signal** | Signal correlations | `<signalEventDefinition>` | `ACT_RU_JOB` |

## Configuration

### Spring Boot Configuration

```yaml
# application.yml
spring:
  activiti:
    async-executor:
      # Enable async executor
      activate: true
      
      # Thread pool configuration
      core-pool-size: 2          # Minimum threads kept alive
      max-pool-size: 10          # Maximum threads under load
      keep-alive-time: 5000      # Idle thread timeout (ms)
      queue-size: 100            # Job queue capacity
      
      # Job acquisition
      max-async-jobs-due-per-acquisition: 1    # Jobs per acquisition cycle
      max-timer-jobs-per-acquisition: 1         # Timer jobs per cycle
      
      # Wait times (milliseconds)
      default-async-job-acquire-wait-time-in-millis: 10000  # Wait between async acquisitions
      default-timer-job-acquire-wait-time-in-millis: 10000   # Wait between timer acquisitions
      default-queue-size-full-wait-time: 0              # Wait when queue is full
      
      # Retry configuration
      retry-wait-time-in-millis: 500        # Wait before retrying failed job
      number-of-retries: 3                  # Default retries per job
      
      # Lock times (milliseconds)
      async-job-lock-time-in-millis: 300000 # 5 minutes - prevents duplicate execution
      timer-lock-time-in-millis: 300000     # 5 minutes
      
      # Expired jobs cleanup
      reset-expired-jobs-interval: 60000    # Check every 1 minute
      reset-expired-jobs-page-size: 3       # Process 3 jobs per cleanup
      
      # Shutdown
      seconds-to-wait-on-shutdown: 60       # Graceful shutdown timeout
```

**Source:** `AsyncExecutorProperties.java`

### Java Configuration (Standalone)

```java
public class AsyncExecutionConfig {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration() {
        ProcessEngineConfiguration config = 
            ProcessEngineConfiguration.createStandaloneProcessEngineConfiguration();
        
        // Enable async executor
        config.setAsyncExecutorActivate(true);
        
        // Thread pool configuration
        config.setAsyncExecutorCorePoolSize(5);
        config.setAsyncExecutorMaxPoolSize(20);
        config.setAsyncExecutorThreadKeepAliveTime(60000); // 1 minute
        
        // Job acquisition
        config.setAsyncExecutorMaxAsyncJobsDuePerAcquisition(10);
        config.setAsyncExecutorMaxTimerJobsPerAcquisition(10);
        
        // Wait times
        config.setAsyncExecutorDefaultAsyncJobAcquireWaitTime(10000); // 10 seconds
        config.setAsyncExecutorDefaultTimerJobAcquireWaitTime(10000); // 10 seconds
        
        // Retry configuration
        config.setAsyncExecutorNumberOfRetries(3);
        
        // Lock times
        config.setAsyncExecutorAsyncJobLockTimeInMillis(300000); // 5 minutes
        config.setAsyncExecutorTimerLockTimeInMillis(300000); // 5 minutes
        
        // Expired jobs cleanup
        config.setAsyncExecutorResetExpiredJobsInterval(60000); // 1 minute
        config.setAsyncExecutorResetExpiredJobsPageSize(3);
        
        return config;
    }
}
```

**Source:** `ProcessEngineConfigurationImpl.java`

## Job Execution Flow

### 1. Job Creation

```xml
<!-- Async service task creates executable job -->
<serviceTask id="asyncTask" name="Async Processing" 
             activiti:class="com.example.AsyncProcessor"
             activiti:async="true"/>

<!-- Timer event creates timer job -->
<intermediateCatchEvent id="timerEvent">
  <timerEventDefinition>
    <timeDuration>PT1H</timeDuration>
  </timerEventDefinition>
</intermediateCatchEvent>

<!-- Message event creates message job -->
<intermediateCatchEvent id="messageEvent">
  <messageEventDefinition messageRef="myMessage"/>
</intermediateCatchEvent>
```

### 2. Job Acquisition

```
Async Executor Acquisition Loop:

1. Acquire database lock (prevents multiple executors)
2. Query for due jobs:
   - execution_time <= now
   - retries > 0 or not yet failed
   - lock_expiry < now or not locked
3. Lock acquired jobs:
   - Set LOCK_OWNER (executor ID)
   - Set LOCK_EXPIRY (current time + lock duration)
4. Assign to worker thread pool
5. Release database lock
6. Wait for configured interval
7. Repeat
```

**Source:** `DefaultAsyncJobExecutor.java`

### 3. Job Execution

```java
// Worker thread execution flow
public void executeJob(Job job) {
    try {
        // 1. Load job details and context
        JobDetails details = loadJobDetails(job);
        
        // 2. Determine job handler based on type
        JobHandler handler = getJobHandler(job.getType());
        
        // 3. Execute business logic
        handler.execute(details);
        
        // 4. Mark job as complete (delete from ACT_RU_JOB)
        completeJob(job.getId());
        
    } catch (Exception e) {
        // 5. Handle failure
        if (job.getRetries() > 0) {
            // Decrement retries
            setJobRetries(job.getId(), job.getRetries() - 1);
            
            // Set next retry time with backoff
            Date retryTime = calculateRetryTime(job, e);
            setJobRetryTime(job.getId(), retryTime);
            
        } else {
            // Move to dead letter table (ACT_GE_JOB_DEFINITION)
            moveToDeadLetter(job.getId(), e);
        }
    }
}
```

### 4. Job Retry Mechanism

```
Retry Logic Flow:

Job fails → Catch exception
    ↓
Check retries remaining
    ↓
┌─────────────────────────────┐
│ retries > 0?                │
└─────────────┬───────────────┘
              │
         Yes  │  No
              │
              ↓              ↓
    Decrement retries    Move to dead letter
    Calculate backoff      (ACT_GE_JOB_DEFINITION)
    Set retry time
    Reschedule job
    ↓
    Wait (retry-wait-time-in-millis)
    ↓
    Re-acquire and retry
```

**Exponential Backoff:**
- 1st failure: retry after 500ms
- 2nd failure: retry after 1000ms
- 3rd failure: retry after 2000ms
- etc.

## Job Management

### Querying Jobs

Job queries are performed through the `ManagementService`. See [Management Service](./management-service.md#job-management) for complete API reference.

```java
@Autowired
private ManagementService managementService;

public void queryJobs() {
    // Query executable jobs
    List<Job> executableJobs = managementService.createJobQuery()
        .list();
    
    // Query timer jobs
    List<Job> timerJobs = managementService.createJobQuery()
        .jobType(JobType.TIMER)
        .list();
    
    // Query jobs by process instance
    List<Job> processJobs = managementService.createJobQuery()
        .processInstanceId("process-123")
        .list();
    
    // Query failed jobs
    List<Job> failedJobs = managementService.createJobQuery()
        .withException()
        .list();
    
    // Query dead letter jobs
    List<Job> deadLetterJobs = managementService.createDeadLetterJobQuery()
        .list();
}
```

### Job Operations

Common job operations are available through `ManagementService`. See [Management Service](./management-service.md) for:
- Executing jobs manually
- Setting job retries
- Deleting jobs
- Moving jobs between tables
- Getting exception stacktraces

## Timer Jobs

### Creating Timer Jobs

```xml
<!-- Duration timer - fires after specified duration -->
<intermediateCatchEvent id="durationTimer">
  <timerEventDefinition>
    <timeDuration>PT1H</timeDuration>
  </timerEventDefinition>
</intermediateCatchEvent>

<!-- Date timer - fires at specific date/time -->
<intermediateCatchEvent id="dateTimer">
  <timerEventDefinition>
    <timeDate>${scheduledDate}</timeDate>
  </timerEventDefinition>
</intermediateCatchEvent>

<!-- Cycle timer - fires repeatedly -->
<intermediateCatchEvent id="cycleTimer">
  <timerEventDefinition>
    <timeCycle>R/10/PT5M</timeCycle>  <!-- 10 times, every 5 minutes -->
  </timerEventDefinition>
</intermediateCatchEvent>
```

### Timer Job Management

```java
public class TimerJobManagement {
    
    @Autowired
    private ManagementService managementService;
    
    public void manageTimerJobs() {
        // Query timer jobs
        List<Job> timerJobs = managementService.createJobQuery()
            .jobType(JobType.TIMER)
            .list();
        
        for (Job timerJob : timerJobs) {
            // Get timer repetition info
            String repetition = timerJob.getRepetitionMessage();
            Integer repetitionNumber = timerJob.getRepetitionNumber();
            
            // Modify timer execution time
            managementService.setJobRetryTime(
                timerJob.getId(), 
                new Date(System.currentTimeMillis() + 3600000) // 1 hour from now
            );
            
            // Set retries
            managementService.setTimerJobRetries(timerJob.getId(), 5);
        }
        
        // Move timer to executable (force immediate execution)
        Job executableJob = managementService.moveTimerToExecutableJob("timer-job-id");
    }
}
```

## Monitoring and Metrics

### Job Executor Metrics

```java
@Component
public class JobMetricsCollector {
    
    @Autowired
    private ManagementService managementService;
    
    @Scheduled(fixedRate = 60000) // Every minute
    public void collectMetrics() {
        // Job counts by type
        long executableJobs = managementService.createJobQuery().count();
        long timerJobs = managementService.createJobQuery()
            .jobType(JobType.TIMER)
            .count();
        long suspendedJobs = managementService.createSuspendedJobQuery().count();
        long deadLetterJobs = managementService.createDeadLetterJobQuery().count();
        
        // Log metrics
        log.info("Job Metrics - Executable: {}, Timers: {}, Suspended: {}, Dead Letter: {}",
                executableJobs, timerJobs, suspendedJobs, deadLetterJobs);
        
        // Send to monitoring system (Prometheus, Datadog, etc.)
        metricsService.gauge("activiti.jobs.executable", executableJobs);
        metricsService.gauge("activiti.jobs.timer", timerJobs);
        metricsService.gauge("activiti.jobs.suspended", suspendedJobs);
        metricsService.gauge("activiti.jobs.deadletter", deadLetterJobs);
        
        // Alert on thresholds
        if (deadLetterJobs > 50) {
            alertService.sendAlert("High dead letter job count: " + deadLetterJobs);
        }
        
        if (executableJobs > 1000) {
            alertService.sendAlert("Job backlog growing: " + executableJobs);
        }
    }
}
```

### Dead Letter Job Analysis

```java
public class DeadLetterAnalysis {
    
    @Autowired
    private ManagementService managementService;
    
    public void analyzeDeadLetterJobs() {
        List<Job> deadLetterJobs = managementService.createDeadLetterJobQuery()
            .orderByJobCreationTime().desc()
            .list(0, 100);
        
        Map<String, Long> failureReasons = new HashMap<>();
        
        for (Job job : deadLetterJobs) {
            String exceptionMsg = managementService.getJobExceptionStacktrace(job.getId());
            
            // Categorize failures
            if (exceptionMsg.contains("Connection")) {
                failureReasons.merge("CONNECTION_ERROR", 1L, Long::sum);
            } else if (exceptionMsg.contains("Timeout")) {
                failureReasons.merge("TIMEOUT", 1L, Long::sum);
            } else if (exceptionMsg.contains("NullPointer")) {
                failureReasons.merge("NULL_POINTER", 1L, Long::sum);
            } else {
                failureReasons.merge("OTHER", 1L, Long::sum);
            }
            
            // Log details
            log.warn("Dead letter job: {} - Exception: {}", 
                    job.getId(), 
                    exceptionMsg.substring(0, Math.min(200, exceptionMsg.length())));
        }
        
        // Report summary
        log.info("Dead Letter Job Analysis: {}", failureReasons);
    }
    
    public void recoverDeadLetterJobs() {
        List<Job> deadLetterJobs = managementService.createDeadLetterJobQuery().list();
        
        for (Job job : deadLetterJobs) {
            try {
                // Move back to executable with 3 retries
                Job restored = managementService.moveDeadLetterJobToExecutableJob(
                    job.getId(), 
                    3
                );
                log.info("Recovered dead letter job: {}", job.getId());
            } catch (Exception e) {
                log.error("Failed to recover job: {}", job.getId(), e);
            }
        }
    }
}
```

## Best Practices

### 1. Right-Size Thread Pool

```yaml
# GOOD: Match thread pool to workload
spring:
  activiti:
    async-executor:
      # CPU-bound jobs: cores + 1
      core-pool-size: 4
      max-pool-size: 8
      
      # I/O-bound jobs: cores * 2 to cores * 4
      core-pool-size: 8
      max-pool-size: 20

# BAD: Arbitrary sizes
core-pool-size: 1        # Too slow
max-pool-size: 100       # Resource exhaustion
```

### 2. Configure Appropriate Acquisition Batches

```yaml
# GOOD: Start conservative, scale based on monitoring
spring:
  activiti:
    async-executor:
      max-async-jobs-due-per-acquisition: 1  # Default - safe
      max-timer-jobs-per-acquisition: 1
      
# Increase only if you understand the implications:
# - More jobs per acquisition = faster processing
# - But higher risk of optimistic locking conflicts
# - And longer database transactions

# BAD: High values without testing
max-async-jobs-due-per-acquisition: 100  # Risk of locking issues
```

### 3. Set Reasonable Lock Times

```yaml
# GOOD: Lock time > average job execution time
spring:
  activiti:
    async-executor:
      async-job-lock-time-in-millis: 300000  # 5 minutes
      timer-lock-time-in-millis: 300000
      
# If jobs typically take 30 seconds, 5 minutes provides safety margin
# for slow database queries, GC pauses, etc.

# BAD: Lock time too short
async-job-lock-time-in-millis: 5000  # 5 seconds - jobs may timeout
```

### 4. Monitor Dead Letter Jobs

```java
// GOOD: Regular monitoring and alerting
@Scheduled(cron = "0 */15 * * * *") // Every 15 minutes
public void monitorDeadLetterJobs() {
    long count = managementService.createDeadLetterJobQuery().count();
    
    if (count > 10) {
        alertService.sendAlert("High dead letter job count: " + count);
        
        // Optionally auto-recover known-good jobs
        recoverSafeJobs();
    }
}

// BAD: No monitoring - dead letter jobs accumulate unnoticed
```

### 5. Use Appropriate Retry Counts

```xml
<!-- GOOD: Set retries based on job type -->
<serviceTask id="externalApiCall" 
             activiti:async="true"
             activiti:class="com.example.ApiCaller">
  <extensionElements>
    <!-- Transient failures: 3-5 retries -->
    <activiti:property name="retries" value="5"/>
  </extensionElements>
</serviceTask>

<serviceTask id="validationTask"
             activiti:async="true"
             activiti:class="com.example.Validator">
  <extensionElements>
    <!-- Validation errors won't fix themselves: 0-1 retry -->
    <activiti:property name="retries" value="1"/>
  </extensionElements>
</serviceTask>
```

### 6. Handle Job Failures Gracefully

```java
public class GracefulJobHandler implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        try {
            // Business logic
            externalService.call();
            
        } catch (TransientException e) {
            // Will retry automatically
            // Job retries decremented, rescheduled with backoff
            throw e;
            
        } catch (PermanentException e) {
            // Set error variable, don't retry
            execution.setVariable("error", e.getMessage());
            execution.setVariable("canRetry", false);
            
            // Or throw BPMN error for specific handling
            throw new ActivitiException(
                new BpmnError("PERMANENT_ERROR", e.getMessage())
            );
        }
    }
}
```

### 7. Implement Idempotent Jobs

```java
// GOOD: Safe to retry
public class IdempotentJobHandler implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        String jobId = execution.getVariable("jobId");
        
        // Check if already processed
        if (processedRepository.exists(jobId)) {
            log.info("Job already processed, skipping: {}", jobId);
            return;
        }
        
        try {
            doWork(execution);
            processedRepository.markProcessed(jobId);
        } catch (Exception e) {
            // Safe to retry - won't duplicate work
            throw e;
        }
    }
}

// BAD: Non-idempotent (can cause duplicates on retry)
public class NonIdempotentHandler implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        // Sends email every time - retry = duplicate emails
        emailService.send(execution.getVariable("email"));
    }
}
```

## Common Pitfalls

### 1. Async Executor Not Running

**Symptom:** Jobs not executing, accumulating in database

**Causes:**
- `async-executor.activate` not set to `true`
- Process engine not fully initialized
- Database tables missing

**Solution:**
```yaml
spring:
  activiti:
    async-executor:
      activate: true  # Must be true
```

Check logs for: `Async executor started` message

### 2. Jobs Stuck in Suspended State

**Symptom:** Jobs not being acquired

**Cause:** Process instance is suspended

**Solution:**
```java
// Check process instance status
ProcessInstance process = runtimeService.createProcessInstanceQuery()
    .processInstanceId(id)
    .singleResult();

if (process != null && !process.isSuspended()) {
    // Activate process instance
    runtimeService.activateProcessInstanceById(id);
}
```

### 3. Too Many Dead Letter Jobs

**Symptom:** Dead letter table growing rapidly

**Causes:**
- Jobs failing permanently (validation errors, missing data)
- Retry count too low
- External system unavailable

**Solution:**
```java
// 1. Analyze failure patterns
List<Job> deadJobs = managementService.createDeadLetterJobQuery().list();

for (Job job : deadJobs) {
    String exception = managementService.getJobExceptionStacktrace(job.getId());
    log.error("Job {} failed: {}", job.getId(), exception);
}

// 2. Fix underlying issue
// 3. Manually retry if appropriate
managementService.moveDeadLetterJobToExecutableJob(job.getId(), 3);
```

### 4. Timer Jobs Not Firing

**Symptom:** Timers not triggering at expected times

**Causes:**
- Async executor not running
- Timer job acquisition disabled
- Database time mismatch

**Solution:**
```java
// Check async executor is running
// Verify timer jobs exist
List<Job> timers = managementService.createJobQuery()
    .jobType(JobType.TIMER)
    .list();

// Check execution times
for (Job timer : timers) {
    log.info("Timer job: {}, execution time: {}, now: {}", 
             timer.getId(), 
             timer.getExecutionTime(),
             new Date());
}
```

### 5. Optimistic Locking Conflicts

**Symptom:** `OptimisticLockingException` in async executor logs

**Cause:** Too many jobs acquired per cycle

**Solution:**
```yaml
# Reduce acquisition batch size
spring:
  activiti:
    async-executor:
      max-async-jobs-due-per-acquisition: 1  # Start with 1
      max-timer-jobs-per-acquisition: 1
```

Gradually increase while monitoring for conflicts.

### 6. Thread Pool Exhaustion

**Symptom:** Jobs queuing but not executing

**Cause:** All threads busy, queue full

**Solution:**
```yaml
# Increase thread pool
spring:
  activiti:
    async-executor:
      core-pool-size: 10
      max-pool-size: 50
      queue-size: 500

# Or optimize job execution time
# - Reduce external API calls
# - Use async/await patterns
# - Batch operations
```

## Related Documentation

- [Management Service](./management-service.md) - Job management API reference
- [Runtime Service](./runtime-service.md) - Process execution and message correlation
- [Engine Configuration](./engine-configuration.md) - Complete engine setup
- [Scripting Engine](./scripting-engine.md) - Async script execution

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated:** 2026  
**Source:** `activiti-engine/impl/asyncexecutor/`, `AsyncExecutorProperties.java`, `ProcessEngineConfigurationImpl.java`
