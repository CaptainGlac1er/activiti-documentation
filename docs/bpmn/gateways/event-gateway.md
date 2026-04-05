---
sidebar_label: Event-Based Gateway
slug: /bpmn/gateways/event-gateway
title: "Event-Based Gateway"
description: "Complete guide to Event-Based Gateways in Activiti - routing process flow based on which event (message, timer, signal) occurs first."
---

# Event-Based Gateway

Event-Based Gateways route process flow based on **which event occurs first**. Unlike other gateways that use conditions, Event-Based Gateways wait for events (messages, timers, signals) and take the path corresponding to the first event that arrives.

## Overview

```xml
<eventBasedGateway id="eventGateway" name="Wait for Event"/>
```

**BPMN 2.0 Standard:** Fully Supported  
**Activiti Extensions:** Message, timer, signal events, exclusive/inclusive modes

## Key Features

### Standard BPMN Features
- **Event-Driven Routing** - Path selected by first occurring event
- **Multiple Event Types** - Messages, timers, signals
- **Exclusive Mode** - Only one path taken (default)
- **Inclusive Mode** - Multiple paths if events occur simultaneously
- **Wait Behavior** - Suspends until event occurs

### Activiti Extensions
- **Message Correlation** - Complex message matching
- **Timer Precision** - Configurable timer accuracy
- **Signal Broadcasting** - Global signal support
- **Async Execution** - Non-blocking event waiting

## How It Works

### Split Behavior (Diverging)

When the process reaches an Event-Based Gateway:
1. **Register all outgoing event listeners**
2. **Suspend process execution**
3. **Wait for first event to occur**
4. **Take corresponding path**
5. **Cancel other waiting events** (in exclusive mode)

### Join Behavior (Converging)

When paths converge at an Event-Based Gateway:
1. **Wait for event from any incoming path**
2. **Continue process flow**
3. **Typically used with sub-processes**

## Configuration Options

### 1. Basic Event-Based Gateway (Exclusive)

Wait for first message or timer:

```xml
<process id="orderWaitProcess" name="Order Wait Process">
  <startEvent id="start"/>
  
  <userTask id="submitOrder" name="Submit Order" activiti:assignee="${salesRep}"/>
  
  <eventBasedGateway id="waitGateway" name="Wait for Response" 
                     activiti:exclusive="true"/>
  
  <!-- Customer approves -->
  <sequenceFlow id="approveFlow" sourceRef="waitGateway" targetRef="approvalEvent">
    <messageEventDefinition messageRef="approvalMessage"/>
  </sequenceFlow>
  
  <!-- Customer rejects -->
  <sequenceFlow id="rejectFlow" sourceRef="waitGateway" targetRef="rejectionEvent">
    <messageEventDefinition messageRef="rejectionMessage"/>
  </sequenceFlow>
  
  <!-- Timeout after 48 hours -->
  <sequenceFlow id="timeoutFlow" sourceRef="waitGateway" targetRef="timeoutEvent">
    <timerEventDefinition>
      <timeDuration>PT48H</timeDuration>
    </timerEventDefinition>
  </sequenceFlow>
  
  <intermediateCatchEvent id="approvalEvent">
    <messageEventDefinition messageRef="approvalMessage"/>
  </intermediateCatchEvent>
  
  <intermediateCatchEvent id="rejectionEvent">
    <messageEventDefinition messageRef="rejectionMessage"/>
  </intermediateCatchEvent>
  
  <intermediateCatchEvent id="timeoutEvent">
    <timerEventDefinition>
      <timeDuration>PT48H</timeDuration>
    </timerEventDefinition>
  </intermediateCatchEvent>
  
  <serviceTask id="processApproval" name="Process Approval" activiti:class="com.example.ApprovalProcessor"/>
  </serviceTask>
  
  <serviceTask id="processRejection" name="Process Rejection" activiti:class="com.example.RejectionProcessor"/>
  </serviceTask>
  
  <serviceTask id="handleTimeout" name="Handle Timeout" activiti:class="com.example.TimeoutHandler"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="submitOrder"/>
  <sequenceFlow id="flow2" sourceRef="submitOrder" targetRef="waitGateway"/>
  <sequenceFlow id="flow3" sourceRef="approvalEvent" targetRef="processApproval"/>
  <sequenceFlow id="flow4" sourceRef="rejectionEvent" targetRef="processRejection"/>
  <sequenceFlow id="flow5" sourceRef="timeoutEvent" targetRef="handleTimeout"/>
  <sequenceFlow id="flow6" sourceRef="processApproval" targetRef="end"/>
  <sequenceFlow id="flow7" sourceRef="processRejection" targetRef="end"/>
  <sequenceFlow id="flow8" sourceRef="handleTimeout" targetRef="end"/>
</process>
```

