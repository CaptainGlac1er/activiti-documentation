---
sidebar_label: Engine API
slug: /api-reference/engine-api
description: Reference documentation for the Activiti Process Engine API and services.
---

# Engine API Reference

The Activiti Engine API provides the core services for workflow execution, task management, and process automation. This documentation covers the traditional engine-based approach.

## Engine Architecture

```
┌─────────────────────────────────────┐
│        ProcessEngine                │
├─────────────────────────────────────┤
│  RepositoryService  │  RuntimeService│
│  TaskService        │  HistoryService│
│  ManagementService  │  ExternalTaskService│
└─────────────────────────────────────┘
```

## Available Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| **Repository Service** | Process definitions and deployments | [View Docs](../../core-services/repository-service.md) |
| **Runtime Service** | Process instance execution | [View Docs](../../core-services/runtime-service.md) |
| **Task Service** | User task management | [View Docs](../../core-services/task-service.md) |
| **History Service** | Historical data and auditing | [View Docs](../../core-services/history-service.md) |
| **Management Service** | Engine administration | [View Docs](../../core-services/management-service.md) |
| **External Task Service** | Decoupled task execution | [View Docs](../../core-services/external-task-service.md) |

## ProcessEngine Interface

The `ProcessEngine` is the main entry point to the Activiti engine:

```java
public interface ProcessEngine {
    RepositoryService getRepositoryService();
    RuntimeService getRuntimeService();
    TaskService getTaskService();
    HistoryService getHistoryService();
    ManagementService getManagementService();
    ExternalTaskService getExternalTaskService();
    
    ProcessEngineConfiguration getProcessEngineConfiguration();
    String getName();
    String getId();
}
```

### Getting the Engine

```java
// Default engine (from configuration)
ProcessEngine engine = ProcessEngines.getDefaultProcessEngine();

// Named engine
ProcessEngine engine = ProcessEngines.getProcessEngine("myEngine");

// Spring injection
@Autowired
private ProcessEngine processEngine;
```

## Service Overview

### Repository Service

Manages process definitions and deployments:

```java
RepositoryService repositoryService = engine.getRepositoryService();

// Deploy process
Deployment deployment = repositoryService.createDeployment()
    .addClasspathResource("process.bpmn")
    .deploy();

// Query definitions
List<ProcessDefinition> definitions = repositoryService
    .createProcessDefinitionQuery()
    .processDefinitionKey("orderProcess")
    .list();
```

**See:** [Repository Service Documentation](../../core-services/repository-service.md)

### Runtime Service

Executes process instances:

```java
RuntimeService runtimeService = engine.getRuntimeService();

// Start process
String processInstanceId = runtimeService.startProcessInstanceByKey("orderProcess");

// Query instances
List<ProcessInstance> instances = runtimeService
    .createProcessInstanceQuery()
    .processDefinitionKey("orderProcess")
    .list();

// Set variables
runtimeService.setVariable(processInstanceId, "amount", 1000);
```

**See:** [Runtime Service Documentation](../../core-services/runtime-service.md)

### Task Service

Manages user tasks:

```java
TaskService taskService = engine.getTaskService();

// Query tasks
List<Task> tasks = taskService.createTaskQuery()
    .taskAssignee("john.doe")
    .list();

// Claim task
taskService.claim(taskId, "john.doe");

// Complete task
taskService.complete(taskId, variables);
```

**See:** [Task Service Documentation](../../core-services/task-service.md)

### History Service

Provides historical data:

```java
HistoryService historyService = engine.getHistoryService();

// Query historic instances
List<HistoricProcessInstance> instances = historyService
    .createHistoricProcessInstanceQuery()
    .finished()
    .list();

// Get historic tasks
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .taskAssignee("john.doe")
    .list();
```

**See:** [History Service Documentation](../../core-services/history-service.md)

### Management Service

Engine administration:

```java
ManagementService managementService = engine.getManagementService();

// Execute jobs
managementService.executeJobs();

// Query jobs
List<Job> jobs = managementService.createJobQuery()
    .processInstanceId(instanceId)
    .list();

// Get engine metrics
Map<String, Object> metrics = managementService.getDbResourceCount();
```

**See:** [Management Service Documentation](../../core-services/management-service.md)

### External Task Service

Decoupled task execution:

```java
ExternalTaskService externalTaskService = engine.getExternalTaskService();

// Fetch and lock tasks
List<ExternalTask> tasks = externalTaskService.fetchAndLock(
    new FetchAndLockExternalTaskRequest()
        .workerId("worker-1")
        .maxTasks(10)
        .topicNames("payment-process")
);

// Complete task
externalTaskService.complete(taskId, workerId, variables);
```

**See:** [External Task Service Documentation](../../core-services/external-task-service.md)

## Configuration

### Basic Configuration

```java
ProcessEngineConfiguration configuration = ProcessEngineConfiguration
    .createStandaloneInMemProcessEngineConfiguration();

configuration.setJdbcUrl("jdbc:h2:mem:activiti");
configuration.setJdbcUsername("sa");
configuration.setJdbcPassword("");
configuration.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);

ProcessEngine engine = configuration.buildProcessEngine();
```

### Spring Boot Configuration

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/activiti
    username: activiti
    password: activiti

activiti:
  database-schema-update: true
  async-executor-activate: true
