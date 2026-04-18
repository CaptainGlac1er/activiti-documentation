---
sidebar_label: JavaDelegate
slug: /bpmn/advanced/java-delegate
title: "JavaDelegate"
description: "Complete guide to JavaDelegate in Activiti - implementing custom business logic in service tasks with the JavaDelegate interface."
---

# JavaDelegate

The `JavaDelegate` interface is the **primary way to implement custom business logic** in Activiti service tasks. It provides a simple, type-safe mechanism to execute Java code during process execution with full access to the runtime context.

## Overview

```java
public interface JavaDelegate {
    void execute(DelegateExecution execution);
}
```

**Usage in BPMN:**
```xml
<serviceTask id="myTask" name="Process Order" 
             activiti:class="com.example.OrderProcessor"/>
```

**BPMN 2.0 Standard:** ❌ Activiti Extension  
**Activiti Implementation:** Full support with multiple configuration options

## Key Features

### JavaDelegate Capabilities

| Feature | Description |
|---------|-------------|
| **Execution Context** | Full access to `DelegateExecution` |
| **Variable Management** | Get/set process and local variables |
| **Flow Control** | Influence process flow with exceptions |
| **Business Logic** | Implement complex operations |
| **External Integration** | Call services, APIs, databases |
| **Transaction Support** | Runs within process transaction |

### Implementation Requirements

| Requirement | Details |
|-------------|---------|
| **Serializable** | Must implement `Serializable` |
| **No-arg Constructor** | Required for instantiation |
| **Single Method** | Implement `execute(DelegateExecution)` |
| **Void Return** | Method returns void |
| **Exception Handling** | Can throw runtime exceptions |

## Basic Implementation

### Simple JavaDelegate

```java
package com.example;

import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.JavaDelegate;

public class SimpleDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Simple business logic
        System.out.println("Executing simple delegate");
        
        // Access variables
        String orderId = (String) execution.getVariable("orderId");
        System.out.println("Order ID: " + orderId);
        
        // Set variables
        execution.setVariable("processed", true);
        execution.setVariable("processTime", System.currentTimeMillis());
    }
}
```

**BPMN Configuration:**
```xml
<serviceTask id="simpleTask" name="Simple Task" 
             activiti:class="com.example.SimpleDelegate"/>
```

### JavaDelegate with Dependencies (Using delegateExpression)

**Important:** When using Spring dependency injection (`@Autowired`), you must use `activiti:delegateExpression` instead of `activiti:class`. The `class` attribute instantiates the delegate directly via reflection (no Spring context), while `delegateExpression` evaluates the expression against the Spring application context.

```java
package com.example;

import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.JavaDelegate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component("orderProcessor")
public class OrderProcessor implements JavaDelegate {
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get input variables
        String orderId = (String) execution.getVariable("orderId");
        String customerId = (String) execution.getVariable("customerId");
        
        // Business logic
        Order order = orderService.processOrder(orderId);
        
        // Send notification
        notificationService.sendOrderConfirmation(customerId, order);
        
        // Set output variables
        execution.setVariable("orderStatus", order.getStatus());
        execution.setVariable("processingTime", order.getProcessingTime());
        
        // Conditional flow
        if (order.requiresApproval()) {
            execution.setVariable("needsApproval", true);
        } else {
            execution.setVariable("needsApproval", false);
        }
    }
}
```

**BPMN Configuration (using delegateExpression):**
```xml
<serviceTask id="processOrder" name="Process Order" 
             activiti:delegateExpression="${orderProcessor}"/>
```

**Alternative: Using class attribute (no Spring injection)**

If you use `activiti:class`, the delegate is instantiated directly without Spring context:

```java
package com.example;

import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.JavaDelegate;

// NOT a Spring component - instantiated by Activiti
public class SimpleDelegate implements JavaDelegate {
    
    // Cannot use @Autowired here
    // Must use constructor injection or service locator pattern
    private final OrderService orderService;
    
    public SimpleDelegate() {
        // Get service from Spring context manually
        this.orderService = SpringContextUtil.getBean(OrderService.class);
    }
    
    @Override
    public void execute(DelegateExecution execution) {
        // Business logic
    }
}
```

**BPMN Configuration:**
```xml
<serviceTask id="simpleTask" name="Simple Task" 
             activiti:class="com.example.SimpleDelegate"/>
```

**Recommendation:** Use `delegateExpression` with Spring `@Component` for cleaner dependency injection.

