---
sidebar_label: Parallel Gateway
slug: /bpmn/gateways/parallel-gateway
title: "Parallel Gateway"
description: "Complete guide to ParallelGateway (AND) for concurrent execution and synchronization of multiple process paths."
---

# Parallel Gateway

The Parallel Gateway (AND) splits the flow into **multiple concurrent paths** or waits for **all incoming paths** to complete before proceeding. It enables true parallelism in workflows.

## 📋 Overview

```xml
<parallelGateway id="parallel" name="Parallel Processing"/>
```

**BPMN 2.0 Symbol:** ⊞ (circle with plus)  
**Activiti Extensions:** ✅ Complex parallel execution, multi-instance integration

## 🎯 Key Features

### Standard BPMN Features
- **Fork** - Split into parallel paths
- **Join** - Wait for all paths to complete
- **No Conditions** - All paths execute
- **Divergence** - Create concurrent executions
- **Convergence** - Synchronize parallel flows

### Activiti Customizations
- **Async Execution** - Background parallel processing
- **Multi-Instance Integration** - Combined parallel patterns
- **Execution Listeners** - Track parallel branches
- **Complex Synchronization** - Advanced join patterns

## 📝 Configuration Options

### Basic Parallel Gateway

```xml
<parallelGateway id="parallelSplit" name="Start Parallel Tasks"/>
```

### As Fork (Divergence)

```xml
<!-- Split into parallel paths -->
<parallelGateway id="fork" name="Parallel Fork"/>

<sequenceFlow id="flow1" sourceRef="fork" targetRef="task1"/>
<sequenceFlow id="flow2" sourceRef="fork" targetRef="task2"/>
<sequenceFlow id="flow3" sourceRef="fork" targetRef="task3"/>

<!-- All three tasks execute in parallel -->
<userTask id="task1" name="Task 1"/>
<userTask id="task2" name="Task 2"/>
<userTask id="task3" name="Task 3"/>
```

### As Join (Convergence)

```xml
<!-- Wait for all parallel tasks to complete -->
<sequenceFlow id="join1" sourceRef="task1" targetRef="join"/>
<sequenceFlow id="join2" sourceRef="task2" targetRef="join"/>
<sequenceFlow id="join3" sourceRef="task3" targetRef="join"/>

<parallelGateway id="join" name="Parallel Join"/>

<sequenceFlow id="continue" sourceRef="join" targetRef="nextTask"/>
```

### Fork and Join Pattern

```xml
<!-- Complete fork-join pattern -->
<parallelGateway id="split" name="Split"/>

<serviceTask id="service1" name="Service 1" activiti:async="true"/>
<serviceTask id="service2" name="Service 2" activiti:async="true"/>
<serviceTask id="service3" name="Service 3" activiti:async="true"/>

<parallelGateway id="merge" name="Merge"/>

<sequenceFlow id="s1" sourceRef="split" targetRef="service1"/>
<sequenceFlow id="s2" sourceRef="split" targetRef="service2"/>
<sequenceFlow id="s3" sourceRef="split" targetRef="service3"/>
<sequenceFlow id="m1" sourceRef="service1" targetRef="merge"/>
<sequenceFlow id="m2" sourceRef="service2" targetRef="merge"/>
<sequenceFlow id="m3" sourceRef="service3" targetRef="merge"/>
```

## 🔧 Advanced Features

### Nested Parallel Gateways

```xml
<!-- First level parallel split -->
<parallelGateway id="level1Split"/>

<sequenceFlow id="branch1" sourceRef="level1Split" targetRef="task1"/>

<!-- Second level parallel split -->
<sequenceFlow id="branch2" sourceRef="level1Split" targetRef="level2Split"/>
<parallelGateway id="level2Split"/>

<sequenceFlow id="subBranch1" sourceRef="level2Split" targetRef="task2"/>
<sequenceFlow id="subBranch2" sourceRef="level2Split" targetRef="task3"/>

<!-- Join at different levels -->
<parallelGateway id="level2Join"/>
<sequenceFlow id="subJoin1" sourceRef="task2" targetRef="level2Join"/>
<sequenceFlow id="subJoin2" sourceRef="task3" targetRef="level2Join"/>

<parallelGateway id="level1Join"/>
<sequenceFlow id="mainJoin1" sourceRef="task1" targetRef="level1Join"/>
<sequenceFlow id="mainJoin2" sourceRef="level2Join" targetRef="level1Join"/>
```

### Parallel with Multi-Instance

```xml
<parallelGateway id="split"/>

<!-- Multi-instance user task -->
<userTask id="reviewTask" name="Parallel Reviews">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
  </multiInstanceLoopCharacteristics>
</userTask>

<!-- Parallel service task -->
<serviceTask id="notifyTask" name="Send Notifications" activiti:async="true"/>

<parallelGateway id="join"/>
```

### Deferred Activation

```xml
<parallelGateway id="deferredSplit" activiti:async="true"/>

<!-- Tasks will be activated asynchronously -->
<serviceTask id="asyncTask1" name="Async Task 1" activiti:async="true"/>
<serviceTask id="asyncTask2" name="Async Task 2" activiti:async="true"/>
```

## 💡 Complete Examples

### Example 1: Order Processing Pipeline

