---
sidebar_label: Process Runtime
slug: /api-reference/activiti-api/process-runtime
description: Activiti API module documentation.
---

# Activiti API Process Runtime Module

## Overview

The `activiti-api-process-runtime` module provides the runtime APIs for process execution, management, and monitoring. This module implements the behavioral contracts defined in the process model module.

## Module Structure

```
activiti-api-process-runtime/
└── src/main/java/org/activiti/api/process/runtime/
    ├── conf/
    │   └── ProcessRuntimeConfiguration.java
    ├── events/
    │   └── listener/
    │       ├── ProcessRuntimeEventListener.java
    │       ├── ProcessEventListener.java
    │       ├── BPMNElementEventListener.java
    │       └── ProcessCandidateStarterEventListener.java
    ├── connector/
    │   └── Connector.java
    ├── ProcessRuntime.java
    └── ProcessAdminRuntime.java
```

## Dependencies

```
activiti-api-process-runtime
├── activiti-api-model-shared
├── activiti-api-runtime-shared
└── activiti-api-process-model
```

---

## Core Runtime Interfaces

### ProcessRuntime Interface

**File**: `ProcessRuntime.java`

```java
public interface ProcessRuntime {
    // Configuration
    ProcessRuntimeConfiguration configuration();
    
    // Process Definition Operations
    ProcessDefinition processDefinition(String processDefinitionId);
    Page<ProcessDefinition> processDefinitions(Pageable pageable);
    Page<ProcessDefinition> processDefinitions(Pageable pageable, List<String> include);
    Page<ProcessDefinition> processDefinitions(Pageable pageable, GetProcessDefinitionsPayload payload);
    Page<ProcessDefinition> processDefinitions(Pageable pageable, GetProcessDefinitionsPayload payload, List<String> include);
    
    // Process Instance Operations
    ProcessInstance start(StartProcessPayload startProcessPayload);
    ProcessInstance startCreatedProcess(String processInstanceId, StartProcessPayload startProcessPayload);
    ProcessInstance create(CreateProcessInstancePayload startProcessPayload);
    Page<ProcessInstance> processInstances(Pageable pageable);
    Page<ProcessInstance> processInstances(Pageable pageable, GetProcessInstancesPayload payload);
    ProcessInstance processInstance(String processInstanceId);
    
    // Lifecycle Operations
    ProcessInstance suspend(SuspendProcessPayload suspendProcessPayload);
    ProcessInstance resume(ResumeProcessPayload resumeProcessPayload);
    ProcessInstance delete(DeleteProcessPayload deleteProcessPayload);
    ProcessInstance update(UpdateProcessPayload updateProcessPayload);
    
    // Event Operations
    void signal(SignalPayload signalPayload);
    void receive(ReceiveMessagePayload messagePayload);
    ProcessInstance start(StartMessagePayload messagePayload);
    
    // Variable Operations
    List<VariableInstance> variables(GetVariablesPayload getVariablesPayload);
    void removeVariables(RemoveProcessVariablesPayload removeProcessVariablesPayload);
    void setVariables(SetProcessVariablesPayload setProcessVariablesPayload);
    
    // Metadata Operations
    ProcessDefinitionMeta processDefinitionMeta(String processDefinitionKey);
    ProcessInstanceMeta processInstanceMeta(String processInstanceId);
    
    // Deployment Operations
    Deployment selectLatestDeployment();
}
```

**Purpose**: User-level process operations with authorization checks.

**Key Characteristics**:
- Requires authentication
- Enforces access control
- Returns only visible processes/tasks
- User-context aware operations

### ProcessAdminRuntime Interface

**File**: `ProcessAdminRuntime.java`

```java
public interface ProcessAdminRuntime {
    // Similar to ProcessRuntime but without authorization checks
    // Can access any process instance
    // Can perform administrative operations
}
```

**Purpose**: Administrative process operations with elevated privileges.

**Key Differences from ProcessRuntime**:
- No authorization checks
- Access to all process instances
- Additional administrative operations
- System-level visibility

---

## Operation Categories

### 1. Process Definition Operations

#### Get Process Definition

```java
ProcessDefinition processDefinition(String processDefinitionId);
```

**Purpose**: Retrieve a specific process definition.

**Parameters**:
- `processDefinitionId`: Full ID (e.g., "order:1:abc123") or key

**Returns**:
- `ProcessDefinition`: The process definition metadata

**Throws**:
- `NotFoundException`: If definition doesn't exist

