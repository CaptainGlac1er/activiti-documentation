---
sidebar_label: Service Task
slug: /bpmn/elements/service-task
description: Complete guide to ServiceTask elements with Activiti customizations for automated processing
---

# Service Task

Service Tasks represent **automated work** performed by the system, such as calling external services, executing business logic, or integrating with other systems.

## 📋 Overview

```xml
<serviceTask id="service1" name="Process Payment">
  <!-- Activiti customizations -->
</serviceTask>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ Rich integration capabilities

## 🎯 Key Features

### Standard BPMN Features
- **Implementation** - Service interface and operation
- **Input/Output Data** - Data associations
- **Message Correlation** - For receive tasks
- **Multi-instance** - Parallel executions

### Activiti Customizations
- **Class Implementation** - Direct Java class execution
- **Delegate Expression** - Spring bean integration
- **Expression** - EL/SpEL expression execution
- **Field Injection** - Dependency injection
- **Operation Reference** - Connector support
- **DMN Integration** - Decision engine
- **Mail Task** - Email sending
- **Async Execution** - Background jobs
- **Custom Properties** - Metadata extension
- **Skip Expression** - Conditional execution
- **Retry Configuration** - Job retry policies

## 📝 Implementation Types

### 1. Class Implementation

Execute a Java class implementing `JavaDelegate`:

```xml
<serviceTask id="paymentService" 
             name="Process Payment"
             activiti:implementation="${com.example.PaymentService}"/>
```

**JavaDelegate Interface:**
```java
public interface JavaDelegate {
    void execute(DelegateExecution execution);
}
```

**Example Implementation:**
```java
public class PaymentService implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        // Get process variables
        String orderId = (String) execution.getVariable("orderId");
        double amount = (Double) execution.getVariable("amount");
        
        // Business logic
        PaymentResult result = processPayment(orderId, amount);
        
        // Set output variables
        execution.setVariable("paymentResult", result);
        execution.setVariable("transactionId", result.getTransactionId());
    }
}
```

### 2. Delegate Expression

Reference a Spring bean:

```xml
<serviceTask id="notificationService" 
             name="Send Notification"
             activiti:delegateExpression="${notificationService}"/>
```

**Spring Bean:**
```java
@Component("notificationService")
public class NotificationService implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        // Send notification
    }
}
```

**Advanced Delegate Expression:**
```xml
<serviceTask activiti:delegateExpression="${paymentService.processPayment()}"/>
```

### 3. Expression

Execute EL/SpEL expressions:

```xml
<serviceTask id="calculation" 
             name="Calculate Total"
             activiti:expression="${calculateTotal(orderItems)}"/>
```

**Result Variable:**
```xml
<serviceTask id="calculation" 
             activiti:expression="${calculator.compute()}"
             activiti:resultVariable="computationResult"/>
```

### 4. Field Injection

Inject dependencies into delegates:

```xml
<serviceTask id="orderService" 
             name="Process Order"
             activiti:class="com.example.OrderService">
  
  <!-- String value -->
  <activiti:field name="emailTemplate" stringValue="order_confirmation.html"/>
  
  <!-- Expression -->
  <activiti:field name="currency" expression="${order.currency}"/>
  
  <!-- Spring bean injection -->
  <activiti:field name="paymentGateway">
    <activiti:inject>#{paymentGatewayBean}</activiti:inject>
  </activiti:field>
  
  <!-- Integer value -->
  <activiti:field name="retryCount" integer="3"/>
  
  <!-- Boolean value -->
  <activiti:field name="enabled" boolean="true"/>
</serviceTask>
```

**Field Types:**
- `stringValue` - Direct string value
- `expression` - EL/SpEL expression (e.g., `${variable}`)
- `inject` - Spring bean injection (e.g., `#{beanName}`)
- `integer` - Integer value
- `boolean` - Boolean value

**Java Delegate with Fields:**
```java
public class OrderService implements JavaDelegate {
    
    private String emailTemplate;
    private String currency;
    private PaymentGateway paymentGateway;
    private int retryCount;
    private boolean enabled;
    
    @Override
    public void execute(DelegateExecution execution) {
        // Use injected fields
    }
    
    // Setters for field injection
    public void setEmailTemplate(String emailTemplate) {
        this.emailTemplate = emailTemplate;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public void setPaymentGateway(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }
    
    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
```

