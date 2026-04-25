---
sidebar_label: Quick Start
slug: /quickstart
title: "Quick Start Guide"
description: "Get up and running with Activiti API. Installation, first workflow, and complete examples."
---

# Quick Start Guide

**Community-Maintained Guide**

Deploy your first workflow in minutes with this comprehensive quick start guide.

> **Note:** This is community-contributed documentation and is not officially maintained by the Activiti team. For official documentation, please refer to the Activiti project repositories.

## Prerequisites

Ensure the following are installed before beginning:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Java Development Kit (JDK) | 11+ (17+ recommended) | Runtime environment |
| Maven | 3.6+ | Build tool (alternative: Gradle 7+) |
| Text Editor / IDE | Any | Code development |

**Recommended:** IntelliJ IDEA or VS Code with Java extensions

## Installation

### Maven

Add the following dependencies to your project's `pom.xml`:

```xml
<dependencies>
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-spring-boot-starter</artifactId>
        <version>8.7.2-SNAPSHOT</version>
    </dependency>
</dependencies>
```

### Gradle

Add to your `build.gradle`:

```groovy
dependencies {
    implementation 'org.activiti:activiti-spring-boot-starter:8.7.2-SNAPSHOT'
}
```

## Your First Workflow

Follow these steps to create, deploy, and execute your first Activiti workflow.

### Step 1: Define a BPMN Process

Create a file named `simple-process.bpmn` in `src/main/resources/bpmn/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:activiti="http://activiti.org/bpmn">
    <bpmn:process id="greetingProcess" name="Greeting Process">
        <bpmn:startEvent id="start"/>
        <bpmn:sequenceFlow id="flow1" sourceRef="start" targetRef="task1"/>
        <bpmn:userTask id="task1" name="Send Greeting"/>
        <bpmn:sequenceFlow id="flow2" sourceRef="task1" targetRef="end"/>
        <bpmn:endEvent id="end"/>
    </bpmn:process>
</bpmn:definitions>
```

**Process Overview:**
- `greetingProcess` - A simple workflow with one user task
- `start` - Process initiation point
- `task1` - User task requiring manual intervention
- `end` - Process completion point

### Step 2: Configure Process Deployment

Create a service to handle process deployment:

```java
@Service
public class ProcessDeploymentService {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    /**
     * Deploys BPMN processes from the classpath.
     * Processes should be located in src/main/resources/bpmn/
     */
    @PostConstruct
    public void deployProcesses() {
        // Activiti automatically deploys BPMN files from classpath
        // when configured with spring.activiti.check-process-definitions=true
        
        // Verify deployment
        Page<ProcessDefinition> definitions = processRuntime.processDefinitions(Pageable.of(0, 10));
        definitions.getContent().forEach(def -> 
            log.info("Deployed process: {} (ID: {})", def.getName(), def.getKey())
        );
    }
}
```

### Step 3: Start a Process Instance

Implement a service to initiate workflow execution:

```java
@Service
public class GreetingService {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    /**
     * Starts a new greeting process instance.
     * 
     * @param name The name to use in the greeting
     * @return The created process instance
     */
    public ProcessInstance startGreetingProcess(String name) {
        ProcessInstance instance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("greetingProcess")
                .withBusinessKey("GREETING-" + name)
                .withVariable("userName", name)
                .withVariable("greeting", "Hello, " + name + "!")
                .build()
        );
        
        log.info("Process started: ID={}, BusinessKey={}", 
                 instance.getId(), instance.getBusinessKey());
        
        return instance;
    }
}
```

### Step 4: Query and Complete Tasks

Retrieve and complete user tasks:

