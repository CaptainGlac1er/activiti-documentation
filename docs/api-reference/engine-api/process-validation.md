---
sidebar_label: Process Validation
slug: /activiti-core/process-validation
description: Validator-set architecture for BPMN process definition validation with element-specific validators and localized error messages.
---

# Activiti Process Validation Module - Technical Documentation

**Module:** `activiti-core/activiti-process-validation`
**Package:** `org.activiti.validation`

---

## Overview

The **activiti-process-validation** module validates BPMN process definitions against the rules required to be executable by the Activiti engine. It uses a **validator-set** architecture: a `ProcessValidator` holds one or more `ValidatorSet` instances, each containing a collection of individual `Validator` implementations. Every validator checks specific aspects of the `BpmnModel` and populates a shared `List<ValidationError>`.

### Key Characteristics

- **Not a rule-engine** — there is no `ValidationRule`, `RuleRegistry`, or `ValidationReport` class. Validation produces a flat `List<ValidationError>`.
- **Validator-set architecture** — validators are grouped into named sets via `ValidatorSet`. The default set is `"activiti-executable-process"`.
- **Element-specific validators** — each BPMN element type (ServiceTask, StartEvent, ExclusiveGateway, etc.) has its own validator class.
- **Localized messages** — error descriptions are loaded from `process-validation-messages.json` and parameterized with `{{paramName}}` placeholders via `ValidationErrorDecorator`.
- **Warnings vs. errors** — each `ValidationError` carries a `isWarning` flag.

---

## Core API

### ProcessValidator

```java
package org.activiti.validation;

public interface ProcessValidator {

  List<ValidationError> validate(BpmnModel bpmnModel);

  List<ValidatorSet> getValidatorSets();
}
```

The entry point for validation. Calling `validate()` returns a flat list of all `ValidationError` objects found across all configured `ValidatorSet` instances.

### ProcessValidatorImpl

```java
package org.activiti.validation;

public class ProcessValidatorImpl implements ProcessValidator {

  protected List<ValidatorSet> validatorSets;
  protected ValidationErrorDecorator validationErrorDecorator;

  public ProcessValidatorImpl() { ... }

  public List<ValidationError> validate(BpmnModel bpmnModel);
  public List<ValidatorSet> getValidatorSets();
  public void setValidatorSets(List<ValidatorSet> validatorSets);
  public void addValidatorSet(ValidatorSet validatorSet);
}
```

Iterates each `ValidatorSet`, then each `Validator` within the set. After collection, sets `validatorSetName` on each error and runs `ValidationErrorDecorator.decorate()`.

### ProcessValidatorFactory

```java
package org.activiti.validation;

public class ProcessValidatorFactory {

  public ProcessValidator createDefaultProcessValidator();
}
```

Creates a `ProcessValidatorImpl` pre-configured with the `activiti-executable-process` validator set.

---

## Validator Hierarchy

```
Validator (interface)
  |
  +-- validate(BpmnModel bpmnModel, List<ValidationError> errors)
  |
  +-- ValidatorImpl (abstract)
  |     |
  |     +-- addError(errors, problem)
  |     +-- addError(errors, problem, params)
  |     +-- addError(errors, problem, baseElement)
  |     +-- addError(errors, problem, baseElement, params)
  |     +-- addError(errors, problem, process, baseElement)
  |     +-- addError(errors, problem, process, baseElement, params)
  |     +-- addError(errors, problem, process, baseElement, isWarning)
  |     +-- addError(errors, problem, process, baseElement, isWarning, params)
  |     +-- addError(errors, problem, process, id)
  |     +-- addWarning(errors, problem, process, baseElement)
  |     +-- addWarning(errors, problem, process, baseElement, params)
  |     |
  |     +-- ProcessLevelValidator (abstract)
  |           |
  |           +-- validate() delegates to executeValidation() for each Process
  |           +-- protected abstract void executeValidation(
  |                   BpmnModel bpmnModel, Process process, List<ValidationError> errors)
  |           |
  |           +-- ExternalInvocationTaskValidator (abstract)
  |                 |
  |                 +-- validateFieldDeclarationsForEmail(...)
  |                 +-- validateFieldDeclarationsForShell(...)
  |                 +-- validateFieldDeclarationsForDmn(...)
  |                 |
  |                 +-- ServiceTaskValidator
  |                 +-- SendTaskValidator
  |
  +-- Validators that do NOT extend ProcessLevelValidator:
        +-- BpmnModelValidator
        +-- AssociationValidator
        +-- SignalValidator
        +-- ErrorValidator
        +-- MessageValidator
        +-- OperationValidator
        +-- DiagramInterchangeInfoValidator
```

