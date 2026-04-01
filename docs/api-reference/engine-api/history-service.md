---
sidebar_label: History Service
slug: /api-reference/engine-api/history-service
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

- **Record process instance history**: Track all process instances from start to completion
- **Track task execution history**: Monitor user tasks, service tasks, and other task types
- **Monitor activity instances**: Record every BPMN activity execution (gateways, events, tasks)
- **Store variable history**: Capture variable values at process completion
- **Maintain identity links**: Track user/group assignments to tasks and processes
- **Enable historical queries**: Provide flexible querying for analytics and reporting

### Why Use History Service?

| Use Case | API | Reasoning |
|----------|-----|-----------|
| **Compliance & Auditing** | HistoricProcessInstance, HistoricTaskInstance | Regulatory requirements demand complete process execution records |
| **Performance Analysis** | HistoricActivityInstance | Identify bottlenecks by analyzing activity durations |
| **User Activity Tracking** | HistoricTaskInstance | Monitor who did what and when for accountability |
| **Process Mining** | HistoricActivityInstance | Reconstruct actual process flows from execution data |
| **Variable Tracking** | HistoricVariableInstance, HistoricDetail | Understand how data changed throughout process execution |
| **Reporting & Analytics** | All query APIs | Generate dashboards showing process KPIs and trends |
| **Debugging** | ProcessInstanceHistoryLog | Reconstruct what happened in failed or problematic processes |

### Core Concepts

```
History
    ├── Process Instances (completed/active)
    ├── Task Instances (all tasks)
    ├── Activity Instances (all activities)
    ├── Variables (final values + updates)
    ├── Details (variable updates, form properties)
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

// Get active (unfinished) process instances
List<HistoricProcessInstance> active = historyService
    .createHistoricProcessInstanceQuery()
    .unfinished()
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

/**
 * WHY USE THIS:
 * - Query completed instances: Generate reports on finished processes
 * - Query active instances: Monitor currently running processes
 * - Filter by process key: Analyze specific process types
 * - Filter by business key: Track specific business entities (orders, claims, etc.)
 */
```

### Advanced Queries

```java
// Date range query
List<HistoricProcessInstance> inRange = historyService
    .createHistoricProcessInstanceQuery()
    .startedAfter(java.time.LocalDate.of(2024, 1, 1).atStartOfDay().toDate())
    .startedBefore(java.time.LocalDate.of(2024, 12, 31).atTime(java.time.LocalTime.MAX).toDate())
    .list();

// Multiple criteria with ordering
List<HistoricProcessInstance> results = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .processInstanceBusinessKeyLike("ORDER-%")
    .startedAfter(java.time.LocalDate.now().minusMonths(1).atStartOfDay().toDate())
    .finished()
    .orderByProcessInstanceStartTime()
    .desc()
    .listPage(0, 50);

// Query by involved user
List<HistoricProcessInstance> userProcesses = historyService
    .createHistoricProcessInstanceQuery()
    .involvedUser("john.doe")
    .list();

// Query by variable value
List<HistoricProcessInstance> highValueOrders = historyService
    .createHistoricProcessInstanceQuery()
    .variableValueGreaterThan("orderAmount", 10000)
    .finished()
    .list();

/**
 * WHY USE THIS:
 * - Date range queries: Generate period reports (daily, weekly, monthly)
 * - Business key like: Find all processes related to a pattern (e.g., ORDER-2024-*)
 * - Pagination: Handle large datasets efficiently
 * - Involved user: Track all processes a user participated in
 * - Variable filters: Find processes with specific data characteristics
 */
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
        System.out.println("Start User: " + instance.getStartUserId());
        System.out.println("Delete Reason: " + instance.getDeleteReason());
    }
    
    /**
     * WHY USE THIS:
     * - Audit trail: Understand what happened in a specific process
     * - Performance analysis: Calculate duration and identify slow processes
     * - Debugging: Check delete reasons and start users for troubleshooting
     * - Reporting: Extract business keys and metadata for reports
     */
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

// Finished tasks only
List<HistoricTaskInstance> finishedTasks = historyService
    .createHistoricTaskInstanceQuery()
    .finished()
    .list();

// Tasks completed within date range
List<HistoricTaskInstance> recentTasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskCompletedAfter(java.time.LocalDate.now().minusDays(7).atStartOfDay().toDate())
    .list();

/**
 * WHY USE THIS:
 * - User productivity: Track tasks completed by specific users
 * - SLA monitoring: Check task completion times against service level agreements
 * - Process analysis: Understand task flow within processes
 * - Workload balancing: Identify users with high task volumes
 * - Compliance: Verify task assignments and completions
 */
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

// Task completion time - filter manually since no duration method in query
List<HistoricTaskInstance> allFinishedTasks = historyService
    .createHistoricTaskInstanceQuery()
    .finished()
    .orderByHistoricTaskInstanceDuration()
    .desc()
    .listPage(0, 100);

List<HistoricTaskInstance> slowTasks = allFinishedTasks.stream()
    .filter(t -> t.getDurationInMillis() >= 86400000) // 24 hours
    .limit(10)
    .collect(Collectors.toList());

/**
 * WHY USE THIS:
 * - Performance metrics: Calculate average task completion times
 * - Bottleneck identification: Find tasks that take too long
 * - SLA compliance: Verify tasks meet time requirements
 * - Process optimization: Identify tasks needing automation or simplification
 */
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
        System.out.println("Work Time: " + task.getWorkTimeInMillis() + "ms");
        System.out.println("Delete Reason: " + task.getDeleteReason());
    }
    
    /**
     * WHY USE THIS:
     * - Audit trail: Complete record of task lifecycle
     * - User accountability: Track who claimed and completed tasks
     * - Performance analysis: Work time vs total duration insights
     * - Debugging: Understand why tasks were deleted or skipped
     */
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

// Activities by type - use string literal, not constant
List<HistoricActivityInstance> userTasks = historyService
    .createHistoricActivityInstanceQuery()
    .activityType("userTask")
    .list();

// Activities by name
List<HistoricActivityInstance> byActivityName = historyService
    .createHistoricActivityInstanceQuery()
    .activityName("Approve Order")
    .list();

// Finished activities only
List<HistoricActivityInstance> finishedActivities = historyService
    .createHistoricActivityInstanceQuery()
    .finished()
    .list();

/**
 * WHY USE THIS:
 * - Process mining: Reconstruct actual process flows from execution data
 * - Bottleneck analysis: Identify slow activities across all processes
 * - Compliance verification: Ensure all required activities were executed
 * - Performance optimization: Find activities that need improvement
 * - Activity type filtering: Analyze specific BPMN elements (user tasks, service tasks, gateways)
 */
```

