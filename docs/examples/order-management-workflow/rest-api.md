---
sidebar_label: REST API
slug: /examples/order-management/rest-api
title: "Order Management - REST API"
description: "RESTful API endpoints for initiating and monitoring order management workflows with complete request/response examples."
---

# REST API

The Order Management Workflow exposes RESTful endpoints for process initiation, monitoring, and interaction. This document provides complete API documentation with request/response examples.

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | POST | Start a new order process |
| `/api/orders/{orderId}` | GET | Get order status |
| `/api/process-instances/{processId}` | GET | Get process instance details |
| `/api/tasks` | GET | List available tasks |
| `/api/tasks/{taskId}` | GET | Get task details |
| `/api/tasks/{taskId}/complete` | POST | Complete a task |

**Base URL:** `http://localhost:8080` (default)

**Content-Type:** `application/json`

---

## Start Order Process

Initiates a new order management workflow instance.

### Request

```http
POST /api/orders
Content-Type: application/json
```

**JSON Body:**
```json
{
  "orderId": "ORD-2024-001",
  "customerName": "John Doe",
  "customerEmail": "john.doe@example.com",
  "orderTotal": 299.99,
  "orderItems": [
    {
      "productId": "PROD-001",
      "productName": "Wireless Headphones",
      "quantity": 1,
      "unitPrice": 149.99
    },
    {
      "productId": "PROD-002",
      "productName": "Phone Case",
      "quantity": 2,
      "unitPrice": 75.00
    }
  ],
  "customerAddress": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "shippingMethod": "EXPRESS"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | String | Yes | Unique order identifier |
| `customerName` | String | Yes | Customer full name |
| `customerEmail` | String | Yes | Customer email address |
| `orderTotal` | BigDecimal | Yes | Total order amount |
| `orderItems` | Array | Yes | List of order items |
| `orderItems[].productId` | String | Yes | Product identifier |
| `orderItems[].productName` | String | No | Product name |
| `orderItems[].quantity` | Integer | Yes | Quantity ordered |
| `orderItems[].unitPrice` | BigDecimal | No | Unit price |
| `customerAddress` | Object | Yes | Shipping address |
| `customerAddress.street` | String | Yes | Street address |
| `customerAddress.city` | String | Yes | City |
| `customerAddress.state` | String | No | State/Province |
| `customerAddress.zip` | String | Yes | Postal code |
| `customerAddress.country` | String | Yes | Country |
| `shippingMethod` | String | No | Shipping method (default: STANDARD) |

**Shipping Methods:**
- `EXPRESS` - Next-day delivery
- `STANDARD` - 3-5 business days
- `STORE_PICKUP` - Customer collects from store

### Response

**Success (200 OK):**
```json
{
  "processInstanceId": "1234567890abcdef",
  "orderId": "ORD-2024-001",
  "status": "RUNNING"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `processInstanceId` | String | Activiti process instance ID |
| `orderId` | String | Business key (order ID) |
| `status` | String | Process status (RUNNING) |

### cURL Example

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2024-001",
    "customerName": "John Doe",
    "customerEmail": "john.doe@example.com",
    "orderTotal": 299.99,
    "orderItems": [
      {
        "productId": "PROD-001",
        "quantity": 1
      }
    ],
    "customerAddress": {
      "street": "123 Main St",
      "city": "New York",
      "zip": "10001",
      "country": "USA"
    },
    "shippingMethod": "STANDARD"
  }'
```

### Java Example

```java
import org.activiti.api.process.model.ProcessInstance;
import org.activiti.api.process.runtime.ProcessRuntime;
import org.activiti.api.process.runtime.ProcessPayloadBuilder;

@Service
public class OrderService {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    public ProcessInstance startOrder(StartOrderRequest request) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("orderId", request.getOrderId());
        variables.put("customerName", request.getCustomerName());
        variables.put("customerEmail", request.getCustomerEmail());
        variables.put("orderTotal", request.getOrderTotal());
        variables.put("orderItems", request.getOrderItems());
        variables.put("customerAddress", request.getCustomerAddress());
        variables.put("selectedShippingMethod", request.getShippingMethod());
        
        return processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("orderManagementProcess")
                .withBusinessKey(request.getOrderId())
                .withVariables(variables)
                .build()
        );
    }
}
```

---

## Get Order Status

Retrieves the current status of an order process.

### Request

```http
GET /api/orders/{orderId}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | String | Order ID (business key) |

### Response

