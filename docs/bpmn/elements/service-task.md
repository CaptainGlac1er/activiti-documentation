---
sidebar_label: Service Task
title: "Service Task"
slug: /bpmn/elements/service-task
description: Complete guide to ServiceTask elements with Activiti customizations for automated processing
---

# Service Task

Service Tasks represent **automated work** performed by the system, such as calling external services, executing business logic, or integrating with other systems.

## Overview

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:process id="serviceTaskProcess" name="Service Task Process"
    xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
    xmlns:activiti="http://activiti.org/bpmn">
  
  <bpmn:serviceTask id="service1" name="Process Payment">
    <!-- Activiti customizations -->
  </bpmn:serviceTask>
  
</bpmn:process>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Rich integration capabilities

## Key Features

### Standard BPMN Features
- **Implementation** - Service interface and operation
- **Input/Output Data** - Data associations
- **Operation Reference** - External service operation
- **Multi-instance** - Parallel executions

### Activiti Customizations
- **Class Implementation** - Direct Java class execution
- **Delegate Expression** - Spring bean integration
- **Expression** - EL expression execution
- **Field Injection** - Dependency injection
- **Operation Reference** - Connector support
- **DMN Integration** - Decision engine
- **Mail Task** - Email sending
- **Async Execution** - Background jobs
- **Custom Properties** - Metadata extension
- **Skip Expression** - Conditional execution
- **Retry Configuration** - Job retry policies

## Implementation Types

Activiti 8 supports **two primary ways** to implement service tasks, plus legacy syntax for backward compatibility. The recommended approach uses the standard BPMN `implementation` attribute with Spring bean references.

### 1. Spring Bean Reference (RECOMMENDED for Activiti 8)

Use the standard BPMN `implementation` attribute to reference a Spring bean:

```xml
<serviceTask id="tagImageTask" 
             name="Tag Image"
             implementation="tagImageConnector"/>
```

**How it actually works:** The core engine's `ServiceTaskParseHandler` routes plain `implementation` values to `DefaultActivityBehaviorFactory.createDefaultServiceTaskBehavior()`, which wraps the behavior as the expression `${defaultServiceTaskBehavior}`. The Spring bean `defaultServiceTaskBehavior` (provided by `ConnectorsAutoConfiguration`) receives the `ServiceTask` at runtime and reads `serviceTask.getImplementation()` to determine which connector bean to invoke. The value in `implementation` is **not** directly looked up as a bean name by the core engine — it's passed through the `defaultServiceTaskBehavior` routing layer, which resolves it to a `Connector` bean from the ApplicationContext.

#### For Connector Implementations (Activiti 7/8 API Layer):

```java
import org.activiti.api.process.runtime.connector.Connector;
import org.activiti.api.process.model.IntegrationContext;
import org.springframework.stereotype.Component;

@Component("tagImageConnector")
public class TagImageConnector implements Connector {

    @Autowired
    private ImageService imageService;

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        // Access input variables
        String imageUrl = context.getInBoundVariable("imageUrl");

        // Business logic
        imageService.tagImage(imageUrl);

        // Return output variables
        context.addOutBoundVariable("tagged", true);
        return context;
    }
}
```

**Or using lambda (as shown in official examples):**

```java
@Component("tagImageConnector")
public class TagImageConnector {

    public Connector connector() {
        return integrationContext -> {
            String imageUrl = integrationContext.getInBoundVariable("imageUrl");
            // Business logic...
            integrationContext.addOutBoundVariable("tagged", true);
            return integrationContext;
        };
    }
}
```

#### For JavaDelegate Implementations (Legacy but Still Supported):

```java
import org.activiti.engine.delegate.JavaDelegate;
import org.activiti.engine.delegate.DelegateExecution;
import org.springframework.stereotype.Component;

@Component("paymentService")
public class PaymentService implements JavaDelegate {
    
    @Autowired
    private PaymentGateway gateway;
    
    @Override
    public void execute(DelegateExecution execution) {
        // Get process variables
        String orderId = (String) execution.getVariable("orderId");
        Double amount = (Double) execution.getVariable("amount");
        
        // Business logic
        PaymentResult result = gateway.process(orderId, amount);
        
        // Set output variables
        execution.setVariable("paymentResult", result);
        execution.setVariable("transactionId", result.getTransactionId());
    }
}
```

**Usage:**
```xml
<serviceTask id="paymentTask" 
             name="Process Payment"
             activiti:delegateExpression="${paymentService}"/>
```

