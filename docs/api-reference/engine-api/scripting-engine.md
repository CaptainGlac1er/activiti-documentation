---
sidebar_label: Scripting Engine
slug: /api-reference/engine-api/scripting-engine
title: "Scripting Engine"
description: "Complete guide to the Activiti Scripting Engine - executing scripts in process tasks with multiple language support."
---

# Scripting Engine

The **Scripting Engine** enables execution of **scripts in multiple languages** within process tasks. It provides a flexible way to implement business logic without compiling Java code, supporting JavaScript, Groovy, and other scripting languages.

## Overview

```xml
<!-- Script task with JavaScript -->
<scriptTask id="scriptTask" name="Calculate Total" scriptFormat="javascript">
  total = quantity * price;
  execution.setVariable('total', total);
</scriptTask>

<!-- Script task with Groovy -->
<scriptTask id="groovyTask" name="Process Data" scriptFormat="groovy">
  def items = execution.getVariable('items') as List
  def total = items.sum { it.price }
  execution.setVariable('total', total)
</scriptTask>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Multiple script formats, field injection

## Supported Script Formats

| Format | Language | MIME Type | Use Case |
|--------|----------|-----------|----------|
| `javascript` | JavaScript (Nashorn/GraalVM) | `text/javascript` | Simple calculations |
| `groovy` | Groovy | `text/groovy` | Complex logic |
| `java` | Java | `text/java` | Type-safe code |
| `juel` | JUEL Expressions | `text/juel` | Simple expressions |
| `custom` | Custom engines | Variable | Specialized needs |

## Configuration

### Script Task Configuration

```xml
<!-- Inline script -->
<scriptTask id="inlineScript" name="Inline Script" 
            scriptFormat="javascript">
  // Script content here
  var total = execution.getVariable('amount') * 1.1;
  execution.setVariable('totalWithTax', total);
</scriptTask>

<!-- Script from field -->
<scriptTask id="fieldScript" name="Field Script" 
            scriptFormat="groovy">
  <extensionElements>
    <activiti:field name="script">
      <activiti:string>
        def data = execution.getVariable('inputData')
        def result = processData(data)
        execution.setVariable('outputData', result)
      </activiti:string>
    </activiti:field>
  </extensionElements>
</scriptTask>

<!-- Script from resource -->
<scriptTask id="resourceScript" name="Resource Script" 
            scriptFormat="javascript">
  <extensionElements>
    <activiti:field name="scriptFormat" stringValue="javascript"/>
    <activiti:field name="scriptResource" stringValue="classpath:scripts/calculate.js"/>
  </extensionElements>
</scriptTask>

<!-- Script from classpath -->
<scriptTask id="classpathScript" name="Classpath Script" 
            scriptFormat="groovy">
  <extensionElements>
    <activiti:field name="scriptResource" stringValue="groovy/scripts/process.groovy"/>
  </extensionElements>
</scriptTask>
```

### Script Engine Configuration

```java
public class ScriptEngineConfig {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration() {
        ProcessEngineConfiguration config = 
            ProcessEngineConfiguration.createStandaloneProcessEngineConfiguration();
        
        // Register custom script engine
        config.setScriptEngineFactory(new CustomScriptEngineFactory());
        
        // Configure script factory
        config.setScriptFactory(new ActivitiScriptFactory());
        
        return config;
    }
}
```

## Script Task Implementation

### JavaScript Scripts

```xml
<scriptTask id="jsCalculation" name="JavaScript Calculation" 
            scriptFormat="javascript">
  // Access execution context
  var quantity = execution.getVariable('quantity');
  var price = execution.getVariable('price');
  
  // Calculate total
  var total = quantity * price;
  
  // Apply discount if applicable
  var discount = execution.getVariable('discount') || 0;
  var finalTotal = total * (1 - discount/100);
  
  // Set result
  execution.setVariable('finalTotal', finalTotal);
  execution.setVariable('calculationTime', new Date());
  
  // Conditional logic
  if (finalTotal > 1000) {
    execution.setVariable('requiresApproval', true);
  } else {
    execution.setVariable('requiresApproval', false);
  }
