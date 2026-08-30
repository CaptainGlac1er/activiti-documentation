---
sidebar_label: Process Extensions
slug: /examples/bank-loan-workflow/process-extensions
title: "Bank Loan Workflow - Process Extensions"
description: "Process extension JSON sidecars: variable definitions, input/output mappings, and constants for all four processes."
---

# Process Extensions

Process extensions in Activiti provide a declarative way to define process variables, input/output mappings, and configuration constants. This document explains the extension JSON files used in the Bank Loan Workflow.

## Overview

Each BPMN file has a companion `**-extensions.json` sidecar in the same directory. The sidecar is matched by suffix and the **process definition key is a map key inside the file** (not the filename).

```
processes/
├── loanApprovalProcess.bpmn
├── loanApprovalProcess-extensions.json
├── collateralValuationProcess.bpmn
├── collateralValuationProcess-extensions.json
├── loanDisbursementProcess.bpmn
├── loanDisbursementProcess-extensions.json
├── batchInterestPostingProcess.bpmn
└── batchInterestPostingProcess-extensions.json
```

## Extension JSON Structure

```json
{
  "id": "extension-id",
  "extensions": {
    "<process-definition-key>": {
      "properties": { },
      "mappings": { },
      "constants": { },
      "templates": { },
      "assignments": { }
    }
  }
}
```

| Field | Keyed By | Purpose |
|-------|----------|---------|
| `properties` | Variable ID | Process-scoped variable definitions (type, required, default) |
| `mappings` | Element ID | Input/output variable mappings per task or call activity |
| `constants` | Element ID | Configuration values injected into the element's context |
| `templates` | Task ID | Task assignment templates |
| `assignments` | Task ID | Task assignment configurations |

## Properties (Process Variables)

### Property Structure

```json
"loanApplicationId-id": {
  "id": "loanApplicationId-id",
  "name": "loanApplicationId",
  "type": "string",
  "required": true
}
```

### Supported Types

| Type | Java Representation | Notes |
|------|--------------------|-------|
| `boolean` | `Boolean` | |
| `string` | `String` | |
| `integer` | `Integer` | |
| `bigdecimal` | `BigDecimal` | Money amounts |
| `json` | `JsonNode` | Structured payloads |
| `date` | `Date` | |
| `datetime` | `Date` | |
| `array` | `JsonNode` | Collections (e.g. `riskApprovers`, `accountsDue`) |

Do not use `long`, `binary`, `json-object`, or `java-object` — those type names are not registered.

### Loan Approval Process Variables

```json
"loanApplicationId-id": {
  "id": "loanApplicationId-id",
  "name": "loanApplicationId",
  "type": "string",
  "required": true
},
"customerName-id": {
  "id": "customerName-id",
  "name": "customerName",
  "type": "string",
  "required": true
},
"customerEmail-id": {
  "id": "customerEmail-id",
  "name": "customerEmail",
  "type": "string",
  "required": true
},
"loanAmount-id": {
  "id": "loanAmount-id",
  "name": "loanAmount",
  "type": "bigdecimal",
  "required": true
},
"loanType-id": {
  "id": "loanType-id",
  "name": "loanType",
  "type": "string",
  "required": true
},
"hasCollateral-id": {
  "id": "hasCollateral-id",
  "name": "hasCollateral",
  "type": "boolean",
  "value": false
},
"creditAnalysisDueDate-id": {
  "id": "creditAnalysisDueDate-id",
  "name": "creditAnalysisDueDate",
  "type": "datetime"
},
"applicationComplete-id": {
  "id": "applicationComplete-id",
  "name": "applicationComplete",
  "type": "boolean"
},
"kycPassed-id": {
  "id": "kycPassed-id",
  "name": "kycPassed",
  "type": "boolean"
},
"kycReference-id": {
  "id": "kycReference-id",
  "name": "kycReference",
  "type": "string"
},
"creditReport-id": {
  "id": "creditReport-id",
  "name": "creditReport",
  "type": "json"
},
"creditScore-id": {
  "id": "creditScore-id",
  "name": "creditScore",
  "type": "integer"
},
"riskRating-id": {
  "id": "riskRating-id",
  "name": "riskRating",
  "type": "string"
},
"creditApproved-id": {
  "id": "creditApproved-id",
  "name": "creditApproved",
  "type": "boolean"
},
"seniorReviewApproved-id": {
  "id": "seniorReviewApproved-id",
  "name": "seniorReviewApproved",
  "type": "boolean"
},
"riskApprovers-id": {
  "id": "riskApprovers-id",
  "name": "riskApprovers",
  "type": "array",
  "required": true
},
"approved-id": {
  "id": "approved-id",
  "name": "approved",
  "type": "boolean"
},
"collateralValue-id": {
  "id": "collateralValue-id",
  "name": "collateralValue",
  "type": "bigdecimal"
},
"valuationMethod-id": {
  "id": "valuationMethod-id",
  "name": "valuationMethod",
  "type": "string"
},
"disbursementStatus-id": {
  "id": "disbursementStatus-id",
  "name": "disbursementStatus",
  "type": "string"
},
"disbursementReference-id": {
  "id": "disbursementReference-id",
  "name": "disbursementReference",
  "type": "string"
}
```

