---
sidebar_label: Spring Resource Finder
slug: /api-reference/core-common/spring-resource-finder
description: Spring-based resource discovery and classpath scanning for Activiti process definitions.
---

# Activiti Spring Resource Finder Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-resource-finder`

---

## Overview

The **activiti-spring-resource-finder** module provides resource discovery and loading capabilities for Activiti applications. It enables finding and reading BPMN files, process definitions, and other resources from various locations including classpath, file system, and external sources.

### Key Features

- **Resource Discovery**: Find resources across multiple locations
- **Flexible Loading**: Support for classpath, file system, URLs
- **Pattern Matching**: Wildcard-based resource finding
- **Spring Integration**: Auto-configuration support
- **Custom Descriptors**: Pluggable resource finder strategies

### Key Classes

- `ResourceFinder` - Main resource discovery service
- `ResourceFinderDescriptor` - Resource finder strategy interface
- `ResourceReader` - Resource content reader
- `ResourceFinderAutoConfiguration` - Spring auto-configuration

### Usage Example

```java
@Autowired
private ResourceFinder resourceFinder;

public List<Resource> discoverBpmnFiles(ResourceFinderDescriptor descriptor) throws IOException {
    return resourceFinder.discoverResources(descriptor);
}
```

---

## Architecture

```
ResourceFinder
    └── ResourceFinderDescriptor (strategy interface)
        └── implementors define location prefix, suffixes, validation, etc.
```

---

## Resource Discovery

```java
// ResourceFinder takes a descriptor that defines where and how to look
ResourceFinderDescriptor descriptor = new MyProcessDefinitionFinderDescriptor();
List<Resource> resources = resourceFinder.discoverResources(descriptor);
```

---

## Custom Resource Finder Descriptor

```java
public class CustomResourceFinderDescriptor implements ResourceFinderDescriptor {
    
    @Override
    public List<String> getLocationSuffixes() {
        return Arrays.asList("/**/*.bpmn", "/**/*.xml");
    }

    @Override
    public String getLocationPrefix() {
        return "classpath:/processes/";
    }

    @Override
    public boolean shouldLookUpResources() {
        return true;
    }

    @Override
    public void validate(List<Resource> resources) throws IOException {
        if (resources.isEmpty()) {
            throw new IOException("No process definitions found");
        }
    }

    @Override
    public String getMsgForEmptyResources() {
        return "No resources found";
    }

    @Override
    public String getMsgForResourcesFound(List<String> foundResources) {
        return "Found resources: " + foundResources;
    }
}
```

---

## Best Practices

1. **Use classpath for bundled resources**
2. **Use file system for external resources**
3. **Cache resource lookups**
4. **Handle missing resources gracefully**
5. **Validate resource patterns**

---

## API Reference

### ResourceFinder

```java
/**
 * Discover resources using the provided descriptor.
 * Iterates over the descriptor's location suffixes, resolves them via
 * ResourcePatternResolver, and returns the combined list of resources.
 */
List<Resource> discoverResources(ResourceFinderDescriptor resourceFinderDescriptor) throws IOException;
```

### ResourceFinderDescriptor

```java
/**
 * List of path suffixes to append to the location prefix (e.g., "**/*.bpmn").
 */
List<String> getLocationSuffixes();

/**
 * The location prefix (e.g., "classpath:/processes/").
 */
String getLocationPrefix();

/**
 * Whether resource discovery should be performed.
 */
boolean shouldLookUpResources();

/**
 * Validate the discovered resources.
 */
void validate(List<Resource> resources) throws IOException;

/**
 * Message to log when no resources are found.
 */
String getMsgForEmptyResources();

/**
 * Message to log when resources are found.
 */
String getMsgForResourcesFound(List<String> foundResources);
```

---

## Troubleshooting

### Resource Not Found

**Problem:** Cannot find resource

**Solution:**
1. Check resource location is correct
2. Verify pattern matches resource name
3. Ensure resource exists in classpath/file system

```java
// Debug
ResourceFinderDescriptor descriptor = new MyProcessDefinitionFinderDescriptor();
List<Resource> resources = resourceFinder.discoverResources(descriptor);
System.out.println("Found: " + resources.size() + " resources");
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Spring Application](./spring-application.md)
