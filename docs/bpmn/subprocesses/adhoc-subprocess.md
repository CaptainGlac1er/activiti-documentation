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
**Activiti Extensions:** Completion conditions, user-driven execution

## Key Features

### Standard BPMN Features
- **Arbitrary Execution Order** - No fixed sequence
- **Activity Selection** - Users choose which activities to execute
- **Completion Condition** - Define when subprocess completes
- **Parallel Execution** - Multiple activities can run simultaneously

### Activiti Extensions
- **Dynamic Activity Enabling** - Control which activities are available
- **Custom Completion Logic** - Complex completion conditions
- **Variable-Based Conditions** - Runtime evaluation
- **User Interface Integration** - Task selection UI

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

### 2. Ad-hoc SubProcess with Activity Conditions

Control which activities are enabled based on conditions:

```xml
<adHocSubProcess id="conditionalAdHoc" name="Conditional Tasks">
  <userTask id="basicReview" name="Basic Review" activiti:assignee="${reviewer}"/>
  
  <!-- Only enabled if amount > 10000 -->
  <userTask id="seniorApproval" name="Senior Approval" 
            activiti:condition="${orderAmount > 10000}"
            activiti:assignee="${seniorManager}"/>
  
  <!-- Only enabled if international order -->
  <serviceTask id="customsProcessing" name="Process Customs"
               activiti:condition="${isInternational}"
               activiti:class="com.example.CustomsService"/>
  
  <userTask id="finalSignoff" name="Final Sign-off" activiti:assignee="${director}"/>
  
  <completionCondition>${allRequiredTasksCompleted}</completionCondition>
</adHocSubProcess>
```

**Behavior:**
- `basicReview` and `finalSignoff` always available
- `seniorApproval` only available if `orderAmount > 10000`
- `customsProcessing` only available if `isInternational` is true
- Completion based on custom condition

### 3. Ad-hoc SubProcess with Sequential Activities

Prevent parallel execution of certain activities:

```xml
<adHocSubProcess id="sequentialAdHoc" name="Sequential Flexible Process">
  <properties>
    <property id="seqProp" name="sequential" value="true"/>
  </properties>
  
  <userTask id="phase1Task" name="Phase 1 Task" activiti:assignee="${phase1User}"/>
  
  <userTask id="phase2Task" name="Phase 2 Task" 
            activiti:condition="${phase1Completed}"
            activiti:assignee="${phase2User}"/>
  
  <userTask id="phase3Task" name="Phase 3 Task"
            activiti:condition="${phase2Completed}"
            activiti:assignee="${phase3User}"/>
  
  <completionCondition>${phase3Completed}</completionCondition>
</adHocSubProcess>
```

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

Define what happens to running activities when subprocess completes:

```xml
<adHocSubProcess id="cancelAdHoc" name="Ad-hoc with Cancel">
  <properties>
    <!-- Cancel remaining activities on completion -->
    <property id="cancelProp" name="cancelRemaining" value="true"/>
  </properties>
  
  <userTask id="task1" name="Task 1"/>
  <userTask id="task2" name="Task 2"/>
  <userTask id="task3" name="Task 3"/>
  
  <completionCondition>${completedTasks >= 2}</completionCondition>
</adHocSubProcess>
```

## Complete Real-World Example

### Scenario: Project Onboarding Process

```xml
<process id="onboardingProcess" name="Employee Onboarding">
  
  <startEvent id="start"/>
  
  <adHocSubProcess id="onboardingTasks" name="Complete Onboarding">
    <properties>
      <property id="seqProp" name="sequential" value="false"/>
      <property id="cancelProp" name="cancelRemaining" value="true"/>
    </properties>
    
    <!-- HR Tasks -->
    <userTask id="hrForm" name="Complete HR Forms" activiti:assignee="${newEmployee}" activiti:candidateGroups="hr_department"/>
    
    <userTask id="benefitsEnrollment" name="Enroll in Benefits" activiti:assignee="${newEmployee}" activiti:condition="${eligibleForBenefits}"/>
    
    <!-- IT Tasks -->
    <serviceTask id="createAccounts" name="Create System Accounts" activiti:class="com.example.AccountCreationService" activiti:candidateGroups="it_support"/>
    
    <userTask id="equipmentSetup" name="Setup Equipment" activiti:assignee="${itSpecialist}" activiti:candidateGroups="it_support"/>
    
    <!-- Training Tasks -->
    <userTask id="safetyTraining" name="Complete Safety Training" activiti:assignee="${newEmployee}" activiti:formKey="safety-training-form"/>
    
    <userTask id="complianceTraining" name="Complete Compliance Training" activiti:assignee="${newEmployee}" activiti:condition="${requiresCompliance}" activiti:formKey="compliance-training-form"/>
    
    <userTask id="roleTraining" name="Complete Role-Specific Training" activiti:assignee="${newEmployee}" activiti:candidateUsers="${trainingManager}"/>
    
    <!-- Manager Tasks -->
    <userTask id="managerIntro" name="Meet with Manager" activiti:assignee="${manager}" activiti:candidateUsers="${newEmployee},${manager}"/>
    
    <userTask id="teamIntro" name="Team Introduction" activiti:assignee="${teamLead}"/>
    
    <!-- Final Tasks -->
    <serviceTask id="sendWelcomeEmail" name="Send Welcome Email" activiti:class="com.example.WelcomeEmailService"/>
    
    <userTask id="onboardingReview" name="Onboarding Review" activiti:assignee="${hrManager}" activiti:condition="${allCoreTasksCompleted}"/>
    
    <!-- Completion: At least 6 core tasks must be completed -->
    <completionCondition>${completedCoreTasks >= 6}</completionCondition>
  </adHocSubProcess>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="onboardingTasks"/>
  <sequenceFlow id="flow2" sourceRef="onboardingTasks" targetRef="end"/>
</process>
```

**Behavior:**
- New employee can complete tasks in any order
- Some tasks only available based on conditions (benefits, compliance)
- Different users/groups can complete different tasks
- Process completes when 6+ core tasks are done
- Remaining tasks are cancelled on completion

## Runtime API

### Getting Available Activities

```java
// Get all enabled activities in ad-hoc subprocess
List<FlowNode> enabledActivities = runtimeService
    .getEnabledActivitiesForAdHocSubProcess(executionId);

// Get completed activities
List<String> completedActivities = runtimeService
    .getCompletedActivitiesForAdHocSubProcess(executionId);
```

### Starting Specific Activities

```java
// Start a specific activity in ad-hoc subprocess
runtimeService.executeActivityForAdHocSubProcess(
    executionId, 
    "taskA_id"  // Activity ID to start
);
```

### Completing Ad-hoc SubProcess

```java
// Manually complete ad-hoc subprocess
runtimeService.completeAdhocSubProcess(executionId);
```

### Checking Completion Status

```java
// Check if ad-hoc subprocess is complete
boolean isComplete = runtimeService.isAdHocSubProcessComplete(executionId);

// Get completion condition result
boolean conditionMet = runtimeService.evaluateAdHocCompletionCondition(executionId);
```

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

