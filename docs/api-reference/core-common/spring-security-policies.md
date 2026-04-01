---
sidebar_label: Spring Security Policies
slug: /api-reference/core-common/spring-security-policies
description: Core common utilities and shared modules.
---

# Activiti Spring Security Policies Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-security-policies`

**Target Audience:** Senior Software Engineers, Security Architects, Compliance Officers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Classes and Their Responsibilities](#key-classes-and-their-responsibilities)
- [Security Policy Model](#security-policy-model)
- [Policy Enforcement](#policy-enforcement)
- [Restriction Appliers](#restriction-appliers)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-spring-security-policies** module provides fine-grained security policy management for Activiti applications. It enables defining and enforcing access control policies at the process definition and process instance level, supporting role-based and group-based access control.

### Key Features

- **Policy-Based Access Control**: Define granular security policies
- **Process Definition Restrictions**: Control who can see/start processes
- **Process Instance Restrictions**: Control who can access instances
- **Service-Level Policies**: Apply policies to specific services
- **Key-Based Access**: Restrict access by business keys
- **Auto-Configuration**: Spring Boot integration

### Module Structure

```
activiti-spring-security-policies/
└── src/main/java/org/activiti/core/common/spring/security/policies/
    ├── SecurityPolicy.java                           # Policy model
    ├── SecurityPolicyAccess.java                     # Access levels
    ├── SecurityPoliciesManager.java                  # Policy manager interface
    ├── BaseSecurityPoliciesManagerImpl.java          # Base implementation
    ├── ProcessSecurityPoliciesManager.java           # Process policies
    ├── ProcessSecurityPoliciesManagerImpl.java       # Process implementation
    ├── SecurityPoliciesRestrictionApplier.java       # Restriction applier
    ├── SecurityPoliciesProcessDefinitionRestrictionApplier.java # Def applier
    ├── SecurityPoliciesProcessInstanceRestrictionApplier.java    # Instance applier
    ├── ActivitiForbiddenException.java               # Security exception
    └── conf/
        └── SecurityPoliciesProperties.java           # Configuration properties
    └── config/
        └── ActivitiSpringSecurityPoliciesAutoConfiguration.java # Auto-config
```

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Security Policy Management                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           SecurityPoliciesManager                    │   │
│  │         (Policy Management Interface)                │   │
│  │  - getPolicy(name)                                   │   │
│  │  - hasAccess(policy, user)                           │   │
│  │  - applyRestrictions()                               │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ extends                             │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      ProcessSecurityPoliciesManager                 │   │
│  │     (Process-Specific Policies)                     │   │
│  │  - getProcessDefinitionPolicies()                   │   │
│  │  - getProcessInstancePolicies()                     │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ implemented by                      │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   ProcessSecurityPoliciesManagerImpl               │   │
│  │                                                      │   │
│  │  Uses RestrictionAppliers to enforce policies      │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│           ┌───────────┼───────────┐                         │
│           │           │           │                         │
│           ▼           ▼           ▼                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐       │
│  │ Process     │ │ Process     │ │ Service         │       │
│  │ Definition  │ │ Instance    │ │ Level           │       │
│  │ Restriction │ │ Restriction │ │ Restriction     │       │
│  │ Applier     │ │ Applier     │ │ Applier         │       │
│  └─────────────┘ └─────────────┘ └─────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              SecurityPolicy                         │   │
│  │  - name: String                                     │   │
│  │  - groups: List<String>                            │   │
│  │  - users: List<String>                             │   │
│  │  - access: SecurityPolicyAccess                    │   │
│  │  - keys: List<String>                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Policy Enforcement Flow

```
Process Access Request
    │
    ▼
┌─────────────────────────────┐
│  ProcessSecurityPolicies    │
│  Manager                    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Get Applicable Policies     │
│  - By process definition     │
│  - By process instance       │
│  - By service                │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Check User Access           │
│  - Is user in allowed groups?│
│  - Is user in allowed list?  │
│  - Does user have role?      │
└──────────┬──────────────────┘
           │
           ├───────────┬───────────┐
           │           │           │
           ▼           ▼           ▼
      Allowed      Denied    Restricted
           │           │           │
           └───────────┼───────────┘
                       │
                       ▼
            ┌────────────────────┐
            │  Restriction       │
            │  Applier           │
            │  - Filter results  │
            │  - Hide data       │
            └────────────────────┘
```

---

## Key Classes and Their Responsibilities

### SecurityPolicy

**Purpose:** Represents a security policy definition.

**Responsibilities:**
- Define policy identity
- Specify allowed groups
- Specify allowed users
- Set access level
- Define service scope
- Restrict by keys

**Fields:**
- `name` (`String`): Policy identifier
- `groups` (`List<String>`): Allowed groups
- `users` (`List<String>`): Allowed users
- `serviceName` (`String`): Target service
- `access` (SecurityPolicyAccess): Access level
- `keys` (`List<String>`): Business keys for restriction

**When to Use:** When defining access control policies.

**Design Pattern:** Value object pattern

**Example:**
```java
SecurityPolicy policy = new SecurityPolicy();
policy.setName("HR_PROCESS_ACCESS");
policy.setGroups(Arrays.asList("HR", "MANAGEMENT"));
policy.setUsers(Arrays.asList("hr.admin"));
policy.setAccess(SecurityPolicyAccess.READ_WRITE);
policy.setKeys(Arrays.asList("HR-2024-*"));
```

---

### SecurityPolicyAccess

**Purpose:** Defines access levels for policies.

**Responsibilities:**
- Specify permission granularity
- Define read/write/delete access
- Control policy enforcement

**Values:**
- `READ`: Read-only access
- `READ_WRITE`: Read and write access
- `FULL`: Full access including deletion

**When to Use:** When setting policy permissions.

**Design Pattern:** Enum pattern

**Example:**
```java
policy.setAccess(SecurityPolicyAccess.READ_WRITE);
```

---

### SecurityPoliciesManager

**Purpose:** Interface for security policy management.

**Responsibilities:**
- Retrieve policies
- Check access permissions
- Apply policy restrictions
- Manage policy lifecycle

**Key Methods:**
- `getPolicy(String name)` - Get policy by name
- `hasAccess(SecurityPolicy policy, String userId)` - Check access
- `applyRestrictions(Collection items)` - Apply restrictions
- `getApplicablePolicies(String context)` - Get applicable policies

**When to Use:** For policy operations.

**Design Pattern:** Manager pattern

---

### ProcessSecurityPoliciesManager

**Purpose:** Manages security policies for processes.

**Responsibilities:**
- Get process definition policies
- Get process instance policies
- Check process access
- Apply process restrictions

**Key Methods:**
- `getProcessDefinitionPolicies(String definitionKey)` - Get definition policies
- `getProcessInstancePolicies(String instanceId)` - Get instance policies
- `canStartProcess(String userId, String definitionKey)` - Check start permission
- `canAccessInstance(String userId, String instanceId)` - Check instance access

**When to Use:** For process-level security.

**Design Pattern:** Specialized manager pattern

---

### ProcessSecurityPoliciesManagerImpl

**Purpose:** Implementation of process security policies manager.

**Responsibilities:**
- Load policies from configuration
- Evaluate policy conditions
- Enforce access restrictions
- Integrate with Spring Security

**Key Methods:**
- `checkAccess(String userId, SecurityPolicy policy)` - Check access
- `filterByPolicy(Collection items, SecurityPolicy policy)` - Filter items
- `applyRestrictions(Object target)` - Apply restrictions

**When to Use:** Automatically configured.

**Design Pattern:** Implementation pattern

---

### SecurityPoliciesRestrictionApplier

**Purpose:** Applies security policy restrictions.

**Responsibilities:**
- Filter collections by policy
- Hide restricted items
- Enforce access control
- Apply to query results

**Key Methods:**
- `applyRestrictions(Collection items)` - Apply to collection
- `isRestricted(Object item, SecurityPolicy policy)` - Check restriction
- `filterItems(Collection items, String userId)` - Filter by user

**When to Use:** For result filtering.

**Design Pattern:** Applier/Strategy pattern

---

### SecurityPoliciesProcessDefinitionRestrictionApplier

**Purpose:** Applies restrictions to process definitions.

**Responsibilities:**
- Filter visible process definitions
- Hide restricted definitions
- Enforce definition-level policies

**Key Methods:**
- `applyRestrictions(List<ProcessDefinition> definitions)` - Apply to definitions
- `canSeeDefinition(String userId, String definitionKey)` - Check visibility

**When to Use:** For process definition security.

**Design Pattern:** Specialized applier pattern

---

### SecurityPoliciesProcessInstanceRestrictionApplier

**Purpose:** Applies restrictions to process instances.

**Responsibilities:**
- Filter visible process instances
- Hide restricted instances
- Enforce instance-level policies

**Key Methods:**
- `applyRestrictions(List<ProcessInstance> instances)` - Apply to instances
- `canSeeInstance(String userId, String instanceId)` - Check visibility

**When to Use:** For process instance security.

**Design Pattern:** Specialized applier pattern

---

### ActivitiForbiddenException

**Purpose:** Exception for access denied scenarios.

**Responsibilities:**
- Signal access violations
- Provide error context
- Enable error handling

**When to Use:** Thrown when access is denied.

**Design Pattern:** Exception pattern

**Example:**
```java
if (!hasAccess(userId, policy)) {
    throw new ActivitiForbiddenException(
        "User " + userId + " is not authorized");
}
```

---

## Security Policy Model

### Policy Structure

```java
public class SecurityPolicy {
    private String name;                    // Policy identifier
    private List<String> groups;            // Allowed groups
    private List<String> users;             // Allowed users
    private String serviceName;             // Target service
    private SecurityPolicyAccess access;    // Access level
    private List<String> keys;              // Business keys
}
```

### Policy Evaluation Logic

```java
public boolean hasAccess(String userId, SecurityPolicy policy) {
    // Check if user is explicitly allowed
    if (policy.getUsers() != null && policy.getUsers().contains(userId)) {
        return true;
    }
    
    // Check if user is in allowed groups
    List<String> userGroups = userGroupManager.getUserGroups(userId);
    if (policy.getGroups() != null) {
        for (String group : policy.getGroups()) {
            if (userGroups.contains(group)) {
                return true;
            }
        }
    }
    
    // Check business key restrictions
    if (policy.getKeys() != null) {
        // Apply key-based filtering
        return matchesKeyRestriction(userId, policy.getKeys());
    }
    
    return false;
}
```

---

## Policy Enforcement

### Process Definition Level

```java
@Service
public class ProcessDefinitionSecurityService {
    
    @Autowired
    private ProcessSecurityPoliciesManager policyManager;
    
    public List<ProcessDefinition> getVisibleDefinitions(String userId) {
        List<ProcessDefinition> allDefinitions = 
            processEngine.getProcessDefinitions();
        
        List<SecurityPolicy> policies = 
            policyManager.getProcessDefinitionPolicies();
        
        return allDefinitions.stream()
            .filter(def -> policyManager.canAccessDefinition(
                userId, def.getKey(), policies))
            .collect(Collectors.toList());
    }
}
```

### Process Instance Level

```java
@Service
public class ProcessInstanceSecurityService {
    
    @Autowired
    private ProcessSecurityPoliciesManager policyManager;
    
    public List<ProcessInstance> getVisibleInstances(String userId) {
        List<ProcessInstance> allInstances = 
            processEngine.getProcessInstances();
        
        return allInstances.stream()
            .filter(inst -> policyManager.canAccessInstance(
                userId, inst.getId()))
            .collect(Collectors.toList());
    }
}
```

---

## Restriction Appliers

### Filtering Results

```java
@Component
public class SecurityAwareProcessRepository {
    
    @Autowired
    private SecurityPoliciesRestrictionApplier restrictionApplier;
    
    public List<ProcessInstance> findByUserId(String userId) {
        List<ProcessInstance> allInstances = 
            repository.findAll();
        
        return restrictionApplier.applyRestrictions(allInstances, userId);
    }
}
```

### Custom Restriction Logic

```java
@Component
public class CustomRestrictionApplier implements SecurityPoliciesRestrictionApplier {
    
    @Override
    public <T> Collection<T> applyRestrictions(
            Collection<T> items, String userId) {
        
        return items.stream()
            .filter(item -> {
                SecurityPolicy policy = getPolicyForItem(item);
                return policyManager.hasAccess(userId, policy);
            })
            .collect(Collectors.toList());
    }
    
    private SecurityPolicy getPolicyForItem(Object item) {
        // Custom policy resolution logic
        return policyRepository.findPolicy(item);
    }
}
```

---

## Configuration

### Properties Configuration

```yaml
# application.yml
activiti:
  security:
    policies:
      enabled: true
      default-access: READ
      enforce-on-definitions: true
      enforce-on-instances: true
      restriction-appliers:
        - process-definition
        - process-instance
```

### Java Configuration

```java
@Configuration
public class SecurityPoliciesConfig {
    
    @Bean
    public SecurityPoliciesProperties securityPoliciesProperties() {
        SecurityPoliciesProperties props = new SecurityPoliciesProperties();
        props.setEnabled(true);
        props.setDefaultAccess(SecurityPolicyAccess.READ);
        return props;
    }
    
    @Bean
    public List<SecurityPolicy> securityPolicies() {
        return Arrays.asList(
            createHRPolicy(),
            createFinancePolicy(),
            createAdminPolicy()
        );
    }
    
    private SecurityPolicy createHRPolicy() {
        SecurityPolicy policy = new SecurityPolicy();
        policy.setName("HR_ACCESS");
        policy.setGroups(Arrays.asList("HR", "MANAGEMENT"));
        policy.setAccess(SecurityPolicyAccess.READ_WRITE);
        policy.setKeys(Arrays.asList("HR-*"));
        return policy;
    }
}
```

---

## Usage Examples

### Defining Security Policies

```java
@Configuration
public class SecurityPolicyConfiguration {
    
    @Bean
    public List<SecurityPolicy> processSecurityPolicies() {
        return Arrays.asList(
            // HR Process Policy
            createPolicy("HR_PROCESS", 
                Arrays.asList("HR", "MANAGEMENT"),
                Arrays.asList("hr.admin"),
                SecurityPolicyAccess.READ_WRITE,
                Arrays.asList("HR-*")),
            
            // Finance Process Policy
            createPolicy("FINANCE_PROCESS",
                Arrays.asList("FINANCE", "ACCOUNTING"),
                Arrays.asList("finance.admin"),
                SecurityPolicyAccess.READ_WRITE,
                Arrays.asList("FIN-*")),
            
            // Public Process Policy
            createPolicy("PUBLIC_PROCESS",
                Arrays.asList("*"),  // All groups
                Collections.emptyList(),
                SecurityPolicyAccess.READ,
                Collections.emptyList())
        );
    }
    
    private SecurityPolicy createPolicy(String name, 
            List<String> groups, List<String> users,
            SecurityPolicyAccess access, List<String> keys) {
        SecurityPolicy policy = new SecurityPolicy();
        policy.setName(name);
        policy.setGroups(groups);
        policy.setUsers(users);
        policy.setAccess(access);
        policy.setKeys(keys);
        return policy;
    }
}
```

### Checking Process Access

```java
@Service
public class ProcessAccessService {
    
    @Autowired
    private ProcessSecurityPoliciesManager policyManager;
    
    @Autowired
    private LocalSpringSecurityManager securityManager;
    
    public boolean canStartProcess(String processKey) {
        String userId = securityManager.getCurrentUserIdentity();
        return policyManager.canStartProcess(userId, processKey);
    }
    
    public boolean canViewInstance(String instanceId) {
        String userId = securityManager.getCurrentUserIdentity();
        return policyManager.canAccessInstance(userId, instanceId);
    }
    
    public List<ProcessInstance> getAccessibleInstances() {
        String userId = securityManager.getCurrentUserIdentity();
        return policyManager.getAccessibleInstances(userId);
    }
}
```

### Applying Restrictions to Queries

```java
@Repository
public class SecurityAwareProcessInstanceRepository {
    
    @Autowired
    private SecurityPoliciesRestrictionApplier restrictionApplier;
    
    @Autowired
    private LocalSpringSecurityManager securityManager;
    
    public List<ProcessInstance> findByStatus(String status) {
        String userId = securityManager.getCurrentUserIdentity();
        
        List<ProcessInstance> allInstances = 
            queryAllInstancesByStatus(status);
        
        return restrictionApplier.applyRestrictions(allInstances, userId);
    }
    
    private List<ProcessInstance> queryAllInstancesByStatus(String status) {
        // Query database without restrictions
        return processInstanceQuery().processVariableValueEquals("status", status).list();
    }
}
```

### Custom Policy Enforcement

```java
@Service
public class CustomPolicyEnforcer {
    
    @Autowired
    private ProcessSecurityPoliciesManager policyManager;
    
    public void enforceProcessDefinitionPolicy(String userId, String definitionKey) {
        List<SecurityPolicy> policies = 
            policyManager.getProcessDefinitionPolicies(definitionKey);
        
        boolean hasAccess = policies.stream()
            .anyMatch(policy -> policyManager.hasAccess(userId, policy));
        
        if (!hasAccess) {
            throw new ActivitiForbiddenException(
                "User " + userId + " cannot access process " + definitionKey);
        }
    }
    
    public void enforceBusinessKeyPolicy(String userId, String businessKey) {
        SecurityPolicy policy = policyManager.getPolicyForKey(businessKey);
        
        if (policy != null && !policyManager.hasAccess(userId, policy)) {
            throw new ActivitiForbiddenException(
                "User " + userId + " cannot access business key " + businessKey);
        }
    }
}
```

---

## Best Practices

### 1. Use Least Privilege

```java
// GOOD - Minimal required access
SecurityPolicy policy = new SecurityPolicy();
policy.setAccess(SecurityPolicyAccess.READ);
policy.setGroups(Arrays.asList("HR_VIEWERS"));

// BAD - Excessive permissions
policy.setAccess(SecurityPolicyAccess.FULL);
policy.setGroups(Arrays.asList("*"));
```

### 2. Define Explicit User Lists

```java
// GOOD - Explicit users for sensitive operations
policy.setUsers(Arrays.asList("admin.user", "security.officer"));
policy.setGroups(Arrays.asList("ADMIN"));

// BAD - Relying only on groups
policy.setUsers(Collections.emptyList());
```

### 3. Use Business Key Restrictions

```java
// GOOD - Restrict by business key pattern
policy.setKeys(Arrays.asList("HR-2024-*", "HR-EMP-*"));

// BAD - No key restrictions
policy.setKeys(Collections.emptyList());
```

### 4. Log Access Denials

```java
// GOOD
try {
    policyManager.enforceAccess(userId, policy);
} catch (ActivitiForbiddenException e) {
    auditLog.logAccessDenied(userId, policy.getName(), e);
    throw e;
}

// BAD
policyManager.enforceAccess(userId, policy);
// No audit trail
```

### 5. Validate Policies on Startup

```java
@Component
public class PolicyValidator implements ApplicationRunner {
    
    @Autowired
    private ProcessSecurityPoliciesManager policyManager;
    
    @Override
    public void run(ApplicationArguments args) {
        List<SecurityPolicy> policies = policyManager.getAllPolicies();
        
        policies.forEach(policy -> {
            if (policy.getGroups() == null && policy.getUsers() == null) {
                log.warn("Policy {} has no access restrictions", policy.getName());
            }
        });
    }
}
```

---

## API Reference

### SecurityPolicy

**Fields:**
- `name` (`String`): Policy identifier
- `groups` (`List<String>`): Allowed groups
- `users` (`List<String>`): Allowed users
- `serviceName` (`String`): Target service
- `access` (`SecurityPolicyAccess`): Access level
- `keys` (`List<String>`): Business keys

**Methods:**
- `getName()` / `setName(String)`
- `getGroups()` / `setGroups(List<String>)`
- `getUsers()` / `setUsers(List<String>)`
- `getServiceName()` / `setServiceName(String)`
- `getAccess()` / `setAccess(SecurityPolicyAccess)`
- `getKeys()` / `setKeys(List<String>)`

---

### SecurityPolicyAccess

**Values:**
- `READ`: Read-only access
- `READ_WRITE`: Read and write access
- `FULL`: Full access including deletion

---

### ProcessSecurityPoliciesManager

**Methods:**

```java
/**
 * Get process definition policies.
 */
List<SecurityPolicy> getProcessDefinitionPolicies(String definitionKey);

/**
 * Get process instance policies.
 */
List<SecurityPolicy> getProcessInstancePolicies(String instanceId);

/**
 * Check if user can start process.
 */
boolean canStartProcess(String userId, String definitionKey);

/**
 * Check if user can access instance.
 */
boolean canAccessInstance(String userId, String instanceId);

/**
 * Check policy access.
 */
boolean hasAccess(String userId, SecurityPolicy policy);
```

---

### SecurityPoliciesRestrictionApplier

**Methods:**

```java
/**
 * Apply restrictions to collection.
 */
<T> Collection<T> applyRestrictions(Collection<T> items, String userId);

/**
 * Check if item is restricted.
 */
boolean isRestricted(Object item, String userId, SecurityPolicy policy);

/**
 * Filter items by user.
 */
<T> List<T> filterItems(Collection<T> items, String userId);
```

---

## Troubleshooting

### Policy Not Enforced

**Problem:** Security policies not being applied

**Solution:**
1. Check if policies are enabled in configuration
2. Verify policy beans are registered
3. Ensure restriction appliers are configured

```yaml
# Enable policies
activiti:
  security:
    policies:
      enabled: true
```

### Access Denied for Valid User

**Problem:** User with correct group cannot access

**Solution:**
1. Verify group names match exactly
2. Check policy access level
3. Ensure business key restrictions match

```java
// Debug
System.out.println("User groups: " + userGroups);
System.out.println("Policy groups: " + policy.getGroups());
System.out.println("Match: " + userGroups.containsAll(policy.getGroups()));
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Spring Security](../core-common/spring-security.md)
- [Spring Identity](../core-common/spring-identity.md)