### Activity Flow Analysis

```java
// Get activity sequence - use correct ordering method
List<HistoricActivityInstance> sequence = historyService
    .createHistoricActivityInstanceQuery()
    .processInstanceId(processInstanceId)
    .orderByHistoricActivityInstanceStartTime()
    .asc()
    .list();

// Calculate activity durations
Map<String, Long> activityDurations = sequence.stream()
    .collect(Collectors.toMap(
        HistoricActivityInstance::getActivityId,
        HistoricActivityInstance::getDurationInMillis
    ));

// Find bottlenecks - filter manually since no duration method in query
List<HistoricActivityInstance> allActivities = historyService
    .createHistoricActivityInstanceQuery()
    .finished()
    .orderByHistoricActivityInstanceDuration()
    .desc()
    .listPage(0, 100);

List<HistoricActivityInstance> bottlenecks = allActivities.stream()
    .filter(a -> a.getDurationInMillis() >= 3600000) // 1 hour
    .limit(10)
    .collect(Collectors.toList());

/**
 * WHY USE THIS:
 * - Process flow visualization: Reconstruct the actual path taken through the process
 * - Duration analysis: Calculate how long each activity takes on average
 * - Bottleneck identification: Find activities that consistently take too long
 * - Variant analysis: Discover different paths users take through the process
 * - Performance trending: Track activity performance over time
 */
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

// Variables by name and value
List<HistoricVariableInstance> byNameAndValue = historyService
    .createHistoricVariableInstanceQuery()
    .variableValueEquals("orderId", "ORDER-12345")
    .list();

// Variables with value like pattern
List<HistoricVariableInstance> byValueLike = historyService
    .createHistoricVariableInstanceQuery()
    .variableValueLike("orderNumber", "ORD-%")
    .list();

/**
 * WHY USE THIS:
 * - Data tracking: Understand what values variables had at process completion
 * - Business analysis: Query processes by their variable values
 * - Audit compliance: Verify data used in decision-making
 * - Reporting: Generate reports based on variable content
 * - Debugging: Check what data was available when process completed
 */
```

### Variable History

```java
// Get variable value changes - HistoricVariableInstance only has final values
// For variable updates, use HistoricDetailQuery with variableUpdates()
List<HistoricVariableInstance> finalVariables = historyService
    .createHistoricVariableInstanceQuery()
    .processInstanceId(processInstanceId)
    .variableName("orderStatus")
    .list();

// Display variable information
for (HistoricVariableInstance var : finalVariables) {
    System.out.println("Variable: " + var.getVariableName());
    System.out.println("Value: " + var.getValue());
    System.out.println("Type: " + var.getVariableTypeName());
    System.out.println("Created: " + var.getCreateTime());
    System.out.println("Last Updated: " + var.getLastUpdatedTime());
    System.out.println("Task ID: " + var.getTaskId()); // null if process variable
}

// For variable UPDATE history, use HistoricDetailQuery (requires FULL history level)
List<HistoricDetail> variableUpdates = historyService
    .createHistoricDetailQuery()
    .processInstanceId(processInstanceId)
    .variableUpdates()
    .orderByTime()
    .asc()
    .list();

/**
 * WHY USE THIS:
 * - Final state capture: HistoricVariableInstance stores the LAST value at process completion
 * - Variable timeline: HistoricDetail tracks ALL changes (requires FULL history level)
 * - Task vs Process variables: Distinguish between local and global variables
 * - Type information: Understand variable types for proper handling
 * - Change tracking: See when variables were created and last updated
 * 
 * IMPORTANT:
 * - HistoricVariableInstance: Only final values (AUDIT level)
 * - HistoricDetail: All updates including intermediate values (FULL level required)
 */
```

---

## Identity Links

### Querying Identity Links

**IMPORTANT:** There is no `HistoricIdentityLinkLog` or query interface for identity links. 
Use the ManagementService methods instead:

```java
// Get identity links for a specific task
List<HistoricIdentityLink> taskLinks = historyService
    .getHistoricIdentityLinksForTask(taskId, processInstanceId);

// Get identity links for a process instance
List<HistoricIdentityLink> processLinks = historyService
    .getHistoricIdentityLinksForProcessInstance(processInstanceId);

/**
 * WHY USE THIS:
 * - Task assignment tracking: See who was assigned to tasks
 * - Candidate analysis: Understand group-based task assignments
 * - Audit compliance: Verify proper authorization for task access
 * - User activity: Track which users had access to which tasks
 * 
 * LIMITATIONS:
 * - No query interface available - must know task/process instance ID
 * - Returns HistoricIdentityLink (not HistoricIdentityLinkLog)
 * - Limited filtering capabilities compared to other history queries
 */
```

### Identity Link Details

