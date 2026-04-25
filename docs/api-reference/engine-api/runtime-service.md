---
sidebar_label: Runtime Service
title: "Runtime Service"
slug: /api-reference/engine-api/runtime-service
description: Complete guide to the Runtime Service for executing and managing process instances.
---

# Runtime Service - Process Instance Execution

**Module:** `activiti-core/activiti-engine`

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

// Using ProcessInstanceBuilder
ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
    .processDefinitionKey("orderProcess")
    .variable("orderId", "12345")
    .variable("customerName", "John Doe")
    .variable("orderAmount", 999.99)
    .start();
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

// Start with business key by process definition ID
ProcessInstance instance = runtimeService.startProcessInstanceById(
    processDef.getId(),
    "ORDER-12345",
    variables
);
```

**Use cases for advanced options:**
- **Business key + variables**: Best practice for traceability and data initialization
- **Specific version**: When you need to run a known-good version of a process
- **Business key + ID + variables**: Combines version pinning with correlation

### Using ProcessInstanceBuilder

```java
// Full builder example with all options
ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
    .processDefinitionKey("orderProcess")
    .businessKey("ORDER-12345")
    .name("My Order Process")
    .tenantId("tenant1")
    .variables(Map.of("orderId", "12345", "customerName", "John Doe"))
    .variable("orderAmount", 999.99)
    .start();

// Create without starting (for pre-authorization scenarios)
ProcessInstance createdInstance = runtimeService.createProcessInstanceBuilder()
    .processDefinitionKey("orderProcess")
    .businessKey("ORDER-12345")
    .create();

// Then start later
ProcessInstance instance = runtimeService.startCreatedProcessInstance(
    createdInstance,
    Map.of("orderId", "12345")
);
```

**When to use ProcessInstanceBuilder:**
- You need to set many options (business key, name, tenant, variables)
- You want fluent, chainable API
- You need to create a process instance before starting it
- Starting by message name: use `messageName()` instead of `processDefinitionKey()`

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
// Set process-level variable (executionId or processInstanceId)
runtimeService.setVariable(processInstanceId, "orderId", "12345");

// Set execution-level variable
runtimeService.setVariable(executionId, "stepNumber", 1);

// Set variable with type
runtimeService.setVariable(processInstanceId, "orderAmount", BigDecimal.valueOf(999.99));

// Set multiple variables at once
runtimeService.setVariables(executionId, variablesMap);

// Set local variable (scoped to this execution only, not propagated to parent)
runtimeService.setVariableLocal(executionId, "tempData", data);
```

**When to use each approach:**
- **Process-level variables**: Data needed throughout the entire process lifecycle
- **Execution-level variables**: Data specific to a particular path or subprocess
- **Typed variables**: When you need type safety (BigDecimal for money, Date for timestamps)
- **Multiple variables**: Batch updates for better performance
- **Local variables**: Data that should not propagate to parent execution scope

### Getting Variables

```java
// Get single variable
String orderId = (String) runtimeService.getVariable(executionId, "orderId");

// Get typed variable
Order order = runtimeService.getVariable(executionId, "order", Order.class);

// Get all variables
Map<String, Object> allVars = runtimeService.getVariables(executionId);

// Get local variables (this execution scope only)
Map<String, Object> execVars = runtimeService.getVariablesLocal(executionId);

// Get specific variables by name
Map<String, Object> someVars = runtimeService.getVariables(
    executionId,
    Arrays.asList("orderId", "customerName")
);
```

**Use cases:**
- **Single variable**: Quick access to specific data (e.g., display in UI)
- **Typed access**: Type-safe retrieval using `getVariable(executionId, name, Class)`
- **All variables**: Debugging, auditing, or bulk operations
- **Local variables**: Inspecting data in specific execution scope without parent data
- **Complex objects**: Working with POJOs, custom types

### Variable Scopes

