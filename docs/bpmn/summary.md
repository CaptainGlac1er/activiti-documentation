---
sidebar_label: BPMN Elements Summary
slug: /bpmn/summary
description: Quick reference guide to all BPMN elements supported by Activiti
---

# BPMN Elements Summary

This page provides a **quick reference** to all BPMN 2.0 elements supported by Activiti, organized by category.

## 📊 Element Categories

### Task Elements

| Element | Description | Activiti Extensions | Documentation |
|---------|-------------|---------------------|---------------|
| **User Task** | Human-performed work | Assignee, candidates, forms, listeners | [User Task](./elements/user-task.md) |
| **Service Task** | Automated system work | Class, delegate, expression, connectors | [Service Task](./elements/service-task.md) |
| **Script Task** | Execute scripts | Multiple languages, async | [Script Task](./elements/script-task.md) |
| **Business Rule Task** | Execute business rules | DMN, Drools integration | [Business Rule Task](./elements/business-rule-task.md) |
| **Manual Task** | External manual work | Documentation, listeners | [Manual Task](./elements/manual-task.md) |
| **Call Activity** | Reference sub-process | Variable mapping, cases | [Call Activity](./elements/call-activity.md) |

### Gateway Elements

| Element | Description | Symbol | Documentation |
|---------|-------------|--------|---------------|
| **Exclusive Gateway** | XOR - one path | X | [Exclusive Gateway](./gateways/exclusive-gateway.md) |
| **Parallel Gateway** | AND - all paths | ⊞ | [Parallel Gateway](./gateways/parallel-gateway.md) |
| **Inclusive Gateway** | OR - one or more | ⦿ | [Inclusive Gateway](./gateways/inclusive-gateway.md) |
| **Event-Based Gateway** | Route by events | ⏣ | [Event-Based Gateway](./gateways/event-gateway.md) |
| **Complex Gateway** | Advanced conditions | ⊟ | [Complex Gateway](./gateways/complex-gateway.md) |

### Event Elements

#### Start Events

| Type | Description | Use Case |
|------|-------------|----------|
| **None** | Standard start | Manual process initiation |
| **Message** | Wait for message | Event-driven processes |
| **Timer** | Time-based start | Scheduled processes |
| **Signal** | Global signal | Broadcast triggers |
| **Conditional** | Condition met | Dynamic starts |

#### Intermediate Events

| Type | Catch/Throw | Description | Documentation |
|------|-------------|-------------|---------------|
| **Message** | Both | Communication | [Intermediate Events](./events/intermediate-events.md) |
| **Timer** | Catch | Wait for time | [Intermediate Events](./events/intermediate-events.md) |
| **Signal** | Both | Broadcast | [Intermediate Events](./events/intermediate-events.md) |
| **Conditional** | Catch | Wait for condition | [Intermediate Events](./events/intermediate-events.md) |
| **Error** | Catch | Exception handling | [Intermediate Events](./events/intermediate-events.md) |
| **Link** | Both | Internal jumps | [Intermediate Events](./events/intermediate-events.md) |
| **Compensate** | Throw | Compensation | [Intermediate Events](./events/intermediate-events.md) |
| **Escalation** | Both | Escalation | [Intermediate Events](./events/intermediate-events.md) |

#### End Events

| Type | Description | Use Case | Documentation |
|------|-------------|----------|---------------|
| **None** | Normal completion | Standard end | [End Event](./events/end-event.md) |
| **Error** | End with error | Exception end | [End Event](./events/end-event.md) |
| **Signal** | Send signal | Notification | [End Event](./events/end-event.md) |
| **Message** | Send message | Communication | [End Event](./events/end-event.md) |
| **Terminate** | End all | Force termination | [End Event](./events/end-event.md) |

#### Boundary Events

| Type | Interrupting | Description | Documentation |
|------|--------------|-------------|---------------|
| **Error** | Yes | Exception handling | [Boundary Event](./events/boundary-event.md) |
| **Timer** | Both | Timeout handling | [Boundary Event](./events/boundary-event.md) |
| **Message** | Both | External trigger | [Boundary Event](./events/boundary-event.md) |
| **Signal** | Both | Global event | [Boundary Event](./events/boundary-event.md) |
| **Compensate** | No | Compensation | [Boundary Event](./events/boundary-event.md) |

### SubProcess Elements

| Element | Description | Documentation |
|---------|-------------|---------------|
| **Regular SubProcess** | Embedded flow | [Regular SubProcess](./subprocesses/regular-subprocess.md) |
| **Event SubProcess** | Event-triggered | [Event SubProcess](./subprocesses/event-subprocess.md) |
| **Ad-hoc SubProcess** | Arbitrary order | [Ad-hoc SubProcess](./subprocesses/adhoc-subprocess.md) |
| **Transaction** | Atomic unit | [Transaction](./subprocesses/transaction.md) |

### Data Elements

| Element | Description |
|---------|-------------|
| **Data Object** | Process data |
| **Data Store** | External data |
| **Input Data** | Activity input |
| **Output Data** | Activity output |
| **Data Association** | Data flow |

### Artifact Elements

| Element | Description |
|---------|-------------|
| **Group** | Visual grouping |
| **Annotation** | Documentation |
| **Association** | Relationships |
| **Lane** | Swimlane division |
| **Pool** | Participant separation |

## 🔧 Common Activiti Extensions

### Available on All Activities

