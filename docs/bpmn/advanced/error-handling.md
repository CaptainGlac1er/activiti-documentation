---
sidebar_label: Error Handling
slug: /bpmn/advanced/error-handling
title: "Error Handling"
description: "Complete guide to error handling in Activiti - boundary events, error propagation, exception mapping, and graceful failure management."
---

# Error Handling

Error handling in Activiti allows you to **gracefully manage exceptions** and **BPMN errors** during process execution. It provides mechanisms to catch, propagate, and handle errors at different levels of the process hierarchy.

## Overview

```xml
<!-- Define an error -->
<error id="PaymentError" name="Payment Error" errorCode="PAY001"/>

<!-- Catch error with boundary event -->
<boundaryEvent id="catchPaymentError" attachedToRef="paymentTask">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>

<!-- Throw error from end event -->
<endEvent id="throwError">
  <errorEventDefinition errorRef="PaymentError"/>
</endEvent>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Exception mapping, error propagation, uncaught error handling

## Key Features

### Standard BPMN Features
- **Error Definitions** - Named errors with optional codes
- **Error Boundary Events** - Catch errors from activities
- **Error End Events** - Throw errors to upstream handlers
- **Error Start Events** - Start process on error
- **Error Propagation** - Bubble errors up subprocess hierarchy

### Activiti Extensions
- **Exception Mapping** - Map Java exceptions to BPMN errors
- **Include Child Exceptions** - Catch exception hierarchies
- **Uncaught Error Handling** - Global error listeners
- **Error Events API** - Programmatic error throwing
- **Activity Error Events** - Monitor error occurrences

## Error Definitions

### Basic Error Definition

```xml
<error id="myError" name="My Error"/>
```

### Error with Code

```xml
<error id="PaymentError" 
       name="Payment Processing Error" 
       errorCode="PAY001"/>
```

### Multiple Errors

```xml
<error id="ValidationError" name="Validation Error" errorCode="VAL001"/>
<error id="DatabaseError" name="Database Error" errorCode="DB001"/>
<error id="TimeoutError" name="Timeout Error" errorCode="TO001"/>
```

**Important:**
- `id` - Unique identifier (required)
- `name` - Human-readable name (optional)
- `errorCode` - Custom error code for matching (optional)

## Error Boundary Events

### 1. Interrupting Error Boundary Event

Stops the activity and transfers control to error handler:

```xml
<serviceTask id="paymentTask" name="Process Payment"/>

<boundaryEvent id="catchPaymentError" 
               attachedToRef="paymentTask"
               cancelActivity="true">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>

<sequenceFlow id="errorFlow" 
              sourceRef="catchPaymentError" 
              targetRef="handleError"/>
```

**Behavior:**
- Cancels the attached activity
- Transfers to error handling path
- Can be placed on any activity

### 2. Non-Interrupting Error Boundary Event

Logs error without stopping activity (rare use case):

```xml
<boundaryEvent id="logError" 
               attachedToRef="paymentTask"
               cancelActivity="false">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>
```

**Note:** Non-interrupting error boundary events are unusual; typically used for logging/monitoring.

### 3. Generic Error Catcher

Catch any error (no errorRef):

```xml
<boundaryEvent id="catchAnyError" attachedToRef="paymentTask">
  <errorEventDefinition/>
</boundaryEvent>
```

**Behavior:**
- Catches ALL errors thrown from the activity
- Use as fallback when specific errors not caught

### 4. Multiple Error Handlers

Handle different errors differently:

```xml
<serviceTask id="processOrder" name="Process Order"/>

<!-- Catch validation error -->
<boundaryEvent id="catchValidationError" 
               attachedToRef="processOrder">
  <errorEventDefinition errorRef="ValidationError"/>
</boundaryEvent>

<!-- Catch database error -->
<boundaryEvent id="catchDatabaseError" 
               attachedToRef="processOrder">
  <errorEventDefinition errorRef="DatabaseError"/>
</boundaryEvent>

