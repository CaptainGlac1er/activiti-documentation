---
sidebar_label: Business Rule Task
slug: /bpmn/elements/business-rule-task
title: "Business Rule Task"
description: "Complete guide to BusinessRuleTask elements for executing business rules with custom implementations and external rules engines."
---

# Business Rule Task

Business Rule Tasks provide a **BPMN 2.0 standard element** for executing business rules. However, Activiti does **not include a native rules engine**. Instead, it provides a framework for integrating external rules engines like Drools, DMN, or custom rule implementations.

## Overview

```xml
<businessRuleTask id="ruleTask" 
                  name="Evaluate Rules"
                  activiti:class="com.example.CustomRuleEngine"
                  activiti:resultVariable="decisionResult"/>
```

**BPMN 2.0 Standard:** Fully Supported  
**Native Rules Engine:** Not included (requires custom implementation)  
**Integration Pattern:** Implement `BusinessRuleTaskDelegate` interface

## Important: No Built-in Rules Engine

Activiti 8 does **not** include:
- ❌ Native Drools integration
- ❌ Native DMN engine
- ❌ Built-in rule execution logic

Instead, you must:
- ✅ Provide a custom Java class implementing `BusinessRuleTaskDelegate`
- ✅ Integrate with external rules engines (Drools, jDMN, etc.) in your implementation
- ✅ Use Service Tasks with Connectors as an alternative approach

## Architecture

### The BusinessRuleTaskDelegate Interface

```java
package org.activiti.engine.delegate;

public interface BusinessRuleTaskDelegate extends ActivityBehavior {
    void addRuleVariableInputIdExpression(Expression inputId);
    void addRuleIdExpression(Expression inputId);
    void setExclude(boolean exclude);
    void setResultVariable(String resultVariableName);
}
```

### How It Works

1. **BPMN Parser** reads the `businessRuleTask` element
2. **Factory Method** (`DefaultActivityBehaviorFactory.createBusinessRuleTaskActivityBehavior()`) instantiates your custom class
3. **Configuration** passes input variables, rule names, and result variable to your delegate
4. **Execution** your `execute()` method runs the rules logic
5. **Output** result is stored in the specified process variable

**Critical:** If no `activiti:class` is specified, the factory throws a `NullPointerException` — there is **no default behavior**. Always specify a class.

**Note:** If no `activiti:resultVariable` is specified, the factory defaults to `"org.activiti.engine.rules.OUTPUT"`.

**Note:** `activiti:class` instantiates the class via `Class.forName()` reflection — it does **not** look up a Spring bean. This means `@Autowired` and other Spring annotations will **not** work. For Spring integration, use a Service Task with `implementation="beanName"` instead.

## Implementation Patterns

### Pattern 1: Custom BusinessRuleTaskDelegate (Recommended for Rules)

This is the standard approach for Business Rule Tasks.

#### Step 1: Create Your Rule Engine Implementation

```java
import org.activiti.engine.delegate.BusinessRuleTaskDelegate;
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.impl.delegate.Expression;

import java.util.List;

public class CustomBusinessRuleTask implements BusinessRuleTaskDelegate {
    
    private List<Expression> ruleVariableInputExpressions;
    private List<Expression> ruleIdExpressions;
    private boolean exclude;
    private String resultVariable;
    
    // Setter methods called by Activiti factory
    @Override
    public void addRuleVariableInputIdExpression(Expression inputId) {
        if (ruleVariableInputExpressions == null) {
            ruleVariableInputExpressions = new ArrayList<>();
        }
        ruleVariableInputExpressions.add(inputId);
    }
    
    @Override
    public void addRuleIdExpression(Expression inputId) {
        if (ruleIdExpressions == null) {
            ruleIdExpressions = new ArrayList<>();
        }
        ruleIdExpressions.add(inputId);
    }
    
    @Override
    public void setExclude(boolean exclude) {
        this.exclude = exclude;
    }
    
    @Override
    public void setResultVariable(String resultVariableName) {
        this.resultVariable = resultVariableName;
    }
    
    // Core execution logic
    @Override
    public void execute(DelegateExecution execution) {
        // Get input variables from process
        Object inputObject = execution.getVariable("order");
        
        // Execute your rules logic here
        // This is where you integrate with Drools, DMN, or custom rules
        RulesResult result = evaluateRules(inputObject);
        
        // Store result in process variable
        execution.setVariable(resultVariable, result);
    }
    
    private RulesResult evaluateRules(Object input) {
        // Implement your rules engine integration here
        // Example: Call Drools, jDMN, or custom logic
        return new RulesResult();
    }
}
```