```

**See:** [Configuration Guide](../../getting-started/configuration.md)

## API Comparison

### Engine API vs Activiti API

| Feature | Engine API | Activiti API |
|---------|-----------|--------------|
| **Style** | Service-based | Interface-driven |
| **Access** | Direct service calls | Payload builders |
| **Events** | Limited | Rich event system |
| **Testing** | Harder to mock | Easy to mock |
| **Versioning** | Monolithic | Modular |
| **Use Case** | Legacy, simple apps | Modern, complex apps |

### When to Use Each

**Use Engine API when:**
- Working with existing Activiti codebase
- Simple workflow requirements
- Direct database access needed
- Quick prototyping

**Use Activiti API when:**
- Building new applications
- Need rich event handling
- Require better testability
- Multi-tenant applications
- Microservices architecture

## Common Patterns

### 1. Process Deployment and Execution

```java
// Deploy
repositoryService.createDeployment()
    .addClasspathResource("process.bpmn")
    .deploy();

// Start
String processInstanceId = runtimeService
    .startProcessInstanceByKey("orderProcess");

// Get task
Task task = taskService.createTaskQuery()
    .processInstanceId(processInstanceId)
    .singleResult();

// Complete
taskService.complete(task.getId());
```

### 2. Variable Management

```java
// Set process variable
runtimeService.setVariable(processInstanceId, "orderAmount", 1000);

// Set task variable
taskService.setVariable(taskId, "reviewerComment", "Approved");

// Get variables
Map<String, Object> processVars = runtimeService.getVariables(processInstanceId);
Map<String, Object> taskVars = taskService.getVariables(taskId);
```

### 3. Task Assignment

```java
// Claim task
taskService.claim(taskId, "john.doe");

// Set assignee
taskService.setAssignee(taskId, "jane.doe");

// Release task
taskService.release(taskId);
```

### 4. History Queries

```java
// Process instance history
HistoricProcessInstance instance = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceId(processInstanceId)
    .singleResult();

// Task history
List<HistoricTaskInstance> tasks = historyService
    .createHistoricTaskInstanceQuery()
    .processInstanceId(processInstanceId)
    .orderByTaskCreateTime().desc()
    .list();

// Variable history
List<HistoricVariableInstance> variables = historyService
    .createHistoricVariableInstanceQuery()
    .processInstanceId(processInstanceId)
    .list();
```

## Error Handling

### Common Exceptions

```java
// Process not found
try {
    runtimeService.startProcessInstanceByKey("nonExistent");
} catch (ActivitiObjectNotFoundException e) {
    log.error("Process definition not found", e);
}

// Task already completed
try {
    taskService.complete(taskId);
} catch (ActivitiException e) {
    log.error("Failed to complete task", e);
}

// Invalid BPMN
try {
    repositoryService.createDeployment()
        .addString("invalid.bpmn", bpmnContent)
        .deploy();
} catch (ActivitiBadUserRequestException e) {
    log.error("Invalid BPMN", e);
}
```

### Transaction Management

```java
@Transactional
public void executeProcess() {
    try {
        runtimeService.startProcessInstanceByKey("orderProcess");
        // Other operations
    } catch (ActivitiException e) {
        // Transaction will rollback
        throw e;
    }
}
```

## Performance Tips

### 1. Batch Operations

```java
// Use batch for multiple tasks
List<String> taskIds = getTaskIds();
for (String taskId : taskIds) {
    taskService.complete(taskId);
}
```

### 2. Query Optimization

```java
// Add indexes for common queries
taskService.createTaskQuery()
    .taskAssignee("john.doe")  // Indexed
    .processDefinitionKey("order")  // Indexed
    .list();
```

### 3. History Level

```java
// Configure appropriate history level
configuration.setHistory(HistoryLevel.FULL);  // Full auditing
// or
configuration.setHistory(HistoryLevel.ACTIVITY);  // Activity only
```

## Migration Guide

### From Activiti 5/6

```java
// Old (Activiti 5)
TaskService taskService = processEngine.getTaskService();
List<Task> tasks = taskService.createTaskQuery().list();

// New (Activiti 7/8)
// Same API, but with improvements
TaskService taskService = processEngine.getTaskService();
List<Task> tasks = taskService.createTaskQuery().list();
```

### To Activiti API

```java
// Engine API
TaskService taskService = engine.getTaskService();
List<Task> tasks = taskService.createTaskQuery().list();

// Activiti API
@Autowired
private TaskRuntime taskRuntime;
Page<Task> tasks = taskRuntime.tasks(Pageable.of(0, 100));
```

## Best Practices

1. **Use try-catch blocks** for all engine operations
2. **Manage transactions** properly
3. **Index frequently queried fields**
4. **Use appropriate history level**
5. **Batch operations** when possible
6. **Cache process definitions**
7. **Monitor job executor**
8. **Use connection pooling**

## Troubleshooting

### Common Issues

**Issue:** "Database table not found"
**Solution:** Enable schema update or run migration

**Issue:** "Job executor not running"
**Solution:** Enable async executor in configuration

**Issue:** "Task not found"
**Solution:** Check task ID and query parameters

**See:** [Troubleshooting Guide](../../troubleshooting/overview.md)

## Next Steps

1. **Start with core services:**
   - [Repository Service](../../core-services/repository-service.md)
   - [Runtime Service](../../core-services/runtime-service.md)
   - [Task Service](../../core-services/task-service.md)

2. **Learn advanced topics:**
   - [History Service](../../core-services/history-service.md)
   - [Management Service](../../core-services/management-service.md)
   - [External Task Service](../../core-services/external-task-service.md)

3. **Explore modern API:**
   - [Activiti API Reference](../activiti-api/README.md)

---

## See Also

- [Core Services](../../core-services/README.md) - Detailed service documentation
- [Activiti API](../activiti-api/README.md) - Modern interface-driven API
- [Getting Started](../../getting-started/configuration.md) - Quick start guide
- [Best Practices](../../best-practices/overview.md) - Performance optimization
