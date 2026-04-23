---
sidebar_label: Spring Conformance Tests
slug: /api-reference/engine-api/spring-conformance-tests
title: "Spring Conformance Tests"
description: "Overview of the activiti-spring-conformance-tests multi-module test suite — shared utilities, conformance sets, and what each submodule validates."
---

# Spring Conformance Tests

`activiti-spring-conformance-tests` is a **multi-module Maven aggregator** under `activiti-core/` that contains integration tests validating the Activiti Spring API against BPMN conformance scenarios. It is not a production library — it is a test suite used during development and CI to verify correct behavior of `ProcessRuntime`, `TaskRuntime`, and related APIs under Spring Boot.

## Module Layout

```
activiti-spring-conformance-tests/          (parent POM, aggregator)
├── activiti-spring-conformance-util/       (shared test infrastructure)
├── activiti-spring-conformance-set0/       (basic process & task runtime)
├── activiti-spring-conformance-set1/       (service tasks)
├── activiti-spring-conformance-set2/       (user task assignments)
├── activiti-spring-conformance-set3/       (user task candidates)
├── activiti-spring-conformance-set4/       (gateways)
├── activiti-spring-conformance-set5/       (call activities)
├── activiti-spring-conformance-variables/  (process & task variables)
└── activiti-spring-conformance-signals/    (signal events)
```

The parent POM sets `<packaging>pom</packaging>` and declares all submodules. Deployment is skipped (`maven.deploy.skip=true`).

## Shared Infrastructure — `activiti-spring-conformance-util`

This submodule provides the common test configuration used by every conformance set.

### `RuntimeTestConfiguration`

An `@AutoConfiguration` / `@TestConfiguration` class that produces the following beans:

- **`SecurityUtil`** — wraps login/logout for test users.
- **`UserDetailsService`** — in-memory user store with five preconfigured users:
  | Username | Roles / Groups |
  |----------|---------------|
  | `user1` | `ROLE_ACTIVITI_USER`, `GROUP_group1` |
  | `user2` | `ROLE_ACTIVITI_USER`, `GROUP_group2` |
  | `user3` | `ROLE_ACTIVITI_USER`, `GROUP_group1`, `GROUP_group2` |
  | `user4` | `ROLE_ACTIVITI_USER` |
  | `admin` | `ROLE_ACTIVITI_ADMIN` |

- **Event listeners** — one bean per runtime event type that appends every event to a static `List<RuntimeEvent> collectedEvents`. The full list of registered listeners:

  | Bean Method | Event Type |
  |-------------|------------|
  | `bpmnActivityStartedListener` | `BPMNActivityStartedEvent` |
  | `bpmnActivityCompletedListener` | `BPMNActivityCompletedEvent` |
  | `bpmnActivityCancelledListener` | `BPMNActivityCancelledEvent` |
  | `bpmnSequenceFlowTakenListener` | `BPMNSequenceFlowTakenEvent` |
  | `processCreatedListener` | `ProcessCreatedEvent` |
  | `processStartedListener` | `ProcessStartedEvent` |
  | `processCompletedListener` | `ProcessCompletedEvent` |
  | `processResumedListener` | `ProcessResumedEvent` |
  | `processSuspendedListener` | `ProcessSuspendedEvent` |
  | `processCancelledListener` | `ProcessCancelledEvent` |
  | `variableCreatedEventListener` | `VariableCreatedEvent` |
  | `variableDeletedEventListener` | `VariableDeletedEvent` |
  | `variableUpdatedEventListener` | `VariableUpdatedEvent` |
  | `taskCreatedEventListener` | `TaskCreatedEvent` |
  | `taskUpdatedEventListener` | `TaskUpdatedEvent` |
  | `taskCompletedEventListener` | `TaskCompletedEvent` |
  | `taskSuspendedEventListener` | `TaskSuspendedEvent` |
  | `taskAssignedEventListener` | `TaskAssignedEvent` |
  | `taskCancelledEventListener` | `TaskCancelledEvent` |
  | `bpmnSignalReceivedListener` | `BPMNSignalReceivedEvent` |

Tests assert on `RuntimeTestConfiguration.collectedEvents` after each operation to verify the exact sequence and type of events fired.

### `SecurityUtil`

Helper that performs Spring Security login for a given username:

- Calls `UserDetailsService.loadUserByUsername()`
- Sets `SecurityContextHolder` with a custom `Authentication`
- Calls the legacy `Authentication.setAuthenticatedUserId()`
- Verifies the result via `SecurityManager.getAuthenticatedUserId()`

**Key method:**
```java
public void logInAs(String username)
```

### Spring Boot Auto-configuration

The util module registers `RuntimeTestConfiguration` via:

```
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
→ org.activiti.spring.conformance.util.RuntimeTestConfiguration
```

### Dependencies

The util module depends on:

- `activiti-api-process-runtime`
- `activiti-api-task-runtime`
- `activiti-api-runtime-shared`
- `activiti-api-task-model`
- `activiti-api-process-model`
- `activiti-api-model-shared`
- `activiti-spring-identity`
- `activiti-engine`
- `activiti-spring-boot-starter`
- `spring-boot-starter-web`
- `spring-boot-starter-security`
- `slf4j-api`
- `h2` (test scope)
- `spring-boot-starter-test`