**Important:** `implementation="beanName"` is routed through `defaultServiceTaskBehavior` which resolves the bean name to a `Connector`. For `JavaDelegate`, you must use `activiti:delegateExpression="${beanName}"` instead.

**Benefits:**
- ✅ Full Spring dependency injection (`@Autowired`)
- ✅ Backward compatible with Activiti 5/6/7/8
- ✅ Works with extension JSON variable mappings

**Connector Bean with Dot in Name:**

The `implementation` attribute value is passed to the `defaultServiceTaskBehavior` router, which looks up the Spring bean name. If your bean name contains a dot, it's simply part of the bean name — there is no special parsing of the dot notation:

```xml
<serviceTask id="getMovieTask" 
             name="Get Movie Description"
             implementation="Movies.getMovieDesc"/>
```

The `defaultServiceTaskBehavior` router resolves `Movies.getMovieDesc` as a Spring bean name. The dot is just part of the bean name.

**Connector Bean Definition:**

```java
import org.activiti.api.process.runtime.connector.Connector;
import org.activiti.api.process.model.IntegrationContext;
import org.springframework.stereotype.Component;

@Component("Movies.getMovieDesc")
public class MoviesConnector implements Connector {

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        // Access input variables
        String movieId = context.getInBoundVariable("movieId");

        // Business logic - call external API
        String description = fetchMovieDescription(movieId);

        // Return output variables
        context.addOutBoundVariable("movieDescription", description);
        return context;
    }

    private String fetchMovieDescription(String movieId) {
        // Implementation...
        return "Movie description";
    }
}
```

**Using Connector with Extension JSON:**

Connectors work seamlessly with extension JSON for variable mapping:

```json
{
  "id": "movieProcess",
  "extensions": {
    "Process_movieProcess": {
      "mappings": {
        "getMovieTask": {
          "inputs": {
            "movieId": {
              "type": "VARIABLE",
              "value": "selectedMovie"
            }
          },
          "outputs": {
            "movieDescription": {
              "type": "VARIABLE",
              "value": "description"
            }
          }
        }
      }
    }
  }
}
```

**Benefits of Connectors:**
- ✅ Clean separation of integration logic
- ✅ Reusable across multiple processes
- ✅ Works with extension JSON variable mappings
- ✅ Supports input/output variable transformation
- ✅ Ideal for REST APIs, email, external services

### 2. Legacy Activiti Extensions (Activiti 5/6 Style - Still Supported)

Activiti 8 maintains backward compatibility with Activiti 5/6 syntax using the `activiti:` namespace. **These are still fully supported** but not recommended for new development.

#### Legacy `activiti:class` (Direct Class Instantiation)

For direct class instantiation without Spring beans:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:process id="legacyProcess"
    xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
    xmlns:activiti="http://activiti.org/bpmn">
  
  <serviceTask id="legacyTask" 
               name="Legacy Service"
               activiti:class="com.example.LegacyService"/>
</bpmn:process>
```

**Legacy JavaDelegate Interface (Activiti 5/6):**
```java
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.JavaDelegate;

public class LegacyService implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        String orderId = (String) execution.getVariable("orderId");
        execution.setVariable("result", "processed");
    }
}
```

**Use Cases for `activiti:class`:**
- Direct class instantiation (no Spring bean required)
- Simple utility classes
- Backward compatibility with Activiti 5/6
- Classes that cannot be Spring-managed

**Note:** You cannot use `@Autowired`; the engine instantiates the class directly. Use field injection via `<activiti:field>` if needed.

#### Legacy `activiti:delegateExpression`

```xml
<serviceTask id="legacyBeanTask" 
             name="Legacy Bean Service"
             activiti:delegateExpression="${legacyService}"/>
```

**Spring Bean:**
```java
@Component("legacyService")
public class LegacyBeanService implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) {
        // Legacy implementation
    }
}
```

#### Legacy `activiti:expression`

```xml
<serviceTask id="legacyExpression" 
             name="Legacy Expression"
              activiti:expression="${calculator.compute()}"
              activiti:resultVariableName="computationResult"/>
