---
sidebar_label: Spring Security
slug: /api-reference/core-common/spring-security
description: Core common utilities and shared modules.
---

# Activiti Spring Security Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-security`

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Classes and Their Responsibilities](#key-classes-and-their-responsibilities)
- [Security Manager](#security-manager)
- [Authorities Mapping](#authorities-mapping)
- [Principal Providers](#principal-providers)
- [Auto-Configuration](#auto-configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-spring-security** module provides comprehensive Spring Security integration for Activiti applications. It manages security context, principal resolution, and authority mapping between Spring Security and Activiti's security model.

### Key Features

- **Security Context Management**: Integrates with Spring Security context
- **Principal Resolution**: Extracts user identity from security context
- **Authorities Mapping**: Converts Spring authorities to Activiti groups/roles
- **Auto-Configuration**: Spring Boot auto-configuration
- **Thread-Local Security**: Secure thread-local context handling
- **Customizable Providers**: Pluggable principal and authority providers

### Module Structure

```
activiti-spring-security/
└── src/main/java/org/activiti/core/common/spring/security/
    ├── LocalSpringSecurityManager.java              # Main security manager
    ├── LocalSpringSecurityContextPrincipalProvider.java # Context provider
    ├── AuthenticationPrincipalIdentityProvider.java  # Identity provider
    ├── AuthenticationPrincipalGroupsProvider.java    # Groups provider
    ├── AuthenticationPrincipalRolesProvider.java     # Roles provider
    ├── GrantedAuthoritiesResolver.java               # Authority resolver
    ├── GrantedAuthoritiesGroupsMapper.java           # Groups mapper
    ├── GrantedAuthoritiesRolesMapper.java            # Roles mapper
    ├── SimpleGrantedAuthoritiesResolver.java          # Simple resolver
    ├── SimpleGrantedAuthoritiesGroupsMapper.java      # Simple groups mapper
    ├── SimpleGrantedAuthoritiesRolesMapper.java       # Simple roles mapper
    ├── AbstractSimpleGrantedAuthoritiesMapper.java    # Abstract mapper
    └── config/
        └── ActivitiSpringSecurityAutoConfiguration.java # Auto-config
```

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Spring Security                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           SecurityContextHolder                      │   │
│  │         (Spring Security Context)                    │   │
│  │  - Authentication                                    │   │
│  │  - Principal                                         │   │
│  │  - Authorities                                       │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ accessed by                        │
│                       ▼                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Activiti Spring Security                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      LocalSpringSecurityManager                     │   │
│  │     (Activiti Security Manager Implementation)      │   │
│  │                                                      │   │
│  │  Delegates to providers for:                        │   │
│  │  - Principal identity                               │   │
│  │  - Principal groups                                 │   │
│  │  - Principal roles                                  │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│           ┌───────────┼───────────┐                         │
│           │           │           │                         │
│           ▼           ▼           ▼                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐       │
│  │ Identity    │ │ Groups      │ │ Roles           │       │
│  │ Provider    │ │ Provider    │ │ Provider        │       │
│  │             │ │             │ │                 │       │
│  │ Extracts    │ │ Extracts    │ │ Extracts        │       │
│  │ username    │ │ GROUP_      │ │ ROLE_           │       │
│  │             │ │ authorities │ │ authorities     │       │
│  └─────────────┘ └─────────────┘ └─────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Authorities Mapping                        │   │
│  │                                                      │   │
│  │  GrantedAuthoritiesResolver                         │   │
│  │      ↓                                               │   │
│  │  GrantedAuthoritiesGroupsMapper                     │   │
│  │  GrantedAuthoritiesRolesMapper                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Security Flow

```
User Authentication
    │
    ▼
┌─────────────────────────────┐
│  Spring Security            │
│  Authentication              │
│  - Principal: User           │
│  - Authorities: [ROLE_*,     │
│                  GROUP_*]    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  LocalSpringSecurityManager │
│  getCurrentUserIdentity()   │
└──────────┬──────────────────┘
           │
           ├──────────────────┬──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │ Identity   │    │ Groups     │    │ Roles      │
    │ Provider   │    │ Provider   │    │ Provider   │
    └────────────┘    └────────────┘    └────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
        "john"         ["HR","IT"]        ["USER","ADMIN"]
```

---

## Key Classes and Their Responsibilities

### LocalSpringSecurityManager

**Purpose:** Main security manager that bridges Spring Security with Activiti's security model.

**Responsibilities:**
- Manage security context
- Provide current user identity
- Resolve user groups and roles
- Delegate to specialized providers

**Key Methods:**
- `getCurrentUserIdentity()` - Get current user ID
- `getCurrentUserGroups()` - Get current user groups
- `getCurrentUserRoles()` - Get current user roles
- `isUserInGroup(String group)` - Check group membership
- `isUserInRole(String role)` - Check role membership

**When to Use:** Automatically configured for security operations.

**Design Pattern:** Facade pattern - simplifies security operations

**Thread Safety:** Thread-safe (uses Spring Security's thread-local context)

**Example:**
```java
@Autowired
private LocalSpringSecurityManager securityManager;

public void checkPermission() {
    String userId = securityManager.getCurrentUserIdentity();
    List<String> groups = securityManager.getCurrentUserGroups();
    List<String> roles = securityManager.getCurrentUserRoles();
}
```

---

### LocalSpringSecurityContextPrincipalProvider

**Purpose:** Extracts principal from Spring Security context.

**Responsibilities:**
- Access Spring SecurityContext
- Extract Authentication object
- Provide principal information

**Key Methods:**
- `getPrincipal()` - Get current principal
- `getAuthentication()` - Get current authentication

**When to Use:** Automatically used by security manager.

**Design Pattern:** Provider pattern

**Example:**
```java
SecurityContext context = SecurityContextHolder.getContext();
Authentication auth = context.getAuthentication();
Object principal = auth.getPrincipal();
```

---

### AuthenticationPrincipalIdentityProvider

**Purpose:** Extracts user identity from Spring Security authentication.

**Responsibilities:**
- Get username from principal
- Handle different principal types
- Provide consistent identity format

**Key Methods:**
- `getPrincipalIdentity(Object principal)` - Extract identity

**When to Use:** For user identity resolution.

**Design Pattern:** Provider pattern

**Example:**
```java
String userId = identityProvider.getPrincipalIdentity(principal);
// Returns: "john" from UsernamePasswordAuthenticationToken
```

---

### AuthenticationPrincipalGroupsProvider

**Purpose:** Extracts user groups from Spring Security authorities.

**Responsibilities:**
- Filter GROUP_ authorities
- Extract group names
- Provide group list

**Key Methods:**
- `getPrincipalGroups(Object principal)` - Get groups

**When to Use:** For group membership resolution.

**Design Pattern:** Provider pattern

**Example:**
```java
List<String> groups = groupsProvider.getPrincipalGroups(principal);
// Returns: ["HR", "IT"] from [GROUP_HR, GROUP_IT]
```

---

### AuthenticationPrincipalRolesProvider

**Purpose:** Extracts user roles from Spring Security authorities.

**Responsibilities:**
- Filter ROLE_ authorities
- Extract role names
- Provide role list

**Key Methods:**
- `getPrincipalRoles(Object principal)` - Get roles

**When to Use:** For role-based access control.

**Design Pattern:** Provider pattern

**Example:**
```java
List<String> roles = rolesProvider.getPrincipalRoles(principal);
// Returns: ["USER", "ADMIN"] from [ROLE_USER, ROLE_ADMIN]
```

---

### GrantedAuthoritiesResolver

**Purpose:** Resolves authorities from principal.

**Responsibilities:**
- Extract GrantedAuthority list
- Handle different principal types
- Provide authority access

**Key Methods:**
- `resolveAuthorities(Object principal)` - Get authorities

**When to Use:** For authority resolution.

**Design Pattern:** Resolver pattern

---

### SimpleGrantedAuthoritiesGroupsMapper

**Purpose:** Maps Spring authorities to Activiti groups.

**Responsibilities:**
- Filter GROUP_ prefixed authorities
- Extract group names
- Transform to Activiti format

**Key Methods:**
- `mapGroups(Collection<GrantedAuthority> authorities)` - Map groups

**When to Use:** For group mapping.

**Design Pattern:** Mapper/Transformer pattern

**Example:**
```java
List<String> groups = mapper.mapGroups(authorities);
// [GROUP_HR, GROUP_IT] → ["HR", "IT"]
```

---

### SimpleGrantedAuthoritiesRolesMapper

**Purpose:** Maps Spring authorities to Activiti roles.

**Responsibilities:**
- Filter ROLE_ prefixed authorities
- Extract role names
- Transform to Activiti format

**Key Methods:**
- `mapRoles(Collection<GrantedAuthority> authorities)` - Map roles

**When to Use:** For role mapping.

**Design Pattern:** Mapper/Transformer pattern

**Example:**
```java
List<String> roles = mapper.mapRoles(authorities);
// [ROLE_USER, ROLE_ADMIN] → ["USER", "ADMIN"]
```

---

## Security Manager

### Getting Current User

```java
@Service
public class UserService {
    
    @Autowired
    private LocalSpringSecurityManager securityManager;
    
    public String getCurrentUser() {
        return securityManager.getCurrentUserIdentity();
    }
    
    public void logUserAction(String action) {
        String userId = securityManager.getCurrentUserIdentity();
        log.info("User {} performed action: {}", userId, action);
    }
}
```

### Checking Permissions

```java
@Service
public class PermissionService {
    
    @Autowired
    private LocalSpringSecurityManager securityManager;
    
    public boolean canAccessResource(String requiredRole) {
        return securityManager.isUserInRole(requiredRole);
    }
    
    public boolean canPerformAction(String requiredGroup) {
        return securityManager.isUserInGroup(requiredGroup);
    }
    
    public void checkAdminAccess() {
        if (!securityManager.isUserInRole("ADMIN")) {
            throw new AccessDeniedException("Admin access required");
        }
    }
}
```

---

## Authorities Mapping

### Authority Format

Spring Security authorities are mapped as follows:

```java
// Roles - prefixed with "ROLE_"
"ROLE_ADMIN"      → Activiti role: "ADMIN"
"ROLE_USER"       → Activiti role: "USER"
"ROLE_MANAGER"    → Activiti role: "MANAGER"

// Groups - prefixed with "GROUP_"
"GROUP_HR"        → Activiti group: "HR"
"GROUP_FINANCE"   → Activiti group: "FINANCE"
"GROUP_SALES"     → Activiti group: "SALES"

// Other authorities are ignored
"AUTHORITY_SOME"  → Not mapped
```

### Custom Authority Mapping

```java
@Component
public class CustomAuthoritiesMapper implements GrantedAuthoritiesGroupsMapper {
    
    @Override
    public List<String> mapGroups(Collection<GrantedAuthority> authorities) {
        return authorities.stream()
            .filter(a -> a.getAuthority().startsWith("CUSTOM_GROUP_"))
            .map(a -> a.getAuthority().substring("CUSTOM_GROUP_".length()))
            .collect(Collectors.toList());
    }
}
```

---

## Principal Providers

### Custom Identity Provider

```java
@Component
public class CustomIdentityProvider implements PrincipalIdentityProvider {
    
    @Override
    public String getPrincipalIdentity(Object principal) {
        if (principal instanceof UserDetails) {
            UserDetails user = (UserDetails) principal;
            // Return custom identity format
            return "USER_" + user.getUsername();
        }
        return principal.toString();
    }
}
```

### Custom Groups Provider

```java
@Component
public class CustomGroupsProvider implements PrincipalGroupsProvider {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public List<String> getPrincipalGroups(Object principal) {
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            // Fetch groups from database
            return userRepository.findGroupsByUsername(username);
        }
        return Collections.emptyList();
    }
}
```

---

## Auto-Configuration

### Conditional Configuration

```java
@Configuration
@ConditionalOnClass({
    SecurityContextHolder.class,
    LocalSpringSecurityManager.class
})
@ConditionalOnBean(SecurityContextPrincipalProvider.class)
public class ActivitiSpringSecurityAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean(LocalSpringSecurityManager.class)
    public LocalSpringSecurityManager securityManager(
            SecurityContextPrincipalProvider contextProvider,
            PrincipalIdentityProvider identityProvider,
            PrincipalGroupsProvider groupsProvider,
            PrincipalRolesProvider rolesProvider) {
        return new LocalSpringSecurityManager(
            contextProvider,
            identityProvider,
            groupsProvider,
            rolesProvider
        );
    }
    
    @Bean
    @ConditionalOnMissingBean(PrincipalIdentityProvider.class)
    public PrincipalIdentityProvider identityProvider() {
        return new AuthenticationPrincipalIdentityProvider();
    }
    
    @Bean
    @ConditionalOnMissingBean(PrincipalGroupsProvider.class)
    public PrincipalGroupsProvider groupsProvider() {
        return new AuthenticationPrincipalGroupsProvider();
    }
    
    @Bean
    @ConditionalOnMissingBean(PrincipalRolesProvider.class)
    public PrincipalRolesProvider rolesProvider() {
        return new AuthenticationPrincipalRolesProvider();
    }
}
```

---

## Usage Examples

### Basic Security Usage

```java
@RestController
@RequestMapping("/api/process")
public class ProcessController {
    
    @Autowired
    private LocalSpringSecurityManager securityManager;
    
    @GetMapping("/current-user")
    public Map<String, Object> getCurrentUser() {
        return Map.of(
            "identity", securityManager.getCurrentUserIdentity(),
            "groups", securityManager.getCurrentUserGroups(),
            "roles", securityManager.getCurrentUserRoles()
        );
    }
    
    @PostMapping("/start")
    public ProcessInstance startProcess(
            @AuthenticationPrincipal UserDetails user) {
        
        String userId = securityManager.getCurrentUserIdentity();
        log.info("User {} starting process", userId);
        
        // Start process with user context
        return processEngine.startProcess("myProcess");
    }
}
```

### Security-Aware Service

```java
@Service
public class SecureProcessService {
    
    @Autowired
    private LocalSpringSecurityManager securityManager;
    
    @Autowired
    private ProcessEngine processEngine;
    
    @Transactional
    public void executeSecureOperation(String processKey) {
        // Check permissions
        if (!securityManager.isUserInRole("ADMIN") && 
            !securityManager.isUserInGroup("MANAGEMENT")) {
            throw new AccessDeniedException(
                "Insufficient permissions to execute operation");
        }
        
        // Log action with user identity
        String userId = securityManager.getCurrentUserIdentity();
        auditLog.log(userId, "EXECUTE_OPERATION", processKey);
        
        // Execute operation
        processEngine.startProcess(processKey);
    }
}
```

### Custom Security Configuration

```java
@Configuration
@EnableWebSecurity
public class CustomSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .httpBasic(Customizer.withDefaults());
        
        return http.build();
    }
    
    @Bean
    public PrincipalGroupsProvider customGroupsProvider() {
        return new CustomGroupsProvider();
    }
}
```

---

## Best Practices

### 1. Always Check Security Context

```java
// GOOD
public void performAction() {
    String userId = securityManager.getCurrentUserIdentity();
    if (userId == null) {
        throw new SecurityException("No authenticated user");
    }
    // Proceed with action
}

// BAD
public void performAction() {
    String userId = securityManager.getCurrentUserIdentity();
    // May be null if not authenticated
    repository.save(new Action(userId, ...));
}
```

### 2. Use Role-Based Checks

```java
// GOOD
if (securityManager.isUserInRole("ADMIN")) {
    performAdminAction();
}

// BAD
if (securityManager.getCurrentUserRoles().contains("ADMIN")) {
    performAdminAction();
}
```

### 3. Log Security-Relevant Actions

```java
// GOOD
public void deleteProcess(String processId) {
    String userId = securityManager.getCurrentUserIdentity();
    auditLog.log(userId, "DELETE_PROCESS", processId);
    processRepository.delete(processId);
}

// BAD
public void deleteProcess(String processId) {
    processRepository.delete(processId);
    // No audit trail
}
```

### 4. Handle Security Exceptions

```java
// GOOD
try {
    securityManager.checkPermission("ADMIN");
} catch (AccessDeniedException e) {
    log.warn("Access denied for user: {}", 
        securityManager.getCurrentUserIdentity());
    throw e;
}

// BAD
securityManager.checkPermission("ADMIN");
// No error handling
```

---

## API Reference

### LocalSpringSecurityManager

**Methods:**

```java
/**
 * Get current user identity.
 */
String getCurrentUserIdentity();

/**
 * Get current user groups.
 */
List<String> getCurrentUserGroups();

/**
 * Get current user roles.
 */
List<String> getCurrentUserRoles();

/**
 * Check if user is in group.
 */
boolean isUserInGroup(String group);

/**
 * Check if user is in role.
 */
boolean isUserInRole(String role);
```

---

### Principal Providers

**PrincipalIdentityProvider:**
```java
String getPrincipalIdentity(Object principal);
```

**PrincipalGroupsProvider:**
```java
List<String> getPrincipalGroups(Object principal);
```

**PrincipalRolesProvider:**
```java
List<String> getPrincipalRoles(Object principal);
```

---

### Authorities Mappers

**GrantedAuthoritiesGroupsMapper:**
```java
List<String> mapGroups(Collection<GrantedAuthority> authorities);
```

**GrantedAuthoritiesRolesMapper:**
```java
List<String> mapRoles(Collection<GrantedAuthority> authorities);
```

---

## Troubleshooting

### User Identity is Null

**Problem:** `getCurrentUserIdentity()` returns null

**Solution:**
1. Check if user is authenticated
2. Verify SecurityContext is set
3. Ensure principal provider is configured

```java
// Debug
SecurityContext context = SecurityContextHolder.getContext();
Authentication auth = context.getAuthentication();
System.out.println("Authenticated: " + auth.isAuthenticated());
System.out.println("Principal: " + auth.getPrincipal());
```

### Groups/Roles Not Returning

**Problem:** Empty groups or roles list

**Solution:**
1. Verify authorities have correct prefix (GROUP_, ROLE_)
2. Check authority mappers are configured
3. Ensure user has authorities

```java
// Debug
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
System.out.println("Authorities: " + auth.getAuthorities());
// Should show: [ROLE_USER, GROUP_HR, ...]
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Spring Identity](../core-common/spring-identity.md)
- [Security Policies](../core-common/spring-security-policies.md)
