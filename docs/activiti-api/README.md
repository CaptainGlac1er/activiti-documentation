---
sidebar_label: API Overview
slug: /activiti-api
description: Technical documentation for the Activiti API modules, designed for senior software engineers.
---

# Activiti API - Technical Documentation for Senior Engineers

## Module Overview

This documentation provides deep technical insights into the Activiti API architecture, designed for senior software engineers who need to understand implementation details, design decisions, and advanced usage patterns.

### Module Structure

```
activiti-api/
├── activiti-api-model-shared/          # Core shared models and interfaces
├── activiti-api-runtime-shared/        # Shared runtime utilities and security
├── activiti-api-process-model/         # Process domain models and events
├── activiti-api-process-runtime/       # Process execution APIs
├── activiti-api-task-model/            # Task domain models and events
├── activiti-api-task-runtime/          # Task management APIs
└── activiti-api-dependencies/          # BOM for dependency management
```

## Architecture Principles

### 1. Layered Architecture

The API follows a strict layered architecture:

```
┌─────────────────────────────────────┐
│         Runtime Layer               │
│  (ProcessRuntime, TaskRuntime)      │
├─────────────────────────────────────┤
│         Model Layer                 │
│  (Entities, Events, Payloads)       │
├─────────────────────────────────────┤
│      Shared Infrastructure          │
│  (Security, Query, Common Models)   │
└─────────────────────────────────────┘
```

### 2. Interface-Driven Design

All core components are defined as interfaces, enabling:
- Multiple implementations
- Easy testing and mocking
- Clear contract definitions
- Version compatibility

### 3. Builder Pattern for Payloads

Complex operations use fluent builders:
```java
ProcessPayloadBuilder.start()
    .withProcessDefinitionKey("key")
    .withVariable("name", "value")
    .build()
```

### 4. Event-Driven Architecture

Rich event system for:
- Process lifecycle events
- Task lifecycle events
- Variable change events
- BPMN element events

---

## Dependency Management

### BOM Structure

The `activiti-api-dependencies` module provides a Bill of Materials for consistent versioning:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.activiti</groupId>
            <artifactId>activiti-api-model-shared</artifactId>
            <version>${project.version}</version>
        </dependency>
        <!-- Other modules -->
    </dependencies>
</dependencyManagement>
```

### Module Dependencies

```
activiti-api-model-shared
    └── No internal dependencies (foundation)

activiti-api-runtime-shared
    └── activiti-api-model-shared

activiti-api-process-model
    └── activiti-api-model-shared

activiti-api-task-model
    ├── activiti-api-model-shared
    └── activiti-api-process-model

activiti-api-process-runtime
    ├── activiti-api-model-shared
    ├── activiti-api-runtime-shared
    └── activiti-api-process-model

activiti-api-task-runtime
    ├── activiti-api-model-shared
    ├── activiti-api-runtime-shared
    └── activiti-api-task-model
```

---

## Technical Deep Dives

See individual module documentation:
- [Model Shared](./activiti-api-model-shared/README.md)
- [Runtime Shared](./activiti-api-runtime-shared/README.md)
- [Process Model](./activiti-api-process-model/README.md)
- [Process Runtime](./activiti-api-process-runtime/README.md)
- [Task Model](./activiti-api-task-model/README.md)
- [Task Runtime](./activiti-api-task-runtime/README.md)

---

## Design Patterns

### 1. Factory Pattern

Payload builders act as factories for operation requests:
```java
public class ProcessPayloadBuilder {
    public static StartProcessPayloadBuilder start() { ... }
    public static CreateProcessPayloadBuilder create() { ... }
}
```

### 2. Strategy Pattern

Different runtime implementations (user vs admin):
```java
public interface ProcessRuntime { ... }
public interface ProcessAdminRuntime { ... }
```

### 3. Template Method Pattern

Event handling with type safety:
```java
public interface ProcessEventListener<E extends RuntimeEvent<? extends ProcessInstance, ?>> 
    extends ProcessRuntimeEventListener<E> {
}
```

### 4. Fluent Interface

Builder pattern for readable code:
```java
TaskPayloadBuilder.complete()
    .withTaskId(taskId)
    .withVariable("result", true)
    .build()