### Batch Process Variables

```json
"batchRunId-id": {
  "id": "batchRunId-id",
  "name": "batchRunId",
  "type": "string"
},
"accountsFound-id": {
  "id": "accountsFound-id",
  "name": "accountsFound",
  "type": "boolean"
},
"accountsDue-id": {
  "id": "accountsDue-id",
  "name": "accountsDue",
  "type": "array"
},
"interestPosted-id": {
  "id": "interestPosted-id",
  "name": "interestPosted",
  "type": "bigdecimal"
},
"batchReconciled-id": {
  "id": "batchReconciled-id",
  "name": "batchReconciled",
  "type": "boolean"
},
"reportId-id": {
  "id": "reportId-id",
  "name": "reportId",
  "type": "string"
}
```

The collateral and disbursement process variables follow the same pattern (`avmValue`, `avmWithinTolerance`, `appraisalValue`, `accountNumber`, `issueStatement`, `notifyTreasury`, `updateCreditBureau`, ...). The three disbursement action flags carry `"value": true` defaults so the sub-process has safe behaviour even if the caller omits them.

## Mappings (Variable Transformation)

### Mapping Structure

Mappings are keyed by **element ID** and declare which process variables are passed in and out:

```json
"intakeReviewTask": {
  "inputs": {
    "customerName": { "type": "variable", "value": "customerName" }
  },
  "outputs": {
    "applicationComplete": { "type": "variable", "value": "applicationComplete" }
  }
}
```

| `type` | `value` means |
|--------|---------------|
| `variable` | A process variable name (pass-through or rename) |
| `value` | A literal value |
| `jsonpatch` | A JSON Patch expression |

(Values are case-insensitive; the repo examples use lowercase.)

### Main Process Mappings

```json
"intakeReviewTask": {
  "inputs": {
    "customerName": { "type": "variable", "value": "customerName" },
    "customerEmail": { "type": "variable", "value": "customerEmail" },
    "loanAmount": { "type": "variable", "value": "loanAmount" },
    "loanType": { "type": "variable", "value": "loanType" }
  },
  "outputs": {
    "applicationComplete": { "type": "variable", "value": "applicationComplete" },
    "intakeNotes": { "type": "variable", "value": "intakeNotes" }
  }
},
"kycScreeningTask": {
  "inputs": {
    "customerName": { "type": "variable", "value": "customerName" },
    "loanType": { "type": "variable", "value": "loanType" }
  },
  "outputs": {
    "kycPassed": { "type": "variable", "value": "kycPassed" },
    "kycReference": { "type": "variable", "value": "kycReference" }
  }
},
"pullCreditReportTask": {
  "inputs": {
    "customerName": { "type": "variable", "value": "customerName" },
    "loanType": { "type": "variable", "value": "loanType" }
  },
  "outputs": {
    "creditReport": { "type": "variable", "value": "creditReport" }
  }
},
"creditScoringTask": {
  "inputs": {
    "creditReport": { "type": "variable", "value": "creditReport" },
    "loanAmount": { "type": "variable", "value": "loanAmount" }
  },
  "outputs": {
    "creditScore": { "type": "variable", "value": "creditScore" },
    "riskRating": { "type": "variable", "value": "riskRating" },
    "creditApproved": { "type": "variable", "value": "creditApproved" }
  }
}
```

Note the embedded sub-process tasks (`pullCreditReportTask`, `creditScoringTask`) are mapped in the **parent's** sidecar — the sub-process shares the parent process's variable scope and extension model.

### Call Activity Mappings

