---
sidebar_label: JSON Converter
slug: /activiti-core/json-converter
description: Utilities for serializing and deserializing Activiti objects to and from JSON format.
---

# Activiti JSON Converter Module - Technical Documentation

**Module:** `activiti-core/activiti-json-converter`

**Target Audience:** Senior Software Engineers, API Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [JSON Serialization](#json-serialization)
- [JSON Deserialization](#json-deserialization)
- [Custom Converters](#custom-converters)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-json-converter** module provides utilities for serializing and deserializing Activiti objects to and from JSON format. It enables REST API integration, data exchange, and storage of workflow data in JSON format.

### Key Features

- **Bidirectional Conversion**: JSON ↔ Java objects
- **Custom Serializers**: Type-specific converters
- **Polymorphic Support**: Handle inheritance hierarchies
- **Null Safety**: Proper null handling
- **Date/Time Formatting**: ISO 8601 compliance
- **Performance Optimized**: Efficient JSON processing

### Module Structure

```
activiti-json-converter/
├── src/main/java/org/activiti/json/
│   ├── JsonConverter.java              # Main converter
│   ├── serializers/
│   │   ├── ProcessInstanceSerializer.java
│   │   ├── TaskSerializer.java
│   │   └── VariableSerializer.java
│   ├── deserializers/
│   │   ├── ProcessInstanceDeserializer.java
│   │   ├── TaskDeserializer.java
│   │   └── VariableDeserializer.java
│   └── custom/
│       ├── JsonModule.java
│       └── TypeAdapters.java
└── src/test/java/
```

---

## Architecture

### Conversion Pipeline

```
Java Object
     │
     ▼
┌─────────────┐
│ Type        │
│ Checker     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Serializer  │
│ Selection   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ JSON        │
│ Generation  │
└──────┬──────┘
       │
       ▼
    JSON String
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    JsonConverter                            │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   ObjectMapper  │  │  Type Adapters  │                 │
│  │   (Jackson)     │  │                 │                 │
│  └────────┬────────┘  └────────┬────────┘                 │
│           │                    │                           │
│           └────────┬───────────┘                           │
│                    │                                       │
│                    ▼                                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Custom Serializers                      │  │
│  │  - ProcessInstanceSerializer                         │  │
│  │  - TaskSerializer                                    │  │
│  │  - VariableSerializer                                │  │
│  │  - EventSerializer                                   │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## JSON Serialization

### ObjectMapper Configuration

```java
public class ActivitiObjectMapper {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    static {
        // Configure JSON features
        objectMapper.configure(
            SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        objectMapper.configure(
            SerializationFeature.INDENT_OUTPUT, true);
        objectMapper.configure(
            SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        
        // Register modules
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.registerModule(new ActivitiJsonModule());
        
        // Set date format
        objectMapper.setDateFormat(new SimpleDateFormat(
            "yyyy-MM-dd'T'HH:mm:ss.SSSZ"));
    }
    
    public static ObjectMapper getInstance() {
        return objectMapper;
    }
}
```

### ProcessInstance Serializer

```java
public class ProcessInstanceSerializer 
    extends JsonSerializer<ProcessInstance> {
    
    @Override
    public void serialize(ProcessInstance value, 
                         JsonGenerator gen, 
                         SerializerProvider provider) 
            throws IOException {
        
        gen.writeStartObject();
        
        // Basic fields
        gen.writeFieldName("id");
        gen.writeString(value.getId());
        
        gen.writeFieldName("processDefinitionId");
        gen.writeString(value.getProcessDefinitionId());
        
        gen.writeFieldName("businessKey");
        gen.writeString(value.getBusinessKey());
        
        gen.writeFieldName("name");
        gen.writeString(value.getName());
        
        // Timestamps
        gen.writeFieldName("startTime");
        gen.writeTimestamp(value.getStartTime().getTime());
        
        if (value.getEndTime() != null) {
            gen.writeFieldName("endTime");
            gen.writeTimestamp(value.getEndTime().getTime());
        }
        
        // State
        gen.writeFieldName("state");
        gen.writeString(value.getState().name());
        
        // Variables (if included)
        if (includeVariables()) {
            gen.writeFieldName("variables");
            provider.defaultSerializeValue(value.getVariables(), gen);
        }
        
        gen.writeEndObject();
    }
    
    private boolean includeVariables() {
        // Configuration-based decision
        return true;
    }
}
```

### Task Serializer

```java
public class TaskSerializer extends JsonSerializer<Task> {
    
    @Override
    public void serialize(Task value, 
                         JsonGenerator gen, 
                         SerializerProvider provider) 
            throws IOException {
        
        gen.writeStartObject();
        
        // Core fields
        gen.writeFieldName("id");
        gen.writeString(value.getId());
        
        gen.writeFieldName("name");
        gen.writeString(value.getName());
        
        gen.writeFieldName("description");
        gen.writeString(value.getDescription());
        
        gen.writeFieldName("assignee");
        gen.writeString(value.getAssignee());
        
        // Dates
        gen.writeFieldName("createTime");
        gen.writeTimestamp(value.getCreateTime().getTime());
        
        if (value.getDueDate() != null) {
            gen.writeFieldName("dueDate");
            gen.writeTimestamp(value.getDueDate().getTime());
        }
        
        // Priority
        gen.writeFieldName("priority");
        gen.writeNumber(value.getPriority());
        
        // Status
        gen.writeFieldName("status");
        gen.writeString(value.getStatus().name());
        
        // Candidate users
        if (!value.getCandidateUsers().isEmpty()) {
            gen.writeFieldName("candidateUsers");
            gen.writeArray(value.getCandidateUsers());
        }
        
        // Candidate groups
        if (!value.getCandidateGroups().isEmpty()) {
            gen.writeFieldName("candidateGroups");
            gen.writeArray(value.getCandidateGroups());
        }
        
        gen.writeEndObject();
    }
}
```

### Variable Serializer

```java
public class VariableSerializer extends JsonSerializer<VariableInstance> {
    
    @Override
    public void serialize(VariableInstance value, 
                         JsonGenerator gen, 
                         SerializerProvider provider) 
            throws IOException {
        
        gen.writeStartObject();
        
        gen.writeFieldName("name");
        gen.writeString(value.getName());
        
        gen.writeFieldName("type");
        gen.writeString(value.getType().name());
        
        // Value based on type
        gen.writeFieldName("value");
        serializeValue(value.getValue(), value.getType(), gen, provider);
        
        gen.writeFieldName("scopeId");
        gen.writeString(value.getScopeId());
        
        gen.writeEndObject();
    }
    
    private void serializeValue(Object value, 
                               VariableType type, 
                               JsonGenerator gen, 
                               SerializerProvider provider) 
                    throws IOException {
        
        switch (type) {
            case STRING:
                gen.writeString((String) value);
                break;
            case INTEGER:
                gen.writeNumber((Integer) value);
                break;
            case LONG:
                gen.writeNumber((Long) value);
                break;
            case DOUBLE:
                gen.writeNumber((Double) value);
                break;
            case BOOLEAN:
                gen.writeBoolean((Boolean) value);
                break;
            case DATE:
                gen.writeTimestamp(((Date) value).getTime());
                break;
            case OBJECT:
                provider.defaultSerializeValue(value, gen);
                break;
            default:
                gen.writeString(value.toString());
        }
    }
}
```

---

## JSON Deserialization

### ProcessInstance Deserializer

```java
public class ProcessInstanceDeserializer 
    extends JsonDeserializer<ProcessInstance> {
    
    @Override
    public ProcessInstance deserialize(JsonParser p, 
                                       DeserializationContext ctxt) 
            throws IOException {
        
        JsonNode node = p.getCodec().readTree(p);
        
        // Create builder
        ProcessInstanceBuilder builder = ProcessInstance.builder();
        
        // Read fields
        if (node.has("id")) {
            builder.id(node.get("id").asText());
        }
        
        if (node.has("processDefinitionId")) {
            builder.processDefinitionId(
                node.get("processDefinitionId").asText());
        }
        
        if (node.has("businessKey")) {
            builder.businessKey(node.get("businessKey").asText());
        }
        
        if (node.has("name")) {
            builder.name(node.get("name").asText());
        }
        
        if (node.has("startTime")) {
            builder.startTime(
                Instant.ofEpochMilli(node.get("startTime").asLong()));
        }
        
        if (node.has("endTime")) {
            builder.endTime(
                Instant.ofEpochMilli(node.get("endTime").asLong()));
        }
        
        if (node.has("state")) {
            builder.state(
                ProcessInstanceState.valueOf(node.get("state").asText()));
        }
        
        if (node.has("variables")) {
            JsonNode variablesNode = node.get("variables");
            Map<String, Object> variables = 
                p.getCodec().treeToValue(
                    variablesNode, 
                    new TypeReference<Map<String, Object>>() {});
            builder.variables(variables);
        }
        
        return builder.build();
    }
}
```

### Task Deserializer

```java
public class TaskDeserializer extends JsonDeserializer<Task> {
    
    @Override
    public Task deserialize(JsonParser p, 
                           DeserializationContext ctxt) 
                throws IOException {
        
        JsonNode node = p.getCodec().readTree(p);
        
        TaskBuilder builder = Task.builder();
        
        // Core fields
        builder.id(node.get("id").asText());
        builder.name(node.get("name").asText());
        
        if (node.has("description")) {
            builder.description(node.get("description").asText());
        }
        
        if (node.has("assignee")) {
            builder.assignee(node.get("assignee").asText());
        }
        
        // Dates
        if (node.has("createTime")) {
            builder.createTime(
                new Date(node.get("createTime").asLong()));
        }
        
        if (node.has("dueDate")) {
            builder.dueDate(new Date(node.get("dueDate").asLong()));
        }
        
        // Priority
        if (node.has("priority")) {
            builder.priority(node.get("priority").asInt());
        }
        
        // Status
        if (node.has("status")) {
            builder.status(
                TaskStatus.valueOf(node.get("status").asText()));
        }
        
        // Candidates
        if (node.has("candidateUsers")) {
            List<String> users = new ArrayList<>();
            for (JsonNode user : node.get("candidateUsers")) {
                users.add(user.asText());
            }
            builder.candidateUsers(users);
        }
        
        if (node.has("candidateGroups")) {
            List<String> groups = new ArrayList<>();
            for (JsonNode group : node.get("candidateGroups")) {
                groups.add(group.asText());
            }
            builder.candidateGroups(groups);
        }
        
        return builder.build();
    }
}
```

---

## Custom Converters

### Type Adapters

```java
public class ActivitiTypeAdapters {
    
    public static void registerTypeAdapters(GsonBuilder gsonBuilder) {
        // ProcessInstance adapter
        gsonBuilder.registerTypeAdapter(
            ProcessInstance.class, 
            new ProcessInstanceTypeAdapter());
        
        // Task adapter
        gsonBuilder.registerTypeAdapter(
            Task.class, 
            new TaskTypeAdapter());
        
        // VariableInstance adapter
        gsonBuilder.registerTypeAdapter(
            VariableInstance.class, 
            new VariableInstanceTypeAdapter());
    }
}

class ProcessInstanceTypeAdapter 
    extends TypeAdapter<ProcessInstance> {
    
    @Override
    public void write(JsonWriter out, ProcessInstance value) 
            throws IOException {
        out.beginObject();
        out.name("id").value(value.getId());
        out.name("processDefinitionId")
            .value(value.getProcessDefinitionId());
        // ... more fields
        out.endObject();
    }
    
    @Override
    public ProcessInstance read(JsonReader in) throws IOException {
        in.beginObject();
        ProcessInstanceBuilder builder = ProcessInstance.builder();
        
        while (in.hasNext()) {
            String name = in.nextName();
            switch (name) {
                case "id":
                    builder.id(in.nextString());
                    break;
                case "processDefinitionId":
                    builder.processDefinitionId(in.nextString());
                    break;
                // ... more cases
            }
        }
        
        in.endObject();
        return builder.build();
    }
}
```

### Jackson Modules

```java
public class ActivitiJsonModule extends JacksonModule {
    
    public ActivitiJsonModule() {
        super("activiti-json-module");
    }
    
    @Override
    public void setupModule(SetupContext context) {
        // Register serializers
        context.addSerializer(
            ProcessInstance.class, 
            new ProcessInstanceSerializer());
        
        context.addSerializer(
            Task.class, 
            new TaskSerializer());
        
        context.addSerializer(
            VariableInstance.class, 
            new VariableSerializer());
        
        // Register deserializers
        context.addDeserializer(
            ProcessInstance.class, 
            new ProcessInstanceDeserializer());
        
        context.addDeserializer(
            Task.class, 
            new TaskDeserializer());
        
        context.addDeserializer(
            VariableInstance.class, 
            new VariableDeserializer());
    }
}
```

---

## Performance Optimization

### Object Pooling

```java
public class JsonConverterPool {
    
    private final ObjectPool<ObjectMapper> mapperPool;
    
    public JsonConverterPool(int poolSize) {
        BasicObjectPoolConfig<ObjectMapper> config = 
            new BasicObjectPoolConfig<>();
        config.setMaxTotal(poolSize);
        config.setMaxIdle(poolSize / 2);
        
        mapperPool = new GenericObjectPool<>(
            new ObjectMapperFactory(), config);
    }
    
    public ObjectMapper borrowMapper() {
        return mapperPool.borrowObject();
    }
    
    public void returnMapper(ObjectMapper mapper) {
        mapperPool.returnObject(mapper);
    }
}
```

### Streaming API

```java
public class StreamingJsonConverter {
    
    public void writeStream(ProcessInstance instance, 
                           OutputStream output) 
                    throws IOException {
        
        JsonFactory factory = new JsonFactory();
        try (JsonGenerator generator = 
                factory.createGenerator(output)) {
            
            generator.writeStartObject();
            generator.writeStringField("id", instance.getId());
            generator.writeStringField("processDefinitionId", 
                instance.getProcessDefinitionId());
            // ... more fields
            generator.writeEndObject();
        }
    }
    
    public ProcessInstance readStream(InputStream input) 
            throws IOException {
        
        JsonFactory factory = new JsonFactory();
        try (JsonParser parser = factory.createParser(input)) {
            
            parser.nextToken(); // Start object
            ProcessInstanceBuilder builder = ProcessInstance.builder();
            
            while (parser.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = parser.getCurrentName();
                parser.nextToken();
                
                switch (fieldName) {
                    case "id":
                        builder.id(parser.getText());
                        break;
                    case "processDefinitionId":
                        builder.processDefinitionId(parser.getText());
                        break;
                    // ... more cases
                }
            }
            
            return builder.build();
        }
    }
}
```

### Caching

```java
public class CachedJsonConverter {
    
    private final Map<String, String> jsonCache = 
        new ConcurrentHashMap<>();
    
    public String toJson(ProcessInstance instance) {
        String cacheKey = instance.getId();
        
        return jsonCache.computeIfAbsent(cacheKey, key -> {
            try {
                return objectMapper.writeValueAsString(instance);
            } catch (JsonProcessingException e) {
                throw new ConversionException("Failed to convert", e);
            }
        });
    }
    
    public void invalidateCache(String instanceId) {
        jsonCache.remove(instanceId);
    }
}
```

---

## Error Handling

### Conversion Exceptions

```java
public class ConversionException extends RuntimeException {
    
    public ConversionException(String message) {
        super(message);
    }
    
    public ConversionException(String message, Throwable cause) {
        super(message, cause);
    }
}

public class SerializationException extends ConversionException {
    public SerializationException(String message, Throwable cause) {
        super("Serialization failed: " + message, cause);
    }
}

public class DeserializationException extends ConversionException {
    public DeserializationException(String message, Throwable cause) {
        super("Deserialization failed: " + message, cause);
    }
}
```

### Error Recovery

```java
public class ResilientJsonConverter {
    
    public String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize {}", value.getClass().getName(), e);
            
            // Fallback to basic serialization
            return fallbackSerialization(value);
        }
    }
    
    private String fallbackSerialization(Object value) {
        try {
            return objectMapper.writeValueAsString(
                value.toString());
        } catch (Exception e) {
            throw new SerializationException(
                "Fallback serialization also failed", e);
        }
    }
}
```

---

## Usage Examples

### Basic Serialization

```java
public class SerializationExample {
    
    public void serializeProcessInstance() throws IOException {
        ProcessInstance instance = getProcessInstance();
        
        ObjectMapper mapper = ActivitiObjectMapper.getInstance();
        
        String json = mapper.writeValueAsString(instance);
        
        System.out.println(json);
    }
    
    public void serializeTask() throws IOException {
        Task task = getTask();
        
        ObjectMapper mapper = ActivitiObjectMapper.getInstance();
        
        // Pretty print
        String json = mapper.writerWithDefaultPrettyPrinter()
            .writeValueAsString(task);
        
        System.out.println(json);
    }
}
```

### Basic Deserialization

```java
public class DeserializationExample {
    
    public ProcessInstance deserializeProcessInstance(String json) 
            throws IOException {
        
        ObjectMapper mapper = ActivitiObjectMapper.getInstance();
        
        ProcessInstance instance = mapper.readValue(
            json, 
            ProcessInstance.class);
        
        return instance;
    }
    
    public Task deserializeTask(File file) throws IOException {
        ObjectMapper mapper = ActivitiObjectMapper.getInstance();
        
        Task task = mapper.readValue(
            file, 
            Task.class);
        
        return task;
    }
}
```

### Type-Safe Deserialization

```java
public class TypeSafeDeserialization {
    
    public List<ProcessInstance> deserializeProcessInstances(String json) 
            throws IOException {
        
        ObjectMapper mapper = ActivitiObjectMapper.getInstance();
        
        TypeReference<List<ProcessInstance>> typeRef = 
            new TypeReference<List<ProcessInstance>>() {};
        
        List<ProcessInstance> instances = mapper.readValue(
            json, 
            typeRef);
        
        return instances;
    }
    
    public Map<String, VariableInstance> deserializeVariables(String json) 
            throws IOException {
        
        ObjectMapper mapper = ActivitiObjectMapper.getInstance();
        
        TypeReference<Map<String, VariableInstance>> typeRef = 
            new TypeReference<Map<String, VariableInstance>>() {};
        
        return mapper.readValue(json, typeRef);
    }
}
```

---

## Best Practices

### 1. Use Try-With-Resources

```java
// GOOD
try (JsonGenerator generator = factory.createGenerator(output)) {
    generator.writeStartObject();
    // ... write data
}

// BAD
JsonGenerator generator = factory.createGenerator(output);
try {
    generator.writeStartObject();
} finally {
    generator.close();
}
```

### 2. Configure ObjectMapper Once

```java
// GOOD: Singleton configuration
private static final ObjectMapper MAPPER = configureMapper();

private static ObjectMapper configureMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModule(new JavaTimeModule());
    mapper.registerModule(new ActivitiJsonModule());
    return mapper;
}

// BAD: Creating new mapper each time
public String toJson(Object obj) {
    ObjectMapper mapper = new ObjectMapper();
    return mapper.writeValueAsString(obj);
}
```

### 3. Handle Nulls Explicitly

```java
gen.writeFieldName("assignee");
if (task.getAssignee() != null) {
    gen.writeString(task.getAssignee());
} else {
    gen.writeNull();
}
```

### 4. Use Type References for Collections

```java
TypeReference<List<Task>> typeRef = 
    new TypeReference<List<Task>>() {};

List<Task> tasks = mapper.readValue(json, typeRef);
```

### 5. Validate JSON Before Deserialization

```java
JsonNode node = mapper.readTree(json);
if (!node.isObject()) {
    throw new DeserializationException("Expected JSON object");
}
```

---

## API Reference

### Key Classes

- `ActivitiObjectMapper` - Configured ObjectMapper
- `JsonConverter` - Main conversion utility
- `ProcessInstanceSerializer` - Process serialization
- `TaskSerializer` - Task serialization
- `VariableSerializer` - Variable serialization

### Key Methods

```java
// Serialization
String writeValueAsString(Object value)
void writeValue(OutputStream output, Object value)

// Deserialization
<T> T readValue(String json, Class<T> clazz)
<T> T readValue(File file, Class<T> clazz)
<T> T readValue(JsonParser p, TypeReference<T> typeRef)

// Configuration
ObjectMapper registerModule(TypedModule module)
ObjectMapper configure(MapperFeature feature, boolean state)
```

---

## See Also

- [Parent Module Documentation](../README.md)
- [Engine Documentation](../activiti-engine/README.md)
- [API Implementation](../activiti-api-impl/README.md)
