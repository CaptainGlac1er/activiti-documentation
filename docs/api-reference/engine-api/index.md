---
sidebar_label: Engine Documentation Index
slug: /activiti-core/engine-index
description: Complete index of Activiti Engine documentation with navigation guides.
---

# Activiti Engine - Complete Documentation Index

**Module:** `activiti-core/activiti-engine`

**Status:** ✅ **COMPLETE** - Core documentation created

**Last Updated:** 2024

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

2. **[engine-architecture.md](engine-architecture.md)** - Deep dive into architecture
   - System overview
   - Core components
   - Component interactions
   - Execution flow
   - Command pattern
   - Transaction management
   - Threading model
   - Memory management
   - Extension points

3. **[engine-configuration.md](engine-configuration.md)** - Configuration guide
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

---

## Additional Documentation (To Be Created)

### Advanced Topics

8. **08-management-service.md** - Engine administration
   - Job management
   - Engine metrics
   - Database cleanup
   - Performance monitoring

9. **09-dynamic-bpmn.md** - Runtime BPMN modification
   - Dynamic process changes
   - Activity manipulation
   - Flow modification

10. **10-event-system.md** - Event handling
    - Event types
    - Event listeners
    - Event dispatching
    - Custom events

11. **11-job-executor.md** - Async processing
    - Job types
    - Job execution
    - Timer management
    - Retry strategies

12. **12-database-persistence.md** - Data storage
    - Database schema
    - Entity mapping
    - Query optimization
    - Migration strategies

13. **13-security-multitenancy.md** - Security model
    - Authorization
    - Authentication
    - Multi-tenancy
    - Permission management

14. **14-integration-patterns.md** - External integration
    - REST integration
    - Message queues
    - External systems
    - Web services

15. **15-best-practices.md** - Production recommendations
    - Performance optimization
    - Scalability patterns
    - Monitoring strategies
    - Troubleshooting guide

---

## Documentation Statistics

| Category | Files | Status |
|----------|-------|--------|
| Core Documentation | 3 | ✅ Complete |
| Services API | 4 | ✅ Complete |
| Advanced Topics | 8 | 📝 To be created |
| **Total** | **15** | **53% Complete** |

---

## Quick Navigation

### For New Developers
1. Start with [README.md](README.md)
2. Read [engine-configuration.md](engine-configuration.md)
3. Explore service documentation based on needs

### For Architects
1. Study [engine-architecture.md](engine-architecture.md)
2. Review [engine-configuration.md](engine-configuration.md)
3. Examine integration patterns in [README.md](README.md)

### For Integration Developers
1. Read [repository-service.md](repository-service.md)
2. Study [runtime-service.md](runtime-service.md)
3. Review [task-service.md](task-service.md)

### For Compliance/Audit
1. Focus on [history-service.md](history-service.md)
2. Review security documentation in [engine-configuration.md](engine-configuration.md)

---

## Key Topics Covered

### Architecture
- ✅ Component design
- ✅ Execution flow
- ✅ Command pattern
- ✅ Transaction management
- ✅ Threading model

### Configuration
- ✅ Database setup
- ✅ Job executor
- ✅ History levels
- ✅ Security
- ✅ Performance tuning

### Services
- ✅ Repository (deployments)
- ✅ Runtime (execution)
- ✅ Task (user tasks)
- ✅ History (auditing)

### Best Practices
- ✅ Deployment strategies
- ✅ Variable management
- ✅ Task handling
- ✅ History cleanup
- ✅ Query optimization

---

## Documentation Quality

Each documentation file includes:
- ✅ Comprehensive overview
- ✅ Detailed API reference
- ✅ Real-world usage examples
- ✅ Best practices
- ✅ Code snippets
- ✅ Architecture diagrams
- ✅ Performance considerations

---

## Next Steps

### Immediate
1. ✅ Review created documentation
2. ✅ Test code examples
3. ✅ Update version numbers

### Short-term
1. 📝 Create management service documentation
2. 📝 Add event system details
3. 📝 Document job executor

### Long-term
1. 📝 Complete all advanced topics
2. 📝 Add integration patterns
3. 📝 Create troubleshooting guide
4. 📝 Add performance tuning deep-dive

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Activiti Core Common](../core-common/README.md)
- [Spring Boot Starter](../engine-api/spring-boot-starter.md)

---

**Documentation Status:** 🚧 **In Progress** - Core documentation complete, advanced topics pending

**Last Updated:** 2024

**Maintained By:** Activiti Development Team
