---
sidebar_label: Overview
slug: /architecture/overview
title: "Architecture Overview"
description: "Comprehensive guide to Activiti Engine architecture, internal components, design patterns, and extension mechanisms."
---

# Activiti Engine Architecture

**Community-Maintained Guide**

**Target Audience:** Senior Software Engineers, System Architects, Technical Leads

**Version:** 8.7.2-SNAPSHOT

**Purpose:** Understand the internal workings of the Activiti Engine to make informed architectural decisions and effectively extend the platform.

> **Note:** This is community-contributed documentation and is not officially maintained by the Activiti team. For official documentation, please refer to the Activiti project repositories.

## System Overview

The Activiti Engine is built on a layered architecture that separates concerns and provides clear extension points. The design follows established patterns while optimizing for BPMN 2.0 execution requirements.

### Architectural Principles

1. **Separation of Concerns** - Clear boundaries between services, execution, and persistence layers
2. **Command Pattern** - All operations go through a centralized command manager for consistency
3. **Transaction Safety** - ACID compliance for all engine operations
4. **Extensibility** - Pluggable components for customization without modifying core code
5. **Performance** - Optimized for high-throughput process execution
6. **Observability** - Comprehensive eventing and history tracking for monitoring

### High-Level Architecture

```mermaid
flowchart TD
    subgraph ApplicationLayer["Application Layer"]
        App["Your Business Application<br/>- Service layer<br/>- Controllers<br/>- Integration code"]
    end

    subgraph EngineAPILayer["Engine API Layer"]
        direction TB
        subgraph Services["Services"]
            Repo["Repository<br/>Service"] --- Runtime["Runtime<br/>Service"] --- Task["Task<br/>Service"] --- History["History<br/>Service"] --- Mgmt["Management<br/>Service"]
        end
        CmdMgr["Command Manager<br/>(Central Gateway)"]
    end

    subgraph EngineCoreLayer["Engine Core Layer"]
        Context["Process Engine Context<br/>- Thread-local engine state<br/>- Current command execution<br/>- Transaction context"]
        
        subgraph Managers["Managers"]
            EntityMgr["Entity<br/>Manager"] --- HistoryMgr["History<br/>Manager"] --- EventMgr["Event<br/>Manager"]
        end
        
        BPMN["BPMN Execution Engine<br/>- Activity Behavior Handlers<br/>- Agenda & Execution Management"]
        JobExec["Job Executor<br/>- Async job processing<br/>- Timer management<br/>- Multi-tenant support"]
    end

    subgraph PersistenceLayer["Persistence Layer"]
        DAO["Database Access Objects<br/>- EntityMapper MyBatis<br/>- DAO implementations<br/>- Connection management"]
        DB["Database<br/>(PostgreSQL, etc)"]
    end

    ApplicationLayer --> EngineAPILayer
    Services --> CmdMgr
    CmdMgr --> Context
    Context --> Managers
    Managers --> BPMN
    BPMN --> JobExec
    JobExec --> DAO
    DAO --> DB
```

---

## Core Components

### 1. ProcessEngine

**Purpose:** Central coordinator and service provider

**Responsibilities:**
- Manage engine lifecycle (start/stop)
- Provide access to all services
- Configure and initialize components
- Manage thread pools and resources

**Key Methods:**
```java
public RepositoryService getRepositoryService();
public RuntimeService getRuntimeService();
public TaskService getTaskService();
public HistoryService getHistoryService();
public ManagementService getManagementService();
public void close();
```

**Design Pattern:** Service Locator + Singleton

### 2. ProcessEngineConfiguration

**Purpose:** Central configuration hub

**Responsibilities:**
- Configure all engine components
- Manage database connections
- Set up transaction managers
- Configure job executor
- Enable/disable features

**Configuration Categories:**
```java
// Database
setJdbcUrl(), setJdbcDriver(), setJdbcUsername(), setJdbcPassword()
setDatabaseSchemaUpdate(), setDatabaseSchemaCheck()

// Job Executor
setAsyncExecutorActivate(), setAsyncExecutorAcquireFrequency()
setJobExecutorThreads(), setJobExecutorQueueSize()

// History
setHistoryLevel(), setEnableHistoryAudit()

// Security
setAuthorizationManager(), setPermissionFactory()
```

**Design Pattern:** Builder + Configuration

### 3. Command Manager

**Purpose:** Central gateway for all engine operations

