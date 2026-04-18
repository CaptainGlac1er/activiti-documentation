---
sidebar_label: Process Extensions
slug: /bpmn/advanced/process-extensions
title: "Process Extensions"
description: "Complete guide to using *-extension.json files for variable mapping, properties, and constants in Activiti processes - separation of concerns for maintainable workflows."
---

# Process Extensions (*.extension.json)

Process Extensions files (named `*-extension.json`) provide a **powerful mechanism** to define process variables, variable mappings, and constants **separately** from your BPMN diagram. This separation of concerns makes your processes more maintainable, testable, and flexible.

## Overview

```json
{
  "id": "myProcess",
  "extensions": {
    "Process_myProcess": {
      "properties": { ... },
      "mappings": { ... },
      "constants": { ... }
    }
  }
}
```

**File Naming Convention:**
- BPMN file: `myProcess.bpmn`
- Extensions file: `myProcess-extension.json`

**Key Benefits:**
- **Separation of Concerns** - Keep variable definitions separate from process flow
- **Version Control** - Track changes to variables independently
- **Reusability** - Share extension files across multiple processes
- **Testing** - Easily modify variables without changing BPMN
- **Collaboration** - Business analysts can work on extensions while developers work on BPMN

## When to Use Process Extensions

### Use Extensions When:
1. **Complex Variable Mappings** - Your process has many input/output variables
2. **Frequent Variable Changes** - Variables change often during development
3. **Multi-Environment** - Different variable values for dev/test/prod
4. **Team Collaboration** - Multiple people working on the same process
5. **Large Processes** - BPMN file is already complex and lengthy

### Don't Use Extensions When:
1. **Simple Processes** - Only a few variables
2. **Static Variables** - Variables never change
3. **Quick Prototypes** - You need to iterate rapidly

## File Structure

### Basic Structure

```json
{
  "id": "processName",
  "name": "Process Display Name",
  "extensions": {
    "Process_processName": {
      "properties": { ... },
      "mappings": { ... },
      "constants": { ... }
    }
  }
}
```

### Components

| Component | Description | Required |
|-----------|-------------|----------|
| `id` | Process identifier (matches BPMN process id) | Yes |
| `name` | Optional display name | ❌ No |
| `extensions` | Container for all extension definitions | Yes |
| `Process_<id>` | Process-specific extensions | Yes |
| `properties` | Process variable definitions | ❌ No |
| `mappings` | Variable mappings for activities | ❌ No |
| `constants` | Constant values for activities | ❌ No |

---

## Properties (Process Variables)

Properties define **process-level variables** with their types, default values, and requirements.

### Syntax

```json
"properties": {
  "<variable-id>": {
    "id": "<variable-id>",
    "name": "<variable-name>",
    "type": "<data-type>",
    "required": <true|false>,
    "value": <default-value>
  }
}
```

### Supported Data Types

| Type | Java Class | Description | Example |
|------|-----------|-------------|---------|
| `string` | `String` | Text value | `"Hello World"` |
| `integer` | `Integer` | Whole number | `42` |
| `boolean` | `Boolean` | True/False | `true` |
| `bigdecimal` | `BigDecimal` | Decimal number (for currency) | `19.99` |
| `json` | `Map/List` | JSON object/array | `{"key": "value"}` |
| `array` | `List` | Array of values | `[1, 2, 3]` |
| `date` | `Date` | Date value | `"2024-01-15"` |
| `datetime` | `Date` | DateTime value | `"2024-01-15T10:30:00"` |
| `file` | `Map` | File reference | `{}` |
| `folder` | `Map` | Folder reference | `{}` |
| `content` | `Map` | Content reference | `{}` |

