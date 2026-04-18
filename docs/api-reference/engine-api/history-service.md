---
sidebar_label: History Service
slug: /api-reference/engine-api/history-service
description: Reference documentation for the Activiti HistoryService - historical data and process instance auditing.
---

# History Service

The `HistoryService` provides access to historical data about process instances, tasks, activities, and variables. Unlike runtime information which only contains the current state, history data remains permanent and is optimized for querying and auditing.

## Table of Contents

- [Overview](#overview)
- [Historic Process Instance Queries](#historic-process-instance-queries)
- [Historic Task Instance Queries](#historic-task-instance-queries)
- [Historic Activity Instance Queries](#historic-activity-instance-queries)
- [Historic Variable Instance Queries](#historic-variable-instance-queries)
- [Historic Detail Queries](#historic-detail-queries)
- [Process Instance History Log](#process-instance-history-log)
- [Historic Identity Links](#historic-identity-links)
- [Native Queries](#native-queries)
- [Deletion Operations](#deletion-operations)
- [Common Use Cases](#common-use-cases)
- [API Reference](#api-reference)
- [Important Notes](#important-notes)
- [Configuration](#configuration)
- [See Also](#see-also)

---

## Overview

```java
HistoryService historyService = processEngine.getHistoryService();
```

**Key Capabilities:**
- Query historic process instances
- Query historic task instances
- Query historic activity instances
- Query historic variable instances
- Query historic details (variable updates, form properties)
- Access process instance history logs
- Retrieve historic identity links
- Delete historic data

---

## Historic Process Instance Queries

### Basic Query

Query completed and running process instances:

```java
HistoricProcessInstanceQuery query = historyService.createHistoricProcessInstanceQuery();

// Get all historic process instances
List<HistoricProcessInstance> allInstances = query.list();

// Get single result
HistoricProcessInstance instance = query.singleResult();

// Count results
long count = query.count();
```

### Filter by Process Instance ID

```java
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceId("process-instance-id-123")
    .list();
```

### Filter by Process Definition

```java
// By process definition ID
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionId("process-def-id-456")
    .list();

// By process definition key
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .list();

// By multiple process definition keys
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKeyIn(Arrays.asList("orderProcess", "shippingProcess"))
    .list();

// Exclude process definition keys
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKeyNotIn(Arrays.asList("testProcess"))
    .list();

// By process definition name
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionName("Order Management")
    .list();

// By process definition version
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .processDefinitionVersion(1)
    .list();
```

### Filter by Status

```java
// Only finished process instances
List<HistoricProcessInstance> finished = historyService
    .createHistoricProcessInstanceQuery()
    .finished()
    .list();

// Only unfinished (running) process instances
List<HistoricProcessInstance> running = historyService
    .createHistoricProcessInstanceQuery()
    .unfinished()
    .list();

// Only deleted process instances
List<HistoricProcessInstance> deleted = historyService
    .createHistoricProcessInstanceQuery()
    .deleted()
    .list();

// Only non-deleted process instances
List<HistoricProcessInstance> active = historyService
    .createHistoricProcessInstanceQuery()
    .notDeleted()
    .list();
```

### Filter by Business Key

```java
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceBusinessKey("ORDER-12345")
    .list();
```

### Filter by Date Range

```java
Date startDate = new Date();
Date endDate = new Date(System.currentTimeMillis() + 86400000); // Tomorrow

// Started after a date
List<HistoricProcessInstance> recent = historyService
    .createHistoricProcessInstanceQuery()
    .startedAfter(startDate)
    .list();

// Started before a date
List<HistoricProcessInstance> old = historyService
    .createHistoricProcessInstanceQuery()
    .startedBefore(startDate)
    .list();

// Finished after a date
List<HistoricProcessInstance> finishedAfter = historyService
    .createHistoricProcessInstanceQuery()
    .finishedAfter(startDate)
    .list();

// Finished before a date
List<HistoricProcessInstance> finishedBefore = historyService
    .createHistoricProcessInstanceQuery()
    .finishedBefore(endDate)
    .list();
```

### Filter by User

```java
// Started by specific user
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .startedBy("john.doe")
    .list();

// Involved user (any task participation)
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .involvedUser("jane.doe")
    .list();
```

### Filter by Variables

```java
// Variable equals specific value
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .variableValueEquals("orderAmount", 1000)
    .list();

// Variable not equals
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .variableValueNotEquals("status", "CANCELLED")
    .list();

// Variable greater than
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .variableValueGreaterThan("orderAmount", 500)
    .list();

// Variable less than or equal
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .variableValueLessThanOrEqual("orderAmount", 10000)
    .list();

// Variable like (pattern matching)
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .variableValueLike("customerName", "Smith%")
    .list();

// Variable like case insensitive
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .variableValueLikeIgnoreCase("customerName", "%smith%")
    .list();
```

### Filter by Tenant

```java
// Specific tenant
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceTenantId("tenant-123")
    .list();

// Tenant like pattern
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceTenantIdLike("tenant-%")
    .list();

// Without tenant
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceWithoutTenantId()
    .list();
```

### Filter by Deployment

```java
// By deployment ID
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .deploymentId("deployment-id-789")
    .list();

// By multiple deployment IDs
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .deploymentIdIn(Arrays.asList("dep-1", "dep-2"))
    .list();
```

### Advanced Filters

```java
// Sub-process of specific process
List<HistoricProcessInstance> subProcesses = historyService
    .createHistoricProcessInstanceQuery()
    .superProcessInstanceId("parent-process-id")
    .list();

// Exclude subprocesses
List<HistoricProcessInstance> topLevel = historyService
    .createHistoricProcessInstanceQuery()
    .excludeSubprocesses(true)
    .list();

// Process instances with job exceptions
List<HistoricProcessInstance> failed = historyService
    .createHistoricProcessInstanceQuery()
    .withJobException()
    .list();

// By process instance name
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceName("Order Process")
    .list();

// By process instance name like
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceNameLike("%Order%")
    .list();

// By process instance name like (case insensitive)
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceNameLikeIgnoreCase("%order%")
    .list();
```

### OR Conditions

```java
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .or()
        .processDefinitionKey("shippingProcess")
        .processDefinitionKey("billingProcess")
    .endOr()
    .finished()
    .list();
```

### Sorting

```java
// By process instance ID
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .orderByProcessInstanceId()
    .desc()
    .list();

// By start time (most recent first)
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .orderByProcessInstanceStartTime()
    .desc()
    .list();

// By end time
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .orderByProcessInstanceEndTime()
    .asc()
    .list();

// By duration
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .orderByProcessInstanceDuration()
    .desc()
    .list();

// By business key
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .orderByProcessInstanceBusinessKey()
    .asc()
    .list();

// By tenant ID
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .orderByTenantId()
    .asc()
    .list();
```

### Include Variables

```java
// Include process variables in results
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .includeProcessVariables()
    .list();

// Limit number of variables included
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .limitProcessInstanceVariables(10)
    .list();
```

### Localization

```java
// Localize process names to specific locale
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .locale("de_DE")
    .list();

// With fallback to default locale
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .locale("fr_FR")
    .withLocalizationFallback()
    .list();
```

### Group Involvement

```java
// Process instances involving specific groups
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .involvedGroupsIn(Arrays.asList("managers", "admins"))
    .list();
```

---

## Historic Task Instance Queries

### Basic Task Query

```java
HistoricTaskInstanceQuery taskQuery = historyService.createHistoricTaskInstanceQuery();

List<HistoricTaskInstance> tasks = taskQuery.list();
```

### Filter by Task

```java
// By task ID
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskId("task-id-123")
    .list();

// By task name
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskName("Review Order")
    .list();

// By task name like
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskNameLike("%Review%")
    .list();

// By task assignee
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskAssignee("john.doe")
    .list();

// By task candidate user
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskCandidateUser("jane.doe")
    .list();

// By task candidate group
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskCandidateGroup("managers")
    .list();
```

### Filter by Status

```java
// Only finished tasks
List<HistoricTaskInstance> finished = historyService
    .createHistoricTaskInstanceQuery()
    .finished()
    .list();

// Only unfinished tasks
List<HistoricTaskInstance> unfinished = historyService
    .createHistoricTaskInstanceQuery()
    .unfinished()
    .list();

// Tasks from finished processes
List<HistoricTaskInstance> fromFinished = historyService
    .createHistoricTaskInstanceQuery()
    .processFinished()
    .list();

// Tasks from running processes
List<HistoricTaskInstance> fromRunning = historyService
    .createHistoricTaskInstanceQuery()
    .processUnfinished()
    .list();
```

### Filter by Completion Date

```java
Date completionDate = new Date();

// Completed on specific date
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskCompletedOn(completionDate)
    .list();

// Completed before date
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskCompletedBefore(completionDate)
    .list();

// Completed after date
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskCompletedAfter(completionDate)
    .list();
```

### Filter by Delete Reason

```java
// By delete reason
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskDeleteReason("Cancelled")
    .list();

// By delete reason like
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskDeleteReasonLike("%Cancel%")
    .list();
```

### Task Sorting

```java
// By duration (longest first)
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .orderByHistoricTaskInstanceDuration()
    .desc()
    .list();

// By end time
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .orderByHistoricTaskInstanceEndTime()
    .desc()
    .list();

// By start time
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .orderByHistoricTaskInstanceStartTime()
    .asc()
    .list();

// By delete reason
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .orderByDeleteReason()
    .asc()
    .list();
```

---

## Historic Activity Instance Queries

```java
HistoricActivityInstanceQuery activityQuery = historyService.createHistoricActivityInstanceQuery();

// By activity ID
List<HistoricActivityInstance> activities = activityQuery
    .activityId("task_1")
    .list();

// By activity name
List<HistoricActivityInstance> activities = activityQuery
    .activityName("Review Order")
    .list();

// By process instance
List<HistoricActivityInstance> activities = activityQuery
    .processInstanceId("process-id-123")
    .list();

// By execution
List<HistoricActivityInstance> activities = activityQuery
    .executionId("execution-id-456")
    .list();

// Filter by activity type (task, userTask, serviceTask, etc.)
List<HistoricActivityInstance> activities = activityQuery
    .activityType("userTask")
    .list();

// Completed activities
List<HistoricActivityInstance> activities = activityQuery
    .activityInstanceId("activity-id-789")
    .list();
```

---

## Historic Variable Instance Queries

```java
HistoricVariableInstanceQuery variableQuery = historyService.createHistoricVariableInstanceQuery();

// By variable name
List<HistoricVariableInstance> variables = variableQuery
    .variableName("orderAmount")
    .list();

// By process instance
List<HistoricVariableInstance> variables = variableQuery
    .processInstanceId("process-id-123")
    .list();

// By task
List<HistoricVariableInstance> variables = variableQuery
    .taskId("task-id-456")
    .list();

// By execution
List<HistoricVariableInstance> variables = variableQuery
    .executionId("execution-id-789")
    .list();

// Filter by value
List<HistoricVariableInstance> variables = variableQuery
    .variableValueEquals(1000)
    .list();

// Filter by name and value
List<HistoricVariableInstance> variables = variableQuery
    .variableName("status")
    .variableValueEquals("APPROVED")
    .list();
```

---

## Historic Detail Queries

Historic details include variable updates and form properties:

```java
HistoricDetailQuery detailQuery = historyService.createHistoricDetailQuery();

// By variable name
List<HistoricDetail> details = detailQuery
    .variableName("orderAmount")
    .list();

// By process instance
List<HistoricDetail> details = detailQuery
    .processInstanceId("process-id-123")
    .list();

// By task
List<HistoricDetail> details = detailQuery
    .taskId("task-id-456")
    .list();

// By execution
List<HistoricDetail> details = detailQuery
    .executionId("execution-id-789")
    .list();

// Filter by type
List<HistoricDetail> details = detailQuery
    .type(HistoricDetail.VARIABLE_UPDATE)
    .list();

List<HistoricDetail> details = detailQuery
    .type(HistoricDetail.FORM_PROPERTY)
    .list();
```

---

## Process Instance History Log

The `ProcessInstanceHistoryLog` provides a comprehensive trail of data for a specific process instance, ordered chronologically.

### Create History Log Query

```java
ProcessInstanceHistoryLogQuery logQuery = historyService
    .createProcessInstanceHistoryLogQuery("process-instance-id-123");
```

### Configure What to Include

```java
ProcessInstanceHistoryLog log = logQuery
    .includeTasks()              // Include historic task instances
    .includeActivities()         // Include historic activity instances
    .includeVariables()          // Include historic variable instances
    .includeComments()           // Include task comments
    .includeVariableUpdates()    // Include variable updates
    .includeFormProperties()     // Include form properties
    .singleResult();
```

**Note:** Each `includeXXX()` method executes an additional query.

### Access History Log Data

```java
// Get process instance information
String id = log.getId();
String businessKey = log.getBusinessKey();
String processDefinitionId = log.getProcessDefinitionId();
Date startTime = log.getStartTime();
Date endTime = log.getEndTime();
Long duration = log.getDurationInMillis();
String startUserId = log.getStartUserId();
String startActivityId = log.getStartActivityId();
String deleteReason = log.getDeleteReason();
String superProcessInstanceId = log.getSuperProcessInstanceId();
String tenantId = log.getTenantId();

// Get chronological trail of events
List<HistoricData> historicData = log.getHistoricData();

for (HistoricData data : historicData) {
    System.out.println(data.getTimestamp() + " - " + data.getType());
}
```

### Use Case: Process Replay

```java
public void replayProcessInstance(HistoryService historyService, String processInstanceId) {
    ProcessInstanceHistoryLog log = historyService
        .createProcessInstanceHistoryLogQuery(processInstanceId)
        .includeTasks()
        .includeActivities()
        .includeVariables()
        .singleResult();

    System.out.println("Process: " + log.getBusinessKey());
    System.out.println("Duration: " + log.getDurationInMillis() + "ms");
    System.out.println("Started by: " + log.getStartUserId());
    System.out.println("\nEvent Timeline:");

    for (HistoricData data : log.getHistoricData()) {
        System.out.println(data.getTimestamp() + " - " + 
                          data.getType() + ": " + data.getName());
    }
}
```

---

## Historic Identity Links

Retrieve identity links (user/group associations) for completed tasks and processes:

### For Tasks

```java
List<HistoricIdentityLink> identityLinks = historyService
    .getHistoricIdentityLinksForTask("task-id-123");

for (HistoricIdentityLink link : identityLinks) {
    System.out.println("User: " + link.getUserId());
    System.out.println("Group: " + link.getGroupId());
    System.out.println("Type: " + link.getType());
}
```

**Returns:** `List<HistoricIdentityLink>` (NOT a query object)

### For Process Instances

```java
List<HistoricIdentityLink> identityLinks = historyService
    .getHistoricIdentityLinksForProcessInstance("process-instance-id-456");
```

---

## Native Queries

Execute custom SQL queries against history tables:

### Native Historic Process Instance Query

```java
NativeHistoricProcessInstanceQuery nativeQuery = historyService
    .createNativeHistoricProcessInstanceQuery();

List<HistoricProcessInstance> instances = nativeQuery
    .nativeSql("SELECT * FROM ACT_HI_PROCINST WHERE START_TIME_ > ?", new Date())
    .list();
```

### Native Historic Task Instance Query

```java
NativeHistoricTaskInstanceQuery nativeQuery = historyService
    .createNativeHistoricTaskInstanceQuery();

List<HistoricTaskInstance> tasks = nativeQuery
    .nativeSql("SELECT * FROM ACT_HI_TASKINST WHERE ASSIGNEE_ = ?", "john.doe")
    .list();
```

### Native Historic Activity Instance Query

```java
NativeHistoricActivityInstanceQuery nativeQuery = historyService
    .createNativeHistoricActivityInstanceQuery();

List<HistoricActivityInstance> activities = nativeQuery
    .nativeSql("SELECT * FROM ACT_HI_ACTINST WHERE ACT_ID_ = ?", "task_1")
    .list();
```

### Native Historic Detail Query

```java
NativeHistoricDetailQuery nativeQuery = historyService
    .createNativeHistoricDetailQuery();

List<HistoricDetail> details = nativeQuery
    .nativeSql("SELECT * FROM ACT_HI_DETAIL WHERE VAR_NAME_ = ?", "orderAmount")
    .list();
```

### Native Historic Variable Instance Query

```java
NativeHistoricVariableInstanceQuery nativeQuery = historyService
    .createNativeHistoricVariableInstanceQuery();

List<HistoricVariableInstance> variables = nativeQuery
    .nativeSql("SELECT * FROM ACT_HI_VARINST WHERE NAME_ = ?", "status")
    .list();
```

---

## Deletion Operations

### Delete Historic Task Instance

Remove a historic task instance (useful for dynamically created tasks):

```java
historyService.deleteHistoricTaskInstance("task-id-123");
```

**Note:** If the task doesn't exist, no exception is thrown.

### Delete Historic Process Instance

Remove a complete process instance and all related history:

```java
historyService.deleteHistoricProcessInstance("process-instance-id-456");
```

**Deletes:**
- Historic process instance
- All historic activities
- All historic tasks
- All historic details (variable updates, form properties)

---

## Common Use Cases

### 1. Audit Trail for Process

```java
public void createAuditTrail(HistoryService historyService, String processInstanceId) {
    ProcessInstanceHistoryLog log = historyService
        .createProcessInstanceHistoryLogQuery(processInstanceId)
        .includeTasks()
        .includeActivities()
        .includeVariables()
        .includeComments()
        .singleResult();

    System.out.println("=== Audit Trail ===");
    System.out.println("Process: " + log.getBusinessKey());
    System.out.println("Duration: " + log.getDurationInMillis() + "ms");
    System.out.println("Started: " + log.getStartTime());
    System.out.println("Ended: " + log.getEndTime());
    System.out.println("Started By: " + log.getStartUserId());
    
    if (log.getDeleteReason() != null) {
        System.out.println("Delete Reason: " + log.getDeleteReason());
    }
}
```

### 2. Performance Analysis

```java
public Map<String, Long> analyzeProcessPerformance(HistoryService historyService) {
    List<HistoricProcessInstance> instances = historyService
        .createHistoricProcessInstanceQuery()
        .finished()
        .orderByProcessInstanceDuration()
        .desc()
        .list();

    Map<String, Long> durationByProcess = new HashMap<>();
    
    for (HistoricProcessInstance instance : instances) {
        String processKey = instance.getProcessDefinitionKey();
        Long duration = instance.getDurationInMillis();
        
        durationByProcess.merge(processKey, duration, Long::sum);
    }
    
    return durationByPerformance;
}
```

### 3. User Activity Report

```java
public List<HistoricTaskInstance> getUserTasks(HistoryService historyService, String userId) {
    return historyService
        .createHistoricTaskInstanceQuery()
        .taskAssignee(userId)
        .finished()
        .orderByHistoricTaskInstanceEndTime()
        .desc()
        .listPage(0, 50);
}
```

### 4. Variable History Tracking

```java
public List<HistoricDetail> getVariableChanges(HistoryService historyService, 
                                               String processInstanceId, 
                                               String variableName) {
    return historyService
        .createHistoricDetailQuery()
        .processInstanceId(processInstanceId)
        .variableName(variableName)
        .type(HistoricDetail.VARIABLE_UPDATE)
        .orderByTime()
        .asc()
        .list();
}
```

### 5. Failed Process Investigation

```java
public void investigateFailedProcesses(HistoryService historyService, 
                                       ManagementService managementService) {
    // Get processes with job exceptions
    List<HistoricProcessInstance> failed = historyService
        .createHistoricProcessInstanceQuery()
        .withJobException()
        .list();

    for (HistoricProcessInstance instance : failed) {
        System.out.println("Failed Process: " + instance.getProcessDefinitionKey());
        System.out.println("Instance ID: " + instance.getId());
        
        // Get failed jobs for this process
        List<Job> failedJobs = managementService.createJobQuery()
            .processInstanceId(instance.getId())
            .withException()
            .list();

        for (Job job : failedJobs) {
            System.out.println("  Failed Job: " + job.getId());
            System.out.println("  Exception: " + managementService.getJobExceptionStacktrace(job.getId()));
        }
    }
}
```

---

## API Reference

### Query Creation Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `createHistoricProcessInstanceQuery()` | `HistoricProcessInstanceQuery` | Query historic process instances |
| `createHistoricTaskInstanceQuery()` | `HistoricTaskInstanceQuery` | Query historic task instances |
| `createHistoricActivityInstanceQuery()` | `HistoricActivityInstanceQuery` | Query historic activity instances |
| `createHistoricVariableInstanceQuery()` | `HistoricVariableInstanceQuery` | Query historic variable instances |
| `createHistoricDetailQuery()` | `HistoricDetailQuery` | Query historic details |
| `createProcessInstanceHistoryLogQuery(String)` | `ProcessInstanceHistoryLogQuery` | Query process history log |

### Native Query Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `createNativeHistoricProcessInstanceQuery()` | `NativeHistoricProcessInstanceQuery` | Native SQL for processes |
| `createNativeHistoricTaskInstanceQuery()` | `NativeHistoricTaskInstanceQuery` | Native SQL for tasks |
| `createNativeHistoricActivityInstanceQuery()` | `NativeHistoricActivityInstanceQuery` | Native SQL for activities |
| `createNativeHistoricDetailQuery()` | `NativeHistoricDetailQuery` | Native SQL for details |
| `createNativeHistoricVariableInstanceQuery()` | `NativeHistoricVariableInstanceQuery` | Native SQL for variables |

### Identity Link Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getHistoricIdentityLinksForTask(String)` | `List<HistoricIdentityLink>` | Identity links for task |
| `getHistoricIdentityLinksForProcessInstance(String)` | `List<HistoricIdentityLink>` | Identity links for process |

### Deletion Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `deleteHistoricTaskInstance(String)` | `void` | Delete historic task |
| `deleteHistoricProcessInstance(String)` | `void` | Delete historic process |

---

## Important Notes

### Best Practices

1. **Enable History in Configuration** - Set appropriate history level
2. **Use Specific Queries** - Don't fetch all data unnecessarily
3. **Paginate Results** - Use `listPage()` for large result sets
4. **Index Frequently Queried Fields** - Optimize database performance
5. **Clean Up Old Data** - Periodically delete old historic instances
6. **Use History Log for Debugging** - `ProcessInstanceHistoryLog` is excellent for troubleshooting

---

## Configuration

Set history level in `ProcessEngineConfiguration`:

```java
ProcessEngineConfiguration configuration = ProcessEngineConfiguration
    .createStandaloneInMemProcessEngineConfiguration();

// History levels: NONE, ACTIVITY, TASK, FULL
configuration.setHistory(HistoryLevel.FULL);

// Enable history for audit
configuration.setHistoryLevel(HistoryLevel.FULL);

ProcessEngine engine = configuration.buildProcessEngine();
```

**History Levels:**
- `NONE` - No history
- `ACTIVITY` - Activity instances only
- `TASK` - Activities and task instances
- `FULL` - Complete history including variables and details

---

## See Also

- [Management Service](./management-service.md) - Engine administration
- [Runtime Service](./runtime-service.md) - Process execution
- [Engine Configuration](../../../configuration.md) - Setup and configuration
- [Best Practices](../../best-practices/overview.md) - Performance tips

---

**Source:** `org.activiti.engine.HistoryService`  
