---
name: process-extensions
description: Reference for Activiti process extension JSON sidecar format — variables, assignments, templates, mappings, and constants
license: Apache-2.0
compatibility: opencode
metadata:
  audience: documentation
  workflow: validation
---

## What I Do

I provide a structured reference for validating process extension JSON sidecar files in Activiti documentation. When loaded, I give agents the schema structure, valid field values, and model class mappings.

---

## Process Extension Files

Process extensions are JSON sidecar files placed alongside BPMN files:
- Location: same directory as `.bpmn`/`.bpmn20.xml` files
- Naming: `<process-definition-key>.json`
- Discovered via `spring.activiti.process-definition-location-prefix`

The JSON structure maps to `org.activiti.spring.process.model.ProcessExtensionModel`.

---

## Top-Level Structure

**Model class:** `ProcessExtensionModel`

```json
{
  "id": "extension-id",
  "extensions": {
    "process-definition-key": {
      "properties": { ... },
      "mappings": { ... },
      "constants": { ... },
      "templates": { ... },
      "assignments": { ... }
    }
  }
}
```

| Field | Type | Model | Description |
|-------|------|-------|-------------|
| `id` | `String` | — | Extension identifier |
| `extensions` | `Map<String, Extension>` | `Extension` | Keyed by process definition key |

---

## Extension Object

**Model class:** `Extension`

| Field | Type | Description |
|-------|------|-------------|
| `properties` | `Map<String, VariableDefinition>` | Process-scoped variable definitions |
| `mappings` | `Map<String, ProcessVariablesMapping>` | Input/output variable mappings keyed by element ID |
| `constants` | `Map<String, ProcessConstantsMapping>` | Constant definitions keyed by element ID |
| `templates` | `TemplatesDefinition` | Task assignment templates |
| `assignments` | `Map<String, AssignmentDefinition>` | Task assignment configurations |

---

## Variable Definitions

**Model class:** `VariableDefinition` (extends `org.activiti.core.common.model.connector.VariableDefinition`)

Base class includes: `name`, `type`, `required`.

Process extension variant adds: `value`.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `String` | Variable name |
| `type` | `String` | Variable type: `string`, `integer`, `long`, `date`, `boolean`, `binary`, `json-object`, `java-object` |
| `required` | `boolean` | Whether the variable is mandatory |
| `value` | `Object` | Default variable value |

### Variable Types (from source enums)

| Type | Model Class |
|------|-------------|
| `string` | default |
| `integer` / `long` | `BigDecimalVariableType` |
| `date` | `DateVariableType` |
| `json-object` | `JsonObjectVariableType` |
| `java-object` | `JavaObjectVariableType` |
| `boolean` | default |
| `binary` | default |

---

## Process Variables Mapping

**Model class:** `ProcessVariablesMapping`

Controls how variables flow into/out of process elements.

| Field | Type | Description |
|-------|------|-------------|
| `mappingType` | `MappingType` | `MAP_ALL`, `MAP_ALL_INPUTS`, `MAP_ALL_OUTPUTS` |
| `inputs` | `Map<String, Mapping>` | Input variable mappings |
| `outputs` | `Map<String, Mapping>` | Output variable mappings |

### Mapping Object

| Field | Type | Description |
|-------|------|-------------|
| `source` | `String` | Source variable name or expression |
| `target` | `String` | Target variable name |

---

## Assignment Definitions

**Model class:** `AssignmentDefinition`

Configures task assignment behavior.

| Field | Type | Valid Values |
|-------|------|-------------|
| `id` | `String` | Task element ID |
| `assignment` | `AssignmentEnum` | `ASSIGNEE`, `CANDIDATES` |
| `type` | `AssignmentType` | `STATIC`, `IDENTITY`, `EXPRESSION` |
| `mode` | `AssignmentMode` | `SEQUENTIAL`, `MANUAL` |

### AssignmentType Values

| Value | Description |
|-------|-------------|
| `static` | Hardcoded value (e.g., `"john"`) |
| `identity` | Resolved from Spring Security identity |
| `expression` | Evaluated as EL expression |

### AssignmentMode Values

| Value | Description |
|-------|-------------|
| `sequential` | Assignments applied in order |
| `manual` | Assignments require manual intervention |

---

## Template Definitions

**Model class:** `TemplateDefinition`

Used for dynamic task assignment (assignee/candidate templates).

| Field | Type | Description |
|-------|------|-------------|
| `type` | `TemplateType` | `VARIABLE`, `FILE` |
| `value` | `String` | Template content or file path |
| `from` | `String` | Sender (for FILE type) |
| `subject` | `String` | Subject line (for FILE type) |

**Model class:** `TemplatesDefinition`

Contains task-to-template mappings. Templates can define assignee and candidate resolution per task.

---

## Process Constants Mapping

**Model class:** `ProcessConstantsMapping`

Defines constant values that are injected into process execution context.

---

## Example Process Extension JSON

```json
{
  "id": "my-process-extensions",
  "extensions": {
    "myProcess": {
      "properties": {
        "orderId": {
          "name": "orderId",
          "type": "string",
          "required": true
        },
        "amount": {
          "name": "amount",
          "type": "integer",
          "value": 0
        }
      },
      "mappings": {
        "approveTask": {
          "mappingType": "MAP_ALL_INPUTS",
          "inputs": {
            "managerComment": {
              "source": "comment",
              "target": "managerComment"
            }
          }
        }
      },
      "assignments": {
        "approveTask": {
          "id": "approveTask",
          "assignment": "ASSIGNEE",
          "type": "IDENTITY",
          "mode": "MANUAL"
        }
      },
      "templates": {
        "approveTask": {
          "assignee": {
            "type": "VARIABLE",
            "value": "${requestManager}"
          }
        }
      }
    }
  }
}
```

---

## Security Policies

**Note:** Security policies are defined separately from process extensions but use a similar JSON sidecar pattern. They are configured via `activiti-spring-security-policies` module.

---

## When to Use Me

Load this skill when:
- Documenting process extension JSON format
- Validating extension examples in documentation
- Writing guides about variable definitions, assignments, or templates
- Explaining how sidecar files work with BPMN processes
