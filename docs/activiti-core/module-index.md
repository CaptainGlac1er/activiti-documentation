---
sidebar_label: Core Module Index
slug: /activiti-core/module-index
description: Comprehensive index of all modules within the activiti-core parent module.
---

# Activiti Core Module Index

**Version:** 8.7.2-SNAPSHOT

**Last Updated:** 2024

---

## Overview

This index provides a comprehensive overview of all modules within the **activiti-core** parent module. Each module serves a specific purpose in the Activiti workflow engine ecosystem.

---

## Module Structure

```
activiti-core/
├── activiti-engine                    # Core process engine
├── activiti-spring                    # Spring integration
├── activiti-api-impl                  # API implementation
├── activiti-bpmn-model                # BPMN Java model
├── activiti-bpmn-layout               # Diagram layout
├── activiti-bpmn-converter            # XML conversion
├── activiti-json-converter            # JSON serialization
├── activiti-image-generator           # Diagram rendering
├── activiti-process-validation        # Process validation
├── activiti-spring-app-process        # Spring app support
├── activiti-spring-boot-starter       # Spring Boot integration
├── activiti-spring-resource-loader    # Resource loading
├── activiti-spring-conformance-tests  # Conformance tests
├── activiti-spring-process-extensions # Process extensions
└── activiti-core-dependencies         # BOM for dependencies
```

---

## Module Documentation

### Core Engine Modules

| Module | Documentation | Purpose | Complexity |
|--------|-------------|---------|------------|
| **activiti-engine** | [README.md](./activiti-engine/README.md) | Core workflow engine | 🔴 High |
| **activiti-spring** | [README.md](./activiti-spring/README.md) | Spring Framework integration | 🟡 Medium |
| **activiti-api-impl** | [README.md](./activiti-api-impl/README.md) | API implementation | 🔴 High |

### BPMN Support Modules

| Module | Documentation | Purpose | Complexity |
|--------|-------------|---------|------------|
| **activiti-bpmn-model** | [README.md](./activiti-bpmn-model/README.md) | BPMN Java object model | 🟡 Medium |
| **activiti-bpmn-converter** | [README.md](./activiti-bpmn-converter/README.md) | XML import/export | 🟡 Medium |
| **activiti-bpmn-layout** | [README.md](./activiti-bpmn-layout/README.md) | Diagram layout algorithms | 🟢 Low |
| **activiti-process-validation** | [README.md](./activiti-process-validation/README.md) | Process validation | 🟡 Medium |

### Integration Modules

| Module | Documentation | Purpose | Complexity |
|--------|-------------|---------|------------|
| **activiti-spring-boot-starter** | [README.md](./activiti-spring-boot-starter/README.md) | Spring Boot auto-config | 🟡 Medium |
| **activiti-spring-app-process** | [README.md](./activiti-spring-app-process/README.md) | Spring app process support | 🟢 Low |
| **activiti-spring-resource-loader** | [README.md](./activiti-spring-resource-loader/README.md) | Resource loading utilities | 🟢 Low |
| **activiti-spring-process-extensions** | [README.md](./activiti-spring-process-extensions/README.md) | Process extension mechanisms | 🟡 Medium |

### Utility Modules

| Module | Documentation | Purpose | Complexity |
|--------|-------------|---------|------------|
| **activiti-json-converter** | [README.md](./activiti-json-converter/README.md) | JSON serialization | 🟢 Low |
| **activiti-image-generator** | [README.md](./activiti-image-generator/README.md) | Diagram image generation | 🟢 Low |
| **activiti-spring-conformance-tests** | [README.md](./activiti-spring-conformance-tests/README.md) | BPMN conformance tests | 🟡 Medium |

---

## Dependency Graph

```
activiti-core-dependencies (BOM)
│
├── activiti-engine
│   ├── activiti-bpmn-model
│   ├── activiti-bpmn-converter
│   ├── activiti-bpmn-layout
│   ├── activiti-json-converter
│   └── activiti-process-validation
│
├── activiti-spring
│   └── activiti-engine
│
├── activiti-api-impl
│   ├── activiti-engine
│   └── activiti-spring
│
├── activiti-image-generator
│   └── activiti-bpmn-model
│
├── activiti-spring-app-process
│   └── activiti-spring
│
├── activiti-spring-boot-starter
│   ├── activiti-spring
│   ├── activiti-api-impl
│   └── activiti-spring-resource-loader
│
├── activiti-spring-conformance-tests
│   └── activiti-spring
│
└── activiti-spring-process-extensions
    └── activiti-spring
```

---

## Quick Navigation

### For New Developers

1. Start with: [activiti-spring-boot-starter](./activiti-spring-boot-starter/README.md)
2. Then read: [activiti-engine](./activiti-engine/README.md)
3. Finally: [activiti-api-impl](./activiti-api-impl/README.md)

### For API Users

1. Primary: [activiti-api-impl](./activiti-api-impl/README.md)
2. Reference: [activiti-engine](./activiti-engine/README.md)
3. Integration: [activiti-spring](./activiti-spring/README.md)

### For BPMN Developers

1. Model: [activiti-bpmn-model](./activiti-bpmn-model/README.md)
2. Conversion: [activiti-bpmn-converter](./activiti-bpmn-converter/README.md)
3. Validation: [activiti-process-validation](./activiti-process-validation/README.md)

### For Core Contributors

1. Engine: [activiti-engine](./activiti-engine/README.md)
2. Spring: [activiti-spring](./activiti-spring/README.md)
3. All modules in depth

---

## Module Descriptions

### activiti-engine 🔴

**The heart of Activiti** - Implements the complete workflow engine including:
- Process execution
- Task management
- Event handling
- Job executor
- History service
- Database integration

