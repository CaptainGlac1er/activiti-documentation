---
sidebar_label: Business Rule Task
slug: /bpmn/elements/business-rule-task
description: Guide to BusinessRuleTask elements for executing business rules and decisions
---

# Business Rule Task

Business Rule Tasks execute **business rules** using rule engines like Drools or DMN (Decision Model and Notation).

## 📋 Overview

```xml
<businessRuleTask id="ruleTask" name="Evaluate Rules" activiti:resultVariable="decisionResult"/>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ DMN integration, custom rule engines

## 🎯 Key Features

### Standard BPMN Features
- **Decision Table** - Rule definition
- **Input/Output Data** - Data associations
- **Implementation** - Rule engine reference

### Activiti Customizations
- **DMN Integration** - Decision Model and Notation
- **Rule Decision Table** - Drools support
- **Result Variable** - Store decision output
- **Async Execution** - Background rule evaluation
- **Custom Properties** - Metadata extension
- **Skip Expression** - Conditional execution
- **Execution Listeners** - Lifecycle hooks

## 📝 Configuration Options

### DMN Implementation

```xml
<businessRuleTask id="creditDecision" 
                  name="Credit Assessment"
                  activiti:implementation="dmn:credit-decision.dmn"
                  activiti:resultVariable="creditResult"/>
```

### Rule Engine Class

```xml
<businessRuleTask id="ruleEvaluation" 
                  name="Evaluate Rules"
                  activiti:class="com.example.RuleEngine"
                  activiti:resultVariable="ruleResult"/>
```

### Decision Table

**Note:** Activiti does not support a native `<activiti:decisionTable>` element with `<activiti:condition>` and `<activiti:action>` child elements. Instead, use DMN (Decision Model and Notation) for decision tables:

```xml
<businessRuleTask id="pricingDecision" 
                  name="Calculate Price"
                  activiti:implementation="dmn:pricing-decision-table.dmn"
                  activiti:resultVariable="finalPrice">
  
  <extensionElements>
    <activiti:inputParameter name="orderAmount">${order.totalAmount}</activiti:inputParameter>
    <activiti:inputParameter name="customerTier">${customer.tier}</activiti:inputParameter>
  </extensionElements>
</businessRuleTask>
```

**For simple conditions, use sequence flow conditions instead:**

```xml
<businessRuleTask id="ruleEvaluation" 
                  name="Evaluate Rules"
                  activiti:implementation="dmn:rules.dmn"
                  activiti:resultVariable="ruleResult"/>

<exclusiveGateway id="decisionGateway"/>

<sequenceFlow id="highValue" 
              sourceRef="decisionGateway" 
              targetRef="highValueTask">
  <conditionExpression>${orderAmount > 1000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="lowValue" 
              sourceRef="decisionGateway" 
              targetRef="lowValueTask">
  <conditionExpression>${orderAmount <= 1000}</conditionExpression>
</sequenceFlow>
```

## 🔧 Advanced Features

### Async Execution

```xml
<businessRuleTask id="asyncRules" 
                  name="Complex Rules"
                  activiti:implementation="dmn:complex-decision.dmn"
                  activiti:async="true"/>
```

### Skip Expression

```xml
<businessRuleTask id="optionalRules" 
                  activiti:skipExpression="${!evaluateRules}"/>
```

### Execution Listeners

```xml
<businessRuleTask id="trackedRules">
  <activiti:executionListener event="start" class="com.example.RuleStartListener"/>
  <activiti:executionListener event="end" class="com.example.RuleEndListener"/>
</businessRuleTask>
```

## 💡 Complete Examples

### Example 1: DMN Credit Decision

```xml
<businessRuleTask id="creditCheck" 
                  name="Credit Check"
                  activiti:implementation="dmn:credit-scoring.dmn"
                  activiti:resultVariable="creditScore">
  
  <extensionElements>
    <activiti:inputParameter name="applicantAge">${applicant.age}</activiti:inputParameter>
    <activiti:inputParameter name="income">${applicant.annualIncome}</activiti:inputParameter>
    <activiti:inputParameter name="creditHistory">${applicant.creditHistory}</activiti:inputParameter>
  </extensionElements>
  
  <activiti:executionListener event="end" class="com.example.CreditDecisionListener"/>
</businessRuleTask>
```

### Example 2: Pricing Rules

```xml
<businessRuleTask id="priceCalculation" 
                  name="Calculate Final Price"
                  activiti:implementation="dmn:pricing-rules.dmn"
                  activiti:resultVariable="finalPrice">
  
  <extensionElements>
    <activiti:inputParameter name="basePrice">${product.basePrice}</activiti:inputParameter>
    <activiti:inputParameter name="customerTier">${customer.tier}</activiti:inputParameter>
    <activiti:inputParameter name="quantity">${order.quantity}</activiti:inputParameter>
    <activiti:inputParameter name="promotions">${activePromotions}</activiti:inputParameter>
  </extensionElements>
</businessRuleTask>
```

## 🔍 Runtime API Usage

### Evaluating Rules

```java
// DMN decision evaluation
DmnDecisionEvaluator evaluator = dmnService.createDecisionEvaluator();
DecisionEvaluationResult result = evaluator.evaluateDecisionTableByKey("creditDecision")
    .variables(Map.of("age", 30, "income", 50000))
    .evaluate();
```

## 📊 Best Practices

1. **Use DMN for Complex Decisions:** Leverage decision tables
2. **Separate Rules from Process:** Maintain rules independently
3. **Test Rules Thoroughly:** Validate all decision paths
4. **Document Decisions:** Explain rule logic
5. **Version Rules:** Track rule changes
6. **Monitor Performance:** Rule evaluation can be expensive
7. **Use Result Variables:** Store decisions for audit
8. **Handle Errors:** Add boundary events for rule failures

## 🔗 Related Documentation

- [Service Task](./service-task.md)
- [DMN in Service Tasks](./service-task.md#dmn-decision)


---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