```java
@Service
public class TaskCompletionService {
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    /**
     * Retrieves all pending tasks and completes them.
     */
    public void completeAllPendingTasks() {
        Page<Task> tasks = taskRuntime.tasks(Pageable.of(0, 10));
        
        log.info("Found {} pending tasks", tasks.getTotalItems());
        
        for (Task task : tasks.getContent()) {
            log.info("Processing task: {} (ID: {})", task.getName(), task.getId());
            
            Task completed = taskRuntime.complete(
                TaskPayloadBuilder.complete()
                    .withTaskId(task.getId())
                    .withVariable("completedBy", "system")
                    .withVariable("completionTime", new Date())
                    .build()
            );
            
            log.info("Task completed: {}", completed.getId());
        }
    }
    
    /**
     * Retrieves tasks for a specific process instance.
     */
    public Page<Task> getTasksForProcess(String processInstanceId) {
        return taskRuntime.tasks(
            Pageable.of(0, 10),
            TaskPayloadBuilder.tasks()
                .withProcessInstanceId(processInstanceId)
                .build()
        );
    }
}
```

## Complete Example Application

This section provides a production-ready REST API implementation for workflow management.

### REST Controller

Expose workflow operations through HTTP endpoints:

```java
@RestController
@RequestMapping("/api/workflow")
@Validated
public class WorkflowController {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    /**
     * Starts a new process instance.
     * POST /api/workflow/start
     */
    @PostMapping("/start")
    public ResponseEntity<ProcessStartResponse> startProcess(
            @Valid @RequestBody StartProcessRequest request) {
        
        ProcessInstance instance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey(request.getProcessDefinitionKey())
                .withBusinessKey(request.getBusinessKey())
                .withVariables(request.getVariables())
                .build()
        );
        
        ProcessStartResponse response = new ProcessStartResponse(
            instance.getId(),
            instance.getStatus(),
            instance.getBusinessKey()
        );
        
        return ResponseEntity.created(URI.create("/api/workflow/" + instance.getId()))
                .body(response);
    }
    
    /**
     * Retrieves all tasks for the authenticated user.
     * GET /api/workflow/tasks
     */
    @GetMapping("/tasks")
    public ResponseEntity<Page<Task>> getTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Task> tasks = taskRuntime.tasks(Pageable.of(page, size));
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Completes a specific task.
     * POST /api/workflow/tasks/{taskId}/complete
     */
    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<TaskCompleteResponse> completeTask(
            @PathVariable String taskId,
            @Valid @RequestBody TaskCompletionRequest request) {
        
        Task completed = taskRuntime.complete(
            TaskPayloadBuilder.complete()
                .withTaskId(taskId)
                .withVariables(request.getVariables())
                .build()
        );
        
        return ResponseEntity.ok(new TaskCompleteResponse(
            completed.getId(),
            completed.getStatus()
        ));
    }
    
    /**
     * Retrieves process instance details.
     * GET /api/workflow/{processInstanceId}
     */
    @GetMapping("/{processInstanceId}")
    public ResponseEntity<ProcessInstance> getProcessInstance(
            @PathVariable String processInstanceId) {
        ProcessInstance instance = processRuntime.processInstance(processInstanceId);
        return ResponseEntity.ok(instance);
    }
}
```

### Request/Response DTOs

Define structured data transfer objects:

```java
@Data
@Validated
public class StartProcessRequest {
    
    @NotBlank
    private String processDefinitionKey;
    
    @NotBlank
    private String businessKey;
    
    private Map<String, Object> variables = new HashMap<>();
}

@Data
public class ProcessStartResponse {
    private String processInstanceId;
    private ProcessInstanceStatus status;
    private String businessKey;
    
    public ProcessStartResponse(String processInstanceId, 
                                ProcessInstanceStatus status, 
                                String businessKey) {
        this.processInstanceId = processInstanceId;
        this.status = status;
        this.businessKey = businessKey;
    }
}

@Data
@Validated
public class TaskCompletionRequest {
    private Map<String, Object> variables = new HashMap<>();
}

@Data
public class TaskCompleteResponse {
    private String taskId;
    private TaskStatus status;
    
    public TaskCompleteResponse(String taskId, TaskStatus status) {
        this.taskId = taskId;
        this.status = status;
    }
}
```

### Event Listeners

Implement event-driven architecture with Spring events:

