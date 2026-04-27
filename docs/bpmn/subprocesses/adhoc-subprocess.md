---
sidebar_label: Ad-hoc SubProcess
slug: /bpmn/subprocesses/adhoc-subprocess
title: "Ad-hoc SubProcess"
description: "Complete guide to Ad-hoc SubProcesses in Activiti - flexible, user-driven workflow execution with arbitrary activity ordering."
---

# Ad-hoc SubProcess

Ad-hoc SubProcesses allow activities to be executed in **arbitrary order** based on user decisions or runtime conditions. Unlike regular subprocesses with fixed sequence flows, ad-hoc subprocesses provide **flexibility** for dynamic workflows.

## Overview

```xml
<adHocSubProcess id="adHocProcess" name="Flexible Process">
  <userTask id="task1" name="Review Document"/>
  <userTask id="task2" name="Approve Budget"/>
  <serviceTask id="task3" name="Send Notification"/>
  
  <completionCondition>${completedTasks >= 2}</completionCondition>
</adHocSubProcess>
```

**BPMN 2.0 Standard:** Fully Supported

The `AdhocSubProcess` model class in Activiti has two standard BPMN 2.0 attributes:
- **`ordering`** (default: `Parallel`) — controls whether activities execute in parallel or sequentially
- **`cancelRemainingInstances`** (default: `true`) — whether unfinished activities are cancelled when the subprocess completes

## Key Features

### Standard BPMN Features
- **Arbitrary Execution Order** - No fixed sequence
- **Activity Selection** - Users choose which activities to execute
- **Completion Condition** - Define when subprocess completes
- **Parallel/Sequential Execution** - Controlled by `ordering` attribute

## Configuration Options

### 1. Basic Ad-hoc SubProcess

Simple ad-hoc subprocess with multiple activities:

```xml
<process id="flexibleProcess" name="Flexible Process">
  <startEvent id="start"/>
  
  <adHocSubProcess id="adHocTasks" name="Complete Required Tasks">
    <!-- Users can complete these tasks in any order -->
    <userTask id="reviewDoc" name="Review Documentation" activiti:assignee="${reviewer}"/>
    
    <userTask id="approveBudget" name="Approve Budget" activiti:assignee="${approver}"/>
    
    <serviceTask id="sendEmail" name="Send Notification Email" activiti:class="com.example.EmailService"/>
    
    <serviceTask id="updateStatus" name="Update System Status" activiti:class="com.example.StatusUpdater"/>
    
    <!-- Completion condition: at least 2 tasks must be completed -->
    <completionCondition>${completedTasks >= 2}</completionCondition>
  </adHocSubProcess>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="adHocTasks"/>
  <sequenceFlow id="flow2" sourceRef="adHocTasks" targetRef="end"/>
</process>
```

**Behavior:**
- All 4 tasks are available from the start
- Users can complete them in any order
- Subprocess completes when 2 or more tasks are done
- Remaining tasks become unavailable

### 2. Ad-hoc SubProcess with Parallel Execution

The default behavior is parallel (`ordering="Parallel"`), allowing multiple activities to run simultaneously:

```xml
<adHocSubProcess id="parallelAdHoc" name="Parallel Tasks" ordering="Parallel">
  <userTask id="basicReview" name="Basic Review" activiti:assignee="${reviewer}"/>

  <userTask id="seniorApproval" name="Senior Approval" activiti:assignee="${seniorManager}"/>

  <serviceTask id="customsProcessing" name="Process Customs" activiti:class="com.example.CustomsService"/>

  <userTask id="finalSignoff" name="Final Sign-off" activiti:assignee="${director}"/>

  <completionCondition>${allRequiredTasksCompleted}</completionCondition>
</adHocSubProcess>
```

**Behavior:**
- All activities can be started and run simultaneously
- Any number of activities can be active at the same time
- Completion based on custom condition

### 3. Ad-hoc SubProcess with Sequential Activities

Execute activities one at a time using the `ordering` attribute:

```xml
<adHocSubProcess id="sequentialAdHoc" name="Sequential Flexible Process" ordering="Sequential" cancelRemainingInstances="true">
  
  <userTask id="phase1Task" name="Phase 1 Task" activiti:assignee="${phase1User}"/>
  
  <userTask id="phase2Task" name="Phase 2 Task" activiti:assignee="${phase2User}"/>
  
  <userTask id="phase3Task" name="Phase 3 Task" activiti:assignee="${phase3User}"/>
  
  <completionCondition>${phase3Completed}</completionCondition>
</adHocSubProcess>
```