## DelegateExecution API

### Variable Operations

```java
public class VariableOperationsDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get variable by name
        Object value = execution.getVariable("variableName");
        
        // Get variable with type safety
        String stringVar = (String) execution.getVariable("name");
        Integer intVar = (Integer) execution.getVariable("count");
        
        // Check if variable exists
        if (execution.hasVariable("optionalVar")) {
            Object optional = execution.getVariable("optionalVar");
        }
        
        // Get variable with default
        Object withDefault = execution.getVariable("maybeMissing", "defaultValue");
        
        // Set variable (process scope)
        execution.setVariable("result", "completed");
        execution.setVariable("timestamp", new Date());
        
        // Set variable (local scope - activity only)
        execution.setVariableLocal("tempData", "temporary");
        
        // Remove variable
        execution.removeVariable("obsolete");
        
        // Get all variable names
        Set<String> variableNames = execution.getVariableNames();
        
        // Get all variables
        Map<String, Object> allVariables = execution.getVariables();
    }
}
```

### Execution Context

```java
public class ExecutionContextDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Current execution ID
        String executionId = execution.getId();
        
        // Process instance ID
        String processInstanceId = execution.getProcessInstanceId();
        
        // Process definition ID
        String processDefinitionId = execution.getProcessDefinitionId();
        
        // Process definition key
        String processDefinitionKey = execution.getProcessDefinitionKey();
        
        // Current activity ID
        String activityId = execution.getActivityId();
        
        // Current user (if available)
        String currentUser = execution.getCurrentUserId();
        
        // Business key
        String businessKey = execution.getProcessInstanceBusinessKey();
        
        // Parent execution (for subprocesses)
        DelegateExecution parent = execution.getParent();
        
        // Child executions
        List<DelegateExecution> children = execution.getChildExecutions();
        
        // Check if multi-instance
        boolean isMultiInstance = execution.isMultiInstanceRoot();
    }
}
```

### Flow Control

```java
public class FlowControlDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get incoming sequence flows
        List<String> incomingFlows = execution.getIncomingFlowIds();
        
        // Get outgoing sequence flows
        List<String> outgoingFlows = execution.getOutgoingFlowIds();
        
        // Set variable to control gateway
        execution.setVariable("decision", "optionA");
        
        // Throw error to trigger boundary event
        if (someCondition) {
            throw new ActivitiException("Business rule violated");
        }
        
        // Throw BPMN error for specific error handling
        if (errorCondition) {
            BpmnError bpmnError = new BpmnError("VALIDATION_ERROR", "Validation failed");
            throw new ActivitiException(bpmnError);
        }
    }
}
```

### Process Instance Operations

```java
public class ProcessInstanceDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get process instance
        ProcessInstance processInstance = execution.getProcessInstance();
        
        // Process instance details
        String processInstanceId = processInstance.getId();
        String processDefinitionId = processInstance.getProcessDefinitionId();
        String businessKey = processInstance.getBusinessKey();
        String startDate = processInstance.getStartDate().toString();
        
        // Update business key
        // execution.getProcessInstance().setBusinessKey("new-key"); // Not directly available
        
        // Get process engine services
        ProcessEngineConfiguration config = execution.getEngineServices();
        RuntimeService runtimeService = config.getRuntimeService();
        TaskService taskService = config.getTaskService();
        RepositoryService repositoryService = config.getRepositoryService();
    }
}
```

## Advanced Patterns

### 1. Conditional Logic

```java
public class ConditionalDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        Object orderAmount = execution.getVariable("orderAmount");
        Object customerType = execution.getVariable("customerType");
        
        if (orderAmount != null && ((Number) orderAmount).doubleValue() > 10000) {
            if ("VIP".equals(customerType)) {
                execution.setVariable("approvalLevel", "SENIOR_MANAGER");
                execution.setVariable("autoApprove", true);
            } else {
                execution.setVariable("approvalLevel", "DIRECTOR");
                execution.setVariable("autoApprove", false);
            }
        } else {
            execution.setVariable("approvalLevel", "MANAGER");
            execution.setVariable("autoApprove", true);
        }
    }
}
```

### 2. External Service Integration

