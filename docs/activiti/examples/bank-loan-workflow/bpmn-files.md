---
sidebar_label: Complete BPMN Files
slug: /examples/bank-loan-workflow/bpmn-files
title: "Bank Loan Workflow - Complete BPMN Files"
description: "Complete, ready-to-deploy BPMN 2.0 XML for all four processes in the Bank Loan Workflow example."
---

# Bank Loan Workflow - Complete BPMN Files

This page contains the full BPMN 2.0 XML for all four processes in the
[Bank Loan Workflow](summary.md) example. Save each block as the
corresponding file under `src/main/resources/processes/` (or `bpmn/`) and
deploy — no further editing is required.

| File | Process ID | Entry Point |
|------|-----------|-------------|
| `loanApprovalProcess.bpmn` | `loanApprovalProcess` | Message start event (`loanApplicationReceived`) |
| `collateralValuationProcess.bpmn` | `collateralValuationProcess` | Called via `collateralCallActivity` |
| `loanDisbursementProcess.bpmn` | `loanDisbursementProcess` | Called via `disbursementCallActivity` |
| `batchInterestPostingProcess.bpmn` | `batchInterestPostingProcess` | Timer start event (cron `0 0 2 * * ?`) |

> **Note:** Variable input/output mappings for the call activities are not
> encoded in the BPMN XML — they live in the extension JSON files described
> in [Process Extensions](process-extensions.md).

## Consistency Notes

The walkthrough pages describe each element individually. To keep these
files internally consistent and deployable, the following structural rules
were applied:

1. **loanApprovalProcess** - The intake timeout path ends at
   `intakeEscalationTask` (supervisor team), which re-enters `intakeGateway`
   via its own flow (`flowToIntakeGatewayFromEscalation`); the gateway
   therefore declares two incoming flows. The committee approval task
   declares both incoming flows (direct from `creditGateway` and via
   `seniorReviewGateway`). The regulatory parallel split declares both
   incoming flows (from the collateral call activity and the no-collateral
   path).
2. **loanApprovalProcess (sub-process scoping)** - The non-cancelling
   compliance-flag boundary is attached to `creditAnalysisTask` *inside*
   `creditAssessmentSubProcess`, so its handler (`complianceReviewTask`) and
   its end event (`complianceHandledEndEvent`) must live in the same scope —
   inside the sub-process. A boundary handler can never cross a sub-process
   boundary.
3. **loanApprovalProcess (multi-instance)** - `riskApprovalTask` uses
   `activiti:collection` and `activiti:elementVariable` on the
   `bpmn:multiInstanceLoopCharacteristics` element. These attributes are read
   from the `activiti:` extension namespace by the converter (not the
   standard BPMN `<collection>` element).
4. **loanDisbursementProcess** - `disburseFundsTask` carries **two**
   interrupting boundaries (error + timer), both targeting
   `manualDisbursementTask`, which therefore declares two incoming flows.
   The inclusive gateway/join pair declares one incoming flow per branch.
5. **batchInterestPostingProcess** - `postInterestTask` is a parallel
   multi-instance service task with no completion condition — every element
   of `${accountsDue}` must complete before reconciliation runs.

