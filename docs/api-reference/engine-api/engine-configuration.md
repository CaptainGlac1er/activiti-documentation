---
sidebar_label: Engine Configuration
slug: /activiti-core/engine-configuration
description: Complete guide to configuring the Activiti Process Engine for different environments.
---

# Process Engine Configuration

**Module:** `activiti-core/activiti-engine`

---

## Table of Contents

- [Configuration Overview](#configuration-overview)
- [ProcessEngineConfiguration](#processengineconfiguration)
- [Database Configuration](#database-configuration)
- [Job Executor Configuration](#job-executor-configuration)
- [History Configuration](#history-configuration)
- [Performance Tuning](#performance-tuning)
- [Query Limits](#query-limits)
- [Event Configuration](#event-configuration)
- [Custom Components](#custom-components)
- [Configuration Examples](#configuration-examples)
- [Best Practices](#best-practices)

---

## Configuration Overview

The Activiti Engine is highly configurable through the `ProcessEngineConfiguration` class. This central configuration hub controls all aspects of engine behavior, from database connections to job execution strategies.

### Configuration Approaches

1. **Programmatic**: Direct Java configuration with method chaining
2. **Properties File**: XML or properties-based configuration
3. **Spring Boot**: Auto-configuration with YAML/properties
4. **Hybrid**: Combination of approaches

### Configuration Lifecycle

```
1. Create Configuration
   │
   ▼
2. Set Properties (method chaining)
   │
   ▼
3. Build Engine
   │
   ▼
4. Initialize Components
   │
   ▼
5. Start Engine
```

---

## ProcessEngineConfiguration

### Creating Configuration

```java
// Standalone in-memory (for testing)
ProcessEngineConfiguration config = ProcessEngineConfiguration
    .createStandaloneInMemProcessEngineConfiguration();

// Standalone with JDBC
ProcessEngineConfiguration config = ProcessEngineConfiguration
    .createStandaloneProcessEngineConfiguration();

// Spring integration
ProcessEngineConfiguration config = ProcessEngineConfiguration
    .createSpringProcessEngineConfiguration();

// Custom configuration
ProcessEngineConfiguration config = new ProcessEngineConfigurationImpl();
```

### Key Configuration Properties

```java
public class ProcessEngineConfiguration {
    
    // Engine identification
    private String processEngineName = "Activiti";
    private int idBlockSize = 50000;
    
    // Database
    private String jdbcUrl;
    private String jdbcUsername;
    private String jdbcPassword;
    private String jdbcDriver;
    private DataSource dataSource;
    private String databaseType;
    
    // Schema management
    private String databaseSchemaUpdate = DB_SCHEMA_UPDATE_FALSE;
    private String databaseTablePrefix = "ACT_";
    private String databaseSchema;
    private String databaseCatalog;
    
    // History
    private HistoryLevel historyLevel = HistoryLevel.AUDIT;
    private boolean isDbHistoryUsed = true;
    
    // Job executor
    private boolean asyncExecutorActivate = true;
    private AsyncExecutor asyncExecutor;
    private int lockTimeAsyncJobWaitTime = 3000;
    private int defaultFailedJobWaitTime = 60000;
    private int asyncFailedJobWaitTime = 60000;
    
    // Performance
    private int processDefinitionCacheLimit = 1000;
    private int knowledgeBaseCacheLimit = 100;
    private boolean bulkInsertEnabled = true;
    
    // Serialization
    private boolean serializePOJOsInVariablesToJson = true;
    private boolean serializableVariableTypeTrackDeserializedObjects = false;
}
```

### Method Chaining Pattern

**Why use this:** All setter methods return `ProcessEngineConfiguration`, enabling fluent API style configuration.

```java
ProcessEngine engine = new ProcessEngineConfigurationImpl()
    .setJdbcUrl("jdbc:h2:mem:activiti")
    .setJdbcUsername("sa")
    .setJdbcPassword("")
    .setJdbcDriver("org.h2.Driver")
    .setDatabaseSchemaUpdate(DB_SCHEMA_UPDATE_TRUE)
    .setHistoryLevel(HistoryLevel.FULL)
    .setAsyncExecutorActivate(true)
    .buildProcessEngine();
```

---

## Database Configuration

### JDBC Configuration

```java
ProcessEngineConfiguration config = new ProcessEngineConfigurationImpl();

// Basic JDBC settings
config.setJdbcUrl("jdbc:postgresql://localhost:5432/activiti");
config.setJdbcUsername("activiti");
config.setJdbcPassword("activiti");
config.setJdbcDriver("org.postgresql.Driver");
config.setDatabaseType("postgresql");

// Connection pool settings (when not using external pool)
config.setJdbcMaxActiveConnections(20);
config.setJdbcMaxIdleConnections(10);
config.setJdbcMaxCheckoutTime(30000);  // Max time to hold a connection
config.setJdbcMaxWaitTime(30000);      // Max time to wait for connection
config.setJdbcPingEnabled(true);       // Enable connection validation
config.setJdbcPingQuery("SELECT 1");   // Validation query
config.setJdbcPingConnectionNotUsedFor(300); // Ping if not used for 5 minutes
config.setJdbcDefaultTransactionIsolationLevel(Connection.TRANSACTION_READ_COMMITTED);
```

**Why use these:**
- `setJdbcMaxActiveConnections`: Controls maximum concurrent database connections
- `setJdbcMaxIdleConnections`: Maintains pool of idle connections for faster response
- `setJdbcMaxCheckoutTime`: Prevents connection starvation by limiting hold time
- `setJdbcMaxWaitTime`: Controls timeout when no connections available
- `setJdbcPingEnabled`: Validates connections before use to prevent stale connection errors
- `setJdbcDefaultTransactionIsolationLevel`: Ensures consistent transaction behavior across databases

### Database Schema Management

```java
// Never update schema (production)
config.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_FALSE);

// Auto-update schema (development)
config.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);

// Create/drop schema (testing)
config.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_CREATE_DROP);
```

**Why use these:**
- `DB_SCHEMA_UPDATE_FALSE`: Production safety - prevents accidental schema changes
- `DB_SCHEMA_UPDATE_TRUE`: Development convenience - automatic migrations
- `DB_SCHEMA_UPDATE_CREATE_DROP`: Testing isolation - fresh schema each run

### Schema Options

| Option | Constant | Use Case | Description |
|--------|----------|----------|-------------|
| `FALSE` | `DB_SCHEMA_UPDATE_FALSE` | Production | No automatic changes, manual migrations required |
| `TRUE` | `DB_SCHEMA_UPDATE_TRUE` | Dev/Test | Auto-update schema on startup |
| `CREATE_DROP` | `DB_SCHEMA_UPDATE_CREATE_DROP` | Testing | Drop and recreate schema each run |

### Custom Schema Configuration

```java
// Use custom schema name (PostgreSQL, Oracle)
config.setDatabaseSchema("MY_CUSTOM_SCHEMA");

// Use custom table prefix
config.setDatabaseTablePrefix("ACT_");

// Treat prefix as schema (for databases that support it)
config.setTablePrefixIsSchema(false);

// Set database catalog (MySQL)
config.setDatabaseCatalog("activiti_db");

// Configure wildcard escape character for queries
config.setDatabaseWildcardEscapeCharacter("\\");
```

**Why use these:**
- `setDatabaseSchema`: Isolate Activiti tables in dedicated schema
- `setDatabaseTablePrefix`: Prevent table name conflicts with other applications
- `setTablePrefixIsSchema`: Optimize for databases where prefix acts as schema
- `setDatabaseCatalog`: Organize tables in MySQL catalog structure
- `setDatabaseWildcardEscapeCharacter`: Handle special characters in queries safely

### Connection Pool Integration

```java
// HikariCP (recommended)
HikariConfig hikariConfig = new HikariConfig();
hikariConfig.setJdbcUrl("jdbc:postgresql://localhost:5432/activiti");
hikariConfig.setUsername("activiti");
hikariConfig.setPassword("activiti");
hikariConfig.setMaximumPoolSize(20);
hikariConfig.setMinimumIdle(10);
hikariConfig.setConnectionTimeout(30000);

DataSource dataSource = new HikariDataSource(hikariConfig);
config.setDataSource(dataSource);

// Apache DBCP
BasicDataSource dbcp = new BasicDataSource();
dbcp.setDriverClassName("org.postgresql.Driver");
dbcp.setUrl("jdbc:postgresql://localhost:5432/activiti");
dbcp.setUsername("activiti");
dbcp.setPassword("activiti");
dbcp.setMaxTotal(20);

config.setDataSource(dbcp);

// JNDI DataSource (application server)
config.setDataSourceJndiName("java:/comp/env/jdbc/activiti");
```

**Why use these:**
- `setDataSource`: Use external connection pool for better performance and resource management
- `setDataSourceJndiName`: Integrate with application server's connection pooling
- External pools (HikariCP, DBCP) provide better monitoring, connection validation, and tuning options

### JPA Integration

```java
// Use JPA EntityManager
config.setJpaEntityManagerFactory(entityManagerFactory);
config.setJpaPersistenceUnitName("activiti-pu");
config.setJpaHandleTransaction(false);  // Let JPA manage transactions
config.setJpaCloseEntityManager(true);   // Close EM after each command
```

**Why use these:**
- `setJpaEntityManagerFactory`: Integrate with existing JPA setup
- `setJpaHandleTransaction`: Control transaction management boundary
- `setJpaCloseEntityManager`: Prevent EntityManager leaks in long-running applications

---

## Job Executor Configuration

### Basic Configuration

```java
// Enable async job executor
config.setAsyncExecutorActivate(true);

// Set custom async executor implementation
config.setAsyncExecutor(new CustomAsyncExecutor());

// Job wait times (in milliseconds)
config.setLockTimeAsyncJobWaitTime(3000);      // Wait time for acquiring job lock
config.setDefaultFailedJobWaitTime(60000);     // Wait before retrying failed jobs
config.setAsyncFailedJobWaitTime(60000);       // Wait for async job failures
```

**Why use these:**
- `setAsyncExecutorActivate`: Enable background job processing (timers, async continuations)
- `setAsyncExecutor`: Replace default executor with custom implementation for specialized needs
- `setLockTimeAsyncJobWaitTime`: Control how long to wait when acquiring job execution lock
- `setDefaultFailedJobWaitTime`: Prevent rapid retry loops for failing jobs
- `setAsyncFailedJobWaitTime`: Add delay before retrying async job failures

### Async Executor Thread Pool Configuration

```java
// Core pool size - minimum threads maintained
config.setAsyncExecutorCorePoolSize(10);

// Maximum pool size - threads under load
config.setAsyncExecutorMaxPoolSize(20);

// Number of retries for failed jobs
config.setAsyncExecutorNumberOfRetries(3);

// Thread keep-alive time (seconds)
config.setAsyncExecutorThreadKeepAliveTime(60L);

// Queue size for job execution
config.setAsyncExecutorThreadPoolQueueSize(1000);

// Custom queue implementation
BlockingQueue<Runnable> customQueue = new LinkedBlockingQueue<>(1000);
config.setAsyncExecutorThreadPoolQueue(customQueue);

// Shutdown wait time (seconds)
config.setAsyncExecutorSecondsToWaitOnShutdown(60L);
```

**Why use these:**
- `setAsyncExecutorCorePoolSize`: Maintain baseline thread count for consistent performance
- `setAsyncExecutorMaxPoolSize`: Scale up under heavy job load
- `setAsyncExecutorNumberOfRetries`: Limit retry attempts to prevent infinite loops
- `setAsyncExecutorThreadKeepAliveTime`: Free idle threads to reduce resource usage
- `setAsyncExecutorThreadPoolQueueSize`: Buffer jobs when executor is at capacity
- `setAsyncExecutorThreadPoolQueue`: Use custom queue with specific ordering or capacity
- `setAsyncExecutorSecondsToWaitOnShutdown`: Graceful shutdown waiting for jobs to complete

### Advanced Job Configuration

```java
// Set custom clock for testing
config.setClock(new FixedClock(Date.from(Instant.parse("2024-01-01T00:00:00Z"))));

// Reset clock to system time
config.resetClock();

// Configure job handlers
Map<String, JobHandler> jobHandlers = new HashMap<>();
jobHandlers.put("customJobType", new CustomJobHandler());
config.setJobHandlers(jobHandlers);

// Add custom job handlers
List<JobHandler> customHandlers = Arrays.asList(new CustomJobHandler());
config.setCustomJobHandlers(customHandlers);
```

**Why use these:**
- `setClock`: Test time-dependent behavior with fixed timestamps
- `resetClock`: Return to system time after testing
- `setJobHandlers`: Register custom job types for specialized processing
- `setCustomJobHandlers`: Extend job handling without replacing defaults

---

## History Configuration

### History Levels

```java
// No history - fastest, no audit trail
config.setHistoryLevel(HistoryLevel.NONE);

// Activity instances only - minimal history
config.setHistoryLevel(HistoryLevel.ACTIVITY);

// Activity + Task + Variables - default audit level
config.setHistoryLevel(HistoryLevel.AUDIT);

// Full history including detailed execution - complete audit trail
config.setHistoryLevel(HistoryLevel.FULL);
```

**Why use these:**
- `HistoryLevel.NONE`: Maximum performance, no history storage (testing, high-volume)
- `HistoryLevel.ACTIVITY`: Track process flow without task details (monitoring)
- `HistoryLevel.AUDIT`: Complete audit trail for compliance (production default)
- `HistoryLevel.FULL`: Detailed execution history for debugging and analytics

### History Features

```java
// Enable/disable database history
config.setDbHistoryUsed(true);

// Set custom history implementation
config.setHistory(new CustomHistory());

// Configure history manager
config.setHistoryManager(new CustomHistoryManager());
```

**Why use these:**
- `setDbHistoryUsed`: Disable history storage entirely for performance-critical scenarios
- `setHistory`: Replace default history with custom implementation
- `setHistoryManager`: Control how history is written and managed

---

## Performance Tuning

### Cache Configuration

```java
// Process definition cache limit
config.setProcessDefinitionCacheLimit(1000);

// Knowledge base cache limit (DMN)
config.setKnowledgeBaseCacheLimit(100);

// Enable process definition info cache
config.setEnableProcessDefinitionInfoCache(true);

// Custom cache implementations
DeploymentCache<ProcessDefinitionCacheEntry> customCache = new CustomCache<>();
config.setProcessDefinitionCache(customCache);

DeploymentCache<Object> kbCache = new CustomCache<>();
config.setKnowledgeBaseCache(kbCache);
```

**Why use these:**
- `setProcessDefinitionCacheLimit`: Control memory usage for cached process definitions
- `setKnowledgeBaseCacheLimit`: Limit DMN decision table cache size
- `setEnableProcessDefinitionInfoCache`: Speed up process definition metadata access
- Custom caches: Implement specialized caching strategies (LRU, TTL, distributed)

### Batch Operations

```java
// Enable bulk insert for better performance
config.setBulkInsertEnabled(true);

// Maximum statements per bulk insert
config.setMaxNrOfStatementsInBulkInsert(1000);

// Batch size for process instance operations
config.setBatchSizeProcessInstances(1000);

// Batch size for task operations
config.setBatchSizeTasks(1000);
```

**Why use these:**
- `setBulkInsertEnabled`: Dramatically improve deployment and history write performance
- `setMaxNrOfStatementsInBulkInsert`: Balance between performance and transaction size
- `setBatchSizeProcessInstances`: Optimize bulk process instance queries
- `setBatchSizeTasks`: Optimize bulk task queries

### Performance Settings

```java
// Configure performance settings object
PerformanceSettings settings = new PerformanceSettings();
settings.setEnableVerboseExecutionTreeLogging(false);
settings.setEnableEagerExecutionTreeFetching(true);
settings.setEnableExecutionRelationshipCounts(true);
config.setPerformanceSettings(settings);

// Individual performance flags
config.setEnableVerboseExecutionTreeLogging(false);  // Reduce log verbosity
config.setEnableEagerExecutionTreeFetching(true);     // Pre-fetch execution tree
config.setEnableExecutionRelationshipCounts(true);    // Cache relationship counts
```

**Why use these:**
- `setPerformanceSettings`: Centralized performance configuration
- `setEnableVerboseExecutionTreeLogging`: Reduce logging overhead in production
- `setEnableEagerExecutionTreeFetching`: Improve query performance by pre-loading data
- `setEnableExecutionRelationshipCounts`: Speed up execution tree navigation

### Database Optimization

```java
// Use relational database flag
config.setUsingRelationalDatabase(true);

// Enable database event logging
config.setEnableDatabaseEventLogging(true);

// Rollback deployment on error
config.setRollbackDeployment(true);
```

**Why use these:**
- `setUsingRelationalDatabase`: Optimize for RDBMS vs. other storage
- `setEnableDatabaseEventLogging`: Track database operations for debugging
- `setRollbackDeployment`: Ensure atomic deployments

---

## Query Limits

### Execution and Task Query Limits

```java
// Limit execution queries to prevent memory issues
config.setExecutionQueryLimit(1000);

// Limit task queries
config.setTaskQueryLimit(1000);

// Limit historic task queries
config.setHistoricTaskQueryLimit(1000);

// Limit historic process instance queries
config.setHistoricProcessInstancesQueryLimit(1000);
```

**Why use these:**
- `setExecutionQueryLimit`: Prevent runaway queries from consuming memory
- `setTaskQueryLimit`: Limit task list size in user interfaces
- `setHistoricTaskQueryLimit`: Control history query result sizes
- `setHistoricProcessInstancesQueryLimit`: Prevent large history dumps

**Security Note:** These limits protect against DoS attacks and accidental large queries.

---

## Event Configuration

### Event Dispatcher

```java
// Enable event dispatcher
config.setEnableEventDispatcher(true);

// Set custom event dispatcher
config.setEventDispatcher(new CustomActivitiEventDispatcher());

// Register event listeners
List<ActivitiEventListener> listeners = Arrays.asList(
    new ProcessStartedEventListener(),
    new TaskCompletedEventListener()
);
config.setEventListeners(listeners);

// Register typed listeners
Map<String, List<ActivitiEventListener>> typedListeners = new HashMap<>();
typedListeners.put("process-started", Arrays.asList(new ProcessStartedListener()));
config.setTypedEventListeners(typedListeners);
```

**Why use these:**
- `setEnableEventDispatcher`: Enable event publishing for monitoring and integration
- `setEventDispatcher`: Replace default dispatcher with custom implementation
- `setEventListeners`: Register global event listeners for all event types
- `setTypedEventListeners`: Register listeners for specific event types

### Event Handlers

```java
// Configure event handlers
Map<String, EventHandler> eventHandlers = new HashMap<>();
eventHandlers.put("customEvent", new CustomEventHandler());
config.setEventHandlers(eventHandlers);

// Add custom event handlers
List<EventHandler> customHandlers = Arrays.asList(new CustomEventHandler());
config.setCustomEventHandlers(customHandlers);
```

**Why use these:**
- `setEventHandlers`: Map event types to handler implementations
- `setCustomEventHandlers`: Extend event handling capabilities

---

## Custom Components

### Command Interceptors

```java
// Set custom command interceptors
List<CommandInterceptor> interceptors = Arrays.asList(
    new LoggingInterceptor(),
    new MetricsInterceptor(),
    new AuditInterceptor()
);
config.setCommandInterceptors(interceptors);

// Pre-command interceptors (before execution)
config.setCustomPreCommandInterceptors(Arrays.asList(new PreExecutionInterceptor()));

// Post-command interceptors (after execution)
config.setCustomPostCommandInterceptors(Arrays.asList(new PostExecutionInterceptor()));

// Set default command configuration
config.setDefaultCommandConfig(new CommandConfig());

// Set schema command configuration
config.setSchemaCommandConfig(new CommandConfig());
```

**Why use these:**
- `setCommandInterceptors`: Wrap all engine commands with cross-cutting concerns
- `setCustomPreCommandInterceptors`: Execute logic before commands (validation, auth)
- `setCustomPostCommandInterceptors`: Execute logic after commands (logging, metrics)
- `setDefaultCommandConfig`: Configure default command execution behavior
- `setSchemaCommandConfig`: Configure schema operation commands separately

### Deployers

```java
// Configure deployers
List<Deployer> deployers = Arrays.asList(
    new BpmnDeployer(),
    new DmnDeployer(),
    new CmmnDeployer()
);
config.setDeployers(deployers);

// Pre-deployers (run before main deployers)
config.setCustomPreDeployers(Arrays.asList(new ValidationDeployer()));

// Post-deployers (run after main deployers)
config.setCustomPostDeployers(Arrays.asList(new NotificationDeployer()));

// Set custom BPMN deployer
config.setBpmnDeployer(new CustomBpmnDeployer());

// Set BPMN deployment helper
config.setBpmnDeploymentHelper(new CustomBpmnDeploymentHelper());
```

**Why use these:**
- `setDeployers`: Control what file types can be deployed
- `setCustomPreDeployers`: Validate or transform deployments before processing
- `setCustomPostDeployers`: Trigger actions after successful deployment
- `setBpmnDeployer`: Customize BPMN deployment behavior
- `setBpmnDeploymentHelper`: Assist with deployment metadata and processing

### Session Factories

```java
// Configure session factories
Map<Class<?>, SessionFactory> sessionFactories = new HashMap<>();
sessionFactories.put(ProcessDefinition.class, new CustomProcessDefinitionSessionFactory());
config.setSessionFactories(sessionFactories);

// Add custom session factories
List<SessionFactory> customFactories = Arrays.asList(new CustomSessionFactory());
config.setCustomSessionFactories(customFactories);

// Set SQL session factory
config.setSqlSessionFactory(new CustomSqlSessionFactory());

// Set database SQL session factory
config.setDbSqlSessionFactory(new CustomDbSqlSessionFactory());
```

**Why use these:**
- `setSessionFactories`: Map entity types to custom session factories
- `setCustomSessionFactories`: Add additional session factories
- `setSqlSessionFactory`: Customize SQL execution
- `setDbSqlSessionFactory`: Customize database-specific SQL

### Data Managers and Entity Managers

```java
// Configure data managers (repository layer)
config.setProcessDefinitionDataManager(new CustomProcessDefinitionDataManager());
config.setExecutionDataManager(new CustomExecutionDataManager());
config.setTaskDataManager(new CustomTaskDataManager());
config.setJobDataManager(new CustomJobDataManager());
config.setHistoryManager(new CustomHistoryManager());
config.setJobManager(new CustomJobManager());

// Configure entity managers (ORM layer)
config.setProcessDefinitionEntityManager(new CustomProcessDefinitionEntityManager());
config.setExecutionEntityManager(new CustomExecutionEntityManager());
config.setTaskEntityManager(new CustomTaskEntityManager());
config.setJobEntityManager(new CustomJobEntityManager());
```

**Why use these:**
- Data managers: Control how entities are loaded and saved to database
- Entity managers: Control ORM-level entity management
- Custom implementations: Support alternative storage or add caching

### Parsers and Validators

```java
// Set custom BPMN parser
config.setBpmnParser(new CustomBpmnParser());

// Set BPMN parse factory
config.setBpmnParseFactory(new CustomBpmnParseFactory());

// Pre-parse handlers
config.setPreBpmnParseHandlers(Arrays.asList(new CustomPreParseHandler()));

// Custom default parse handlers
config.setCustomDefaultBpmnParseHandlers(Arrays.asList(new CustomParseHandler()));

// Post-parse handlers
config.setPostBpmnParseHandlers(Arrays.asList(new CustomPostParseHandler()));

// Set process validator
config.setProcessValidator(new CustomProcessValidator());

// Enable safe BPMN XML parsing
config.setEnableSafeBpmnXml(true);
```

**Why use these:**
- `setBpmnParser`: Customize BPMN XML parsing behavior
- `setBpmnParseFactory`: Control how parsers are created
- Parse handlers: Transform or validate BPMN at different parsing stages
- `setProcessValidator`: Implement custom validation rules
- `setEnableSafeBpmnXml`: Prevent XML external entity attacks

### Expression and Scripting

```java
// Set expression manager
config.setExpressionManager(new CustomExpressionManager());

// Set scripting engines
config.setScriptingEngines(new CustomScriptingEngines());

// Add custom scripting engine classes
config.setCustomScriptingEngineClasses(Arrays.asList("com.example.MyScriptEngine"));

// Set business calendar manager
config.setBusinessCalendarManager(new CustomBusinessCalendarManager());

// Configure delegate expression injection
config.setDelegateExpressionFieldInjectionMode(DelegateExpressionFieldInjectionMode.SETTER);
```

**Why use these:**
- `setExpressionManager`: Customize expression evaluation (EL, SpEL)
- `setScriptingEngines`: Support additional scripting languages
- `setCustomScriptingEngineClasses`: Register custom script engines
- `setBusinessCalendarManager`: Implement custom business time calculations
- `setDelegateExpressionFieldInjectionMode`: Control how delegates are injected

### Beans and Resolvers

```java
// Register beans for expression resolution
Map<Object, Object> beans = new HashMap<>();
beans.put("myService", new MyService());
config.setBeans(beans);

// Configure resolver factories
List<ResolverFactory> resolverFactories = Arrays.asList(new CustomResolverFactory());
config.setResolverFactories(resolverFactories);

// Add custom function providers
List<CustomFunctionProvider> functionProviders = Arrays.asList(new MathFunctionProvider());
config.setCustomFunctionProviders(functionProviders);
```

**Why use these:**
- `setBeans`: Make services available in expressions and delegates
- `setResolverFactories`: Customize how variables and expressions are resolved
- `setCustomFunctionProvider`: Add custom functions to expressions

### Variable Types and Serialization

```java
// Configure variable types
config.setVariableTypes(new CustomVariableTypes());

// Add custom pre-variable types
config.setCustomPreVariableTypes(Arrays.asList(new CustomVariableType()));

// Add custom post-variable types
config.setCustomPostVariableTypes(Arrays.asList(new CustomVariableType()));

// Serialization settings
config.setSerializePOJOsInVariablesToJson(true);
config.setSerializableVariableTypeTrackDeserializedObjects(false);
config.setJavaClassFieldForJackson("className");

// Set custom ObjectMapper
config.setObjectMapper(new CustomObjectMapper());

// Configure max length for string variables
config.setMaxLengthStringVariableType(4000);
```

**Why use these:**
- `setVariableTypes`: Control how variables are stored and retrieved
- Custom variable types: Support custom Java types in process variables
- `setSerializePOJOsInVariablesToJson`: Store objects as JSON for portability
- `setSerializableVariableTypeTrackDeserializedObjects`: Track deserialization for security
- `setJavaClassFieldForJackson`: Customize JSON class type field name
- `setObjectMapper`: Configure JSON serialization behavior
- `setMaxLengthStringVariableType`: Prevent oversized string variables

### Failed Job Handling

```java
// Configure failed job command factory
config.setFailedJobCommandFactory(new CustomFailedJobCommandFactory());
```

**Why use this:**
- `setFailedJobCommandFactory`: Customize how failed jobs are handled and retried

### ID Generation

```java
// Set custom ID generator
config.setIdGenerator(new CustomIdGenerator());

// Configure ID generator data source
config.setIdGeneratorDataSource(idGeneratorDataSource);
config.setIdGeneratorDataSourceJndiName("java:/idgenerator");

// Set ID block size
config.setIdBlockSize(50000);
```

**Why use these:**
- `setIdGenerator`: Implement custom ID generation strategy
- `setIdGeneratorDataSource`: Use separate database for ID generation
- `setIdBlockSize`: Control ID allocation batch size for performance

### Process Instance and Listener Helpers

```java
// Set process instance helper
config.setProcessInstanceHelper(new CustomProcessInstanceHelper());

// Set listener notification helper
config.setListenerNotificationHelper(new CustomListenerNotificationHelper());

// Set listener factory
config.setListenerFactory(new CustomListenerFactory());

// Set delegate interceptor
config.setDelegateInterceptor(new CustomDelegateInterceptor());
```

**Why use these:**
- `setProcessInstanceHelper`: Customize process instance creation and management
- `setListenerNotificationHelper`: Control how listeners are notified
- `setListenerFactory`: Customize listener creation
- `setDelegateInterceptor`: Intercept delegate execution

### Activity Behavior

```java
// Set activity behavior factory
config.setActivityBehaviorFactory(new CustomActivityBehaviorFactory());
```

**Why use this:**
- `setActivityBehaviorFactory`: Customize how BPMN activities execute

### Transaction Management

```java
// Set transaction factory
config.setTransactionFactory(new CustomTransactionFactory());

// Set command context factory
config.setCommandContextFactory(new CustomCommandContextFactory());

// Set transaction context factory
config.setTransactionContextFactory(new CustomTransactionContextFactory());

// Configure external transaction management
config.setTransactionsExternallyManaged(true);
```

**Why use these:**
- `setTransactionFactory`: Customize transaction creation and management
- `setCommandContextFactory`: Control command execution context
- `setTransactionContextFactory`: Manage transaction context propagation
- `setTransactionsExternallyManaged`: Integrate with external transaction managers (JTA)

### Process Engine Lifecycle

```java
// Set process engine lifecycle listener
config.setProcessEngineLifecycleListener(new CustomLifecycleListener());

// Set class loader
config.setClassLoader(Thread.currentThread().getContextClassLoader());

// Use Class.forName for class loading
config.setUseClassForNameClassLoading(true);

// Set XML encoding
config.setXmlEncoding("UTF-8");

// Copy variables to local for tasks
config.setCopyVariablesToLocalForTasks(true);

// Set engine agenda factory
config.setEngineAgendaFactory(new CustomEngineAgendaFactory());
```

**Why use these:**
- `setProcessEngineLifecycleListener`: Hook into engine startup/shutdown
- `setClassLoader`: Control class loading for delegates and expressions
- `setUseClassForNameClassLoading`: Use reflection for class loading
- `setXmlEncoding`: Specify BPMN file encoding
- `setCopyVariablesToLocalForTasks`: Isolate task variables from process variables
- `setEngineAgendaFactory`: Customize agenda execution

### Mail Server Configuration

```java
// Configure mail server
config.setMailServerHost("smtp.example.com");
config.setMailServerPort(587);
config.setMailServerUsername("notifications");
config.setMailServerPassword("password");
config.setMailServerUseSSL(false);
config.setMailServerUseTLS(true);
config.setMailServerDefaultFrom("noreply@example.com");

// Configure multiple mail servers per tenant
Map<String, MailServerInfo> mailServers = new HashMap<>();
mailServers.put("tenant1", new MailServerInfo("smtp1.example.com", 587));
config.setMailServers(mailServers);

// Configure mail sessions via JNDI
Map<String, String> mailSessionsJndi = new HashMap<>();
mailSessionsJndi.put("tenant1", "java:/Mail/tenant1");
config.setMailSessionsJndi(mailSessionsJndi);

// Set mail session JNDI name
config.setMailSessionJndi("java:/Mail");
```

**Why use these:**
- Mail server settings: Configure email notifications for tasks and events
- Multiple mail servers: Support tenant-specific email configurations
- JNDI mail sessions: Integrate with application server mail resources

### MyBatis Configuration

```java
// Set custom MyBatis mappers
Set<Class<?>> customMappers = new HashSet<>();
customMappers.add(CustomMapper.class);
config.setCustomMybatisMappers(customMappers);

// Set custom MyBatis XML mappers
Set<String> customXmlMappers = new HashSet<>();
customXmlMappers.add("mapper/custom-mapper.xml");
config.setCustomMybatisXMLMappers(customXmlMappers);
```

**Why use these:**
- `setCustomMybatisMappers`: Add custom MyBatis mapper interfaces
- `setCustomMybatisXMLMappers`: Add custom MyBatis XML mapper files

### Configurers

```java
// Enable configurator service loader
config.setEnableConfiguratorServiceLoader(true);

// Set custom configurators
List<ProcessEngineConfigurator> configurators = Arrays.asList(new CustomConfigurator());
config.setConfigurators(configurators);
```

**Why use these:**
- `setEnableConfiguratorServiceLoader`: Auto-discover configurators via ServiceLoader
- `setConfigurators`: Apply custom configuration after engine initialization

### Timer and Event Subscription

```java
// Set custom timer manager
config.setTimerManager(new CustomTimerManager());

// Set custom event subscription manager
config.setEventSubscriptionManager(new CustomEventSubscriptionManager());

// Set caching and artifacts manager
config.setCachingAndArtifactsManager(new CustomCachingAndArtifactsManager());
```

**Why use these:**
- `setTimerManager`: Customize timer job handling
- `setEventSubscriptionManager`: Control event subscription processing
- `setCachingAndArtifactsManager`: Manage deployment artifacts and caching

### Web Services

```java
// Set WS sync factory class name
config.setWsSyncFactoryClassName("com.example.CustomWSSyncFactory");

// Override WS endpoint addresses
Map<QName, URL> overriddenEndpoints = new HashMap<>();
overriddenEndpoints.put(new QName("http://example.com", "service"), 
    new URL("http://test.example.com/service"));
config.setWsOverridenEndpointAddresses(overriddenEndpoints);

// Set default Camel context
config.setDefaultCamelContext("camelContext");
```

**Why use these:**
- `setWsSyncFactoryClassName`: Customize web service synchronization
- `setWsOverridenEndpointAddresses`: Redirect WS calls for testing
- `setDefaultCamelContext`: Integrate with Apache Camel

---

## Configuration Examples

### Development Configuration

```java
public class DevProcessEngineConfiguration {
    
    public ProcessEngine createEngine() {
        ProcessEngineConfiguration config = 
            ProcessEngineConfiguration.createStandaloneInMemProcessEngineConfiguration();
        
        // H2 in-memory database
        config.setJdbcUrl("jdbc:h2:mem:activiti;DB_CLOSE_DELAY=1000");
        config.setJdbcUsername("sa");
        config.setJdbcPassword("");
        config.setJdbcDriver("org.h2.Driver");
        
        // Auto-update schema
        config.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);
        
        // Full history for debugging
        config.setHistoryLevel(HistoryLevel.FULL);
        
        // Enable job executor
        config.setAsyncExecutorActivate(true);
        
        // Enable events for monitoring
        config.setEnableEventDispatcher(true);
        
        // Bulk insert for performance
        config.setBulkInsertEnabled(true);
        
        return config.buildProcessEngine();
    }
}
```

### Production Configuration

```java
public class ProdProcessEngineConfiguration {
    
    @Autowired
    private DataSource dataSource;
    
    @Value("${activiti.history-level:AUDIT}")
    private String historyLevel;
    
    @Value("${activiti.async-executor-activate:true}")
    private boolean asyncExecutorActivate;
    
    @Value("${activiti.query-limit:1000}")
    private int queryLimit;
    
    public ProcessEngine createEngine() {
        ProcessEngineConfiguration config = 
            ProcessEngineConfiguration.createSpringProcessEngineConfiguration();
        
        // External database with connection pool
        config.setDataSource(dataSource);
        
        // No auto schema update - use Flyway/Liquibase
        config.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_FALSE);
        
        // Configured history level
        config.setHistoryLevel(HistoryLevel.valueOf(historyLevel));
        
        // Async executor with tuned thread pool
        config.setAsyncExecutorActivate(asyncExecutorActivate);
        config.setAsyncExecutorCorePoolSize(10);
        config.setAsyncExecutorMaxPoolSize(20);
        config.setAsyncExecutorThreadPoolQueueSize(1000);
        
        // Query limits for security
        config.setExecutionQueryLimit(queryLimit);
        config.setTaskQueryLimit(queryLimit);
        config.setHistoricTaskQueryLimit(queryLimit);
        config.setHistoricProcessInstancesQueryLimit(queryLimit);
        
        // Performance optimizations
        config.setBulkInsertEnabled(true);
        config.setMaxNrOfStatementsInBulkInsert(1000);
        config.setEnableProcessDefinitionInfoCache(true);
        config.setProcessDefinitionCacheLimit(1000);
        
        // Event dispatcher for monitoring
        config.setEnableEventDispatcher(true);
        
        // External transaction management
        config.setTransactionsExternallyManaged(true);
        
        return config.buildProcessEngine();
    }
}
```

### Spring Boot Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/activiti
    username: ${DB_USER:activiti}
    password: ${DB_PASSWORD:activiti}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

activiti:
  database-schema-update: false
  history-level: AUDIT
  async-executor-activate: true
  async-executor-core-pool-size: 10
  async-executor-max-pool-size: 20
  async-executor-queue-size: 1000
  execution-query-limit: 1000
  task-query-limit: 1000
  historic-task-query-limit: 1000
  bulk-insert-enabled: true
  max-statements-in-bulk-insert: 1000
  process-definition-cache-limit: 1000
  enable-event-dispatcher: true
  transactions-externally-managed: true
```

```java
@Configuration
public class ActivitiConfiguration {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration(
            DataSource dataSource,
            ActivitiProperties properties) {
        
        ProcessEngineConfiguration config = 
            ProcessEngineConfiguration.createSpringProcessEngineConfiguration();
        
        // Database
        config.setDataSource(dataSource);
        config.setDatabaseSchemaUpdate(
            ProcessEngineConfiguration.DB_SCHEMA_UPDATE_FALSE);
        config.setHistoryLevel(HistoryLevel.valueOf(properties.getHistoryLevel()));
        
        // Async executor
        config.setAsyncExecutorActivate(properties.isAsyncExecutorActivate());
        config.setAsyncExecutorCorePoolSize(properties.getAsyncExecutorCorePoolSize());
        config.setAsyncExecutorMaxPoolSize(properties.getAsyncExecutorMaxPoolSize());
        config.setAsyncExecutorThreadPoolQueueSize(properties.getAsyncExecutorQueueSize());
        
        // Query limits
        config.setExecutionQueryLimit(properties.getExecutionQueryLimit());
        config.setTaskQueryLimit(properties.getTaskQueryLimit());
        config.setHistoricTaskQueryLimit(properties.getHistoricTaskQueryLimit());
        
        // Performance
        config.setBulkInsertEnabled(properties.isBulkInsertEnabled());
        config.setMaxNrOfStatementsInBulkInsert(
            properties.getMaxStatementsInBulkInsert());
        config.setProcessDefinitionCacheLimit(
            properties.getProcessDefinitionCacheLimit());
        
        // Events
        config.setEnableEventDispatcher(properties.isEnableEventDispatcher());
        
        // Transactions
        config.setTransactionsExternallyManaged(
            properties.isTransactionsExternallyManaged());
        
        return config;
    }
}
```

### Testing Configuration

```java
@TestConfiguration
public class TestActivitiConfig {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration() {
        ProcessEngineConfiguration config = 
            ProcessEngineConfiguration.createStandaloneInMemProcessEngineConfiguration();
        
        config.setJdbcUrl("jdbc:h2:mem:test;DB_CLOSE_DELAY=-1");
        config.setJdbcUsername("sa");
        config.setJdbcPassword("");
        config.setJdbcDriver("org.h2.Driver");
        
        // Fresh schema for each test
        config.setDatabaseSchemaUpdate(
            ProcessEngineConfiguration.DB_SCHEMA_UPDATE_CREATE_DROP);
        
        // No history for faster tests
        config.setHistoryLevel(HistoryLevel.NONE);
        
        // Disable job executor in tests
        config.setAsyncExecutorActivate(false);
        
        // Fixed clock for deterministic tests
        config.setClock(new FixedClock(Date.from(
            Instant.parse("2024-01-01T00:00:00Z"))));
        
        // Disable events for performance
        config.setEnableEventDispatcher(false);
        
        return config;
    }
}
```

### High-Performance Configuration

```java
public class HighPerformanceConfiguration {
    
    public ProcessEngine createEngine(DataSource dataSource) {
        ProcessEngineConfiguration config = new ProcessEngineConfigurationImpl();
        
        // Database
        config.setDataSource(dataSource);
        config.setDatabaseSchemaUpdate(DB_SCHEMA_UPDATE_FALSE);
        config.setHistoryLevel(HistoryLevel.ACTIVITY);  // Minimal history
        
        // Async executor - sized for CPU cores
        int cores = Runtime.getRuntime().availableProcessors();
        config.setAsyncExecutorActivate(true);
        config.setAsyncExecutorCorePoolSize(cores * 2);
        config.setAsyncExecutorMaxPoolSize(cores * 4);
        config.setAsyncExecutorThreadPoolQueueSize(10000);
        config.setAsyncExecutorThreadKeepAliveTime(30L);
        
        // Caching
        config.setEnableProcessDefinitionInfoCache(true);
        config.setProcessDefinitionCacheLimit(5000);
        config.setKnowledgeBaseCacheLimit(500);
        
        // Batch operations
        config.setBulkInsertEnabled(true);
        config.setMaxNrOfStatementsInBulkInsert(5000);
        config.setBatchSizeProcessInstances(5000);
        config.setBatchSizeTasks(5000);
        
        // Performance settings
        PerformanceSettings settings = new PerformanceSettings();
        settings.setEnableVerboseExecutionTreeLogging(false);
        settings.setEnableEagerExecutionTreeFetching(true);
        settings.setEnableExecutionRelationshipCounts(true);
        config.setPerformanceSettings(settings);
        
        // Query limits
        config.setExecutionQueryLimit(5000);
        config.setTaskQueryLimit(5000);
        
        // Disable non-essential features
        config.setEnableEventDispatcher(false);
        config.setEnableDatabaseEventLogging(false);
        
        // Serialization
        config.setSerializePOJOsInVariablesToJson(true);
        
        return config.buildProcessEngine();
    }
}
```

---

## Best Practices

### 1. Use Environment-Specific Configuration

```java
@Profile("development")
@Configuration
public class DevConfig {
    // Auto schema update, full history, events enabled
}

@Profile("production")
@Configuration
public class ProdConfig {
    // No auto schema update, audit history, query limits
}
```

**Why:** Different environments have different requirements for safety, performance, and debugging.

### 2. Externalize Configuration

```yaml
# Use environment variables and configuration files
activiti:
  jdbc-url: ${DB_URL}
  jdbc-username: ${DB_USER}
  jdbc-password: ${DB_PASSWORD}
  history-level: ${HISTORY_LEVEL:AUDIT}
```

**Why:** Avoid hardcoding sensitive values and enable environment-specific tuning.

### 3. Set Query Limits

```java
config.setExecutionQueryLimit(1000);
config.setTaskQueryLimit(1000);
```

**Why:** Prevent memory exhaustion from large queries and protect against DoS attacks.

### 4. Tune Async Executor for Workload

```java
// CPU-bound workloads
config.setAsyncExecutorCorePoolSize(cores);
config.setAsyncExecutorMaxPoolSize(cores * 2);

// I/O-bound workloads
config.setAsyncExecutorCorePoolSize(cores * 2);
config.setAsyncExecutorMaxPoolSize(cores * 4);
```

**Why:** Match thread pool size to workload characteristics for optimal performance.

### 5. Use Connection Pooling

```java
config.setDataSource(hikariDataSource);  // Not JDBC URL
```

**Why:** Connection pools provide better performance, monitoring, and resource management.

### 6. Enable Bulk Operations

```java
config.setBulkInsertEnabled(true);
config.setMaxNrOfStatementsInBulkInsert(1000);
```

**Why:** Dramatically improves deployment and history write performance.

### 7. Configure Appropriate History Level

```java
// Production: AUDIT for compliance
config.setHistoryLevel(HistoryLevel.AUDIT);

// High-volume: ACTIVITY or NONE
config.setHistoryLevel(HistoryLevel.ACTIVITY);

// Testing: NONE
config.setHistoryLevel(HistoryLevel.NONE);
```

**Why:** Balance between audit requirements and performance/storage costs.

### 8. Use Command Interceptors for Cross-Cutting Concerns

```java
config.setCustomPreCommandInterceptors(Arrays.asList(
    new LoggingInterceptor(),
    new MetricsInterceptor()
));
```

**Why:** Centralize logging, metrics, and monitoring without modifying business logic.

### 9. Validate Configuration at Startup

```java
@PostConstruct
public void validateConfig() {
    Assert.notNull(config.getDataSource(), "DataSource is required");
    Assert.isTrue(config.getHistoryLevel() != null, "History level is required");
}
```

**Why:** Fail fast with clear error messages instead of runtime failures.

### 10. Monitor Configuration Effectiveness

```java
log.info("Engine configured: history={}, async={}, query-limit={}",
    config.getHistoryLevel(),
    config.isAsyncExecutorActivate(),
    config.getExecutionQueryLimit());
```

**Why:** Verify configuration was applied correctly and track changes over time.

---

## See Also

- [Parent Documentation](README.md)
- [Engine Architecture](engine-architecture.md)
- [BPMN Execution](./engine-configuration.md)
- [Best Practices](../../best-practices/overview.md)
