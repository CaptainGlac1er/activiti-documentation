---
sidebar_label: Process Validation
slug: /activiti-core/process-validation
description: Comprehensive validation capabilities for BPMN process definitions with syntax, semantic, and best practice checks.
---

# Activiti Process Validation Module - Technical Documentation

**Module:** `activiti-core/activiti-process-validation`

**Target Audience:** Senior Software Engineers, BPMN Specialists

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Validation Rules](#validation-rules)
- [Error Reporting](#error-reporting)
- [Best Practice Checks](#best-practice-checks)
- [Custom Validators](#custom-validators)
- [Performance Considerations](#performance-considerations)
- [Usage Examples](#usage-examples)
- [Integration](#integration)
- [API Reference](#api-reference)

---

## Overview

The **activiti-process-validation** module provides comprehensive validation capabilities for BPMN process definitions. It checks for correctness, completeness, and adherence to best practices before processes are deployed to the engine.

### Key Features

- **Syntax Validation**: Check BPMN 2.0 compliance
- **Semantic Validation**: Verify business logic correctness
- **Best Practice Checks**: Suggest improvements
- **Error Reporting**: Detailed validation feedback
- **Custom Rules**: Extensible validation framework
- **Pre-Deployment Checks**: Catch issues early

### Module Structure

```
activiti-process-validation/
├── src/main/java/org/activiti/validation/
│   ├── ProcessValidator.java           # Main validator
│   ├── rules/
│   │   ├── SyntaxRule.java
│   │   ├── SemanticRule.java
│   │   └── BestPracticeRule.java
│   ├── reporters/
│   │   ├── ValidationError.java
│   │   └── ValidationReport.java
│   └── custom/
│       ├── CustomRule.java
│       └── RuleRegistry.java
└── src/test/java/
```

---

## Architecture

### Validation Pipeline

```
BPMN Model
     │
     ▼
┌─────────────┐
│ Syntax      │
│ Validator   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Semantic    │
│ Validator   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Best        │
│ Practice    │
│ Validator   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Custom      │
│ Validators  │
└──────┬──────┘
       │
       ▼
Validation Report
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ProcessValidator                         │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Rule            │  │ Rule            │                 │
│  │ Registry        │  │ Executor        │                 │
│  └────────┬────────┘  └────────┬────────┘                 │
│           │                    │                           │
│           └────────┬───────────┘                           │
│                    │                                       │
│                    ▼                                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Validation Rules                        │  │
│  │  - SyntaxRules                                       │  │
│  │  - SemanticRules                                     │  │
│  │  - BestPracticeRules                                 │  │
│  │  - CustomRules                                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Error Reporter                          │  │
│  │  - Collect errors                                    │  │
│  │  - Generate report                                   │  │
│  │  - Provide feedback                                  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### Syntax Rules

```java
public class SyntaxRule implements ValidationRule {
    
    @Override
    public void validate(BpmnModel model, ValidationContext context) {
        // Check for required attributes
        checkRequiredAttributes(model, context);
        
        // Check for valid IDs
        checkValidIds(model, context);
        
        // Check for valid references
        checkValidReferences(model, context);
        
        // Check for proper nesting
        checkProperNesting(model, context);
    }
    
    private void checkRequiredAttributes(BpmnModel model, 
                                         ValidationContext context) {
        for (Process process : model.getProcesses()) {
            if (process.getId() == null || process.getId().isEmpty()) {
                context.addError(
                    ValidationError.builder()
                        .code("SYNTAX_MISSING_ID")
                        .message("Process must have an ID")
                        .severity(Severity.ERROR)
                        .build());
            }
        }
        
        for (FlowElement element : getAllFlowElements(model)) {
            if (element.getId() == null || element.getId().isEmpty()) {
                context.addError(
                    ValidationError.builder()
                        .code("SYNTAX_MISSING_ELEMENT_ID")
                        .message("Flow element must have an ID")
                        .elementId(element.getId())
                        .severity(Severity.ERROR)
                        .build());
            }
        }
    }
    
    private void checkValidIds(BpmnModel model, ValidationContext context) {
        Set<String> ids = new HashSet<>();
        
        for (BaseElement element : getAllElements(model)) {
            if (element.getId() != null) {
                if (!isValidId(element.getId())) {
                    context.addError(
                        ValidationError.builder()
                            .code("SYNTAX_INVALID_ID")
                            .message("Invalid ID format: " + element.getId())
                            .elementId(element.getId())
                            .severity(Severity.ERROR)
                            .build());
                }
                
                if (ids.contains(element.getId())) {
                    context.addError(
                        ValidationError.builder()
                            .code("SYNTAX_DUPLICATE_ID")
                            .message("Duplicate ID: " + element.getId())
                            .elementId(element.getId())
                            .severity(Severity.ERROR)
                            .build());
                }
                
                ids.add(element.getId());
            }
        }
    }
    
    private boolean isValidId(String id) {
        return id != null && id.matches("^[a-zA-Z_][a-zA-Z0-9_]*$");
    }
}
```

### Semantic Rules

```java
public class SemanticRule implements ValidationRule {
    
    @Override
    public void validate(BpmnModel model, ValidationContext context) {
        // Check for unreachable elements
        checkUnreachableElements(model, context);
        
        // Check for infinite loops
        checkInfiniteLoops(model, context);
        
        // Check for proper event usage
        checkEventUsage(model, context);
        
        // Check for gateway logic
        checkGatewayLogic(model, context);
    }
    
    private void checkUnreachableElements(BpmnModel model, 
                                          ValidationContext context) {
        for (Process process : model.getProcesses()) {
            Set<String> reachableElements = findReachableElements(process);
            
            for (FlowElement element : process.getFlowElements()) {
                if (!(element instanceof SequenceFlow) && 
                    !reachableElements.contains(element.getId())) {
                    context.addWarning(
                        ValidationError.builder()
                            .code("SEMANTIC_UNREACHABLE")
                            .message("Element may be unreachable: " + 
                                   element.getId())
                            .elementId(element.getId())
                            .severity(Severity.WARNING)
                            .build());
                }
            }
        }
    }
    
    private Set<String> findReachableElements(Process process) {
        Set<String> reachable = new HashSet<>();
        Queue<FlowElement> queue = new LinkedList<>();
        
        // Start from start events
        for (FlowElement element : process.getFlowElements()) {
            if (element instanceof StartEvent) {
                queue.add(element);
                reachable.add(element.getId());
            }
        }
        
        // BFS traversal
        while (!queue.isEmpty()) {
            FlowElement current = queue.poll();
            
            if (current instanceof Activity) {
                Activity activity = (Activity) current;
                for (SequenceFlow flow : activity.getOutgoing()) {
                    FlowElement target = flow.getTargetRef();
                    if (target != null && reachable.add(target.getId())) {
                        queue.add(target);
                    }
                }
            }
        }
        
        return reachable;
    }
    
    private void checkInfiniteLoops(BpmnModel model, ValidationContext context) {
        for (Process process : model.getProcesses()) {
            List<List<String>> loops = detectLoops(process);
            
            for (List<String> loop : loops) {
                if (isInfiniteLoop(loop, process)) {
                    context.addError(
                        ValidationError.builder()
                            .code("SEMANTIC_INFINITE_LOOP")
                            .message("Potential infinite loop detected")
                            .elements(loop)
                            .severity(Severity.ERROR)
                            .build());
                }
            }
        }
    }
}
```

### Best Practice Rules

```java
public class BestPracticeRule implements ValidationRule {
    
    @Override
    public void validate(BpmnModel model, ValidationContext context) {
        // Check for meaningful names
        checkMeaningfulNames(model, context);
        
        // Check for documentation
        checkDocumentation(model, context);
        
        // Check for error handling
        checkErrorHandling(model, context);
        
        // Check for complexity
        checkComplexity(model, context);
    }
    
    private void checkMeaningfulNames(BpmnModel model, 
                                      ValidationContext context) {
        for (FlowElement element : getAllFlowElements(model)) {
            if (element.getName() == null || 
                element.getName().isEmpty() || 
                element.getName().equals(element.getId())) {
                context.addInfo(
                    ValidationError.builder()
                        .code("BEST_PRACTICE_NAME")
                        .message("Element should have a meaningful name: " + 
                               element.getId())
                        .elementId(element.getId())
                        .severity(Severity.INFO)
                        .build());
            }
        }
    }
    
    private void checkDocumentation(BpmnModel model, 
                                    ValidationContext context) {
        for (Process process : model.getProcesses()) {
            if (process.getDescription() == null || 
                process.getDescription().isEmpty()) {
                context.addInfo(
                    ValidationError.builder()
                        .code("BEST_PRACTICE_DOCUMENTATION")
                        .message("Process should have documentation")
                        .elementId(process.getId())
                        .severity(Severity.INFO)
                        .build());
            }
        }
    }
    
    private void checkComplexity(BpmnModel model, ValidationContext context) {
        for (Process process : model.getProcesses()) {
            int elementCount = process.getFlowElements().size();
            
            if (elementCount > 50) {
                context.addWarning(
                    ValidationError.builder()
                        .code("BEST_PRACTICE_COMPLEXITY")
                        .message("Process is complex (" + elementCount + 
                               " elements). Consider splitting.")
                        .elementId(process.getId())
                        .severity(Severity.WARNING)
                        .build());
            }
        }
    }
}
```

---

## Error Reporting

### ValidationError

```java
public class ValidationError {
    
    private final String code;
    private final String message;
    private final Severity severity;
    private final String elementId;
    private final List<String> elements;
    private final Map<String, Object> details;
    
    public enum Severity {
        ERROR,
        WARNING,
        INFO
    }
    
    private ValidationError(Builder builder) {
        this.code = builder.code;
        this.message = builder.message;
        this.severity = builder.severity;
        this.elementId = builder.elementId;
        this.elements = builder.elements;
        this.details = builder.details;
    }
    
    // Getters...
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String code;
        private String message;
        private Severity severity = Severity.ERROR;
        private String elementId;
        private List<String> elements = new ArrayList<>();
        private Map<String, Object> details = new HashMap<>();
        
        public Builder code(String code) {
            this.code = code;
            return this;
        }
        
        public Builder message(String message) {
            this.message = message;
            return this;
        }
        
        public Builder severity(Severity severity) {
            this.severity = severity;
            return this;
        }
        
        public Builder elementId(String elementId) {
            this.elementId = elementId;
            return this;
        }
        
        public Builder elements(List<String> elements) {
            this.elements = elements;
            return this;
        }
        
        public Builder detail(String key, Object value) {
            this.details.put(key, value);
            return this;
        }
        
        public ValidationError build() {
            return new ValidationError(this);
        }
    }
    
    @Override
    public String toString() {
        return String.format("[%s] %s - %s", 
            severity, code, message);
    }
}
```

### ValidationReport

```java
public class ValidationReport {
    
    private final BpmnModel model;
    private final List<ValidationError> errors = new ArrayList<>();
    private final List<ValidationError> warnings = new ArrayList<>();
    private final List<ValidationError> info = new ArrayList<>();
    private final Instant validationTime;
    private boolean valid;
    
    public ValidationReport(BpmnModel model) {
        this.model = model;
        this.validationTime = Instant.now();
    }
    
    public void addError(ValidationError error) {
        errors.add(error);
        valid = false;
    }
    
    public void addWarning(ValidationError warning) {
        warnings.add(warning);
    }
    
    public void addInfo(ValidationError info) {
        this.info.add(info);
    }
    
    public boolean isValid() {
        return valid && errors.isEmpty();
    }
    
    public List<ValidationError> getErrors() {
        return errors;
    }
    
    public List<ValidationError> getWarnings() {
        return warnings;
    }
    
    public List<ValidationError> getInfo() {
        return info;
    }
    
    public int getErrorCount() {
        return errors.size();
    }
    
    public int getWarningCount() {
        return warnings.size();
    }
    
    public String generateSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append("Validation Report\n");
        summary.append("=================\n\n");
        summary.append("Model: ").append(model.getId()).append("\n");
        summary.append("Time: ").append(validationTime).append("\n");
        summary.append("Status: ").append(isValid() ? "VALID" : "INVALID").append("\n\n");
        summary.append("Errors: ").append(errorCount()).append("\n");
        summary.append("Warnings: ").append(warningCount()).append("\n");
        summary.append("Info: ").append(info.size()).append("\n");
        
        if (!errors.isEmpty()) {
            summary.append("\nErrors:\n");
            for (ValidationError error : errors) {
                summary.append("  - ").append(error).append("\n");
            }
        }
        
        return summary.toString();
    }
}
```

---

## Custom Validators

### Custom Rule

```java
public class CustomRule implements ValidationRule {
    
    @Override
    public void validate(BpmnModel model, ValidationContext context) {
        // Custom validation logic
        checkCustomCondition(model, context);
    }
    
    private void checkCustomCondition(BpmnModel model, 
                                      ValidationContext context) {
        // Example: Check that all user tasks have an assignee expression
        for (Process process : model.getProcesses()) {
            for (FlowElement element : process.getFlowElements()) {
                if (element instanceof UserTask) {
                    UserTask userTask = (UserTask) element;
                    
                    if (userTask.getAssignee() == null || 
                        userTask.getAssignee().isEmpty()) {
                        context.addWarning(
                            ValidationError.builder()
                                .code("CUSTOM_NO_ASSIGNEE")
                                .message("User task has no assignee: " + 
                                       userTask.getId())
                                .elementId(userTask.getId())
                                .severity(Severity.WARNING)
                                .build());
                    }
                }
            }
        }
    }
}
```

### Rule Registry

```java
public class RuleRegistry {
    
    private final List<ValidationRule> rules = new ArrayList<>();
    
    public void registerRule(ValidationRule rule) {
        rules.add(rule);
    }
    
    public void unregisterRule(Class<? extends ValidationRule> ruleClass) {
        rules.removeIf(rule -> rule.getClass().equals(ruleClass));
    }
    
    public List<ValidationRule> getRules() {
        return Collections.unmodifiableList(rules);
    }
    
    public void clear() {
        rules.clear();
    }
}
```

---

## Performance Considerations

### Parallel Validation

```java
public class ParallelProcessValidator {
    
    private final ExecutorService executor;
    
    public ValidationReport validate(BpmnModel model) {
        ValidationReport report = new ValidationReport(model);
        
        List<ValidationRule> rules = getRules();
        
        // Validate in parallel
        List<CompletableFuture<Void>> futures = rules.stream()
            .map(rule -> CompletableFuture.runAsync(() -> {
                ValidationContext context = new ValidationContext();
                rule.validate(model, context);
                synchronized (report) {
                    context.getErrors().forEach(report::addError);
                    context.getWarnings().forEach(report::addWarning);
                    context.getInfo().forEach(report::addInfo);
                }
            }, executor))
            .collect(Collectors.toList());
        
        // Wait for all validations
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .join();
        
        return report;
    }
}
```

### Caching

```java
public class CachedProcessValidator {
    
    private final Map<String, ValidationReport> cache = 
        new ConcurrentHashMap<>();
    
    public ValidationReport validate(String modelId, BpmnModel model) {
        return cache.computeIfAbsent(modelId, id -> {
            return doValidate(model);
        });
    }
    
    public void invalidateCache(String modelId) {
        cache.remove(modelId);
    }
}
```

---

## Usage Examples

### Basic Validation

```java
public class ValidationExample {
    
    public void validateProcess() throws IOException {
        // Load BPMN model
        BpmnModel model = loadBpmnModel("process.bpmn");
        
        // Create validator
        ProcessValidator validator = new ProcessValidator();
        
        // Validate
        ValidationReport report = validator.validate(model);
        
        // Check results
        if (report.isValid()) {
            System.out.println("Process is valid!");
        } else {
            System.out.println("Process has errors:");
            report.getErrors().forEach(error -> 
                System.out.println("  " + error));
        }
    }
}
```

### Pre-Deployment Validation

```java
public class DeploymentValidator {
    
    @Autowired
    private ProcessValidator validator;
    
    public void deployProcess(InputStream bpmnStream) 
            throws DeploymentException {
        
        // Parse model
        BpmnModel model = parseBpmn(bpmnStream);
        
        // Validate
        ValidationReport report = validator.validate(model);
        
        // Check for errors
        if (!report.isValid()) {
            throw new DeploymentException(
                "Validation failed: " + report.generateSummary());
        }
        
        // Check for warnings (optional)
        if (report.getWarningCount() > 10) {
            log.warn("Process has many warnings: {}", report.getWarningCount());
        }
        
        // Deploy
        deploy(model);
    }
}
```

### Custom Validation

```java
public class CustomValidationExample {
    
    public void validateWithCustomRules() {
        ProcessValidator validator = new ProcessValidator();
        
        // Add custom rule
        validator.registerRule(new CustomRule());
        
        // Validate
        ValidationReport report = validator.validate(model);
    }
}
```

---

## Integration

### With Engine

```java
public class ValidationIntegration {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration() {
        ProcessEngineConfiguration cfg = 
            new StandaloneProcessEngineConfiguration();
        
        // Add validation listener
        cfg.addDeploymentListener(new ValidationDeploymentListener());
        
        return cfg;
    }
    
    private static class ValidationDeploymentListener 
        implements DeploymentListener {
        
        private final ProcessValidator validator = new ProcessValidator();
        
        @Override
        public void notifyDeployed(Deployment deployment) {
            // Validate after deployment
        }
        
        @Override
        public void notifyBeforeDeploy(Deployment deployment) {
            // Validate before deployment
            for (String resourceName : deployment.getResources()) {
                BpmnModel model = parseResource(resourceName);
                ValidationReport report = validator.validate(model);
                
                if (!report.isValid()) {
                    throw new DeploymentException(
                        "Validation failed for " + resourceName);
                }
            }
        }
    }
}
```

---

## API Reference

### Key Classes

- `ProcessValidator` - Main validation API
- `ValidationRule` - Rule interface
- `ValidationError` - Error representation
- `ValidationReport` - Validation results
- `RuleRegistry` - Rule management

### Key Methods

```java
// Validation
ValidationReport validate(BpmnModel model)
ValidationReport validate(String modelId, BpmnModel model)

// Rule management
void registerRule(ValidationRule rule)
void unregisterRule(Class<? extends ValidationRule> ruleClass)

// Report generation
String generateSummary()
boolean isValid()
List<ValidationError> getErrors()
```

---

## See Also

- [Parent Module Documentation](../README.md)
- [BPMN Model](../activiti-bpmn-model/README.md)
- [Engine Documentation](../activiti-engine/README.md)