#### Step 2: Configure in BPMN

```xml
<businessRuleTask id="ruleTask" 
                  name="Evaluate Order Rules"
                  activiti:class="com.example.CustomBusinessRuleTask"
                  activiti:ruleVariablesInput="order" 
                  activiti:rules="rule1,rule2" 
                  activiti:resultVariable="rulesOutput" 
                  activiti:exclude="false"/>
```

**Attributes:**
- `activiti:class` - **Required**: Fully qualified class name implementing `BusinessRuleTaskDelegate`
- `activiti:ruleVariablesInput` - Input process variable(s) passed to rules
- `activiti:rules` - Optional: Comma-separated list of rule names/IDs
- `activiti:resultVariable` - Process variable to store output
- `activiti:exclude` - Optional: Exclude flag for rule processing

### Pattern 2: Drools Integration

Integrate Drools rules engine with Business Rule Task.

#### Step 1: Add Drools Dependencies

```xml
<dependency>
    <groupId>org.kie</groupId>
    <artifactId>kie-ci</artifactId>
    <version>8.53.0.Final</version>
</dependency>
<dependency>
    <groupId>org.drools</groupId>
    <artifactId>drools-decision-support</artifactId>
    <version>8.53.0.Final</version>
</dependency>
```

#### Step 2: Create Drools Rule Implementation

```java
import org.activiti.engine.delegate.BusinessRuleTaskDelegate;
import org.activiti.engine.delegate.DelegateExecution;
import org.kie.api.KieServices;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;

public class DroolsBusinessRuleTask implements BusinessRuleTaskDelegate {
    
    private String resultVariable;
    private String inputVariable;
    
    @Override
    public void addRuleVariableInputIdExpression(Expression inputId) {
        // Evaluate expression to get input variable name
        this.inputVariable = inputId.getExpression();
    }
    
    @Override
    public void addRuleIdExpression(Expression inputId) {
        // Handle rule IDs if needed
    }
    
    @Override
    public void setExclude(boolean exclude) {
        // Handle exclude flag
    }
    
    @Override
    public void setResultVariable(String resultVariableName) {
        this.resultVariable = resultVariableName;
    }
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get input object from process variables
        Order order = (Order) execution.getVariable(inputVariable);
        
        // Initialize Drools
        KieServices kieServices = KieServices.Factory.get();
        KieContainer kieContainer = kieServices.getKieClassloader()
            .getKieContainer("drools-rules:1.0.0");
        KieSession kieSession = kieContainer.newKieSession();
        
        // Insert facts and fire rules
        kieSession.insert(order);
        kieSession.fireAllRules();
        kieSession.dispose();
        
        // Store result
        execution.setVariable(resultVariable, order);
    }
}
```

#### Step 3: Create Drools Rules File (DRL)

```drools
package com.example.rules

import com.example.Order

rule "OrderItemCountZeroOrLess"
    when
        $order : Order( itemCount <= 0)
    then
        $order.setValid(false);
        $order.setReason("Item count must be greater than zero");
end

rule "OrderItemCountGreaterThanZero"
    when
        $order : Order( itemCount > 0)
    then
        $order.setValid(true);
        $order.setReason("Order is valid");
end

rule "HighValueOrder"
    when
        $order : Order( totalAmount > 1000 )
    then
        $order.setPriority("HIGH");
        $order.setDiscount(0.10);
end
```

#### Step 4: Configure in BPMN

```xml
<businessRuleTask id="droolsRuleTask" 
                  name="Evaluate with Drools"
                  activiti:class="com.example.DroolsBusinessRuleTask"
                  activiti:ruleVariablesInput="order" 
                  activiti:rules="OrderItemCountZeroOrLess,OrderItemCountGreaterThanZero,HighValueOrder"
                  activiti:resultVariable="validatedOrder"/>
```

### Pattern 3: DMN Integration via Service Task (Alternative)

Since Activiti doesn't have native DMN support in Business Rule Tasks, use Service Tasks with DMN engines.

#### Using jDMN or Drools DMN

```java
import org.activiti.api.process.runtime.connector.Connector;
import org.activiti.api.process.model.IntegrationContext;
import org.springframework.stereotype.Component;

@Component("dmnDecisionConnector")
public class DmnDecisionConnector implements Connector {
    
    @Autowired
    private DmnEngine dmnEngine; // Your DMN engine implementation
    
    @Override
    public IntegrationContext apply(IntegrationContext context) {
        // Get input variables
        Object input = context.getInBoundVariables().get("inputData");

        // Evaluate DMN decision
        Object result = dmnEngine.evaluateDecision("creditDecision", input);

        // Return output
        context.addOutBoundVariable("decisionResult", result);
        return context;
    }
}
```

