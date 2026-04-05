---
sidebar_label: SubProcesses
slug: /bpmn/subprocesses/index
title: "SubProcesses Overview"
description: "Complete overview of subprocess types in Activiti - Regular, Event, Ad-hoc, and Transaction subprocesses for organizing complex workflows."
---

# SubProcesses Overview

SubProcesses in BPMN allow you to **group activities** into a single, collapsible unit. They help organize complex processes into manageable chunks and promote reusability.

## Types of SubProcesses

Activiti supports four types of subprocesses:

| Type | Description | Use Case |
|------|-------------|----------|
| **Regular SubProcess** | Embedded subprocess with visible flow | Organizing related activities |
| **Event SubProcess** | Triggered by events within scope | Exception handling, compensation |
| **Ad-hoc SubProcess** | Activities in arbitrary order | Flexible, user-driven workflows |
| **Transaction** | All-or-nothing atomic unit | Ensuring data consistency |

## Documentation

- [Regular SubProcess](./regular-subprocess.md) - Embedded subprocesses
- [Event SubProcess](./event-subprocess.md) - Event-triggered subprocesses
- [Ad-hoc SubProcess](./adhoc-subprocess.md) - Flexible activity execution
- [Transaction](./transaction.md) - Atomic subprocesses

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