```

**⚠️ Legacy Syntax Note:**
- Legacy syntax uses `JavaDelegate` and `DelegateExecution` (Activiti 5/6/7/8 API)
- Modern syntax uses `Connector` interface (Activiti 8+)
- Legacy attributes require `<xmlns:activiti="http://activiti.org/bpmn">` namespace
- **Recommendation:** Use `implementation="beanName"` with `Connector` for new development
- **Status:** Legacy syntax is still fully supported for backward compatibility

### Comparison Table

| Feature | `implementation="beanName"` | Legacy `activiti:class` | Legacy `activiti:delegateExpression` | Legacy `activiti:expression` |
|---------|----------------------------|------------------------|-------------------------------------|-----------------------------|
| **Bean Type** | `Connector` | `JavaDelegate` | `JavaDelegate` | N/A (EL expression) |
| **Spring Bean** | Required (`@Component`, routed via `defaultServiceTaskBehavior`) | Not required | Required (`@Component`) | Required (`@Component`) |
| **Dependency Injection** | ✅ `@Autowired` | ❌ No (field injection only) | ✅ `@Autowired` | ✅ `@Autowired` |
| **Interface** | `Connector` | `JavaDelegate` | `JavaDelegate` | N/A |
| **Execution API** | `apply(context)` | `execute(execution)` | `execute(execution)` | EL evaluation |
| **Use Case** | Modern integrations & logic | Direct instantiation | Legacy Spring beans | Quick inline expressions |
| **Activiti Version** | 8+ (recommended) | 5/6/7/8 (still supported) | 5/6/7/8 (still supported) | 5/6/7/8 (still supported) |
| **Namespace Required** | No | Yes (`activiti:`) | Yes (`activiti:`) | Yes (`activiti:`) |
| **Format** | `beanName` | Full class name | `${beanName}` | `${beanName.method()}` |
| **Status** | ✅ Current | ⚠️ Legacy (not deprecated) | ⚠️ Legacy (not deprecated) | ⚠️ Legacy (not deprecated) |

### Migration Example

**From Legacy (Activiti 6):**
```xml
<!-- OLD -->
<serviceTask activiti:class="com.example.PaymentService"/>
```

```java
public class PaymentService implements JavaDelegate {
    public void execute(DelegateExecution execution) {
        execution.setVariable("result", "done");
    }
}
```

**To Modern (Activiti 8) - Using Connector:**
```xml
<!-- NEW - Recommended -->
<serviceTask implementation="paymentService"/>
```

```java
@Component("paymentService")
public class PaymentService implements Connector {
    @Autowired
    private PaymentGateway gateway;

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        String orderId = context.getInBoundVariable("orderId");
        // Business logic...
        context.addOutBoundVariable("result", "done");
        return context;
    }
}
```

**Or Using `activiti:delegateExpression` with JavaDelegate (Legacy):**
```xml
<!-- For JavaDelegate, use activiti:delegateExpression -->
<serviceTask id="paymentTask" 
             name="Process Payment"
             activiti:delegateExpression="${paymentService}"/>
```

```java
@Component("paymentService")
public class PaymentService implements JavaDelegate {
    @Autowired
    private PaymentGateway gateway;
    
    @Override
    public void execute(DelegateExecution execution) {
        execution.setVariable("result", "done");
    }
}
```

**Key Changes:**
1. Remove `activiti:` namespace prefix
2. Change `class` to `implementation`
3. Use bean name instead of full class name
4. Add `@Component` annotation with bean name
5. Use `@Autowired` instead of field injection
6. **Recommended:** Use `Connector` interface with `implementation="beanName"` for new development
7. **Note:** `implementation="beanName"` only works with `Connector` beans. For `JavaDelegate`, use `activiti:delegateExpression="${beanName}"` instead.

### 3. Field Injection (Legacy - Use Spring @Autowired Instead)

**Modern Approach:** Use Spring's `@Autowired` in your bean:

```java
@Component("orderService")
public class OrderService implements JavaDelegate {

    @Autowired
    private EmailService emailService;

    @Value("${order.currency:USD}")
    private String currency;

    @Override
    public void execute(DelegateExecution execution) {
        // Use injected dependencies
        emailService.sendOrderConfirmation(execution.getVariable("orderId", String.class));
    }
}
```

**Legacy Approach (Activiti 5/6 Style - Still Supported):**

For backward compatibility, Activiti supports field injection via XML:

```xml
<serviceTask id="orderService" 
             name="Process Order"
             activiti:class="com.example.OrderService">
  
  <extensionElements>
    <!-- String value -->
    <activiti:field name="emailTemplate" stringValue="order_confirmation.html"/>
    
    <!-- Expression -->
    <activiti:field name="currency" expression="${order.currency}"/>
  </extensionElements>
