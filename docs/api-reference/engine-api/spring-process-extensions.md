---
sidebar_label: Spring Process Extensions
slug: /api-reference/engine-api/spring-process-extensions
description: Engine implementation and services.
---

# Activiti Spring Process Extensions Module - Technical Documentation

**Module:** `activiti-core/activiti-spring-process-extensions`

**Target Audience:** Senior Software Engineers, Extension Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Extension Points](#extension-points)
- [Custom Behaviors](#custom-behaviors)
- [Plugin Architecture](#plugin-architecture)
- [Runtime Extensions](#runtime-extensions)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-spring-process-extensions** module provides mechanisms for extending the Activiti engine functionality at runtime. It enables custom behaviors, plugin architectures, and extension points that allow developers to modify and enhance process execution without changing core engine code.

### Key Features

- **Extension Points**: Well-defined hooks for customization
- **Custom Behaviors**: Override default activity behaviors
- **Plugin Architecture**: Loadable extensions
- **Runtime Modifications**: Dynamic behavior changes
- **Spring Integration**: Full Spring lifecycle support
- **Version Management**: Extension versioning and compatibility

### Module Structure

```
activiti-spring-process-extensions/
├── src/main/java/org/activiti/spring/extensions/
│   ├── ExtensionPoint.java                # Extension point interface
│   ├── ExtensionRegistry.java             # Extension management
│   ├── behaviors/
│   │   ├── CustomActivityBehavior.java
│   │   └── BehaviorFactory.java
│   ├── plugins/
│   │   ├── Plugin.java
│   │   └── PluginManager.java
│   └── runtime/
│       ├── RuntimeExtension.java
│       └── ExtensionContext.java
└── src/test/java/
```

---

## Architecture

### Extension Architecture

```
Core Engine
     │
     ▼
┌─────────────┐
│ Extension   │
│ Points      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Extension   │
│ Registry    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Custom      │
│ Extensions  │
└──────┬──────┘
       │
       ▼
Modified Behavior
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Extension Framework                             │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Extension       │  │ Extension       │                 │
│  │ Points          │  │ Registry        │                 │
│  └────────┬────────┘  └────────┬────────┘                 │
│           │                    │                           │
│           └────────┬───────────┘                           │
│                    │                                       │
│                    ▼                                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Extension Types                          │  │
│  │  - CustomActivityBehavior                            │  │
│  │  - PluginExtensions                                  │  │
│  │  - RuntimeExtensions                                 │  │
│  │  - EventExtensions                                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Spring Integration                       │  │
│  │  - Bean lifecycle                                    │  │
│  │  - Dependency injection                              │  │
│  │  - Configuration management                          │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Extension Points

### Extension Point Interface

```java
public interface ExtensionPoint {
    
    /**
     * Get extension point identifier
     */
    String getId();
    
    /**
     * Get extension point type
     */
    ExtensionType getType();
    
    /**
     * Check if extension is active
     */
    boolean isActive();
    
    /**
     * Get priority (lower = higher priority)
     */
    int getPriority();
}
```

### Extension Types

```java
public enum ExtensionType {
    ACTIVITY_BEHAVIOR,
    EVENT_LISTENER,
    JOB_HANDLER,
    FORM_HANDLER,
    VALIDATOR,
    SERIALIZER,
    CUSTOM
}
```

### Extension Registry

```java
@Component
public class ExtensionRegistry {
    
    private final Map<String, List<ExtensionPoint>> extensions = 
        new ConcurrentHashMap<>();
    
    public void register(ExtensionPoint extension) {
        String type = extension.getType().name();
        
        extensions.computeIfAbsent(type, k -> new ArrayList<>())
            .add(extension);
        
        log.info("Registered extension: {} ({})", 
                 extension.getId(), type);
    }
    
    public void unregister(String extensionId) {
        extensions.values().forEach(list -> 
            list.removeIf(e -> e.getId().equals(extensionId)));
    }
    
    public List<ExtensionPoint> getExtensions(ExtensionType type) {
        return extensions.getOrDefault(type.name(), new ArrayList<>());
    }
    
    public ExtensionPoint getExtension(String extensionId) {
        for (List<ExtensionPoint> list : extensions.values()) {
            for (ExtensionPoint extension : list) {
                if (extension.getId().equals(extensionId)) {
                    return extension;
                }
            }
        }
        return null;
    }
}
```

---

## Custom Behaviors

### Custom Activity Behavior

```java
public class CustomActivityBehavior 
    implements BpmnActivityBehavior, ExtensionPoint {
    
    private final String extensionId;
    private final BpmnActivityBehavior delegate;
    
    public CustomActivityBehavior(String extensionId, 
                                  BpmnActivityBehavior delegate) {
        this.extensionId = extensionId;
        this.delegate = delegate;
    }
    
    @Override
    public void execute(Execution execution) {
        // Pre-execution logic
        beforeExecute(execution);
        
        // Execute original behavior
        delegate.execute(execution);
        
        // Post-execution logic
        afterExecute(execution);
    }
    
    protected void beforeExecute(Execution execution) {
        // Custom pre-execution logic
        log.info("Before executing activity: {}", 
                 execution.getActivityId());
    }
    
    protected void afterExecute(Execution execution) {
        // Custom post-execution logic
        log.info("After executing activity: {}", 
                 execution.getActivityId());
    }
    
    @Override
    public String getId() {
        return extensionId;
    }
    
    @Override
    public ExtensionType getType() {
        return ExtensionType.ACTIVITY_BEHAVIOR;
    }
}
```

### Behavior Factory

```java
@Component
public class CustomBehaviorFactory implements ExtensionPoint {
    
    @Autowired
    private ExtensionRegistry extensionRegistry;
    
    @Override
    public ActivityBehavior createBehavior(
            BpmnModel model, 
            FlowElement element) {
        
        // Check for custom behavior
        String customBehaviorClass = 
            element.getProperty("customBehavior");
        
        if (customBehaviorClass != null) {
            try {
                Class<?> behaviorClass = 
                    Class.forName(customBehaviorClass);
                
                ActivityBehavior behavior = 
                    (ActivityBehavior) behaviorClass.newInstance();
                
                // Wrap with extension
                return new CustomActivityBehavior(
                    customBehaviorClass, 
                    behavior);
            } catch (Exception e) {
                throw new ActivitiException(
                    "Failed to create custom behavior", e);
            }
        }
        
        // Use default behavior
        return null;
    }
}
```

---

## Plugin Architecture

### Plugin Interface

```java
public interface Plugin {
    
    /**
     * Plugin identifier
     */
    String getId();
    
    /**
     * Plugin version
     */
    String getVersion();
    
    /**
     * Initialize plugin
     */
    void initialize(PluginContext context);
    
    /**
     * Start plugin
     */
    void start();
    
    /**
     * Stop plugin
     */
    void stop();
    
    /**
     * Check if plugin is active
     */
    boolean isActive();
}
```

### Plugin Context

```java
public interface PluginContext {
    
    ProcessEngine getProcessEngine();
    
    ExtensionRegistry getExtensionRegistry();
    
    void registerExtension(ExtensionPoint extension);
    
    void unregisterExtension(String extensionId);
    
    Map<String, Object> getAttributes();
    
    void setAttribute(String key, Object value);
    
    Object getAttribute(String key);
}
```

### Plugin Manager

```java
@Component
public class PluginManager {
    
    @Autowired
    private ExtensionRegistry extensionRegistry;
    
    private final Map<String, Plugin> plugins = 
        new ConcurrentHashMap<>();
    
    public void loadPlugin(Plugin plugin) {
        PluginContext context = new PluginContextImpl(
            extensionRegistry);
        
        plugin.initialize(context);
        plugins.put(plugin.getId(), plugin);
        
        log.info("Loaded plugin: {} v{}", 
                 plugin.getId(), plugin.getVersion());
    }
    
    public void unloadPlugin(String pluginId) {
        Plugin plugin = plugins.remove(pluginId);
        
        if (plugin != null) {
            plugin.stop();
            log.info("Unloaded plugin: {}", pluginId);
        }
    }
    
    public void startPlugin(String pluginId) {
        Plugin plugin = plugins.get(pluginId);
        
        if (plugin != null) {
            plugin.start();
            log.info("Started plugin: {}", pluginId);
        }
    }
    
    public void stopPlugin(String pluginId) {
        Plugin plugin = plugins.get(pluginId);
        
        if (plugin != null) {
            plugin.stop();
            log.info("Stopped plugin: {}", pluginId);
        }
    }
    
    public List<Plugin> getActivePlugins() {
        return plugins.values().stream()
            .filter(Plugin::isActive)
            .collect(Collectors.toList());
    }
}
```

---

## Runtime Extensions

### Runtime Extension

```java
public class RuntimeExtension implements ExtensionPoint {
    
    private final String extensionId;
    private final Function<Execution, Void> preHandler;
    private final Function<Execution, Void> postHandler;
    
    public RuntimeExtension(String extensionId,
                           Function<Execution, Void> preHandler,
                           Function<Execution, Void> postHandler) {
        this.extensionId = extensionId;
        this.preHandler = preHandler;
        this.postHandler = postHandler;
    }
    
    public void apply(Execution execution) {
        if (preHandler != null) {
            preHandler.apply(execution);
        }
        
        // Original execution happens here
        
        if (postHandler != null) {
            postHandler.apply(execution);
        }
    }
    
    @Override
    public String getId() {
        return extensionId;
    }
    
    @Override
    public ExtensionType getType() {
        return ExtensionType.CUSTOM;
    }
}
```

### Extension Context

```java
public class ExtensionContext {
    
    private final ProcessEngine processEngine;
    private final CommandContext commandContext;
    private final Map<String, Object> attributes = new HashMap<>();
    
    public ExtensionContext(ProcessEngine processEngine, 
                           CommandContext commandContext) {
        this.processEngine = processEngine;
        this.commandContext = commandContext;
    }
    
    public ProcessEngine getProcessEngine() {
        return processEngine;
    }
    
    public CommandContext getCommandContext() {
        return commandContext;
    }
    
    public void setAttribute(String key, Object value) {
        attributes.put(key, value);
    }
    
    public Object getAttribute(String key) {
        return attributes.get(key);
    }
    
    public <T> T getService(Class<T> serviceClass) {
        return processEngine.getService(serviceClass);
    }
}
```

---

## Configuration

### Extension Configuration

```java
@ConfigurationProperties(prefix = "activiti.extensions")
public class ExtensionProperties {
    
    private boolean enabled = true;
    private List<String> autoLoadPlugins = new ArrayList<>();
    private Map<String, PluginConfig> plugins = new HashMap<>();
    
    public static class PluginConfig {
        private boolean enabled = true;
        private String version;
        private Map<String, String> properties = new HashMap<>();
        
        // Getters and setters
    }
    
    // Getters and setters
}
```

### Spring Configuration

```java
@Configuration
public class ExtensionConfig {
    
    @Bean
    public ExtensionRegistry extensionRegistry() {
        return new ExtensionRegistry();
    }
    
    @Bean
    public PluginManager pluginManager(ExtensionRegistry registry) {
        return new PluginManager(registry);
    }
    
    @Bean
    public CustomBehaviorFactory behaviorFactory() {
        return new CustomBehaviorFactory();
    }
}
```

---

## Usage Examples

### Creating a Custom Plugin

```java
@Component
public class AuditPlugin implements Plugin {
    
    private static final String PLUGIN_ID = "audit-plugin";
    private static final String PLUGIN_VERSION = "1.0.0";
    
    private PluginContext context;
    private boolean active = false;
    
    @Override
    public String getId() {
        return PLUGIN_ID;
    }
    
    @Override
    public String getVersion() {
        return PLUGIN_VERSION;
    }
    
    @Override
    public void initialize(PluginContext pluginContext) {
        this.context = pluginContext;
        
        // Register audit extension
        context.registerExtension(new AuditExtension());
    }
    
    @Override
    public void start() {
        active = true;
        log.info("Audit plugin started");
    }
    
    @Override
    public void stop() {
        active = false;
        log.info("Audit plugin stopped");
    }
    
    @Override
    public boolean isActive() {
        return active;
    }
    
    private class AuditExtension implements ExtensionPoint {
        @Override
        public String getId() {
            return "audit-extension";
        }
        
        @Override
        public ExtensionType getType() {
            return ExtensionType.EVENT_LISTENER;
        }
        
        @Override
        public boolean isActive() {
            return true;
        }
        
        @Override
        public int getPriority() {
            return 100;
        }
    }
}
```

### Using Runtime Extensions

```java
@Service
public class ProcessExtensionService {
    
    @Autowired
    private ExtensionRegistry extensionRegistry;
    
    public void addValidationExtension() {
        RuntimeExtension validationExtension = 
            new RuntimeExtension(
                "validation-extension",
                execution -> {
                    // Pre-validation
                    validateExecution(execution);
                    return null;
                },
                execution -> {
                    // Post-validation
                    logValidation(execution);
                    return null;
                });
        
        extensionRegistry.register(validationExtension);
    }
    
    private void validateExecution(Execution execution) {
        // Custom validation logic
    }
}
```

---

## Best Practices

### 1. Use Unique Extension IDs

```java
// GOOD
private static final String EXTENSION_ID = 
    "com.example.myextension.v1";

// BAD
private static final String EXTENSION_ID = "extension";
```

### 2. Handle Extension Failures Gracefully

```java
try {
    extension.apply(execution);
} catch (Exception e) {
    log.error("Extension failed", e);
    // Don't break the process
}
```

### 3. Document Extension Dependencies

```java
/**
 * Extension: audit-plugin
 * Dependencies: process-engine >= 8.7.0
 * Conflicts: legacy-audit-plugin
 */
```

### 4. Test Extensions Thoroughly

```java
@Test
void testExtensionDoesNotBreakCoreFunctionality() {
    // Test with extension enabled
    // Test with extension disabled
    // Compare results
}
```

---

## API Reference

### Key Classes

- `ExtensionPoint` - Extension interface
- `ExtensionRegistry` - Extension management
- `Plugin` - Plugin interface
- `PluginManager` - Plugin lifecycle
- `RuntimeExtension` - Runtime extension
- `ExtensionContext` - Extension context

### Key Methods

```java
// Extension management
void register(ExtensionPoint extension)
void unregister(String extensionId)
List<ExtensionPoint> getExtensions(ExtensionType type)

// Plugin management
void loadPlugin(Plugin plugin)
void unloadPlugin(String pluginId)
void startPlugin(String pluginId)
void stopPlugin(String pluginId)

// Runtime
void apply(Execution execution)
ExtensionContext getContext()
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Engine Documentation](../engine-api/README.md)
- [Spring Integration](../engine-api/spring-integration.md)