```java
@Component
@Slf4j
public class WorkflowEventListener {
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Handles process start events.
     */
    @EventListener
    @Async
    public void onProcessStarted(ProcessStartedEvent event) {
        ProcessInstance process = event.getEntity();
        log.info("Process started: ID={}, Name={}", process.getId(), process.getName());
        
        notificationService.sendNotification(
            "Process Started",
            String.format("Workflow '%s' has been initiated", process.getName())
        );
    }
    
    /**
     * Handles task completion events.
     */
    @EventListener
    @Async
    public void onTaskCompleted(TaskCompletedEvent event) {
        Task task = event.getEntity();
        log.info("Task completed: ID={}, Name={}", task.getId(), task.getName());
        
        notificationService.sendNotification(
            "Task Completed",
            String.format("Task '%s' has been completed", task.getName())
        );
    }
    
    /**
     * Handles process completion events.
     */
    @EventListener
    @Async
    public void onProcessCompleted(ProcessCompletedEvent event) {
        ProcessInstance process = event.getEntity();
        log.info("Process completed: ID={}, Duration={}", 
                 process.getId(), process.getEndTime());
        
        notificationService.sendNotification(
            "Process Completed",
            String.format("Workflow '%s' has been successfully completed", process.getName())
        );
        
        // Trigger post-completion activities
        archiveProcessData(process);
        updateAnalytics(process);
    }
    
    /**
     * Handles process cancellation events.
     */
    @EventListener
    public void onProcessCancelled(ProcessCancelledEvent event) {
        ProcessInstance process = event.getEntity();
        log.error("Process cancelled: ID={}, Cause={}", 
                  process.getId(), event.getCause());
        
        notificationService.sendAlert(
            "Process Cancelled",
            String.format("Workflow was cancelled: %s", event.getCause())
        );
    }
    
    private void archiveProcessData(ProcessInstance process) {
        // Archive implementation
    }
    
    private void updateAnalytics(ProcessInstance process) {
        // Analytics implementation
    }
}
```

## Application Configuration

Configure your Spring Boot application for Activiti integration.

### application.properties

```properties
# Database Configuration (H2 for development)
spring.datasource.url=jdbc:h2:mem:activiti
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# H2 Console (development only)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Activiti Configuration
spring.activiti.history-level=full
spring.activiti.database-schema-update=true
spring.activiti.async-executor-activate=true
spring.activiti.check-process-definitions=true

# Logging Configuration
logging.level.org.activiti=INFO
logging.level.com.example.workflow=DEBUG

# Production: Use PostgreSQL/MySQL instead
# spring.datasource.url=jdbc:postgresql://localhost:5432/activiti
# spring.datasource.driverClassName=org.postgresql.Driver
```

### application.yml (Alternative)

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:activiti
    driver-class-name: org.h2.Driver
    username: sa
    password:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
  
  h2:
    console:
      enabled: true
      path: /h2-console
  
  activiti:
    history-level: full
    db-schema-update: true
    async-executor-activate: true

logging:
  level:
    org.activiti: INFO
    com.example.workflow: DEBUG