**Success (200 OK):**
```json
{
  "id": "1234567890abcdef",
  "processDefinitionId": "orderManagementProcess:1:abc123",
  "processDefinitionKey": "orderManagementProcess",
  "businessKey": "ORD-2024-001",
  "status": "RUNNING",
  "startDate": "2024-01-15T10:30:00Z",
  "endDate": null,
  "variables": {
    "orderId": "ORD-2024-001",
    "customerName": "John Doe",
    "orderStatus": "IN_PROGRESS",
    "paymentStatus": "PAID",
    "inventoryStatus": "RESERVED"
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Process instance ID |
| `processDefinitionKey` | String | Process definition key |
| `businessKey` | String | Business key (order ID) |
| `status` | String | Process status |
| `startDate` | DateTime | Process start time |
| `endDate` | DateTime | Process end time (null if running) |
| `variables` | Object | Current process variables |

**Process Statuses:**
- `RUNNING` - Process is active
- `COMPLETED` - Process finished successfully
- `TERMINATED` - Process ended abnormally

### cURL Example

```bash
curl http://localhost:8080/api/orders/ORD-2024-001
```

---

## Get Process Instance Details

Retrieves detailed information about a process instance by its Activiti ID.

### Request

```http
GET /api/process-instances/{processId}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `processId` | String | Activiti process instance ID |

### Response

**Success (200 OK):**
```json
{
  "id": "1234567890abcdef",
  "processDefinitionId": "orderManagementProcess:1:abc123",
  "processDefinitionKey": "orderManagementProcess",
  "processDefinitionName": "Order Management Process",
  "businessKey": "ORD-2024-001",
  "status": "RUNNING",
  "startDate": "2024-01-15T10:30:00Z",
  "endDate": null,
  "tenantId": null,
  "startUserId": null,
  "variables": {
    "orderId": "ORD-2024-001",
    "customerName": "John Doe",
    "customerEmail": "john.doe@example.com",
    "orderTotal": 299.99,
    "customerValid": true,
    "creditScore": 720,
    "creditApproved": true,
    "paymentStatus": "PAID",
    "inventoryStatus": "RESERVED",
    "inStock": true,
    "orderStatus": "IN_PROGRESS"
  },
  "activeActivities": [
    {
      "id": "updateOrderStatusTask",
      "name": "Update Order Status",
      "type": "SERVICE_TASK"
    }
  ]
}
```

---

## List Available Tasks

Retrieves all tasks available for the current user or system.

### Request

```http
GET /api/tasks
```

**Query Parameters (optional):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `assignee` | String | Filter by assignee |
| `candidateUser` | String | Filter by candidate user |
| `candidateGroup` | String | Filter by candidate group |
| `processInstanceId` | String | Filter by process instance |

### Response

**Success (200 OK):**
```json
[
  {
    "id": "task-001",
    "name": "Validate Customer Information",
    "processInstanceId": "1234567890abcdef",
    "processDefinitionKey": "orderManagementProcess",
    "assignee": null,
    "candidateUsers": ["customer.validator"],
    "candidateGroups": ["validation.team"],
    "creationTime": "2024-01-15T10:30:15Z",
    "dueDate": "2024-01-15T11:00:15Z",
    "priority": 50,
    "variables": {
      "orderId": "ORD-2024-001",
      "customerName": "John Doe",
      "customerEmail": "john.doe@example.com"
    }
  },
  {
    "id": "task-002",
    "name": "Quality Check",
    "processInstanceId": "1234567890abcdef",
    "processDefinitionKey": "orderManagementProcess",
    "assignee": null,
    "candidateUsers": [],
    "candidateGroups": ["quality.team"],
    "creationTime": "2024-01-15T10:35:00Z",
    "dueDate": "2024-01-15T12:35:00Z",
    "priority": 50,
    "variables": {
      "orderId": "ORD-2024-001",
      "paymentStatus": "PAID",
      "inventoryStatus": "RESERVED"
    }
  }
]
```

### cURL Examples

```bash
# Get all tasks
curl http://localhost:8080/api/tasks

# Get tasks for specific user
curl "http://localhost:8080/api/tasks?candidateUser=john.doe"

# Get tasks for specific group
curl "http://localhost:8080/api/tasks?candidateGroup=validation.team"

# Get tasks for specific process instance
curl "http://localhost:8080/api/tasks?processInstanceId=1234567890abcdef"
```

---

## Get Task Details

Retrieves detailed information about a specific task.

### Request

```http
GET /api/tasks/{taskId}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `taskId` | String | Task ID |

### Response

**Success (200 OK):**
```json
{
  "id": "task-001",
  "name": "Validate Customer Information",
  "description": "Verify customer information before processing order",
  "processInstanceId": "1234567890abcdef",
  "processDefinitionKey": "orderManagementProcess",
  "businessKey": "ORD-2024-001",
  "assignee": null,
  "owner": null,
  "candidateUsers": ["customer.validator"],
  "candidateGroups": ["validation.team"],
  "creationTime": "2024-01-15T10:30:15Z",
  "dueDate": "2024-01-15T11:00:15Z",
  "priority": 50,
  "formKey": null,
  "variables": {
    "orderId": "ORD-2024-001",
    "customerName": "John Doe",
    "customerEmail": "john.doe@example.com",
    "customerAddress": {
      "street": "123 Main St",
      "city": "New York",
      "zip": "10001",
      "country": "USA"
    }
  }
}
```

---

## Complete Task

Completes a user task with optional output variables.

### Request

```http
POST /api/tasks/{taskId}/complete
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `taskId` | String | Task ID |

