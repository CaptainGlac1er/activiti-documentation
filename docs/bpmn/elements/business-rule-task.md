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

**Critical:** If no `activiti:class` is specified and input variables or rules are configured, the factory may throw a `NullPointerException` — there is **no default behavior** for Business Rule Tasks. Always specify a class when using rule-related attributes.

**Note:** If no `activiti:resultVariable` is specified, the factory defaults to `"org.activiti.engine.rules.OUTPUT"`.

**Note:** `activiti:class` instantiates the class via `Class.forName()` reflection — it does **not** look up a Spring bean. This means `@Autowired` and other Spring annotations will **not** work. For Spring integration, use a Service Task with `implementation="beanName"` instead.

## Implementation Patterns

### Pattern 1: Custom BusinessRuleTaskDelegate (Recommended for Rules)

This is the standard approach for Business Rule Tasks.

#### Step 1: Create Your Rule Engine Implementation

```java
import org.activiti.engine.delegate.BusinessRuleTaskDelegate;
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.Expression;

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

### Pattern 3: DMN Decision Integration via Service Task (Recommended)

Activiti does **not include a native DMN engine**. For DMN (Decision Model and Notation) decisions, the recommended approach is a `ServiceTask` with `activiti:type="dmn"` paired with an external DMN engine connected via the Connector API.

#### DMN Service Task Subtype

DMN tasks in Activiti are implemented as `ServiceTask` elements with `type` set to `ServiceTask.DMN_TASK` (constant value `"dmn"`).

```xml
<serviceTask id="creditDecision"
             name="Evaluate Credit Decision"
             activiti:type="dmn">
  <extensionElements>
    <activiti:field name="decisionTableReferenceKey"
                    stringValue="creditScoringTable_v1"/>
  </extensionElements>
</serviceTask>
```

A valid DMN Service Task must:
1. Have `activiti:type="dmn"` on the `<serviceTask>` element
2. Contain a field extension named `decisionTableReferenceKey`
3. Have a non-null, non-empty value for `decisionTableReferenceKey`

```xml
<!-- VALID -->
<serviceTask id="dmnTask" activiti:type="dmn">
  <extensionElements>
    <activiti:field name="decisionTableReferenceKey" stringValue="myDecisionTable"/>
  </extensionElements>
</serviceTask>

<!-- INVALID: missing decisionTableReferenceKey -->
<serviceTask id="dmnTask" activiti:type="dmn"/>

<!-- INVALID: empty decisionTableReferenceKey -->
<serviceTask id="dmnTask" activiti:type="dmn">
  <extensionElements>
    <activiti:field name="decisionTableReferenceKey" stringValue=""/>
  </extensionElements>
</serviceTask>
```

**Validation:** The `ExternalInvocationTaskValidator` enforces the above rules. Missing or empty `decisionTableReferenceKey` produces error `DMN_TASK_NO_KEY`: _"No decision table reference key is defined on the dmn activity"_.

#### Why Service Task Instead of Business Rule Task for DMN?

| Criterion | Business Rule Task | DMN Service Task + Connector |
|-----------|-------------------|------------------------------|
| **Interface** | `BusinessRuleTaskDelegate` (reflection-based) | `Connector` (Spring `@Component`) |
| **Spring DI** | No — `Class.forName()` instantiation | Yes — full `@Autowired` support |
| **Modeler Support** | Business Rule Task stencil | Decision Task stencil |
| **Runtime Switching** | No | Yes — `DynamicBpmnService` |
| **Variable Mapping** | Manual in delegate | Via extension JSON or `IntegrationContext` |
| **DMN Semantics** | Rule-centric | Decision-table-centric |

**Recommendation:** Use **Service Task with Connector** for DMN integration. Use **Business Rule Task** when you want BPMN rule semantics with simple rule logic.

#### Connector-Based DMN Integration

The Connector API is the recommended approach for DMN — it provides full Spring integration, type safety, and engine agnosticism.

##### Drools DMN Connector

```xml
<dependency>
    <groupId>org.drools</groupId>
    <artifactId>drools-decision-model</artifactId>
    <version>8.53.0.Final</version>