```

---

## Performance Considerations

### 1. Pagination

All list operations support pagination:
```java
Page<Task> tasks = taskRuntime.tasks(Pageable.of(0, 100));
```

### 2. Lazy Loading

Entities load only required data:
```java
ProcessInstance instance = processRuntime.processInstance(id);
// Variables loaded on demand
List<VariableInstance> vars = processRuntime.variables(payload);
```

### 3. Event Processing

Async event handling to avoid blocking:
```java
@EventListener
public void onProcessCompleted(ProcessCompletedEvent event) {
    // Non-blocking processing
}
```

---

## Security Model

### Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Request    │────►│ Security     │────►│  Principal  │
│             │     │  Manager     │     │  Provider   │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Access      │
                   │  Control     │
                   └──────────────┘
```

### Authorization Levels

- **User Level**: `ProcessRuntime`, `TaskRuntime`
- **Admin Level**: `ProcessAdminRuntime`, `TaskAdminRuntime`

---

## Versioning Strategy

### API Compatibility

- Interface-based design ensures backward compatibility
- New methods added via interface extension
- Deprecated methods marked with `@Deprecated`

### Version Matrix

| API Version | Java | Spring Boot | Engine |
|-------------|------|-------------|--------|
| 8.7.2+      | 11+  | 3.1+        | 8.7.2+ |
| 8.6.0+      | 11+  | 3.0+        | 8.6.0+ |

---

## Testing Strategy

### Unit Testing

Mock runtime interfaces:
```java
@Mock
private ProcessRuntime processRuntime;

@Test
void shouldStartProcess() {
    when(processRuntime.start(any())).thenReturn(mockInstance);
    // Test logic
}
```

### Integration Testing

Use test containers:
```java
@SpringBootTest
class ProcessIntegrationTest {
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Test
    void shouldExecuteProcess() {
        // Full integration test
    }
}
```

---

## Common Pitfalls

### 1. Variable Scope Confusion

```java
// Process variable
processRuntime.setVariables(...);

// Task variable
taskRuntime.createVariable(...);

// Different scopes!
```

### 2. Event Ordering

Events are not guaranteed to be ordered:
```java
// Don't assume event A arrives before event B
```

### 3. Transaction Boundaries

Runtime operations may span transactions:
```java
@Transactional
public void myOperation() {
    processRuntime.start(...); // May commit early
}
```

---

## Migration Guide

### From Legacy API

```java
// Old
TaskService taskService = runtimeService.getTaskService();

// New
@Autowired
private TaskRuntime taskRuntime;
```

### Breaking Changes

- Removed direct engine access
- Changed exception hierarchy
- Updated pagination API

---

## Performance Benchmarks

### Typical Operations

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Start Process | 50-100ms | 1000/s |
| Complete Task | 30-50ms | 2000/s |
| Query Tasks | 10-20ms | 5000/s |
| Set Variable | 5-10ms | 10000/s |

---

## Troubleshooting

### Debug Mode

Enable detailed logging:
```properties
logging.level.org.activiti=DEBUG
logging.level.org.flowable=DEBUG
```

### Common Issues

See [Troubleshooting Guide](../troubleshooting.md)

---

## Contributing

### Code Standards

- Follow Java conventions
- Write comprehensive tests
- Update documentation
- Use meaningful commit messages

### Review Process

1. Fork repository
2. Create feature branch
3. Submit pull request
4. Address review comments
5. Merge after approval

---

## Additional Resources

- [API Reference](../api-reference.md)
- [Best Practices](../best-practices.md)
- [Implementation Patterns](../implementation-patterns.md)
- [Quick Start](../quickstart.md)

---

**Version**: 8.7.2-SNAPSHOT  
**Last Updated**: 2024  
**Maintained by**: Activiti Community
