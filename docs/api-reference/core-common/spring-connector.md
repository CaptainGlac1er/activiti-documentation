---
sidebar_label: Spring Connector
slug: /api-reference/core-common/spring-connector
description: Spring integration for Activiti connector execution and bean management.
---

# Activiti Spring Connector Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-connector`

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Classes and Their Responsibilities](#key-classes-and-their-responsibilities)
- [Connector Definition Service](#connector-definition-service)
- [Auto-Configuration](#auto-configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-spring-connector** module provides Spring integration for Activiti connectors. It loads, validates, and manages connector definitions from JSON files, enabling BPMN processes to interact with external systems through predefined actions.

### Key Features

- **Connector Discovery**: Automatic loading of connector definitions
- **JSON Parsing**: Deserializes connector configurations
- **Validation**: Ensures connector definitions are valid
- **Spring Integration**: Auto-configuration for Spring Boot
- **Resource Loading**: Flexible resource location strategies
- **Unique Name Enforcement**: Prevents duplicate connector names

### Module Structure

```
activiti-spring-connector/
└── src/main/java/org/activiti/core/common/spring/connector/
    ├── ConnectorDefinitionService.java      # Main service
    └── autoconfigure/
        └── ConnectorAutoConfiguration.java   # Auto-config
```

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Connector Management                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        ConnectorDefinitionService                   │   │
│  │                                                      │   │
│  │  Responsibilities:                                  │   │
│  │  - Load connector JSON files                        │   │
│  │  - Parse ConnectorDefinition objects                │   │
│  │  - Validate connector definitions                   │   │
│  │  - Ensure unique names                              │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│           ┌───────────┼───────────┐                         │
│           │           │           │                         │
│           ▼           ▼           ▼                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐       │
│  │ Resource    │ │ Jackson     │ │ Validation      │       │
│  │ Pattern     │ │ ObjectMapper│ │ Logic           │       │
│  │ Resolver    │ │             │ │                 │       │
│  └─────────────┘ └─────────────┘ └─────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           ConnectorDefinition                        │   │
│  │  (From activiti-connector-model)                    │   │
│  │  - id, name, description                             │   │
│  │  - actions (map of ActionDefinition)                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Loading Flow

```
Application Startup
    │
    ▼
┌─────────────────────────────┐
│  ConnectorAutoConfiguration │
│  Creates service bean        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  ConnectorDefinitionService │
│  get() method                │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  ResourcePatternResolver    │
│  Find *.json files           │
│  in connector root           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  For each JSON file:        │
│  - Read InputStream         │
│  - Parse with ObjectMapper  │
│  - Create ConnectorDef      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Validate connectors        │
│  - Check names not null     │
│  - No dots in names         │
│  - Unique names             │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Return list of             │
│  ConnectorDefinitions        │
└─────────────────────────────┘
```

---

## Key Classes and Their Responsibilities

### ConnectorDefinitionService

**Purpose:** Loads and validates connector definitions from JSON files.

**Responsibilities:**
- Discover connector JSON files
- Parse JSON to ConnectorDefinition objects
- Validate connector definitions
- Ensure unique connector names
- Manage connector lifecycle

**Key Methods:**
- `get()` - Load all connector definitions
- `retrieveResources()` - Find connector files
- `read(InputStream)` - Parse JSON file
- `validate(List<ConnectorDefinition>)` - Validate definitions

**When to Use:** Automatically configured for connector loading.

**Design Pattern:** Service pattern

**Dependencies:**
- `ObjectMapper` - JSON parsing
- `ResourcePatternResolver` - File discovery
- `connectorRoot` - Base path for connectors

**Example:**
```java
@Autowired
private ConnectorDefinitionService connectorService;

public List<ConnectorDefinition> loadConnectors() throws IOException {
    return connectorService.get();
}
```

---

### ConnectorAutoConfiguration

**Purpose:** Provides Spring Boot auto-configuration for connectors.

**Responsibilities:**
- Create ConnectorDefinitionService bean
- Configure connector root path
- Enable conditional configuration
- Integrate with Spring context

**Key Features:**
- Conditional on ObjectMapper presence
- Configurable connector root
- Automatic bean creation

**When to Use:** Automatically applied when module is on classpath.

**Design Pattern:** Auto-configuration pattern

**Example:**
```java
@Configuration
@ConditionalOnClass(ObjectMapper.class)
@ConditionalOnProperty(prefix = "activiti.connector", name = "enabled")
public class ConnectorAutoConfiguration {
    
    @Bean
    public ConnectorDefinitionService connectorDefinitionService(
            ObjectMapper objectMapper,
            ResourcePatternResolver resourceLoader) {
        return new ConnectorDefinitionService(
            "${activiti.connector.root:classpath:/connectors}",
            objectMapper,
            resourceLoader
        );
    }
}
```

---

## Connector Definition Service

### Loading Connectors

```java
public class ConnectorDefinitionService {
    
    private String connectorRoot;
    private final ObjectMapper objectMapper;
    private ResourcePatternResolver resourceLoader;
    
    public List<ConnectorDefinition> get() throws IOException {
        List<ConnectorDefinition> connectorDefinitions = new ArrayList<>();
        
        Optional<Resource[]> resourcesOptional = retrieveResources();
        if (resourcesOptional.isPresent()) {
            for (Resource resource : resourcesOptional.get()) {
                try (InputStream inputStream = resource.getInputStream()) {
                    ConnectorDefinition definition = read(inputStream);
                    connectorDefinitions.add(definition);
                }
            }
            validate(connectorDefinitions);
        }
        
        return connectorDefinitions;
    }
    
    private Optional<Resource[]> retrieveResources() throws IOException {
        Resource connectorRootPath = resourceLoader.getResource(connectorRoot);
        if (connectorRootPath.exists()) {
            return Optional.ofNullable(
                resourceLoader.getResources(connectorRoot + "**.json")
            );
        }
        return Optional.empty();
    }
    
    private ConnectorDefinition read(InputStream inputStream) throws IOException {
        return objectMapper.readValue(inputStream, ConnectorDefinition.class);
    }
}
```

### Validation Logic

```java
protected void validate(List<ConnectorDefinition> connectorDefinitions) {
    if (!connectorDefinitions.isEmpty()) {
        Set<String> processedNames = new HashSet<>();
        
        for (ConnectorDefinition connectorDefinition : connectorDefinitions) {
            String name = connectorDefinition.getName();
            
            // Check name is not null or empty
            if (name == null || name.isEmpty()) {
                throw new IllegalStateException(
                    "connectorDefinition name cannot be null or empty");
            }
            
            // Check name doesn't contain dots
            if (name.contains(".")) {
                throw new IllegalStateException(
                    "connectorDefinition name cannot have '.' character");
            }
            
            // Check name is unique
            if (!processedNames.add(name)) {
                throw new IllegalStateException(
                    "More than one connectorDefinition with name '" + 
                    name + "' was found. Names must be unique.");
            }
        }
    }
}
```

---

## Auto-Configuration

### Configuration Properties

```yaml
# application.yml
activiti:
  connector:
    enabled: true
    root: classpath:/connectors  # or file:/path/to/connectors
```

### Custom Configuration

```java
@Configuration
public class CustomConnectorConfig {
    
    @Value("${activiti.connector.root:classpath:/connectors}")
    private String connectorRoot;
    
    @Bean
    public ConnectorDefinitionService connectorDefinitionService(
            ObjectMapper objectMapper) {
        ResourcePatternResolver resourceLoader = 
            new PathMatchingResourcePatternResolver();
        
        return new ConnectorDefinitionService(
            connectorRoot,
            objectMapper,
            resourceLoader
        );
    }
}
```

---

## Usage Examples

### Connector JSON Format

```json
{
  "id": "email-connector",
  "name": "Email Service",
  "description": "Send emails via SMTP",
  "actions": {
    "sendEmail": {
      "id": "sendEmail",
      "name": "Send Email",
      "description": "Send an email message",
      "inputs": [
        {
          "name": "to",
          "type": "String",
          "description": "Recipient email address",
          "required": true
        },
        {
          "name": "subject",
          "type": "String",
          "description": "Email subject",
          "required": true
        },
        {
          "name": "body",
          "type": "String",
          "description": "Email body",
          "required": true
        }
      ],
      "outputs": [
        {
          "name": "messageId",
          "type": "String",
          "description": "Sent message ID"
        }
      ],
      "configuration": {
        "smtpHost": "${email.smtp.host}",
        "smtpPort": 587,
        "authRequired": true
      }
    }
  }
}
```

### Loading and Using Connectors

```java
@Service
public class ConnectorManager {
    
    @Autowired
    private ConnectorDefinitionService connectorService;
    
    private Map<String, ConnectorDefinition> connectorCache;
    
    @PostConstruct
    public void init() throws IOException {
        List<ConnectorDefinition> definitions = connectorService.get();
        this.connectorCache = definitions.stream()
            .collect(Collectors.toMap(
                ConnectorDefinition::getName,
                definition -> definition
            ));
    }
    
    public Optional<ConnectorDefinition> getConnector(String name) {
        return Optional.ofNullable(connectorCache.get(name));
    }
    
    public List<ConnectorDefinition> getAllConnectors() {
        return new ArrayList<>(connectorCache.values());
    }
}
```

### Using in BPMN Process

```xml
<!-- BPMN Process with Connector -->
<process id="notificationProcess">
    <startEvent id="start"/>
    
    <sequenceFlow sourceRef="start" targetRef="sendEmail"/>
    
    <serviceTask id="sendEmail"
                 name="Send Notification Email"
                 activiti:connectorId="email-connector"
                 activiti:action="sendEmail">
        <extensionElements>
            <activiti:in source="recipientEmail" target="to"/>
            <activiti:in expression="${'Order #' + orderId}" target="subject"/>
            <activiti:in source="emailBody" target="body"/>
            <activiti:out source="messageId" target="sentMessageId"/>
        </extensionElements>
    </serviceTask>
    
    <sequenceFlow sourceRef="sendEmail" targetRef="end"/>
    <endEvent id="end"/>
</process>
```

### Multiple Connector Locations

```java
@Configuration
public class MultiLocationConnectorConfig {
    
    @Bean
    public ConnectorDefinitionService classpathConnectors(
            ObjectMapper objectMapper) {
        ResourcePatternResolver resourceLoader = 
            new PathMatchingResourcePatternResolver();
        
        return new ConnectorDefinitionService(
            "classpath:/connectors",
            objectMapper,
            resourceLoader
        );
    }
    
    @Bean
    public ConnectorDefinitionService fileSystemConnectors(
            ObjectMapper objectMapper) {
        ResourcePatternResolver resourceLoader = 
            new PathMatchingResourcePatternResolver();
        
        return new ConnectorDefinitionService(
            "file:/opt/activiti/connectors",
            objectMapper,
            resourceLoader
        );
    }
}
```

---

## Best Practices

### 1. Use Descriptive Connector Names

```json
// GOOD
{
  "name": "Salesforce CRM Connector",
  "description": "Integrate with Salesforce for CRM operations"
}

// BAD
{
  "name": "sf",
  "description": "crm"
}
```

### 2. Validate Connector JSON

```java
// GOOD - Validate on load
try {
    List<ConnectorDefinition> connectors = service.get();
    log.info("Loaded {} connectors", connectors.size());
} catch (IllegalStateException e) {
    log.error("Invalid connector definition: {}", e.getMessage());
    throw e;
}

// BAD - No validation
List<ConnectorDefinition> connectors = service.get();
```

### 3. Use Environment Variables for Configuration

```json
// GOOD
{
  "configuration": {
    "apiKey": "${salesforce.api.key}",
    "endpoint": "${salesforce.endpoint}"
  }
}

// BAD - Hardcoded secrets
{
  "configuration": {
    "apiKey": "sk-1234567890abcdef",
    "endpoint": "https://api.salesforce.com"
  }
}
```

### 4. Cache Connector Definitions

```java
// GOOD - Cache after loading
@Service
public class CachedConnectorManager {
    private final Map<String, ConnectorDefinition> cache = new ConcurrentHashMap<>();
    
    @PostConstruct
    public void loadConnectors() throws IOException {
        List<ConnectorDefinition> definitions = connectorService.get();
        definitions.forEach(def -> cache.put(def.getName(), def));
    }
}

// BAD - Load on every request
public ConnectorDefinition getConnector(String name) throws IOException {
    return connectorService.get().stream()
        .filter(d -> d.getName().equals(name))
        .findFirst()
        .orElseThrow();
}
```

### 5. Handle Missing Connectors Gracefully

```java
// GOOD
public Optional<ConnectorDefinition> getConnector(String name) {
    return Optional.ofNullable(connectorCache.get(name))
        .or(() -> {
            log.warn("Connector not found: {}", name);
            return Optional.empty();
        });
}

// BAD
public ConnectorDefinition getConnector(String name) {
    return connectorCache.get(name); // May return null
}
```

---

## API Reference

### ConnectorDefinitionService

**Constructor:**

```java
public ConnectorDefinitionService(
    String connectorRoot,
    ObjectMapper objectMapper,
    ResourcePatternResolver resourceLoader
)
```

**Methods:**

```java
/**
 * Load all connector definitions.
 */
public List<ConnectorDefinition> get() throws IOException;

/**
 * Retrieve connector resources.
 */
private Optional<Resource[]> retrieveResources() throws IOException;

/**
 * Read connector from input stream.
 */
private ConnectorDefinition read(InputStream inputStream) throws IOException;

/**
 * Validate connector definitions.
 */
protected void validate(List<ConnectorDefinition> connectorDefinitions);
```

---

### Validation Rules

1. **Name Required**: Connector name cannot be null or empty
2. **No Dots**: Connector name cannot contain '.' character
3. **Unique Names**: Each connector must have a unique name
4. **Valid JSON**: Connector file must be valid JSON

---

## Troubleshooting

### Connector Not Loading

**Problem:** Connector definition not found

**Solution:**
1. Check connector root path is correct
2. Verify JSON files exist in location
3. Ensure files have .json extension
4. Check file permissions

```yaml
# Verify configuration
activiti:
  connector:
    root: classpath:/connectors
```

### Validation Error

**Problem:** IllegalStateException during validation

**Solution:**
1. Check connector names are unique
2. Ensure names don't contain dots
3. Verify all connectors have names
4. Review error message for specific issue

```java
// Debug
try {
    List<ConnectorDefinition> connectors = service.get();
} catch (IllegalStateException e) {
    log.error("Validation failed: {}", e.getMessage());
    // Check which connector caused the issue
}
```

### JSON Parse Error

**Problem:** ObjectMapper fails to parse JSON

**Solution:**
1. Validate JSON syntax
2. Check field names match ConnectorDefinition
3. Ensure proper escaping
4. Verify JSON structure

```json
// Use JSON validator
{
  "id": "test",
  "name": "Test",
  "description": "Test connector",
  "actions": {}
}
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Connector Model](./connector-model.md)
- [Spring Integration](./spring-application.md)
