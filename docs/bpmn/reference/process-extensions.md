---
sidebar_label: Process Extensions
slug: /bpmn/reference/process-extensions
title: "Process Extensions"
description: "Complete guide to using *-extensions.json files for variable mapping, properties, and constants in Activiti processes - separation of concerns for maintainable workflows."
---

# Process Extensions (\`*-extensions.json\`)

Process Extensions files (named `*-extensions.json`) provide a **powerful mechanism** to define process variables, variable mappings, and constants **separately** from your BPMN diagram. This separation of concerns makes your processes more maintainable, testable, and flexible.

## Overview

```json
{
  "id": "myProcess",
  "extensions": {
    "myProcess": {
      "properties": { ... },
      "mappings": { ... },
      "constants": { ... }
    }
  }
}
```

The key inside `extensions` (here `myProcess`) must match the **process definition key** — the `id` attribute of the BPMN `<process>` element. At runtime, extensions are looked up by this key, so a mismatch produces no error: the extensions are simply never found and silently ignored. The top-level `id` field is optional metadata and is not used for lookup. A single `*-extensions.json` file can contain entries for multiple processes — one `extensions` map entry per process definition key.

**File Naming:**
- Required: the file name ends with `-extensions.json`, and the file is deployed in the same deployment as the BPMN
- Recommended convention: `myProcess-extensions.json` next to `myProcess.bpmn` — base-name matching between the BPMN file and the JSON file is not enforced (one file can cover several processes)

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
  "extensions": {
    "processName": {
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
| `id` | Optional metadata — not used for extension lookup | No |
| `extensions` | Container for all extension definitions | Yes |
| `<process-definition-key>` | Key in the `extensions` map; must match the BPMN `<process id>` (e.g., `myProcess`) | Yes |
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

**Source:** These types are registered in [`ProcessExtensionsAutoConfiguration.variableTypeMap()`](https://github.com/Activiti/Activiti/blob/main/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/conf/ProcessExtensionsAutoConfiguration.java#L93-L108):

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
- [`JavaObjectVariableType`](https://github.com/Activiti/Activiti/tree/main/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/variable/types/JavaObjectVariableType.java) - For primitive types (string, integer, boolean)
- [`BigDecimalVariableType`](https://github.com/Activiti/Activiti/tree/main/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/variable/types/BigDecimalVariableType.java) - For precise decimal calculations
- [`JsonObjectVariableType`](https://github.com/Activiti/Activiti/tree/main/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/variable/types/JsonObjectVariableType.java) - For complex JSON structures
- [`DateVariableType`](https://github.com/Activiti/Activiti/tree/main/activiti-core/activiti-spring-process-extensions/src/main/java/org/activiti/spring/process/variable/types/DateVariableType.java) - For date/time values

### Date Handling

`date` and `datetime` property default values are parsed with the shared `DateFormatterProvider` (`DateVariableType.parseFromValue`):

- **Default pattern:** `yyyy-MM-dd[['T']HH:mm:ss[.SSS][XXX]]` — so `2024-01-15`, `2024-01-15T10:30:00`, `2024-01-15T10:30:00.000Z`, and `2024-01-15T10:30:00+02:00` are all accepted.
- **Time zone:** values without an explicit zone offset are interpreted in **UTC**.
- **Configurable:** the pattern comes from `spring.activiti.date-format-pattern` (default shown above; the `DateFormatterProvider` bean is defined in `ActivitiCoreCommonUtilAutoConfiguration`). Defining your own `DateFormatterProvider` bean replaces the default one.
- An unparseable default fails process start with `ActivitiException: Error parsing date value <value>`.
- A default that is a pure `${...}` expression is left untouched at parse time; it is resolved at process start (see [Precedence Rules](#precedence-rules)).
- At runtime, payload values for `date`/`datetime`-typed variables (and, best-effort, payload strings for variables without a declared definition) are converted with the same provider — see [Validation and Errors](#validation-and-errors).

### Example: Complete Properties Definition

```json
{
  "id": "orderProcess",
  "extensions": {
    "orderProcess": {
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

### Runtime Variable Scopes

Mappings move values **between two variable scopes**: the **process scope** (variables of the whole process instance) and the **task scope** (variables of a single task).

- **A task with no `mappings` entry and no `constants` entry receives no process variables into its own scope** — its task-local variable map is empty: no process variables are copied into the task scope (they remain resolvable through the execution scope, e.g. from a delegate).
- **A task with explicit `inputs` sees only the mapped variables plus its own constants.** Process variables that are not listed in `inputs` are not copied into the task scope.
- **`MAP_ALL_INPUTS` / `MAP_ALL`** copies all process variables (plus the activity's constants) into the task scope.
- **Outputs work the other way:** `outputs` copies selected task values back into the process scope, and `MAP_ALL_OUTPUTS` / `MAP_ALL` copies all task variables back.

This is by design: an unmapped process variable is not lost — it simply remains in the process scope and is invisible from inside the task. Later activities can still map it, and a task can write new variables that `outputs` (or `MAP_ALL_OUTPUTS`) carries back into the process scope afterwards.

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
| `VARIABLE` | Map from another variable (literal variable name, looked up flat) | Transfer process variable to task |
| `VALUE` | Constant literal value, or an EL expression (`${...}`) resolved at runtime | Provide fixed value or expression-resolved value |
| `JSONPATCH` | Update JSON object fields | Modify specific properties |

### Example 1: Basic Input/Output Mapping

```json
{
  "id": "serviceTaskProcess",
  "extensions": {
    "serviceTaskProcess": {
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
    "updateProcess": {
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
    "multiTaskProcess": {
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
    "simpleProcess": {
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
    "selectiveOutputProcess": {
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
    "selectiveInputProcess": {
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

### Output Mapping Constraints

Output mappings are not free-form assignments. When computing outputs, the engine enforces these constraints (`ExtensionsVariablesMappingProvider`):

- **The target must be a known process variable.** Each output key must be either a declared `properties` entry (matched by `name`) or an already-existing execution variable. Otherwise the mapping is **silently skipped** — no error is raised.
- **Type conversion.** When a property with the same name exists, the resulting value is type-converted using the property's declared `type` (`VariableParsingService.parse`). A target that exists only as an execution variable is written with its raw value.
- **Expressions in task result values are rejected.** If any of the task's result variables contains a `${...}` expression, the whole output computation aborts with `ActivitiIllegalArgumentException: Expressions are not allowed as variable values in the output mapping`.
- **JSONPATCH.** The patch is applied against the **current value of the process variable**:
  - if the variable does not yet have a value, the property's declared default `value` is used as the base;
  - if that base is not an object (a `Map` or a JSON object), an empty object `{}` is used;
  - intermediate object paths are created automatically, so `add /a/b/c` works even if `/a` does not exist yet;
  - any patch failure (invalid operation, invalid path, or a failed `test`) raises `ActivitiIllegalArgumentException: Invalid jsonPatch variable mapping`.
- **Start-event mappings.** A `mappings` entry keyed by the **start event's** ID is evaluated against the variables passed at process start (before the instance exists). There, only output keys that are declared `properties` qualify, and if at least one output resolves, the resolved outputs replace the raw start-payload variables before property defaults and required-variable checks run (see [Precedence Rules](#precedence-rules)).

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

### Precedence Rules

When several mechanisms could set the same variable, the engine applies a fixed order (`ProcessVariablesInitiator.processVariables`, `ExtensionsVariablesMappingProvider.calculateInputVariables`):

1. **Start-payload variables always win over property defaults.** A property's default `value` is applied **only when the start payload does not already provide a variable with that name**. Default values containing `${...}` expressions (or JSON objects containing expressions) are resolved **against the variables available at start** — the start-payload variables plus the other already-applied default values — before the instance starts.
   - A pure `${...}` default that cannot be resolved evaluates to `null` (the variable exists with a `null` value), and a warning is logged.
   - An unresolvable `${...}` placeholder *inside* a string default is replaced with an empty string.
2. **`mappingType` takes precedence over — and suppresses — explicit maps.** When an activity has a `mappingType`, the corresponding explicit list is **ignored**:
   - `MAP_ALL_INPUTS` ignores explicit `inputs` — the task receives **all** process variables (plus its constants).
   - `MAP_ALL_OUTPUTS` ignores explicit `outputs` — **all** task variables are written back to the process scope.
   - `MAP_ALL` ignores both.
3. **A constant overrides an explicit input mapping with the same name.** The activity's constants are merged into its input map *after* the explicit `inputs` have been resolved, so the constant wins. (Under `MAP_ALL_INPUTS` the order is reversed: process variables are merged after the constants, so a same-named process variable overrides the constant.)

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
    "configuredProcess": {
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

### Constants Semantics

- **Constants are input variables of the activity that owns them — and only that activity.** They are looked up by the activity's own ID when *that* activity starts, and they are injected even when the activity has no `mappings` entry at all. A constant declared for `paymentServiceTask` is not visible to `notificationServiceTask`, and it is never written to the process scope.
- **Under `MAP_ALL*` they are merged into the all-variables map** — so with `MAP_ALL_OUTPUTS` they can flow back to the process scope like any other task variable.
- **Precedence:** for explicit `inputs`, a constant overrides an input mapping with the same name (see [Precedence Rules](#precedence-rules)); under `MAP_ALL_INPUTS`, a same-named process variable overrides the constant.
- **No expression evaluation:** constant values are injected **as-is** — `${...}` in a constant value is not resolved. Use a property default value or a `VALUE` mapping when an expression must be evaluated.

---

## Complete Real-World Example

### Scenario: E-Commerce Order Processing

**BPMN File:** `orderProcess.bpmn`

**Extensions File:** `orderProcess-extensions.json`

```json
{
  "id": "orderProcess",
  "extensions": {
    "orderProcess": {
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
              "value": "paymentResultStatus"
            },
            "transactionReference": {
              "type": "VARIABLE",
              "value": "paymentResultReference"
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
              "value": "shippingResultStatus"
            },
            "trackingNumber": {
              "type": "VARIABLE",
              "value": "shippingResultTrackingNumber"
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

## Validation and Errors

### At Process Start

When extensions are present, `ProcessVariablesInitiator` checks the initialized variable set before the instance starts. Failures abort the start with an `ActivitiException`:

- A required variable that is neither in the start payload nor satisfiable by a default value:
  `Can't start process '<key>' without required variables - <name1>, <name2>`
- A variable whose value fails the type check against its declared `properties` type:
  `Can't start process '<key>' as variables fail type validation - <name1>, <name2>`

In both messages `<key>` is the process definition key and the variable names are joined with `", "`.

### Payload Validation

The same validation pipeline runs on the variable maps of the following operations (`ProcessVariablesPayloadValidator`): **start process**, **set variables**, **start message**, **receive message**, and **signal**. For every variable in the payload:

- **Name check** — the name must match the pattern `(?i)[a-z][a-z0-9_]*` (starts with a letter, followed by letters, digits, or underscores; case-insensitive). Failure: `Variable has not a valid name: <name>`
- **Expression check** — payload **values** must not contain `${...}` expressions: `Expressions in variable values are only allowed as default value when modeling the process: <name>`
- **Type check** — the value is validated against the `properties` definition; failures are reported as `Variables fail type validation: <name1>, <name2>`
- **Date coercion** — values for variables whose declared type is `date`/`datetime` are converted to `Date` via `DateFormatterProvider` (best-effort: a value that cannot be parsed is kept as a string). String values for variables **without** a declared definition are also parsed as dates best-effort.

All problems are collected and thrown together as a single `IllegalStateException` whose message is the individual messages joined with `,`. For `signal`, `receive message`, and `start message` the validator is invoked without a process definition id, so only the name/expression checks and the best-effort date conversion apply — the type checks against `properties` are skipped.

### Unreadable Extensions File

If a `*-extensions.json` resource cannot be read or parsed during the (cached) deployment-resource load, the extensions lookup fails with `IllegalStateException: Unable to read process extension` (thrown by `DeploymentResourceLoader`).

---

## Notes

- **Unknown `type` values fall back to `json`.** If a property's `type` is not one of the registered types, `VariableValidationService` validates its value as `json`, and the extension reader converts that property's value to a JSON object when loading the file (see `VariableValidationService` and `ProcessExtensionResourceReader`). Enum values in the extensions file are matched **case-insensitively** — e.g. `Mapping.type` `variable`/`value`/`jsonpatch`, `mappingType` `map_all`/`map_all_inputs`/`map_all_outputs`, assignment `assignee`/`candidates`, assignment `type` `static`/`identity`/`expression`, `mode` `sequential`/`manual`, template `type` `variable`/`file`.
- **Caching.** Extension lookups are cached per process definition ID in the `processExtensionsById` Caffeine cache, and deployment-resource loads in `deploymentResourcesById` (both `expireAfterAccess=10m`, configured in `config/process-extensions-service.properties` of the `activiti-spring-process-extensions` module). Provide your own `ProcessExtensionRepository` bean to replace the default — the default bean is registered with `@ConditionalOnMissingBean`.
- **`file` / `folder` / `content` types** are all JSON-object-typed variables (validated/parsed as JSON objects). See [Data Grid](../elements/data-grid.md) for using file/folder/content variables in tasks.

---

## Advanced Features

### 1. Combining MAP_ALL with Explicit Mappings

You can combine automatic mapping with explicit mappings for fine-grained control:

```json
{
  "id": "hybridProcess",
  "extensions": {
    "hybridProcess": {
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
<!-- xmlns:activiti="http://activiti.org/bpmn" required -->
<userTask id="optionalTask"
          activiti:skipExpression="${!enableOptionalStep}">
</userTask>
```

```json
// In extensions.json - only applies if task executes
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
        "type": "VALUE",
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
        "value": "review"
      }
    }
  }
}
```

**`VARIABLE` vs `VALUE`:** A `VARIABLE` mapping's `value` is a **literal variable name** — the engine performs a flat lookup of that name (e.g., `execution.getVariable("reviewer")`), so expressions are never evaluated for `VARIABLE` mappings and dotted names like `paymentResult.status` are treated as a single literal key. EL expressions (`${...}`) are only evaluated for `VALUE` mappings: the raw value is placed into the variable map and then resolved against the execution's variables. If a `VALUE` expression cannot be resolved, it evaluates to `null` and a warning is logged.

Collection wiring for multi-instance loops (`activiti:collection`, `activiti:outputDataItem`) belongs in the BPMN diagram, not in the extensions file — a `Mapping` only has `type` and `value` fields.

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

### 5. Expression Default Values in Properties

A property default may contain `${...}`. It is resolved at process start against the start-payload variables (and the other already-applied default values), so the process can derive initial variables from the start payload:

```json
{
  "id": "welcomeProcess",
  "extensions": {
    "welcomeProcess": {
      "properties": {
        "greeting-id": {
          "id": "greeting-id",
          "name": "greeting",
          "type": "string",
          "required": false,
          "value": "start var is ${startVariable} and defined var is ${definedVar}"
        },
        "resolved-id": {
          "id": "resolved-id",
          "name": "resolved",
          "type": "string",
          "required": false,
          "value": "${startVariable}"
        },
        "definedVar-id": {
          "id": "definedVar-id",
          "name": "definedVar",
          "type": "string",
          "required": false,
          "value": "predefinedVarValue"
        }
      }
    }
  }
}
```

Starting the process with `{"startVariable": "startVariableValue"}` produces:

| Variable | Value |
|----------|-------|
| `startVariable` | `startVariableValue` |
| `definedVar` | `predefinedVarValue` |
| `resolved` | `startVariableValue` |
| `greeting` | `start var is startVariableValue and defined var is predefinedVarValue` |

A pure `${...}` default that cannot be resolved becomes `null`, and an unresolvable placeholder inside a string is replaced with an empty string (see [Precedence Rules](#precedence-rules)).

### 6. One Extensions File for Multiple Processes

A single `*-extensions.json` can carry entries for several processes — one `extensions` map entry per process definition key. This is handy when related processes share variable conventions:

```json
{
  "id": "shared-extensions",
  "extensions": {
    "nameProcess": {
      "properties": {
        "name-id": {
          "id": "name-id",
          "name": "name",
          "type": "string",
          "required": false,
          "value": "Kermit"
        }
      }
    },
    "lastNameProcess": {
      "properties": {
        "lastName-id": {
          "id": "lastName-id",
          "name": "lastName",
          "type": "string",
          "required": false,
          "value": "The Frog"
        }
      }
    }
  }
}
```

Each key is looked up independently: process `nameProcess` sees only its own entry, `lastNameProcess` only its own, and a process whose key is absent from the file behaves as if it had no extensions.

### 7. Constants under MAP_ALL_INPUTS

Constants are merged into the `MAP_ALL_INPUTS` variable map, so a task can receive fixed configuration values alongside every process variable:

```json
{
  "id": "chargeProcess",
  "extensions": {
    "chargeProcess": {
      "mappings": {
        "chargeTask": {
          "mappingType": "MAP_ALL_INPUTS",
          "outputs": {
            "chargeResult": {
              "type": "VARIABLE",
              "value": "result"
            }
          }
        }
      },
      "constants": {
        "chargeTask": {
          "apiEndpoint": {
            "value": "https://api.payment.com/v1"
          },
          "timeout": {
            "value": "30000"
          }
        }
      }
    }
  }
}
```

`chargeTask` receives **all** process variables plus `apiEndpoint` and `timeout`. If a process variable happens to share a name with a constant, the process variable wins under `MAP_ALL_INPUTS` (see [Precedence Rules](#precedence-rules)).

---

## Deployment and Usage

### File Location

By default, Activiti scans `classpath*:**/processes/` for process definitions and their extension files (overridable via `spring.activiti.process.extensions.dir`). The only enforced naming rule is the `-extensions.json` suffix — base-name matching against the BPMN file is a recommended convention, not a requirement:

```
src/main/resources/processes/
├── orderProcess.bpmn
├── orderProcess-extensions.json
├── approvalProcess.bpmn
└── approvalProcess-extensions.json
```

### Loading and Deployment

No special configuration needed. Extension files are not preloaded at deployment time: they are read at **runtime**, the first time extensions are looked up for a process (`DeploymentResourceLoader.loadResourcesForDeployment`, cached per deployment). Because extensions are resolved from the process definition's own deployment, the `*-extensions.json` file must be deployed in the **same deployment** as the BPMN file — placing both under the scan prefix above, or including them in the same explicit deployment unit, satisfies this.

### Runtime Behavior

1. **Process Start:** Properties are initialized with default values
2. **Before Activity:** Input mappings are applied
3. **Activity Execution:** Task uses mapped variables
4. **After Activity:** Output mappings update process variables
5. **Constants:** Available as inputs to the activities that define them

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
Use expressions for environment-specific values in **property default values** — they are resolved at process start against the variables passed with the process:
```json
"properties": {
  "apiKey-id": {
    "id": "apiKey-id",
    "name": "apiKey",
    "type": "string",
    "required": false,
    "value": "${PAYMENT_API_KEY}"
  }
}
```
**Note:** `constants` are a different story — constant values are injected into activities **as-is**, so expressions in `constants` are not resolved. Use a property default value or a `VALUE` mapping when an expression must be evaluated.

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

### 1. **Extensions Key Mismatch**
```json
// ❌ Wrong - key in `extensions` doesn't match the BPMN process definition key
{
  "id": "orderProcess",
  "extensions": {
    "Process_orderProcess": { ... }
  }
}

// Correct - key matches the BPMN <process id>
{
  "id": "orderProcess",
  "extensions": {
    "orderProcess": { ... }
  }
}
```

Only the key of the `extensions` map matters for lookup — the top-level `id` field is optional metadata and is ignored by the engine. If the key doesn't match the process definition key, the extensions are silently ignored (no error is raised).

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

## Assignment Definitions

**Note: supported in the JSON model; not yet applied by the engine in this release.** The `assignments` structure below is parsed from the extensions file and queryable through `Extension.getAssignments()`, but no engine or task-runtime code consumes it in this release — defined assignments have no effect on task assignment yet.

Process extensions support declarative task assignment configuration through `assignments` in the extension JSON. Each assignment is a flat `AssignmentDefinition` with fields: `id`, `assignment`, `type`, and `mode`.

### Assignment Structure

```json
{
  "extensions": {
    "myProcess": {
      "assignments": {
        "reviewTask-assignee": {
          "id": "reviewTask-assignee",
          "assignment": "ASSIGNEE",
          "type": "EXPRESSION",
          "mode": "SEQUENTIAL"
        },
        "reviewTask-candidates": {
          "id": "reviewTask-candidates",
          "assignment": "CANDIDATES",
          "type": "IDENTITY",
          "mode": "SEQUENTIAL"
        }
      }
    }
  }
}
```

### Assignment Fields

| Field | Type | Values |
|-------|------|--------|
| `id` | String | Unique identifier for this assignment |
| `assignment` | `AssignmentEnum` | `ASSIGNEE` or `CANDIDATES` |
| `type` | `AssignmentType` | `STATIC`, `IDENTITY`, or `EXPRESSION` |
| `mode` | `AssignmentMode` | `SEQUENTIAL` (first non-null wins) or `MANUAL` |

## Task Templates

**Note: supported in the JSON model; not yet applied by the engine in this release.** The `templates` structure below is parsed from the extensions file and queryable through `Extension.findAssigneeTemplateForTask()` / `Extension.findCandidateTemplateForTask()`, but no engine or task-runtime code consumes it in this release — defined templates have no effect on task assignment yet.

Extensions support `templates` for reusable task assignment patterns. `TemplatesDefinition` has a `default` template (a `TaskTemplateDefinition`) and a `tasks` map keyed by task ID.

### Template Structure

```json
{
  "extensions": {
    "myProcess": {
      "templates": {
        "default": {
          "assignee": {
            "type": "VARIABLE",
            "value": "requestManager"
          },
          "candidate": {
            "type": "VARIABLE",
            "value": "backupGroup"
          }
        },
        "tasks": {
          "escalationTask": {
            "assignee": {
              "type": "FILE",
              "value": "classpath:assignees/escalation.txt"
            }
          }
        }
      }
    }
  }
}
```

### TemplateDefinition Fields

Each `assignee` or `candidate` entry in a `TaskTemplateDefinition` is a `TemplateDefinition` with:

| Field | Description |
|-------|-------------|
| `type` | `VARIABLE` (resolve from process variable name) or `FILE` (read from file/classpath) |
| `value` | The variable name or file path |
| `from` | Source identifier |
| `subject` | Subject identifier |

The `default` template is the intended fallback for tasks without a specific override, and task-level entries under `tasks` take precedence for named activities (note that the current `findAssigneeTemplateForTask()` / `findCandidateTemplateForTask()` methods only consult the `tasks` map).

## Variable Parsing and Validation Services

Process extensions auto-configure two Spring beans that handle variable data:

- **`VariableParsingService`** — Parses variable values into typed objects based on the extension's `type` field
- **`VariableValidationService`** — Validates required variables and type constraints at process start time

The registered variable types in `ProcessExtensionsAutoConfiguration.variableTypeMap()` are: `boolean`, `string`, `integer`, `bigdecimal`, `json`, `file`, `folder`, `content`, `date`, `datetime`, `array`.

## ProcessExtensionRepository

`ProcessExtensionRepository` is the interface for loading extension data. To use custom extension sources (database, remote API), implement the interface and register it as a Spring bean:

```java
@Component
public class CustomExtensionRepository implements ProcessExtensionRepository {
    @Override
    public Optional<Extension> getExtensionsForId(@NonNull String processDefinitionId) {
        // Load and return Extension for the given process definition ID
        return Optional.empty();
    }
}
```

`CacheableProcessExtensionRepository` wraps any repository with caching. `CachingProcessExtensionService` is `@Deprecated` — use `ProcessExtensionService` directly.

## Examples Repository

For more complete examples, see:
- `Activiti/activiti-core/activiti-api-impl/activiti-api-process-runtime-impl/src/test/resources/processes/`
- `Activiti/activiti-core/activiti-api-impl/activiti-api-process-runtime-impl/src/test/resources/task-variable-mapping-extensions.json`
- `Activiti/activiti-core/activiti-spring-boot-starter/src/test/resources/processes/multi-process-extensions.json` — a single file with `extensions` entries for multiple processes

## Related Documentation

- [Variable Scope](./variables.md) - Understanding variable lifecycle
- [Service Tasks](../elements/service-task.md) - Using mappings with service tasks
- [User Tasks](../elements/user-task.md) - Task variable mapping
- [Multi-Instance](./multi-instance.md) - Multi-instance variable handling
- [Process Validation](../../api-reference/engine-api/process-validation.md) - Validating extensions

---

**Feature Status:** Production Ready (properties, mappings, and constants). Assignment definitions and task templates are supported in the JSON model but are not yet applied by the engine in this release.
