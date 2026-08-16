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

- There is **no `ComplexGatewayParseHandler`** class — the engine does not assign any activity behavior to complex gateways.
- There is **no `ComplexGatewayActivityBehavior`** class — no runtime logic exists for complex gateway semantics.
- The `ComplexGatewayXMLConverter` in the BPMN converter simply transforms a `<complexGateway>` into an `ExclusiveGateway` during XML parsing, meaning it will behave as a standard exclusive (XOR) gateway at best.
- Complex gateway-specific features such as DAN (Disjunctive AND), DOR (Disjunctive OR), activation conditions, and cancellation conditions are **not implemented**.
- A complex gateway registered in `ProcessEngineConfigurationImpl` does not exist.

### What Happens If You Use One?

If your BPMN contains a `<complexGateway>`, the XML converter will attempt to parse it but will convert it to an exclusive gateway internally. The complex-specific attributes and semantics will be **ignored**. Depending on your process, this may cause unexpected behavior or parse warnings.

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

The inclusive gateway supports selecting one or more paths simultaneously, which covers most use cases that might otherwise require a complex gateway.

### Source Reference

- `ComplexGatewayXMLConverter.java` — Converts `<complexGateway>` to `ExclusiveGateway` (see comment: *"complex gateway is not supported so transform it to exclusive gateway"*)
- No `ComplexGatewayParseHandler` found in the engine module
- No `ComplexGatewayActivityBehavior` found in the engine module
- No registration of a complex gateway handler in `ProcessEngineConfigurationImpl`

### Related Documentation

- [Inclusive Gateway](./inclusive-gateway.md) — Supported alternative for multi-path routing
- [Exclusive Gateway](./exclusive-gateway.md) — XOR logic (single path)
- [Parallel Gateway](./parallel-gateway.md) — AND logic (all paths)
- [Gateway Overview](./index.md) — All gateway types