## Conformance Sets

Each set (set0–set5) is an independent Spring Boot test application. Every set follows the same pattern:

- Contains a minimal `@SpringBootApplication` entry point
- Tests are `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)`
- Tests log in as a preconfigured user, perform API operations, and assert event sequences against `RuntimeTestConfiguration.collectedEvents`
- BPMN process definitions are deployed as classpath resources (`src/test/resources/processes/`)

### Set 0 — Basic Process & Task Runtime

**Package:** `org.activiti.spring.conformance.set0`

**Test classes:**
- `ConformanceBasicProcessRuntimeTest` — validates `ProcessRuntime.configuration()`, `processDefinitions()` pagination, and process definition metadata.
- `ConformanceBasicProcessInformationTest` — queries deployed process definitions and verifies name/version fields.
- `ConformanceBasicGenericTaskTest` — starts a process with only generic BPMN tasks (no human interaction) and asserts 11 events in exact order (create, start, activity start/complete ×3, sequence flow ×2, complete), ending in `COMPLETED` status.
- `ProcessInstanceOperationsTest` — tests `start()`, `delete()`, `suspend()`, and `resume()` on process instances; asserts full event chains including `TASK_CANCELLED`, `ACTIVITY_CANCELLED`, `PROCESS_CANCELLED`, `PROCESS_SUSPENDED`, `TASK_SUSPENDED`, and `PROCESS_RESUMED`.

**Process definitions:**
- `Process Information.bpmn20.xml`
- `Process with Generic  BPMN Task.bpmn20.xml`
- `UserTask with no User or Group Assignment.bpmn20.xml`

### Set 1 — Service Tasks

**Package:** `org.activiti.spring.conformance.set1`

**Test classes:**
- `ConformanceBasicProcessRuntimeTest` — basic runtime verification.
- `ConformanceServiceTaskTest` — starts a process containing a service task, verifies synchronous connector execution, inspects the `IntegrationContext` on the resulting `ProcessInstance` (business key, process definition ID/key/version, client ID/name/type), and asserts the full 11-event sequence.
- `ConformanceServiceTaskModifyVariableTest` — verifies that a service task connector can modify process variables.

**Process definitions:**
- `ServiceTask with Implementation.bpmn20.xml`
- `ServiceTask with Implementation2.bpmn20.xml`

**Note:** Set 1 also depends on `activiti-core-test-local-runtime` for `ProcessOperations` / `TaskOperations` fluent test helpers.

### Set 2 — User Task Assignments

**Package:** `org.activiti.spring.conformance.set2`

**Test classes:**
- `ConformanceBasicProcessRuntimeTest`
- `UserTaskAssigneeRuntimeTest` — user task with a direct assignee.
- `UserTaskAssigneeDeleteRuntimeTest` — assignment deletion scenarios.
- `UserTaskCandidateUserRuntimeTest` — candidate user assignment.
- `UserTaskCandidateGroupRuntimeTest` — candidate group assignment.
- `UserTaskCandidateDeleteRuntimeTest` — candidate deletion.
- `UserTaskNoCandidateRuntimeTest` — user task with no assignment at all.

**Process definitions:**
- `UserTask with Assignee.bpmn20.xml`
- `UserTask with CandidateUser.bpmn20.xml`
- `UserTask with CandidateGroup.bpmn20.xml`
- `UserTask with no User or Group Assignment.bpmn20.xml`

### Set 3 — User Task Candidate Visibility

**Package:** `org.activiti.spring.conformance.set3`

**Test classes:**
- `ConformanceBasicProcessRuntimeTest`
- `UserTaskCandidateGroupsTest` — multi-group candidate visibility.
- `UserTaskCandidateGroupAndAssigneeTest` — combined candidate group and assignee.
- `UserTaskCandidateVisibilityTest` — visibility rules for candidate tasks.

**Process definitions:**
- `user-task-candidate-group.bpmn20.xml`
- `user-task-group1-followed-group2.bpmn20.xml`
- `user-task-assignee-followed-group1.bpmn20.xml`

### Set 4 — Gateways

**Package:** `org.activiti.spring.conformance.set4`

**Test classes:**
- `ConformanceBasicProcessRuntimeTest`
- `BasicExclusiveGatewayTest` — starts a process with an exclusive gateway; uses `ProcessOperations` and `TaskOperations` to complete tasks and asserts gateway start/complete events, sequence flow taken events, and task creation/assignment downstream of the gateway.
- `BasicExclusiveGatewayErrorTest` — exclusive gateway with expression evaluation error path.
- `BasicInclusiveGatewayTest` — inclusive gateway routing.
- `BasicParallelGatewayTest` — parallel split/join.
- `BasicParallelGatewayGroupAssignmentsTest` — parallel gateway combined with group task assignments.