### 5. Connector Implementation

Use pre-built connectors:

```xml
<serviceTask id="httpCall" 
             name="Call REST API"
             activiti:type="rest"
             activiti:operationRef="getOrderDetails">
  
  <extensionElements>
    <connector:operation id="getOrderDetails">
      <connector:input>
        <connector:parameter name="orderId" value="${orderId}"/>
      </connector:input>
      <connector:output>
        <connector:parameter name="order" to="${orderDetails}"/>
      </connector:output>
    </connector:operation>
  </extensionElements>
</serviceTask>
```

### 6. DMN Decision

Integrate with Decision Model and Notation:

```xml
<serviceTask id="creditDecision" 
             name="Credit Assessment"
             activiti:type="dmn"
             activiti:implementation="dmn:credit-decision.dmn"/>
```

### 7. Mail Task

Send emails:

```xml
<serviceTask id="sendEmail" 
             name="Send Confirmation Email"
             activiti:type="mail">
  
  <activiti:field name="to">
    <activiti:expression>${customerEmail}</activiti:expression>
  </activiti:field>
  
  <activiti:field name="subject">
    <activiti:string>Order Confirmation</activiti:string>
  </activiti:field>
  
  <activiti:field name="message">
    <activiti:expression>${emailTemplate}</activiti:expression>
  </activiti:field>
</serviceTask>
```

## 🔧 Advanced Features

### Async Execution

Run service tasks in the background:

```xml
<serviceTask id="longRunningService" 
             name="Process Large Dataset"
             activiti:class="com.example.BatchProcessor"
             activiti:async="true"/>
```

**Note:** Job expiry is configured via Management Service or job executor settings, not through BPMN attributes.

**Use Cases:**
- Long-running operations
- External system calls
- Batch processing
- Non-critical path activities

### Job Retry Configuration

Configure retry policies for failed jobs:

```xml
<serviceTask id="unreliableService" 
             name="Call External API"
             activiti:class="com.example.ExternalApiService"
             activiti:async="true">
  
  <!-- Retry 5 times -->
  <activiti:property name="failedJobRetryTimeCycle" value="R/5"/>
  
  <!-- Retry with exponential backoff -->
  <activiti:property name="failedJobRetryTimeCycle" 
                     value="R5/PT1M;R3/PT5M;R2/PT30M"/>
</serviceTask>
```

**Retry Cycle Syntax:**
- `R/5` - Retry 5 times immediately
- `R5/PT1M` - Retry 5 times with 1 minute interval
- `R3/PT5M;R2/PT30M` - Retry 3 times (5min), then 2 times (30min)

### Skip Expression

Conditionally skip service execution:

```xml
<serviceTask id="optionalService" 
             name="Enrich Data"
             activiti:class="com.example.DataEnricher"
             activiti:skipExpression="${!enrichData}"/>
```

### Custom Properties

Add metadata:

```xml
<serviceTask id="customService" 
             name="Custom Processing"
             activiti:class="com.example.CustomService">
  
  <activiti:property name="department" value="finance"/>
  <activiti:property name="version" value="2.0"/>
  <activiti:property name="sla" value="PT1H"/>
</serviceTask>
```

### Execution Listeners

Hook into execution lifecycle:

```xml
<serviceTask id="trackedService" 
             name="Tracked Service"
             activiti:class="com.example.TrackedService">
  
  <extensionElements>
    <activiti:executionListener event="start" class="com.example.StartTracker"/>
    <activiti:executionListener event="end" delegateExpression="${endTracker}"/>
    <activiti:executionListener event="take" class="com.example.FlowTracker"/>
  </extensionElements>
</serviceTask>
```

**Supported Events:**
- `start` - Before service execution
- `end` - After service execution
- `take` - When sequence flow is taken

### Boundary Events

Handle exceptions:

