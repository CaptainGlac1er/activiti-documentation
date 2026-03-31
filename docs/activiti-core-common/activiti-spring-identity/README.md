# Activiti Spring Identity Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-identity`

**Target Audience:** Senior Software Engineers, Security Architects, Integration Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Classes and Their Responsibilities](#key-classes-and-their-responsibilities)
- [User Group Management](#user-group-management)
- [Spring Security Integration](#spring-security-integration)
- [Auto-Configuration](#auto-configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-spring-identity** module provides Spring Security integration for Activiti's identity management. It bridges Activiti's UserGroupManager API with Spring Security's UserDetailsService, enabling seamless authentication and authorization in Activiti applications.

### Key Features

- **Spring Security Integration**: Connects Activiti with Spring Security
- **User Group Management**: Extracts groups and roles from Spring Security authorities
- **In-Memory User Store**: Extended user details manager for testing
- **Auto-Configuration**: Spring Boot auto-configuration
- **Authority Mapping**: Converts Spring authorities to Activiti groups/roles
- **UserDetailsService Adapter**: Adapts Spring Security to Activiti API

### Module Structure

```
activiti-spring-identity/
└── src/main/java/org/activiti/core/common/spring/identity/
    ├── ActivitiUserGroupManagerImpl.java      # Main implementation
    ├── ExtendedInMemoryUserDetailsManager.java # Extended user manager
    └── config/
        └── ActivitiSpringIdentityAutoConfiguration.java # Auto-config
```

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Activiti Application                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              UserGroupManager                       │   │
│  │         (Activiti API Interface)                    │   │
│  │  - getUserGroups(username)                          │   │
│  │  - getUserRoles(username)                           │   │
│  │  - getGroups()                                      │   │
│  │  - getUsers()                                       │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ implemented by                      │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        ActivitiUserGroupManagerImpl                 │   │
│  │                                                      │   │
│  │  Delegates to Spring Security UserDetailsService    │   │
│  │  Extracts GROUP_ and ROLE_ authorities             │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ uses                                │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         UserDetailsService                           │   │
│  │        (Spring Security Interface)                   │   │
│  │  - loadUserByUsername(username)                      │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ implemented by                      │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    ExtendedInMemoryUserDetailsManager               │   │
│  │   (In-memory store for testing/development)         │   │
│  │  - getUsers()                                        │   │
│  │  - getGroups()                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Authority Mapping

```
Spring Security Authorities          →    Activiti Groups/Roles
─────────────────────────────────────────────────────────────────
ROLE_ADMIN                           →    Role: "ADMIN"
ROLE_USER                            →    Role: "USER"
GROUP_HR                             →    Group: "HR"
GROUP_FINANCE                        →    Group: "FINANCE"
```

### Flow Diagram

```
User Login
    │
    ▼
┌─────────────────────────────┐
│  Spring Security            │
│  Authentication              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  UserDetailsService          │
│  loadUserByUsername()        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  UserDetails with            │
│  GrantedAuthorities          │
│  - ROLE_ADMIN                │
│  - GROUP_HR                  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  ActivitiUserGroupManager   │
│  getUserGroups(username)     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Extract GROUP_ authorities │
│  → ["HR"]                   │
└─────────────────────────────┘
```

---

## Key Classes and Their Responsibilities

### ActivitiUserGroupManagerImpl

**Purpose:** Implements Activiti's UserGroupManager by delegating to Spring Security's UserDetailsService.

**Responsibilities:**
- Extract user groups from Spring Security authorities
- Extract user roles from Spring Security authorities
- Provide list of all groups and users
- Bridge Activiti and Spring Security identity models

**Key Methods:**
- `getUserGroups(String username)` - Get groups for user
- `getUserRoles(String username)` - Get roles for user
- `getGroups()` - Get all groups
- `getUsers()` - Get all users

**When to Use:** Automatically configured when using Spring Security with Activiti.

**Design Pattern:** Adapter pattern - adapts Spring Security to Activiti API

**Thread Safety:** Thread-safe (stateless, delegates to UserDetailsService)

**Example:**
```java
@Autowired
private UserGroupManager userGroupManager;

public List<String> getUserGroups(String username) {
    return userGroupManager.getUserGroups(username);
    // Returns groups extracted from Spring Security authorities
}
```

---

### ExtendedInMemoryUserDetailsManager

**Purpose:** Extends Spring Security's InMemoryUserDetailsManager to support Activiti's group/role management.

**Responsibilities:**
- Store users in memory
- Manage user authorities
- Provide list of all users
- Provide list of all groups
- Support user creation and deletion

**Key Methods:**
- `loadUserByUsername(String username)` - Load user details
- `getUsers()` - Get all usernames
- `getGroups()` - Get all group names
- `createUser(User user)` - Create new user
- `deleteUser(String username)` - Delete user

**When to Use:** For testing and development environments without external user store.

**Design Pattern:** Extension of Spring Security's InMemoryUserDetailsManager

**Thread Safety:** Not thread-safe (uses concurrent collections internally)

**Example:**
```java
@Bean
public UserDetailsService userDetailsService() {
    ExtendedInMemoryUserDetailsManager manager = 
        new ExtendedInMemoryUserDetailsManager();
    
    manager.createUser(User.withUsername("john")
        .password(passwordEncoder.encode("password"))
        .roles("USER")
        .groups("HR")
        .build());
    
    return manager;
}
```

---

### ActivitiSpringIdentityAutoConfiguration

**Purpose:** Provides Spring Boot auto-configuration for identity management.

**Responsibilities:**
- Auto-configure UserGroupManager bean
- Detect UserDetailsService bean
- Create ActivitiUserGroupManagerImpl instance
- Enable conditional configuration

**Key Features:**
- Conditional on UserDetailsService presence
- Automatic bean creation
- No manual configuration required

**When to Use:** Automatically applied when module is on classpath.

**Design Pattern:** Spring Boot auto-configuration pattern

**Example:**
```java
@Configuration
@ConditionalOnClass(UserDetailsService.class)
@ConditionalOnBean(UserDetailsService.class)
public class ActivitiSpringIdentityAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean(UserGroupManager.class)
    public UserGroupManager userGroupManager(
            UserDetailsService userDetailsService) {
        return new ActivitiUserGroupManagerImpl(userDetailsService);
    }
}
```

---

## User Group Management

### Authority Format

Spring Security authorities follow specific naming conventions:

```java
// Roles - prefixed with "ROLE_"
"ROLE_ADMIN"      → Activiti role: "ADMIN"
"ROLE_USER"       → Activiti role: "USER"
"ROLE_MANAGER"    → Activiti role: "MANAGER"

// Groups - prefixed with "GROUP_"
"GROUP_HR"        → Activiti group: "HR"
"GROUP_FINANCE"   → Activiti group: "FINANCE"
"GROUP_SALES"     → Activiti group: "SALES"
```

### Extracting Groups

```java
public List<String> getUserGroups(String username) {
    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
    
    return userDetails.getAuthorities().stream()
        .filter(authority -> authority.getAuthority().startsWith("GROUP_"))
        .map(authority -> authority.getAuthority().substring(6))
        .collect(Collectors.toList());
}
```

### Extracting Roles

```java
public List<String> getUserRoles(String username) {
    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
    
    return userDetails.getAuthorities().stream()
        .filter(authority -> authority.getAuthority().startsWith("ROLE_"))
        .map(authority -> authority.getAuthority().substring(5))
        .collect(Collectors.toList());
}
```

---

## Spring Security Integration

### Basic Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        ExtendedInMemoryUserDetailsManager manager = 
            new ExtendedInMemoryUserDetailsManager();
        
        // Create users with roles and groups
        manager.createUser(User.withUsername("john")
            .password(passwordEncoder.encode("password123"))
            .roles("USER")
            .groups("HR", "MANAGEMENT")
            .build());
        
        manager.createUser(User.withUsername("jane")
            .password(passwordEncoder.encode("password456"))
            .roles("ADMIN", "USER")
            .groups("IT", "MANAGEMENT")
            .build());
        
        return manager;
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .httpBasic(Customizer.withDefaults());
        
        return http.build();
    }
}
```

### LDAP Integration

```java
@Configuration
public class LdapSecurityConfig {
    
    @Bean
    public UserDetailsService ldapUserDetailsService(
            LdapContextSource contextSource) {
        
        LdapUserDetailsService ldapService = 
            new LdapUserDetailsService(contextSource);
        
        ldapService.setGroupSearchFilter("(&(objectClass=group)(member={0}))");
        ldapService.setRolePrefix("ROLE_");
        ldapService.setGroupPrefix("GROUP_");
        
        return ldapService;
    }
}
```

### Database Integration

```java
@Configuration
public class JdbcSecurityConfig {
    
    @Bean
    public UserDetailsService jdbcUserDetailsService(DataSource dataSource) {
        JdbcUserDetailsManager manager = 
            new JdbcUserDetailsManager(dataSource);
        
        // Configure queries
        manager.setUsersByUsernameQuery(
            "SELECT username, password, enabled FROM users WHERE username=?");
        manager.setAuthoritiesByUsernameQuery(
            "SELECT username, authority FROM user_authorities WHERE username=?");
        
        return manager;
    }
}
```

---

## Auto-Configuration

### Conditional Configuration

The auto-configuration is applied when:

1. `UserDetailsService` bean exists
2. `UserGroupManager` bean doesn't exist
3. Spring Security is on classpath

```java
@Configuration
@ConditionalOnClass({
    UserDetailsService.class,
    UserGroupManager.class
})
@ConditionalOnBean(UserDetailsService.class)
@ConditionalOnMissingBean(UserGroupManager.class)
public class ActivitiSpringIdentityAutoConfiguration {
    
    @Bean
    public UserGroupManager userGroupManager(
            UserDetailsService userDetailsService) {
        return new ActivitiUserGroupManagerImpl(userDetailsService);
    }
}
```

### Custom Configuration

To customize the configuration:

```java
@Configuration
public class CustomIdentityConfig {
    
    @Bean
    public UserGroupManager customUserGroupManager(
            UserDetailsService userDetailsService) {
        // Custom implementation
        return new CustomUserGroupManager(userDetailsService);
    }
}
```

---

## Usage Examples

### Basic Usage

```java
@SpringBootTest
class IdentityIntegrationTest {
    
    @Autowired
    private UserGroupManager userGroupManager;
    
    @Test
    void testUserGroups() {
        List<String> groups = userGroupManager.getUserGroups("john");
        
        assertThat(groups).containsExactlyInAnyOrder("HR", "MANAGEMENT");
    }
    
    @Test
    void testUserRoles() {
        List<String> roles = userGroupManager.getUserRoles("john");
        
        assertThat(roles).containsExactlyInAnyOrder("USER");
    }
    
    @Test
    void testAllGroups() {
        List<String> allGroups = userGroupManager.getGroups();
        
        assertThat(allGroups).contains("HR", "IT", "MANAGEMENT");
    }
    
    @Test
    void testAllUsers() {
        List<String> allUsers = userGroupManager.getUsers();
        
        assertThat(allUsers).contains("john", "jane");
    }
}
```

### Task Assignment Based on Groups

```java
@Service
public class TaskAssignmentService {
    
    @Autowired
    private UserGroupManager userGroupManager;
    
    @Autowired
    private TaskService taskService;
    
    public void assignTaskToGroup(String taskId, String groupName) {
        // Get all users in the group
        List<String> allUsers = userGroupManager.getUsers();
        List<String> groupUsers = allUsers.stream()
            .filter(user -> userGroupManager.getUserGroups(user)
                .contains(groupName))
            .collect(Collectors.toList());
        
        // Assign task to group members
        for (String username : groupUsers) {
            taskService.addCandidateUser(taskId, username);
        }
    }
}
```

### Role-Based Process Start

```java
@Service
public class ProcessStartService {
    
    @Autowired
    private UserGroupManager userGroupManager;
    
    @Autowired
    private ProcessEngine processEngine;
    
    public void startProcessIfAuthorized(String username, String processKey) {
        List<String> roles = userGroupManager.getUserRoles(username);
        
        if (roles.contains("ADMIN") || roles.contains("MANAGER")) {
            processEngine.startProcess(processKey);
        } else {
            throw new AccessDeniedException(
                "User " + username + " is not authorized to start process " + processKey);
        }
    }
}
```

### Complete Spring Boot Application

```java
@SpringBootApplication
public class ActivitiIdentityApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ActivitiIdentityApplication.class, args);
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public UserDetailsService userDetailsService(
            PasswordEncoder passwordEncoder) {
        
        ExtendedInMemoryUserDetailsManager manager = 
            new ExtendedInMemoryUserDetailsManager();
        
        // HR Manager
        manager.createUser(User.withUsername("hr.manager")
            .password(passwordEncoder.encode("hr123"))
            .roles("USER", "MANAGER")
            .groups("HR")
            .build());
        
        // IT Admin
        manager.createUser(User.withUsername("it.admin")
            .password(passwordEncoder.encode("it123"))
            .roles("ADMIN", "USER")
            .groups("IT", "ADMINISTRATION")
            .build());
        
        // Regular user
        manager.createUser(User.withUsername("employee1")
            .password(passwordEncoder.encode("emp123"))
            .roles("USER")
            .groups("HR", "SALES")
            .build());
        
        return manager;
    }
}
```

---

## Best Practices

### 1. Use Consistent Authority Naming

```java
// GOOD - Consistent naming
User.withUsername("john")
    .roles("USER", "EMPLOYEE")
    .groups("HR", "FLOOR_3")
    .build();

