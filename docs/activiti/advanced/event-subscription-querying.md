---
sidebar_label: Event Subscription Querying
slug: /advanced/event-subscription-querying
title: "Event Subscription Querying"
description: "Query pending message, signal, and compensate event subscriptions to monitor stuck processes and debug event delivery."
---

# Event Subscription Querying

Event subscriptions represent process instances **waiting for external events** — messages, signals, or compensation triggers. Querying pending subscriptions is essential for monitoring stuck processes, debugging event delivery failures, and building operational dashboards.

## Subscription Types

| Type | Table | Description |
|------|-------|-------------|
| `message` | `ACT_RU_EVENT_SUBSCR` | Process waiting for a specific message (message catch events, receive tasks, message start events) |
| `signal` | `ACT_RU_EVENT_SUBSCR` | Process waiting for a signal broadcast (signal catch events) |
| `compensate` | `ACT_RU_EVENT_SUBSCR` | Activity eligible for compensation (compensate boundary events, throw compensation) |

The `eventType` column in `ACT_RU_EVENT_SUBSCR` distinguishes between these types.

## Using the Internal Query API

`EventSubscriptionQueryImpl` lives in the `org.activiti.engine.impl` package and is not exposed through a public service. Access it by executing a command through `ManagementService`:

```java
List<EventSubscriptionEntity> subscriptions =
    managementService.executeCommand(commandContext -> {
        return commandContext.getEventSubscriptionEntityManager()
            .findEventSubscriptionsByQueryCriteria(
                new EventSubscriptionQueryImpl(commandContext), null);
    });
```

### Query Filters

| Filter | Method | Description |
|--------|--------|-------------|
| Subscription ID | `.eventSubscriptionId(String)` | Exact match on subscription ID |
| Event Name | `.eventName(String)` | Message name, signal name, or activity reference |
| Event Type | `.eventType(String)` | `"message"`, `"signal"`, `"compensate"` |
| Execution ID | `.executionId(String)` | Specific execution waiting for the event |
| Process Instance ID | `.processInstanceId(String)` | All subscriptions for a process instance |
| Activity ID | `.activityId(String)` | Specific BPMN element |
| Tenant ID | `.tenantId(String)` | Tenant-specific filtering |
| Configuration | `.configuration(String)` | Additional configuration data |
| Order | `.orderByCreated()` | Sort by creation time |

### Example: Find All Pending Message Subscriptions

```java
List<EventSubscriptionEntity> messages =
    managementService.executeCommand(commandContext -> {
        EventSubscriptionQueryImpl query =
            new EventSubscriptionQueryImpl(commandContext)
                .eventType("message");
        return commandContext.getEventSubscriptionEntityManager()
            .findEventSubscriptionsByQueryCriteria(query, null);
    });

for (EventSubscriptionEntity sub : messages) {
    System.out.println("Message: " + sub.getEventName() +
        " | Process: " + sub.getProcessInstanceId() +
        " | Activity: " + sub.getActivityId());
}
```

### Example: Find Stuck Processes by Process Instance

```java
List<EventSubscriptionEntity> stuck =
    managementService.executeCommand(commandContext -> {
        EventSubscriptionQueryImpl query =
            new EventSubscriptionQueryImpl(commandContext)
                .processInstanceId("pi-12345");
        return commandContext.getEventSubscriptionEntityManager()
            .findEventSubscriptionsByQueryCriteria(query, null);
    });

// If empty, the process is not waiting for any events
// If non-empty, it shows which events are blocking progress
```

## Using Execution Query (Public API)

For simpler cases, the public `ExecutionQuery` filters on event subscriptions by type:

```java
// Filter executions waiting for a specific message
List<Execution> waitingForMessage = runtimeService.createExecutionQuery()
    .messageEventSubscriptionName("approvalRequired")
    .list();

// Filter executions waiting for a specific signal
List<Execution> waitingForSignal = runtimeService.createExecutionQuery()
    .signalEventSubscriptionName("orderCancelled")
    .list();

// Or filter by activity ID
List<Execution> atActivity = runtimeService.createExecutionQuery()
    .activityId("messageCatch1")
    .list();
```

