---
sidebar_label: Quick Start
slug: /quickstart
description: Get up and running with Activiti API in minutes! Installation, first process, and complete examples.
---

# Quick Start Guide

Get up and running with Activiti API in minutes!

## 🚀 Prerequisites

- Java 11 or higher
- Maven 3.6+ or Gradle 7+
- Basic understanding of workflows and BPMN

## 📦 Installation

### Maven

Add the following dependencies to your `pom.xml`:

```xml
<dependencies>
    <!-- Process Runtime -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-api-process-runtime</artifactId>
        <version>8.7.2-SNAPSHOT</version>
    </dependency>
    
    <!-- Task Runtime -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-api-task-runtime</artifactId>
        <version>8.7.2-SNAPSHOT</version>
    </dependency>
</dependencies>
```

### Gradle

Add to your `build.gradle`:

```groovy
dependencies {
    implementation 'org.activiti:activiti-api-process-runtime:8.7.2-SNAPSHOT'
    implementation 'org.activiti:activiti-api-task-runtime:8.7.2-SNAPSHOT'
}
```

## 🎯 Your First Process

### Step 1: Create a Simple BPMN Process

Create a file `simple-process.bpmn`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
    <bpmn:process id="greetingProcess" name="Greeting Process">
        <bpmn:startEvent id="start"/>
        <bpmn:sequenceFlow id="flow1" sourceRef="start" targetRef="task1"/>
        <bpmn:userTask id="task1" name="Send Greeting"/>
        <bpmn:sequenceFlow id="flow2" sourceRef="task1" targetRef="end"/>
        <bpmn:endEvent id="end"/>
    </bpmn:process>
</bpmn:definitions>
```

### Step 2: Deploy the Process

```java
@Service
public class ProcessDeploymentService {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    public void deployProcess() {
        // Process is deployed via Spring Boot auto-configuration
        // or through your deployment mechanism
        System.out.println("Process deployed successfully!");
    }
}
```

### Step 3: Start a Process Instance

```java
@Service
public class GreetingService {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    public void startGreetingProcess(String name) {
        ProcessInstance instance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("greetingProcess")
                .withVariable("userName", name)
                .withVariable("greeting", "Hello, " + name + "!")
                .build()
        );
        