// BAD - Inconsistent naming
User.withUsername("john")
    .roles("user", "EMPLOYEE")  // Mixed case
    .groups("hr", "FLOOR_3")    // Mixed case
    .build();
```

### 2. Separate Roles from Groups

```java
// GOOD - Roles for permissions, groups for organization
User.withUsername("john")
    .roles("USER")              // Permission level
    .groups("HR", "MANAGEMENT") // Organizational units
    .build();

// BAD - Mixing concerns
User.withUsername("john")
    .roles("HR_USER", "MANAGEMENT_USER")  // Too specific
    .build();
```

### 3. Use ExtendedInMemoryUserDetailsManager for Testing

```java
// GOOD - For tests
@TestConfiguration
class TestSecurityConfig {
    @Bean
    public UserDetailsService userDetailsService() {
        return new ExtendedInMemoryUserDetailsManager();
    }
}

// BAD - Don't use in production
@Configuration
class ProductionSecurityConfig {
    @Bean
    public UserDetailsService userDetailsService() {
        return new ExtendedInMemoryUserDetailsManager(); // Use LDAP/DB instead
    }
}
```

### 4. Validate User Existence

```java
// GOOD
public void assignTask(String username, String taskId) {
    List<String> users = userGroupManager.getUsers();
    if (!users.contains(username)) {
        throw new UserNotFoundException("User " + username + " not found");
    }
    // Proceed with assignment
}