**Message Definitions:**
```xml
<message id="approvalMessage" name="Customer Approval"/>
<message id="rejectionMessage" name="Customer Rejection"/>
```

**Behavior:**
- Waits for approval, rejection, or timeout
- First event to occur determines path
- Other waiting events are cancelled
- Exclusive mode (default)

### 2. Event-Based Gateway with Signal

Wait for global signal or message:

```xml
<eventBasedGateway id="signalGateway" name="Wait for Signal or Message"/>

<sequenceFlow id="messageFlow" sourceRef="signalGateway" targetRef="messageHandler">
  <messageEventDefinition messageRef="externalMessage"/>
</sequenceFlow>

<sequenceFlow id="signalFlow" sourceRef="signalGateway" targetRef="signalHandler">
  <signalEventDefinition signalRef="emergencySignal"/>
</sequenceFlow>
```

**Signal Definition:**
```xml
<signal id="emergencySignal" name="Emergency Signal"/>
```

**Runtime API:**
```java
// Send message
runtimeService.messageEventReceived("externalMessage", processInstanceId);

// Send signal (broadcasts to all waiting gateways)
runtimeService.signalEventReceived("emergencySignal");
```

### 3. Inclusive Event-Based Gateway

Allow multiple events if they occur simultaneously:

```xml
<eventBasedGateway id="inclusiveGateway" name="Inclusive Event Gateway" 
                   activiti:exclusive="false"/>

<sequenceFlow id="flow1" sourceRef="inclusiveGateway" targetRef="event1">
  <messageEventDefinition messageRef="message1"/>
</sequenceFlow>

<sequenceFlow id="flow2" sourceRef="inclusiveGateway" targetRef="event2">
  <messageEventDefinition messageRef="message2"/>
</sequenceFlow>
```

**Behavior:**
- If both messages arrive at same time → Both paths taken
- If only one arrives → Only that path taken
- Useful for correlated events

### 4. Event-Based Gateway for Competing Timers

Multiple timers, first to fire wins:

```xml
<eventBasedGateway id="timerGateway" name="Competing Timers"/>

<sequenceFlow id="shortTimer" sourceRef="timerGateway" targetRef="shortTimeout">
  <timerEventDefinition>
    <timeDuration>PT1H</timeDuration>
  </timerEventDefinition>
</sequenceFlow>

<sequenceFlow id="longTimer" sourceRef="timerGateway" targetRef="longTimeout">
  <timerEventDefinition>
    <timeDuration>PT24H</timeDuration>
  </timerEventDefinition>
</sequenceFlow>
```

**Behavior:**
- Short timer (1 hour) will always fire first
- Long timer is cancelled
- Useful for escalation scenarios

## Complete Real-World Examples

### Example 1: Customer Response with Escalation

