---
sidebar_label: User Task
slug: /bpmn/elements/user-task
description: Complete guide to UserTask elements with Activiti customizations for human interaction
---

# User Task

User Tasks represent work items that require **human interaction** in a business process. They are the primary mechanism for modeling human activities in Activiti workflows.

## 📋 Overview

```xml
<userTask id="task1" name="Review Document">
  <!-- Activiti customizations -->
</userTask>
```

**BPMN 2.0 Standard:** ✅ Fully Supported  
**Activiti Extensions:** ✅ Rich customizations

## 🎯 Key Features

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

## 📝 Configuration Options

### 1. Assignee

Directly assign the task to a specific user:

```xml
<UserTask id="approvalTask" name="Approve Request" activiti:assignee="${managerId}"/>
```

**Expression Support:**
- Fixed value: `activiti:assignee="john.doe"`
- EL Expression: `activiti:assignee="${user.id}"`
- SpEL Expression: `activiti:assignee="#{currentUser.username}"`

**Runtime Behavior:**
- Task is immediately assigned
- Only the assignee can claim/complete the task
- Can be changed via Task Service

### 2. Owner

Set the task owner (useful for delegation):

```xml
<UserTask id="delegableTask" name="Review" activiti:owner="${requester}"/>
```

**Use Cases:**
- Delegation scenarios
- Task reassignment tracking
- Audit purposes

### 3. Candidate Users

Specify users who can claim the task (comma-separated list):

```xml
<UserTask id="reviewTask" 
          name="Review Document" 
          activiti:candidateUsers="alice,bob,charlie"/>
```

**Or using expression:**
```xml
<UserTask id="reviewTask" activiti:candidateUsers="${reviewers}"/>
```

**Runtime Behavior:**
- Task is unassigned initially
- Any candidate user can claim it
- Candidates can be added/removed at runtime

### 4. Candidate Groups

Assign task to groups/roles (comma-separated list):

```xml
<UserTask id="approvalTask" 
          name="Manager Approval" 
          activiti:candidateGroups="managers,admins"/>
```

**Or using expression:**
```xml
<UserTask id="approvalTask" activiti:candidateGroups="${approvalGroups}"/>
```

**Use Cases:**
- Role-based task assignment
- Department approvals
- Dynamic group membership

### 5. Custom Identity Links

Advanced assignment with custom types for fine-grained access control:

```xml
<userTask id="complexTask" name="Complex Assignment" activiti:candidateUsers="alice">
  <extensionElements>
    <!-- Custom identity link type: viewer -->
    <activiti:customResource name="viewer">
      <resourceAssignmentExpression>
        <formalExpression>user(bob), user(carol)</formalExpression>
      </resourceAssignmentExpression>
    </activiti:customResource>
    
    <!-- Custom identity link type: commenter -->
    <activiti:customResource name="commenter">
      <resourceAssignmentExpression>
        <formalExpression>user(carol)</formalExpression>
      </resourceAssignmentExpression>
    </activiti:customResource>
    
    <!-- Custom identity link type: audit (group) -->
    <activiti:customResource name="audit">
      <resourceAssignmentExpression>
        <formalExpression>group(auditors)</formalExpression>
      </resourceAssignmentExpression>
    </activiti:customResource>
  </extensionElements>
</userTask>
```

**How It Works:**
- Each `<activiti:customResource>` defines a custom identity link type via the `name` attribute
- Inside `<formalExpression>`, use:
  - `user(username)` for individual users
  - `group(groupname)` for groups
- Multiple users/groups can be comma-separated in the expression
- Custom types are stored as maps: `getCustomUserIdentityLinks()` and `getCustomGroupIdentityLinks()`

**Custom Types:**
- `viewer` - Read-only access
- `commenter` - Can add comments
- `audit` - Audit trail access
- Any custom type defined by your application