        System.out.println("Process started: " + instance.getId());
        System.out.println("Business Key: " + instance.getBusinessKey());
    }
}
```

### Step 4: Query and Complete Tasks

```java
@Service
public class TaskCompletionService {
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    public void completeUserTasks() {
        // Get all tasks for current user
        Page<Task> tasks = taskRuntime.tasks(Pageable.of(0, 10));
        
        System.out.println("Found " + tasks.getTotalItems() + " tasks");
        
        for (Task task : tasks.getContent()) {
            System.out.println("Task: " + task.getName());
            System.out.println("ID: " + task.getId());
            
            // Complete the task
            taskRuntime.complete(
                TaskPayloadBuilder.complete()
                    .withTaskId(task.getId())
                    .withVariable("completedBy", "system")
                    .withVariable("completionTime", new Date())
                    .build()
            );
            
            System.out.println("Task completed: " + task.getId());
        }
    }
}
```

## 📊 Complete Example Application

### Application Controller

```java
@RestController
@RequestMapping("/api/workflow")
public class WorkflowController {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startProcess(
            @RequestBody Map<String, Object> variables) {
        
        ProcessInstance instance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("greetingProcess")
                .withVariables(variables)
                .build()
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("processInstanceId", instance.getId());
        response.put("status", instance.getStatus());
        response.put("message", "Process started successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/tasks")
    public ResponseEntity<Page<Task>> getMyTasks() {
        Page<Task> tasks = taskRuntime.tasks(Pageable.of(0, 20));
        return ResponseEntity.ok(tasks);
    }
    
    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Map<String, Object>> completeTask(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> variables) {
        
        Task completed = taskRuntime.complete(
            TaskPayloadBuilder.complete()
                .withTaskId(taskId)
                .withVariables(variables)
                .build()
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("taskId", completed.getId());
        response.put("status", completed.getStatus());
        response.put("message", "Task completed successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/process/{processInstanceId}")
    public ResponseEntity<ProcessInstance> getProcess(
            @PathVariable String processInstanceId) {
        
        ProcessInstance instance = processRuntime.processInstance(processInstanceId);
        return ResponseEntity.ok(instance);
    }
}
```

### Event Listener

```java
@Component
public class WorkflowEventListener {
    
    @Autowired
    private NotificationService notificationService;
    
    @EventListener
    public void onProcessStarted(ProcessStartedEvent event) {
        ProcessInstance process = event.getEntity();
        System.out.println("Process started: " + process.getId());
        notificationService.sendNotification("Process Started", process.getName());
    }
    
    @EventListener
    public void onTaskCompleted(TaskCompletedEvent event) {
        Task task = event.getEntity();
        System.out.println("Task completed: " + task.getId());
        notificationService.sendNotification("Task Completed", task.getName());
    }
    
    @EventListener
    public void onProcessCompleted(ProcessCompletedEvent event) {
        ProcessInstance process = event.getEntity();
        System.out.println("Process completed: " + process.getId());
        notificationService.sendNotification("Process Completed", process.getName());
    }
}
```

## 🔧 Configuration

### application.properties

```properties
# Database Configuration
spring.datasource.url=jdbc:h2:mem:activiti
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# H2 Console (for development)
spring.h2.console.enabled=true

# Activiti Configuration
spring.activiti.bpmn-enable-history-level=full
spring.activiti.db-schema-update=true
spring.activiti.async-executor-activate=true

# Logging
logging.level.org.activiti=INFO
logging.level.org.flowable=INFO
```

### application.yml (Alternative)

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:activiti
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
  activiti:
    bpmn-enable-history-level: full
    db-schema-update: true
    async-executor-activate: true

logging:
  level:
    org.activiti: INFO
    org.flowable: INFO
```

## 🧪 Testing

### Unit Test Example

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
    void shouldStartProcess() {
        ProcessInstance mockInstance = Mockito.mock(ProcessInstance.class);
        when(mockInstance.getId()).thenReturn("test-instance-id");
        when(processRuntime.start(any(StartProcessPayload.class))).thenReturn(mockInstance);
        
        ProcessInstance result = workflowService.startProcess("testKey", new HashMap<>());
        
        assertEquals("test-instance-id", result.getId());
        verify(processRuntime).start(any(StartProcessPayload.class));
    }
}
```

### Integration Test Example

```java
@SpringBootTest
class WorkflowIntegrationTest {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    @Test
    void shouldExecuteFullWorkflow() {
        // Start process
        ProcessInstance instance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("greetingProcess")
                .withVariable("userName", "Test User")
                .build()
        );
        
        assertNotNull(instance.getId());
        
        // Get and complete task
        Page<Task> tasks = taskRuntime.tasks(Pageable.of(0, 10));
        assertEquals(1, tasks.getContent().size());
        
        Task task = tasks.getContent().get(0);
        taskRuntime.complete(
            TaskPayloadBuilder.complete()
                .withTaskId(task.getId())
                .build()
        );
        
        // Verify process completion
        ProcessInstance completed = processRuntime.processInstance(instance.getId());
        assertEquals(ProcessInstanceStatus.COMPLETED, completed.getStatus());
    }
}
```

## 📈 Next Steps

1. **Learn BPMN**: Understand BPMN 2.0 notation and concepts
2. **Explore Events**: Implement event listeners for business logic
3. **Add Security**: Configure authentication and authorization
4. **Build Connectors**: Integrate with external systems
5. **Optimize Performance**: Implement caching and async processing

## 🆘 Common Issues

### Issue: Process Definition Not Found

**Solution**: Ensure the process is deployed before starting instances.

```java
// Check deployed processes
Page<ProcessDefinition> definitions = processRuntime.processDefinitions(Pageable.of(0, 10));
definitions.getContent().forEach(def -> 
    System.out.println("Deployed: " + def.getKey())
);
```

### Issue: Task Not Visible

**Solution**: Verify user authentication and task assignment.

```java
// Debug task visibility
String userId = securityManager.getAuthenticatedUserId();
System.out.println("Current user: " + userId);

Task task = taskRuntime.task(taskId);
System.out.println("Task assignee: " + task.getAssignee());
System.out.println("Candidate users: " + task.getCandidateUsers());
```

### Issue: Variables Not Persisting

**Solution**: Set variables before completing tasks.

```java
// Correct approach
taskRuntime.complete(
    TaskPayloadBuilder.complete()
        .withTaskId(taskId)
        .withVariable("myVar", "value")  // Set here
        .build()
);
```

## 📚 Additional Resources

- [Full Documentation](./README.md)
- [API Reference](./api-reference.md)
- [Best Practices](./best-practices.md)
- [Examples Repository](https://github.com/Activiti/Activiti)

## 💡 Tips

1. **Start Simple**: Begin with basic processes before adding complexity
2. **Use Pagination**: Always paginate queries for better performance
3. **Handle Errors**: Implement proper exception handling
4. **Log Everything**: Use logging for debugging and monitoring
5. **Test Thoroughly**: Write unit and integration tests

---

**Happy Workflow Automation! 🎉**
