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

The `EventBasedGatewayActivityBehavior` class extends `FlowNodeActivityBehavior` with **zero method overrides**. It is essentially a pass-through — the class body is empty (23 lines total, only a class declaration and `serialVersionUID`).

The `EventGateway` model class has no `exclusive`, `instant`, or `eventGatewayType` fields. These attributes from the BPMN 2.0 spec are **not modeled** and **not parsed**.

### What This Means

- The `activiti:exclusive` attribute **does not exist** on `EventGateway`.
- The `instant` attribute **does not exist** on `EventGateway`.
- Exclusive mode vs. non-exclusive (inclusive) mode are **not distinguished** at runtime.
- The gateway itself acts as a simple pass-through flow node.

### How Event Handling Actually Works

The actual event-based gateway behavior — registering event listeners, canceling competing events when one fires — is implemented in the **downstream intermediate catch events**, not in the gateway itself. The `IntermediateCatchEventActivityBehavior` class:

1. Detects when it is preceded by an event-based gateway via `getPrecedingEventBasedGateway()`.
2. Registers itself as a pending event listener.
3. When one event fires, calls `deleteOtherEventsRelatedToEventBasedGateway()` to cancel all sibling intermediate catch events connected to the same gateway.

This means the event-based gateway pattern works in Activiti, but the behavior is entirely driven by the intermediate catch events, not by the gateway element itself.

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