**Example**:
```java
ProcessDefinition definition = 
    processRuntime.processDefinition("orderProcess:1:abc123");

System.out.println("Name: " + definition.getName());
System.out.println("Version: " + definition.getVersion());
```

#### Query Process Definitions

```java
Page<ProcessDefinition> processDefinitions(Pageable pageable);
Page<ProcessDefinition> processDefinitions(Pageable pageable, GetProcessDefinitionsPayload payload);
```

**Purpose**: Query process definitions with filters.

**Filter Options**:
- By definition ID
- By definition keys (multiple)
- Pagination
- Include/exclude fields

**Example**:
```java
Page<ProcessDefinition> definitions = 
    processRuntime.processDefinitions(
        Pageable.of(0, 20),
        ProcessPayloadBuilder.processDefinitions()
            .withProcessDefinitionKey("order")
            .withProcessDefinitionKey("invoice")
            .build()
    );
```

### 2. Process Instance Operations

#### Start Process

```java
ProcessInstance start(StartProcessPayload startProcessPayload);
```

**Purpose**: Start a new process instance.

**Payload Options**:
- By process definition key
- By process definition ID
- With initial variables
- With business key
- With custom name

**Example**:
```java
ProcessInstance instance = processRuntime.start(
    ProcessPayloadBuilder.start()
        .withProcessDefinitionKey("orderProcess")
        .withBusinessKey("ORDER-2024-001")
        .withVariable("amount", 1000.00)
        .withVariable("customer", "John Doe")
        .build()
);
```

**Authorization**:
- User must have permission to start the process
- Checks process candidate starters
- Validates user roles

#### Create Process Instance

```java
ProcessInstance create(CreateProcessInstancePayload payload);
```

**Purpose**: Create a process instance without starting it.

**Use Cases**:
- Pre-create instances for batch processing
- Separate creation from execution
- Deferred start scenarios

**Example**:
```java
ProcessInstance created = processRuntime.create(
    ProcessPayloadBuilder.create()
        .withProcessDefinitionKey("orderProcess")
        .withBusinessKey("ORDER-2024-002")
        .build()
);

// Start later
processRuntime.startCreatedProcess(created.getId(), startPayload);
```

#### Start by Message

```java
ProcessInstance start(StartMessagePayload messagePayload);
```

**Purpose**: Start a process via a start message.

**Example**:
```java
ProcessInstance instance = processRuntime.start(
    MessagePayloadBuilder.start("newOrder")
        .withBusinessKey("ORDER-2024-003")
        .withVariable("items", List.of("item1", "item2"))
        .build()
);
```

#### Get Process Instance

```java
ProcessInstance processInstance(String processInstanceId);
```

**Purpose**: Retrieve a specific process instance.

**Authorization**:
- User must have access to the instance
- Checks if user is initiator, assignee, or has admin role

**Example**:
```java
ProcessInstance instance = 
    processRuntime.processInstance("instance-123");

System.out.println("Status: " + instance.getStatus());
System.out.println("Business Key: " + instance.getBusinessKey());
```

#### Query Process Instances

```java
Page<ProcessInstance> processInstances(Pageable pageable);
Page<ProcessInstance> processInstances(Pageable pageable, GetProcessInstancesPayload payload);
```

**Purpose**: Query process instances with filters.

**Filter Options**:
- By business key
- By process definition keys
- By status (active/suspended)
- By parent process (sub-processes)
- Pagination and sorting

**Example**:
```java
Page<ProcessInstance> instances = 
    processRuntime.processInstances(
        Pageable.of(0, 20, Order.by("startDate", Order.Direction.DESC)),
        ProcessPayloadBuilder.processInstances()
            .withBusinessKey("ORDER-2024")
            .withProcessDefinitionKey("orderProcess")
            .active()
            .build()
    );
```

### 3. Lifecycle Operations

#### Suspend Process

```java
ProcessInstance suspend(SuspendProcessPayload payload);
```

**Purpose**: Pause a running process instance.

**Effects**:
- Process stops executing
- Timer events are paused
- Tasks remain assigned
- State is preserved

**Example**:
```java
ProcessInstance suspended = processRuntime.suspend(
    ProcessPayloadBuilder.suspend(instanceId)
);
```

**Use Cases**:
- Waiting for external approval
- Temporary halt for investigation
- Scheduled maintenance

#### Resume Process

```java
ProcessInstance resume(ResumeProcessPayload payload);
```

