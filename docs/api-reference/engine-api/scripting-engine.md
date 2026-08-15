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
  <script><![CDATA[
    total = quantity * price;
    execution.setVariable('total', total);
  ]]></script>
</scriptTask>

<!-- Script task with Groovy -->
<scriptTask id="groovyTask" name="Process Data" scriptFormat="groovy">
  <script><![CDATA[
    def items = execution.getVariable('items') as List
    def total = items.sum { it.price }
    execution.setVariable('total', total)
  ]]></script>
</scriptTask>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Multiple script formats

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
  <script><![CDATA[
    // Script content here
    var total = execution.getVariable('amount') * 1.1;
    execution.setVariable('totalWithTax', total);
  ]]></script>
</scriptTask>

<!-- Groovy script, inline -->
<scriptTask id="groovyScript" name="Groovy Script" 
            scriptFormat="groovy">
  <script><![CDATA[
    def data = execution.getVariable('inputData')
    def result = processData(data)
    execution.setVariable('outputData', result)
  ]]></script>
</scriptTask>

<!-- External script: load the script content at runtime -->
<scriptTask id="classpathScript" name="Classpath Script" 
            scriptFormat="groovy">
  <script><![CDATA[
    def resource = this.class.classLoader.getResource('scripts/process.groovy')
    def shell = new GroovyShell(this.class.classLoader)
    shell.setVariable('execution', execution)
    shell.evaluate(resource.text)
  ]]></script>
</scriptTask>
```

> **Note:** `<activiti:field>` is **not** supported on ScriptTasks — the parser only handles field injection on Service Tasks, Send Tasks, and message event definitions. There is no `scriptResource` attribute either; if a script must be stored externally, load its content at runtime inside an inline script (as above), or move the logic into a Service Task with a `JavaDelegate`.

### Script Engine Configuration

```java
public class ScriptEngineConfig {
    
    @Bean
    public StandaloneProcessEngineConfiguration processEngineConfiguration() {
        StandaloneProcessEngineConfiguration config = new StandaloneProcessEngineConfiguration();
        
        // Register a custom script engine (used via scriptFormat="custom")
        config.getScriptingEngines().addScriptEngineFactory(new CustomScriptEngineFactory());
        
        // Optionally customize how process variables are exposed to scripts
        config.getScriptingEngines().setScriptBindingsFactory(new CustomScriptBindingsFactory());
        
        return config;
    }
}
```

## Script Task Implementation

### JavaScript Scripts

```xml
<scriptTask id="jsCalculation" name="JavaScript Calculation" 
            scriptFormat="javascript">
  <script><![CDATA[
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
  ]]></script>
</scriptTask>
```

### Groovy Scripts

```xml
<scriptTask id="groovyProcessing" name="Groovy Processing" 
            scriptFormat="groovy">
  <script><![CDATA[
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
  ]]></script>
</scriptTask>
```

### Java Scripts

```xml
<scriptTask id="javaScript" name="Java Script" 
            scriptFormat="java">
  <script><![CDATA[
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
  ]]></script>
</scriptTask>
```

### JUEL Expression Scripts

```xml
<scriptTask id="juelScript" name="JUEL Script" 
            scriptFormat="juel">
  <script><![CDATA[
    ${execution.setVariable('total', quantity * price)}
    ${execution.setVariable('tax', total * 0.08)}
    ${execution.setVariable('finalTotal', total + tax)}
  ]]></script>
</scriptTask>
```

## Script Context and Variables

### Accessing Process Variables

```xml
<scriptTask id="variableAccess" name="Variable Access" 
            scriptFormat="groovy">
  <script><![CDATA[
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
  ]]></script>
</scriptTask>
```

### Accessing Execution Context

```xml
<scriptTask id="contextAccess" name="Context Access" 
            scriptFormat="groovy">
  <script><![CDATA[
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
  ]]></script>
</scriptTask>
```

### Task Variables (Local Scope)

```xml
<scriptTask id="taskVariables" name="Task Variables" 
            scriptFormat="groovy">
  <script><![CDATA[
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
  ]]></script>