</serviceTask>
```

**Legacy Java Class with Field Injection:**
```java
public class OrderService implements JavaDelegate {

    private String emailTemplate;
    private String currency;

    @Override
    public void execute(DelegateExecution execution) {
        // Use injected fields
    }

    // Setters required for field injection
    public void setEmailTemplate(String emailTemplate) {
        this.emailTemplate = emailTemplate;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
```

**⚠️ Recommendation:** Prefer Spring's `@Autowired` and `@Value` annotations over XML field injection for better type safety and IDE support.

### 4. Connector Implementation

Use connectors for external integrations like email, REST APIs, messaging systems, etc.

#### Built-in Connectors (Legacy Syntax Only)

Activiti includes some built-in connectors that **only work with legacy XML syntax**.

**Mail Connector (Legacy - Still Supported):**

```xml
<serviceTask id="sendEmail"
             name="Send Email"
             activiti:type="mail">
  
  <extensionElements>
    <activiti:field name="to">
      <activiti:expression>${recipientEmail}</activiti:expression>
    </activiti:field>
    
    <activiti:field name="subject">
      <activiti:string>Notification</activiti:string>
    </activiti:field>
    
    <activiti:field name="text">
      <activiti:expression>${emailContent}</activiti:expression>
    </activiti:field>
    
    <!-- Optional fields -->
    <activiti:field name="cc">
      <activiti:expression>${ccEmails}</activiti:expression>
    </activiti:field>
    
    <activiti:field name="html">
      <activiti:expression>${htmlContent}</activiti:expression>
    </activiti:field>
  </extensionElements>
</serviceTask>

**Other Built-in Connector Types (Legacy Only):**
- `activiti:type="mule"` - Mule ESB integration
- `activiti:type="camel"` - Apache Camel routes
- `activiti:type="shell"` - Execute shell commands

#### Custom Connectors (Modern Approach - Recommended)

For email and other integrations, create your own Connector bean for full Spring integration:

**BPMN:**
```xml
<serviceTask id="sendEmail" 
             name="Send Email"
             implementation="emailConnector"/>
```

**Java Implementation:**
```java
import org.activiti.api.process.runtime.connector.Connector;
import org.activiti.api.process.model.IntegrationContext;
import org.springframework.stereotype.Component;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

@Component("emailConnector")
public class EmailConnector implements Connector {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${mail.from.address:noreply@company.com}")
    private String fromAddress;

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        String to = context.getInBoundVariable("to");
        String subject = context.getInBoundVariable("subject");
        String text = context.getInBoundVariable("text");

        try {
            javax.mail.Message message = mailSender.createMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text);

            mailSender.send(message);

            context.addOutBoundVariable("emailSent", true);
            return context;
        } catch (Exception e) {
            context.addOutBoundVariable("emailSent", false);
            context.addOutBoundVariable("error", e.getMessage());
            return context;
        }
    }
}
```

**Extension JSON for Variable Mapping:**
```json
{
  "id": "notificationProcess",
  "extensions": {
    "Process_notificationProcess": {
      "mappings": {
        "sendEmail": {
          "inputs": {
            "to": {
              "type": "VARIABLE",
              "value": "customerEmail"
            },
            "subject": {
              "type": "VALUE",
              "value": "Order Confirmation"
            },
            "text": {
              "type": "VARIABLE",
              "value": "emailTemplate"
            }
          },
          "outputs": {
            "emailSent": {
              "type": "VARIABLE",
              "value": "sent"
            }
          }
        }
      }
    }
  }
}
```

**Benefits of Custom Connectors:**
- ✅ Full Spring dependency injection (`@Autowired`)
- ✅ Better error handling and logging
- ✅ More flexibility (attachments, templates, etc.)
- ✅ Works with extension JSON variable mappings
- ✅ Easier to test and maintain
- ✅ Type-safe with IDE support

**Recommendation:** For new development, create custom Connector beans instead of relying on built-in legacy connectors. The built-in mail connector is maintained for backward compatibility but lacks modern Spring integration features.

## Advanced Features

### Async Execution

Run service tasks in the background:

**Modern Syntax:**
```xml
<serviceTask id="longRunningService" 
             name="Process Large Dataset"
             implementation="batchProcessor"
             activiti:async="true"/>
```

**Legacy Syntax (Activiti 5/6 Style - Still Supported):**
```xml
<serviceTask id="longRunningService" 
             name="Process Large Dataset"
             activiti:class="com.example.BatchProcessor"
             activiti:async="true"/>
```

**Note:** Job expiry is configured via Management Service or job executor settings, not through BPMN attributes.

**Use Cases:**
- Long-running operations
- External system calls
- Batch processing
- Non-critical path activities

### Job Retry Configuration

Configure retry policies for failed jobs:

**Modern Syntax:**
```xml
<serviceTask id="unreliableService" 
             name="Call External API"
              implementation="externalApiService"
              activiti:async="true">
   
   <extensionElements>
     <!-- Retry 5 times -->
    <activiti:failedJobRetryTimeCycle>R/5</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>
```

**Or with exponential backoff:**
```xml
<serviceTask id="unreliableService" 
              implementation="externalApiService"
              activiti:async="true">
   <extensionElements>
     <activiti:failedJobRetryTimeCycle>R5/PT1M;R3/PT5M;R2/PT30M</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>
```

**Legacy Syntax (Activiti 5/6 Style - Still Supported):**
```xml
<serviceTask id="unreliableService" 
             activiti:async="true"
             activiti:class="com.example.ExternalApiService">
  <extensionElements>
    <activiti:failedJobRetryTimeCycle>R5/PT1M;R3/PT5M;R2/PT30M</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>
```

**Retry Cycle Syntax:**
- `R/5` - Retry 5 times immediately
- `R5/PT1M` - Retry 5 times with 1 minute interval
- `R3/PT5M;R2/PT30M` - Retry 3 times (5min), then 2 times (30min)

### Skip Expression

Conditionally skip service execution:

**Modern Syntax:**
```xml
<serviceTask id="optionalService" 
             name="Enrich Data"
              implementation="dataEnricher"
              activiti:skipExpression="${!enrichData}"/>
```

**Legacy Syntax (Activiti 5/6 Style - Still Supported):**
```xml
<serviceTask id="optionalService" 
             name="Enrich Data"
             activiti:class="com.example.DataEnricher"
             activiti:skipExpression="${!enrichData}"/>
```

### Custom Properties

Add metadata using `<activiti:field>` elements:

**Modern Syntax:**
```xml
<serviceTask id="customService" 
             name="Custom Processing"
             implementation="customService">
   
  <extensionElements>
    <activiti:field name="department">
      <activiti:string>finance</activiti:string>
    </activiti:field>
    <activiti:field name="version">
      <activiti:string>2.0</activiti:string>
    </activiti:field>
    <activiti:field name="sla">
      <activiti:string>PT1H</activiti:string>
    </activiti:field>
  </extensionElements>
</serviceTask>
```

**Legacy Syntax (Activiti 5/6 Style - Still Supported):**
```xml
<serviceTask id="customService" 
             name="Custom Processing"
             activiti:class="com.example.CustomService">
   
  <extensionElements>
    <activiti:field name="department">
      <activiti:string>finance</activiti:string>
    </activiti:field>
    <activiti:field name="version">
      <activiti:string>2.0</activiti:string>
    </activiti:field>
    <activiti:field name="sla">
      <activiti:string>PT1H</activiti:string>
    </activiti:field>
  </extensionElements>
</serviceTask>
```

### Execution Listeners

Hook into execution lifecycle:

**Modern Syntax:**
```xml
<serviceTask id="trackedService" 
             name="Tracked Service"
             implementation="trackedService">
   
  <extensionElements>
    <activiti:executionListener event="start" class="com.example.StartTracker"/>
    <activiti:executionListener event="end" delegateExpression="${endTracker}"/>
  </extensionElements>
</serviceTask>
```

**Legacy Syntax (Activiti 5/6 Style - Still Supported):**
```xml
<serviceTask id="trackedService" 
             name="Tracked Service"
             activiti:class="com.example.TrackedService">
   
  <extensionElements>
    <activiti:executionListener event="start" class="com.example.StartTracker"/>
    <activiti:executionListener event="end" delegateExpression="${endTracker}"/>
  </extensionElements>
</serviceTask>
```

**Supported Events:**
- `start` - Before the service task executes
- `end` - After the service task completes

### Boundary Events

Handle exceptions (boundary events are siblings, not children):

**Modern Syntax:**
```xml
<serviceTask id="riskyService" 
             name="External Call"
              implementation="externalService"
              activiti:async="true"/>

<!-- Error boundary event -->
<boundaryEvent id="errorHandler" attachedToRef="riskyService" cancelActivity="true">
  <errorEventDefinition errorRef="ExternalServiceError"/>
</boundaryEvent>

<!-- Timer boundary event -->
<boundaryEvent id="timeoutHandler" attachedToRef="riskyService" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT30S</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

**Legacy Syntax (Activiti 5/6 Style - Still Supported):**
```xml
<serviceTask id="riskyService" 
             name="External Call"
             activiti:class="com.example.ExternalService"
             activiti:async="true"/>

<!-- Error boundary event -->
<boundaryEvent id="errorHandler" attachedToRef="riskyService" cancelActivity="true">
  <errorEventDefinition errorRef="ExternalServiceError"/>
</boundaryEvent>

<!-- Timer boundary event -->
<boundaryEvent id="timeoutHandler" attachedToRef="riskyService" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT30S</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

## Complete Examples

### Example 1: Payment Processing with Retry

**BPMN:**
```xml
<serviceTask id="processPayment" 
             name="Process Payment"
             implementation="paymentProcessor"
             activiti:async="true"/>

<!-- Error boundary event -->
<boundaryEvent id="paymentError" attachedToRef="processPayment" cancelActivity="true">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>

<!-- Timeout boundary event -->
<boundaryEvent id="paymentTimeout" attachedToRef="processPayment" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT60S</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

**Java Implementation (Connector):**
```java
@Component("paymentProcessor")
public class PaymentProcessor implements Connector {

    @Autowired
    private PaymentGateway paymentGateway;

    @Value("${payment.currency:USD}")
    private String currency;

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        String orderId = context.getInBoundVariable("orderId");
        Double amount = context.getInBoundVariable("amount", Double.class);

        // Process payment
        PaymentResult result = paymentGateway.process(orderId, amount, currency);

        // Configure retry in application.yml or via extension JSON
        context.addOutBoundVariable("paymentResult", result);
        return context;
    }
}
```

**Extension JSON for Retry Configuration:**
```json
{
  "id": "paymentProcess",
  "extensions": {
    "Process_paymentProcess": {
      "constants": {
        "processPayment": {
          "retryCycle": {
            "value": "R3/PT1M;R2/PT5M"
          }
        }
      }
    }
  }
}
```

### Example 2: Multi-Service Orchestration

**BPMN:**
```xml
<!-- Service 1: Validate Order -->
<serviceTask id="validateOrder" 
             name="Validate Order"
             implementation="orderValidator"/>

<!-- Service 2: Check Inventory -->
<serviceTask id="checkInventory" 
             name="Check Inventory"
             implementation="inventoryService"/>

<!-- Service 3: Reserve Stock -->
<serviceTask id="reserveStock" 
             name="Reserve Stock"
             implementation="inventoryService"
             activiti:async="true"/>

<!-- Service 4: Send Confirmation (Using Custom Email Connector) -->
<serviceTask id="sendConfirmation" 
             name="Send Confirmation"
             implementation="emailConnector"/>
```

**Java Implementation for Email Connector:**
```java
@Component("emailConnector")
public class EmailConnector implements Connector {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${mail.from.address:noreply@company.com}")
    private String fromAddress;

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        String to = context.getInBoundVariable("to");
        String subject = context.getInBoundVariable("subject");
        String message = context.getInBoundVariable("message");