Process-level validators (`ProcessLevelValidator` subclasses) automatically iterate over all `Process` objects in the `BpmnModel`. Non-process-level validators perform model-wide checks (signals, errors, messages, DI references).

---

## ValidatorSet Architecture

### ValidatorSet

```java
package org.activiti.validation.validator;

public class ValidatorSet {

  protected String name;
  protected Map<Class<? extends Validator>, Validator> validators;

  public ValidatorSet(String name);
  public String getName();
  public void setName(String name);
  public Collection<Validator> getValidators();
  public void setValidators(Collection<? extends Validator> validators);
  public void addValidator(Validator validator);
  public void removeValidator(Class<? extends Validator> validatorClass);
}
```

Groups validators under a named set. Validators are keyed by their runtime class. Calling `removeValidator(StartEventValidator.class)` disables that specific validator for the set.

### ValidatorSetNames

```java
package org.activiti.validation.validator;

public interface ValidatorSetNames {
  String ACTIVITI_EXECUTABLE_PROCESS = "activiti-executable-process";
}
```

### ValidatorSetFactory

```java
package org.activiti.validation.validator;

public class ValidatorSetFactory {

  public ValidatorSet createActivitiExecutableProcessValidatorSet();
}
```

Creates the default validator set containing all 21 built-in validators:

| Validator | Extends | Purpose |
|---|---|---|
| `AssociationValidator` | `ValidatorImpl` | Checks `sourceRef` / `targetRef` on association artifacts |
| `SignalValidator` | `ValidatorImpl` | Validates signal definitions: id, name, scope, duplicates |
| `OperationValidator` | `ValidatorImpl` | Verifies `inMessageRef` on BPMN operations |
| `ErrorValidator` | `ValidatorImpl` | Ensures error definitions have a non-blank `errorCode` |
| `DataObjectValidator` | `ProcessLevelValidator` | Validates that data objects have a name |
| `BpmnModelValidator` | `ValidatorImpl` | Checks executable processes, unique IDs, length constraints |
| `FlowElementValidator` | `ProcessLevelValidator` | Validates ID length, multi-instance collection, data associations |
| `StartEventValidator` | `ProcessLevelValidator` | Validates event definitions and multiple none start events |
| `SequenceflowValidator` | `ProcessLevelValidator` | Checks source/target refs, scope, conditional expressions |
| `UserTaskValidator` | `ProcessLevelValidator` | Validates task listener implementation |
| `ServiceTaskValidator` | `ExternalInvocationTaskValidator` | Checks implementation, type, result variable, webservice |
| `ScriptTaskValidator` | `ProcessLevelValidator` | Ensures script body is not empty |
| `SendTaskValidator` | `ExternalInvocationTaskValidator` | Validates type, implementation, webservice ref |
| `ExclusiveGatewayValidator` | `ProcessLevelValidator` | Checks outgoing flows, conditions, default flow |
| `EventGatewayValidator` | `ProcessLevelValidator` | Ensures targets are `IntermediateCatchEvent` |
| `SubprocessValidator` | `ProcessLevelValidator` | Validates start events inside non-event subprocesses |
| `EventSubprocessValidator` | `ProcessLevelValidator` | Validates start event definitions in event subprocesses |
| `BoundaryEventValidator` | `ProcessLevelValidator` | Checks event definitions, cancel, compensate, message uniqueness |
| `IntermediateCatchEventValidator` | `ProcessLevelValidator` | Validates event definition type |
| `IntermediateThrowEventValidator` | `ProcessLevelValidator` | Validates throw event definition type |
| `MessageValidator` | `ValidatorImpl` | Checks message `itemRef` against item definitions |
| `EventValidator` | `ProcessLevelValidator` | Cross-cutting event rules: messageRef, signalRef, timer, compensation, link |
| `EndEventValidator` | `ProcessLevelValidator` | Validates cancel end event inside transaction |
| `ExecutionListenerValidator` | `ProcessLevelValidator` | Checks listener implementation and transaction constraints |
| `ActivitiEventListenerValidator` | `ProcessLevelValidator` | Validates event listener implementation types |
| `DiagramInterchangeInfoValidator` | `ValidatorImpl` | Validates DI references against BPMN elements |

