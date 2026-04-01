---
sidebar_label: External Task Service
slug: /core-services/external-task-service
description: External task pattern for decoupled process execution and microservices integration.
---

# External Task Service - Decoupled Task Execution

**Module:** `activiti-core/activiti-engine`

**Target Audience:** Senior Software Engineers, Microservices Architects

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [External Task Pattern](#external-task-pattern)
- [Worker Configuration](#worker-configuration)
- [Task Fetching](#task-fetching)
- [Task Completion](#task-completion)
- [Error Handling](#error-handling)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The **ExternalTaskService** implements the external task pattern, allowing process execution to be decoupled from the workflow engine. This is ideal for microservices architectures where business logic runs in separate services.

### Key Benefits

- **Decoupling** - Business logic separate from workflow engine
- **Scalability** - Multiple workers can process tasks
- **Resilience** - Automatic retry on failures
- **Flexibility** - Workers can be written in any language
- **Distribution** - Tasks can be processed across multiple services

### Architecture

```
Process Engine          External Workers
     │                        │
     │  ┌──────────────┐      │
     │  │ External     │      │  Microservice 1
     ├──│ Task         │──────│  (Payment)
     │  │              │      │
     │  └──────────────┘      │
     │                        │  Microservice 2
     │  ┌──────────────┐      │  (Notification)
     ├──│ External     │──────│
     │  │ Task         │      │
     │  │              │      │
     │  └──────────────┘      │
```

---

## External Task Pattern

### How It Works

1. **Process reaches external task** in BPMN diagram
2. **Engine creates external task** with topic and variables
3. **Worker fetches tasks** matching its topic
4. **Worker processes task** and executes business logic
5. **Worker completes task** with result variables
6. **Process continues** to next activity

### BPMN Configuration

```xml
<!-- External Task in BPMN -->
<serviceTask id="externalPayment" name="Process Payment">
    <extensionElements>
        <activiti:externalTask topic="payment-process"/>
    </extensionElements>
    <inputParameters>
        <activiti:parameter name="amount" expression="${orderAmount}"/>
        <activiti:parameter name="orderId" expression="${orderId}"/>
    </inputParameters>
    <outputParameters>
        <activiti:parameter name="paymentResult" expression="${result}"/>
    </outputParameters>
</serviceTask>
```

---

## Worker Configuration

### Basic Worker Setup

```java
// Create external task worker
ExternalTaskWorker worker = new ExternalTaskWorker(processEngine)
    .workerId("payment-service-1")
    .topic("payment-process")
    .lockDuration(60000) // 60 seconds
    .maxTasks(10)
    .asyncResponse(true);

// Register task handler
worker.handler((externalTask, variables) -> {
    // Process the task
    double amount = (Double) variables.get("amount");
    String orderId = (String) variables.get("orderId");
    
    // Business logic
    PaymentResult result = processPayment(orderId, amount);
    
    // Return result variables
    Map<String, Object> resultVariables = new HashMap<>();
    resultVariables.put("paymentResult", result.getStatus());
    resultVariables.put("transactionId", result.getTransactionId());
    
    return resultVariables;
});

// Start worker
worker.start();
```

### Spring Boot Integration

```java
@Configuration
public class ExternalTaskConfig {
    
    @Bean
    public ExternalTaskService externalTaskService(ProcessEngine processEngine) {
        return processEngine.getExternalTaskService();
    }
    
    @Bean
    public ExternalTaskWorker paymentWorker(ExternalTaskService service) {
        return ExternalTaskWorker.builder(service)
            .workerId("payment-worker")
            .topic("payment-process")
            .lockDuration(60000)
            .maxTasks(10)
            .asyncResponse(true)
            .handler(this::processPaymentTask)
            .build();
    }
    
    public Map<String, Object> processPaymentTask(
        ExternalTask task, 
        Map<String, Object> variables
    ) {
        // Implementation
        return resultVariables;
    }
}
```

---

## Task Fetching

### Fetch and Lock

```java
// Fetch tasks for specific topic
List<ExternalTask> tasks = externalTaskService.createExternalTaskQuery()
    .topicNames("payment-process")
    .workerId("payment-worker-1")
    .list();

// Fetch and lock tasks
externalTaskService.fetchAndLock(
    "payment-worker-1",
    10,
    "payment-process"
);
```

### External Task Query

```java
// Query external tasks
List<ExternalTask> tasks = externalTaskService.createExternalTaskQuery()
    .topicNames("payment-process", "notification-send")
    .processInstanceId("process-123")
    .list();

// Count tasks
long taskCount = externalTaskService.createExternalTaskQuery()
    .topicNames("payment-process")
    .count();
```

### Polling Configuration

```java
// Configure polling
ExternalTaskWorker worker = ExternalTaskWorker.builder(service)
    .workerId("worker-1")
    .topics("payment-process", "notification-send")
    .lockDuration(60000)
    .maxTasks(10)
    .pollInterval(5000) // Poll every 5 seconds
    .asyncResponse(true)
    .build();
```

---

## Task Completion

### Complete Successfully

```java
// Complete with result variables
Map<String, Object> variables = new HashMap<>();
variables.put("result", "SUCCESS");
variables.put("transactionId", "txn-123");

externalTaskService.complete(
    externalTask.getId(),
    externalTask.getWorkerId(),
    variables
);
```

### Complete with Error

```java
// Complete with retry
externalTaskService.complete(
    externalTask.getId(),
    externalTask.getWorkerId(),
    "payment-failed", // Error message
    true, // Retry
    3, // Retry count
    60000 // Retry timeout (ms)
);

// Complete without retry (fatal error)
externalTaskService.complete(
    externalTask.getId(),
    externalTask.getWorkerId(),
    "invalid-order",
    false, // No retry
    0,
    0
);
```

### Async Completion

```java
// For async processing
worker.asyncResponse(true);

// Complete later when processing finishes
CompletableFuture.supplyAsync(() -> {
    // Long-running processing
    return processPayment();
}).thenAccept(result -> {
    externalTaskService.complete(taskId, workerId, result);
});
```

---

## Error Handling

### Retry Configuration

```java
// Task fails, request retry
externalTaskService.handleBpmnError(
    externalTask.getId(),
    externalTask.getWorkerId(),
    "PAYMENT_FAILED",
    "Payment gateway timeout"
);

// Retry with backoff
externalTaskService.complete(
    externalTask.getId(),
    externalTask.getWorkerId(),
    "Temporary failure",
    true, // Retry
    3, // Max retries
    300000 // 5 minutes retry timeout
);
```

### Error Handling in Worker

```java
worker.handler((externalTask, variables) -> {
    try {
        // Business logic
        PaymentResult result = processPayment(variables);
        
        Map<String, Object> resultVars = new HashMap<>();
        resultVars.put("paymentResult", result.getStatus());
        return resultVars;
        
    } catch (PaymentGatewayException e) {
        // Retryable error
        throw new ExternalTaskException(
            "Payment gateway unavailable",
            true, // Retry
            3, // Retry count
            60000 // Retry after
        );
        
    } catch (InvalidOrderException e) {
        // Non-retryable error
        throw new ExternalTaskException(
            "Invalid order data",
            false, // No retry
            0,
            0
        );
    }
});
```

### Dead Letter Handling

```java
// Query failed tasks (dead letters)
List<ExternalTask> deadLetters = externalTaskService.createExternalTaskQuery()
    .topicNames("payment-process")
    .retriesLessThan(1)
    .list();

// Manual intervention
for (ExternalTask task : deadLetters) {
    log.error("Dead letter task: {} - {}", 
        task.getId(), task.getErrorMessage());
    
    // Either fix and complete, or escalate
}
```

---

## API Reference

### ExternalTaskService Methods

```java
// Task Fetching
List<ExternalTask> fetchAndLock(
    String workerId,
    int maxTasks,
    String... topicNames
);

// Task Completion
void complete(
    String externalTaskId,
    String workerId,
    Map<String, Object> variables
);

void complete(
    String externalTaskId,
    String workerId,
    String errorMessage,
    boolean retry,
    int retries,
    long retryTimeout
);

// Error Handling
void handleBpmnError(
    String externalTaskId,
    String workerId,
    String errorCode,
    String errorMessage
);

// Task Query
ExternalTaskQuery createExternalTaskQuery();

// Task Management
void extendLock(
    String externalTaskId,
    String workerId,
    long lockDuration
);

void unlock(String externalTaskId, String workerId);
```

### ExternalTaskQuery

```java
ExternalTaskQuery createExternalTaskQuery();

// Filtering
.topicNames(String... topicNames)
.workerId(String workerId)
.processInstanceId(String processInstanceId)
.processInstanceBusinessKey(String businessKey)

// Ordering
.orderByTopic()
.orderByCreateTime()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
.count()
.singleResult()
```

---

## Usage Examples

### Payment Processing Worker

```java
@Component
public class PaymentWorker {
    
    @Autowired
    private ExternalTaskService externalTaskService;
    
    @Autowired
    private PaymentService paymentService;
    
    @Scheduled(fixedRate = 5000)
    public void pollAndProcess() {
        List<ExternalTask> tasks = externalTaskService.fetchAndLock(
            "payment-worker",
            10,
            "payment-process"
        );
        
        for (ExternalTask task : tasks) {
            try {
                processTask(task);
            } catch (Exception e) {
                handleTaskError(task, e);
            }
        }
    }
    
    private void processTask(ExternalTask task) {
        Map<String, Object> variables = externalTaskService.getVariables(task.getId());
        
        String orderId = (String) variables.get("orderId");
        double amount = ((Number) variables.get("amount")).doubleValue();
        
        PaymentResult result = paymentService.processPayment(orderId, amount);
        
        Map<String, Object> resultVariables = new HashMap<>();
        resultVariables.put("paymentResult", result.getStatus());
        resultVariables.put("transactionId", result.getTransactionId());
        
        externalTaskService.complete(task.getId(), "payment-worker", resultVariables);
    }
    
    private void handleTaskError(ExternalTask task, Exception e) {
        boolean retry = e instanceof PaymentGatewayException;
        int retries = retry ? 3 : 0;
        long retryTimeout = retry ? 60000 : 0;
        
        externalTaskService.complete(
            task.getId(),
            "payment-worker",
            e.getMessage(),
            retry,
            retries,
            retryTimeout
        );
    }
}
```

### Multi-Topic Worker

```java
@Component
public class MultiTopicWorker {
    
    @Autowired
    private ExternalTaskService externalTaskService;
    
    @Scheduled(fixedRate = 5000)
    public void pollAndProcess() {
        // Fetch tasks from multiple topics
        List<ExternalTask> tasks = externalTaskService.fetchAndLock(
            "multi-worker",
            20,
            "payment-process",
            "notification-send",
            "inventory-check"
        );
        
        for (ExternalTask task : tasks) {
            String topic = task.getTopic();
            
            switch (topic) {
                case "payment-process":
                    processPayment(task);
                    break;
                case "notification-send":
                    sendNotification(task);
                    break;
                case "inventory-check":
                    checkInventory(task);
                    break;
            }
        }
    }
}
```

---

## Best Practices

### 1. Use Meaningful Topic Names

```java
// GOOD
.topic("payment-process")
.topic("notification-email-send")

// BAD
.topic("task1")
.topic("t1")
```

### 2. Set Appropriate Lock Duration

```java
// GOOD - Match lock to processing time
.lockDuration(60000) // 60 seconds for typical processing

// BAD - Too short or too long
.lockDuration(5000) // Too short
.lockDuration(3600000) // Too long
```

### 3. Implement Proper Error Handling

```java
// GOOD - Distinguish retryable vs fatal errors
try {
    processTask();
} catch (RetryableException e) {
    completeWithRetry(task, e);
} catch (FatalException e) {
    completeWithoutRetry(task, e);
}

// BAD - No error handling
processTask();
```

### 4. Monitor Task Queue Depth

```java
// GOOD - Monitor backlog
long pendingTasks = externalTaskService.createExternalTaskQuery()
    .topicNames("payment-process")
    .count();

if (pendingTasks > THRESHOLD) {
    scaleWorkers();
}

// BAD - No monitoring
```

### 5. Use Async Response for Long Tasks

```java
// GOOD - Async for long-running
.asyncResponse(true)
.handler(task -> {
    CompletableFuture.supplyAsync(() -> processLongTask())
        .thenAccept(result -> complete(task, result));
});

// BAD - Blocking
.handler(task -> processLongTask()); // Blocks worker thread
```

---

## See Also

- [Parent Documentation](README.md)
- [Runtime Service](./runtime-service.md)
- [Integration Patterns](../api-reference/overview.md)
- [Best Practices](../best-practices/overview.md)
