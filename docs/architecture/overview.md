---
sidebar_label: Architecture
slug: /architecture/overview
title: "Architecture Overview"
description: "Comprehensive guide to Activiti Engine architecture, internal components, design patterns, and extension mechanisms."
---

# Activiti Engine Architecture

**Module:** `activiti-core/activiti-engine`

---

## Table of Contents

- [System Overview](#system-overview)
- [Core Components](#core-components)
- [Component Interactions](#component-interactions)
- [Execution Flow](#execution-flow)
- [Command Pattern](#command-pattern)
- [Transaction Management](#transaction-management)
- [Threading Model](#threading-model)
- [Memory Management](#memory-management)
- [Extension Points](#extension-points)

---

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
    subgraph App["Application Layer"]
        AppCode["Your Business Application\n- Service layer\n- Controllers\n- Integration code"]
    end

    subgraph PE["ProcessEngine"]
        PEImpl["ProcessEngineImpl\n- Service provider\n- Lifecycle management\n- Global registry"]
    end

    subgraph Services["Engine API Layer\n(all services extend ServiceImpl)"]
        direction LR
        Repo["RepositoryService\n- Deployments\n- Process definitions\n- Model queries"]
        Runtime["RuntimeService\n- Process instance execution\n- Variable management\n- Process correlation"]
        Task["TaskService\n- User task management\n- Claim/complete tasks\n- Task variables"]
        History["HistoryService\n- Historical queries\n- Audit data\n- Cleanup operations"]
        Mgmt["ManagementService\n- Job management\n- Database metadata\n- Custom SQL"]
        Dynamic["DynamicBpmnService\n- Runtime BPMN changes"]
    end

    subgraph CmdLayer["Command Execution Layer"]
        CmdExec["CommandExecutor\n- Interceptor chain\n- LogInterceptor\n- TransactionInterceptor\n- CommandContextInterceptor\n- CommandInvoker"]
    end

    subgraph Core["Engine Core Layer"]
        Context["CommandContext\n- Thread-local scope\n- Session management\n- Entity cache"]

        subgraph Managers["Managers"]
            EntityMgr["EntityManager\n- CRUD for executions/tasks/variables"]
            HistoryMgr["HistoryManager\n- History recording\n- Cleanup"]
            EventMgr["EventManager\n- Event dispatching\n- Listener management"]
        end

        BPMN["BPMN Executor\n- Activity behaviors\n- Gateway evaluation\n- Event handling"]
        Agenda["Agenda\n- Priority-queued execution tasks"]
        JobExec["Job Executor\n- Async job processing\n- Timer management"]
    end

    subgraph Persistence["Persistence Layer"]
        Sessions["Sessions\n- DbSqlSession\n- EntityCache\n- IdentityMgmtSession"]
        DataMgrs["Data Managers\n- MybatisTaskDataManager\n- MybatisExecutionDataManager\n- MybatisVariableDataManager"]
        MyBatis["MyBatis SqlSessionFactory\n- SQL mapping\n- Result mapping"]
        DS["DataSource / JDBC"]
        DB["Database\n(PostgreSQL, MySQL, etc.)"]
    end

    AppCode --> PEImpl
    PEImpl --> Repo
    PEImpl --> Runtime
    PEImpl --> Task
    PEImpl --> History
    PEImpl --> Mgmt
    PEImpl --> Dynamic

    Repo --- CmdExec
    Runtime --- CmdExec
    Task --- CmdExec
    History --- CmdExec
    Mgmt --- CmdExec
    Dynamic --- CmdExec

    CmdExec --> Context
    Context --> Managers
    Managers --> BPMN
    BPMN --> Agenda
    Agenda --> BPMN
    BPMN --> JobExec

    Context --> Sessions
    Sessions --> DataMgrs
    DataMgrs --> MyBatis
    MyBatis --> DS
    DS --> DB
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
public String getName();
public void close();
public RepositoryService getRepositoryService();
public RuntimeService getRuntimeService();
public TaskService getTaskService();
public HistoryService getHistoryService();
public ManagementService getManagementService();
public DynamicBpmnService getDynamicBpmnService();
public ProcessEngineConfiguration getProcessEngineConfiguration();
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

// Custom
setCustomLogger(), setCustomTaskListener()
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

**Components:**

```mermaid
flowchart LR
    subgraph BPMNExecutor["BPMN Executor"]
        direction TB
        StartHandler["Start<br>Handler"]
        ActivityHandlers["Activity<br>Handlers"]
        GatewayHandler["Gateway<br>Handler"]
        EventHandlers["Event<br>Handlers"]
        SequenceFlowHandler["Sequence<br>Flow Handler"]
        SignalMessageHandler["Signal/<br>Message<br>Handler"]
    end

    StartHandler --> ActivityHandlers
    GatewayHandler --> EventHandlers
    SequenceFlowHandler --> SignalMessageHandler
```

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

**Threading Model:**

```mermaid
flowchart LR
    subgraph ThreadPool["Job Executor Thread Pool"]
        direction TB
        TenantA["Job Executor 1<br>(Tenant A)"]
        TenantB["Job Executor 2<br>(Tenant B)"]
        Shared["Job Executor 3<br>(Shared)"]
    end
```

**Design Pattern:** Thread Pool + Worker

---

## Component Interactions

### Process Start Flow

```mermaid
flowchart TD
    App["Application"] --> Runtime["RuntimeService<br>startProcessInstance()"]
    Runtime --> CmdMgr["CommandExecutor<br>new StartProcessInstanceCmd()"]
    CmdMgr --> TxMgr["TransactionManager<br>begin()"]
    TxMgr --> Context["CommandContext<br>initialized"]
    Context --> Execute["StartProcessCmd<br>execute()"]
    
    Execute --> CreateDef["Create process definition"]
    Execute --> CreateExec["Create execution"]
    Execute --> InitVars["Initialize variables"]
    Execute --> Trigger["Trigger start event"]
    
    CreateDef --> BPMN["BPMN Executor<br>executeStartEvent()"]
    CreateExec --> BPMN
    InitVars --> BPMN
    Trigger --> BPMN
    
    BPMN --> Agenda["Agenda<br>add tasks"]
    Agenda --> ExecAgenda["Execute Agenda<br>process items"]
    ExecAgenda --> EventMgr["EventManager<br>dispatch events"]
    EventMgr --> HistoryMgr["HistoryManager<br>record history"]
    HistoryMgr --> Commit["TransactionManager<br>commit()"]
```

### Task Completion Flow

```mermaid
flowchart TD
    TaskComplete["Task Complete"] --> TaskSvc["TaskService<br>complete()"]
    TaskSvc --> CmdMgr["CommandExecutor<br>CompleteTaskCmd"]
    CmdMgr --> EntityMgr["EntityManager<br>update task, delete task, save variables"]
    EntityMgr --> BPMN["BPMN Executor<br>complete activity, take sequence, evaluate gateway"]
    BPMN --> Agenda["Agenda<br>add next steps"]
    Agenda --> ExecAgenda["Execute Agenda<br>until idle"]
    ExecAgenda --> EventMgr["EventManager<br>TaskCompletedEvent"]
    EventMgr --> HistoryMgr["HistoryManager<br>record completion"]
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
    class Command {
        <<interface>>
        +execute(CommandContext context) T
    }
    
    class ReadOnlyCommand {
        <<abstract>>
        Query commands
        No DB modifications
    }
    
    class WriteCommand {
        <<abstract>>
        Process commands
        Repository commands
        Task commands
        Management commands
    }
    
    class ConfigCommand {
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

```mermaid
flowchart TD
    ServiceLayer["Service Layer<br/>@Transactional (REQUIRED)"] --> CmdMgr["CommandExecutor<br/>execute()"]
    CmdMgr --> TxBegin["Transaction<br/>begin()"]
    TxBegin --> CmdExec["Command.execute()<br/>(in transaction)"]
    CmdExec --> TxCommit["Transaction<br/>commit()"]
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

- [Engine Configuration](../configuration.md)
- [Engine API Overview](../api-reference/engine-api/README.md)
- [Repository Service](../api-reference/engine-api/repository-service.md)
- [Runtime Service](../api-reference/engine-api/runtime-service.md)
- [Task Service](../api-reference/engine-api/task-service.md)
- [Best Practices](../best-practices/overview.md)
