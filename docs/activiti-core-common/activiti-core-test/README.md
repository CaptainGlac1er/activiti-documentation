# Activiti Core Test Module - Technical Documentation

**Module:** `activiti-core-common/activiti-core-test`

**Target Audience:** Senior Software Engineers, QA Engineers, Test Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Classes and Their Responsibilities](#key-classes-and-their-responsibilities)
- [Test Assertions](#test-assertions)
- [Matchers](#matchers)
- [Test Operations](#test-operations)
- [Local Runtime Testing](#local-runtime-testing)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-core-test** module provides a comprehensive testing framework for Activiti applications. It offers fluent assertions, matchers, and test utilities that simplify writing tests for BPMN processes, tasks, and workflow behavior.

### Key Features

- **Fluent Assertions**: Type-safe, readable test assertions
- **BPMN Matchers**: Verify process structure and behavior
- **Await Patterns**: Wait for async process completion
- **Local Runtime**: In-memory testing without full engine
- **Spring Integration**: Auto-configuration for Spring Boot tests
- **Task Operations**: Simplified task testing API
- **Process Operations**: Streamlined process instance testing

### Module Structure

```
activiti-core-test/
├── activiti-core-test-assertions/        # Core assertion APIs
│   ├── src/main/java/org/activiti/test/
│   │   ├── assertions/                   # Assertion interfaces
│   │   ├── matchers/                     # Hamcrest matchers
│   │   ├── operations/                   # Test operations
│   │   └── conf/                         # Auto-configuration
│   └── src/test/java/
├── activiti-core-test-local-runtime/     # Local runtime implementation
│   ├── src/main/java/org/activiti/test/
│   │   ├── config/                       # Configuration
│   │   ├── operations/                   # Runtime operations
│   │   └── LocalEventSource.java         # Event source
│   └── src/test/java/
└── pom.xml
```

---

## Architecture

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Code                               │
│              (Your JUnit Tests)                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Test Assertions                            │
│  (ProcessInstanceAssertions, TaskAssertions, etc.)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Matchers                                 │
│  (ActivityMatchers, TaskMatchers, etc.)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Test Operations                            │
│  (ProcessOperations, TaskOperations)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Local Runtime                              │
│  (In-memory process execution)                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Framework                           │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ ProcessInstance │  │   Task          │  │  Signal     │ │
│  │  Assertions     │  │   Assertions    │  │  Assertions │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           └────────────────────┼───────────────────┘        │
│                                │                            │
│                   ┌────────────▼────────────┐               │
│                   │      Matchers           │               │
│                   │  (Hamcrest Matchers)    │               │
│                   └────────────┬────────────┘               │
│                                │                            │
│                   ┌────────────▼────────────┐               │
│                   │    Test Operations      │               │
│                   │ (Process/Task Ops)      │               │
│                   └────────────┬────────────┘               │
│                                │                            │
└────────────────────────────────┼────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Local Runtime         │
                    │  (In-memory Engine)     │
                    └─────────────────────────┘
```

---

## Key Classes and Their Responsibilities

### ProcessInstanceAssertions

**Purpose:** Provides fluent assertions for process instances.

**Responsibilities:**
- Asserting process instance existence
- Verifying process state (active, completed, suspended)
- Checking process variables
- Validating business keys
- Asserting process definition

**Key Methods:**
- `exists()` - Assert process instance exists
- `isActive()` - Assert process is active
- `isCompleted()` - Assert process has completed
- `hasVariable(String name)` - Assert variable exists
- `hasVariableValue(String name, Object value)` - Assert variable value
- `hasBusinessKey(String key)` - Assert business key
- `withProcessDefinition(String key)` - Filter by definition

**When to Use:** In tests to verify process instance behavior and state.

**Design Pattern:** Fluent interface with Hamcrest matchers

**Example:**
```java
processInstance("myProcess")
    .exists()
    .isActive()
    .hasVariable("orderId", "12345");
```

---

### TaskAssertions

**Purpose:** Provides fluent assertions for user tasks.

**Responsibilities:**
- Asserting task existence
- Verifying task state (claimed, unclaimed, completed)
- Checking task assignee
- Validating task variables
- Asserting task name and description

**Key Methods:**
- `exists()` - Assert task exists
- `isClaimed()` - Assert task is claimed
- `isUnclaimed()` - Assert task is unclaimed
- `hasAssignee(String assignee)` - Assert assignee
- `hasName(String name)` - Assert task name
- `hasVariable(String name)` - Assert variable exists
- `withProcessInstanceId(String id)` - Filter by process instance

**When to Use:** In tests to verify task behavior and state.

**Design Pattern:** Fluent interface with Hamcrest matchers

**Example:**
```java
task()
    .exists()
    .hasAssignee("john.doe")
    .hasName("Review Order")
    .hasVariable("priority", "HIGH");
```

---

### SignalAssertions

**Purpose:** Provides assertions for signal events.

**Responsibilities:**
- Asserting signal reception
- Verifying signal data
- Checking signal timing
- Validating signal propagation

**Key Methods:**
- `received(String signalName)` - Assert signal received
- `hasData(Object data)` - Assert signal data
- `awaitReceived(String signalName, Duration timeout)` - Wait for signal
- `withProcessInstanceId(String id)` - Filter by process instance

**When to Use:** In tests involving signal events and asynchronous communication.

**Design Pattern:** Fluent interface with await patterns

**Example:**
```java
signal()
    .awaitReceived("ORDER_APPROVED", Duration.ofSeconds(10))
    .hasData(approvalData);
```

---

### ActivityMatchers

**Purpose:** Provides Hamcrest matchers for BPMN activities.

**Responsibilities:**
- Matching activity types
- Verifying activity properties
- Checking activity state
- Validating activity transitions

**Key Methods:**
- `activityType(ActivityType type)` - Match by type
- `activityName(String name)` - Match by name
- `activityId(String id)` - Match by ID
- `isActive()` - Match active activities
- `isCompleted()` - Match completed activities

**When to Use:** In combination with assertions for detailed activity verification.

**Design Pattern:** Hamcrest matcher pattern

**Example:**
```java
assertThat(currentActivity(), activityName("Review Order"));
assertThat(activityState(), isActive());
```

---

### ProcessInstanceMatchers

**Purpose:** Provides Hamcrest matchers for process instances.

**Responsibilities:**
- Matching process instance properties
- Verifying process state
- Checking process variables
- Validating business keys

**Key Methods:**
- `processDefinitionKey(String key)` - Match by definition key
- `processInstanceId(String id)` - Match by ID
- `businessKey(String key)` - Match by business key
- `isActive()` - Match active instances
- `isCompleted()` - Match completed instances

**When to Use:** For detailed process instance verification in tests.

**Design Pattern:** Hamcrest matcher pattern

**Example:**
```java
assertThat(processInstance, processDefinitionKey("orderProcess"));
assertThat(processInstance, businessKey("ORD-123"));
```

---

### TaskMatchers

**Purpose:** Provides Hamcrest matchers for tasks.

**Responsibilities:**
- Matching task properties
- Verifying task state
- Checking task assignee
- Validating task variables

**Key Methods:**
- `taskName(String name)` - Match by name
- `taskAssignee(String assignee)` - Match by assignee
- `taskCandidateUser(String user)` - Match by candidate
- `isClaimed()` - Match claimed tasks
- `isUnclaimed()` - Match unclaimed tasks

**When to Use:** For detailed task verification in tests.

**Design Pattern:** Hamcrest matcher pattern

**Example:**
```java
assertThat(task, taskName("Approve Request"));
assertThat(task, taskAssignee("manager"));
```

---

### ProcessOperations

**Purpose:** Provides high-level operations for process testing.

**Responsibilities:**
- Starting process instances
- Sending signals and messages
- Querying process state
- Managing process lifecycle

**Key Methods:**
- `startProcess(String key)` - Start new process
- `sendSignal(String name)` - Send signal event
- `sendMessage(String name)` - Send message event
- `getProcessInstance(String id)` - Get process instance
- `completeProcess(String id)` - Complete process

**When to Use:** For orchestrating process tests.

**Design Pattern:** Facade pattern

**Example:**
```java
ProcessInstance instance = processOperations.startProcess("orderProcess");
processOperations.sendSignal("ORDER_CREATED");
```

---

### TaskOperations

**Purpose:** Provides high-level operations for task testing.

**Responsibilities:**
- Claiming tasks
- Completing tasks
- Assigning tasks
- Querying tasks

**Key Methods:**
- `claimTask(String taskId, String assignee)` - Claim task
- `completeTask(String taskId)` - Complete task
- `assignTask(String taskId, String assignee)` - Assign task
- `getTasks(String processInstanceId)` - Get tasks
- `getTask(String taskId)` - Get specific task

**When to Use:** For orchestrating task tests.

**Design Pattern:** Facade pattern

**Example:**
```java
taskOperations.claimTask(taskId, "john.doe");
taskOperations.completeTask(taskId, variables);
```

---

### AwaitProcessInstanceAssertions

**Purpose:** Provides await patterns for asynchronous process testing.

**Responsibilities:**
- Waiting for process completion
- Polling process state
- Timeout handling
- Retry logic

**Key Methods:**
- `awaitCompletion(Duration timeout)` - Wait for completion
- `awaitState(ProcessState state, Duration timeout)` - Wait for state
- `awaitVariable(String name, Duration timeout)` - Wait for variable
- `withPollInterval(Duration interval)` - Set poll interval

**When to Use:** For testing asynchronous processes with timeouts.

**Design Pattern:** Awaitility pattern

**Example:**
```java
await()
    .atMost(10, SECONDS)
    .until(processInstance("myProcess"), isCompleted());
```

---

### LocalEventSource

**Purpose:** Provides local event source for in-memory testing.

**Responsibilities:**
- Publishing test events
- Managing event lifecycle
- Event filtering
- Event delivery

**Key Methods:**
- `publish(Event event)` - Publish event
- `subscribe(Class<T> type, Consumer<T> handler)` - Subscribe to events
- `getEvents(Class<T> type)` - Get events by type
- `clearEvents()` - Clear all events

**When to Use:** For testing event-driven processes without external systems.

**Design Pattern:** Event source pattern

**Example:**
```java
localEventSource.publish(new OrderCreatedEvent(orderId));
List<OrderCreatedEvent> events = localEventSource.getEvents(OrderCreatedEvent.class);
```

---

## Test Assertions

### Process Instance Assertions

```java
@SpringBootTest
class OrderProcessTest {
    
    @Autowired
    private ProcessInstanceAssertions processInstance;
    
    @Test
    void testOrderProcessCreation() {
        // Start process
        ProcessInstance instance = startOrderProcess();
        
        // Assert process exists and is active
        processInstance
            .withProcessInstanceId(instance.getId())
            .exists()
            .isActive()
            .hasBusinessKey(instance.getBusinessKey())
            .hasVariable("orderId", instance.getBusinessKey())
            .hasVariable("orderStatus", "CREATED");
    }
    
    @Test
    void testOrderProcessCompletion() {
        // Start and complete process
        ProcessInstance instance = startAndCompleteOrderProcess();
        
        // Assert process is completed
        processInstance
            .withProcessInstanceId(instance.getId())
            .isCompleted()
            .hasVariable("orderStatus", "COMPLETED");
    }
}
```

### Task Assertions

```java
@SpringBootTest
class TaskTest {
    
    @Autowired
    private TaskAssertions task;
    
    @Test
    void testTaskCreation() {
        // Start process that creates task
        ProcessInstance instance = startProcess();
        
        // Assert task exists
        task
            .withProcessInstanceId(instance.getId())
            .exists()
            .hasName("Review Order")
            .isUnclaimed()
            .hasVariable("orderId", instance.getBusinessKey());
    }
    
    @Test
    void testTaskClaim() {
        // Get task and claim it
        Task task = getFirstTask();
        claimTask(task.getId(), "john.doe");
        
        // Assert task is claimed
        this.task
            .withTaskId(task.getId())
            .isClaimed()
            .hasAssignee("john.doe");
    }
}
```

### Signal Assertions

```java
@SpringBootTest
class SignalTest {
    
    @Autowired
    private SignalAssertions signal;
    
    @Test
    void testSignalReception() {
        // Start process waiting for signal
        ProcessInstance instance = startProcess();
        
        // Send signal
        sendSignal("ORDER_APPROVED");
        
        // Assert signal was received
        signal
            .withProcessInstanceId(instance.getId())
            .received("ORDER_APPROVED")
            .hasData(approvalData);
    }
}
```

---

## Matchers

### Activity Matchers

```java
import static org.activiti.test.matchers.ActivityMatchers.*;

class ActivityMatcherTest {
    
    @Test
    void testActivityMatchers() {
        // Match activity by name
        assertThat(currentActivity(), activityName("Review Order"));
        
        // Match activity by type
        assertThat(currentActivity(), activityType(UserTask.class));
        
        // Match activity state
        assertThat(activityState(), isActive());
        assertThat(activityState(), isCompleted());
        
        // Match activity ID
        assertThat(currentActivity(), activityId("task_1"));
    }
}
```

### Process Instance Matchers

```java
import static org.activiti.test.matchers.ProcessInstanceMatchers.*;

class ProcessInstanceMatcherTest {
    
    @Test
    void testProcessInstanceMatchers() {
        ProcessInstance instance = getProcessInstance();
        
        // Match by definition key
        assertThat(instance, processDefinitionKey("orderProcess"));
        
        // Match by business key
        assertThat(instance, businessKey("ORD-123"));
        
        // Match by ID
        assertThat(instance, processInstanceId("instance-123"));
        
        // Match state
        assertThat(instance, isActive());
        assertThat(instance, isCompleted());
    }
}
```

### Task Matchers

```java
import static org.activiti.test.matchers.TaskMatchers.*;

class TaskMatcherTest {
    
    @Test
    void testTaskMatchers() {
        Task task = getTask();
        
        // Match by name
        assertThat(task, taskName("Review Order"));
        
        // Match by assignee
        assertThat(task, taskAssignee("john.doe"));
        
        // Match by candidate user
        assertThat(task, taskCandidateUser("jane.doe"));
        
        // Match state
        assertThat(task, isClaimed());
        assertThat(task, isUnclaimed());
    }
}
```

---

## Test Operations

### Process Operations

```java
@SpringBootTest
class ProcessOperationsTest {
    
    @Autowired
    private ProcessOperations processOperations;
    
    @Test
    void testProcessOperations() {
        // Start process
        ProcessInstance instance = processOperations.startProcess("orderProcess");
        
        // Send signal
        processOperations.sendSignal("ORDER_CREATED");
        
        // Send message
        processOperations.sendMessage("APPROVE_ORDER");
        
        // Get process instance
        ProcessInstance retrieved = processOperations.getProcessInstance(instance.getId());
        
        // Complete process
        processOperations.completeProcess(instance.getId());
    }
}
```

### Task Operations

```java
@SpringBootTest
class TaskOperationsTest {
    
    @Autowired
    private TaskOperations taskOperations;
    
    @Test
    void testTaskOperations() {
        // Get tasks for process instance
        List<Task> tasks = taskOperations.getTasks(processInstanceId);
        
        // Claim task
        taskOperations.claimTask(taskId, "john.doe");
        
        // Complete task
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", true);
        taskOperations.completeTask(taskId, variables);
        
        // Assign task
        taskOperations.assignTask(taskId, "jane.doe");
    }
}
```

---

## Local Runtime Testing

### In-Memory Testing

```java
@ExtendWith(ActivitiTestExtension.class)
class LocalRuntimeTest {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    @Autowired
    private ProcessInstanceAssertions processInstance;
    
    @Test
    void testProcessInMemory() {
        // Start process
        ProcessInstance instance = processRuntime.start(
            StartProcessPayloadBuilder.start()
                .withProcessDefinitionKey("testProcess")
                .build()
        );
        
        // Assert process exists
        processInstance
            .withProcessInstanceId(instance.getId())
            .exists()
            .isActive();
        
        // Complete task
        Task task = taskRuntime.tasks()
            .processInstanceId(instance.getId())
            .list()
            .get(0);
        
        taskRuntime.complete(
            CompleteTaskPayloadBuilder.complete(task.getId())
                .build()
        );
        
        // Assert process completed
        processInstance
            .withProcessInstanceId(instance.getId())
            .isCompleted();
    }
}
```

### Event-Driven Testing

```java
@ExtendWith(ActivitiTestExtension.class)
class EventDrivenTest {
    
    @Autowired
    private LocalEventSource eventSource;
    
    @Autowired
    private ProcessInstanceAssertions processInstance;
    
    @Test
    void testEventDrivenProcess() {
        // Start process
        ProcessInstance instance = startProcess();
        
        // Publish event
        eventSource.publish(new OrderCreatedEvent("ORD-123"));
        
        // Wait for process to react
        await()
            .atMost(5, SECONDS)
            .until(processInstance.withProcessInstanceId(instance.getId()), isCompleted());
        
        // Verify events
        List<OrderCreatedEvent> events = eventSource.getEvents(OrderCreatedEvent.class);
        assertEquals(1, events.size());
    }
}
```

---

## Usage Examples

### Complete Test Example

```java
@SpringBootTest
@AutoConfigureTestDatabase
class OrderProcessIntegrationTest {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    @Autowired
    private ProcessInstanceAssertions processInstance;
    
    @Autowired
    private TaskAssertions task;
    
    @Test
    void testCompleteOrderProcess() {
        // 1. Start order process
        ProcessInstance instance = processRuntime.start(
            StartProcessPayloadBuilder.start()
                .withProcessDefinitionKey("orderProcess")
                .withBusinessKey("ORD-123")
                .withVariable("customerId", "CUST-456")
                .withVariable("orderAmount", 1000.0)
                .build()
        );
        
        // 2. Assert process started
        processInstance
            .withProcessInstanceId(instance.getId())
            .exists()
            .isActive()
            .hasBusinessKey("ORD-123")
            .hasVariable("customerId", "CUST-456");
        
        // 3. Get and claim task
        Task reviewTask = taskRuntime.tasks()
            .processInstanceId(instance.getId())
            .taskName("Review Order")
            .singleResult();
        
        taskRuntime.claim(
            ClaimTaskPayloadBuilder.claim(reviewTask.getId())
                .withAssignee("manager")
                .build()
        );
        
        // 4. Assert task claimed
        task
            .withTaskId(reviewTask.getId())
            .isClaimed()
            .hasAssignee("manager");
        
        // 5. Complete task
        Map<String, Object> completionVars = new HashMap<>();
        completionVars.put("approved", true);
        completionVars.put("approvalDate", Instant.now());
        
        taskRuntime.complete(
            CompleteTaskPayloadBuilder.complete(reviewTask.getId())
                .withVariables(completionVars)
                .build()
        );
        
        // 6. Assert process completed
        processInstance
            .withProcessInstanceId(instance.getId())
            .isCompleted()
            .hasVariable("approved", true);
    }
}
```

### Async Process Testing

```java
@SpringBootTest
class AsyncProcessTest {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private AwaitProcessInstanceAssertions awaitProcess;
    
    @Test
    void testAsyncProcess() {
        // Start async process
        ProcessInstance instance = processRuntime.start(
            StartProcessPayloadBuilder.start()
                .withProcessDefinitionKey("asyncProcess")
                .build()
        );
        
        // Wait for completion with timeout
        awaitProcess
            .withProcessInstanceId(instance.getId())
            .awaitCompletion(Duration.ofSeconds(30))
            .withPollInterval(Duration.ofMillis(500));
        
        // Assert completed
        assertThat(instance, isCompleted());
    }
}
```

---

## Best Practices

### 1. Use Fluent Assertions

```java
// GOOD
processInstance
    .withProcessInstanceId(id)
    .exists()
    .isActive()
    .hasVariable("status", "ACTIVE");

// BAD
ProcessInstance pi = getProcessInstance(id);
assertNotNull(pi);
assertTrue(pi.isActive());
assertEquals("ACTIVE", pi.getVariable("status"));
```

### 2. Use Matchers for Complex Conditions

```java
// GOOD
assertThat(task, allOf(
    taskName("Review Order"),
    taskAssignee("manager"),
    isClaimed()
));

// BAD
assertEquals("Review Order", task.getName());
assertEquals("manager", task.getAssignee());
assertTrue(task.isClaimed());
```

### 3. Use Await Patterns for Async Tests

```java
// GOOD
await()
    .atMost(10, SECONDS)
    .until(processInstance(id), isCompleted());

// BAD
Thread.sleep(10000);
assertThat(processInstance(id), isCompleted());
```

### 4. Keep Tests Independent

```java
// GOOD - Each test starts fresh
@Test
void testProcess1() {
    ProcessInstance instance = startProcess();
    // ...
}

@Test
void testProcess2() {
    ProcessInstance instance = startProcess();
    // ...
}

// BAD - Tests depend on each other
private ProcessInstance sharedInstance;

@Before
void setup() {
    sharedInstance = startProcess();
}
```

### 5. Use Descriptive Test Names

```java
// GOOD
@Test
void testOrderProcess_CompletesWhenApproved() { ... }

@Test
void testOrderProcess_WaitsForManagerApproval() { ... }

// BAD
@Test
void test1() { ... }

@Test
void testProcess() { ... }
```

---

## API Reference

### Assertion Interfaces

- `ProcessInstanceAssertions` - Process instance assertions
- `TaskAssertions` - Task assertions
- `SignalAssertions` - Signal assertions
- `AwaitProcessInstanceAssertions` - Await patterns

### Matcher Classes

- `ActivityMatchers` - Activity matchers
- `ProcessInstanceMatchers` - Process instance matchers
- `TaskMatchers` - Task matchers
- `SignalMatchers` - Signal matchers

### Operation Interfaces

- `ProcessOperations` - Process operations
- `TaskOperations` - Task operations
- `AwaitableProcessOperations` - Awaitable operations
- `AwaitableTaskOperations` - Awaitable task operations

### Local Runtime

- `LocalEventSource` - Local event source
- `LocalTaskSource` - Local task source
- `ProcessRuntimeOperations` - Runtime operations
- `TaskRuntimeOperations` - Task operations

---

## See Also

- [Parent Module Documentation](../README.md)
- [Expression Language](../activiti-expression-language/README.md)
- [Common Utilities](../activiti-common-util/README.md)
