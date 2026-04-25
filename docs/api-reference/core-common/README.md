---
sidebar_label: Overview
title: "Core Common Overview"
slug: /api-reference/core-common/overview
description: Overview of core common utilities and shared modules.
---

# Core Common API Reference

Core common modules provide shared utilities, connectors, and Spring integration support for the Activiti platform. These modules are used internally by the Activiti API and Engine API layers.

## Modules

### Utilities
- [Common Util](./common-util.md) - Shared utilities
- [Core Test](./core-test.md) - Testing support
- [Expression Language](./expression-language.md) - EL support
- [JUEL Jakarta](./juel-jakarta.md) - Jakarta EL implementation

### Connectors
- [Connector Model](./connector-model.md) - Connector framework
- [Spring Connector](./spring-connector.md) - Spring integration

### Project Management
- [Project Model](./project-model.md) - Project structure
- [Spring Project](./spring-project.md) - Spring project support

### Spring Integration
- [Spring Application](./spring-application.md) - Application context
- [Spring Cache Manager](./spring-cache-manager.md) - Caching support
- [Spring Identity](./spring-identity.md) - Identity management
- [Spring Resource Finder](./spring-resource-finder.md) - Resource loading
- [Spring Security](./spring-security.md) - Security integration
- [Spring Security Policies](./spring-security-policies.md) - Policy management

## Use Cases

- **Testing**: Use `core-test` for unit and integration tests
- **Connectors**: Build custom integrations with connector framework
- **Security**: Integrate with Spring Security
- **Caching**: Enable performance optimization

## Module Dependencies

The core common modules are dependencies for both the Activiti API and Engine API. Most application developers interact with these modules indirectly through the higher-level APIs.

### When to Use Core Common Directly

| Scenario | Module |
|----------|--------|
| Custom expression language | `expression-language` |
| Custom connector implementation | `connector-model`, `spring-connector` |
| Custom security policies | `spring-security-policies` |
| Custom resource loading | `spring-resource-finder` |
| Unit testing Activiti components | `core-test` |

---

**Related:**
- [Activiti API](../activiti-api/README.md)
- [Engine API](../engine-api/README.md)
- [Architecture](../../architecture/overview.md)
