---
sidebar_label: Inclusive Gateway
slug: /bpmn/gateways/inclusive-gateway
description: Complete guide to Inclusive Gateways in Activiti - OR logic for selecting one or more paths
---

# Inclusive Gateway

Inclusive Gateways implement **OR logic** in BPMN processes. Unlike Exclusive Gateways (XOR) that select exactly one path, Inclusive Gateways can select **one or more paths** simultaneously based on conditions.

## 📋 Overview

```xml
<inclusiveGateway id="inclusiveGateway" name="OR Decision"/>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ Condition expressions, default flow support

## 🎯 Key Features

### Standard BPMN Features
- **OR Logic** - Select one or more outgoing paths
- **Condition Evaluation** - Multiple conditions can be true
- **Parallel Execution** - Selected paths execute concurrently
- **Join Behavior** - Waits for all selected paths to complete

### Activiti Extensions
- **SpEL/EL Expressions** - Complex condition evaluation
- **Default Flow** - Fallback when no conditions match
- **Async Support** - Can be configured for async execution
- **Execution Listeners** - Lifecycle hooks

## 📝 How It Works

### Split Behavior (Diverging)

When the process reaches an Inclusive Gateway:
1. **Evaluate all outgoing sequence flow conditions**
2. **Activate all paths where condition is true**
3. **Execute selected paths in parallel**
4. **If no conditions match, use default flow (if defined)**

### Join Behavior (Converging)

When paths converge at an Inclusive Gateway:
1. **Wait for all activated paths to complete**
2. **Continue process flow**
3. **Merge variables from all paths**

## 📝 Configuration Options

### 1. Basic Inclusive Gateway

Simple OR decision with multiple conditions:

```xml
<process id="notificationProcess" name="Notification Process">
  <startEvent id="start"/>
  
  <serviceTask id="processOrder" name="Process Order" activiti:class="com.example.OrderProcessor"/>
  
  <inclusiveGateway id="notifyGateway" name="Send Notifications"/>
  
  <!-- Email notification -->
  <sequenceFlow id="emailFlow" sourceRef="notifyGateway" targetRef="sendEmail">
    <conditionExpression>${sendEmail}</conditionExpression>
  </sequenceFlow>
  
  <!-- SMS notification -->
  <sequenceFlow id="smsFlow" sourceRef="notifyGateway" targetRef="sendSMS">
    <conditionExpression>${sendSMS}</conditionExpression>
  </sequenceFlow>
  
  <!-- Push notification -->
  <sequenceFlow id="pushFlow" sourceRef="notifyGateway" targetRef="sendPush">
    <conditionExpression>${sendPush}</conditionExpression>
  </sequenceFlow>
  
  <serviceTask id="sendEmail" name="Send Email" activiti:class="com.example.EmailService"/>
  
  <serviceTask id="sendSMS" name="Send SMS" activiti:class="com.example.SmsService"/>
  
  <serviceTask id="sendPush" name="Send Push Notification" activiti:class="com.example.PushService"/>
  
  <inclusiveGateway id="joinGateway" name="Join Notifications"/>
  
  <sequenceFlow id="joinEmail" sourceRef="sendEmail" targetRef="joinGateway"/>
  <sequenceFlow id="joinSMS" sourceRef="sendSMS" targetRef="joinGateway"/>
  <sequenceFlow id="joinPush" sourceRef="sendPush" targetRef="joinGateway"/>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="processOrder"/>
  <sequenceFlow id="flow2" sourceRef="processOrder" targetRef="notifyGateway"/>
  <sequenceFlow id="flow3" sourceRef="joinGateway" targetRef="end"/>
</process>
```

**Behavior:**
- If `sendEmail=true`, `sendSMS=true`, `sendPush=false` → Email and SMS sent in parallel
- If all three are true → All three sent in parallel
- If all are false → Process stalls (unless default flow defined)

### 2. Inclusive Gateway with Default Flow

Add a default flow when no conditions match:

```xml
<inclusiveGateway id="decisionGateway" name="Decision">
  <activiti:default="defaultFlow"/>