```java
public class IdentityLinkAnalyzer {
    
    @Autowired
    private HistoryService historyService;
    
    public void analyzeTaskIdentityLinks(String taskId, String processInstanceId) {
        List<HistoricIdentityLink> links = historyService
            .getHistoricIdentityLinksForTask(taskId, processInstanceId);
        
        for (HistoricIdentityLink link : links) {
            System.out.println("User ID: " + link.getUserId());
            System.out.println("Group ID: " + link.getGroupId());
            System.out.println("Type: " + link.getType());
            System.out.println("Task ID: " + link.getTaskId());
            System.out.println("Process Instance ID: " + link.getProcessInstanceId());
        }
    }
    
    /**
     * WHY USE THIS:
     * - Understand task assignments: See who was assigned vs who had candidate access
     * - Type analysis: Distinguish between 'assignee' and 'candidate' types
     * - Group tracking: Monitor group-based task assignments
     * - Audit trail: Complete record of who had access to tasks
     */
}
```

---

## History Cleanup

### ⚠️ Important Note

**There is NO `executeHistoryCleanup()` method in ManagementService or HistoryService in Activiti 8.7.2.**

History cleanup must be implemented manually using database operations or by deleting process instances.

### Manual History Cleanup Approaches

#### 1. Delete Process Instances (Recommended)

```java
// Delete a process instance and its history
runtimeService.deleteProcessInstance(processInstanceId, "Cleanup - old process");

// This removes:
// - Runtime data (executions, tasks, variables)
// - Historic data (if not using external history storage)
```

#### 2. Direct Database Cleanup (Advanced)

```java
// WARNING: Only use this if you understand the database schema
// and have proper backups

@PersistenceContext
private EntityManager entityManager;

public void cleanupHistoryOlderThan(Date cutoffDate) {
    // Delete from historic tables in correct order to avoid FK violations
    // Order matters due to foreign key constraints
    
    // 1. Delete historic details
    entityManager.createQuery(
        "DELETE FROM HistoricDetail d WHERE d.time < :cutoff")
        .setParameter("cutoff", cutoffDate)
        .executeUpdate();
    
    // 2. Delete historic variable updates
    entityManager.createQuery(
        "DELETE FROM HistoricVariableUpdate v WHERE v.time_ < :cutoff")
        .setParameter("cutoff", cutoffDate)
        .executeUpdate();
    
    // 3. Delete historic identity links
    entityManager.createQuery(
        "DELETE FROM HistoricIdentityLink i WHERE i.taskId IN " +
        "(SELECT t.id_ FROM HistoricTaskInstance t WHERE t.endTime < :cutoff)")
        .setParameter("cutoff", cutoffDate)
        .executeUpdate();
    
    // 4. Delete historic activity instances
    entityManager.createQuery(
        "DELETE FROM HistoricActivityInstance a WHERE a.endTime < :cutoff")
        .setParameter("cutoff", cutoffDate)
        .executeUpdate();
    
    // 5. Delete historic task instances
    entityManager.createQuery(
        "DELETE FROM HistoricTaskInstance t WHERE t.endTime < :cutoff")
        .setParameter("cutoff", cutoffDate)
        .executeUpdate();
    
    // 6. Delete historic variables
    entityManager.createQuery(
        "DELETE FROM HistoricVariableInstance v WHERE v.processInstanceId IN " +
        "(SELECT p.id_ FROM HistoricProcessInstance p WHERE p.endTime < :cutoff)")
        .setParameter("cutoff", cutoffDate)
        .executeUpdate();
    
    // 7. Delete historic process instances
    entityManager.createQuery(
        "DELETE FROM HistoricProcessInstance p WHERE p.endTime < :cutoff")
        .setParameter("cutoff", cutoffDate)
        .executeUpdate();
}

/**
 * WHY USE THIS:
 * - Database growth control: Prevent history tables from becoming too large
 * - Compliance: Retain only required history based on legal requirements
 * - Performance: Improve query performance on smaller datasets
 * - Cost reduction: Reduce database storage costs
 * 
 * ⚠️ CRITICAL WARNINGS:
 * - Must delete in correct order to avoid foreign key violations
 * - Test thoroughly in non-production environment first
 * - Consider using database partitioning instead of deletion
 * - Ensure compliance with data retention policies
 * - Backup data before cleanup operations
 */
```

#### 3. Scheduled Cleanup Service

```java
@Service
public class HistoryCleanupService {
    
    @Autowired
    private RuntimeService runtimeService;
    
    @Autowired
    private HistoryService historyService;
    
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    public void cleanupOldProcesses() {
        log.info("Starting history cleanup...");
        
        // Find completed processes older than 2 years
        Date cutoffDate = Date.from(LocalDate.now().minusYears(2)
            .atStartOfDay(ZoneId.systemDefault()).toInstant());
        
        List<HistoricProcessInstance> oldProcesses = historyService
            .createHistoricProcessInstanceQuery()
            .finished()
            .endedBefore(cutoffDate)
            .list();
        
        // Delete each process instance
        for (HistoricProcessInstance process : oldProcesses) {
            try {
                // Note: This only works if process instance still exists in runtime
                // For completed processes, you may need direct DB cleanup
                runtimeService.deleteProcessInstance(
                    process.getId(), 
                    "Automated cleanup - process older than 2 years"
                );
                log.info("Deleted process: {}", process.getId());
            } catch (Exception e) {
                log.warn("Could not delete process {}: {}", 
                    process.getId(), e.getMessage());
            }
        }
        
        log.info("Cleanup completed. Processed {} processes.", oldProcesses.size());
    }
}
```

### Alternative: Database Partitioning

```sql
-- Instead of deleting, partition history tables by date
-- This maintains data while improving query performance

-- Example for PostgreSQL
ALTER TABLE ACT_HI_PROCINST 
PARTITION BY RANGE (start_time_) (
    PARTITION p2022 VALUES LESS THAN ('2023-01-01'),
    PARTITION p2023 VALUES LESS THAN ('2024-01-01'),
    PARTITION p2024 VALUES LESS THAN ('2025-01-01')
);

-- Drop old partitions instead of deleting rows
DROP PARTITION ACT_HI_PROCINST.p2022;
```

**WHY USE PARTITIONING:**
- Faster cleanup (drop partition vs delete rows)
- Better query performance on recent data
- Maintains audit trail when needed
- No foreign key constraint issues

