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
- [Common Util](./common-util.mdx) - Shared utilities
- [Core Test](./core-test.mdx) - Testing support
- [JUEL Jakarta](./juel-jakarta.mdx) - Jakarta EL implementation
- [Connector Model](./connector-model.mdx) - Connector framework
- [Spring Connector](./spring-connector.mdx) - Spring integration

### Project Management
- [Project Model](./project-model.mdx) - Project structure
- [Spring Project](./spring-project.md) - Spring project support

### Spring Integration
- [Spring Application](./spring-application.md) - Application context
- [Spring Cache Manager](./spring-cache-manager.md) - Caching support
- [Spring Identity](./spring-identity.mdx) - Identity management
- [Spring Resource Finder](./spring-resource-finder.md) - Resource loading
- [Spring Security](./spring-security.mdx) - Security integration
- [Spring Security Policies](./spring-security-policies.mdx) - Policy management

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