Note: `messageEventSubscriptionName()` and `signalEventSubscriptionName()` are separate methods — there is no generic `eventSubscriptionName()` filter.

## Use Cases

### Debugging Failed Event Delivery

When a message or signal doesn't trigger the expected behavior:

```java
// Check if the subscription exists
List<EventSubscriptionEntity> subs =
    managementService.executeCommand(commandContext -> {
        EventSubscriptionQueryImpl query =
            new EventSubscriptionQueryImpl(commandContext)
                .eventName("paymentReceived")
                .eventType("message");
        return commandContext.getEventSubscriptionEntityManager()
            .findEventSubscriptionsByQueryCriteria(query, null);
    });

if (subs.isEmpty()) {
    System.out.println("No pending subscription for 'paymentReceived' — " +
        "the process may have already moved past the catch event.");
} else {
    System.out.println("Subscription exists. Process instance: " +
        subs.get(0).getProcessInstanceId());
}
```

### Monitoring Dashboard Data

Build a view of all processes waiting for external input:

```java
Map<String, Long> messageCounts =
    managementService.executeCommand(commandContext -> {
        EntityManager eventSubManager = commandContext.getEventSubscriptionEntityManager();
        List<EventSubscriptionEntity> all =
            eventSubManager.findEventSubscriptionsByQueryCriteria(
                new EventSubscriptionQueryImpl(commandContext)
                    .eventType("message"), null);

        return all.stream()
            .collect(Collectors.groupingBy(
                EventSubscriptionEntity::getEventName,
                Collectors.counting()));
    });

// messageCounts = {"paymentReceived": 15, "approvalRequired": 8, ...}
```

### Signal Subscription Audit

```java
List<EventSubscriptionEntity> signals =
    managementService.executeCommand(commandContext -> {
        EventSubscriptionQueryImpl query =
            new EventSubscriptionQueryImpl(commandContext)
                .eventType("signal");
        return commandContext.getEventSubscriptionEntityManager()
            .findEventSubscriptionsByQueryCriteria(query, null);
    });
```

## Entity Fields

`EventSubscriptionEntity` exposes:

| Field | Description |
|-------|-------------|
| `getId()` | Subscription ID |
| `getEventName()` | Message name, signal name, or activity reference for compensation |
| `getEventType()` | `"message"`, `"signal"`, `"compensate"` |
| `getExecutionId()` | Waiting execution ID |
| `getProcessInstanceId()` | Process instance ID |
| `getProcessDefinitionId()` | Process definition ID |
| `getActivityId()` | BPMN element ID waiting for the event |
| `getConfiguration()` | Additional configuration (e.g., timer expression, signal scope) |
| `getTenantId()` | Tenant identifier |

## Relationship to RuntimeService

When you call `RuntimeService.messageEventReceived("msg", "executionId")`, the second parameter is the ID of the **execution** that should receive the message — there is no 1-argument overload. The engine:

1. Queries `EventSubscriptionEntityManager` for `message`-type subscriptions with `eventName = "msg"` bound to that specific execution
2. Fails with an `ActivitiException` if that execution has no such subscription
3. Triggers the matching subscription, delivering the message to that specific execution

Signal events (`signalEventReceived`) work differently: a signal without an execution ID (e.g., `signalEventReceived("signalName")`) is broadcast only to **globally scoped** signal subscriptions — subscriptions scoped to a process instance are not triggered.

### Full list of message and signal dispatch overloads

All overloads live on `RuntimeService`. Synchronous variants deliver to the waiting executions in the calling thread; the `*Async` variants instead schedule a message job (`JOB_TYPE_MESSAGE`, handled by `ProcessEventJobHandler`) that is picked up by the async executor. The `WithTenantId` variants restrict dispatch to one tenant and exist **only for signals** — there is no `messageEventReceivedWithTenantId`.