---

## API Reference

### HistoryService Methods

```java
// Process Instances
HistoricProcessInstanceQuery createHistoricProcessInstanceQuery();

// Task Instances
HistoricTaskInstanceQuery createHistoricTaskInstanceQuery();

// Activity Instances
HistoricActivityInstanceQuery createHistoricActivityInstanceQuery();

// Variables
HistoricVariableInstanceQuery createHistoricVariableInstanceQuery();

// Details (variable updates, form properties) - requires FULL history level
HistoricDetailQuery createHistoricDetailQuery();

// Identity Links - returns list, not query
List<HistoricIdentityLink> getHistoricIdentityLinksForTask(String taskId, String processInstanceId);
List<HistoricIdentityLink> getHistoricIdentityLinksForProcessInstance(String processInstanceId);

// Process Instance History Log - convenience method for debugging
ProcessInstanceHistoryLogQuery createProcessInstanceHistoryLog(String processInstanceId);

/**
 * ⚠️ REMOVED/MISLEADING METHODS:
 * - createHistoricIdentityLinkLogQuery() - DOES NOT EXIST
 * - createHistoricProcessInstance(String id) - DOES NOT EXIST
 * - createHistoricTaskInstance() - DOES NOT EXIST
 * - createHistoricProcessDefinitionQuery() - DOES NOT EXIST
 */
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
.processInstanceBusinessKey(String key)
.processInstanceBusinessKeyLike(String key)
.processInstanceSuperProcessInstanceId(String id)
.startedBy(String userId)
.involvedUser(String userId)
.tenantIdIn(Collection<String> tenantIds)
.unfinished()
.finished()
.startedAfter(Date from)
.startedBefore(Date to)
.endedAfter(Date from)
.endedBefore(Date to)
.variableName(String name)
.variableValueEquals(String name, Object value)
.variableValueNotEquals(String name, Object value)
.variableValueGreaterThan(String name, Object value)
.variableValueLessThan(String name, Object value)
.variableValueLike(String name, String value)

// Ordering
.orderByProcessInstanceId()
.orderByProcessDefinitionKey()
.orderByProcessDefinitionName()
.orderByProcessInstanceBusinessKey()
.orderByProcessInstanceStartTime()
.orderByProcessInstanceEndTime()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()

/**
 * ⚠️ REMOVED/MISLEADING METHODS:
 * - active() - use unfinished() instead
 * - durationGreaterThanOrEqual(long) - DOES NOT EXIST
 * - durationLessThanOrEqual(long) - DOES NOT EXIST
 * - processInstanceSubProcessInstanceId() - DOES NOT EXIST
 * - orderByStartTime() - use orderByProcessInstanceStartTime()
 * - orderByEndTime() - use orderByProcessInstanceEndTime()
 * - orderByDuration() - DOES NOT EXIST
 */
```

### HistoricTaskInstanceQuery

```java
HistoricTaskInstanceQuery createHistoricTaskInstanceQuery();

// Filtering
.taskId(String id)
.taskIdIn(Collection<String> ids)
.processInstanceId(String id)
.processDefinitionId(String id)
.processDefinitionKey(String key)
.taskName(String name)
.taskNameLike(String name)
.taskDescription(String description)
.taskDescriptionLike(String description)
.taskDefinitionKey(String key)
.taskAssignee(String assignee)
.taskCandidateUser(String user)
.taskCandidateGroup(String group)
.taskOwner(String owner)
.taskCreateTimeAfter(Date from)
.taskCreateTimeBefore(Date to)
.taskDueDateAfter(Date from)
.taskDueDateBefore(Date to)
.taskCompletedAfter(Date from)
.taskCompletedBefore(Date to)
.unfinished()
.finished()
.withVariableName(String name)
.variableValueEquals(String name, Object value)
.variableValueNotEquals(String name, Object value)
.variableValueGreaterThan(String name, Object value)
.variableValueLessThan(String name, Object value)
.variableValueLike(String name, String value)
.tenantIdIn(Collection<String> tenantIds)

// Ordering
.orderByTaskId()
.orderByProcessInstanceId()
.orderByTaskName()
.orderByTaskAssignee()
.orderByTaskOwner()
.orderByTaskCreateTime()
.orderByTaskDueDate()
.orderByTaskCompletionTime()
.orderByHistoricTaskInstanceDuration()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()
```

### HistoricActivityInstanceQuery

```java
HistoricActivityInstanceQuery createHistoricActivityInstanceQuery();

// Filtering
.activityId(String id)
.activityIdIn(Collection<String> ids)
.activityName(String name)
.activityNameLike(String name)
.activityType(String type) // e.g., "userTask", "serviceTask", "gateway"
.processInstanceId(String id)
.processDefinitionId(String id)
.processDefinitionKey(String key)
.executionId(String id)
.taskId(String id)
.startedAfter(Date from)
.startedBefore(Date to)
.endedAfter(Date from)
.endedBefore(Date to)
.unfinished()
.finished()
.tenantIdIn(Collection<String> tenantIds)

// Ordering
.orderByHistoricActivityInstanceId()
.orderByActivityId()
.orderByActivityName()
.orderByProcessInstanceId()
.orderByProcessDefinitionKey()
.orderByHistoricActivityInstanceStartTime()
.orderByHistoricActivityInstanceEndTime()
.orderByHistoricActivityInstanceDuration()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()

/**
 * ⚠️ REMOVED/MISLEADING METHODS:
 * - orderByActivityInstanceId() - use orderByHistoricActivityInstanceId()
 * - durationGreaterThanOrEqual(long) - DOES NOT EXIST
 */
```

### HistoricVariableInstanceQuery

