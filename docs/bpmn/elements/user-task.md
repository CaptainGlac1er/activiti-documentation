---
sidebar_label: User Task
title: "User Task"
slug: /bpmn/elements/user-task
description: Complete guide to UserTask elements with Activiti customizations for human interaction
---

# User Task

User Tasks represent work items that require **human interaction** in a business process. They are the primary mechanism for modeling human activities in Activiti workflows.

## Overview

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:process id="userTaskProcess" name="User Task Process"
    xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
    xmlns:activiti="http://activiti.org/bpmn">
  
  <bpmn:userTask id="task1" name="Review Document">
    <!-- Activiti customizations -->
  </bpmn:userTask>
  
</bpmn:process>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Rich customizations

## Key Features

### Standard BPMN Features
- **Name and Documentation** - Task identification
- **Input/Output Data** - Data associations
- **Multi-instance** - Parallel or sequential iterations
- **Boundary Events** - Exception handling

### Activiti Customizations
- **Assignee** - Direct task assignment
- **Owner** - Task owner (delegation support)
- **Candidate Users** - Potential task performers
- **Candidate Groups** - Groups with task access
- **Custom Identity Links** - Extended assignment logic
- **Form Key** - UI form integration
- **Due Date** - Task deadline
- **Priority** - Task importance
- **Task Listeners** - Lifecycle hooks
- **Skip Expression** - Conditional execution
- **Business Calendar** - Working time calculation
- **Category** - Task classification

## Configuration Options

### 1. Assignee

Directly assign the task to a specific user:

```xml
<userTask id="approvalTask" name="Approve Request" activiti:assignee="${managerId}"/>
```

**Expression Support:**
- Fixed value: `activiti:assignee="john.doe"`
- Expression: `activiti:assignee="${user.id}"`
- Bean Reference: `activiti:assignee="${currentUser.username}"`

**Runtime Behavior:**
- Task is immediately assigned
- The engine `TaskService` performs no assignee enforcement: `claim()` only rejects claiming a task that already has a **different** assignee (`ActivitiTaskAlreadyClaimedException`), and `complete()` does not check the assignee. Assignee/candidate visibility is enforced by the modern `TaskRuntime` API instead (claiming requires the authenticated user to be a candidate; completing requires the authenticated user to be the assignee)
- Can be changed via Task Service

### 2. Owner

Set the task owner (useful for delegation):

```xml
<userTask id="delegableTask" name="Review" activiti:owner="${requester}"/>
```

**Use Cases:**
- Delegation scenarios
- Task reassignment tracking
- Audit purposes

### 3. Candidate Users

Specify users who can claim the task (comma-separated list):

```xml
<userTask id="reviewTask" 
          name="Review Document" 
          activiti:candidateUsers="alice,bob,charlie"/>
```

**Or using expression:**
```xml
<userTask id="reviewTask" activiti:candidateUsers="${reviewers}"/>
```

**Runtime Behavior:**
- Task is unassigned initially
- Any candidate user can claim it
- Candidates can be added/removed at runtime

### 4. Candidate Groups

Assign task to groups/roles (comma-separated list):

```xml
<userTask id="approvalTask" 
          name="Manager Approval" 
          activiti:candidateGroups="managers,admins"/>
```

**Or using expression:**
```xml
<userTask id="approvalTask" activiti:candidateGroups="${approvalGroups}"/>
```

**Use Cases:**
- Role-based task assignment
- Department approvals
- Dynamic group membership

### 5. Custom Identity Links

Advanced assignment with custom types for fine-grained access control:

**Built-in Task Identity Link Types:**
Activiti provides these predefined identity link types for tasks via `IdentityLinkType`:
- `assignee` - Direct task assignee
- `candidate` - Users/groups who can claim the task
- `owner` - Task owner (for delegation)

> **Note:** `IdentityLinkType.STARTER` and `IdentityLinkType.PARTICIPANT` are **process-instance** identity link types, not task link types. `STARTER` records the user who started the process instance and `PARTICIPANT` tracks involved users; both are managed automatically by the engine. They are not set via `taskService.addUserIdentityLink(...)`.