</scriptTask>
```

### Groovy Scripts

```xml
<scriptTask id="groovyProcessing" name="Groovy Processing" 
            scriptFormat="groovy">
  // Type inference
  def items = execution.getVariable('items') as List
  
  // Collection operations
  def total = items.sum { it.price }
  def average = total / items.size()
  def expensiveItems = items.findAll { it.price > 100 }
  
  // Set variables
  execution.setVariable('total', total)
  execution.setVariable('average', average)
  execution.setVariable('expensiveItems', expensiveItems)
  
  // Complex object creation
  def summary = [
    itemCount: items.size(),
    total: total,
    average: average,
    generatedAt: new Date()
  ]
  execution.setVariable('summary', summary)
  
  // Conditional with Elvis operator
  def discount = execution.getVariable('discount') ?: 0
  def finalTotal = total * (1 - discount / 100)
  execution.setVariable('finalTotal', finalTotal)
</scriptTask>
```

### Java Scripts

```xml
<scriptTask id="javaScript" name="Java Script" 
            scriptFormat="java">
  import java.util.*;
  import java.math.*;
  
  // Type-safe Java code
  BigDecimal quantity = (BigDecimal) execution.getVariable("quantity");
  BigDecimal price = (BigDecimal) execution.getVariable("price");
  
  BigDecimal total = quantity.multiply(price);
  
  // Complex calculations
  BigDecimal taxRate = new BigDecimal("0.08");
  BigDecimal tax = total.multiply(taxRate);
  BigDecimal finalTotal = total.add(tax);
  
  execution.setVariable("total", total);
  execution.setVariable("tax", tax);
  execution.setVariable("finalTotal", finalTotal);
</scriptTask>
```

### JUEL Expression Scripts

```xml
<scriptTask id="juelScript" name="JUEL Script" 
            scriptFormat="juel">
  ${execution.setVariable('total', quantity * price)}
  ${execution.setVariable('tax', total * 0.08)}
  ${execution.setVariable('finalTotal', total + tax)}
</scriptTask>
```

## Script Context and Variables

### Accessing Process Variables

```xml
<scriptTask id="variableAccess" name="Variable Access" 
            scriptFormat="groovy">
  // Get process variable
  def orderId = execution.getVariable('orderId')
  
  // Get variable with default
  def quantity = execution.getVariable('quantity', 1)
  
  // Check if variable exists
  if (execution.hasVariable('discount')) {
    def discount = execution.getVariable('discount')
  }
  
  // Get all variables
  def allVars = execution.getVariables()
  
  // Get variable names
  def varNames = execution.getVariableNames()
  
  // Set variable
  execution.setVariable('processed', true)
  
  // Remove variable
  execution.removeVariable('temp')
</scriptTask>
```

### Accessing Execution Context

```xml
<scriptTask id="contextAccess" name="Context Access" 
            scriptFormat="groovy">
  // Execution ID
  def executionId = execution.id
  
  // Process instance ID
  def processInstanceId = execution.processInstanceId
  
  // Process definition ID
  def processDefinitionId = execution.processDefinitionId
  
  // Process definition key
  def processDefinitionKey = execution.processDefinitionKey
  
  // Activity ID
  def activityId = execution.activityId
  
  // Current user
  def currentUser = execution.currentUserId
  
  // Process instance
  def processInstance = execution.processInstance
  
  // Business key
  def businessKey = processInstance.businessKey
  
  // Parent execution
  def parent = execution.parent
  
  // Child executions
  def children = execution.childExecutions
</scriptTask>
```

### Task Variables (Local Scope)

```xml
<scriptTask id="taskVariables" name="Task Variables" 
            scriptFormat="groovy">
  // Set task-local variable
  execution.setVariableLocal('tempCalculation', 42)
  
  // Get task-local variable
  def temp = execution.getVariableLocal('tempCalculation')
  
  // Check if task has local variable
  if (execution.hasVariableLocal('tempCalculation')) {
    // Use it
  }
  
  // Get all local variable names
  def localVarNames = execution.getVariableNamesLocal()
  
  // Get all local variables
  def localVars = execution.getVariablesLocal()
  
  // Remove local variable
  execution.removeVariableLocal('tempCalculation')
</scriptTask>
```

## External Script Resources

### Script from Classpath

```xml
<scriptTask id="classpathScript" name="Classpath Script" 
            scriptFormat="groovy">
  <extensionElements>
    <activiti:field name="scriptResource" 
                    stringValue="classpath:scripts/orderProcessing.groovy"/>
  </extensionElements>
