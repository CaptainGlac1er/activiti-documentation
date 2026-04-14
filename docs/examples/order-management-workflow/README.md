---
sidebar_label: Order Management Workflow
slug: /examples/order-management-workflow
title: "Order Management Workflow - Complete Example"
description: "A moderate-sized BPMN application demonstrating 45+ elements across 4 processes with comprehensive extension JSON files, service delegates, and REST API integration."
---

# Order Management Workflow - Complete Example

This example demonstrates a **moderate-sized BPMN application** with **45+ BPMN elements** across **4 processes**, comprehensive extension JSON files, and production-ready Java implementation.

## Overview

The Order Management Workflow system handles complete e-commerce order processing from customer validation through shipping and delivery. This example showcases:

- **4 Processes**: 1 main process + 3 sub-processes (call activities)
- **45-60 BPMN Elements**: Tasks, gateways, events, sequence flows
- **4 Extension JSON Files**: 200+ lines total with properties, mappings, and constants
- **15+ Service Delegates**: Spring beans implementing business logic
- **REST API**: Controller for process initiation and monitoring

## Project Structure

```
order-management-workflow/
├── bpmn/
│   ├── orderManagementProcess.bpmn      # Main process (25 elements)
│   ├── paymentProcess.bpmn              # Payment sub-process (12 elements)
│   ├── inventoryProcess.bpmn            # Inventory sub-process (10 elements)
│   └── shippingProcess.bpmn             # Shipping sub-process (12 elements)
├── extensions/
│   ├── orderManagementProcess-extension.json
│   ├── paymentProcess-extension.json
│   ├── inventoryProcess-extension.json
│   └── shippingProcess-extension.json
├── src/main/
│   ├── java/com/example/ordermanagement/
│   │   ├── OrderManagementApplication.java
│   │   ├── config/
│   │   │   └── ServiceProperties.java          # Configuration properties
│   │   ├── controllers/
│   │   │   └── OrderController.java
│   │   └── services/
│   │       ├── CreditScoreService.java
│   │       ├── InvoiceService.java
│   │       ├── EmailService.java
│   │       ├── OrderStatusService.java
│   │       ├── PaymentValidationService.java
│   │       ├── PaymentProcessingService.java
│   │       ├── ReceiptService.java
│   │       ├── AccountingNotificationService.java
│   │       ├── StockCheckService.java
│   │       ├── InventoryReservationService.java
│   │       ├── WarehouseUpdateService.java
│   │       ├── SupplierNotificationService.java
│   │       ├── ShippingLabelService.java
│   │       ├── PriorityPickupService.java
│   │       ├── RegularPickupService.java
│   │       ├── TrackingUpdateService.java
│   │       └── DeliveryConfirmationService.java
│   └── resources/
│       └── application.yml
└── README.md
```

## Process Architecture

### 1. Main Process: Order Management (25 elements)

**File**: `orderManagementProcess.bpmn`

**Flow**:
```
Start Event (Message: New Order)
  ↓
User Task: Validate Customer Information (with 30-min timeout boundary event)
  ↓
Exclusive Gateway: Customer Valid?
  ├─ No → End Event (Terminated)
  └─ Yes ↓
Service Task: Check Credit Score (with error boundary event)
  ↓
Exclusive Gateway: Credit Approved?
  ├─ No → User Task: Manual Credit Review → Gateway → End (Rejected)
  └─ Yes ↓
Call Activity: paymentProcess
  ↓
Call Activity: inventoryProcess
  ↓
Parallel Gateway (Split)
  ├─ Service Task: Generate Invoice
  ├─ Service Task: Send Order Confirmation Email
  └─ User Task: Quality Check (with escalation boundary event)
  ↓
Parallel Gateway (Join)
  ↓
Call Activity: shippingProcess
  ↓
Service Task: Update Order Status
  ↓
End Event (Completed)
```