</scriptTask>
```

## External Script Resources

### Script from Classpath

```xml
<scriptTask id="classpathScript" name="Classpath Script" 
            scriptFormat="groovy">
  <script><![CDATA[
    // Activiti does not support script resources on scriptTask;
    // load the script content from the classpath at runtime
    def resource = this.class.classLoader.getResource('scripts/orderProcessing.groovy')
    def shell = new GroovyShell(this.class.classLoader)
    shell.setVariable('execution', execution)
    shell.evaluate(resource.text)
  ]]></script>
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

Since `scriptTask` has no script-resource support, the script content is loaded at runtime. A common approach is a `JavaDelegate` on a service task:

```java
public class ScriptFromDatabaseDelegate implements JavaDelegate {
    
    private final ScriptRepository scriptRepository;
    
    public ScriptFromDatabaseDelegate(ScriptRepository scriptRepository) {
        this.scriptRepository = scriptRepository;
    }
    
    @Override
    public void execute(DelegateExecution execution) {
        // Load the script content from the database
        String scriptName = (String) execution.getVariable("scriptName");
        Script storedScript = scriptRepository.findByName(scriptName);
        
        // Evaluate with the process context available as bindings
        ScriptEngine engine = new ScriptEngineManager().getEngineByName("groovy");
        Bindings bindings = new SimpleBindings();
        bindings.put("execution", execution);
        engine.eval(storedScript.getContent(), bindings);
    }
}
```

### Script from External Service

```xml
<scriptTask id="externalScript" name="External Script" 
            scriptFormat="groovy">
  <script><![CDATA[
    // Fetch the script from the external service and evaluate it
    def scriptText = new URL('https://scripts.example.com/calculateTotal').text
    def shell = new GroovyShell()
    shell.setVariable('execution', execution)
    shell.evaluate(scriptText)
  ]]></script>
</scriptTask>
```

## Custom Script Engines

### Registering Custom Engine

A custom engine is a standard JSR-223 `ScriptEngineFactory`/`ScriptEngine` pair, modeled on the engine's own `JuelScriptEngineFactory`/`JuelScriptEngine`:

```java
public class CustomScriptEngineFactory implements ScriptEngineFactory {

    private static final String ENGINE_NAME = "custom";

    @Override
    public String getEngineName() {
        return ENGINE_NAME;
    }

    @Override
    public String getEngineVersion() {
        return "1.0";
    }

    @Override
    public List<String> getExtensions() {
        return Collections.singletonList("custom");
    }

    @Override
    public String getLanguageName() {
        return "Custom";
    }

    @Override
    public String getLanguageVersion() {
        return "1.0";
    }

    @Override
    public String getMethodCallSyntax(String obj, String method, String... arguments) {
        throw new UnsupportedOperationException("Method getMethodCallSyntax is not supported");
    }

    @Override
    public List<String> getMimeTypes() {
        return Collections.emptyList();
    }

    @Override
    public List<String> getNames() {
        return Collections.singletonList(ENGINE_NAME);
    }

    @Override
    public String getOutputStatement(String toDisplay) {
        return "println('" + toDisplay + "')";
    }

    @Override
    public String getParameter(String key) {
        if (ScriptEngine.NAME.equals(key)) {
            return getLanguageName();
        } else if (ScriptEngine.ENGINE.equals(key)) {
            return getEngineName();
        } else if (ScriptEngine.ENGINE_VERSION.equals(key)) {
            return getEngineVersion();
        } else if (ScriptEngine.LANGUAGE.equals(key)) {
            return getLanguageName();
        } else if (ScriptEngine.LANGUAGE_VERSION.equals(key)) {
            return getLanguageVersion();
        } else if ("THREADING".equals(key)) {
            // Non-null value tells the engine the factory is thread-safe
            return "MULTITHREADED";
        }
        return null;
    }

    @Override
    public String getProgram(String... statements) {
        throw new UnsupportedOperationException("Method getProgram is not supported");
    }

    @Override
    public ScriptEngine getScriptEngine() {
        return new CustomScriptEngine(this);
    }
}
```

