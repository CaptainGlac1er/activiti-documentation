---
sidebar_label: REST API
slug: /examples/bank-loan-workflow/rest-api
title: "Bank Loan Workflow - REST API"
description: "RESTful API endpoints for initiating loan workflows, sending the regulatory clearance signal, triggering the batch, and monitoring processes."
---

# REST API

The Bank Loan Workflow exposes RESTful endpoints for process initiation, monitoring, signal delivery, and batch triggering. This document provides complete API documentation with request/response examples.

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/loans` | POST | Start a new loan approval process |
| `/api/loans/{loanApplicationId}` | GET | Get loan status |
| `/api/loans/{loanApplicationId}/regulatory-clearance` | POST | Send the regulatory clearance signal |
| `/api/batch/interest-posting` | POST | Trigger the batch process manually |
| `/api/process-instances/{processId}` | GET | Get process instance details |
| `/api/tasks` | GET | List available tasks |
| `/api/tasks/{taskId}` | GET | Get task details |
| `/api/tasks/{taskId}/complete` | POST | Complete a task |

**Base URL:** `http://localhost:8080` (default)

**Content-Type:** `application/json`

**Security note:** All `ProcessRuntime`/`TaskRuntime` calls resolve the current user from Spring Security. The examples below assume an authenticated user with `ROLE_ACTIVITI_USER` (and the relevant `GROUP_*` authorities for the task operations).

---

## Start Loan Process

Initiates a new loan approval workflow instance via the message start event.

### Request

```http
POST /api/loans
Content-Type: application/json
```

**JSON Body:**
```json
{
  "loanApplicationId": "LN-2024-001",
  "customerName": "Jane Smith",
  "customerEmail": "jane.smith@example.com",
  "loanAmount": 250000.00,
  "loanType": "MORTGAGE",
  "hasCollateral": true,
  "riskApprovers": ["r.chen", "m.okafor"],
  "creditAnalysisDueDate": "2024-06-10T17:00:00"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loanApplicationId` | String | Yes | Unique application identifier (becomes the business key) |
| `customerName` | String | Yes | Applicant full name |
| `customerEmail` | String | Yes | Applicant email address |
| `loanAmount` | BigDecimal | Yes | Requested loan amount |
| `loanType` | String | Yes | PERSONAL, MORTGAGE, or BUSINESS |
| `hasCollateral` | Boolean | No | Whether the loan is secured (default: false) |
| `riskApprovers` | Array | Yes | Ordered risk committee member IDs (drives the multi-instance approval) |
| `creditAnalysisDueDate` | DateTime | No | Due date for the credit analysis task |

### Response

**Success (200 OK):**
```json
{
  "processInstanceId": "1234567890abcdef",
  "loanApplicationId": "LN-2024-001",
  "status": "RUNNING"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `processInstanceId` | String | Activiti process instance ID |
| `loanApplicationId` | String | Business key (application ID) |
| `status` | String | Process status (RUNNING) |

### cURL Example

```bash
curl -X POST http://localhost:8080/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "loanApplicationId": "LN-2024-001",
    "customerName": "Jane Smith",
    "customerEmail": "jane.smith@example.com",
    "loanAmount": 250000.00,
    "loanType": "MORTGAGE",
    "hasCollateral": true,
    "riskApprovers": ["r.chen", "m.okafor"]
  }'
```

### Java Example

```java
import org.activiti.api.process.model.ProcessInstance;
import org.activiti.api.process.model.builders.MessagePayloadBuilder;
import org.activiti.api.process.runtime.ProcessRuntime;

@Service
public class LoanService {

    @Autowired
    private ProcessRuntime processRuntime;

    public ProcessInstance startLoan(StartLoanRequest request) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("loanApplicationId", request.getLoanApplicationId());
        variables.put("customerName", request.getCustomerName());
        variables.put("customerEmail", request.getCustomerEmail());
        variables.put("loanAmount", request.getLoanAmount());
        variables.put("loanType", request.getLoanType());
        variables.put("hasCollateral", request.isHasCollateral());
        variables.put("riskApprovers", request.getRiskApprovers());
        if (request.getCreditAnalysisDueDate() != null) {
            variables.put("creditAnalysisDueDate", request.getCreditAnalysisDueDate());
        }

