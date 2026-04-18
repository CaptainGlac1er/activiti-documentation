---
sidebar_label: Complex Gateway
slug: /bpmn/gateways/complex-gateway
title: "Complex Gateway"
description: "Complete guide to Complex Gateways in Activiti - advanced condition-based routing with DAN, DOR, and activation/cancellation conditions."
---

# Complex Gateway

Complex Gateways provide **advanced routing logic** that combines multiple conditions and behaviors. They support **DAN (Disjunctive AND)**, **DOR (Disjunctive OR)**, and **activation/cancellation** conditions, making them suitable for sophisticated process control scenarios.

## Overview

```xml
<complexGateway id="complexGateway" name="Complex Decision"/>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Advanced condition expressions, activation/cancellation flows

## Key Features

### Standard BPMN Features
- **Multiple Conditions** - Combine AND/OR logic
- **Activation Conditions** - When to take a path
- **Cancellation Conditions** - When to cancel a path
- **DAN Behavior** - Disjunctive AND (all except one)
- **DOR Behavior** - Disjunctive OR (at least one)
- **Default Flow** - Fallback path

### Activiti Extensions
- **SpEL/EL Expressions** - Complex condition evaluation
- **Multiple Sequence Flows** - Advanced routing
- **Execution Listeners** - Lifecycle hooks
- **Variable-Based Conditions** - Dynamic evaluation

## How It Works

### Activation Conditions

Each outgoing sequence flow can have:
- **Condition Expression** - When to activate the flow
- **Cancellation Expression** - When to cancel the flow
- **Default Flow** - Taken when no other conditions match

### Complex Logic Types

| Type | Description | Example |
|------|-------------|---------|
| **DAN** | All paths except one | Take all unless condition X is false |
| **DOR** | At least one path | Take any path where condition is true |
| **Activation** | Start flow | Condition becomes true |
| **Cancellation** | Stop flow | Condition becomes false |

## Configuration Options

### 1. Basic Complex Gateway with Conditions

Simple complex routing:

```xml
<process id="complexRouting" name="Complex Routing Process">
  <startEvent id="start"/>
  
  <serviceTask id="evaluateConditions" name="Evaluate Conditions" activiti:class="com.example.ConditionEvaluator"/>
  </serviceTask>
  
  <complexGateway id="complexGateway" name="Complex Decision"/>
  
  <!-- Path A: High priority and urgent -->
  <sequenceFlow id="pathA" sourceRef="complexGateway" targetRef="taskA">
    <conditionExpression>${highPriority && urgent}</conditionExpression>
  </sequenceFlow>
  
  <!-- Path B: High priority or VIP customer -->
  <sequenceFlow id="pathB" sourceRef="complexGateway" targetRef="taskB">
    <conditionExpression>${highPriority || vipCustomer}</conditionExpression>
  </sequenceFlow>
  
  <!-- Path C: Default path -->
  <sequenceFlow id="pathC" sourceRef="complexGateway" targetRef="taskC">
    <conditionExpression>${!highPriority && !urgent}</conditionExpression>
  </sequenceFlow>
  
  <serviceTask id="taskA" name="Handle Priority A" activiti:class="com.example.TaskAHandler"/>
  </serviceTask>
  
  <serviceTask id="taskB" name="Handle Priority B" activiti:class="com.example.TaskBHandler"/>
  </serviceTask>
  
  <serviceTask id="taskC" name="Handle Priority C" activiti:class="com.example.TaskCHandler"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="evaluateConditions"/>
  <sequenceFlow id="flow2" sourceRef="evaluateConditions" targetRef="complexGateway"/>
  <sequenceFlow id="flow3" sourceRef="taskA" targetRef="end"/>
  <sequenceFlow id="flow4" sourceRef="taskB" targetRef="end"/>
  <sequenceFlow id="flow5" sourceRef="taskC" targetRef="end"/>
