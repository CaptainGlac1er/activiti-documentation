---
sidebar_label: Project Model
slug: /api-reference/core-common/project-model
description: Core common utilities and shared modules.
---

# Activiti Project Model Module - Technical Documentation

**Module:** `activiti-core-common/activiti-project-model`

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Classes and Their Responsibilities](#key-classes-and-their-responsibilities)
- [Project Manifest](#project-manifest)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-project-model** module provides the data model for Activiti projects. It defines the `ProjectManifest` class that represents metadata about Activiti applications, including versioning, authorship, and descriptive information.

### Key Features

- **Project Metadata**: Store project information
- **Versioning**: Track project versions
- **Authorship**: Record creator and modifier information
- **Timestamps**: Track creation and modification dates
- **Simple POJO**: Plain Java object for easy integration

### Module Structure

```
activiti-project-model/
└── src/main/java/org/activiti/core/common/project/model/
    └── ProjectManifest.java    # Project metadata model
```

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Project Model                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ProjectManifest                         │   │
│  │         (Project Metadata Model)                     │   │
│  │                                                      │   │
│  │  Identity:                                          │   │
│  │  - id: String                                       │   │
│  │  - name: String                                     │   │
│  │  - description: String                              │   │
│  │  - version: String                                  │   │
│  │                                                      │   │
│  │  Authorship:                                        │   │
│  │  - createdBy: String                                │   │
│  │  - creationDate: String                             │   │
│  │  - lastModifiedBy: String                           │   │
│  │  - lastModifiedDate: String                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```
ProjectManifest
├── Identity
│   ├── id (String): Unique project identifier
│   ├── name (String): Project display name
│   ├── description (String): Project description
│   └── version (String): Project version
└── Authorship
    ├── createdBy (String): Creator identifier
    ├── creationDate (String): Creation timestamp
    ├── lastModifiedBy (String): Last modifier identifier
    └── lastModifiedDate (String): Last modification timestamp
```

---

## Key Classes and Their Responsibilities

### ProjectManifest

**Purpose:** Represents metadata about an Activiti project/application.

**Responsibilities:**
- Store project identity information
- Track versioning
- Record authorship details
- Maintain modification history
- Provide project metadata

**Fields:**
- `id` (String): Unique project identifier
- `name` (String): Human-readable project name
- `description` (String): Project description
- `version` (String): Project version
- `createdBy` (String): User who created the project
- `creationDate` (String): When project was created
- `lastModifiedBy` (String): User who last modified
- `lastModifiedDate` (String): When last modified

**When to Use:** When managing Activiti application metadata.

**Design Pattern:** Value object / POJO pattern

**Thread Safety:** Not thread-safe (mutable POJO)

**Example:**
```java
ProjectManifest manifest = new ProjectManifest();
manifest.setId("order-management");
manifest.setName("Order Management System");
manifest.setDescription("Handles order processing workflow");
manifest.setVersion("1.0.0");
manifest.setCreatedBy("admin");
manifest.setCreationDate("2024-01-15T10:30:00Z");
```

---

## Project Manifest

### Creating a Manifest

```java
public class ProjectManifestFactory {
    
    public static ProjectManifest createNew(String id, String name, String version) {
        ProjectManifest manifest = new ProjectManifest();
        
        manifest.setId(id);
        manifest.setName(name);
        manifest.setDescription("");
        manifest.setVersion(version);
        
        String currentUser = getCurrentUser();
        manifest.setCreatedBy(currentUser);
        manifest.setCreationDate(Instant.now().toString());
        
        manifest.setLastModifiedBy(currentUser);
        manifest.setLastModifiedDate(Instant.now().toString());
        
        return manifest;
    }
    
    private static String getCurrentUser() {
        // Get from security context or system property
        return System.getProperty("user.name", "system");
    }
}
```

### Updating a Manifest

```java
@Service
public class ProjectManifestService {
    
    public ProjectManifest updateManifest(String projectId, 
            String newName, String newVersion) {
        ProjectManifest manifest = getManifest(projectId);
        
        manifest.setName(newName);
        manifest.setVersion(newVersion);
        
        String currentUser = getCurrentUser();
        manifest.setLastModifiedBy(currentUser);
        manifest.setLastModifiedDate(Instant.now().toString());
        
        return saveManifest(manifest);
    }
    
    private String getCurrentUser() {
        // Get from security context
        return securityManager.getCurrentUserIdentity();
    }
}
```

### Storing Manifest

```java
@Repository
public class ProjectManifestRepository {
    
    private final Map<String, ProjectManifest> manifests = new ConcurrentHashMap<>();
    
    public ProjectManifest save(ProjectManifest manifest) {
        manifests.put(manifest.getId(), manifest);
        return manifest;
    }
    
    public Optional<ProjectManifest> findById(String id) {
        return Optional.ofNullable(manifests.get(id));
    }
    
    public List<ProjectManifest> findAll() {
        return new ArrayList<>(manifests.values());
    }
}
```

---

## Usage Examples

### Application Deployment

```java
@Component
public class ApplicationDeployer {
    
    @Autowired
    private ProjectManifestRepository manifestRepository;
    
    public void deployApplication(String archivePath) throws IOException {
        // Extract manifest from archive
        ProjectManifest manifest = extractManifest(archivePath);
        
        // Validate manifest
        validateManifest(manifest);
        
        // Store manifest
        manifestRepository.save(manifest);
        
        // Deploy application
        deployProcesses(manifest);
        
        log.info("Deployed application: {} v{}", 
            manifest.getName(), manifest.getVersion());
    }
    
    private ProjectManifest extractManifest(String archivePath) throws IOException {
        try (ZipInputStream zip = new ZipInputStream(
                new FileInputStream(archivePath))) {
            
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if ("MANIFEST.json".equals(entry.getName())) {
                    String json = new String(zip.readAllBytes());
                    return objectMapper.readValue(json, ProjectManifest.class);
                }
            }
        }
        throw new IllegalStateException("No manifest found in archive");
    }
}
```

### Version Management

```java
@Service
public class VersionManager {
    
    @Autowired
    private ProjectManifestRepository manifestRepository;
    
    public boolean isNewerVersion(String projectId, String newVersion) {
        ProjectManifest manifest = manifestRepository.findById(projectId)
            .orElseThrow(() -> new ProjectNotFoundException(projectId));
        
        String currentVersion = manifest.getVersion();
        return compareVersions(newVersion, currentVersion) > 0;
    }
    
    public void upgradeVersion(String projectId, String newVersion) {
        ProjectManifest manifest = manifestRepository.findById(projectId)
            .orElseThrow(() -> new ProjectNotFoundException(projectId));
        
        if (!isNewerVersion(projectId, newVersion)) {
            throw new IllegalStateException(
                "New version must be greater than current version");
        }
        
        manifest.setVersion(newVersion);
        manifest.setLastModifiedBy(getCurrentUser());
        manifest.setLastModifiedDate(Instant.now().toString());
        
        manifestRepository.save(manifest);
    }
    
    private int compareVersions(String v1, String v2) {
        // Implement semantic version comparison
        String[] parts1 = v1.split("\.");
        String[] parts2 = v2.split("\.");
        
        for (int i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            int num1 = i < parts1.length ? Integer.parseInt(parts1[i]) : 0;
            int num2 = i < parts2.length ? Integer.parseInt(parts2[i]) : 0;
            
            if (num1 != num2) {
                return num1 - num2;
            }
        }
        return 0;
    }
}
```

### Audit Trail

```java
@Service
public class ProjectAuditService {
    
    @Autowired
    private ProjectManifestRepository manifestRepository;
    
    public List<AuditEntry> getAuditTrail(String projectId) {
        ProjectManifest manifest = manifestRepository.findById(projectId)
            .orElseThrow(() -> new ProjectNotFoundException(projectId));
        
        List<AuditEntry> entries = new ArrayList<>();
        
        // Creation event
        entries.add(new AuditEntry(
            manifest.getCreationDate(),
            manifest.getCreatedBy(),
            "PROJECT_CREATED",
            "Project created with version " + manifest.getVersion()
        ));
        
        // Last modification event
        if (!manifest.getCreatedBy().equals(manifest.getLastModifiedBy()) ||
            !manifest.getCreationDate().equals(manifest.getLastModifiedDate())) {
            entries.add(new AuditEntry(
                manifest.getLastModifiedDate(),
                manifest.getLastModifiedBy(),
                "PROJECT_MODIFIED",
                "Project last modified"
            ));
        }
        
        return entries;
    }
}
```

### JSON Serialization

```java
// Manifest to JSON
String json = objectMapper.writeValueAsString(manifest);

/*
{
  "id": "order-management",
  "name": "Order Management System",
  "description": "Handles order processing workflow",
  "version": "1.0.0",
  "createdBy": "admin",
  "creationDate": "2024-01-15T10:30:00Z",
  "lastModifiedBy": "admin",
  "lastModifiedDate": "2024-01-15T10:30:00Z"
}
*/

// JSON to Manifest
ProjectManifest manifest = objectMapper.readValue(json, ProjectManifest.class);
```

---

## Best Practices

### 1. Use Semantic Versioning

```java
// GOOD - Semantic versioning
manifest.setVersion("1.2.3");  // major.minor.patch

// BAD - Non-standard versioning
manifest.setVersion("v1");
manifest.setVersion("release-1");
```

### 2. Set All Required Fields

```java
// GOOD
ProjectManifest manifest = new ProjectManifest();
manifest.setId("my-project");
manifest.setName("My Project");
manifest.setVersion("1.0.0");
manifest.setCreatedBy("admin");
manifest.setCreationDate(Instant.now().toString());

// BAD - Missing fields
ProjectManifest manifest = new ProjectManifest();
manifest.setName("My Project");
```

### 3. Use ISO 8601 Date Format

```java
// GOOD
manifest.setCreationDate(Instant.now().toString());
// "2024-01-15T10:30:00Z"

// BAD
manifest.setCreationDate(new Date().toString());
// "Mon Jan 15 10:30:00 UTC 2024"
```

### 4. Validate Project IDs

```java
// GOOD
public void validateProjectId(String id) {
    if (id == null || id.isEmpty()) {
        throw new IllegalArgumentException("Project ID cannot be empty");
    }
    if (!id.matches("[a-z0-9-]+")) {
        throw new IllegalArgumentException(
            "Project ID must contain only lowercase letters, numbers, and hyphens");
    }
}

// BAD - No validation
manifest.setId(userInput);
```

### 5. Track Modifications

```java
// GOOD - Update modification info
public void updateManifest(ProjectManifest manifest) {
    // ... update fields ...
    manifest.setLastModifiedBy(getCurrentUser());
    manifest.setLastModifiedDate(Instant.now().toString());
    repository.save(manifest);
}

// BAD - Forget to update
public void updateManifest(ProjectManifest manifest) {
    manifest.setName(newName);
    repository.save(manifest);
    // lastModifiedBy and lastModifiedDate not updated
}
```

---

## API Reference

### ProjectManifest

**Fields:**

```java
private String id;                    // Unique project identifier
private String name;                  // Project display name
private String description;           // Project description
private String version;               // Project version
private String createdBy;             // Creator identifier
private String creationDate;          // Creation timestamp
private String lastModifiedBy;        // Last modifier identifier
private String lastModifiedDate;      // Last modification timestamp
```

**Methods:**

```java
// Identity
String getId();
void setId(String id);
String getName();
void setName(String name);
String getDescription();
void setDescription(String description);
String getVersion();
void setVersion(String version);

// Authorship
String getCreatedBy();
void setCreatedBy(String createdBy);
String getCreationDate();
void setCreationDate(String creationDate);
String getLastModifiedBy();
void setLastModifiedBy(String lastModifiedBy);
String getLastModifiedDate();
void setLastModifiedDate(String lastModifiedDate);
```

---

## Validation Rules

1. **ID Required**: Project ID must not be null or empty
2. **ID Format**: Should use lowercase letters, numbers, and hyphens
3. **Name Required**: Project name must not be null or empty
4. **Version Required**: Version must follow semantic versioning
5. **Dates Required**: Creation and modification dates should be set
6. **Authors Required**: Created by and last modified by should be set

---

## Troubleshooting

### Manifest Not Found

**Problem:** Cannot find project manifest

**Solution:**
1. Check project ID is correct
2. Verify manifest was saved
3. Check repository configuration

```java
Optional<ProjectManifest> manifest = repository.findById("my-project");
if (manifest.isEmpty()) {
    log.error("Manifest not found for project: my-project");
}
```

### Invalid Date Format

**Problem:** Date parsing fails

**Solution:**
1. Use ISO 8601 format
2. Store as String, not Date object
3. Use Instant for timestamps

```java
// GOOD
manifest.setCreationDate(Instant.now().toString());

// BAD
manifest.setCreationDate(new Date().toString());
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [Spring Project](../core-common/spring-project.md)
- [Spring Application](../core-common/spring-application.md)