```xml
<serviceTask id="riskyService" 
             name="External Call"
             activiti:class="com.example.ExternalService"
             activiti:async="true">
  
  <!-- Error boundary event -->
  <boundaryEvent id="errorHandler" cancelActivity="true">
    <errorEventDefinition errorRef="ExternalServiceError"/>
  </boundaryEvent>
  
  <!-- Timer boundary event -->
  <boundaryEvent id="timeoutHandler" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT30S</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
</serviceTask>
```

## 💡 Complete Examples

### Example 1: Payment Processing with Retry

```xml
<serviceTask id="processPayment" 
             name="Process Payment"
             activiti:class="com.example.PaymentProcessor"
             activiti:async="true"
             activiti:resultVariable="paymentResult">
  
  <activiti:field name="paymentGateway">
    <activiti:inject>#{stripePaymentGateway}</activiti:inject>
  </activiti:field>
  
  <activiti:field name="currency">
    <activiti:expression>${order.currency}</activiti:expression>
  </activiti:field>
  
  <!-- Retry configuration -->
  <activiti:property name="failedJobRetryTimeCycle" value="R3/PT1M;R2/PT5M"/>
  
  <!-- Execution tracking -->
  <activiti:executionListener event="start" class="com.example.PaymentStartListener"/>
  <activiti:executionListener event="end" delegateExpression="${paymentEndListener}"/>
  
  <!-- Error handling -->
  <boundaryEvent id="paymentError" cancelActivity="true">
    <errorEventDefinition errorRef="PaymentError"/>
  </boundaryEvent>
  
  <!-- Timeout handling -->
  <boundaryEvent id="paymentTimeout" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT60S</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
</serviceTask>
```

### Example 2: Multi-Service Orchestration

```xml
<!-- Service 1: Validate Order -->
<serviceTask id="validateOrder" 
             name="Validate Order"
             activiti:delegateExpression="${orderValidator.validate()}"
             activiti:resultVariable="validationResult"/>

<!-- Service 2: Check Inventory -->
<serviceTask id="checkInventory" 
             name="Check Inventory"
             activiti:class="com.example.InventoryService"
             activiti:skipExpression="${!validationResult.isValid}">
  
  <activiti:field name="items">
    <activiti:expression>${order.items}</activiti:expression>
  </activiti:field>
  
  <activiti:executionListener event="start" class="com.example.InventoryCheckListener"/>
</serviceTask>

<!-- Service 3: Reserve Stock -->
<serviceTask id="reserveStock" 
             name="Reserve Stock"
             activiti:delegateExpression="${inventoryService.reserve()}"
             activiti:async="true">
  
  <activiti:property name="failedJobRetryTimeCycle" value="R/3"/>
</serviceTask>

<!-- Service 4: Send Confirmation -->
<serviceTask id="sendConfirmation" 
             name="Send Confirmation"
             activiti:type="mail">
  
  <activiti:field name="to">
    <activiti:expression>${customer.email}</activiti:expression>
  </activiti:field>
  
  <activiti:field name="subject">
    <activiti:string>Order Confirmation: ${order.id}</activiti:string>
  </activiti:field>
  
  <activiti:field name="message">
    <activiti:expression>${emailService.generateConfirmation(order)}</activiti:expression>
  </activiti:field>
</serviceTask>
```

### Example 3: DMN Decision Integration

```xml
<serviceTask id="creditDecision" 
             name="Credit Assessment"
             activiti:type="dmn"
             activiti:implementation="dmn:credit-decision-table.dmn"
             activiti:resultVariable="creditDecision">
  
  <extensionElements>
    <activiti:inputParameter name="applicantAge">${applicant.age}</activiti:inputParameter>
    <activiti:inputParameter name="annualIncome">${applicant.annualIncome}</activiti:inputParameter>
    <activiti:inputParameter name="creditScore">${applicant.creditScore}</activiti:inputParameter>
    <activiti:inputParameter name="loanAmount">${loan.amount}</activiti:inputParameter>
  </extensionElements>
  
  <activiti:executionListener event="end" class="com.example.CreditDecisionListener"/>
</serviceTask>
```

### Example 4: REST API Integration

