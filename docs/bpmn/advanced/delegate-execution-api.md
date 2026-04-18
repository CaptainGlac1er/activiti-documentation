---
sidebar_label: DelegateExecution API
slug: /bpmn/advanced/delegate-execution-api
title: "DelegateExecution API"
description: "Complete reference for the DelegateExecution API in Activiti - accessing and manipulating process execution context."
---

# DelegateExecution API

The `DelegateExecution` interface provides **programmatic access to the process execution context** from within JavaDelegates, execution listeners, and other custom code. It's the primary mechanism for interacting with process variables, flow control, and execution metadata.

## Overview

```java
public interface DelegateExecution extends VariableScope {
    // Execution context methods
    String getId();
    String getProcessInstanceId();
    String getProcessDefinitionId();
    String getActivityId();
    
    // Variable access (inherits from VariableScope)
    Object getVariable(String variableName);
    void setVariable(String variableName, Object value);
    
    // Flow control
    List<String> getIncomingFlowIds();
    List<String> getOutgoingFlowIds();
    
    // Process instance access
    ProcessInstance getProcessInstance();

    // Engine access
    ProcessEngineConfiguration getEngineServices();
}
```

**BPMN 2.0 Standard:** ❌ Activiti Extension  
**Activiti Implementation:** Full API with comprehensive methods

## Core Methods

### Execution Identification

```java
public class ExecutionIdDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Unique execution ID
        String executionId = execution.getId();
        
        // Process instance ID
        String processInstanceId = execution.getProcessInstanceId();
        
        // Process definition ID (includes version)
        String processDefinitionId = execution.getProcessDefinitionId();
        // Example: "orderProcess:1:abc123"
        
        // Process definition key
        String processDefinitionKey = execution.getProcessDefinitionKey();
        // Example: "orderProcess"
        
        // Current activity ID
        String activityId = execution.getActivityId();
        
        // Current user (if available)
        String currentUser = execution.getCurrentUserId();
        
        // Tenant ID (for multi-tenant)
        String tenantId = execution.getTenantId();
    }
}
```

### Variable Access

DelegateExecution inherits from `VariableScope`, providing comprehensive variable management:

```java
public class VariableAccessDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Basic get/set
        Object value = execution.getVariable("variableName");
        execution.setVariable("variableName", "newValue");
        
        // Type-safe access
        String stringVar = (String) execution.getVariable("name");
        Integer intVar = (Integer) execution.getVariable("count");
        BigDecimal decimalVar = (BigDecimal) execution.getVariable("amount");
        
        // Check existence
        if (execution.hasVariable("optionalVar")) {
            Object optional = execution.getVariable("optionalVar");
        }
        
        // Get with default
        Object withDefault = execution.getVariable("maybeMissing", "default");
        
        // Get all variable names
        Set<String> variableNames = execution.getVariableNames();
        
        // Get all variables
        Map<String, Object> allVariables = execution.getVariables();
        
        // Remove variable
        execution.removeVariable("obsolete");
        
        // Remove all variables
        execution.clearVariables();
    }
}
```

### Local vs Global Variables

```java
public class VariableScopeDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Global variable (process scope)
        execution.setVariable("globalVar", "process-wide");
        Object global = execution.getVariable("globalVar");
        
        // Local variable (activity scope only)
        execution.setVariableLocal("localVar", "activity-only");
        Object local = execution.getVariableLocal("localVar");
        
        // Check local variable existence
        if (execution.hasVariableLocal("localVar")) {
            // Access it
        }
        
        // Get local variable names
        Set<String> localVariableNames = execution.getVariableNamesLocal();
        
        // Get all local variables
        Map<String, Object> localVariables = execution.getVariablesLocal();
        
        // Remove local variable
        execution.removeVariableLocal("localVar");
        
        // Scope difference:
        // - Global: Available throughout process instance
        // - Local: Only available within current activity
        //           Automatically cleaned up when activity completes
    }
}
```

### Typed Variable Access

```java
public class TypedVariableDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get variable as specific type
        String name = execution.getVariable("customerName", String.class);
        Integer count = execution.getVariable("itemCount", Integer.class);
        Double amount = execution.getVariable("totalAmount", Double.class);
        Date created = execution.getVariable("createdAt", Date.class);
        
        // Get variable with type and default
        String withDefault = execution.getVariable("optional", String.class, "default");
        
        // Set strongly-typed variables
        execution.setVariable("name", "John Doe", String.class);
        execution.setVariable("count", 42, Integer.class);
    }
}
```

## Process Instance Access

### Getting Process Instance

