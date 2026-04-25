---
sidebar_label: Historic Variable Updates
slug: /advanced/historic-variable-updates
title: "Historic Variable Updates"
description: "Tracking every variable change throughout a process instance lifecycle for audit and debugging."
---

# Historic Variable Updates

The `HistoricVariableUpdate` API provides a complete audit trail of every change made to every process variable. Each update records the variable name, value, type, revision number, and timestamp.

**Requirement:** History level must be set to `FULL` (`config.setHistoryLevel(HistoryLevel.FULL)`).

## The HistoricVariableUpdate Interface

```java
public interface HistoricVariableUpdate extends HistoricDetail {
    String getVariableName();       // Name of the variable
    String getVariableTypeName();   // Type (e.g., "string", "long", "jpa-entity")
    Object getValue();              // The value set in this update
    int getRevision();              // Update revision number (1, 2, 3, ...)
}
```

As a `HistoricDetail`, it also provides:
- `getProcessInstanceId()` — the process instance
- `getExecutionId()` — the execution scope
- `getTaskId()` — associated task (if any)
- `getTime()` — timestamp of the update
- `getTenantId()` — tenant identifier

## Querying Variable Updates

There is no dedicated `createHistoricVariableUpdateQuery()` method. Instead, use `createHistoricDetailQuery()` and filter for `HistoricVariableUpdate` instances:

```java
// All historic details for a process instance, filtered to variable updates
List<HistoricVariableUpdate> updates = historyService
    .createHistoricDetailQuery()
    .processInstanceId("processInstanceId")
    .list()
    .stream()
    .filter(detail -> detail instanceof HistoricVariableUpdate)
    .map(detail -> (HistoricVariableUpdate) detail)
    .collect(Collectors.toList());
```

**Note:** `HistoricDetailQuery` does not have a `variableName()` filter, so you must query all details and filter client-side.

## Reconstructing Variable History

```java
// Build a timeline of changes for a variable
List<HistoricDetail> allDetails = historyService
    .createHistoricDetailQuery()
    .processInstanceId(processInstanceId)
    .list();

Map<String, List<HistoricVariableUpdate>> variableTimeline = allDetails.stream()
    .filter(detail -> detail instanceof HistoricVariableUpdate)
    .map(detail -> (HistoricVariableUpdate) detail)
    .collect(Collectors.groupingBy(HistoricVariableUpdate::getVariableName));

// Print the timeline for a specific variable
List<HistoricVariableUpdate> statusUpdates = variableTimeline.get("orderStatus");
if (statusUpdates != null) {
    for (HistoricVariableUpdate update : statusUpdates) {
        System.out.printf("[%s] Revision %d: %s = %s%n",
            update.getTime(),
            update.getRevision(),
            update.getVariableName(),
            update.getValue());
    }
}
```

Output:
```
[2024-01-15 09:00:00] Revision 1: orderStatus = CREATED
[2024-01-15 09:05:00] Revision 2: orderStatus = VALIDATED
[2024-01-15 10:30:00] Revision 3: orderStatus = APPROVED
[2024-01-15 14:00:00] Revision 4: orderStatus = SHIPPED
```

## Use Cases

### Compliance Audit Trail

```java
public class VariableAuditService {

    public String generateAuditReport(String processInstanceId) {
        List<HistoricDetail> allDetails = historyService
            .createHistoricDetailQuery()
            .processInstanceId(processInstanceId)
            .list();

        StringBuilder report = new StringBuilder();
        for (HistoricDetail detail : allDetails) {
            if (detail instanceof HistoricVariableUpdate) {
                HistoricVariableUpdate update = (HistoricVariableUpdate) detail;
                report.append(String.format(
                    "TIME: %s | VAR: %s | TYPE: %s | VALUE: %s | REV: %d%n",
                    update.getTime(),
                    update.getVariableName(),
                    update.getVariableTypeName(),
                    update.getValue(),
                    update.getRevision()
                ));
            }
        }
        return report.toString();
    }
}
```

### Debugging Unexpected Variable Values

```java
// Trace how a variable changed before a gateway decision
List<HistoricDetail> allDetails = historyService
    .createHistoricDetailQuery()
    .processInstanceId(processInstanceId)
    .list();

for (HistoricDetail detail : allDetails) {
    if (detail instanceof HistoricVariableUpdate) {
        HistoricVariableUpdate update = (HistoricVariableUpdate) detail;
        if ("approvalScore".equals(update.getVariableName())) {
            System.out.println("Rev " + update.getRevision()
                + " at " + update.getTime()
                + ": value = " + update.getValue()
                + " (execution: " + update.getExecutionId() + ")");
        }
    }
}
```

### Data Evolution Analysis

```java
// Analyze how often variables are updated
List<HistoricDetail> allDetails = historyService
    .createHistoricDetailQuery()
    .processInstanceId(processInstanceId)
    .list();

Map<String, Long> updateCounts = allDetails.stream()
    .filter(detail -> detail instanceof HistoricVariableUpdate)
    .map(detail -> ((HistoricVariableUpdate) detail).getVariableName())
    .collect(Collectors.groupingBy(name -> name, Collectors.counting()));

for (Map.Entry<String, Long> entry : updateCounts.entrySet()) {
    System.out.println(entry.getKey() + " updated " + entry.getValue() + " times");
}
```

## Performance Notes

- `FULL` history level stores every variable change, which can produce significant data volume
- `HistoricDetailQuery` retrieves all detail types (variable updates and form properties), so filter client-side
- Use pagination (`listPage()`) for large datasets
- Consider `AUDIT` level if you only need final values (via `HistoricVariableInstanceQuery`), not intermediate changes

## Related Documentation

- [History Service API](../../api-reference/engine-api/history-service.md) — Full history operations
- [Configuration](../../configuration.md#history-configuration) — Setting history levels
- [Variables](../bpmn/advanced/variables.md) — Variable scope and lifecycle
