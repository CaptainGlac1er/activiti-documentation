---
sidebar_label: Runtime Service
slug: /core-services/runtime-service
description: Complete guide to the Runtime Service for executing and managing process instances.
---

# Runtime Service - Process Instance Execution

**Module:** `activiti-core/activiti-engine`

**Target Audience:** Senior Software Engineers, Workflow Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Starting Process Instances](#starting-process-instances)
- [Process Variables](#process-variables)
- [Execution Management](#execution-management)
- [Signal & Message Events](#signal--message-events)
- [Timer Events](#timer-events)
- [Correlation](#correlation)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The **RuntimeService** is the core engine for executing process instances. It manages the lifecycle of running processes, from initiation through completion, including variable management, event handling, and execution control.

### Why Use RuntimeService?

**RuntimeService** is your primary interface for:
- **Starting workflows**: Initiating business processes when events occur (order placed, application submitted, etc.)
- **Managing execution state**: Tracking where processes are in their lifecycle
- **Interacting with running processes**: Sending messages, signals, and updating variables
- **Querying process status**: Finding active instances and their current state

### Key Responsibilities

- Start and manage process instances
- Handle process variables (local and global)
- Correlate messages and signals
- Manage executions and tokens
- Control process flow
- Handle business keys

### Core Concepts

```
Process Instance
    ├── Executions (tokens)
    ├── Variables
    ├── Business Key
    └── Current Activities
```

### When to Use RuntimeService vs Other Services

- **RuntimeService**: For executing and managing running processes
- **RepositoryService**: For managing process definitions (deploy, query, delete)
- **TaskService**: For managing user tasks (assign, complete, claim)
- **HistoryService**: For querying historical data and audit trails
- **ManagementService**: For engine administration and job management

---

## Starting Process Instances

### Why Start Process Instances?

Starting a process instance is the **entry point** for any workflow. You use this when:
- A business event occurs (order placed, invoice received, application submitted)
- A user initiates a process through a UI
- An external system triggers a workflow
- A scheduled job needs to start a process

### Basic Process Start

```java
// Start by process definition key
ProcessInstance instance = runtimeService.startProcessInstanceByKey("orderProcess");

// Start with business key
ProcessInstance instance = runtimeService.startProcessInstanceByKey(
    "orderProcess", 
    "ORDER-12345"
);

// Start by process definition ID
ProcessInstance instance = runtimeService.startProcessInstanceById(
    "processDef:1:abc123"
);
```

**When to use each approach:**
- **By key**: Most common - use when you know the process definition key (e.g., "orderProcess")
- **By key with business key**: Use when you need to correlate the instance with external business data (e.g., order ID, invoice number)
- **By ID**: Use when you need to start a specific version of a process definition

### Starting with Variables

```java
// Using Map
Map<String, Object> variables = new HashMap<>();
variables.put("orderId", "12345");
variables.put("customerName", "John Doe");
variables.put("orderAmount", 999.99);

ProcessInstance instance = runtimeService.startProcessInstanceByKey(
    "orderProcess", 
    variables
);

// Using withVariables() builder
ProcessInstance instance = runtimeService.createStartProcessInstanceByKey("orderProcess")
    .variable("orderId", "12345")
    .variable("customerName", "John Doe")
    .variable("orderAmount", 999.99)
    .execute();
```

**Why pass variables at start?**
- Variables set at startup are available immediately to the first activities
- Reduces the number of API calls (set once vs. multiple setVariable calls)
- Ensures data consistency from the beginning
- Required variables for gateway conditions are evaluated correctly

### Advanced Start Options

```java
// Start with business key and variables
ProcessInstance instance = runtimeService.startProcessInstanceByKey(
    "orderProcess",
    "ORDER-12345",
    variables
);

// Start specific process definition version
ProcessDefinition processDef = repositoryService.createProcessDefinitionQuery()
    .processDefinitionKey("orderProcess")
    .processDefinitionVersion(2)
    .singleResult();

ProcessInstance instance = runtimeService.startProcessInstanceById(
    processDef.getId(),
    variables
);

// Start with custom activity ID
ProcessInstance instance = runtimeService.startProcessInstanceById(
    processDef.getId(),
    "startEventId",  // Start at specific activity
    variables
);
```

**Use cases for advanced options:**
- **Business key + variables**: Best practice for traceability and data initialization
- **Specific version**: When you need to run a known-good version of a process
- **Custom start activity**: For processes with multiple start events (e.g., different entry points)

### Multi-Instance Process Start

```java
// Start process with multi-instance configuration
Map<String, Object> variables = new HashMap<>();
variables.put("employees", Arrays.asList("emp1", "emp2", "emp3"));
variables.put("approvalThreshold", 2);

ProcessInstance instance = runtimeService.startProcessInstanceByKey(
    "approvalProcess",
    variables
);
```

**When to use multi-instance:**
- Approval workflows requiring multiple approvers
- Parallel processing of collections (e.g., process all order items)
- Voting or consensus-based decisions
- Batch operations on multiple entities

---

## Process Variables

### Why Manage Process Variables?

Process variables are the **data backbone** of your workflows. They:
- Store business data that flows through the process
- Drive decision logic in gateways and conditions
- Provide context for service tasks and user tasks
- Enable correlation and querying of process instances
- Persist state across process execution

### Setting Variables

```java
// Set process-level variable
runtimeService.setVariable(processInstanceId, "orderId", "12345");

// Set execution-level variable
runtimeService.setVariable(executionId, "stepNumber", 1);

// Set variable with type
runtimeService.setVariable(processInstanceId, "orderAmount", BigDecimal.valueOf(999.99));

// Set multiple variables
runtimeService.setVariables(processInstanceId, variablesMap);

// Set transient variable (not persisted)
runtimeService.setVariableLocal(executionId, "tempData", data);
```

**When to use each approach:**
- **Process-level variables**: Data needed throughout the entire process lifecycle
- **Execution-level variables**: Data specific to a particular path or subprocess
- **Typed variables**: When you need type safety (BigDecimal for money, Date for timestamps)
- **Multiple variables**: Batch updates for better performance
- **Local/transient variables**: Temporary data that shouldn't persist or propagate

### Getting Variables

```java
// Get single variable
String orderId = (String) runtimeService.getVariable(processInstanceId, "orderId");

// Get variable with default
String name = (String) runtimeService.getVariable(processInstanceId, "name", "Unknown");

// Get all variables
Map<String, Object> allVars = runtimeService.getVariables(processInstanceId);

// Get execution-level variables
Map<String, Object> execVars = runtimeService.getVariablesLocal(executionId);

// Get variable by type
Order order = (Order) runtimeService.getVariable(processInstanceId, "order");
```

**Use cases:**
- **Single variable**: Quick access to specific data (e.g., display in UI)
- **With default**: Safe access when variable might not exist
- **All variables**: Debugging, auditing, or bulk operations
- **Execution-level**: Inspecting data in specific process branches
- **Typed access**: Working with complex objects (POJOs, custom types)

### Variable Scopes

```java
// Process scope (available to all executions)
runtimeService.setVariable(processInstanceId, "processVar", "value");

// Execution scope (available to specific execution)
runtimeService.setVariable(executionId, "executionVar", "value");

// Task scope (available to specific task)
runtimeService.setVariable(taskId, "taskVar", "value");
```

**Understanding scope hierarchy:**
- **Process scope**: Root level - visible to all tasks and subprocesses
- **Execution scope**: Subprocess or multi-instance level - isolated to that execution
- **Task scope**: Single task level - most granular, for task-specific data

**Why scope matters:**
- Prevents data leakage between parallel paths
- Enables data isolation in subprocesses
- Optimizes memory usage (local variables don't propagate)
- Supports multi-instance patterns with per-instance data

### Variable Removal

```java
// Remove process variable
runtimeService.removeVariable(processInstanceId, "orderId");

// Remove execution variable
runtimeService.removeVariable(executionId, "tempVar");

// Remove all variables
runtimeService.removeVariables(processInstanceId, Arrays.asList("var1", "var2"));
```

**When to remove variables:**
- Clean up sensitive data (passwords, tokens) after use
- Free memory for long-running processes
- Reset state for process loops or iterations
- Compliance requirements (data retention policies)

---

## Execution Management

### Why Manage Executions?

Executions represent **tokens moving through your process**. Understanding and managing them is crucial for:
- Tracking process progress and current state
- Implementing complex control flows
- Debugging multi-instance and parallel processes
- Querying processes at specific activities
- Managing subprocess boundaries

### Querying Executions

```java
// Get current execution
Execution execution = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .singleResult();

// Get all executions for process instance
List<Execution> executions = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .list();

// Get active executions
List<Execution> activeExecutions = runtimeService.createExecutionQuery()
    .active()
    .list();

// Get executions at specific activity
List<Execution> atActivity = runtimeService.createExecutionQuery()
    .activityId("userTask1")
    .list();
```

**Use cases for execution queries:**
- **Single result**: Get the main process execution for variable access
- **All executions**: Understand the full token landscape (parallel paths, multi-instance)
- **Active executions**: Find processes waiting at user tasks or gateways
- **At specific activity**: Monitor bottlenecks, find all instances at a step

**Why query executions?**
- Processes can have multiple concurrent executions (parallel gateways, multi-instance)
- Each execution has its own variable scope
- Helps debug complex process flows
- Enables targeted message correlation

### Execution Information

```java
public class ExecutionInfo {
    
    @Autowired
    private RuntimeService runtimeService;
    
    public void displayExecutionInfo(String executionId) {
        Execution execution = runtimeService.createExecutionQuery()
            .executionId(executionId)
            .singleResult();
        
        System.out.println("Execution ID: " + execution.getId());
        System.out.println("Process Instance ID: " + execution.getProcessInstanceId());
        System.out.println("Process Definition ID: " + execution.getProcessDefinitionId());
        System.out.println("Activity ID: " + execution.getActivityId());
        System.out.println("Parent ID: " + execution.getParentId());
        System.out.println("Root ID: " + execution.getRootId());
        System.out.println("Tenant ID: " + execution.getTenantId());
    }
}
```

**Why inspect execution details?**
- **Activity ID**: Know where the process currently is
- **Parent/Root IDs**: Understand execution hierarchy (subprocesses, events)
- **Process Definition ID**: Track which version is running
- **Tenant ID**: Multi-tenancy support and isolation

### Managing Executions

```java
// Set execution variable
runtimeService.setVariable(executionId, "varName", "value");

// Get execution variables
Map<String, Object> vars = runtimeService.getVariables(executionId);

// Count executions
long count = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .count();
```

**When to manage at execution level:**
- **Execution variables**: Data specific to a subprocess or parallel branch
- **Counting**: Monitor load, detect stuck processes, capacity planning
- **Targeted updates**: Modify state in specific process paths without affecting others

---

## Signal & Message Events

### Why Use Events?

Events are the **communication mechanism** between your process and the outside world:
- **Messages**: Business events with correlation (order shipped, payment received)
- **Signals**: Global broadcasts without correlation (system-wide notifications)
- **Timers**: Time-based triggers (reminders, escalations, expirations)

### Sending Signals

```java
// Send global signal
runtimeService.signalEventReceived("ORDER_APPROVED");

// Send signal with data
runtimeService.signalEventReceived("ORDER_APPROVED", 
    Map.of("approvedBy", "manager", "approvalDate", Instant.now())
);

// Send signal to specific process instance
runtimeService.signalEventReceived("ORDER_APPROVED", processInstanceId);
```

**When to use signals:**
- **Global broadcasts**: Notify all waiting processes (e.g., "system maintenance starting")
- **Decoupled communication**: No need to know which processes are waiting
- **One-to-many scenarios**: Single event triggers multiple process instances
- **System events**: Infrastructure-level notifications

**Why signals vs messages?**
- Signals don't require correlation - they reach ALL waiting signal events
- Use for system-wide events, not business-specific correlations
- Less precise but simpler for broadcast scenarios

### Starting Process by Message

```java
// Start process instance by message
ProcessInstance instance = runtimeService.startProcessInstanceByMessage("startOrder");

// Start process instance by message with business key
ProcessInstance instance = runtimeService.startProcessInstanceByMessage(
    "startOrder", 
    "ORDER-12345"
);

// Start process instance by message with variables
Map<String, Object> variables = new HashMap<>();
variables.put("order", orderData);
ProcessInstance instance = runtimeService.startProcessInstanceByMessage(
    "startOrder", 
    variables
);

// Start process instance by message with business key and variables
ProcessInstance instance = runtimeService.startProcessInstanceByMessage(
    "startOrder",
    "ORDER-12345",
    variables
);
```

**When to start by message:**
- **Event-driven architectures**: External systems trigger processes
- **Message queues**: Consume from Kafka, RabbitMQ, etc.
- **API endpoints**: REST/webhook triggers for business events
- **Decoupled systems**: Producer doesn't need to know process details

**Why messages vs direct start?**
- Messages provide semantic meaning (what happened, not just "start")
- Enable multiple start events in one process (different entry points)
- Support message correlation for better traceability
- Align with event-driven design patterns

### Correlating Messages to Running Processes

```java
// Correlate message to specific execution
runtimeService.messageEventReceived("updateOrder", executionId);

// Correlate message with variables
Map<String, Object> messageVars = new HashMap<>();
messageVars.put("orderId", "12345");
messageVars.put("status", "SHIPPED");
runtimeService.messageEventReceived("updateOrder", executionId, messageVars);

// Correlate message asynchronously
runtimeService.messageEventReceivedAsync("cancelOrder", executionId);
```

**When to correlate messages:**
- **Intermediate events**: Process is already running, waiting for external input
- **State updates**: External system notifies of status changes
- **User actions**: UI triggers events in running processes
- **Integration points**: Third-party systems update process state

**Why message correlation?**
- Precise targeting of specific process instances
- Business semantics (what event occurred)
- Variables passed with message update process state
- Async option for non-blocking operations

### Finding Executions for Message Correlation

```java
// Find execution by process instance and activity
Execution execution = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .activityId("userTask1")
    .singleResult();

// Correlate message to found execution
runtimeService.messageEventReceived("messageName", execution.getId());

// Find execution by business key
ProcessInstance instance = runtimeService.createProcessInstanceQuery()
    .processInstanceBusinessKey("businessKey")
    .singleResult();

Execution execution = runtimeService.createExecutionQuery()
    .processInstanceId(instance.getId())
    .active()
    .singleResult();
```

**Why find executions first?**
- Messages need a target execution to correlate to
- Query by business key for external system integration
- Find specific activity for targeted message delivery
- Handle multi-instance scenarios (multiple waiting executions)

**Common patterns:**
1. External system sends event with business key
2. Query process instance by business key
3. Find active execution waiting for message
4. Correlate message to that execution

---

## Timer Events

### Why Use Timer Events?

Timer events enable **time-based process automation**:
- **Deadlines and SLAs**: Escalate tasks if not completed in time
- **Reminders**: Notify users before deadlines
- **Scheduled processes**: Run processes at specific times/intervals
- **Timeouts**: Handle inactivity or delays
- **Recurring jobs**: Daily/weekly/monthly process executions

### Starting Timer Processes

```java
// Process with start timer will auto-start when timer fires
// No manual intervention needed

// Check timer jobs
List<Job> timerJobs = managementService.createJobQuery()
    .jobType(JobTypes.TIMER_JOB_TYPE)
    .list();
```

**When processes start by timer:**
- **Scheduled reports**: Generate daily/weekly/monthly reports
- **Batch processing**: Run ETL jobs at specific times
- **Maintenance windows**: Execute during off-peak hours
- **Recurring workflows**: Periodic reviews, audits, checks

**Why timer start events?**
- No external trigger needed - engine handles scheduling
- Reliable execution even if application is restarted
- Built-in job management and retry logic
- Can query and monitor scheduled jobs

### Timer Configuration

```java
// In BPMN:
// <boundaryEvent timerEventDefinition="...">
//   <timeDuration>PT1H</timeDuration>
// </boundaryEvent>

// Or cyclic timer:
// <timeCycle>RRULE:FREQ=DAILY;INTERVAL=1</timeCycle>
```

**Timer types and when to use:**
- **Time Duration**: Relative timer (e.g., "1 hour from now") - use for timeouts, SLAs
- **Time Date**: Absolute timer (e.g., "2024-12-31 23:59:59") - use for specific deadlines
- **Time Cycle**: Repeating timer (iCal RRULE) - use for recurring jobs

**Common timer patterns:**
1. **Boundary timer on task**: Escalation if task not completed in X time
2. **Intermediate catch timer**: Wait for specific duration before continuing
3. **Start timer**: Auto-start process at scheduled time
4. **Cyclic timer**: Repeat process at regular intervals

**Why understand timer configuration?**
- Timers create jobs in the engine's job database
- Jobs need to be executed by the job executor
- Timer behavior affects process reliability and performance
- Different timer types serve different business needs

---

## Correlation

### Why Correlation Matters?

Correlation is the **bridge between business data and process instances**. It enables:
- Finding the right process instance for external events
- Connecting business entities (orders, customers) to workflows
- Implementing event-driven architectures
- Supporting multiple instances of the same process

### Business Key Correlation

```java
// Start with business key
ProcessInstance instance = runtimeService.startProcessInstanceByKey(
    "orderProcess",
    "ORDER-12345"
);

// Query by business key
ProcessInstance found = runtimeService.createProcessInstanceQuery()
    .processInstanceBusinessKey("ORDER-12345")
    .singleResult();

// Update business key
runtimeService.setBusinessKey(processInstanceId, "NEW-KEY");
```

**When to use business keys:**
- **External system integration**: Order management, CRM, ERP systems
- **User-facing IDs**: Human-readable identifiers (ORDER-123, APP-456)
- **Traceability**: Track processes across systems
- **Deduplication**: Prevent multiple instances for same business entity

**Why business keys are essential:**
- Provide semantic meaning to process instances
- Enable queries without knowing internal process IDs
- Support event correlation from external systems
- Facilitate monitoring and reporting

### Variable Correlation

```java
// Find execution by querying with variable conditions
List<Execution> executions = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .variableValueEquals("orderId", "12345")
    .list();

// Correlate message to matching execution
if (!executions.isEmpty()) {
    runtimeService.messageEventReceived("orderUpdate", executions.get(0).getId());
}
```

**When to use variable correlation:**
- **Complex matching**: Multiple criteria beyond business key
- **Dynamic routing**: Find processes based on variable values
- **Filtering**: Narrow down to specific instances
- **Multi-instance handling**: Target specific instances in parallel execution

**Why variable correlation:**
- More flexible than business keys
- Can match on any process data
- Supports complex business logic
- Enables pattern-based event handling

**Correlation strategies:**
1. **Business key**: Simple, external-facing correlation
2. **Variable value**: Internal, data-driven correlation
3. **Execution query**: Complex, multi-criteria correlation
4. **Message correlation**: Event-driven, semantic correlation

---

## API Reference

### Why This API Reference?

This section provides a **quick lookup** for RuntimeService methods. Use it to:
- Find the right method for your use case
- Understand method signatures and parameters
- Discover available functionality
- Reference when writing code

### RuntimeService Methods

```java
// Process Instance Management
// Use these to start and control process instances
ProcessInstance startProcessInstanceByKey(String key);
ProcessInstance startProcessInstanceByKey(String key, String businessKey);
ProcessInstance startProcessInstanceByKey(String key, Map<String, Object> variables);
ProcessInstance startProcessInstanceById(String processDefinitionId);
void deleteProcessInstance(String processInstanceId, String reason);

// Variable Management
// Use these to read and write process data
Object getVariable(String executionId, String variableName);
Object getVariableLocal(String executionId, String variableName);
Map<String, Object> getVariables(String executionId);
void setVariable(String executionId, String variableName, Object value);
void setVariableLocal(String executionId, String variableName, Object value);
void removeVariable(String executionId, String variableName);

// Business Key
// Use these to correlate processes with business entities
void setBusinessKey(String processInstanceId, String businessKey);
String getBusinessKey(String processInstanceId);

// Signals & Messages
// Use these for event-driven process interaction
void signalEventReceived(String signalName);
void signalEventReceived(String signalName, String processInstanceId);
ProcessInstance startProcessInstanceByMessage(String messageName);
ProcessInstance startProcessInstanceByMessage(String messageName, String businessKey);
ProcessInstance startProcessInstanceByMessage(String messageName, Map<String, Object> processVariables);
ProcessInstance startProcessInstanceByMessage(String messageName, String businessKey, Map<String, Object> processVariables);
void messageEventReceived(String messageName, String executionId);
void messageEventReceived(String messageName, String executionId, Map<String, Object> processVariables);
void messageEventReceivedAsync(String messageName, String executionId);

// Queries
// Use these to find and inspect running processes
ProcessInstanceQuery createProcessInstanceQuery();
ExecutionQuery createExecutionQuery();
```

**Method selection guide:**
- **startProcessInstanceByKey**: Most common - start by process definition key
- **startProcessInstanceByMessage**: Event-driven - start by business event
- **setVariable/getVariable**: Read/write process data
- **messageEventReceived**: Correlate events to running processes
- **signalEventReceived**: Broadcast events to all waiting processes
- **createProcessInstanceQuery**: Find running instances
- **createExecutionQuery**: Inspect process tokens and state

### ProcessInstanceQuery

```java
ProcessInstanceQuery createProcessInstanceQuery();

// Filtering
// Use these to narrow down search results
.processInstanceId(String id)
.processInstanceBusinessKey(String key)
.processInstanceBusinessKeyLike(String key)
.processDefinitionId(String id)
.processDefinitionKey(String key)
.superProcessInstanceId(String id)
.subProcessInstanceId(String id)
.tenantIdIn(List<String> tenantIds)
.active()
.suspended()

// Ordering
// Use these to sort results
.orderByProcessInstanceId()
.orderByProcessDefinitionKey()
.orderByProcessDefinitionName()
.orderByProcessDefinitionVersion()
.orderByStartTime()
.asc()
.desc()

// Pagination
// Use these for large result sets
.listPage(int firstResult, int maxResults)
```

**Query patterns:**
- **By business key**: Find instance for specific order/customer
- **By process definition**: Find all instances of a process type
- **Active/suspended**: Filter by execution state
- **With ordering**: Get most recent, alphabetically sorted, etc.
- **With pagination**: Handle large datasets efficiently

**Why use queries?**
- Monitor running processes
- Find instances for external events
- Generate reports and dashboards
- Debug process execution
- Implement business logic based on process state

---

## Usage Examples

### Complete Order Process

```java
@Service
public class OrderRuntimeService {
    
    @Autowired
    private RuntimeService runtimeService;
    
    public ProcessInstance createOrder(Order order) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("orderId", order.getId());
        variables.put("customerName", order.getCustomerName());
        variables.put("orderAmount", order.getTotalAmount());
        variables.put("items", order.getItems());
        
        ProcessInstance instance = runtimeService.startProcessInstanceByKey(
            "orderProcess",
            order.getId(),
            variables
        );
        
        log.info("Started order process: {} for order: {}", 
            instance.getId(), order.getId());
        
        return instance;
    }
    
    public void updateOrderStatus(String orderId, String status) {
        // Find the process instance by business key
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
            .processInstanceBusinessKey(orderId)
            .singleResult();
        
        // Find the active execution
        Execution execution = runtimeService.createExecutionQuery()
            .processInstanceId(instance.getId())
            .active()
            .singleResult();
        
        // Correlate message to update order
        Map<String, Object> messageVars = new HashMap<>();
        messageVars.put("newStatus", status);
        runtimeService.messageEventReceived("updateOrderStatus", execution.getId(), messageVars);
    }
    
    public void cancelOrder(String orderId, String reason) {
        // Get process instance
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
            .processInstanceBusinessKey(orderId)
            .singleResult();
        
        // Delete with reason
        runtimeService.deleteProcessInstance(instance.getId(), reason);
    }
}
```

### Approval Workflow

```java
@Service
public class ApprovalRuntimeService {
    
    @Autowired
    private RuntimeService runtimeService;
    
    public ProcessInstance submitForApproval(ApprovalRequest request) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", request.getId());
        variables.put("requester", request.getRequester());
        variables.put("amount", request.getAmount());
        variables.put("description", request.getDescription());
        
        return runtimeService.startProcessInstanceByKey(
            "approvalProcess",
            request.getId(),
            variables
        );
    }
    
    public void approveRequest(String requestId, String approver) {
        // Find the process instance by business key
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
            .processInstanceBusinessKey(requestId)
            .singleResult();
        
        // Find the active execution
        Execution execution = runtimeService.createExecutionQuery()
            .processInstanceId(instance.getId())
            .active()
            .singleResult();
        
        // Correlate message to approve request
        Map<String, Object> messageVars = new HashMap<>();
        messageVars.put("approver", approver);
        runtimeService.messageEventReceived("approveRequest", execution.getId(), messageVars);
    }
    
    public void rejectRequest(String requestId, String reason) {
        // Find the process instance by business key
        ProcessInstance instance = runtimeService.createProcessInstanceQuery()
            .processInstanceBusinessKey(requestId)
            .singleResult();
        
        // Find the active execution
        Execution execution = runtimeService.createExecutionQuery()
            .processInstanceId(instance.getId())
            .active()
            .singleResult();
        
        // Correlate message to reject request
        Map<String, Object> messageVars = new HashMap<>();
        messageVars.put("reason", reason);
        runtimeService.messageEventReceived("rejectRequest", execution.getId(), messageVars);
    }
}
```

---

## Best Practices

### 1. Use Business Keys

```java
// GOOD - Easy correlation
runtimeService.startProcessInstanceByKey("orderProcess", "ORDER-12345");

// BAD - Hard to track
runtimeService.startProcessInstanceByKey("orderProcess");
```

### 2. Set Variables at Start

```java
// GOOD - All variables available from start
Map<String, Object> vars = getAllOrderData();
runtimeService.startProcessInstanceByKey("orderProcess", vars);

// BAD - Setting variables one by one
ProcessInstance instance = runtimeService.startProcessInstanceByKey("orderProcess");
runtimeService.setVariable(instance.getId(), "var1", value1);
runtimeService.setVariable(instance.getId(), "var2", value2);
```

### 3. Use Message Events

```java
// GOOD - Start process with message
ProcessInstance instance = runtimeService.startProcessInstanceByMessage(
    "orderCreated",
    orderId,
    variables
);

// GOOD - Correlate to running process
Execution execution = runtimeService.createExecutionQuery()
    .processInstanceId(instance.getId())
    .active()
    .singleResult();
runtimeService.messageEventReceived("orderShipped", execution.getId());

// BAD - Using signals for business events
runtimeService.signalEventReceived("orderShipped", processInstanceId);
```

### 4. Handle Variable Types

```java
// GOOD - Proper typing
runtimeService.setVariable(processId, "amount", BigDecimal.valueOf(999.99));

// BAD - String for numbers
runtimeService.setVariable(processId, "amount", "999.99");
```

---

## See Also

- [Parent Documentation](./README.md)
- [Repository Service](./repository-service.md)
- [Task Service](./task-service.md)
- [History Service](./history-service.md)
- [Best Practices](../best-practices/overview.md)
