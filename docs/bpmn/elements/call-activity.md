---
sidebar_label: Call Activity
slug: /bpmn/elements/call-activity
title: "Call Activity"
description: "Complete guide to CallActivity elements for reusing global tasks and sub-processes with variable mapping and dynamic selection."
---

# Call Activity

Call Activities **reference and execute** sub-processes, enabling process modularity, reuse, and better organization of complex workflows.

**Note:** As stated in `CallActivityBehavior.java`, this is "limited currently to calling a subprocess and **not (yet) a global task**."

## Overview

```xml
<callActivity id="call1" name="Call SubProcess" calledElement="subProcessKey">
  <extensionElements>
    <activiti:in source="inputVar" target="outputVar"/>
    <activiti:out source="outputVar" target="inputVar"/>
  </extensionElements>
</callActivity>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Variable mapping, dynamic selection

**Important:** The `calledElement` attribute is a **standard BPMN attribute** (not prefixed with `activiti:`). It references the key of a deployed process or global task.

## Key Features

### Standard BPMN Features
- **Called Element** - Reference to global task/sub-process
- **Input/Output Data** - Variable mapping
- **Multi-instance** - Parallel executions

### Activiti Customizations
- **Called Element Expression** - Dynamic process selection
- **Variable Mapping** - Input/output parameters via `<activiti:in>` and `<activiti:out>`
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

### With Variable Mapping (Recommended)

```xml
<callActivity id="mappedCall" 
              name="Mapped SubProcess" 
              calledElement="subProcess">
  
  <extensionElements>
    <!-- Input mappings: from parent to called process -->
    <activiti:in source="orderId" target="order.id"/>
    <activiti:in sourceExpression="${order.customerId}" target="customerId"/>
    
    <!-- Output mappings: from called process to parent -->
    <activiti:out source="result.status" target="orderStatus"/>
    <activiti:out sourceExpression="${completionTime}" target="order.completedAt"/>
  </extensionElements>
</callActivity>
```

**Input/Output Mapping Attributes:**
- `source` - Variable name in source scope
- `sourceExpression` - Expression to evaluate in source scope
- `target` - Variable name in target scope

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
              calledElement="fulfillmentProcess">
  
  <extensionElements>
    <activiti:in source="orderId" target="order.id"/>
    <activiti:in sourceExpression="${order.items}" target="items"/>
    <activiti:in source="customer" target="customerData"/>
    <activiti:out source="fulfillmentStatus" target="status"/>
    <activiti:out source="trackingNumber" target="tracking"/>
  </extensionElements>
</callActivity>
```

### Example 3: Dynamic Process Selection

```xml
<callActivity id="dynamicFulfillment" 
              name="Dynamic Fulfillment" 
              calledElement="${determineFulfillmentProcess(order.type)}">
  
  <extensionElements>
    <activiti:in source="order" target="inputOrder"/>
    <activiti:out source="result" target="fulfillmentResult"/>
  </extensionElements>
</callActivity>
```

### Example 4: Multi-Instance Call

```xml
<callActivity id="batchProcessing" 
             name="Process Batch" 
             calledElement="itemProcessingSubProcess">
  
  <extensionElements>
    <activiti:in source="item" target="currentItem"/>
  </extensionElements>
  
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${batchItems}"
    activiti:elementVariable="item">
    <completionCondition>${processedCount >= totalCount}</completionCondition>
  </multiInstanceLoopCharacteristics>
</callActivity>
```

### Example 5: Nested Call Activities

```xml
<!-- Top-level process calls sub-process -->
<callActivity id="callOrderProcess" 
              name="Order Process" 
              calledElement="orderManagement">
  
  <extensionElements>
    <activiti:in source="order" target="inputOrder"/>
  </extensionElements>
</callActivity>

<!-- Sub-process can call other sub-processes -->
<!-- Defined in orderManagement process -->
<callActivity id="callPayment" 
              name="Payment" 
              calledElement="paymentProcessing"/>

<callActivity id="callShipping" 
              name="Shipping" 
              calledElement="shippingProcess"/>
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
- [Multi-Instance](../advanced/multi-instance.md)
- [Variable Scope](../advanced/variables.md)

---

