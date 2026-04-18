---
sidebar_label: Sequence Flows
slug: /bpmn/elements/sequence-flows
description: Complete guide to Sequence Flows in Activiti - connecting activities with conditions and expressions
---

# Sequence Flows

Sequence Flows **connect flow elements** (activities, events, gateways) and define the order of execution in a BPMN process. They can include **conditions** that determine whether a path is taken.

## Overview

```xml
<sequenceFlow id="flow1" sourceRef="task1" targetRef="task2"/>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Condition expressions, SpEL support

## Key Features

### Standard BPMN Features
- **Source and Target** - Connect two flow elements
- **Condition Expressions** - Guard outgoing flows
- **Default Flow** - Fallback when no condition matches
- **Sequence Flow Name** - Documentation label

### Activiti Extensions
- **SpEL Expressions** - Spring Expression Language support
- **Delegate Expressions** - Java method evaluation
- **Variable Access** - Process variable conditions
- **Complex Conditions** - Multiple criteria evaluation

## Basic Syntax

### Simple Sequence Flow

```xml
<sequenceFlow id="flow1" 
              sourceRef="startEvent" 
              targetRef="userTask1"/>
```

### Named Sequence Flow

```xml
<sequenceFlow id="flow1" name="Approved Path" 
              sourceRef="gateway" 
              targetRef="approvalTask"/>
```

### Conditional Sequence Flow

```xml
<sequenceFlow id="flow1" name="High Value" 
              sourceRef="decisionGateway" 
              targetRef="managerApproval">
  <conditionExpression xsi:type="tFormalExpression">
    <![CDATA[${orderAmount > 10000}]]>
  </conditionExpression>
</sequenceFlow>
```

## Condition Expressions

### 1. Variable Comparison

```xml
<sequenceFlow id="approvedFlow" name="Approved">
  <conditionExpression>${status == 'APPROVED'}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="rejectedFlow" name="Rejected">
  <conditionExpression>${status == 'REJECTED'}</conditionExpression>
