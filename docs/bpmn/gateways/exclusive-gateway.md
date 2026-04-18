---
sidebar_label: Exclusive Gateway
slug: /bpmn/gateways/exclusive-gateway
title: "Exclusive Gateway"
description: "Complete guide to ExclusiveGateway (XOR) for conditional branching with one path selection based on evaluated conditions."
---

# Exclusive Gateway

The Exclusive Gateway (XOR) routes the flow along **exactly one path** based on conditions evaluated on outgoing sequence flows. It's the most commonly used gateway for decision points.

## Overview

```xml
<exclusiveGateway id="decision" name="Approval Decision"/>
```

**BPMN 2.0 Symbol:** ⨉ (circle with X)  
**Activiti Extensions:** Enhanced condition evaluation

## Key Features

### Standard BPMN Features
- **Condition Expressions** - Evaluate on outgoing flows
- **Default Flow** - Fallback when no conditions match
- **Divergence** - Split into multiple paths
- **Convergence** - Merge from multiple paths

### Activiti Customizations
- **EL/SpEL Expressions** - Advanced condition language
- **Default Flow Attribute** - Explicit default specification
- **Execution Listeners** - Track decision points
- **History Tracking** - Audit which path was taken

## Configuration Options

### Basic Exclusive Gateway

```xml
<exclusiveGateway id="amountCheck" name="Check Amount"/>
```

### With Default Flow

```xml
<exclusiveGateway id="amountCheck"
                  name="Check Amount"
                  default="defaultPath"/>
```

### As Divergence (Decision Point)

```xml
<exclusiveGateway id="approvalDecision" name="Approval Required?"/>

<sequenceFlow id="approvePath" sourceRef="approvalDecision" targetRef="approveTask">
  <conditionExpression>${amount < 1000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="rejectPath" sourceRef="approvalDecision" targetRef="rejectTask">
  <conditionExpression>${amount >= 1000}</conditionExpression>
</sequenceFlow>
```

### As Convergence (Merge Point)

```xml
<!-- Multiple paths merge into one -->
<sequenceFlow id="fromApprove" sourceRef="approveTask" targetRef="mergeGateway"/>
<sequenceFlow id="fromReject" sourceRef="rejectTask" targetRef="mergeGateway"/>

<exclusiveGateway id="mergeGateway" name="Merge Paths"/>

<sequenceFlow id="continueFlow" sourceRef="mergeGateway" targetRef="nextTask"/>
```

## Advanced Features

### Complex Conditions

```xml
<exclusiveGateway id="complexDecision" name="Complex Routing"/>

<sequenceFlow id="path1" sourceRef="complexDecision" targetRef="task1">
  <conditionExpression>${user.role == 'ADMIN' and amount > 10000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="path2" sourceRef="complexDecision" targetRef="task2">
  <conditionExpression>${user.role == 'MANAGER' and amount > 5000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="path3" sourceRef="complexDecision" targetRef="task3">
  <conditionExpression>${user.role == 'USER'}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="defaultPath" sourceRef="complexDecision" targetRef="errorTask">
  <conditionExpression>${false}</conditionExpression>
</sequenceFlow>
```

### Expression Methods

```xml
<sequenceFlow id="methodCall" sourceRef="decision" targetRef="task">
  <conditionExpression>${routingService.determinePath(context)}</conditionExpression>
</sequenceFlow>
```

### SpEL Expressions

```xml
<sequenceFlow id="spelCondition" sourceRef="decision" targetRef="task">
  <conditionExpression>#{#orderService.isExpedited(order)}</conditionExpression>
</sequenceFlow>
```

## Complete Examples

### Example 1: Order Processing Decision

```xml
<exclusiveGateway id="orderTypeDecision" name="Order Type"/>

<sequenceFlow id="standardOrder" sourceRef="orderTypeDecision" targetRef="processStandard">
  <conditionExpression>${order.type == 'STANDARD'}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="expressOrder" sourceRef="orderTypeDecision" targetRef="processExpress">
  <conditionExpression>${order.type == 'EXPRESS'}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="bulkOrder" sourceRef="orderTypeDecision" targetRef="processBulk">
  <conditionExpression>${order.type == 'BULK'}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="unknownOrder" sourceRef="orderTypeDecision" targetRef="handleError">
  <conditionExpression>${false}</conditionExpression>
</sequenceFlow>
```

### Example 2: Approval Hierarchy

```xml
<exclusiveGateway id="approvalLevel" name="Approval Level Required"/>

<sequenceFlow id="managerApproval" sourceRef="approvalLevel" targetRef="managerTask">
  <conditionExpression>${amount >= 1000 and amount < 5000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="directorApproval" sourceRef="approvalLevel" targetRef="directorTask">
  <conditionExpression>${amount >= 5000 and amount < 10000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="executiveApproval" sourceRef="approvalLevel" targetRef="executiveTask">
  <conditionExpression>${amount >= 10000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="noApproval" sourceRef="approvalLevel" targetRef="autoApprove">
  <conditionExpression>${amount < 1000}</conditionExpression>
</sequenceFlow>
```

### Example 3: Error Handling Decision

```xml
<exclusiveGateway id="errorType" name="Error Type"/>

<sequenceFlow id="validationError" sourceRef="errorType" targetRef="handleValidationError">
  <conditionExpression>${error.type == 'VALIDATION'}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="systemError" sourceRef="errorType" targetRef="handleSystemError">
  <conditionExpression>${error.type == 'SYSTEM'}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="businessError" sourceRef="errorType" targetRef="handleBusinessError">
  <conditionExpression>${error.type == 'BUSINESS'}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="unknownError" sourceRef="errorType" targetRef="logUnknownError">
  <conditionExpression>${false}</conditionExpression>
</sequenceFlow>
```

## Runtime API Usage

### Inspecting Gateway Decisions

```java
// Get historic activity instances to see which path was taken
List<HistoricActivityInstance> instances = historyService
    .createHistoricActivityInstanceQuery()
    .processInstanceId(processInstanceId)
    .activityId("decisionGateway")
    .list();

// Get sequence flow taken
HistoricProcessInstance process = historyService
    .createHistoricProcessInstanceQuery()
    .processInstanceId(processInstanceId)
    .singleResult();

List<HistoricSequenceFlowInstance> flows = historyService
    .createHistoricSequenceFlowInstanceQuery()
    .processInstanceId(processInstanceId)
    .list();
```

## Best Practices

1. **Mutually Exclusive:** Ensure conditions don't overlap
2. **Cover All Cases:** Use default flow for unmatched conditions
3. **Clear Names:** Describe the decision being made
4. **Simple Conditions:** Keep expressions readable
5. **Document Logic:** Explain complex decision rules
6. **Test All Paths:** Verify each branch executes correctly
7. **Use Expressions:** Leverage EL/SpEL for flexibility
8. **History Level:** Enable history to track decisions

## Common Pitfalls

- **Overlapping Conditions:** Multiple paths could be taken
- **No Default Flow:** Unmatched conditions cause errors
- **Complex Logic:** Hard to understand and maintain
- **Missing Conditions:** Not all flows have conditions
- **Performance:** Expensive condition evaluation
- **Debugging:** Hard to trace which condition matched

## Related Documentation

- [Gateways Overview](./index.md)
- [Parallel Gateway](./parallel-gateway.md)
- [Inclusive Gateway](./inclusive-gateway.md)
- [Sequence Flows](../elements/sequence-flows.md)
- [Expression Language](../../api-reference/core-common/expression-language.md)

---

**Last Updated: 2026
