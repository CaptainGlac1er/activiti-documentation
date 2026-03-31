# Activiti API - Technical Documentation Index

## Module Documentation Structure

This documentation provides deep technical insights into each Activiti API module, designed for senior software engineers who need to understand implementation details, architecture decisions, and advanced usage patterns.

```
documentation/
├── index.md                          # General documentation index
├── quickstart.md                     # Quick start guide
├── README.md                         # Main comprehensive guide
├── api-reference.md                  # Complete API reference
├── best-practices.md                 # Best practices guide
├── implementation-patterns.md        # Architecture patterns
├── troubleshooting.md                # Troubleshooting guide
├── summary.md                        # Visual summary
├── changelog.md                      # Version history
└── activiti-api/                     # Module-specific documentation
    ├── README.md                     # API overview
    ├── activiti-api-model-shared/
    │   └── README.md                 # Shared models documentation
    ├── activiti-api-runtime-shared/
    │   └── README.md                 # Runtime utilities documentation
    ├── activiti-api-process-model/
    │   └── README.md                 # Process models documentation
    ├── activiti-api-process-runtime/
    │   └── README.md                 # Process runtime documentation
    ├── activiti-api-task-model/
    │   └── README.md                 # Task models documentation
    └── activiti-api-task-runtime/
        └── README.md                 # Task runtime documentation
```

---

## Module Documentation Overview

### 1. Activiti API Overview
**File**: `activiti-api/README.md`

**Content**:
- Architecture principles
- Module structure and dependencies
- Design patterns used
- Performance considerations
- Security model
- Versioning strategy
- Testing guidelines

**For**: Understanding the overall API architecture

---

### 2. Model Shared Module
**File**: `activiti-api/activiti-api-model-shared/README.md`

**Content**:
- Core interfaces (Payload, Result, RuntimeEvent)
- Event system architecture
- Domain models (VariableInstance, ApplicationElement)
- Serialization strategy
- Type safety mechanisms
- Implementation patterns

**Key Topics**:
- Payload interface design
- Result wrapper pattern
- Event hierarchy
- Variable instance model
- Error message interface

**For**: Understanding foundational contracts and shared models

---

### 3. Runtime Shared Module
**File**: `activiti-api/activiti-api-runtime-shared/README.md`

**Content**:
- Security architecture
- SecurityManager implementation
- Principal providers
- Query system (Page, Pageable, Order)
- Event listener infrastructure
- Identity management
- Exception hierarchy

**Key Topics**:
- Security context abstraction
- Pagination implementation
- UserGroupManager
- NotFoundException handling
- VariableEventListener

**For**: Understanding shared runtime infrastructure

---

### 4. Process Model Module
**File**: `activiti-api/activiti-api-process-model/README.md`

**Content**:
- Process domain models
- Event system for processes
- Payload builders and types
- BPMN element models
- Integration context
- Query payloads

**Key Topics**:
- ProcessInstance interface
- ProcessDefinition interface
- BPMNActivity, BPMNTimer, BPMNMessage
- ProcessRuntimeEvent hierarchy
- StartProcessPayload, SignalPayload
- IntegrationContext for connectors

**For**: Understanding process domain contracts

---

### 5. Process Runtime Module
**File**: `activiti-api/activiti-api-process-runtime/README.md`

**Content**:
- ProcessRuntime interface
- ProcessAdminRuntime interface
- Operation categories
- Event listener system
- Connector framework
- Configuration
- Performance optimization

**Key Topics**:
- Start/create process operations
- Lifecycle management (suspend, resume, delete)
- Variable operations
- Event operations (signal, receive)
- Metadata operations
- BPMNElementEventListener
- Connector implementation

**For**: Understanding process execution APIs

---

### 6. Task Model Module
**File**: `activiti-api/activiti-api-task-model/README.md`

**Content**:
- Task domain models
- Task event system
- Task payload builders
- Candidate management
- Task result wrapper

**Key Topics**:
- Task interface and status
- TaskCandidate, TaskCandidateUser, TaskCandidateGroup
- TaskRuntimeEvent hierarchy
- CompleteTaskPayload, ClaimTaskPayload
- CreateTaskPayload for standalone tasks
- Variable payloads
- Candidate payloads

**For**: Understanding task domain contracts

---

### 7. Task Runtime Module
**File**: `activiti-api/activiti-api-task-runtime/README.md`

**Content**:
- TaskRuntime interface
- TaskAdminRuntime interface
- Task operations
- Variable management
- Candidate management
- Event listeners
- Visibility rules
- Security model

**Key Topics**:
- Query operations (task, tasks)
- Lifecycle operations (claim, complete, update, delete)
- Assignment operations (assign, assignMultiple)
- Variable operations (create, update, save)
- Candidate operations (add, delete, query)
- TaskEventListener implementation
- Task visibility rules

**For**: Understanding task management APIs

---

## Dependency Graph

```
activiti-api-model-shared (Foundation)
         ↑
         │
activiti-api-runtime-shared
         ↑
         │
activiti-api-process-model
         ↑
         │
activiti-api-task-model
         ↑
         ├──────────────────┐
         │                  │
activiti-api-process-runtime  activiti-api-task-runtime
```

---

## Quick Navigation by Topic

