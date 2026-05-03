---
sidebar_label: Token Lifecycle
slug: /advanced/token-lifecycle
title: "Token Lifecycle in Activiti"
description: "Understanding how tokens (executions) flow through BPMN processes, including gateway behavior, wait states, and cleanup."
---

# Token Lifecycle in Activiti

In BPMN terminology, a **token** represents a unit of progress through a process. Activiti implements tokens as `ExecutionEntity` objects — there is no separate `Token` class. Each execution entity *is* a token.

When a process instance starts, the engine creates a root execution (the process instance itself). As tokens encounter parallel gateways, subprocesses, or multi-instance activities, child executions are spawned. When tokens converge, some are deleted and one is reused to continue forward.

## Key Fields on ExecutionEntity

| Field | Type | Meaning |
|-------|------|---------|
| `isActive` | `boolean` | `true` = token is flowing; `false` = token waiting at a join |
| `isConcurrent` | `boolean` | `true` = token belongs to a parallel branch |
| `isScope` | `boolean` | `true` = token defines a variable/event scope boundary |
| `isEnded` | `boolean` | `true` = token has completed and will be cleaned up |
| `isEventScope` | `boolean` | `true` = token waiting for message, signal, or timer |
| `currentFlowElement` | `FlowElement` | Current BPMN element position of this token |
| `parentId` | `String` | Parent execution ID; `null` = root process instance |

## Token Lifecycle Overview

```mermaid
flowchart TD
    Start([Process Start]) --> CreateRoot["Create root ExecutionEntity\nisActive=true, isScope=true"]
    CreateRoot --> PlanContinue["Plan ContinueProcessOperation"]
    PlanContinue --> EnterNode["Token enters FlowNode"]
    EnterNode --> ExecuteBehavior["activityBehavior.execute()"]

    ExecuteBehavior --> NodeType{Node Type}
    NodeType -->|"Task / Service"| SyncComplete["Complete synchronously"]
    NodeType -->|"User Task"| Wait1["Wait for task completion"]
    NodeType -->|"Intermediate Catch"| Wait2["Wait for event"]

    SyncComplete --> Leave
    Wait1 --> Resume["RuntimeService triggers"]
    Wait2 --> Resume
    Resume --> Leave

    Leave["TakeOutgoingSequenceFlowsOperation"] --> Fork{Outgoing Flows}

    Fork -->|"Single"| Continue["Reuse execution"]
    Fork -->|"Multiple"| Spawn["createChildExecution per flow\nisConcurrent=true"]

    Spawn --> Continue
    Continue --> Next{Next Node}

    Next -->|"FlowNode"| EnterNode
    Next -->|"Parallel Gateway Join"| InactP["execution.inactivate()\nisActive=false"]
    Next -->|"Inclusive Gateway Join"| InactI["execution.inactivate()\nreachability check"]
    Next -->|"End Event"| EndExec["EndExecutionOperation"]

    InactP --> Count{inactive count ==\nincoming flows?}
    Count -->|"No"| Wait3["Persist in ACT_RU_EXECUTION\nwait for more tokens"]
    Count -->|"Yes"| JoinP["Delete waiting tokens\nreuse current token"]

    InactI --> Reach{Any execution\nstill reachable?}
    Reach -->|"Yes"| Wait4["Background re-check via\nExecuteInactiveBehaviorsOperation"]
    Reach -->|"No"| JoinI["Kill other inactive tokens\nproceed"]

    Wait3 --> Arrive["Next token arrives"]
    Arrive --> Count
    Wait4 --> OtherDone["Other branch diverges"]
    OtherDone --> Reach

    JoinP --> Leave
    JoinI --> Leave

    EndExec --> IsProcess{Process instance?}
    IsProcess -->|"Yes"| CheckChildren{Active children?}
    CheckChildren -->|"No"| DeletePI(["Delete process instance"])
    CheckChildren -->|"Yes"| Keep["Keep root execution"]
    IsProcess -->|"No"| DeleteExec["Delete execution row"]
    DeleteExec --> Notify["Notify parent scope"]
    Notify --> Leave

```

## Agenda-Based Processing