---

## ValidationError

```java
package org.activiti.validation;

public class ValidationError {

  protected String validatorSetName;
  protected String problem;
  protected String defaultDescription;
  protected String processDefinitionId;
  protected String processDefinitionName;
  protected int xmlLineNumber;
  protected int xmlColumnNumber;
  protected String activityId;
  protected String activityName;
  protected boolean isWarning;
  protected String key;
  protected Map<String, String> params;

  // Getters and setters for all fields above.
}
```

| Field | Type | Description |
|---|---|---|
| `validatorSetName` | `String` | Name of the `ValidatorSet` that produced this error (e.g. `"activiti-executable-process"`) |
| `problem` | `String` | The resolved, localized problem code (e.g. `"activiti-servicetask-missing-implementation"`) |
| `defaultDescription` | `String` | The resolved, human-readable description with `{{params}}` substituted |
| `processDefinitionId` | `String` | ID of the process that contains the error |
| `processDefinitionName` | `String` | Name of the process that contains the error |
| `xmlLineNumber` | `int` | Source XML line number from `BaseElement.getXmlRowNumber()` |
| `xmlColumnNumber` | `int` | Source XML column number from `BaseElement.getXmlColumnNumber()` |
| `activityId` | `String` | ID of the flow element that triggered the error |
| `activityName` | `String` | Name of the flow element that triggered the error |
| `isWarning` | `boolean` | `true` for warnings, `false` for errors |
| `key` | `String` | The original `Problems` constant used to look up the message |
| `params` | `Map<String, String>` | Key-value pairs for `{{paramName}}` substitution in messages |

`toString()` produces output like:

```
[Validation set: 'activiti-executable-process' | Problem: 'activiti-servicetask-missing-implementation'] : One of the attributes 'implementation', 'class', ... - [Extra info : processDefinitionId = myProcess | id = myServiceTask | activityName = My Task]
```

---

## Error Message System

### ErrorMessageDefinition

```java
package org.activiti.validation.validator;

class ErrorMessageDefinition {
  private String problem;
  private String description;
}
```

Simple DTO mapping a `Problems` constant key to a localized `problem` code and human-readable `description`.

### ValidationErrorDecorator

```java
package org.activiti.validation.validator;

public class ValidationErrorDecorator {

  public static final String PARAM_PREFIX = "{{";
  public static final String PARAM_SUFFIX = "}}";

  public ValidationErrorDecorator();
  public void init();
  public void decorate(ValidationError error);
  public String resolveMessage(String message, Map<String, String> params);
}
```

Loads `/process-validation-messages.json` via Jackson on construction. `decorate()` resolves the `problem` and `defaultDescription` from the JSON using `error.getKey()` as the lookup key, then substitutes `{{paramName}}` placeholders from `error.getParams()` using Apache Commons Text `StringSubstitutor`.

### process-validation-messages.json

Located at `src/main/resources/process-validation-messages.json`. Maps each `Problems` constant to a `problem` code and `description`. Example entries:

```json
{
  "SERVICE_TASK_MISSING_IMPLEMENTATION": {
    "problem": "activiti-servicetask-missing-implementation",
    "description": "One of the attributes 'implementation', 'class', 'delegateExpression', 'type', 'operation', or 'expression' is mandatory on serviceTask."
  },
  "BPMN_MODEL_TARGET_NAMESPACE_TOO_LONG": {
    "problem": "activiti-bpmn-model-target-namespace-too-long",
    "description": "The targetNamespace of the bpmn model must not contain more than {{maxLength}} characters"
  }
}
```

