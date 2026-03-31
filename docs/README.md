---
sidebar_label: Introduction
sidebar_position: 0
slug: /introduction
description: Welcome to the comprehensive documentation for Activiti API - A powerful workflow and Business Process Management (BPM) engine API layer.
---

# Activiti API Documentation

Welcome to the comprehensive documentation for **Activiti API** - A powerful workflow and Business Process Management (BPM) engine API layer.

## Table of Contents

- [Introduction](#introduction)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [API Modules](#api-modules)
- [Process Management](#process-management)
- [Task Management](#task-management)
- [Event Handling](#event-handling)
- [Security & Authentication](#security--authentication)
- [Advanced Topics](#advanced-topics)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Introduction

Activiti is an open-source BPM (Business Process Management) and workflow engine that helps organizations automate their business processes. The **Activiti API** provides a clean, type-safe interface for interacting with the workflow engine, abstracting away the complexity of the underlying implementation.

### What You Can Do With Activiti API

- **Design and deploy** BPMN 2.0 process definitions
- **Execute and monitor** process instances
- **Manage user tasks** and assignments
- **Handle business events** through callbacks
- **Integrate with external systems** via connectors
- **Implement complex workflows** with conditional logic, parallel execution, and more

### Who Is This For?

- **Beginners**: Learn workflow automation fundamentals
- **Developers**: Integrate process automation into applications
- **Architects**: Design scalable business process solutions
- **DevOps**: Deploy and manage workflow engines

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Your Business Logic, Controllers, Services)                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Activiti API Layer                        │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ ProcessRuntime   │  │  TaskRuntime     │                 │
│  │ ProcessAdmin     │  │  TaskAdmin       │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Event Listeners  │  │  Payload Builders│                 │
│  └──────────────────┘  └──────────────────┘                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Implementation Layer                       │
│  (Spring Boot, Database, Engine Integration)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Activiti Engine                           │
│  (BPMN Execution, Task Management, History)                  │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

The Activiti API is organized into several modules:

```
activiti-api/
├── activiti-api-model-shared/      # Common models and interfaces
├── activiti-api-runtime-shared/    # Shared runtime utilities
├── activiti-api-process-model/     # Process-related models
├── activiti-api-process-runtime/   # Process execution APIs
├── activiti-api-task-model/        # Task-related models
├── activiti-api-task-runtime/      # Task management APIs
└── activiti-api-dependencies/      # BOM for dependency management
```

---

## Getting Started

### Prerequisites

- **Java 11+** (or Java 17+ for latest features)
- **Maven 3.6+** or **Gradle 7+**
- Basic understanding of **BPMN 2.0** concepts
- A database (H2, MySQL, PostgreSQL, etc.)

### Quick Start Example

#### 1. Add Dependencies

**Maven:**
```xml
<dependencies>
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-api-process-runtime</artifactId>
        <version>8.7.2-SNAPSHOT</version>
    </dependency>
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-api-task-runtime</artifactId>
        <version>8.7.2-SNAPSHOT</version>
    </dependency>
</dependencies>
```

**Gradle:**
```groovy
implementation 'org.activiti:activiti-api-process-runtime:8.7.2-SNAPSHOT'
implementation 'org.activiti:activiti-api-task-runtime:8.7.2-SNAPSHOT'
```

#### 2. Basic Process Execution

```java
import org.activiti.api.process.runtime.ProcessRuntime;
import org.activiti.api.process.model.builders.ProcessPayloadBuilder;
import org.activiti.api.process.model.ProcessInstance;

@Service
public class WorkflowService {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    public void startProcess() {
        // Start a process by definition key
        ProcessInstance processInstance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("loanApplication")
                .withVariable("amount", 10000)
                .withVariable("applicant", "John Doe")
                .build()
        );
        
        System.out.println("Process started: " + processInstance.getId());
    }
}
```

#### 3. Task Management

```java
import org.activiti.api.task.runtime.TaskRuntime;
import org.activiti.api.task.model.builders.TaskPayloadBuilder;
import org.activiti.api.task.model.Task;

@Service
public class TaskService {
    
    @Autowired
    private TaskRuntime taskRuntime;
    
    public void completeTask(String taskId) {
        taskRuntime.complete(
            TaskPayloadBuilder.complete()
                .withTaskId(taskId)
                .withVariable("approved", true)
                .withVariable("comments", "Approved by manager")
                .build()
        );
    }
    
    public List<Task> getMyTasks() {
        return taskRuntime.tasks(Pageable.of(0, 10)).getContent();
    }
}
```

---

## Core Concepts

### 1. Process Definition

A **Process Definition** is a blueprint for a workflow, typically defined using BPMN 2.0.

```java
// Get process definition
ProcessDefinition definition = processRuntime.processDefinition("process-id");

// Key properties
String key = definition.getKey();           // "loanApplication"
String name = definition.getName();         // "Loan Application Process"
int version = definition.getVersion();      // 1
```

**Diagram:**
```
┌──────────────────────────────────────┐
│      Process Definition              │
│                                      │
│  Key: loanApplication                │
│  Name: Loan Application              │
│  Version: 1                          │
│  Form Key: loan-form                 │
│                                      │
│  ┌────────────────────────────┐      │
│  │ BPMN Model (XML/JSON)      │      │
│  │ - Start Event              │      │
│  │ - User Tasks               │      │
│  │ - Gateways                 │      │
│  │ - End Event                │      │
│  └────────────────────────────┘      │
└──────────────────────────────────────┘
```

### 2. Process Instance

A **Process Instance** is a running execution of a process definition.

```java
ProcessInstance instance = processRuntime.processInstance("instance-id");

// Status tracking
ProcessInstanceStatus status = instance.getStatus();  // RUNNING, SUSPENDED, COMPLETED
String businessKey = instance.getBusinessKey();       // "LOAN-12345"
String initiator = instance.getInitiator();           // "john.doe"
```

**Lifecycle:**
```
CREATED → RUNNING → (SUSPENDED) → COMPLETED/CANCELLED
```

### 3. Task

A **Task** represents work that needs to be done, typically by a user or system.

```java
Task task = taskRuntime.task("task-id");

// Task properties
String assignee = task.getAssignee();           // "john.doe"
TaskStatus status = task.getStatus();           // ASSIGNED, CREATED, COMPLETED
List<String> candidates = task.getCandidateUsers();
Date dueDate = task.getDueDate();
```

**Task States:**
```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│ CREATED │ → │ ASSIGNED │ → │ SUSPENDED │ → │COMPLETED │
└─────────┘    └──────────┘    └──────────┘    └─────────┘
                           ↓
                      ┌──────────┐
                      │CANCELLED │
                      └──────────┘
```

### 4. Variables

Variables store data throughout the process execution.

```java
// Process-level variables
processRuntime.setVariables(
    ProcessPayloadBuilder.setVariables()
        .withProcessInstanceId(instanceId)
        .withVariable("loanAmount", 50000)
        .withVariable("interestRate", 5.5)
        .build()
);

// Task-level variables
taskRuntime.createVariable(
    TaskPayloadBuilder.createVariable()
        .withTaskId(taskId)
        .withVariable("reviewNotes", "Needs more documentation")
        .build()
);
```

**Variable Scope:**
```
┌─────────────────────────────────────┐
│        Process Instance             │
│  ┌─────────────┐  ┌─────────────┐   │
│  │  Variable A │  │  Variable B │   │  (Process scope)
│  └─────────────┘  └─────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │         Task 1                │   │
│  │  ┌──────────┐ ┌──────────┐   │   │
│  │  │Var Task1 │ │Var Task2 │   │   │  (Task scope)
│  │  └──────────┘ └──────────┘   │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │         Task 2                │   │
│  │  ┌──────────┐                │   │
│  │  │Var Task3 │                │   │
│  │  └──────────┘                │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 📦 API Modules

### Model Shared Module

**Purpose**: Common interfaces and base classes

**Key Components**:
- `Payload` - Base interface for all request payloads
- `RuntimeEvent` - Base interface for events
- `Result<T>` - Generic result wrapper
- `VariableInstance` - Variable representation

### Process Model Module

**Purpose**: Process-related data models

**Key Interfaces**:
- `ProcessDefinition` - Process blueprint
- `ProcessInstance` - Running process
- `BPMNActivity` - BPMN elements
- `Deployment` - Deployment information

### Process Runtime Module

**Purpose**: Process execution APIs

**Main Interfaces**:
- `ProcessRuntime` - User-level process operations
- `ProcessAdminRuntime` - Admin-level operations

### Task Model Module

**Purpose**: Task-related data models

**Key Interfaces**:
- `Task` - User task representation
- `TaskCandidateUser` - Candidate user assignment
- `TaskCandidateGroup` - Candidate group assignment

### Task Runtime Module

**Purpose**: Task management APIs

**Main Interfaces**:
- `TaskRuntime` - User-level task operations
- `TaskAdminRuntime` - Admin-level operations

---

## ⚙️ Process Management

### Starting Processes

#### Method 1: By Process Definition Key

```java
ProcessInstance instance = processRuntime.start(
    ProcessPayloadBuilder.start()
        .withProcessDefinitionKey("orderProcess")
        .withBusinessKey("ORDER-2024-001")
        .withVariable("customerId", "CUST-123")
        .withVariable("orderTotal", 999.99)
        .build()
);
```

#### Method 2: By Process Definition ID

```java
ProcessInstance instance = processRuntime.start(
    ProcessPayloadBuilder.start()
        .withProcessDefinitionId("orderProcess:1:abc123")
        .withVariable("priority", "HIGH")
        .build()
);
```

#### Method 3: Using Start Message

```java
ProcessInstance instance = processRuntime.start(
    MessagePayloadBuilder.start("startOrder")
        .withBusinessKey("ORDER-2024-002")
        .withVariable("items", List.of("item1", "item2"))
        .build()
);
```

### Process Instance Operations

#### Suspend and Resume

```java
// Suspend a process
ProcessInstance suspended = processRuntime.suspend(
    ProcessPayloadBuilder.suspend(instanceId)
);

// Resume later
ProcessInstance resumed = processRuntime.resume(
    ProcessPayloadBuilder.resume(instanceId)
);
```

#### Update Process Instance

```java
ProcessInstance updated = processRuntime.update(
    ProcessPayloadBuilder.update()
        .withProcessInstanceId(instanceId)
        .withName("Updated Order Process")
        .withBusinessKey("NEW-KEY-123")
        .build()
);
```

#### Delete Process Instance

```java
ProcessInstance deleted = processRuntime.delete(
    ProcessPayloadBuilder.delete()
        .withProcessInstanceId(instanceId)
        .withReason("Customer requested cancellation")
        .build()
);
```

### Querying Processes

#### Get All Process Instances

```java
Page<ProcessInstance> allProcesses = processRuntime.processInstances(
    Pageable.of(0, 20)
);
```

#### Filter by Business Key

```java
Page<ProcessInstance> byBusinessKey = processRuntime.processInstances(
    Pageable.of(0, 20),
    ProcessPayloadBuilder.processInstances()
        .withBusinessKey("ORDER-2024")
        .build()
);
```

#### Filter by Process Definition

```java
Page<ProcessInstance> byDefinition = processRuntime.processInstances(
    Pageable.of(0, 20),
    ProcessPayloadBuilder.processInstances()
        .withProcessDefinitionKey("orderProcess")
        .active()  // Only active processes
        .build()
);
```

#### Get Subprocesses

```java
Page<ProcessInstance> subprocesses = processRuntime.processInstances(
    Pageable.of(0, 20),
    ProcessPayloadBuilder.subprocesses(parentInstanceId)
);
```

### Variable Management

#### Set Process Variables

```java
processRuntime.setVariables(
    ProcessPayloadBuilder.setVariables()
        .withProcessInstanceId(instanceId)
        .withVariable("amount", 1000)
        .withVariable("currency", "USD")
        .withVariable("approved", true)
        .build()
);
```

#### Get Process Variables

```java
List<VariableInstance> variables = processRuntime.variables(
    ProcessPayloadBuilder.variables()
        .withProcessInstanceId(instanceId)
        .build()
);

// Access variable values
for (VariableInstance var : variables) {
    String name = var.getName();
    String type = var.getType();
    Object value = var.getValue();
}
```

#### Remove Variables

```java
processRuntime.removeVariables(
    ProcessPayloadBuilder.removeVariables()
        .withProcessInstanceId(instanceId)
        .withVariableNames("temporaryVar", "oldData")
        .build()
);
```

### Signal and Message Events

#### Send Signal

```java
processRuntime.signal(
    SignalPayloadBuilder.signal()
        .withName("approvalSignal")
        .withVariable("approvedBy", "manager")
        .build()
);
```

#### Receive Message

```java
processRuntime.receive(
    MessagePayloadBuilder.receive("paymentReceived")
        .withCorrelationKey("ORDER-123")
        .withVariable("paymentId", "PAY-456")
        .withVariable("amount", 500.00)
        .build()
);
```

---

## 📋 Task Management

### Task Query Operations

#### Get All Tasks for Current User

```java
Page<Task> myTasks = taskRuntime.tasks(
    Pageable.of(0, 10, Order.by("createdDate", Order.Direction.DESC))
);
```

#### Get Tasks by Assignee

```java
Page<Task> assignedTasks = taskRuntime.tasks(
    Pageable.of(0, 10),
    TaskPayloadBuilder.tasks()
        .withAssignee("john.doe")
        .build()
);
```

#### Get Tasks by Group

```java
Page<Task> groupTasks = taskRuntime.tasks(
    Pageable.of(0, 10),
    TaskPayloadBuilder.tasks()
        .withGroup("managers")
        .withGroup("admins")
        .build()
);
```

#### Get Tasks for Process Instance

```java
Page<Task> processTasks = taskRuntime.tasks(
    Pageable.of(0, 10),
    TaskPayloadBuilder.tasksForProcess(processInstance)
);
```

#### Get Subtasks

```java
Page<Task> subtasks = taskRuntime.tasks(
    Pageable.of(0, 10),
    TaskPayloadBuilder.tasks()
        .withParentTaskId(parentTaskId)
        .build()
);
```

### Task Operations

#### Claim a Task

```java
// Claim as current user
Task claimed = taskRuntime.claim(
    TaskPayloadBuilder.claim()
        .withTaskId(taskId)
        .build()
);

// Claim with specific assignee (admin)
Task claimed = taskAdminRuntime.claim(
    TaskPayloadBuilder.claim()
        .withTaskId(taskId)
        .withAssignee("john.doe")
        .build()
);
```

#### Complete a Task

```java
Task completed = taskRuntime.complete(
    TaskPayloadBuilder.complete()
        .withTaskId(taskId)
        .withVariable("decision", "APPROVED")
        .withVariable("comments", "Looks good")
        .build()
);
```

#### Update Task Details

```java
Task updated = taskRuntime.update(
    TaskPayloadBuilder.update()
        .withTaskId(taskId)
        .withName("Updated Task Name")
        .withDescription("New description")
        .withDueDate(new Date(System.currentTimeMillis() + 7 * 24 * 60 * 60 * 1000))
        .withPriority(50)
        .build()
);
```

#### Release a Task

```java
Task released = taskRuntime.release(
    TaskPayloadBuilder.release()
        .withTaskId(taskId)
        .build()
);
```

#### Assign Task to Another User

```java
Task assigned = taskRuntime.assign(
    TaskPayloadBuilder.assign()
        .withTaskId(taskId)
        .withAssignee("jane.doe")
        .build()
);
```

#### Batch Assign Tasks

```java
Page<Task> assigned = taskAdminRuntime.assignMultiple(
    TaskPayloadBuilder.assignMultiple()
        .withTaskId("task1")
        .withTaskId("task2")
        .withTaskId("task3")
        .withAssignee("new.manager")
        .build()
);
```

#### Delete a Task

```java
Task deleted = taskRuntime.delete(
    TaskPayloadBuilder.delete()
        .withTaskId(taskId)
        .withReason("No longer needed")
        .build()
);
```

### Task Variables

#### Create Task Variable

```java
taskRuntime.createVariable(
    TaskPayloadBuilder.createVariable()
        .withTaskId(taskId)
        .withVariable("reviewScore", 85)
        .build()
);
```

#### Update Task Variable

```java
taskRuntime.updateVariable(
    TaskPayloadBuilder.updateVariable()
        .withTaskId(taskId)
        .withVariable("reviewScore", 90)
        .build()
);
```

#### Get Task Variables

```java
List<VariableInstance> taskVariables = taskRuntime.variables(
    TaskPayloadBuilder.variables()
        .withTaskId(taskId)
        .build()
);
```

#### Save Multiple Task Variables

```java
taskRuntime.save(
    TaskPayloadBuilder.save()
        .withTaskId(taskId)
        .withVariable("field1", "value1")
        .withVariable("field2", "value2")
        .withVariable("field3", "value3")
        .build()
);
```

### Candidate Management

#### Add Candidate Users

```java
taskRuntime.addCandidateUsers(
    TaskPayloadBuilder.addCandidateUsers()
        .withTaskId(taskId)
        .withCandidateUser("user1")
        .withCandidateUser("user2")
        .build()
);
```

#### Remove Candidate Users

```java
taskRuntime.deleteCandidateUsers(
    TaskPayloadBuilder.deleteCandidateUsers()
        .withTaskId(taskId)
        .withCandidateUsers(List.of("user1", "user2"))
        .build()
);
```

#### Add Candidate Groups

```java
taskRuntime.addCandidateGroups(
    TaskPayloadBuilder.addCandidateGroups()
        .withTaskId(taskId)
        .withCandidateGroup("managers")
        .withCandidateGroup("reviewers")
        .build()
);
```

#### Remove Candidate Groups

```java
taskRuntime.deleteCandidateGroups(
    TaskPayloadBuilder.deleteCandidateGroups()
        .withTaskId(taskId)
        .withCandidateGroups(List.of("old-group"))
        .build()
);
```

#### Query Candidates

```java
List<String> userCandidates = taskRuntime.userCandidates(taskId);
List<String> groupCandidates = taskRuntime.groupCandidates(taskId);
```

### Creating Standalone Tasks

```java
Task created = taskRuntime.create(
    TaskPayloadBuilder.create()
        .withName("Manual Review Task")
        .withDescription("Review the submitted documents")
        .withAssignee("reviewer1")
        .withDueDate(new Date(System.currentTimeMillis() + 3 * 24 * 60 * 60 * 1000))
        .withPriority(30)
        .withCandidateGroup("managers")
        .withCandidateUser("backup.reviewer")
        .withFormKey("review-form")
        .build()
);
```

---

## 🔔 Event Handling

### Event Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Flow                               │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐      │
│  │  Action  │ →  │  Event   │ →  │ Event Listener   │      │
│  │          │    │ Created  │    │ (Business Logic) │      │
│  └──────────┘    └──────────┘    └──────────────────┘      │
│                          │                      │           │
│                          ↓                      ↓           │
│                   ┌──────────┐          ┌──────────────┐   │
│                   │  Event   │          │  Side Effects│   │
│                   │  Store   │          │  (Email, etc)│   │
│                   └──────────┘          └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Process Events

#### Available Process Events

- `PROCESS_CREATED` - When a process instance is created
- `PROCESS_STARTED` - When a process instance starts execution
- `PROCESS_COMPLETED` - When a process instance completes
- `PROCESS_CANCELLED` - When a process instance is cancelled
- `PROCESS_SUSPENDED` - When a process instance is suspended
- `PROCESS_RESUMED` - When a process instance is resumed
- `PROCESS_UPDATED` - When a process instance is updated
- `PROCESS_DELETED` - When a process instance is deleted

#### Implementing Process Event Listeners

```java
@Component
public class ProcessEventListener implements ProcessEventListener<ProcessCompletedEvent> {
    
    @Override
    public void onEvent(ProcessCompletedEvent event) {
        ProcessInstance process = event.getEntity();
        
        // Business logic here
        sendCompletionNotification(process);
        updateAnalytics(process);
        archiveProcessData(process);
    }
    
    @Override
    public ProcessEvents getEventType() {
        return ProcessEvents.PROCESS_COMPLETED;
    }
}
```

#### BPMN Activity Events

```java
@Component
public class ActivityEventListener implements BPMNElementEventListener<BPMNActivityCompletedEvent> {
    
    @Override
    public void onEvent(BPMNActivityCompletedEvent event) {
        BPMNActivity activity = event.getEntity();
        
        String activityName = activity.getActivityName();
        String activityType = activity.getActivityType();
        
        logActivityCompletion(activity);
    }
    
    @Override
    public ActivityEvents getEventType() {
        return ActivityEvents.ACTIVITY_COMPLETED;
    }
}
```

### Task Events

#### Available Task Events

- `TASK_CREATED` - When a task is created
- `TASK_ASSIGNED` - When a task is assigned to a user
- `TASK_COMPLETED` - When a task is completed
- `TASK_UPDATED` - When a task is updated
- `TASK_ACTIVATED` - When a task is activated
- `TASK_SUSPENDED` - When a task is suspended
- `TASK_CANCELLED` - When a task is cancelled

#### Implementing Task Event Listeners

```java
@Component
public class TaskCompletionListener implements TaskEventListener<TaskCompletedEvent> {
    
    @Autowired
    private NotificationService notificationService;
    
    @Override
    public void onEvent(TaskCompletedEvent event) {
        Task completedTask = event.getEntity();
        
        // Send notification
        notificationService.sendTaskCompletionEmail(
            completedTask.getAssignee(),
            completedTask.getName()
        );
        
        // Update metrics
        logTaskMetrics(completedTask);
    }
    
    @Override
    public TaskEvents getEventType() {
        return TaskEvents.TASK_COMPLETED;
    }
}
```

#### Task Assignment Listener

```java
@Component
public class TaskAssignmentListener implements TaskEventListener<TaskAssignedEvent> {
    
    @Override
    public void onEvent(TaskAssignedEvent event) {
        Task assignedTask = event.getEntity();
        
        String assignee = assignedTask.getAssignee();
        
        // Notify assignee
        sendAssignmentNotification(assignee, assignedTask);
        
        // Update dashboard
        refreshUserDashboard(assignee);
    }
    
    @Override
    public TaskEvents getEventType() {
        return TaskEvents.TASK_ASSIGNED;
    }
}
```

### Variable Events

#### Available Variable Events

- `VARIABLE_CREATED` - When a variable is created
- `VARIABLE_UPDATED` - When a variable is updated
- `VARIABLE_DELETED` - When a variable is deleted

#### Implementing Variable Listeners

```java
@Component
public class VariableUpdateListener implements VariableEventListener<VariableUpdatedEvent> {
    
    @Override
    public void onEvent(VariableUpdatedEvent event) {
        VariableInstance variable = event.getEntity();
        Object previousValue = event.getPreviousValue();
        Object currentValue = variable.getValue();
        
        // Audit trail
        auditVariableChange(
            variable.getName(),
            previousValue,
            currentValue,
            event.getProcessInstanceId()
        );
        
        // Business rules
        if ("approvalStatus".equals(variable.getName())) {
            handleApprovalStatusChange(currentValue);
        }
    }
    
    @Override
    public VariableEvents getEventType() {
        return VariableEvents.VARIABLE_UPDATED;
    }
}
```

### Event Registration

#### Spring Configuration

```java
@Configuration
public class EventListenerConfig {
    
    @Bean
    public ProcessEventListener<ProcessCompletedEvent> processCompletedListener() {
        return new ProcessCompletionListener();
    }
    
    @Bean
    public TaskEventListener<TaskAssignedEvent> taskAssignedListener() {
        return new TaskAssignmentListener();
    }
    
    @Bean
    public VariableEventListener<VariableCreatedEvent> variableCreatedListener() {
        return new VariableCreationListener();
    }
}
```

#### Runtime Configuration

```java
@Component
@ConfigurationProperties(prefix = "activiti")
public class ActivitiConfiguration implements ProcessRuntimeConfiguration {
    
    private List<ProcessRuntimeEventListener<?>> processEventListeners;
    private List<VariableEventListener<?>> variableEventListeners;
    
    @Override
    public List<ProcessRuntimeEventListener<?>> processEventListeners() {
        return processEventListeners;
    }
    
    @Override
    public List<VariableEventListener<?>> variableEventListeners() {
        return variableEventListeners;
    }
}
```

### Event Best Practices

✅ **DO:**
- Keep event handlers lightweight
- Use async processing for heavy operations
- Implement proper error handling
- Log important events
- Test event handlers independently

❌ **DON'T:**
- Block event processing with long operations
- Modify process state in event handlers
- Assume event order without guarantees
- Store sensitive data in events

---

## 🔐 Security & Authentication

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Application Security                    │   │
│  │  (Spring Security, JWT, OAuth2)                     │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │           Activiti Security Manager                 │   │
│  │  - getAuthenticatedUserId()                        │   │
│  │  - getAuthenticatedUserGroups()                    │   │
│  │  - getAuthenticatedUserRoles()                     │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │           Authorization Checks                      │   │
│  │  - Task visibility                                 │   │
│  │  - Process access                                  │   │
│  │  - Admin operations                                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Security Manager Interface

```java
public interface SecurityManager {
    String getAuthenticatedUserId();
    List<String> getAuthenticatedUserGroups() throws SecurityException;
    List<String> getAuthenticatedUserRoles() throws SecurityException;
}
```

### Implementing Custom Security

#### Spring Security Integration

```java
@Component
public class SpringSecurityManager extends AbstractSecurityManager {
    
    public SpringSecurityManager(
        SecurityContextPrincipalProvider principalProvider,
        PrincipalIdentityProvider identityProvider,
        PrincipalGroupsProvider groupsProvider,
        PrincipalRolesProvider rolesProvider
    ) {
        super(principalProvider, identityProvider, groupsProvider, rolesProvider);
    }
}

@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityContextPrincipalProvider securityContextPrincipalProvider() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                           .map(Authentication::getPrincipal);
    }
    
    @Bean
    public PrincipalIdentityProvider principalIdentityProvider() {
        return principal -> {
            if (principal instanceof UserDetails) {
                return ((UserDetails) principal).getUsername();
            }
            return principal.getName();
        };
    }
    
    @Bean
    public PrincipalGroupsProvider principalGroupsProvider() {
        return principal -> {
            if (principal instanceof UserDetails) {
                return ((UserDetails) principal).getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());
            }
            return Collections.emptyList();
        };
    }
    
    @Bean
    public PrincipalRolesProvider principalRolesProvider() {
        // Implement role extraction logic
        return principal -> Collections.emptyList();
    }
}
```

### Task Authorization

#### Visibility Rules

Tasks are visible to users who:
1. Are the **assignee** of the task
2. Belong to a **candidate group** for the task
3. Are a **candidate user** for the task
4. Have **admin** role

```java
// Example: Task visibility check
public boolean isTaskVisible(Task task, String userId, List<String> userGroups) {
    // Check if assignee
    if (userId.equals(task.getAssignee())) {
        return true;
    }
    
    // Check candidate users
    if (task.getCandidateUsers().contains(userId)) {
        return true;
    }
    
    // Check candidate groups
    if (task.getCandidateGroups().stream().anyMatch(userGroups::contains)) {
        return true;
    }
    
    // Check admin role
    if (userGroups.contains("admin")) {
        return true;
    }
    
    return false;
}
```

### Admin vs User Operations

```java
// User Runtime - Requires authorization checks
@Service
public class UserService {
    @Autowired
    private TaskRuntime taskRuntime;  // User-level access
    
    public void completeTask(String taskId) {
        // Only works if user is assignee
        taskRuntime.complete(...);
    }
}

// Admin Runtime - Bypasses some checks
@Service
public class AdminService {
    @Autowired
    private TaskAdminRuntime taskAdminRuntime;  // Admin-level access
    
    public void completeTask(String taskId) {
        // Admin can complete any task
        taskAdminRuntime.complete(...);
    }
}
```

### Role-Based Access Control

```java
@Component
public class RoleBasedSecurityManager implements SecurityManager {
    
    private static final String ADMIN_ROLE = "activiti-admin";
    private static final String USER_ROLE = "activiti-user";
    
    @Override
    public String getAuthenticatedUserId() {
        return getCurrentUser().getId();
    }
    
    @Override
    public List<String> getAuthenticatedUserGroups() {
        return getCurrentUser().getGroups();
    }
    
    @Override
    public List<String> getAuthenticatedUserRoles() {
        return getCurrentUser().getRoles();
    }
    
    public boolean isAdmin() {
        return getAuthenticatedUserRoles().contains(ADMIN_ROLE);
    }
    
    public boolean hasRole(String role) {
        return getAuthenticatedUserRoles().contains(role);
    }
}
```

---

## 🎓 Advanced Topics

### Custom Connectors

#### What are Connectors?

Connectors enable integration with external systems during process execution.

```java
public interface Connector extends Function<IntegrationContext, IntegrationContext> {
}
```

#### Implementing a Custom Connector

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
        context.addOutBoundVariable("timestamp", new Date());
        
        return context;
    }
}
```

#### Using Connectors in BPMN

```xml
<serviceTask id="sendEmail" name="Send Email Notification">
  <extensionElements>
    <activiti:connector connectorRef="emailConnector">
      <activiti:in boundName="recipient" variableName="userEmail"/>
      <activiti:in boundName="subject" variableName="emailSubject"/>
      <activiti:in boundName="body" variableName="emailBody"/>
      <activiti:out boundName="sent" variableName="emailSent"/>
      <activiti:out boundName="messageId" variableName="messageId"/>
    </activiti:connector>
  </extensionElements>
</serviceTask>
```

### Custom Event Listeners

#### Task Listener

```java
@Component
public class CustomTaskListener implements TaskEventListener<TaskCreatedEvent> {
    
    @Override
    public void onEvent(TaskCreatedEvent event) {
        Task task = event.getEntity();
        
        // Auto-assign based on business rules
        if ("approval".equals(task.getTaskDefinitionKey())) {
            String approver = findApprover(task.getProcessInstanceId());
            taskRuntime.assign(
                TaskPayloadBuilder.assign()
                    .withTaskId(task.getId())
                    .withAssignee(approver)
                    .build()
            );
        }
    }
    
    @Override
    public TaskEvents getEventType() {
        return TaskEvents.TASK_CREATED;
    }
}
```

#### Process Listener with Compensation

```java
@Component
public class ProcessCompensationListener implements ProcessEventListener<ProcessCancelledEvent> {
    
    @Autowired
    private CompensationService compensationService;
    
    @Override
    public void onEvent(ProcessCancelledEvent event) {
        ProcessInstance process = event.getEntity();
        String cause = event.getCause();
        
        // Execute compensation logic
        compensationService.executeCompensation(process.getId(), cause);
        
        // Notify stakeholders
        notifyCancellation(process, cause);
    }
    
    @Override
    public ProcessEvents getEventType() {
        return ProcessEvents.PROCESS_CANCELLED;
    }
}
```

### Multi-tenancy Support

```java
@Configuration
public class MultiTenantConfig {
    
    @Bean
    public TenantAwareDataSource tenantDataSource(DataSource primaryDataSource) {
        return new TenantAwareDataSource(primaryDataSource);
    }
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration() {
        ProcessEngineConfiguration config = new ProcessEngineConfiguration();
        config.setDataSource(tenantDataSource(primaryDataSource));
        config.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);
        config.setTenantIdResolver(() -> TenantContext.getCurrentTenantId());
        return config;
    }
}
```

### Async Job Configuration

```java
@Configuration
public class AsyncJobConfig {
    
    @Bean
    public JobExecutor jobExecutor() {
        JobExecutor executor = new JobExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(1000);
        executor.setWaitTimeMs(5000);
        return executor;
    }
    
    @Bean
    public TimerJobExecutor timerJobExecutor() {
        TimerJobExecutor executor = new TimerJobExecutor();
        executor.setBatchSize(100);
        executor.setWaitTimeMs(10000);
        return executor;
    }
}
```

### History and Audit

#### Enable History Level

```java
@Configuration
public class HistoryConfig {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration() {
        ProcessEngineConfiguration config = new ProcessEngineConfiguration();
        config.setHistoryLevel(ProcessEngineConfiguration.HISTORY_FULL);
        // or HISTORY_ACTIVITY, HISTORY_AUDIT, NONE
        return config;
    }
}
```

#### Query History

```java
// Get process instance history
List<HistoricProcessInstance> history = historyService.createHistoricProcessInstanceQuery()
    .processInstanceId(instanceId)
    .list();

// Get task history
List<HistoricTaskInstance> taskHistory = historyService.createHistoricTaskInstanceQuery()
    .processInstanceId(instanceId)
    .orderByTaskCreateTime()
    .desc()
    .list();

// Get variable history
List<HistoricVariableInstance> variableHistory = historyService.createHistoricVariableInstanceQuery()
    .processInstanceId(instanceId)
    .variableName("approvalStatus")
    .list();
```

### Performance Optimization

#### Batch Operations

```java
// Batch task assignment
List<String> taskIds = getTaskIdsForBatch();
taskAdminRuntime.assignMultiple(
    TaskPayloadBuilder.assignMultiple()
        .withTaskIds(taskIds)
        .withAssignee("new.assignee")
        .build()
);
```

#### Pagination Best Practices

```java
// Efficient pagination
int pageSize = 50;
int page = 0;
boolean hasMore = true;

while (hasMore) {
    Page<Task> tasks = taskRuntime.tasks(Pageable.of(page * pageSize, pageSize));
    
    processTasks(tasks.getContent());
    
    hasMore = tasks.getTotalItems() > (page + 1) * pageSize;
    page++;
}
```

#### Caching Strategy

```java
@Cacheable(value = "processDefinitions", key = "#processDefinitionKey")
public ProcessDefinition getProcessDefinition(String processDefinitionKey) {
    return processRuntime.processDefinition(processDefinitionKey);
}

@CacheEvict(value = "processDefinitions", allEntries = true)
public void deployProcess() {
    // Deployment logic
}
```

### Testing Strategies

#### Unit Testing

```java
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    
    @Mock
    private TaskRuntime taskRuntime;
    
    @InjectMocks
    private TaskService taskService;
    
    @Test
    void shouldCompleteTask() {
        when(taskRuntime.task(anyString())).thenReturn(mockTask);
        
        taskService.completeTask("task-123");
        
        verify(taskRuntime).complete(any(CompleteTaskPayload.class));
    }
}
```

#### Integration Testing

```java
@SpringBootTest
@AutoConfigureMockMvc
class ProcessIntegrationTest {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Test
    void shouldExecuteFullProcess() {
        // Start process
        ProcessInstance instance = processRuntime.start(...);
        
        // Complete tasks
        List<Task> tasks = taskRuntime.tasks(...).getContent();
        tasks.forEach(task -> taskRuntime.complete(...));
        
        // Verify completion
        ProcessInstance completed = processRuntime.processInstance(instance.getId());
        assertEquals(ProcessInstanceStatus.COMPLETED, completed.getStatus());
    }
}
```

---

## 📊 Best Practices

### Design Principles

#### 1. Keep Processes Simple

**❌ Bad:** Complex process with too many decisions
```
Start → 10 Parallel Tasks → 20 Gateways → End
```

**✅ Good:** Decomposed into sub-processes
```
Main Process → Sub-Process 1 → Sub-Process 2 → End
```

#### 2. Use Meaningful Names

```java
// ❌ Bad
.withVariable("x", 100)
.withVariable("flag", true)

// ✅ Good
.withVariable("loanAmount", 100)
.withVariable("requiresManagerApproval", true)
```

#### 3. Implement Error Handling

```java
try {
    processRuntime.start(payload);
} catch (UnprocessableEntityException e) {
    log.error("Invalid process data: {}", e.getMessage());
    // Handle validation errors
} catch (NotFoundException e) {
    log.error("Process definition not found: {}", e.getMessage());
    // Handle missing definitions
}
```

### Performance Guidelines

#### 1. Avoid Large Variables

```java
// ❌ Bad - Storing large objects
.withVariable("documentContent", largeByteArray)

// ✅ Good - Store references
.withVariable("documentId", "doc-123")
.withVariable("documentUrl", "https://storage/docs/123")
```

#### 2. Use Async for Long Operations

```xml
<serviceTask id="externalCall" 
             activiti:async="true"
             name="Call External Service">
    <!-- Long-running operation -->
</serviceTask>
```

#### 3. Implement Proper Pagination

```java
// Always use pagination for queries
Page<Task> tasks = taskRuntime.tasks(
    Pageable.of(startIndex, maxItems, order)
);
```

### Security Best Practices

#### 1. Validate User Input

```java
public void startProcess(String processKey, Map<String, Object> variables) {
    // Sanitize input
    processKey = validateProcessKey(processKey);
    variables = sanitizeVariables(variables);
    
    processRuntime.start(...);
}
```

#### 2. Implement Least Privilege

```java
// Use TaskRuntime for users, TaskAdminRuntime only for admins
if (securityManager.isAdmin()) {
    taskAdminRuntime.delete(payload);
} else {
    taskRuntime.delete(payload); // Will fail authorization
}
```

#### 3. Audit Sensitive Operations

```java
@EventListener
public void onTaskCompleted(TaskCompletedEvent event) {
    Task task = event.getEntity();
    
    auditService.log(
        "TASK_COMPLETED",
        task.getProcessInstanceId(),
        task.getAssignee(),
        task.getId()
    );
}
```

### Code Organization

#### 1. Separate Concerns

```
src/
├── controllers/
│   ├── ProcessController.java
│   └── TaskController.java
├── services/
│   ├── ProcessService.java
│   ├── TaskService.java
│   └── BusinessRuleService.java
├── listeners/
│   ├── ProcessEventListener.java
│   └── TaskEventListener.java
└── config/
    ├── ActivitiConfig.java
    └── SecurityConfig.java
```

#### 2. Use Payload Builders

```java
// ✅ Good - Fluent API
ProcessPayloadBuilder.start()
    .withProcessDefinitionKey("order")
    .withVariable("amount", 100)
    .build();

// ❌ Bad - Direct instantiation
new StartProcessPayload(...);
```

### Monitoring and Observability

#### 1. Implement Health Checks

```java
@Component
public class ActivitiHealthIndicator implements HealthIndicator {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Override
    public Health health() {
        try {
            // Test basic operation
            processRuntime.processDefinitions(Pageable.of(0, 1));
            return Health.up().build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

#### 2. Add Metrics

```java
@Component
public class ProcessMetrics {
    
    @Autowired
    private MeterRegistry meterRegistry;
    
    public void recordProcessStart(String processKey) {
        meterRegistry.counter("process.starts", "key", processKey).increment();
    }
    
    public void recordTaskCompletion(long durationMs) {
        meterRegistry.timer("task.completion.time").record(durationMs, TimeUnit.MILLISECONDS);
    }
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Task Not Visible

**Problem:** User cannot see assigned tasks

**Solutions:**
- Verify user is authenticated
- Check if user is in candidate groups
- Ensure task is not completed/cancelled
- Review security configuration

```java
// Debug task visibility
Task task = taskRuntime.task(taskId);
System.out.println("Assignee: " + task.getAssignee());
System.out.println("Candidate Users: " + task.getCandidateUsers());
System.out.println("Candidate Groups: " + task.getCandidateGroups());
System.out.println("Current User: " + securityManager.getAuthenticatedUserId());
```

#### 2. Process Not Starting

**Problem:** Process instance fails to start

**Solutions:**
- Check process definition is deployed
- Verify required variables are provided
- Review start event configuration
- Check logs for exceptions

```java
// Debug process start
try {
    ProcessInstance instance = processRuntime.start(payload);
} catch (Exception e) {
    log.error("Failed to start process", e);
    // Check:
    // - Is process definition key correct?
    // - Are required variables present?
    // - Is user authorized?
}
```

#### 3. Variables Not Persisting

**Problem:** Variables lost after task completion

**Solutions:**
- Ensure variables are set before completion
- Check variable scope (task vs process)
- Verify history level configuration
- Review transaction management

```java
// Correct variable setting
taskRuntime.complete(
    TaskPayloadBuilder.complete()
        .withTaskId(taskId)
        .withVariable("result", "approved")  // Set before completion
        .build()
);
```

#### 4. Performance Issues

**Problem:** Slow query responses

**Solutions:**
- Implement pagination
- Add database indexes
- Enable caching
- Review async configuration

```java
// Optimize queries
Page<Task> tasks = taskRuntime.tasks(
    Pageable.of(0, 50, Order.by("createdDate", Order.Direction.DESC))
);
```

### Debugging Tips

#### Enable Debug Logging

```properties
# application.properties
logging.level.org.activiti=DEBUG
logging.level.org.flowable=DEBUG
```

#### Use Process Instance Query

```java
// Get detailed process information
ProcessInstance instance = processRuntime.processInstance(instanceId);
System.out.println("Status: " + instance.getStatus());
System.out.println("Definition: " + instance.getProcessDefinitionId());
System.out.println("Business Key: " + instance.getBusinessKey());
```

#### Check Active Tasks

```java
// List all active tasks for a process
Page<Task> tasks = taskRuntime.tasks(
    Pageable.of(0, 100),
    TaskPayloadBuilder.tasks()
        .withProcessInstanceId(instanceId)
        .build()
);
```

### Getting Help

1. **Check Logs**: Review application and engine logs
2. **Reproduce**: Create minimal test case
3. **Search**: Look for similar issues online
4. **Community**: Engage with Activiti community
5. **Documentation**: Review official docs

---

## Additional Resources

### Learning Path

#### For Beginners
1. Understand BPMN 2.0 basics
2. Learn process modeling
3. Practice with simple workflows
4. Study event handling
5. Implement basic security

#### For Advanced Users
1. Master connector development
2. Implement complex event scenarios
3. Optimize for performance
4. Design multi-tenant solutions
5. Build custom extensions

### Code Examples Repository

Visit the [Activiti GitHub](https://github.com/Activiti/Activiti) for:
- Sample applications
- Best practice implementations
- Integration examples
- Test cases

### Community

- **GitHub Issues**: Report bugs and request features
- **Stack Overflow**: Ask questions with `activiti` tag

---

## 📝 Appendix

### A. BPMN Element Reference

| Element | Description | Usage |
|---------|-------------|-------|
| Start Event | Process entry point | Every process must have one |
| User Task | Manual work item | Human interaction |
| Service Task | Automated work | System integration |
| Gateway | Decision point | Conditional flow |
| End Event | Process termination | One or more per process |
| Timer Event | Time-based trigger | Scheduled actions |
| Message Event | Message trigger | External events |
| Signal Event | Broadcast trigger | Cross-process communication |

### B. Payload Builder Reference

#### Process Builders
- `ProcessPayloadBuilder.start()` - Start process
- `ProcessPayloadBuilder.create()` - Create p## rocess instance
- `ProcessPayloadBuilder.delete()` - Delete process
- `ProcessPayloadBuilder.suspend()` - Suspend process
- `ProcessPayloadBuilder.resume()` - Resume process
- `ProcessPayloadBuilder.update()` - Update process
- `ProcessPayloadBuilder.variables()` - Get variables
- `ProcessPayloadBuilder.setVariables()` - Set variables
- `ProcessPayloadBuilder.removeVariables()` - Remove variables
- `ProcessPayloadBuilder.signal()` - Send signal
- `ProcessPayloadBuilder.processInstances()` - Query instances
- `ProcessPayloadBuilder.processDefinitions()` - Query definitions

#### Task Builders
- `TaskPayloadBuilder.tasks()` - Query tasks
- `TaskPayloadBuilder.complete()` - Complete task
- `TaskPayloadBuilder.save()` - Save task variables
- `TaskPayloadBuilder.claim()` - Claim task
- `TaskPayloadBuilder.release()` - Release task
- `TaskPayloadBuilder.createVariable()` - Create variable
- `TaskPayloadBuilder.updateVariable()` - Update variable
- `TaskPayloadBuilder.variables()` - Get variables
- `TaskPayloadBuilder.update()` - Update task
- `TaskPayloadBuilder.delete()` - Delete task
- `TaskPayloadBuilder.create()` - Create standalone task
- `TaskPayloadBuilder.assign()` - Assign task
- `TaskPayloadBuilder.assignMultiple()` - Batch assign
- `TaskPayloadBuilder.addCandidateUsers()` - Add candidates
- `TaskPayloadBuilder.deleteCandidateUsers()` - Remove candidates
- `TaskPayloadBuilder.addCandidateGroups()` - Add groups
- `TaskPayloadBuilder.deleteCandidateGroups()` - Remove groups

### C. Event Type Reference

#### Process Events
- `PROCESS_CREATED`
- `PROCESS_STARTED`
- `PROCESS_COMPLETED`
- `PROCESS_CANCELLED`
- `PROCESS_SUSPENDED`
- `PROCESS_RESUMED`
- `PROCESS_UPDATED`
- `PROCESS_DELETED`

#### Task Events
- `TASK_CREATED`
- `TASK_ASSIGNED`
- `TASK_COMPLETED`
- `TASK_UPDATED`
- `TASK_ACTIVATED`
- `TASK_SUSPENDED`
- `TASK_CANCELLED`

#### Variable Events
- `VARIABLE_CREATED`
- `VARIABLE_UPDATED`
- `VARIABLE_DELETED`

#### BPMN Events
- `ACTIVITY_STARTED`
- `ACTIVITY_COMPLETED`
- `ACTIVITY_CANCELLED`
- `TIMER_SCHEDULED`
- `TIMER_FIRED`
- `MESSAGE_RECEIVED`
- `SIGNAL_RECEIVED`

### D. Migration Guide

#### From Legacy API to New API

```java
// Old API
TaskService taskService = runtimeService.getTaskService();
List<Task> tasks = taskService.createTaskQuery().list();

// New API
@Autowired
private TaskRuntime taskRuntime;
Page<Task> tasks = taskRuntime.tasks(Pageable.of(0, 100));
```

### E. Version Compatibility

| API Version | Java Version | Engine Version |
|-------------|--------------|----------------|
| 8.7.2+      | 11+          | 8.7.2+         |
| 8.6.0+      | 11+          | 8.6.0+         |
| 8.5.0+      | 11+          | 8.5.0+         |

---

**Last Updated**: 2024  
**Version**: 8.7.2-SNAPSHOT  
**Maintained by**: Activiti Community

For questions, issues, or contributions, please visit our GitHub repository or contact us on Bluesky.