**Behavior:**
- Only one activity can be active at a time
- Next activity is chosen by the user from available (non-completed) activities
- Subprocess completes when the completion condition evaluates to true

### 4. Ad-hoc SubProcess with Multiple Completion Conditions

Complex completion logic:

```xml
<adHocSubProcess id="complexAdHoc" name="Complex Completion">
  <userTask id="taskA" name="Task A"/>
  <userTask id="taskB" name="Task B"/>
  <userTask id="taskC" name="Task C"/>
  <userTask id="taskD" name="Task D"/>
  
  <!-- Complete if: (A and B) OR (C and D) OR all tasks -->
  <completionCondition>
    ${(taskACompleted && taskBCompleted) || 
     (taskCCompleted && taskDCompleted) || 
     (taskACompleted && taskBCompleted && taskCCompleted && taskDCompleted)}
  </completionCondition>
</adHocSubProcess>
```

### 5. Ad-hoc SubProcess with Cancel Behavior

Control whether remaining activities are cancelled when the subprocess completes using the `cancelRemainingInstances` attribute:

```xml
<adHocSubProcess id="cancelAdHoc" name="Ad-hoc with Cancel" cancelRemainingInstances="true">
  
  <userTask id="task1" name="Task 1"/>
  <userTask id="task2" name="Task 2"/>
  <userTask id="task3" name="Task 3"/>
  
  <completionCondition>${completedTasks >= 2}</completionCondition>
</adHocSubProcess>
```

**Behavior:**
- When completion condition is met, any unfinished activities are automatically cancelled
- Set `cancelRemainingInstances="false"` to allow remaining activities to stay available

## Complete Real-World Example

### Scenario: Project Onboarding Process

```xml
<process id="onboardingProcess" name="Employee Onboarding">
  
  <startEvent id="start"/>
  
  <adHocSubProcess id="onboardingTasks" name="Complete Onboarding" ordering="Parallel" cancelRemainingInstances="true">
    <!-- HR Tasks -->
    <userTask id="hrForm" name="Complete HR Forms" activiti:assignee="${newEmployee}" activiti:candidateGroups="hr_department"/>

    <userTask id="benefitsEnrollment" name="Enroll in Benefits" activiti:assignee="${newEmployee}"/>

    <!-- IT Tasks -->
    <serviceTask id="createAccounts" name="Create System Accounts" activiti:class="com.example.AccountCreationService" activiti:candidateGroups="it_support"/>

    <userTask id="equipmentSetup" name="Setup Equipment" activiti:assignee="${itSpecialist}" activiti:candidateGroups="it_support"/>

    <!-- Training Tasks -->
    <userTask id="safetyTraining" name="Complete Safety Training" activiti:assignee="${newEmployee}" activiti:formKey="safety-training-form"/>

    <userTask id="complianceTraining" name="Complete Compliance Training" activiti:assignee="${newEmployee}" activiti:formKey="compliance-training-form"/>

    <userTask id="roleTraining" name="Complete Role-Specific Training" activiti:assignee="${newEmployee}" activiti:candidateUsers="${trainingManager}"/>

    <!-- Manager Tasks -->
    <userTask id="managerIntro" name="Meet with Manager" activiti:assignee="${manager}" activiti:candidateUsers="${newEmployee},${manager}"/>

    <userTask id="teamIntro" name="Team Introduction" activiti:assignee="${teamLead}"/>

    <!-- Final Tasks -->
    <serviceTask id="sendWelcomeEmail" name="Send Welcome Email" activiti:class="com.example.WelcomeEmailService"/>

    <userTask id="onboardingReview" name="Onboarding Review" activiti:assignee="${hrManager}"/>

    <!-- Completion: At least 6 core tasks must be completed -->
    <completionCondition>${completedCoreTasks >= 6}</completionCondition>
  </adHocSubProcess>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="onboardingTasks"/>
  <sequenceFlow id="flow2" sourceRef="onboardingTasks" targetRef="end"/>
</process>
```

**Behavior:**
- New employee can complete tasks in any order (parallel execution)
- Different users/groups can complete different tasks
- Process completes when 6+ core tasks are done
- Remaining tasks are cancelled on completion

## Runtime API

`RuntimeService` provides **three dedicated methods** for programmatic control of ad-hoc subprocesses. These are essential when activities need to be activated by code rather than by user interaction (e.g., in headless workflows, batch processing, or automated decision-making scenarios).

### Query Available Activities

