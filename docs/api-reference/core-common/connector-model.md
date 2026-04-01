---
sidebar_label: Connector Model
slug: /api-reference/core-common/connector-model
description: Core common utilities and shared modules.
---

# Activiti Connector Model Module - Technical Documentation

**Module:** `activiti-core-common/activiti-connector-model`

**Target Audience:** Senior Software Engineers, Integration Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Classes and Their Responsibilities](#key-classes-and-their-responsibilities)
- [Connector Definition](#connector-definition)
- [Action Definition](#action-definition)
- [Variable Definition](#variable-definition)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-connector-model** module provides the data model for defining connectors in Activiti. Connectors enable BPMN processes to interact with external systems through predefined actions, making it easy to integrate with REST APIs, email services, databases, and other external resources.

### Key Features

- **Connector Definitions**: Define reusable external service integrations
- **Action Definitions**: Specify operations that can be performed
- **Variable Definitions**: Define input/output parameters
- **Type System**: Support for various data types
- **Configuration**: Flexible connector configuration
- **Validation**: Model validation and type checking

### Module Structure

```
activiti-connector-model/
└── src/main/java/org/activiti/core/common/model/connector/
    ├── ConnectorDefinition.java      # Main connector model
    ├── ActionDefinition.java         # Action model
    └── VariableDefinition.java       # Variable model
```

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Connector Model                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ConnectorDefinition                     │   │
│  │  - id: String                                        │   │
│  │  - name: String                                      │   │
│  │  - description: String                               │   │
│  │  - actions: Map<String, ActionDefinition>           │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ contains                            │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               ActionDefinition                       │   │
│  │  - id: String                                        │   │
│  │  - name: String                                      │   │
│  │  - description: String                               │   │
│  │  - inputs: List<VariableDefinition>                 │   │
│  │  - outputs: List<VariableDefinition>                │   │
│  │  - configuration: Map<String, Object>               │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ has                                 │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             VariableDefinition                       │   │
│  │  - name: String                                      │   │
│  │  - type: String                                      │   │
│  │  - description: String                               │   │
│  │  - required: boolean                                 │   │
│  │  - defaultValue: Object                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Model Relationships

```
ConnectorDefinition
    ├── id (unique identifier)
    ├── name (display name)
    ├── description (human-readable description)
    └── actions (map of action ID -> ActionDefinition)
            ├── id (unique within connector)
            ├── name (display name)
            ├── description (what the action does)
            ├── inputs (list of input variables)
            ├── outputs (list of output variables)
            └── configuration (action-specific settings)
                    ├── name (variable name)
                    ├── type (data type)
                    ├── description (variable purpose)
                    ├── required (must be provided?)
                    └── defaultValue (default if not provided)
```

---

## Key Classes and Their Responsibilities

### ConnectorDefinition

**Purpose:** Represents a complete connector definition that groups related actions for interacting with an external system.

**Responsibilities:**
- Define connector identity (ID, name, description)
- Group related actions under one connector
- Provide metadata about the external system
- Enable connector discovery and selection

**Fields:**
- `id` (`String`): Unique identifier for the connector
- `name` (`String`): Human-readable name
- `description` (`String`): Detailed description of the connector
- `actions` (`Map<String, ActionDefinition>`): Map of action IDs to their definitions

**When to Use:** When defining a new connector for an external system (e.g., EmailConnector, RESTConnector, SalesforceConnector).

**Design Pattern:** Aggregate pattern - groups related actions

**Example:**
```java
ConnectorDefinition emailConnector = new ConnectorDefinition();
emailConnector.setId("email-connector");
emailConnector.setName("Email Service");
emailConnector.setDescription("Send emails via SMTP");
emailConnector.setActions(Map.of(
    "sendEmail", sendEmailAction,
    "sendTemplate", sendTemplateAction
));
```

---

### ActionDefinition

**Purpose:** Defines a specific action that can be performed through a connector.

**Responsibilities:**
- Specify action identity and purpose
- Define input parameters required for execution
- Define output parameters returned after execution
- Configure action-specific settings
- Enable action validation

**Fields:**
- `id` (`String`): Unique identifier within the connector
- `name` (`String`): Human-readable action name
- `description` (`String`): What the action does
- `inputs` (`List<VariableDefinition>`): Input parameters
- `outputs` (`List<VariableDefinition>`): Output parameters
- `configuration` (`Map<String, Object>`): Action configuration

**When to Use:** When defining specific operations within a connector (e.g., sendEmail, createUser, fetchData).

**Design Pattern:** Command pattern - represents an executable action

**Example:**

```java
ActionDefinition sendEmail = new ActionDefinition();
sendEmail.setId("sendEmail");
sendEmail.setName("Send Email");
sendEmail.setDescription("Send an email to recipients");
sendEmail.setInputs(Arrays.asList(toVar, subjectVar, bodyVar));
sendEmail.setOutputs(Arrays.asList(sentIdVar));
sendEmail.setConfiguration(Map.of(
    "smtpHost", "smtp.example.com",
    "smtpPort", 587
));
```

---

### VariableDefinition

**Purpose:** Defines a variable used as input or output in an action.

**Responsibilities:**
- Specify variable identity and type
- Define whether variable is required
- Provide default values
- Document variable purpose
- Enable type validation

**Fields:**
- `name` (`String`): Variable name
- `type` (`String`): Data type (String, Integer, Boolean, etc.)
- `description` (`String`): Variable purpose
- `required` (boolean): Must be provided?
- `defaultValue` (Object): Default value if not provided

**When to Use:** When defining parameters for connector actions.

**Design Pattern:** Value object pattern - represents a single variable

**Example:**
```java
VariableDefinition toVar = new VariableDefinition();
toVar.setName("to");
toVar.setType("String");
toVar.setDescription("Recipient email address");
toVar.setRequired(true);
toVar.setDefaultValue(null);
```

---

## Connector Definition

### Creating a Connector

```java
public class EmailConnectorDefinition {
    
    public static ConnectorDefinition create() {
        ConnectorDefinition connector = new ConnectorDefinition();
        connector.setId("email-connector");
        connector.setName("Email Service");
        connector.setDescription("Send emails via SMTP server");
        
        Map<String, ActionDefinition> actions = new HashMap<>();
        actions.put("sendEmail", createSendEmailAction());
        actions.put("sendTemplate", createSendTemplateAction());
        
        connector.setActions(actions);
        return connector;
    }
    
    private static ActionDefinition createSendEmailAction() {
        ActionDefinition action = new ActionDefinition();
        action.setId("sendEmail");
        action.setName("Send Email");
        action.setDescription("Send a plain text or HTML email");
        
        // Input variables
        List<VariableDefinition> inputs = Arrays.asList(
            createVariable("to", "String", "Recipient email", true),
            createVariable("cc", "String", "CC recipients", false),
            createVariable("bcc", "String", "BCC recipients", false),
            createVariable("from", "String", "Sender email", true),
            createVariable("subject", "String", "Email subject", true),
            createVariable("body", "String", "Email body", true),
            createVariable("isHtml", "Boolean", "Is HTML email", false)
        );
        action.setInputs(inputs);
        
        // Output variables
        List<VariableDefinition> outputs = Arrays.asList(
            createVariable("messageId", "String", "Sent message ID", false),
            createVariable("sentTime", "DateTime", "When email was sent", false)
        );
        action.setOutputs(outputs);
        
        // Configuration
        action.setConfiguration(Map.of(
            "smtpHost", "${email.smtp.host}",
            "smtpPort", 587,
            "authRequired", true,
            "starttls", true
        ));
        
        return action;
    }
    
    private static VariableDefinition createVariable(
            String name, String type, String description, boolean required) {
        VariableDefinition var = new VariableDefinition();
        var.setName(name);
        var.setType(type);
        var.setDescription(description);
        var.setRequired(required);
        return var;
    }
}
```

### Loading Connector from JSON

```java
public class ConnectorDefinitionLoader {
    
    public ConnectorDefinition loadFromJson(String json) {
        JsonNode node = objectMapper.readTree(json);
        
        ConnectorDefinition connector = new ConnectorDefinition();
        connector.setId(node.get("id").asText());
        connector.setName(node.get("name").asText());
        connector.setDescription(node.get("description").asText());
        
        Map<String, ActionDefinition> actions = new HashMap<>();
        node.get("actions").forEach(actionNode -> {
            String actionId = actionNode.get("id").asText();
            actions.put(actionId, loadAction(actionNode));
        });
        
        connector.setActions(actions);
        return connector;
    }
    
    private ActionDefinition loadAction(JsonNode actionNode) {
        ActionDefinition action = new ActionDefinition();
        action.setId(actionNode.get("id").asText());
        action.setName(actionNode.get("name").asText());
        action.setDescription(actionNode.get("description").asText());
        
        action.setInputs(loadVariables(actionNode.get("inputs")));
        action.setOutputs(loadVariables(actionNode.get("outputs")));
        action.setConfiguration(loadConfiguration(actionNode.get("configuration")));
        
        return action;
    }
}
```

---

## Action Definition

### Defining Action Inputs

```java
public class ActionInputDefinition {
    
    public static List<VariableDefinition> createRestActionInputs() {
        return Arrays.asList(
            // URL configuration
            createVariable("url", "String", "REST API endpoint URL", true),
            createVariable("method", "String", "HTTP method (GET, POST, etc.)", true),
            
            // Authentication
            createVariable("authType", "String", "Authentication type", false),
            createVariable("username", "String", "Username for auth", false),
            createVariable("password", "String", "Password for auth", false),
            createVariable("apiKey", "String", "API key", false),
            
            // Request configuration
            createVariable("headers", "Map", "HTTP headers", false),
            createVariable("body", "Object", "Request body", false),
            createVariable("queryParams", "Map", "Query parameters", false),
            
            // Timeout
            createVariable("timeout", "Integer", "Request timeout in ms", false)
        );
    }
    
    private static VariableDefinition createVariable(
            String name, String type, String description, boolean required) {
        VariableDefinition var = new VariableDefinition();
        var.setName(name);
        var.setType(type);
        var.setDescription(description);
        var.setRequired(required);
        if (!required) {
            var.setDefaultValue(null);
        }
        return var;
    }
}
```

### Defining Action Outputs

```java
public class ActionOutputDefinition {
    
    public static List<VariableDefinition> createRestActionOutputs() {
        return Arrays.asList(
            // Response data
            createVariable("statusCode", "Integer", "HTTP status code", false),
            createVariable("responseBody", "Object", "Response body", false),
            createVariable("responseHeaders", "Map", "Response headers", false),
            
            // Metadata
            createVariable("responseTime", "Long", "Response time in ms", false),
            createVariable("success", "Boolean", "Whether request succeeded", false),
            createVariable("errorMessage", "String", "Error message if failed", false)
        );
    }
    
    private static VariableDefinition createVariable(
            String name, String type, String description, boolean required) {
        VariableDefinition var = new VariableDefinition();
        var.setName(name);
        var.setType(type);
        var.setDescription(description);
        var.setRequired(required);
        return var;
    }
}
```

---

## Variable Definition

### Supported Types

```java
public class VariableTypeConstants {
    
    // Primitive types
    public static final String STRING = "String";
    public static final String INTEGER = "Integer";
    public static final String LONG = "Long";
    public static final String DOUBLE = "Double";
    public static final String BOOLEAN = "Boolean";
    
    // Complex types
    public static final String MAP = "Map";
    public static final String LIST = "List";
    public static final String OBJECT = "Object";
    
    // Special types
    public static final String DATE = "Date";
    public static final String DATETIME = "DateTime";
    public static final String INSTANT = "Instant";
    
    // File types
    public static final String FILE = "File";
    public static final String BYTE_ARRAY = "ByteArray";
}
```

### Variable Validation

```java
public class VariableValidator {
    
    public void validate(VariableDefinition variable, Object value) {
        // Check required
        if (variable.isRequired() && value == null) {
            throw new ValidationException(
                "Required variable '" + variable.getName() + "' is null");
        }
        
        // Check type
        if (value != null && !isTypeCompatible(variable.getType(), value.getClass())) {
            throw new ValidationException(
                "Variable '" + variable.getName() + 
                "' has incompatible type: expected " + variable.getType() + 
                ", got " + value.getClass().getName());
        }
    }
    
    private boolean isTypeCompatible(String expectedType, Class<?> actualType) {
        switch (expectedType) {
            case "String":
                return actualType == String.class;
            case "Integer":
                return actualType == Integer.class || actualType == int.class;
            case "Boolean":
                return actualType == Boolean.class || actualType == boolean.class;
            case "Map":
                return Map.class.isAssignableFrom(actualType);
            case "List":
                return List.class.isAssignableFrom(actualType);
            default:
                return actualType.getName().equals(expectedType);
        }
    }
}
```

---

## Usage Examples

### Email Connector in BPMN

```xml
<!-- BPMN Process with Email Connector -->
<process id="orderProcess">
    <startEvent id="start"/>
    
    <sequenceFlow sourceRef="start" targetRef="sendNotification"/>
    
    <!-- Service Task with Email Connector -->
    <serviceTask id="sendNotification" 
                  name="Send Order Notification"
                  activiti:connectorId="email-connector"
                  activiti:action="sendEmail">
        <extensionElements>
            <activiti:in source="order.customerEmail" target="to"/>
            <activiti:in expression="${'Order #' + orderId}" target="subject"/>
            <activiti:in source="orderDetails" target="body"/>
            <activiti:in expression="${true}" target="isHtml"/>
            <activiti:out source="messageId" target="emailMessageId"/>
        </extensionElements>
    </serviceTask>
    
    <sequenceFlow sourceRef="sendNotification" targetRef="end"/>
    <endEvent id="end"/>
</process>
```

### REST API Connector

```java
public class RestConnectorDefinition {
    
    public static ConnectorDefinition create() {
        ConnectorDefinition connector = new ConnectorDefinition();
        connector.setId("rest-connector");
        connector.setName("REST API Client");
        connector.setDescription("Make HTTP requests to REST APIs");
        
        Map<String, ActionDefinition> actions = new HashMap<>();
        actions.put("get", createGetAction());
        actions.put("post", createPostAction());
        actions.put("put", createPutAction());
        actions.put("delete", createDeleteAction());
        
        connector.setActions(actions);
        return connector;
    }
    
    private static ActionDefinition createGetAction() {
        ActionDefinition action = new ActionDefinition();
        action.setId("get");
        action.setName("GET Request");
        action.setDescription("Perform HTTP GET request");
        
        action.setInputs(Arrays.asList(
            createVariable("url", "String", "Request URL", true),
            createVariable("headers", "Map", "Request headers", false),
            createVariable("queryParams", "Map", "Query parameters", false),
            createVariable("timeout", "Integer", "Timeout in milliseconds", false)
        ));
        
        action.setOutputs(Arrays.asList(
            createVariable("response", "Object", "Response body", false),
            createVariable("statusCode", "Integer", "HTTP status code", false),
            createVariable("headers", "Map", "Response headers", false)
        ));
        
        return action;
    }
}
```

### Using Connector in Code

```java
@Service
public class OrderNotificationService {
    
    @Autowired
    private ConnectorExecutor connectorExecutor;
    
    public void sendOrderNotification(Order order) {
        // Execute email connector action
        Map<String, Object> inputs = new HashMap<>();
        inputs.put("to", order.getCustomerEmail());
        inputs.put("subject", "Order Confirmation: " + order.getId());
        inputs.put("body", generateOrderEmailBody(order));
        inputs.put("isHtml", true);
        
        Map<String, Object> result = connectorExecutor.execute(
            "email-connector",
            "sendEmail",
            inputs
        );
        
        // Store result
        order.setEmailMessageId((String) result.get("messageId"));
    }
}
```

---

## Best Practices

### 1. Use Descriptive Names

```java
// GOOD
connector.setId("salesforce-connector");
connector.setName("Salesforce CRM");
action.setId("createLead");
action.setName("Create Lead");

// BAD
connector.setId("c1");
connector.setName("c");
action.setId("a1");
action.setName("a");
```

### 2. Document All Variables

```java
// GOOD
VariableDefinition emailVar = new VariableDefinition();
emailVar.setName("recipientEmail");
emailVar.setType("String");
emailVar.setDescription("The email address of the order recipient");
emailVar.setRequired(true);

// BAD
VariableDefinition emailVar = new VariableDefinition();
emailVar.setName("e");
emailVar.setType("String");
```

### 3. Use Configuration for Constants

```java
// GOOD - SMTP settings in configuration
action.setConfiguration(Map.of(
    "smtpHost", "${email.smtp.host}",
    "smtpPort", 587,
    "authRequired", true
));

// BAD - Hardcoded in action
inputs.add(createVariable("smtpHost", "String", "SMTP host", true));
```

### 4. Validate Required Fields

```java
// GOOD
VariableDefinition toVar = new VariableDefinition();
toVar.setName("to");
toVar.setType("String");
toVar.setRequired(true);

// Ensure validation happens
validator.validate(toVar, inputValue);
```

### 5. Use Appropriate Types

```java
// GOOD
createVariable("orderAmount", "Double", "Order total", false);
createVariable("quantity", "Integer", "Item quantity", false);
createVariable("isActive", "Boolean", "Whether active", false);
createVariable("tags", "List", "Order tags", false);

// BAD
createVariable("orderAmount", "String", "Order total", false);
createVariable("quantity", "String", "Item quantity", false);
```

---

## API Reference

### ConnectorDefinition

**Fields:**
- `id` (`String`): Unique connector identifier
- `name` (`String`): Display name
- `description` (`String`): Detailed description
- `actions` (`Map<String, ActionDefinition>`): Available actions

**Methods:**
- `getId()` / `setId(String)`
- `getName()` / `setName(String)`
- `getDescription()` / `setDescription(String)`
- `getActions()` / `setActions(Map<String, ActionDefinition>)`

---

### ActionDefinition

**Fields:**
- `id` (`String`): Unique action identifier within connector
- `name` (`String`): Display name
- `description` (`String`): What the action does
- `inputs` (`List<VariableDefinition>`): Input parameters
- `outputs` (`List<VariableDefinition>`): Output parameters
- `configuration` (`Map<String, Object>`): Action configuration

**Methods:**
- `getId()` / `setId(String)`
- `getName()` / `setName(String)`
- `getDescription()` / `setDescription(String)`
- `getInputs()` / `setInputs(List<VariableDefinition>)`
- `getOutputs()` / `setOutputs(List<VariableDefinition>)`
- `getConfiguration()` / `setConfiguration(Map<String, Object>)`

---

### VariableDefinition

**Fields:**
- `name` (`String`): Variable name
- `type` (`String`): Data type
- `description` (`String`): Variable purpose
- `required` (boolean): Must be provided
- `defaultValue` (Object): Default value

**Methods:**
- `getName()` / `setName(String)`
- `getType()` / `setType(String)`
- `getDescription()` / `setDescription(String)`
- `isRequired()` / `setRequired(boolean)`
- `getDefaultValue()` / `setDefaultValue(Object)`

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Spring Connector](../core-common/spring-connector.md)
- [Common Utilities](../core-common/common-util.md)