```xml
<process id="customerResponseProcess" name="Customer Response Process">
  
  <message id="customerResponse" name="Customer Response"/>
  <message id="managerOverride" name="Manager Override"/>
  
  <startEvent id="start"/>
  
  <userTask id="contactCustomer" name="Contact Customer" activiti:assignee="${salesRep}"/>
  
  <eventBasedGateway id="responseGateway" name="Wait for Response">
    
    <!-- Customer responds within 24 hours -->
    <sequenceFlow id="customerFlow" sourceRef="responseGateway" targetRef="customerResponseEvent">
      <messageEventDefinition messageRef="customerResponse"/>
    </sequenceFlow>
    
    <!-- Manager overrides after 4 hours -->
    <sequenceFlow id="managerFlow" sourceRef="responseGateway" targetRef="managerResponseEvent">
      <messageEventDefinition messageRef="managerOverride"/>
    </sequenceFlow>
    
    <!-- Escalate after 24 hours -->
    <sequenceFlow id="escalationFlow" sourceRef="responseGateway" targetRef="escalationEvent">
      <timerEventDefinition>
        <timeDuration>PT24H</timeDuration>
      </timerEventDefinition>
    </sequenceFlow>
    
  </eventBasedGateway>
  
  <intermediateCatchEvent id="customerResponseEvent">
    <messageEventDefinition messageRef="customerResponse"/>
  </intermediateCatchEvent>
  
  <intermediateCatchEvent id="managerResponseEvent">
    <messageEventDefinition messageRef="managerOverride"/>
  </intermediateCatchEvent>
  
  <intermediateCatchEvent id="escalationEvent">
    <timerEventDefinition>
      <timeDuration>PT24H</timeDuration>
    </timerEventDefinition>
  </intermediateCatchEvent>
  
  <serviceTask id="processCustomerResponse" name="Process Customer Response" activiti:class="com.example.CustomerResponseHandler"/>
  </serviceTask>
  
  <serviceTask id="processManagerOverride" name="Process Manager Override" activiti:class="com.example.ManagerOverrideHandler"/>
  </serviceTask>
  
  <serviceTask id="escalateToSenior" name="Escalate to Senior Manager" activiti:class="com.example.EscalationService"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="contactCustomer"/>
  <sequenceFlow id="flow2" sourceRef="contactCustomer" targetRef="responseGateway"/>
  <sequenceFlow id="flow3" sourceRef="customerResponseEvent" targetRef="processCustomerResponse"/>
  <sequenceFlow id="flow4" sourceRef="managerResponseEvent" targetRef="processManagerOverride"/>
  <sequenceFlow id="flow5" sourceRef="escalationEvent" targetRef="escalateToSenior"/>
  <sequenceFlow id="flow6" sourceRef="processCustomerResponse" targetRef="end"/>
  <sequenceFlow id="flow7" sourceRef="processManagerOverride" targetRef="end"/>
  <sequenceFlow id="flow8" sourceRef="escalateToSenior" targetRef="end"/>
</process>
```

**Scenario:**
- Sales rep contacts customer
- Wait for customer response (24 hours max)
- Manager can override at any time
- If no response after 24 hours, escalate to senior manager
- First event to occur wins

### Example 2: Payment Method Selection