## loanApprovalProcess.bpmn

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:activiti="http://activiti.org/bpmn">

  <bpmn:process id="loanApprovalProcess" name="Loan Approval Process">

    <bpmn:message id="loanApplicationMessage" name="loanApplicationReceived"/>
    <bpmn:message id="complianceFlagMessage" name="complianceFlagRaised"/>
    <bpmn:signal id="regulatoryClearanceSignal" name="regulatoryClearance"/>
    <bpmn:error id="kycScreeningErrorDef" name="KycScreeningError" errorCode="KYC001"/>

    <bpmn:startEvent id="startEvent" name="Loan Application Received">
      <bpmn:outgoing>flowToIntakeReview</bpmn:outgoing>
      <bpmn:messageEventDefinition messageRef="loanApplicationMessage"/>
    </bpmn:startEvent>

    <bpmn:userTask id="intakeReviewTask"
                   name="Intake Review"
                   activiti:candidateGroups="loanIntake">
      <bpmn:incoming>flowToIntakeReview</bpmn:incoming>
      <bpmn:outgoing>flowToIntakeGateway</bpmn:outgoing>
      <bpmn:extensionElements>
        <activiti:formProperty id="intakeNotes" name="intakeNotes" type="string"/>
      </bpmn:extensionElements>
    </bpmn:userTask>

    <bpmn:boundaryEvent id="intakeTimeoutEvent"
                        name="Intake Timeout"
                        attachedToRef="intakeReviewTask"
                        cancelActivity="true">
      <bpmn:outgoing>flowToIntakeEscalation</bpmn:outgoing>
      <bpmn:timerEventDefinition>
        <bpmn:timeDuration>PT4H</bpmn:timeDuration>
      </bpmn:timerEventDefinition>
    </bpmn:boundaryEvent>

    <bpmn:userTask id="intakeEscalationTask"
                   name="Intake Escalation"
                   activiti:candidateGroups="loanSupervisor">
      <bpmn:incoming>flowToIntakeEscalation</bpmn:incoming>
      <bpmn:outgoing>flowToIntakeGatewayFromEscalation</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="intakeGateway" name="Application Complete?">
      <bpmn:incoming>flowToIntakeGateway</bpmn:incoming>
      <bpmn:incoming>flowToIntakeGatewayFromEscalation</bpmn:incoming>
      <bpmn:outgoing>flowToKycScreening</bpmn:outgoing>
      <bpmn:outgoing>flowToApplicationIncomplete</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:serviceTask id="kycScreeningTask"
                      name="KYC &amp; AML Screening"
                      implementation="kycScreeningService"
                      activiti:async="true">
      <bpmn:incoming>flowToKycScreening</bpmn:incoming>
      <bpmn:outgoing>flowToKycGateway</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:boundaryEvent id="kycScreeningError"
                        name="KYC Engine Unavailable"
                        attachedToRef="kycScreeningTask">
      <bpmn:outgoing>flowToKycErrorHandler</bpmn:outgoing>
      <bpmn:errorEventDefinition errorRef="kycScreeningErrorDef"/>
    </bpmn:boundaryEvent>

    <bpmn:exclusiveGateway id="kycGateway" name="KYC Passed?">
      <bpmn:incoming>flowToKycGateway</bpmn:incoming>
      <bpmn:outgoing>flowToCreditAssessment</bpmn:outgoing>
      <bpmn:outgoing>flowToKycFail</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:subProcess id="creditAssessmentSubProcess" name="Credit Assessment">
      <bpmn:incoming>flowToCreditAssessment</bpmn:incoming>
      <bpmn:outgoing>flowToCreditGateway</bpmn:outgoing>

      <bpmn:startEvent id="creditAssessmentStartEvent" name="Assessment Started">
        <bpmn:outgoing>flowToPullCreditReport</bpmn:outgoing>
      </bpmn:startEvent>

      <bpmn:serviceTask id="pullCreditReportTask"
                        name="Pull Credit Report"
                        implementation="creditReportService"
                        activiti:async="true">
        <bpmn:incoming>flowToPullCreditReport</bpmn:incoming>
        <bpmn:outgoing>flowToCreditAnalysis</bpmn:outgoing>
      </bpmn:serviceTask>

      <bpmn:userTask id="creditAnalysisTask"
                     name="Credit Analysis"
                     activiti:candidateGroups="creditAnalysis"
                     activiti:dueDate="${creditAnalysisDueDate}">
        <bpmn:incoming>flowToCreditAnalysis</bpmn:incoming>
        <bpmn:outgoing>flowToCreditScoring</bpmn:outgoing>
        <bpmn:extensionElements>
          <activiti:formProperty id="riskNotes" name="riskNotes" type="string"/>
        </bpmn:extensionElements>
      </bpmn:userTask>

      <bpmn:boundaryEvent id="complianceFlagEvent"
                          name="Compliance Flag"
                          attachedToRef="creditAnalysisTask"
                          cancelActivity="false">
        <bpmn:outgoing>flowToComplianceReview</bpmn:outgoing>
        <bpmn:messageEventDefinition messageRef="complianceFlagMessage"/>
      </bpmn:boundaryEvent>

      <bpmn:userTask id="complianceReviewTask"
                     name="Compliance Review"
                     activiti:candidateGroups="complianceTeam">
        <bpmn:incoming>flowToComplianceReview</bpmn:incoming>
        <bpmn:outgoing>flowToComplianceHandledEnd</bpmn:outgoing>
      </bpmn:userTask>

      <bpmn:serviceTask id="creditScoringTask"
                        name="Compute Credit Score"
                        implementation="creditScoringService">
        <bpmn:incoming>flowToCreditScoring</bpmn:incoming>
        <bpmn:outgoing>flowToCreditAssessmentEnd</bpmn:outgoing>
      </bpmn:serviceTask>

      <bpmn:endEvent id="creditAssessmentEndEvent" name="Assessment Completed">
        <bpmn:incoming>flowToCreditAssessmentEnd</bpmn:incoming>
      </bpmn:endEvent>

      <bpmn:endEvent id="complianceHandledEndEvent" name="Compliance Review Completed">
        <bpmn:incoming>flowToComplianceHandledEnd</bpmn:incoming>
      </bpmn:endEvent>

      <bpmn:sequenceFlow id="flowToPullCreditReport" sourceRef="creditAssessmentStartEvent" targetRef="pullCreditReportTask"/>
      <bpmn:sequenceFlow id="flowToCreditAnalysis" sourceRef="pullCreditReportTask" targetRef="creditAnalysisTask"/>
      <bpmn:sequenceFlow id="flowToComplianceReview" sourceRef="complianceFlagEvent" targetRef="complianceReviewTask"/>
      <bpmn:sequenceFlow id="flowToComplianceHandledEnd" sourceRef="complianceReviewTask" targetRef="complianceHandledEndEvent"/>
      <bpmn:sequenceFlow id="flowToCreditScoring" sourceRef="creditAnalysisTask" targetRef="creditScoringTask"/>
      <bpmn:sequenceFlow id="flowToCreditAssessmentEnd" sourceRef="creditScoringTask" targetRef="creditAssessmentEndEvent"/>
    </bpmn:subProcess>

    <bpmn:exclusiveGateway id="creditGateway" name="Credit Approved?">
      <bpmn:incoming>flowToCreditGateway</bpmn:incoming>
      <bpmn:outgoing>flowToRiskApproval</bpmn:outgoing>
      <bpmn:outgoing>flowToSeniorReview</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="seniorReviewTask"
                   name="Senior Credit Review"
                   activiti:candidateGroups="seniorCreditOfficer">
      <bpmn:incoming>flowToSeniorReview</bpmn:incoming>
      <bpmn:outgoing>flowToSeniorReviewGateway</bpmn:outgoing>
      <bpmn:extensionElements>
        <activiti:formProperty id="seniorReviewApproved" name="seniorReviewApproved" type="boolean"/>
      </bpmn:extensionElements>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="seniorReviewGateway" name="Senior Approved?">
      <bpmn:incoming>flowToSeniorReviewGateway</bpmn:incoming>
      <bpmn:outgoing>flowToRiskApprovalFromSenior</bpmn:outgoing>
      <bpmn:outgoing>flowToCreditDenial</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="riskApprovalTask"
                   name="Risk Committee Approval"
                   activiti:candidateGroups="riskCommittee"
                   activiti:assignee="${approver}">
      <bpmn:incoming>flowToRiskApproval</bpmn:incoming>
      <bpmn:incoming>flowToRiskApprovalFromSenior</bpmn:incoming>
      <bpmn:outgoing>flowToCommitteeDecisionGateway</bpmn:outgoing>
      <bpmn:extensionElements>
        <activiti:formProperty id="approved" name="approved" type="boolean"/>
      </bpmn:extensionElements>
      <bpmn:multiInstanceLoopCharacteristics isSequential="true"
                                             activiti:collection="${riskApprovers}"
                                             activiti:elementVariable="approver">
        <bpmn:completionCondition>${approved == false}</bpmn:completionCondition>
      </bpmn:multiInstanceLoopCharacteristics>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="committeeDecisionGateway" name="Committee Approved?">
      <bpmn:incoming>flowToCommitteeDecisionGateway</bpmn:incoming>
      <bpmn:outgoing>flowToCollateralGateway</bpmn:outgoing>
      <bpmn:outgoing>flowToCommitteeRejection</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:exclusiveGateway id="collateralGateway" name="Collateral Required?">
      <bpmn:incoming>flowToCollateralGateway</bpmn:incoming>
      <bpmn:outgoing>flowToCollateralCall</bpmn:outgoing>
      <bpmn:outgoing>flowToRegulatorySplitNoCollateral</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:callActivity id="collateralCallActivity"
                       name="Collateral Valuation"
                       calledElement="collateralValuationProcess">
      <bpmn:incoming>flowToCollateralCall</bpmn:incoming>
      <bpmn:outgoing>flowToRegulatorySplit</bpmn:outgoing>
    </bpmn:callActivity>

    <bpmn:parallelGateway id="regulatorySplitGateway" name="">
      <bpmn:incoming>flowToRegulatorySplit</bpmn:incoming>
      <bpmn:incoming>flowToRegulatorySplitNoCollateral</bpmn:incoming>
      <bpmn:outgoing>flowToRegulatoryHold</bpmn:outgoing>
      <bpmn:outgoing>flowToPrepareDisbursement</bpmn:outgoing>
    </bpmn:parallelGateway>

    <bpmn:intermediateCatchEvent id="regulatoryHoldEvent"
                                 name="Awaiting Regulatory Clearance">
      <bpmn:incoming>flowToRegulatoryHold</bpmn:incoming>
      <bpmn:outgoing>flowToRegulatoryJoinFromHold</bpmn:outgoing>
      <bpmn:signalEventDefinition signalRef="regulatoryClearanceSignal"/>
    </bpmn:intermediateCatchEvent>

    <bpmn:serviceTask id="prepareDisbursementTask"
                      name="Prepare Disbursement"
                      implementation="disbursementPreparationService"
                      activiti:async="true">
      <bpmn:incoming>flowToPrepareDisbursement</bpmn:incoming>
      <bpmn:outgoing>flowToRegulatoryJoinFromPrepare</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:parallelGateway id="regulatoryJoinGateway" name="">
      <bpmn:incoming>flowToRegulatoryJoinFromHold</bpmn:incoming>
      <bpmn:incoming>flowToRegulatoryJoinFromPrepare</bpmn:incoming>
      <bpmn:outgoing>flowToDisbursementCall</bpmn:outgoing>
    </bpmn:parallelGateway>

    <bpmn:callActivity id="disbursementCallActivity"
                       name="Loan Disbursement"
                       calledElement="loanDisbursementProcess">
      <bpmn:incoming>flowToDisbursementCall</bpmn:incoming>
      <bpmn:outgoing>flowToLoanClosed</bpmn:outgoing>
    </bpmn:callActivity>

    <bpmn:serviceTask id="loanClosedTask"
                      name="Close Loan Case"
                      implementation="loanCaseService">
      <bpmn:incoming>flowToLoanClosed</bpmn:incoming>
      <bpmn:outgoing>flowToCompletedEnd</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:endEvent id="applicationIncompleteEndEvent" name="Application Incomplete">
      <bpmn:incoming>flowToApplicationIncomplete</bpmn:incoming>
      <bpmn:terminateEventDefinition/>
    </bpmn:endEvent>

    <bpmn:endEvent id="kycServiceErrorEndEvent" name="KYC Service Error">
      <bpmn:incoming>flowToKycErrorHandler</bpmn:incoming>
      <bpmn:terminateEventDefinition/>
    </bpmn:endEvent>

    <bpmn:endEvent id="kycFailEndEvent" name="KYC Failed">
      <bpmn:incoming>flowToKycFail</bpmn:incoming>
      <bpmn:terminateEventDefinition/>
    </bpmn:endEvent>

    <bpmn:endEvent id="creditDenialEndEvent" name="Credit Denied">
      <bpmn:incoming>flowToCreditDenial</bpmn:incoming>
      <bpmn:terminateEventDefinition/>
    </bpmn:endEvent>

    <bpmn:endEvent id="committeeRejectionEndEvent" name="Committee Rejection">
      <bpmn:incoming>flowToCommitteeRejection</bpmn:incoming>
      <bpmn:terminateEventDefinition/>
    </bpmn:endEvent>

    <bpmn:endEvent id="loanCompletedEndEvent" name="Loan Approved &amp; Disbursed">
      <bpmn:incoming>flowToCompletedEnd</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="flowToIntakeReview" sourceRef="startEvent" targetRef="intakeReviewTask"/>
    <bpmn:sequenceFlow id="flowToIntakeEscalation" sourceRef="intakeTimeoutEvent" targetRef="intakeEscalationTask"/>
    <bpmn:sequenceFlow id="flowToIntakeGateway" sourceRef="intakeReviewTask" targetRef="intakeGateway"/>
    <bpmn:sequenceFlow id="flowToIntakeGatewayFromEscalation" sourceRef="intakeEscalationTask" targetRef="intakeGateway"/>

    <bpmn:sequenceFlow id="flowToKycScreening" name="Complete"
                       sourceRef="intakeGateway" targetRef="kycScreeningTask">
      <bpmn:conditionExpression>${applicationComplete == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToApplicationIncomplete" name="Incomplete"
                       sourceRef="intakeGateway" targetRef="applicationIncompleteEndEvent">
      <bpmn:conditionExpression>${applicationComplete == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToKycGateway" sourceRef="kycScreeningTask" targetRef="kycGateway"/>
    <bpmn:sequenceFlow id="flowToKycErrorHandler" sourceRef="kycScreeningError" targetRef="kycServiceErrorEndEvent"/>

    <bpmn:sequenceFlow id="flowToCreditAssessment" name="Passed"
                       sourceRef="kycGateway" targetRef="creditAssessmentSubProcess">
      <bpmn:conditionExpression>${kycPassed == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToKycFail" name="Failed"
                       sourceRef="kycGateway" targetRef="kycFailEndEvent">
      <bpmn:conditionExpression>${kycPassed == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToCreditGateway" sourceRef="creditAssessmentSubProcess" targetRef="creditGateway"/>

    <bpmn:sequenceFlow id="flowToRiskApproval" name="Approved"
                       sourceRef="creditGateway" targetRef="riskApprovalTask">
      <bpmn:conditionExpression>${creditApproved == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToSeniorReview" name="Not Approved"
                       sourceRef="creditGateway" targetRef="seniorReviewTask">
      <bpmn:conditionExpression>${creditApproved == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToSeniorReviewGateway" sourceRef="seniorReviewTask" targetRef="seniorReviewGateway"/>

    <bpmn:sequenceFlow id="flowToRiskApprovalFromSenior" name="Approved"
                       sourceRef="seniorReviewGateway" targetRef="riskApprovalTask">
      <bpmn:conditionExpression>${seniorReviewApproved == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToCreditDenial" name="Rejected"
                       sourceRef="seniorReviewGateway" targetRef="creditDenialEndEvent">
      <bpmn:conditionExpression>${seniorReviewApproved == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToCommitteeDecisionGateway" sourceRef="riskApprovalTask" targetRef="committeeDecisionGateway"/>

    <bpmn:sequenceFlow id="flowToCollateralGateway" name="Approved"
                       sourceRef="committeeDecisionGateway" targetRef="collateralGateway">
      <bpmn:conditionExpression>${approved == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToCommitteeRejection" name="Rejected"
                       sourceRef="committeeDecisionGateway" targetRef="committeeRejectionEndEvent">
      <bpmn:conditionExpression>${approved == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToCollateralCall" name="Yes"
                       sourceRef="collateralGateway" targetRef="collateralCallActivity">
      <bpmn:conditionExpression>${hasCollateral == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToRegulatorySplitNoCollateral" name="No"
                       sourceRef="collateralGateway" targetRef="regulatorySplitGateway">
      <bpmn:conditionExpression>${hasCollateral == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToRegulatorySplit" sourceRef="collateralCallActivity" targetRef="regulatorySplitGateway"/>

    <bpmn:sequenceFlow id="flowToRegulatoryHold" sourceRef="regulatorySplitGateway" targetRef="regulatoryHoldEvent"/>
    <bpmn:sequenceFlow id="flowToPrepareDisbursement" sourceRef="regulatorySplitGateway" targetRef="prepareDisbursementTask"/>
    <bpmn:sequenceFlow id="flowToRegulatoryJoinFromHold" sourceRef="regulatoryHoldEvent" targetRef="regulatoryJoinGateway"/>
    <bpmn:sequenceFlow id="flowToRegulatoryJoinFromPrepare" sourceRef="prepareDisbursementTask" targetRef="regulatoryJoinGateway"/>

    <bpmn:sequenceFlow id="flowToDisbursementCall" sourceRef="regulatoryJoinGateway" targetRef="disbursementCallActivity"/>
    <bpmn:sequenceFlow id="flowToLoanClosed" sourceRef="disbursementCallActivity" targetRef="loanClosedTask"/>
    <bpmn:sequenceFlow id="flowToCompletedEnd" sourceRef="loanClosedTask" targetRef="loanCompletedEndEvent"/>

  </bpmn:process>
</bpmn:definitions>
```

## collateralValuationProcess.bpmn

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:activiti="http://activiti.org/bpmn">

  <bpmn:process id="collateralValuationProcess" name="Collateral Valuation Process">

    <bpmn:error id="valuationRecordingErrorDef" name="ValuationRecordingError" errorCode="VAL001"/>

    <bpmn:startEvent id="collateralStartEvent" name="Valuation Started">
      <bpmn:outgoing>flowToRunAvm</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:serviceTask id="runAutomatedValuationTask"
                      name="Run Automated Valuation"
                      implementation="automatedValuationService"
                      activiti:async="true">
      <bpmn:incoming>flowToRunAvm</bpmn:incoming>
      <bpmn:outgoing>flowToAvmGateway</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:boundaryEvent id="avmTimeoutEvent"
                        name="AVM Timeout"
                        attachedToRef="runAutomatedValuationTask"
                        cancelActivity="true">
      <bpmn:outgoing>flowToManualAppraisalFromTimeout</bpmn:outgoing>
      <bpmn:timerEventDefinition>
        <bpmn:timeDuration>PT10M</bpmn:timeDuration>
      </bpmn:timerEventDefinition>
    </bpmn:boundaryEvent>

    <bpmn:exclusiveGateway id="avmGateway" name="AVM Within Tolerance?">
      <bpmn:incoming>flowToAvmGateway</bpmn:incoming>
      <bpmn:outgoing>flowToManualAppraisal</bpmn:outgoing>
      <bpmn:outgoing>flowToRecordValuation</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="manualAppraisalTask"
                   name="Manual Appraisal"
                   activiti:candidateGroups="valuationTeam">
      <bpmn:incoming>flowToManualAppraisalFromTimeout</bpmn:incoming>
      <bpmn:incoming>flowToManualAppraisal</bpmn:incoming>
      <bpmn:outgoing>flowToRecordValuationFromManual</bpmn:outgoing>
      <bpmn:extensionElements>
        <activiti:formProperty id="appraisalValue" name="appraisalValue" type="bigdecimal"/>
      </bpmn:extensionElements>
    </bpmn:userTask>

    <bpmn:serviceTask id="recordValuationTask"
                      name="Record Collateral Value"
                      implementation="valuationRecordingService">
      <bpmn:incoming>flowToRecordValuation</bpmn:incoming>
      <bpmn:incoming>flowToRecordValuationFromManual</bpmn:incoming>
      <bpmn:outgoing>flowToValuationCompleted</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:boundaryEvent id="valuationRecordingError"
                        name="Recording Failed"
                        attachedToRef="recordValuationTask">
      <bpmn:outgoing>flowToValuationFailed</bpmn:outgoing>
      <bpmn:errorEventDefinition errorRef="valuationRecordingErrorDef"/>
    </bpmn:boundaryEvent>

    <bpmn:endEvent id="valuationFailedEndEvent" name="Valuation Failed">
      <bpmn:incoming>flowToValuationFailed</bpmn:incoming>
      <bpmn:terminateEventDefinition/>
    </bpmn:endEvent>

    <bpmn:endEvent id="valuationCompletedEndEvent" name="Valuation Completed">
      <bpmn:incoming>flowToValuationCompleted</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="flowToRunAvm" sourceRef="collateralStartEvent" targetRef="runAutomatedValuationTask"/>
    <bpmn:sequenceFlow id="flowToAvmGateway" sourceRef="runAutomatedValuationTask" targetRef="avmGateway"/>
    <bpmn:sequenceFlow id="flowToManualAppraisalFromTimeout" sourceRef="avmTimeoutEvent" targetRef="manualAppraisalTask"/>

    <bpmn:sequenceFlow id="flowToManualAppraisal" name="No"
                       sourceRef="avmGateway" targetRef="manualAppraisalTask">
      <bpmn:conditionExpression>${avmWithinTolerance == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToRecordValuation" name="Yes"
                       sourceRef="avmGateway" targetRef="recordValuationTask">
      <bpmn:conditionExpression>${avmWithinTolerance == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToRecordValuationFromManual" sourceRef="manualAppraisalTask" targetRef="recordValuationTask"/>
    <bpmn:sequenceFlow id="flowToValuationFailed" sourceRef="valuationRecordingError" targetRef="valuationFailedEndEvent"/>
    <bpmn:sequenceFlow id="flowToValuationCompleted" sourceRef="recordValuationTask" targetRef="valuationCompletedEndEvent"/>

  </bpmn:process>
</bpmn:definitions>
```

## loanDisbursementProcess.bpmn

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:activiti="http://activiti.org/bpmn">

  <bpmn:process id="loanDisbursementProcess" name="Loan Disbursement Process">

    <bpmn:error id="accountSetupErrorDef" name="AccountSetupError" errorCode="CORE001"/>
    <bpmn:error id="disbursementErrorDef" name="DisbursementError" errorCode="PAY001"/>

    <bpmn:startEvent id="disbursementStartEvent" name="Disbursement Started">
      <bpmn:outgoing>flowToSetupAccount</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:serviceTask id="setupLoanAccountTask"
                      name="Set Up Loan Account"
                      implementation="accountSetupService">
      <bpmn:incoming>flowToSetupAccount</bpmn:incoming>
      <bpmn:outgoing>flowToDisburseFunds</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:boundaryEvent id="accountSetupError"
                        name="Account Setup Failed"
                        attachedToRef="setupLoanAccountTask">
      <bpmn:outgoing>flowToManualAccountSetup</bpmn:outgoing>
      <bpmn:errorEventDefinition errorRef="accountSetupErrorDef"/>
    </bpmn:boundaryEvent>

    <bpmn:userTask id="manualAccountSetupTask"
                   name="Manual Account Setup"
                   activiti:candidateGroups="opsTeam">
      <bpmn:incoming>flowToManualAccountSetup</bpmn:incoming>
      <bpmn:outgoing>flowToDisburseFromManualSetup</bpmn:outgoing>
      <bpmn:extensionElements>
        <activiti:formProperty id="accountNumber" name="accountNumber" type="string"/>
      </bpmn:extensionElements>
    </bpmn:userTask>

    <bpmn:serviceTask id="disburseFundsTask"
                      name="Disburse Funds"
                      implementation="fundDisbursementService"
                      activiti:async="true">
      <bpmn:incoming>flowToDisburseFunds</bpmn:incoming>
      <bpmn:incoming>flowToDisburseFromManualSetup</bpmn:incoming>
      <bpmn:outgoing>flowToPostDisbursementGateway</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:boundaryEvent id="disbursementError"
                        name="Disbursement Failed"
                        attachedToRef="disburseFundsTask">
      <bpmn:outgoing>flowToManualDisbursement</bpmn:outgoing>
      <bpmn:errorEventDefinition errorRef="disbursementErrorDef"/>
    </bpmn:boundaryEvent>

    <bpmn:boundaryEvent id="disbursementTimeoutEvent"
                        name="Disbursement Timeout"
                        attachedToRef="disburseFundsTask"
                        cancelActivity="true">
      <bpmn:outgoing>flowToManualDisbursementFromTimeout</bpmn:outgoing>
      <bpmn:timerEventDefinition>
        <bpmn:timeDuration>PT5M</bpmn:timeDuration>
      </bpmn:timerEventDefinition>
    </bpmn:boundaryEvent>

    <bpmn:userTask id="manualDisbursementTask"
                   name="Manual Disbursement"
                   activiti:candidateGroups="opsTeam">
      <bpmn:incoming>flowToManualDisbursement</bpmn:incoming>
      <bpmn:incoming>flowToManualDisbursementFromTimeout</bpmn:incoming>
      <bpmn:outgoing>flowToPostDisbursementFromManual</bpmn:outgoing>
      <bpmn:extensionElements>
        <activiti:formProperty id="disbursementReference" name="disbursementReference" type="string"/>
      </bpmn:extensionElements>
    </bpmn:userTask>

    <bpmn:inclusiveGateway id="postDisbursementGateway" name="Post-Disbursement Actions">
      <bpmn:incoming>flowToPostDisbursementGateway</bpmn:incoming>
      <bpmn:incoming>flowToPostDisbursementFromManual</bpmn:incoming>
      <bpmn:outgoing>flowToIssueStatement</bpmn:outgoing>
      <bpmn:outgoing>flowToNotifyTreasury</bpmn:outgoing>
      <bpmn:outgoing>flowToUpdateCreditBureau</bpmn:outgoing>
    </bpmn:inclusiveGateway>

    <bpmn:serviceTask id="issueStatementTask"
                      name="Issue Statement"
                      implementation="statementService">
      <bpmn:incoming>flowToIssueStatement</bpmn:incoming>
      <bpmn:outgoing>flowToPostDisbursementJoinFromStatement</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:serviceTask id="notifyTreasuryTask"
                      name="Notify Treasury"
                      implementation="treasuryNotificationService">
      <bpmn:incoming>flowToNotifyTreasury</bpmn:incoming>
      <bpmn:outgoing>flowToPostDisbursementJoinFromTreasury</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:serviceTask id="updateCreditBureauTask"
                      name="Update Credit Bureau"
                      implementation="creditBureauUpdateService">
      <bpmn:incoming>flowToUpdateCreditBureau</bpmn:incoming>
      <bpmn:outgoing>flowToPostDisbursementJoinFromCreditBureau</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:inclusiveGateway id="postDisbursementJoinGateway" name="">
      <bpmn:incoming>flowToPostDisbursementJoinFromStatement</bpmn:incoming>
      <bpmn:incoming>flowToPostDisbursementJoinFromTreasury</bpmn:incoming>
      <bpmn:incoming>flowToPostDisbursementJoinFromCreditBureau</bpmn:incoming>
      <bpmn:outgoing>flowToRegisterLoan</bpmn:outgoing>
    </bpmn:inclusiveGateway>

    <bpmn:serviceTask id="loanRegisteredTask"
                      name="Register Loan in Core System"
                      implementation="coreSystemRegistrationService">
      <bpmn:incoming>flowToRegisterLoan</bpmn:incoming>
      <bpmn:outgoing>flowToDisbursementCompleted</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:endEvent id="disbursementCompletedEndEvent" name="Disbursement Completed">
      <bpmn:incoming>flowToDisbursementCompleted</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="flowToSetupAccount" sourceRef="disbursementStartEvent" targetRef="setupLoanAccountTask"/>
    <bpmn:sequenceFlow id="flowToDisburseFunds" sourceRef="setupLoanAccountTask" targetRef="disburseFundsTask"/>
    <bpmn:sequenceFlow id="flowToManualAccountSetup" sourceRef="accountSetupError" targetRef="manualAccountSetupTask"/>
    <bpmn:sequenceFlow id="flowToDisburseFromManualSetup" sourceRef="manualAccountSetupTask" targetRef="disburseFundsTask"/>

    <bpmn:sequenceFlow id="flowToManualDisbursement" sourceRef="disbursementError" targetRef="manualDisbursementTask"/>
    <bpmn:sequenceFlow id="flowToManualDisbursementFromTimeout" sourceRef="disbursementTimeoutEvent" targetRef="manualDisbursementTask"/>
    <bpmn:sequenceFlow id="flowToPostDisbursementGateway" sourceRef="disburseFundsTask" targetRef="postDisbursementGateway"/>
    <bpmn:sequenceFlow id="flowToPostDisbursementFromManual" sourceRef="manualDisbursementTask" targetRef="postDisbursementGateway"/>

    <bpmn:sequenceFlow id="flowToIssueStatement" name="Statement"
                       sourceRef="postDisbursementGateway" targetRef="issueStatementTask">
      <bpmn:conditionExpression>${issueStatement == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToNotifyTreasury" name="Treasury"
                       sourceRef="postDisbursementGateway" targetRef="notifyTreasuryTask">
      <bpmn:conditionExpression>${notifyTreasury == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToUpdateCreditBureau" name="Credit Bureau"
                       sourceRef="postDisbursementGateway" targetRef="updateCreditBureauTask">
      <bpmn:conditionExpression>${updateCreditBureau == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToPostDisbursementJoinFromStatement" sourceRef="issueStatementTask" targetRef="postDisbursementJoinGateway"/>
    <bpmn:sequenceFlow id="flowToPostDisbursementJoinFromTreasury" sourceRef="notifyTreasuryTask" targetRef="postDisbursementJoinGateway"/>
    <bpmn:sequenceFlow id="flowToPostDisbursementJoinFromCreditBureau" sourceRef="updateCreditBureauTask" targetRef="postDisbursementJoinGateway"/>

    <bpmn:sequenceFlow id="flowToRegisterLoan" sourceRef="postDisbursementJoinGateway" targetRef="loanRegisteredTask"/>
    <bpmn:sequenceFlow id="flowToDisbursementCompleted" sourceRef="loanRegisteredTask" targetRef="disbursementCompletedEndEvent"/>

  </bpmn:process>
</bpmn:definitions>
```

## batchInterestPostingProcess.bpmn

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:activiti="http://activiti.org/bpmn">

  <bpmn:process id="batchInterestPostingProcess" name="Batch Interest Posting Process">

    <bpmn:error id="extractErrorDef" name="LedgerExtractError" errorCode="LEDGER001"/>

    <bpmn:startEvent id="batchStartEvent" name="Nightly Interest Batch">
      <bpmn:outgoing>flowToFetchAccounts</bpmn:outgoing>
      <bpmn:timerEventDefinition>
        <bpmn:timeCycle>0 0 2 * * ?</bpmn:timeCycle>
      </bpmn:timerEventDefinition>
    </bpmn:startEvent>

    <bpmn:serviceTask id="fetchAccountsDueTask"
                      name="Fetch Accounts with Interest Due"
                      implementation="accountExtractService"
                      activiti:async="true">
      <bpmn:incoming>flowToFetchAccounts</bpmn:incoming>
      <bpmn:outgoing>flowToAccountsFoundGateway</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:boundaryEvent id="extractError"
                        name="Ledger Extract Failed"
                        attachedToRef="fetchAccountsDueTask">
      <bpmn:outgoing>flowToExtractErrorHandler</bpmn:outgoing>
      <bpmn:errorEventDefinition errorRef="extractErrorDef"/>
    </bpmn:boundaryEvent>

    <bpmn:exclusiveGateway id="accountsFoundGateway" name="Accounts Found?">
      <bpmn:incoming>flowToAccountsFoundGateway</bpmn:incoming>
      <bpmn:outgoing>flowToPostInterest</bpmn:outgoing>
      <bpmn:outgoing>flowToBatchNoOp</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:serviceTask id="postInterestTask"
                      name="Post Interest"
                      implementation="interestPostingService"
                      activiti:async="true"
                      activiti:failedJobRetryTimeCycle="R3/PT5M">
      <bpmn:incoming>flowToPostInterest</bpmn:incoming>
      <bpmn:outgoing>flowToReconcileBatch</bpmn:outgoing>
      <bpmn:multiInstanceLoopCharacteristics isSequential="false"
                                             activiti:collection="${accountsDue}"
                                             activiti:elementVariable="account">
      </bpmn:multiInstanceLoopCharacteristics>
    </bpmn:serviceTask>

    <bpmn:serviceTask id="reconcileBatchTask"
                      name="Reconcile Batch Totals"
                      implementation="batchReconciliationService">
      <bpmn:incoming>flowToReconcileBatch</bpmn:incoming>
      <bpmn:outgoing>flowToReconciliationGateway</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:exclusiveGateway id="reconciliationGateway" name="Reconciled?">
      <bpmn:incoming>flowToReconciliationGateway</bpmn:incoming>
      <bpmn:outgoing>flowToGenerateReport</bpmn:outgoing>
      <bpmn:outgoing>flowToBatchFailed</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:serviceTask id="generateBatchReportTask"
                      name="Generate Batch Report"
                      implementation="batchReportService">
      <bpmn:incoming>flowToGenerateReport</bpmn:incoming>
      <bpmn:outgoing>flowToEmailReport</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:serviceTask id="emailBatchReportTask"
                      name="Email Report to Finance Team"
                      implementation="batchReportEmailService">
      <bpmn:incoming>flowToEmailReport</bpmn:incoming>
      <bpmn:outgoing>flowToBatchCompleted</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:endEvent id="batchAbortedEndEvent" name="Batch Aborted">
      <bpmn:incoming>flowToExtractErrorHandler</bpmn:incoming>
      <bpmn:terminateEventDefinition/>
    </bpmn:endEvent>

    <bpmn:endEvent id="batchNoOpEndEvent" name="Nothing to Do">
      <bpmn:incoming>flowToBatchNoOp</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:endEvent id="batchFailedEndEvent" name="Batch Failed">
      <bpmn:incoming>flowToBatchFailed</bpmn:incoming>
      <bpmn:terminateEventDefinition/>
    </bpmn:endEvent>

    <bpmn:endEvent id="batchCompletedEndEvent" name="Batch Completed">
      <bpmn:incoming>flowToBatchCompleted</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="flowToFetchAccounts" sourceRef="batchStartEvent" targetRef="fetchAccountsDueTask"/>
    <bpmn:sequenceFlow id="flowToExtractErrorHandler" sourceRef="extractError" targetRef="batchAbortedEndEvent"/>
    <bpmn:sequenceFlow id="flowToAccountsFoundGateway" sourceRef="fetchAccountsDueTask" targetRef="accountsFoundGateway"/>

    <bpmn:sequenceFlow id="flowToPostInterest" name="Yes"
                       sourceRef="accountsFoundGateway" targetRef="postInterestTask">
      <bpmn:conditionExpression>${accountsFound == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToBatchNoOp" name="No"
                       sourceRef="accountsFoundGateway" targetRef="batchNoOpEndEvent">
      <bpmn:conditionExpression>${accountsFound == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToReconcileBatch" sourceRef="postInterestTask" targetRef="reconcileBatchTask"/>
    <bpmn:sequenceFlow id="flowToReconciliationGateway" sourceRef="reconcileBatchTask" targetRef="reconciliationGateway"/>

    <bpmn:sequenceFlow id="flowToGenerateReport" name="Yes"
                       sourceRef="reconciliationGateway" targetRef="generateBatchReportTask">
      <bpmn:conditionExpression>${batchReconciled == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToBatchFailed" name="No"
                       sourceRef="reconciliationGateway" targetRef="batchFailedEndEvent">
      <bpmn:conditionExpression>${batchReconciled == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flowToEmailReport" sourceRef="generateBatchReportTask" targetRef="emailBatchReportTask"/>
    <bpmn:sequenceFlow id="flowToBatchCompleted" sourceRef="emailBatchReportTask" targetRef="batchCompletedEndEvent"/>

  </bpmn:process>
</bpmn:definitions>
```

## Deployment Checklist

- All four files sit under the auto-deployment prefix (default `classpath*:**/processes/`) and are deployed at startup under the default deployment name `SpringAutoDeployment`
- Extension sidecars (`<name>-extensions.json`) must sit **next to** their BPMN file
- The async executor must be enabled (default: `spring.activiti.async-executor-activate=true`) for the async service tasks, the timer start, and the job retry cycle
- Spring Security users/groups must exist for the candidate groups (`loanIntake`, `loanSupervisor`, `creditAnalysis`, `seniorCreditOfficer`, `riskCommittee`, `complianceTeam`, `valuationTeam`, `opsTeam`), resolved as `GROUP_<name>` authorities

## Next Steps

- [Service Delegates](service-delegates.md) - Java implementation of all 18 delegates
- [Process Extensions](process-extensions.md) - Variable definitions and mappings
- [REST API](rest-api.md) - HTTP integration

---

**Related Documentation:**
- [Service Tasks](../../bpmn/elements/service-task.md)
- [User Tasks](../../bpmn/elements/user-task.md)
- [Call Activities](../../bpmn/elements/call-activity.md)
- [Regular Sub-Processes](../../bpmn/subprocesses/regular-subprocess.md)