**Runtime API for Identity Links:**
```java
import org.activiti.engine.task.IdentityLinkType;

// Add custom user identity link
taskService.addUserIdentityLink(taskId, "bob", "viewer");

// Add custom group identity link
taskService.addGroupIdentityLink(taskId, "auditors", "audit");

// Use built-in identity link types
taskService.addUserIdentityLink(taskId, "john", IdentityLinkType.ASSIGNEE);
taskService.addUserIdentityLink(taskId, "alice", IdentityLinkType.CANDIDATE);
taskService.addUserIdentityLink(taskId, "manager", IdentityLinkType.OWNER);

// Query tasks by custom identity link
List<Task> tasks = taskService.createTaskQuery()
    .taskCandidateGroup("auditors")
    .list();
```

**Use Cases:**
- Fine-grained permission control
- Audit trail tracking
- Specialized roles (viewer, commenter, approver)
- Custom access levels beyond standard candidate users/groups

**Declaring Custom Identity Links in BPMN XML:**
Custom identity links can also be declared directly in BPMN XML using the `<activiti:customResource>` extension element, which is parsed by `UserTaskXMLConverter` (`CustomIdentityLinkParser`). Each entry is expressed as `user(...)` or `group(...)` in the `formalExpression`:

```xml
<userTask id="reviewTask" name="Review">
  <extensionElements>
    <activiti:customResource activiti:name="businessAdministrator">
      <resourceAssignmentExpression>
        <formalExpression>user(kermit), group(management)</formalExpression>
      </resourceAssignmentExpression>
    </activiti:customResource>
  </extensionElements>
</userTask>
```

These links are resolved at runtime in `UserTaskActivityBehavior` and can also be added dynamically via the Task Service API (e.g. `taskService.addUserIdentityLink(taskId, "bob", "viewer")`).

### 6. Form Key

Associate a form with the task:

```xml
<userTask id="dataEntryTask" name="Enter Data" activiti:formKey="forms/data-entry-form.html"/>
```

**Form Key Types:**
- **External Form:** `activiti:formKey="http://example.com/form"`
- **Internal Resource:** `activiti:formKey="forms/my-form.html"`
- **Expression:** `activiti:formKey="${determineFormKey()}"`

**Integration:**
- Activiti Forms
- External form systems
- Dynamic form generation

### 7. Due Date

Set task deadline:

```xml
<userTask id="urgentTask" name="Urgent Review" activiti:dueDate="${addDays(now(), 3)}"/>
```

**Expression Examples:**
```xml
<!-- Fixed date -->
<userTask activiti:dueDate="2024-12-31"/>

<!-- EL Expression -->
<userTask activiti:dueDate="${dueDateCalculator.calculate()}"/>

<!-- EL Expression -->
<userTask activiti:dueDate="${calendar.addDays(new Date(), 7)}"/>
```

### 8. Priority

Set task priority:

```xml
<userTask id="highPriorityTask" name="Critical Issue" activiti:priority="${calculatePriority()}"/>
```

**Default:** 0 (`Task.DEFAULT_PRIORITY`)

### 9. Business Calendar

Define working time calculations:

```xml
<userTask id="workingDaysTask" name="Review" 
          activiti:dueDate="${addBusinessDays(3)}"
          activiti:businessCalendarName="standard"/>
```

**Use Cases:**
- Exclude weekends
- Exclude holidays
- Custom working hours

### 10. Category

Classify tasks:

```xml
<userTask id="approvalTask" name="Approve" activiti:category="approval"/>
```

**Runtime Usage:**
```java
// Query tasks by category
List<Task> tasks = taskService.createTaskQuery()
    .taskCategory("approval")
    .list();
```

## Advanced Features

### Task Listeners

Execute custom logic at task lifecycle events:

```xml
<userTask id="notifiedTask" name="Review with Notification">
  <extensionElements>
    <!-- Task creation -->
    <activiti:taskListener event="create" class="com.example.TaskCreatedListener"/>
    
    <!-- Task assignment -->
    <activiti:taskListener event="assignment" delegateExpression="${assignmentListener}"/>
    
    <!-- Task completion -->
    <activiti:taskListener event="complete" class="com.example.TaskCompletedListener">
      <activiti:field name="notificationService" expression="${emailNotificationService}"/>
    </activiti:taskListener>
  </extensionElements>
</userTask>
```

**Supported Events:**
- `create` - When task is created
- `assignment` - When the assignee changes (adding/removing candidates does not fire this event)
- `complete` - When task is completed
- `delete` - When task is deleted
- `all` - All of the above events

**Listener Types:**
1. **Class:** `class="com.example.ListenerClass"`
2. **Delegate Expression:** `delegateExpression="${beanName}"`
3. **Expression:** `expression="${methodCall()}"`

**TaskListener Interface:**
```java
public interface TaskListener {
    void notify(DelegateTask delegateTask);
}
```

