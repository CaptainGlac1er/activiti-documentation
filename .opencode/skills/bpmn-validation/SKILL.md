---
name: bpmn-validation
description: Validates BPMN documentation examples against Activiti source — checks for Camunda/Flowable content, namespace correctness, and attribute accuracy
license: Apache-2.0
compatibility: opencode
metadata:
  audience: documentation
  workflow: validation
---

## What I Do

I provide a focused validation checklist for BPMN documentation. When loaded, I give agents the rules and attribute reference to verify doc accuracy.

## CRITICAL RULE

**Process one file at a time.** Read the file, extract the specific line ranges of BPMN/XML code blocks, then verify only the attributes that appear. Do not attempt to grep the entire Activiti source for every possible attribute — only look up attributes you actually find.

---

## Validation Checklist (in order)

### 1. Reject Camunda/Flowable (quick grep)

Run a single grep on the file for any of: `xmlns:camunda`, `camunda:`, `xmlns:flowable`, `flowable:`, `org.camunda`, `org.flowable`. If found, flag as ERROR.

### 2. Namespace rules

- A `<definitions>` element that uses `activiti:` MUST have `xmlns:activiti="http://activiti.org/bpmn"`
- XML fragments that use `activiti:` must either be inside a `<definitions>` with the namespace, or have a leading comment: `<!-- xmlns:activiti="http://activiti.org/bpmn" required -->`
- Expression syntax in BPMN XML attributes must be `${...}`, never `#{...}`

### 3. Standard vs activiti: attributes

Standard BPMN 2.0 attributes must NOT have the `activiti:` prefix. Flag as ERROR if found prefixed.

| Standard BPMN attribute | Namespace |
|---|---|
| `scriptFormat` | Default (no prefix) |
| `language` | Default (no prefix) |
| `implementation` | Default (no prefix) |
| `operationRef` | Default (no prefix) |

Values for standard BPMN attributes (e.g., `implementation="someBean"`) are application-level references. Do not attempt to verify them against Activiti source — they are valid as long as the attribute itself is correctly used without the `activiti:` prefix.

### 4. Activiti attribute reference (source of truth)

Verify each attribute name against the constant in `BpmnXMLConstants.java`. The constant name (`ATTRIBUTE_*`) is the authoritative source — not docs or assumptions.

Do not attempt to verify the *values* of any BPMN attribute against the Activiti codebase. Values like class names, bean references, expressions, and implementation IDs are application-level and may reference user-defined code.

However, do validate:
- Expression syntax uses `${...}` (Activiti EL), not `#{...}` (Flowable SpEL)
- Referenced types within expressions are not `org.flowable.*` or `org.camunda.bpm.*`
- Structural format where applicable (retry cycles, calendars)

**ServiceTask:**
| Attribute | Constant | Notes |
|---|---|---|
| `activiti:class` | `ATTRIBUTE_TASK_SERVICE_CLASS` | |
| `activiti:expression` | `ATTRIBUTE_TASK_SERVICE_EXPRESSION` | |
| `activiti:delegateExpression` | `ATTRIBUTE_TASK_SERVICE_DELEGATEEXPRESSION` | |
| `activiti:resultVariableName` | `ATTRIBUTE_TASK_SERVICE_RESULTVARIABLE` | NOT `resultVariable` |
| `activiti:skipExpression` | `ATTRIBUTE_TASK_SERVICE_SKIP_EXPRESSION` | |
| `activiti:type` | `ATTRIBUTE_TYPE` | |
| `activiti:extensionId` | `ATTRIBUTE_TASK_SERVICE_EXTENSIONID` | |

**ScriptTask:**
| Attribute | Constant | Notes |
|---|---|---|
| `activiti:resultVariable` | `ATTRIBUTE_TASK_SCRIPT_RESULTVARIABLE` | Different from serviceTask |
| `activiti:autoStoreVariables` | `ATTRIBUTE_TASK_SCRIPT_AUTO_STORE_VARIABLE` | |
| `scriptFormat` | `ATTRIBUTE_TASK_SCRIPT_FORMAT` | **Standard BPMN — no `activiti:` prefix** |

**BusinessRuleTask:**
| Attribute | Constant | Notes |
|---|---|---|
| `activiti:resultVariable` | `ATTRIBUTE_TASK_RULE_RESULT_VARIABLE` | |
| `activiti:rules` | `ATTRIBUTE_TASK_RULE_RULES` | |
| `activiti:ruleVariablesInput` | `ATTRIBUTE_TASK_RULE_VARIABLES_INPUT` | |
| `activiti:exclude` | `ATTRIBUTE_TASK_RULE_EXCLUDE` | |
| `activiti:class` | `ATTRIBUTE_TASK_RULE_CLASS` | |

