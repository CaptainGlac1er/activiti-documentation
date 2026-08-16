---
sidebar_label: Pools and Lanes
slug: /bpmn/elements/pools-lanes
title: "Pools and Lanes"
description: "Using BPMN Pools and Lanes to model swimlanes, participants, and organizational responsibilities in Activiti processes."
---

# Pools and Lanes

Pools and Lanes (collectively "swimlanes") are BPMN **collaboration** constructs that visually organize activities by participant or department. They are represented in the BPMN model by the `Pool` and `Lane` classes, which are structural/diagrammatic elements rather than executable flow elements.

> **Note:** Pools and Lanes are captured in the model for diagramming and collaboration support. They do not affect runtime execution the way gateways or tasks do.

## Pool

A `Pool` represents a participant (e.g., a company, system, or department) in a collaboration. Each pool typically contains one process.

```xml
<collaboration id="orderCollaboration">
  <participant id="customerPool" name="Customer" processRef="customerProcess"/>
  <participant id="fulfillmentPool" name="Fulfillment" processRef="fulfillmentProcess"/>
</collaboration>
```

### Pool Properties

| Property | Description |
|----------|-------------|
| `name` | Display name of the participant |
| `processRef` | ID of the process contained in the pool |

## Lane

A `Lane` subdivides a pool to group related activities (e.g., by role or team). In Activiti, a `Lane` references the activities that belong to it via flow references.

```xml
<process id="orderProcess">
  <laneSet id="orderLaneSet">
    <lane id="salesLane" name="Sales">
      <flowNodeRef>confirmOrderTask</flowNodeRef>
      <flowNodeRef>sendQuoteTask</flowNodeRef>
    </lane>
    <lane id="shippingLane" name="Shipping">
      <flowNodeRef>shipOrderTask</flowNodeRef>
    </lane>
  </laneSet>
  <userTask id="confirmOrderTask" name="Confirm Order"/>
  <userTask id="sendQuoteTask" name="Send Quote"/>
  <userTask id="shipOrderTask" name="Ship Order"/>
</process>
```

### Lane Properties

| Property | Description |
|----------|-------------|
| `name` | Display name of the lane |
| `parentProcess` | The process the lane belongs to |
| `flowReferences` | IDs of the flow elements (tasks, events, gateways) grouped in the lane |

## Common Use Cases

- **Cross-department processes** — separate responsibilities into distinct pools or lanes
- **BPMN collaboration models** — model message flow between multiple participants
- **Organizational grouping** — visually associate activities with roles or teams

## Related Documentation

- [Data Objects and Data Stores](./data-objects.md) — modeling process data
- [Service Task](./service-task.md) — executable activities typically placed in lanes
- [Architecture Overview](../../architecture/overview.md) — how process definitions are structured

---