The engine itself extends `AbstractScriptEngine` (like `JuelScriptEngine`). It is invoked with a `ScriptContext` whose `ENGINE_SCOPE` bindings expose the process variables and the `execution` variable (`DelegateExecution`), so a custom engine accesses the process context through the `ScriptContext` bindings:

```java
public class CustomScriptEngine extends AbstractScriptEngine implements Compilable {

    private final ScriptEngineFactory scriptEngineFactory;

    public CustomScriptEngine(ScriptEngineFactory scriptEngineFactory) {
        this.scriptEngineFactory = scriptEngineFactory;
    }

    @Override
    public ScriptEngineFactory getFactory() {
        return scriptEngineFactory;
    }

    @Override
    public Object eval(String script, ScriptContext context) throws ScriptException {
        // Process variables and "execution" are available as ENGINE_SCOPE bindings
        Bindings bindings = context.getBindings(ScriptContext.ENGINE_SCOPE);
        DelegateExecution execution = (DelegateExecution) bindings.get("execution");

        // Custom script execution logic
        return null;
    }

    @Override
    public CompiledScript compile(String script) throws ScriptException {
        // Implement compilation if the language supports it
        throw new UnsupportedOperationException("Compilation not supported");
    }
}
```

### Configuring Custom Engine

```java
@Bean
public StandaloneProcessEngineConfiguration processEngineConfiguration() {
    StandaloneProcessEngineConfiguration config = new StandaloneProcessEngineConfiguration();
    
    // Register the custom script engine factory
    config.getScriptingEngines().addScriptEngineFactory(new CustomScriptEngineFactory());
    
    return config;
}
```

Once registered, the engine is available under the name returned by `getEngineName()`:

```xml
<scriptTask id="customScript" name="Custom Script" scriptFormat="custom">
  <script><![CDATA[
    execution.setVariable('customResult', 42)
  ]]></script>
</scriptTask>
```

## Error Handling

### Script Execution Errors

```xml
<scriptTask id="errorHandlingScript" name="Error Handling" 
            scriptFormat="groovy">
  <script><![CDATA[
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
  ]]></script>
</scriptTask>
```

### Script with Boundary Error Event

```xml
<scriptTask id="scriptWithErrorBoundary" name="Script with Error" 
            scriptFormat="javascript">
  <script><![CDATA[
    var value = execution.getVariable('requiredValue');
    
    if (value == null) {
      throw new Exception('Required value is missing');
    }
    
    execution.setVariable('processedValue', value * 2);
  ]]></script>
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
  <script><![CDATA[
    def cachedValue = execution.getVariable('cachedData')
    if (!cachedValue) {
      cachedValue = expensiveComputation()
      execution.setVariable('cachedData', cachedValue)
    }
    // Use cachedValue
  ]]></script>
</scriptTask>

// BAD: Repeated expensive operations
<scriptTask id="inefficientScript" scriptFormat="groovy">
  <script><![CDATA[
    // Computed every time
    def value = expensiveComputation()
  ]]></script>
</scriptTask>
```

### Script Compilation

Groovy scripts can be compiled for better performance. The engine also caches resolved script engines per language:

```java
@Bean
public StandaloneProcessEngineConfiguration processEngineConfiguration() {
    StandaloneProcessEngineConfiguration config = new StandaloneProcessEngineConfiguration();
    
    // Script engines are cached per language by default; disable if needed
    config.getScriptingEngines().setCacheScriptingEngines(true);
    
    return config;
}
```

## Security Considerations

### Script Sandboxing

Content restrictions are easiest to enforce in a custom `ScriptEngine` — validate the script text inside `eval` before running it:

```java
public class SecureGroovyScriptEngine extends AbstractScriptEngine {

    private final GroovyShell shell;

    public SecureGroovyScriptEngine() {
        this.shell = new GroovyShell();
    }

    @Override
    public Object eval(String script, ScriptContext context) throws ScriptException {
        // Validate script content before running it
        if (containsDangerousOperations(script)) {
            throw new ScriptException("Script contains dangerous operations");
        }

        try {
            return shell.evaluate(script, context.getBindings(ScriptContext.ENGINE_SCOPE));
        } catch (Exception e) {
            throw new ScriptException(e);
        }
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
  <script><![CDATA[
    // Validate input before use
    def userInput = execution.getVariable('userInput')
    
    if (userInput == null || userInput.trim().isEmpty()) {
      throw new Exception('Invalid input')
    }
    
    // Sanitize input
    def sanitized = userInput.replaceAll('[^a-zA-Z0-9]', '')
    
    // Use sanitized input
    execution.setVariable('processedInput', sanitized)
  ]]></script>
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
    <script><![CDATA[
      def order = execution.getVariable('order')
      
      assert order != null : 'Order is required'
      assert order.items != null : 'Order items required'
      assert !order.items.isEmpty() : 'Order must have items'
      assert order.customerId != null : 'Customer ID required'
      
      execution.setVariable('validationPassed', true)
    ]]></script>
  </scriptTask>
  
  <!-- Calculate totals -->
  <scriptTask id="calculateTotals" name="Calculate Totals" 
              scriptFormat="javascript">
    <script><![CDATA[
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
    ]]></script>
  </scriptTask>
  
  <!-- Apply discounts -->
  <scriptTask id="applyDiscounts" name="Apply Discounts" 
              scriptFormat="groovy">
    <script><![CDATA[
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
    ]]></script>
  </scriptTask>
  
  <!-- Generate order summary -->
  <scriptTask id="generateSummary" name="Generate Summary" 
              scriptFormat="groovy">
    <script><![CDATA[
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
    ]]></script>
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
  <script><![CDATA[
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
  ]]></script>
</scriptTask>
```

## Best Practices

### 1. Use Appropriate Script Format

```xml
<!-- GOOD: Simple calculation in JavaScript -->
<scriptTask scriptFormat="javascript">
  <script><![CDATA[total = quantity * price;]]></script>
</scriptTask>

<!-- GOOD: Complex logic in Groovy -->
<scriptTask scriptFormat="groovy">
  <script><![CDATA[def result = complexProcessing(items)]]></script>
</scriptTask>

<!-- BAD: Complex Java code in JavaScript -->
```

### 2. Keep Scripts Focused

```xml
<!-- GOOD: Single responsibility -->
<scriptTask id="calculateTax" name="Calculate Tax">
  <script><![CDATA[tax = total * taxRate;]]></script>
</scriptTask>

<scriptTask id="applyDiscount" name="Apply Discount">
  <script><![CDATA[discountedTotal = total - discount;]]></script>
</scriptTask>

<!-- BAD: Multiple responsibilities -->
<scriptTask id="doEverything" name="Do Everything">
  <script><![CDATA[
    // Calculate, validate, transform, persist...
  ]]></script>
</scriptTask>
```

### 3. Handle Errors Gracefully

```xml
<!-- GOOD: Error handling -->
<scriptTask scriptFormat="groovy">
  <script><![CDATA[
    try {
      def result = riskyOperation()
      execution.setVariable('result', result)
    } catch (Exception e) {
      execution.setVariable('error', e.message)
      execution.setVariable('success', false)
    }
  ]]></script>
</scriptTask>

<!-- BAD: No error handling -->
<scriptTask scriptFormat="groovy">
  <script><![CDATA[def result = riskyOperation() // Can throw]]></script>
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
  <script><![CDATA[
    tax = subtotal * 0.08;
    total = subtotal + tax;
  ]]></script>
</scriptTask>
```

## Related Documentation

- [Script Task](../../bpmn/elements/script-task.md) - Script task element
- [DelegateExecution API](../../bpmn/reference/delegate-execution-api.md) - Execution context
- [Expression Language](../core-common/expression-language) - JUEL expressions
- [Engine Configuration](../../configuration.md) - Script engine setup

---

**Source:** `activiti-engine/impl/scripting/`
