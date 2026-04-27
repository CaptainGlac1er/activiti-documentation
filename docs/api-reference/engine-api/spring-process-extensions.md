---
sidebar_label: Spring Process Extensions
slug: /api-reference/engine-api/spring-process-extensions
description: Process extension model, service, and auto-configuration from activiti-spring-process-extensions.
---

# activiti-spring-process-extensions

**Module:** `activiti-core/activiti-spring-process-extensions`

This module provides a service layer for loading, caching, and querying **process extension** metadata. Extensions are defined in JSON files alongside BPMN deployments and describe variables, input/output mappings, constants, task assignment templates, and assignment rules for a process definition.

---

## Core Service

### `ProcessExtensionService`

The primary entry point. Retrieves `Extension` objects for a given process definition.

```java
public class ProcessExtensionService {

    public boolean hasExtensionsFor(ProcessDefinition processDefinition);
    public boolean hasExtensionsFor(String processDefinitionId);

    public Extension getExtensionsFor(ProcessDefinition processDefinition);
    public Extension getExtensionsForId(String processDefinitionId);
}
```

- `hasExtensionsFor(...)` returns `true` when a deployment contains extension data for the process key.
- `getExtensionsFor(...)` / `getExtensionsForId(...)` returns an `Extension` instance. If no extension data exists, returns an empty `Extension` (never `null`).

### `CachingProcessExtensionService` (deprecated)

A thin deprecated wrapper around `ProcessExtensionService`. Delegates to `ProcessExtensionService.getExtensionsForId()`. Use `ProcessExtensionService` directly.

---

## Repository Layer

### `ProcessExtensionRepository`

```java
public interface ProcessExtensionRepository {
    Optional<Extension> getExtensionsForId(String processDefinitionId);
}
```

Single method — returns `Optional<Extension>` keyed by process definition ID.

### `ProcessExtensionRepositoryImpl`

Default implementation. For a given `processDefinitionId` it:

1. Loads the `ProcessDefinition` through `RepositoryService`.
2. Calls `DeploymentResourceLoader` to find and parse all `-extensions.json` resources in the deployment using `ProcessExtensionResourceReader`.
3. Aggregates all `ProcessExtensionModel` entries into a `Map<String, Extension>` (keyed by process key).
4. Returns the `Extension` matching the process definition key.

### `CacheableProcessExtensionRepository`

Spring-cache decorator around any `ProcessExtensionRepository`. Cache name is `processExtensionsById`.

```java
@CacheConfig(cacheNames = {"processExtensionsById"})
public class CacheableProcessExtensionRepository implements ProcessExtensionRepository {
    public static final String PROCESS_EXTENSIONS_CACHE_NAME = "processExtensionsById";

    public CacheableProcessExtensionRepository(ProcessExtensionRepository delegate);

    @Cacheable
    public Optional<Extension> getExtensionsForId(String processDefinitionId);
}
```

---

## Resource Reading

### `ProcessExtensionResourceReader`

Implements `ResourceReader<ProcessExtensionModel>`. Selects resources whose name ends with `-extensions.json`, deserializes them via Jackson `ObjectMapper`, and converts any variable whose type is `json` or unrecognized into a `JsonNode`.

```java
public class ProcessExtensionResourceReader implements ResourceReader<ProcessExtensionModel> {

    public ProcessExtensionResourceReader(ObjectMapper objectMapper,
                                          Map<String, VariableType> variableTypeMap);

    @Override
    public Predicate<String> getResourceNameSelector();

    @Override
    public ProcessExtensionModel read(InputStream inputStream) throws IOException;
}
```

### `ProcessExtensionResourceFinderDescriptor`

Implements `ResourceFinderDescriptor` for auto-deployment scanning. Configured via Spring properties:

- `spring.activiti.process.extensions.dir` — default `classpath*:**/processes/`
- `spring.activiti.process.extensions.suffix` — default `**-extensions.json`