```java
HistoricVariableInstanceQuery createHistoricVariableInstanceQuery();

// Filtering
.variableId(String id)
.variableName(String name)
.variableNameLike(String name)
.processInstanceId(String id)
.executionId(String id)
.taskId(String id)
.variableValue(String value)
.variableValueEquals(String name, Object value)
.variableValueNotEquals(String name, Object value)
.variableValueGreaterThan(String name, Object value)
.variableValueLessThan(String name, Object value)
.variableValueLike(String name, String value)
.variableType(String type)
.tenantIdIn(Collection<String> tenantIds)

// Ordering
.orderByVariableId()
.orderByVariableName()
.orderByProcessInstanceId()
.orderByTaskId()
.orderByVariableType()
.orderByVariableCreateTime()
.orderByVariableLastUpdateTime()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()

/**
 * ⚠️ REMOVED/MISLEADING METHODS:
 * - orderByTime() - use orderByVariableCreateTime() or orderByVariableLastUpdateTime()
 */
```

### HistoricDetailQuery

```java
HistoricDetailQuery createHistoricDetailQuery();

// Filtering
.id(String id)
.processInstanceId(String id)
.executionId(String id)
.activityInstanceId(String id)
.taskId(String id)
.variableUpdates() // Only variable updates
.excludeTaskDetails() // Exclude task-related details
.tenantIdIn(Collection<String> tenantIds)

// Ordering
.orderByProcessInstanceId()
.orderByVariableName()
.orderByFormPropertyId()
.orderByVariableType()
.orderByVariableRevision()
.orderByTime()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()

/**
 * NOTE: Requires FULL history level to capture variable updates and form properties
 */
```

### ProcessInstanceHistoryLogQuery

```java
ProcessInstanceHistoryLogQuery createProcessInstanceHistoryLog(String processInstanceId);

// Include different types of history
.includeTasks()
.includeActivities()
.includeVariables()
.includeComments()
.includeVariableUpdates() // Requires FULL history level
.includeFormProperties() // Requires FULL history level

// Execute query
.singleResult()

/**
 * WHY USE THIS:
 * - Debugging: Get complete timeline of a process instance
 * - Audit: Reconstruct everything that happened in a process
 * - Support: Understand what went wrong in failed processes
 * - Training: Show complete process execution to new team members
 * 
 * NOTE: Each includeXXX() method executes a separate query
 */
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
            .orderByHistoricActivityInstanceStartTime()
            .asc()
            .list();
        
        trail.setActivities(activities);
        
        // Task history
        List<HistoricTaskInstance> tasks = historyService
            .createHistoricTaskInstanceQuery()
            .processInstanceId(processInstanceId)
            .list();
        
        trail.setTasks(tasks);
        
        // Variable final values
        List<HistoricVariableInstance> variables = historyService
            .createHistoricVariableInstanceQuery()
            .processInstanceId(processInstanceId)
            .orderByVariableCreateTime()
            .asc()
            .list();
        
        trail.setVariables(variables);
        
        // Identity links - use correct method
        List<HistoricIdentityLink> identityLinks = historyService
            .getHistoricIdentityLinksForProcessInstance(processInstanceId);
        
        trail.setIdentityLinks(identityLinks);
        
        return trail;
    }
    
    /**
     * WHY USE THIS:
     * - Complete audit trail: Get everything that happened in a process
     * - Compliance reporting: Generate regulatory reports
     * - Incident investigation: Understand what went wrong
     * - Process analysis: Study actual execution vs designed process
     */
}
```

### Process Instance History Log (Debugging Tool)

```java
@Service
public class ProcessDebugger {
    
    @Autowired
    private HistoryService historyService;
    
    public void debugProcessInstance(String processInstanceId) {
        // Get complete history log - this is a powerful debugging tool
        ProcessInstanceHistoryLog historyLog = historyService
            .createProcessInstanceHistoryLog(processInstanceId)
            .includeActivities()
            .includeTasks()
            .includeVariables()
            .includeComments()
            .includeVariableUpdates() // Requires FULL history level
            .includeFormProperties() // Requires FULL history level
            .singleResult();
        
        // Display timeline
        System.out.println("=== Process Instance Timeline ===");
        System.out.println("Process ID: " + processInstanceId);
        System.out.println("Start Time: " + historyLog.getStartTime());
        System.out.println("End Time: " + historyLog.getEndTime());
        
        // Activities
        System.out.println("\n=== Activities ===");
        for (HistoricActivityInstance activity : historyLog.getActivities()) {
            System.out.println(String.format(
                "%s - %s (%s) - Duration: %dms",
                activity.getStartTime(),
                activity.getActivityName(),
                activity.getActivityType(),
                activity.getDurationInMillis()
            ));
        }
        
        // Tasks
        System.out.println("\n=== Tasks ===");
        for (HistoricTaskInstance task : historyLog.getTasks()) {
            System.out.println(String.format(
                "%s - %s (Assignee: %s) - Duration: %dms",
                task.getStartTime(),
                task.getName(),
                task.getAssignee(),
                task.getDurationInMillis()
            ));
        }
        
        // Variables
        System.out.println("\n=== Variables ===");
        for (HistoricVariableInstance variable : historyLog.getVariables()) {
            System.out.println(String.format(
                "%s - %s = %s",
                variable.getCreateTime(),
                variable.getVariableName(),
                variable.getValue()
            ));
        }
        
        // Variable updates (if FULL history level)
        System.out.println("\n=== Variable Updates ===");
        for (HistoricDetail detail : historyLog.getVariableUpdates()) {
            System.out.println(String.format(
                "%s - %s changed to: %s",
                detail.getTime(),
                detail.getName(),
                detail.getTextValue()
            ));
        }
        
        // Comments
        System.out.println("\n=== Comments ===");
        for (Comment comment : historyLog.getComments()) {
            System.out.println(String.format(
                "%s by %s: %s",
                comment.getTime(),
                comment.getUser(),
                comment.getMessage()
            ));
        }
    }
    
    /**
     * WHY USE THIS:
     * - Debugging: See complete timeline of what happened
     * - Support: Help users understand process status
     * - Training: Show examples of process execution
     * - Root cause analysis: Understand why processes fail
     * - Performance analysis: See where time was spent
     * 
     * NOTE:
     * - Each includeXXX() executes a separate query
     * - Variable updates and form properties require FULL history level
     * - Results are automatically ordered by time (ascending)
     */
}
```

