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
    String getRootProcessInstanceId();
    String getProcessDefinitionId();
    String getCurrentActivityId();
    String getTenantId();

    // Flow element access
    FlowElement getCurrentFlowElement();

    // Execution hierarchy
    DelegateExecution getParent();
    List<? extends DelegateExecution> getExecutions();

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
        
        // Current activity ID
        String activityId = execution.getCurrentActivityId();

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

        // Get all variable names
        Set<String> variableNames = execution.getVariableNames();

        // Get all variables
        Map<String, Object> allVariables = execution.getVariables();

        // Remove variable
        execution.removeVariable("obsolete");
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
    }
}
```

## Process Instance Access

### Process Instance Identification

DelegateExecution provides process instance identification directly. For full process instance details (name, start date, version), query via the RuntimeService:

```java
public class ProcessInstanceDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        // Process instance ID (always available)
        String processInstanceId = execution.getProcessInstanceId();

        // Root process instance ID (for sub-processes)
        String rootProcessInstanceId = execution.getRootProcessInstanceId();

        // Check if this is the root execution
        boolean isRoot = execution.isRootExecution();

        // For full process instance details, use RuntimeService
        ProcessEngineConfiguration config = execution.getEngineServices();
        ProcessInstance processInstance = config.getRuntimeService()
            .createProcessInstanceQuery()
            .processInstanceId(processInstanceId)
            .singleResult();
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
        List<? extends DelegateExecution> children = execution.getExecutions();

        for (DelegateExecution child : children) {
            String childActivityId = child.getCurrentActivityId();
            Object childVar = child.getVariable("childVar");
        }

        // Navigate to root by walking parent chain
        DelegateExecution current = execution;
        while (current.getParent() != null) {
            current = current.getParent();
        }
        // current is now the root execution
        current.setVariable("processWideVar", "value");
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
            // The collection variable name is defined in the BPMN model
            // (e.g., <activiti:collectionElements="orderCollection"/>)
            // You must know the variable name from your process definition.
            List<Object> collection = (List<Object>) execution.getVariable("orderCollection");

            // Multi-instance loop data variables are set as process variables
            // by the engine. Access them by their configured variable names.
            // There is no getLoopCounter() on DelegateExecution — the engine
            // sets the loop variable for each iteration.
            Object loopElement = execution.getVariable("orderItem");

            // Set completion condition variable
            // (defined in <completionCondition>${nrOfCompletedInstances >= nrOfInstances}</completionCondition>)
            execution.setVariable("completedInstances", 1);
        }
    }
}
```

## Flow Control

### Current Activity Information

```java
public class FlowInfoDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        // Current activity ID
        String activityId = execution.getCurrentActivityId();

        // Current flow element (the BPMN element the execution is currently on)
        FlowElement flowElement = execution.getCurrentFlowElement();

        // Determine path taken — set variables for the next gateway to evaluate
        if ("userTask1".equals(activityId)) {
            execution.setVariable("decision", "optionA");
        } else if ("userTask2".equals(activityId)) {
            execution.setVariable("decision", "optionB");
        }

        // Log flow information
        System.out.println("Activity: " + activityId);
        System.out.println("Flow element: " + flowElement);
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
        // BpmnError extends ActivitiException — throw it directly, do NOT wrap it
        if (validationFailed) {
            throw new BpmnError("VALIDATION_ERROR", "Validation failed");
        }

        // Set error variables instead of throwing
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
        String activityId = execution.getCurrentActivityId();
        
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
            new Date()
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
            // Get collection — use the variable name from your BPMN definition
            List<Order> orders = (List<Order>) execution.getVariable("orderCollection");

            // Current element variable — set by engine from BPMN collection config
            Order currentOrder = (Order) execution.getVariable("orderItem");
            
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
            
            // Navigate to root by walking the parent chain
            DelegateExecution root = execution;
            while (root.getParent() != null) {
                root = root.getParent();
            }

            // Set process-wide variable
            root.setVariable("processWide", "available everywhere");
        }

        // Navigate children (for multi-instance or embedded subprocesses)
        List<? extends DelegateExecution> children = execution.getExecutions();

        for (DelegateExecution child : children) {
            String childActivity = child.getCurrentActivityId();
            Object childData = child.getVariable("childData");
        }
    }
}
```

## Best Practices

### 1. Use Type-Safe Access

```java
// GOOD: Type-safe (via VariableScope)
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

// OR with hasVariable check
String name = null;
if (execution.hasVariable("name")) {
    name = execution.getVariable("name", String.class);
} else {
    name = "Unknown";
}

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
String activityId = execution.getCurrentActivityId();
process(activityId); // NPE possible

// Solution: Check for null
String activityId = execution.getCurrentActivityId();
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
| `getRootProcessInstanceId()` | Get root process instance ID | - |
| `getProcessDefinitionId()` | Get process definition ID | - |
| `getCurrentActivityId()` | Get current activity ID | - |
| `getCurrentFlowElement()` | Get current BPMN flow element | - |
| `getEngineServices()` | Get process engine configuration | - |
| `getParent()` | Get parent execution | - |
| `getExecutions()` | Get child executions | - |
| `isMultiInstanceRoot()` | Check multi-instance | - |
| `isRootExecution()` | Check if root execution | - |
| `isActive()` | Check if execution is active | - |
| `isEnded()` | Check if execution has ended | - |
| `getTenantId()` | Get tenant ID | - |
| `getEventName()` | Get event name | - |

## Related Documentation

- [JavaDelegate](./java-delegate.md) - Using DelegateExecution in delegates
- [DelegateTask API](./delegate-task-api.md) - Task-specific API
- [Execution Listeners](./execution-listeners.md) - Another use case
- [Variables](./variables.md) - Variable scope and lifecycle

---

**Source:** `DelegateExecution.java`