```java
// Returns the list of FlowNodes that are eligible to execute
List<FlowNode> availableActivities =
    runtimeService.getEnabledActivitiesFromAdhocSubProcess(executionId);

for (FlowNode node : availableActivities) {
    System.out.println("Available: " + node.getId() + " - " + node.getName());
}
```

In **Sequential** ordering mode, `getEnabledActivitiesFromAdhocSubProcess` returns an **empty list** if any child execution is currently active — it does not filter by completed dependencies. In **Parallel** mode (the default), all activities whose BPMN element has **zero incoming sequence flows** within the ad-hoc subprocess are returned.

### Activate a Specific Activity

```java
// Programmatically start an activity within the ad-hoc subprocess
Execution newExecution =
    runtimeService.executeActivityInAdhocSubProcess(executionId, "reviewTask");

// The returned Execution is the child execution for the newly activated activity
String newExecutionId = newExecution.getId();
```

This is the primary way to drive ad-hoc subprocesses without user interaction. The activity must be present inside the ad-hoc subprocess and must have no incoming sequence flows within the subprocess (i.e., it is a root activity of the ad-hoc subprocess).

### Force Completion

```java
// Complete the ad-hoc subprocess regardless of the completionCondition
runtimeService.completeAdhocSubProcess(executionId);
```

Bypasses `<completionCondition>` entirely. Any remaining activities are cancelled according to the `cancelRemainingInstances` attribute.

### Complete Example: Automated Decision

```java
// Find the ad-hoc subprocess execution
Execution adhocExec = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .activityId("adHocTasks")
    .singleResult();

String executionId = adhocExec.getId();

// Check what activities are available
List<FlowNode> available = runtimeService.getEnabledActivitiesFromAdhocSubProcess(executionId);

// Activate activities based on business rules
for (FlowNode node : available) {
    if (shouldExecute(node.getId())) {
        runtimeService.executeActivityInAdhocSubProcess(executionId, node.getId());
    }
}

// Force completion when all needed work is done
runtimeService.completeAdhocSubProcess(executionId);
```

### Sequential Ordering Constraints

When `ordering="Sequential"` is set on the ad-hoc subprocess, `executeActivityInAdhocSubProcess` will only succeed if previously activated activities have completed. Attempting to activate an activity while others are still running throws an exception.

```java
// Sequential mode: activityB will NOT be in getEnabledActivitiesFromAdhocSubProcess
// until activityA completes
Execution execA = runtimeService.executeActivityInAdhocSubProcess(executionId, "activityA");
// ... wait for activityA to complete ...
Execution execB = runtimeService.executeActivityInAdhocSubProcess(executionId, "activityB"); // now succeeds
```

Completion of the ad-hoc subprocess can also be driven by the `<completionCondition>` expression evaluating to true through normal task completion.

## Best Practices

1. **Clear Completion Conditions** - Make completion logic obvious
2. **Meaningful Activity Names** - Users need to understand what each task does
3. **Appropriate Conditions** - Use activity conditions to hide irrelevant tasks
4. **User Interface Design** - Provide clear UI for task selection
5. **Progress Tracking** - Show users how close they are to completion
6. **Documentation** - Explain the flexible nature of the process
7. **Testing** - Test various completion paths and scenarios

## Common Pitfalls

- **Unclear Completion** - Users don't know when process is done
- **Too Many Activities** - Overwhelming number of choices
- **Missing Conditions** - Irrelevant activities always shown
- **Complex Logic** - Hard-to-understand completion conditions
- **No Progress Indication** - Users can't track completion
- **Inconsistent Assignment** - Tasks assigned to wrong users
- **Testing Gaps** - Not testing all possible completion paths

## Use Cases

### 1. **Checklist Processes**
- Onboarding checklists
- Compliance requirements
- Quality assurance steps

### 2. **Flexible Workflows**
- Incident response
- Problem resolution
- Custom service delivery

### 3. **User-Driven Processes**
- Self-service portals
- Configuration wizards
- Setup procedures

### 4. **Parallel Task Completion**
- Multi-department approvals
- Cross-functional reviews
- Collaborative work

## Related Documentation

- [Regular SubProcess](./regular-subprocess.md) - Fixed sequence subprocesses
- [Event SubProcess](./event-subprocess.md) - Event-triggered subprocesses
- [Transaction](./transaction.md) - Atomic subprocesses
- [User Task](../elements/user-task.md) - Human-performed tasks
- [Service Task](../elements/service-task.md) - Automated tasks

---