**Example Implementation:**
```java
public class TaskCreatedListener implements TaskListener {
    @Override
    public void notify(DelegateTask task) {
        // Send notification
        // Set additional variables
        // Log creation
        System.out.println("Task created: " + task.getName());
    }
}
```

### Skip Expression

Conditionally skip task execution:

```xml
<userTask id="optionalReview" name="Optional Review" 
          activiti:skipExpression="${skipOptionalReview || userIsManager}"/>
```

**Runtime Behavior:**
- If expression evaluates to `true`, task is skipped
- Process continues to next activity
- Useful for conditional workflows

### Multi-Instance User Tasks

Execute task for multiple users:

**Using Collection (Activiti Extension - Recommended):**
```xml
<userTask id="groupReview" name="Group Review">
  <multiInstanceLoopCharacteristics 
    isSequential="false" 
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
    <completionCondition>${reviewCount >= requiredApprovals}</completionCondition>
  </multiInstanceLoopCharacteristics>
</userTask>
```

**Using Loop Cardinality (BPMN Standard):**
```xml
<userTask id="groupReview" name="Group Review">
  <multiInstanceLoopCharacteristics isSequential="false">
    <loopCardinality>${reviewers.size()}</loopCardinality>
    <completionCondition>${reviewCount >= requiredApprovals}</completionCondition>
  </multiInstanceLoopCharacteristics>
</userTask>
```

**Configuration:**
- `isSequential="true"` - One instance at a time
- `isSequential="false"` - Parallel instances
- `activiti:collection` - Collection to iterate (Activiti extension)
- `activiti:elementVariable` - Variable name for current element
- `loopCardinality` - Number of iterations (BPMN standard)
- `completionCondition` - When to complete multi-instance

**Built-in Multi-Instance Variables:**
- `nrOfInstances` - Total number of instances
- `nrOfCompletedInstances` - Number of completed instances
- `loopCounter` - Current iteration counter (set for each instance, in both sequential and parallel multi-instance)
- `elementVariable` - Current element from collection (if specified)

**Multi-Instance Data Items (Not Parsed):**

BPMN-standard `<inputDataItem>`/`<outputDataItem>` data associations (including `<assignment><from>/<to>`) are **not parsed** by the engine — they are silently ignored. Multi-instance iteration is driven solely by the `activiti:collection` and `activiti:elementVariable` attributes (plus `completionCondition`):

```xml
<userTask id="reviewTask" name="Review">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
    <completionCondition>${reviewCount >= requiredApprovals}</completionCondition>
  </multiInstanceLoopCharacteristics>
</userTask>
```

> **Warning:** If an `<inputDataItem name="...">` element is present, its `name` attribute **is** parsed and silently **overrides** `activiti:elementVariable`. Don't add `inputDataItem`/`outputDataItem` elements to multi-instance characteristics (the `collection` attribute of `outputDataItem` is also ignored).

### Form Properties

Define form fields:

```xml
<userTask id="dataEntry" name="Enter Information" activiti:formKey="dataEntryForm">
  <extensionElements>
    <activiti:formProperty name="firstName" type="string" required="true"/>
    <activiti:formProperty name="age" type="int" required="false" default="0"/>
    <activiti:formProperty name="email" type="string" required="true"/>
    <activiti:formProperty name="department" type="string">
      <activiti:value id="eng" name="Engineering"/>
      <activiti:value id="mkt" name="Marketing"/>
      <activiti:value id="sales" name="Sales"/>
    </activiti:formProperty>
    <activiti:formProperty name="joinDate" type="date"/>
    <activiti:formProperty name="salary" type="double"/>
    <activiti:formProperty name="active" type="bool" default="true"/>
  </extensionElements>
</userTask>
```

**Property Types:**
- `string` - Text input
- `int` - Integer
- `long` - Long integer
- `double` - Decimal number
- `bool` - Boolean
- `date` - Date
- `enum` - Enumerated values

> **Note:** The `<activiti:formProperty>` feature is a **legacy** mechanism. The BPMN converter parses `formProperty` elements into the process model, but this engine version does not execute them at runtime (there is no form-type registry in the engine). Types such as `dateselection`, `timeselection`, `datetimeselection`, `user`, and `group` are legacy Activiti/Flowable form types that are not present in this codebase. For modern UI integration, prefer a `formKey` and an external form system. Also note that `<activiti:value>` **text content is not read** — only the `id` and `name` attributes are parsed, so write values as attributes (e.g., `<activiti:value id="eng" name="Engineering"/>`).