        try {
            javax.mail.Message msg = mailSender.createMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true);
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(message);

            mailSender.send(msg);
            context.addOutBoundVariable("emailSent", true);
            return context;
        } catch (Exception e) {
            context.addOutBoundVariable("emailSent", false);
            context.addOutBoundVariable("error", e.getMessage());
            return context;
        }
    }
}

// Other service implementations
@Component("orderValidator")
public class OrderValidator implements Connector {
    @Override
    public IntegrationContext apply(IntegrationContext context) {
        // Validation logic
        context.addOutBoundVariable("validationResult", true);
        return context;
    }
}

@Component("inventoryService")
public class InventoryService implements Connector {
    @Autowired
    private InventoryRepository inventoryRepo;

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        // Inventory logic
        context.addOutBoundVariable("inStock", true);
        return context;
    }
}
```

**Alternative: Using Legacy Built-in Mail Task**

If you prefer the built-in mail functionality (legacy syntax only):

```xml
<sendTask id="sendConfirmation" 
          name="Send Confirmation"
          activiti:type="mail">
  
  <extensionElements>
    <activiti:field name="to">
      <activiti:expression>${customer.email}</activiti:expression>
    </activiti:field>
    
    <activiti:field name="subject">
       <activiti:expression>Order Confirmation: ${order.id}</activiti:expression>
     </activiti:field>
    
    <activiti:field name="text">
      <activiti:expression>${emailTemplate}</activiti:expression>
    </activiti:field>
  </extensionElements>