</scriptTask>
```

**File:** `src/main/resources/scripts/orderProcessing.groovy`
```groovy
def processOrder(execution) {
    def order = execution.getVariable('order')
    
    // Validation
    if (!order.items || order.items.isEmpty()) {
        throw new Exception("Order has no items")
    }
    
    // Calculation
    def total = order.items.sum { it.price * it.quantity }
    def tax = total * 0.08
    def finalTotal = total + tax
    
    // Set results
    execution.setVariable('orderTotal', total)
    execution.setVariable('orderTax', tax)
    execution.setVariable('orderFinalTotal', finalTotal)
    execution.setVariable('orderProcessed', true)
}

// Execute
processOrder(execution)
```

### Script from Database

```java
public class ScriptFromDatabase {
    
    @Autowired
    private ScriptRepository scriptRepository;
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration() {
        ProcessEngineConfiguration config = 
            ProcessEngineConfiguration.createStandaloneProcessEngineConfiguration();
        
        // Custom script factory that loads from database
        config.setScriptFactory(new DatabaseScriptFactory(scriptRepository));
        
        return config;
    }
}

public class DatabaseScriptFactory extends ActivitiScriptFactory {
    
    private final ScriptRepository scriptRepository;
    
    public DatabaseScriptFactory(ScriptRepository scriptRepository) {
        this.scriptRepository = scriptRepository;
    }
    
    @Override
    public Object getScript(DelegateExecution execution, String script, 
                           String scriptFormat, String resource) {
        // Load script from database
        if (resource != null && resource.startsWith("db:")) {
            String scriptName = resource.substring(3);
            Script storedScript = scriptRepository.findByName(scriptName);
            return storedScript.getContent();
        }
        
        return super.getScript(execution, script, scriptFormat, resource);
    }
}
```

### Script from External Service

```xml
<scriptTask id="externalScript" name="External Script" 
            scriptFormat="javascript">
  <extensionElements>
    <activiti:field name="script">
      <activiti:expression>${scriptService.getScript('calculateTotal')}</activiti:expression>
    </activiti:field>
  </extensionElements>
</scriptTask>
```

## Custom Script Engines

### Registering Custom Engine

```java
public class CustomScriptEngineFactory implements ScriptEngineFactory {
    
    @Override
    public ScriptEngine getScriptEngine(String type) {
        switch (type) {
            case "custom-js":
                return new CustomJavaScriptEngine();
            case "custom-groovy":
                return new CustomGroovyEngine();
            default:
                return null;
        }
    }
}

public class CustomJavaScriptEngine implements ScriptEngine {
    
    @Override
    public Object eval(DelegateExecution execution, String script) {
        // Custom JavaScript execution
        // Could use Nashorn, GraalVM, or other JS engine
        return javascriptEngine.eval(script);
    }
}
```

### Configuring Custom Engine

```java
@Bean
public ProcessEngineConfiguration processEngineConfiguration() {
    ProcessEngineConfiguration config = 
        ProcessEngineConfiguration.createStandaloneProcessEngineConfiguration();
    
    // Register custom script engine factory
    config.setScriptEngineFactory(new CustomScriptEngineFactory());
    
    return config;
}
```

## Error Handling

### Script Execution Errors

```xml
<scriptTask id="errorHandlingScript" name="Error Handling" 
            scriptFormat="groovy">
  try {
    // Risky operation
    def result = riskyOperation()
    execution.setVariable('result', result)
  } catch (Exception e) {
    // Set error variable
    execution.setVariable('scriptError', e.message)
    execution.setVariable('scriptErrorType', e.class.name)
    
    // Optionally rethrow to trigger boundary event
    // throw e
    
    // Or set flag for error handling path
    execution.setVariable('processingFailed', true)
  }
</scriptTask>
```

### Script with Boundary Error Event

```xml
<scriptTask id="scriptWithErrorBoundary" name="Script with Error" 
            scriptFormat="javascript">
  var value = execution.getVariable('requiredValue');
  
  if (value == null) {
    throw new Exception('Required value is missing');
  }
  
  execution.setVariable('processedValue', value * 2);
</scriptTask>

<boundaryEvent id="scriptError" attachedToRef="scriptWithErrorBoundary" 
               cancelActivity="true">
  <errorEventDefinition errorRef="ScriptError"/>
</boundaryEvent>