**BPMN Elements**:
- 1 Start Event (message-triggered)
- 5 End Events (1 normal, 4 terminate)
- 4 User Tasks
- 5 Service Tasks
- 2 Call Activities
- 4 Exclusive Gateways
- 2 Parallel Gateways
- 3 Boundary Events (timer, error, message)
- 15+ Sequence Flows

### 2. Payment Process (12 elements)

**File**: `paymentProcess.bpmn`

**Features**:
- Multi-instance retry pattern (up to 3 attempts)
- Async service task with timeout
- Parallel accounting notification

### 3. Inventory Process (10 elements)

**File**: `inventoryProcess.bpmn`

**Features**:
- Parallel warehouse update and supplier notification
- Backorder approval workflow

### 4. Shipping Process (12 elements)

**File**: `shippingProcess.bpmn`

**Features**:
- Exclusive gateway for shipping method selection
- Message intermediate event for delivery confirmation
- Three parallel paths (Express, Standard, Store Pickup)

## Extension JSON Files

### Properties (Process Variables)

Each extension file defines 15-20 properties with type safety:

```json
"properties": {
  "orderId-id": {
    "id": "orderId-id",
    "name": "orderId",
    "type": "string",
    "required": true,
    "value": ""
  },
  "orderTotal-id": {
    "id": "orderTotal-id",
    "name": "orderTotal",
    "type": "bigdecimal",
    "required": true,
    "value": 0
  },
  "orderItems-id": {
    "id": "orderItems-id",
    "name": "orderItems",
    "type": "json",
    "required": true,
    "value": []
  }
}
```

**Supported Types**: `string`, `integer`, `bigdecimal`, `boolean`, `json`, `date`

### Mappings (Variable Transformation)

Comprehensive input/output mappings for 25+ activities:

```json
"mappings": {
  "validateCustomerTask": {
    "inputs": {
      "customerName": {
        "type": "VARIABLE",
        "value": "customerName"
      }
    },
    "outputs": {
      "customerValid": {
        "type": "VARIABLE",
        "value": "validationResult"
      }
    }
  },
  "paymentCallActivity": {
    "inputs": {
      "orderId": {
        "type": "VARIABLE",
        "value": "orderId"
      }
    },
    "outputs": {
      "paymentStatus": {
        "type": "VARIABLE",
        "value": "paymentStatus"
      }
    }
  }
}
```

**Mapping Types**:
- `variable`: Map from another variable
- `value`: Constant literal value

### Constants (Configuration Values)

Environment-specific configuration:

```json
"constants": {
  "checkCreditScoreTask": {
    "creditBureauApi": {
      "value": "https://api.creditbureau.com/v1"
    },
    "minCreditScore": {
      "value": "650"
    }
  },
  "processPaymentTask": {
    "paymentGateway": {
      "value": "https://api.stripe.com/v1"
    },
    "apiKey": {
      "value": "${STRIPE_API_KEY}"
    }
  }
}
```

## Service Task Delegates

All service tasks use Spring beans implementing the `Connector` interface and inject configuration from `ServiceProperties`:

```java
@Component("creditScoreService")
public class CreditScoreService implements Connector {
    
    @Autowired
    private ServiceProperties serviceProperties;
    
    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        // Access input variables
        String customerId = (String) integrationContext.getInBoundVariables().get("customerId");
        
        // Use configuration from application.yml
        int minScore = serviceProperties.getCreditBureau().getMinCreditScore();
        String apiUrl = serviceProperties.getCreditBureau().getApiUrl();
        
        // Business logic
        int creditScore = calculateCreditScore(customerId);
        boolean approved = creditScore >= minScore;
        
        // Set output variables
        integrationContext.addOutBoundVariable("score", creditScore);
        integrationContext.addOutBoundVariable("approved", approved);
        integrationContext.addOutBoundVariable("minRequiredScore", minScore);
        
        return integrationContext;
    }
}
```

### Configuration Properties

The `ServiceProperties` class binds to the `services` prefix in `application.yml`:

```java
@Configuration
@ConfigurationProperties(prefix = "services")
public class ServiceProperties {
    private CreditBureau creditBureau;
    private Payment payment;
    private Inventory inventory;
    private Shipping shipping;
    private Email email;
    // getters and setters
}
```

This allows services to read configuration values like:
- `serviceProperties.getCreditBureau().getApiUrl()` → `https://api.creditbureau.com/v1`
- `serviceProperties.getPayment().getGateway()` → `https://api.stripe.com/v1`
- `serviceProperties.getShipping().getProvider()` → `fedex`
- `serviceProperties.getEmail().getSmtpServer()` → `smtp.company.com`

**15 Service Delegates**:
1. `CreditScoreService` - Credit validation
2. `InvoiceService` - Invoice generation
3. `EmailService` - Email notifications
4. `OrderStatusService` - Status updates
5. `PaymentValidationService` - Payment validation
6. `PaymentProcessingService` - Payment execution
7. `ReceiptService` - Receipt generation
8. `AccountingNotificationService` - Accounting integration
9. `StockCheckService` - Inventory checks
10. `InventoryReservationService` - Stock reservation
11. `WarehouseUpdateService` - Warehouse system
12. `SupplierNotificationService` - Supplier alerts
13. `ShippingLabelService` - Label generation
14. `PriorityPickupService` - Express shipping
15. `RegularPickupService` - Standard shipping
16. `TrackingUpdateService` - Tracking system
17. `DeliveryConfirmationService` - Delivery notifications

## REST API

### Start Order Process

```bash
POST /api/orders
Content-Type: application/json

{
  "orderId": "ORD-001",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "orderTotal": 299.99,
  "orderItems": [
    {"productId": "P001", "quantity": 2},
    {"productId": "P002", "quantity": 1}
  ],
  "customerAddress": {
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "shippingMethod": "EXPRESS"
}
```

**Response**:
```json
{
  "processInstanceId": "abc123-def456-ghi789",
  "orderId": "ORD-001",
  "status": "RUNNING"
}
```

### Get Order Status

```bash
GET /api/orders/{orderId}
```

## Configuration

### application.yml

The `application.yml` file configures both Spring Boot/Activiti and external services:

```yaml
spring:
  activiti:
    bpmn-enable-history-level: full
    db-schema-update: true
    async-executor-activate: true
    deployment-enabled: true

# External service configurations - bound to ServiceProperties
services:
  credit-bureau:
    api-url: https://api.creditbureau.com/v1
    timeout: 30000
    min-credit-score: 650
  
  payment:
    gateway: https://api.stripe.com/v1
    api-key: ${STRIPE_API_KEY:sk_test_placeholder}
    timeout: 30000
    currency: USD
  
  inventory:
    system-url: https://inventory.company.com/api
    min-stock-threshold: 10
  
  shipping:
    provider: fedex
    api-url: https://api.fedex.com/v1
  
  email:
    smtp-server: smtp.company.com
    from-address: orders@company.com
```

### ServiceProperties Configuration Class

The `ServiceProperties` class uses `@ConfigurationProperties` to bind YAML values:

```java
@Configuration
@ConfigurationProperties(prefix = "services")
public class ServiceProperties {
    private CreditBureau creditBureau;
    private Payment payment;
    private Inventory inventory;
    private Shipping shipping;
    private Email email;
    // getters and setters
}
```

Services inject and use this configuration:

```java
@Component("creditScoreService")
public class CreditScoreService implements JavaDelegator {
    
    @Autowired
    private ServiceProperties serviceProperties;
    
    @Override
    public void execute() {
        // Read configuration
        int minScore = serviceProperties.getCreditBureau().getMinCreditScore();
        String apiUrl = serviceProperties.getCreditBureau().getApiUrl();
        
        // Use in business logic
        boolean approved = creditScore >= minScore;
    }
}
```
```

## Running the Example

### Prerequisites

- Java 17+
- Maven 3.6+
- H2 Database (included)

### Build and Run

```bash
# Build the project
mvn clean package