```json
"collateralCallActivity": {
  "inputs": {
    "loanApplicationId": { "type": "variable", "value": "loanApplicationId" },
    "customerName": { "type": "variable", "value": "customerName" },
    "loanAmount": { "type": "variable", "value": "loanAmount" },
    "loanType": { "type": "variable", "value": "loanType" }
  },
  "outputs": {
    "collateralValue": { "type": "variable", "value": "collateralValue" },
    "valuationMethod": { "type": "variable", "value": "valuationMethod" }
  }
}
```

### Constant Value Mappings (Action Flags)

The disbursement call activity passes **literals** — the post-disbursement action flags are decided at the call site:

```json
"disbursementCallActivity": {
  "inputs": {
    "loanApplicationId": { "type": "variable", "value": "loanApplicationId" },
    "customerName": { "type": "variable", "value": "customerName" },
    "customerEmail": { "type": "variable", "value": "customerEmail" },
    "loanAmount": { "type": "variable", "value": "loanAmount" },
    "collateralValue": { "type": "variable", "value": "collateralValue" },
    "issueStatement": { "type": "value", "value": true },
    "notifyTreasury": { "type": "value", "value": true },
    "updateCreditBureau": { "type": "value", "value": true }
  },
  "outputs": {
    "disbursementStatus": { "type": "variable", "value": "disbursementStatus" },
    "disbursementReference": { "type": "variable", "value": "disbursementReference" }
  }
}
```

**Why literals?** The inclusive gateway inside the disbursement process evaluates `issueStatement`, `notifyTreasury`, and `updateCreditBureau`. Mapping them as `"type": "value"` keeps the sub-process a reusable executor: a refinance flow could call it with `updateCreditBureau: false` without touching the model.

### Batch Process Mappings

```json
"fetchAccountsDueTask": {
  "outputs": {
    "batchRunId": { "type": "variable", "value": "batchRunId" },
    "accountsFound": { "type": "variable", "value": "accountsFound" },
    "accountsDue": { "type": "variable", "value": "accountsDue" }
  }
},
"postInterestTask": {
  "inputs": {
    "account": { "type": "variable", "value": "account" }
  }
},
"reconcileBatchTask": {
  "inputs": {
    "accountsDue": { "type": "variable", "value": "accountsDue" },
    "batchRunId": { "type": "variable", "value": "batchRunId" }
  },
  "outputs": {
    "batchReconciled": { "type": "variable", "value": "batchReconciled" },
    "interestPosted": { "type": "variable", "value": "interestPosted" }
  }
},
"generateBatchReportTask": {
  "inputs": {
    "interestPosted": { "type": "variable", "value": "interestPosted" }
  },
  "outputs": {
    "reportId": { "type": "variable", "value": "reportId" }
  }
},
"emailBatchReportTask": {
  "inputs": {
    "reportId": { "type": "variable", "value": "reportId" },
    "interestPosted": { "type": "variable", "value": "interestPosted" }
  },
  "outputs": {
    "reportSent": { "type": "variable", "value": "reportSent" }
  }
}
```

**Multi-instance note:** `postInterestTask` maps the **element variable** `account` — the per-instance value produced by `activiti:elementVariable="account"` on the multi-instance loop characteristics. Each parallel instance's connector receives its own account this way.

## Constants (Configuration Values)

### Constants Structure

Constants are keyed by element ID; each entry is a map of configuration keys to `{"value": ...}`:

```json
"kycScreeningTask": {
  "screeningEngine": { "value": "https://kyc.bank.example/api/v2" },
  "timeout": { "value": 30000 }
}
```

### Full Constants Set (all processes)

```json
"kycScreeningTask": {
  "screeningEngine": { "value": "https://kyc.bank.example/api/v2" },
  "timeout": { "value": 30000 }
},
"creditScoringTask": {
  "minCreditScore": { "value": 650 }
},
"runAutomatedValuationTask": {
  "avmEndpoint": { "value": "https://avm.bank.example/api" },
  "tolerance": { "value": 0.15 }
},
"disburseFundsTask": {
  "wireEndpoint": { "value": "https://treasury.bank.example/wires" },
  "currency": { "value": "USD" }
},
"loanClosedTask": {
  "coreBankingApi": { "value": "https://core.bank.example/api" },
  "statusCompleted": { "value": "FUNDED" }
},
"emailBatchReportTask": {
  "smtpServer": { "value": "smtp.bank.example" },
  "fromAddress": { "value": "loans@bank.example" },
  "toAddress": { "value": "finance-backoffice@bank.example" },
  "emailTemplate": { "value": "interest_batch_report" }
}
```