```java
// Process scope (available to all child executions)
runtimeService.setVariable(processInstanceId, "processVar", "value");

// Execution scope (available to this execution and its children)
runtimeService.setVariable(executionId, "executionVar", "value");

// Local scope (available ONLY to this execution, not parent or children)
runtimeService.setVariableLocal(executionId, "localVar", "value");
```

**Understanding scope hierarchy:**
- **Process scope**: Root level - visible to all tasks and subprocesses
- **Execution scope**: Subprocess or multi-instance level - child executions can see parent variables
- **Local scope**: Set with `setVariableLocal` - isolated to that specific execution only

**Why scope matters:**
- Prevents data leakage between parallel paths
- Enables data isolation in subprocesses
- Optimizes memory usage (local variables don't propagate)
- Supports multi-instance patterns with per-instance data

**Important:** RuntimeService variables operate on **executions**, not tasks. To set task-scoped variables, use `TaskService.setVariable(taskId, variableName, value)`.

```java
// Task-scoped variables use TaskService, not RuntimeService
taskService.setVariable(taskId, "taskVar", "value");
taskService.setVariableLocal(taskId, "localTaskVar", "value");
```

### Variable Removal

```java
// Remove variable from execution
runtimeService.removeVariable(executionId, "orderId");

// Remove local variable from execution
runtimeService.removeVariableLocal(executionId, "tempVar");

// Remove multiple variables by name
runtimeService.removeVariables(executionId, Arrays.asList("var1", "var2"));

// Remove local variables by name
runtimeService.removeVariablesLocal(executionId, Arrays.asList("var1", "var2"));
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

// Get active activity IDs for an execution
List<String> activityIds = runtimeService.getActiveActivityIds(executionId);

// Trigger an execution (manual transition)
runtimeService.trigger(executionId);

// Trigger with variables
runtimeService.trigger(executionId, Map.of("result", "approved"));
```

**When to manage at execution level:**
- **Execution variables**: Data specific to a subprocess or parallel branch
- **Counting**: Monitor load, detect stuck processes, capacity planning
- **Targeted updates**: Modify state in specific process paths without affecting others
- **Triggering**: Manually advance an execution stuck at an intermediate catch event

---

## Signal & Message Events

### Why Use Events?

Events are the **communication mechanism** between your process and the outside world:
- **Messages**: Business events with correlation (order shipped, payment received)
- **Signals**: Global broadcasts without correlation (system-wide notifications)
- **Timers**: Time-based triggers (reminders, escalations, expirations)

### Sending Signals

```java
// Send global signal (notifies ALL executions waiting for this signal)
runtimeService.signalEventReceived("ORDER_APPROVED");

// Send global signal with variables (broadcasts to all waiting signal events)
runtimeService.signalEventReceived("ORDER_APPROVED",
    Map.of("approvedBy", "manager", "approvalDate", Instant.now())
);

// Send signal to a specific execution
runtimeService.signalEventReceived("ORDER_APPROVED", executionId);

// Send signal to specific execution with variables
runtimeService.signalEventReceived("ORDER_APPROVED", executionId,
    Map.of("approvedBy", "manager")
);

// Send global signal asynchronously
runtimeService.signalEventReceivedAsync("SYSTEM_MAINTENANCE");

// Send signal to specific execution asynchronously
runtimeService.signalEventReceivedAsync("ORDER_APPROVED", executionId);
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

**Important:** The 2-argument form `signalEventReceived(signalName, executionId)` takes an **executionId**, not a processInstanceId. While a process instance ID is also a valid execution ID (the root execution), the parameter represents any execution in the system.

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
List<Job> timerJobs = managementService.createTimerJobQuery()
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

// Get business key from the ProcessInstance object
String businessKey = instance.getBusinessKey();

// Update business key
runtimeService.updateBusinessKey(processInstanceId, "NEW-KEY");
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

### Process Instance Name

```java
// Set a human-readable name for a process instance
runtimeService.setProcessInstanceName(processInstanceId, "Order #12345 - John Doe");
```

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
ProcessInstanceBuilder createProcessInstanceBuilder();
ProcessInstance startProcessInstanceByKey(String processDefinitionKey);
ProcessInstance startProcessInstanceByKey(String processDefinitionKey, String businessKey);
ProcessInstance startProcessInstanceByKey(String processDefinitionKey, Map<String, Object> variables);
ProcessInstance startProcessInstanceByKey(String processDefinitionKey, String businessKey, Map<String, Object> variables);
ProcessInstance startProcessInstanceByKeyAndTenantId(String processDefinitionKey, String tenantId);
ProcessInstance startProcessInstanceByKeyAndTenantId(String processDefinitionKey, String businessKey, String tenantId);
ProcessInstance startProcessInstanceByKeyAndTenantId(String processDefinitionKey, Map<String, Object> variables, String tenantId);
ProcessInstance startProcessInstanceByKeyAndTenantId(String processDefinitionKey, String businessKey, Map<String, Object> variables, String tenantId);
ProcessInstance startProcessInstanceById(String processDefinitionId);
ProcessInstance startProcessInstanceById(String processDefinitionId, String businessKey);
ProcessInstance startProcessInstanceById(String processDefinitionId, Map<String, Object> variables);
ProcessInstance startProcessInstanceById(String processDefinitionId, String businessKey, Map<String, Object> variables);
ProcessInstance startCreatedProcessInstance(ProcessInstance createdProcessInstance, Map<String, Object> variables);
void deleteProcessInstance(String processInstanceId, String deleteReason);
void setProcessInstanceName(String processInstanceId, String name);

// Business Key
void updateBusinessKey(String processInstanceId, String businessKey);

// Variable Management
Object getVariable(String executionId, String variableName);
<T> T getVariable(String executionId, String variableName, Class<T> variableClass);
Object getVariableLocal(String executionId, String variableName);
<T> T getVariableLocal(String executionId, String variableName, Class<T> variableClass);
Map<String, Object> getVariables(String executionId);
Map<String, Object> getVariables(String executionId, Collection<String> variableNames);
Map<String, Object> getVariablesLocal(String executionId);
Map<String, Object> getVariablesLocal(String executionId, Collection<String> variableNames);
VariableInstance getVariableInstance(String executionId, String variableName);
VariableInstance getVariableInstanceLocal(String executionId, String variableName);
Map<String, VariableInstance> getVariableInstances(String executionId);
Map<String, VariableInstance> getVariableInstances(String executionId, Collection<String> variableNames);
Map<String, VariableInstance> getVariableInstancesLocal(String executionId);
Map<String, VariableInstance> getVariableInstancesLocal(String executionId, Collection<String> variableNames);
List<VariableInstance> getVariableInstancesByExecutionIds(Set<String> executionIds);
boolean hasVariable(String executionId, String variableName);
boolean hasVariableLocal(String executionId, String variableName);
void setVariable(String executionId, String variableName, Object value);
void setVariableLocal(String executionId, String variableName, Object value);
void setVariables(String executionId, Map<String, ? extends Object> variables);
void setVariablesLocal(String executionId, Map<String, ? extends Object> variables);
void removeVariable(String executionId, String variableName);
void removeVariableLocal(String executionId, String variableName);
void removeVariables(String executionId, Collection<String> variableNames);
void removeVariablesLocal(String executionId, Collection<String> variableNames);

// Data Objects
Map<String, DataObject> getDataObjects(String executionId);
Map<String, DataObject> getDataObjects(String executionId, String locale, boolean withLocalizationFallback);
Map<String, DataObject> getDataObjectsLocal(String executionId);
Map<String, DataObject> getDataObjectsLocal(String executionId, String locale, boolean withLocalizationFallback);
Map<String, DataObject> getDataObjects(String executionId, Collection<String> dataObjectNames);
Map<String, DataObject> getDataObjectsLocal(String executionId, Collection<String> dataObjectNames);
DataObject getDataObject(String executionId, String dataObjectName);
DataObject getDataObjectLocal(String executionId, String dataObjectName);

// Signals
void signalEventReceived(String signalName);
void signalEventReceived(String signalName, Map<String, Object> processVariables);
void signalEventReceived(String signalName, String executionId);
void signalEventReceived(String signalName, String executionId, Map<String, Object> processVariables);
void signalEventReceivedWithTenantId(String signalName, String tenantId);
void signalEventReceivedWithTenantId(String signalName, Map<String, Object> processVariables, String tenantId);
void signalEventReceivedAsync(String signalName);
void signalEventReceivedAsync(String signalName, String executionId);
void signalEventReceivedAsyncWithTenantId(String signalName, String tenantId);

// Messages
ProcessInstance startProcessInstanceByMessage(String messageName);
ProcessInstance startProcessInstanceByMessage(String messageName, String businessKey);
ProcessInstance startProcessInstanceByMessage(String messageName, Map<String, Object> processVariables);
ProcessInstance startProcessInstanceByMessage(String messageName, String businessKey, Map<String, Object> processVariables);
ProcessInstance startProcessInstanceByMessageAndTenantId(String messageName, String tenantId);
ProcessInstance startProcessInstanceByMessageAndTenantId(String messageName, String businessKey, String tenantId);
ProcessInstance startProcessInstanceByMessageAndTenantId(String messageName, Map<String, Object> processVariables, String tenantId);
ProcessInstance startProcessInstanceByMessageAndTenantId(String messageName, String businessKey, Map<String, Object> processVariables, String tenantId);
void messageEventReceived(String messageName, String executionId);
void messageEventReceived(String messageName, String executionId, Map<String, Object> processVariables);
void messageEventReceivedAsync(String messageName, String executionId);

// Execution Management
List<String> getActiveActivityIds(String executionId);
void trigger(String executionId);
void trigger(String executionId, Map<String, Object> processVariables);
void trigger(String executionId, Map<String, Object> processVariables, Map<String, Object> transientVariables);
void suspendProcessInstanceById(String processInstanceId);
void activateProcessInstanceById(String processInstanceId);

// Identity Links
void addUserIdentityLink(String processInstanceId, String userId, String identityLinkType);
void addUserIdentityLink(String processInstanceId, String userId, String identityLinkType, byte[] details);
void addGroupIdentityLink(String processInstanceId, String groupId, String identityLinkType);
void addParticipantUser(String processInstanceId, String userId);
void addParticipantGroup(String processInstanceId, String groupId);
void deleteParticipantUser(String processInstanceId, String userId);
void deleteParticipantGroup(String processInstanceId, String groupId);
void deleteUserIdentityLink(String processInstanceId, String userId, String identityLinkType);
void deleteGroupIdentityLink(String processInstanceId, String groupId, String identityLinkType);
List<IdentityLink> getIdentityLinksForProcessInstance(String instanceId);

// Ad-hoc Subprocess
List<FlowNode> getEnabledActivitiesFromAdhocSubProcess(String executionId);
Execution executeActivityInAdhocSubProcess(String executionId, String activityId);
void completeAdhocSubProcess(String executionId);

// Event Listeners
void addEventListener(ActivitiEventListener listenerToAdd);
void addEventListener(ActivitiEventListener listenerToAdd, ActivitiEventType... types);
void removeEventListener(ActivitiEventListener listenerToRemove);
void dispatchEvent(ActivitiEvent event);
List<Event> getProcessInstanceEvents(String processInstanceId);

// Queries
ProcessInstanceQuery createProcessInstanceQuery();
ExecutionQuery createExecutionQuery();
NativeProcessInstanceQuery createNativeProcessInstanceQuery();
NativeExecutionQuery createNativeExecutionQuery();
```

**Method selection guide:**
- **createProcessInstanceBuilder()**: Fluent API for starting processes with multiple options
- **startProcessInstanceByKey()**: Most common - start by process definition key
- **startProcessInstanceByMessage()**: Event-driven - start by business event
- **setVariable/getVariable**: Read/write process data on an execution
- **updateBusinessKey**: Update the business key for a process instance
- **messageEventReceived()**: Correlate events to a running execution
- **signalEventReceived()**: Broadcast events to all waiting signal events, or target a specific execution
- **createProcessInstanceQuery()**: Find running instances
- **createExecutionQuery()**: Inspect process tokens and state
- **trigger()**: Manually advance an execution past an intermediate catch event

### ProcessInstanceQuery

```java
ProcessInstanceQuery createProcessInstanceQuery();

// Filtering
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
.orderByProcessInstanceId()
.orderByProcessDefinitionKey()
.orderByProcessDefinitionName()
.orderByProcessDefinitionVersion()
.orderByStartTime()
.asc()
.desc()

// Pagination
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

### ProcessInstanceBuilder Usage

```java
@Service
public class AdvancedProcessStarter {

    @Autowired
    private RuntimeService runtimeService;

    public ProcessInstance startComplexProcess(ComplexRequest request) {
        return runtimeService.createProcessInstanceBuilder()
            .processDefinitionKey("complexProcess")
            .businessKey(request.getExternalId())
            .name("Process for " + request.getDescription())
            .tenantId(request.getTenantId())
            .variable("requestId", request.getId())
            .variable("requestData", request.getPayload())
            .variable("initiatedBy", request.getUser())
            .variables(request.getAdditionalVariables())
            .start();
    }

    public void sendTargetedSignal(String signalName, String executionId, Map<String, Object> vars) {
        runtimeService.signalEventReceived(signalName, executionId, vars);
    }

    public void broadcastSignal(String signalName) {
        runtimeService.signalEventReceived(signalName);
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
runtimeService.startProcessInstanceByKey("orderProcess", "ORDER-12345", vars);

// BAD - Setting variables one by one after start
ProcessInstance instance = runtimeService.startProcessInstanceByKey("orderProcess");
runtimeService.setVariable(instance.getId(), "var1", value1);
runtimeService.setVariable(instance.getId(), "var2", value2);
```

### 3. Use ProcessInstanceBuilder for Complex Starts

```java
// GOOD - Fluent API for complex process starts
ProcessInstance instance = runtimeService.createProcessInstanceBuilder()
    .processDefinitionKey("orderProcess")
    .businessKey("ORDER-12345")
    .name("Order from John Doe")
    .tenantId("tenant1")
    .variables(Map.of("orderId", "12345", "amount", 999.99))
    .start();
```

### 4. Use Message Events for Business Correlation

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

// BAD - Using signals for business-specific events
runtimeService.signalEventReceived("orderShipped", executionId);
```

### 5. Handle Variable Types Correctly

```java
// GOOD - Proper typing
runtimeService.setVariable(executionId, "amount", BigDecimal.valueOf(999.99));
runtimeService.setVariable(executionId, "timestamp", Instant.now());

// BAD - String for numbers
runtimeService.setVariable(executionId, "amount", "999.99");
```

### 6. Use TaskService for Task Variables

```java
// GOOD - Task-scoped variables through TaskService
taskService.setVariable(taskId, "taskOutcome", "approved");

// BAD - Attempting task-scoped variables through RuntimeService
// RuntimeService operates on executions, not tasks
```

### 7. Update Business Keys Correctly

```java
// GOOD - Use updateBusinessKey
runtimeService.updateBusinessKey(processInstanceId, "NEW-BUSINESS-KEY");

// GOOD - Read business key from ProcessInstance
ProcessInstance instance = runtimeService.createProcessInstanceQuery()
    .processInstanceId(processInstanceId)
    .singleResult();
String businessKey = instance.getBusinessKey();
```

---

## Related Documentation

- [Parent Documentation](./README.md)
- [Repository Service](./repository-service.md)
- [Task Service](./task-service.md)
- [History Service](./history-service.md)
- [Best Practices](../../best-practices/overview.md)