**Purpose**: Continue a suspended process instance.

**Effects**:
- Process execution resumes
- Timer events restart
- Workflow continues

**Example**:
```java
ProcessInstance resumed = processRuntime.resume(
    ProcessPayloadBuilder.resume(instanceId)
);
```

#### Delete Process

```java
ProcessInstance delete(DeleteProcessPayload payload);
```

**Purpose**: Cancel and delete a process instance.

**Payload**:
- `processInstanceId`: Target instance
- `reason`: Optional cancellation reason

**Effects**:
- Process is cancelled
- Active tasks are completed/cancelled
- Instance moved to history
- Resources released

**Example**:
```java
ProcessInstance deleted = processRuntime.delete(
    ProcessPayloadBuilder.delete()
        .withProcessInstanceId(instanceId)
        .withReason("Customer requested cancellation")
        .build()
);
```

**Authorization**:
- User must be assignee of active tasks
- Or have admin privileges
- Or be process initiator (configurable)

#### Update Process

```java
ProcessInstance update(UpdateProcessPayload payload);
```

**Purpose**: Update process instance metadata.

**Updatable Fields**:
- Name
- Description
- Business key

**Example**:
```java
ProcessInstance updated = processRuntime.update(
    ProcessPayloadBuilder.update()
        .withProcessInstanceId(instanceId)
        .withName("Updated Order Process")
        .withBusinessKey("NEW-KEY-123")
        .build()
);
```

### 4. Event Operations

#### Send Signal

```java
void signal(SignalPayload payload);
```

**Purpose**: Broadcast a signal to all waiting processes.

**Signal Characteristics**:
- Broadcast to all instances
- No correlation needed
- Can carry variables

**Example**:
```java
processRuntime.signal(
    SignalPayloadBuilder.signal()
        .withName("approvalSignal")
        .withVariable("approvedBy", "manager")
        .withVariable("timestamp", new Date())
        .build()
);
```

**Use Cases**:
- Global notifications
- Cross-process communication
- System-wide events

#### Receive Message

```java
void receive(ReceiveMessagePayload payload);
```

**Purpose**: Send a message to a specific process instance.

**Message Correlation**:
- By correlation key
- By business key
- By process instance

**Example**:
```java
processRuntime.receive(
    MessagePayloadBuilder.receive("paymentReceived")
        .withCorrelationKey("ORDER-123")
        .withVariable("amount", 500.00)
        .withVariable("paymentId", "PAY-456")
        .build()
);
```

**Use Cases**:
- External system notifications
- Async event handling
- Message-driven processes

### 5. Variable Operations

#### Get Variables

```java
List<VariableInstance> variables(GetVariablesPayload payload);
```

**Purpose**: Retrieve process variables.

**Example**:
```java
List<VariableInstance> variables = processRuntime.variables(
    ProcessPayloadBuilder.variables()
        .withProcessInstanceId(instanceId)
        .build()
);

for (VariableInstance var : variables) {
    System.out.println(var.getName() + ": " + var.getValue());
}
```

#### Set Variables

```java
void setVariables(SetProcessVariablesPayload payload);
```

**Purpose**: Set or update process variables.

**Example**:
```java
processRuntime.setVariables(
    ProcessPayloadBuilder.setVariables()
        .withProcessInstanceId(instanceId)
        .withVariable("status", "approved")
        .withVariable("reviewer", "john.doe")
        .withVariable("timestamp", new Date())
        .build()
);
```

**Variable Scope**:
- Process-level variables
- Accessible throughout process
- Available to all tasks

#### Remove Variables

```java
void removeVariables(RemoveProcessVariablesPayload payload);
```

**Purpose**: Remove specific process variables.

**Example**:
```java
processRuntime.removeVariables(
    ProcessPayloadBuilder.removeVariables()
        .withProcessInstanceId(instanceId)
        .withVariableNames("tempVar", "oldData")
        .build()
);
```

### 6. Metadata Operations

#### Process Definition Meta

```java
ProcessDefinitionMeta processDefinitionMeta(String processDefinitionKey);
```

**Purpose**: Retrieve process definition metadata.

**Returns**:
- Active activities
- Variable definitions
- Form information

**Example**:
```java
ProcessDefinitionMeta meta = 
    processRuntime.processDefinitionMeta("orderProcess");
```

#### Process Instance Meta

```java
ProcessInstanceMeta processInstanceMeta(String processInstanceId);
```