Tokens advance through a FIFO operation queue managed by the engine's **agenda** (`DefaultActivitiEngineAgenda`). Each command execution drains this queue. The `CommandInvoker` processes operations in two phases:

1. **Active phase:** drain the agenda, executing `ContinueProcessOperation`, `TakeOutgoingSequenceFlowsOperation`, etc.
2. **Inactive phase:** if executions were involved, schedule `ExecuteInactiveBehaviorsOperation` and drain again to re-check waiting tokens (used by the inclusive gateway).

| Operation | Purpose |
|-----------|---------|
| `ContinueProcessOperation` | Token enters a BPMN element; calls `activityBehavior.execute()` |
| `TakeOutgoingSequenceFlowsOperation` | Token leaves a node; forks new child executions for parallel paths |
| `EndExecutionOperation` | Token completes an execution; cascades cleanup up the tree |
| `ExecuteInactiveBehaviorsOperation` | Re-evaluates inactive tokens (inclusive gateway join logic) |

The engine never blocks threads on token waits — inactive tokens persist in `ACT_RU_EXECUTION` and are resumed when the next relevant command runs.

## Gateway Fork Mechanism

```mermaid
flowchart LR
    A["Token arrives at Parallel Gateway\n(1 incoming, 3 outgoing)"] --> B["leave() calls\nperformDefaultOutgoingBehavior()"]
    B --> C["evaluateConditions=false\n(all flows selected)"]
    C --> D1["Flow 1: reuse current execution"]
    C --> D2["Flow 2: createChildExecution(parent)\nNEW ExecutionEntity"]
    C --> D3["Flow 3: createChildExecution(parent)\nNEW ExecutionEntity"]
    D1 --> E["Plan ContinueProcessOperation\nfor each execution"]
    D2 --> E
    D3 --> E

```

Key details from `TakeOutgoingSequenceFlowsOperation.leaveFlowNode()`:

- The **first** outgoing flow reuses the current execution (renamed, not recreated).
- Each **additional** outgoing flow creates a new child via `executionEntityManager.createChildExecution(parent)`.
- Every resulting execution gets `planContinueProcessOperation` scheduled.
- For parallel gateways, `evaluateConditions=false` — all flows are taken unconditionally.
- For inclusive gateways, conditions are evaluated — only `true` flows are taken.

## Gateway Join Comparison

| Aspect | Parallel (AND) | Inclusive (OR) | Exclusive (XOR) |
|--------|---------------|---------------|----------------|
| **Join trigger** | `inactive count == incoming flows` | No active execution reachable | Pass-through, no wait |
| **Wait mechanism** | `inactivate()`, count check | `inactivate()`, reachability + background re-check | None |
| **Re-evaluation** | Only when new token arrives | After *any* command on the process instance | N/A |
| **Source class** | `ParallelGatewayActivityBehavior` | `InclusiveGatewayActivityBehavior` | `ExclusiveGatewayActivityBehavior` |

The inclusive gateway implements `InactiveActivityBehavior`, which allows it to be re-checked after other tokens move. This is critical because an exclusive gateway upstream might take a branch that bypasses the inclusive gateway entirely — the inclusive gateway must detect this and activate even though no new token has arrived at it.

## Parallel Gateway Join — Token Synchronization

```mermaid
sequenceDiagram
    autonumber
    participant T1 as Token A
    participant T2 as Token B
    participant GW as Parallel Gateway
    participant DB as ACT_RU_EXECUTION

    T1->>GW: execute()
    GW->>GW: inactivate() — isActive=false
    GW->>DB: persist inactive state
    GW->>GW: findInactiveExecutions() → count=1
    GW->>GW: 1 < 2 (incoming flows) → wait

    T2->>GW: execute()
    GW->>GW: inactivate() — isActive=false
    GW->>DB: persist inactive state
    GW->>GW: findInactiveExecutions() → count=2
    GW->>GW: 2 == 2 (incoming flows) → activate!
    GW->>GW: delete Token A (joinedExecutions)
    GW->>GW: reuse Token B as current
    GW->>GW: lockFirstParentScope()
    GW->>GW: plan TakeOutgoingSequenceFlows
    Note over T1,T2: Token A deleted, Token B continues

```

## Inclusive Gateway Join — Reachability Check