```xml
<serviceTask id="callExternalAPI" 
             name="Fetch Customer Data"
             activiti:type="rest"
             activiti:operationRef="getCustomer">
  
  <extensionElements>
    <connector:operation id="getCustomer" 
                         implementation="com.example.connector.RestClient">
      <connector:input>
        <connector:parameter name="customerId" value="${customerId}"/>
        <connector:parameter name="apiKey" value="${#apiKeys.customerApi}"/>
      </connector:input>
      <connector:output>
        <connector:parameter name="customerData" to="${externalCustomerData}"/>
      </connector:output>
    </connector:operation>
  </extensionElements>
  
  <activiti:property name="failedJobRetryTimeCycle" value="R5/PT30S"/>
  
  <boundaryEvent id="apiError" cancelActivity="true">
    <errorEventDefinition errorRef="ExternalApiError"/>
  </boundaryEvent>
</serviceTask>
```

## 🔍 Runtime API Usage

### Executing Service Tasks

Service tasks execute automatically when reached in the process flow. You can control them via:

```java
// Get job information (for async tasks)
List<Job> jobs = managementService.createJobQuery()
    .processInstanceId(processInstanceId)
    .list();

// Retry failed job
managementService.retryJob(jobId);

// Delete job
managementService.deleteJob(jobId);

// Update job retry time
managementService.setJobRetries(jobId, 3);
```

### Testing Service Tasks

```java
// Mock service task for testing
@MockActiviti
public class PaymentServiceTest {
    
    @Test
    public void testPaymentService() {
        // Mock the delegate
        mockSupport.mockServiceTaskWithClassDelegate(
            "com.example.PaymentProcessor",
            MockPaymentProcessor.class
        );
        
        // Start process
        ProcessInstance process = runtimeService.startProcessInstanceByKey("paymentProcess");
        
        // Verify execution
        verify(mockPaymentProcessor).execute(any());
    }
}
```

## 📊 Best Practices

1. **Use Async for Long Operations:** Prevent blocking the process engine
2. **Configure Retry Policies:** Handle transient failures gracefully
3. **Add Boundary Events:** Implement error handling at task level
4. **Field Injection:** Use Spring beans for dependency management
5. **Result Variables:** Store outputs for downstream activities
6. **Execution Listeners:** Add monitoring and logging
7. **Skip Expressions:** Implement conditional logic
8. **Transaction Management:** Ensure atomicity for critical operations
9. **Idempotency:** Design services to handle retries safely
10. **Monitoring:** Track job execution and failures

## ⚠️ Common Pitfalls

- **Synchronous Long Operations:** Blocks process engine threads
- **No Error Handling:** Uncaught exceptions fail the process
- **Missing Retry Configuration:** Transient failures cause permanent issues
- **Complex Logic in Expressions:** Hard to debug and maintain
- **Stateful Delegates:** Thread safety issues in multi-tenant environments
- **No Transaction Management:** Data inconsistency risks

## 🔄 Error Handling Patterns

### Pattern 1: Try-Catch with Boundary Event

```xml
<serviceTask id="riskyOperation" activiti:class="com.example.RiskyService">
  <boundaryEvent id="catchError" cancelActivity="true">
    <errorEventDefinition errorRef="OperationError"/>
  </boundaryEvent>
</serviceTask>
```

### Pattern 2: Retry with Exponential Backoff

```xml
<serviceTask id="unreliableService" 
             activiti:async="true"
             activiti:class="com.example.UnreliableService">
  <activiti:property name="failedJobRetryTimeCycle" 
                     value="R1/PT10S;R2/PT1M;R2/PT5M;R1/PT30M"/>
</serviceTask>
```

### Pattern 3: Compensation

```xml
<serviceTask id="reserveResource" 
             activiti:class="com.example.ResourceReserver"
             activiti:forCompensation="true"/>

<serviceTask id="compensateReservation" 
             activiti:class="com.example.ResourceCompensator">
  <activiti:property name="compensates" value="reserveResource"/>
</serviceTask>
```

## 🔗 Related Documentation

- [User Task](./user-task.md)
- [Script Task](./script-task.md)
- [Business Rule Task](./business-rule-task.md)
- [Async Execution](../advanced/async-execution.md)
- [Connectors](../integration/connectors.md)
- [DMN in Business Rule Tasks](./business-rule-task.md#dmn-implementation)

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated:** 2024