```java
public class ProcessInstanceDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get process instance
        ProcessInstance processInstance = execution.getProcessInstance();
        
        // Process instance properties
        String processInstanceId = processInstance.getId();
        String processDefinitionId = processInstance.getProcessDefinitionId();
        String processDefinitionKey = processInstance.getProcessDefinitionKey();
        String processDefinitionName = processInstance.getProcessDefinitionName();
        String businessKey = processInstance.getBusinessKey();
        Date startDate = processInstance.getStartDate();
        String superProcessInstanceId = processInstance.getSuperProcessInstanceId();
        String superCaseInstanceId = processInstance.getSuperCaseInstanceId();
        String rootProcessInstanceId = processInstance.getRootProcessInstanceId();
        
        // Version info
        int definitionVersion = processInstance.getProcessDefinitionVersion();
        
        // State
        boolean isEnded = processInstance.isEnded(); // Usually false during execution
    }
}
```

### Business Key Operations

```java
public class BusinessKeyDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get business key directly from execution
        String businessKey = execution.getProcessInstanceBusinessKey();
        
        // Business keys are set at process start
        // Cannot be modified during execution via DelegateExecution
        
        // Use for correlation and querying
        if ("ORDER-12345".equals(businessKey)) {
            // Special handling for this business key
        }
    }
}
```

## Execution Hierarchy

### Parent and Child Executions

```java
public class ExecutionHierarchyDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get parent execution (for subprocesses, multi-instance)
        DelegateExecution parent = execution.getParent();
        
        if (parent != null) {
            // Access parent variables
            Object parentVar = parent.getVariable("parentVar");
            
            // Navigate up the hierarchy
            DelegateExecution grandParent = parent.getParent();
        }
        
        // Get child executions
        List<DelegateExecution> children = execution.getChildExecutions();
        
        for (DelegateExecution child : children) {
            String childActivityId = child.getActivityId();
            Object childVar = child.getVariable("childVar");
        }
        
        // Get root execution
        DelegateExecution root = execution.getRootProcessInstance();
        
        // Set variable at root level (process-wide)
        root.setVariable("processWideVar", "value");
    }
}
```

### Multi-Instance Execution

```java
public class MultiInstanceDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Check if multi-instance
        boolean isMultiInstance = execution.isMultiInstanceRoot();
        
        if (isMultiInstance) {
            // Get multi-instance collection variable name
            String collectionVarName = execution.getMultiInstanceVariableName();
            
            // Get the collection
            List<Object> collection = (List<Object>) execution.getVariable(collectionVarName);
            
            // Get current loop counter (1-based)
            Integer loopCounter = execution.getLoopCounter();
            
            // Get total number of instances
            Integer totalInstances = execution.getMultiInstanceTotalInstances();
            
            // Get current element in collection
            if (collection != null && loopCounter != null) {
                Object currentElement = collection.get(loopCounter - 1);
            }
            
            // Set completion condition
            execution.setVariable("completedInstances", loopCounter);
            
            // Check if all instances completed
            boolean allCompleted = loopCounter >= totalInstances;
        }
    }
}
```

## Flow Control

### Sequence Flow Information

```java
public class FlowInfoDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get incoming sequence flow IDs
        List<String> incomingFlows = execution.getIncomingFlowIds();
        
        // Get outgoing sequence flow IDs
        List<String> outgoingFlows = execution.getOutgoingFlowIds();
        
        // Determine which path was taken
        if (incomingFlows.contains("flowFromApproval")) {
            execution.setVariable("approvedPath", true);
        }
        
        // Prepare for next gateway
        if (outgoingFlows.size() > 1) {
            // Multiple paths available - set variable to control
            execution.setVariable("decision", "optionA");
        }
        
        // Log flow information
        System.out.println("Activity: " + execution.getActivityId());
        System.out.println("Incoming flows: " + incomingFlows);
        System.out.println("Outgoing flows: " + outgoingFlows);
    }
}
```

### Error Handling

```java
public class ErrorHandlingDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Throw generic exception (triggers error boundary events)
        if (someErrorCondition) {
            throw new ActivitiException("Business rule violated");
        }
        
        // Throw BPMN error (for specific error handling)
        if (validationFailed) {
            BpmnError bpmnError = new BpmnError("VALIDATION_ERROR", "Validation failed");
            throw new ActivitiException(bpmnError);
        }
        
        // Throw error with variables
        if (externalSystemError) {
            BpmnError error = new BpmnError("EXTERNAL_ERROR");
            error.setVariable("errorCode", "EXT001");
            error.setVariable("errorMessage", "External system unavailable");
            throw new ActivitiException(error);
        }
        
        // Set error variable instead of throwing
        if (recoverableError) {
            execution.setVariable("error", errorDetails);
            execution.setVariable("canProceed", false);
            // Let process continue to error handling path
        }
    }
}
```

## Process Engine Access

### Getting Services