**Responsibilities:**
- Execute commands with proper transaction handling
- Manage command context
- Ensure thread safety
- Handle retries and error propagation

**Command Execution Flow:**
```
1. Command submitted
2. Transaction started (if needed)
3. Context initialized
4. Command executed
5. Events dispatched
6. Transaction committed/rolled back
7. Context cleared
```

**Key Interface:**
```java
public interface Command<T> {
    T execute(CommandContext context);
}
```

**Design Pattern:** Command + Template Method

### 4. Entity Manager

**Purpose:** Persistence operations for runtime entities

**Responsibilities:**
- CRUD operations for executions, tasks, variables
- Entity caching and lifecycle management
- Database query optimization
- Multi-tenancy support

**Managed Entities:**
- `ExecutionEntity` - Process executions
- `TaskEntity` - User tasks
- `VariableInstanceEntity` - Variables
- `JobEntity` - Async jobs

**Design Pattern:** Repository + Unit of Work

### 5. History Manager

**Purpose:** Historical data management

**Responsibilities:**
- Record process instance history
- Track task history
- Store variable history
- Manage history cleanup

**History Levels:**
```java
public enum HistoryLevel {
    NONE,           // No history
    ACTIVITY,       // Activity instances only
    AUDIT,          // + Task instances, variables
    FULL            // + Detailed execution history
}
```

**Design Pattern:** Event Sourcing (partial)

### 6. Event Manager

**Purpose:** Event dispatching and listener management

**Responsibilities:**
- Dispatch engine events
- Manage event listeners
- Support synchronous/asynchronous events
- Event filtering and routing

**Event Types:**
```java
// Task events
TaskCreatedEvent, TaskCompletedEvent, TaskAssignedEvent

// Process events
ProcessStartedEvent, ProcessCompletedEvent, ActivityTakenEvent

// Job events
JobExecutedEvent, JobExecutionFailedEvent

// Variable events
VariableCreatedEvent, VariableUpdatedEvent
```

**Design Pattern:** Publisher-Subscriber

### 7. BPMN Executor

**Purpose:** Core BPMN 2.0 execution engine

**Responsibilities:**
- Parse BPMN definitions
- Execute process flows
- Handle gateways and events
- Manage parallel execution
- Process business rules

**Design Pattern:** Strategy + Chain of Responsibility

### 8. Agenda

**Purpose:** Execution task management

**Responsibilities:**
- Queue execution tasks
- Prioritize work items
- Manage execution order
- Handle exceptions

**Agenda Items:**
```java
- TakeSequenceFlow
- ActivateExecution
- CompleteActivity
- EvaluateGateway
- SignalEvent
- ThrowException
```

**Design Pattern:** Priority Queue

### 9. Job Executor

**Purpose:** Asynchronous job processing

**Responsibilities:**
- Execute timer jobs
- Process async service tasks
- Handle job retries
- Manage job queues
- Multi-tenant job isolation

**Job Types:**
```java
- TimerStartJob - Start process on timer
- TimerCatchJob - Wait for timer in process
- ServiceJob - Async service task
- SignalJob - Send signal
- Job - Generic async job
```

**Design Pattern:** Thread Pool + Worker

---

## Component Interactions

### Process Start Flow

```mermaid
flowchart TD
    App["Application"] --> Runtime["RuntimeService"]
    Runtime --> CmdMgr["CommandManager"]
    CmdMgr --> TxMgr["TransactionManager"]
    TxMgr --> Init["CommandContext initialized"]
    Init --> Execute["StartProcessCmd.execute"]
    
    Execute --> CreateDef["Create process definition"]
    Execute --> CreateExec["Create execution"]
    Execute --> InitVars["Initialize variables"]
    Execute --> Trigger["Trigger start event"]
    
    CreateDef --> BPMN["BPMN Executor"]
    CreateExec --> BPMN
    InitVars --> BPMN
    Trigger --> BPMN
    
    BPMN --> Agenda["Agenda"]
    Agenda --> ExecAgenda["Execute Agenda"]
    ExecAgenda --> EventMgr["EventManager"]
    EventMgr --> HistoryMgr["HistoryManager"]
    HistoryMgr --> Commit["Transaction commit"]
```

### Task Completion Flow