</sequenceFlow>
```

### 2. Numeric Conditions

```xml
<sequenceFlow id="highValue" name="High Value Order">
  <conditionExpression>${orderAmount > 10000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="mediumValue" name="Medium Value Order">
  <conditionExpression>${orderAmount >= 1000 && orderAmount <= 10000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="lowValue" name="Low Value Order">
  <conditionExpression>${orderAmount < 1000}</conditionExpression>
</sequenceFlow>
```

### 3. String Conditions

```xml
<sequenceFlow id="domestic" name="Domestic">
  <conditionExpression>${customerCountry == 'US'}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="international" name="International">
  <conditionExpression>${customerCountry != 'US'}</conditionExpression>
</sequenceFlow>
```

### 4. Complex Conditions

```xml
<sequenceFlow id="priorityFlow" name="Priority Processing">
  <conditionExpression>${order.priority == 'HIGH' && order.amount > 5000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="standardFlow" name="Standard Processing">
  <conditionExpression>${order.priority == 'STANDARD' || order.amount <= 5000}</conditionExpression>
</sequenceFlow>
```

### 5. SpEL Expressions

```xml
<sequenceFlow id="spElFlow" name="SPeL Condition">
  <conditionExpression>#{#orderValidator.isExpedited(order)}</conditionExpression>
</sequenceFlow>
```

### 6. Method Calls

```xml
<sequenceFlow id="methodFlow" name="Method Evaluation">
  <conditionExpression>${checkInventory(item)}</conditionExpression>
</sequenceFlow>
```

## Default Flows

A default flow specifies the sequence flow to take when no condition expressions on outgoing flows evaluate to `true`. The `default` attribute is placed on the **gateway element** (not the sequence flow) and references the `id` of the target sequence flow.

**BPMN 2.0 Standard:** Fully Supported  
**Namespace:** BPMN 2.0 (standard attribute, not an Activiti extension)

### Exclusive Gateway with Default Flow

```xml
<exclusiveGateway id="decisionGateway" name="Decision Point" default="elseFlow">

  <sequenceFlow id="approvedFlow" targetRef="approveTask">
    <conditionExpression>${approved == true}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="rejectedFlow" targetRef="rejectTask">
    <conditionExpression>${approved == false}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="elseFlow" targetRef="escalateTask"/>

</exclusiveGateway>
```

**Behavior:**
- If `approved == true` → takes `approvedFlow`
- If `approved == false` → takes `rejectedFlow`
- If neither condition matches (e.g., `approved` is `null`) → takes `elseFlow` (the default)

### Inclusive Gateway with Default Flow

```xml
<inclusiveGateway id="notificationGateway" name="Send Notifications" default="logFlow">

  <sequenceFlow id="emailFlow" targetRef="sendEmail">
    <conditionExpression>${sendEmail}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="smsFlow" targetRef="sendSMS">
    <conditionExpression>${sendSMS}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="logFlow" targetRef="logNoNotifications"/>

</inclusiveGateway>
```

**Behavior:**
- If `sendEmail` or `sendSMS` is true → activates corresponding path(s)
- If both are false → takes `logFlow` (the default)

## Complete Examples

### Example 1: Order Processing with Conditions

```xml
<process id="orderProcess" name="Order Processing">
  
  <startEvent id="start"/>
  
  <serviceTask id="validateOrder" name="Validate Order"/>
  
  <exclusiveGateway id="validationCheck" name="Valid?">
    
    <sequenceFlow id="validFlow" 
                  sourceRef="validationCheck" 
                  targetRef="checkInventory">
      <conditionExpression>${validationResult.valid == true}</conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="invalidFlow" 
                  sourceRef="validationCheck" 
                  targetRef="rejectOrder">
      <conditionExpression>${validationResult.valid == false}</conditionExpression>
    </sequenceFlow>
    
  </exclusiveGateway>
  
  <serviceTask id="checkInventory" name="Check Inventory"/>
  
  <exclusiveGateway id="inventoryCheck" name="In Stock?">
    
    <sequenceFlow id="inStockFlow" 
                  sourceRef="inventoryCheck" 
                  targetRef="processPayment">
      <conditionExpression>${inventory.available == true}</conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="outOfStockFlow" 
                  sourceRef="inventoryCheck" 
                  targetRef="backorder">
      <conditionExpression>${inventory.available == false}</conditionExpression>
    </sequenceFlow>
    
  </exclusiveGateway>
  
  <serviceTask id="processPayment" name="Process Payment"/>
  <serviceTask id="backorder" name="Create Backorder"/>
  <serviceTask id="rejectOrder" name="Reject Order"/>
  
  <endEvent id="end"/>
  
  <!-- Connect remaining flows -->
  <sequenceFlow id="flow1" sourceRef="start" targetRef="validateOrder"/>
  <sequenceFlow id="flow2" sourceRef="validateOrder" targetRef="validationCheck"/>
  <sequenceFlow id="flow3" sourceRef="processPayment" targetRef="end"/>
  <sequenceFlow id="flow4" sourceRef="backorder" targetRef="end"/>
  <sequenceFlow id="flow5" sourceRef="rejectOrder" targetRef="end"/>
  
</process>
```

### Example 2: Amount-Based Routing

```xml
<exclusiveGateway id="amountGateway" name="Order Amount">

  <sequenceFlow id="smallOrder"
                sourceRef="amountGateway"
                targetRef="autoApprove">
    <conditionExpression>${orderAmount < 1000}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="mediumOrder"
                sourceRef="amountGateway"
                targetRef="managerApproval">
    <conditionExpression>${orderAmount >= 1000 && orderAmount < 10000}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="largeOrder"
                sourceRef="amountGateway"
                targetRef="directorApproval">
    <conditionExpression>${orderAmount >= 10000}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="defaultOrder"
                sourceRef="amountGateway"
                targetRef="standardProcessing"/>

</exclusiveGateway>
```

### Example 3: Multi-Criteria Decision

```xml
<exclusiveGateway id="priorityGateway" name="Priority Check">

  <sequenceFlow id="vipFlow"
                sourceRef="priorityGateway"
                targetRef="vipProcessing">
    <conditionExpression>${customer.vip == true && orderAmount > 5000}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="urgentFlow"
                sourceRef="priorityGateway"
                targetRef="urgentProcessing">
    <conditionExpression>${order.urgent == true}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="highValueFlow"
                sourceRef="priorityGateway"
                targetRef="highValueProcessing">
    <conditionExpression>${orderAmount > 10000}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="normalFlow"
                sourceRef="priorityGateway"
                targetRef="normalQueue"/>

</exclusiveGateway>
```

### Example 4: Using SpEL Methods

```xml
<exclusiveGateway id="validationGateway" name="Complex Validation">

  <sequenceFlow id="autoApproveFlow"
                sourceRef="validationGateway"
                targetRef="autoApprove">
    <conditionExpression>#{#validationService.canAutoApprove(order)}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="autoRejectFlow"
                sourceRef="validationGateway"
                targetRef="autoReject">
    <conditionExpression>#{#validationService.shouldAutoReject(order)}</conditionExpression>
  </sequenceFlow>

  <sequenceFlow id="manualFlow"
                sourceRef="validationGateway"
                targetRef="manualReview"/>

</exclusiveGateway>
```

### Example 5: Parallel Gateway with Sequence Flows

```xml
<parallelGateway id="parallelStart" name="Start Parallel"/>

<sequenceFlow id="flow1" sourceRef="parallelStart" targetRef="taskA"/>
<sequenceFlow id="flow2" sourceRef="parallelStart" targetRef="taskB"/>
<sequenceFlow id="flow3" sourceRef="parallelStart" targetRef="taskC"/>

<serviceTask id="taskA" name="Task A"/>
<serviceTask id="taskB" name="Task B"/>
<serviceTask id="taskC" name="Task C"/>

<parallelGateway id="parallelEnd" name="Join Parallel"/>

<sequenceFlow id="flow4" sourceRef="taskA" targetRef="parallelEnd"/>
<sequenceFlow id="flow5" sourceRef="taskB" targetRef="parallelEnd"/>
<sequenceFlow id="flow6" sourceRef="taskC" targetRef="parallelEnd"/>
```

## Condition Expression Syntax

### Supported Operators

| Operator | Description      | Example                   |
|----------|------------------|---------------------------|
| `==`     | Equal            | `${status == 'APPROVED'}` |
| `!=`     | Not Equal        | `${type != 'INTERNAL'}`   |
| `>`      | Greater Than     | `${amount > 1000}`        |
| `<`      | Less Than        | `${age < 18}`             |
| `>=`     | Greater or Equal | `${score >= 90}`          |
| `<=`     | Less or Equal    | `${quantity <= 100}`      |
| `&&`     | Logical AND      | `${valid && approved}`    |
| `\|\|`   | Logical OR       | `${vip \|\| urgent}`      |
| `!`      | Logical NOT      | `${!cancelled}`           |

### Variable Access

```xml
<!-- Direct variable -->
<conditionExpression>${variableName}</conditionExpression>

<!-- Object property -->
<conditionExpression>${order.amount}</conditionExpression>

<!-- Nested property -->
<conditionExpression>${customer.address.city}</conditionExpression>

<!-- List access -->
<conditionExpression>${items[0].name}</conditionExpression>

<!-- Map access -->
<conditionExpression>${config['threshold']}</conditionExpression>
```

### Method Calls

```xml
<!-- Simple method -->
<conditionExpression>${isValid(order)}</conditionExpression>

<!-- Method with parameters -->
<conditionExpression>${compareAmount(orderAmount, threshold)}</conditionExpression>

<!-- SpEL bean method -->
<conditionExpression>#{#service.checkCondition(data)}</conditionExpression>
```

## Best Practices

### 1. Clear Naming

```xml
<!-- GOOD: Descriptive names -->
<sequenceFlow id="approvedFlow" name="Order Approved"/>
<sequenceFlow id="rejectedFlow" name="Order Rejected"/>

<!-- BAD: Generic names -->
<sequenceFlow id="flow1" name="Flow 1"/>
<sequenceFlow id="flow2" name="Flow 2"/>
```

### 2. Mutually Exclusive Conditions

```xml
<!-- GOOD: Clear boundaries -->
<sequenceFlow><conditionExpression>${amount < 1000}</conditionExpression></sequenceFlow>
<sequenceFlow><conditionExpression>${amount >= 1000 && amount < 10000}</conditionExpression></sequenceFlow>
<sequenceFlow><conditionExpression>${amount >= 10000}</conditionExpression></sequenceFlow>

<!-- BAD: Overlapping conditions -->
<sequenceFlow><conditionExpression>${amount < 1000}</conditionExpression></sequenceFlow>
<sequenceFlow><conditionExpression>${amount <= 1000}</conditionExpression></sequenceFlow>
```

### 3. Always Define Default

```xml
<!-- GOOD: Has default flow -->
<exclusiveGateway>
  <sequenceFlow><conditionExpression>${condition1}</conditionExpression></sequenceFlow>
  <sequenceFlow><conditionExpression>${condition2}</conditionExpression></sequenceFlow>
  <sequenceFlow id="elseFlow"/> <!-- Default -->
</exclusiveGateway>

<!-- BAD: No default -->
<exclusiveGateway>
  <sequenceFlow><conditionExpression>${condition1}</conditionExpression></sequenceFlow>
</exclusiveGateway>
```

### 4. Keep Conditions Simple

```xml
<!-- GOOD: Simple, readable -->
<conditionExpression>${orderAmount > threshold}</conditionExpression>

<!-- BAD: Complex, hard to maintain -->
<conditionExpression>${orderAmount > (baseAmount * multiplier) + adjustment - discount}</conditionExpression>
```

### 5. Document Complex Logic

```xml
<sequenceFlow id="complexFlow" 
              name="VIP High-Value Urgent Order">
  <!-- VIP customer with order > $10k marked urgent -->
  <conditionExpression>${customer.vip && orderAmount > 10000 && order.urgent}</conditionExpression>
</sequenceFlow>
```

## Common Pitfalls

### 1. Missing Default Flow

**Problem:** Gateway has no default and conditions don't match

```xml
<!-- BAD: No default flow -->
<exclusiveGateway id="gateway">
  <sequenceFlow id="flow1">
    <conditionExpression>${approved == true}</conditionExpression>
  </sequenceFlow>
</exclusiveGateway>

<!-- What happens if approved == false or null? Process stalls! -->

<!-- GOOD: Add default -->
<exclusiveGateway id="gateway">
  <sequenceFlow id="flow1">
    <conditionExpression>${approved == true}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="defaultFlow"/>
</exclusiveGateway>
```

### 2. Overlapping Conditions

**Problem:** Multiple conditions can be true simultaneously

```xml
<!-- BAD: Overlap at amount == 1000 -->
<sequenceFlow><conditionExpression>${amount < 1000}</conditionExpression></sequenceFlow>
<sequenceFlow><conditionExpression>${amount <= 1000}</conditionExpression></sequenceFlow>

<!-- GOOD: Clear boundaries -->
<sequenceFlow><conditionExpression>${amount < 1000}</conditionExpression></sequenceFlow>
<sequenceFlow><conditionExpression>${amount >= 1000 && amount < 5000}</conditionExpression></sequenceFlow>
```

### 3. Null Variable Access

**Problem:** Accessing null variables causes exceptions

```xml
<!-- BAD: No null check -->
<conditionExpression>${order.amount > 1000}</conditionExpression>

<!-- GOOD: Null-safe -->
<conditionExpression>${order != null && order.amount > 1000}</conditionExpression>
```

### 4. Case Sensitivity

**Problem:** String comparisons are case-sensitive

```xml
<!-- BAD: Might miss 'Approved' or 'APPROVED' -->
<conditionExpression>${status == 'approved'}</conditionExpression>

<!-- GOOD: Normalize or check all cases -->
<conditionExpression>${status.toLowerCase() == 'approved'}</conditionExpression>
```

### 5. Complex Expressions in XML

**Problem:** Hard to read and maintain

```xml
<!-- BAD: Too complex -->
<conditionExpression>${(order.amount * (1 + taxRate/100)) - discount > threshold && (customer.vip || order.urgent)}</conditionExpression>

<!-- GOOD: Use intermediate variables or method -->
<conditionExpression>#{#orderService.shouldExpedite(order)}</conditionExpression>
```

## Related Documentation

- [Exclusive Gateway](../gateways/exclusive-gateway.md) - XOR gateway with conditions
- [Inclusive Gateway](../gateways/inclusive-gateway.md) - OR gateway with multiple paths
- [Complex Gateway](../gateways/complex-gateway.md) - Advanced condition routing
- [Gateways Overview](../gateways/index.md) - All gateway types
- [Variables](../advanced/variables.md) - Variable scope and access
- [Error Handling](../advanced/error-handling.md) - Error management and exception mapping

---