**Process definitions:**
- `basic-exclusive-gateway.bpmn20.xml`
- `basic-exclusive-gateway-expr-error.bpmn20.xml`
- `basic-Inclusive-gateway.bpmn20.xml`
- `basic-parallel-gateway.bpmn20.xml`
- `basic-parallel-gateway-groups.bpmn20.xml`

### Set 5 — Call Activities

**Package:** `org.activiti.spring.conformance.set5`

**Test classes:**
- `ConformanceBasicProcessRuntimeTest`
- `BasicCallActivityTest` — call activity that invokes a sub-process.
- `BasicCallActivityAndServiceTaskTest` — call activity combined with a service task in the sub-process.

**Process definitions:**
- `basic-call-activity.bpmn20.xml`
- `basic-call-activity-service-task.bpmn20.xml`
- `sub-process-a.bpmn20.xml`
- `sub-process-b.bpmn20.xml`

## Variables Submodule

**Artifact:** `activiti-spring-conformance-variables`
**Package:** `org.activiti.spring.conformance.variables`

**Test classes:**
- `ProcessVariablesTest` — starts a process, calls `ProcessRuntime.setVariables()` with a mix of string and integer values, retrieves variables via `ProcessRuntime.variables()`, and asserts:
  - Variable names and values match
  - `processInstanceId` is set, `taskId` is null (not a task variable)
  - `isTaskVariable()` returns `false`
  - Variable types are `"string"` and `"integer"` respectively
- `TaskVariablesTest` — variable operations scoped to tasks.

**Process definitions:**
- `user-task-assignee-followed-group1.bpmn20.xml`
- `user-task-candidate-group.bpmn20.xml`
- `user-task-group1-followed-group2.bpmn20.xml`

## Signals Submodule

**Artifact:** `activiti-spring-conformance-signals`
**Package:** `org.activiti.spring.conformance.signals`

**Test class:** `SignalThrowCatchTest`

Tests five signal scenarios:

| Test Method | Description |
|-------------|-------------|
| `testProcessWithThrowSignal` | Process with an intermediate throw signal event — verifies the throw event fires and process completes. |
| `testProcessWithIntermediateCatchEventSignal` | Process paused at an intermediate catch signal event — then `ProcessRuntime.signal()` is called to deliver a signal with variables; asserts `SIGNAL_RECEIVED`, variable creation, activity completion, and process completion. |
| `testProcessesWithThrowCatchSignal` | Two processes: one throws a signal, one catches it — verifies the signal propagates from the thrower to the catcher and both processes complete. |
| `testProcessWithBoundaryEventSignal` | User task with a boundary signal catch event — signal delivery cancels the task and fires `TASK_CANCELLED`, `ACTIVITY_CANCELLED`, then continues to the boundary's downstream flow. |
| `testProcessStartedBySignal` | Process started by a signal (signal start event) — `ProcessRuntime.signal()` creates and starts the process in one operation. |

**Process definitions:**
- `SignalThrowEventProcess.bpmn20.xml`
- `SignalCatchEventProcess.bpmn20.xml`
- `SignalStartEventProcess.bpmn20.xml`
- `ProcessWithBoundarySignal.bpmn20.xml`

## Common Test Patterns

Every conformance test follows a consistent structure:

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class SomeConformanceTest {

    @Autowired
    private ProcessRuntime processRuntime;

    @Autowired
    private TaskRuntime taskRuntime;

    @Autowired
    private SecurityUtil securityUtil;

    @Test
    public void shouldDoSomething() {
        // 1. Log in as a preconfigured user
        securityUtil.logInAs("user1");

        // 2. Perform API operation
        ProcessInstance pi = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("myProcess")
                .withBusinessKey("bk")
                .withName("name")
                .build()
        );

        // 3. Assert state
        assertThat(pi.getStatus()).isEqualTo(ProcessInstanceStatus.RUNNING);

        // 4. Assert exact event sequence
        assertThat(RuntimeTestConfiguration.collectedEvents)
            .extracting(RuntimeEvent::getEventType)
            .containsExactly(
                ProcessRuntimeEvent.ProcessEvents.PROCESS_CREATED,
                ProcessRuntimeEvent.ProcessEvents.PROCESS_STARTED,
                // ... more events
            );
    }

    @AfterEach
    public void cleanup() {
        RuntimeTestConfiguration.collectedEvents.clear();
    }
}
```

## Running the Tests

The parent module skips deployment; each submodule is a standalone Spring Boot test application.

```bash
# Run all conformance tests
mvn test -pl activiti-core/activiti-spring-conformance-tests -am

# Run a single set
mvn test -pl activiti-core/activiti-spring-conformance-tests/activiti-spring-conformance-set4

# Run a single test class
mvn test -pl activiti-core/activiti-spring-conformance-tests/activiti-spring-conformance-set4 \
    -Dtest=BasicExclusiveGatewayTest
```

## Related Documentation

- [Process Runtime API](../activiti-api/process-runtime.md)
- [Task Runtime API](../activiti-api/task-runtime.md)

---

**Source:** `activiti-core/activiti-spring-conformance-tests/`
