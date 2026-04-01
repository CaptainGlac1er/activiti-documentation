---
sidebar_label: Spring Boot Starter
slug: /activiti-core/spring-boot-starter
description: Seamless integration of Activiti workflow engine with Spring Boot applications with auto-configuration and production-ready features.
---

# Activiti Spring Boot Starter Module - Technical Documentation

**Module:** `activiti-core/activiti-spring-boot-starter`

**Target Audience:** Senior Software Engineers, DevOps Engineers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Auto-Configuration](#auto-configuration)
- [Properties Reference](#properties-reference)
- [Quick Start](#quick-start)
- [Advanced Configuration](#advanced-configuration)
- [Customization](#customization)
- [Production Deployment](#production-deployment)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-spring-boot-starter** module provides seamless integration of Activiti workflow engine with Spring Boot applications. It offers auto-configuration, property binding, and production-ready features out of the box.

### Key Features

- **Auto-Configuration**: Zero-configuration startup
- **Property Binding**: Externalized configuration
- **Actuator Integration**: Health checks and metrics
- **Profile Support**: Environment-specific configs
- **Conditional Beans**: Smart bean registration
- **Lifecycle Management**: Proper startup/shutdown

### Module Structure

```
activiti-spring-boot-starter/
├── src/main/java/org/activiti/spring/boot/
│   ├── ActivitiAutoConfiguration.java
│   ├── ActivitiProperties.java
│   ├── actuator/
│   │   ├── ActivitiHealthIndicator.java
│   │   └── ActivitiMetrics.java
│   └── condition/
│       ├── OnActivitiCondition.java
│       └── OnProfileCondition.java
├── src/main/resources/
│   ├── META-INF/
│   │   └── spring.factories
│   └── application-activiti.yml
└── pom.xml
```

---

## Architecture

### Auto-Configuration Flow

```
Application Startup
       │
       ▼
┌─────────────────┐
│ Spring Boot     │
│ Context         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auto            │
│ Configuration   │
│ Scanner         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Activiti        │
│ AutoConfig      │
└────────┬────────┘
         │
         ├───────────┐
         │           │
         ▼           ▼
┌─────────────┐ ┌─────────────┐
│ Process     │ │ Activiti    │
│ Engine      │ │ Properties  │
└─────────────┘ └─────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Spring Boot Application                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ActivitiAutoConfiguration                │   │
│  │                                                       │   │
│  │  @ConditionalOnClass(ProcessEngine.class)            │   │
│  │  @ConditionalOnProperty(activiti.enabled)            │   │
│  │                                                       │   │
│  │  Beans:                                              │   │
│  │  - ProcessEngine                                     │   │
│  │  - RuntimeService                                    │   │
│  │  - TaskService                                       │   │
│  │  - RepositoryService                                 │   │
│  │  - HistoryService                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                ActivitiProperties                     │   │
│  │                                                       │   │
│  │  @ConfigurationProperties(activiti)                  │   │
│  │                                                       │   │
│  │  Properties:                                         │   │
│  │  - database-schema-update                            │   │
│  │  - history-level                                     │   │
│  │  - async-executor-activate                           │   │
│  │  - job-executor-threads                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Auto-Configuration

### Main Auto-Configuration Class

```java
@Configuration
@ConditionalOnClass(ProcessEngine.class)
@ConditionalOnProperty(prefix = "activiti", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(ActivitiProperties.class)
public class ActivitiAutoConfiguration {
    
    @Autowired
    private ActivitiProperties properties;
    
    @Autowired(required = false)
    private DataSource dataSource;
    
    @Autowired(required = false)
    private PlatformTransactionManager transactionManager;
    
    @Bean
    @ConditionalOnMissingBean
    public ProcessEngine processEngine() {
        SpringProcessEngineConfiguration cfg = 
            new SpringProcessEngineConfiguration();
        
        // Apply properties
        configureEngine(cfg);
        
        return cfg.buildProcessEngine();
    }
    
    private void configureEngine(SpringProcessEngineConfiguration cfg) {
        if (dataSource != null) {
            cfg.setDataSource(dataSource);
        }
        if (transactionManager != null) {
            cfg.setTransactionManager(transactionManager);
        }
        
        cfg.setDatabaseSchemaUpdate(properties.getDatabaseSchemaUpdate());
        cfg.setHistoryLevel(properties.getHistoryLevel());
        cfg.setAsyncExecutorActivate(properties.isAsyncExecutorActivate());
        cfg.setJobExecutorThreads(properties.getJobExecutorThreads());
        
        // More configuration...
    }
    
    @Bean
    @ConditionalOnMissingBean
    public RuntimeService runtimeService(ProcessEngine processEngine) {
        return processEngine.getRuntimeService();
    }
    
    @Bean
    @ConditionalOnMissingBean
    public TaskService taskService(ProcessEngine processEngine) {
        return processEngine.getTaskService();
    }
    
    @Bean
    @ConditionalOnMissingBean
    public RepositoryService repositoryService(ProcessEngine processEngine) {
        return processEngine.getRepositoryService();
    }
    
    @Bean
    @ConditionalOnMissingBean
    public HistoryService historyService(ProcessEngine processEngine) {
        return processEngine.getHistoryService();
    }
}
```

### Conditional Configuration

```java
@Configuration
@ConditionalOnProperty(name = "activiti.async-executor-activate", havingValue = "true")
public class AsyncExecutorConfiguration {
    
    @Bean
    public JobExecutor jobExecutor(ProcessEngineConfiguration cfg) {
        JobExecutor executor = new JobExecutor(cfg);
        executor.setCorePoolSize(cfg.getJobExecutorThreads());
        return executor;
    }
}

@Configuration
@ConditionalOnProperty(name = "activiti.history-level", havingValue = "full")
public class FullHistoryConfiguration {
    
    @Bean
    public HistoryService historyService(ProcessEngine processEngine) {
        // Enhanced history service
        return processEngine.getHistoryService();
    }
}
```

---

## Properties Reference

### Core Properties

```yaml
activiti:
  # Enable/disable auto-configuration
  enabled: true
  
  # Database schema management
  database-schema-update: true  # Options: true, false, create-drop, create, update
  
  # History level
  history-level: full  # Options: none, activity, audit, full
  
  # Async execution
  async-executor-activate: true
  
  # Job executor configuration
  job-executor-threads: 10
  job-executor-acquisition-retries: 3
  job-executor-acquisition-retry-time-window: 5000
  job-acquisition-batch-size: 10
```

### Advanced Properties

```yaml
activiti:
  # Process engine configuration
  process-engine-name: default
  
  # Mail server configuration
  mail-server-info:
    host: smtp.example.com
    port: 587
    user: smtp-user
    password: smtp-password
    default-from-address: no-reply@example.com
  
  # Form configuration
  form:
    enabled: true
    default-form-handler: activiti-form-handler
  
  # Task configuration
  task:
    enable-candidate-users: true
    enable-candidate-groups: true
  
  # History configuration
  history:
    enable-process-instance-comments: true
    enable-activity-instance-comments: true
    enable-task-comments: true
  
  # Job configuration
  job:
    enable-job-executor: true
    enable-timer-job-executor: true
    retry-time-limit: 3
```

### Multi-tenancy Properties

```yaml
activiti:
  multi-tenancy:
    enabled: true
    strategy: database  # Options: database, schema, table
    
  tenant:
    default-tenant-id: default
    property-prefix: tenant_
```

### Security Properties

```yaml
activiti:
  security:
    enabled: true
    authorization-enabled: true
    permission-enabled: true
    
  basic-auth:
    enabled: false
    username: admin
    password: admin
```

---

## Quick Start

### 1. Add Dependency

**Maven:**
```xml
<dependency>
    <groupId>org.activiti</groupId>
    <artifactId>activiti-spring-boot-starter</artifactId>
    <version>8.7.2-SNAPSHOT</version>
</dependency>
```

**Gradle:**
```groovy
implementation 'org.activiti:activiti-spring-boot-starter:8.7.2-SNAPSHOT'
```

### 2. Create Application

```java
@SpringBootApplication
public class ActivitiApplication {
    public static void main(String[] args) {
        SpringApplication.run(ActivitiApplication.class, args);
    }
}
```

### 3. Configure application.yml

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/activiti
    username: postgres
    password: password
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update

activiti:
  database-schema-update: true
  history-level: full
  async-executor-activate: true
```

### 4. Use Services

```java
@Service
public class WorkflowService {
    
    @Autowired
    private RuntimeService runtimeService;
    
    @Autowired
    private TaskService taskService;
    
    public void startProcess() {
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey("orderProcess");
    }
    
    public void completeTask(String taskId) {
        taskService.complete(taskId);
    }
}
```

---

## Advanced Configuration

### Custom ProcessEngineConfiguration

```java
@Configuration
public class CustomActivitiConfig {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration(
            ActivitiProperties properties,
            DataSource dataSource) {
        
        SpringProcessEngineConfiguration cfg = 
            new SpringProcessEngineConfiguration();
        
        cfg.setDataSource(dataSource);
        cfg.setDatabaseSchemaUpdate(properties.getDatabaseSchemaUpdate());
        cfg.setHistoryLevel(properties.getHistoryLevel());
        
        // Custom configuration
        cfg.setTaskListener(new CustomTaskListener());
        cfg.setExecutionListener(new CustomExecutionListener());
        
        return cfg;
    }
}
```

### Custom Bean Post-Processor

```java
@Component
public class ActivitiBeanPostProcessor implements BeanPostProcessor {
    
    @Override
    public Object postProcessAfterInitialization(Object bean, String name) {
        if (bean instanceof ProcessEngine) {
            ProcessEngine engine = (ProcessEngine) bean;
            
            // Customize engine after initialization
            engine.getRuntimeService()
                .addEventListener(new CustomEventListener());
        }
        return bean;
    }
}
```

### Profile-Specific Configuration

```yaml
# application-dev.yml
activiti:
  database-schema-update: create-drop
  history-level: full
  async-executor-activate: true

# application-prod.yml
activiti:
  database-schema-update: false
  history-level: audit
  async-executor-activate: true
  job-executor-threads: 20
```

---

## Customization

### Custom Event Listeners

```java
@Component
public class CustomProcessEventListener implements ProcessEventListener {
    
    @Override
    public void onEvent(ProcessEngineEvent event) {
        if (event.getType() == ProcessEngineEventType.PROCESS_START) {
            log.info("Process started: {}", event.getProcessInstanceId());
        }
    }
}
```

### Custom Job Handlers

```java
@Component
public class CustomJobHandler implements JobHandler {
    
    @Override
    public void execute(Job job) {
        // Custom job execution logic
        String businessKey = job.getExecution()
            .getProcessInstance()
            .getBusinessKey();
        
        // Process the job
    }
}
```

### Custom Form Handlers

```java
@Component
public class CustomFormHandler implements FormHandler {
    
    @Override
    public String getStartFormKey(ProcessDefinition processDefinition) {
        return "custom-start-form";
    }
    
    @Override
    public String getTaskFormKey(Task task) {
        return "custom-task-form";
    }
}
```

---

## Production Deployment

### 1. Database Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db-host:5432/activiti
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### 2. Connection Pool Tuning

```yaml
activiti:
  job-executor-threads: 20
  job-acquisition-batch-size: 50
  async-executor-activate: true
```

### 3. Health Checks

```java
@RestController
@RequestMapping("/actuator/health/activiti")
public class ActivitiHealthController {
    
    @Autowired
    private ProcessEngine processEngine;
    
    @GetMapping
    public Health check() {
        try {
            // Test database connection
            processEngine.getRepositoryService()
                .createProcessDefinitionQuery()
                .listPage(0, 1);
            
            return Health.up().build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

### 4. Metrics Collection

```java
@Configuration
public class MetricsConfig {
    
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> {
            registry.config().commonTags("application", "activiti");
        };
    }
}
```

---

## Monitoring & Observability

### Spring Boot Actuator Integration

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,info
  endpoint:
    health:
      show-details: always
```

### Custom Health Indicator

```java
@Component
public class ActivitiHealthIndicator implements HealthIndicator {
    
    @Autowired
    private ProcessEngine processEngine;
    
    @Override
    public Health health() {
        try {
            // Check engine status
            processEngine.getManagementService()
                .getEngineName();
            
            return Health.up().build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

### Metrics Collection

```java
@Component
public class ActivitiMetrics {
    
    private final MeterRegistry meterRegistry;
    private final Counter processStartCounter;
    private final Counter taskCompleteCounter;
    private final Timer processExecutionTimer;
    
    public ActivitiMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        
        this.processStartCounter = Counter.builder("activiti.process.starts")
            .description("Number of process instances started")
            .register(meterRegistry);
        
        this.taskCompleteCounter = Counter.builder("activiti.task.completions")
            .description("Number of tasks completed")
            .register(meterRegistry);
        
        this.processExecutionTimer = Timer.builder("activiti.process.duration")
            .description("Process execution duration")
            .register(meterRegistry);
    }
    
    public void recordProcessStart() {
        processStartCounter.increment();
    }
    
    public void recordTaskComplete() {
        taskCompleteCounter.increment();
    }
    
    public void recordProcessDuration(Duration duration) {
        processExecutionTimer.record(duration);
    }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Engine Not Starting

**Symptom:** Application fails to start with "Cannot create ProcessEngine"

**Solution:**
```yaml
# Check datasource configuration
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/activiti
    username: postgres
    password: password
```

#### 2. Database Schema Errors

**Symptom:** "Table doesn't exist" errors

**Solution:**
```yaml
activiti:
  database-schema-update: true  # Enable auto-update
```

#### 3. Jobs Not Executing

**Symptom:** Async tasks not running

**Solution:**
```yaml
activiti:
  async-executor-activate: true
  job-executor-threads: 10
```

#### 4. Memory Issues

**Symptom:** OutOfMemoryError

**Solution:**
```yaml
activiti:
  history-level: activity  # Reduce history level
  job-acquisition-batch-size: 10  # Reduce batch size
```

### Debug Mode

```yaml
logging:
  level:
    org.activiti: DEBUG
    org.activiti.engine.impl: DEBUG
```

### Health Check Endpoint

```bash
curl http://localhost:8080/actuator/health/activiti
```

---

## Best Practices

### 1. Use Environment Variables

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
```

### 2. Enable Actuator

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,info,env
```

### 3. Configure Proper History Level

```yaml
# Development
activiti:
  history-level: full

# Production
activiti:
  history-level: audit
```

### 4. Use Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
```

### 5. Monitor Performance

```java
@RestController
@RequestMapping("/metrics/activiti")
public class ActivitiMetricsController {
    
    @Autowired
    private ManagementService managementService;
    
    @GetMapping("/tables")
    public Map<String, Long> getTableCounts() {
        return managementService.getTableCounts();
    }
}
```

---

## API Reference

### Configuration Classes

- `ActivitiAutoConfiguration` - Main auto-config
- `ActivitiProperties` - Property bindings
- `AsyncExecutorConfiguration` - Async config
- `FullHistoryConfiguration` - History config

### Actuator Components

- `ActivitiHealthIndicator` - Health checks
- `ActivitiMetrics` - Metrics collection

### Properties Hierarchy

```
activiti
├── enabled
├── database-schema-update
├── history-level
├── async-executor-activate
├── job-executor-threads
├── process-engine-name
├── mail-server-info
├── form
├── task
├── history
├── job
├── multi-tenancy
└── security
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Spring Integration](../engine-api/spring-integration.md)
- [Engine Documentation](../engine-api/README.md)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
