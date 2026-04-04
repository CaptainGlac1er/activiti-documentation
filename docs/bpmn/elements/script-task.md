---
sidebar_label: Script Task
slug: /bpmn/elements/script-task
description: Guide to ScriptTask elements for executing scripts in various languages
---

# Script Task

Script Tasks allow you to **execute scripts** in various programming languages directly within your workflow, providing flexibility for lightweight automation and custom logic.

## 📋 Overview

```xml
<scriptTask id="script1" name="Calculate Total" activiti:scriptFormat="javascript">
  total = quantity * price;
</scriptTask>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ Multiple script languages and formats

## 🎯 Supported Script Formats

### 1. JavaScript (Nashorn/GraalVM)

```xml
<scriptTask id="jsScript" name="JavaScript Calculation" 
            activiti:scriptFormat="javascript">
  var total = quantity * price;
  var discount = total * 0.1;
  result = total - discount;
</scriptTask>
```

### 2. Groovy

```xml
<scriptTask id="groovyScript" name="Groovy Processing" 
            activiti:scriptFormat="groovy">
  def order = execution.getVariable('order')
  def validated = order.validate()
  execution.setVariable('validated', validated)
</scriptTask>
```

### 3. Java

```xml
<scriptTask id="javaScript" name="Java Code" 
            activiti:scriptFormat="java">
  String orderId = (String) execution.getVariable("orderId");
  double amount = (Double) execution.getVariable("amount");
  execution.setVariable("processed", true);
</scriptTask>
```

### 4. JUEL (Java Unified Expression Language)

```xml
<scriptTask id="juelScript" name="JUEL Expression" 
            activiti:scriptFormat="juel">
  ${orderService.processOrder(order)}
</scriptTask>
```

### 5. Beanshell

```xml
<scriptTask id="bshScript" name="BeanShell Script" 
            activiti:scriptFormat="beanshell">
  execution.setVariable("result", order.calculateTotal());
</scriptTask>
```

## 📝 Configuration Options

### Script Format

Define the scripting language:

```xml
<scriptTask activiti:scriptFormat="javascript"/>
```

**Default:** `javascript`

### Script Type

Specify if script is inline or external:

```xml
<!-- Inline (default) -->
<scriptTask activiti:scriptFormat="javascript">
  // script code here
</scriptTask>

<!-- External resource -->
<scriptTask activiti:scriptFormat="groovy" 
            activiti:resource="scripts/process.groovy"/>
```

### Result Variable

Store script output:

```xml
<scriptTask id="calculation" 
            activiti:scriptFormat="javascript"
            activiti:resultVariable="calculationResult">
  result = input1 + input2;
</scriptTask>
```

### Field Injection

Inject dependencies into script:

```xml
<scriptTask id="scriptWithDependencies" 
            activiti:scriptFormat="groovy">
  def result = orderService.process(order)
</scriptTask>
```

## 🔧 Advanced Features

### Async Execution

Run scripts asynchronously:

```xml
<scriptTask id="asyncScript" 
            name="Long Running Script"
            activiti:scriptFormat="groovy"
            activiti:async="true">
  // Script code
</scriptTask>
```

### Skip Expression

Conditionally skip script:

```xml
<scriptTask id="optionalScript" 
            activiti:scriptFormat="javascript"
            activiti:skipExpression="${!runScript}">
  // Script code
</scriptTask>
```

### Execution Listeners

Hook into script execution:

```xml
<scriptTask id="trackedScript" 
            activiti:scriptFormat="javascript">
  <extensionElements>
    <activiti:executionListener event="start" class="com.example.ScriptStartListener"/>
    <activiti:executionListener event="end" class="com.example.ScriptEndListener"/>
  </extensionElements>
</scriptTask>
```

### Boundary Events

Handle script exceptions:

```xml
<scriptTask id="riskyScript" 
            activiti:scriptFormat="javascript">
  // Script that might fail
  
  <boundaryEvent id="scriptError" cancelActivity="true">
    <errorEventDefinition errorRef="ScriptError"/>
  </boundaryEvent>
</scriptTask>
```

## 💡 Complete Examples

### Example 1: Data Transformation

```xml
<scriptTask id="transformData" 
            name="Transform Order Data"
            activiti:scriptFormat="groovy"
            activiti:resultVariable="transformedOrder">
  
  def order = execution.getVariable('order')
  
  // Transform order data
  def transformed = [
    orderId: order.id,
    customerName: "${order.customer.firstName} ${order.customer.lastName}",
    totalAmount: order.items.sum { it.price * it.quantity },
    itemCount: order.items.size(),
    processedDate: new Date()
  ]
  
  execution.setVariable('transformedOrder', transformed)