**JSON Body:**
```json
{
  "customerValid": true,
  "validationResult": "PASSED",
  "validatedCustomerData": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "verified": true
  },
  "comments": "Customer information verified successfully"
}
```

**Request Fields (task-specific):**

**For "Validate Customer Information" task:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerValid` | Boolean | Yes | Validation result |
| `validationResult` | String | No | Validation status |
| `validatedCustomerData` | Object | No | Verified customer data |

**For "Quality Check" task:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `qualityPassed` | Boolean | Yes | Quality check result |
| `qualityNotes` | String | No | Quality notes |

**For "Manual Credit Review" task:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `manualApproved` | Boolean | Yes | Approval decision |
| `reviewComments` | String | No | Reviewer comments |

### Response

**Success (204 No Content):**
```http
HTTP/1.1 204 No Content
```

**Error (400 Bad Request):**
```json
{
  "error": "Invalid task completion",
  "message": "Missing required variable: customerValid"
}
```

### cURL Example

```bash
curl -X POST http://localhost:8080/api/tasks/task-001/complete \
  -H "Content-Type: application/json" \
  -d '{
    "customerValid": true,
    "validationResult": "PASSED",
    "validatedCustomerData": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "verified": true
    }
  }'
```

---

## Receive Message

Sends a message to a running process instance (e.g., delivery confirmation).

### Request

```http
POST /api/messages/receive
Content-Type: application/json
```

**JSON Body:**
```json
{
  "messageName": "ShipmentDelivered",
  "correlationKey": "ORD-2024-001",
  "variables": {
    "deliveredAt": "2024-01-16T14:30:00Z",
    "signedBy": "J. Smith",
    "deliveryLocation": "Front Door"
  }
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageName` | String | Yes | Message name to receive |
| `correlationKey` | String | No | Correlation key (if defined in BPMN) |
| `businessKey` | String | No | Business key to match process instance |
| `variables` | Object | No | Message variables |

**Supported Messages:**
- `ShipmentDelivered` - Delivery confirmation (shipping process)
- `EscalationRequest` - Task escalation (quality check)
- `NewOrder` - Start new order (main process)

### Response

**Success (204 No Content):**
```http
HTTP/1.1 204 No Content
```

### cURL Example

```bash
# Delivery confirmation from carrier webhook
curl -X POST http://localhost:8080/api/messages/receive \
  -H "Content-Type: application/json" \
  -d '{
    "messageName": "ShipmentDelivered",
    "businessKey": "ORD-2024-001",
    "variables": {
      "deliveredAt": "2024-01-16T14:30:00Z",
      "signedBy": "J. Smith",
      "deliveryLocation": "Front Door"
    }
  }'
```

### Java Implementation

```java
import org.activiti.api.process.model.builders.MessagePayloadBuilder;
import org.activiti.api.process.runtime.ProcessRuntime;

@Service
public class MessageService {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    public void receiveDeliveryConfirmation(String orderId, DeliveryEvent event) {
        processRuntime.receive(
            MessagePayloadBuilder.receive("ShipmentDelivered")
                .withBusinessKey(orderId)
                .withVariable("deliveredAt", event.getDeliveredAt())
                .withVariable("signedBy", event.getSignedBy())
                .withVariable("deliveryLocation", event.getLocation())
                .build()
        );
    }
}
```

### Controller Implementation

```java
@RestController
@RequestMapping("/api/messages")
public class MessageController {
    
    @Autowired
    private ProcessRuntime processRuntime;
    
    @PostMapping("/receive")
    public ResponseEntity<Void> receiveMessage(@RequestBody ReceiveMessageRequest request) {
        processRuntime.receive(
            MessagePayloadBuilder.receive(request.getMessageName())
                .withBusinessKey(request.getBusinessKey())
                .withCorrelationKey(request.getCorrelationKey())
                .withVariables(request.getVariables())
                .build()
        );
        return ResponseEntity.noContent().build();
    }
}

class ReceiveMessageRequest {
    private String messageName;
    private String correlationKey;
    private String businessKey;
    private Map<String, Object> variables;
    
    // getters and setters
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Missing required field: orderId",
  "details": {
    "field": "orderId",
    "reason": "Required for process initiation"
  }
}
```

**Common Causes:**
- Missing required fields
- Invalid data types
- Invalid shipping method

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Order not found: ORD-999"
}
```

