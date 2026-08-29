---
sidebar_label: Spring Auto-Deployment Modes
slug: /advanced/auto-deployment-modes
title: "Spring Auto-Deployment Modes"
description: "How to control BPMN resource deployment strategy in Spring Boot with different auto-deployment modes."
---

# Spring Auto-Deployment Modes

When using the Activiti Spring Boot starter, BPMN resources discovered on the classpath are automatically deployed at application startup. The `deploymentMode` property controls **how** resources are grouped into deployments, which directly affects versioning, activation behavior, and failure handling.

## Configuration

```yaml
# application.yml
spring:
  activiti:
    deployment-mode: "default"
```

```java
// Or programmatically via ProcessEngineConfigurationConfigurer
@Bean
public ProcessEngineConfigurationConfigurer deploymentConfigurer() {
    return config -> config.setDeploymentMode("single-resource");
}
```

## Available Modes

### `default` (Single Deployment)

All discovered resources are grouped into **one deployment**. This is the simplest mode and matches legacy behavior.

- One deployment containing all BPMN files
- Duplicate filtering enabled — unchanged resources won't create a new version
- If any resource fails validation, the entire deployment fails and the application won't start

**Use when:** You want all processes versioned together and deployed atomically.

### `single-resource` (One per File)

Each BPMN resource is deployed in its **own separate deployment**.

- One deployment per `.bpmn` / `.bpmn20.xml` file
- Duplicate filtering per file — only changed files bump versions
- Independent versioning — modifying one process doesn't affect others

**Use when:** You frequently update individual processes and want granular version control.

### `resource-parent-folder` (Group by Directory)

Resources are grouped by their **parent folder** into separate deployments.

- One deployment per distinct parent directory
- Deployment names prefixed with the `deploymentName` hint
- Invalid resources in a folder only affect that folder's deployment

**Use when:** You organize processes by domain or module and want deployment boundaries to match.

### `never-fail` (Best-Effort)

Invalid resources are **skipped** — the application always starts.

- Validates each resource before adding to deployment
- Invalid resources are logged and excluded (not thrown)
- Only valid resources are included; if none are valid, no deployment is created
- Duplicate filtering enabled

**Use when:** You have optional process definitions (e.g., different environments, profiles) and don't want a missing file to prevent startup.

### `fail-on-no-process` (Strict Validation)

Similar to `never-fail` but **throws an exception** if zero valid processes are deployed.

- Validates and skips invalid resources (same as `never-fail`)
- Fails startup if no valid process definitions are found
- Prevents silent failures where the engine starts with nothing to run

**Use when:** Processes are mandatory — the application should fail fast if none are available.

### `none` (No Auto-Deployment)

:::info[Added in 8.8.0]
The `none` deployment mode was added in version 8.8.0. It disables automatic deployment entirely — no BPMN resources are auto-deployed at startup.
:::

No resources are deployed automatically. You must deploy processes explicitly via the `RepositoryService` or the `ProcessRuntime` API.

**Use when:** You manage deployments entirely through an external system or API and do not want the engine to auto-deploy classpath resources.

### Disabling Start Event Subscriptions from Previous Deployments

:::info[Added in 8.8.0]
The `spring.activiti.disable-existing-start-event-subscriptions` property (default: `false`) was added in version 8.8.0. When set to `true`, deploying a new version of a process definition disables the start event subscriptions of the previous version, preventing accidental triggering of superseded versions.
:::

```yaml
# application.yml
spring:
  activiti:
    disable-existing-start-event-subscriptions: true
```

> **Note:** This is an opt-in behavior (off by default). Enable it when deploying a new version of a process should immediately stop the old version from reacting to start events.

## Mode Comparison

| Mode | Deployment Count | Invalid Resources | Version Control |
|------|-----------------|-------------------|-----------------|
| `default` | 1 | Fails startup | All-or-nothing |
| `single-resource` | 1 per file | Fails startup | Per file |
| `resource-parent-folder` | 1 per folder | Fails startup | Per folder |
| `never-fail` | 1 (if valid exist) | Skipped + logged | All-or-nothing |
| `fail-on-no-process` | 1 (if valid exist) | Skipped + logged | All-or-nothing |
| `none` *(8.8.0+)* | 0 | N/A | N/A |