```

### Production Configuration Recommendations

For production deployments, update the following:

| Setting | Development | Production |
|---------|-------------|------------|
| Database | H2 (in-memory) | PostgreSQL/MySQL |
| History Level | full | audit (for performance) |
| Schema Update | true | false (use migrations) |
| Logging | DEBUG | INFO/WARN |
| H2 Console | enabled | disabled |

## Testing

Implement comprehensive tests to ensure workflow reliability.

### Unit Tests

Test business logic with mocked dependencies:

```java
@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {
    
    @Mock
    private ProcessRuntime processRuntime;
    
    @Mock
    private TaskRuntime taskRuntime;
    
    @InjectMocks
    private WorkflowService workflowService;
    
    @Test
    void shouldStartProcessSuccessfully() {
        // Arrange
        ProcessInstance mockInstance = Mockito.mock(ProcessInstance.class);
        when(mockInstance.getId()).thenReturn("test-instance-id");
        when(mockInstance.getStatus()).thenReturn(ProcessInstanceStatus.ACTIVE);
        when(processRuntime.start(any(StartProcessPayload.class))).thenReturn(mockInstance);
        
        // Act
        ProcessInstance result = workflowService.startProcess("testKey", new HashMap<>());
        
        // Assert
        assertNotNull(result);
        assertEquals("test-instance-id", result.getId());
        assertEquals(ProcessInstanceStatus.ACTIVE, result.getStatus());
        verify(processRuntime).start(any(StartProcessPayload.class));
    }
    
    @Test
    void shouldHandleProcessStartFailure() {
        // Arrange
        when(processRuntime.start(any(StartProcessPayload.class)))
            .thenThrow(new NotFoundException("Process not found"));
        
        // Act & Assert
        assertThrows(BusinessException.class, () -> {
            workflowService.startProcess("invalidKey", new HashMap<>());
        });
    }
}
```

### Integration Tests

Test end-to-end workflow execution with a test database:

```java
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class WorkflowIntegrationTest {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    @Test
    void shouldExecuteFullWorkflow() {
        // Arrange
        String processKey = "greetingProcess";
        String userName = "Test User";
        
        // Act - Start process
        ProcessInstance instance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey(processKey)
                .withVariable("userName", userName)
                .build()
        );
        
        // Assert - Process started
        assertNotNull(instance.getId());
        assertEquals(ProcessInstanceStatus.ACTIVE, instance.getStatus());
        
        // Act - Get and complete task
        Page<Task> tasks = taskRuntime.tasks(Pageable.of(0, 10));
        assertEquals(1, tasks.getContent().size());
        
        Task task = tasks.getContent().get(0);
        taskRuntime.complete(
            TaskPayloadBuilder.complete()
                .withTaskId(task.getId())
                .build()
        );
        
        // Assert - Process completed
        ProcessInstance completed = processRuntime.processInstance(instance.getId());
        assertEquals(ProcessInstanceStatus.COMPLETED, completed.getStatus());
    }
    
    @Test
    void shouldHandleMultipleConcurrentProcesses() throws InterruptedException {
        // Arrange
        ExecutorService executor = Executors.newFixedThreadPool(5);
        CountDownLatch latch = new CountDownLatch(5);
        List<Future<ProcessInstance>> futures = new ArrayList<>();
        
        // Act - Start multiple processes concurrently
        for (int i = 0; i < 5; i++) {
            Future<ProcessInstance> future = executor.submit(() -> {
                try {
                    return processRuntime.start(
                        ProcessPayloadBuilder.start()
                            .withProcessDefinitionKey("greetingProcess")
                            .withVariable("userName", "User-" + i)
                            .build()
                    );
                } finally {
                    latch.countDown();
                }
            });
            futures.add(future);
        }
        
        // Wait for all processes to start
        assertTrue(latch.await(30, TimeUnit.SECONDS));
        
        // Assert - All processes started successfully
        for (Future<ProcessInstance> future : futures) {
            ProcessInstance instance = future.get();
            assertNotNull(instance.getId());
        }
        
        executor.shutdown();
    }
}
```

### REST API Tests

Test controller endpoints:

```java
@WebMvcTest(WorkflowController.class)
class WorkflowControllerTest {
    
    @MockBean
    private ProcessRuntime processRuntime;
    
    @MockBean
    private TaskRuntime taskRuntime;
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    void shouldStartProcessViaRestApi() throws Exception {
        // Arrange
        ProcessInstance mockInstance = Mockito.mock(ProcessInstance.class);
        when(mockInstance.getId()).thenReturn("test-id");
        when(mockInstance.getStatus()).thenReturn(ProcessInstanceStatus.ACTIVE);
        when(processRuntime.start(any())).thenReturn(mockInstance);
        
        StartProcessRequest request = new StartProcessRequest();
        request.setProcessDefinitionKey("greetingProcess");
        request.setBusinessKey("TEST-001");
        
        // Act & Assert
        mockMvc.perform(post("/api/workflow/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.processInstanceId").value("test-id"));
    }
}
```

## Next Steps

Continue your learning journey with these resources:

| Topic | Resource | Description |
|-------|----------|-------------|
| **BPMN Fundamentals** | [BPMN Documentation](./bpmn/elements/user-task.md) | Learn BPMN 2.0 notation and elements |
| **Event Handling** | [Implementation Patterns](./implementation-patterns.md#event-handling-patterns) | Master event-driven architecture |
| **Security** | [Security Best Practices](./best-practices/guide.md#security-best-practices) | Implement authentication and authorization |
| **Connectors** | [Integration Guide](./bpmn/integration/connectors.md) | Integrate with external systems |
| **Performance** | [Performance Optimization](./best-practices/guide.md#performance-optimization) | Scale your workflows effectively |

## Troubleshooting

### Common Issues and Solutions

#### Issue: Process Definition Not Found

**Symptom:** `NotFoundException` when starting a process

**Cause:** The process definition has not been deployed or the key is incorrect.

**Solution:**

```java
// Verify deployed process definitions
Page<ProcessDefinition> definitions = processRuntime.processDefinitions(Pageable.of(0, 10));
definitions.getContent().forEach(def -> 
    log.info("Deployed: key={}, name={}, version={}", 
             def.getKey(), def.getName(), def.getVersion())
);