| Extension | Description | Example |
|-----------|-------------|---------|
| **async** | Background execution | `activiti:async="true"` |
| **exclusive** | Locking mode | `activiti:exclusive="true"` |
| **skipExpression** | Conditional skip | `activiti:skipExpression="${flag}"` |
| **executionListener** | Lifecycle hooks | `<activiti:executionListener/>` |
| **multiInstance** | Iteration | `<multiInstanceLoopCharacteristics/>` |
| **boundaryEvents** | Exception handling | `<boundaryEvent/>` |
| **extensionElements** | Custom metadata | `<extensionElements/>` |

**Note:** Job expiry and priority are configured via Management Service at runtime, not through BPMN attributes.

### User Task Extensions

| Extension | Description |
|-----------|-------------|
| **assignee** | Direct assignment |
| **owner** | Task owner |
| **candidateUsers** | Potential users |
| **candidateGroups** | Potential groups |
| **formKey** | Form integration |
| **dueDate** | Deadline |
| **priority** | Importance |
| **taskListener** | Task lifecycle |
| **formProperty** | Form fields |

### Service Task Extensions

| Extension | Description |
|-----------|-------------|
| **class** | Java class |
| **delegateExpression** | Spring bean |
| **expression** | EL/SpEL |
| **resultVariable** | Output variable |
| **field** | Dependency injection |
| **type** | Connector type |
| **operationRef** | Operation reference |

### Script Task Extensions

| Extension | Description |
|-----------|-------------|
| **scriptFormat** | Language |
| **script** | Inline code |
| **resource** | External script |
| **resultVariable** | Output |

## 📋 Quick Comparison

### Task Selection Guide

| Use Case | Recommended Element |
|----------|-------------------|
| Human approval | User Task |
| API call | Service Task (class/delegate) |
| Simple calculation | Script Task |
| Business rules | Business Rule Task (DMN) |
| External system | Service Task (connector) |
| Email sending | Service Task (mail) |
| Sub-process | Call Activity |
| Manual work | Manual Task |

### Gateway Selection Guide

| Decision Type | Recommended Gateway |
|---------------|-------------------|
| If-then-else | Exclusive Gateway |
| Parallel work | Parallel Gateway |
| Multiple options | Inclusive Gateway |
| Event-based | Event-Based Gateway |
| Complex logic | Complex Gateway |

### Event Selection Guide

| Trigger Type | Recommended Event |
|--------------|------------------|
| External message | Message Event |
| Time-based | Timer Event |
| Global broadcast | Signal Event |
| Condition | Conditional Event |
| Exception | Error Event |
| Timeout | Timer Boundary Event |

## 🔍 Feature Matrix

| Feature | User Task | Service Task | Script Task | Gateway | Event |
|---------|-----------|--------------|-------------|---------|-------|
| Async Execution | ✅ | ✅ | ✅ | ❌ | ✅ (catch) |
| Multi-Instance | ✅ | ✅ | ✅ | ❌ | ❌ |
| Boundary Events | ✅ | ✅ | ✅ | ❌ | ❌ |
| Execution Listeners | ✅ | ✅ | ✅ | ✅ | ✅ |
| Skip Expression | ✅ | ✅ | ✅ | ❌ | ❌ |
| Field Injection | ❌ | ✅ | ❌ | ❌ | ❌ |
| Form Integration | ✅ | ❌ | ❌ | ❌ | ❌ |
| Retry Configuration | ❌ | ✅ | ✅ | ❌ | ❌ |

## 📚 Documentation Navigation

### By Element Type

- **[Tasks](./elements/)** - Work-performing elements
  - [User Task](./elements/user-task.md)
  - [Service Task](./elements/service-task.md)
  - [Script Task](./elements/script-task.md)
  - [Business Rule Task](./elements/business-rule-task.md)
  - [Manual Task](./elements/manual-task.md)
  - [Call Activity](./elements/call-activity.md)

- **[Gateways](./gateways/)** - Flow control elements
  - [Exclusive Gateway](./gateways/exclusive-gateway.md)
  - [Parallel Gateway](./gateways/parallel-gateway.md)
  - [Inclusive Gateway](./gateways/inclusive-gateway.md)
  - [Event-Based Gateway](./gateways/event-gateway.md)
  - [Complex Gateway](./gateways/complex-gateway.md)
  - [Gateway Overview](./gateways/index.md) - All gateway types comparison

- **[Events](./events/)** - Trigger elements
  - [Start Event](./events/start-event.md)
  - [Intermediate Events](./events/intermediate-events.md)
  - [End Event](./events/end-event.md)
  - [Boundary Event](./events/boundary-event.md)

- **[SubProcesses](./subprocesses/)** - Container elements
  - [Regular SubProcess](./subprocesses/regular-subprocess.md)
  - [Event SubProcess](./subprocesses/event-subprocess.md)
  - [Ad-hoc SubProcess](./subprocesses/adhoc-subprocess.md)
  - [Transaction](./subprocesses/transaction.md)

### By Topic

- **[Common Features](./common-features.md)** - Multi-instance, listeners, etc.
- **[Process Extensions](./advanced/process-extensions.md)** - Variable mapping and configuration

## 🎯 Getting Started

1. **Read the [BPMN Overview](./index.md)** for introduction
2. **Choose your element type** from this summary
3. **Read detailed documentation** for specific elements
4. **Review examples** for practical usage
5. **Learn about [Process Extensions](./advanced/process-extensions.md)** for variable management
6. **Follow best practices** for production systems

## 🔗 Related Resources

- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [Activiti BPMN Model API](../api-reference/engine-api/bpmn-model.md)
- [Process Validation](../api-reference/engine-api/process-validation.md)

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
