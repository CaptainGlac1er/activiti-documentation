---
sidebar_label: Custom Validators
slug: /advanced/custom-validators
title: "Custom Validators"
description: "Write and register custom BPMN validators to enforce organization-specific process rules at deployment time."
---

# Custom Validators

Activiti's validation framework checks BPMN process definitions against a set of rules before deployment. You can **write custom validators** to enforce organization-specific constraints — such as requiring certain attributes on user tasks, restricting gateway patterns, or validating custom extension elements.

## Architecture Recap

Validation is organized in a **validator-set** architecture:

```
ProcessValidatorImpl
  └── ValidatorSet ("activiti-executable-process")
        ├── UserTaskValidator
        ├── ServiceTaskValidator
        ├── ExclusiveGatewayValidator
        ├── ... (21 built-in validators)
        └── YourCustomValidator
```

Each `Validator` iterates over the `BpmnModel` and adds `ValidationError` objects to a shared list. The `ProcessValidatorImpl` aggregates all errors from all validator sets.

## Writing a Custom Validator

### Basic Validator

Extend `ValidatorImpl` for access to `addError()` and `addWarning()` helpers:

```java
public class RequiredAssigneeValidator extends ValidatorImpl {

    @Override
    public void validate(BpmnModel model, List<ValidationError> errors) {
        for (Process process : model.getProcesses()) {
            for (FlowElement element : process.getFlowElements()) {
                if (element instanceof UserTask) {
                    UserTask userTask = (UserTask) element;

                    if (userTask.getAssignee() == null
                        && userTask.getCandidateUsers() == null
                        && userTask.getCandidateGroups() == null) {

                        addError(errors,
                            "UserTask '" + userTask.getName()
                                + "' has no assignee or candidates",
                            userTask, process.getId());
                    }
                }
            }
        }
    }
}
```

### Process-Level Validator

For validators that need to check across all processes in a model, extend `ProcessLevelValidator`:

```java
public class NoTerminateEndEventValidator extends ProcessLevelValidator {

    @Override
    protected void executeValidate(BpmnModel model,
                                   Process process,
                                   List<ValidationError> errors) {
        for (FlowElement element : process.getFlowElements()) {
            if (element instanceof EndEvent) {
                EndEvent endEvent = (EndEvent) element;
                if (endEvent.getTerminateEventDefinition() != null) {
                    addError(errors,
                        "Terminate end events are not allowed: " + endEvent.getId(),
                        endEvent, process.getId());
                }
            }
        }
    }
}
```

### Helper Methods

`ValidatorImpl` provides overloaded convenience methods:

```java
// Add error with element context
addError(errors, "message", element, processId);
addError(errors, "message", element, processId, activityId);

// Add warning (still appears in error list but isWarning=true)
addWarning(errors, "message", element, processId);

// These automatically populate:
// - activityId, activityName, processDefinitionId, processDefinitionName
// - xmlLineNumber, xmlColumnNumber from the element
```

## Registering a Custom Validator

### Option 1: Replace the Default Validator

```java
ProcessValidatorImpl customValidator = new ProcessValidatorImpl();

// Add your validator to the default set
ValidatorSet defaultSet = customValidator.getValidatorSets()
    .stream()
    .filter(v -> v.getName().equals("activiti-executable-process"))
    .findFirst()
    .orElse(null);

if (defaultSet != null) {
    defaultSet.addValidator(new RequiredAssigneeValidator());
    defaultSet.addValidator(new NoTerminateEndEventValidator());
}

// Configure the engine
ProcessEngineConfiguration config = ...;
config.setProcessValidator(customValidator);
```

### Option 2: Create a New Validator Set

```java
ProcessValidatorImpl customValidator = new ProcessValidatorImpl();

ValidatorSet companySet = new ValidatorSet("company-rules");
companySet.addValidator(new RequiredAssigneeValidator());
companySet.addValidator(new NoTerminateEndEventValidator());

customValidator.addValidatorSet(companySet);

ProcessEngineConfiguration config = ...;
config.setProcessValidator(customValidator);
```

### Option 3: Spring Boot Configuration

```java
@Configuration
public class ValidatorConfiguration {

    @Bean
    public ProcessValidator customProcessValidator() {
        ProcessValidatorImpl validator = ProcessValidatorFactory.createDefaultProcessValidator();

        ValidatorSet defaultSet = validator.getValidatorSets()
            .stream()
            .filter(v -> v.getName().equals("activiti-executable-process"))
            .findFirst()
            .get();

        defaultSet.addValidator(new RequiredAssigneeValidator());
        return validator;
    }
}
```

## Accessing Error Details

After validation, each `ValidationError` carries rich context:

```java
List<ValidationError> errors = repositoryService
    .validateProcess(bpmnModel);

for (ValidationError error : errors) {
    System.out.println("Validator: " + error.getValidatorSetName());
    System.out.println("Problem:   " + error.getDefaultDescription());
    System.out.println("Activity:  " + error.getActivityId());
    System.out.println("Process:   " + error.getProcessDefinitionId());
    System.out.println("Line:      " + error.getXmlLineNumber());
    System.out.println("Warning:   " + error.isWarning());
    System.out.println("Key:       " + error.getKey());
}
```

## Error Message Customization

Error messages are loaded from `process-validation-messages.json` with `{{paramName}}` placeholder substitution via `ValidationErrorDecorator`. Your custom validator can use this system:

1. Add entries to the messages JSON
2. Reference them with `addError(errors, "my.error.key", element, processId)` and pass params

Or use the `Problems` interface constants for built-in error codes.

## Disabling Validators

Remove a built-in validator from a set:

```java
ValidatorSet defaultSet = customValidator.getValidatorSets()
    .stream()
    .filter(v -> v.getName().equals("activiti-executable-process"))
    .findFirst()
    .get();

// Remove the script task validator
defaultSet.removeValidator(ScriptTaskValidator.class);
```

## Common Use Cases

| Validator | Purpose |
|-----------|---------|
| **Required assignee** | Ensure all user tasks have explicit assignment |
| **No terminate end events** | Prevent terminate patterns that kill parallel branches |
| **Max subprocess depth** | Limit nesting to prevent performance issues |
| **Required boundary events** | Ensure service tasks have error boundaries |
| **Custom attribute validation** | Validate `activiti:*` extension values against company standards |
| **Gateway pattern enforcement** | Require default flows on exclusive gateways |
| **Timer expression validation** | Restrict timer patterns to approved formats |

## Example: Gateway Default Flow Validator

```java
public class GatewayDefaultFlowValidator extends ProcessLevelValidator {

    @Override
    protected void executeValidate(BpmnModel model,
                                   Process process,
                                   List<ValidationError> errors) {
        for (FlowElement element : process.getFlowElements()) {
            if (element instanceof ExclusiveGateway) {
                ExclusiveGateway gateway = (ExclusiveGateway) element;
                if (gateway.getDefaultFlow() == null) {
                    addWarning(errors,
                        "ExclusiveGateway '" + gateway.getId()
                            + "' has no default flow",
                        gateway, process.getId());
                }
            }
        }
    }
}
```

## Related Documentation

- [Process Validation API](../api-reference/engine-api/process-validation.md) — Core API, built-in validators, error messages
- [Engine Configuration](../configuration.md) — `setProcessValidator()` configuration
- [Process Validation Module](../api-reference/engine-api/process-validation.md) — Validator architecture and error constants