<!-- Catch any other error -->
<boundaryEvent id="catchOtherError" 
               attachedToRef="processOrder">
  <errorEventDefinition/>
</boundaryEvent>
```

**Important:** Multiple boundary events can be attached to the same activity. Use error codes for specificity to distinguish handlers.

## Throwing Errors

### 1. Error End Event

Throw error from process or subprocess:

```xml
<endEvent id="throwPaymentError">
  <errorEventDefinition errorRef="PaymentError"/>
</endEvent>
```

**Behavior:**
- Terminates current process/subprocess
- Propagates error to parent scope
- Can be caught by boundary event on subprocess

### 2. Error End Event Without Code

```xml
<endEvent id="throwGenericError">
  <errorEventDefinition/>
</endEvent>
```

**Use Case:** Generic error when specific code not needed

### 3. Programmatic Error Throwing

Throw a BPMN error from a `JavaDelegate` by throwing a `BpmnError`:

```java
import org.activiti.engine.delegate.BpmnError;
import org.activiti.engine.delegate.JavaDelegate;
import org.activiti.engine.delegate.DelegateExecution;

public class PaymentService implements JavaDelegate {
    public void execute(DelegateExecution execution) {
        // Throw BPMN error with code only
        throw new BpmnError("PaymentError");

        // Or with a description message
        throw new BpmnError("PaymentError", "Payment processing failed for order XYZ");
    }
}
```

**Important:**
- `BpmnError` extends `ActivitiException` and is specifically designed for business faults
- It is caught by error boundary events or error event sub-processes
- Technical errors (e.g., database failures) should use other exception types, not `BpmnError`
- `BpmnError` requires a non-null, non-empty error code

## Exception Mapping

Map Java exceptions to BPMN errors:

### 1. Direct Exception Mapping

```xml
<serviceTask id="paymentTask" 
             name="Process Payment" 
             activiti:class="com.example.PaymentService">
  
  <boundaryEvent id="catchPaymentException" 
                 attachedToRef="paymentTask">
    
    <activiti:mapException errorCode="PAY001" 
                          includeChildExceptions="true">
      com.example.PaymentException
    </activiti:mapException>
    
    <errorEventDefinition errorRef="PaymentError"/>
  </boundaryEvent>
  
</serviceTask>
```

**Attributes:**
- `errorCode` - BPMN error code to match
- `includeChildExceptions` - Catch exception subclasses (true/false)

### 2. Multiple Exception Mappings

```xml
<boundaryEvent id="catchMultipleExceptions" 
               attachedToRef="databaseTask">
  
  <activiti:mapException errorCode="DB001">
    java.sql.SQLException
  </activiti:mapException>
  
  <activiti:mapException errorCode="DB002">
    javax.persistence.PersistenceException
  </activiti:mapException>
  
  <errorEventDefinition errorRef="DatabaseError"/>
</boundaryEvent>
```

### 3. Exception Hierarchy Mapping

```xml
<activiti:mapException errorCode="PAY001" 
                      includeChildExceptions="true">
  com.example.PaymentException
</activiti:mapException>
```

**Catches:**
- `com.example.PaymentException`
- `com.example.CreditCardException` (if extends PaymentException)
- `com.example.InsufficientFundsException` (if extends PaymentException)

### 4. Class Delegate with Exception Mapping

```xml
<serviceTask id="fileOperation" 
             name="File Operation" 
             activiti:class="com.example.FileService">
  
  <boundaryEvent id="catchFileException">
    <activiti:mapException errorCode="FILE001" 
                          includeChildExceptions="true">
      java.io.IOException
    </activiti:mapException>
    <errorEventDefinition errorRef="FileError"/>
  </boundaryEvent>
  
</serviceTask>
```

## Error Propagation

### 1. Subprocess Error Propagation

Errors bubble up through subprocess hierarchy:

```xml
<subProcess id="paymentSubProcess">
  
  <startEvent id="subStart"/>
  
  <serviceTask id="processPayment"/>
  
  <!-- Throw error from subprocess -->
  <endEvent id="subThrowError">
    <errorEventDefinition errorRef="PaymentError"/>
  </endEvent>
  
