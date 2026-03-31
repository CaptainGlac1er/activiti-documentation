---
sidebar_label: Core Overview
slug: /activiti-core
description: Technical documentation for the Activiti Core module - the heart of the workflow engine.
---

# Activiti Core Module - Technical Documentation

**Target Audience:** Senior Software Engineers, Architects, Technical Leads

**Version:** 8.7.2-SNAPSHOT

**Last Updated:** 2024

---

## Table of Contents

- [Overview](#overview)
- [Module Architecture](#module-architecture)
- [Submodules](#submodules)
  - [activiti-engine](#activiti-engine)
  - [activiti-spring](#activiti-spring)
  - [activiti-api-impl](#activiti-api-impl)
  - [activiti-bpmn-model](#activiti-bpmn-model)
  - [activiti-bpmn-layout](#activiti-bpmn-layout)
  - [activiti-bpmn-converter](#activiti-bpmn-converter)
  - [activiti-json-converter](#activiti-json-converter)
  - [activiti-image-generator](#activiti-image-generator)
  - [activiti-process-validation](#activiti-process-validation)
  - [activiti-spring-app-process](#activiti-spring-app-process)
  - [activiti-spring-boot-starter](#activiti-spring-boot-starter)
  - [activiti-spring-resource-loader](#activiti-spring-resource-loader)
  - [activiti-spring-conformance-tests](#activiti-spring-conformance-tests)
  - [activiti-spring-process-extensions](#activiti-spring-process-extensions)
- [Dependency Graph](#dependency-graph)
- [Performance Considerations](#performance-considerations)
- [Security Architecture](#security-architecture)
- [Testing Strategy](#testing-strategy)
- [Common Pitfalls](#common-pitfalls)
- [Best Practices](#best-practices)

---

## Overview

The **activiti-core** module is the heart of the Activiti workflow engine. It contains the core engine implementation, BPMN parsing and execution logic, Spring integration, and all essential components required for process automation.

### Key Responsibilities

1. **Process Engine**: Core workflow execution engine
2. **BPMN Support**: Parsing, validation, and execution of BPMN 2.0 processes
3. **Spring Integration**: Seamless integration with Spring Framework
4. **Task Management**: User task creation, assignment, and completion
5. **Event Handling**: Process and task event lifecycle management
6. **History & Audit**: Process instance history tracking
7. **Job Executor**: Asynchronous job processing and timer management

### Design Principles

- **Command Pattern**: All operations executed through commands
- **Transaction Management**: ACID compliance with JTA support
- **Pluggable Architecture**: Extensible through SPI interfaces
- **Multi-tenancy**: Built-in support for multi-tenant deployments
- **Event-Driven**: Rich event system for integration

---

## Module Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      activiti-core                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Core Engine Layer                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  BPMN Model  │  │  BPMN Parser │  │  Process     │  │   │
│  │  │              │  │              │  │  Engine      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Integration Layer                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Spring     │  │  API Impl    │  │  Job         │  │   │
│  │  │  Integration │  │              │  │  Executor    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Support Layer                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  Image Gen   │  │  Validation  │  │  JSON        │  │   │
│  │  │              │  │              │  │  Converter   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Submodules

### activiti-engine

**Location:** `activiti-core/activiti-engine/`

**Purpose:** Core process engine implementation

**Key Components:**
- ProcessEngineConfiguration
- Command Executor
- BPMN Parser
- Activity Behaviors
- Event System
- Job Executor
- History Service

**See:** [activiti-engine/README.md](./activiti-engine/README.md)

---

### activiti-spring

**Location:** `activiti-core/activiti-spring/`

**Purpose:** Spring Framework integration

**Key Components:**
- Spring ProcessEngineConfiguration
- Transaction synchronization
- Bean factory integration
- Expression language support

**See:** [activiti-spring/README.md](./activiti-spring/README.md)

---

### activiti-api-impl

**Location:** `activiti-core/activiti-api-impl/`

**Purpose:** Implementation of Activiti API interfaces

**Key Components:**
- ProcessRuntimeImpl
- TaskRuntimeImpl
- ModelConverter implementations
- Query implementations

**See:** [activiti-api-impl/README.md](./activiti-api-impl/README.md)

---

### activiti-bpmn-model

**Location:** `activiti-core/activiti-bpmn-model/`

**Purpose:** BPMN 2.0 Java object model

**Key Components:**
- BpmnModel
- FlowElement classes
- Data types
- Event definitions

**See:** [activiti-bpmn-model/README.md](./activiti-bpmn-model/README.md)

---

### activiti-bpmn-layout

**Location:** `activiti-core/activiti-bpmn-layout/`

**Purpose:** BPMN diagram layout algorithms

**Key Components:**
- Layout calculators
- Position algorithms
- Diagram optimization

**See:** [activiti-bpmn-layout/README.md](./activiti-bpmn-layout/README.md) ✅ Complete

---

### activiti-bpmn-converter

**Location:** `activiti-core/activiti-bpmn-converter/`

**Purpose:** BPMN XML to Java model conversion

**Key Components:**
- XML importer
- Model builder
- Validation rules

**See:** [activiti-bpmn-converter/README.md](./activiti-bpmn-converter/README.md) ✅ Complete

---

### activiti-json-converter

**Location:** `activiti-core/activiti-json-converter/`

**Purpose:** JSON serialization/deserialization

**Key Components:**
- JSON converters
- Process instance JSON
- Task JSON

**See:** [activiti-json-converter/README.md](./activiti-json-converter/README.md) ✅ Complete

---

### activiti-image-generator

**Location:** `activiti-core/activiti-image-generator/`

**Purpose:** Process diagram image generation

**Key Components:**
- Image renderers
- Style templates
- Highlighting logic

**See:** [activiti-image-generator/README.md](./activiti-image-generator/README.md) ✅ Complete

---

### activiti-process-validation

**Location:** `activiti-core/activiti-process-validation/`

**Purpose:** BPMN process validation

**Key Components:**
- Validation rules
- Error reporting
- Best practice checks

**See:** [activiti-process-validation/README.md](./activiti-process-validation/README.md) ✅ Complete

---

### activiti-spring-app-process

**Location:** `activiti-core/activiti-spring-app-process/`

**Purpose:** Spring application process support

**Key Components:**
- Process application context
- Spring bean integration
- Process deployment

**See:** [activiti-spring-app-process/README.md](./activiti-spring-app-process/README.md) ✅ Complete

---

### activiti-spring-boot-starter

**Location:** `activiti-core/activiti-spring-boot-starter/`

**Purpose:** Spring Boot auto-configuration

**Key Components:**
- Auto-configuration classes
- Property bindings
- Bean definitions

**See:** [activiti-spring-boot-starter/README.md](./activiti-spring-boot-starter/README.md) ✅ Complete

---

### activiti-spring-resource-loader

**Location:** `activiti-core/activiti-spring-resource-loader/`

**Purpose:** Spring resource loading utilities

**Key Components:**
- Resource loaders
- Classpath scanning
- Deployment resources

**See:** [activiti-spring-resource-loader/README.md](./activiti-spring-resource-loader/README.md) ✅ Complete

---

### activiti-spring-conformance-tests

**Location:** `activiti-core/activiti-spring-conformance-tests/`

**Purpose:** BPMN conformance test suite

**Key Components:**
- Test cases
- Conformance validators
- Regression tests

**See:** [activiti-spring-conformance-tests/README.md](./activiti-spring-conformance-tests/README.md) ✅ Complete

---

### activiti-spring-process-extensions

**Location:** `activiti-core/activiti-spring-process-extensions/`

**Purpose:** Process extension mechanisms

**Key Components:**
- Extension points
- Custom behaviors
- Plugin architecture

**See:** [activiti-spring-process-extensions/README.md](./activiti-spring-process-extensions/README.md) ✅ Complete

---

## Dependency Graph

```
activiti-core-dependencies
├── activiti-engine
│   ├── activiti-bpmn-model
│   ├── activiti-bpmn-converter
│   ├── activiti-bpmn-layout
│   ├── activiti-json-converter
│   └── activiti-process-validation
├── activiti-spring
│   └── activiti-engine
├── activiti-api-impl
│   ├── activiti-engine
│   └── activiti-spring
├── activiti-image-generator
│   └── activiti-bpmn-model
├── activiti-spring-app-process
│   └── activiti-spring
├── activiti-spring-boot-starter
│   ├── activiti-spring
│   └── activiti-api-impl
├── activiti-spring-resource-loader
│   └── activiti-spring
├── activiti-spring-conformance-tests
│   └── activiti-spring
└── activiti-spring-process-extensions
    └── activiti-spring
```

---

## Performance Considerations

### Critical Path Optimization

1. **Process Instance Creation**
   - Use connection pooling
   - Minimize database round trips
   - Cache process definitions

2. **Task Completion**
   - Batch variable updates
   - Use async processing where possible
   - Optimize history level

3. **Job Executor**
   - Tune thread pool sizes
   - Configure job acquisition batch size
   - Monitor dead letter queue

### Memory Management

```java
// Configure engine for optimal memory usage
ProcessEngineConfiguration cfg = ProcessEngineConfiguration.createProcessEngineConfigurationFromResource("activiti.cfg.xml");
cfg.setJobExecutorAcquisitionRetries(3);
cfg.setJobExecutorAcquisitionRetryTimeWindow(5000);
cfg.setHistoryLevel(ProcessEngineConfiguration.HISTORY_ACTIVITY);
```

### Database Optimization

- Use appropriate indexes
- Partition history tables
- Configure connection pool
- Enable query caching

---

## Security Architecture

### Authentication & Authorization

```java
// Security configuration
@Configuration
public class SecurityConfig {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration() {
        ProcessEngineConfiguration cfg = new StandaloneProcessEngineConfiguration();
        cfg.setAuthorizationManager(new ActivitiAuthorizationManager());
        cfg.setPermissionManager(new ActivitiPermissionManager());
        return cfg;
    }
}
```

### Multi-tenancy

- Tenant isolation at database level
- Tenant-aware queries
- Cross-tenant security boundaries

### Audit & Compliance

- Complete audit trail
- Tamper-evident logging
- Retention policies

---

## Testing Strategy

### Unit Testing

```java
@ExtendWith(ActivitiExtension.class)
class ProcessEngineTest {
    
    @Autowired
    private ProcessEngine processEngine;
    
    @Test
    void testProcessExecution() {
        // Test implementation
    }
}
```

### Integration Testing

- Use test containers
- Mock external services
- Test transaction boundaries

### Performance Testing

- Load testing with JMeter
- Stress testing job executor
- Memory profiling

---

## Common Pitfalls

### 1. Transaction Management

**Problem:** Operations outside transaction context

**Solution:**
```java
@Transactional
public void executeProcess() {
    // All engine operations here
}
```

### 2. Variable Scope

**Problem:** Variables not accessible where expected

**Solution:** Understand execution vs task variable scope

### 3. History Level

**Problem:** Missing audit data

**Solution:** Configure appropriate history level

### 4. Job Executor

**Problem:** Jobs not executing

**Solution:** Ensure job executor is started and configured

---

## Best Practices

### 1. Engine Configuration

```java
@Configuration
public class ActivitiConfig {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration(
            DataSource dataSource) {
        
        ProcessEngineConfiguration cfg = 
            ProcessEngineConfiguration
                .createStandaloneInMemProcessEngineConfiguration();
        
        cfg.setDataSource(dataSource);
        cfg.setDatabaseSchemaUpdate(
            ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);
        cfg.setHistoryLevel(
            ProcessEngineConfiguration.HISTORY_FULL);
        cfg.setAsyncExecutorActivate(true);
        
        return cfg;
    }
}
```

### 2. Error Handling

```java
try {
    runtimeService.startProcessInstanceByKey("processKey");
} catch (ActivitiException e) {
    // Handle specific engine exceptions
    log.error("Process execution failed", e);
}
```

### 3. Resource Management

- Close resources properly
- Use try-with-resources
- Monitor connection pool

### 4. Monitoring

- Enable metrics collection
- Configure health checks
- Set up alerting

---

## Module-Specific Documentation

For detailed documentation on each submodule, refer to the individual README.md files in their respective directories.

### Quick Reference

| Module | Documentation | Complexity | Critical Path |
|--------|-------------|------------|---------------|
| activiti-engine | [README.md](./activiti-engine/README.md) | High | Yes |
| activiti-spring | [README.md](./activiti-spring/README.md) | Medium | Yes |
| activiti-api-impl | [README.md](./activiti-api-impl/README.md) | High | Yes |
| activiti-bpmn-model | [README.md](./activiti-bpmn-model/README.md) | Medium | No |
| activiti-bpmn-converter | [README.md](./activiti-bpmn-converter/README.md) | Medium | Yes |
| activiti-spring-boot-starter | [README.md](./activiti-spring-boot-starter/README.md) | Low | Yes |

---

## Contributing

When contributing to activiti-core:

1. Follow coding standards
2. Add comprehensive tests
3. Update documentation
4. Ensure backward compatibility
5. Performance impact analysis

---

## Support

- **Issues:** GitHub Issues
- **Documentation:** This repository
- **Community:** Activiti Forum
- **Enterprise:** Commercial support available

---

**Note:** This documentation is for senior engineers. For beginner-friendly guides, see the main documentation directory.