</dependency>
```

```java
@Component("droolsDmnConnector")
public class DroolsDmnConnector implements Connector {

    @Autowired
    private KieContainer kieContainer;

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        String decisionKey = context.getInBoundVariable("decisionTableReferenceKey");

        KieSession ksession = kieContainer.newKieSession();
        DMNRuntime dmnRuntime = ksession.getKieRuntime(DMNRuntime.class);

        DecisionResult result = dmnRuntime.evaluateDecisionTable(
            decisionKey, context.getInBoundVariables());

        ksession.dispose();

        context.addOutBoundVariable("decisionResult", result.getResult());
        return context;
    }
}
```

**Note:** The `decisionTableReferenceKey` value is **not** automatically injected from the service task's `<activiti:field>` extension into the connector's `IntegrationContext`. For a connector to receive `decisionTableReferenceKey`, it must be provided via **extension JSON variable mappings** (as shown in the "Extension JSON Variable Mapping for DMN" section below) or explicitly set as a process variable before reaching the service task. The `activiti:field` extension is used for validation and modeler JSON conversion only — it is not available at runtime to the connector.

##### REST-Based Decision Service Connector

For microservice architectures where DMN decisions are served by a dedicated decision service:

```java
@Component("httpDmnConnector")
public class HttpDmnConnector implements Connector {

    @Autowired
    private WebClient webClient;

    @Value("${dmn.service.url:http://decision-service:8080/api/v1/evaluate}")
    private String dmnServiceUrl;

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        String decisionKey = context.getInBoundVariable("decisionTableReferenceKey");

        DecisionRequest request = new DecisionRequest(decisionKey, context.getInBoundVariables());

        DecisionResponse response = webClient.post()
            .uri(dmnServiceUrl)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(DecisionResponse.class)
            .block();

        context.addOutBoundVariable("decisionResult", response.getResult());
        context.addOutBoundVariable("decisionAuditId", response.getAuditId());
        return context;
    }
}
```

##### jDMN Connector

```java
@Component("jdmnConnector")
public class JdmnConnector implements Connector {

    private final DMNEngine dmnEngine;

    public JdmnConnector() {
        this.dmnEngine = DMNEngineFactory.create();
    }

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        String decisionKey = context.getInBoundVariable("decisionTableReferenceKey");

        DMNModel model = dmnEngine.parse(
            getClass().getClassLoader().getResourceAsStream("decisions/" + decisionKey + ".dmn"));

        DMNResult result = dmnEngine.evaluate(model, context.getInBoundVariables());

        context.addOutBoundVariable("decisionResult", result.getSingleDecisionResult(decisionKey));
        return context;
    }
}
```

#### Extension JSON Variable Mapping for DMN

```json
{
  "id": "creditApprovalProcess",
  "extensions": {
    "Process_creditApprovalProcess": {
      "mappings": {
        "creditDecision": {
          "inputs": {
            "decisionTableReferenceKey": {
              "type": "VALUE",
              "value": "creditScoringTable_v2"
            },
            "annualIncome": {
              "type": "VARIABLE",
              "value": "applicantIncome"
            },
            "creditHistory": {
              "type": "VARIABLE",
              "value": "applicantCreditHistory"
            }
          },
          "outputs": {
            "decisionResult": {
              "type": "VARIABLE",
              "value": "creditDecisionResult"
            }
          }
        }
      }
    }
  }
}
```

#### Modeler Decision Task Stencil

The Activiti Modeler provides a **Decision Task** stencil (`STENCIL_TASK_DECISION = "DecisionTask"`) that creates a Service Task with `type="dmn"` and a decision table reference property.

The `DecisionTaskJsonConverter` handles bidirectional conversion:
- **JSON to BPMN:** Creates `ServiceTask` with `type="dmn"` and `decisionTableReferenceKey` field extension
- **BPMN to JSON:** Detects `type="dmn"`, extracts `decisionTableReferenceKey`, reconstructs the decision table reference node with `id`, `name`, and `key`

#### DynamicBpmnService: Runtime Decision Table Switching

The `DynamicBpmnService` allows changing the decision table reference key for a DMN task **without redeploying the process**.

```java
public interface DynamicBpmnService {
    ObjectNode getProcessDefinitionInfo(String processDefinitionId);
    void saveProcessDefinitionInfo(String processDefinitionId, ObjectNode infoNode);
    ObjectNode changeDmnTaskDecisionTableKey(String id, String decisionTableKey);
    void changeDmnTaskDecisionTableKey(String id, String decisionTableKey, ObjectNode infoNode);
}
```

**Example — Switching decision table versions at runtime:**

```java
@Service
public class DecisionTableManager {

