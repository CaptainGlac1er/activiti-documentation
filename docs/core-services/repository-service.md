---
sidebar_label: Repository Service
slug: /core-services/repository-service
description: Complete guide to the Repository Service for managing process definitions and deployments.
---

# Repository Service - Process Definition Management

**Module:** `activiti-core/activiti-engine`

**Target Audience:** Senior Software Engineers, BPMN Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Deployments](#deployments)
- [Process Definitions](#process-definitions)
- [Resource Management](#resource-management)
- [Deployment Strategies](#deployment-strategies)
- [Version Management](#version-management)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

The **RepositoryService** manages all artifacts stored in the engine's repository, including process definitions, deployments, and associated resources. It's the entry point for deploying BPMN processes and managing their lifecycle.

### Key Responsibilities

- Deploy process definitions and resources
- Manage deployment lifecycle
- Query and retrieve process definitions
- Handle versioning and updates
- Manage process definition metadata
- Support multiple resource types (BPMN, forms, images)

### Core Concepts

```
Deployment
    ├── Process Definition (v1)
    ├── Process Definition (v2)
    ├── BPMN XML
    ├── Process Image
    └── Form Definitions
```

---

## Deployments

### Creating Deployments

```java
@Service
public class DeploymentService {
    
    @Autowired
    private RepositoryService repositoryService;
    
    public Deployment deployFromClasspath(String resourcePath) {
        return repositoryService.createDeployment()
            .addClasspathResource(resourcePath)
            .deploy();
    }
    
    public Deployment deployFromInputStream(InputStream bpmnStream) {
        return repositoryService.createDeployment()
            .addInputStream("process.bpmn", bpmnStream)
            .deploy();
    }
    
    public Deployment deployFromByteArray(byte[] bpmnBytes) {
        return repositoryService.createDeployment()
            .addBytes("process.bpmn", bpmnBytes)
            .deploy();
    }
}
```

### Deployment Builder Pattern

```java
Deployment deployment = repositoryService.createDeployment()
    .name("Order Process Deployment")
    .category("order-management")
    .addClasspathResource("processes/order-process.bpmn")
    .addClasspathResource("processes/order-form.html")
    .addClasspathResource("images/order-diagram.png")
    .addString("metadata.json", "{\"version\": \"1.0\"}")
    .deploy();
```

### Multi-Resource Deployment

```java
public Deployment deployProcessWithResources(String processKey) {
    return repositoryService.createDeployment()
        .name(processKey + " Deployment")
        .addClasspathResource("processes/" + processKey + ".bpmn")
        .addClasspathResource("forms/" + processKey + ".form.html")
        .addClasspathResource("images/" + processKey + ".png")
        .addClasspathResource("validation/" + processKey + ".rules.xml")
        .deploy();
}
```

### Deployment from External Source

```java
public Deployment deployFromUrl(URL processUrl) throws IOException {
    try (InputStream is = processUrl.openStream()) {
        return repositoryService.createDeployment()
            .addInputStream(processUrl.getPath(), is)
            .deploy();
    }
}

public Deployment deployFromGit(String gitUrl, String branch) {
    // Clone repository
    File repo = gitClone(gitUrl, branch);
    
    // Deploy all BPMN files
    List<File> bpmnFiles = findBpmnFiles(repo);
    
    DeploymentBuilder builder = repositoryService.createDeployment()
        .name("Git Deployment: " + branch);
    
    for (File bpmnFile : bpmnFiles) {
        builder.addFile(bpmnFile);
    }
    
    return builder.deploy();
}
```

---

## Process Definitions

### Querying Process Definitions

```java
// Get all process definitions
List<ProcessDefinition> allProcesses = repositoryService
    .createProcessDefinitionQuery()
    .list();

// Get latest version by key
ProcessDefinition latest = repositoryService
    .createProcessDefinitionQuery()
    .processDefinitionKey("orderProcess")
    .latestVersion()
    .singleResult();

// Get specific version
ProcessDefinition v2 = repositoryService
    .createProcessDefinitionQuery()
    .processDefinitionKey("orderProcess")
    .processDefinitionVersion(2)
    .singleResult();

// Filter by category
List<ProcessDefinition> orderProcesses = repositoryService
    .createProcessDefinitionQuery()
    .processDefinitionCategory("order-management")
    .list();

// Active process definitions only
List<ProcessDefinition> active = repositoryService
    .createProcessDefinitionQuery()
    .active()
    .list();
```

### Advanced Queries

```java
// Multiple criteria
ProcessDefinition process = repositoryService
    .createProcessDefinitionQuery()
    .processDefinitionKey("orderProcess")
    .processDefinitionNameLike("%Order%")
    .processDefinitionCategory("sales")
    .deploymentId("deployment-123")
    .latestVersion()
    .orderByProcessDefinitionVersion()
    .desc()
    .singleResult();

// Pagination
List<ProcessDefinition> page = repositoryService
    .createProcessDefinitionQuery()
    .processDefinitionKey("orderProcess")
    .listPage(0, 10);

// Count
long count = repositoryService
    .createProcessDefinitionQuery()
    .processDefinitionKey("orderProcess")
    .count();
```

### Process Definition Metadata

```java
public class ProcessDefinitionInfo {
    
    @Autowired
    private RepositoryService repositoryService;
    
    public void displayProcessInfo(String processKey) {
        ProcessDefinition processDef = repositoryService
            .createProcessDefinitionQuery()
            .processDefinitionKey(processKey)
            .latestVersion()
            .singleResult();
        
        System.out.println("ID: " + processDef.getId());
        System.out.println("Key: " + processDef.getKey());
        System.out.println("Name: " + processDef.getName());
        System.out.println("Version: " + processDef.getVersion());
        System.out.println("Category: " + processDef.getCategory());
        System.out.println("Deployment ID: " + processDef.getDeploymentId());
        System.out.println("Resource Name: " + processDef.getResourceName());
        System.out.println("Diagram XML: " + processDef.getDiagramXML() != null);
        System.out.println("Startable by User: " + processDef.isStartableByUser());
    }
}
```

### Retrieving Process Resources

```java
// Get BPMN XML
String bpmnXml = repositoryService
    .getProcessDefinitionXML(processDefinition.getId());

// Get diagram XML
String diagramXml = repositoryService
    .getProcessDefinitionDiagramXML(processDefinition.getId());

// Get deployment resources
List<String> resourceNames = repositoryService
    .getDeploymentResourceNames(deploymentId);

for (String resourceName : resourceNames) {
    InputStream resource = repositoryService
        .getDeploymentResourceAsStream(deploymentId, resourceName);
    
    // Process resource...
}
```

---

## Resource Management

### Supported Resource Types

```java
// BPMN 2.0 processes
.addClasspathResource("process/order.bpmn")

// Form definitions
.addClasspathResource("form/order-form.html")

// Process diagrams
.addClasspathResource("images/order.png")

// Business rule files
.addClasspathResource("rules/order-drl.drl")

// Custom metadata
.addString("metadata.json", jsonContent)

// Any binary resource
.addBytes("custom.dat", byteArray)
```

### Resource Categories

```java
// Set resource category for organization
repositoryService.createDeployment()
    .name("Order Process")
    .category("order-management")
    .addClasspathResource("processes/order.bpmn")
    .deploy();
```

---

## Deployment Strategies

### Blue-Green Deployment

```java
public class BlueGreenDeployment {
    
    @Autowired
    private RepositoryService repositoryService;
    
    public void deployVersion(String processKey, String version) {
        // Deploy new version (gets auto-incremented version number)
        Deployment newDeployment = repositoryService.createDeployment()
            .name(processKey + "-v" + version)
            .category(processKey)
            .addClasspathResource("processes/" + processKey + "-v" + version + ".bpmn")
            .deploy();
        
        // Update process routing to use new version
        updateProcessRouting(processKey, newDeployment.getProcessDefinitions().get(0));
    }
}
```

### Canary Deployment

```java
public class CanaryDeployment {
    
    @Autowired
    private RepositoryService repositoryService;
    
    @Autowired
    private RuntimeService runtimeService;
    
    public void deployCanary(String processKey, double canaryPercentage) {
        // Deploy canary version
        Deployment canaryDeployment = repositoryService.createDeployment()
            .name(processKey + "-canary")
            .addClasspathResource("processes/" + processKey + "-canary.bpmn")
            .deploy();
        
        ProcessDefinition canaryProcess = canaryDeployment.getProcessDefinitions().get(0);
        
        // Route canary percentage to new version
        // Remaining traffic goes to stable version
        configureTrafficRouting(processKey, canaryProcess, canaryPercentage);
    }
}
```

### Feature Flag Deployment

```java
public class FeatureFlagDeployment {
    
    @Autowired
    private RepositoryService repositoryService;
    
    public void deployWithFeatureFlag(String processKey, String featureFlag) {
        // Deploy both versions
        Deployment stableDeployment = repositoryService.createDeployment()
            .name(processKey + "-stable")
            .addClasspathResource("processes/" + processKey + "-stable.bpmn")
            .deploy();
        
        Deployment featureDeployment = repositoryService.createDeployment()
            .name(processKey + "-feature")
            .addClasspathResource("processes/" + processKey + "-feature.bpmn")
            .deploy();
        
        // Use feature flag to route
        ProcessDefinition processDef = FeatureFlagEvaluator.evaluate(featureFlag)
            ? featureDeployment.getProcessDefinitions().get(0)
            : stableDeployment.getProcessDefinitions().get(0);
        
        return processDef.getKey();
    }
}
```

---

## Version Management

### Automatic Versioning

```java
// Each deployment of same process key auto-increments version
Deployment v1 = repositoryService.createDeployment()
    .addClasspathResource("processes/order.bpmn")
    .deploy(); // Version 1

Deployment v2 = repositoryService.createDeployment()
    .addClasspathResource("processes/order.bpmn")
    .deploy(); // Version 2 (auto-incremented)
```

### Version Control

```java
public class VersionManager {
    
    @Autowired
    private RepositoryService repositoryService;
    
    public void deployVersionedProcess(String key, int version, InputStream bpmn) {
        repositoryService.createDeployment()
            .name(key + "-v" + version)
            .category(key)
            .addInputStream(key + "-v" + version + ".bpmn", bpmn)
            .deploy();
    }
    
    public ProcessDefinition getVersion(String key, int version) {
        return repositoryService.createProcessDefinitionQuery()
            .processDefinitionKey(key)
            .processDefinitionVersion(version)
            .singleResult();
    }
    
    public List<ProcessDefinition> getAllVersions(String key) {
        return repositoryService.createProcessDefinitionQuery()
            .processDefinitionKey(key)
            .orderByProcessDefinitionVersion()
            .asc()
            .list();
    }
}
```

### Deprecating Versions

```java
public class VersionDeprecator {
    
    @Autowired
    private RepositoryService repositoryService;
    
    public void deprecateVersion(String key, int version) {
        ProcessDefinition processDef = repositoryService
            .createProcessDefinitionQuery()
            .processDefinitionKey(key)
            .processDefinitionVersion(version)
            .singleResult();
        
        // Suspend the process definition
        repositoryService.suspendProcessDefinitionById(processDef.getId());
        
        // Optionally delete after grace period
        scheduleDeletion(processDef.getId(), 30, DAYS);
    }
    
    public void activateVersion(String key, int version) {
        ProcessDefinition processDef = repositoryService
            .createProcessDefinitionQuery()
            .processDefinitionKey(key)
            .processDefinitionVersion(version)
            .singleResult();
        
        repositoryService.activateProcessDefinitionById(processDef.getId());
    }
}
```

---

## API Reference

### RepositoryService Methods

```java
// Deployments
Deployment createDeployment();
Deployment createDeployment(String name);
void deleteDeployment(String deploymentId);
void deleteDeployments(String... deploymentIds);
Deployment getDeployment(String deploymentId);
List<Deployment> createDeploymentQuery().list();

// Process Definitions
ProcessDefinition getProcessDefinition(String id);
String getProcessDefinitionXML(String id);
String getProcessDefinitionDiagramXML(String id);
void deleteProcessDefinition(String processDefinitionId);
void suspendProcessDefinitionById(String id);
void activateProcessDefinitionById(String id);

// Resources
List<String> getDeploymentResourceNames(String deploymentId);
InputStream getDeploymentResourceAsStream(String deploymentId, String resourceName);

// Queries
ProcessDefinitionQuery createProcessDefinitionQuery();
DeploymentQuery createDeploymentQuery();
```

### ProcessDefinitionQuery

```java
ProcessDefinitionQuery createProcessDefinitionQuery();

// Filtering
.processDefinitionId(String id)
.processDefinitionKey(String key)
.processDefinitionKeyLike(String key)
.processDefinitionName(String name)
.processDefinitionNameLike(String name)
.processDefinitionVersion(int version)
.processDefinitionCategory(String category)
.deploymentId(String deploymentId)
.tenantIdIn(List<String> tenantIds)
.active()
.suspended()

// Ordering
.orderByProcessDefinitionId()
.orderByProcessDefinitionKey()
.orderByProcessDefinitionName()
.orderByProcessDefinitionVersion()
.orderByDeploymentId()
.asc()
.desc()

// Pagination
.listPage(int firstResult, int maxResults)
```

---

## Usage Examples

### Complete Deployment Example

```java
@Service
public class ProcessDeploymentService {
    
    @Autowired
    private RepositoryService repositoryService;
    
    public Deployment deployOrderProcess() {
        // Create deployment
        Deployment deployment = repositoryService.createDeployment()
            .name("Order Management Process")
            .category("order-management")
            .addClasspathResource("processes/order-process.bpmn")
            .addClasspathResource("forms/order-form.html")
            .addClasspathResource("images/order-process.png")
            .deploy();
        
        log.info("Deployed process with ID: {}", deployment.getId());
        
        // Get deployed process definitions
        List<ProcessDefinition> processDefinitions = deployment.getProcessDefinitions();
        
        for (ProcessDefinition pd : processDefinitions) {
            log.info("Process: {} v{} - {}", 
                pd.getKey(), pd.getVersion(), pd.getName());
        }
        
        return deployment;
    }
    
    public void undeployOrderProcess(String deploymentId) {
        // Delete deployment
        repositoryService.deleteDeployment(deploymentId);
        log.info("Undeployed process: {}", deploymentId);
    }
}
```

### Process Definition Factory

```java
@Component
public class ProcessDefinitionFactory {
    
    @Autowired
    private RepositoryService repositoryService;
    
    public ProcessDefinition getLatestProcessDefinition(String key) {
        return repositoryService.createProcessDefinitionQuery()
            .processDefinitionKey(key)
            .latestVersion()
            .active()
            .singleResult();
    }
    
    public ProcessDefinition getProcessDefinition(String key, int version) {
        return repositoryService.createProcessDefinitionQuery()
            .processDefinitionKey(key)
            .processDefinitionVersion(version)
            .singleResult();
    }
    
    public List<ProcessDefinition> getAllActiveProcessDefinitions() {
        return repositoryService.createProcessDefinitionQuery()
            .active()
            .list();
    }
}
```

---

## Best Practices

### 1. Use Meaningful Names

```java
// GOOD
repositoryService.createDeployment()
    .name("Order Approval Process v2.1")
    .category("order-management")
    .deploy();

// BAD
repositoryService.createDeployment()
    .name("proc1")
    .deploy();
```

### 2. Organize by Category

```java
// Group related processes
.category("order-management")
.category("hr-workflows")
.category("finance-approvals")
```

### 3. Version Control Deployments

```java
// Track versions explicitly
.name("OrderProcess-v" + version)
.addString("version-info.json", "{\"version\": \"" + version + "\"}")
```

### 4. Include All Resources

```java
// Deploy complete package
.addClasspathResource("process/order.bpmn")
.addClasspathResource("form/order.html")
.addClasspathResource("image/order.png")
.addClasspathResource("validation/order-rules.xml")
```

### 5. Handle Deployment Errors

```java
try {
    repositoryService.createDeployment()
        .addClasspathResource("process.bpmn")
        .deploy();
} catch (ActivitiException e) {
    log.error("Deployment failed", e);
    // Rollback or notify
}
```

---

## See Also

- [Parent Documentation](README.md)
- [Runtime Service](runtime-service.md)
- [Task Service](task-service.md)
- [Best Practices](../best-practices/overview.md)
