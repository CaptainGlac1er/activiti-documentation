---
sidebar_label: Call Activity
slug: /bpmn/elements/call-activity
title: "Call Activity"
description: "Complete guide to CallActivity elements for reusing sub-processes with variable mapping and dynamic selection."
---

# Call Activity

Call Activities **reference and execute** sub-processes, enabling process modularity, reuse, and better organization of complex workflows.

**Note:** As stated in `CallActivityBehavior.java`, this is "limited currently to calling a subprocess and **not (yet) a global task**."

## Overview

```xml
<callActivity id="call1" name="Call SubProcess" calledElement="subProcessKey"/>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Dynamic selection, variable inheritance, business key handling

> **Note:** Variable mapping for call activities is configured via **process extension JSON** (`*-extension.json`), not through `<activiti:in>` or `<activiti:out>` XML elements. See the [Variable Mapping](#variable-mapping) section below and the [Process Extensions guide](../reference/process-extensions.md) for details.

**Important:** The `calledElement` attribute is a **standard BPMN attribute** (not prefixed with `activiti:`). It references the key of a deployed process.

## Key Features

### Standard BPMN Features
- **Called Element** - Reference to a sub-process
- **Input/Output Data** - Variable mapping via process extension JSON
- **Multi-instance** - Parallel executions

### Activiti Customizations
- **Called Element Expression** - Dynamic process selection
- **Variable Mapping** - Input/output parameters via process extension JSON (`*-extension.json`)
- **Async Execution** - Background invocation
- **Inherit Variables** - Pass all parent variables via `activiti:inheritVariables="true"`
- **Business Key** - Set a specific business key via `activiti:businessKey`
- **Inherit Business Key** - Inherit from parent via `activiti:inheritBusinessKey="true"`
- **Execution Listeners** - Lifecycle hooks

## Configuration Options

### Static Called Element

```xml
<callActivity id="callSubProcess" 
              name="Process Order" 
              calledElement="orderSubProcess"/>
```

### Dynamic Called Element

```xml
<callActivity id="dynamicCall"
              name="Dynamic SubProcess"
              calledElement="${determineSubProcess()}"/>
```

### Business Key Configuration

Set a specific business key or inherit from the parent process:

```xml
<!-- Set explicit business key (supports expressions) -->
<callActivity id="callWithBusinessKey"
              name="Call with Business Key"
              calledElement="subProcess"
              activiti:businessKey="${order.id}"/>

<!-- Inherit business key from parent -->
<callActivity id="callInheritKey"
              name="Call Inheriting Key"
              calledElement="subProcess"
              activiti:inheritBusinessKey="true"/>
```

### Variable Mapping

Variable mapping for call activities is configured via **process extension JSON** (`*-extension.json`), not through XML elements. The `CallActivityXMLConverter` does not parse `<activiti:in>` or `<activiti:out>` elements. [Source: `CallActivityXMLConverter.java` — verified no `<activiti:in>` or `<activiti:out>` element handling exists in the converter.]

**subProcess-extension.json:**
```json
{
  "extensions": {
    "Process_myProcess": {
      "mappings": {
        "mappedCall": {
          "inputs": {
            "order.id": { "type": "VARIABLE", "value": "orderId" },
            "customerId": { "type": "EXPRESSION", "value": "${order.customerId}" }
          },
          "outputs": {
            "orderStatus": { "type": "VARIABLE", "value": "result.status" },
            "order.completedAt": { "type": "EXPRESSION", "value": "${completionTime}" }
          }
        }
      }
    }
  }
}
```

**Mapping Types:**
- `VARIABLE` - Map a process variable by name
- `EXPRESSION` - Evaluate an expression and assign the result
- `VALUE` - Pass a literal value

> For full details on the extension JSON format, see the [Process Extensions guide](../reference/process-extensions.md).

## Advanced Features

### Async Execution

```xml
<callActivity id="asyncCall" 
              name="Async SubProcess" 
              calledElement="subProcess"
              activiti:async="true"/>
```

### Multi-Instance Call Activity

```xml
<callActivity id="multiCall" 
              name="Parallel SubProcesses" 
              calledElement="subProcess">
  
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${items}"
    activiti:elementVariable="item">
  </multiInstanceLoopCharacteristics>
</callActivity>
```

### Execution Listeners

```xml
<callActivity id="trackedCall" 
              calledElement="subProcess">
  
  <extensionElements>
    <activiti:executionListener event="start" class="com.example.CallStartListener"/>
    <activiti:executionListener event="end" class="com.example.CallEndListener"/>
  </extensionElements>
