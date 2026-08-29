---
slug: /changelog/next
title: "9.1.0 (unreleased)"
sidebar_label: "9.1.0 (unreleased)"
description: "Changes currently staged on the Activiti develop branch for the next release (9.1.0), including Spring Boot 4.0 and Jackson 3 upgrades."
---

# Version 9.1.0 (unreleased)

The changes below are currently staged on the `develop` branch for the next release, version `9.1.0`. This page is a point-in-time snapshot — **last checked at commit `5ad1c6de45` (2026-08-27)** — and the final release content may differ.

## Breaking Changes & Mitigations

- **Spring Boot 4.0 baseline** — the platform moves from Spring Boot 3.5 to the 4.0.x line (currently 4.0.7), which brings Tomcat 11 (pinned to 11.0.22). **Mitigation:** Spring Boot 4 is a major framework upgrade — review the Spring Boot 3 to 4 migration guide, align your own dependencies, and run a full test pass before upgrading.
- **Jackson 3 for JSON variables** — the `tools.jackson` (Jackson 3) BOM is introduced and existing JSON variables are updated to reference Jackson 3 types. **Mitigation:** if your application code reads or writes process JSON variables directly, make sure it is compatible with the Jackson 3 type system.
- **Database schema changes** — PostgreSQL id columns move from `serial` to `bigserial`, task queries use explicit columns to avoid cached-plan errors during rolling deployments, and the `ACT_RU_IDENTITYLINK` index creation was corrected; an invalid `column` keyword was removed from the Oracle script. **Mitigation:** apply the standard upgrade procedure; the schema scripts ship with the engine, but validate upgrades on a staging database first.
- **Exclusive gateway validation is configurable** — gateway outgoing flows with missing conditions are now reported with configurable error/warning behavior instead of a fixed severity. **Mitigation:** review validation configuration if your deployments previously failed (or were blocked) on missing gateway conditions.

## New Features

- **`setVariablesTask` service task** — a new service task that assigns the process extension input mappings as process variables, supporting literal values, EL expressions, and copies of other variables:

  ```xml
  <serviceTask id="setVarsTask" implementation="set-variables.EXECUTE"/>
  ```

  ```json
  {
    "mappings": {
      "setVarsTask": {
        "inputs": {
          "fullName": { "type": "value", "value": "${firstName} ${lastName}" },
          "copiedName": { "type": "variable", "value": "firstName" },
          "doubledAge": { "type": "value", "value": "${age * 2}" }
        }
      }
    }
  }
  ```

- **`nextTask` API** — `TaskRuntime.nextTask(TaskIdentificationStrategy)` returns the next available task for the authenticated user, claiming it before returning (strategy `CLAIM_BEFORE_OPEN_OLDEST_FIRST` checks assigned tasks first, then tries to claim candidates).
- **Task list sorting** — task queries accept an `Order` in the `Pageable` (currently by `createdDate`), enabling sorted task lists.
- **Multi-instance call activity variable mapping** — output mapping for multi-instance call activities, plus category-based automatic mapping of element variables (which also fixes collection element variables leaking into the result collection).
- **Idempotent self-claim** — claiming a task that the current user already holds no longer fails.
- **Runtime additions** — linked process instance id and type exposed in `ProcessAdminRuntime` results, `commandId` included in engine events, process instance id set on task candidate audit events, and querying support for `IntegrationContext`.
- **Process definition lookup by exact id** — `ProcessAdminRuntime.processDefinition(...)` now resolves an exact process definition id (any version) before falling back to the key-based lookup on the latest deployment.

## Bug Fixes

- Null variable validation fix (AAE-49428) and null check in the `IntegrationContextImpl` copy constructor (AAE-47842).
- Deletion of process instances with duplicate variables no longer fails (AAE-38661).
- Enhanced exception messaging when a gateway condition evaluation fails (AAE-41937).
- Sorted flush order to prevent deadlocks (AAE-42043).
- Corrected index creation for `ACT_RU_IDENTITYLINK` (AAE-48490).

## Use Cases

### Picking up the next task in a worklist

`nextTask` removes the need to query, filter, and manually claim tasks when a worker simply wants "whatever is next for me":

