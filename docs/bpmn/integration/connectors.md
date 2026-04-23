---
sidebar_label: Connectors
slug: /bpmn/integration/connectors
description: Complete guide to connectors in Activiti for external system integration
---

# Connectors

**Important:** The Connector API (`org.activiti.api.process.runtime.connector.Connector` and `org.activiti.api.process.model.IntegrationContext`) belongs to the **Activiti 7/8 API layer** (`activiti-api` module), NOT the core engine (`activiti-engine` module). The core engine's `ServiceTaskParseHandler` does **not** handle connectors — it handles service tasks via `activiti:class`, `activiti:delegateExpression`, `activiti:expression`, `activiti:type` (mail, mule, camel, shell), and `operationRef` (webservice).

Connectors in the Activiti 7/8 API layer provide a **declarative way to integrate with external systems** from your BPMN processes. They enable you to call APIs, send emails, process data, and perform external operations using **JSON definitions** instead of writing custom Java code.

## Overview

```xml
<serviceTask id="processImage"
             name="Process Image"
             implementation="Process Image Connector.processImageActionName"/>
```

**Key Benefits:**
- **No Java Code Required** - Configure integrations declaratively
- **Reusable** - Define once, use across multiple processes
- **Type-Safe** - Input/output validation via JSON schema
- **Testable** - Easy to mock and test
- **Simple Syntax** - Just reference connector in `implementation` attribute

## What Are Connectors?

Connectors are **JSON-defined integration components** that bridge your BPMN processes with external systems. Each connector defines one or more **actions** that can be invoked from service tasks using a simple `implementation` attribute.

### Connector Architecture

```
┌─────────────────┐
│   BPMN Process  │
│  Service Task   │
│  implementation=│
│  "Connector.Action"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Connector     │
│   Definition    │
│   (JSON)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Connector     │
│   Implementation│
│   (Java Bean)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  External System│
│  (API, DB, etc) │
└─────────────────┘
```

## Connector Definition Structure

### Basic Structure

Connectors are defined in **JSON files** placed in `classpath:/connectors/`:

```json
{
  "id": "unique-connector-id",
  "name": "Human-readable name",
  "description": "What this connector does",
  "actions": {
    "action-id": {
      "id": "action-id",
      "name": "action-name",
      "description": "What this action does",
      "inputs": [...],
      "outputs": [...]
    }
  }
}
```

### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | | Unique identifier (used internally) |
| `name` | String | | **Used in BPMN** - Reference as `"name.action-name"` |
| `actions` | Object | | Map of action definitions |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | String | Connector description |

## Action Definitions

Each connector can define multiple **actions** (operations).

### Action Structure

```json
{
  "id": "action-id",
  "name": "action-name",
  "description": "What this action does",
  "inputs": [
    {
      "id": "input-id",
      "name": "input-name",
      "type": "string",
      "required": false,
      "description": "Input description"
    }
  ],
  "outputs": [
    {
      "id": "output-id",
      "name": "output-name",
      "type": "string",
      "description": "Output description"
    }
  ]
}
```

### Input/Output Types

Supported variable types:
- `string` - Text values
- `integer` - Whole numbers
- `long` - Large integers
- `double` - Decimal numbers
- `boolean` - True/false values
- `date` - Date/time values
- `object` - Complex objects (JSON)
- `list` - Arrays/collections

## Complete Examples

### Example 1: Image Processing Connector

**Connector Definition** (`process-image.json`):

```json
{
  "id": "processImageConnectorId",
  "name": "Process Image Connector",
  "description": "Process and analyze images",
  "actions": {
    "processImageActionId": {
      "id": "processImageActionId",
      "name": "processImageActionName",
      "description": "Process an image and return approval status",
      "inputs": [
        {
          "id": "input_variable_1",
          "name": "input_variable_name_1",
          "type": "string",
          "required": false,
          "description": "First input parameter"
        },
        {
          "id": "expectedKey",
          "name": "expectedKey",
          "type": "boolean",
          "required": false,
          "description": "Expected key for validation"
        }
      ],
      "outputs": [
        {
          "id": "approved",
          "name": "approved",
          "type": "boolean",
          "description": "Whether the image was approved"
        }
      ]
    }
  }
}
```

**BPMN Usage**:

```xml
<serviceTask id="Task_1ylvdew"
             name="Process Image"
             implementation="Process Image Connector.processImageActionName"/>
```

### Example 2: Tag Image Connector

**Connector Definition** (`tag-image.json`):

```json
{
  "id": "tagImageConnectorId",
  "name": "Tag Image Connector",
  "description": "Generate tags for images using AI",
  "actions": {
    "tagImageActionId": {
      "id": "tagImageActionId",
      "name": "tagImageActionName",
      "description": "Tag an image with descriptive labels",
      "inputs": [
        {
          "id": "imageUrl",
          "name": "imageUrl",
          "type": "string",
          "required": true,
          "description": "URL or path to the image"
        },
        {
          "id": "maxTags",
          "name": "maxTags",
          "type": "integer",
          "required": false,
          "description": "Maximum number of tags to return"
        }
      ],
      "outputs": [
        {
          "id": "tags",
          "name": "tags",
          "type": "list",
          "description": "List of generated tags"
        },
        {
          "id": "processingTime",
          "name": "processingTime",
          "type": "integer",
          "description": "Time taken to process in milliseconds"
        }
      ]
    }
  }
}
```

**BPMN Usage**:

```xml
<serviceTask id="Task_0snvh02"
             name="Tag categorized Image"
             implementation="Tag Image Connector.tagImageActionName"/>
```

### Example 3: Variable Mapping Connector

**Connector Definition** (`connector-with-variable-mapping.json`):

```json
{
  "id": "variableMappingConnectorId",
  "name": "Variable Mapping Connector",
  "description": "Demonstrate variable mapping between process and connector",
  "actions": {
    "variableMappingActionId": {
      "id": "variableMappingActionId",
      "name": "variableMappingActionName",
      "description": "Map process variables to connector inputs",
      "inputs": [
        {
          "id": "input-variable-1",
          "name": "input-variable-name-1",
          "type": "string",
          "required": false
        },
        {
          "id": "input-variable-2",
          "name": "input-variable-name-2",
          "type": "integer",
          "required": false
        },
        {
          "id": "input-variable-3",
          "name": "input-variable-name-3",
          "type": "integer",
          "required": false
        }
      ],
      "outputs": [
        {
          "id": "out-variable-1",
          "name": "out-variable-name-1",
          "type": "string"
        },
        {
          "id": "out-variable-2",
          "name": "out-variable-name-2",
          "type": "integer"
        }
      ]
    }
  }
}
```

**BPMN Usage**:

```xml
<serviceTask id="serviceTask"
             implementation="Variable Mapping Connector.variableMappingActionName"/>
```

### Example 4: Meals Connector (Simple)

**Connector Definition**:

```json
{
  "id": "mealsConnectorId",
  "name": "mealsConnector",
  "description": "Simple connector for meal selection",
  "actions": {
    "mealAction": {
      "id": "mealAction",
      "name": "mealAction",
      "inputs": [],
      "outputs": [
        {
          "id": "meal",
          "name": "meal",
          "type": "string"
        },
        {
          "id": "size",
          "name": "size",
          "type": "string"
        }
      ]
    }
  }
}
```

**BPMN Usage**:

```xml
<serviceTask id="serviceTask"
             implementation="mealsConnector.mealAction"
             name="Get Meal">
   <!-- Multi-instance support -->
   <multiInstanceLoopCharacteristics
     isSequential="false"
     activiti:collection="${items}"
     activiti:elementVariable="item"/>
</serviceTask>
```

## Using Connectors in BPMN

### Basic Usage

Reference a connector action in the `implementation` attribute:

```xml
<serviceTask id="task1"
             name="Task Name"
             implementation="Connector Name.Action Name"/>
```

**Format:** `"Connector Name.Action Name"`

- **Connector Name**: The `name` field from the JSON definition
- **Action Name**: The `name` field from the action definition

### With Process Variables

Process variables are **automatically mapped** to connector inputs based on name matching:

```xml
<serviceTask id="processImage"
             implementation="Process Image Connector.processImageActionName"/>
```

If the connector expects inputs `input_variable_name_1` and `expectedKey`, the process must have variables with those exact names.

### Output Variables

Connector outputs are **automatically set** as process variables:

```json
"outputs": [
  {
    "id": "approved",
    "name": "approved",
    "type": "boolean"
  }
]
```

After execution, `approved` will be available as a process variable.

