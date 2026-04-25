---
sidebar_label: Process Definition Authorization
slug: /advanced/process-definition-authorization
title: "Process Definition Candidate Starters and Authorization"
description: "Controlling who can start a process definition using candidate starter users and groups."
---

# Process Definition Candidate Starters

Candidate starters authorize specific users or groups to start a process definition. This is distinct from task-level identity links and provides a security layer at process-start time.

## API

```java
// Authorize a user to start a process definition
repositoryService.addCandidateStarterUser("processDefinitionId", "userId");

// Authorize a group to start a process definition
repositoryService.addCandidateStarterGroup("processDefinitionId", "groupId");

// Remove authorization
repositoryService.deleteCandidateStarterUser("processDefinitionId", "userId");
repositoryService.deleteCandidateStarterGroup("processDefinitionId", "groupId");

// Query authorized starters
List<IdentityLink> starters = repositoryService
    .getIdentityLinksForProcessDefinition("processDefinitionId");
```

## Use Cases

### Restricting Process Start

```java
// Only managers can start the budget approval process
ProcessDefinition def = repositoryService.createProcessDefinitionQuery()
    .processDefinitionKey("budgetApproval")
    .latestVersion()
    .singleResult();

repositoryService.addCandidateStarterGroup(def.getId(), "managers");
```

### Role-Based Process Access

```java
// HR can start onboarding, Finance can start budget review
repositoryService.addCandidateStarterGroup(hrProcessDef.getId(), "hr-team");
repositoryService.addCandidateStarterGroup(financeProcessDef.getId(), "finance-team");
```

### Dynamic Authorization

```java
// Authorize based on user's department
void authorizeUser(String userId, String department) {
    ProcessDefinition processDef = repositoryService.createProcessDefinitionQuery()
        .processDefinitionKey("expenseReport")
        .latestVersion()
        .singleResult();

    repositoryService.addCandidateStarterUser(processDef.getId(), userId);
}
```

## Candidate Starters vs Task Identity Links

| Feature | Candidate Starter | Task Identity Link |
|---------|------------------|-------------------|
| Scope | Process definition | Task instance |
| Action | Starting a process | Claiming/completing a task |
| Service | `RepositoryService` | `TaskService` / `RuntimeService` |
| Timing | Before process starts | After task is created |

```mermaid
graph TD
    subgraph DefinitionLevel["Process Definition Level"]
        DS1["addCandidateStarterUser()"]
        DS2["addCandidateStarterGroup()"]
        DS3["Controls who can START the process"]
        DS1 --> DS3
        DS2 --> DS3
    end
    subgraph TaskLevel["Task Instance Level"]
        TS1["addCandidateUser()"]
        TS2["addCandidateGroup()"]
        TS3["Controls who can CLAIM the task"]
        TS1 --> TS3
        TS2 --> TS3
    end
```

## Related Documentation

- [Process-Level Identity Links](./process-identity-links.md) — Runtime identity management
- [Task Service API](../../api-reference/engine-api/task-service.md) — Task identity links