</sendTask>
```

**⚠️ Note:** The built-in mail task only works with legacy `activiti:type="mail"` syntax. For modern development, create a custom Connector bean as shown above.

**Extension JSON for Variable Mapping:**
```json
{
  "id": "orderProcess",
  "extensions": {
    "Process_orderProcess": {
      "mappings": {
        "validateOrder": {
          "inputs": {
            "orderId": { "type": "VARIABLE", "value": "orderId" }
          },
          "outputs": {
            "validationResult": { "type": "VARIABLE", "value": "isValid" }
          }
        },
        "checkInventory": {
          "inputs": {
            "items": { "type": "VARIABLE", "value": "orderItems" }
          }
        },
        "sendConfirmation": {
          "inputs": {
            "to": { "type": "VARIABLE", "value": "customer.email" },
            "subject": { "type": "VALUE", "value": "Order Confirmation: ${order.id}" },
            "message": { "type": "VARIABLE", "value": "emailTemplate" }
          },
          "outputs": {
            "emailSent": { "type": "VARIABLE", "value": "sent" }
          }
        }
      }
    }
  }
}
```

### Example 3: REST API Integration

**BPMN:**
```xml
<serviceTask id="callExternalAPI" 
             name="Fetch Customer Data"
             implementation="restApiClient"
             activiti:async="true"/>
