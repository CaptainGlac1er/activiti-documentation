---
sidebar_label: Troubleshooting
slug: /troubleshooting/overview
title: "Troubleshooting Guide"
description: "Comprehensive guide for diagnosing and resolving common issues with Activiti API in development and production environments."
---

# Troubleshooting Guide

**Community-Maintained Guide**

This guide provides systematic approaches to diagnose and resolve common issues encountered when working with Activiti API.

> **Note:** This is community-contributed documentation and is not officially maintained by the Activiti team. For official documentation, please refer to the Activiti project repositories.

## Table of Contents

- [Debugging Tools](#debugging-tools)
- [Common Issues](#common-issues)
- [Performance Problems](#performance-problems)
- [Configuration Issues](#configuration-issues)
- [Runtime Errors](#runtime-errors)
- [Database Issues](#database-issues)
- [Integration Problems](#integration-problems)
- [Security Issues](#security-issues)
- [Diagnostic Checklist](#diagnostic-checklist)

---

## Debugging Tools

### 1. Enable Debug Logging

Activate detailed logging to trace workflow execution:

**application.properties:**
```properties
logging.level.org.activiti=DEBUG
logging.level.org.activiti.engine.impl=DEBUG
```

**application.yml:**
```yaml
logging:
  level:
    org.activiti: DEBUG
    org.activiti.engine.impl: DEBUG
```

**Output includes:**
- Process instance lifecycle events
- Task creation and completion details
- Variable modifications
- Database operations
- Transaction boundaries

### 2. Use H2 Console (Development Only)

**Enable H2 Console:**
```properties
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

**Access:** http://localhost:8080/h2-console

**Connection Settings:**
- JDBC URL: `jdbc:h2:mem:activiti`
- Driver Class: `org.h2.Driver`
- Username: `sa`
- Password: (leave blank)

**Useful Tables:**
- `ACT_RE_DEPLOYMENT` - Deployed processes
- `ACT_RE_PROCDEF` - Process definitions
- `ACT_RU_EXECUTION` - Running executions
- `ACT_RU_TASK` - Active tasks
- `ACT_RU_VARIABLE` - Active variables
- `ACT_HI_PROCINST` - Historic process instances
- `ACT_HI_TASKINST` - Historic task instances

### 3. Process Instance Inspector

**Create a Debug Service:**
```java
@Service
public class ProcessDebugger {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    public void inspectProcess(String processInstanceId) {
        System.out.println("=== Process Instance Inspection ===");
        
        // Process details
        ProcessInstance process = processRuntime.processInstance(processInstanceId);
        System.out.println("ID: " + process.getId());
        System.out.println("Status: " + process.getStatus());
        System.out.println("Definition: " + process.getProcessDefinitionKey());
        System.out.println("Business Key: " + process.getBusinessKey());
        System.out.println("Initiator: " + process.getInitiator());
        System.out.println("Start Date: " + process.getStartDate());
        
        // Active tasks
        System.out.println("\n=== Active Tasks ===");
        Page<Task> tasks = taskRuntime.tasks(
            Pageable.of(0, 100),
            TaskPayloadBuilder.tasks()
                .withProcessInstanceId(processInstanceId)
                .build()
        );
        
        tasks.getContent().forEach(task -> {
            System.out.println("Task: " + task.getName());
            System.out.println("  ID: " + task.getId());
            System.out.println("  Assignee: " + task.getAssignee());
            System.out.println("  Status: " + task.getStatus());
            System.out.println("  Candidates: " + task.getCandidateUsers());
        });
        
        // Variables
        System.out.println("\n=== Variables ===");
        List<VariableInstance> variables = processRuntime.variables(
            ProcessPayloadBuilder.variables()
                .withProcessInstanceId(processInstanceId)
                .build()
        );
        
        variables.forEach(var -> {
            System.out.println("Variable: " + var.getName());
            System.out.println("  Type: " + var.getType());
            System.out.println("  Value: " + var.getValue());
            System.out.println("  Task Variable: " + var.isTaskVariable());
        });
    }
}
```

### 4. Health Check Endpoint

**Implementation:**
```java
@Component
public class ActivitiHealthIndicator implements HealthIndicator {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    @Override
    public Health health() {
        Map<String, Object> details = new HashMap<>();
        
        try {
            // Test process runtime
            Page<ProcessDefinition> definitions = 
                processRuntime.processDefinitions(Pageable.of(0, 1));
            details.put("processDefinitions", definitions.getTotalItems());
            
            // Test task runtime
            Page<Task> tasks = taskRuntime.tasks(Pageable.of(0, 1));
            details.put("activeTasks", tasks.getTotalItems());
            
            return Health.up().withDetails(details).build();
            
        } catch (Exception e) {
            details.put("error", e.getMessage());
            return Health.down(e).withDetails(details).build();
        }
    }
}
```

**Access:** http://localhost:8080/actuator/health

---

## Common Issues

### Issue 1: Process Definition Not Found

**Symptoms:**
```
NotFoundException: Process definition with key 'orderProcess' not found
```

**Possible Causes:**
1. Process not deployed
2. Wrong process key
3. Deployment failed silently
4. Wrong application context

**Diagnosis:**
```java
// Check deployed processes
Page<ProcessDefinition> definitions = 
    processRuntime.processDefinitions(Pageable.of(0, 100));

definitions.getContent().forEach(def -> 
    System.out.println("Key: " + def.getKey() + 
                      ", Version: " + def.getVersion())
);
```

**Solutions:**

**Solution 1: Verify Deployment**
```java
// Ensure BPMN files are in correct location
// src/main/resources/bpmn/*.bpmn

// Or deploy programmatically
@Autowired
private RepositoryService repositoryService;

public void deployProcess() {
    repositoryService.createDeployment()
        .addClasspathResource("bpmn/order-process.bpmn")
        .deploy();
}
```

**Solution 2: Check Configuration**
```yaml
spring:
  activiti:
    process-definition-location-prefix: classpath:processes/
    check-process-definitions: true
```

**Solution 3: Add Deployment Listener**
```java
@Component
public class DeploymentListener {
    
    @EventListener
    public void onApplicationStarted(ApplicationStartedEvent event) {
        try {
            Thread.sleep(2000); // Wait for engine initialization
            
            Page<ProcessDefinition> definitions = 
                processRuntime.processDefinitions(Pageable.of(0, 10));
            
            if (definitions.getTotalItems() == 0) {
                log.error("No processes deployed!");
            } else {
                log.info("Deployed {} processes", definitions.getTotalItems());
            }
        } catch (Exception e) {
            log.error("Deployment check failed", e);
        }
    }
}
```

---

### Issue 2: Task Not Visible to User

**Symptoms:**
```
User cannot see tasks that should be assigned to them
```

**Diagnosis:**
```java
// Check task details
Task task = taskRuntime.task(taskId);
System.out.println("Assignee: " + task.getAssignee());
System.out.println("Owner: " + task.getOwner());
System.out.println("Candidate Users: " + task.getCandidateUsers());
System.out.println("Candidate Groups: " + task.getCandidateGroups());
System.out.println("Status: " + task.getStatus());

// Check current user
String currentUserId = securityManager.getAuthenticatedUserId();
List<String> userGroups = securityManager.getAuthenticatedUserGroups();
System.out.println("Current User: " + currentUserId);
System.out.println("User Groups: " + userGroups);
```

**Possible Causes:**
1. User not authenticated
2. Task assigned to different user
3. User not in candidate groups
4. Task already completed
5. Security configuration issue

**Solutions:**

**Solution 1: Verify Authentication**
```java
@PreAuthorize("isAuthenticated()")
public Page<Task> getMyTasks() {
    String userId = securityManager.getAuthenticatedUserId();
    if (userId == null || userId.isEmpty()) {
        throw new SecurityException("User not authenticated");
    }
    return taskRuntime.tasks(Pageable.of(0, 10));
}
```

**Solution 2: Check Task Assignment**
```java
// Ensure task is properly assigned
taskRuntime.addCandidateUsers(
    TaskPayloadBuilder.addCandidateUsers()
        .withTaskId(taskId)
        .withCandidateUser("john.doe")
        .build()
);
```

**Solution 3: Review Security Configuration**
```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityManager securityManager() {
        return new SpringSecurityManager(
            securityContextPrincipalProvider(),
            principalIdentityProvider(),
            principalGroupsProvider(),
            principalRolesProvider()
        );
    }
}
```

---

### Issue 3: Variables Not Persisting

**Symptoms:**
```
Variables set during task completion are lost
```

**Diagnosis:**
```java
// Check variable scope
List<VariableInstance> processVariables = 
    processRuntime.variables(
        ProcessPayloadBuilder.variables()
            .withProcessInstanceId(instanceId)
            .build()
    );

List<VariableInstance> taskVariables = 
    taskRuntime.variables(
        TaskPayloadBuilder.variables()
            .withTaskId(taskId)
            .build()
    );

System.out.println("Process Variables: " + processVariables.size());
System.out.println("Task Variables: " + taskVariables.size());
```

**Common Mistakes:**

**Mistake 1: Setting Variables After Completion**
```java
// ❌ WRONG
taskRuntime.complete(
    TaskPayloadBuilder.complete()
        .withTaskId(taskId)
        .build()
);

// Then trying to set variables
taskRuntime.createVariable(...); // Too late!
```

**Correct Approach:**
```java
// CORRECT
taskRuntime.complete(
    TaskPayloadBuilder.complete()
        .withTaskId(taskId)
        .withVariable("result", "approved")
        .withVariable("timestamp", new Date())
        .build()
);
```

**Mistake 2: Wrong Variable Scope**
```java
// Process variable accessed as task variable
processRuntime.setVariables(...);
List<VariableInstance> vars = taskRuntime.variables(...); // Won't find it
```

**Solution:**
```java
// Use correct scope
processRuntime.setVariables(...);
List<VariableInstance> vars = processRuntime.variables(...); // Correct
```

---

### Issue 4: Process Stuck/Not Advancing

**Symptoms:**
```
Process instance is running but not progressing
```

**Diagnosis:**
```java
// Check active executions and tasks
ProcessInstance process = processRuntime.processInstance(instanceId);
System.out.println("Status: " + process.getStatus());

Page<Task> activeTasks = taskRuntime.tasks(
    Pageable.of(0, 100),
    TaskPayloadBuilder.tasks()
        .withProcessInstanceId(instanceId)
        .build()
);

System.out.println("Active Tasks: " + activeTasks.getTotalItems());
activeTasks.getContent().forEach(task -> 
    System.out.println("Task: " + task.getName() + 
                       ", Assignee: " + task.getAssignee())
);
```

**Possible Causes:**
1. Waiting for user task
2. Async job not executing
3. Gateway condition not met
4. Exception in service task
5. Timer event not fired

**Solutions:**

**Solution 1: Check Async Jobs**
```properties
# Enable async executor
spring.activiti.async-executor-activate=true
spring.activiti.async-executor.core-pool-size=10
```

**Solution 2: Force Job Execution (Development Only)**
```java
@Scheduled(fixedRate = 5000)
public void executeJobs() {
    RepositoryService repositoryService = ...;
    repositoryService.getProcessEngineConfiguration()
        .getAsyncExecutor()
        .executeJobs(1);
}
```

**Solution 3: Check Gateway Conditions**
```java
// Log variable values at decision points
@Component
public class GatewayDebugger implements ProcessEventListener<ProcessUpdatedEvent> {
    
    @Override
    public void onEvent(ProcessUpdatedEvent event) {
        ProcessInstance process = event.getEntity();
        
        List<VariableInstance> variables = 
            processRuntime.variables(
                ProcessPayloadBuilder.variables()
                    .withProcessInstanceId(process.getId())
                    .build()
            );
        
        log.debug("Process {} variables: {}", process.getId(), 
            variables.stream()
                .map(v -> v.getName() + "=" + v.getValue())
                .collect(Collectors.joining(", ")));
    }
}
```

---

## Performance Problems

### Problem 1: Slow Query Performance

**Symptoms:**
```
Task/process queries take > 5 seconds
```

**Diagnosis:**
```java
// Profile query execution
StopWatch stopWatch = new StopWatch("QueryPerformance");
stopWatch.start("Process Query");
Page<ProcessInstance> processes = processRuntime.processInstances(...);
stopWatch.stop();
System.out.println(stopWatch.prettyPrint());
```

**Solutions:**

**Solution 1: Add Database Indexes**
```sql
-- Common indexes for performance
CREATE INDEX idx_task_assignee ON ACT_RU_TASK(ASSIGNEE_);
CREATE INDEX idx_task_process ON ACT_RU_TASK(PROC_INST_ID_);
CREATE INDEX idx_exec_process ON ACT_RU_EXECUTION(PROC_INST_ID_);
CREATE INDEX idx_var_exec ON ACT_RU_VARIABLE(EXECUTION_ID_);
```

**Solution 2: Implement Pagination**
```java
// ❌ Bad: Load all
Page<Task> allTasks = taskRuntime.tasks(Pageable.of(0, Integer.MAX_VALUE));

// Good: Paginate
int pageSize = 50;
for (int i = 0; i < totalItems; i += pageSize) {
    Page<Task> page = taskRuntime.tasks(Pageable.of(i, pageSize));
    processPage(page);
}
```

**Solution 3: Use Caching**
```java
@Cacheable(value = "processDefinitions", key = "#processDefinitionKey")
public ProcessDefinition getProcessDefinition(String processDefinitionKey) {
    return processRuntime.processDefinition(processDefinitionKey);
}
```

---

### Problem 2: High Memory Usage

**Symptoms:**
```
Application uses > 2GB heap, frequent GC
```

**Diagnosis:**
```bash
# Check heap usage
jstat -gc <pid> 1000

# Analyze heap dump
jmap -dump:live,format=b,file=heap.hprof <pid>
```

**Solutions:**

**Solution 1: Limit Variable Size**
```java
// Store references instead of large objects
.withVariable("documentId", "doc-123")
.withVariable("documentUrl", "https://storage/doc/123")
// Instead of:
.withVariable("documentContent", largeByteArray)
```

**Solution 2: Configure History Level**
```yaml
spring:
  activiti:
    history-level: activity  # Instead of 'full'
```

**Solution 3: Implement Data Archiving**
```java
@Service
public class ArchiveService {
    
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    public void archiveOldProcesses() {
        Date threshold = Date.from(LocalDateTime.now()
            .minusMonths(3).atZone(ZoneId.systemDefault()).toInstant());
        
        // Move old processes to archive database
        // Delete from active tables
    }
}
```

---

## Configuration Issues

### Issue: Database Connection Problems

**Symptoms:**
```
Cannot acquire connection from pool
Connection timeout
```

**Diagnosis:**
```properties
# Check connection pool metrics
spring.datasource.hikari.pool-name=ActivitiPool
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

**Solutions:**

**Solution 1: Increase Pool Size**
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
      connection-timeout: 60000
```

**Solution 2: Add Connection Validation**
```yaml
spring:
  datasource:
    hikari:
      connection-test-query: SELECT 1
      max-lifetime: 1800000
      idle-timeout: 600000
```

---

## Runtime Errors

### Error: Transaction Timeout

**Symptoms:**
```
Transaction timed out after 30 seconds
```

**Solution:**
```java
@Transactional(timeout = 120)  // Increase to 120 seconds
public void longRunningProcess() {
    // Complex operations
}
```

### Error: Deadlock Detected

**Symptoms:**
```
Deadlock found when trying to get lock
```

**Solution:**
```java
// Ensure consistent ordering of operations
public void updateProcesses(List<String> processIds) {
    // Sort IDs to prevent deadlocks
    processIds.sort(String::compareTo);
    
    for (String id : processIds) {
        updateProcess(id);
    }
}
```

---

## Diagnostic Checklist

### Initial Diagnosis

- [ ] Check application logs for errors
- [ ] Verify database connectivity
- [ ] Confirm processes are deployed
- [ ] Check user authentication
- [ ] Review configuration files

### Process Issues

- [ ] Inspect process instance status
- [ ] Check active tasks
- [ ] Review variable values
- [ ] Examine execution path
- [ ] Verify gateway conditions

### Performance Issues

- [ ] Profile query execution time
- [ ] Check database indexes
- [ ] Monitor memory usage
- [ ] Review connection pool stats
- [ ] Analyze slow queries

### Security Issues

- [ ] Verify user roles
- [ ] Check task assignments
- [ ] Review security configuration
- [ ] Examine audit logs
- [ ] Test authorization rules

---

## Getting Help

### Before Asking for Help

1. **Enable debug logging** and collect relevant logs
2. **Create a minimal reproduction** case
3. **Check existing issues** on GitHub
4. **Review documentation** thoroughly
5. **Gather environment details** (Java version, database, etc.)

### Information to Provide

```
- Activiti Version: 8.7.1
- Java Version: 17.0.1
- Database: PostgreSQL 14
- Spring Boot Version: 3.1.0
- Issue Description: [Clear description]
- Steps to Reproduce: [Numbered steps]
- Expected Behavior: [What should happen]
- Actual Behavior: [What actually happens]
- Error Messages: [Full stack trace]
- Configuration: [Relevant config snippets]
```

### Resources

- **GitHub Issues**: https://github.com/Activiti/Activiti/issues
- **Documentation**: See README.md in this directory

---

**Remember:** Most issues can be resolved by enabling debug logging and carefully examining the output. Take a systematic approach to diagnosis.
