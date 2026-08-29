---
sidebar_position: 0
sidebar_label: Activiti
slug: /activiti
title: "Activiti API Documentation"
description: "Comprehensive documentation for Activiti API 8.7.1. Learn to build robust workflow automation solutions."
---

# Activiti API Documentation

**Community-Maintained Documentation**

Welcome to this community-maintained documentation for Activiti API. This comprehensive resource guides developers from initial setup through advanced workflow automation patterns.

> **Note:** This is community-contributed documentation and is not officially maintained by the Activiti team. For official documentation, please refer to the Activiti project repositories.

## Where to Go Next

| You want to... | Start here |
|----------------|------------|
| Run your first workflow | [Quick Start Guide](./quickstart.md) — 15 minutes |
| See what Activiti can do | [Feature Catalog](./features/index.md) — every feature, grouped by capability |
| Configure the engine | [Engine Configuration](./configuration.md) |
| Look up a BPMN element | [BPMN Element Reference](./bpmn/index.md) |
| Look up an API method | [API Reference](./api-reference/overview.md) |
| Design a production system | [Best Practices](./best-practices/guide.md) and [Implementation Patterns](./implementation-patterns.md) |
| See a complete example | [Examples](./examples/overview.md) |
| Resolve an issue | [Troubleshooting](./troubleshooting/overview) |

## Key Features

A selection from the full [Feature Catalog](./features/index.md):

| Feature | What it lets you do |
|---------|---------------------|
| [Async Execution](./bpmn/reference/async-execution.md) | Run activities in the background with the job executor |
| [Multi-Instance](./bpmn/reference/multi-instance.md) | Iterate tasks over collections, sequentially or in parallel |
| [Listeners](./bpmn/reference/task-listeners.md) | React to task and execution lifecycle events |
| [Error Handling](./bpmn/reference/error-handling.md) | Boundary events, error propagation, and compensation |
| [Process Extensions](./bpmn/reference/process-extensions.md) | Declare variables and mappings in `*-extensions.json` sidecars |
| [Security Policies](./advanced/security-policies.md) | Declarative, policy-based access control |
| [Multi-Tenancy](./advanced/multi-tenancy.md) | Tenant isolation strategies and per-tenant configuration |
| [Testing Infrastructure](./advanced/testing-infrastructure.md) | BDD assertions, async testing, mocking, and clock control |

## Learning Paths

### Path 1: Beginner to Proficient (2-4 weeks)

1. **Week 1:** Complete the [Quick Start Guide](./quickstart.md), study core BPMN concepts and [architecture](./architecture/overview.md)
2. **Week 2:** Implement user tasks and task assignments; configure [listeners](./features/index.md#hooking-into-process-events); build a complete task-based workflow
3. **Week 3:** [Process Runtime API](./api-reference/overview.md#process-runtime-api), [Task Runtime API](./api-reference/overview.md#task-runtime-api), process variables and data management
4. **Week 4:** Security fundamentals, [Best Practices](./best-practices/guide.md) implementation, build and test a complete application

### Path 2: Experienced Developer (1 week)

| Day | Morning | Afternoon | Evening |
|-----|---------|-----------|---------|
| 1 | Quick Start + Architecture | API Reference review | Environment setup |
| 2 | Process Management | Task Management | Build prototype |
| 3 | Event Handling | Security Implementation | Integration patterns |
| 4 | Best Practices | Performance optimization | Code review |
| 5 | [Runtime capabilities](./advanced/index.md) | Troubleshooting guide | Final project |

### Path 3: Architect/Technical Lead (3-5 days)

1. **Strategic patterns:** [Implementation Patterns](./implementation-patterns.md), integration strategies, security models
2. **Scalability & deployment:** [Multi-Tenancy](./advanced/multi-tenancy.md), [History Cleanup](./advanced/history-cleanup.md), high availability
3. **Operations:** [Management Service](./advanced/management-service.md), [Job Lifecycle](./advanced/job-lifecycle.md), monitoring and observability

## Additional Resources

- [Activiti GitHub Repository](https://github.com/Activiti/Activiti) — source code, issues, and contributions
- [BPMN 2.0 Specification](https://www.bpmn.org) — BPMN standard documentation
- [Workflow Patterns](https://workflowpatterns.com) — common workflow design patterns
- [Spring Boot Documentation](https://spring.io/projects/spring-boot) — Spring Boot framework reference

**Community support:** use the `activiti` tag on Stack Overflow, or open an issue on GitHub. Found a documentation error? Search existing issues first, then create a new issue or pull request.

---

*Documentation Version: 8.7.1*  
*Last Updated: 2026*