```java
public class ServiceAccessDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get process engine
        ProcessEngineConfiguration config = execution.getEngineServices();

        // Access engine services
        RuntimeService runtimeService = config.getRuntimeService();
        TaskService taskService = config.getTaskService();
        RepositoryService repositoryService = config.getRepositoryService();
        HistoryService historyService = config.getHistoryService();
        ManagementService managementService = processEngine.getManagementService();
        
        // Use services (generally not recommended - prefer injection)
        List<Task> tasks = taskService.createTaskQuery()
            .processInstanceId(execution.getProcessInstanceId())
            .list();
        
        // Get engine configuration
        ProcessEngineConfiguration config = processEngine.getProcessEngineConfiguration();
        
        // Get engine name
        String engineName = processEngine.getName();
    }
}
```

**Note:** It's generally better to use Spring dependency injection for services rather than accessing them through the engine.

## Advanced Operations

### Correlation Key

```java
public class CorrelationDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get correlation key (if set)
        String correlationKey = execution.getProcessInstanceBusinessKey();
        
        // Correlation keys are used for:
        // - Message correlation
        // - Process instance querying
        // - Business key tracking
        
        // Set at process start, not modifiable during execution
    }
}
```

### Activity Information

```java
public class ActivityInfoDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Current activity ID
        String activityId = execution.getActivityId();
        
        // Activity can be:
        // - Task ID (userTask, serviceTask, etc.)
        // - Gateway ID
        // - Event ID
        // - Sequence flow ID (during transition)
        // - null (at certain points)
        
        // Check activity type
        if ("userTask1".equals(activityId)) {
            // User task logic
        } else if ("gateway1".equals(activityId)) {
            // Gateway logic
        }

        // Get activity from repository (requires service access)
        ProcessEngineConfiguration config = execution.getEngineServices();
        // Activity activity = config... // Not directly available
    }
}
```

## Complete Examples

### Example 1: Comprehensive Variable Management

```java
@Component
public class VariableManagementDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // 1. Read input variables
        String orderId = execution.getVariable("orderId", String.class);
        BigDecimal amount = execution.getVariable("orderAmount", BigDecimal.class);
        List<OrderItem> items = execution.getVariable("orderItems", List.class);
        
        // 2. Validate
        if (orderId == null || amount == null) {
            throw new ActivitiException("Missing required variables");
        }
        
        // 3. Calculate derived values
        BigDecimal total = items.stream()
            .map(OrderItem::getPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 4. Set output variables (global scope)
        execution.setVariable("calculatedTotal", total);
        execution.setVariable("processingTimestamp", new Date());
        execution.setVariable("processedBy", execution.getCurrentUserId());
        
        // 5. Set temporary variables (local scope)
        execution.setVariableLocal("validationDetails", validationReport);
        execution.setVariableLocal("tempCalculation", intermediateResult);
        
        // 6. Update existing variables
        execution.setVariable("orderStatus", "PROCESSING");
        
        // 7. Remove obsolete variables
        execution.removeVariable("inputValidation");
        
        // 8. Set collection variable
        List<String> processedItemIds = items.stream()
            .map(OrderItem::getId)
            .collect(Collectors.toList());
        execution.setVariable("processedItemIds", processedItemIds);
        
        // 9. Set complex object
        OrderProcessingResult result = new OrderProcessingResult(
            orderId,
            total,
            new Date(),
            execution.getCurrentUserId()
        );
        execution.setVariable("processingResult", result);
    }
}
```

### Example 2: Multi-Instance Processing

```java
@Component
public class BatchProcessingDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        if (execution.isMultiInstanceRoot()) {
            // Get collection
            String collectionVar = execution.getMultiInstanceVariableName();
            List<Order> orders = (List<Order>) execution.getVariable(collectionVar);
            
            // Get current index
            int currentIndex = execution.getLoopCounter();
            Order currentOrder = orders.get(currentIndex - 1);
            
            // Process current order
            OrderResult result = processOrder(currentOrder);
            
            // Store result in collection
            List<OrderResult> results = 
                (List<OrderResult>) execution.getVariable("processingResults");
            
            if (results == null) {
                results = new ArrayList<>();
                execution.setVariable("processingResults", results);
            }
            
            results.add(result);
            
            // Set completion condition
            boolean allSuccess = results.stream()
                .allMatch(OrderResult::isSuccess);
            
            execution.setVariable("allOrdersSuccess", allSuccess);
            
            // Track failures
            long failureCount = results.stream()
                .filter(r -> !r.isSuccess())
                .count();
            
            execution.setVariable("failureCount", (int) failureCount);
        }
    }
    
    private OrderResult processOrder(Order order) {
        // Process individual order
        return new OrderResult(order.getId(), true);
    }
}
```

### Example 3: Subprocess Communication