**Common Causes:**
- Invalid order ID
- Process instance doesn't exist
- Task not found

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Failed to start process",
  "details": {
    "exception": "ProcessEngineException",
    "reason": "Process definition not deployed"
  }
}
```

**Common Causes:**
- Process not deployed
- Database connection failure
- Service delegate exception

---

## Controller Implementation

Complete REST controller implementation:

```java
package com.example.ordermanagement.controllers;

import org.activiti.api.process.model.ProcessInstance;
import org.activiti.api.process.runtime.ProcessRuntime;
import org.activiti.api.process.runtime.ProcessPayloadBuilder;
import org.activiti.api.task.model.Task;
import org.activiti.api.task.runtime.TaskRuntime;
import org.activiti.api.task.runtime.TaskPayloadBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private ProcessRuntime processRuntime;
    
    @Autowired
    private TaskRuntime taskRuntime;

    @PostMapping
    public ResponseEntity<Map<String, Object>> startOrder(@RequestBody StartOrderRequest request) {
        logger.info("Starting order process for: {}", request.getOrderId());
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("orderId", request.getOrderId());
        variables.put("customerName", request.getCustomerName());
        variables.put("customerEmail", request.getCustomerEmail());
        variables.put("orderTotal", request.getOrderTotal());
        variables.put("orderItems", request.getOrderItems());
        variables.put("customerAddress", request.getCustomerAddress());
        variables.put("selectedShippingMethod", request.getShippingMethod());
        
        ProcessInstance processInstance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("orderManagementProcess")
                .withBusinessKey(request.getOrderId())
                .withVariables(variables)
                .build()
        );
        
        logger.info("Order process started: ID={}, BusinessKey={}", 
            processInstance.getId(), processInstance.getBusinessKey());
        
        Map<String, Object> response = new HashMap<>();
        response.put("processInstanceId", processInstance.getId());
        response.put("orderId", request.getOrderId());
        response.put("status", processInstance.getStatus());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ProcessInstance> getOrderStatus(@PathVariable String orderId) {
        logger.info("Getting status for order: {}", orderId);
        
        // Query by business key
        var processInstances = processRuntime.processInstanceQuery()
            .businessKey(orderId)
            .list();
        
        if (processInstances.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(processInstances.get(0));
    }
}

// Request DTO
class StartOrderRequest {
    private String orderId;
    private String customerName;
    private String customerEmail;
    private BigDecimal orderTotal;
    private Object orderItems;
    private Object customerAddress;
    private String shippingMethod = "STANDARD";
    
    // Getters and setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    
    public BigDecimal getOrderTotal() { return orderTotal; }
    public void setOrderTotal(BigDecimal orderTotal) { this.orderTotal = orderTotal; }
    
    public Object getOrderItems() { return orderItems; }
    public void setOrderItems(Object orderItems) { this.orderItems = orderItems; }
    
    public Object getCustomerAddress() { return customerAddress; }
    public void setCustomerAddress(Object customerAddress) { this.customerAddress = customerAddress; }
    
    public String getShippingMethod() { return shippingMethod; }
    public void setShippingMethod(String shippingMethod) { this.shippingMethod = shippingMethod; }
}
```

---

## Testing with Postman

### Collection Setup

1. **Create Collection:** "Order Management API"
2. **Base URL Variable:** `{{baseUrl}}` = `http://localhost:8080`

### Request Examples

**Start Order:**
```
POST {{baseUrl}}/api/orders
Body (JSON):
{
  "orderId": "ORD-TEST-001",
  "customerName": "Test Customer",
  "customerEmail": "test@example.com",
  "orderTotal": 199.99,
  "orderItems": [
    {
      "productId": "PROD-001",
      "quantity": 1
    }
  ],
  "customerAddress": {
    "street": "123 Test St",
    "city": "Test City",
    "zip": "12345",
    "country": "USA"
  },
  "shippingMethod": "STANDARD"
}
```

**Get Order Status:**
```
GET {{baseUrl}}/api/orders/ORD-TEST-001
```

**Complete Task:**
```
POST {{baseUrl}}/api/tasks/{{taskId}}/complete
Body (JSON):
{
  "customerValid": true,
  "validationResult": "PASSED"
}
```

---

## Next Steps

- [Overview](summary.md) - Return to example overview
- [Main Process](main-process.md) - Process workflow details

---

**Related Documentation:**
- [Process Runtime API](../../api-reference/activiti-api/process-runtime.md)
- [Task Runtime API](../../api-reference/activiti-api/task-runtime.md)
- [Message Event]( ../../api-reference/activiti-api/process-model.md#messageeventpayload)