### Problems

```java
package org.activiti.validation.validator;

public interface Problems {
  String ALL_PROCESS_DEFINITIONS_NOT_EXECUTABLE = "ALL_PROCESS_DEFINITIONS_NOT_EXECUTABLE";
  String PROCESS_DEFINITION_NOT_EXECUTABLE = "PROCESS_DEFINITION_NOT_EXECUTABLE";
  String ASSOCIATION_INVALID_SOURCE_REFERENCE = "ASSOCIATION_INVALID_SOURCE_REFERENCE";
  String ASSOCIATION_INVALID_TARGET_REFERENCE = "ASSOCIATION_INVALID_TARGET_REFERENCE";
  String EXECUTION_LISTENER_IMPLEMENTATION_MISSING = "EXECUTION_LISTENER_IMPLEMENTATION_MISSING";
  String EXECUTION_LISTENER_INVALID_IMPLEMENTATION_TYPE = "EXECUTION_LISTENER_INVALID_IMPLEMENTATION_TYPE";
  String EVENT_LISTENER_IMPLEMENTATION_MISSING = "EVENT_LISTENER_IMPLEMENTATION_MISSING";
  String EVENT_LISTENER_INVALID_IMPLEMENTATION = "EVENT_LISTENER_INVALID_IMPLEMENTATION";
  String EVENT_LISTENER_INVALID_THROW_EVENT_TYPE = "EVENT_LISTENER_INVALID_THROW_EVENT_TYPE";
  String START_EVENT_MULTIPLE_FOUND = "START_EVENT_MULTIPLE_FOUND";
  String START_EVENT_INVALID_EVENT_DEFINITION = "START_EVENT_INVALID_EVENT_DEFINITION";
  String SEQ_FLOW_INVALID_SRC = "SEQ_FLOW_INVALID_SRC";
  String SEQ_FLOW_INVALID_TARGET = "SEQ_FLOW_INVALID_TARGET";
  String SEQ_FLOW_INVALID_TARGET_DIFFERENT_SCOPE = "SEQ_FLOW_INVALID_TARGET_DIFFERENT_SCOPE";
  String SEQ_FLOW_INVALID_CONDITIONAL_EXPRESSION = "SEQ_FLOW_INVALID_CONDITIONAL_EXPRESSION";
  String USER_TASK_LISTENER_IMPLEMENTATION_MISSING = "USER_TASK_LISTENER_IMPLEMENTATION_MISSING";
  String SERVICE_TASK_INVALID_TYPE = "SERVICE_TASK_INVALID_TYPE";
  String SERVICE_TASK_RESULT_VAR_NAME_WITH_DELEGATE = "SERVICE_TASK_RESULT_VAR_NAME_WITH_DELEGATE";
  String SERVICE_TASK_MISSING_IMPLEMENTATION = "SERVICE_TASK_MISSING_IMPLEMENTATION";
  String SERVICE_TASK_WEBSERVICE_INVALID_OPERATION_REF = "SERVICE_TASK_WEBSERVICE_INVALID_OPERATION_REF";
  String SEND_TASK_INVALID_IMPLEMENTATION = "SEND_TASK_INVALID_IMPLEMENTATION";
  String SEND_TASK_INVALID_TYPE = "SEND_TASK_INVALID_TYPE";
  String SEND_TASK_WEBSERVICE_INVALID_OPERATION_REF = "SEND_TASK_WEBSERVICE_INVALID_OPERATION_REF";
  String SCRIPT_TASK_MISSING_SCRIPT = "SCRIPT_TASK_MISSING_SCRIPT";
  String MAIL_TASK_NO_RECIPIENT = "MAIL_TASK_NO_RECIPIENT";
  String MAIL_TASK_NO_CONTENT = "MAIL_TASK_NO_CONTENT";
  String SHELL_TASK_NO_COMMAND = "SHELL_TASK_NO_COMMAND";
  String SHELL_TASK_INVALID_PARAM = "SHELL_TASK_INVALID_PARAM";
  String DMN_TASK_NO_KEY = "DMN_TASK_NO_KEY";
  String EXCLUSIVE_GATEWAY_NO_OUTGOING_SEQ_FLOW = "EXCLUSIVE_GATEWAY_NO_OUTGOING_SEQ_FLOW";
  String EXCLUSIVE_GATEWAY_CONDITION_NOT_ALLOWED_ON_SINGLE_SEQ_FLOW = "EXCLUSIVE_GATEWAY_CONDITION_NOT_ALLOWED_ON_SINGLE_SEQ_FLOW";
  String EXCLUSIVE_GATEWAY_CONDITION_ON_DEFAULT_SEQ_FLOW = "EXCLUSIVE_GATEWAY_CONDITION_ON_DEFAULT_SEQ_FLOW";
  String EXCLUSIVE_GATEWAY_SEQ_FLOW_WITHOUT_CONDITIONS = "EXCLUSIVE_GATEWAY_SEQ_FLOW_WITHOUT_CONDITIONS";
  String EVENT_GATEWAY_ONLY_CONNECTED_TO_INTERMEDIATE_EVENTS = "EVENT_GATEWAY_ONLY_CONNECTED_TO_INTERMEDIATE_EVENTS";
  String BPMN_MODEL_TARGET_NAMESPACE_TOO_LONG = "BPMN_MODEL_TARGET_NAMESPACE_TOO_LONG";
  String PROCESS_DEFINITION_ID_NOT_UNIQUE = "PROCESS_DEFINITION_ID_NOT_UNIQUE";
  String PROCESS_DEFINITION_ID_TOO_LONG = "PROCESS_DEFINITION_ID_TOO_LONG";
  String PROCESS_DEFINITION_NAME_TOO_LONG = "PROCESS_DEFINITION_NAME_TOO_LONG";
  String PROCESS_DEFINITION_DOCUMENTATION_TOO_LONG = "PROCESS_DEFINITION_DOCUMENTATION_TOO_LONG";
  String FLOW_ELEMENT_ID_TOO_LONG = "FLOW_ELEMENT_ID_TOO_LONG";
  String SUBPROCESS_MULTIPLE_START_EVENTS = "SUBPROCESS_MULTIPLE_START_EVENTS";
  String SUBPROCESS_START_EVENT_EVENT_DEFINITION_NOT_ALLOWED = "SUBPROCESS_START_EVENT_EVENT_DEFINITION_NOT_ALLOWED";
  String EVENT_SUBPROCESS_INVALID_START_EVENT_DEFINITION = "EVENT_SUBPROCESS_INVALID_START_EVENT_DEFINITION";
  String BOUNDARY_EVENT_NO_EVENT_DEFINITION = "BOUNDARY_EVENT_NO_EVENT_DEFINITION";
  String BOUNDARY_EVENT_INVALID_EVENT_DEFINITION = "BOUNDARY_EVENT_INVALID_EVENT_DEFINITION";
  String BOUNDARY_EVENT_CANCEL_ONLY_ON_TRANSACTION = "BOUNDARY_EVENT_CANCEL_ONLY_ON_TRANSACTION";
  String BOUNDARY_EVENT_MULTIPLE_CANCEL_ON_TRANSACTION = "BOUNDARY_EVENT_MULTIPLE_CANCEL_ON_TRANSACTION";
  String INTERMEDIATE_CATCH_EVENT_NO_EVENTDEFINITION = "INTERMEDIATE_CATCH_EVENT_NO_EVENTDEFINITION";
  String INTERMEDIATE_CATCH_EVENT_INVALID_EVENTDEFINITION = "INTERMEDIATE_CATCH_EVENT_INVALID_EVENTDEFINITION";
  String ERROR_MISSING_ERROR_CODE = "ERROR_MISSING_ERROR_CODE";
  String EVENT_TIMER_MISSING_CONFIGURATION = "EVENT_TIMER_MISSING_CONFIGURATION";
  String THROW_EVENT_INVALID_EVENTDEFINITION = "THROW_EVENT_INVALID_EVENTDEFINITION";
  String MULTI_INSTANCE_MISSING_COLLECTION = "MULTI_INSTANCE_MISSING_COLLECTION";
  String MESSAGE_INVALID_ITEM_REF = "MESSAGE_INVALID_ITEM_REF";
  String MESSAGE_EVENT_MISSING_MESSAGE_REF = "MESSAGE_EVENT_MISSING_MESSAGE_REF";
  String MESSAGE_EVENT_INVALID_MESSAGE_REF = "MESSAGE_EVENT_INVALID_MESSAGE_REF";
  String MESSAGE_EVENT_MULTIPLE_ON_BOUNDARY_SAME_MESSAGE_ID = "MESSAGE_EVENT_MULTIPLE_ON_BOUNDARY_SAME_MESSAGE_ID";
  String OPERATION_INVALID_IN_MESSAGE_REFERENCE = "OPERATION_INVALID_IN_MESSAGE_REFERENCE";
  String SIGNAL_EVENT_MISSING_SIGNAL_REF = "SIGNAL_EVENT_MISSING_SIGNAL_REF";
  String SIGNAL_EVENT_INVALID_SIGNAL_REF = "SIGNAL_EVENT_INVALID_SIGNAL_REF";
  String COMPENSATE_EVENT_INVALID_ACTIVITY_REF = "COMPENSATE_EVENT_INVALID_ACTIVITY_REF";
  String COMPENSATE_EVENT_MULTIPLE_ON_BOUNDARY = "COMPENSATE_EVENT_MULTIPLE_ON_BOUNDARY";
  String SIGNAL_MISSING_ID = "SIGNAL_MISSING_ID";
  String SIGNAL_MISSING_NAME = "SIGNAL_MISSING_NAME";
  String SIGNAL_DUPLICATE_NAME = "SIGNAL_DUPLICATE_NAME";
  String SIGNAL_INVALID_SCOPE = "SIGNAL_INVALID_SCOPE";
  String DATA_ASSOCIATION_MISSING_TARGETREF = "DATA_ASSOCIATION_MISSING_TARGETREF";
  String DATA_OBJECT_MISSING_NAME = "DATA_OBJECT_MISSING_NAME";
  String END_EVENT_CANCEL_ONLY_INSIDE_TRANSACTION = "END_EVENT_CANCEL_ONLY_INSIDE_TRANSACTION";
  String DI_INVALID_REFERENCE = "DI_INVALID_REFERENCE";
  String DI_DOES_NOT_REFERENCE_FLOWNODE = "DI_DOES_NOT_REFERENCE_FLOWNODE";
  String DI_DOES_NOT_REFERENCE_SEQ_FLOW = "DI_DOES_NOT_REFERENCE_SEQ_FLOW";
  String FLOW_ELEMENT_ASYNC_NOT_AVAILABLE = "FLOW_ELEMENT_ASYNC_NOT_AVAILABLE";
  String EVENT_TIMER_ASYNC_NOT_AVAILABLE = "EVENT_TIMER_ASYNC_NOT_AVAILABLE";
  String SIGNAL_ASYNC_NOT_AVAILABLE = "SIGNAL_ASYNC_NOT_AVAILABLE";
  String LINK_EVENT_DEFINITION_MISSING_TARGET = "LINK_EVENT_DEFINITION_MISSING_TARGET";
  String LINK_EVENT_DEFINITION_MISSING_TARGET_EMPTY_NAME = "LINK_EVENT_DEFINITION_MISSING_TARGET_EMPTY_NAME";
  String LINK_EVENT_DEFINITION_MISSING_SOURCE = "LINK_EVENT_DEFINITION_MISSING_SOURCE";
  String LINK_EVENT_DEFINITION_MISSING_SOURCE_EMPTY_NAME = "LINK_EVENT_DEFINITION_MISSING_SOURCE_EMPTY_NAME";
}
```