</subProcess>

<!-- Catch error on subprocess boundary -->
<boundaryEvent id="catchSubProcessError" 
               attachedToRef="paymentSubProcess">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>
```

**Behavior:**
- Error thrown in subprocess propagates to parent
- Can be caught by boundary event on subprocess
- Uncaught errors continue propagating up

### 2. Nested Subprocess Errors

```xml
<subProcess id="level1">
  
  <subProcess id="level2">
    
    <endEvent id="throwFromLevel2">
      <errorEventDefinition errorRef="DeepError"/>
    </endEvent>
    
  </subProcess>
  
  <!-- Catch on level2 boundary -->
  <boundaryEvent id="catchOnLevel2" attachedToRef="level2">
    <errorEventDefinition errorRef="DeepError"/>
  </boundaryEvent>
  
</subProcess>

<!-- Catch on level1 boundary -->
<boundaryEvent id="catchOnLevel1" attachedToRef="level1">
  <errorEventDefinition errorRef="DeepError"/>
</boundaryEvent>
```

### 3. Call Activity Error Propagation

```xml
<callActivity id="callPaymentProcess"
               calledElement="paymentProcess"/>

<boundaryEvent id="catchCalledError"
                attachedToRef="callPaymentProcess">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>
```

**Behavior:**
- Errors from called process propagate to caller
- Can be caught by boundary event on call activity

## Complete Examples

### Example 1: Payment Processing with Error Handling

```xml
<process id="paymentProcess" name="Payment Processing">
  
  <!-- Error definitions -->
  <error id="PaymentError" name="Payment Error" errorCode="PAY001"/>
  <error id="ValidationError" name="Validation Error" errorCode="VAL001"/>
  <error id="TimeoutError" name="Timeout Error" errorCode="TO001"/>
  
  <startEvent id="start"/>
  
  <userTask id="enterPayment" name="Enter Payment Details"/>
  
  <serviceTask id="validatePayment" 
               name="Validate Payment" 
               activiti:class="com.example.PaymentValidator">
    
    <!-- Catch validation exceptions -->
    <boundaryEvent id="catchValidationException">
      <activiti:mapException errorCode="VAL001">
        com.example.ValidationException
      </activiti:mapException>
      <errorEventDefinition errorRef="ValidationError"/>
    </boundaryEvent>
    
  </serviceTask>
  
  <exclusiveGateway id="validationCheck"/>
  
  <serviceTask id="processPayment" 
               name="Process Payment" 
               activiti:class="com.example.PaymentProcessor"
               activiti:async="true">
    
    <!-- Catch payment exceptions -->
    <boundaryEvent id="catchPaymentException">
      <activiti:mapException errorCode="PAY001" 
                            includeChildExceptions="true">
        com.example.PaymentException
      </activiti:mapException>
      <errorEventDefinition errorRef="PaymentError"/>
    </boundaryEvent>
    
    <!-- Catch timeout -->
    <boundaryEvent id="catchTimeout" 
                   cancelActivity="false">
      <timerEventDefinition>
        <timeDuration>PT5M</timeDuration>
      </timerEventDefinition>
    </boundaryEvent>
    
  </serviceTask>
  
  <!-- Error handling paths -->
  <userTask id="handleValidationError" 
            name="Handle Validation Error"/>
  
  <userTask id="handlePaymentError" 
            name="Handle Payment Error"/>
  
  <serviceTask id="logTimeout" name="Log Timeout"/>
  
  <endEvent id="successEnd" name="Payment Successful"/>
  <endEvent id="errorEnd" name="Payment Failed"/>
  
  <!-- Sequence flows -->
  <sequenceFlow id="flow1" sourceRef="start" targetRef="enterPayment"/>
  <sequenceFlow id="flow2" sourceRef="enterPayment" targetRef="validatePayment"/>
  <sequenceFlow id="flow3" sourceRef="validatePayment" targetRef="validationCheck"/>
  <sequenceFlow id="flow4" sourceRef="validationCheck" targetRef="processPayment">
    <conditionExpression>${validationResult.valid == true}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow5" sourceRef="validationCheck" targetRef="handleValidationError">
    <conditionExpression>${validationResult.valid == false}</conditionExpression>
  </sequenceFlow>
  <sequenceFlow id="flow6" sourceRef="processPayment" targetRef="successEnd"/>
  <sequenceFlow id="flow7" sourceRef="catchValidationException" targetRef="handleValidationError"/>
  <sequenceFlow id="flow8" sourceRef="catchPaymentException" targetRef="handlePaymentError"/>
  <sequenceFlow id="flow9" sourceRef="catchTimeout" targetRef="logTimeout"/>
  <sequenceFlow id="flow10" sourceRef="logTimeout" targetRef="validationCheck"/>
  <sequenceFlow id="flow11" sourceRef="handleValidationError" targetRef="errorEnd"/>
  <sequenceFlow id="flow12" sourceRef="handlePaymentError" targetRef="errorEnd"/>
  