```

**Java Implementation:**
```java
@Component("restApiClient")
public class RestApiClient implements Connector {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${api.customer.url}")
    private String apiUrl;

    @Value("${api.customer.key}")
    private String apiKey;

    @Override
    public IntegrationContext apply(IntegrationContext context) {
        String customerId = context.getInBoundVariable("customerId");

        // Call REST API
        CustomerData data = restTemplate.getForObject(
            apiUrl + "/" + customerId,
            CustomerData.class,
            apiKey
        );

        context.addOutBoundVariable("customerData", data);
        return context;
    }
}
```

**application.yml Configuration:**
```yaml
api:
  customer:
    url: https://api.company.com/customers
    key: ${CUSTOMER_API_KEY}
```

**Legacy Examples (Still Supported):**

For reference, here's how these examples would look using legacy syntax:

```xml
<!-- Legacy: Payment Processing -->
<serviceTask id="processPayment" 
             activiti:class="com.example.PaymentProcessor"
             activiti:async="true">
  <extensionElements>
    <activiti:field name="paymentGateway" expression="${stripePaymentGateway}"/>
    <activiti:failedJobRetryTimeCycle>R3/PT1M;R2/PT5M</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>

<!-- Legacy: Using delegateExpression -->
<serviceTask id="validateOrder" 
             activiti:delegateExpression="${orderValidator.validate()}"
              activiti:resultVariableName="validationResult"/>
```

**Why Modern Approach is Better:**
- ✅ No XML field injection (use `@Autowired` instead)
- ✅ Cleaner separation of concerns (BPMN for flow, Java for logic, JSON for mappings)
- ✅ Type-safe with Spring dependency injection
- ✅ Easier to test and maintain
- ✅ Works seamlessly with extension JSON

```java
import org.activiti.engine.delegate.JavaDelegate;

public class RestApiClient implements JavaDelegate {
    
    private String apiKey;
    
    @Override
    public void execute(DelegateExecution execution) {
        String customerId = (String) execution.getVariable("customerId");
        
        // Call REST API
        CustomerData data = fetchCustomerData(customerId, apiKey);
        
        // Set result variable
        execution.setVariable("externalCustomerData", data);
    }
    
    private CustomerData fetchCustomerData(String customerId, String apiKey) {
        // REST API implementation
        return null;
    }
    
    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }
}
```

```xml
<!-- Error boundary event -->
<boundaryEvent id="apiError" attachedToRef="callExternalAPI" cancelActivity="true">
  <errorEventDefinition errorRef="ExternalApiError"/>
</boundaryEvent>
```

## Runtime API Usage

### Executing Service Tasks

Service tasks execute automatically when reached in the process flow. You can control them via:

```java
// Get job information (for async tasks)
List<Job> jobs = managementService.createJobQuery()
    .processInstanceId(processInstanceId)
    .list();

