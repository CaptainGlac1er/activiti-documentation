---
sidebar_label: Spring App Process
slug: /api-reference/engine-api/spring-app-process
description: Process entry discovery and deployment for the Activiti application framework.
---

# activiti-spring-app-process

**Module:** `activiti-core/activiti-spring-app-process`

This module provides process-specific implementations of the application entry discovery and deployment SPI defined by `activiti-spring-application`. It enables the Activiti application framework to recognize and deploy BPMN process definitions from application archives.

The module contains three classes:

| Class | Package | Role |
|---|---|---|
| `ApplicationProcessAutoConfiguration` | `org.activiti.application.conf` | Spring Boot auto-configuration |
| `ProcessEntryDiscovery` | `org.activiti.application.discovery` | Discovers process entries in application archives |
| `ProcessEntryDeployer` | `org.activiti.application.deployer` | Deploys discovered processes to the engine |

---

## SPI Overview

The parent module `activiti-spring-application` defines two interfaces that form a plugin SPI:

### `ApplicationEntryDiscovery`

```java
public interface ApplicationEntryDiscovery {
    Predicate<ZipEntry> filter(ZipEntry entry);
    String getEntryType();
}
```

A discovery implementation provides a filter that selects relevant `ZipEntry` objects from an application archive, and declares an entry type string that categorizes the matched entries.

### `ApplicationEntryDeployer`

```java
public interface ApplicationEntryDeployer {
    void deployEntries(ApplicationContent application);
}
```

A deployer receives an `ApplicationContent` — which maps entry types to lists of `FileContent` objects — and deploys the entries of the type it handles.

Both interfaces are resolved through Spring's dependency injection: all beans of type `ApplicationEntryDiscovery` are wired into `ApplicationReader`, and all beans of type `ApplicationEntryDeployer` are wired into `ApplicationDeployer`.

---

## ProcessEntryDiscovery

**Package:** `org.activiti.application.discovery`

Implements `ApplicationEntryDiscovery` to identify process definition files within application archives.

```java
public class ProcessEntryDiscovery implements ApplicationEntryDiscovery {

    public static final String PROCESSES = "processes";

    @Override
    public Predicate<ZipEntry> filter(ZipEntry entry) {
        return zipEntry -> !zipEntry.isDirectory() && zipEntry.getName().contains(PROCESSES);
    }

    @Override
    public String getEntryType() {
        return PROCESSES;
    }
}
```

- Declares the entry type constant `"processes"`.
- The filter selects any non-directory `ZipEntry` whose name contains the substring `processes`.
- Matched entries are grouped under the `"processes"` type key in the resulting `ApplicationContent`.

---

## ProcessEntryDeployer

**Package:** `org.activiti.application.deployer`

Implements `ApplicationEntryDeployer` to deploy process files to the Activiti repository.

```java
public class ProcessEntryDeployer implements ApplicationEntryDeployer {

    private RepositoryService repositoryService;

    public ProcessEntryDeployer(RepositoryService repositoryService) {
        this.repositoryService = repositoryService;
    }

    @Override
    public void deployEntries(ApplicationContent application) {
        List<FileContent> processContents = application.getFileContents(ProcessEntryDiscovery.PROCESSES);
        DeploymentBuilder deploymentBuilder = repositoryService.createDeployment()
            .enableDuplicateFiltering()
            .name("ApplicationAutoDeployment");
        for (FileContent processContent : processContents) {
            deploymentBuilder.addBytes(processContent.getName(), processContent.getContent());
        }
        deploymentBuilder.deploy();
    }
}
```

- Injected with `RepositoryService` via its constructor.
- Retrieves all `FileContent` entries of type `"processes"` from the `ApplicationContent`.
- Creates a single deployment named `"ApplicationAutoDeployment"` with duplicate filtering enabled.
- Adds each process file as a byte array to the deployment builder, then deploys.

---

## ApplicationProcessAutoConfiguration

**Package:** `org.activiti.application.conf`

Spring Boot auto-configuration that registers the process discovery and deployer beans.

```java
@AutoConfiguration
public class ApplicationProcessAutoConfiguration {

    @Bean
    public ApplicationEntryDiscovery processEntryDiscovery() {
        return new ProcessEntryDiscovery();
    }

    @Bean
    public ApplicationEntryDeployer processEntryDeployer(RepositoryService repositoryService) {
        return new ProcessEntryDeployer(repositoryService);
    }
}
```

- Exposes `ProcessEntryDiscovery` as a bean of type `ApplicationEntryDiscovery`, so it is picked up by the `ApplicationReader` in the parent module.
- Exposes `ProcessEntryDeployer` as a bean of type `ApplicationEntryDeployer`, so it is picked up by the `ApplicationDeployer` in the parent module. The deployer requires `RepositoryService` (injected by Spring from the existing process engine beans).

---

## How It Fits Together

The deployment flow across modules:

1. `ApplicationService` (in `activiti-spring-application`) locates application archive files on the classpath and delegates reading to `ApplicationReader`.
2. `ApplicationReader` iterates over every `ApplicationEntryDiscovery` bean. `ProcessEntryDiscovery` filters entries whose names contain `"processes"`.
3. Matched entries are stored in `ApplicationContent` under the `"processes"` type key.
4. `ApplicationDeployer` iterates over every `ApplicationEntryDeployer` bean. `ProcessEntryDeployer` retrieves the `"processes"` entries and deploys them as a single Activiti deployment with duplicate filtering enabled.

This design allows other modules (e.g., form or model support) to plug in their own discovery and deployer implementations without modifying the core application framework.