</process>
```

### Example 2: Subprocess with Error Propagation

```xml
<process id="orderProcess" name="Order Processing">
  
  <error id="PaymentError" name="Payment Error" errorCode="PAY001"/>
  <error id="InventoryError" name="Inventory Error" errorCode="INV001"/>
  
  <startEvent id="start"/>
  
  <subProcess id="paymentSubProcess">
    
    <startEvent id="subPaymentStart"/>
    
    <serviceTask id="chargeCard" 
                 name="Charge Card" 
                 activiti:class="com.example.CardCharger">
      
      <boundaryEvent id="catchCardException">
        <activiti:mapException errorCode="PAY001">
          com.example.CardException
        </activiti:mapException>
        <errorEventDefinition errorRef="PaymentError"/>
      </boundaryEvent>
      
    </serviceTask>
    
    <endEvent id="subPaymentSuccess"/>
    
    <!-- Throw error if payment fails -->
    <endEvent id="subPaymentError">
      <errorEventDefinition errorRef="PaymentError"/>
    </endEvent>
    
    <sequenceFlow id="subFlow1" sourceRef="subPaymentStart" targetRef="chargeCard"/>
    <sequenceFlow id="subFlow2" sourceRef="chargeCard" targetRef="subPaymentSuccess"/>
    <sequenceFlow id="subFlow3" sourceRef="catchCardException" targetRef="subPaymentError"/>
    
  </subProcess>
  
  <!-- Catch error from subprocess -->
  <boundaryEvent id="catchSubProcessPaymentError" 
                 attachedToRef="paymentSubProcess">
    <errorEventDefinition errorRef="PaymentError"/>
  </boundaryEvent>
  
  <subProcess id="inventorySubProcess">
    
    <startEvent id="subInventoryStart"/>
    
    <serviceTask id="checkStock" 
                 name="Check Stock" 
                 activiti:class="com.example.InventoryChecker">
      
      <boundaryEvent id="catchInventoryException">
        <activiti:mapException errorCode="INV001">
          com.example.InventoryException
        </activiti:mapException>
        <errorEventDefinition errorRef="InventoryError"/>
      </boundaryEvent>
      
    </serviceTask>
    
    <endEvent id="subInventorySuccess"/>
    
    <sequenceFlow id="subFlow4" sourceRef="subInventoryStart" targetRef="checkStock"/>
    <sequenceFlow id="subFlow5" sourceRef="checkStock" targetRef="subInventorySuccess"/>
    
  </subProcess>
  
  <userTask id="handlePaymentFailure" name="Handle Payment Failure"/>
  <userTask id="completeOrder" name="Complete Order"/>
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="paymentSubProcess"/>
  <sequenceFlow id="flow2" sourceRef="paymentSubProcess" targetRef="inventorySubProcess"/>
  <sequenceFlow id="flow3" sourceRef="inventorySubProcess" targetRef="completeOrder"/>
  <sequenceFlow id="flow4" sourceRef="catchSubProcessPaymentError" targetRef="handlePaymentFailure"/>
  <sequenceFlow id="flow5" sourceRef="completeOrder" targetRef="end"/>
  <sequenceFlow id="flow6" sourceRef="handlePaymentFailure" targetRef="end"/>
  
