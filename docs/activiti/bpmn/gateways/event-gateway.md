---
sidebar_label: Event-Based Gateway
slug: /bpmn/gateways/event-gateway
title: "Event-Based Gateway"
description: "Event-Based Gateway support status in Activiti."
---

# Event-Based Gateway

## Minimal Runtime Support

**Event-Based Gateway has minimal runtime support in Activiti.**

### Implementation Details

The `EventBasedGatewayActivityBehavior` class extends `FlowNodeActivityBehavior` with **zero method overrides** — the entire class body is a single `serialVersionUID` field, so the gateway is a plain pass-through flow node at runtime.

The `EventGateway` model class has no `exclusive`, `instant`, or `eventGatewayType` fields (it declares no fields at all). These attributes from the BPMN 2.0 spec are **not modeled** and **not parsed**.

### What This Means

- The `activiti:exclusive` attribute **does not exist** on `EventGateway`.
- The `instant` attribute **does not exist** on `EventGateway`.
- Exclusive mode vs. non-exclusive (inclusive) mode are **not distinguished** at runtime.
- The gateway itself acts as a simple pass-through flow node.

### How Event Handling Actually Works

The actual event-based gateway behavior — competing events canceling each other when one fires — is implemented in the **downstream intermediate catch events**, not in the gateway itself. The `IntermediateCatchEventActivityBehavior` class:

1. At leave time, detects whether it is directly preceded by an event-based gateway — `getPrecedingEventBasedGateway()` matches only the case of exactly one incoming flow whose source is an `EventGateway`.
2. Otherwise contributes nothing: the catch event's own message/timer/signal subscription — set up exactly as for any intermediate catch event — is what parks the execution in its wait state. The gateway registers no subscriptions of its own.
3. When one event fires, `trigger()` → `leaveIntermediateCatchEvent()` calls `deleteOtherEventsRelatedToEventBasedGateway()`, which deletes the sibling executions parked behind the same gateway (with `DeleteReason.EVENT_BASED_GATEWAY_CANCEL`); the process then continues through the triggered event's path.

The class javadoc is explicit that only the exclusive form is supported: *"we're only supporting the exclusive event based gateway type currently"*.

### Recommended Pattern

For waiting on events, place an event-based gateway before intermediate catch events:

```xml
<eventBasedGateway id="eventGateway" name="Wait for Event"/>

<!-- Each outgoing flow leads directly to an intermediate catch event -->
<sequenceFlow id="msgFlow" sourceRef="eventGateway" targetRef="msgCatch"/>
<sequenceFlow id="timerFlow" sourceRef="eventGateway" targetRef="timerCatch"/>

<intermediateCatchEvent id="msgCatch">
  <messageEventDefinition messageRef="myMessage"/>
</intermediateCatchEvent>

<intermediateCatchEvent id="timerCatch">
  <timerEventDefinition>
    <timeDuration>PT24H</timeDuration>
  </timerEventDefinition>
</intermediateCatchEvent>
```

When one event fires, the other is automatically canceled. This is the only "exclusive" behavior available.

### Source Reference

- `EventBasedGatewayActivityBehavior.java` — Empty class extending `FlowNodeActivityBehavior` (no overrides)
- `EventGateway.java` — Model class with no `exclusive` or `instant` fields
- `IntermediateCatchEventActivityBehavior.java` — Contains `deleteOtherEventsRelatedToEventBasedGateway()` which handles event cancellation logic
- `EventBasedGatewayParseHandler.java` — Only assigns the behavior, no special attribute parsing

### Related Documentation

- [Intermediate Events](../events/intermediate-events.md) — Message, timer, and signal catch events
- [Gateway Overview](./index.md) — All gateway types
