---
sidebar_label: Integration
slug: /bpmn/integration
description: Integration patterns and external system connectivity in Activiti
---

# Integration Patterns

This section covers **integration patterns** for connecting Activiti processes with external systems.

## Overview

Activiti provides multiple approaches for external system integration:

- **Connectors** - Declarative JSON-based integrations
- **Service Tasks** - Java-based custom integrations
- **Message Events** - Event-driven integration
- **REST API** - Direct engine interaction

## Integration Approaches

### 1. Connectors (Recommended)

**Best for:** Standard integrations, reusable components

```xml
<serviceTask id="processImage" 
             name="Process Image" 
             implementation="Process Image Connector.processImageActionName"/>
```

**Advantages:**
- No Java code required
- Reusable across processes
- Type-safe with validation
- Easy to test and mock
- Simple declarative syntax

**Learn more:** [Connectors](./connectors.md)

### 2. Service Tasks with Java Delegates

**Best for:** Complex logic, custom integrations

```xml
<serviceTask id="customIntegration" 
             activiti:class="com.example.CustomIntegrationService"/>
```

**Advantages:**
- Full Java programming power
- Complex business logic
- Custom error handling
- Direct framework integration

**Learn more:** [Service Task](../elements/service-task.md)

### 3. Message Events

**Best for:** Event-driven architectures, asynchronous integration

```xml
<intermediateCatchEvent id="receiveOrder">
  <messageEventDefinition messageRef="orderMessage"/>
</intermediateCatchEvent>
```

**Advantages:**
- Loose coupling
- Asynchronous processing
- Event-driven design
- External system triggers

**Learn more:** [Intermediate Events](../events/intermediate-events.md#1-message-intermediate-events)

### 4. REST API Integration

**Best for:** Direct engine control, external orchestration

```java
// Start process from external system
runtimeService.startProcessInstanceByKey("orderProcess", variables);

// Query process state
processInstance = runtimeService.createProcessInstanceQuery()
    .processInstanceId(id)
    .singleResult();
```

**Advantages:**
- HTTP-based integration
- Language-agnostic
- Direct engine access
- Microservices friendly

**Learn more:** [Runtime API](../../api-reference/engine-api/runtime-service.md)

## Choosing the Right Approach

| Scenario | Recommended Approach |
|----------|---------------------|
| Standard API calls (REST, email, DB) | **Connectors** |
| Complex business logic | **Service Tasks** |
| Event-driven integration | **Message Events** |
| External orchestration | **REST API** |
| Reusable integrations | **Connectors** |
| One-off custom integration | **Service Tasks** |
| Asynchronous processing | **Message Events** or **Async Service Tasks** |

## Integration Patterns

### Request-Reply Pattern

```
Process → External System → Response → Process
```

**Implementation:** Synchronous service task or connector

### Fire-and-Forget Pattern

```
Process → External System (no response needed)
```

**Implementation:** Async service task or connector

### Event-Driven Pattern

```
External System → Message → Process
```

**Implementation:** Message start event or intermediate message event

### Polling Pattern

```
Process → Timer → Check External System → Process Results
```

**Implementation:** Timer event + service task

### Callback Pattern

```
Process → External System → ... → Callback → Process
```

**Implementation:** Message event for callback reception

## Related Documentation

- [Connectors](./connectors.md) - Declarative integrations
- [Service Task](../elements/service-task.md) - Java-based integrations
- [Intermediate Events](../events/intermediate-events.md#1-message-intermediate-events) - Message events
- [Timer Events](../events/intermediate-events.md#2-timer-intermediate-events) - Time-based triggers
- [REST API](../../api-reference/engine-api/index.md) - Engine APIs

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