</inclusiveGateway>

<sequenceFlow id="option1" sourceRef="decisionGateway" targetRef="task1">
  <conditionExpression>${option1}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="option2" sourceRef="decisionGateway" targetRef="task2">
  <conditionExpression>${option2}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="defaultFlow" sourceRef="decisionGateway" targetRef="defaultTask">
  <!-- No condition = default flow -->
</sequenceFlow>
```

**Behavior:**
- If `option1` or `option2` is true → Execute corresponding task(s)
- If both are false → Execute `defaultTask`
- If both are true → Execute both tasks in parallel

### 3. Complex Conditions with SpEL

Use Spring Expression Language for complex logic:

```xml
<sequenceFlow id="premiumFlow" sourceRef="gateway" targetRef="premiumService">
  <conditionExpression>#{orderService.isPremium(order)}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="urgentFlow" sourceRef="gateway" targetRef="urgentService">
  <conditionExpression>${order.urgent && order.value > 1000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="standardFlow" sourceRef="gateway" targetRef="standardService">
  <conditionExpression>${!order.urgent || order.value <= 1000}</conditionExpression>
</sequenceFlow>
```

### 4. Inclusive Gateway for Multi-Channel Processing

Process through multiple channels simultaneously:

```xml
<process id="multiChannelProcess" name="Multi-Channel Processing">
  <startEvent id="start"/>
  
  <serviceTask id="receiveRequest" name="Receive Request" activiti:class="com.example.RequestReceiver"/>
  
  <inclusiveGateway id="channelGateway" name="Select Channels"/>
  
  <!-- Web channel -->
  <sequenceFlow id="webFlow" sourceRef="channelGateway" targetRef="processWeb">
    <conditionExpression>${channels.contains('WEB')}</conditionExpression>
  </sequenceFlow>
  
  <!-- Mobile channel -->
  <sequenceFlow id="mobileFlow" sourceRef="channelGateway" targetRef="processMobile">
    <conditionExpression>${channels.contains('MOBILE')}</conditionExpression>
  </sequenceFlow>
  
  <!-- API channel -->
  <sequenceFlow id="apiFlow" sourceRef="channelGateway" targetRef="processAPI">
    <conditionExpression>${channels.contains('API')}</conditionExpression>
  </sequenceFlow>
  
  <serviceTask id="processWeb" name="Process Web Request" activiti:class="com.example.WebProcessor"/>
  </serviceTask>
  
  <serviceTask id="processMobile" name="Process Mobile Request" activiti:class="com.example.MobileProcessor"/>
  </serviceTask>
  
  <serviceTask id="processAPI" name="Process API Request" activiti:class="com.example.APIProcessor"/>
  </serviceTask>
  
  <inclusiveGateway id="joinGateway" name="Join Channels"/>
  
  <serviceTask id="aggregateResults" name="Aggregate Results" activiti:class="com.example.ResultAggregator"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="receiveRequest"/>
  <sequenceFlow id="flow2" sourceRef="receiveRequest" targetRef="channelGateway"/>
  <sequenceFlow id="flow3" sourceRef="processWeb" targetRef="joinGateway"/>
  <sequenceFlow id="flow4" sourceRef="processMobile" targetRef="joinGateway"/>
  <sequenceFlow id="flow5" sourceRef="processAPI" targetRef="joinGateway"/>
  <sequenceFlow id="flow6" sourceRef="joinGateway" targetRef="aggregateResults"/>
  <sequenceFlow id="flow7" sourceRef="aggregateResults" targetRef="end"/>
</process>
```

## 💡 Complete Real-World Examples

### Example 1: Order Fulfillment with Multiple Options

```xml
<process id="orderFulfillment" name="Order Fulfillment">
  <startEvent id="start"/>
  
  <userTask id="receiveOrder" name="Receive Order" activiti:assignee="${orderClerk}"/>
  
  <serviceTask id="checkInventory" name="Check Inventory" activiti:class="com.example.InventoryChecker"/>
  </serviceTask>
  
  <inclusiveGateway id="fulfillmentGateway" name="Select Fulfillment Options"/>
  
  <!-- Ship from warehouse -->
  <sequenceFlow id="warehouseFlow" sourceRef="fulfillmentGateway" targetRef="shipFromWarehouse">
    <conditionExpression>${inWarehouse && customerAcceptsStandardShipping}</conditionExpression>
  </sequenceFlow>
  
  <!-- Ship from store -->
  <sequenceFlow id="storeFlow" sourceRef="fulfillmentGateway" targetRef="shipFromStore">
    <conditionExpression>${inStore && customerWantsFastShipping}</conditionExpression>
  </sequenceFlow>
  
  <!-- Backorder items -->
  <sequenceFlow id="backorderFlow" sourceRef="fulfillmentGateway" targetRef="createBackorder">
    <conditionExpression>${!inWarehouse && !inStore && customerAcceptsBackorder}</conditionExpression>
  </sequenceFlow>
  
  <serviceTask id="shipFromWarehouse" name="Ship from Warehouse" activiti:class="com.example.WarehouseShipper"/>
  </serviceTask>
  
  <serviceTask id="shipFromStore" name="Ship from Store" activiti:class="com.example.StoreShipper"/>
  </serviceTask>
  
  <serviceTask id="createBackorder" name="Create Backorder" activiti:class="com.example.BackorderService"/>
  </serviceTask>
  
  <inclusiveGateway id="joinGateway" name="Join Fulfillment"/>
  
  <serviceTask id="notifyCustomer" name="Notify Customer" activiti:class="com.example.NotificationService"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="receiveOrder"/>
  <sequenceFlow id="flow2" sourceRef="receiveOrder" targetRef="checkInventory"/>
  <sequenceFlow id="flow3" sourceRef="checkInventory" targetRef="fulfillmentGateway"/>
  <sequenceFlow id="flow4" sourceRef="shipFromWarehouse" targetRef="joinGateway"/>
  <sequenceFlow id="flow5" sourceRef="shipFromStore" targetRef="joinGateway"/>
  <sequenceFlow id="flow6" sourceRef="createBackorder" targetRef="joinGateway"/>
  <sequenceFlow id="flow7" sourceRef="joinGateway" targetRef="notifyCustomer"/>
  <sequenceFlow id="flow8" sourceRef="notifyCustomer" targetRef="end"/>
</process>
```

**Scenario:**
- Customer orders multiple items
- Some items in warehouse, some in store
- Can ship from both locations simultaneously
- Some items on backorder
- All fulfillment options execute in parallel where applicable

### Example 2: Multi-Step Approval Process

```xml
<process id="approvalProcess" name="Multi-Step Approval">
  <startEvent id="start"/>
  
  <userTask id="submitRequest" name="Submit Request" activiti:assignee="${requester}"/>
  
  <serviceTask id="evaluateRequest" name="Evaluate Request" activiti:class="com.example.RequestEvaluator"/>
  </serviceTask>
  
  <inclusiveGateway id="approvalGateway" name="Select Approvers"/>
  
  <!-- Manager approval -->
  <sequenceFlow id="managerFlow" sourceRef="approvalGateway" targetRef="managerApproval">
    <conditionExpression>${requiresManagerApproval}</conditionExpression>
  </sequenceFlow>
  
  <!-- Finance approval -->
  <sequenceFlow id="financeFlow" sourceRef="approvalGateway" targetRef="financeApproval">
    <conditionExpression>${requiresFinanceApproval}</conditionExpression>
  </sequenceFlow>
  
  <!-- Legal approval -->
  <sequenceFlow id="legalFlow" sourceRef="approvalGateway" targetRef="legalApproval">
    <conditionExpression>${requiresLegalApproval}</conditionExpression>
  </sequenceFlow>
  
  <!-- Security approval -->
  <sequenceFlow id="securityFlow" sourceRef="approvalGateway" targetRef="securityApproval">
    <conditionExpression>${requiresSecurityApproval}</conditionExpression>
  </sequenceFlow>
  
  <userTask id="managerApproval" name="Manager Approval" activiti:assignee="${manager}"/>
  
  <userTask id="financeApproval" name="Finance Approval" activiti:assignee="${financeOfficer}"/>
  
  <userTask id="legalApproval" name="Legal Approval" activiti:assignee="${legalCounsel}"/>
  
  <userTask id="securityApproval" name="Security Approval" activiti:assignee="${securityOfficer}"/>
  
  <inclusiveGateway id="joinGateway" name="Join Approvals"/>
  
  <serviceTask id="processApprovedRequest" name="Process Approved Request" activiti:class="com.example.RequestProcessor"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="submitRequest"/>
  <sequenceFlow id="flow2" sourceRef="submitRequest" targetRef="evaluateRequest"/>
  <sequenceFlow id="flow3" sourceRef="evaluateRequest" targetRef="approvalGateway"/>
  <sequenceFlow id="flow4" sourceRef="managerApproval" targetRef="joinGateway"/>
  <sequenceFlow id="flow5" sourceRef="financeApproval" targetRef="joinGateway"/>
  <sequenceFlow id="flow6" sourceRef="legalApproval" targetRef="joinGateway"/>
  <sequenceFlow id="flow7" sourceRef="securityApproval" targetRef="joinGateway"/>
  <sequenceFlow id="flow8" sourceRef="joinGateway" targetRef="processApprovedRequest"/>
  <sequenceFlow id="flow9" sourceRef="processApprovedRequest" targetRef="end"/>
</process>
```

**Behavior:**
- Request evaluated to determine which approvals needed
- Multiple approvals can happen in parallel
- Process waits for ALL selected approvals to complete
- Flexible approval routing based on request type

## 🔧 Runtime API

### Querying Inclusive Gateway Executions

```java
// Get executions at inclusive gateway
List<Execution> gatewayExecutions = runtimeService.createExecutionQuery()
    .activityId("approvalGateway")
    .list();

// Check which paths are active
for (Execution execution : gatewayExecutions) {
    String currentActivity = runtimeService.createActivityInstanceQuery()
        .processInstanceId(execution.getProcessInstanceId())
        .activityId(execution.getActivityId())
        .list()
        .get(0)
        .getActivityId();
}
```

## 📊 Best Practices

1. **Clear Conditions** - Make conditions mutually understandable
2. **Default Flow** - Always define a default flow to prevent stalls
3. **Parallel Awareness** - Remember selected paths run in parallel
4. **Variable Merging** - Plan how variables from different paths merge
5. **Performance** - Too many parallel paths can impact performance
6. **Testing** - Test all condition combinations
7. **Documentation** - Document which conditions can be true simultaneously

## ⚠️ Common Pitfalls

- **No Conditions True** - Process stalls without default flow
- **Variable Conflicts** - Different paths setting same variables
- **Unintended Parallelism** - Forgetting paths execute concurrently
- **Complex Conditions** - Hard to debug overlapping conditions
- **Missing Join** - Not converging parallel paths properly
- **Performance Issues** - Too many parallel executions
- **Testing Gaps** - Not testing all condition combinations

## 🔍 Inclusive vs Other Gateways

| Feature | Inclusive | Exclusive | Parallel |
|---------|-----------|-----------|----------|
| **Logic** | OR (one or more) | XOR (exactly one) | AND (all) |
| **Conditions** | Required on flows | Required on flows | No conditions |
| **Parallel Paths** | Yes (selected) | No | Yes (all) |
| **Join Behavior** | Wait for selected | N/A | Wait for all |
| **Default Flow** | Optional but recommended | Required if no match | Not applicable |

## 🔗 Related Documentation

- [Exclusive Gateway](./exclusive-gateway.md) - XOR logic (one path)
- [Parallel Gateway](./parallel-gateway.md) - AND logic (all paths)
- [Event-Based Gateway](./event-gateway.md) - Event-driven routing
- [Complex Gateway](./complex-gateway.md) - Advanced conditions
- [Gateway Overview](./index.md) - All gateway types

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