**Purpose**: Retrieve process instance metadata.

**Returns**:
- Current activities
- Execution path
- Instance information

**Example**:
```java
ProcessInstanceMeta meta = 
    processRuntime.processInstanceMeta(instanceId);

List<String> activeActivities = meta.getActiveActivitiesIds();
```

---

## Event Listener System

### ProcessRuntimeEventListener

**File**: `ProcessRuntimeEventListener.java`

```java
public interface ProcessRuntimeEventListener<E extends RuntimeEvent<?, ?>> {
    void onEvent(E event);
}
```

**Purpose**: Base interface for process event listeners.

### ProcessEventListener

**File**: `ProcessEventListener.java`

```java
public interface ProcessEventListener<E extends RuntimeEvent<? extends ProcessInstance, ?>> 
    extends ProcessRuntimeEventListener<E> {
}
```

**Purpose**: Specialized listener for process instance events.

**Implementation Example**:
```java
@Component
public class ProcessCompletionListener 
    implements ProcessEventListener<ProcessCompletedEvent> {
    
    @Override
    public void onEvent(ProcessCompletedEvent event) {
        ProcessInstance process = event.getEntity();
        
        // Business logic
        sendCompletionNotification(process);
        updateAnalytics(process);
        archiveProcessData(process);
    }
}
```

### BPMNElementEventListener

**File**: `BPMNElementEventListener.java`

```java
public interface BPMNElementEventListener<E extends RuntimeEvent<? extends BPMNElement, ?>> 
    extends ProcessRuntimeEventListener<E> {
}
```

**Purpose**: Listener for BPMN element events (activities, timers, etc.).

**Implementation Example**:
```java
@Component
public class ActivityListener 
    implements BPMNElementEventListener<BPMNActivityCompletedEvent> {
    
    @Override
    public void onEvent(BPMNActivityCompletedEvent event) {
        BPMNActivity activity = event.getEntity();
        
        logActivityCompletion(
            activity.getActivityName(),
            activity.getActivityType(),
            event.getProcessInstanceId()
        );
    }
}
```

---

## Connector System

### Connector Interface

**File**: `Connector.java`

```java
public interface Connector extends Function<IntegrationContext, IntegrationContext> {
}
```

**Purpose**: Interface for external system integrations.

**Implementation Example**:
```java
@Component
@ConnectorAlias("emailConnector")
public class EmailConnector implements Connector {
    
    @Autowired
    private EmailService emailService;
    
    @Override
    public IntegrationContext apply(IntegrationContext context) {
        // Get input variables
        String recipient = context.getInBoundVariable("recipient");
        String subject = context.getInBoundVariable("subject");
        String body = context.getInBoundVariable("body");
        
        // Execute business logic
        EmailResult result = emailService.sendEmail(recipient, subject, body);
        
        // Set output variables
        context.addOutBoundVariable("sent", result.isSent());
        context.addOutBoundVariable("messageId", result.getMessageId());
        
        return context;
    }
}
```

**Connector Lifecycle**:
```
1. Process reaches service task
2. Connector invoked with IntegrationContext
3. Connector executes external operation
4. Results returned as out-bound variables
5. Process continues
```

---

## Configuration

### ProcessRuntimeConfiguration

**File**: `ProcessRuntimeConfiguration.java`

```java
public interface ProcessRuntimeConfiguration {
    List<ProcessRuntimeEventListener<?>> processEventListeners();
    List<VariableEventListener<?>> variableEventListeners();
}
```

**Purpose**: Configure process runtime behavior.

**Spring Configuration Example**:
```java
@Configuration
public class ActivitiConfig implements ProcessRuntimeConfiguration {
    
    @Autowired
    private List<ProcessRuntimeEventListener<?>> processListeners;
    
    @Autowired
    private List<VariableEventListener<?>> variableListeners;
    
    @Override
    public List<ProcessRuntimeEventListener<?>> processEventListeners() {
        return processListeners;
    }
    
    @Override
    public List<VariableEventListener<?>> variableEventListeners() {
        return variableListeners;
    }
}
```

---

## Performance Considerations

### 1. Batch Operations

For multiple process instances:
```java
// Good - batch query
Page<ProcessInstance> instances = 
    processRuntime.processInstances(Pageable.of(0, 100), payload);

// Bad - individual queries
for (String id : ids) {
    processRuntime.processInstance(id); // N queries
}
```

### 2. Variable Access