```mermaid
graph TD
    subgraph Strict["Strict Modes (fail on invalid)"]
        SM1["default: all resources → 1 deployment"]
        SM2["single-resource: 1 file → 1 deployment"]
        SM3["resource-parent-folder: 1 folder → 1 deployment"]
    end
    subgraph Lenient["Lenient Modes (skip invalid)"]
        LM1["never-fail: skips invalid, deploys valid"]
        LM2["fail-on-no-process: skips invalid, fails if none valid"]
    end
```

## How Duplicate Filtering Works

All auto-deployment modes enable duplicate filtering by default. This prevents unnecessary version bumps on every restart:

```mermaid
flowchart TD
    A["Application starts"] --> B["Compare each resource to previously deployed"]
    B --> C{"Any resource changed?"}
    C -->|"No"| D["No new deployment created"]
    C -->|"Yes"| E["New deployment version created"]
```

## Custom Deployment Strategies

You can implement your own deployment strategy by extending `AbstractAutoDeploymentStrategy`:

```java
public class CustomDeploymentStrategy extends AbstractAutoDeploymentStrategy {

    public static final String DEPLOYMENT_MODE = "custom";

    public CustomDeploymentStrategy(ApplicationUpgradeContextService service) {
        super(service);
    }

    @Override
    protected String getDeploymentMode() {
        return DEPLOYMENT_MODE;
    }

    @Override
    public void deployResources(String nameHint, Resource[] resources,
            RepositoryService repositoryService) {
        // Custom grouping, validation, or deployment logic
    }
}
```

Register it by overriding `getAutoDeploymentStrategy` in a custom `SpringProcessEngineConfiguration`:

```java
public class CustomSpringProcessEngineConfiguration extends SpringProcessEngineConfiguration {

    private final Map<String, AutoDeploymentStrategy> customStrategies = new HashMap<>();

    public CustomSpringProcessEngineConfiguration(ApplicationUpgradeContextService service) {
        customStrategies.put("custom", new CustomDeploymentStrategy(service));
    }

    @Override
    protected AutoDeploymentStrategy getAutoDeploymentStrategy(String mode) {
        AutoDeploymentStrategy strategy = customStrategies.get(mode);
        return strategy != null ? strategy : super.getAutoDeploymentStrategy(mode);
    }
}
```

Then set `deploymentMode` to `"custom"` on the configuration.

## Resource Discovery

Resources are discovered via `ResourceFinder` using Spring Boot properties for location prefix and suffixes:

```yaml
spring:
  activiti:
    process-definition-location-prefix: "classpath*:**/processes/"
    process-definition-location-suffixes:
      - "**.bpmn"
      - "**.bpmn20.xml"
```

For custom resource discovery, define `ResourceFinderDescriptor` beans programmatically. `ResourceFinderDescriptor` is an interface — there is no `getResources()` method; instead it declares where the finder looks (`getLocationPrefix`/`getLocationSuffixes`), whether to look up at all (`shouldLookUpResources`), how to validate what was found, and the log messages to use:

```java
@Bean
public ResourceFinderDescriptor customResourceFinder() {
    return new ResourceFinderDescriptor() {
        @Override
        public String getLocationPrefix() {
            return "classpath*:**/custom-processes/";
        }

        @Override
        public List<String> getLocationSuffixes() {
            return List.of("**.bpmn", "**.bpmn20.xml");
        }

        @Override
        public boolean shouldLookUpResources() {
            return true;
        }

        @Override
        public void validate(List<Resource> resources) {
            // Validate discovered resources here
        }

        @Override
        public String getMsgForEmptyResources() {
            return "No custom process definitions were found for auto-deployment";
        }

        @Override
        public String getMsgForResourcesFound(List<String> foundResources) {
            return "The following custom process definition files will be deployed: " + foundResources;
        }
    };
}
```

The deployment mode then groups these discovered resources into deployments according to the selected strategy.

## Related Documentation

- [Configuration](../configuration.md) — Engine configuration overview
- [Advanced Deployment Builder](./deployment-builder.md) — Manual deployment API