**Runtime API:**
```java
// Add custom user identity link
taskService.addUserIdentityLink(taskId, "bob", "viewer");

// Add custom group identity link
taskService.addGroupIdentityLink(taskId, "auditors", "audit");

// Query tasks by custom identity link
List<Task> tasks = taskService.createTaskQuery()
    .taskCandidateGroup("auditors")
    .list();

// Get custom identity links
Map<String, Set<String>> customUserLinks = userTask.getCustomUserIdentityLinks();
Map<String, Set<String>> customGroupLinks = userTask.getCustomGroupIdentityLinks();
```

**Use Cases:**
- Fine-grained permission control
- Audit trail tracking
- Specialized roles (viewer, commenter, approver)
- Custom access levels beyond standard candidate users/groups

### 6. Form Key

Associate a form with the task:

```xml
<UserTask id="dataEntryTask" name="Enter Data" activiti:formKey="forms/data-entry-form.html"/>
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
<UserTask id="urgentTask" name="Urgent Review" activiti:dueDate="${addDays(now(), 3)}"/>
```

**Expression Examples:**
```xml
<!-- Fixed date -->
<UserTask activiti:dueDate="2024-12-31"/>

<!-- EL Expression -->
<UserTask activiti:dueDate="${dueDateCalculator.calculate()}"/>

<!-- SpEL Expression -->
<UserTask activiti:dueDate="#{#calendar.addDays(new Date(), 7)}"/>
```

### 8. Priority

Set task priority:

```xml
<UserTask id="highPriorityTask" name="Critical Issue" activiti:priority="${calculatePriority()}"/>
```

**Default:** 50 (range: 0-99, higher = more urgent)

### 9. Business Calendar

Define working time calculations:

```xml
<UserTask id="workingDaysTask" name="Review" 
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
<UserTask id="approvalTask" name="Approve" activiti:category="approval"/>
```

**Runtime Usage:**
```java
// Query tasks by category
List<Task> tasks = taskService.createTaskQuery()
    .taskCategory("approval")
    .list();
```

## 🔧 Advanced Features

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
- `assignment` - When assignee or candidates change
- `complete` - When task is completed

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
<UserTask id="optionalReview" name="Optional Review" 
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
<UserTask id="groupReview" name="Group Review">
  <multiInstanceLoopCharacteristics 
    isSequential="false" 
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
    <completionCondition>${reviewCount >= requiredApprovals}</completionCondition>
  </multiInstanceLoopCharacteristics>
</UserTask>
```

**Using Loop Cardinality (BPMN Standard):**
```xml
<UserTask id="groupReview" name="Group Review">
  <multiInstanceLoopCharacteristics isSequential="false">
    <loopCardinality>${reviewers.size()}</loopCardinality>
    <completionCondition>${reviewCount >= requiredApprovals}</completionCondition>
  </multiInstanceLoopCharacteristics>
</UserTask>
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
- `loopCounter` - Current iteration counter (sequential only)
- `elementVariable` - Current element from collection (if specified)

**Multi-Instance with Input/Output Data:**
```xml
<UserTask id="reviewTask" name="Review">
  <multiInstanceLoopCharacteristics 
    isSequential="false"
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
    
    <inputDataItem name="reviewerId">
      <assignment>
        <from>${reviewer}</from>
        <to>${reviewerId}</to>
      </assignment>
    </inputDataItem>
    
    <outputDataItem name="reviewResult" collection="${reviewResults}">
      <assignment>
        <from>${review}</from>
        <to>${reviewResult}</to>
      </assignment>
    </outputDataItem>
  </multiInstanceLoopCharacteristics>
</UserTask>
```

### Form Properties

Define form fields:

```xml
<userTask id="dataEntry" name="Enter Information" activiti:formKey="dataEntryForm">
  <extensionElements>
    <activiti:formProperty name="firstName" type="string" required="true"/>
    <activiti:formProperty name="age" type="int" required="false" activiti:default="0"/>
    <activiti:formProperty name="email" type="string" required="true"/>
    <activiti:formProperty name="department" type="string">
      <activiti:value>Engineering</activiti:value>
      <activiti:value>Marketing</activiti:value>
      <activiti:value>Sales</activiti:value>
    </activiti:formProperty>
    <activiti:formProperty name="joinDate" type="date"/>
    <activiti:formProperty name="salary" type="double"/>
    <activiti:formProperty name="active" type="bool" activiti:default="true"/>
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
- `dateselection` - Date picker
- `timeselection` - Time picker
- `datetimeselection` - DateTime picker
- `user` - User selection
- `group` - Group selection
- `enum` - Enumerated values

## 💡 Complete Examples

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
  
  <multiInstanceLoopCharacteristics 
    isSequential="false" 
    activiti:collection="${reviewers}"
    activiti:elementVariable="reviewer">
    <completionCondition>${reviewResults.size() >= minReviewsRequired}</completionCondition>
    
    <inputDataItem name="reviewerId">
      <assignment>
        <from>${reviewer}</from>
        <to>${reviewerId}</to>
      </assignment>
    </inputDataItem>
    
    <outputDataItem name="reviewResult" collection="${reviewResults}">
      <assignment>
        <from>${review}</from>
        <to>${reviewResult}</to>
      </assignment>
    </outputDataItem>
  </multiInstanceLoopCharacteristics>
  
  <extensionElements>
    <activiti:formProperty name="reviewComment" type="string"/>
    <activiti:formProperty name="rating" type="int">
      <activiti:value>1</activiti:value>
      <activiti:value>2</activiti:value>
      <activiti:value>3</activiti:value>
      <activiti:value>4</activiti:value>
      <activiti:value>5</activiti:value>
    </activiti:formProperty>
  </extensionElements>
</userTask>
```

### Example 3: Delegatable Task with Boundary Event

```xml
<userTask id="managerTask" 
          name="Manager Decision" 
          activiti:assignee="${managerId}"
          activiti:owner="${delegatorId}"
          activiti:dueDate="${calculateDueDate()}">
  
  <extensionElements>
    <activiti:taskListener event="assignment" class="com.example.DelegationListener"/>
  </extensionElements>
</userTask>

<!-- Boundary event is a sibling, not a child -->
<boundaryEvent id="escalationTimer" attachedToRef="managerTask" cancelActivity="true">
  <timerEventDefinition>
    <timeDuration>PT24H</timeDuration>
  </timerEventDefinition>
</boundaryEvent>
```

## 🔍 Runtime API Usage

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
    .taskDueBefore(ZonedDateTime.now())
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

// Release task
taskService.release(taskId);
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

## 📊 Best Practices

1. **Use Expressions:** Leverage EL/SpEL for dynamic assignments
2. **Set Due Dates:** Always define deadlines for time-sensitive tasks
3. **Add Listeners:** Use task listeners for notifications and auditing
4. **Form Integration:** Define form properties for consistent UI
5. **Categories:** Use categories for task filtering and reporting
6. **Skip Expressions:** Implement conditional logic for flexibility
7. **Multi-Instance:** Use for group approvals and reviews
8. **Boundary Events:** Add timeout handling for long-running tasks

## ⚠️ Common Pitfalls

- **No Assignee or Candidates:** Task cannot be claimed
- **Hard-coded Values:** Use expressions for flexibility
- **Missing Form Key:** UI integration may fail
- **Complex Skip Expressions:** Can make process hard to understand
- **Too Many Listeners:** Performance impact

## 🔗 Related Documentation

- [Task Service API](../../api-reference/engine-api/task-service.md)
- [Service Task](./service-task.md)
- [Manual Task](./manual-task.md)
- [Multi-Instance](../advanced/multi-instance.md)
- [Execution Listeners](../advanced/execution-listeners.md)

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
