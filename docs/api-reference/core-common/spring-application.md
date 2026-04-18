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

- `ApplicationService` - Application management service
- `ApplicationDeployer` - Deploys applications
- `ApplicationDiscovery` - Discovers applications
- `ApplicationEntry` - Represents application entry point
- `ApplicationContent` - Manages application content

### Usage Example

```java
@Autowired
private ApplicationService applicationService;

public void deployApplication(String applicationId) {
    applicationService.deploy(applicationId);
}

public List<ApplicationEntry> getApplications() {
    return applicationService.getApplications();
}
```

---

## Architecture

```
ApplicationService
    ├── ApplicationDeployer (deployment)
    ├── ApplicationDiscovery (discovery)
    ├── ApplicationEntry (entry points)
    └── ApplicationContent (content management)
```

---

## Best Practices

1. **Use ApplicationService for all operations**
2. **Handle deployment exceptions**
3. **Cache application entries**
4. **Validate before deployment**

---

## API Reference

### ApplicationService

```java
void deploy(String applicationId);
List<ApplicationEntry> getApplications();
ApplicationEntry getApplication(String id);
void undeploy(String applicationId);
```

### ApplicationEntry

```java
String getId();
String getName();
String getVersion();
List<FileContent> getContent();
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Project Model](../core-common/project-model.md)