Minimize variable queries:
```java
// Good - get all needed variables at once
List<VariableInstance> variables = 
    processRuntime.variables(getVariablesPayload);

// Bad - multiple individual queries
var1 = getVariable("name1");
var2 = getVariable("name2");
var3 = getVariable("name3");
```

### 3. Event Processing

Process events asynchronously:
```java
@EventListener
@Async
public void onProcessCompleted(ProcessCompletedEvent event) {
    // Non-blocking processing
}
```

---

## Security Model

### Authorization Checks

ProcessRuntime enforces:
- User authentication
- Process visibility
- Task assignment
- Role-based access

**Visibility Rules**:
```java
User can see process if:
- User is the initiator OR
- User has active tasks in the process OR
- User has admin role OR
- Process is explicitly shared with user
```

### Admin vs User Runtime

```java
// User runtime - with authorization
@Autowired
private ProcessRuntime processRuntime;

// Admin runtime - elevated privileges
@Autowired
private ProcessAdminRuntime processAdminRuntime;
```

---

## Error Handling

### Common Exceptions

1. **NotFoundException**
   - Process definition not found
   - Process instance not found
   - Variable not found

2. **UnprocessableEntityException**
   - Invalid payload
   - Missing required fields
   - Business rule violation

3. **SecurityException**
   - Unauthorized access
   - Insufficient permissions
   - Invalid authentication

### Error Handling Pattern

```java
try {
    processRuntime.start(payload);
} catch (NotFoundException e) {
    log.error("Process definition not found: {}", e.getMessage());
    throw new BusinessException("PROCESS_NOT_FOUND");
} catch (UnprocessableEntityException e) {
    log.error("Invalid payload: {}", e.getMessage());
    throw new ValidationException(e.getMessage());
} catch (SecurityException e) {
    log.error("Authorization failed: {}", e.getMessage());
    throw new AccessDeniedException();
}
```

---

## Testing Guidelines

### Unit Testing

```java
@ExtendWith(MockitoExtension.class)
class ProcessServiceTest {
    
    @Mock
    private ProcessRuntime processRuntime;
    
    @Test
    void shouldStartProcess() {
        ProcessInstance mockInstance = Mockito.mock(ProcessInstance.class);
        when(mockInstance.getId()).thenReturn("instance-123");
        when(processRuntime.start(any())).thenReturn(mockInstance);
        
        ProcessInstance result = processRuntime.start(payload);
        
        assertEquals("instance-123", result.getId());
        verify(processRuntime).start(any(StartProcessPayload.class));
    }
}
```

### Integration Testing

```java
@SpringBootTest
class ProcessRuntimeIntegrationTest {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Test
    void shouldExecuteFullProcess() {
        // Start process
        ProcessInstance instance = processRuntime.start(payload);
        
        // Verify instance created
        assertNotNull(instance.getId());
        assertEquals(ProcessInstanceStatus.RUNNING, instance.getStatus());
        
        // Complete process
        // ...
        
        // Verify completion
        ProcessInstance completed = processRuntime.processInstance(instance.getId());
        assertEquals(ProcessInstanceStatus.COMPLETED, completed.getStatus());
    }
}
```

---

## Best Practices

### 1. Use Meaningful Business Keys

```java
// Good
.withBusinessKey("ORDER-2024-001")

// Bad
.withBusinessKey("123")
```

### 2. Validate Payloads

```java
public void startProcess(StartProcessRequest request) {
    validateRequest(request);
    
    processRuntime.start(buildPayload(request));
}
```

### 3. Handle Events Idempotently

```java
@EventListener
public void onProcessCompleted(ProcessCompletedEvent event) {
    if (alreadyProcessed(event.getId())) {
        return;
    }
    
    processEvent(event);
    markAsProcessed(event.getId());
}
```

### 4. Use Appropriate Page Sizes

```java
// UI display
Pageable.of(0, 20)

// Batch processing
Pageable.of(0, 100)

// Reporting
Pageable.of(0, 1000)
```

---

## Version Information

- **Module Version**: 8.7.2-SNAPSHOT
- **Java Version**: 11+
- **Dependencies**: 
  - activiti-api-model-shared
  - activiti-api-runtime-shared
  - activiti-api-process-model

---

## Related Documentation

- [Process Model Module](../activiti-api/process-model.md)
- [Runtime Shared Module](../activiti-api/runtime-shared.md)
- [Main Module Docs](../README.md)

---

**Last Updated**: 2024  
**Maintained by**: Activiti Community