---

## Best Practices

### 1. Choose Appropriate History Level

```java
// Production - AUDIT level (recommended for most cases)
config.setHistoryLevel(HistoryLevel.AUDIT);

// Development - NONE for performance
config.setHistoryLevel(HistoryLevel.NONE);

// Compliance - FULL for complete audit trail
config.setHistoryLevel(HistoryLevel.FULL);

/**
 * WHY CHOOSE EACH LEVEL:
 * 
 * NONE:
 * - Use in development/testing for maximum performance
 * - No history data stored
 * - Cannot query historic data
 * 
 * ACTIVITY:
 * - Minimal history: only activity instances
 * - Good for basic process flow tracking
 * - No task or variable history
 * 
 * AUDIT (RECOMMENDED):
 * - Complete process, task, activity, and variable history
 * - Sufficient for most business needs
 * - Good balance of functionality and performance
 * - Final variable values only (not updates)
 * 
 * FULL:
 * - Everything in AUDIT plus variable updates and form properties
 * - Required for detailed audit trails
 * - More database storage and slower performance
 * - Use when compliance requires complete change history
 */
```

### 2. Implement History Cleanup Strategy

```java
// Since there's no built-in cleanup API, implement your own strategy

@Service
public class HistoryManagementService {
    
    @Autowired
    private HistoryService historyService;
    
    @Autowired
    private RuntimeService runtimeService;
    
    /**
     * Strategy 1: Delete completed process instances
     * - Safest approach using Activiti APIs
     * - Only works for processes still in runtime
     */
    public void deleteOldCompletedProcesses(Date cutoffDate) {
        List<HistoricProcessInstance> oldProcesses = historyService
            .createHistoricProcessInstanceQuery()
            .finished()
            .endedBefore(cutoffDate)
            .listPage(0, 100);
        
        for (HistoricProcessInstance process : oldProcesses) {
            try {
                runtimeService.deleteProcessInstance(
                    process.getId(),
                    "Automated cleanup - process older than retention period"
                );
            } catch (Exception e) {
                // Process may already be deleted
                log.debug("Could not delete process {}: {}", 
                    process.getId(), e.getMessage());
            }
        }
    }
    
    /**
     * Strategy 2: Database partitioning (recommended for large datasets)
     * - Partition history tables by date
     * - Drop old partitions instead of deleting rows
     * - Much faster than row-by-row deletion
     * See SQL examples in History Cleanup section
     */
    
    /**
     * Strategy 3: Archive to external storage
     * - Copy old history to data warehouse
     * - Delete from operational database
     * - Maintain compliance while improving performance
     */
}

/**
 * WHY IMPLEMENT CLEANUP:
 * - Database growth: History tables can grow very large
 * - Query performance: Smaller tables = faster queries
 * - Storage costs: Reduce database size and backup times
 * - Compliance: Retain only required history period
 */
```

### 3. Index Frequently Queried Fields

```sql
-- Add database indexes for common query patterns

-- Process instance queries
CREATE INDEX idx_hi_procinst_proc_def_key ON ACT_HI_PROCINST(PROC_DEF_KEY_);
CREATE INDEX idx_hi_procinst_business_key ON ACT_HI_PROCINST(BUSINESS_KEY_);
CREATE INDEX idx_hi_procinst_start_time ON ACT_HI_PROCINST(START_TIME_);
CREATE INDEX idx_hi_procinst_end_time ON ACT_HI_PROCINST(END_TIME_);

-- Task instance queries
CREATE INDEX idx_hi_taskinst_assignee ON ACT_HI_TASKINST(ASSIGNEE_);
CREATE INDEX idx_hi_taskinst_name ON ACT_HI_TASKINST(NAME_);
CREATE INDEX idx_hi_taskinst_start_time ON ACT_HI_TASKINST(START_TIME_);
CREATE INDEX idx_hi_taskinst_end_time ON ACT_HI_TASKINST(END_TIME_);

-- Activity instance queries
CREATE INDEX idx_hi_actinst_proc_inst ON ACT_HI_ACTINST(PROC_INST_ID_);
CREATE INDEX idx_hi_actinst_activity_type ON ACT_HI_ACTINST(ACT_ID_);
CREATE INDEX idx_hi_actinst_start_time ON ACT_HI_ACTINST(START_TIME_);

-- Variable instance queries
CREATE INDEX idx_hi_varinst_proc_inst ON ACT_HI_VARINST(PROC_INST_ID_);
CREATE INDEX idx_hi_varinst_name ON ACT_HI_VARINST(NAME_);

/**
 * WHY ADD INDEXES:
 * - Query performance: Speed up common filtering operations
 * - Date range queries: Indexes on start/end times are crucial
 * - Business key lookups: Fast retrieval by business identifiers
 * - Assignee queries: Quick user-based task lookups
 * 
 * MONITOR:
 * - Use database query analyzer to identify slow queries
 * - Add indexes based on actual query patterns
 * - Remove unused indexes to improve write performance
 */
```

### 4. Use Pagination for Large Result Sets