```java
public class ExternalServiceDelegate implements JavaDelegate {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${external.api.url}")
    private String externalApiUrl;
    
    @Override
    public void execute(DelegateExecution execution) {
        String orderId = (String) execution.getVariable("orderId");
        
        try {
            // Call external API
            ExternalResponse response = restTemplate.getForObject(
                externalApiUrl + "/orders/" + orderId, 
                ExternalResponse.class
            );
            
            // Set response as variables
            execution.setVariable("externalStatus", response.getStatus());
            execution.setVariable("externalData", response.getData());
            
            // Handle different responses
            if ("APPROVED".equals(response.getStatus())) {
                execution.setVariable("proceed", true);
            } else {
                execution.setVariable("proceed", false);
                execution.setVariable("rejectionReason", response.getReason());
            }
            
        } catch (Exception e) {
            // Handle API errors
            execution.setVariable("externalCallFailed", true);
            execution.setVariable("error", e.getMessage());
            
            // Optionally throw to trigger error handling
            // throw new ActivitiException("External API call failed", e);
        }
    }
}
```

### 3. Data Transformation

```java
public class DataTransformationDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get raw data
        Map<String, Object> rawData = (Map<String, Object>) execution.getVariable("rawData");
        
        // Transform data
        Map<String, Object> transformedData = new HashMap<>();
        
        if (rawData != null) {
            // Convert and enrich data
            String name = (String) rawData.get("name");
            transformedData.put("fullName", name.toUpperCase());
            
            String email = (String) rawData.get("email");
            transformedData.put("normalizedEmail", email.toLowerCase().trim());
            
            // Calculate derived values
            Number quantity = (Number) rawData.get("quantity");
            Number price = (Number) rawData.get("price");
            transformedData.put("total", quantity.doubleValue() * price.doubleValue());
            
            // Add metadata
            transformedData.put("transformedAt", new Date());
            transformedData.put("transformedBy", execution.getCurrentUserId());
        }
        
        // Set transformed data
        execution.setVariable("transformedData", transformedData);
        
        // Also set individual variables for easy access
        execution.setVariable("fullName", transformedData.get("fullName"));
        execution.setVariable("totalAmount", transformedData.get("total"));
    }
}
```

### 4. Validation and Error Handling

```java
public class ValidationDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        String email = (String) execution.getVariable("email");
        String phone = (String) execution.getVariable("phone");
        Number age = (Number) execution.getVariable("age");
        
        List<String> errors = new ArrayList<>();
        
        // Validate email
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            errors.add("Invalid email format");
        }
        
        // Validate phone
        if (phone == null || !phone.matches("^\\d{10,15}$")) {
            errors.add("Invalid phone number");
        }
        
        // Validate age
        if (age == null || age.intValue() < 18) {
            errors.add("Must be at least 18 years old");
        }
        
        // Handle validation errors
        if (!errors.isEmpty()) {
            execution.setVariable("validationErrors", errors);
            execution.setVariable("validationFailed", true);
            
            // Option 1: Set variable and let process continue to error handling
            // execution.setVariable("proceed", false);
            
            // Option 2: Throw exception to trigger boundary event
            throw new ActivitiException("Validation failed: " + String.join(", ", errors));
            
            // Option 3: Throw BPMN error for specific handling
            // throw new ActivitiException(new BpmnError("VALIDATION_ERROR", errors.toString()));
        } else {
            execution.setVariable("validationPassed", true);
        }
    }
}
```

### 5. Multi-Instance Delegate

```java
public class MultiInstanceDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Check if running in multi-instance
        if (execution.isMultiInstanceRoot()) {
            // Get multi-instance collection
            List<Object> collection = (List<Object>) execution.getVariable(
                execution.getMultiInstanceVariableName()
            );
            
            // Get current index
            Integer currentIndex = execution.getLoopCounter();
            
            // Get current element
            Object currentElement = collection.get(currentIndex - 1);
            
            // Process current element
            processElement(currentElement, execution);
            
            // Set completion condition
            if (currentIndex >= collection.size()) {
                execution.setVariable("allProcessed", true);
            }
        } else {
            // Normal execution
            processSingle(execution);
        }
    }
    
    private void processElement(Object element, DelegateExecution execution) {
        // Process individual element
        execution.setVariableLocal("processedElement", element);
    }
    
    private void processSingle(DelegateExecution execution) {
        // Single instance processing
    }
}
```

## Complete Examples

### Example 1: Order Processing Pipeline