</process>
```

### 2. Complex Gateway with Cancellation Conditions

Activate and cancel flows dynamically:

```xml
<complexGateway id="dynamicGateway" name="Dynamic Routing">
  
  <!-- Activate when order value > 1000, cancel if payment fails -->
  <sequenceFlow id="premiumFlow" sourceRef="dynamicGateway" targetRef="premiumService">
    <conditionExpression>${orderValue > 1000}</conditionExpression>
  </sequenceFlow>
  
  <!-- Activate for international orders -->
  <sequenceFlow id="internationalFlow" sourceRef="dynamicGateway" targetRef="internationalService">
    <conditionExpression>${isInternational}</conditionExpression>
  </sequenceFlow>
  
  <!-- Default flow -->
  <sequenceFlow id="defaultFlow" sourceRef="dynamicGateway" targetRef="standardService"/>
  
</complexGateway>
```

**Note:** Cancellation conditions are evaluated continuously and can stop active flows.

### 3. DAN (Disjunctive AND) Behavior

Execute all paths except one:

```xml
<process id="danProcess" name="DAN Behavior Process">
  <startEvent id="start"/>
  
  <serviceTask id="setupContext" name="Setup Context" activiti:class="com.example.ContextSetup"/>
  </serviceTask>
  
  <complexGateway id="danGateway" name="DAN Gateway">
    <properties>
      <property id="danProp" name="dan" value="true"/>
    </properties>
  </complexGateway>
  
  <!-- Execute unless skipEmail is true -->
  <sequenceFlow id="emailFlow" sourceRef="danGateway" targetRef="sendEmail">
    <conditionExpression>${!skipEmail}</conditionExpression>
  </sequenceFlow>
  
  <!-- Execute unless skipSMS is true -->
  <sequenceFlow id="smsFlow" sourceRef="danGateway" targetRef="sendSMS">
    <conditionExpression>${!skipSMS}</conditionExpression>
  </sequenceFlow>
  
  <!-- Execute unless skipPush is true -->
  <sequenceFlow id="pushFlow" sourceRef="danGateway" targetRef="sendPush">
    <conditionExpression>${!skipPush}</conditionExpression>
  </sequenceFlow>
  
  <serviceTask id="sendEmail" name="Send Email" activiti:class="com.example.EmailService"/>
  </serviceTask>
  
  <serviceTask id="sendSMS" name="Send SMS" activiti:class="com.example.SmsService"/>
  </serviceTask>
  
  <serviceTask id="sendPush" name="Send Push" activiti:class="com.example.PushService"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="setupContext"/>
  <sequenceFlow id="flow2" sourceRef="setupContext" targetRef="danGateway"/>
  <sequenceFlow id="flow3" sourceRef="sendEmail" targetRef="end"/>
  <sequenceFlow id="flow4" sourceRef="sendSMS" targetRef="end"/>
  <sequenceFlow id="flow5" sourceRef="sendPush" targetRef="end"/>
</process>
```

**Behavior:**
- If `skipEmail=false`, `skipSMS=false`, `skipPush=true` → Email and SMS sent
- All paths execute except those explicitly skipped
- DAN = "All except"

### 4. DOR (Disjunctive OR) Behavior

Execute at least one path:

```xml
<complexGateway id="dorGateway" name="DOR Gateway">
  <properties>
    <property id="dorProp" name="dor" value="true"/>
  </properties>
  
  <sequenceFlow id="path1" sourceRef="dorGateway" targetRef="task1">
    <conditionExpression>${option1}</conditionExpression>
  </sequenceFlow>
  
  <sequenceFlow id="path2" sourceRef="dorGateway" targetRef="task2">
    <conditionExpression>${option2}</conditionExpression>
  </sequenceFlow>
  
  <sequenceFlow id="path3" sourceRef="dorGateway" targetRef="task3">
    <conditionExpression>${option3}</conditionExpression>
  </sequenceFlow>
