---
sidebar_label: Script Task
slug: /bpmn/elements/script-task
title: "Script Task"
description: "Complete guide to ScriptTask elements for executing scripts in various languages within Activiti workflows."
---

# Script Task

Script Tasks allow you to **execute scripts** in various programming languages directly within your workflow, providing flexibility for lightweight automation and custom logic without requiring full Java classes.

## Overview

```xml
<scriptTask id="script1" name="Calculate Total" scriptFormat="javascript">
  total = quantity * price;
</scriptTask>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Multiple script languages and formats

## Supported Script Formats

> **Note:** Script formats are resolved via JSR-223 `ScriptEngineManager`. Only languages with registered script engines will work. Common options include `javascript` (via Nashorn or GraalVM) and `groovy` (if Groovy is on the classpath).

### 1. JavaScript (Nashorn/GraalVM)

```xml
<scriptTask id="jsScript" name="JavaScript Calculation" 
            scriptFormat="javascript">
  var total = quantity * price;
  var discount = total * 0.1;
  result = total - discount;
</scriptTask>
```

### 2. Groovy

```xml
<scriptTask id="groovyScript" name="Groovy Processing" 
            scriptFormat="groovy">
  def order = execution.getVariable('order')
  def validated = order.validate()
  execution.setVariable('validated', validated)
</scriptTask>
```

> **Note:** `activiti:scriptFormat="java"`, `activiti:scriptFormat="juel"`, and `activiti:scriptFormat="beanshell"` are **not supported** by default. Java code should use Service Tasks with `activiti:class` instead. JUEL is used for expression language (`${...}`) but is not a script engine. BeanShell requires additional setup and is not included by default.

## Configuration Options

### Script Format

Define the scripting language:

```xml
<scriptTask scriptFormat="javascript"/>
```

**Default:** `javascript`

### Script Type

Specify if script is inline or external:

```xml
<!-- Inline (default) -->
<scriptTask scriptFormat="javascript">
  // script code here
</scriptTask>
```

> **Note:** The `activiti:resource` attribute is **not supported** for ScriptTasks in Activiti. Scripts must be defined inline.

### Result Variable

Store script output:

```xml
<scriptTask id="calculation" 
            scriptFormat="javascript"
            activiti:resultVariable="calculationResult">
  result = input1 + input2;
</scriptTask>
```

## Advanced Features

### Async Execution

Run scripts asynchronously:

```xml
<scriptTask id="asyncScript" 
            name="Long Running Script"
            scriptFormat="groovy"
            activiti:async="true">
  // Script code
</scriptTask>
```

### Execution Listeners

Hook into script execution:

```xml
<scriptTask id="trackedScript" 
            scriptFormat="javascript">
  <extensionElements>
    <activiti:executionListener event="start" class="com.example.ScriptStartListener"/>
    <activiti:executionListener event="end" class="com.example.ScriptEndListener"/>
  </extensionElements>
</scriptTask>
```

### Boundary Events

Boundary events must be **siblings** of the script task (not nested inside it):

```xml
<process id="processWithBoundary">
  <!-- Script task -->
  <scriptTask id="riskyScript" name="Risky Script" scriptFormat="javascript">
    // Script that might fail
  </scriptTask>
  
  <!-- Boundary event as sibling, not child -->
  <boundaryEvent id="scriptError" attachedToRef="riskyScript" cancelActivity="true">
    <errorEventDefinition errorRef="ScriptError"/>
  </boundaryEvent>
  
  <sequenceFlow id="flow1" sourceRef="riskyScript" targetRef="nextTask"/>
  <sequenceFlow id="flow2" sourceRef="scriptError" targetRef="errorEnd"/>
</process>
```

## Complete Examples

### Example 1: Data Transformation

```xml
<scriptTask id="transformData" 
            name="Transform Order Data"
            scriptFormat="groovy"
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
            scriptFormat="javascript"
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
            scriptFormat="groovy">
  
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
            scriptFormat="javascript">
  
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
            scriptFormat="javascript"
            activiti:resultVariable="sum">
  result = a + b + c;
</scriptTask>

<!-- Groovy for complex object manipulation -->
<scriptTask id="groovyProcess" 
            scriptFormat="groovy">
  def list = execution.getVariable('items')
  def filtered = list.findAll { it.active }
  def sorted = filtered.sort { it.name }
  execution.setVariable('processedItems', sorted)
</scriptTask>
```

> **Note:** `activiti:scriptFormat="java"`, `activiti:scriptFormat="juel"`, and `activiti:scriptFormat="beanshell"` are **not supported** by default. Java code should use Service Tasks with `activiti:class` instead. JUEL is used for expression language (`${...}`) but is not a script engine. BeanShell requires additional setup and is not included by default.

## Runtime API Usage

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
public class CustomScriptEngine implements javax.script.ScriptEngine {
    @Override
    public Object eval(String script, Bindings bindings) {
        // DelegateExecution is available via bindings
        DelegateExecution execution = (DelegateExecution) bindings.get("execution");
        // Custom script execution logic
        return null;
    }

    // Other required ScriptEngine methods...
}
```

## Best Practices

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

## Common Pitfalls

- **Syntax Errors:** Script syntax varies by language
- **Variable Scope:** Understand execution context
- **Performance:** Scripts run in process thread
- **Debugging:** Harder to debug than Java classes
- **Dependencies:** Limited access to external libraries
- **Type Safety:** Dynamic typing can cause runtime errors
- **Maintenance:** Scripts scattered across processes

## Security Considerations

```xml
<!-- Avoid executing untrusted code -->
<scriptTask id="safeScript" scriptFormat="javascript">
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

## Related Documentation

- [Service Task](./service-task.md)
- [User Task](./user-task.md)
- [Expression Language](../../api-reference/core-common/expression-language.md)

---