**Key Classes:**
- `ProcessEngine`
- `ProcessEngineConfiguration`
- `RuntimeService`
- `TaskService`

**When to use:** Always - this is the core engine

---

### activiti-spring 🟡

**Spring Framework integration** - Provides:
- Spring bean integration
- Transaction management
- Dependency injection
- Event publishing

**Key Classes:**
- `SpringProcessEngineConfiguration`
- `SpringTransactionContext`

**When to use:** When using Spring Framework

---

### activiti-api-impl 🔴

**API implementation layer** - Offers:
- Type-safe API
- Modern Java interfaces
- Builder patterns
- Clean abstractions

**Key Classes:**
- `ProcessRuntimeImpl`
- `TaskRuntimeImpl`

**When to use:** For new development (preferred over direct engine API)

---

### activiti-bpmn-model 🟡

**BPMN Java object model** - Contains:
- Flow elements
- Activities
- Gateways
- Events
- Data objects

**Key Classes:**
- `BpmnModel`
- `Process`
- `Activity`

**When to use:** For programmatic BPMN manipulation

---

### activiti-bpmn-converter 🟡

**XML conversion utilities** - Handles:
- BPMN XML parsing
- Model serialization
- Validation
- Error reporting

**Key Classes:**
- `BpmnConverter`
- `XMLImporter`
- `XMLExporter`

**When to use:** For BPMN file processing

---

### activiti-spring-boot-starter 🟡

**Spring Boot integration** - Provides:
- Auto-configuration
- Property binding
- Actuator support
- Zero-config startup

**Key Classes:**
- `ActivitiAutoConfiguration`
- `ActivitiProperties`

**When to use:** For Spring Boot applications (recommended)

---

### activiti-image-generator 🟢

**Diagram rendering** - Creates:
- Process images
- Highlighted diagrams
- PNG/SVG output

**When to use:** For visualizing processes

---

### activiti-process-validation 🟡

**Process validation** - Checks:
- BPMN correctness
- Business rules
- Model integrity

**When to use:** Before deploying processes

---

### activiti-json-converter 🟢

**JSON utilities** - Handles:
- Model serialization
- REST API support
- Data exchange

**When to use:** For JSON-based integrations

---

### activiti-bpmn-layout 🟢

**Layout algorithms** - Provides:
- Diagram positioning
- Auto-layout
- Visualization optimization

**When to use:** For diagram rendering

---

### activiti-spring-resource-loader 🟢

**Resource utilities** - Offers:
- Classpath scanning
- Resource loading
- Deployment support

**When to use:** For custom resource loading

---

### activiti-spring-app-process 🟢

**Application process support** - Enables:
- Process applications
- Spring context integration
- Multi-app scenarios

**When to use:** For process applications

---

### activiti-spring-process-extensions 🟡

**Extension mechanisms** - Allows:
- Custom behaviors
- Plugin architecture
- Runtime extensions

**When to use:** For extending engine functionality

---

### activiti-spring-conformance-tests 🟡

**Conformance testing** - Validates:
- BPMN compliance
- Engine correctness
- Regression prevention

**When to use:** For testing and validation

---

## Complexity Legend

- 🔴 **High**: Complex internals, deep understanding required
- 🟡 **Medium**: Moderate complexity, good for most developers
- 🟢 **Low**: Simple utilities, easy to understand

---

## Learning Path

### Beginner Path

1. **Week 1-2**: Spring Boot Starter
   - [activiti-spring-boot-starter](./activiti-spring-boot-starter/README.md)
   - Quick start and basic usage

2. **Week 3-4**: API Implementation
   - [activiti-api-impl](./activiti-api-impl/README.md)
   - Modern API patterns

3. **Week 5-6**: Engine Basics
   - [activiti-engine](./activiti-engine/README.md)
   - Core concepts

### Advanced Path

1. **Month 1-2**: Deep Engine
   - [activiti-engine](./activiti-engine/README.md)
   - Internal architecture

2. **Month 3**: Spring Integration
   - [activiti-spring](./activiti-spring/README.md)
   - Transaction management

3. **Month 4**: BPMN Model
   - [activiti-bpmn-model](./activiti-bpmn-model/README.md)
   - [activiti-bpmn-converter](./activiti-bpmn-converter/README.md)

4. **Month 5**: Extensions
   - [activiti-spring-process-extensions](./activiti-spring-process-extensions/README.md)
   - Custom development

---

## Version Information

| Module | Version | Status |
|--------|---------|--------|
| activiti-engine | 8.7.2-SNAPSHOT | Development |
| activiti-spring | 8.7.2-SNAPSHOT | Development |
| activiti-api-impl | 8.7.2-SNAPSHOT | Development |
| activiti-bpmn-model | 8.7.2-SNAPSHOT | Development |
| activiti-bpmn-converter | 8.7.2-SNAPSHOT | Development |
| activiti-spring-boot-starter | 8.7.2-SNAPSHOT | Development |
| All others | 8.7.2-SNAPSHOT | Development |

---

## Contributing

When contributing to any module:

1. **Read the module documentation** thoroughly
2. **Understand the architecture** before making changes
3. **Write comprehensive tests**
4. **Update documentation**
5. **Follow coding standards**

---

## Support

- **Documentation Issues:** Create GitHub issue
- **Technical Support:** Activiti Forum
- **Enterprise Support:** Commercial support available

---

## See Also

- [Main Documentation](../README.md)
- [API Documentation](../activiti-api/README.md)
- [Implementation Patterns](../implementation-patterns.md)
- [Best Practices](../best-practices.md)

---

**Note:** This index is a living document. As modules evolve, this documentation will be updated accordingly.