// BAD
public void assignTask(String username, String taskId) {
    // No validation - may fail later
    taskService.assign(taskId, username);
}
```

### 5. Cache User Groups for Performance

```java
@Service
public class CachedUserGroupService {
    
    @Autowired
    private UserGroupManager userGroupManager;
    
    private final Cache<String, List<String>> groupCache = 
        CacheBuilder.newBuilder()
            .expireAfterWrite(10, MINUTES)
            .build();
    
    public List<String> getUserGroups(String username) {
        return groupCache.get(username, 
            () -> userGroupManager.getUserGroups(username));
    }
}
```

---

## API Reference

### UserGroupManager Interface

**Methods:**

```java
/**
 * Get groups for a user.
 */
List<String> getUserGroups(String username);

/**
 * Get roles for a user.
 */
List<String> getUserRoles(String username);

/**
 * Get all groups.
 */
List<String> getGroups();

/**
 * Get all users.
 */
List<String> getUsers();
```

---

### ActivitiUserGroupManagerImpl

**Constructor:**

```java
public ActivitiUserGroupManagerImpl(UserDetailsService userDetailsService)
```

**Dependencies:**
- `UserDetailsService` - Spring Security user details service

**Thread Safety:** Thread-safe

---

### ExtendedInMemoryUserDetailsManager

**Methods:**

```java
/**
 * Get all usernames.
 */
