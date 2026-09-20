---
sidebar_label: Complex Gateway
slug: /bpmn/gateways/complex-gateway
title: "Complex Gateway"
description: "Complex Gateway support status in Activiti."
---

# Complex Gateway

## Not Supported

**Complex Gateway is NOT supported by Activiti at runtime.**

### What This Means

- The BPMN-to-model converter maps `<complexGateway>` to an `ExclusiveGateway` at parse time (see [Source Reference](#source-reference)) — the engine never sees a complex gateway, so no activity behavior is ever assigned to one.
- There is no `ComplexGatewayParseHandler` and no `ComplexGatewayActivityBehavior` in the engine, and no complex-gateway handler in the parse-handler registry.
- Complex gateway-specific features — activation conditions, cancellation conditions, and the DAN/DOR operator sets — are **not implemented**.

### What Happens If You Use One?

If your BPMN contains a `<complexGateway>`, the converter maps it to an exclusive gateway silently — no parse error or warning is emitted. The element keeps the standard BPMN 2.0 symbol (a diamond with an asterisk) in any tool, but the engine executes it as an exclusive (XOR) gateway: at most one outgoing flow is taken. The complex-specific attributes are discarded during conversion, so a process that relied on them will behave as a plain XOR decision — often in a way that is not obvious at a glance.

```xml
<complexGateway id="complex" name="Complex Decision"/>
```

### Recommended Alternative

For multi-path conditional routing (selecting one or more paths based on conditions), use an **Inclusive Gateway** instead:

```xml
<inclusiveGateway id="gateway" name="Decision"/>

<sequenceFlow id="pathA" sourceRef="gateway" targetRef="taskA">
  <conditionExpression>${conditionA}</conditionExpression>
</sequenceFlow>

<sequenceFlow id="pathB" sourceRef="gateway" targetRef="taskB">
  <conditionExpression>${conditionB}</conditionExpression>
</sequenceFlow>
```

The inclusive gateway supports selecting one or more paths simultaneously, which covers most use cases that might otherwise require a complex gateway. Give it a `default` flow (no condition) so the process cannot stall when every condition evaluates to `false` — see [Sequence Flows — Always Define Default](../elements/sequence-flows.md#3-always-define-default).

### Source Reference

- `ComplexGatewayXMLConverter` (`org.activiti.bpmn.converter`) — `convertXMLToElement` builds an `ExclusiveGateway`; the class comment reads *"complex gateway is not supported so transform it to exclusive gateway"*
- `ComplexGateway` model class exists (`org.activiti.bpmn.model`), but the parser never produces one — the converter replaces it before model building
- No `ComplexGatewayParseHandler`, no `ComplexGatewayActivityBehavior`, and no complex-gateway entry in the engine's parse-handler registry

### Related Documentation

- [Inclusive Gateway](./inclusive-gateway.md) — Supported alternative for multi-path routing
- [Exclusive Gateway](./exclusive-gateway.md) — XOR logic (single path)
- [Parallel Gateway](./parallel-gateway.md) — AND logic (all paths)
- [Gateway Overview](./index.md) — All gateway types