        return processRuntime.start(
            MessagePayloadBuilder.start("loanApplicationReceived")
                .withBusinessKey(request.getLoanApplicationId())
                .withVariables(variables)
                .build()
        );
    }
}
```

**Why `MessagePayloadBuilder.start(...)`?** The process starts with a **message** start event, so the start is triggered by *sending the message* (matched by the message name `loanApplicationReceived`) rather than by process definition key. This is what lets external systems (a core banking front end, a file-drop) initiate loans through the same entry point as the REST API.

---

## Get Loan Status

Retrieves the current status of a loan process by its business key.

### Request

```http
GET /api/loans/{loanApplicationId}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `loanApplicationId` | String | Application ID (business key) |

### Response

**Success (200 OK):**
```json
{
  "id": "1234567890abcdef",
  "processDefinitionId": "loanApprovalProcess:1:abc123",
  "processDefinitionKey": "loanApprovalProcess",
  "businessKey": "LN-2024-001",
  "status": "RUNNING",
  "startDate": "2024-06-03T09:15:00",
  "initiator": "loan-officer"
}
```

### Java Implementation

```java
@GetMapping("/api/loans/{loanApplicationId}")
public ProcessInstance getLoan(@PathVariable String loanApplicationId) {
    return processRuntime.processInstances(
            ProcessPayloadBuilder.processInstances()
                .withBusinessKey(loanApplicationId)
                .build())
        .getContent().stream()
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
            "No loan process found for " + loanApplicationId));
}
```

### cURL Example

```bash
curl http://localhost:8080/api/loans/LN-2024-001
```

---

## Send Regulatory Clearance

Sends the `regulatoryClearance` **signal**, releasing every loan currently waiting at the regulatory hold event.

### Request

```http
POST /api/loans/{loanApplicationId}/regulatory-clearance
```

### Response

**Success (204 No Content)**

### cURL Example

```bash
curl -X POST http://localhost:8080/api/loans/LN-2024-001/regulatory-clearance
```

### Java Implementation

```java
@PostMapping("/api/loans/{loanApplicationId}/regulatory-clearance")
public ResponseEntity<Void> sendRegulatoryClearance(@PathVariable String loanApplicationId) {
    // Signals are broadcast by name; instances waiting at the
    // regulatoryHoldEvent catch it and continue.
    processRuntime.signal(
        ProcessPayloadBuilder.signal()
            .withName("regulatoryClearance")
            .build()
    );
    return ResponseEntity.noContent().build();
}
```

**Important - signal semantics:** A signal has **no correlation key** — it is broadcast and delivered to *all* process instances waiting for that signal. The path variable is accepted for logging/audit, but the runtime trigger itself is name-based. If per-loan clearance is required, model an intermediate **message** catching event instead (messages support correlation), or gate the signal send on a business check outside the engine.

---

## Trigger Batch Process

Manually starts an interest posting batch (re-run, backfill, or testing). The nightly cron run starts on its own via the timer start event.

### Request

```http
POST /api/batch/interest-posting
```

### Response

**Success (200 OK):**
```json
{
  "processInstanceId": "9876543210fedcba",
  "processDefinitionKey": "batchInterestPostingProcess",
  "status": "RUNNING"
}
```

### Java Implementation

```java
@PostMapping("/api/batch/interest-posting")
public ProcessInstance triggerBatch() {
    return processRuntime.start(
        ProcessPayloadBuilder.start()
            .withProcessDefinitionKey("batchInterestPostingProcess")
            .withName("Manual interest posting run")
            .build()
    );
}
```

**Note:** Because the batch has no user tasks, it typically runs to completion within seconds to minutes — polling `GET /api/process-instances/{id}` shows `COMPLETED` (or `CANCELLED` on a failed run).

---

