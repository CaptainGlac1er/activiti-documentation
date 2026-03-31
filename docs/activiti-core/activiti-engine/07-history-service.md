---
sidebar_label: History Service
slug: /activiti-core/history-service
description: Complete guide to the History Service for process auditing, tracking, and compliance.
---

# History Service - Process Auditing and Tracking

**Module:** `activiti-core/activiti-engine`

**Target Audience:** Senior Software Engineers, Compliance Officers, System Architects

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [History Levels](#history-levels)
- [Historic Process Instances](#historic-process-instances)
- [Historic Task Instances](#historic-task-instances)
- [Historic Activity Instances](#historic-activity-instances)
- [Historic Variables](#historic-variables)
- [Identity Links](#identity-links)
- [History Cleanup](#history-cleanup)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The **HistoryService** provides comprehensive auditing and tracking capabilities for all process executions. It records historical data about process instances, tasks, activities, and variables, enabling compliance, analysis, and process improvement.

### Key Responsibilities

- Record process instance history
- Track task execution history
- Monitor activity instances
- Store variable history
- Maintain identity links
- Support history cleanup
- Enable historical queries

### Core Concepts

```
History
    ├── Process Instances (completed/active)
    ├── Task Instances (all tasks)
    ├── Activity Instances (all activities)
    ├── Variables (all variable changes)
    └── Identity Links (assignments/candidates)
```

---

## History Levels

### Configuration

```java
// NONE - No history recorded
config.setHistoryLevel(HistoryLevel.NONE);

// ACTIVITY - Activity instances only
config.setHistoryLevel(HistoryLevel.ACTIVITY);

// AUDIT - Activity + Task + Variables (default)
config.setHistoryLevel(HistoryLevel.AUDIT);

// FULL - Complete history including details
config.setHistoryLevel(HistoryLevel.FULL);
```

### History Level Features

| Level | Process Inst | Task Inst | Activity Inst | Variables | Details |
|-------|--------------|-----------|---------------|-----------|---------|
| NONE | ❌ | ❌ | ❌ | ❌ | ❌ |
| ACTIVITY | ✅ | ❌ | ✅ | ❌ | ❌ |
| AUDIT | ✅ | ✅ | ✅ | ✅ | ❌ |
| FULL | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Historic Process Instances

### Querying Process Instances

```java
// Get all completed process instances
List<HistoricProcessInstance> completed = historyService
    .createHistoricProcessInstanceQuery()
    .finished()
    .list();

// Get active process instances
List<HistoricProcessInstance> active = historyService
    .createHistoricProcessInstanceQuery()
    .active()
    .list();

// Get by process definition key
List<HistoricProcessInstance> byKey = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .list();

// Get by business key
HistoricProcessInstance byBusinessKey = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceBusinessKey("ORDER-12345")
    .singleResult();
```

### Advanced Queries

```java
// Date range query
List<HistoricProcessInstance> inRange = historyService
    .createHistoricProcessInstanceQuery()
    .startedAfter(LocalDate.of(2024, 1, 1))
    .startedBefore(LocalDate.of(2024, 12, 31))
    .list();

// Duration filtering
List<HistoricProcessInstance> longRunning = historyService
    .createHistoricProcessInstanceQuery()
    .finished()
    .durationGreaterThanOrEqual(3600000) // 1 hour in ms
    .list();

// Multiple criteria
List<HistoricProcessInstance> results = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .processInstanceBusinessKeyLike("ORDER-%")
    .startedAfter(LocalDate.now().minusMonths(1))
    .finished()
    .orderByStartTime()
    .desc()
    .listPage(0, 50);
```

### Process Instance Details

```java
public class ProcessInstanceAnalyzer {
    
    @Autowired
    private HistoryService historyService;
    
    public void analyzeProcessInstance(String processInstanceId) {
        HistoricProcessInstance instance = historyService
            .createHistoricProcessInstanceQuery()
            .processInstanceId(processInstanceId)
            .singleResult();
        
        System.out.println("Process ID: " + instance.getId());
        System.out.println("Process Definition: " + instance.getProcessDefinitionKey());
        System.out.println("Business Key: " + instance.getBusinessKey());
        System.out.println("Start Time: " + instance.getStartTime());
        System.out.println("End Time: " + instance.getEndTime());
        System.out.println("Duration: " + instance.getDurationInMillis() + "ms");
        System.out.println("State: " + (instance.getEndTime() != null ? "COMPLETED" : "ACTIVE"));
        System.out.println("Tenant ID: " + instance.getTenantId());
    }
}
```

---

## Historic Task Instances

### Querying Tasks

```java
// All historic tasks
List<HistoricTaskInstance> allTasks = historyService
    .createHistoricTaskInstanceQuery()
    .list();

// Tasks by process instance
List<HistoricTaskInstance> processTasks = historyService
    .createHistoricTaskInstanceQuery()
    .processInstanceId(processInstanceId)
    .list();

// Tasks by assignee
List<HistoricTaskInstance> userTasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskAssignee("john.doe")
    .list();

// Tasks by name
List<HistoricTaskInstance> approvalTasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskName("Approve Order")
    .list();
```

### Task Performance Analysis

```java
// Average task duration
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskName("Review Document")
    .finished()
    .list();

double avgDuration = tasks.stream()
    .mapToDouble(HistoricTaskInstance::getDurationInMillis)
    .average()
    .orElse(0);

// Task completion time
List<HistoricTaskInstance> slowTasks = historyService
    .createHistoricTaskInstanceQuery()
    .finished()
    .durationGreaterThanOrEqual(86400000) // 24 hours
    .orderByDuration()
    .desc()
    .listPage(0, 10);
```

### Task Details

```java
public class TaskHistoryAnalyzer {
    
    @Autowired
    private HistoryService historyService;
    
    public void analyzeTask(String taskId) {
        HistoricTaskInstance task = historyService
            .createHistoricTaskInstanceQuery()
            .taskId(taskId)
            .singleResult();
        
        System.out.println("Task ID: " + task.getId());
        System.out.println("Task Name: " + task.getName());
        System.out.println("Assignee: " + task.getAssignee());
        System.out.println("Owner: " + task.getOwner());
        System.out.println("Start Time: " + task.getStartTime());
        System.out.println("Claim Time: " + task.getClaimTime());
        System.out.println("End Time: " + task.getEndTime());
        System.out.println("Duration: " + task.getDurationInMillis() + "ms");
        System.out.println("Delete Reason: " + task.getDeleteReason());
    }
}
```

---

## Historic Activity Instances

### Querying Activities

```java
// All activity instances
List<HistoricActivityInstance> activities = historyService
    .createHistoricActivityInstanceQuery()
    .list();

// Activities by process instance
List<HistoricActivityInstance> processActivities = historyService
    .createHistoricActivityInstanceQuery()
    .processInstanceId(processInstanceId)
    .list();

// Activities by activity ID
List<HistoricActivityInstance> byActivityId = historyService
    .createHistoricActivityInstanceQuery()
    .activityId("userTask1")
    .list();

// Activities by type
List<HistoricActivityInstance> userTasks = historyService
    .createHistoricActivityInstanceQuery()
    .activityType(HistoricActivityType.USER_TASK)
    .list();
```

### Activity Flow Analysis

```java
// Get activity sequence
List<HistoricActivityInstance> sequence = historyService
    .createHistoricActivityInstanceQuery()
    .processInstanceId(processInstanceId)
    .orderByActivityInstanceId()
    .asc()
    .list();

// Calculate activity durations
Map<String, Long> activityDurations = sequence.stream()
    .collect(Collectors.toMap(
        HistoricActivityInstance::getActivityId,
        HistoricActivityInstance::getDurationInMillis
    ));

// Find bottlenecks
List<HistoricActivityInstance> bottlenecks = historyService
    .createHistoricActivityInstanceQuery()
    .durationGreaterThanOrEqual(3600000) // 1 hour
    .orderByDuration()
    .desc()
    .listPage(0, 10);
```

---

## Historic Variables

### Querying Variables

```java
// All historic variables
List<HistoricVariableInstance> allVars = historyService
    .createHistoricVariableInstanceQuery()
    .list();

// Variables by process instance
List<HistoricVariableInstance> processVars = historyService
    .createHistoricVariableInstanceQuery()
    .processInstanceId(processInstanceId)
    .list();

// Variables by name
List<HistoricVariableInstance> byName = historyService
    .createHistoricVariableInstanceQuery()
    .variableName("orderId")
    .list();

// Variables by value
List<HistoricVariableInstance> byValue = historyService
    .createHistoricVariableInstanceQuery()
    .variableValue("ORDER-12345")
    .list();
```

### Variable History

```java
// Get variable value changes
List<HistoricVariableInstance> variableHistory = historyService
    .createHistoricVariableInstanceQuery()
    .processInstanceId(processInstanceId)
    .variableName("orderStatus")
    .orderByTime()
    .asc()
    .list();

// Display variable timeline
for (HistoricVariableInstance var : variableHistory) {
    System.out.println(var.getTime() + " - " + var.getName() + 
        " = " + var.getTextValue());
}
```

---

## Identity Links

### Querying Identity Links

```java
// All identity links
List<HistoricIdentityLinkLog> allLinks = historyService
    .createHistoricIdentityLinkLogQuery()
    .list();

// Links by task
List<HistoricIdentityLinkLog> taskLinks = historyService
    .createHistoricIdentityLinkLogQuery()
    .taskId(taskId)
    .list();

// Links by user
List<HistoricIdentityLinkLog> userLinks = historyService
    .createHistoricIdentityLinkLogQuery()
    .userId("john.doe")
    .list();

// Links by group
List<HistoricIdentityLinkLog> groupLinks = historyService
    .createHistoricIdentityLinkLogQuery()
    .groupId("managers")
    .list();
```

---

## History Cleanup

### Automatic Cleanup

```java
// Configure cleanup in ProcessEngineConfiguration
config.setEnableHistoryCleanup(true);
config.setHistoryCleanupBatchSize(1000);
```

### Manual Cleanup

```java
// Cleanup old history
managementService.executeHistoryCleanup();

// Cleanup by date
managementService.executeHistoryCleanup(LocalDate.now().minusYears(1));

// Cleanup specific process definitions
managementService.executeHistoryCleanup(
    Arrays.asList("oldProcess1", "oldProcess2")
);
```

### Cleanup Strategy

```java
@Service
public class HistoryCleanupService {
    
    @Autowired
    private ManagementService managementService;
    
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    public void cleanupOldHistory() {
        log.info("Starting history cleanup...");
        
        // Cleanup history older than 2 years
        LocalDate cutoffDate = LocalDate.now().minusYears(2);
        
        int deleted = managementService.executeHistoryCleanup(cutoffDate);
        
        log.info("Cleaned up {} historic records", deleted);
    }
}
```

---

## API Reference

### HistoryService Methods

```java
// Process Instances
HistoricProcessInstance createHistoricProcessInstanceQuery();
HistoricProcessInstanceEntity createHistoricProcessInstance(String id);

// Task Instances
HistoricTaskInstance createHistoricTaskInstanceQuery();

// Activity Instances
HistoricActivityInstance createHistoricActivityInstanceQuery();

// Variables
HistoricVariableInstance createHistoricVariableInstanceQuery();

// Identity Links
HistoricIdentityLinkLog createHistoricIdentityLinkLogQuery();

// Process Definitions
HistoricProcessDefinition createHistoricProcessDefinitionQuery();
```

### HistoricProcessInstanceQuery

```java
HistoricProcessInstanceQuery createHistoricProcessInstanceQuery();

// Filtering
.processInstanceId(String id)
.processInstanceIdIn(Collection<String> ids)
.processDefinitionId(String id)
.processDefinitionKey(String key)
.processDefinitionKeyIn(Collection<String> keys)
.processDefinitionName(String name)
.processDefinitionCategory(String category)
.tenantIdIn(Collection<String> tenantIds)
.processInstanceBusinessKey(String key)
.processInstanceBusinessKeyLike(String key)
.processInstanceSuperProcessInstanceId(String id)
.processInstanceSubProcessInstanceId(String id)
.startedBy(String userId)
.active()
.finished()
.unfinished()
.startedAfter(Date from)
.startedBefore(Date to)
.finishedAfter(Date from)
.finishedBefore(Date to)
.durationGreaterThanOrEqual(long duration)
.durationLessThanOrEqual(long duration)
.variableName(String name)
.variableValue(String value)
.variableValueEquals(String name, Object value)
.variableValueNotEquals(String name, Object value)
.variableValueGreaterThan(String name, Object value)
.variableValueLessThan(String name, Object value)
.variableValueLike(String name, String value)

// Ordering
.orderByProcessInstanceId()
.orderByProcessDefinitionKey()
.orderByProcessDefinitionName()
.orderByProcessDefinitionCategory()
.orderByProcessDefinitionVersion()
.orderByProcessInstanceBusinessKey()
.orderByStartTime()
.orderByEndTime()
.orderByDuration()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()
```

---

## Usage Examples

### Process Performance Report

```java
@Service
public class ProcessPerformanceReport {
    
    @Autowired
    private HistoryService historyService;
    
    public PerformanceReport generateReport(String processKey, Period period) {
        PerformanceReport report = new PerformanceReport();
        
        // Get all process instances in period
        List<HistoricProcessInstance> instances = historyService
            .createHistoricProcessInstanceQuery()
            .processDefinitionKey(processKey)
            .startedAfter(period.getStartDate())
            .startedBefore(period.getEndDate())
            .list();
        
        report.setTotalInstances(instances.size());
        
        // Calculate average duration
        double avgDuration = instances.stream()
            .filter(i -> i.getEndTime() != null)
            .mapToDouble(HistoricProcessInstance::getDurationInMillis)
            .average()
            .orElse(0);
        
        report.setAverageDuration(avgDuration);
        
        // Find slowest instances
        List<HistoricProcessInstance> slowest = instances.stream()
            .filter(i -> i.getEndTime() != null)
            .sorted(Comparator.comparingLong(HistoricProcessInstance::getDurationInMillis).reversed())
            .limit(10)
            .collect(Collectors.toList());
        
        report.setSlowestInstances(slowest);
        
        // Calculate success rate
        long completed = instances.stream()
            .filter(i -> i.getEndTime() != null)
            .count();
        
        report.setCompletionRate((double) completed / instances.size());
        
        return report;
    }
}
```

### Audit Trail Generator

```java
@Service
public class AuditTrailService {
    
    @Autowired
    private HistoryService historyService;
    
    public AuditTrail generateAuditTrail(String processInstanceId) {
        AuditTrail trail = new AuditTrail();
        
        // Process instance info
        HistoricProcessInstance instance = historyService
            .createHistoricProcessInstanceQuery()
            .processInstanceId(processInstanceId)
            .singleResult();
        
        trail.setProcessInstanceId(instance.getId());
        trail.setProcessKey(instance.getProcessDefinitionKey());
        trail.setBusinessKey(instance.getBusinessKey());
        trail.setStartTime(instance.getStartTime());
        trail.setEndTime(instance.getEndTime());
        
        // Activity sequence
        List<HistoricActivityInstance> activities = historyService
            .createHistoricActivityInstanceQuery()
            .processInstanceId(processInstanceId)
            .orderByActivityInstanceId()
            .asc()
            .list();
        
        trail.setActivities(activities);
        
        // Task history
        List<HistoricTaskInstance> tasks = historyService
            .createHistoricTaskInstanceQuery()
            .processInstanceId(processInstanceId)
            .list();
        
        trail.setTasks(tasks);
        
        // Variable changes
        List<HistoricVariableInstance> variables = historyService
            .createHistoricVariableInstanceQuery()
            .processInstanceId(processInstanceId)
            .orderByTime()
            .asc()
            .list();
        
        trail.setVariables(variables);
        
        // Identity links
        List<HistoricIdentityLinkLog> identityLinks = historyService
            .createHistoricIdentityLinkLogQuery()
            .processInstanceId(processInstanceId)
            .list();
        
        trail.setIdentityLinks(identityLinks);
        
        return trail;
    }
}
```

---

## Best Practices

### 1. Choose Appropriate History Level

```java
// Production - AUDIT level
config.setHistoryLevel(HistoryLevel.AUDIT);

// Development - NONE for performance
config.setHistoryLevel(HistoryLevel.NONE);

// Compliance - FULL for complete audit
config.setHistoryLevel(HistoryLevel.FULL);
```

### 2. Implement History Cleanup

```java
// Regular cleanup of old history
@Scheduled(cron = "0 0 2 * * ?")
public void cleanupHistory() {
    managementService.executeHistoryCleanup(
        LocalDate.now().minusYears(1)
    );
}
```

### 3. Index Frequently Queried Fields

```java
// Add database indexes for common queries
CREATE INDEX idx_process_key ON ACT_HI_PROCINST(PROC_DEF_KEY_);
CREATE INDEX idx_business_key ON ACT_HI_PROCINST(BUSINESS_KEY_);
CREATE INDEX idx_start_time ON ACT_HI_PROCINST(START_TIME_);
```

### 4. Use Pagination for Large Result Sets

```java
// GOOD - Paginated query
List<HistoricProcessInstance> page = historyService
    .createHistoricProcessInstanceQuery()
    .listPage(0, 100);

// BAD - Load all
List<HistoricProcessInstance> all = historyService
    .createHistoricProcessInstanceQuery()
    .list();
```

---

## See Also

- [Parent Documentation](README.md)
- [Management Service](./07-history-service.md)
- [Best Practices](../../best-practices.md)
