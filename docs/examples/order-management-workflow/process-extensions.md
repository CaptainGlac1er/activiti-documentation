---
sidebar_label: Process Extensions
slug: /examples/order-management/process-extensions
title: "Order Management - Process Extensions"
description: "Complete guide to process extension JSON files including properties, mappings, and constants configuration."
---

# Process Extensions

Process extensions in Activiti provide a declarative way to define process variables, input/output mappings, and configuration constants. This document explains the extension JSON files used in the Order Management Workflow.

## Overview

Each BPMN process has a corresponding extension JSON file:

| Process | Extension File |
|---------|---------------|
| Order Management | `orderManagementProcess-extension.json` |
| Payment | `paymentProcess-extension.json` |
| Inventory | `inventoryProcess-extension.json` |
| Shipping | `shippingProcess-extension.json` |

## Extension JSON Structure

```json
{
  "id": "processId",
  "name": "Process Name",
  "type": "PROCESS",
  "extensions": {
    "Process_processId": {
      "properties": { },
      "mappings": { },
      "constants": { }
    }
  }
}
```

**Three Main Sections:**
1. **Properties** - Process variable definitions with types
2. **Mappings** - Input/output variable transformations for activities
3. **Constants** - Configuration values for service tasks

---

## Properties (Process Variables)

Properties define process variables with type safety and validation.

### Property Structure

```json
"variableName-id": {
  "id": "variableName-id",
  "name": "variableName",
  "type": "string",
  "required": true,
  "value": ""
}
```

**Fields:**
- `id` - Unique identifier (internal use)
- `name` - Variable name used in process
- `type` - Data type (see supported types below)
- `required` - Whether variable must be provided
- `value` - Default value

### Supported Types

| Type | Java Class | Example | Description |
|------|-----------|---------|-------------|
| `string` | `String` | `"orderId"` | Text values |
| `integer` | `Integer` | `650` | Whole numbers |
| `boolean` | `Boolean` | `true` | True/false |
| `bigdecimal` | `BigDecimal` | `299.99` | Precise decimals (for currency) |
| `json` | `Map/List` | `{}` | Complex objects |
| `array` | `List` | `[]` | Arrays of values |
| `date` | `Date` | `"2024-01-15"` | Date values |
| `datetime` | `Date` | `"2024-01-15T10:30:00Z"` | DateTime values |
| `file` | `Map` | `{}` | File references |
| `folder` | `Map` | `{}` | Folder references |
| `content` | `Map` | `{}` | Content references |