## Get Process Instance Details

Retrieves a process instance by ID.

### Request

```http
GET /api/process-instances/{processId}
```

### Response

**Success (200 OK):**
```json
{
  "id": "1234567890abcdef",
  "name": "Jane Smith - MORTGAGE",
  "processDefinitionKey": "loanApprovalProcess",
  "businessKey": "LN-2024-001",
  "status": "RUNNING",
  "parentId": null
}
```

Sub-process instances (collateral valuation, disbursement) have a `parentId` pointing at the loan instance.

---

## List Available Tasks

Lists the tasks the current user may work on (assigned tasks plus tasks whose candidate groups match the user's `GROUP_*` authorities).

### Request

```http
GET /api/tasks
```

### Response

**Success (200 OK):**
```json
{
  "content": [
    {
      "id": "task-001",
      "name": "Risk Committee Approval",
      "assignee": "r.chen",
      "processInstanceId": "1234567890abcdef",
      "status": "ASSIGNED"
    },
    {
      "id": "task-002",
      "name": "Manual Appraisal",
      "assignee": null,
      "processInstanceId": "subproc-001",
      "status": "CREATED"
    }
  ],
  "totalItems": 2
}
```

**cURL Examples:**

```bash
# All my tasks
curl http://localhost:8080/api/tasks

# Tasks within one process
curl "http://localhost:8080/api/tasks?processInstanceId=1234567890abcdef"
```

### Java Implementation

```java
@GetMapping("/api/tasks")
public Page<Task> listTasks(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    return taskRuntime.tasks(Pageable.of(page, size));
}
```

---

## Get Task Details

### Request

```http
GET /api/tasks/{taskId}
```

### Response

**Success (200 OK):**
```json
{
  "id": "task-001",
  "name": "Risk Committee Approval",
  "assignee": "r.chen",
  "dueDate": "2024-06-05T17:00:00",
  "processInstanceId": "1234567890abcdef",
  "status": "ASSIGNED"
}
```

---

## Complete Task

Completes a task, optionally writing form variables. This is how each team member works their way through the loan.

### Request

```http
POST /api/tasks/{taskId}/complete
Content-Type: application/json
```

**Examples per stage:**

```json
// Intake Review (loanIntake)
{ "applicationComplete": true, "intakeNotes": "All documents verified" }

// Risk Committee Approval (riskCommittee) — each multi-instance approval
{ "approved": true }

// Manual Appraisal (valuationTeam)
{ "appraisalValue": 245000.00 }

// Manual Disbursement (opsTeam)
{ "disbursementStatus": "MANUAL_DISBURSED", "disbursementReference": "SWIFT-998877" }
```

### Response

**Success (204 No Content)**

### cURL Example

```bash
curl -X POST http://localhost:8080/api/tasks/task-001/complete \
  -H "Content-Type: application/json" \
  -d '{ "approved": true }'
```

### Java Implementation

```java
@PostMapping("/api/tasks/{taskId}/complete")
public ResponseEntity<Void> completeTask(
        @PathVariable String taskId,
        @RequestBody Map<String, Object> variables) {
    taskRuntime.complete(
        TaskPayloadBuilder.complete()
            .withTaskId(taskId)
            .withVariables(variables)
            .build()
    );
    return ResponseEntity.noContent().build();
}
```

**Multi-instance note:** Completing a committee task instance with `approved=false` satisfies the loop's completion condition — the remaining committee members are never asked.

---

## Error Responses

### 400 Bad Request

```json
{ "error": "riskApprovers is required and must be non-empty" }
```

### 404 Not Found

```json
{ "error": "No loan process found for LN-9999-999" }
```

### 500 Internal Server Error

```json
{ "error": "Signal 'regulatoryClearance' could not be sent" }
```

---

## Controller Implementation

```java
package com.example.bankloan.controllers;

import org.activiti.api.process.model.builders.MessagePayloadBuilder;
import org.activiti.api.process.model.builders.ProcessPayloadBuilder;
import org.activiti.api.process.model.builders.TaskPayloadBuilder;
import org.activiti.api.process.model.ProcessInstance;
import org.activiti.api.process.runtime.ProcessRuntime;
import org.activiti.api.runtime.shared.query.Page;
import org.activiti.api.runtime.shared.query.Pageable;
import org.activiti.api.task.model.Task;
import org.activiti.api.task.runtime.TaskRuntime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class LoanController {

    @Autowired
    private ProcessRuntime processRuntime;

    @Autowired
    private TaskRuntime taskRuntime;

    @PostMapping("/loans")
    public ProcessInstance startLoan(@RequestBody Map<String, Object> request) {
        String loanApplicationId = (String) request.get("loanApplicationId");
        return processRuntime.start(
            MessagePayloadBuilder.start("loanApplicationReceived")
                .withBusinessKey(loanApplicationId)
                .withVariables(request)
                .build()
        );
    }

    @GetMapping("/loans/{loanApplicationId}")
    public ProcessInstance getLoan(@PathVariable String loanApplicationId) {
        return processRuntime.processInstances(
                ProcessPayloadBuilder.processInstances()
                    .withBusinessKey(loanApplicationId)
                    .build())
            .getContent().stream()
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "No loan process found for " + loanApplicationId));
    }

    @PostMapping("/loans/{loanApplicationId}/regulatory-clearance")
    public ResponseEntity<Void> sendRegulatoryClearance(@PathVariable String loanApplicationId) {
        processRuntime.signal(
            ProcessPayloadBuilder.signal()
                .withName("regulatoryClearance")
                .build()
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/batch/interest-posting")
    public ProcessInstance triggerBatch() {
        return processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("batchInterestPostingProcess")
                .withName("Manual interest posting run")
                .build()
        );
    }

    @GetMapping("/process-instances/{processId}")
    public ProcessInstance getProcessInstance(@PathVariable String processId) {
        return processRuntime.processInstance(processId);
    }

    @GetMapping("/tasks")
    public Page<Task> listTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return taskRuntime.tasks(Pageable.of(page, size));
    }

    @GetMapping("/tasks/{taskId}")
    public Task getTask(@PathVariable String taskId) {
        return taskRuntime.task(taskId);
    }

    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Void> completeTask(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> variables) {
        taskRuntime.complete(
            TaskPayloadBuilder.complete()
                .withTaskId(taskId)
                .withVariables(variables)
                .build()
        );
        return ResponseEntity.noContent().build();
    }
}
```

---

## Testing with Postman

### Collection Setup

1. **Create Collection:** "Bank Loan API"
2. **Base URL Variable:** `{{baseUrl}}` = `http://localhost:8080`

### Request Examples

**Start Loan:**
```
POST {{baseUrl}}/api/loans
Body (JSON):
{
  "loanApplicationId": "LN-TEST-001",
  "customerName": "Test Customer",
  "customerEmail": "test@example.com",
  "loanAmount": 50000.00,
  "loanType": "PERSONAL",
  "hasCollateral": false,
  "riskApprovers": ["r.chen", "m.okafor"]
}
```

**Get Loan Status:**
```
GET {{baseUrl}}/api/loans/LN-TEST-001
```

**Send Regulatory Clearance:**
```
POST {{baseUrl}}/api/loans/LN-TEST-001/regulatory-clearance
```

**Trigger Batch:**
```
POST {{baseUrl}}/api/batch/interest-posting
```

**Complete Task:**
```
POST {{baseUrl}}/api/tasks/{{taskId}}/complete
Body (JSON):
{
  "applicationComplete": true,
  "intakeNotes": "Verified"
}
```

---

## Next Steps

- [Overview](summary.md) - Return to example overview
- [Loan Approval Process](loan-approval-process.md) - Process workflow details

---

**Related Documentation:**
- [Process Runtime API](../../api-reference/activiti-api/process-runtime)
- [Task Runtime API](../../api-reference/activiti-api/task-runtime)
- [Process Model Reference](../../api-reference/activiti-api/process-model)