    @Autowired
    private DynamicBpmnService dynamicBpmnService;

    public void switchDecisionTableVersion(String processDefinitionId,
                                            String taskElementId,
                                            String newVersionKey) {
        ObjectNode infoNode = dynamicBpmnService
            .getProcessDefinitionInfo(processDefinitionId);

        dynamicBpmnService.changeDmnTaskDecisionTableKey(
            taskElementId, newVersionKey, infoNode);

        dynamicBpmnService.saveProcessDefinitionInfo(
            processDefinitionId, infoNode);
    }
}
```

**Use cases:**
- **A/B Testing:** Route different process instances to different decision table versions
- **Decision Table Updates:** Deploy new decision logic without redeploying BPMN
- **Environment-Specific Configurations:** Switch between staging and production decision tables
- **Rollback:** Quickly revert to a previous decision table version

The override is stored in the `ACT_PROCDEF_INFO` table as JSON:

```json
{
  "bpmn": {
    "creditDecision": {
      "dmnTaskDecisionTableKey": "creditScoringTable_v3"
    }
  }
}
```

#### Connector-Based Loan Decision Example

The following example uses a connector (`implementation="droolsDmnConnector"`) rather than the native `activiti:type="dmn"` Service Task pattern. This approach gives you full control over the connector implementation, async behavior, and error handling.

**Note:** Because this service task uses `implementation="droolsDmnConnector"` instead of `activiti:type="dmn"`, the `decisionTableReferenceKey` must be provided to the connector via extension JSON mappings or by setting it as a process variable — the `activiti:field` extension approach does not apply to connector-based tasks.

```xml
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:activiti="http://activiti.org/bpmn"
             targetNamespace="Examples">

  <process id="loanApplicationProcess" name="Loan Application">

    <startEvent id="start"/>
    <sequenceFlow id="f1" sourceRef="start" targetRef="loanDecision"/>

    <serviceTask id="loanDecision"
                 name="Loan Eligibility Decision"
                 implementation="droolsDmnConnector"
                 activiti:async="true">
      <extensionElements>
        <activiti:failedJobRetryTimeCycle>R3/PT1M</activiti:failedJobRetryTimeCycle>
      </extensionElements>
    </serviceTask>

    <boundaryEvent id="dmnError" attachedToRef="loanDecision" cancelActivity="true">
      <errorEventDefinition errorRef="DmnEvaluationError"/>
    </boundaryEvent>

    <sequenceFlow id="f2" sourceRef="loanDecision" targetRef="decisionGateway"/>
    <sequenceFlow id="f3" sourceRef="dmnError" targetRef="manualReview"/>

    <exclusiveGateway id="decisionGateway" name="Loan Decision"/>
    <sequenceFlow id="f4" sourceRef="decisionGateway" targetRef="approveLoan">
      <conditionExpression>${loanDecisionResult == 'APPROVED'}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="f5" sourceRef="decisionGateway" targetRef="rejectLoan">
      <conditionExpression>${loanDecisionResult == 'REJECTED'}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="f6" sourceRef="decisionGateway" targetRef="manualReview">
      <conditionExpression>${loanDecisionResult == 'MANUAL_REVIEW'}</conditionExpression>
    </sequenceFlow>

    <userTask id="approveLoan" name="Approve and Disburse"/>
    <userTask id="rejectLoan" name="Reject Application"/>
    <userTask id="manualReview" name="Manual Review Required"/>

    <sequenceFlow id="f7" sourceRef="approveLoan" targetRef="end"/>
    <sequenceFlow id="f8" sourceRef="rejectLoan" targetRef="end"/>
    <sequenceFlow id="f9" sourceRef="manualReview" targetRef="end"/>
    <endEvent id="end"/>

  </process>