```java
@Component
public class OrderProcessingDelegate implements JavaDelegate {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private InventoryService inventoryService;
    
    @Autowired
    private PaymentGateway paymentGateway;
    
    @Autowired
    private EmailService emailService;
    
    @Override
    public void execute(DelegateExecution execution) {
        // 1. Get order ID
        String orderId = (String) execution.getVariable("orderId");
        if (orderId == null) {
            throw new ActivitiException("Order ID is required");
        }
        
        // 2. Fetch order
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ActivitiException("Order not found: " + orderId));
        
        // 3. Check inventory
        InventoryStatus inventoryStatus = inventoryService.checkAvailability(order.getItems());
        execution.setVariable("inventoryStatus", inventoryStatus.getStatus());
        
        if (!inventoryStatus.isAvailable()) {
            execution.setVariable("canProceed", false);
            execution.setVariable("blockReason", "INSUFFICIENT_INVENTORY");
            return;
        }
        
        // 4. Process payment
        PaymentResult paymentResult = paymentGateway.processPayment(order);
        execution.setVariable("paymentTransactionId", paymentResult.getTransactionId());
        execution.setVariable("paymentStatus", paymentResult.getStatus());
        
        if (!paymentResult.isSuccess()) {
            execution.setVariable("canProceed", false);
            execution.setVariable("blockReason", "PAYMENT_FAILED");
            return;
        }
        
        // 5. Reserve inventory
        inventoryService.reserveInventory(order.getItems());
        execution.setVariable("inventoryReserved", true);
        
        // 6. Send confirmation
        emailService.sendOrderConfirmation(order.getCustomerEmail(), order);
        execution.setVariable("confirmationSent", true);
        
        // 7. Set success flag
        execution.setVariable("canProceed", true);
        execution.setVariable("orderStatus", "PROCESSING");
        execution.setVariable("processingTimestamp", new Date());
    }
}
```

**BPMN:**
```xml
<serviceTask id="processOrder" name="Process Order" 
             activiti:class="com.example.OrderProcessingDelegate"/>

<exclusiveGateway id="canProceed"/>

<sequenceFlow id="success" sourceRef="canProceed" targetRef="shipOrder">
  <conditionExpression>${canProceed == true}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="failed" sourceRef="canProceed" targetRef="handleFailure">
  <conditionExpression>${canProceed == false}</conditionExpression>
</sequenceFlow>
```

### Example 2: Data Enrichment Delegate

```java
@Component
public class DataEnrichmentDelegate implements JavaDelegate {
    
    @Autowired
    private CustomerService customerService;
    
    @Autowired
    private AddressValidationService addressService;
    
    @Autowired
    private RiskAssessmentService riskService;
    
    @Override
    public void execute(DelegateExecution execution) {
        String customerId = (String) execution.getVariable("customerId");
        
        // 1. Enrich customer data
        Customer customer = customerService.getCustomerDetails(customerId);
        execution.setVariable("customerName", customer.getFullName());
        execution.setVariable("customerSegment", customer.getSegment());
        execution.setVariable("customerSince", customer.getRegistrationDate());
        
        // 2. Calculate customer metrics
        Double totalSpent = customerService.getTotalSpent(customerId);
        Integer orderCount = customerService.getOrderCount(customerId);
        execution.setVariable("totalSpent", totalSpent);
        execution.setVariable("orderCount", orderCount);
        
        if (totalSpent != null && orderCount != null && orderCount > 0) {
            execution.setVariable("averageOrderValue", totalSpent / orderCount);
        }
        
        // 3. Validate address
        Address address = (Address) execution.getVariable("shippingAddress");
        AddressValidationResult validation = addressService.validate(address);
        execution.setVariable("addressValid", validation.isValid());
        execution.setVariable("addressStandardized", validation.getStandardizedAddress());
        
        // 4. Assess risk
        RiskAssessment risk = riskService.assess(customer, address, execution.getVariables());
        execution.setVariable("riskScore", risk.getScore());
        execution.setVariable("riskLevel", risk.getLevel());
        
        // 5. Determine if manual review needed
        boolean needsReview = risk.getLevel() == RiskLevel.HIGH || !validation.isValid();
        execution.setVariable("needsManualReview", needsReview);
        
        // 6. Set enrichment timestamp
        execution.setVariable("enrichmentTimestamp", new Date());
        execution.setVariable("enrichedBy", execution.getCurrentUserId());
    }
}
```

## Spring Integration

### Using @Component