```java
public class ProcessExtensionResourceFinderDescriptor implements ResourceFinderDescriptor {

    public ProcessExtensionResourceFinderDescriptor(boolean checkResources,
                                                    String locationPrefix,
                                                    String locationSuffix);

    @Override public List<String> getLocationSuffixes();
    @Override public String getLocationPrefix();
    @Override public boolean shouldLookUpResources();
    @Override public String getMsgForEmptyResources();
    @Override public String getMsgForResourcesFound(List<String> processExtensionFiles);
    @Override public void validate(List<Resource> resources);
}
```

---

## Model Classes

### `ProcessExtensionModel`

Top-level container deserialized from the JSON file. Maps one extension file to multiple process extensions (keyed by process definition key).

```java
public class ProcessExtensionModel {
    private String id;
    private Map<String, Extension> extensions;

    public String getId();
    public Extension getExtensions(String processDefinitionKey);
    public Map<String, Extension> getAllExtensions();
}
```

### `Extension`

Represents all extension metadata for a single process definition. Contains properties, mappings, constants, templates, and assignments.

```java
public class Extension {
    private Map<String, VariableDefinition> properties;
    private Map<String, ProcessVariablesMapping> mappings;
    private Map<String, ProcessConstantsMapping> constants;
    private TemplatesDefinition templates;
    private Map<String, AssignmentDefinition> assignments;

    // Lookup helpers
    public VariableDefinition getProperty(String propertyUUID);
    public VariableDefinition getPropertyByName(String name);
    public ProcessVariablesMapping getMappingForFlowElement(String flowElementUUID);
    public ProcessConstantsMapping getConstantForFlowElement(String flowElementUUID);
    public boolean hasMapping(String taskId);
    public boolean shouldMapAllInputs(String elementId);
    public boolean shouldMapAllOutputs(String elementId);

    // Template lookups
    public Optional<TemplateDefinition> findAssigneeTemplateForTask(String taskUUID);
    public Optional<TemplateDefinition> findCandidateTemplateForTask(String taskUUID);

    // Getters and setters for all fields
}
```

### `VariableDefinition`

Extends `org.activiti.core.common.model.connector.VariableDefinition`, adding a `value` field for default values.

Inherited fields: `id`, `name`, `description`, `type`, `required`, `display`, `displayName`, `analytics`.

```java
public class VariableDefinition extends org.activiti.core.common.model.connector.VariableDefinition {
    private Object value;

    public Object getValue();
    public void setValue(Object value);
}
```

### `ProcessVariablesMapping`

Describes input/output variable mappings for a flow element (task, gateway, etc.).

```java
public class ProcessVariablesMapping {
    private MappingType mappingType;
    private Map<String, Mapping> inputs;
    private Map<String, Mapping> outputs;

    public Mapping getInputMapping(String inputName);

    public enum MappingType {
        MAP_ALL,
        MAP_ALL_INPUTS,
        MAP_ALL_OUTPUTS
    }
}
```

### `Mapping`

A single variable mapping entry with a source type.

```java
public class Mapping {
    private SourceMappingType type;
    private Object value;

    public enum SourceMappingType {
        VARIABLE,
        VALUE,
        JSONPATCH
    }
}
```

### `ProcessConstantsMapping`

Constant values for a flow element. Extends `HashMap<String, ConstantDefinition>`.

```java
public class ProcessConstantsMapping extends HashMap<String, ConstantDefinition> {}
```

### `ConstantDefinition`

```java
public class ConstantDefinition {
    private Object value;

    public Object getValue();
    public void setValue(Object value);
}
```

### `TemplatesDefinition`

Holds task-level and default assignment templates.

```java
public class TemplatesDefinition {
    private Map<String, TaskTemplateDefinition> tasks;
    private TaskTemplateDefinition defaultTemplate;

    public Optional<TemplateDefinition> findAssigneeTemplateForTask(String taskUUID);
    public Optional<TemplateDefinition> findCandidateTemplateForTask(String taskUUID);
}
```

### `TaskTemplateDefinition`

Per-task assignee and candidate templates.

```java
public class TaskTemplateDefinition {
    private TemplateDefinition assignee;
    private TemplateDefinition candidate;
}
```

### `TemplateDefinition`

A single template — either a `VARIABLE` expression or a `FILE` reference.

