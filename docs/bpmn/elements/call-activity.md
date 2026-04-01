---
sidebar_label: Call Activity
slug: /bpmn/elements/call-activity
description: Guide to CallActivity elements for reusing global tasks and sub-processes
---

# Call Activity

Call Activities **reference and execute** global tasks or sub-processes, enabling process modularity and reuse.

## 📋 Overview

```xml
<callActivity id="call1" name="Call SubProcess" activiti:calledElement="subProcessKey"/>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ Variable mapping, dynamic selection

## 🎯 Key Features

### Standard BPMN Features
- **Called Element** - Reference to global task/sub-process
- **Input/Output Data** - Variable mapping
- **Multi-instance** - Parallel executions

### Activiti Customizations
- **Called Element Expression** - Dynamic process selection
- **Variable Mapping** - Input/output parameters
- **Case Support** - Integration with Case Engine
- **Async Execution** - Background invocation
- **Custom Properties** - Metadata extension
- **Execution Listeners** - Lifecycle hooks

## 📝 Configuration Options

### Static Called Element

```xml
<callActivity id="callSubProcess" 
              name="Process Order" 
              activiti:calledElement="orderSubProcess"/>
```

### Dynamic Called Element

```xml
<callActivity id="dynamicCall" 
              name="Dynamic SubProcess" 
              activiti:calledElement="${determineSubProcess()}"/>
```

### With Variable Mapping

```xml
<callActivity id="mappedCall" 
              name="Mapped SubProcess" 
              activiti:calledElement="subProcess">
  
  <ioSpecification>
    <inputDataItem name="orderId"/>
    <inputDataItem name="customerData"/>
    <outputDataItem name="result"/>
  </ioSpecification>
  
  <dataInputAssociation>
    <sourceRef>processOrder</sourceRef>
    <targetRef>orderId</targetRef>
  </dataInputAssociation>
</callActivity>
```

## 🔧 Advanced Features

### Async Execution

```xml
<callActivity id="asyncCall" 
              name="Async SubProcess" 
              activiti:calledElement="subProcess"
              activiti:async="true"/>
```

### Multi-Instance Call Activity

```xml
<callActivity id="multiCall" 
              name="Parallel SubProcesses" 
              activiti:calledElement="subProcess">
  
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
              activiti:calledElement="subProcess">
  
  <activiti:executionListener event="start" class="com.example.CallStartListener"/>
  <activiti:executionListener event="end" class="com.example.CallEndListener"/>
</callActivity>
```

## 💡 Complete Examples

### Example 1: Simple Sub-Process Call

```xml
<!-- Call a deployed sub-process -->
<callActivity id="callPaymentProcess" 
              name="Process Payment" 
              activiti:calledElement="paymentSubProcess"/>
```

### Example 2: Call with Variable Mapping

```xml
<callActivity id="callOrderFulfillment" 
              name="Fulfill Order" 
              activiti:calledElement="fulfillmentProcess">
  
  <extensionElements>
    <activiti:in name="orderId" expression="${order.id}"/>
    <activiti:in name="items" expression="${order.items}"/>
    <activiti:in name="customer" expression="${order.customer}"/>
    <activiti:out name="fulfillmentStatus" variableName="status"/>
    <activiti:out name="trackingNumber" variableName="tracking"/>
  </extensionElements>
</callActivity>
```

### Example 3: Dynamic Process Selection

```xml
<callActivity id="dynamicFulfillment" 
              name="Dynamic Fulfillment" 
              activiti:calledElement="${determineFulfillmentProcess(order.type)}">
  
  <extensionElements>
    <activiti:in name="order" expression="${order}"/>
    <activiti:out name="result" variableName="fulfillmentResult"/>
  </extensionElements>
</callActivity>
```

### Example 4: Multi-Instance Call

```xml
<callActivity id="batchProcessing" 
              name="Process Batch" 
              activiti:calledElement="itemProcessingSubProcess">
  
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${batchItems}"
    activiti:elementVariable="item">
    <completionCondition>${processedCount >= totalCount}</completionCondition>
    
    <inputDataItem name="currentItem">
      <assignment>
        <from>${item}</from>
        <to>${currentItem}</to>
      </assignment>
    </inputDataItem>
  </multiInstanceLoopCharacteristics>
</callActivity>
```

### Example 5: Nested Call Activities

```xml
<!-- Top-level process calls sub-process -->
<callActivity id="callOrderProcess" 
              name="Order Process" 
              activiti:calledElement="orderManagement">
  
  <extensionElements>
    <activiti:in name="orderData" expression="${order}"/>
  </extensionElements>
</callActivity>

<!-- Sub-process can call other sub-processes -->
<!-- Defined in orderManagement process -->
<callActivity id="callPayment" 
              name="Payment" 
              activiti:calledElement="paymentProcessing"/>

<callActivity id="callShipping" 
              name="Shipping" 
              activiti:calledElement="shippingProcess"/>
```

## 🔍 Runtime API Usage

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

## 📊 Best Practices

1. **Reuse Common Logic:** Extract repeated flows to sub-processes
2. **Clear Naming:** Use descriptive called element keys
3. **Minimal Variables:** Only pass necessary data
4. **Document Interfaces:** Define input/output contracts
5. **Version Control:** Manage sub-process versions
6. **Error Handling:** Add boundary events for failures
7. **Async for Long Runs:** Prevent blocking parent process
8. **Test Independently:** Verify sub-processes separately

## ⚠️ Common Pitfalls

- **Circular References:** Sub-process calling parent
- **Missing Variables:** Required inputs not provided
- **Version Mismatches:** Sub-process signature changes
- **Performance Issues:** Deep nesting of calls
- **Variable Scope:** Understanding inheritance
- **Transaction Boundaries:** Cross-process transactions

## 🔗 Related Documentation

- [SubProcesses](../subprocesses/regular-subprocess.md)
- [Multi-Instance](../advanced/multi-instance.md)
- [Variable Scope](../advanced/variables.md)

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated:** 2024