### Constraints

```java
package org.activiti.validation.validator;

public class Constraints {
  public static final int BPMN_MODEL_TARGET_NAMESPACE_MAX_LENGTH = 255;
  public static final int PROCESS_DEFINITION_ID_MAX_LENGTH = 255;
  public static final int PROCESS_DEFINITION_NAME_MAX_LENGTH = 255;
  public static final int PROCESS_DEFINITION_DOCUMENTATION_MAX_LENGTH = 2000;
}
```

Database field length limits enforced by `BpmnModelValidator`.

---

## Element-Specific Validators

### BpmnModelValidator

Validates model-level constraints:

- At least one process definition must be executable (`process.isExecutable() == true`)
- Process definition IDs must be unique
- Process ID length &lt;= `PROCESS_DEFINITION_ID_MAX_LENGTH` (255)
- Process name length &lt;= `PROCESS_DEFINITION_NAME_MAX_LENGTH` (255)
- Process documentation length &lt;= `PROCESS_DEFINITION_DOCUMENTATION_MAX_LENGTH` (2000)
- Target namespace length &lt;= `BPMN_MODEL_TARGET_NAMESPACE_MAX_LENGTH` (255)

Non-executable processes produce a **warning** when at least one executable process exists. If all processes are non-executable, an **error** is raised.