```xml
<!-- Split order processing into parallel tasks -->
<parallelGateway id="orderProcessingSplit" name="Start Order Processing"/>

<!-- Validate order -->
<serviceTask id="validateOrder" 
             name="Validate Order" 
             activiti:class="com.example.OrderValidator"
             activiti:async="true"/>

<!-- Check inventory -->
<serviceTask id="checkInventory" 
             name="Check Inventory" 
             activiti:class="com.example.InventoryChecker"
             activiti:async="true"/>

<!-- Process payment -->
<serviceTask id="processPayment" 
             name="Process Payment" 
             activiti:class="com.example.PaymentProcessor"
             activiti:async="true"/>

<!-- Wait for all validations -->
<parallelGateway id="orderProcessingJoin" name="All Validations Complete"/>

<!-- Continue with fulfillment -->
<sequenceFlow id="toFulfillment" 
              sourceRef="orderProcessingJoin" 
              targetRef="fulfillOrder"/>
```

### Example 2: Notification Fan-Out

```xml
<parallelGateway id="notificationSplit" name="Send Notifications"/>

<!-- Email notification -->
<serviceTask id="sendEmail" 
             name="Send Email" 
             activiti:type="mail"
             activiti:async="true"/>

<!-- SMS notification -->
<serviceTask id="sendSMS" 
             name="Send SMS" 
             activiti:class="com.example.SmsService"
             activiti:async="true"/>

<!-- Push notification -->
<serviceTask id="sendPush" 
             name="Send Push" 
             activiti:class="com.example.PushService"
             activiti:async="true"/>

<!-- Webhook notification -->
<serviceTask id="callWebhook" 
             name="Call Webhook" 
             activiti:class="com.example.WebhookService"
             activiti:async="true"/>

<parallelGateway id="notificationJoin" name="All Notifications Sent"/>
```

### Example 3: Data Aggregation

```xml
<!-- Fetch data from multiple sources in parallel -->
<parallelGateway id="dataFetchSplit" name="Fetch Data"/>

<serviceTask id="fetchFromDB" 
             name="Fetch from Database" 
             activiti:delegateExpression="${dataService.fetchFromDb()}"
             activiti:resultVariable="dbData"
             activiti:async="true"/>

<serviceTask id="fetchFromAPI" 
             name="Fetch from External API" 
             activiti:delegateExpression="${dataService.fetchFromApi()}"
             activiti:resultVariable="apiData"
             activiti:async="true"/>

<serviceTask id="fetchFromCache" 
             name="Fetch from Cache" 
             activiti:delegateExpression="${dataService.fetchFromCache()}"
             activiti:resultVariable="cacheData"
             activiti:async="true"/>

<!-- Wait for all data sources -->
<parallelGateway id="dataFetchJoin" name="All Data Fetched"/>

<!-- Aggregate results -->
<serviceTask id="aggregateData" 
             name="Aggregate Data" 
             activiti:delegateExpression="${dataService.aggregate()}">
  
  <activiti:field name="sources">
    <activiti:expression>${[dbData, apiData, cacheData]}</activiti:expression>
  </activiti:field>
</serviceTask>
```

### Example 4: Parallel Approvals

```xml
<parallelGateway id="approvalSplit" name="Request Approvals"/>

<!-- Department manager approval -->
<userTask id="managerApproval" 
          name="Manager Approval" 
          activiti:assignee="${order.departmentManager}"
          activiti:candidateGroups="managers"/>

<!-- Finance approval -->
<userTask id="financeApproval" 
          name="Finance Approval" 
          activiti:candidateGroups="finance"/>

<!-- Legal approval -->
<userTask id="legalApproval" 
          name="Legal Approval" 
          activiti:candidateGroups="legal"/>

<!-- Wait for all approvals -->
<parallelGateway id="approvalJoin" name="All Approvals Received"/>
```

## 🔍 Runtime API Usage

### Monitoring Parallel Executions

```java
// Get all active executions (including parallel branches)
List<Execution> executions = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .list();

// Count parallel branches
long parallelCount = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .count();

// Check if at parallel gateway
boolean atGateway = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .activityId("parallelGateway")
    .count() > 0;
```

### Managing Parallel Tasks

```java
// Complete one parallel branch
taskService.complete(taskId1);

// Complete another parallel branch
taskService.complete(taskId2);

// Process continues when all branches complete
```

## 📊 Best Practices

1. **Balance Forks and Joins:** Ensure every split has a corresponding join
2. **Use Async:** Prevent thread blocking in parallel branches
3. **Independent Branches:** Parallel tasks should not depend on each other
4. **Error Handling:** Add boundary events for failures in branches
5. **Timeout Management:** Prevent indefinite waiting at joins
6. **Resource Consideration:** Too many parallel branches can exhaust resources
7. **Clear Naming:** Describe what's happening in parallel
8. **Monitor Performance:** Track parallel execution times

## ⚠️ Common Pitfalls

- **Unbalanced Gateways:** More splits than joins (or vice versa)
- **Blocking Joins:** One slow branch delays everything
- **Resource Contention:** Parallel branches competing for resources
- **Deadlocks:** Circular dependencies between branches
- **No Async:** Blocking threads in synchronous parallel execution
- **Shared State:** Parallel branches modifying same variables
- **Missing Error Handling:** One failure stops all branches

## 🔗 Related Documentation

- [Gateways Overview](./index.md)
- [Exclusive Gateway](./exclusive-gateway.md)
- [Inclusive Gateway](./inclusive-gateway.md)
- [Async Execution](../advanced/async-execution.md)
- [Multi-Instance](../advanced/multi-instance.md)

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