</scriptTask>
```

### Example 2: Complex Calculation

```xml
<scriptTask id="calculatePricing" 
            name="Calculate Final Price"
            activiti:scriptFormat="javascript"
            activiti:resultVariable="finalPrice">
  
  var basePrice = execution.getVariable('basePrice');
  var quantity = execution.getVariable('quantity');
  var discountRate = execution.getVariable('discountRate') || 0;
  var taxRate = execution.getVariable('taxRate') || 0.1;
  
  // Calculate subtotal
  var subtotal = basePrice * quantity;
  
  // Apply discount
  var afterDiscount = subtotal * (1 - discountRate);
  
  // Add tax
  var withTax = afterDiscount * (1 + taxRate);
  
  // Round to 2 decimal places
  result = Math.round(withTax * 100) / 100;
</scriptTask>
```

### Example 3: External Service Call

```xml
<scriptTask id="callExternalAPI" 
            name="Fetch External Data"
            activiti:scriptFormat="groovy">
  
  def url = "https://api.example.com/data/${execution.getVariable('id')}"
  def response = new URL(url).text
  
  def json = new groovy.json.JsonSlurper().parseText(response)
  
  execution.setVariable('externalData', json)
</scriptTask>
```

### Example 4: Validation Script

```xml
<scriptTask id="validateData" 
            name="Validate Input"
            activiti:scriptFormat="javascript">
  
  var input = execution.getVariable('inputData');
  var errors = [];
  
  // Validate required fields
  if (!input.name) {
    errors.push('Name is required');
  }
  
  if (!input.email || !input.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (input.age && (input.age < 0 || input.age > 150)) {
    errors.push('Age must be between 0 and 150');
  }
  
  execution.setVariable('validationErrors', errors);
  execution.setVariable('isValid', errors.length === 0);
  
  if (errors.length > 0) {
    throw new Error('Validation failed: ' + errors.join(', '));
  }
</scriptTask>
```

### Example 5: Multi-Language Script

```xml
<!-- JavaScript for simple calculations -->
<scriptTask id="jsCalc" 
            activiti:scriptFormat="javascript"
            activiti:resultVariable="sum">
  result = a + b + c;
</scriptTask>

<!-- Groovy for complex object manipulation -->
<scriptTask id="groovyProcess" 
            activiti:scriptFormat="groovy">
  def list = execution.getVariable('items')
  def filtered = list.findAll { it.active }
  def sorted = filtered.sort { it.name }
  execution.setVariable('processedItems', sorted)
</scriptTask>

<!-- Java for type-safe operations -->
<scriptTask id="javaLogic" 
            activiti:scriptFormat="java">
  List<Order> orders = (List<Order>) execution.getVariable("orders");
  double total = orders.stream()
      .mapToDouble(Order::getAmount)
      .sum();
  execution.setVariable("totalAmount", total);
</scriptTask>
```

## 🔍 Runtime API Usage

### Executing Scripts Programmatically

```java
// Get script engine
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("javascript");

// Execute script
engine.put("execution", delegateExecution);
engine.eval("result = value1 + value2;");
Object result = engine.get("result");
```

### Custom Script Engine

```java
public class CustomScriptEngine implements ScriptEngine {
    @Override
    public Object eval(DelegateExecution execution, String script) {
        // Custom script execution logic
    }
}
```

## 📊 Best Practices

1. **Choose Right Language:** Use appropriate script format for task
2. **Keep Scripts Simple:** Complex logic belongs in service tasks
3. **Error Handling:** Add boundary events for script failures
4. **External Resources:** Store complex scripts externally
5. **Testing:** Test scripts thoroughly before deployment
6. **Performance:** Avoid heavy computations in scripts
7. **Security:** Validate all inputs in scripts
8. **Documentation:** Comment complex script logic
9. **Version Control:** Track script changes
10. **Result Variables:** Store outputs for downstream use

## ⚠️ Common Pitfalls

- **Syntax Errors:** Script syntax varies by language
- **Variable Scope:** Understand execution context
- **Performance:** Scripts run in process thread
- **Debugging:** Harder to debug than Java classes
- **Dependencies:** Limited access to external libraries
- **Type Safety:** Dynamic typing can cause runtime errors
- **Maintenance:** Scripts scattered across processes

## 🔒 Security Considerations

```xml
<!-- Avoid executing untrusted code -->
<scriptTask id="safeScript" activiti:scriptFormat="javascript">
  // Only use trusted variables
  var result = execution.getVariable('trustedInput');
</scriptTask>
```

**Security Best Practices:**
- Never execute user-provided scripts
- Validate all inputs
- Use sandboxed environments
- Limit script execution time
- Monitor script performance

## 🔗 Related Documentation

- [Service Task](./service-task.md)
- [User Task](./user-task.md)
- [Expression Language](../../api-reference/core-common/expression-language.md)

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