</process>
```

### Example 3: Call Activity with Error Handling

```xml
<process id="mainProcess" name="Main Process">

  <error id="CalledProcessError" name="Called Process Error" errorCode="CALL001"/>

  <startEvent id="start"/>

  <callActivity id="callPaymentService"
                 name="Call Payment Service"
                 calledElement="paymentServiceProcess">

    <!-- Catch errors from called process -->
    <boundaryEvent id="catchCalledError"
                    attachedToRef="callPaymentService">
      <errorEventDefinition errorRef="CalledProcessError"/>
    </boundaryEvent>

  </callActivity>
  
  <userTask id="handleCalledError" name="Handle Called Process Error"/>
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="callPaymentService"/>
  <sequenceFlow id="flow2" sourceRef="callPaymentService" targetRef="end"/>
  <sequenceFlow id="flow3" sourceRef="catchCalledError" targetRef="handleCalledError"/>
  <sequenceFlow id="flow4" sourceRef="handleCalledError" targetRef="end"/>
  
</process>
```

## Runtime API

### Throwing Errors Programmatically

The core engine does **not** provide `runtimeService.throwError()`. The correct way to throw a BPMN error is from within a `JavaDelegate` by throwing a `BpmnError`:

```java
import org.activiti.engine.delegate.BpmnError;
import org.activiti.engine.delegate.JavaDelegate;
import org.activiti.engine.delegate.DelegateExecution;

public class PaymentService implements JavaDelegate {
    public void execute(DelegateExecution execution) {
        throw new BpmnError("PaymentError", "Payment processing failed");
    }
}
```

### Listening to Error Events

**Note:** The `ApplicationEventListener<BPMNErrorReceivedEvent>` pattern is part of the Activiti 7/8 API layer, not the core engine. In the core engine, use `ActivitiEventListener` instead:

```java
import org.activiti.engine.delegate.event.ActivitiEventListener;
import org.activiti.engine.delegate.event.ActivitiEvent;
import org.activiti.engine.delegate.event.ActivitiEventType;

public class ErrorEventListener implements ActivitiEventListener {

    @Override
    public void onEvent(ActivitiEvent event) {
        if (event.getType() == ActivitiEventType.ACTIVITY_ERROR_RECEIVED) {
            System.out.println("Error on activity: " + event.getActivityId());
            System.out.println("Execution: " + event.getExecutionId());
        }
    }

    @Override
    public boolean isFailOnException() {
        return false;
    }
}
```

### Querying Error Information

```java
// Get historic activity instances related to errors
List<HistoricActivityInstance> errorActivities = historyService
    .createHistoricActivityInstanceQuery()
    .processInstanceId(processInstanceId)
    .activityType("error")
    .list();
```

## Best Practices

### 1. Define Errors at Process Level

```xml
<!-- GOOD: Centralized error definitions -->
<process id="myProcess">
  <error id="PaymentError" name="Payment Error" errorCode="PAY001"/>
  <error id="ValidationError" name="Validation Error" errorCode="VAL001"/>
  
  <!-- Use errors throughout process -->
</process>

<!-- BAD: Inconsistent error references -->
<process id="myProcess">
  <!-- No error definitions, relying on implicit IDs -->
</process>
```

### 2. Use Meaningful Error Codes

```xml
<!-- GOOD: Descriptive codes -->
<error id="PaymentError" errorCode="PAY001"/>
<error id="InventoryError" errorCode="INV001"/>
<error id="TimeoutError" errorCode="TO001"/>