<error id="ScriptError" name="Script Error" errorCode="SCRIPT_ERR"/>
```

## Performance Considerations

### Script Caching

```java
// Scripts are cached by the engine
// Avoid expensive operations in script initialization

// GOOD: Efficient script
<scriptTask id="efficientScript" scriptFormat="groovy">
  def cachedValue = execution.getVariable('cachedData')
  if (!cachedValue) {
    cachedValue = expensiveComputation()
    execution.setVariable('cachedData', cachedValue)
  }
  // Use cachedValue
</scriptTask>

// BAD: Repeated expensive operations
<scriptTask id="inefficientScript" scriptFormat="groovy">
  // Computed every time
  def value = expensiveComputation()
</scriptTask>
```

### Script Compilation

```java
// Groovy scripts can be compiled for better performance
// Configure Groovy shell to use compilation

@Bean
public ProcessEngineConfiguration processEngineConfiguration() {
    ProcessEngineConfiguration config = 
        ProcessEngineConfiguration.createStandaloneProcessEngineConfiguration();
    
    // Enable script compilation caching
    config.setScriptFactory(new CachingScriptFactory());
    
    return config;
}
```

## Security Considerations

### Script Sandboxing

```java
// Restrict script access to sensitive operations
public class SecureScriptFactory extends ActivitiScriptFactory {
    
    @Override
    public Object getScript(DelegateExecution execution, String script, 
                           String scriptFormat, String resource) {
        // Validate script content
        if (containsDangerousOperations(script)) {
            throw new SecurityException("Script contains dangerous operations");
        }
        
        return super.getScript(execution, script, scriptFormat, resource);
    }
    
    private boolean containsDangerousOperations(String script) {
        // Check for dangerous patterns
        return script.contains("Runtime.getRuntime()") ||
               script.contains("System.exit()") ||
               script.contains("new ProcessBuilder()");
    }
}
```

### Input Validation

```xml
<scriptTask id="validatedScript" name="Validated Script" 
            scriptFormat="groovy">
  // Validate input before use
  def userInput = execution.getVariable('userInput')
  
  if (userInput == null || userInput.trim().isEmpty()) {
    throw new Exception('Invalid input')
  }
  
  // Sanitize input
  def sanitized = userInput.replaceAll('[^a-zA-Z0-9]', '')
  
  // Use sanitized input
  execution.setVariable('processedInput', sanitized)
</scriptTask>
```

## Complete Examples

### Example 1: Order Processing Pipeline

```xml
<process id="orderProcessing" name="Order Processing with Scripts">
  
  <startEvent id="start"/>
  
  <!-- Validate order -->
  <scriptTask id="validateOrder" name="Validate Order" 
              scriptFormat="groovy">
    def order = execution.getVariable('order')
    
    assert order != null : 'Order is required'
    assert order.items != null : 'Order items required'
    assert !order.items.isEmpty() : 'Order must have items'
    assert order.customerId != null : 'Customer ID required'
    
    execution.setVariable('validationPassed', true)
  </scriptTask>
  
  <!-- Calculate totals -->
  <scriptTask id="calculateTotals" name="Calculate Totals" 
              scriptFormat="javascript">
    var items = execution.getVariable('items');
    var subtotal = 0;
    
    for (var i = 0; i < items.length; i++) {
      subtotal += items[i].price * items[i].quantity;
    }
    
    var tax = subtotal * 0.08;
    var total = subtotal + tax;
    
    execution.setVariable('subtotal', subtotal);
    execution.setVariable('tax', tax);
    execution.setVariable('total', total);
  </scriptTask>
  
  <!-- Apply discounts -->
  <scriptTask id="applyDiscounts" name="Apply Discounts" 
              scriptFormat="groovy">
    def total = execution.getVariable('total') as BigDecimal
    def discountType = execution.getVariable('discountType')
    
    def discount = BigDecimal.ZERO
    
    switch (discountType) {
        case 'VIP':
            discount = total * new BigDecimal('0.1')
            break
        case 'PROMO':
            discount = total * new BigDecimal('0.05')
            break
        case 'BULK':
            def itemCount = execution.getVariable('itemCount') as int
            if (itemCount > 10) {
                discount = total * new BigDecimal('0.15')
            }
            break
    }
    
    def finalTotal = total - discount
    
    execution.setVariable('discount', discount)
    execution.setVariable('finalTotal', finalTotal)
  </scriptTask>
  
  <!-- Generate order summary -->
  <scriptTask id="generateSummary" name="Generate Summary" 
              scriptFormat="groovy">
    def summary = [
        orderId: execution.getVariable('orderId'),
        customerId: execution.getVariable('customerId'),
        itemCount: execution.getVariable('itemCount'),
        subtotal: execution.getVariable('subtotal'),
        tax: execution.getVariable('tax'),
        discount: execution.getVariable('discount'),
        finalTotal: execution.getVariable('finalTotal'),
        processedAt: new Date(),
        processedBy: execution.currentUserId
    ]
    
    execution.setVariable('orderSummary', summary)
  </scriptTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="validateOrder"/>
  <sequenceFlow id="flow2" sourceRef="validateOrder" targetRef="calculateTotals"/>
  <sequenceFlow id="flow3" sourceRef="calculateTotals" targetRef="applyDiscounts"/>
  <sequenceFlow id="flow4" sourceRef="applyDiscounts" targetRef="generateSummary"/>
  <sequenceFlow id="flow5" sourceRef="generateSummary" targetRef="end"/>
  
