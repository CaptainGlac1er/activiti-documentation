---
sidebar_label: Engine Documentation Index
slug: /activiti-core/engine-index
description: Complete index of Activiti Engine documentation with navigation guides.
---

# Activiti Engine - Complete Documentation Index

**Module:** `activiti-core/activiti-engine`

**Status:** **COMPLETE** - Core documentation created


---

## Documentation Overview

This documentation provides comprehensive technical details for the Activiti Engine, designed for senior software engineers, system architects, and integration developers.

---

## Documentation Files

### Core Documentation

1. **[README.md](README.md)** - Main overview and quick start
   - Module structure
   - Key concepts
   - Quick start examples
   - Performance characteristics

2. **[../../architecture/overview.md](../../architecture/overview.md)** - Deep dive into architecture
   - System overview
   - Core components
   - Component interactions
   - Execution flow
   - Command pattern
   - Transaction management
   - Threading model
   - Memory management
   - Extension points

3. **[Engine Configuration](../../configuration.md)** - Configuration guide
   - ProcessEngineConfiguration
   - Database configuration
   - Job executor configuration
   - History configuration
   - Security configuration
   - Performance tuning
   - Multi-tenancy
   - Custom configuration
   - Examples for dev/test/prod

### Services API Documentation

4. **[repository-service.md](repository-service.md)** - Process definition management
   - Deployments
   - Process definitions
   - Resource management
   - Deployment strategies (blue-green, canary)
   - Version management
   - API reference
   - Best practices

5. **[runtime-service.md](runtime-service.md)** - Process instance execution
   - Starting processes
   - Process variables
   - Execution management
   - Signal & message events
   - Timer events
   - Correlation
   - API reference
   - Usage examples

6. **[task-service.md](task-service.md)** - User task management
   - Task creation
   - Task queries
   - Task operations (claim, complete, update)
   - Task variables
   - Candidate users & groups
   - Delegation
   - Comments & attachments
   - API reference
   - Best practices

7. **[history-service.md](history-service.md)** - Process auditing
   - History levels
   - Historic process instances
   - Historic task instances
   - Historic activity instances
   - Historic variables
   - Identity links
   - History cleanup
   - Performance reports
   - Audit trails

8. **[management-service.md](management-service.md)** - Engine administration
   - Job management
   - Engine metrics
   - Database cleanup
   - Performance monitoring

### Additional Documentation

9. **[async-execution.md](async-execution.md)** - Async processing
   - Job types
   - Job execution
   - Timer management
   - Retry strategies

10. **[scripting-engine.md](scripting-engine.md)** - Scripting support
    - Script evaluation
    - Supported languages
    - Scripting configuration

11. **[dynamic-bpmn-service.md](dynamic-bpmn-service.md)** - Runtime BPMN modification
    - Dynamic process changes
    - Activity manipulation
    - Flow modification

---

## Documentation Statistics

| Category | Files | Status |
|----------|-------|--------|
| Core Documentation | 3 | Complete |
| Services API | 5 | Complete |
| Additional Documentation | 3 | Complete |
| **Total** | **11** | **100% Complete** |

---

## Quick Navigation

### For New Developers
1. Start with [README.md](README.md)
2. Read [Engine Configuration](../../configuration.md)
3. Explore service documentation based on needs

### For Architects
1. Study [../../architecture/overview.md](../../architecture/overview.md)
2. Review [Engine Configuration](../../configuration.md)
3. Examine integration patterns in [README.md](README.md)

### For Integration Developers
1. Read [repository-service.md](repository-service.md)
2. Study [runtime-service.md](runtime-service.md)
3. Review [task-service.md](task-service.md)

### For Compliance/Audit
1. Focus on [history-service.md](history-service.md)
2. Review security documentation in [Engine Configuration](../../configuration.md)

---

## Key Topics Covered

### Architecture
- Component design
- Execution flow
- Command pattern
- Transaction management
- Threading model

### Configuration
- Database setup
- Job executor
- History levels
- Security
- Performance tuning

### Services
- Repository (deployments)
- Runtime (execution)
- Task (user tasks)
- History (auditing)
- Management (admin)

### Best Practices
- Deployment strategies
- Variable management
- Task handling
- History cleanup
- Query optimization

---

## Documentation Quality

Each documentation file includes:
- Comprehensive overview
- Detailed API reference
- Real-world usage examples
- Best practices
- Code snippets
- Architecture diagrams
- Performance considerations

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Activiti Core Common](../core-common/README.md)
- [Spring Boot Starter](spring-boot-starter.md)

---

**Documentation Status:** **Complete** - All core engine documentation available


**Maintained By:** Activiti Development Team