```java
@Component("orderValidator")
public class OrderValidator implements JavaDelegate {
    
    @Autowired
    private ValidationRules validationRules;
    
    @Value("${order.maxAmount:10000}")
    private double maxOrderAmount;
    
    @Override
    public void execute(DelegateExecution execution) {
        // Spring-managed bean with dependencies
    }
}
```

**BPMN:**
```xml
<serviceTask id="validateOrder" name="Validate Order" 
             activiti:class="com.example.OrderValidator"/>
```

### Using @Configuration

```java
@Configuration
public class DelegateConfiguration {
    
    @Bean
    public JavaDelegate complexDelegate(ComplexService complexService) {
        return new ComplexDelegate(complexService);
    }
}

public class ComplexDelegate implements JavaDelegate {
    
    private final ComplexService complexService;
    
    @Autowired
    public ComplexDelegate(ComplexService complexService) {
        this.complexService = complexService;
    }
    
    @Override
    public void execute(DelegateExecution execution) {
        complexService.process(execution);
    }
}
```

## Best Practices

### 1. Keep Delegates Focused

```java
// GOOD: Single responsibility
@Component
public class PaymentProcessor implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        // Only handle payment
    }
}

// BAD: Too many responsibilities
@Component
public class DoEverythingDelegate implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        // Payment, shipping, email, logging, metrics...
    }
}
```

### 2. Handle Exceptions Gracefully

```java
@Override
public void execute(DelegateExecution execution) {
    try {
        processBusinessLogic(execution);
    } catch (ExternalServiceException e) {
        // Log and set error variable
        execution.setVariable("error", e.getMessage());
        execution.setVariable("canProceed", false);
    } catch (Exception e) {
        // Unexpected error - rethrow
        throw new ActivitiException("Processing failed", e);
    }
}
```

### 3. Use Meaningful Variable Names

```java
// GOOD: Clear and descriptive
execution.setVariable("orderTotalAmount", total);
execution.setVariable("paymentTransactionId", txId);

// BAD: Generic
execution.setVariable("var1", total);
execution.setVariable("id", txId);
```

### 4. Document Delegate Purpose

```java
/**
 * Validates customer information and enriches with additional data.
 * 
 * Input variables:
 * - customerId: String (required)
 * - customerEmail: String (required)
 * 
 * Output variables:
 * - customerValid: Boolean
 * - customerSegment: String
 * - riskScore: Double
 * - needsManualReview: Boolean
 * 
 * Throws:
 * - ActivitiException if customer not found
 */
@Component
public class CustomerValidationDelegate implements JavaDelegate {
    // Implementation
}
```

### 5. Make Delegates Testable

```java
public class TestableDelegate implements JavaDelegate {
    
    private final ExternalService externalService;
    
    // Constructor injection for testing
    public TestableDelegate(ExternalService externalService) {
        this.externalService = externalService;
    }
    
    @Override
    public void execute(DelegateExecution execution) {
        // Delegate to injectable service
        externalService.process(execution);
    }
}
```

## Common Pitfalls

### 1. Null Pointer Exceptions

```java
// BAD: No null check
String orderId = (String) execution.getVariable("orderId");
processOrder(orderId); // NPE if orderId is null

// GOOD: Null check
String orderId = (String) execution.getVariable("orderId");
if (orderId == null) {
    throw new ActivitiException("Order ID is required");
}
processOrder(orderId);
```

### 2. Blocking Operations

```java
// BAD: Long-running synchronous operation
@Override
public void execute(DelegateExecution execution) {
    slowExternalApi.call(); // Blocks process
}

// GOOD: Async operation
@Override
public void execute(DelegateExecution execution) {
    executorService.submit(() -> slowExternalApi.call());
    execution.setVariable("asyncJobId", jobId);
}
```

### 3. Modifying Shared Objects

```java
// BAD: Modifying shared object
List<String> items = (List<String>) execution.getVariable("items");
items.add("newItem"); // Affects other executions

// GOOD: Create new object
List<String> items = (List<String>) execution.getVariable("items");
List<String> newItems = new ArrayList<>(items);
newItems.add("newItem");
execution.setVariable("items", newItems);
```

## Related Documentation

- [Service Task](../elements/service-task.md) - Service task configuration
- [DelegateExecution API](./delegate-execution-api.md) - Full API reference
- [Execution Listeners](./execution-listeners.md) - Alternative hook mechanism
- [Task Listeners](./task-listeners.md) - Task-level hooks

---

**Last Updated:** 2026  
**Source:** `JavaDelegate.java`