**BPMN Configuration (using Service Task):**

```xml
<serviceTask id="dmnDecision" 
             name="Credit Decision"
             implementation="dmnDecisionConnector"/>
```

**Why Service Task instead of Business Rule Task?**
- More flexible integration pattern
- Works with modern Connector API
- Better Spring integration
- Recommended for DMN in Activiti 8

### Pattern 4: Simple Custom Rules (No External Engine)

For simple business logic without external rules engines:

```java
import org.activiti.engine.delegate.BusinessRuleTaskDelegate;
import org.activiti.engine.delegate.DelegateExecution;

public class SimpleBusinessRuleTask implements BusinessRuleTaskDelegate {
    
    private String resultVariable;
    private String inputVariable;
    
    @Override
    public void addRuleVariableInputIdExpression(Expression inputId) {
        this.inputVariable = inputId.getExpression();
    }
    
    @Override
    public void addRuleIdExpression(Expression inputId) {
        // Not used for simple rules
    }
    
    @Override
    public void setExclude(boolean exclude) {
        // Not used for simple rules
    }
    
    @Override
    public void setResultVariable(String resultVariableName) {
        this.resultVariable = resultVariableName;
    }
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get input
        Order order = (Order) execution.getVariable(inputVariable);
        
        // Simple business rules (could be replaced with external engine)
        boolean isValid = order.getItemCount() > 0 && order.getTotalAmount() > 0;
        String priority = order.getTotalAmount() > 1000 ? "HIGH" : "NORMAL";
        
        // Create result
        RulesResult result = new RulesResult();
        result.setValid(isValid);
        result.setPriority(priority);
        result.setTimestamp(new Date());
        
        // Store result
        execution.setVariable(resultVariable, result);
    }
}
```

## Complete Example: Order Validation Process

### BPMN Process

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions id="definitions"
  xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:activiti="http://activiti.org/bpmn"
  targetNamespace="Examples">

  <process id="orderValidationProcess">

    <startEvent id="start"/>
    
    <sequenceFlow id="flow1" sourceRef="start" targetRef="ruleTask"/>
    
    <businessRuleTask id="ruleTask" 
                      name="Validate Order"
                      activiti:class="com.example.OrderValidationRuleTask"
                      activiti:ruleVariablesInput="order" 
                      activiti:rules="validationRules"
                      activiti:resultVariable="validationResult"/>
    
    <sequenceFlow id="flow2" sourceRef="ruleTask" targetRef="decisionGateway"/>
    
    <exclusiveGateway id="decisionGateway" name="Valid?"/>
    
    <sequenceFlow id="flow3" sourceRef="decisionGateway" targetRef="approveOrder">
      <conditionExpression>${validationResult.valid}</conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="flow4" sourceRef="decisionGateway" targetRef="rejectOrder">
      <conditionExpression>${!validationResult.valid}</conditionExpression>
    </sequenceFlow>
    
    <userTask id="approveOrder" name="Approve Order"/>
    <userTask id="rejectOrder" name="Reject Order"/>
    
    <sequenceFlow id="flow5" sourceRef="approveOrder" targetRef="end"/>
    <sequenceFlow id="flow6" sourceRef="rejectOrder" targetRef="end"/>
    
    <endEvent id="end"/>

  </process>

</definitions>
```

### Java Implementation

```java
import org.activiti.engine.delegate.BusinessRuleTaskDelegate;
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.impl.delegate.Expression;

import java.util.Date;

public class OrderValidationRuleTask implements BusinessRuleTaskDelegate {
    
    private String inputVariable;
    private String resultVariable;
    
    @Override
    public void addRuleVariableInputIdExpression(Expression inputId) {
        this.inputVariable = inputId.getExpression();
    }
    
    @Override
    public void addRuleIdExpression(Expression inputId) {
        // Rule IDs can be stored for logging/auditing
    }
    
    @Override
    public void setExclude(boolean exclude) {
        // Handle exclude flag
    }
    
    @Override
    public void setResultVariable(String resultVariableName) {
        this.resultVariable = resultVariableName;
    }
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get order from process variables
        Order order = (Order) execution.getVariable(inputVariable);
        
        // Execute validation rules
        ValidationResult result = validateOrder(order);
        