</complexGateway>
```

**Behavior:**
- At least one path must be taken
- If multiple conditions true → Multiple paths taken
- DOR = "At least one"

## Complete Real-World Examples

### Example 1: Multi-Channel Marketing Campaign

```xml
<process id="marketingCampaign" name="Marketing Campaign">
  
  <startEvent id="start"/>
  
  <serviceTask id="analyzeCustomer" name="Analyze Customer Profile" activiti:class="com.example.CustomerAnalyzer"/>
  </serviceTask>
  
  <complexGateway id="channelGateway" name="Select Marketing Channels"/>
  
  <!-- Email campaign for engaged customers -->
  <sequenceFlow id="emailFlow" sourceRef="channelGateway" targetRef="emailCampaign">
    <conditionExpression>${customer.engaged && !customer.noEmail}</conditionExpression>
  </sequenceFlow>
  
  <!-- SMS for urgent promotions to mobile users -->
  <sequenceFlow id="smsFlow" sourceRef="channelGateway" targetRef="smsCampaign">
    <conditionExpression>${promotion.urgent && customer.hasMobile && !customer.noSMS}</conditionExpression>
  </sequenceFlow>
  
  <!-- Social media for young demographics -->
  <sequenceFlow id="socialFlow" sourceRef="channelGateway" targetRef="socialCampaign">
    <conditionExpression>${customer.age < 35 && customer.socialActive}</conditionExpression>
  </sequenceFlow>
  
  <!-- Direct mail for high-value customers -->
  <sequenceFlow id="mailFlow" sourceRef="channelGateway" targetRef="directMail">
    <conditionExpression>${customer.lifetimeValue > 10000 && customer.hasAddress}</conditionExpression>
  </sequenceFlow>
  
  <!-- Push notification for app users -->
  <sequenceFlow id="pushFlow" sourceRef="channelGateway" targetRef="pushCampaign">
    <conditionExpression>${customer.appInstalled && customer.pushEnabled}</conditionExpression>
  </sequenceFlow>
  
  <serviceTask id="emailCampaign" name="Execute Email Campaign" activiti:class="com.example.EmailCampaignService"/>
  </serviceTask>
  
  <serviceTask id="smsCampaign" name="Execute SMS Campaign" activiti:class="com.example.SmsCampaignService"/>
  </serviceTask>
  
  <serviceTask id="socialCampaign" name="Execute Social Campaign" activiti:class="com.example.SocialCampaignService"/>
  </serviceTask>
  
  <serviceTask id="directMail" name="Execute Direct Mail" activiti:class="com.example.DirectMailService"/>
  </serviceTask>
  
  <serviceTask id="pushCampaign" name="Execute Push Campaign" activiti:class="com.example.PushCampaignService"/>
  </serviceTask>
  
  <serviceTask id="trackResults" name="Track Campaign Results" activiti:class="com.example.ResultTracker"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="analyzeCustomer"/>
  <sequenceFlow id="flow2" sourceRef="analyzeCustomer" targetRef="channelGateway"/>
  <sequenceFlow id="flow3" sourceRef="emailCampaign" targetRef="trackResults"/>
  <sequenceFlow id="flow4" sourceRef="smsCampaign" targetRef="trackResults"/>
  <sequenceFlow id="flow5" sourceRef="socialCampaign" targetRef="trackResults"/>
  <sequenceFlow id="flow6" sourceRef="directMail" targetRef="trackResults"/>
  <sequenceFlow id="flow7" sourceRef="pushCampaign" targetRef="trackResults"/>
  <sequenceFlow id="flow8" sourceRef="trackResults" targetRef="end"/>