## Creating Custom Connectors

### Implementing the Connector Interface

```java
import org.activiti.api.process.runtime.connector.Connector;
import org.activiti.api.process.model.IntegrationContext;

public class CustomConnector implements Connector {

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        // Get input variables
        String input1 = context.getInBoundVariable("input_variable_name_1", String.class);
        Boolean expectedKey = context.getInBoundVariable("expectedKey", Boolean.class);

        // Perform operation
        boolean approved = processInput(input1, expectedKey);

        // Set output variables
        context.addOutBoundVariable("approved", approved);

        return context;
    }

    private boolean processInput(String input1, Boolean expectedKey) {
        // Your business logic here
        return true;
    }
}
```

### Registering the Connector

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConnectorConfiguration {

    @Bean
    public Connector customConnector() {
        return new CustomConnector();
    }
}
```

### Example: MealsConnector

```java
import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Component("mealsConnector")
public class MealsConnector implements Connector {

    private AtomicInteger currentMealIndex = new AtomicInteger(0);
    private List<String> meals = Arrays.asList("pizza", "pasta");
    private List<String> sizes = Arrays.asList("small", "medium");

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        int remainder = currentMealIndex.getAndIncrement() % meals.size();
        integrationContext.addOutBoundVariable("meal", meals.get(remainder));
        integrationContext.addOutBoundVariable("size", sizes.get(remainder));
        return integrationContext;
    }
}
```

## Connector Configuration

### Location

Connectors are loaded from:
- **Default:** `classpath:/connectors/`
- **Custom:** Configured via `activiti.connectors.dir` property

### Spring Boot Configuration

```yaml
# application.yml
activiti:
  connectors:
    dir: classpath:/custom-connectors/  # Custom connector location
```

### Multiple Connector Directories

The `activiti.connectors.dir` property supports comma-separated paths:

```yaml
# application.yml
activiti:
  connectors:
    dir: classpath:/connectors/,classpath:/custom-connectors/
```

**Note:** `ConnectorDefinitionService` is auto-configured by Activiti. Only override it if you need custom behavior beyond what `activiti.connectors.dir` provides.

## Variable Mapping

### Automatic Name Matching

Connectors use **automatic variable mapping** based on name matching:

1. **Inputs**: Process variables with names matching connector input `name` fields are passed to the connector
2. **Outputs**: Connector output `name` fields become process variables after execution

### Example

**Connector Definition:**
```json
{
  "inputs": [
    {
      "id": "input-variable-1",
      "name": "input-variable-name-1",
      "type": "string"
    }
  ],
  "outputs": [
    {
      "id": "out-variable-1",
      "name": "out-variable-name-1",
      "type": "string"
    }
  ]
}
```

**Process Variables Before:**
```java
Map<String, Object> variables = Map.of(
    "input-variable-name-1", "some value"  // Matches connector input
);
```

**Process Variables After:**
```java
// Automatically set by connector
"out-variable-name-1": "result value"
```

### Expression Support

Some connectors support expressions in variable mapping:

```xml
<serviceTask id="serviceTask"
             implementation="Variable Mapping Expression Connector.variableMappingExpressionActionName"/>
```

## Testing Connectors

### Unit Testing

```java
@SpringBootTest
public class CustomConnectorTest {

    @Autowired
    private Connector customConnector;

    @Test
    public void testConnectorExecution() {
        // Create test context
        IntegrationContext context = new IntegrationContext();
        context.addInBoundVariable("input_variable_name_1", "test value");
        context.addInBoundVariable("expectedKey", true);

        // Execute connector
        IntegrationContext result = customConnector.apply(context);

        // Verify outputs
        Boolean approved = result.getOutBoundVariable("approved", Boolean.class);
        assertTrue(approved);
    }
}
```

### Integration Testing

```java
@SpringBootTest
public class ProcessWithConnectorIT {

    @Autowired
    private ProcessRuntime processRuntime;

    @Test
    public void testProcessWithConnector() {
        // Start process with required variables
        ProcessInstance process = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("connectorProcess")
                .withVariable("input_variable_name_1", "test")
                .withVariable("expectedKey", true)
                .build()
        );

        // Process should complete automatically
        assertThat(process.getState()).isEqualTo(ProcessInstanceState.COMPLETED);