```java
// GOOD - Paginated query
List<HistoricProcessInstance> page = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .finished()
    .listPage(0, 100);

// BETTER - Process in batches
int pageSize = 100;
int page = 0;
List<HistoricProcessInstance> allResults = new ArrayList<>();

do {
    List<HistoricProcessInstance> batch = historyService
        .createHistoricProcessInstanceQuery()
        .processDefinitionKey("orderProcess")
        .finished()
        .listPage(page * pageSize, pageSize);
    
    allResults.addAll(batch);
    page++;
} while (batch.size() == pageSize);

// BEST - Stream processing for very large datasets
// Process each batch immediately without storing all results
int pageSize = 100;
int page = 0;

do {
    List<HistoricProcessInstance> batch = historyService
        .createHistoricProcessInstanceQuery()
        .processDefinitionKey("orderProcess")
        .finished()
        .listPage(page * pageSize, pageSize);
    
    // Process batch immediately
    processBatch(batch);
    
    page++;
} while (batch.size() == pageSize);

/**
 * WHY USE PAGINATION:
 * - Memory efficiency: Don't load millions of rows into memory
 * - Performance: Smaller queries execute faster
 * - Database load: Reduce connection time and resource usage
 * - User experience: Show progress for large operations
 * 
 * AVOID:
 * - .list() without pagination on large datasets
 * - Loading all results before processing
 * - Infinite loops without proper termination
 */
```

### 5. Query Optimization Tips

```java
// TIP 1: Use specific filters instead of loading and filtering in Java

// BAD - Load all then filter
List<HistoricProcessInstance> all = historyService
    .createHistoricProcessInstanceQuery()
    .list();
List<HistoricProcessInstance> filtered = all.stream()
    .filter(p -> p.getProcessDefinitionKey().equals("orderProcess"))
    .collect(Collectors.toList());

// GOOD - Filter in database
List<HistoricProcessInstance> filtered = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .list();

// TIP 2: Use IN clauses for multiple values
List<String> processKeys = Arrays.asList("orderProcess", "claimProcess", "approvalProcess");
List<HistoricProcessInstance> results = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKeyIn(processKeys)
    .list();

// TIP 3: Order by indexed columns
List<HistoricProcessInstance> results = historyService
    .createHistoricProcessInstanceQuery()
    .orderByProcessInstanceStartTime()
    .desc()
    .listPage(0, 100);

// TIP 4: Use count() before loading large result sets
long count = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .count();

if (count > 10000) {
    log.warn("Large result set detected: {} records", count);
    // Implement pagination or additional filtering
}

/**
 * WHY OPTIMIZE QUERIES:
 * - Database performance: Let the database do the work
 * - Network efficiency: Transfer only needed data
 * - Memory usage: Reduce Java heap consumption
 * - Response time: Faster queries = better user experience
 */
```

### 6. Use ProcessInstanceHistoryLog for Debugging

```java
// When debugging a specific process instance, use the history log
// It provides a complete, time-ordered view of everything that happened

public void debugFailedProcess(String processInstanceId) {
    ProcessInstanceHistoryLog historyLog = historyService
        .createProcessInstanceHistoryLog(processInstanceId)
        .includeActivities()
        .includeTasks()
        .includeVariables()
        .includeComments()
        .singleResult();
    
    // Analyze the timeline to find what went wrong
    // This is much easier than querying each type separately
}

/**
 * WHY USE HISTORY LOG:
 * - Complete picture: See all events in chronological order
 * - Debugging: Quickly understand what happened
 * - Support: Help users troubleshoot issues
 * - Training: Show examples of process execution
 * - Root cause analysis: Identify where processes fail
 */
```

### 7. Monitor History Table Growth

```java
@Service
public class HistoryMonitor {
    
    @Autowired
    private HistoryService historyService;
    
    @Scheduled(cron = "0 0 8 * * ?") // Daily at 8 AM
    public void reportHistorySize() {
        long processInstances = historyService
            .createHistoricProcessInstanceQuery()
            .count();
        
        long taskInstances = historyService
            .createHistoricTaskInstanceQuery()
            .count();
        
        long activityInstances = historyService
            .createHistoricActivityInstanceQuery()
            .count();
        
        long variableInstances = historyService
            .createHistoricVariableInstanceQuery()
            .count();
        
        log.info("History table sizes - Process: {}, Tasks: {}, Activities: {}, Variables: {}",
            processInstances, taskInstances, activityInstances, variableInstances);
        
        // Alert if tables are growing too fast
        if (processInstances > 1000000) {
            alertTeam("History table exceeds 1M process instances");
        }
    }
}

/**
 * WHY MONITOR:
 * - Capacity planning: Predict storage needs
 * - Performance issues: Large tables slow down queries
 * - Cleanup timing: Know when to run cleanup jobs
 * - Cost management: Database storage costs
 */
```

---

## Historic Details (Variable Updates & Form Properties)

### Overview

**HistoricDetail** captures fine-grained changes to variables and form properties. This requires **FULL** history level.

```java
// Get all historic details
List<HistoricDetail> allDetails = historyService
    .createHistoricDetailQuery()
    .list();

// Get variable updates only
List<HistoricDetail> variableUpdates = historyService
    .createHistoricDetailQuery()
    .processInstanceId(processInstanceId)
    .variableUpdates()
    .orderByTime()
    .asc()
    .list();

// Get form property updates
List<HistoricDetail> formProperties = historyService
    .createHistoricDetailQuery()
    .processInstanceId(processInstanceId)
    .excludeTaskDetails()
    .orderByTime()
    .asc()
    .list();

/**
 * WHY USE THIS:
 * - Variable change tracking: See EVERY change to variables, not just final values
 * - Audit compliance: Complete record of data modifications
 * - Debugging: Understand how data evolved during process execution
 * - Form tracking: Monitor form property changes
 * - Timeline reconstruction: Build complete history of variable modifications
 * 
 * IMPORTANT:
 * - Requires FULL history level (not available with AUDIT)
 * - HistoricVariableInstance only has FINAL values
 * - HistoricDetail has ALL intermediate values
 * - Can significantly increase database size
 */
```

### Variable Update Example