**Source:** These types are registered in [`ProcessExtensionsAutoConfiguration.variableTypeMap()`](file:///home/georgecolgrove/IdeaProjects/ActivitiDocumentation/Activiti/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/conf/ProcessExtensionsAutoConfiguration.java#L93-L108):

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

### Example: Complete Properties Definition

```json
{
  "id": "orderProcess",
  "extensions": {
    "Process_orderProcess": {
      "properties": {
        "orderId-id": {
          "id": "orderId-id",
          "name": "orderId",
          "type": "string",
          "required": true,
          "value": "ORD-001"
        },
        "orderAmount-id": {
          "id": "orderAmount-id",
          "name": "orderAmount",
          "type": "bigdecimal",
          "required": true,
          "value": 99.99
        },
        "customerName-id": {
          "id": "customerName-id",
          "name": "customerName",
          "type": "string",
          "required": false,
          "value": "John Doe"
        },
        "isPriority-id": {
          "id": "isPriority-id",
          "name": "isPriority",
          "type": "boolean",
          "required": false,
          "value": false
        },
        "orderDetails-id": {
          "id": "orderDetails-id",
          "name": "orderDetails",
          "type": "json",
          "required": false,
          "value": {
            "items": [],
            "shippingAddress": null
          }
        }
      }
    }
  }
}
```

### Key Points

- **Variable ID Format:** `<name>-id` (e.g., `orderId-id`)
- **Variable Name:** The actual name used in the process (e.g., `orderId`)
- **Required:** If `true`, the variable must have a value when process starts
- **Value:** Default value (can be omitted for non-required variables)
- **Type Safety:** Engine validates variable types at runtime

---

## Mappings (Variable Transformation)

Mappings define how variables flow **into and out of** specific activities (tasks, service tasks, etc.).

### Why Use Mappings?

1. **Variable Renaming** - Map process variables to different task variable names
2. **Data Transformation** - Convert between different formats
3. **Selective Transfer** - Only pass specific variables to tasks
4. **Constant Values** - Provide fixed values to tasks
5. **JSON Patch** - Update specific fields in JSON objects

### Syntax

```json
"mappings": {
  "<activity-id>": {
    "inputs": {
      "<task-variable>": {
        "type": "<mapping-type>",
        "value": "<source>"
      }
    },
    "outputs": {
      "<process-variable>": {
        "type": "<mapping-type>",
        "value": "<source>"
      }
    }
  }
}
```

### Mapping Types

| Type | Description | Use Case |
|------|-------------|----------|
| `VARIABLE` | Map from another variable | Transfer process variable to task |
| `VALUE` | Constant literal value | Provide fixed value |
| `JSONPATCH` | Update JSON object fields | Modify specific properties |

### Example 1: Basic Input/Output Mapping

```json
{
  "id": "serviceTaskProcess",
  "extensions": {
    "Process_serviceTaskProcess": {
      "mappings": {
        "paymentServiceTask": {
          "inputs": {
            "transactionId": {
              "type": "VARIABLE",
              "value": "orderId"
            },
            "amount": {
              "type": "VARIABLE",
              "value": "orderAmount"
            },
            "currency": {
              "type": "VALUE",
              "value": "USD"
            }
          },
          "outputs": {
            "paymentStatus": {
              "type": "VARIABLE",
              "value": "transactionResult"
            },
            "paymentDate": {
              "type": "VARIABLE",
              "value": "currentDate"
            }
          }
        }
      }
    }
  }
}
```

**What This Does:**
- **Inputs:** Before `paymentServiceTask` executes:
  - Sets `transactionId` = value of process variable `orderId`
  - Sets `amount` = value of process variable `orderAmount`
  - Sets `currency` = constant `"USD"`
- **Outputs:** After `paymentServiceTask` completes:
  - Sets process variable `paymentStatus` = value of `transactionResult`
  - Sets process variable `paymentDate` = value of `currentDate`

### Example 2: JSON Patch Mapping

```json
{
  "id": "updateProcess",
  "extensions": {
    "Process_updateProcess": {
      "properties": {
        "customerData-id": {
          "id": "customerData-id",
          "name": "customerData",
          "type": "json",
          "required": true,
          "value": {
            "name": "John",
            "email": "john@example.com",
            "preferences": {}
          }
        }
      },
      "mappings": {
        "updateCustomerTask": {
          "outputs": {
            "customerData": {
              "type": "JSONPATCH",
              "value": [
                {
                  "op": "add",
                  "path": "/preferences/notifications",
                  "value": true
                },
                {
                  "op": "replace",
                  "path": "/email",
                  "value": "${newEmail}"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

**What This Does:**
- Updates the `customerData` JSON object after task completion:
  - Adds `preferences.notifications = true`
  - Replaces `email` with value from `newEmail` variable

### Example 3: Multi-Activity Mappings

```json
{
  "id": "multiTaskProcess",
  "extensions": {
    "Process_multiTaskProcess": {
      "mappings": {
        "validationTask": {
          "inputs": {
            "orderData": {
              "type": "VARIABLE",
              "value": "order"
            }
          },
          "outputs": {
            "isValid": {
              "type": "VARIABLE",
              "value": "validationResult"
            }
          }
        },
        "approvalTask": {
          "inputs": {
            "orderToApprove": {
              "type": "VARIABLE",
              "value": "order"
            },
            "validationStatus": {
              "type": "VARIABLE",
              "value": "isValid"
            },
            "approver": {
              "type": "VALUE",
              "value": "manager"
            }
          },
          "outputs": {
            "approvalStatus": {
              "type": "VARIABLE",
              "value": "approvalResult"
            },
            "approvedBy": {
              "type": "VARIABLE",
              "value": "assignee"
            }
          }
        },
        "notificationTask": {
          "inputs": {
            "recipient": {
              "type": "VARIABLE",
              "value": "customerEmail"
            },
            "status": {
              "type": "VARIABLE",
              "value": "approvalStatus"
            }
          }
        }
      }
    }
  }
}
```

### Example 4: Automatic Mapping with MAP_ALL

Instead of listing every variable, use `MAP_ALL` to automatically transfer all variables:

```json
{
  "id": "simpleProcess",
  "extensions": {
    "Process_simpleProcess": {
      "properties": {
        "orderId-id": {
          "id": "orderId-id",
          "name": "orderId",
          "type": "string",
          "required": true,
          "value": "ORD-001"
        },
        "customerName-id": {
          "id": "customerName-id",
          "name": "customerName",
          "type": "string",
          "required": true,
          "value": "John Doe"
        },
        "orderTotal-id": {
          "id": "orderTotal-id",
          "name": "orderTotal",
          "type": "bigdecimal",
          "required": true,
          "value": 99.99
        }
      },
      "mappings": {
        "processOrderTask": {
          "mappingType": "MAP_ALL"
        }
      }
    }
  }
}
```

**What This Does:**
- **Inputs:** ALL process variables (`orderId`, `customerName`, `orderTotal`) are automatically passed to the task
- **Outputs:** ALL task variables are automatically returned to the process
- **Benefit:** No need to list each variable individually

### Example 5: MAP_ALL_INPUTS with Selective Outputs

Use `MAP_ALL_INPUTS` when the task needs all process variables but you want to control which outputs are returned:

```json
{
  "id": "selectiveOutputProcess",
  "extensions": {
    "Process_selectiveOutputProcess": {
      "properties": {
        "orderId-id": {
          "id": "orderId-id",
          "name": "orderId",
          "type": "string",
          "required": true
        },
        "orderDetails-id": {
          "id": "orderDetails-id",
          "name": "orderDetails",
          "type": "json",
          "required": true
        },
        "processingResult-id": {
          "id": "processingResult-id",
          "name": "processingResult",
          "type": "string",
          "required": false
        }
      },
      "mappings": {
        "processOrderTask": {
          "mappingType": "MAP_ALL_INPUTS",
          "outputs": {
            "processingResult": {
              "type": "VARIABLE",
              "value": "result"
            }
          }
        }
      }
    }
  }
}
```

**What This Does:**
- **Inputs:** ALL process variables automatically passed to task
- **Outputs:** Only `processingResult` is mapped back (from task variable `result`)
- **Benefit:** Task gets everything, but you control what returns to process

### Example 6: MAP_ALL_OUTPUTS with Selective Inputs

Use `MAP_ALL_OUTPUTS` when you want to control inputs but automatically return all task variables:

```json
{
  "id": "selectiveInputProcess",
  "extensions": {
    "Process_selectiveInputProcess": {
      "properties": {
        "orderId-id": {
          "id": "orderId-id",
          "name": "orderId",
          "type": "string",
          "required": true
        },
        "taskResult1-id": {
          "id": "taskResult1-id",
          "name": "taskResult1",
          "type": "string",
          "required": false
        },
        "taskResult2-id": {
          "id": "taskResult2-id",
          "name": "taskResult2",
          "type": "string",
          "required": false
        }
      },
      "mappings": {
        "processOrderTask": {
          "mappingType": "MAP_ALL_OUTPUTS",
          "inputs": {
            "order_id": {
              "type": "VARIABLE",
              "value": "orderId"
            }
          }
        }
      }
    }
  }
}
```

**What This Does:**
- **Inputs:** Only `orderId` is passed to task (as `order_id`)
- **Outputs:** ALL task variables automatically returned to process
- **Benefit:** You control what the task receives, but get everything back

### Comparison Table: Mapping Types

| Mapping Type | Inputs | Outputs | Best For |
|--------------|--------|---------|----------|
| **Explicit** (no mappingType) | Listed individually | Listed individually | Full control, selective mapping |
| **MAP_ALL** | ALL process variables | ALL task variables | Simple tasks, full sharing |
| **MAP_ALL_INPUTS** | ALL process variables | Listed individually | Task needs everything, selective return |
| **MAP_ALL_OUTPUTS** | Listed individually | ALL task variables | Selective input, get everything back |

**When to Use Each:**
- **Explicit Mapping:** When you need precise control over which variables are transferred
- **MAP_ALL:** For simple tasks where variable sharing is straightforward
- **MAP_ALL_INPUTS:** When a task needs access to all process context but produces specific results
- **MAP_ALL_OUTPUTS:** When you want to provide specific inputs but capture all task outputs

---

## Constants

Constants define **fixed values** that can be used across multiple activities without being stored as process variables.

### Why Use Constants?

1. **Configuration Values** - API endpoints, feature flags, thresholds
2. **Shared Defaults** - Common default values for multiple tasks
3. **Environment Settings** - Dev/test/prod specific values
4. **Business Rules** - Fixed business parameters

### Syntax

```json
"constants": {
  "<activity-id>": {
    "<constant-name>": {
      "value": "<constant-value>"
    }
  }
}
```

### Example: Constants Definition

```json
{
  "id": "configuredProcess",
  "extensions": {
    "Process_configuredProcess": {
      "constants": {
        "paymentServiceTask": {
          "apiEndpoint": {
            "value": "https://api.payment.com/v1"
          },
          "timeout": {
            "value": "30000"
          },
          "retryCount": {
            "value": "3"
          }
        },
        "notificationServiceTask": {
          "smtpServer": {
            "value": "smtp.company.com"
          },
          "fromAddress": {
            "value": "noreply@company.com"
          }
        },
        "validationTask": {
          "minOrderAmount": {
            "value": "10.00"
          },
          "maxOrderAmount": {
            "value": "10000.00"
          }
        }
      }
    }
  }
}
```

---

## Complete Real-World Example

### Scenario: E-Commerce Order Processing

**BPMN File:** `orderProcess.bpmn`

**Extensions File:** `orderProcess-extension.json`

```json
{
  "id": "orderProcess",
  "name": "E-Commerce Order Processing",
  "extensions": {
    "Process_orderProcess": {
      "properties": {
        "orderId-id": {
          "id": "orderId-id",
          "name": "orderId",
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
        "paymentStatus-id": {
          "id": "paymentStatus-id",
          "name": "paymentStatus",
          "type": "string",
          "required": false,
          "value": "PENDING"
        },
        "shippingStatus-id": {
          "id": "shippingStatus-id",
          "name": "shippingStatus",
          "type": "string",
          "required": false,
          "value": "NOT_SHIPPED"
        }
      },
      "mappings": {
        "validateOrderTask": {
          "inputs": {
            "orderToValidate": {
              "type": "VARIABLE",
              "value": "orderId"
            },
            "items": {
              "type": "VARIABLE",
              "value": "orderItems"
            },
            "total": {
              "type": "VARIABLE",
              "value": "orderTotal"
            }
          },
          "outputs": {
            "validationResult": {
              "type": "VARIABLE",
              "value": "isValid"
            },
            "validationErrors": {
              "type": "VARIABLE",
              "value": "errors"
            }
          }
        },
        "processPaymentTask": {
          "inputs": {
            "transactionId": {
              "type": "VARIABLE",
              "value": "orderId"
            },
            "amount": {
              "type": "VARIABLE",
              "value": "orderTotal"
            },
            "currency": {
              "type": "VALUE",
              "value": "USD"
            },
            "customerEmail": {
              "type": "VARIABLE",
              "value": "customerEmail"
            }
          },
          "outputs": {
            "paymentStatus": {
              "type": "VARIABLE",
              "value": "paymentResult.status"
            },
            "transactionReference": {
              "type": "VARIABLE",
              "value": "paymentResult.reference"
            }
          }
        },
        "approveOrderTask": {
          "inputs": {
            "orderDetails": {
              "type": "VARIABLE",
              "value": "orderId"
            },
            "paymentConfirmation": {
              "type": "VARIABLE",
              "value": "paymentStatus"
            },
            "approverRole": {
              "type": "VALUE",
              "value": "manager"
            }
          },
          "outputs": {
            "approvalDecision": {
              "type": "VARIABLE",
              "value": "approved"
            },
            "approvalComments": {
              "type": "VARIABLE",
              "value": "comments"
            }
          }
        },
        "shipOrderTask": {
          "inputs": {
            "orderId": {
              "type": "VARIABLE",
              "value": "orderId"
            },
            "shippingAddress": {
              "type": "VARIABLE",
              "value": "customerAddress"
            },
            "items": {
              "type": "VARIABLE",
              "value": "orderItems"
            }
          },
          "outputs": {
            "shippingStatus": {
              "type": "VARIABLE",
              "value": "shippingResult.status"
            },
            "trackingNumber": {
              "type": "VARIABLE",
              "value": "shippingResult.trackingNumber"
            }
          }
        },
        "sendConfirmationTask": {
          "inputs": {
            "recipient": {
              "type": "VARIABLE",
              "value": "customerEmail"
            },
            "orderNumber": {
              "type": "VARIABLE",
              "value": "orderId"
            },
            "tracking": {
              "type": "VARIABLE",
              "value": "trackingNumber"
            },
            "emailTemplate": {
              "type": "VALUE",
              "value": "order_confirmation"
            }
          }
        }
      },
      "constants": {
        "processPaymentTask": {
          "paymentGateway": {
            "value": "https://api.stripe.com/v1"
          },
          "apiKey": {
            "value": "${STRIPE_API_KEY}"
          },
          "timeout": {
            "value": "30000"
          }
        },
        "shipOrderTask": {
          "shippingProvider": {
            "value": "fedex"
          },
          "warehouse": {
            "value": "WH-001"
          }
        },
        "sendConfirmationTask": {
          "smtpServer": {
            "value": "smtp.company.com"
          },
          "fromAddress": {
            "value": "orders@company.com"
          }
        }
      }
    }
  }
}
```

---

## Advanced Features

### 1. Combining MAP_ALL with Explicit Mappings

You can combine automatic mapping with explicit mappings for fine-grained control:

```json
{
  "id": "hybridProcess",
  "extensions": {
    "Process_hybridProcess": {
      "mappings": {
        "complexTask": {
          "mappingType": "MAP_ALL_INPUTS",
          "outputs": {
            "specificResult": {
              "type": "VARIABLE",
              "value": "taskOutput"
            },
            "updatedData": {
              "type": "JSONPATCH",
              "value": [
                { "op": "add", "path": "/newField", "value": "newValue" }
              ]
            }
          }
        }
      }
    }
  }
}
```

**What This Does:**
- All process variables are automatically passed as inputs
- Only specific outputs are mapped back (using VARIABLE and JSONPATCH)
- Best of both worlds: automatic inputs with controlled outputs

### 2. Conditional Mappings

Use skip expressions in BPMN to conditionally apply mappings:

```xml
<!-- In BPMN -->
<userTask id="optionalTask" 
          activiti:skipExpression="${!enableOptionalStep}">
```

```json
// In extension.json - only applies if task executes
"mappings": {
  "optionalTask": {
    "inputs": { ... },
    "outputs": { ... }
  }
}
```

### 3. Multi-Instance Variable Mapping

Map variables for multi-instance tasks:

```json
"mappings": {
  "reviewerTask": {
    "inputs": {
      "reviewerId": {
        "type": "VARIABLE",
        "value": "${reviewer}"
      },
      "documentId": {
        "type": "VARIABLE",
        "value": "documentId"
      }
    },
    "outputs": {
      "reviewResults": {
        "type": "VARIABLE",
        "value": "review",
        "collection": "allReviews"
      }
    }
  }
}
```

### 4. JSON Patch Operations

Supported JSON Patch operations:

```json
"outputs": {
  "customerData": {
    "type": "JSONPATCH",
    "value": [
      { "op": "add", "path": "/newField", "value": "newValue" },
      { "op": "remove", "path": "/oldField" },
      { "op": "replace", "path": "/existingField", "value": "updatedValue" },
      { "op": "move", "from": "/source", "path": "/destination" },
      { "op": "copy", "from": "/source", "path": "/destination" },
      { "op": "test", "path": "/field", "value": "expectedValue" }
    ]
  }
}
```

---

## Deployment and Usage

### File Location

Place extension files in the same directory as your BPMN files:

```
src/main/resources/processes/
├── orderProcess.bpmn
├── orderProcess-extension.json
├── approvalProcess.bpmn
└── approvalProcess-extension.json
```

### Spring Boot Configuration

No special configuration needed - Activiti automatically loads `*-extension.json` files:

```yaml
# application.yml (optional configuration)
activiti:
  batch-operation-enabled: true
  async-execution-enabled: true
```

### Runtime Behavior

1. **Process Start:** Properties are initialized with default values
2. **Before Activity:** Input mappings are applied
3. **Activity Execution:** Task uses mapped variables
4. **After Activity:** Output mappings update process variables
5. **Constants:** Available throughout process execution

---

## Best Practices

### 1. **Naming Conventions**
- Properties: `<variableName>-id`
- Mappings: Use activity IDs from BPMN
- Constants: Descriptive names (e.g., `apiEndpoint`, `timeout`)

### 2. **Documentation**
```json
"properties": {
  "orderId-id": {
    "id": "orderId-id",
    "name": "orderId",
    "type": "string",
    "required": true,
    "value": "",
    "_comment": "Unique identifier for the order - set at process start"
  }
}
```

### 3. **Environment Variables**
Use expressions for environment-specific values:
```json
"constants": {
  "paymentTask": {
    "apiKey": {
      "value": "${PAYMENT_API_KEY}"
    }
  }
}
```

### 4. **Validation**
- Test extension files independently
- Validate JSON syntax before deployment
- Check variable type compatibility

### 5. **Version Control**
- Commit extension files with BPMN files
- Use meaningful commit messages
- Track changes in variable definitions

---

## Common Pitfalls

### 1. **ID Mismatch**
```json
// ❌ Wrong - ID doesn't match BPMN process
{
  "id": "wrongProcessId",
  ...
}

// Correct - Matches BPMN process id
{
  "id": "orderProcess",
  ...
}
```

### 2. **Type Mismatch**
```json
// ❌ Wrong - Declaring string but providing number
{
  "name": "orderTotal",
  "type": "string",
  "value": 99.99
}

// Correct - Types match
{
  "name": "orderTotal",
  "type": "bigdecimal",
  "value": 99.99
}
```

### 3. **Missing Required Variables**
```json
// ❌ Wrong - Required variable has no value
{
  "name": "orderId",
  "type": "string",
  "required": true
  // Missing "value"
}

// Correct - Provide default or ensure set at runtime
{
  "name": "orderId",
  "type": "string",
  "required": true,
  "value": ""
}
```

### 4. **Activity ID Mismatch**
```json
// ❌ Wrong - Activity ID doesn't exist in BPMN
"mappings": {
  "nonExistentTask": { ... }
}

// Correct - Matches BPMN activity ID
"mappings": {
  "paymentServiceTask": { ... }
}
```

---

## Related Documentation

- [Variable Scope](./variables.md) - Understanding variable lifecycle
- [Service Tasks](../elements/service-task.md) - Using mappings with service tasks
- [User Tasks](../elements/user-task.md) - Task variable mapping
- [Multi-Instance](./multi-instance.md) - Multi-instance variable handling
- [Process Validation](../../api-reference/engine-api/process-validation.md) - Validating extensions

---

## Examples Repository

For more complete examples, see:
- `Activiti/activiti-core/activiti-api-impl/activiti-api-process-runtime-impl/src/test/resources/processes/`
- `Activiti/activiti-core/activiti-api-impl/activiti-api-process-runtime-impl/src/test/resources/task-variable-mapping-extensions.json`

---

**Last Updated: 2026  
**Feature Status:** Production Ready
