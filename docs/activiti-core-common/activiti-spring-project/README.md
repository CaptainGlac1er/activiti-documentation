# Activiti Spring Project Module - Technical Documentation

**Module:** `activiti-core-common/activiti-spring-project`

**Target Audience:** Senior Software Engineers, DevOps Engineers

**Version:** 8.7.2-SNAPSHOT

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
        log.info("Loaded manifest: {} v{}", manifest.getName(), manifest.getVersion());
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
        
        Resource resource = resourceOptional
            .orElseThrow(() -> new FileNotFoundException(
                "'" + projectManifestFilePath + "' manifest not found."));
        
        try (InputStream inputStream = resource.getInputStream()) {
            return read(inputStream);
        }
    }
    
    private Optional<Resource> retrieveResource() {
        Resource resource = resourceLoader.getResource(projectManifestFilePath);
        return resource.exists() ? Optional.of(resource) : Optional.empty();
    }
    
    private ProjectManifest read(InputStream inputStream) throws IOException {
        return objectMapper.readValue(inputStream, ProjectManifest.class);
    }
}
```

---

## Version Enforcement

```java
@Service
public class VersionEnforcementService {
    
    @Autowired
    private ApplicationUpgradeContextService upgradeService;
    
    public boolean shouldEnforceVersion() {
        return upgradeService.hasEnforcedAppVersion();
    }
    
    public Integer getEnforcedVersion() {
        return upgradeService.getEnforcedAppVersion();
    }
    
    public void checkVersionCompatibility(String currentVersion) {
        if (shouldEnforceVersion()) {
            Integer enforced = getEnforcedVersion();
            if (!isCompatible(currentVersion, enforced)) {
                throw new IncompatibleVersionException(
                    "Version " + currentVersion + 
                    " is not compatible with enforced version " + enforced);
            }
        }
    }
}
```

---

## Rollback Deployment

```java
@Service
public class RollbackHandler {
    
    @Autowired
    private ApplicationUpgradeContextService upgradeService;
    
    public void handleDeployment() {
        if (upgradeService.isRollbackDeployment()) {
            log.info("Executing rollback deployment");
            performRollback();
        } else {
            log.info("Executing forward deployment");
            performDeployment();
        }
    }
    
    private void performRollback() {
        // Rollback logic
    }
    
    private void performDeployment() {
        // Normal deployment logic
    }
}
```

---

## Configuration

```yaml
# application.yml
activiti:
  project:
    manifest-path: classpath:project/MANIFEST.json
    enforced-version: 1
    rollback: false
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

**Methods:**

```java
ProjectManifest loadProjectManifest() throws IOException;
boolean hasProjectManifest();
boolean hasEnforcedAppVersion();
Integer getEnforcedAppVersion();
boolean isRollbackDeployment();
```

---

## Troubleshooting

### Manifest Not Found

**Problem:** FileNotFoundException when loading manifest

**Solution:**
1. Check manifest path is correct
2. Verify manifest file exists
3. Ensure proper file permissions

```java
if (!upgradeService.hasProjectManifest()) {
    log.error("Project manifest not found at: {}", manifestPath);
}
```

---

## See Also

- [Parent Module Documentation](../README.md)
- [Project Model](../activiti-project-model/README.md)
- [Spring Application](../activiti-spring-application/README.md)