        // Store result
        execution.setVariable(resultVariable, result);
    }
    
    private ValidationResult validateOrder(Order order) {
        ValidationResult result = new ValidationResult();
        
        // Rule 1: Item count must be positive
        result.setItemCountValid(order.getItemCount() > 0);
        
        // Rule 2: Total amount must be positive
        result.setAmountValid(order.getTotalAmount() > 0);
        
        // Rule 3: Customer must exist
        result.setCustomerValid(order.getCustomerId() != null);
        
        // Overall validation
        result.setValid(result.getItemCountValid() && 
                       result.getAmountValid() && 
                       result.getCustomerValid());
        
        result.setTimestamp(new Date());
        
        return result;
    }
}

// Supporting classes
class Order {
    private String customerId;
    private int itemCount;
    private double totalAmount;
    // getters/setters
}

class ValidationResult {
    private boolean valid;
    private boolean itemCountValid;
    private boolean amountValid;
    private boolean customerValid;
    private Date timestamp;
    // getters/setters
}
```

## Advanced Features

### Async Execution

Run rule evaluation in the background:

```xml
<businessRuleTask id="asyncRuleTask" 
                  name="Complex Rules"
                  activiti:class="com.example.AsyncRuleTask"
                  activiti:async="true"
                  activiti:resultVariable="rulesOutput"/>
```

**Note:** Your implementation must be thread-safe when using async execution.

### Skip Expression

Conditionally skip rule evaluation:

```xml
<businessRuleTask id="optionalRules" 
                  name="Optional Validation"
                  activiti:class="com.example.OptionalRuleTask"
                  activiti:skipExpression="${!validateOrder}"
                  activiti:resultVariable="validationResult"/>
```

### Execution Listeners

Add monitoring and logging:

```xml
<businessRuleTask id="trackedRules" 
                  name="Tracked Rules">
  
  <extensionElements>
    <activiti:executionListener event="start" class="com.example.RuleStartListener"/>
    <activiti:executionListener event="end" class="com.example.RuleEndListener"/>
  </extensionElements>
</businessRuleTask>
```

### Error Handling

Add boundary events for rule execution failures:

```xml
<businessRuleTask id="ruleTask" 
                  name="Evaluate Rules"
                  activiti:class="com.example.RuleTask"
                  activiti:async="true"/>

<!-- Error boundary event -->
<boundaryEvent id="ruleError" attachedToRef="ruleTask" cancelActivity="true">
  <errorEventDefinition errorRef="RuleExecutionError"/>
</boundaryEvent>

<!-- Timeout boundary event -->
<boundaryEvent id="ruleTimeout" attachedToRef="ruleTask" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT30S</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

## Best Practices

1. **Always Specify `activiti:class`**: No default behavior exists without it
2. **Implement `BusinessRuleTaskDelegate`**: Required interface for custom rules
3. **Use Service Tasks for DMN**: More flexible than Business Rule Tasks
4. **Thread Safety**: Ensure implementations are thread-safe for async execution
5. **Error Handling**: Add boundary events for rule execution failures
6. **Result Variables**: Always store outputs for audit and downstream use
7. **External Engines**: Integrate Drools/DMN in your custom implementation
8. **Testing**: Unit test rule logic separately from process flow
9. **Logging**: Add execution listeners for monitoring
10. **Versioning**: Track rule changes separately from process changes

## Common Pitfalls

- **Missing `activiti:class`**: Throws `NullPointerException` — no default behavior exists
- **Assuming Native DMN Support**: Does not exist - use Service Tasks instead
- **Not Implementing Delegate Interface**: Must implement `BusinessRuleTaskDelegate`
- **Thread Safety Issues**: Async execution requires thread-safe implementations
- **Complex Logic in BPMN**: Keep rules in external engines, not BPMN
- **No Error Handling**: Rule execution failures can break processes

## Comparison: Business Rule Task vs Service Task

| Feature | Business Rule Task | Service Task |
|---------|-------------------|--------------|
| **Interface** | `BusinessRuleTaskDelegate` | `Connector` or `JavaDelegate` |
| **BPMN Standard** | Yes (semantic meaning) | Yes (generic) |
| **Native Rules Engine** | No | No |
| **Drools Integration** | Custom implementation | Custom implementation |
| **DMN Integration** | Not recommended | Recommended |
| **Spring Integration** | Via custom class | Via `@Component` |
| **Use Case** | Business rules semantics | General automation |
| **Complexity** | Higher (delegate interface) | Lower (simple interface) |

**Recommendation:**
- Use **Business Rule Task** when you want BPMN semantics for rules
- Use **Service Task** for DMN or simpler integration patterns

## Related Documentation

- [Service Task](./service-task.md) - Alternative for rules integration
- [Connectors](../integration/connectors.md) - Modern integration pattern
- [BPMN Elements](../index.md) - Complete element reference

---