```mermaid
sequenceDiagram
    autonumber
    participant T1 as Token A (at Inc. Gateway)
    participant T2 as Token C (upstream)
    participant GW as Inclusive Gateway
    participant DB as ACT_RU_EXECUTION
    participant AG as Agenda

    T1->>GW: execute()
    GW->>GW: inactivate() — isActive=false
    GW->>GW: executeInclusiveGatewayLogic()
    GW->>T2: isReachable(gateway, T2.current) ?
    T2-->>GW: Yes — T2 can still reach gateway
    GW->>GW: wait — do nothing

    Note over T2: T2 hits Exclusive Gateway, takes branch NOT reaching gateway
    T2->>GW: executeInactive() via ExecuteInactiveBehaviorsOperation
    GW->>T2: isReachable(gateway, T2.current) ?
    T2-->>GW: No — T2 cannot reach gateway anymore
    GW->>GW: No active execution can reach → activate!
    GW->>GW: kill other inactive tokens
    GW->>GW: plan TakeOutgoingSequenceFlows

```

Key: `ExecutionGraphUtil.isReachable()` performs a DFS through the BPMN process graph to determine if a token at its current position can reach the inclusive gateway, accounting for subprocess boundaries, link events, and loop detection.

## Execution Tree State Changes

```mermaid
stateDiagram-v2
    [*] --> S1_RootOnly: Process start — root execution

    S1_RootOnly --> S2_Fork: Parallel gateway splits
    note right of S2_Fork
        Root (scope)
        └─ Exec A (concurrent, active)
        └─ Exec B (concurrent, active)
    end note

    S2_Fork --> S3_OneWait: Exec A reaches join first
    note right of S3_OneWait
        Root (scope)
        └─ Exec A (concurrent, INACTIVE — waiting)
        └─ Exec B (concurrent, active, still flowing)
    end note

    S3_OneWait --> S4_Joined: Exec B arrives — join completes
    note right of S4_Joined
        Root (scope)
        └─ Exec A (deleted)
        └─ Exec B (reused, active, continues forward)
    end note

    S4_Joined --> S5_End: Process completes
    note right of S5_End
        Root (scope, all children ended)
        → delete cascade → rows removed from ACT_RU_EXECUTION
    end note

    S5_End --> [*]

```

## Database Representation

Tokens are persisted in the `ACT_RU_EXECUTION` table. Key columns:

| Column | Token Meaning |
|--------|---------------|
| `ID_` | Unique execution/token ID |
| `PARENT_ID_` | `NULL` = root process instance; otherwise parent execution |
| `IS_ACTIVE_` | Whether the token is flowing or waiting at a join |
| `IS_CONCURRENT_` | Whether the token is in a parallel branch |
| `IS_SCOPE_` | Whether the token defines a variable/event scope boundary |
| `IS_MI_ROOT_` | Whether the token is a multi-instance root |
| `ACT_ID_` | Current BPMN activity where the token resides |
| `ROOT_PROC_INST_ID_` | Topmost root process instance (for nested call activities) |

The `ExecutionEntityManagerImpl` builds the in-memory tree from these flat rows via `processExecutionTree()`, wiring parent-child and super-subprocess references.

## Variable Scope and Token Merging

Variables set on a child execution (a parallel branch token) are **lost** when that branch completes and merges at a gateway join. This happens because the merged executions are deleted — only the reused execution's data survives.

To share data between parallel branches, set variables on the parent scope:

```java
// In a JavaDelegate:
execution.setVariable("sharedKey", value); // sets on highest scope
```

Variables set with `setVariable()` propagate up to the highest scope where they already exist. Variables set with `setVariableLocal()` remain on the current execution and will be lost at a join if that execution is deleted.

## Related Documentation

- [Execution Debug Tree](./execution-debug-tree.md) — Tree visualization for inspecting token state at runtime
- [Multi-Instance](../bpmn/reference/multi-instance.md) — Token multiplication in multi-instance activities
- [Variables and Variable Scope](../bpmn/reference/variables.md) — How variable scoping interacts with token hierarchy
- [Gateways](../bpmn/gateways/index.md) — BPMN elements that control token flow
- [Runtime Service](../api-reference/engine-api/runtime-service.md) — Public API for execution/token management