### Security
- [Runtime Shared - Security Architecture](./activiti-api-runtime-shared/README.md#security-architecture)
- [API Overview - Security Model](./README.md#security-model)

### Events
- [Model Shared - Event System](./activiti-api-model-shared/README.md#event-system)
- [Process Model - Event System](./activiti-api-process-model/README.md#event-system)
- [Task Model - Event System](./activiti-api-task-model/README.md#event-system)

### Processes
- [Process Model - Core Models](./activiti-api-process-model/README.md#core-domain-models)
- [Process Runtime - Operations](./activiti-api-process-runtime/README.md#operation-categories)

### Tasks
- [Task Model - Core Models](./activiti-api-task-model/README.md#core-domain-models)
- [Task Runtime - Operations](./activiti-api-task-runtime/README.md#task-lifecycle-operations)

### Variables
- [Model Shared - VariableInstance](./activiti-api-model-shared/README.md#variableinstance-interface)
- [Process Runtime - Variable Operations](./activiti-api-process-runtime/README.md#5-variable-operations)
- [Task Runtime - Variable Operations](./activiti-api-task-runtime/README.md#variable-operations)

### Queries
- [Runtime Shared - Query System](./activiti-api-runtime-shared/README.md#query-system)
- [Process Runtime - Query Operations](./activiti-api-process-runtime/README.md#query-process-definitions)
- [Task Runtime - Query Operations](./activiti-api-task-runtime/README.md#query-tasks)

### Integration
- [Process Model - IntegrationContext](./activiti-api-process-model/README.md#integrationcontext-interface)
- [Process Runtime - Connector System](./activiti-api-process-runtime/README.md#connector-system)

---

## Reading Order Recommendations

### For New Contributors
1. [API Overview](./README.md) - Understand architecture
2. [Model Shared](./activiti-api-model-shared/README.md) - Learn core contracts
3. [Runtime Shared](./activiti-api-runtime-shared/README.md) - Understand infrastructure
4. [Process Model](./activiti-api-process-model/README.md) - Learn process domain
5. [Task Model](./activiti-api-task-model/README.md) - Learn task domain
6. [Process Runtime](./activiti-api-process-runtime/README.md) - Learn process APIs
7. [Task Runtime](./activiti-api-task-runtime/README.md) - Learn task APIs

### For Implementation Review
1. [API Overview](./README.md) - Architecture patterns
2. [Model Shared](./activiti-api-model-shared/README.md) - Interface design
3. [Runtime Shared](./activiti-api-runtime-shared/README.md) - Security implementation
4. Review specific modules as needed

### For API Usage
1. [Quick Start](../quickstart.md) - Get started quickly
2. [Process Runtime](./activiti-api-process-runtime/README.md) - Process operations
3. [Task Runtime](./activiti-api-task-runtime/README.md) - Task operations
4. [API Reference](../api-reference.md) - Complete API docs

---

## Technical Deep Dives

### Architecture Patterns
- [API Overview - Design Patterns](./README.md#design-patterns)
- [Model Shared - Implementation Details](./activiti-api-model-shared/README.md#implementation-details)

### Security Implementation
- [Runtime Shared - Security Architecture](./activiti-api-runtime-shared/README.md#security-architecture)
- [Runtime Shared - Principal Providers](./activiti-api-runtime-shared/README.md#principal-providers)

### Event System
- [Model Shared - RuntimeEvent](./activiti-api-model-shared/README.md#runtimeevent-interface)
- [Process Model - Event Hierarchy](./activiti-api-process-model/README.md#processruntimeevent-interface)
- [Task Model - Event Hierarchy](./activiti-api-task-model/README.md#taskruntimeevent-interface)

### Performance Optimization
- [API Overview - Performance](./README.md#performance-considerations)
- [Process Runtime - Performance](./activiti-api-process-runtime/README.md#performance-considerations)
- [Task Runtime - Performance](./activiti-api-task-runtime/README.md#performance-considerations)

---

## Module Statistics

| Module | Files | Interfaces | Classes | Enums |
|--------|-------|------------|---------|-------|
| Model Shared | 10 | 6 | 3 | 1 |
| Runtime Shared | 13 | 8 | 4 | 1 |
| Process Model | 60+ | 30+ | 20+ | 10+ |
| Process Runtime | 10 | 5 | 2 | 0 |
| Task Model | 40+ | 20+ | 15+ | 5+ |
| Task Runtime | 7 | 4 | 1 | 0 |

---

## Cross-Module References

### Payload Flow
```
User Code
    ↓
Payload Builder (Process/Task Model)
    ↓
Payload Implementation (Process/Task Model)
    ↓
Runtime Interface (Process/Task Runtime)
    ↓
Implementation (Engine)
```

### Event Flow
```
Engine Action
    ↓
Event Created (Model Shared)
    ↓
Event Dispatched (Runtime Shared)
    ↓
Listener Notified (Process/Task Runtime)
    ↓
Business Logic (User Code)
```

### Security Flow
```
Request
    ↓
SecurityManager (Runtime Shared)
    ↓
Principal Provider (Runtime Shared)
    ↓
Authorization Check
    ↓
Operation Execution
```

---

## Version Information

- **API Version**: 8.7.2-SNAPSHOT
- **Java Version**: 11+
- **Documentation Version**: 1.0
- **Last Updated**: 2024

---

## Contributing to Module Documentation

### Adding New Content
1. Identify the appropriate module
2. Follow existing documentation structure
3. Include code examples
4. Add diagrams where helpful
5. Update this index

### Reviewing Documentation
1. Check for accuracy
2. Verify code examples compile
3. Ensure diagrams are clear
4. Validate cross-references
5. Update version information

---

## Additional Resources

- [General Documentation Index](../index.md)
- [API Reference](../api-reference.md)
- [Best Practices](../best-practices.md)
- [Implementation Patterns](../implementation-patterns.md)
- [Troubleshooting Guide](../troubleshooting.md)

---

**For questions about module implementation, refer to the specific module documentation or contact the Activiti community.**

**Last Updated**: 2024  
**Maintained by**: Activiti Community