## Complete Examples

### Example 1: Simple Approval Task

```xml
<userTask id="approveRequest" 
          name="Approve Request" 
          activiti:assignee="${requestManager}"
          activiti:candidateGroups="approvers"
          activiti:dueDate="${addDays(now(), 5)}"
          activiti:priority="70"
          activiti:formKey="approval-form"
          activiti:category="approval">
  
  <extensionElements>
    <activiti:taskListener event="create" class="com.example.ApprovalNotificationListener"/>
    <activiti:taskListener event="complete" delegateExpression="${approvalAuditListener}"/>
    
    <activiti:formProperty name="approvalReason" type="string" required="true"/>
    <activiti:formProperty name="approvedAmount" type="double"/>
  </extensionElements>
</userTask>
```

### Example 2: Multi-Reviewer Task

```xml
<userTask id="peerReview" 
          name="Peer Review" 
          activiti:candidateUsers="${reviewers}"
          activiti:skipExpression="${skipPeerReview}">
  
  <!-- Data associations are not parsed - iteration is driven by activiti:collection + activiti:elementVariable -->
  <multiInstanceLoopCharacteristics 
    isSequential="false" 
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
    <completionCondition>${reviewResults.size() >= minReviewsRequired}</completionCondition>
  </multiInstanceLoopCharacteristics>
  
  <extensionElements>
    <activiti:formProperty name="reviewComment" type="string"/>
    <activiti:formProperty name="rating" type="int">
      <activiti:value id="1" name="1"/>
      <activiti:value id="2" name="2"/>
      <activiti:value id="3" name="3"/>
      <activiti:value id="4" name="4"/>
      <activiti:value id="5" name="5"/>
    </activiti:formProperty>
  </extensionElements>
</userTask>
```

### Example 3: Delegatable Task with Boundary Event

```xml
<userTask id="managerTask" name="Manager Delegation">
  <extensionElements>
    <activiti:taskListener event="create" class="com.example.DelegationListener"/>
  </extensionElements>
</userTask>

<boundaryEvent id="escalationTimer" attachedToRef="managerTask" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT24H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

## Runtime API Usage

### Querying User Tasks

```java
// Get tasks for current user
List<Task> myTasks = taskService.createTaskQuery()
    .taskAssignee("john.doe")
    .list();

// Get candidate tasks
List<Task> candidateTasks = taskService.createTaskQuery()
    .taskCandidateUser("john.doe")
    .list();

// Get tasks by group
List<Task> groupTasks = taskService.createTaskQuery()
    .taskCandidateGroup("managers")
    .list();

// Get overdue tasks
List<Task> overdueTasks = taskService.createTaskQuery()
    .taskDueBefore(new Date())
    .list();
```

### Task Assignment

```java
// Assign task
taskService.setAssignee(taskId, "john.doe");

// Add candidate user
taskService.addCandidateUser(taskId, "alice");

// Add candidate group
taskService.addCandidateGroup(taskId, "reviewers");

// Claim task (if you're a candidate)
taskService.claim(taskId, "john.doe");

// Unclaim (release) the task
taskService.unclaim(taskId);
```

### Completing Tasks

```java
// Complete with variables
taskService.complete(taskId, Map.of(
    "approved", true,
    "reason", "Looks good"
));

// Complete without variables
taskService.complete(taskId);
```

## Best Practices

1. **Use Expressions:** Leverage EL for dynamic assignments
2. **Set Due Dates:** Always define deadlines for time-sensitive tasks
3. **Add Listeners:** Use task listeners for notifications and auditing
4. **Form Integration:** Define form properties for consistent UI
5. **Categories:** Use categories for task filtering and reporting
6. **Skip Expressions:** Implement conditional logic for flexibility
7. **Multi-Instance:** Use for group approvals and reviews
8. **Boundary Events:** Add timeout handling for long-running tasks

## Common Pitfalls

- **No Assignee or Candidates:** Task cannot be claimed
- **Hard-coded Values:** Use expressions for flexibility
- **Missing Form Key:** UI integration may fail
- **Complex Skip Expressions:** Can make process hard to understand
- **Too Many Listeners:** Performance impact

## Related Documentation

- [Task Service API](../../api-reference/engine-api/task-service.md)
- [Service Task](./service-task.md)
- [Manual Task](./manual-task.md)
- [Multi-Instance](../reference/multi-instance.md)
- [Execution Listeners](../reference/execution-listeners.md)

---

