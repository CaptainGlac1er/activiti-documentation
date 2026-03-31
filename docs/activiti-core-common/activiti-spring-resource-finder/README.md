# Activiti Spring Resource Finder Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-resource-finder`

**Target Audience:** Senior Software Engineers, Integration Developers

**Version:** 8.7.2-SNAPSHOT

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
- `ResourceFinderDescriptor` - Resource finder strategy
- `ResourceReader` - Resource content reader
- `ResourceFinderAutoConfiguration` - Spring auto-configuration

### Usage Example

```java
@Autowired
private ResourceFinder resourceFinder;

public List<Resource> findBpmnFiles() {
    return resourceFinder.findResources("**/*.bpmn");
}

public String readResource(String path) throws IOException {
    return resourceFinder.readResource(path);
}
```

---

## Architecture

```
ResourceFinder
    ├── ResourceFinderDescriptor (strategy)
    │   ├── ClassPathResourceDescriptor
    │   ├── FileSystemResourceDescriptor
    │   └── UrlResourceDescriptor
    └── ResourceReader (content loading)
```

---

## Resource Discovery

### Finding Resources

```java
// Find all BPMN files
List<Resource> bpmnFiles = resourceFinder.findResources("**/*.bpmn");

// Find resources in specific location
List<Resource> processFiles = resourceFinder.findResources(
    "classpath:processes/**/*.bpmn");

// Find by multiple patterns
List<Resource> allResources = resourceFinder.findResources(
    Arrays.asList("**/*.bpmn", "**/*.xml"));
```

### Reading Resources

```java
// Read as string
String content = resourceFinder.readResource("classpath:process/order.bpmn");

// Read as input stream
try (InputStream is = resourceFinder.getResourceAsStream("process.bpmn")) {
    // Process stream
}

// Read as byte array
byte[] bytes = resourceFinder.getResourceAsByteArray("process.bpmn");
```

---

## Custom Resource Finder

```java
@Component
public class CustomResourceFinderDescriptor implements ResourceFinderDescriptor {
    
    @Override
    public boolean supports(String location) {
        return location.startsWith("custom:");
    }
    
    @Override
    public List<Resource> findResources(String pattern) {
        // Custom resource finding logic
        return customResourceLocator.find(pattern);
    }
    
    @Override
    public Resource getResource(String location) {
        // Custom resource loading
        return customResourceLoader.load(location);
    }
}
```

---

## Configuration

```yaml
activiti:
  resources:
    locations:
      - classpath:processes/
      - file:/opt/activiti/processes/
    patterns:
      - "*.bpmn"
      - "*.xml"
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
List<Resource> findResources(String pattern);
List<Resource> findResources(List<String> patterns);
Resource getResource(String location);
String readResource(String location) throws IOException;
InputStream getResourceAsStream(String location) throws IOException;
byte[] getResourceAsByteArray(String location) throws IOException;
```

### ResourceFinderDescriptor

```java
boolean supports(String location);
List<Resource> findResources(String pattern);
Resource getResource(String location);
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
System.out.println("Looking for: " + pattern);
List<Resource> resources = resourceFinder.findResources(pattern);
System.out.println("Found: " + resources.size() + " resources");
```

---

## See Also

- [Parent Module Documentation](../README.md)
- [Spring Application](../activiti-spring-application/README.md)