</process>
```

**Behavior:**
- Multiple channels can be selected based on customer profile
- Conditions are independent (one customer can receive email + SMS + push)
- Complex logic handles various customer attributes
- All selected channels execute in parallel

### Example 2: Risk Assessment and Approval

```xml
<process id="riskAssessment" name="Risk Assessment Process">
  
  <startEvent id="start"/>
  
  <serviceTask id="calculateRisk" name="Calculate Risk Score" activiti:class="com.example.RiskCalculator"/>
  </serviceTask>
  
  <complexGateway id="riskGateway" name="Risk-Based Routing"/>
  
  <!-- Low risk: Auto-approve -->
  <sequenceFlow id="lowRisk" sourceRef="riskGateway" targetRef="autoApprove">
    <conditionExpression>${riskScore < 30}</conditionExpression>
  </sequenceFlow>
  
  <!-- Medium risk: Manager approval -->
  <sequenceFlow id="mediumRisk" sourceRef="riskGateway" targetRef="managerApproval">
    <conditionExpression>${riskScore >= 30 && riskScore < 70}</conditionExpression>
  </sequenceFlow>
  
  <!-- High risk: Senior approval + compliance check -->
  <sequenceFlow id="highRisk" sourceRef="riskGateway" targetRef="seniorApproval">
    <conditionExpression>${riskScore >= 70}</conditionExpression>
  </sequenceFlow>
  
  <!-- Additional compliance check for large amounts -->
  <sequenceFlow id="complianceCheck" sourceRef="riskGateway" targetRef="complianceReview">
    <conditionExpression>${amount > 50000}</conditionExpression>
  </sequenceFlow>
  
  <!-- Fraud check for suspicious patterns -->
  <sequenceFlow id="fraudCheck" sourceRef="riskGateway" targetRef="fraudAnalysis">
    <conditionExpression>${suspiciousPattern || velocityCheckFailed}</conditionExpression>
  </sequenceFlow>
  
  <serviceTask id="autoApprove" name="Auto Approve" activiti:class="com.example.AutoApprovalService"/>
  </serviceTask>
  
  <userTask id="managerApproval" name="Manager Approval" activiti:assignee="${manager}"/>
  
  <userTask id="seniorApproval" name="Senior Approval" activiti:assignee="${seniorManager}"/>
  
  <serviceTask id="complianceReview" name="Compliance Review" activiti:class="com.example.ComplianceService"/>
  </serviceTask>
  
  <serviceTask id="fraudAnalysis" name="Fraud Analysis" activiti:class="com.example.FraudDetectionService"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="calculateRisk"/>
  <sequenceFlow id="flow2" sourceRef="calculateRisk" targetRef="riskGateway"/>
  <sequenceFlow id="flow3" sourceRef="autoApprove" targetRef="end"/>
  <sequenceFlow id="flow4" sourceRef="managerApproval" targetRef="end"/>
  <sequenceFlow id="flow5" sourceRef="seniorApproval" targetRef="end"/>
  <sequenceFlow id="flow6" sourceRef="complianceReview" targetRef="end"/>
  <sequenceFlow id="flow7" sourceRef="fraudAnalysis" targetRef="end"/>
</process>
```

**Behavior:**
- Risk score determines primary approval path
- Large amounts trigger additional compliance check (parallel)
- Suspicious patterns trigger fraud analysis (parallel)
- Multiple checks can run simultaneously

### Example 3: Dynamic Workflow Routing

```xml
<process id="dynamicWorkflow" name="Dynamic Workflow">
  
  <startEvent id="start"/>
  
  <userTask id="submitRequest" name="Submit Request" activiti:assignee="${requester}"/>
  
  <complexGateway id="routingGateway" name="Dynamic Routing"/>
  
  <!-- Technical review for IT requests -->
  <sequenceFlow id="techReview" sourceRef="routingGateway" targetRef="technicalReview">
    <conditionExpression>${requestType == 'TECHNICAL'}</conditionExpression>
  </sequenceFlow>
  
  <!-- Financial review for budget requests -->
  <sequenceFlow id="finReview" sourceRef="routingGateway" targetRef="financialReview">
    <conditionExpression>${requestType == 'FINANCIAL' || amount > 0}</conditionExpression>
  </sequenceFlow>
  
  <!-- Legal review for contracts -->
  <sequenceFlow id="legalReview" sourceRef="routingGateway" targetRef="legalReview">
    <conditionExpression>${requestType == 'LEGAL' || involvesContract}</conditionExpression>
  </sequenceFlow>
  
  <!-- HR review for personnel matters -->
  <sequenceFlow id="hrReview" sourceRef="routingGateway" targetRef="hrReview">
    <conditionExpression>${requestType == 'HR' || involvesPersonnel}</conditionExpression>
  </sequenceFlow>
  
  <!-- Security review for sensitive data -->
  <sequenceFlow id="securityReview" sourceRef="routingGateway" targetRef="securityReview">
    <conditionExpression>${dataSensitivity == 'HIGH' || involvesSecurity}</conditionExpression>
  </sequenceFlow>
  
  <userTask id="technicalReview" name="Technical Review" activiti:assignee="${techLead}"/>
  
  <userTask id="financialReview" name="Financial Review" activiti:assignee="${financeOfficer}"/>
  
  <userTask id="legalReview" name="Legal Review" activiti:assignee="${legalCounsel}"/>
  
  <userTask id="hrReview" name="HR Review" activiti:assignee="${hrManager}"/>
  
  <userTask id="securityReview" name="Security Review" activiti:assignee="${securityOfficer}"/>
  
  <serviceTask id="finalizeRequest" name="Finalize Request" activiti:class="com.example.RequestFinalizer"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="submitRequest"/>
  <sequenceFlow id="flow2" sourceRef="submitRequest" targetRef="routingGateway"/>
  <sequenceFlow id="flow3" sourceRef="technicalReview" targetRef="finalizeRequest"/>
  <sequenceFlow id="flow4" sourceRef="financialReview" targetRef="finalizeRequest"/>
  <sequenceFlow id="flow5" sourceRef="legalReview" targetRef="finalizeRequest"/>
  <sequenceFlow id="flow6" sourceRef="hrReview" targetRef="finalizeRequest"/>
  <sequenceFlow id="flow7" sourceRef="securityReview" targetRef="finalizeRequest"/>
  <sequenceFlow id="flow8" sourceRef="finalizeRequest" targetRef="end"/>