</process>
```

### Example 2: Data Transformation

```xml
<scriptTask id="transformData" name="Transform Data" 
            scriptFormat="groovy">
  // Get raw data
  def rawData = execution.getVariable('rawData') as List
  
  // Transform to domain objects
  def transformedData = rawData.collect { raw ->
    [
        id: raw['id'],
        name: raw['name'].toUpperCase(),
        email: raw['email'].toLowerCase().trim(),
        age: raw['age'] as int,
        createdAt: new Date(raw['created_at'] as long),
        active: raw['status'] == 'ACTIVE'
    ]
  }
  
  // Filter active records
  def activeRecords = transformedData.findAll { it.active }
  
  // Sort by creation date
  activeRecords.sort { a, b -> b.createdAt.compareTo(a.createdAt) }
  
  // Set transformed data
  execution.setVariable('transformedData', transformedData)
  execution.setVariable('activeRecords', activeRecords)
  execution.setVariable('recordCount', activeRecords.size())
</scriptTask>
```

## Best Practices

### 1. Use Appropriate Script Format

```xml
<!-- GOOD: Simple calculation in JavaScript -->
<scriptTask scriptFormat="javascript">
  total = quantity * price;
</scriptTask>

<!-- GOOD: Complex logic in Groovy -->
<scriptTask scriptFormat="groovy">
  def result = complexProcessing(items)
</scriptTask>

<!-- BAD: Complex Java code in JavaScript -->
```

### 2. Keep Scripts Focused

```xml
<!-- GOOD: Single responsibility -->
<scriptTask id="calculateTax" name="Calculate Tax">
  tax = total * taxRate;
</scriptTask>

<scriptTask id="applyDiscount" name="Apply Discount">
  discountedTotal = total - discount;
</scriptTask>

<!-- BAD: Multiple responsibilities -->
<scriptTask id="doEverything" name="Do Everything">
  // Calculate, validate, transform, persist...
</scriptTask>
```

### 3. Handle Errors Gracefully

```xml
<!-- GOOD: Error handling -->
<scriptTask scriptFormat="groovy">
  try {
    def result = riskyOperation()
    execution.setVariable('result', result)
  } catch (Exception e) {
    execution.setVariable('error', e.message)
    execution.setVariable('success', false)
  }
</scriptTask>

<!-- BAD: No error handling -->
<scriptTask scriptFormat="groovy">
  def result = riskyOperation() // Can throw
</scriptTask>
```

### 4. Document Script Purpose

```xml
<!-- GOOD: Documented -->
<!-- 
  Script: Calculate order total with tax
  Input: subtotal (BigDecimal)
  Output: total (BigDecimal), tax (BigDecimal)
  Tax rate: 8%
-->
<scriptTask id="calculateTotal" name="Calculate Total">
  tax = subtotal * 0.08;
  total = subtotal + tax;
</scriptTask>
```

## Related Documentation

- [Script Task](../../bpmn/elements/script-task.md) - Script task element
- [DelegateExecution API](../../bpmn/advanced/delegate-execution-api.md) - Execution context
- [Expression Language](../core-common/expression-language.md) - JUEL expressions
- [Engine Configuration](./engine-configuration.md) - Script engine setup

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated:** 2026  
**Source:** `activiti-engine/impl/scripting/`
