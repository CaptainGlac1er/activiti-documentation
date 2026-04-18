---
sidebar_label: Expression Language
slug: /api-reference/core-common/expression-language
description: Core common utilities and shared modules.
---

# Activiti Expression Language Module - Technical Documentation

**Module:** `activiti-core-common/activiti-expression-language`

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Classes and Their Responsibilities](#key-classes-and-their-responsibilities)
- [EL Context](#el-context)
- [Function Mapper](#function-mapper)
- [Variable Mapper](#variable-mapper)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-expression-language** module provides Expression Language (EL) support for Activiti, enabling dynamic expression evaluation in BPMN processes. It implements Jakarta EL (JUEL) to allow process designers to use expressions for variables, conditions, and business logic.

### Key Features

- **Jakarta EL Support**: Full JUEL implementation
- **Custom EL Context**: Activiti-specific context management
- **Function Mapping**: Register custom EL functions
- **Variable Resolution**: Dynamic variable access in expressions
- **EL Resolver**: Custom object property resolution
- **Expression Evaluation**: Safe expression parsing and execution

### Module Structure

```
activiti-expression-language/
└── src/main/java/org/activiti/core/el/
    ├── ActivitiElContext.java          # EL context implementation
    ├── ActivitiFunctionMapper.java     # Function mapper
    └── ActivitiVariablesMapper.java    # Variable mapper
```

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Expression Language                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ActivitiElContext                       │   │
│  │         (Jakarta EL Context Implementation)          │   │
│  │                                                      │   │
│  │  - ELResolver: Property resolution                  │   │
│  │  - FunctionMapper: Custom functions                 │   │
│  │  - VariableMapper: Variable access                  │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│           ┌───────────┼───────────┐                         │
│           │           │           │                         │
│           ▼           ▼           ▼                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐       │
│  │ ELResolver  │ │ Function    │ │ Variable        │       │
│  │             │ │ Mapper      │ │ Mapper          │       │
│  │ Property    │ │ Activiti    │ │ Activiti        │       │
│  │ access      │ │ functions   │ │ variables       │       │
│  └─────────────┘ └─────────────┘ └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Expression Evaluation Flow

```
BPMN Expression
    │
    ▼
"${order.totalAmount > 1000}"
    │
    ▼
┌─────────────────────────────┐
│  ExpressionFactory          │
│  getExpression()            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  ActivitiElContext          │
│  evaluate()                 │
└──────────┬──────────────────┘
           │
           ├──────────┬──────────┐
           │          │          │
           ▼          ▼          ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │Variable│  │Function│  │Property  │
    │Mapper  │  │Mapper  │  │Resolver  │
    └────────┘  └────────┘  └──────────┘
           │          │          │
           └──────────┼──────────┘
                      │
                      ▼
             ┌────────────────┐
             │  Result: true  │
             └────────────────┘
```

---

## Key Classes and Their Responsibilities

### ActivitiElContext

**Purpose:** Implements Jakarta EL Context for Activiti expression evaluation.

**Responsibilities:**
- Manage EL resolution context
- Provide EL resolver for property access
- Manage function mapper for custom functions
- Manage variable mapper for process variables
- Support expression evaluation lifecycle

**Key Methods:**
- `getELResolver()` - Get property resolver
- `getFunctionMapper()` - Get function mapper
- `getVariableMapper()` - Get variable mapper
- `setFunction(String, String, Method)` - Register custom function
- `setVariable(String, ValueExpression)` - Set variable expression

**When to Use:** Automatically used when evaluating EL expressions in Activiti.

**Design Pattern:** Context pattern - manages expression evaluation context

**Thread Safety:** Not thread-safe (should be created per evaluation)

**Example:**
```java
ActivitiElContext context = new ActivitiElContext(elResolver);
context.setFunction("math", "add", MathUtils.class.getMethod("add", int.class, int.class));
Object result = expression.getValue(context);
```

---

### ActivitiFunctionMapper

**Purpose:** Maps EL function signatures to Java methods.

**Responsibilities:**
- Register custom EL functions
- Resolve function calls to methods
- Manage function prefixes and names
- Support method invocation

**Key Methods:**
- `setFunction(String prefix, String localName, Method method)` - Register function
- `resolveFunction(String prefix, String localName)` - Resolve function
- `getFunction(String prefix, String localName)` - Get function method

**When to Use:** When adding custom functions to EL expressions.

**Design Pattern:** Registry pattern - maps function names to methods

**Example:**
```java
// Register function
context.setFunction("math", "add", 
    MathUtils.class.getMethod("add", int.class, int.class));

// Use in expression
"${math:add(5, 3)}"  // Returns 8
```

---

### ActivitiVariablesMapper

**Purpose:** Maps EL variable names to process variables.

**Responsibilities:**
- Register process variables
- Resolve variable references
- Manage variable lifecycle
- Support dynamic variable access

**Key Methods:**
- `setVariable(String name, ValueExpression expression)` - Set variable
- `resolveVariable(String name)` - Resolve variable
- `getVariable(String name)` - Get variable expression

**When to Use:** Automatically used for process variable access in expressions.

**Design Pattern:** Map pattern - associates variable names with expressions

**Example:**
```java
// Set variable
context.setVariable("order", valueExpression);

// Use in expression
"${order.totalAmount}"  // Accesses order variable
```

---

## EL Context

### Creating EL Context

```java
public class ActivitiElContextFactory {
    
    public static ActivitiElContext createContext(ELResolver resolver) {
        ActivitiElContext context = new ActivitiElContext(resolver);
        
        // Register standard functions
        registerStringFunctions(context);
        registerMathFunctions(context);
        registerDateFunctions(context);
        
        return context;
    }
    
    private static void registerStringFunctions(ActivitiElContext context) {
        context.setFunction("str", "upperCase", 
            StringUtils.class.getMethod("upperCase", String.class));
        context.setFunction("str", "lowerCase", 
            StringUtils.class.getMethod("lowerCase", String.class));
        context.setFunction("str", "concat", 
            StringUtils.class.getMethod("concat", String.class, String.class));
    }
    
    private static void registerMathFunctions(ActivitiElContext context) {
        context.setFunction("math", "add", 
            MathUtils.class.getMethod("add", double.class, double.class));
        context.setFunction("math", "subtract", 
            MathUtils.class.getMethod("subtract", double.class, double.class));
        context.setFunction("math", "multiply", 
            MathUtils.class.getMethod("multiply", double.class, double.class));
    }
}
```

### Using EL Context

```java
public class ExpressionEvaluator {
    
    private final ExpressionFactory expressionFactory;
    private final ActivitiElContext context;
    
    public ExpressionEvaluator() {
        this.expressionFactory = ExpressionFactory.newInstance();
        this.context = new ActivitiElContext();
    }
    
    public Object evaluate(String expression, Map<String, Object> variables) {
        // Set variables in context
        variables.forEach((name, value) -> {
            ValueExpression varExpr = expressionFactory.createValueExpression(
                context, 
                "#{'" + value + "'}", 
                Object.class
            );
            context.setVariable(name, varExpr);
        });
        
        // Create and evaluate expression
        ValueExpression expr = expressionFactory.createValueExpression(
            context,
            expression,
            Object.class
        );
        
        return expr.getValue(context);
    }
}
```

---

## Function Mapper

### Registering Custom Functions

```java
public class CustomFunctions {
    
    public static String upperCase(String value) {
        return value != null ? value.toUpperCase() : null;
    }
    
    public static String lowerCase(String value) {
        return value != null ? value.toLowerCase() : null;
    }
    
    public static double calculateTax(double amount, double rate) {
        return amount * rate / 100.0;
    }
    
    public static boolean isWeekend(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }
}

// Register functions
ActivitiElContext context = new ActivitiElContext();
context.setFunction("str", "upperCase", 
    CustomFunctions.class.getMethod("upperCase", String.class));
context.setFunction("str", "lowerCase", 
    CustomFunctions.class.getMethod("lowerCase", String.class));
context.setFunction("tax", "calculate", 
    CustomFunctions.class.getMethod("calculateTax", double.class, double.class));
context.setFunction("date", "isWeekend", 
    CustomFunctions.class.getMethod("isWeekend", LocalDate.class));
```

### Using Functions in Expressions

```java
// String functions
"${str:upperCase('hello')}"      // "HELLO"
"${str:lowerCase('WORLD')}"      // "world"

// Math functions
"${tax:calculate(1000, 20)}"     // 200.0
"${math:add(10, 5)}"            // 15.0

// Date functions
"${date:isWeekend(orderDate)}"  // true/false
```

---

## Variable Mapper

### Setting Variables

```java
public class VariableManager {
    
    private final ActivitiElContext context;
    private final ExpressionFactory expressionFactory;
    
    public VariableManager() {
        this.context = new ActivitiElContext();
        this.expressionFactory = ExpressionFactory.newInstance();
    }
    
    public void setVariable(String name, Object value) {
        ValueExpression expr = expressionFactory.createValueExpression(
            context,
            value != null ? "'" + value + "'" : "null",
            Object.class
        );
        context.setVariable(name, expr);
    }
    
    public void setObjectVariable(String name, Object obj) {
        // For objects, use bean property access
        ValueExpression expr = expressionFactory.createValueExpression(
            context,
            "#{obj}",
            Object.class
        );
        context.setVariable(name, expr);
    }
}
```

### Accessing Variables in Expressions

```java
// Simple variables
"${orderId}"                    // Access orderId variable
"${customerName}"               // Access customerName variable

// Object properties
"${order.totalAmount}"          // Access order.totalAmount
"${customer.address.city}"      // Nested property access

// Collections
"${orders[0].id}"               // First order ID
"${customers.size()}"           // Customer count
```

---

## Usage Examples

### BPMN Expression Examples

```xml
<!-- Service Task with Expression (as attribute) -->
<serviceTask id="calculateTotal" 
             name="Calculate Total" 
             activiti:expression="${math:multiply(quantity, unitPrice)}" />

<!-- Service Task with Class and Field Expressions -->
<serviceTask id="processOrder" 
             name="Process Order" 
             activiti:class="com.example.OrderProcessor">
  <extensionElements>
    <activiti:field name="orderId">
      <activiti:expression>${orderId}</activiti:expression>
    </activiti:field>
    <activiti:field name="orderAmount">
      <activiti:expression>${order.totalAmount}</activiti:expression>
    </activiti:field>
  </extensionElements>
</serviceTask>

<!-- Condition on Sequence Flow (standard BPMN) -->
<exclusiveGateway id="approveGateway" name="Approval Required"/>

<sequenceFlow id="approveFlow" 
              sourceRef="approveGateway" 
              targetRef="approveTask">
  <conditionExpression>${order.totalAmount > 1000}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="rejectFlow" 
              sourceRef="approveGateway" 
              targetRef="rejectTask">
  <conditionExpression>${order.totalAmount <= 1000}</conditionExpression>
</sequenceFlow>

<!-- Message Event with Field Expressions -->
<intermediateMessageThrowEvent id="sendNotification">
  <messageEventDefinition messageRef="orderCreated">
    <extensionElements>
      <activiti:field name="messageBody">
        <activiti:expression>${str:concat('Order ', orderId, ' created for ', customerName)}</activiti:expression>
      </activiti:field>
    </extensionElements>
  </messageEventDefinition>
</intermediateMessageThrowEvent>

<!-- User Task with Expression -->
<userTask id="notifyUser" 
          name="Notify User" 
          activiti:assignee="${str:upperCase(customer.username)}" />

<!-- Script Task with Expression -->
<scriptTask id="calculateScript" 
            name="Calculate with Script" 
            activiti:scriptFormat="javascript">
  <script>${math:add(order.total, tax.amount)}</script>
</scriptTask>
```

**Key Points:**
- `activiti:expression` is used as an **attribute** on elements like `serviceTask`, `userTask`, etc.
- `activiti:expression` can be a **child element** inside `<activiti:field>` for field injection
- Conditions use standard BPMN `<conditionExpression>` as a child of `sequenceFlow`
- There is **no** standalone `<activiti:condition>` element
- Expressions use Jakarta EL syntax: `${...}` or `#{...}`

### Java Code Examples

```java
@Service
public class ExpressionService {
    
    @Autowired
    private ActivitiElContext elContext;
    
    public Object evaluateExpression(String expression, Map<String, Object> variables) {
        ExpressionFactory factory = ExpressionFactory.newInstance();
        
        // Set variables
        variables.forEach((name, value) -> {
            ValueExpression varExpr = factory.createValueExpression(
                elContext, 
                value.toString(), 
                Object.class
            );
            elContext.setVariable(name, varExpr);
        });
        
        // Evaluate
        ValueExpression expr = factory.createValueExpression(
            elContext,
            expression,
            Object.class
        );
        
        return expr.getValue(elContext);
    }
    
    public void registerCustomFunction(String prefix, String name, Method method) {
        elContext.setFunction(prefix, name, method);
    }
}
```

### Custom EL Resolver

```java
public class ProcessVariableResolver extends ELResolver {
    
    private final Map<String, Object> variables;
    
    public ProcessVariableResolver(Map<String, Object> variables) {
        this.variables = variables;
    }
    
    @Override
    public Object getValue(ELContext context, Object base, Object property) {
        if (base == null && property instanceof String) {
            Object value = variables.get(property);
            if (value != null) {
                context.setPropertyResolved(true);
                return value;
            }
        }
        return null;
    }
    
    @Override
    public Class<?> getType(ELContext context, Object base, Object property) {
        if (base == null && property instanceof String) {
            Object value = variables.get(property);
            if (value != null) {
                context.setPropertyResolved(true);
                return value.getClass();
            }
        }
        return Object.class;
    }
}

// Use resolver
ProcessVariableResolver resolver = new ProcessVariableResolver(variables);
ActivitiElContext context = new ActivitiElContext(resolver);
```

---

## Best Practices

### 1. Use Meaningful Function Names

```java
// GOOD
context.setFunction("order", "calculateTotal", calculateTotalMethod);
context.setFunction("tax", "computeVAT", computeVATMethod);

// BAD
context.setFunction("f1", "m1", someMethod);
context.setFunction("x", "y", anotherMethod);
```

### 2. Validate Expression Syntax

```java
// GOOD
try {
    ValueExpression expr = factory.createValueExpression(context, expression, Object.class);
    return expr.getValue(context);
} catch (ELException e) {
    throw new InvalidExpressionException("Invalid expression: " + expression, e);
}

// BAD
ValueExpression expr = factory.createValueExpression(context, expression, Object.class);
return expr.getValue(context); // May throw ELException at runtime
```

### 3. Use Type-Safe Expressions

```java
// GOOD
ValueExpression expr = factory.createValueExpression(
    context, 
    "${order.totalAmount}", 
    Double.class  // Specify expected type
);
Double amount = (Double) expr.getValue(context);

// BAD
ValueExpression expr = factory.createValueExpression(
    context, 
    "${order.totalAmount}", 
    Object.class
);
// Need to cast and may get ClassCastException
```

### 4. Cache Compiled Expressions

```java
@Service
public class CachedExpressionService {
    
    private final Cache<String, ValueExpression> expressionCache = 
        CacheBuilder.newBuilder()
            .maximumSize(100)
            .expireAfterAccess(10, MINUTES)
            .build();
    
    public Object evaluate(String expression, Map<String, Object> variables) {
        ValueExpression expr = expressionCache.get(expression, 
            key -> {
                ExpressionFactory factory = ExpressionFactory.newInstance();
                return factory.createValueExpression(context, key, Object.class);
            });
        
        return expr.getValue(context);
    }
}
```

### 5. Handle Null Values Gracefully

```java
// GOOD - Use EL null coalescing
"${order.totalAmount != null ? order.totalAmount : 0}"

// GOOD - Use custom function
"${math:ifNull(order.totalAmount, 0)}"

// BAD - May throw NullPointerException
"${order.totalAmount + 100}"
```

---

## API Reference

### ActivitiElContext

**Constructors:**

```java
public ActivitiElContext()
public ActivitiElContext(ELResolver elResolver)
```

**Methods:**

```java
/**
 * Get the EL resolver for property access.
 */
public ELResolver getELResolver()

/**
 * Get the function mapper for custom functions.
 */
public FunctionMapper getFunctionMapper()

/**
 * Get the variable mapper for process variables.
 */
public VariableMapper getVariableMapper()

/**
 * Register a custom EL function.
 */
public void setFunction(String prefix, String localName, Method method)

/**
 * Set a variable expression.
 */
public ValueExpression setVariable(String name, ValueExpression expression)
```

---

### ActivitiFunctionMapper

**Methods:**

```java
/**
 * Register a function.
 */
public void setFunction(String prefix, String localName, Method method)

/**
 * Resolve function to Method.
 */
public Method resolveFunction(String prefix, String localName)
```

---

### ActivitiVariablesMapper

**Methods:**

```java
/**
 * Set a variable.
 */
public ValueExpression setVariable(String name, ValueExpression expression)

/**
 * Resolve variable.
 */
public ValueExpression resolveVariable(String name)
```

---

## Troubleshooting

### Expression Not Evaluating

**Problem:** Expression returns null

**Solution:**
1. Check variable is set in context
2. Verify EL resolver is configured
3. Ensure expression syntax is correct

```java
// Debug
System.out.println("Variables: " + variables);
System.out.println("Expression: " + expression);
System.out.println("Result: " + result);
```

### Function Not Found

**Problem:** ELException: Function not found

**Solution:**
1. Verify function is registered
2. Check prefix and name match
3. Ensure method signature is correct

```java
// Register correctly
context.setFunction("math", "add", 
    MathUtils.class.getMethod("add", double.class, double.class));

// Use correctly
"${math:add(1, 2)}"
```

### Property Access Fails

**Problem:** Cannot get property

**Solution:**
1. Check EL resolver is set
2. Verify object has getter method
3. Ensure property name matches

```java
// Object must have getter
public class Order {
    private Double totalAmount;
    
    public Double getTotalAmount() {  // Required
        return totalAmount;
    }
}
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Common Utilities](../core-common/common-util.md)
- [Testing Framework](../core-common/core-test.md)