```java
public class VariableChangeTracker {
    
    @Autowired
    private HistoryService historyService;
    
    public void trackVariableChanges(String processInstanceId, String variableName) {
        List<HistoricDetail> changes = historyService
            .createHistoricDetailQuery()
            .processInstanceId(processInstanceId)
            .variableUpdates()
            .orderByTime()
            .asc()
            .list();
        
        // Filter for specific variable
        List<HistoricDetail> variableChanges = changes.stream()
            .filter(d -> variableName.equals(d.getName()))
            .collect(Collectors.toList());
        
        System.out.println("=== Variable Change History: " + variableName + " ===");
        for (HistoricDetail change : variableChanges) {
            System.out.println(String.format(
                "%s - Value: %s (Type: %s)",
                change.getTime(),
                change.getTextValue(),
                change.getType()
            ));
        }
    }
    
    /**
     * WHY USE THIS:
     * - Compliance: Show who changed what and when
     * - Audit trail: Complete history of sensitive data changes
     * - Debugging: Understand how variables evolved
     * - Data quality: Track unexpected value changes
     */
}
```

---

## Process Instance History Log

### Complete Process Timeline

The **ProcessInstanceHistoryLog** is a convenience API that combines multiple history queries into a single, time-ordered view.

```java
public class ProcessTimelineAnalyzer {
    
    @Autowired
    private HistoryService historyService;
    
    public void analyzeProcessTimeline(String processInstanceId) {
        // Get complete history log
        ProcessInstanceHistoryLog historyLog = historyService
            .createProcessInstanceHistoryLog(processInstanceId)
            .includeActivities()      // All activity instances
            .includeTasks()           // All task instances
            .includeVariables()       // Final variable values
            .includeComments()        // User comments
            .includeVariableUpdates() // Variable changes (requires FULL)
            .includeFormProperties()  // Form properties (requires FULL)
            .singleResult();
        
        // The log automatically orders everything by time (ascending)
        System.out.println("=== Complete Process Timeline ===");
        System.out.println("Process: " + processInstanceId);
        System.out.println("Duration: " + historyLog.getDurationInMillis() + "ms");
        
        // All events are in chronological order
        List<HistoricLogEntry> allEvents = historyLog.getHistoricLogEntries();
        
        for (HistoricLogEntry entry : allEvents) {
            System.out.println(entry.getTimestamp() + " - " + entry.getMessage());
        }
    }
    
    /**
     * WHY USE THIS:
     * - Debugging: See everything that happened in chronological order
     * - Support: Help users understand process status
     * - Training: Show complete process execution examples
     * - Root cause analysis: Identify where and why processes fail
     * - Audit: Complete timeline for compliance reviews
     * 
     * NOTE:
     * - Each includeXXX() executes a separate query
     * - Results are merged and sorted by time automatically
     * - Variable updates and form properties require FULL history level
     */
}
```

### Use Case: Incident Investigation

```java
public void investigateFailedProcess(String processInstanceId) {
    ProcessInstanceHistoryLog historyLog = historyService
        .createProcessInstanceHistoryLog(processInstanceId)
        .includeActivities()
        .includeTasks()
        .includeVariables()
        .includeComments()
        .singleResult();
    
    // Find where it failed
    List<HistoricActivityInstance> activities = historyLog.getActivities();
    HistoricActivityInstance lastActivity = activities.get(activities.size() - 1);
    
    System.out.println("Process failed at: " + lastActivity.getActivityName());
    System.out.println("Duration: " + lastActivity.getDurationInMillis() + "ms");
    System.out.println("Delete reason: " + lastActivity.getDeleteReason());
    
    // Check tasks
    List<HistoricTaskInstance> tasks = historyLog.getTasks();
    for (HistoricTaskInstance task : tasks) {
        if (task.getDeleteReason() != null) {
            System.out.println("Task deleted: " + task.getName() + 
                " - Reason: " + task.getDeleteReason());
        }
    }
    
    // Check comments for user notes
    List<Comment> comments = historyLog.getComments();
    for (Comment comment : comments) {
        System.out.println(comment.getUser() + ": " + comment.getMessage());
    }
}
```

---

## See Also

- [Parent Documentation](README.md)
- [Management Service](./management-service.md)
- [Runtime Service](./runtime-service.md)
- [Task Service](./task-service.md)
- [Best Practices](../../best-practices/overview.md)
- [History Level Configuration](./engine-configuration.md#history-level)

---

## Summary

The **HistoryService** is essential for:

1. **Compliance & Auditing** - Complete record of process executions
2. **Performance Analysis** - Identify bottlenecks and optimize processes
3. **Debugging** - Understand what went wrong in failed processes
4. **Reporting** - Generate business intelligence from process data
5. **Process Mining** - Discover actual process flows from execution data

### Key Takeaways

| Feature | API | History Level | Use Case |
|---------|-----|---------------|----------|
| Process Instances | `HistoricProcessInstanceQuery` | ACTIVITY+ | Track process lifecycle |
| Task Instances | `HistoricTaskInstanceQuery` | AUDIT+ | Monitor user tasks |
| Activity Instances | `HistoricActivityInstanceQuery` | ACTIVITY+ | Process flow analysis |
| Variables (final) | `HistoricVariableInstanceQuery` | AUDIT+ | Data at completion |
| Variables (updates) | `HistoricDetailQuery` | FULL | Complete change history |
| Identity Links | `getHistoricIdentityLinksForTask()` | AUDIT+ | Assignment tracking |
| Process Timeline | `ProcessInstanceHistoryLog` | AUDIT+ | Debugging & analysis |

### Important Notes

- ⚠️ **No built-in cleanup API** - Implement your own cleanup strategy
- ⚠️ **No `HistoricIdentityLinkLog`** - Use `getHistoricIdentityLinksForTask()` instead
- ⚠️ **FULL history level** required for variable updates and form properties
- ⚠️ **Monitor table growth** - History tables can become very large
- ✅ **Use pagination** - Always paginate large result sets
- ✅ **Add indexes** - Improve query performance with proper indexing
- ✅ **Choose appropriate level** - Balance functionality vs performance

For production systems, **AUDIT** level is recommended as it provides comprehensive history without the overhead of tracking every variable change.