```mermaid
flowchart TD
    TaskSvc["TaskService.complete"] --> CmdMgr["CommandManager"]
    CmdMgr --> Execute["CompleteTaskCmd.execute"]
    Execute --> EntityMgr["EntityManager<br/>update task, delete task, save variables"]
    EntityMgr --> BPMN["BPMN Executor<br/>complete activity, take sequence, evaluate gateway"]
    BPMN --> Agenda["Agenda<br/>add next steps"]
    Agenda --> ExecAgenda["Execute Agenda"]
    ExecAgenda --> EventMgr["EventManager<br/>TaskCompletedEvent"]
    EventMgr --> HistoryMgr["HistoryManager"]
```

---

## Execution Flow

### Command Execution Context

```java
public class CommandContext implements InMemoryObjectCache {
    
    private EntityManager entityManager;
    private HistoryManager historyManager;
    private EventManager eventManager;
    private Agenda agenda;
    private JobManager jobManager;
    
    // Thread-local storage for engine state
    private static final ThreadLocal<CommandContext> context = 
        new ThreadLocal<>();
    
    public static CommandContext getContext() {
        return context.get();
    }
}
```

### Transaction Boundaries

```mermaid
flowchart TD
    subgraph TransactionBoundary["Transaction Boundary"]
        subgraph CommandExec["Command Execution"]
            Begin["1. Begin Transaction"]
            Execute["2. Execute Command"]
            Modify["   - Modify entities"]
            CreateJobs["   - Create jobs"]
            Dispatch["   - Dispatch events"]
            Commit["3. Commit Transaction"]
        end
        Async["4. Async Processing outside transaction"]
    end

    Begin --> Execute
    Execute --> Modify
    Execute --> CreateJobs
    Execute --> Dispatch
    Modify --> Commit
    CreateJobs --> Commit
    Dispatch --> Commit
    Commit --> Async
```

---

## Command Pattern

### Command Hierarchy

```mermaid
classDiagram
    class Command~T~ {
        <<interface>>
        +execute(CommandContext context) T
    }
    
    class ReadOnlyCommand~T~ {
        <<abstract>>
        Query commands
        No DB modifications
    }
    
    class WriteCommand~T~ {
        <<abstract>>
        Process commands
        Repository commands
        Task commands
        Management commands
    }
    
    class ConfigCommand~T~ {
        <<abstract>>
        Configuration changes
    }
    
    class StartProcessInstanceCmd {
        +execute() Execution
    }
    
    class CompleteTaskCmd {
        +execute() void
    }
    
    class SignalEventCmd {
        +execute() void
    }
    
    class DeployCmd {
        +execute() Deployment
    }
    
    class DeleteDeploymentCmd {
        +execute() void
    }
    
    class SaveProcessDefinitionCmd {
        +execute() ProcessDefinition
    }
    
    class CreateTaskCmd {
        +execute() Task
    }
    
    class ClaimTaskCmd {
        +execute() Task
    }
    
    class ExecuteJobsCmd {
        +execute() int
    }
    
    class CleanupCmd {
        +execute() void
    }
    
    Command <|-- ReadOnlyCommand
    Command <|-- WriteCommand
    Command <|-- ConfigCommand
    
    WriteCommand <|-- StartProcessInstanceCmd
    WriteCommand <|-- CompleteTaskCmd
    WriteCommand <|-- SignalEventCmd
    WriteCommand <|-- DeployCmd
    WriteCommand <|-- DeleteDeploymentCmd
    WriteCommand <|-- SaveProcessDefinitionCmd
    WriteCommand <|-- CreateTaskCmd
    WriteCommand <|-- ClaimTaskCmd
    WriteCommand <|-- ExecuteJobsCmd
    WriteCommand <|-- CleanupCmd
```

### Command Implementation Example

```java
public class StartProcessInstanceCmd<T> implements WriteCommand<T> {
    
    private String processDefinitionKey;
    private String businessKey;
    private Map<String, Object> variables;
    
    @Override
    public T execute(CommandContext context) {
        // 1. Get process definition
        ProcessDefinitionEntity def = context.getEntityManager()
            .findLatestProcessDefinitionByKey(processDefinitionKey);
        
        // 2. Create root execution
        ExecutionEntity execution = context.getEntityManager()
            .createRootExecution(def);
        
        // 3. Set business key
        execution.setBusinessKey(businessKey);
        
        // 4. Initialize variables
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            context.getEntityManager().createVariable(execution, entry);
        }
        
        // 5. Trigger start event
        context.getBpmnExecutor().executeStartEvent(execution);
        
        // 6. Execute agenda
        context.getAgenda().execute();
        
        // 7. Return process instance
        return (T) execution;
    }
}
```

