---
sidebar_label: Spring Application
slug: /api-reference/core-common/spring-application
description: Spring application context integration for Activiti process engine bootstrapping.
---

# Activiti Spring Application Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-application`

---

## Overview

The **activiti-spring-application** module provides Spring integration for Activiti application management. It handles application deployment, discovery, and lifecycle management within the Spring ecosystem.

### Key Features

- **Application Deployment**: Deploy Activiti applications
- **Application Discovery**: Discover available applications
- **Content Management**: Manage application content
- **Entry Point Management**: Handle application entries
- **Spring Integration**: Full Spring Boot support

### Key Classes

- `ApplicationService` - Loads applications from discovered resources
- `ApplicationDeployer` - Deploys applications using entry deployers
- `ApplicationDiscovery` - Discovers applications
- `ApplicationEntry` - Represents an application entry point
- `ApplicationContent` - Manages application content
- `ApplicationEntryDeployer` - Interface for deploying application entries

### Usage Example

```java
@Autowired
private ApplicationService applicationService;

public List<ApplicationContent> loadApplications() {
    return applicationService.loadApplications();
}
```

---

## Architecture

```
ApplicationDeployer
    ├── ApplicationService (loadApplications)
    └── List<ApplicationEntryDeployer> (deployEntries)
            └── ApplicationContent (getFileContents)
                    └── FileContent (getName, getContent)
```

---

## Best Practices

1. **Use ApplicationDeployer for deployment** - It coordinates loading and deploying all applications
2. **Implement ApplicationEntryDeployer for custom entry types**
3. **Use ApplicationService.loadApplications() to get all discovered applications**
4. **Filter entries by type using ApplicationContent.getFileContents(type)**

---

## API Reference

### ApplicationService

```java
List<ApplicationContent> loadApplications();
```

Loads all discovered applications by iterating over resources found by `ApplicationDiscovery`, reading each via `ApplicationReader`.

### ApplicationDeployer

```java
public ApplicationDeployer(ApplicationService applicationLoader,
                          List<ApplicationEntryDeployer> deployers);

void deploy();
```

Deploys all applications. Calls `ApplicationService.loadApplications()` and iterates each `ApplicationEntryDeployer` over every `ApplicationContent`.

### ApplicationEntryDeployer

```java
void deployEntries(ApplicationContent application);
```

Interface for deploying entries of a specific type from an `ApplicationContent`.

### ApplicationEntry

```java
public ApplicationEntry(String type, FileContent fileContent);

String getType();
FileContent getFileContent();
```

Represents a single application entry with a type and associated file content.

### ApplicationContent

```java
void add(ApplicationEntry entry);
List<FileContent> getFileContents(String entryType);
```

Aggregates application entries grouped by type. Adds entries and retrieves file contents for a specific entry type.

### FileContent

```java
public FileContent(String name, byte[] content);

String getName();
byte[] getContent();
```

Represents a single file with its name and binary content.

### ApplicationEntryDiscovery

```java
Predicate<ZipEntry> filter(ZipEntry entry);
String getEntryType();
```

Interface for discovering application entries within zip files. Provides a filter predicate and declares the entry type.

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Project Model](./project-model.md)