# Run the application
mvn spring-boot:run
```

### Start an Order

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-001",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "orderTotal": 299.99,
    "orderItems": [],
    "customerAddress": {},
    "shippingMethod": "STANDARD"
  }'
```

## Key Features Demonstrated

### 1. Multi-Process Architecture
- Main process orchestrates 3 sub-processes via call activities
- Variable passing between processes
- Independent sub-process execution

### 2. Error Handling
- Boundary events for timeouts (30-min validation timeout)
- Error boundary events for service failures
- Terminate end events for failed paths

### 3. Parallel Execution
- Parallel gateways for concurrent operations
- Invoice generation, email sending, and quality check run simultaneously
- Warehouse update and supplier notification in parallel

### 4. Multi-Instance Patterns
- Payment retry with up to 3 attempts
- Sequential multi-instance with completion condition

### 5. Complex Variable Mappings
- 25+ activity mappings
- Input/output variable transformation
- Constants for configuration

### 6. Message Correlation
- Message start event for order initiation
- Message intermediate event for delivery confirmation
- Message boundary event for escalation

### 7. External Service Configuration
- All services read configuration from `application.yml`
- `ServiceProperties` class with `@ConfigurationProperties`
- Environment-specific values via property placeholders
- Services log configuration values for debugging

## Testing

### Unit Tests

```java
@SpringBootTest
class OrderManagementIntegrationTest {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @Test
    void shouldCompleteOrderSuccessfully() {
        // Start process
        ProcessInstance instance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("orderManagementProcess")
                .withVariable("orderId", "TEST-001")
                .withVariable("customerName", "Test Customer")
                .withVariable("orderTotal", new BigDecimal("100.00"))
                .build()
        );
        
        // Verify process started
        assertNotNull(instance.getId());
        assertEquals(ProcessInstanceStatus.ACTIVE, instance.getStatus());
        
        // Complete tasks and verify end-to-end flow
        // ...
    }
}
```

## Best Practices Illustrated

1. **Separation of Concerns**: BPMN for flow, extension JSON for variables, Java for logic
2. **Type Safety**: All variables have explicit types
3. **Configuration Management**: Constants for environment-specific values
4. **Error Handling**: Boundary events for graceful failure
5. **Async Processing**: Long-running tasks marked as async
6. **Parallel Execution**: Independent operations run concurrently
7. **Reusability**: Sub-processes can be called from multiple places

## Common Patterns

### Pattern 1: Validation with Timeout
```xml
<userTask id="validateTask">
  <boundaryEvent id="timeout" cancelActivity="true">
    <timerEventDefinition>
      <timeDuration>PT30M</timeDuration>
    </timerEventDefinition>
  </boundaryEvent>
</userTask>
```

### Pattern 2: Service Task with Connector
```xml
<serviceTask id="checkCreditScore" name="Check Credit Score" implementation="creditScoreService"/>
```

### Pattern 3: Parallel Operations
```xml
<parallelGateway id="split"/>
<serviceTask id="task1"/>
<serviceTask id="task2"/>
<serviceTask id="task3"/>
<parallelGateway id="join"/>
```

## Extension

This example can be extended with:

- **DMN Integration**: Add decision tables for credit scoring
- **Form Integration**: Add task forms for user tasks
- **Connectors**: Replace service delegates with HTTP connectors
- **Event Sub-Processes**: Add compensation for order cancellation
- **Signal Events**: Cross-process communication
- **Ad-hoc Sub-Processes**: Flexible quality check steps

## Related Documentation

- [Process Extensions Guide](../bpmn/advanced/process-extensions.md)
- [Call Activities](../bpmn/elements/call-activity.md)
- [Multi-Instance](../bpmn/advanced/multi-instance.md)
- [Boundary Events](../bpmn/events/boundary-event.md)
- [Parallel Gateways](../bpmn/gateways/parallel-gateway.md)

---

**Total BPMN Elements**: 45-60  
**Extension JSON Lines**: 200+  
**Service Delegates**: 17  
**Complexity**: Moderate to Advanced  
**Use Case**: E-commerce Order Management
