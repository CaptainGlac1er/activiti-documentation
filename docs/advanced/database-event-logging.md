---
sidebar_label: Database Event Logging
slug: /advanced/database-event-logging
title: "Database Event Logging"
description: "Persistent, database-stored audit trail of all engine operations for forensics and compliance."
---

# Database Event Logging

Database event logging provides a persistent, sequential record of every operation performed by the engine. Unlike the in-memory event dispatcher (which notifies listeners), database event logging writes structured entries to the `ACT_EVT_LOG` table that survive application restarts.

## Enabling Database Event Logging

```java
ProcessEngineConfiguration config = new ProcessEngineConfigurationImpl();
config.setEnableDatabaseEventLogging(true);
```

```xml
<!-- activiti.cfg.xml -->
<property name="enableDatabaseEventLogging" value="true"/>
```

This is **disabled by default** and should be used selectively due to the performance and storage overhead.

## Event Log Entry Structure

```java
public interface EventLogEntry {
    long   getLogNumber();           // Sequential log number
    String getType();                // Event type
    String getProcessDefinitionId(); // Process definition
    String getProcessInstanceId();   // Process instance
    String getExecutionId();         // Execution
    String getTaskId();              // Associated task (if any)
    Date   getTimeStamp();           // Event timestamp
    String getUserId();              // User who triggered the event
    byte[] getData();                // Serialized event data (binary payload)
}
```

## Logged Event Types

The database event log does **not** capture every engine operation. `EventLogger.initializeDefaultHandlers()` registers a **fixed set of handlers**, and only the event types those handlers cover are written to `ACT_EVT_LOG`:

**Task events** — `TASK_CREATED`, `TASK_COMPLETED`, `TASK_ASSIGNED`

**Sequence flow** — `SEQUENCEFLOW_TAKEN`

**Activity events** — `ACTIVITY_STARTED`, `ACTIVITY_COMPLETED`, `ACTIVITY_SIGNALED`, `ACTIVITY_MESSAGE_RECEIVED`, `ACTIVITY_COMPENSATE`, `ACTIVITY_ERROR_RECEIVED`

**Variable events** — `VARIABLE_CREATED`, `VARIABLE_UPDATED`, `VARIABLE_DELETED`

**Process-instance start / end** — `PROCESSINSTANCE_START`, `PROCESSINSTANCE_END`

For the task, sequence-flow, activity, and variable events, the value stored in the `type` column is the `ActivitiEventType` name itself (e.g. `TASK_CREATED`, `ACTIVITY_STARTED`, `VARIABLE_UPDATED`).

Process-instance start and end are a special case. `EventLogger.getEventHandler(...)` watches the generic `ENTITY_INITIALIZED` and `ENTITY_DELETED` events and, when the affected entity is the **root execution** of a process instance, routes them to `ProcessInstanceStartedEventHandler` and `ProcessInstanceEndedEventHandler`. Those handlers write the custom type strings `PROCESSINSTANCE_START` and `PROCESSINSTANCE_END`.

> **Note:** `PROCESS_STARTED` and `PROCESS_COMPLETED` are **in-memory engine event types** (see [Engine Event System](./engine-event-system.md)); they are **never** written to `ACT_EVT_LOG`. Job, timer, engine-lifecycle, membership, and history events are likewise not logged, nor are entity-lifecycle events other than the root-execution start/end case above.

The JSON payload stored in the `data` column uses the field names defined by the `Fields` constants in `org.activiti.engine.impl.event.logger.handler.Fields` (e.g. `activityId`, `processInstanceId`, `variables`, `assignee`, `timeStamp`).

## Querying Event Logs

```java
// Get the latest 100 entries
List<EventLogEntry> recentEntries = managementService
    .getEventLogEntries(null, 100L);

// Get entries for a specific process instance
List<EventLogEntry> processEntries = managementService
    .getEventLogEntriesByProcessInstanceId("processInstanceId");

// Paginated: start from log number 1000, get 50 entries
List<EventLogEntry> page = managementService
    .getEventLogEntries(1000L, 50L);

// Delete a specific entry (typically for testing)
managementService.deleteEventLogEntry(1000L);
```

## Extending the Event Logger

The logger can be extended in memory. `EventLogger.addEventLoggerListener(EventLoggerListener)` registers a listener whose single callback, `void eventsAdded(EventLogger databaseEventLogger)`, is invoked each time the logger flushes its buffered entries — that is, when the command context closes and the events have been written to the store. Use it to react to newly persisted events without re-reading `ACT_EVT_LOG`.