---

## Transaction Management

### Transaction Strategy

```java
public interface TransactionStrategy {
    void begin();
    void commit();
    void rollback();
    boolean isActive();
}
```

### Built-in Strategies

1. **JdbcTransactionStrategy** - JDBC transactions
2. **JtaTransactionStrategy** - JTA distributed transactions
3. **SpringTransactionStrategy** - Spring transaction management

### Transaction Propagation

```
Service Layer (@Transactional REQUIRED)
    ↓
CommandManager.execute()
    ↓
Transaction.begin()
    ↓
Command.execute() (in transaction)
    ↓
Transaction.commit()
```

---

## Threading Model

### Thread Safety

```java
// Thread-safe components
- ProcessEngine (singleton)
- Services (stateless)
- CommandManager (synchronized)

// Thread-local storage
- CommandContext
- Engine state
- Transaction context

// Not thread-safe
- Query objects
- Builder objects
```

### Concurrency Control

```mermaid
flowchart TD
    Main["Main Thread"]
    
    subgraph ServiceCalls["Service Calls"]
        Service1["Service Call 1"]
        Service2["Service Call 2"]
    end
    
    subgraph CommandExecution["Command Execution"]
        Cmd1["Command 1"]
        Cmd2["Command 2"]
    end
    
    subgraph Transactions["Transactions"]
        Tx1["Transaction 1"]
        Tx2["Transaction 2"]
    end
    
    subgraph JobExecutor["Job Executor Threads"]
        subgraph JobThreads["Worker Threads"]
            Job1["Job Thread 1"]
            Job2["Job Thread 2"]
            JobN["Job Thread N"]
        end
    end
    
    subgraph AsyncJobs["Async Jobs"]
        Async1["Async Job 1"]
        Async2["Async Job 2"]
        AsyncN["Async Job N"]
    end
    
    Main --> ServiceCalls
    Service1 --> Cmd1
    Service2 --> Cmd2
    Cmd1 --> Tx1
    Cmd2 --> Tx2
    Main --> JobExecutor
    Job1 --> Async1
    Job2 --> Async2
    JobN --> AsyncN
```

---

## Memory Management

### Caching Strategy

```java
// First-level cache (transaction-scoped)
- Entity cache
- Variable cache
- Execution cache

// Second-level cache (engine-scoped)
- Process definition cache
- Deployment cache
- BPMN model cache
```

### Memory Optimization

1. **Lazy Loading**: Load entities on demand
2. **Batch Operations**: Process multiple items together
3. **Connection Pooling**: Reuse database connections
4. **History Cleanup**: Remove old history data
5. **Variable Serialization**: Efficient storage

---

## Extension Points

### Custom Components

```java
// 1. Custom Activity Behavior
public class CustomActivityBehavior implements ActivityBehavior {
    public void execute(Execution execution) { ... }
}

// 2. Custom Task Listener
public class CustomTaskListener implements TaskListener {
    public void notify(DelegateTask task) { ... }
}

// 3. Custom Event Listener
public class CustomEventListener implements EngineEventListener {
    public void notify(EngineEvent event) { ... }
}

// 4. Custom Job Handler
public class CustomJobHandler implements JobHandler {
    public void execute(JobJob job) { ... }
}

// 5. Custom History Provider
public class CustomHistoryProvider implements HistoryProvider {
    public void recordHistory(Execution execution) { ... }
}
```

### Plugin Architecture

```mermaid
flowchart TD
    Config["ProcessEngineConfiguration"]
    
    subgraph Plugins["Engine Plugins"]
        History["HistoryPlugin"]
        Audit["AuditPlugin"]
        Security["SecurityPlugin"]
        Custom["CustomPlugin"]
    end
    
    Config --> History
    Config --> Audit
    Config --> Security
    Config --> Custom
```

---

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Use batch operations for bulk updates
2. **Query Optimization**: Index frequently queried columns
3. **Connection Pooling**: Configure appropriate pool sizes
4. **Async Execution**: Use async for long-running tasks
5. **History Level**: Choose appropriate history level
6. **Caching**: Enable definition caching

### Monitoring

```java
// Key metrics to monitor
- Command execution time
- Transaction duration
- Database connection usage
- Job queue size
- Memory usage
- Thread pool utilization
```

---

## See Also

- [Engine Configuration](../getting-started/configuration.md)
- [Core Services](../core-services/)
- [Best Practices](../best-practices/overview.md)