### FlowElementValidator

Validates common activity constraints for each flow element:

- Activity ID length &lt;= 255 (`FLOW_ELEMENT_ID_TOO_LONG`)
- Multi-instance activities must have `loopCardinality` or `inputDataItem` (`MULTI_INSTANCE_MISSING_COLLECTION`)
- Data associations must have a `targetRef` (`DATA_ASSOCIATION_MISSING_TARGETREF`)

Recursively processes sub-process elements.

### StartEventValidator

- Only one none start event per process is allowed (`START_EVENT_MULTIPLE_FOUND`)
- Event definitions on start events must be `MessageEventDefinition`, `TimerEventDefinition`, or `SignalEventDefinition` (`START_EVENT_INVALID_EVENT_DEFINITION`)

### SequenceflowValidator

- `sourceRef` and `targetRef` must be non-empty and reference valid flow elements
- Source and target must be in the same scope (sub-process boundary)
- Conditional expressions are parsed via `ExpressionFactory` — invalid EL produces an error

### UserTaskValidator

- Task listeners must have both `implementation` and `implementationType` set

### ServiceTaskValidator (extends ExternalInvocationTaskValidator)

- Must have `implementation`, `class`, `delegateExpression`, `type`, `operation`, or `expression`
- When `type` is set, must be one of: `mail`, `mule`, `camel`, `shell`, `dmn`
- `resultVariableName` is not allowed with `class` or `delegateExpression` implementation types
- `mail` type requires `to` and `text`/`html`/`textVar`/`htmlVar` field extensions
- `shell` type requires `command` field extension; `wait`, `redirectError`, `cleanEnv` must be `"true"` or `"false"`
- `dmn` type requires `decisionTableReferenceKey` field extension
- Web service implementation type requires a valid `operationRef`