<!-- BAD: Generic codes -->
<error id="Error1" errorCode="ERR1"/>
<error id="Error2" errorCode="ERR2"/>
```

### 3. Map Specific Exceptions

```xml
<!-- GOOD: Specific exception mapping -->
<activiti:mapException errorCode="PAY001">
  com.example.CreditCardException
</activiti:mapException>

<!-- BAD: Too broad -->
<activiti:mapException errorCode="GEN001">
  java.lang.Exception
</activiti:mapException>
```

### 4. Provide Fallback Handlers

```xml
<!-- GOOD: Specific + generic handler -->
<boundaryEvent id="catchSpecific">
  <errorEventDefinition errorRef="PaymentError"/>
</boundaryEvent>

<boundaryEvent id="catchAny">
  <errorEventDefinition/> <!-- Catches any uncaught error -->
</boundaryEvent>
```

### 5. Document Error Scenarios

```xml
<!-- GOOD: Documented error handling -->
<!-- 
  Error Scenarios:
  - PAY001: Payment gateway timeout
  - PAY002: Invalid card number
  - PAY003: Insufficient funds
-->
<error id="PaymentError" name="Payment Error" errorCode="PAY001"/>
```

## Common Pitfalls

### 1. Missing Error Definitions

**Problem:** Referencing undefined errors

```xml
<!-- BAD: Error not defined -->
<errorEventDefinition errorRef="UndefinedError"/>

<!-- GOOD: Define error first -->
<error id="UndefinedError" name="Undefined Error"/>
<errorEventDefinition errorRef="UndefinedError"/>
```

### 2. Overlapping Exception Mappings

**Problem:** Multiple boundary events catching same exception

```xml
<!-- BAD: Both catch IOException -->
<boundaryEvent id="catch1">
  <activiti:mapException>java.io.IOException</activiti:mapException>
</boundaryEvent>

<boundaryEvent id="catch2">
  <activiti:mapException>java.io.IOException</activiti:mapException>
</boundaryEvent>

<!-- GOOD: Use specific subclasses or error codes -->
<boundaryEvent id="catch1">
  <activiti:mapException errorCode="FILE001">
    java.io.FileNotFoundException
  </activiti:mapException>
</boundaryEvent>
```

### 3. Uncaught Errors in Async Tasks

**Problem:** Errors in async tasks not properly handled

```xml
<!-- BAD: No error handling for async task -->
<serviceTask id="asyncTask" activiti:async="true"/>

<!-- GOOD: Add boundary event -->
<serviceTask id="asyncTask" activiti:async="true">
  <boundaryEvent id="catchError">
    <errorEventDefinition/>
  </boundaryEvent>
</serviceTask>
```

### 4. Error Propagation Confusion

**Problem:** Not understanding error bubbling

```xml
<!-- Error thrown here -->
<subProcess id="inner">
  <endEvent id="throwError">
    <errorEventDefinition errorRef="MyError"/>
  </endEvent>
</subProcess>

<!-- Must catch on subprocess, not inside -->
<boundaryEvent id="catchError" attachedToRef="inner">
  <errorEventDefinition errorRef="MyError"/>
</boundaryEvent>
```

### 5. Including Child Exceptions Unintentionally

**Problem:** Catching too broad exception hierarchy

```xml
<!-- BAD: Catches all RuntimeExceptions -->
<activiti:mapException includeChildExceptions="true">
  java.lang.RuntimeException
</activiti:mapException>

<!-- GOOD: Be specific -->
<activiti:mapException includeChildExceptions="true">
  com.example.MyBusinessException
</activiti:mapException>
```

## Related Documentation

- [Boundary Events](../events/boundary-event.md) - Error boundary events
- [End Events](../events/end-event.md) - Error end events
- [SubProcesses](../subprocesses/index.md) - Error propagation in subprocesses
- [Call Activity](../elements/call-activity.md) - Errors in called processes
- [Sequence Flows](../elements/sequence-flows.md) - Error handling paths

---