</process>
```

**Behavior:**
- Request can require multiple department reviews
- Each review is independent and can run in parallel
- Complex conditions determine which reviews needed
- All reviews must complete before finalization

## Runtime API

### Evaluating Complex Gateway Conditions

```java
// Get current execution at complex gateway
Execution gatewayExecution = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .activityId("routingGateway")
    .singleResult();

// Check which paths are active
List<String> activePaths = new ArrayList<>();
for (String activityId : runtimeService.getActiveActivityIds(processInstanceId)) {
    if (activityId.startsWith("review_")) {
        activePaths.add(activityId);
    }
}
```

## Best Practices

1. **Clear Conditions** - Well-documented condition logic
2. **Avoid Overlap** - Minimize conflicting conditions
3. **Default Flow** - Always include a default path
4. **Performance** - Complex conditions can impact performance
5. **Testing** - Test all condition combinations
6. **Documentation** - Document complex routing logic
7. **Simplification** - Consider if simpler gateway would work

## Common Pitfalls

- **Too Complex** - Overly complicated condition logic
- **Conflicting Conditions** - Conditions that contradict each other
- **No Default** - Process stalls if no conditions match
- **Performance** - Complex expressions evaluated frequently
- **Debugging** - Hard to trace which conditions fired
- **Maintenance** - Complex logic difficult to update
- **Testing Gaps** - Not all condition combinations tested

## Complex vs Other Gateways

| Feature          | Complex          | Exclusive        | Parallel      | Inclusive      | Event-Based   |
|------------------|------------------|------------------|---------------|----------------|---------------|
| **Logic**        | Advanced AND/OR  | XOR (one)        | AND (all)     | OR (one+)      | First event   |
| **Conditions**   | Multiple types   | Boolean          | None          | Boolean        | Event types   |
| **Cancellation** | Yes              | No               | No            | No             | Yes (events)  |
| **DAN/DOR**      | Yes              | No               | No            | No             | No            |
| **Complexity**   | High             | Low              | Low           | Medium         | Medium        |
| **Use Case**     | Advanced routing | Simple decisions | Parallel work | Optional paths | Event waiting |

## When to Use Complex Gateway

### Good Use Cases
- Multi-department approval workflows
- Dynamic routing based on multiple criteria
- DAN/DOR behavior needed
- Cancellation conditions required
- Complex business rules

### ❌ Avoid When
- Simple if-then-else logic (use Exclusive)
- All paths must execute (use Parallel)
- One or more simple conditions (use Inclusive)
- Waiting for events (use Event-Based)
- Logic can be simplified

## Related Documentation

- [Exclusive Gateway](./exclusive-gateway.md) - XOR logic (one path)
- [Parallel Gateway](./parallel-gateway.md) - AND logic (all paths)
- [Inclusive Gateway](./inclusive-gateway.md) - OR logic (one or more)
- [Event-Based Gateway](./event-gateway.md) - Event-driven routing
- [Gateway Overview](./index.md) - All gateway types

---

**Last Updated: 2026