```java
@Component
public class SubprocessDelegate implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // Check if in subprocess
        DelegateExecution parent = execution.getParent();
        
        if (parent != null) {
            // We're in a subprocess
            
            // Read from parent
            String parentVar = (String) parent.getVariable("parentData");
            
            // Write to parent (affects process scope)
            execution.setVariable("sharedData", "value");
            
            // Or write directly to parent
            parent.setVariable("fromSubprocess", "subprocess result");
            
            // Get root process
            DelegateExecution root = execution.getRootProcessInstance();
            
            // Set process-wide variable
            root.setVariable("processWide", "available everywhere");
        }
        
        // Navigate children (for multi-instance or embedded subprocesses)
        List<DelegateExecution> children = execution.getChildExecutions();
        
        for (DelegateExecution child : children) {
            String childActivity = child.getActivityId();
            Object childData = child.getVariable("childData");
        }
    }
}
```

## Best Practices

### 1. Use Type-Safe Access

```java
// GOOD: Type-safe
String name = execution.getVariable("name", String.class);
Integer count = execution.getVariable("count", Integer.class);

// BAD: Unsafe casting
String name = (String) execution.getVariable("name"); // ClassCastException risk
```

### 2. Check for Null

```java
// GOOD: Null check
Object value = execution.getVariable("optional");
if (value != null) {
    process(value);
}

// OR with default
String name = execution.getVariable("name", String.class, "Unknown");

// BAD: No null check
process(execution.getVariable("mightBeNull")); // NPE risk
```

### 3. Use Local Variables for Temp Data

```java
// GOOD: Local for temporary
execution.setVariableLocal("tempCalculation", result);
// Automatically cleaned up

// BAD: Global for temporary
execution.setVariable("tempCalculation", result);
// Pollutes process variables
```

### 4. Document Variable Contracts

```java
/**
 * Input variables:
 * - orderId: String (required)
 * - orderAmount: BigDecimal (required)
 * 
 * Output variables:
 * - processingResult: OrderResult
 * - allOrdersSuccess: Boolean
 * - failureCount: Integer
 */
@Component
public class DocumentedDelegate implements JavaDelegate {
    // Implementation
}
```

### 5. Avoid Direct Service Access

```java
// GOOD: Injected services
@Component
public class InjectedDelegate implements JavaDelegate {
    @Autowired
    private OrderService orderService;
    
    @Override
    public void execute(DelegateExecution execution) {
        orderService.process();
    }
}

// BAD: Service from engine
public class EngineServiceDelegate implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        RuntimeService rs = execution.getEngineServices().getRuntimeService();
        // Harder to test, couples to engine
    }
}
```

## Common Pitfalls

### 1. Variable Scope Confusion

```java
// Problem: Setting local variable but reading global
execution.setVariableLocal("data", "local");
Object value = execution.getVariable("data"); // null!

// Solution: Use matching methods
execution.setVariableLocal("data", "local");
Object value = execution.getVariableLocal("data"); // "local"
```

### 2. Modifying Collections

```java
// Problem: Modifying shared collection
List<String> items = (List<String>) execution.getVariable("items");
items.add("new"); // Affects all references

// Solution: Create new collection
List<String> items = new ArrayList<>();
items.addAll((List) execution.getVariable("items"));
items.add("new");
execution.setVariable("items", items);
```

### 3. Assuming Activity ID

```java
// Problem: Activity ID can be null
String activityId = execution.getActivityId();
process(activityId); // NPE possible

// Solution: Check for null
String activityId = execution.getActivityId();
if (activityId != null) {
    process(activityId);
}
```

## API Reference Summary

| Method | Purpose | Scope |
|--------|---------|-------|
| `getVariable(String)` | Get variable value | Global |
| `setVariable(String, Object)` | Set variable value | Global |
| `getVariableLocal(String)` | Get local variable | Activity |
| `setVariableLocal(String, Object)` | Set local variable | Activity |
| `hasVariable(String)` | Check variable exists | Global |
| `getVariableNames()` | Get all variable names | Global |
| `getVariables()` | Get all variables | Global |
| `removeVariable(String)` | Remove variable | Global |
| `getId()` | Get execution ID | - |
| `getProcessInstanceId()` | Get process instance ID | - |
| `getProcessDefinitionId()` | Get process definition ID | - |
| `getActivityId()` | Get current activity ID | - |
| `getProcessInstance()` | Get process instance | - |
| `getEngineServices()` | Get process engine configuration | - |
| `getParent()` | Get parent execution | - |
| `getChildExecutions()` | Get child executions | - |
| `isMultiInstanceRoot()` | Check multi-instance | - |
| `getLoopCounter()` | Get loop counter | Multi-instance |

## Related Documentation

- [JavaDelegate](./java-delegate.md) - Using DelegateExecution in delegates
- [DelegateTask API](./delegate-task-api.md) - Task-specific API
- [Execution Listeners](./execution-listeners.md) - Another use case
- [Variables](./variables.md) - Variable scope and lifecycle

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated:** 2026  
**Source:** `DelegateExecution.java`