**Source:** These types are registered in the [`ProcessExtensionsAutoConfiguration.variableTypeMap()`](file:///home/georgecolgrove/IdeaProjects/ActivitiDocumentation/Activiti/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/conf/ProcessExtensionsAutoConfiguration.java#L93-L108) method:

```java
@Bean
public Map<String, VariableType> variableTypeMap(ObjectMapper objectMapper,
                                                 DateFormatterProvider dateFormatterProvider) {
    Map<String, VariableType> variableTypeMap = new HashMap<>();
    variableTypeMap.put("boolean", new JavaObjectVariableType(Boolean.class));
    variableTypeMap.put("string", new JavaObjectVariableType(String.class));
    variableTypeMap.put("integer", new JavaObjectVariableType(Integer.class));
    variableTypeMap.put("bigdecimal", new BigDecimalVariableType());
    variableTypeMap.put("json", new JsonObjectVariableType(objectMapper));
    variableTypeMap.put("file", new JsonObjectVariableType(objectMapper));
    variableTypeMap.put("folder", new JsonObjectVariableType(objectMapper));
    variableTypeMap.put("content", new JsonObjectVariableType(objectMapper));
    variableTypeMap.put("date", new DateVariableType(Date.class, dateFormatterProvider));
    variableTypeMap.put("datetime", new DateVariableType(Date.class, dateFormatterProvider));
    variableTypeMap.put("array", new JsonObjectVariableType(objectMapper));
    return variableTypeMap;
}
```

**Variable Type Implementations:**
- [`JavaObjectVariableType`](file:///home/georgecolgrove/IdeaProjects/ActivitiDocumentation/Activiti/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/variable/types/JavaObjectVariableType.java) - For primitive types (string, integer, boolean)
- [`BigDecimalVariableType`](file:///home/georgecolgrove/IdeaProjects/ActivitiDocumentation/Activiti/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/variable/types/BigDecimalVariableType.java) - For precise decimal calculations
- [`JsonObjectVariableType`](file:///home/georgecolgrove/IdeaProjects/ActivitiDocumentation/Activiti/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/variable/types/JsonObjectVariableType.java) - For complex JSON structures
- [`DateVariableType`](file:///home/georgecolgrove/IdeaProjects/ActivitiDocumentation/Activiti/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/variable/types/DateVariableType.java) - For date/time values

### Order Management Process Variables

```json
"properties": {
  // Input variables (required at start)
  "orderId-id": {
    "id": "orderId-id",
    "name": "orderId",
    "type": "string",
    "required": true,
    "value": ""
  },
  "customerName-id": {
    "id": "customerName-id",
    "name": "customerName",
    "type": "string",
    "required": true,
    "value": ""
  },
  "customerEmail-id": {
    "id": "customerEmail-id",
    "name": "customerEmail",
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
  },
  
  // Intermediate variables (set during process)
  "customerValid-id": {
    "id": "customerValid-id",
    "name": "customerValid",
    "type": "boolean",
    "required": false,
    "value": false
  },
  "creditScore-id": {
    "id": "creditScore-id",
    "name": "creditScore",
    "type": "integer",
    "required": false,
    "value": 0
  },
  "creditApproved-id": {
    "id": "creditApproved-id",
    "name": "creditApproved",
    "type": "boolean",
    "required": false,
    "value": false
  },
  "paymentStatus-id": {
    "id": "paymentStatus-id",
    "name": "paymentStatus",
    "type": "string",
    "required": false,
    "value": "PENDING"
  },
  "inStock-id": {
    "id": "inStock-id",
    "name": "inStock",
    "type": "boolean",
    "required": false,
    "value": false
  },
  "qualityPassed-id": {
    "id": "qualityPassed-id",
    "name": "qualityPassed",
    "type": "boolean",
    "required": false,
    "value": false
  },
  
  // Output variables (final results)
  "trackingNumber-id": {
    "id": "trackingNumber-id",
    "name": "trackingNumber",
    "type": "string",
    "required": false,
    "value": ""
  },
  "invoiceNumber-id": {
    "id": "invoiceNumber-id",
    "name": "invoiceNumber",
    "type": "string",
    "required": false,
    "value": ""
  },
  "orderStatus-id": {
    "id": "orderStatus-id",
    "name": "orderStatus",
    "type": "string",
    "required": false,
    "value": "IN_PROGRESS"
  }
}
```

**Why define properties?**
- Type safety at runtime
- Documentation of expected variables
- Validation of required inputs
- Default values for optional variables

---

## Mappings (Variable Transformation)

Mappings define how variables flow into and out of activities (tasks, call activities, etc.).

### Mapping Structure

```json
"activityId": {
  "inputs": {
    "inputVariableName": {
      "type": "variable",
      "value": "sourceVariable"
    }
  },
  "outputs": {
    "outputVariableName": {
      "type": "variable",
      "value": "resultVariable"
    }
  }
}
```

**Mapping Types:**
- `variable` - Map from another process variable
- `value` - Constant literal value

### Input Mappings

Input mappings pass data from process variables to activity inputs.

**Example: Validate Customer Task**
```json
"validateCustomerTask": {
  "inputs": {
    "customerName": {
      "type": "variable",
      "value": "customerName"
    },
    "customerEmail": {
      "type": "variable",
      "value": "customerEmail"
    },
    "customerAddress": {
      "type": "variable",
      "value": "customerAddress"
    }
  },
  "outputs": {
    "customerValid": {
      "type": "variable",
      "value": "validationResult"
    },
    "customerData": {
      "type": "variable",
      "value": "validatedCustomerData"
    }
  }
}
```

**How it works:**
1. Process variables `customerName`, `customerEmail`, `customerAddress` are read
2. Passed as inputs to the `validateCustomerTask`
3. Task outputs `validationResult` and `validatedCustomerData`
4. Mapped back to process variables `customerValid` and `customerData`

**Example: Credit Score Service Task**
```json
"checkCreditScoreTask": {
  "inputs": {
    "customerId": {
      "type": "variable",
      "value": "customerName"
    },
    "orderAmount": {
      "type": "variable",
      "value": "orderTotal"
    }
  },
  "outputs": {
    "creditScore": {
      "type": "variable",
      "value": "score"
    },
    "creditApproved": {
      "type": "variable",
      "value": "approved"
    }
  }
}
```

**Variable renaming:**
- Process variable `customerName` → Input parameter `customerId`
- Process variable `orderTotal` → Input parameter `orderAmount`
- Service output `score` → Process variable `creditScore`
- Service output `approved` → Process variable `creditApproved`

### Call Activity Mappings

Call activities pass variables between parent and child processes.

**Example: Payment Process Call Activity**
```json
"paymentCallActivity": {
  "inputs": {
    "orderId": {
      "type": "variable",
      "value": "orderId"
    },
    "amount": {
      "type": "variable",
      "value": "orderTotal"
    },
    "customerEmail": {
      "type": "variable",
      "value": "customerEmail"
    }
  },
  "outputs": {
    "paymentStatus": {
      "type": "variable",
      "value": "paymentStatus"
    },
    "paymentResult": {
      "type": "variable",
      "value": "paymentDetails"
    }
  }
}
```

**Variable flow:**
```
Parent Process              Payment Sub-Process
─────────────              ───────────────────
orderId ────────────────→  orderId
orderTotal ────────────→  amount
customerEmail ─────────→  customerEmail
                         ↓ (payment processing)
paymentStatus ─────────←  paymentStatus
paymentDetails ───────←  paymentResult
```

**Example: Inventory Process Call Activity**
```json
"inventoryCallActivity": {
  "inputs": {
    "orderId": {
      "type": "variable",
      "value": "orderId"
    },
    "orderItems": {
      "type": "variable",
      "value": "orderItems"
    }
  },
  "outputs": {
    "inventoryStatus": {
      "type": "variable",
      "value": "inventoryStatus"
    },
    "inStock": {
      "type": "variable",
      "value": "inStock"
    }
  }
}
```

### Constant Value Mappings

Some inputs use constant values instead of variables.

**Example: Email Service with Constant Template**
```json
"sendConfirmationTask": {
  "inputs": {
    "recipient": {
      "type": "variable",
      "value": "customerEmail"
    },
    "orderId": {
      "type": "variable",
      "value": "orderId"
    },
    "customerName": {
      "type": "variable",
      "value": "customerName"
    },
    "orderTotal": {
      "type": "variable",
      "value": "orderTotal"
    },
    "invoiceNumber": {
      "type": "variable",
      "value": "invoiceNumber"
    },
    "emailTemplate": {
      "type": "value",
      "value": "order_confirmation"
    }
  }
}
```

**Note:** `emailTemplate` uses `"type": "value"` with a constant string `"order_confirmation"`.

**Example: Update Order Status with Constant**
```json
"updateOrderStatusTask": {
  "inputs": {
    "orderId": {
      "type": "variable",
      "value": "orderId"
    },
    "orderStatus": {
      "type": "value",
      "value": "COMPLETED"
    },
    "trackingNumber": {
      "type": "variable",
      "value": "trackingNumber"
    },
    "completionDate": {
      "type": "variable",
      "value": "currentDate"
    }
  },
  "outputs": {
    "orderStatus": {
      "type": "variable",
      "value": "updatedStatus"
    }
  }
}
```

**Note:** `orderStatus` input is constant `"COMPLETED"`, while output maps to `updatedStatus`.

---

## Constants (Configuration Values)

Constants provide environment-specific configuration for service tasks without hardcoding in BPMN.

### Constants Structure

```json
"activityId": {
  "configurationKey": {
    "value": "configurationValue"
  }
}
```

**Features:**
- Environment variable substitution: `${VARIABLE_NAME}`
- Default values for environment variables
- External service configuration
- Business rule parameters

### Credit Score Task Constants

```json
"checkCreditScoreTask": {
  "creditBureauApi": {
    "value": "https://api.creditbureau.com/v1"
  },
  "minCreditScore": {
    "value": "650"
  },
  "timeout": {
    "value": "30000"
  }
}
```

**Used in Service Delegate:**
```java
@Component("creditScoreService")
public class CreditScoreService implements Connector {
    
    @Autowired
    private ServiceProperties serviceProperties;
    
    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        // Access configuration
        int minScore = serviceProperties.getCreditBureau().getMinCreditScore(); // 650
        String apiUrl = serviceProperties.getCreditBureau().getApiUrl(); // https://api.creditbureau.com/v1
        
        // Business logic
        boolean approved = creditScore >= minScore;
        
        return integrationContext;
    }
}
```

### Payment Task Constants

```json
"processPaymentTask": {
  "paymentGateway": {
    "value": "https://api.stripe.com/v1"
  },
  "apiKey": {
    "value": "${STRIPE_API_KEY}"
  },
  "timeout": {
    "value": "30000"
  },
  "currency": {
    "value": "USD"
  }
}
```

**Environment Variable Substitution:**
- `${STRIPE_API_KEY}` - Resolved from environment at runtime
- Allows different keys for dev/staging/production
- Never commit sensitive values to source control

**Deployment Examples:**
```bash
# Development
export STRIPE_API_KEY="sk_test_..."

# Production
export STRIPE_API_KEY="sk_live_..."
```

### Invoice Task Constants

```json
"generateInvoiceTask": {
  "invoiceTemplate": {
    "value": "STANDARD_INVOICE"
  },
  "currency": {
    "value": "USD"
  },
  "invoicePrefix": {
    "value": "INV-"
  }
}
```

**Business Rule Configuration:**
- `invoiceTemplate` - Which invoice format to use
- `currency` - Default currency for invoices
- `invoicePrefix` - Prefix for invoice numbers (e.g., "INV-2024-001")

### Email Task Constants

```json
"sendConfirmationTask": {
  "smtpServer": {
    "value": "smtp.company.com"
  },
  "fromAddress": {
    "value": "orders@company.com"
  },
  "emailTemplate": {
    "value": "order_confirmation"
  }
}
```

**Email Configuration:**
- `smtpServer` - Mail server for sending emails
- `fromAddress` - Sender email address
- `emailTemplate` - Template name for email content

### Shipping Task Constants

```json
"generateShippingLabelTask": {
  "shippingProvider": {
    "value": "fedex"
  },
  "labelFormat": {
    "value": "PDF"
  },
  "apiUrl": {
    "value": "https://api.fedex.com/v1"
  }
}
```

**Shipping Configuration:**
- `shippingProvider` - Carrier (fedex, ups, dhl)
- `labelFormat` - Label output format (PDF, ZPL)
- `apiUrl` - Carrier API endpoint

---

## Complete Extension File Example

Here's the complete `orderManagementProcess-extension.json`:

```json
{
  "id": "orderManagementProcess",
  "name": "Order Management Workflow",
  "type": "PROCESS",
  "extensions": {
    "Process_orderManagementProcess": {
      "properties": {
        "orderId-id": {
          "id": "orderId-id",
          "name": "orderId",
          "type": "string",
          "required": true,
          "value": ""
        },
        "customerName-id": {
          "id": "customerName-id",
          "name": "customerName",
          "type": "string",
          "required": true,
          "value": ""
        },
        "customerEmail-id": {
          "id": "customerEmail-id",
          "name": "customerEmail",
          "type": "string",
          "required": true,
          "value": ""
        },
        "customerAddress-id": {
          "id": "customerAddress-id",
          "name": "customerAddress",
          "type": "json",
          "required": true,
          "value": {}
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
        },
        "customerValid-id": {
          "id": "customerValid-id",
          "name": "customerValid",
          "type": "boolean",
          "required": false,
          "value": false
        },
        "creditScore-id": {
          "id": "creditScore-id",
          "name": "creditScore",
          "type": "integer",
          "required": false,
          "value": 0
        },
        "creditApproved-id": {
          "id": "creditApproved-id",
          "name": "creditApproved",
          "type": "boolean",
          "required": false,
          "value": false
        },
        "manualApproved-id": {
          "id": "manualApproved-id",
          "name": "manualApproved",
          "type": "boolean",
          "required": false,
          "value": false
        },
        "paymentStatus-id": {
          "id": "paymentStatus-id",
          "name": "paymentStatus",
          "type": "string",
          "required": false,
          "value": "PENDING"
        },
        "paymentResult-id": {
          "id": "paymentResult-id",
          "name": "paymentResult",
          "type": "json",
          "required": false,
          "value": {}
        },
        "inventoryStatus-id": {
          "id": "inventoryStatus-id",
          "name": "inventoryStatus",
          "type": "string",
          "required": false,
          "value": "NOT_CHECKED"
        },
        "inStock-id": {
          "id": "inStock-id",
          "name": "inStock",
          "type": "boolean",
          "required": false,
          "value": false
        },
        "qualityPassed-id": {
          "id": "qualityPassed-id",
          "name": "qualityPassed",
          "type": "boolean",
          "required": false,
          "value": false
        },
        "shippingStatus-id": {
          "id": "shippingStatus-id",
          "name": "shippingStatus",
          "type": "string",
          "required": false,
          "value": "NOT_SHIPPED"
        },
        "trackingNumber-id": {
          "id": "trackingNumber-id",
          "name": "trackingNumber",
          "type": "string",
          "required": false,
          "value": ""
        },
        "invoiceNumber-id": {
          "id": "invoiceNumber-id",
          "name": "invoiceNumber",
          "type": "string",
          "required": false,
          "value": ""
        },
        "orderStatus-id": {
          "id": "orderStatus-id",
          "name": "orderStatus",
          "type": "string",
          "required": false,
          "value": "IN_PROGRESS"
        }
      },
      "mappings": {
        "validateCustomerTask": {
          "inputs": {
            "customerName": {
              "type": "variable",
              "value": "customerName"
            },
            "customerEmail": {
              "type": "variable",
              "value": "customerEmail"
            },
            "customerAddress": {
              "type": "variable",
              "value": "customerAddress"
            }
          },
          "outputs": {
            "customerValid": {
              "type": "variable",
              "value": "validationResult"
            },
            "customerData": {
              "type": "variable",
              "value": "validatedCustomerData"
            }
          }
        },
        "checkCreditScoreTask": {
          "inputs": {
            "customerId": {
              "type": "variable",
              "value": "customerName"
            },
            "orderAmount": {
              "type": "variable",
              "value": "orderTotal"
            }
          },
          "outputs": {
            "creditScore": {
              "type": "variable",
              "value": "score"
            },
            "creditApproved": {
              "type": "variable",
              "value": "approved"
            }
          }
        },
        "paymentCallActivity": {
          "inputs": {
            "orderId": {
              "type": "variable",
              "value": "orderId"
            },
            "amount": {
              "type": "variable",
              "value": "orderTotal"
            },
            "customerEmail": {
              "type": "variable",
              "value": "customerEmail"
            }
          },
          "outputs": {
            "paymentStatus": {
              "type": "variable",
              "value": "paymentStatus"
            },
            "paymentResult": {
              "type": "variable",
              "value": "paymentDetails"
            }
          }
        },
        "inventoryCallActivity": {
          "inputs": {
            "orderId": {
              "type": "variable",
              "value": "orderId"
            },
            "orderItems": {
              "type": "variable",
              "value": "orderItems"
            }
          },
          "outputs": {
            "inventoryStatus": {
              "type": "variable",
              "value": "inventoryStatus"
            },
            "inStock": {
              "type": "variable",
              "value": "inStock"
            }
          }
        },
        "generateInvoiceTask": {
          "inputs": {
            "orderId": {
              "type": "variable",
              "value": "orderId"
            },
            "customerName": {
              "type": "variable",
              "value": "customerName"
            },
            "customerAddress": {
              "type": "variable",
              "value": "customerAddress"
            },
            "orderItems": {
              "type": "variable",
              "value": "orderItems"
            },
            "orderTotal": {
              "type": "variable",
              "value": "orderTotal"
            }
          },
          "outputs": {
            "invoiceNumber": {
              "type": "variable",
              "value": "invoiceId"
            },
            "invoiceUrl": {
              "type": "variable",
              "value": "downloadUrl"
            }
          }
        },
        "sendConfirmationTask": {
          "inputs": {
            "recipient": {
              "type": "variable",
              "value": "customerEmail"
            },
            "orderId": {
              "type": "variable",
              "value": "orderId"
            },
            "customerName": {
              "type": "variable",
              "value": "customerName"
            },
            "orderTotal": {
              "type": "variable",
              "value": "orderTotal"
            },
            "invoiceNumber": {
              "type": "variable",
              "value": "invoiceNumber"
            },
            "emailTemplate": {
              "type": "value",
              "value": "order_confirmation"
            }
          }
        },
        "qualityCheckTask": {
          "inputs": {
            "orderId": {
              "type": "variable",
              "value": "orderId"
            },
            "orderItems": {
              "type": "variable",
              "value": "orderItems"
            },
            "paymentStatus": {
              "type": "variable",
              "value": "paymentStatus"
            },
            "inventoryStatus": {
              "type": "variable",
              "value": "inventoryStatus"
            }
          },
          "outputs": {
            "qualityPassed": {
              "type": "variable",
              "value": "passed"
            },
            "qualityNotes": {
              "type": "variable",
              "value": "notes"
            }
          }
        },
        "shippingCallActivity": {
          "inputs": {
            "orderId": {
              "type": "variable",
              "value": "orderId"
            },
            "customerAddress": {
              "type": "variable",
              "value": "customerAddress"
            },
            "orderItems": {
              "type": "variable",
              "value": "orderItems"
            },
            "shippingMethod": {
              "type": "variable",
              "value": "selectedShippingMethod"
            }
          },
          "outputs": {
            "shippingStatus": {
              "type": "variable",
              "value": "shippingStatus"
            },
            "trackingNumber": {
              "type": "variable",
              "value": "trackingNumber"
            }
          }
        },
        "updateOrderStatusTask": {
          "inputs": {
            "orderId": {
              "type": "variable",
              "value": "orderId"
            },
            "orderStatus": {
              "type": "value",
              "value": "COMPLETED"
            },
            "trackingNumber": {
              "type": "variable",
              "value": "trackingNumber"
            },
            "completionDate": {
              "type": "variable",
              "value": "currentDate"
            }
          },
          "outputs": {
            "orderStatus": {
              "type": "variable",
              "value": "updatedStatus"
            }
          }
        }
      },
      "constants": {
        "checkCreditScoreTask": {
          "creditBureauApi": {
            "value": "https://api.creditbureau.com/v1"
          },
          "minCreditScore": {
            "value": "650"
          },
          "timeout": {
            "value": "30000"
          }
        },
        "generateInvoiceTask": {
          "invoiceTemplate": {
            "value": "STANDARD_INVOICE"
          },
          "currency": {
            "value": "USD"
          },
          "invoicePrefix": {
            "value": "INV-"
          }
        },
        "sendConfirmationTask": {
          "smtpServer": {
            "value": "smtp.company.com"
          },
          "fromAddress": {
            "value": "orders@company.com"
          },
          "emailTemplate": {
            "value": "order_confirmation"
          }
        },
        "updateOrderStatusTask": {
          "orderManagementSystem": {
            "value": "https://oms.company.com/api"
          },
          "statusCompleted": {
            "value": "COMPLETED"
          }
        }
      }
    }
  }
}
```

---

## Best Practices

### 1. Type Safety

Always define variable types explicitly:

```json
"orderTotal-id": {
  "name": "orderTotal",
  "type": "bigdecimal",  // Not "string" or "integer"
  "required": true
}
```

**Why?** Prevents type conversion errors at runtime.

### 2. Required vs Optional

Mark input variables as required:

```json
"orderId-id": {
  "required": true  // Must be provided at start
}
"creditScore-id": {
  "required": false  // Set during process
}
```

**Why?** Validates process initiation with all necessary data.

### 3. Environment Variables

Use environment variables for sensitive data:

```json
"apiKey": {
  "value": "${STRIPE_API_KEY}"  // Not hardcoded
}
```

**Why?** Security and environment-specific configuration.

### 4. Default Values

Provide sensible defaults:

```json
"paymentStatus-id": {
  "value": "PENDING"  // Initial state
}
"orderStatus-id": {
  "value": "IN_PROGRESS"  // Initial state
}
```

**Why?** Prevents null values and undefined states.

### 5. Clear Naming

Use descriptive variable names:

```json
// Good
"customerValid-id": { "name": "customerValid", ... }
"creditApproved-id": { "name": "creditApproved", ... }

// Avoid
"flag1-id": { "name": "flag1", ... }
"result-id": { "name": "result", ... }
```

**Why?** Self-documenting code and easier maintenance.

---

## Next Steps

- [REST API](rest-api.md) - HTTP integration for process initiation

---

**Related Documentation:**
- [Process Variables](../../bpmn/common-features.md)
- [Call Activities](../../bpmn/elements/call-activity.md)
- [Service Tasks](../../bpmn/elements/service-task.md)