// Retry failed job
managementService.retryJob(jobId);

// Delete job
managementService.deleteJob(jobId);

// Update job retry time
managementService.setJobRetries(jobId, 3);
```

### Testing Service Tasks

Use `ActivitiMockSupport` to replace service task delegates with mocks:

```java
public class PaymentServiceTest extends ActivitiTestCase {

    @Test
    public void testPaymentService() {
        // Mock the delegate
        mockSupport().mockServiceTaskWithClassDelegate(
            "com.example.PaymentProcessor",
            MockPaymentProcessor.class
        );
        
        // Start process
        ProcessInstance process = runtimeService.startProcessInstanceByKey("paymentProcess");
        
        // Verify execution
        verify(mockPaymentProcessor).execute(any());
    }
}
```

For JUnit 4/5 with `ActivitiRule` or `@Rule`, use the `@MockServiceTask` annotation instead:

```java
public class PaymentServiceTest {
    
    @Rule
    public ActivitiRule activitiRule = new ActivitiRule();

    @Test
    @MockServiceTask(id = "processPayment", 
                      originalClassName = "com.example.PaymentProcessor",
                      mockedClassName = MockPaymentProcessor.class.getName())
    public void testPaymentService() {
        ProcessInstance process = runtimeService.startProcessInstanceByKey("paymentProcess");
        // Process will use MockPaymentProcessor for the "processPayment" task
    }
}
```

## Best Practices

1. **Use Async for Long Operations:** Prevent blocking the process engine
2. **Configure Retry Policies:** Handle transient failures gracefully
3. **Add Boundary Events:** Implement error handling at task level
4. **Dependency Injection:** Use Spring `@Autowired` in `Connector` beans; use `activiti:field` only with `activiti:class` (legacy)
5. **Result Variables:** Store outputs for downstream activities
6. **Execution Listeners:** Add monitoring and logging
7. **Skip Expressions:** Implement conditional logic
8. **Transaction Management:** Ensure atomicity for critical operations
9. **Idempotency:** Design services to handle retries safely
10. **Monitoring:** Track job execution and failures

## Common Pitfalls

- **Synchronous Long Operations:** Blocks process engine threads
- **No Error Handling:** Uncaught exceptions fail the process
- **Missing Retry Configuration:** Transient failures cause permanent issues
- **Complex Logic in Expressions:** Hard to debug and maintain
- **Stateful Delegates:** Thread safety issues in multi-tenant environments
- **No Transaction Management:** Data inconsistency risks

## Error Handling Patterns

### Pattern 1: Try-Catch with Boundary Event

```xml
<serviceTask id="riskyOperation" activiti:class="com.example.RiskyService"/>

<boundaryEvent id="catchError" attachedToRef="riskyOperation" cancelActivity="true">
  <errorEventDefinition errorRef="OperationError"/>
</boundaryEvent>
```

### Pattern 2: Retry with Exponential Backoff

```xml
<serviceTask id="unreliableService" 
             activiti:async="true"
             activiti:class="com.example.UnreliableService">
  <extensionElements>
    <activiti:failedJobRetryTimeCycle>R1/PT10S;R2/PT1M;R2/PT5M;R1/PT30M</activiti:failedJobRetryTimeCycle>
  </extensionElements>
</serviceTask>
```

### Pattern 3: Compensation

> **Note:** Activiti does not support `activiti:forCompensation` on ServiceTasks. Compensation is handled via BPMN compensation boundary events with `compensateEventDefinition`.

```xml
<!-- Mark task as compensable via compensation boundary event -->
<serviceTask id="reserveResource" 
             activiti:class="com.example.ResourceReserver"/>

<!-- Compensation handler triggered via boundary event -->
<boundaryEvent id="compensationBoundary" attachedToRef="reserveResource" 
               cancelActivity="false">
  <compensateEventDefinition activityRef="reserveResource"/>
</boundaryEvent>

<serviceTask id="compensateReservation" 
             activiti:class="com.example.ResourceCompensator"/>
```

## Related Documentation

- [User Task](./user-task.md)
- [Script Task](./script-task.md)
- [Business Rule Task](./business-rule-task.md)
- [Async Execution](../reference/async-execution.md)
- [Connectors](../integration/connectors.md)
- [DMN in Business Rule Tasks](./business-rule-task.md#pattern-3-dmn-integration-via-service-task-alternative)

---