### SendTaskValidator (extends ExternalInvocationTaskValidator)

- Must have `type` or `operation` (webservice) set
- `type` must be one of: `mail`, `mule`, `camel`
- `mail` type validates same field extensions as ServiceTaskValidator
- Web service implementation type requires a valid `operationRef`

### ScriptTaskValidator

- Script body must not be empty

### ExclusiveGatewayValidator

- Must have at least one outgoing sequence flow
- Single outgoing flow must not have a condition expression
- Default flow must not have a condition expression
- Outgoing flows without conditions (and not marked as default) produce a **warning**

### EventGatewayValidator

- All outgoing sequence flow targets must be `IntermediateCatchEvent`

### SubprocessValidator

- Non-event sub-processes may have at most one start event
- Start events inside non-event sub-processes must not have event definitions

### EventSubprocessValidator

- Start events inside event sub-processes must have exactly one event definition of type `ErrorEventDefinition`, `MessageEventDefinition`, or `SignalEventDefinition`

### BoundaryEventValidator

- Must have an event definition
- Event definition must be one of: `Timer`, `Error`, `Signal`, `Cancel`, `Message`, `Compensate`
- Cancel boundary events only valid on transactions
- Only one cancel boundary event per transaction
- Only one compensate boundary event per attached element
- Multiple message boundary events on the same element with the same `messageRef` are invalid

### IntermediateCatchEventValidator

- Must have an event definition
- Event definition must be one of: `Timer`, `Signal`, `Message`, `Link`