```java
import org.activiti.api.task.model.Task;
import org.activiti.api.task.runtime.TaskIdentificationStrategy;
import org.activiti.api.task.runtime.TaskRuntime;

Task task = taskRuntime.nextTask(TaskIdentificationStrategy.CLAIM_BEFORE_OPEN_OLDEST_FIRST);
```

The strategy checks the user's assigned tasks first (oldest first), then inspects candidate tasks and attempts to claim them, skipping tasks that were claimed by someone else in the meantime. Use this for claim-based worklists instead of `tasks(...)` + `claim(...)`.

### Sorted task lists

Task queries now accept an order, so worklists can be rendered oldest-first or newest-first without post-processing:

```java
import org.activiti.api.runtime.shared.query.Order;
import org.activiti.api.runtime.shared.query.Pageable;
import org.activiti.api.task.model.payloads.GetTasksPayload;
import org.activiti.api.task.runtime.TaskRuntime;

Pageable pageable = Pageable.of(0, 50, Order.by("createdDate", Order.Direction.ASC));
var oldestFirst = taskRuntime.tasks(pageable, new GetTasksPayload());
```

### Correlating events from a single command with `commandId`

Every engine event now carries a `commandId` — a stable identifier that groups all events produced within the same engine command (one `CommandContext` / transaction). All events fired during a single API call such as `startProcessInstanceByKey` share the same id; events fired outside a command context (for example during engine startup) have `null`. Use it to correlate event streams in logs and traces, or to deduplicate and batch events per command:

```java
import org.activiti.engine.RuntimeService;
import org.activiti.engine.delegate.event.ActivitiEvent;
import org.activiti.engine.delegate.event.ActivitiEventListener;

runtimeService.addEventListener(new ActivitiEventListener() {
    @Override
    public void onEvent(ActivitiEvent event) {
        System.out.printf("type=%s commandId=%s%n", event.getType(), event.getCommandId());
    }

    @Override
    public boolean isFailOnException() {
        return false;
    }
});
```

Note that `commandId` is exposed on the engine-level `ActivitiEvent`, so subscribe with `RuntimeService.addEventListener(...)` (the `RuntimeService` bean) rather than on the converted `BPMN*Event` payloads.

### Linking a started process to a related instance

Starting a process now records a reference to a related (for example parent) process instance. When one process spawns another — an order process starting a fulfillment process, say — record the relationship at start time so the two instances can be correlated later:

```java
import org.activiti.api.process.model.ProcessInstance;
import org.activiti.api.process.model.builders.StartProcessPayloadBuilder;
import org.activiti.api.process.runtime.ProcessRuntime;

ProcessInstance fulfillment = processRuntime.start(
    new StartProcessPayloadBuilder()
        .withProcessDefinitionKey("fulfillment-process")
        .withLinkedProcessInstanceId(orderInstanceId)
        .withLinkedProcessInstanceType("order")
        .build()
);
```

The linked id and type set on the payload are propagated onto the engine process instance by `ProcessRuntime.start(StartProcessPayload)`. Note that the values are recorded on the engine-side instance; the public `ProcessInstance` result model does not yet expose getters for them.

### Correlating task candidate changes to a process instance

Task candidate user/group added/removed events now carry `processInstanceId` (and `processDefinitionId`), so audit and monitoring listeners can attribute candidate changes to a specific instance without a database lookup:

```java
import org.activiti.api.task.runtime.events.TaskCandidateUserAddedEvent;
import org.activiti.api.task.runtime.events.listener.TaskRuntimeEventListener;
import org.springframework.stereotype.Component;

@Component
public class CandidateAuditListener implements TaskRuntimeEventListener<TaskCandidateUserAddedEvent> {

    @Override
    public void onEvent(TaskCandidateUserAddedEvent event) {
        System.out.printf("process=%s task=%s user=%s%n",
            event.getProcessInstanceId(), event.getEntity().getTaskId(), event.getEntity().getUserId());
    }
}
```

## Related Links

- [GitHub repository](https://github.com/Activiti/Activiti)
- [Previous release: 9.0.0](./v9-0-0.md)