| Method | Delivered to | Sync / Async |
|--------|--------------|--------------|
| `messageEventReceived(String messageName, String executionId)` | The single execution bound to the message subscription | Sync |
| `messageEventReceived(String messageName, String executionId, Map<String, Object> processVariables)` | Same, plus variables set on the execution | Sync |
| `messageEventReceivedAsync(String messageName, String executionId)` | Same, delivered by the async executor | Async |
| `signalEventReceived(String signalName)` | All matching signal subscriptions | Sync |
| `signalEventReceived(String signalName, Map<String, Object> processVariables)` | All matching subscriptions, plus variables | Sync |
| `signalEventReceivedAsync(String signalName)` | All matching subscriptions | Async |
| `signalEventReceived(String signalName, String executionId)` | A single execution subscribed to the signal | Sync |
| `signalEventReceived(String signalName, String executionId, Map<String, Object> processVariables)` | Same, plus variables | Sync |
| `signalEventReceivedAsync(String signalName, String executionId)` | Same, delivered by the async executor | Async |
| `signalEventReceivedWithTenantId(String signalName, String tenantId)` | All matching subscriptions within one tenant | Sync |
| `signalEventReceivedWithTenantId(String signalName, Map<String, Object> processVariables, String tenantId)` | Same, plus variables | Sync |
| `signalEventReceivedAsyncWithTenantId(String signalName, String tenantId)` | Same, delivered by the async executor | Async |

Execution-scoped overloads throw `ActivitiObjectNotFoundException` if the execution does not exist and `ActivitiException` if the execution has not subscribed to the named message or signal (for signals, also when the execution is suspended).

### Signal scope behavior

`SignalEventReceivedCmd` enforces signal scoping with three rules worth knowing when you query or dispatch signals:

- **The global-scope filter also applies to execution-scoped dispatch.** When you target a specific execution, the command looks up that execution's subscriptions for the signal name — but only subscriptions where `isGlobalScoped()` are actually woken. A subscription is global-scoped when its signal scope is `"global"` or unset; it is process-instance-scoped when the scope is `"processInstance"`.
- **Process-instance-scoped signals must be thrown from within the process** — by a signal throw activity. Throwing such a signal through `RuntimeService` against an execution whose subscription is process-instance-scoped is a no-op.
- **Start-event subscriptions carry a NULL process instance ID.** Message and signal start event subscriptions are created at deploy time with only the event name, the start activity ID, the process definition ID, and (if any) the tenant ID set — `processInstanceId` remains `NULL`. You can use this to distinguish start-event subscriptions from the runtime subscriptions of live process instances when querying `ACT_RU_EVENT_SUBSCR`.

## Related Startup Events

`StartMessageDeployedEvent(s)` are not produced by any of the query APIs above — they are published **at application startup** by `StartMessageDeployedEventProducer`, a Spring `SmartLifecycle` component registered by `ProcessEngineAutoConfiguration`:

1. On context startup, it loads every deployed process definition.
2. For each definition it queries `ACT_RU_EVENT_SUBSCR` for `message`-type subscriptions whose `configuration` equals the process definition ID and whose process instance ID is `NULL` — exactly the subscriptions created for **message start events** at deploy time.
3. Each of those becomes a `StartMessageDeployedEvent` (carrying a `StartMessageDeploymentDefinition` with the message subscription and its process definition), dispatched to registered `ProcessRuntimeEventListener<StartMessageDeployedEvent>` listeners.
4. If any events were produced, the whole batch is also published as a Spring `ApplicationEvent` — `StartMessageDeployedEvents` — for the rest of the application.

This is the hook that lets a Spring Boot application react to "which message start events are available" as soon as the engine starts.

## Related Documentation

- [Intermediate Events](../bpmn/events/intermediate-events.md) — Message, signal, and timer catch events
- [Message Events](../bpmn/events/intermediate-events.md) — Message start events and correlations
- [Runtime Service](../api-reference/engine-api/runtime-service.md) — `messageEventReceived`, `signalEventReceived`
- [Engine Events](./engine-event-system.md) — Global event listeners
- [Database Schema](./database-schema.md) — `ACT_RU_EVENT_SUBSCR` table reference
