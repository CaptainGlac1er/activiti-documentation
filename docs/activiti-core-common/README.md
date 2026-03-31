---
sidebar_label: Core Common Overview
slug: /activiti-core-common
description: Common utilities, testing frameworks, expression language support, and identity management for Activiti.
---

# Activiti Core Common - Technical Documentation

**Module:** `activiti-core-common`

**Target Audience:** Senior Software Engineers, Architects, Integration Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Submodules](#submodules)
- [Module Dependencies](#module-dependencies)
- [Usage Guide](#usage-guide)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-core-common** module is a parent module that aggregates common utilities, testing frameworks, expression language support, identity management, and connector models used across the Activiti platform. It provides foundational components that enable BPMN process execution, testing, and integration with external systems.

### Key Features

- **Common Utilities**: Date formatting, string manipulation, type conversion
- **Testing Framework**: Fluent assertions, matchers, local runtime testing
- **Expression Language**: Jakarta EL support for dynamic expressions
- **Identity Management**: Spring Security integration for user/group management
- **Connector Model**: Data models for external system integrations
- **Spring Integration**: Auto-configuration for Spring Boot applications

### Module Structure

```
activiti-core-common/
├── activiti-common-util/                    # Utility classes
│   └── README.md
├── activiti-core-test/                      # Testing framework
│   ├── activiti-core-test-assertions/       # Assertions & matchers
│   ├── activiti-core-test-local-runtime/    # In-memory runtime
│   └── README.md
├── activiti-expression-language/            # EL support
│   └── README.md
├── activiti-spring-identity/                # Identity integration
│   └── README.md
├── activiti-connector-model/                # Connector models
│   └── README.md
├── activiti-spring-security/                # Security config
├── activiti-spring-security-policies/       # Security policies
├── activiti-spring-connector/               # Connector integration
├── activiti-project-model/                  # Project models
├── activiti-spring-project/                 # Project integration
├── activiti-spring-application/             # Application support
├── activiti-spring-cache-manager/           # Cache management
├── activiti-spring-resource-finder/         # Resource utilities
├── activiti-core-common-dependencies/       # Dependency BOM
└── README.md
```

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Activiti Core Common                         │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Utilities     │  │    Testing      │  │   Expression    │ │
│  │                 │  │    Framework    │  │    Language     │ │
│  │ - Date Utils    │  │ - Assertions    │  │ - EL Context    │ │
│  │ - Type Convert  │  │ - Matchers      │  │ - Functions     │ │
│  │ - String Utils  │  │ - Local Runtime │  │ - Variables     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Identity      │  │   Connector     │  │    Spring       │ │
│  │   Management    │  │    Model        │  │   Integration   │ │
│  │                 │  │                 │  │                 │ │
│  │ - User Groups   │  │ - Definitions   │  │ - Security      │ │
│  │ - Roles         │  │ - Actions       │  │ - Cache         │ │
│  │ - Spring Sec    │  │ - Variables     │  │ - Resources     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Relationships

```
activiti-common-util
    │
    ├── Provides utilities for → activiti-core-test
    ├── Provides utilities for → activiti-expression-language
    └── Provides utilities for → activiti-connector-model

activiti-expression-language
    │
    └── Used by → BPMN engine for expressions

activiti-spring-identity
    │
    ├── Depends on → Spring Security
    └── Provides → UserGroupManager implementation

activiti-connector-model
    │
    └── Used by → activiti-spring-connector

activiti-core-test
    │
    ├── Provides → Testing framework
    └── Used by → All modules for testing
```

---

## Submodules

### Core Utilities

1. **[activiti-common-util](activiti-common-util/README.md)** - Common utility classes
   - `DateFormatterProvider` - Date formatting and parsing
   - Auto-configuration for utilities
   - Thread-safe utility methods

2. **[activiti-expression-language](activiti-expression-language/README.md)** - Expression language support
   - Jakarta EL (JUEL) implementation
   - `ActivitiElContext` - Custom EL context
   - `ActivitiFunctionMapper` - Function registration
   - `ActivitiVariablesMapper` - Variable mapping
   - Expression evaluation for BPMN

3. **[activiti-juel-jakarta](activiti-juel-jakarta/README.md)** - Jakarta EL implementation
   - Full JUEL fork with Jakarta namespaces
   - `ExpressionFactoryImpl` - Expression factory
   - `TreeBuilder` - AST-based expression parsing
   - Method invocations, varargs, null properties support
   - JEE5/JEE6 profiles
   - Expression caching and type conversion

### Testing Framework

4. **[activiti-core-test](activiti-core-test/README.md)** - Comprehensive testing framework
   - **activiti-core-test-assertions**
     - `ProcessInstanceAssertions` - Process testing
     - `TaskAssertions` - Task testing
     - `SignalAssertions` - Signal testing
     - BPMN matchers (Activity, Task, Process)
     - Await patterns for async testing
   - **activiti-core-test-local-runtime**
     - In-memory process execution
     - `LocalEventSource` - Event testing
     - `ProcessRuntimeOperations` - Runtime ops
     - `TaskRuntimeOperations` - Task ops

### Identity & Security

5. **[activiti-spring-identity](activiti-spring-identity/README.md)** - Spring Security identity integration
   - `ActivitiUserGroupManagerImpl` - User group management
   - `ExtendedInMemoryUserDetailsManager` - In-memory user store
   - Authority mapping (GROUP_, ROLE_ prefixes)
   - Auto-configuration for Spring Boot
   - Integration with Spring Security

6. **[activiti-spring-security](activiti-spring-security/README.md)** - Spring Security integration
   - `LocalSpringSecurityManager` - Security context management
   - Principal resolution (identity, groups, roles)
   - Authorities mapping (GROUP_, ROLE_ prefixes)
   - `AuthenticationPrincipalIdentityProvider` - Identity extraction
   - `AuthenticationPrincipalGroupsProvider` - Groups extraction
   - `AuthenticationPrincipalRolesProvider` - Roles extraction
   - Auto-configuration for Spring Security

7. **[activiti-spring-security-policies](activiti-spring-security-policies/README.md)** - Security policy management
   - `SecurityPolicy` - Policy definition model
   - `ProcessSecurityPoliciesManager` - Process-level policies
   - Policy-based access control
   - Process definition restrictions
   - Process instance restrictions
   - Business key-based access control
   - `SecurityPoliciesRestrictionApplier` - Result filtering

### Connector Framework

8. **[activiti-connector-model](activiti-connector-model/README.md)** - Connector data models
   - `ConnectorDefinition` - Connector metadata
   - `ActionDefinition` - Action configuration
   - `VariableDefinition` - Variable type system
   - JSON serialization support
   - Input/output parameter definitions

9. **[activiti-spring-connector](activiti-spring-connector/README.md)** - Spring connector integration
   - `ConnectorDefinitionService` - Connector loading and validation
   - JSON file discovery and parsing
   - Unique name enforcement
   - Auto-configuration for Spring Boot
   - External system integration

### Project Management

10. **[activiti-project-model](activiti-project-model/README.md)** - Project model classes
    - `ProjectManifest` - Project metadata model
    - Version tracking and authorship
    - Creation/modification timestamps
    - Simple POJO for easy integration

11. **[activiti-spring-project](activiti-spring-project/README.md)** - Spring project integration
    - `ApplicationUpgradeContextService` - Upgrade context management
    - Project manifest loading
    - Version enforcement
    - Rollback deployment support
    - Auto-configuration

### Spring Integration

12. **[activiti-spring-application](activiti-spring-application/README.md)** - Spring application support
    - `ApplicationService` - Application management
    - `ApplicationDeployer` - Application deployment
    - `ApplicationDiscovery` - Application discovery
    - `ApplicationEntry` - Application entry points
    - Auto-configuration

13. **[activiti-spring-cache-manager](activiti-spring-cache-manager/README.md)** - Spring cache management
    - `ActivitiSpringCacheManagerProperties` - Cache configuration
    - Caffeine cache support
    - Multi-provider support (Caffeine, Simple, Noop)
    - Auto-configuration
    - Performance optimization

14. **[activiti-spring-resource-finder](activiti-spring-resource-finder/README.md)** - Resource location utilities
    - `ResourceFinder` - Resource discovery service
    - `ResourceFinderDescriptor` - Resource finder strategies
    - `ResourceReader` - Resource content reading
    - Classpath, file system, URL support
    - Pattern matching with wildcards
    - Auto-configuration

### Dependencies

15. **activiti-core-common-dependencies** - Dependency management BOM
    - Version alignment
    - Transitive dependency management

---

## Module Dependencies

### Dependency Graph

```
activiti-core-common (Parent)
│
├── activiti-common-util
│   └── Dependencies: None (standalone utilities)
│
├── activiti-expression-language
│   ├── Dependencies: Jakarta EL API
│   └── Used by: BPMN Engine, Rule Engine
│
├── activiti-core-test
│   ├── Dependencies: JUnit 5, AssertJ, Awaitility
│   ├── activiti-core-test-assertions
│   │   └── Dependencies: activiti-common-util
│   └── activiti-core-test-local-runtime
│       └── Dependencies: activiti-core-test-assertions
│
├── activiti-spring-identity
│   ├── Dependencies: Spring Security, activiti-api-runtime
│   └── Used by: All Spring-based Activiti apps
│
├── activiti-connector-model
│   └── Dependencies: None (pure data models)
│
├── activiti-spring-connector
│   ├── Dependencies: activiti-connector-model, Spring Framework
│   └── Used by: Connector execution
│
├── activiti-spring-security
│   └── Dependencies: Spring Security
│
└── activiti-core-common-dependencies
    └── Type: BOM (Bill of Materials)
```

### Maven Dependencies

```xml
<!-- Add to your pom.xml -->
<dependencies>
    <!-- Common Utilities -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-common-util</artifactId>
    </dependency>
    
    <!-- Testing Framework -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-core-test-assertions</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-core-test-local-runtime</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- Expression Language -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-expression-language</artifactId>
    </dependency>
    
    <!-- Spring Identity -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-spring-identity</artifactId>
    </dependency>
    
    <!-- Connector Model -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-connector-model</artifactId>
    </dependency>
</dependencies>
```

---

## Usage Guide

### Quick Start

1. **Add Dependencies**
   ```xml
   <dependency>
       <groupId>org.activiti</groupId>
       <artifactId>activiti-core-common-dependencies</artifactId>
       <type>pom</type>
       <scope>import</scope>
   </dependency>
   ```

2. **Use Utilities**
   ```java
   DateFormatterProvider formatter = new DateFormatterProvider("yyyy-MM-dd");
   Date date = formatter.parse("2024-01-15");
   ```

3. **Write Tests**
   ```java
   @ExtendWith(ActivitiTestExtension.class)
   class MyProcessTest {
       @Autowired
       private ProcessInstanceAssertions processInstance;
       
       @Test
       void testProcess() {
           // Start process
           ProcessInstance instance = startProcess();
           
           // Assert
           processInstance
               .withProcessInstanceId(instance.getId())
               .exists()
               .isActive();
       }
   }
   ```

4. **Configure Identity**
   ```java
   @SpringBootApplication
   class MyApp {
       @Bean
       public UserDetailsService userDetailsService() {
           // Spring Security user details
       }
       // UserGroupManager auto-configured
   }
   ```

---

## Best Practices

### 1. Use Testing Framework for All Tests

```java
// GOOD
@ExtendWith(ActivitiTestExtension.class)
class ProcessTest {
    @Autowired
    private ProcessInstanceAssertions processInstance;
}

// BAD
class ProcessTest {
    // Manual assertions without framework
}
```

### 2. Leverage Auto-Configuration

```java
// GOOD - No manual configuration needed
@SpringBootApplication
class MyApp { }

// BAD - Manual bean creation
@Configuration
class IdentityConfig {
    @Bean
    public UserGroupManager userGroupManager() {
        // Already auto-configured
    }
}
```

### 3. Use Expression Language Safely

```java
// GOOD - Validated expressions
try {
    ValueExpression expr = factory.createValueExpression(context, expression, Object.class);
    return expr.getValue(context);
} catch (ELException e) {
    throw new InvalidExpressionException(e);
}

// BAD - Unchecked expressions
return expr.getValue(context);
```

### 4. Follow Authority Naming Conventions

```java
// GOOD
User.withUsername("john")
    .roles("USER", "ADMIN")      // Becomes ROLE_USER, ROLE_ADMIN
    .groups("HR", "MANAGEMENT")  // Becomes GROUP_HR, GROUP_MANAGEMENT
    .build();

// BAD
User.withUsername("john")
    .roles("ROLE_USER")          // Double prefix
    .groups("HR")                // Missing prefix
    .build();
```

---

## API Reference

### Key Interfaces

- `UserGroupManager` - Identity management
- `ProcessInstanceAssertions` - Process testing
- `TaskAssertions` - Task testing
- `ActivitiElContext` - Expression context

### Key Classes

- `DateFormatterProvider` - Date utilities
- `ActivitiUserGroupManagerImpl` - Identity implementation
- `ConnectorDefinition` - Connector model
- `ActionDefinition` - Action model

---

## See Also

- [Activiti Engine](../activiti-core/activiti-engine/README.md)
- [Activiti API](../activiti-api/README.md)
- [Spring Boot Integration](../activiti-core/activiti-spring-boot-starter/README.md)