## Complete Extension File Example

`loanApprovalProcess-extensions.json`:

```json
{
  "id": "loanApprovalProcessModel",
  "extensions": {
    "loanApprovalProcess": {
      "properties": {
        "loanApplicationId-id": { "id": "loanApplicationId-id", "name": "loanApplicationId", "type": "string", "required": true },
        "customerName-id": { "id": "customerName-id", "name": "customerName", "type": "string", "required": true },
        "customerEmail-id": { "id": "customerEmail-id", "name": "customerEmail", "type": "string", "required": true },
        "loanAmount-id": { "id": "loanAmount-id", "name": "loanAmount", "type": "bigdecimal", "required": true },
        "loanType-id": { "id": "loanType-id", "name": "loanType", "type": "string", "required": true },
        "hasCollateral-id": { "id": "hasCollateral-id", "name": "hasCollateral", "type": "boolean", "value": false },
        "creditAnalysisDueDate-id": { "id": "creditAnalysisDueDate-id", "name": "creditAnalysisDueDate", "type": "datetime" },
        "applicationComplete-id": { "id": "applicationComplete-id", "name": "applicationComplete", "type": "boolean" },
        "kycPassed-id": { "id": "kycPassed-id", "name": "kycPassed", "type": "boolean" },
        "kycReference-id": { "id": "kycReference-id", "name": "kycReference", "type": "string" },
        "creditReport-id": { "id": "creditReport-id", "name": "creditReport", "type": "json" },
        "creditScore-id": { "id": "creditScore-id", "name": "creditScore", "type": "integer" },
        "riskRating-id": { "id": "riskRating-id", "name": "riskRating", "type": "string" },
        "creditApproved-id": { "id": "creditApproved-id", "name": "creditApproved", "type": "boolean" },
        "seniorReviewApproved-id": { "id": "seniorReviewApproved-id", "name": "seniorReviewApproved", "type": "boolean" },
        "riskApprovers-id": { "id": "riskApprovers-id", "name": "riskApprovers", "type": "array", "required": true },
        "approved-id": { "id": "approved-id", "name": "approved", "type": "boolean" },
        "collateralValue-id": { "id": "collateralValue-id", "name": "collateralValue", "type": "bigdecimal" },
        "valuationMethod-id": { "id": "valuationMethod-id", "name": "valuationMethod", "type": "string" },
        "disbursementStatus-id": { "id": "disbursementStatus-id", "name": "disbursementStatus", "type": "string" },
        "disbursementReference-id": { "id": "disbursementReference-id", "name": "disbursementReference", "type": "string" }
      },
      "mappings": {
        "intakeReviewTask": {
          "inputs": {
            "customerName": { "type": "variable", "value": "customerName" },
            "customerEmail": { "type": "variable", "value": "customerEmail" },
            "loanAmount": { "type": "variable", "value": "loanAmount" },
            "loanType": { "type": "variable", "value": "loanType" }
          },
          "outputs": {
            "applicationComplete": { "type": "variable", "value": "applicationComplete" },
            "intakeNotes": { "type": "variable", "value": "intakeNotes" }
          }
        },
        "kycScreeningTask": {
          "inputs": {
            "customerName": { "type": "variable", "value": "customerName" },
            "loanType": { "type": "variable", "value": "loanType" }
          },
          "outputs": {
            "kycPassed": { "type": "variable", "value": "kycPassed" },
            "kycReference": { "type": "variable", "value": "kycReference" }
          }
        },
        "pullCreditReportTask": {
          "inputs": {
            "customerName": { "type": "variable", "value": "customerName" },
            "loanType": { "type": "variable", "value": "loanType" }
          },
          "outputs": {
            "creditReport": { "type": "variable", "value": "creditReport" }
          }
        },
        "creditScoringTask": {
          "inputs": {
            "creditReport": { "type": "variable", "value": "creditReport" },
            "loanAmount": { "type": "variable", "value": "loanAmount" }
          },
          "outputs": {
            "creditScore": { "type": "variable", "value": "creditScore" },
            "riskRating": { "type": "variable", "value": "riskRating" },
            "creditApproved": { "type": "variable", "value": "creditApproved" }
          }
        },
        "collateralCallActivity": {
          "inputs": {
            "loanApplicationId": { "type": "variable", "value": "loanApplicationId" },
            "customerName": { "type": "variable", "value": "customerName" },
            "loanAmount": { "type": "variable", "value": "loanAmount" },
            "loanType": { "type": "variable", "value": "loanType" }
          },
          "outputs": {
            "collateralValue": { "type": "variable", "value": "collateralValue" },
            "valuationMethod": { "type": "variable", "value": "valuationMethod" }
          }
        },
        "prepareDisbursementTask": {
          "inputs": {
            "loanApplicationId": { "type": "variable", "value": "loanApplicationId" },
            "loanAmount": { "type": "variable", "value": "loanAmount" }
          },
          "outputs": {
            "disbursementPrepared": { "type": "variable", "value": "disbursementPrepared" }
          }
        },
        "disbursementCallActivity": {
          "inputs": {
            "loanApplicationId": { "type": "variable", "value": "loanApplicationId" },
            "customerName": { "type": "variable", "value": "customerName" },
            "customerEmail": { "type": "variable", "value": "customerEmail" },
            "loanAmount": { "type": "variable", "value": "loanAmount" },
            "collateralValue": { "type": "variable", "value": "collateralValue" },
            "issueStatement": { "type": "value", "value": true },
            "notifyTreasury": { "type": "value", "value": true },
            "updateCreditBureau": { "type": "value", "value": true }
          },
          "outputs": {
            "disbursementStatus": { "type": "variable", "value": "disbursementStatus" },
            "disbursementReference": { "type": "variable", "value": "disbursementReference" }
          }
        },
        "loanClosedTask": {
          "inputs": {
            "loanApplicationId": { "type": "variable", "value": "loanApplicationId" },
            "disbursementStatus": { "type": "variable", "value": "disbursementStatus" },
            "disbursementReference": { "type": "variable", "value": "disbursementReference" }
          }
        }
      },
      "constants": {
        "kycScreeningTask": {
          "screeningEngine": { "value": "https://kyc.bank.example/api/v2" },
          "timeout": { "value": 30000 }
        },
        "creditScoringTask": {
          "minCreditScore": { "value": 650 }
        },
        "loanClosedTask": {
          "coreBankingApi": { "value": "https://core.bank.example/api" },
          "statusCompleted": { "value": "FUNDED" }
        }
      }
    }
  }
}
```