```xml
<process id="paymentProcess" name="Payment Method Selection">
  
  <message id="creditCardPayment" name="Credit Card Payment"/>
  <message id="bankTransfer" name="Bank Transfer"/>
  <message id="paypalPayment" name="PayPal Payment"/>
  
  <startEvent id="start"/>
  
  <userTask id="initiatePayment" name="Initiate Payment" activiti:assignee="${customer}"/>
  
  <eventBasedGateway id="paymentGateway" name="Wait for Payment">
    
    <sequenceFlow id="cardFlow" sourceRef="paymentGateway" targetRef="cardEvent">
      <messageEventDefinition messageRef="creditCardPayment"/>
    </sequenceFlow>
    
    <sequenceFlow id="transferFlow" sourceRef="paymentGateway" targetRef="transferEvent">
      <messageEventDefinition messageRef="bankTransfer"/>
    </sequenceFlow>
    
    <sequenceFlow id="paypalFlow" sourceRef="paymentGateway" targetRef="paypalEvent">
      <messageEventDefinition messageRef="paypalPayment"/>
    </sequenceFlow>
    
    <!-- Timeout after 30 minutes -->
    <sequenceFlow id="timeoutFlow" sourceRef="paymentGateway" targetRef="timeoutEvent">
      <timerEventDefinition>
        <timeDuration>PT30M</timeDuration>
      </timerEventDefinition>
    </sequenceFlow>
    
  </eventBasedGateway>
  
  <intermediateCatchEvent id="cardEvent">
    <messageEventDefinition messageRef="creditCardPayment"/>
  </intermediateCatchEvent>
  
  <intermediateCatchEvent id="transferEvent">
    <messageEventDefinition messageRef="bankTransfer"/>
  </intermediateCatchEvent>
  
  <intermediateCatchEvent id="paypalEvent">
    <messageEventDefinition messageRef="paypalPayment"/>
  </intermediateCatchEvent>
  
  <intermediateCatchEvent id="timeoutEvent">
    <timerEventDefinition>
      <timeDuration>PT30M</timeDuration>
    </timerEventDefinition>
  </intermediateCatchEvent>
  
  <serviceTask id="processCardPayment" name="Process Credit Card" activiti:class="com.example.CardPaymentProcessor"/>
  </serviceTask>
  
  <serviceTask id="processBankTransfer" name="Process Bank Transfer" activiti:class="com.example.TransferProcessor"/>
  </serviceTask>
  
  <serviceTask id="processPayPal" name="Process PayPal" activiti:class="com.example.PayPalProcessor"/>
  </serviceTask>
  
  <serviceTask id="handlePaymentTimeout" name="Handle Timeout" activiti:class="com.example.PaymentTimeoutHandler"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="initiatePayment"/>
  <sequenceFlow id="flow2" sourceRef="initiatePayment" targetRef="paymentGateway"/>
  <sequenceFlow id="flow3" sourceRef="cardEvent" targetRef="processCardPayment"/>
  <sequenceFlow id="flow4" sourceRef="transferEvent" targetRef="processBankTransfer"/>
  <sequenceFlow id="flow5" sourceRef="paypalEvent" targetRef="processPayPal"/>
  <sequenceFlow id="flow6" sourceRef="timeoutEvent" targetRef="handlePaymentTimeout"/>
  <sequenceFlow id="flow7" sourceRef="processCardPayment" targetRef="end"/>
  <sequenceFlow id="flow8" sourceRef="processBankTransfer" targetRef="end"/>
  <sequenceFlow id="flow9" sourceRef="processPayPal" targetRef="end"/>
  <sequenceFlow id="flow10" sourceRef="handlePaymentTimeout" targetRef="end"/>
</process>
```

**Behavior:**
- Customer can pay via multiple methods
- First payment method completed wins
- Timeout if no payment after 30 minutes
- Other payment options cancelled once one succeeds

### Example 3: Bid/Auction Process

```xml
<process id="auctionProcess" name="Auction Process">
  
  <message id="newBid" name="New Bid"/>
  <message id="auctionClosed" name="Auction Closed"/>
  
  <startEvent id="start"/>
  
  <serviceTask id="startAuction" name="Start Auction" activiti:class="com.example.AuctionStarter"/>
  </serviceTask>
  
  <eventBasedGateway id="bidGateway" name="Wait for Bids">
    
    <!-- New bid received -->
    <sequenceFlow id="bidFlow" sourceRef="bidGateway" targetRef="bidEvent">
      <messageEventDefinition messageRef="newBid"/>
    </sequenceFlow>
    
    <!-- Auction time expired -->
    <sequenceFlow id="expireFlow" sourceRef="bidGateway" targetRef="expireEvent">
      <timerEventDefinition>
        <timeDuration>PT7D</timeDuration>
      </timerEventDefinition>
    </sequenceFlow>
    
    <!-- Admin closes auction -->
    <sequenceFlow id="closeFlow" sourceRef="bidGateway" targetRef="closeEvent">
      <messageEventDefinition messageRef="auctionClosed"/>
    </sequenceFlow>
    
  </eventBasedGateway>
  
  <intermediateCatchEvent id="bidEvent">
    <messageEventDefinition messageRef="newBid"/>
  </intermediateCatchEvent>
  
  <intermediateCatchEvent id="expireEvent">
    <timerEventDefinition>
      <timeDuration>PT7D</timeDuration>
    </timerEventDefinition>
  </intermediateCatchEvent>
  
  <intermediateCatchEvent id="closeEvent">
    <messageEventDefinition messageRef="auctionClosed"/>
  </intermediateCatchEvent>
  
  <serviceTask id="processBid" name="Process Bid" activiti:class="com.example.BidProcessor"/>
  </serviceTask>
  
  <serviceTask id="endAuction" name="End Auction" activiti:class="com.example.AuctionEndProcessor"/>
  </serviceTask>
  
  <endEvent id="end"/>
  
  <sequenceFlow id="flow1" sourceRef="start" targetRef="startAuction"/>
  <sequenceFlow id="flow2" sourceRef="startAuction" targetRef="bidGateway"/>
  <sequenceFlow id="flow3" sourceRef="bidEvent" targetRef="processBid"/>
  <sequenceFlow id="flow4" sourceRef="processBid" targetRef="bidGateway"/>
  <sequenceFlow id="flow5" sourceRef="expireEvent" targetRef="endAuction"/>
  <sequenceFlow id="flow6" sourceRef="closeEvent" targetRef="endAuction"/>
  <sequenceFlow id="flow7" sourceRef="endAuction" targetRef="end"/>
</process>
```