```java
public class TemplateDefinition {
    public enum TemplateType { VARIABLE, FILE }

    private String from;
    private String subject;
    private TemplateType type;
    private String value;
}
```

### `AssignmentDefinition`

Declares how a task assignee or candidate group is determined.

```java
public class AssignmentDefinition {
    public enum AssignmentEnum { ASSIGNEE, CANDIDATES }
    public enum AssignmentType { STATIC, IDENTITY, EXPRESSION }
    public enum AssignmentMode { SEQUENTIAL, MANUAL }

    private String id;
    private AssignmentEnum assignment;
    private AssignmentType type;
    private AssignmentMode mode;
}
```

---

## Variable Type System

### `VariableType` (abstract)

Base class for validating and parsing variable values from extension JSON.

```java
public abstract class VariableType {
    private String name;

    abstract public void validate(Object var, List<ActivitiException> errors);

    public Object parseFromValue(Object value) throws ActivitiException;
}
```

Built-in implementations registered in `ProcessExtensionsAutoConfiguration`:

| Type Name   | Class                        | Purpose                                     |
|-------------|------------------------------|---------------------------------------------|
| `boolean`   | `JavaObjectVariableType`     | Boolean values                              |
| `string`    | `JavaObjectVariableType`     | String values                               |
| `integer`   | `JavaObjectVariableType`     | Integer values                              |
| `bigdecimal`| `BigDecimalVariableType`     | High-precision numeric values               |
| `json`      | `JsonObjectVariableType`     | Arbitrary JSON objects                      |
| `file`      | `JsonObjectVariableType`     | File references                             |
| `folder`    | `JsonObjectVariableType`     | Folder references                           |
| `content`   | `JsonObjectVariableType`     | Content references                          |
| `date`      | `DateVariableType`           | Date values (uses `DateFormatterProvider`)  |
| `datetime`  | `DateVariableType`           | Datetime values (uses `DateFormatterProvider`) |
| `array`     | `JsonObjectVariableType`     | JSON arrays                                 |

### `VariableValidationService`

Validates a runtime value against a `VariableDefinition` from the extension JSON.

```java
public class VariableValidationService {
    public boolean validate(Object var, VariableDefinition variableDefinition);
    public List<ActivitiException> validateWithErrors(Object var, VariableDefinition variableDefinition);
}
```

### `VariableParsingService`

Parses a raw value from the JSON into its typed Java representation.

```java
public class VariableParsingService {
    public Object parse(VariableDefinition variableDefinition) throws ActivitiException;
}
```

---

## Auto-Configuration

### `ProcessExtensionsAutoConfiguration`

Spring Boot `@AutoConfiguration` that wires the entire extension service layer. Loads properties from `classpath:config/process-extensions-service.properties`. Enables Spring caching.

Beans registered:

```java
DeploymentResourceLoader<ProcessExtensionModel> deploymentResourceLoader
ProcessExtensionResourceReader processExtensionResourceReader
ProcessExtensionRepository processExtensionsRepository
ProcessExtensionService processExtensionService
Map<String, VariableType> variableTypeMap
VariableValidationService variableValidationService
VariableParsingService variableParsingService
CachingProcessExtensionService cachingProcessExtensionService
```

The repository bean is a `CacheableProcessExtensionRepository` wrapping a `ProcessExtensionRepositoryImpl`.

### `ProcessExtensionResourceFinderDescriptorAutoConfiguration`

Separate `@Configuration` that registers `ProcessExtensionResourceFinderDescriptor` for auto-deployment scanning.

Properties:
- `spring.activiti.process.extensions.dir` — default `classpath*:**/processes/`
- `spring.activiti.process.extensions.suffix` — default `**-extensions.json`

---

## Caching

Two caches are used:

| Cache Name                  | Used By                                |
|-----------------------------|----------------------------------------|
| `processExtensionsById`     | `CacheableProcessExtensionRepository`  |
| `deploymentResourcesById`   | `DeploymentResourceLoader`             |

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Engine Documentation](./README.md)
- [Spring Integration](./spring-integration.mdx)
