# FlowMaster_Abhishek - Distributed Task Orchestrator (Saga Pattern)

## Overview

FlowMaster is a fault-tolerant workflow orchestrator built with Node.js microservices using the Saga pattern.
It automates workflows such as loan processing: **Verify ID → Credit Check → Approve Loan**, ensuring all completed steps are compensated in case of failures.

---

## Components

### 1. Orchestrator Service

* Node.js/Express service
* Reads workflow definition from `workflow-definition/loan-workflow.yaml`
* Publishes events to Kafka topics (`start_verification`, `start_credit_check`)
* Consumes result events (`success` / `failure`) and triggers next steps or compensations

### 2. Kafka Integration

* Producer & Consumer setup in `kafka.js`
* Topics:

  * `start_verification`
  * `start_credit_check`
  * `compensate_verification`
  * `compensate_credit_check`

### 3. Postgres Event Log

* Table: `workflow_log`
* Logs each step with `workflow_id`, `step`, `status`, `created_at`
* Orchestrator can resume workflow after crash by reading the last successful step

### 4. Workflow Definition

* YAML-based file: `workflow-definition/loan-workflow.yaml`
* Sample workflow:

```yaml
workflow:
  - step: start_verification
    event: start_verification
    compensation_event: compensate_verification
  - step: start_credit_check
    event: start_credit_check
    compensation_event: compensate_credit_check
```

### 5. PowerShell Automation Script

* File: `powershell-scripts/run_workflow.ps1`
* Starts a workflow, polls for status, and shows step-by-step progress
* Color-coded statuses:

  * `success` → Green
  * `started` → Cyan
  * `pending` → Yellow
  * `failure` → Red
  * `compensating` → Magenta

---

## Saga Diagram (Workflow & Compensation Paths)

```text
[Start Workflow]
      |
      v
[Start Verification] ---- success ---> [Start Credit Check] ---- success ---> [Workflow Complete]
      |                                   |
      |                                   |--- failure ---> [Compensate Verification]
      |
      |--- failure ---> [Compensate Verification] ---> [Workflow Failed]
```

**Explanation:**

* Each step publishes an event to Kafka.
* Downstream services consume the event and return success or failure.
* On failure, orchestrator triggers compensation events to undo completed steps.
* The Postgres event log ensures state recovery if the orchestrator crashes.

---

## Running the System Locally

### 1. Start Infrastructure

```bash
docker-compose up -d
```

### 2. Start Orchestrator Service

```bash
cd orchestrator
set KAFKAJS_NO_PARTITIONER_WARNING=1
node server.js
```

### 3. Run Workflow & Monitor (PowerShell)

```powershell
cd powershell-scripts
.
un_workflow.ps1
```

### 4. Query Workflow via API (Optional)

```bash
Invoke-WebRequest -Uri http://localhost:3000/workflows/<workflowId> -Method GET -UseBasicParsing
```

---

## Failure Recovery Demo

**Steps:**

1. Start orchestrator and services using Docker Compose.
2. Trigger a new workflow:

```powershell
cd powershell-scripts
.
.\run_workflow.ps1
```

3. Simulate a failure by stopping the Credit service container:

```bash
docker stop flowmaster-credit
```

4. Start a new workflow; orchestrator detects failure at credit check step.
5. Restart the Credit service container:

```bash
docker start flowmaster-credit
```

6. Orchestrator reads `workflow_log` and automatically resumes workflow or triggers compensation.
7. Query workflow status:

```bash
Invoke-WebRequest -Uri http://localhost:3000/workflows/<workflowId> -Method GET -UseBasicParsing
```

> Note: Verification & Credit services are simulated for demo purposes. Real corporate projects require actual services.

---

## Deliverables

* Full working orchestrator backend
* `workflow-definition/loan-workflow.yaml`
* PowerShell automation script
* Docker-compose file for infrastructure
* `workflow_log.csv` (Postgres export)
* `README.md` (this file, polished and submission-ready)

### Ready-to-Submit Folder Structure

```
FlowMaster_Abhishek/
├─ orchestrator/
├─ workflow-definition/
├─ powershell-scripts/
├─ workflow_log.csv
├─ docker-compose.yml
└─ README.md