**Behavior:**
- Auction runs for up to 7 days
- New bids keep auction active (loops back to gateway)
- Admin can close auction early
- Timer expires if no bids for 7 days

## Runtime API

### Sending Messages to Event Gateway

```java
// Send message to trigger specific path
runtimeService.messageEventReceived("customerResponse", processInstanceId);

// Send with variables
Map<String, Object> variables = Map.of("responseType", "APPROVED");
runtimeService.messageEventReceived("customerResponse", processInstanceId, variables);
```

### Sending Signals

```java
// Broadcast signal to all waiting event gateways
runtimeService.signalEventReceived("emergencySignal");
```

### Timer Management

```java
// Timers are automatic
// Can query timer jobs
List<Job> timerJobs = managementService.createJobQuery()
    .processInstanceId(processInstanceId)
    .list();
```

## Best Practices

1. **Clear Event Definitions** - Well-defined messages/signals/timers
2. **Timeout Always** - Include timer as fallback to prevent infinite waits
3. **Exclusive Mode** - Use exclusive (default) for most scenarios
4. **Event Cancellation** - Understand that non-selected events are cancelled
5. **Variable Scoping** - Plan how event variables flow into paths
6. **Testing** - Test all event scenarios and timing
7. **Monitoring** - Track waiting processes at event gateways

## Common Pitfalls

- **No Timeout** - Process can wait forever if no event occurs
- **Event Not Sent** - Message/signal never arrives
- **Wrong Event Type** - Using message when signal needed
- **Variable Loss** - Event variables not properly passed
- **Inclusive Confusion** - Not understanding simultaneous events
- **Timer Precision** - Timers may not fire exactly on time
- **Testing Gaps** - Not testing all event combinations

## Event-Based vs Other Gateways

| Feature | Event-Based | Exclusive | Parallel | Inclusive |
|---------|-------------|-----------|----------|-----------|
| **Routing** | First event | Condition | All paths | Selected paths |
| **Wait** | Yes (for event) | No | No | No |
| **Conditions** | Event types | Boolean | None | Boolean |
| **Parallel** | No | No | Yes | Yes |
| **Timeout** | Common | Rare | Rare | Rare |

## Related Documentation

- [Exclusive Gateway](./exclusive-gateway.md) - XOR logic (one path)
- [Parallel Gateway](./parallel-gateway.md) - AND logic (all paths)
- [Inclusive Gateway](./inclusive-gateway.md) - OR logic (one or more)
- [Complex Gateway](./complex-gateway.md) - Advanced conditions
- [Gateway Overview](./index.md) - All gateway types
- [Intermediate Events](../events/intermediate-events.md) - Event definitions

---

**Version:** 8.7.2-SNAPSHOT  
**Last Updated: 2026