The other three sidecars have the same shape, keyed by their process definition key (`collateralValuationProcess`, `loanDisbursementProcess`, `batchInterestPostingProcess`) with the mappings and constants shown in the sections above.

## Assignment Definitions and Templates

The sidecar can also declare task **assignments** and **templates** (in addition to the `activiti:candidateGroups` attributes used in the BPMN files of this example):

```json
"assignments": {
  "seniorReviewTask": {
    "id": "seniorReviewTask",
    "assignment": "assignee",
    "type": "expression",
    "mode": "manual"
  }
},
"templates": {
  "tasks": {
    "seniorReviewTask": {
      "assignee": { "type": "variable", "value": "${seniorReviewer}" }
    }
  },
  "default": {
    "candidate": { "type": "variable", "value": "${requestGroup}" }
  }
}
```

| Field | Valid Values |
|-------|--------------|
| `assignment` | `assignee`, `candidates` |
| `type` | `static`, `identity`, `expression` |
| `mode` | `sequential`, `manual` |

In this example the BPMN `activiti:candidateGroups` attributes drive team routing; the sidecar assignment mechanism is available where modeler-driven assignment (per-user or per-variable) is preferred.

## Best Practices

1. **Type Safety** - Declare types explicitly; `bigdecimal` for all money, `array` for collections
2. **Required vs Optional** - `required: true` for variables that gateways depend on (`loanAmount`, `riskApprovers`)
3. **Defaults Where Safe** - `"value": false` for `hasCollateral`, `"value": true` for the disbursement action flags
4. **Caller-Driven Behaviour** - Literal (`"type": "value"`) inputs on call activities keep sub-processes reusable
5. **Clear Naming** - Variable names read like a balance sheet: `collateralValue`, `disbursementReference`, `batchReconciled`

## Next Steps

- [REST API](rest-api.md) - HTTP integration
- [Service Delegates](service-delegates.md) - Java implementations

---

**Related Documentation:**
- [Process Extensions Reference](../../bpmn/reference/process-extensions.md)
- [Call Activities](../../bpmn/elements/call-activity.md)