</callActivity>
```

## Complete Examples

### Example 1: Simple Sub-Process Call

```xml
<!-- Call a deployed sub-process -->
<callActivity id="callPaymentProcess" 
              name="Process Payment" 
              calledElement="paymentSubProcess"/>
```

### Example 2: Call with Variable Mapping

```xml
<callActivity id="callOrderFulfillment" 
              name="Fulfill Order" 
              calledElement="fulfillmentProcess"/>
```

Variable mapping is configured via `fulfillmentProcess-extension.json`:

```json
{
  "extensions": {
    "Process_myProcess": {
      "mappings": {
        "callOrderFulfillment": {
          "inputs": {
            "order.id": { "type": "VARIABLE", "value": "orderId" },
            "items": { "type": "EXPRESSION", "value": "${order.items}" },
            "customerData": { "type": "VARIABLE", "value": "customer" }
          },
          "outputs": {
            "status": { "type": "VARIABLE", "value": "fulfillmentStatus" },
            "tracking": { "type": "VARIABLE", "value": "trackingNumber" }
          }
        }
      }
    }
  }
}
```

### Example 3: Dynamic Process Selection

```xml
<callActivity id="dynamicFulfillment" 
              name="Dynamic Fulfillment" 
              calledElement="${determineFulfillmentProcess(order.type)}"/>
```

Variable mapping for the dynamic call:

```json
{
  "extensions": {
    "Process_myProcess": {
      "mappings": {
        "dynamicFulfillment": {
          "inputs": {
            "inputOrder": { "type": "VARIABLE", "value": "order" }
          },
          "outputs": {
            "fulfillmentResult": { "type": "VARIABLE", "value": "result" }
          }
        }
      }
    }
  }
}
```

### Example 4: Multi-Instance Call

```xml
<callActivity id="batchProcessing" 
              name="Process Batch" 
              calledElement="itemProcessingSubProcess">
  
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${batchItems}"
    activiti:elementVariable="item">
    <completionCondition>${processedCount >= totalCount}</completionCondition>
  </multiInstanceLoopCharacteristics>
</callActivity>
```

If variable mapping is needed for each instance, configure it via process extension JSON:

```json
{
  "extensions": {
    "Process_myProcess": {
      "mappings": {
        "batchProcessing": {
          "inputs": {
            "currentItem": { "type": "VARIABLE", "value": "item" }
          }
        }
      }
    }
  }
}
```

### Example 5: Nested Call Activities

```xml
<!-- Top-level process calls sub-process -->
<callActivity id="callOrderProcess" 
              name="Order Process" 
              calledElement="orderManagement"/>

<!-- Sub-process can call other sub-processes -->
<!-- Defined in orderManagement process -->
<callActivity id="callPayment" 
              name="Payment" 
              calledElement="paymentProcessing"/>

<callActivity id="callShipping" 
              name="Shipping" 
              calledElement="shippingProcess"/>
```

To pass variables in nested calls, use process extension JSON:

```json
{
  "extensions": {
    "Process_myProcess": {
      "mappings": {
        "callOrderProcess": {
          "inputs": {
            "inputOrder": { "type": "VARIABLE", "value": "order" }
          }
        }
      }
    }
  }
}
```

## Runtime API Usage

### Starting Called Process

```java
// Call activity automatically starts the referenced process
// when reached in the parent process

// You can also start it directly
ProcessInstance subProcess = runtimeService.startProcessInstanceByKey("subProcessKey");
```

### Variable Mapping at Runtime

```java
// Set variables before call activity
runtimeService.setVariable(executionId, "inputData", data);

// Access output variables after call completes
Object output = runtimeService.getVariable(executionId, "outputData");
```

## Best Practices

1. **Reuse Common Logic:** Extract repeated flows to sub-processes
2. **Clear Naming:** Use descriptive called element keys
3. **Minimal Variables:** Only pass necessary data
4. **Document Interfaces:** Define input/output contracts
5. **Version Control:** Manage sub-process versions
6. **Error Handling:** Add boundary events for failures
7. **Async for Long Runs:** Prevent blocking parent process
8. **Test Independently:** Verify sub-processes separately

## Common Pitfalls

- **Circular References:** Sub-process calling parent
- **Missing Variables:** Required inputs not provided
- **Version Mismatches:** Sub-process signature changes
- **Performance Issues:** Deep nesting of calls
- **Variable Scope:** Understanding inheritance
- **Transaction Boundaries:** Cross-process transactions

## Related Documentation

- [SubProcesses](../subprocesses/regular-subprocess.md)
- [Multi-Instance](../reference/multi-instance.md)
- [Variable Scope](../reference/variables.md)

---