// Ensure correct process key is used
ProcessInstance instance = processRuntime.start(
    ProcessPayloadBuilder.start()
        .withProcessDefinitionKey("greetingProcess") // Must match BPMN process id
        .build()
);
```

#### Issue: Task Not Visible to User

**Symptom:** Tasks exist but user cannot see or complete them

**Cause:** Task assignment or candidate user configuration issue.

**Solution:**

```java
// Check current user context
String userId = securityManager.getAuthenticatedUserId();
log.info("Current user: {}", userId);

// Inspect task assignment
Task task = taskRuntime.task(taskId);
log.info("Task assignee: {}", task.getAssignee());
log.info("Candidate users: {}", task.getCandidateUsers());
log.info("Candidate groups: {}", task.getCandidateGroups());

// Ensure task is assigned or user is in candidate list
if (task.getAssignee() == null && !task.getCandidateUsers().contains(userId)) {
    // Assign task to user
    taskRuntime.assign(
        TaskPayloadBuilder.assign()
            .withTaskId(taskId)
            .withAssignee(userId)
            .build()
    );
}
```

#### Issue: Variables Not Persisting

**Symptom:** Process variables are lost between tasks

**Cause:** Variables not properly set during task completion or process execution.

**Solution:**

```java
// Correct: Set variables when completing task
taskRuntime.complete(
    TaskPayloadBuilder.complete()
        .withTaskId(taskId)
        .withVariable("myVar", "value")
        .withVariable("anotherVar", 123)
        .build()
);

// Verify variables are set
List<VariableInstance> variables = processRuntime.variables(
    ProcessPayloadBuilder.variables()
        .withProcessInstanceId(processInstanceId)
        .build()
);

log.info("Process variables: {}", variables);
```

#### Issue: Database Connection Errors

**Symptom:** `CannotGetJdbcConnectionException` or similar

**Cause:** Database configuration issues or connection pool exhaustion.

**Solution:**

```yaml
# Ensure proper connection pool configuration
spring:
  datasource:
    hikari:
      maximum-pool-size: 20  # Adjust based on load
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

## Best Practices Summary

1. **Start Simple** - Begin with basic workflows before adding complexity
2. **Use Pagination** - Always paginate queries for better performance
3. **Handle Errors** - Implement comprehensive exception handling
4. **Log Appropriately** - Use structured logging for debugging and monitoring
5. **Test Thoroughly** - Write unit, integration, and API tests
6. **Secure Endpoints** - Validate inputs and implement authorization
7. **Monitor Performance** - Track key metrics and set up alerts

## Additional Resources

- [API Reference](./api-reference/overview.md) - Complete API documentation
- [Best Practices](./best-practices/guide.md) - Production-ready patterns
- [Troubleshooting Guide](./troubleshooting/overview.md) - Detailed issue resolution
- [GitHub Examples](https://github.com/Activiti/Activiti) - Sample applications

---

**Congratulations!** You've completed the quick start guide. You now have the foundation to build workflow automation solutions with Activiti.

**Ready for more?** Explore the [API Reference](./api-reference/overview.md) or dive into [Best Practices](./best-practices/guide.md).
