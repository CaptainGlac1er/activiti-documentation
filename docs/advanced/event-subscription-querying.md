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

When you call `RuntimeService.messageEventReceived("msg", "correlation")`, the engine:

1. Queries `EventSubscriptionEntityManager` for matching subscriptions
2. Finds the first `message`-type subscription with `eventName = "msg"`
3. Triggers the associated execution
4. Deletes the subscription

Signal events (`signalEventReceived`) work similarly but broadcast to **all** matching signal subscriptions (not just the first).

## Related Documentation

- [Intermediate Events](../bpmn/events/intermediate-events.md) — Message, signal, and timer catch events
- [Message Events](../bpmn/events/intermediate-events.md) — Message start events and correlations
- [Runtime Service](../api-reference/engine-api/runtime-service.md) — `messageEventReceived`, `signalEventReceived`
- [Engine Events](./engine-event-system.md) — Global event listeners
- [Database Schema](./database-schema.md) — `ACT_RU_EVENT_SUBSCR` table reference
