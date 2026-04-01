---
sidebar_label: Management Service
slug: /api-reference/engine-api/management-service
description: Engine administration, job management, and monitoring capabilities.
---

# Management Service - Engine Administration

**Module:** `activiti-core/activiti-engine`

**Target Audience:** Senior Software Engineers, DevOps, System Administrators

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Job Management](#job-management)
- [Engine Metrics](#engine-metrics)
- [Database Operations](#database-operations)
- [Performance Monitoring](#performance-monitoring)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The **ManagementService** provides administrative and monitoring capabilities for the Activiti engine. It allows you to manage jobs, monitor engine health, and perform maintenance operations.

### Key Responsibilities

- Job management and execution
- Engine metrics and statistics
- Database table information
- Process engine health checks
- Async operation monitoring
- Performance tuning

### Core Concepts

```
Management Service
    ├── Job Management
    │   ├── Execute jobs
    │   ├── Query jobs
    │   └── Job statistics
    ├── Engine Metrics
    │   ├── Table counts
    │   ├── Engine properties
    │   └── Health checks
    ├── Database Operations
    │   ├── Schema info
    │   ├── Cleanup operations
    │   └── Migration support
    └── Performance Monitoring
        ├── Async operations
        ├── Job executor stats
        └── Engine performance
```

---

## Job Management

### Executing Jobs

```java
// Execute all due jobs
managementService.executeJobs();

// Execute jobs with limit
managementService.executeJobs(100);

// Execute jobs for specific process
managementService.executeJobs(100, "process-definition-key");
```

### Job Queries

```java
// Get all jobs
List<Job> allJobs = managementService.createJobQuery().list();

// Get due jobs
List<Job> dueJobs = managementService.createJobQuery()
    .jobDue()
    .list();

// Get jobs by process instance
List<Job> processJobs = managementService.createJobQuery()
    .processInstanceId("process-instance-id")
    .list();

// Get jobs by exception
List<Job> exceptionJobs = managementService.createJobQuery()
    .jobExceptionMessage()
    .list();

// Get retry jobs
List<Job> retryJobs = managementService.createJobQuery()
    .jobRetriesGreaterThanOrEqual(3)
    .list();
```

### Job Operations

```java
// Set job retries
managementService.setRetries(jobId, 3);

// Increase retries
managementService.addRetries(jobId, 1);

// Lock job (for custom processing)
managementService.lockJob(jobId);

// Unlock job
managementService.unlockJob(jobId);

// Delete job
managementService.deleteJob(jobId);

// Set job property
managementService.setJobProperty(jobId, "customProperty", "value");

// Get job property
String property = managementService.getJobProperty(jobId, "customProperty");
```

### Timer Jobs

```java
// Query timer jobs
List<Job> timerJobs = managementService.createJobQuery()
    .jobType(JobType.TIMER)
    .list();

// Fire timer job immediately
managementService.executeJobs(100);
```

### Async Jobs

```java
// Query async jobs
List<Job> asyncJobs = managementService.createJobQuery()
    .jobType(JobType.EXECUTION)
    .list();

// Get async job statistics
long asyncJobCount = managementService.createJobQuery()
    .jobType(JobType.EXECUTION)
    .count();
```

---

## Engine Metrics

### Table Counts

```java
// Get all table counts
Map<String, Long> tableCounts = managementService.getTableCounts();

// Print table counts
for (Map.Entry<String, Long> entry : tableCounts.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}

// Get specific table count
long processInstanceCount = tableCounts.get("ACT_RI_PROCINST");
long taskCount = tableCounts.get("ACT_RI_TASK");
```

### Engine Properties

```java
// Get engine name
String engineName = managementService.getEngineName();

// Get engine properties
Map<String, Object> properties = managementService.getEngineProperties();
```

### Health Checks

```java
// Check if engine is healthy
boolean isHealthy = managementService.isEngineHealthy();

// Get engine status
EngineStatus status = managementService.getEngineStatus();
```

---

## Database Operations

### Schema Information

```java
// Get database schema version
String schemaVersion = managementService.getSchemaVersion();

// Check schema compatibility
boolean isCompatible = managementService.isSchemaCompatible();
```

### Cleanup Operations

```java
// Clean up orphaned executions
managementService.cleanUpOrphanedExecutions();

// Clean up historic data (if history level allows)
managementService.cleanUpHistory();

// Clean up old jobs
managementService.cleanUpJobs(Date.cutoffDate);
```

### Batch Operations

```java
// Execute batch operation
BatchOperation operation = managementService.createBatchOperation();
operation.execute();

// Monitor batch progress
Batch batch = managementService.getBatch(batchId);
int progress = batch.getJobCount();
```

---

## Performance Monitoring

### Job Executor Statistics

```java
// Get job executor configuration
JobExecutorConfiguration config = managementService.getJobExecutorConfiguration();

// Get job executor statistics
JobExecutorStatistics stats = managementService.getJobExecutorStatistics();

System.out.println("Jobs executed: " + stats.getJobsExecuted());
System.out.println("Last fetch time: " + stats.getLastFetchTime());
```

### Async Operation Monitoring

```java
// Count async operations
long asyncOperationCount = managementService.createJobQuery()
    .jobType(JobType.EXECUTION)
    .count();

// Get async operations by status
List<Job> pendingAsync = managementService.createJobQuery()
    .jobType(JobType.EXECUTION)
    .jobDue()
    .list();
```

### Engine Performance Metrics

```java
// Get engine startup time
Date startupTime = managementService.getEngineStartupTime();

// Calculate uptime
long uptime = System.currentTimeMillis() - startupTime.getTime();

// Get process instance throughput
long totalInstances = managementService.getTableCounts().get("ACT_RI_PROCINST");
double throughput = totalInstances / (uptime / 1000.0);
```

---

## API Reference

### ManagementService Methods

```java
// Job Management
void executeJobs();
void executeJobs(int maxJobs);
void executeJobs(int maxJobs, String... processDefinitionKeys);
JobQuery createJobQuery();
void setRetries(String jobId, int retries);
void addRetries(String jobId, int retries);
void lockJob(String jobId);
void unlockJob(String jobId);
void deleteJob(String jobId);
void setJobProperty(String jobId, String property, String value);
String getJobProperty(String jobId, String property);

// Metrics
Map<String, Long> getTableCounts();
String getEngineName();
Map<String, Object> getEngineProperties();
boolean isEngineHealthy();
EngineStatus getEngineStatus();

// Database Operations
String getSchemaVersion();
boolean isSchemaCompatible();
void cleanUpOrphanedExecutions();
void cleanUpHistory();
void cleanUpJobs(Date cutoffDate);

// Batch Operations
BatchOperation createBatchOperation();
Batch getBatch(String batchId);

// Job Executor
JobExecutorConfiguration getJobExecutorConfiguration();
JobExecutorStatistics getJobExecutorStatistics();

// Engine Info
Date getEngineStartupTime();
```

### JobQuery

```java
JobQuery createJobQuery();

// Filtering
.jobId(String id)
.jobIdIn(Collection<String> jobIds)
.processInstanceId(String id)
.processInstanceBusinessKey(String key)
.executionId(String id)
.jobType(JobType type)
.jobDue()
.jobExceptionMessage()
.jobExceptionMessageLike(String message)
.jobRetries(int retries)
.jobRetriesGreaterThanOrEqual(int retries)
.jobRetriesLessThanOrEqual(int retries)
.dueBefore(Date before)
.dueAfter(Date after)
.tenantIdIn(Collection<String> tenantIds)

// Ordering
.orderByJobId()
.orderByJobType()
.orderByJobRetries()
.orderByJobDueDate()
.orderByJobException()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()
```

---

## Usage Examples

### Job Monitoring Service

```java
@Service
public class JobMonitoringService {
    
    @Autowired
    private ManagementService managementService;
    
    public JobStatusReport getJobStatusReport() {
        JobStatusReport report = new JobStatusReport();
        
        // Get job counts by type
        report.setTotalJobs(managementService.createJobQuery().count());
        report.setDueJobs(managementService.createJobQuery().jobDue().count());
        report.setExceptionJobs(managementService.createJobQuery()
            .jobExceptionMessage()
            .count());
        report.setTimerJobs(managementService.createJobQuery()
            .jobType(JobType.TIMER)
            .count());
        report.setAsyncJobs(managementService.createJobQuery()
            .jobType(JobType.EXECUTION)
            .count());
        
        // Get table counts
        report.setTableCounts(managementService.getTableCounts());
        
        // Get job executor stats
        JobExecutorStatistics stats = managementService.getJobExecutorStatistics();
        report.setJobsExecuted(stats.getJobsExecuted());
        report.setLastFetchTime(stats.getLastFetchTime());
        
        return report;
    }
    
    public void handleStuckJobs() {
        // Find jobs with high retry count
        List<Job> stuckJobs = managementService.createJobQuery()
            .jobRetriesGreaterThanOrEqual(5)
            .list();
        
        for (Job job : stuckJobs) {
            log.warn("Stuck job: {} - Exception: {}", 
                job.getId(), job.getExceptionMessage());
            
            // Optionally reset retries or delete
            // managementService.setRetries(job.getId(), 0);
        }
    }
}
```

### Engine Health Check

```java
@Component
public class EngineHealthIndicator implements HealthIndicator {
    
    @Autowired
    private ManagementService managementService;
    
    @Override
    public Health health() {
        try {
            // Check engine health
            boolean isHealthy = managementService.isEngineHealthy();
            
            if (!isHealthy) {
                return Health.down()
                    .withDetail("engine", "unhealthy")
                    .build();
            }
            
            // Get table counts
            Map<String, Long> counts = managementService.getTableCounts();
            
            // Check for stuck jobs
            long stuckJobs = managementService.createJobQuery()
                .jobRetriesGreaterThanOrEqual(10)
                .count();
            
            Health.Builder builder = Health.up()
                .withDetail("tableCounts", counts)
                .withDetail("stuckJobs", stuckJobs);
            
            if (stuckJobs > 0) {
                builder.withDetail("warning", "Stuck jobs detected");
            }
            
            return builder.build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

### Job Cleanup Service

```java
@Service
public class JobCleanupService {
    
    @Autowired
    private ManagementService managementService;
    
    @Scheduled(cron = "0 0 2 * * *") // Daily at 2 AM
    public void performCleanup() {
        log.info("Starting job cleanup...");
        
        // Clean up orphaned executions
        managementService.cleanUpOrphanedExecutions();
        log.info("Orphaned executions cleaned");
        
        // Clean up old failed jobs (older than 30 days)
        Date cutoffDate = new Date(System.currentTimeMillis() - 30L * 24 * 60 * 60 * 1000);
        List<Job> oldJobs = managementService.createJobQuery()
            .jobExceptionMessage()
            .dueBefore(cutoffDate)
            .list();
        
        for (Job job : oldJobs) {
            managementService.deleteJob(job.getId());
        }
        log.info("Deleted {} old failed jobs", oldJobs.size());
        
        // Report cleanup statistics
        Map<String, Long> counts = managementService.getTableCounts();
        log.info("Post-cleanup table counts: {}", counts);
    }
}
```

---

## Best Practices

### 1. Monitor Jobs Regularly

```java
// GOOD - Scheduled monitoring
@Scheduled(fixedRate = 3600000) // Every hour
public void monitorJobs() {
    long stuckJobs = managementService.createJobQuery()
        .jobRetriesGreaterThanOrEqual(5)
        .count();
    
    if (stuckJobs > 0) {
        alertOperationsTeam(stuckJobs);
    }
}

// BAD - No monitoring
```

### 2. Handle Job Exceptions

```java
// GOOD - Check for exceptions
List<Job> exceptionJobs = managementService.createJobQuery()
    .jobExceptionMessage()
    .list();

for (Job job : exceptionJobs) {
    log.error("Job {} failed: {}", job.getId(), job.getExceptionMessage());
    // Handle or escalate
}

// BAD - Ignore exceptions
```

### 3. Use Appropriate Retry Limits

```java
// GOOD - Set reasonable retries
managementService.setRetries(jobId, 3);

// BAD - Too many retries
managementService.setRetries(jobId, 100);
```

### 4. Monitor Table Growth

```java
// GOOD - Track table sizes
Map<String, Long> counts = managementService.getTableCounts();
long processInstances = counts.get("ACT_RI_PROCINST");

if (processInstances > THRESHOLD) {
    triggerArchiveProcess();
}

// BAD - No monitoring
```

### 5. Schedule Cleanup Operations

```java
// GOOD - Regular cleanup
@Scheduled(cron = "0 0 2 * * *")
public void cleanup() {
    managementService.cleanUpOrphanedExecutions();
}

// BAD - Manual cleanup only
```

---

## See Also

- [Parent Documentation](README.md)
- [Runtime Service](./runtime-service.md)
- [History Service](./history-service.md)
- [Best Practices](../../best-practices/overview.md)