</definitions>
```

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
import org.activiti.engine.delegate.Expression;

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
3. **Thread Safety**: Ensure implementations are thread-safe for async execution
4. **Error Handling**: Add boundary events for rule execution failures
5. **Result Variables**: Always store outputs for audit and downstream use
6. **External Engines**: Integrate Drools/DMN in your custom implementation
7. **Testing**: Unit test rule logic separately from process flow
8. **Logging**: Add execution listeners for monitoring
9. **Versioning**: Track rule changes separately from process changes
10. **DMN Decisions**: Use Service Task + Connector for DMN (see Pattern 3 above)

## Common Pitfalls

- **Missing `activiti:class`**: Throws `NullPointerException` if input variables or rules are configured — no default behavior exists
- **Assuming Native DMN Execution**: Activiti does not evaluate DMN tables — you must integrate an external engine via Connector
- **Missing `decisionTableReferenceKey`**: DMN Service Tasks fail validation with `DMN_TASK_NO_KEY` if the field extension is absent or empty
- **Not Implementing Delegate Interface**: Must implement `BusinessRuleTaskDelegate`
- **Thread Safety Issues**: Async execution requires thread-safe implementations
- **Complex Logic in BPMN**: Keep rules in external engines, not BPMN
- **No Error Boundary Events**: DMN engine failures propagate as unhandled exceptions and terminate the process instance

## Comparison: Approaches to Rules and Decisions

| Feature | Business Rule Task | DMN Service Task + Connector | Plain Service Task |
|---------|-------------------|------------------------------|-------------------|
| **Interface** | `BusinessRuleTaskDelegate` | `Connector` | `Connector` or `JavaDelegate` |
| **BPMN Semantics** | Rule execution | Decision evaluation | Generic automation |
| **Native Engine** | No | No | No |
| **Spring DI** | No (`Class.forName()`) | Yes (`@Autowired`) | Yes (`@Autowired`) |
| **Drools Integration** | Custom delegate | Connector bean | Connector bean |
| **DMN Support** | Not recommended | Recommended (Decision Task stencil) | Possible |
| **Runtime Switching** | No | `DynamicBpmnService` | Via variable injection |
| **Use Case** | Rule-centric BPMN semantics | Decision-table workflows | General integrations |
| **Complexity** | Higher (delegate interface) | Medium (Connector + DMN engine) | Lower (simple interface) |

**Recommendation:**
- Use **Business Rule Task** when BPMN rule semantics are important and logic is straightforward
- Use **DMN Service Task + Connector** for decision table workflows with external DMN engines
- Use **Plain Service Task + Connector** for general integrations without rule/decision semantics

## Related Documentation

- [Service Task](./service-task.md) - Alternative for rules integration
- [Connectors](../integration/connectors.md) - Modern integration pattern for DMN engines
- [Dynamic BPMN](../reference/dynamic-bpmn.md) - Runtime process modification including decision table switching
- [BPMN Elements](../index.md) - Complete element reference

---