### IntermediateThrowEventValidator

- If event definition present, must be one of: `Signal`, `Compensate`, `Message`, `Link`

### EndEventValidator

- Cancel end events must be inside a transaction sub-process

### EventValidator

Cross-cutting validation for all event types:

- **Message events**: `messageRef` must be set (or `messageExpression`), and must reference an existing message in the model
- **Signal events**: `signalRef` must be set (or `signalExpression`), and must reference an existing signal in the model
- **Timer events**: must have `timeDate`, `timeCycle`, or `timeDuration` configured
- **Compensate events**: `activityRef` must reference an existing activity in the process
- **Link events**: throw events must have a `target`; catch events must have at least one `source`

### AssociationValidator

- `sourceRef` and `targetRef` must be non-empty on both global and process-level associations

### SignalValidator

- Signals must have non-empty `id` and `name`
- Signal names must be unique
- Signal `scope` must be `"global"` or `"processInstance"`

### ErrorValidator

- Error definitions must have a non-blank `errorCode`

### MessageValidator

- Message `itemRef`, if present, must reference an existing item definition

### OperationValidator

- Operation `inMessageRef` must reference an existing message in the model

### DataObjectValidator

- Data objects (including those in sub-processes) must have a non-empty `name`

### ExecutionListenerValidator

- Listeners must have both `implementation` and `implementationType` set
- Expression implementation type is not allowed with `onTransaction`

### ActivitiEventListenerValidator

- Event listeners must have a valid `implementationType`: `class`, `delegateExpression`, `throwSignalEvent`, `throwGlobalSignalEvent`, `throwMessageEvent`, or `throwErrorEvent`

### DiagramInterchangeInfoValidator

- Validates DI (`locationMap`, `flowLocationMap`) references against BPMN elements
- Produces **warnings** for invalid references or type mismatches

---

## Usage

### Basic Validation

```java
ProcessValidatorFactory factory = new ProcessValidatorFactory();
ProcessValidator validator = factory.createDefaultProcessValidator();

BpmnModel bpmnModel = ...;
List<ValidationError> errors = validator.validate(bpmnModel);

for (ValidationError error : errors) {
    if (error.isWarning()) {
        System.out.println("[WARN] " + error.getDefaultDescription());
    } else {
        System.err.println("[ERROR] " + error.getDefaultDescription());
    }
}
```

### Disabling a Specific Validator

```java
ProcessValidatorImpl validator = new ProcessValidatorImpl();
ValidatorSet validatorSet = new ValidatorSetFactory().createActivitiExecutableProcessValidatorSet();
validatorSet.removeValidator(StartEventValidator.class);
validator.addValidatorSet(validatorSet);

List<ValidationError> errors = validator.validate(bpmnModel);
```

### Inspecting Validation Errors

```java
List<ValidationError> errors = validator.validate(bpmnModel);

for (ValidationError error : errors) {
    String problemCode = error.getProblem();
    String description = error.getDefaultDescription();
    String processId = error.getProcessDefinitionId();
    String elementId = error.getActivityId();
    int line = error.getXmlLineNumber();
    int col = error.getXmlColumnNumber();
    boolean warning = error.isWarning();
    Map<String, String> params = error.getParams();
}
```

---

## Validation Flow

```
ProcessValidatorFactory.createDefaultProcessValidator()
  |
  +-- ProcessValidatorImpl
        |
        +-- ValidatorSet("activiti-executable-process")
              |
              +-- 21 Validator instances
                    |
                    |-- Each calls validate(bpmnModel, errors)
                    |-- Non-process validators check model-wide concerns
                    |-- ProcessLevelValidators iterate each Process
                    |-- Errors collected via ValidatorImpl.addError(...)
                    |
                    +-- After collection:
                         |-- ValidationError.setValidatorSetName(setName)
                         |-- ValidationErrorDecorator.decorate(error)
                              |-- Look up problem/description from JSON
                              |-- Substitute {{params}} placeholders
                    |
                    +-- Returns flat List<ValidationError>
```

---

## See Also

- [BPMN Model API](./bpmn-model.md)
- [Engine API Overview](./README.md)