List<String> getUsers();

/**
 * Get all group names.
 */
List<String> getGroups();

/**
 * Create a new user.
 */
void createUser(User user);

/**
 * Delete a user.
 */
void deleteUser(String username);
```

**Thread Safety:** Not thread-safe (use in single-threaded contexts or tests)

---

## Troubleshooting

### User Groups Not Returning

**Problem:** `getUserGroups()` returns empty list

**Solution:**
1. Verify authorities are prefixed with `GROUP_`
2. Check UserDetailsService is returning authorities
3. Ensure user exists in the system

```java
// Debug
UserDetails user = userDetailsService.loadUserByUsername("john");
System.out.println("Authorities: " + user.getAuthorities());
// Should show: [ROLE_USER, GROUP_HR, GROUP_MANAGEMENT]
```

### Roles Not Working

**Problem:** `getUserRoles()` returns empty list

**Solution:**
1. Verify authorities are prefixed with `ROLE_`
2. Check password encoding is correct
3. Ensure user is enabled

```java
// Correct format
User.withUsername("john")
    .roles("ADMIN", "USER")  // Becomes ROLE_ADMIN, ROLE_USER
    .build();
```

### Auto-Configuration Not Applied

**Problem:** UserGroupManager bean not created

**Solution:**
1. Ensure UserDetailsService bean exists
2. Check activiti-spring-identity is on classpath
3. Verify no custom UserGroupManager bean exists

```java
// Force auto-configuration
@Configuration
public class ForceIdentityConfig {
    @Bean
    public UserGroupManager userGroupManager(
            UserDetailsService userDetailsService) {
        return new ActivitiUserGroupManagerImpl(userDetailsService);
    }
}
```

---

## See Also

- [Parent Module Documentation](../README.md)
- [Spring Security Module](../activiti-spring-security/README.md)
- [Common Utilities](../activiti-common-util/README.md)