**UserTask:**
| Attribute | Constant |
|---|---|
| `activiti:assignee` | `ATTRIBUTE_TASK_USER_ASSIGNEE` |
| `activiti:owner` | `ATTRIBUTE_TASK_USER_OWNER` |
| `activiti:candidateUsers` | `ATTRIBUTE_TASK_USER_CANDIDATEUSERS` |
| `activiti:candidateGroups` | `ATTRIBUTE_TASK_USER_CANDIDATEGROUPS` |
| `activiti:dueDate` | `ATTRIBUTE_TASK_USER_DUEDATE` |
| `activiti:businessCalendarName` | `ATTRIBUTE_TASK_USER_BUSINESS_CALENDAR_NAME` |
| `activiti:priority` | `ATTRIBUTE_TASK_USER_PRIORITY` |
| `activiti:category` | `ATTRIBUTE_TASK_USER_CATEGORY` |
| `activiti:formKey` | `ATTRIBUTE_FORM_FORMKEY` |
| `activiti:skipExpression` | `ATTRIBUTE_TASK_USER_SKIP_EXPRESSION` |

**CallActivity:**
| Attribute | Constant |
|---|---|
| `activiti:calledElement` | `ATTRIBUTE_CALL_ACTIVITY_CALLEDELEMENT` |
| `activiti:businessKey` | `ATTRIBUTE_CALL_ACTIVITY_BUSINESS_KEY` |
| `activiti:inheritBusinessKey` | `ATTRIBUTE_CALL_ACTIVITY_INHERIT_BUSINESS_KEY` |
| `activiti:inheritVariables` | `ATTRIBUTE_CALL_ACTIVITY_INHERITVARIABLES` |

**MultiInstance:**
| Attribute | Constant |
|---|---|
| `activiti:collection` | `ATTRIBUTE_MULTIINSTANCE_COLLECTION` |
| `activiti:elementVariable` | `ATTRIBUTE_MULTIINSTANCE_VARIABLE` |
| `activiti:elementIndexVariable` | `ATTRIBUTE_MULTIINSTANCE_INDEX_VARIABLE` |
| `isSequential` | `ATTRIBUTE_MULTIINSTANCE_SEQUENTIAL` |

**Field Injection (child of `activiti:field`):**
| Child element / attribute | Constant |
|---|---|
| `activiti:field` | `ELEMENT_FIELD` |
| `name` (on field) | `ATTRIBUTE_FIELD_NAME` |
| `stringValue` (on field) | `ATTRIBUTE_FIELD_STRING` |
| `expression` (on field) | `ATTRIBUTE_FIELD_EXPRESSION` |
| `<activiti:string>` | `ELEMENT_FIELD_STRING` |

**NOT VALID:** `<activiti:bean>` — this element does not exist.

**Common (any FlowNode):**
| Attribute | Constant |
|---|---|
| `activiti:async` | `ATTRIBUTE_ACTIVITY_ASYNCHRONOUS` |
| `activiti:exclusive` | `ATTRIBUTE_ACTIVITY_EXCLUSIVE` |
| `activiti:failedJobRetryTimeCycle` | `FAILED_JOB_RETRY_TIME_CYCLE` |

**Listeners:**
| Attribute | Constant |
|---|---|
| `activiti:executionListener` | `ELEMENT_EXECUTION_LISTENER` |
| `activiti:taskListener` | `ELEMENT_TASK_LISTENER` |
| `event` (on listener) | `ATTRIBUTE_LISTENER_EVENT` |
| `class` (on listener) | `ATTRIBUTE_LISTENER_CLASS` |
| `expression` (on listener) | `ATTRIBUTE_LISTENER_EXPRESSION` |
| `delegateExpression` (on listener) | `ATTRIBUTE_LISTENER_DELEGATEEXPRESSION` |

### 5. Verify unknown attributes

If an attribute is not in the table above, grep `BpmnXMLConstants.java` for its name. If no match, flag as potentially invalid.

---

## When to Use Me

Load this skill when:
- Creating a new BPMN documentation page
- Editing an existing BPMN page with XML examples
- Reviewing documentation changes
- Running pre-commit validation