        // Verify output variables
        List<VariableInstance> variables = processRuntime.variables(
            ProcessPayloadBuilder.variables()
                .withProcessInstance(process)
                .build()
        );

        assertThat(variables)
            .extracting(VariableInstance::getName, VariableInstance::getValue)
            .containsTuple("approved", true);
    }
}
```

## Best Practices

### 1. Use Meaningful Names

```json
// GOOD
{
  "name": "Salesforce CRM Connector",
  "actions": {
    "createLeadActionId": {
      "name": "createLead"
    }
  }
}

// BAD
{
  "name": "conn1",
  "actions": {
    "act1": {
      "name": "act1"
    }
  }
}
```

### 2. Document Inputs/Outputs

```json
{
  "inputs": [
    {
      "id": "userId",
      "name": "userId",
      "type": "string",
      "required": true,
      "description": "Unique identifier for the user in the external system"
    }
  ]
}
```

### 3. Keep Actions Focused

```json
// GOOD: Single action per purpose
{
  "actions": {
    "createLead": {...},
    "updateLead": {...},
    "deleteLead": {...}
  }
}

// BAD: Multiple responsibilities in one action
{
  "actions": {
    "manageLead": {...}  // Too vague
  }
}
```

### 4. Handle Errors Gracefully

```java
public IntegrationContext apply(IntegrationContext context) {
    try {
        // Perform operation
        return context;
    } catch (Exception e) {
        // Set error output or rethrow
        context.addOutBoundVariable("error", e.getMessage());
        return context;
    }
}
```

### 5. Use Async for Long Operations

```xml
<serviceTask id="longRunningTask"
             implementation="Heavy Processing Connector.process"
             activiti:async="true"/>
```

## Common Pitfalls

### 1. Name Mismatch

**Problem:** Connector not found

```xml
<!-- BAD: Name doesn't match JSON -->
<serviceTask implementation="Wrong Name.Action"/>

<!-- GOOD: Exact match -->
<serviceTask implementation="Process Image Connector.processImageActionName"/>
```

**Solution:** Ensure `implementation` matches `"name.action-name"` from JSON exactly.

### 2. Missing Variables

**Problem:** Required input variables not provided

```json
{
  "inputs": [
    {
      "name": "requiredInput",
      "type": "string",
      "required": true
    }
  ]
}
```

**Solution:** Ensure process has all required variables before reaching the service task.

### 3. Type Mismatches

**Problem:** Variable type doesn't match connector expectation

```json
{
  "inputs": [
    {
      "name": "count",
      "type": "integer"
    }
  ]
}
```

If process variable `count` is a String, the connector may fail.

**Solution:** Ensure variable types match connector definition.

### 4. Connector Not Loaded

**Problem:** `Connector with name 'X' not found`

**Solutions:**
- Verify JSON file is in `classpath:/connectors/`
- Check `activiti.connectors.dir` configuration
- Ensure connector Java bean is registered
- Restart application after adding new connector

## Troubleshooting

### Connector Not Found

**Error:** `Connector with name 'Process Image Connector' not found`

**Causes:**
1. JSON file not in correct directory
2. Connector name doesn't match
3. Connector definition service not loaded

**Solutions:**
- Check `classpath:/connectors/` directory
- Verify JSON `name` field matches implementation reference
- Ensure `ConnectorDefinitionService` bean is configured

### Action Not Found

**Error:** `Action 'processImageActionName' not found`

**Causes:**
1. Action name doesn't match JSON
2. Typo in implementation attribute

**Solutions:**
- Verify action `name` in JSON definition
- Check implementation string: `"Connector Name.Action Name"`

### Variable Mapping Issues

**Problem:** Input variables not passed correctly

**Solutions:**
- Ensure process variable names match connector input `name` fields exactly
- Check variable types are compatible
- Verify variables exist before service task execution

### Performance Issues

**Problem:** Connector execution is slow

**Solutions:**
- Use `activiti:async="true"` for long-running operations
- Add timeouts to external calls
- Implement caching where appropriate
- Optimize connector Java implementation

## Related Documentation

- [Service Task](../elements/service-task.md) - Using connectors in service tasks
- [Integration Patterns](../integration/index.md) - Other integration approaches
- [Variables](../advanced/variables.md) - Variable mapping and scope
- [Async Execution](../advanced/async-execution.md) - Background processing

---
