---
sidebar_label: Spring Project
slug: /api-reference/core-common/spring-project
description: Spring integration for Activiti project manifest loading and deployment.
---

# Activiti Spring Project Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-project`

---

## Overview

The **activiti-spring-project** module provides Spring integration for Activiti project management and application upgrades. It handles project manifest loading, version enforcement, and rollback deployment scenarios.

### Key Features

- **Project Manifest Loading**: Load and parse project manifests
- **Version Enforcement**: Enforce specific application versions
- **Rollback Support**: Handle rollback deployments
- **Spring Integration**: Auto-configuration for Spring Boot
- **Resource Management**: Flexible resource location

### Key Classes

- `ApplicationUpgradeContextService` - Manages upgrade context
- `ApplicationUpgradeContextAutoConfiguration` - Spring auto-configuration

### Usage Example

```java
@Autowired
private ApplicationUpgradeContextService upgradeService;

public void checkUpgrade() throws IOException {
    if (upgradeService.hasProjectManifest()) {
        ProjectManifest manifest = upgradeService.loadProjectManifest();
        // manifest fields: id, name, version, description, createdBy, lastModifiedBy, creationDate, lastModifiedDate
    }

    if (upgradeService.hasEnforcedAppVersion()) {
        Integer enforced = upgradeService.getEnforcedAppVersion();
        log.info("Enforced version: {}", enforced);
    }

    if (upgradeService.isRollbackDeployment()) {
        log.warn("Rollback deployment detected");
    }
}
```

---

## Architecture

```
ApplicationUpgradeContextService
    ├── Project Manifest Loading
    ├── Version Enforcement
    └── Rollback Detection
```

---

## Project Manifest Loading

```java
public class ApplicationUpgradeContextService {

    private String projectManifestFilePath;
    private Integer enforcedAppVersion;
    private boolean isRollbackDeployment;
    private final ObjectMapper objectMapper;
    private ResourcePatternResolver resourceLoader;

    public ProjectManifest loadProjectManifest() throws IOException {
        Optional<Resource> resourceOptional = retrieveResource();

        return read(resourceOptional
            .orElseThrow(() -> new FileNotFoundException("'" + projectManifestFilePath + "' manifest not found."))
            .getInputStream());
    }

    private Optional<Resource> retrieveResource() {
        Resource resource = resourceLoader.getResource(projectManifestFilePath);
        if (resource.exists()) {
            return Optional.of(resource);
        } else {
            return Optional.empty();
        }
    }

    private ProjectManifest read(InputStream inputStream) throws IOException {
        return objectMapper.readValue(inputStream,
            ProjectManifest.class);
    }
}
```

---

## Version Enforcement

`hasEnforcedAppVersion()` returns `true` when the configured `application.version` property is greater than 0. It does **not** check a boolean flag — it compares the integer value:

```java
public boolean hasEnforcedAppVersion() {
    return this.enforcedAppVersion > 0;
}
```

When `application.version` is set to `0` (the default) or is negative, version enforcement is disabled.

```java
@Autowired
private ApplicationUpgradeContextService upgradeService;

public void checkVersion() {
    if (upgradeService.hasEnforcedAppVersion()) {
        Integer enforced = upgradeService.getEnforcedAppVersion();
        log.info("Enforced application version: {}", enforced);
    }
}
```

---

## Rollback Deployment

The `isRollbackDeployment()` method is driven by the `activiti.deploy.after-rollback` property (default `false`). When set to `true`, it indicates the current deployment is a rollback scenario.

```java
@Autowired
private ApplicationUpgradeContextService upgradeService;

public void handleDeployment() {
    if (upgradeService.isRollbackDeployment()) {
        log.info("Rollback deployment detected");
        // Handle rollback logic
    } else {
        log.info("Forward deployment");
        // Handle normal deployment logic
    }
}
```

---

## Configuration

The following Spring properties are configured in `ApplicationUpgradeContextAutoConfiguration`:

| Property | Default Value | Description |
|----------|--------------|-------------|
| `project.manifest.file.path` | `classpath:/default-app.json` | Path to the project manifest file |
| `application.version` | `0` | Enforced application version (integer > 0 enables enforcement) |
| `activiti.deploy.after-rollback` | `false` | Whether this is a rollback deployment |

Example `application.yml`:

```yaml
project:
  manifest:
    file:
      path: classpath:/default-app.json
application:
  version: 1
activiti:
  deploy:
    after-rollback: false
```

---

## Best Practices

1. **Always check manifest existence before loading**
2. **Handle version conflicts gracefully**
3. **Log rollback deployments**
4. **Validate manifest structure**

---

## API Reference

### ApplicationUpgradeContextService

**Constructor:**

```java
public ApplicationUpgradeContextService(String path,
                                        Integer enforcedAppVersion,
                                        Boolean isRollbackDeployment,
                                        ObjectMapper objectMapper,
                                        ResourcePatternResolver resourceLoader)
```

**Methods:**

```java
ProjectManifest loadProjectManifest() throws IOException;
boolean hasProjectManifest();
boolean hasEnforcedAppVersion();  // Returns true when enforcedAppVersion > 0
Integer getEnforcedAppVersion();
boolean isRollbackDeployment();
```

---

## Troubleshooting

### Manifest Not Found

**Problem:** `FileNotFoundException` with message `"'" + projectManifestFilePath + "' manifest not found."` when calling `loadProjectManifest()`.

**Solution:**
1. Verify the `project.manifest.file.path` property points to an existing resource
2. Default value is `classpath:/default-app.json`
3. Always call `hasProjectManifest()` before attempting to load

```java
if (!upgradeService.hasProjectManifest()) {
    log.error("Project manifest not found. Check project.manifest.file.path property.");
}
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Project Model](./project-model.md)
- [Spring Application](./spring-application.md)