## Use Cases

### Forensic Analysis

```java
// Reconstruct the full timeline of a process instance
List<EventLogEntry> timeline = managementService
    .getEventLogEntriesByProcessInstanceId(processInstanceId);

for (EventLogEntry entry : timeline) {
    System.out.printf("[%d] %s - %s (user: %s)%n",
        entry.getLogNumber(),
        entry.getTimeStamp(),
        entry.getType(),
        entry.getUserId());
}
```

### Compliance Audit

The sequential log numbers and timestamps provide a tamper-evident audit trail. Unlike history tables (which can be modified), event log entries are appended and assigned monotonically increasing sequence numbers.

```java
// Verify log continuity
List<EventLogEntry> allEntries = managementService.getEventLogEntries(null, null);
long expectedSeq = 1;
for (EventLogEntry entry : allEntries) {
    if (entry.getLogNumber() != expectedSeq) {
        log.warn("Gap in event log at sequence {}", expectedSeq);
    }
    expectedSeq++;
}
```

### Performance Diagnostics

```java
// Measure time between key events
List<EventLogEntry> entries = managementService
    .getEventLogEntriesByProcessInstanceId(processInstanceId);

LocalDateTime start = null, end = null;
for (EventLogEntry entry : entries) {
    // ACT_EVT_LOG stores PROCESSINSTANCE_START / PROCESSINSTANCE_END,
    // not PROCESS_STARTED / PROCESS_COMPLETED (those are in-memory engine event types)
    if ("PROCESSINSTANCE_START".equals(entry.getType()) && start == null) {
        start = LocalDateTime.ofInstant(entry.getTimeStamp().toInstant(), ZoneId.systemDefault());
    }
    if ("PROCESSINSTANCE_END".equals(entry.getType())) {
        end = LocalDateTime.ofInstant(entry.getTimeStamp().toInstant(), ZoneId.systemDefault());
    }
}
if (start != null && end != null) {
    Duration duration = Duration.between(start, end);
    System.out.println("Process duration: " + duration.toSeconds() + "s");
}
```

## Event Log vs History vs Engine Events

| Feature | Database Event Log | History Tables | Engine Event System |
|---------|-------------------|----------------|---------------------|
| Persistence | Database (sequential) | Database (structured) | In-memory listeners |
| Granularity | Fixed set of event types (see [Logged Event Types](#logged-event-types)) | Configured by level | Configured by listener |
| Tamper evidence | Sequential log numbers | No | No |
| Survives restart | Yes | Yes | No |
| Query flexibility | By log number, process ID | Rich query API | N/A (push model) |
| Performance cost | High | Medium (FULL level) | Low (filtered) |
| Enable | `setEnableDatabaseEventLogging` | `setHistoryLevel` | `setEnableEventDispatcher` |

```mermaid
graph TD
    subgraph DB["Database"]
        subgraph EventLog["Event Log (ACT_EVT_LOG)"]
            EL1["Sequential, tamper-evident"]
            EL2["Survives restart"]
            EL3["High performance cost"]
        end
        subgraph History["History Tables"]
            H1["Structured queries"]
            H2["Configurable level"]
            H3["Medium performance cost"]
        end
    end
    subgraph InMemory["In-Memory"]
        subgraph EngineEvents["Engine Event System"]
            EE1["Filtered by type"]
            H4["Does not survive restart"]
            EE2["Low performance cost"]
        end
    end
```

## Best Practices

1. **Enable selectively** — Use in production only for compliance requirements or debugging specific issues
2. **Clean up periodically** — The log table grows without bound; implement retention policies
3. **Combine with engine events** — Use the event system for real-time processing and the DB log for persistence
4. **Monitor table size** — Check `ACT_EVT_LOG` growth, especially with high-volume processes

```mermaid
graph LR
    subgraph Realtime["Real-Time (low cost)"]
        RE["Engine Event System"]
    end
    subgraph Persistent["Persistent (high cost)"]
        PE["Database Event Log"]
    end
    subgraph Structured["Structured (medium cost)"]
        SE["History Tables"]
    end
    RE -->|"live notifications"| Users["Applications / Listeners"]
    PE -->|"audit trail"| Compliance["Compliance / Forensics"]
    SE -->|"queries"| Analytics["Analytics / Reporting"]
```

## Related Documentation

- [Engine Event System](./engine-event-system.md) — In-memory event listeners
- [Historic Variable Updates](./historic-variable-updates.md) — Variable change tracking
- [Management Service API](../api-reference/engine-api/management-service) — Management operations
