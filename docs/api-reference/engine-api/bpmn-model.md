---
sidebar_label: BPMN Model
slug: /activiti-core/bpmn-model
description: Java object model for BPMN 2.0 diagrams with type-safe classes for all BPMN elements.
---

# Activiti BPMN Model Module - Technical Documentation

**Module:** `activiti-core/activiti-bpmn-model`

---

## Table of Contents

- [Overview](#overview)
- [BPMN 2.0 Specification](#bpmn-20-specification)
- [Model Architecture](#model-architecture)
- [Core Classes](#core-classes)
- [Flow Elements](#flow-elements)
- [Events](#events)
- [Gateways](#gateways)
- [Data Objects](#data-objects)
- [Model Traversal](#model-traversal)
- [Validation](#validation)
- [Serialization](#serialization)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-bpmn-model** module provides a Java object model for BPMN 2.0 diagrams. It represents the in-memory structure of BPMN processes, enabling programmatic manipulation, validation, and conversion of workflow definitions.

### Key Features

- **BPMN 2.0 Compliance**: Full support for BPMN 2.0 specification
- **Type-Safe Model**: Strongly-typed Java classes for all BPMN elements
- **Extensibility**: Support for custom properties and extensions
- **Validation**: Built-in model validation
- **Serialization**: XML and JSON support

### Module Structure

```
activiti-bpmn-model/
├── src/main/java/org/activiti/bpmn/model/
│   ├── BpmnModel.java              # Root model class
│   ├── BaseElement.java            # Base for all elements
│   ├── FlowElement.java            # Flow elements
│   ├── Activity.java               # Activities
│   ├── Gateway.java                # Gateways
│   ├── BPMNEvent.java              # Events
│   ├── DataObject.java             # Data objects
│   └── ...
└── src/test/java/
```

---

## Key Classes and Their Responsibilities

### BpmnModel

**Purpose:** Root container for the entire BPMN diagram. Represents a complete BPMN 2.0 definitions file.

**Responsibilities:**
- Holding all processes in the diagram
- Managing global elements (tasks, signals, errors)
- Providing element lookup by ID
- Storing namespace and metadata
- Tracking all flow elements
- Managing extensions and properties

**Key Properties:**
- `namespace` - BPMN namespace URI
- `processes` - List of Process objects
- `globalTasks` - Global task definitions
- `signals` - Global signal definitions
- `errors` - Global error definitions
- `elementsById` - Map for fast element lookup

**Key Methods:**
- `addProcess(Process)` - Add a process to model
- `getProcessById(String)` - Get process by ID
- `getElementById(String)` - Get any element by ID
- `getProcesses()` - Get all processes
- `getGlobalTasks()` - Get global task definitions

**When to Use:** This is your entry point to the BPMN model. All parsing and manipulation starts here.

**Design Pattern:** Composite pattern - contains and manages child elements

**Thread Safety:** Not thread-safe for modifications. Read operations are safe.

---

### Process

**Purpose:** Represents a single BPMN process definition within the model.

**Responsibilities:**
- Containing all flow elements of a process
- Managing process metadata (ID, name, type)
- Tracking data inputs and outputs
- Managing lane sets and pools
- Storing process properties
- Handling sub-processes

**Key Properties:**
- `id` - Process identifier
- `name` - Process name
- `processType` - Process type (public, private, collaborative)
- `isExecutable` - Whether process can be executed
- `flowElements` - All elements in the process
- `dataInputs` - Process-level data inputs
- `dataOutputs` - Process-level data outputs

**Key Methods:**
- `addFlowElement(FlowElement)` - Add element to process
- `getFlowElements()` - Get all flow elements
- `isExecutable()` - Check if executable
- `getLaneSets()` - Get lane sets
- `getProperty(String)` - Get process property

**When to Use:** When working with a specific process within a BPMN diagram.

**Design Pattern:** Container pattern - holds process elements

**Important:** A BpmnModel can contain multiple Process instances

---

### BaseElement

**Purpose:** Abstract base class for all BPMN elements. Provides common functionality.

**Responsibilities:**
- Storing element ID and name
- Managing element properties
- Handling extension elements
- Providing common metadata
- Supporting element identification
- Managing element documentation

**Key Properties:**
- `id` - Unique element identifier
- `name` - Human-readable name
- `extensions` - Custom extension elements
- `properties` - Key-value properties
- `documentation` - Element documentation

**Key Methods:**
- `getId()` / `setId()` - Element identification
- `getName()` / `setName()` - Element naming
- `addExtension(Extension)` - Add custom extension
- `setProperty(String, String)` - Set property
- `getProperty(String)` - Get property

**When to Use:** As base class for all BPMN elements. Provides common functionality.

**Design Pattern:** Base Class pattern - common functionality for all elements

**Inheritance:** All BPMN elements extend this class

---

### FlowElement

**Purpose:** Abstract base for elements that participate in process flow.

**Responsibilities:**
- Managing incoming sequence flows
- Managing outgoing sequence flows
- Tracking flow position
- Handling flow connectivity
- Managing flow properties
- Supporting flow traversal

**Key Properties:**
- `incoming` - List of incoming SequenceFlow
- `outgoing` - List of outgoing SequenceFlow
- `id` - Element identifier
- `name` - Element name

**Key Methods:**
- `addIncoming(SequenceFlow)` - Add incoming flow
- `addOutgoing(SequenceFlow)` - Add outgoing flow
- `getIncoming()` - Get incoming flows
- `getOutgoing()` - Get outgoing flows

**When to Use:** As base class for activities, gateways, and events.

**Design Pattern:** Base Class with aggregation of flows

**Subclasses:** Activity, Gateway, BPMNEvent, SequenceFlow

---

### Activity

**Purpose:** Abstract base for all BPMN activities (tasks, sub-processes).

**Responsibilities:**
- Defining activity behavior
- Managing activity properties
- Handling loop characteristics
- Managing I/O specifications
- Supporting event definitions
- Tracking activity state

**Key Properties:**
- `loopCardinality` - Loop iteration count
- `loopDataInputRef` - Loop input data
- `loopDataOutputRef` - Loop output data
- `isForCompletion` - Multi-instance completion
- `ioSpecifications` - Input/output specs
- `eventDefinitions` - Attached events

**Key Methods:**
- `isLoop()` - Check if looping activity
- `getLoopCardinality()` - Get loop count
- `addEventDefinition(EventDefinition)` - Add event
- `getSubProcesses()` - Get nested sub-processes

**When to Use:** As base class for all task types and sub-processes.

**Design Pattern:** Template Method - defines activity structure

**Subclasses:** Task, CallActivity, SubProcess, Transaction

---

### Task

**Purpose:** Base class for atomic work activities.

**Responsibilities:**
- Representing single unit of work
- Managing task implementation
- Handling task subject
- Supporting task properties
- Tracking task metadata
- Enabling task customization

**Key Properties:**
- `implementation` - Task implementation type
- `subject` - Task subject description
- `id` - Task identifier
- `name` - Task name

**Key Methods:**
- `getImplementation()` - Get implementation type
- `setImplementation(String)` - Set implementation
- `getSubject()` - Get subject

**When to Use:** As base for specific task types.

**Design Pattern:** Base Class for task hierarchy

**Subclasses:** UserTask, ServiceTask, ReceiveTask, SendTask, ManualTask, ScriptTask, BusinessRuleTask

---

### UserTask

**Purpose:** Represents a task performed by a human user.

**Responsibilities:**
- Defining human interaction points
- Managing assignee information
- Handling form configuration
- Supporting candidate users/groups
- Managing task properties
- Enabling form field definition

**Key Properties:**
- `assignedTo` - Task assignee expression
- `potentialStarter` - Users who can start
- `formKey` - Form identifier
- `formFields` - Form field definitions

**Key Methods:**
- `addFormField(FormField)` - Add form field
- `getFormFields()` - Get all form fields
- `getAssignedTo()` - Get assignee expression
- `setFormKey(String)` - Set form key

**When to Use:** For any task that requires human interaction.

**Design Pattern:** Specialized Task type

**Important:** Most common task type in business processes

---

### ServiceTask

**Purpose:** Represents automated service invocation.

**Responsibilities:**
- Defining service operations
- Managing implementation details
- Handling async execution
- Supporting configuration
- Managing operation references
- Enabling service integration

**Key Properties:**
- `operationRef` - Operation to invoke
- `implementation` - Implementation type (class, delegate, webService)
- `config` - Service configuration
- `isAsync` - Async execution flag
- `asyncExpiryTime` - Async expiry
- `asyncPriority` - Async priority

**Key Methods:**
- `isAsync()` - Check async mode
- `setAsync(boolean)` - Enable/disable async
- `getOperationRef()` - Get operation
- `getImplementation()` - Get implementation type

**When to Use:** For automated tasks that call external services or execute code.

**Design Pattern:** Specialized Task for automation

**Implementation Types:** class, delegateExpression, webService, operation

---

### Gateway

**Purpose:** Abstract base for decision points in process flow.

**Responsibilities:**
- Managing flow decisions
- Handling gateway types
- Supporting default flows
- Managing gateway properties
- Enabling flow control
- Tracking gateway state

**Key Properties:**
- `gatewayDirection` - Split/merge direction
- `defaultFlow` - Default outgoing flow
- `id` - Gateway identifier
- `name` - Gateway name

**Key Methods:**
- `getDefaultFlow()` - Get default flow
- `setDefaultFlow(String)` - Set default flow
- `getGatewayDirection()` - Get direction

**When to Use:** As base class for all gateway types.

**Design Pattern:** Base Class for gateway hierarchy

**Subclasses:** ExclusiveGateway, ParallelGateway, InclusiveGateway, EventBasedGateway, ComplexGateway

---

### ExclusiveGateway

**Purpose:** XOR gateway - chooses exactly one path based on conditions.

**Responsibilities:**
- Evaluating sequence flow conditions
- Selecting single outgoing path
- Managing default flow
- Supporting conditional logic
- Handling gateway decisions
- Enabling exclusive routing

**Key Properties:**
- `defaultFlow` - Flow when no condition matches
- `gatewayDirection` - Split or merge

**Key Methods:**
- `getDefaultFlow()` - Get default flow ID
- `setDefaultFlow(String)` - Set default flow

**When to Use:** For decision points where only one path should be taken.

**Design Pattern:** Specialized Gateway for exclusive choices

**Important:** Most common gateway type for business decisions

---

### ParallelGateway

**Purpose:** AND gateway - splits or joins parallel paths.

**Responsibilities:**
- Creating parallel execution paths
- Synchronizing parallel flows
- Managing fork/join behavior
- Supporting concurrent execution
- Handling parallel state
- Enabling parallel processing

**Key Properties:**
- `gatewayDirection` - Split (fork) or merge (join)

**Key Methods:**
- `getGatewayDirection()` - Get direction

**When to Use:** For parallel execution or synchronization points.

**Design Pattern:** Specialized Gateway for parallelism

**Behavior:** All outgoing paths taken (split), all incoming required (join)

---

### BPMNEvent

**Purpose:** Abstract base for all BPMN events.

**Responsibilities:**
- Defining event characteristics
- Managing event definitions
- Handling event properties
- Supporting event types
- Tracking event state
- Enabling event processing

**Key Properties:**
- `eventDefinitions` - List of event definitions
- `parallelMultiple` - Parallel multiple event
- `id` - Event identifier
- `name` - Event name

**Key Methods:**
- `addEventDefinition(EventDefinition)` - Add definition
- `getEventDefinitions()` - Get all definitions
- `isParallelMultiple()` - Check parallel mode

**When to Use:** As base class for all event types.

**Design Pattern:** Base Class for event hierarchy

**Subclasses:** StartEvent, EndEvent, IntermediateEvent, BoundaryEvent

---

### StartEvent

**Purpose:** Marks the beginning of a process instance.

**Responsibilities:**
- Initiating process execution
- Managing start conditions
- Handling event definitions
- Supporting interrupting behavior
- Tracking start metadata
- Enabling process initiation

**Key Properties:**
- `eventDefinitions` - Trigger conditions
- `isInterrupting` - Whether it interrupts
- `id` - Event identifier
- `name` - Event name

**Key Methods:**
- `addEventDefinition(EventDefinition)` - Add trigger
- `isInterrupting()` - Check interrupt mode
- `setInterrupting(boolean)` - Set interrupt mode
- `hasEventDefinition(Class)` - Check for trigger type

**When to Use:** As the starting point of every process.

**Design Pattern:** Specialized Event for process initiation

**Important:** Every executable process must have at least one StartEvent

---

### EndEvent

**Purpose:** Marks the completion of a process or flow.

**Responsibilities:**
- Signaling process completion
- Managing end conditions
- Handling event definitions
- Supporting termination
- Tracking end metadata
- Enabling process conclusion

**Key Properties:**
- `eventDefinitions` - End behaviors
- `id` - Event identifier
- `name` - Event name

**Key Methods:**
- `addEventDefinition(EventDefinition)` - Add behavior
- `isTerminate()` - Check if terminates process

**When to Use:** To mark process or sub-process completion.

**Design Pattern:** Specialized Event for process termination

**Types:** None, Terminate, Error, Signal, Message, etc.

---

### SequenceFlow

**Purpose:** Defines the order of execution between flow nodes.

**Responsibilities:**
- Connecting flow elements
- Managing flow direction
- Handling flow conditions
- Supporting flow properties
- Tracking flow state
- Enabling flow navigation

**Key Properties:**
- `sourceRef` - Source element ID
- `targetRef` - Target element ID
- `conditionExpression` - Flow condition
- `isDefault` - Whether it's default flow
- `id` - Flow identifier
- `name` - Flow name

**Key Methods:**
- `getSourceRef()` - Get source element
- `getTargetRef()` - Get target element
- `getConditionExpression()` - Get condition
- `isDefault()` - Check if default

**When to Use:** To connect any two flow elements.

**Design Pattern:** Link/Connection pattern

**Important:** Defines the actual execution path through the process

---

## Class Hierarchy Overview

```
BaseElement
├── FlowElement
│   ├── FlowNode
│   │   ├── Activity
│   │   │   ├── Task
│   │   │   │   ├── UserTask
│   │   │   │   ├── ServiceTask
│   │   │   │   ├── ReceiveTask
│   │   │   │   ├── SendTask
│   │   │   │   ├── ManualTask
│   │   │   │   ├── ScriptTask
│   │   │   │   └── BusinessRuleTask
│   │   │   ├── CallActivity
│   │   │   ├── SubProcess
│   │   │   └── Transaction
│   │   ├── Gateway
│   │   │   ├── ExclusiveGateway
│   │   │   ├── ParallelGateway
│   │   │   ├── InclusiveGateway
│   │   │   └── EventBasedGateway
│   │   └── BPMNEvent
│   │       ├── StartEvent
│   │       ├── EndEvent
│   │       ├── IntermediateEvent
│   │       └── BoundaryEvent
│   └── SequenceFlow
└── DataObject
```

---

## Architecture

### Supported Elements

**Activities:**
- Task
- User Task
- Service Task
- Receive Task
- Send Task
- Manual Task
- Script Task
- Business Rule Task
- Call Activity
- Sub-Process
- Transaction
- Ad-hoc Sub-Process

**Gateways:**
- Exclusive Gateway (XOR)
- Parallel Gateway (AND)
- Inclusive Gateway (OR)
- Event-Based Gateway
- Complex Gateway

**Events:**
- Start Event
- End Event
- Intermediate Event
- Boundary Event
- Event Sub-Process

**Event Types:**
- None
- Message
- Timer
- Signal
- Error
- Escalation
- Conditional
- Compensation
- Terminate
- Cancel

---

## Model Architecture

### Class Hierarchy

```
BaseElement
├── BaseModelElement
│   ├── FlowNode
│   │   ├── Activity
│   │   │   ├── Task
│   │   │   │   ├── UserTask
│   │   │   │   ├── ServiceTask
│   │   │   │   ├── ReceiveTask
│   │   │   │   ├── SendTask
│   │   │   │   ├── ManualTask
│   │   │   │   ├── ScriptTask
│   │   │   │   └── BusinessRuleTask
│   │   │   ├── CallActivity
│   │   │   ├── SubProcess
│   │   │   │   ├── EventSubProcess
│   │   │   │   └── AdhocSubProcess
│   │   │   └── Transaction
│   │   ├── Gateway
│   │   │   ├── ExclusiveGateway
│   │   │   ├── ParallelGateway
│   │   │   ├── InclusiveGateway
│   │   │   ├── EventBasedGateway
│   │   │   └── ComplexGateway
│   │   └── BPMNEvent
│   │       ├── StartEvent
│   │       ├── EndEvent
│   │       ├── IntermediateEvent
│   │       │   ├── IntermediateCatchEvent
│   │       │   └── IntermediateThrowEvent
│   │       └── BoundaryEvent
│   └── SequenceFlow
├── DataObject
│   ├── DataInput
│   ├── DataOutput
│   ├── DataStoreReference
│   └── DataInputAssociation
└── Artifact
    ├── Annotation
    ├── Association
    └── Group
```

### BpmnModel Class

```java
public class BpmnModel {
    
    private String namespace;
    private List<Process> processes = new ArrayList<>();
    private List<GlobalTask> globalTasks = new ArrayList<>();
    private List<GlobalBusinessRuleTask> globalBusinessRuleTasks = new ArrayList<>();
    private List<Signal> signals = new ArrayList<>();
    private List<Error> errors = new ArrayList<>();
    private List<Escalation> escalations = new ArrayList<>();
    private Map<String, BaseElement> elementsById = new HashMap<>();
    
    public void addProcess(Process process) {
        processes.add(process);
        indexElements(process);
    }
    
    public BaseElement getElementById(String id) {
        return elementsById.get(id);
    }
    
    private void indexElements(BaseElement element) {
        if (element != null && element.getId() != null) {
            elementsById.put(element.getId(), element);
        }
        // Recursively index children
    }
}
```

---

## Core Classes

### BaseElement

```java
public abstract class BaseElement {
    
    protected String id;
    protected String name;
    protected List<Extension> extensions = new ArrayList<>();
    protected Map<String, String> properties = new HashMap<>();
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public void addExtension(Extension extension) {
        extensions.add(extension);
    }
    
    public void setProperty(String key, String value) {
        properties.put(key, value);
    }
    
    public String getProperty(String key) {
        return properties.get(key);
    }
}
```

### Process

```java
public class Process extends BaseElement {
    
    private List<FlowElement> flowElements = new ArrayList<>();
    private List<DataInput> dataInputs = new ArrayList<>();
    private List<DataOutput> dataOutputs = new ArrayList<>();
    private String processType;
    private boolean isExecutable = true;
    
    public void addFlowElement(FlowElement element) {
        flowElements.add(element);
    }
    
    public List<FlowElement> getFlowElements() {
        return flowElements;
    }
    
    public boolean isExecutable() {
        return isExecutable;
    }
    
    public void setExecutable(boolean executable) {
        isExecutable = executable;
    }
}
```

---

## Flow Elements

### Activity

```java
public abstract class Activity extends FlowNode {
    
    protected List<SequenceFlow> incoming = new ArrayList<>();
    protected List<SequenceFlow> outgoing = new ArrayList<>();
    protected List<Property> properties = new ArrayList<>();
    protected List<IOSpecification> ioSpecifications = new ArrayList<>();
    protected List<EventDefinition> eventDefinitions = new ArrayList<>();
    protected boolean isForCompletion = false;
    protected String loopCardinality;
    protected String loopDataInputRef;
    protected String loopDataOutputRef;
    
    public void addIncoming(SequenceFlow flow) {
        incoming.add(flow);
    }
    
    public void addOutgoing(SequenceFlow flow) {
        outgoing.add(flow);
    }
    
    public boolean isLoop() {
        return loopCardinality != null || 
               loopDataInputRef != null || 
               loopDataOutputRef != null;
    }
}
```

### Task

```java
public class Task extends Activity {
    
    protected String implementation;
    protected String subject;
    
    // Task-specific properties
}
```

### UserTask

```java
public class UserTask extends Task {
    
    protected String assignedTo;
    protected List<String> potentialStarter = new ArrayList<>();
    protected String formKey;
    protected List<FormField> formFields = new ArrayList<>();
    
    public void addFormField(FormField field) {
        formFields.add(field);
    }
    
    public List<FormField> getFormFields() {
        return formFields;
    }
}
```

### ServiceTask

```java
public class ServiceTask extends Task {
    
    protected String operationRef;
    protected String implementation;
    protected String config;
    protected boolean isAsync = false;
    protected String asyncExpiryTime;
    protected String asyncPriority;
    
    public boolean isAsync() {
        return isAsync;
    }
    
    public void setAsync(boolean async) {
        isAsync = async;
    }
}
```

---

## Events

### StartEvent

```java
public class StartEvent extends BPMNEvent {
    
    protected List<EventDefinition> eventDefinitions = new ArrayList<>();
    protected boolean isInterrupting = true;
    
    public void addEventDefinition(EventDefinition definition) {
        eventDefinitions.add(definition);
    }
    
    public boolean isInterrupting() {
        return isInterrupting;
    }
    
    public void setInterrupting(boolean interrupting) {
        isInterrupting = interrupting;
    }
    
    public boolean hasEventDefinition(Class<? extends EventDefinition> type) {
        return eventDefinitions.stream()
            .anyMatch(d -> d.getClass().equals(type));
    }
}
```

### EndEvent

```java
public class EndEvent extends BPMNEvent {
    
    protected List<EventDefinition> eventDefinitions = new ArrayList<>();
    
    public void addEventDefinition(EventDefinition definition) {
        eventDefinitions.add(definition);
    }
    
    public boolean isTerminate() {
        return eventDefinitions.stream()
            .anyMatch(d -> d instanceof TerminateEventDefinition);
    }
}
```

### IntermediateEvent

```java
public abstract class IntermediateEvent extends BPMNEvent {
    
    protected List<EventDefinition> eventDefinitions = new ArrayList<>();
    
    public void addEventDefinition(EventDefinition definition) {
        eventDefinitions.add(definition);
    }
}

public class IntermediateCatchEvent extends IntermediateEvent {
    // Catches events (waits for)
}

public class IntermediateThrowEvent extends IntermediateEvent {
    // Throws events (triggers)
}
```

### BoundaryEvent

```java
public class BoundaryEvent extends BPMNEvent {
    
    protected Activity attachedToActivity;
    protected boolean isInterrupting = true;
    protected List<EventDefinition> eventDefinitions = new ArrayList<>();
    
    public void setAttachedToActivity(Activity activity) {
        this.attachedToActivity = activity;
    }
    
    public Activity getAttachedToActivity() {
        return attachedToActivity;
    }
    
    public boolean isInterrupting() {
        return isInterrupting;
    }
}
```

### Event Definitions

```java
public abstract class EventDefinition {
    // Base class for all event definitions
}

public class MessageEventDefinition extends EventDefinition {
    protected String messageRef;
}

public class TimerEventDefinition extends EventDefinition {
    protected String timeDate;
    protected String timeDuration;
    protected String timeCycle;
}

public class SignalEventDefinition extends EventDefinition {
    protected String signalRef;
}

public class ErrorEventDefinition extends EventDefinition {
    protected String errorRef;
}

public class ConditionalEventDefinition extends EventDefinition {
    protected String condition;
}
```

---

## Gateways

### ExclusiveGateway

```java
public class ExclusiveGateway extends Gateway {
    
    protected String defaultFlow;
    
    public String getDefaultFlow() {
        return defaultFlow;
    }
    
    public void setDefaultFlow(String defaultFlow) {
        this.defaultFlow = defaultFlow;
    }
}
```

### ParallelGateway

```java
public class ParallelGateway extends Gateway {
    // No additional properties - pure AND logic
}
```

### InclusiveGateway

```java
public class InclusiveGateway extends Gateway {
    
    protected String defaultFlow;
    
    // OR logic - multiple paths can be taken
}
```

### EventBasedGateway

```java
public class EventBasedGateway extends Gateway {
    
    protected boolean isInstantiating = false;
    protected boolean isInterrupting = true;
    
    // Waits for events to determine path
}
```

---

## Data Objects

### DataObject

```java
public class DataObject extends FlowElement {
    
    protected String structureRef;
    protected ItemDefinition itemSubject;
    protected String dataState;
    
    public ItemDefinition getItemSubject() {
        return itemSubject;
    }
    
    public void setItemSubject(ItemDefinition itemSubject) {
        this.itemSubject = itemSubject;
    }
}
```

### DataInput/DataOutput

```java
public class DataInput extends DataElement {
    protected String inputSetRef;
}

public class DataOutput extends DataElement {
    protected String outputSetRef;
}
```

### Data Associations

```java
public abstract class DataAssociation {
    
    protected List<String> sourceRef = new ArrayList<>();
    protected List<String> targetRef = new ArrayList<>();
    protected String assignment;
    protected String transformation;
    
    public void addSourceRef(String ref) {
        sourceRef.add(ref);
    }
    
    public void addTargetRef(String ref) {
        targetRef.add(ref);
    }
}
```

---

## Model Traversal

### Visitor Pattern

```java
public interface BpmnModelVisitor {
    void visit(Process process);
    void visit(FlowNode flowNode);
    void visit(Activity activity);
    void visit(Gateway gateway);
    void visit(BPMNEvent event);
    void visit(SequenceFlow sequenceFlow);
    void visit(DataObject dataObject);
}

public class BpmnModelTraverser {
    
    public static void traverse(BpmnModel model, BpmnModelVisitor visitor) {
        for (Process process : model.getProcesses()) {
            visitor.visit(process);
            traverseFlowElements(process.getFlowElements(), visitor);
        }
    }
    
    private static void traverseFlowElements(
            List<FlowElement> elements, 
            BpmnModelVisitor visitor) {
        
        for (FlowElement element : elements) {
            if (element instanceof FlowNode) {
                visitor.visit((FlowNode) element);
                // Traverse children
            } else if (element instanceof SequenceFlow) {
                visitor.visit((SequenceFlow) element);
            } else if (element instanceof DataObject) {
                visitor.visit((DataObject) element);
            }
        }
    }
}
```

### Search Utilities

```java
public class ModelSearchUtil {
    
    public static List<UserTask> findUserTasks(BpmnModel model) {
        return findElements(model, UserTask.class);
    }
    
    public static List<ServiceTask> findServiceTasks(BpmnModel model) {
        return findElements(model, ServiceTask.class);
    }
    
    public static Activity findActivityById(BpmnModel model, String id) {
        BaseElement element = model.getElementById(id);
        if (element instanceof Activity) {
            return (Activity) element;
        }
        return null;
    }
    
    private static <T extends BaseElement> List<T> findElements(
            BpmnModel model, 
            Class<T> type) {
        
        List<T> results = new ArrayList<>();
        
        for (Process process : model.getProcesses()) {
            findElementsInProcess(process, type, results);
        }
        
        return results;
    }
    
    private static <T extends BaseElement> void findElementsInProcess(
            Process process, 
            Class<T> type, 
            List<T> results) {
        
        for (FlowElement element : process.getFlowElements()) {
            if (type.isInstance(element)) {
                results.add(type.cast(element));
            }
            if (element instanceof Activity) {
                // Check sub-processes
                Activity activity = (Activity) element;
                if (activity.getSubProcesses() != null) {
                    for (SubProcess subProcess : activity.getSubProcesses()) {
                        findElementsInProcess(subProcess, type, results);
                    }
                }
            }
        }
    }
}
```

---

## Validation

### Model Validator

```java
public class BpmnModelValidator {
    
    public static ValidationResult validate(BpmnModel model) {
        ValidationResult result = new ValidationResult();
        
        // Check for duplicate IDs
        checkDuplicateIds(model, result);
        
        // Check for orphaned elements
        checkOrphanedElements(model, result);
        
        // Check for valid connections
        checkConnections(model, result);
        
        // Check for required properties
        checkRequiredProperties(model, result);
        
        return result;
    }
    
    private static void checkDuplicateIds(
            BpmnModel model, 
            ValidationResult result) {
        
        Set<String> ids = new HashSet<>();
        
        for (Process process : model.getProcesses()) {
            checkDuplicateIdsInProcess(process, ids, result);
        }
    }
    
    private static void checkRequiredProperties(
            BpmnModel model, 
            ValidationResult result) {
        
        for (Process process : model.getProcesses()) {
            if (process.getId() == null) {
                result.addError("Process must have an ID");
            }
            
            for (FlowElement element : process.getFlowElements()) {
                if (element instanceof Activity) {
                    Activity activity = (Activity) element;
                    if (activity.getId() == null) {
                        result.addError("Activity must have an ID");
                    }
                }
            }
        }
    }
}
```

---

## Serialization

### XML Serialization

```java
public class BpmnModelSerializer {
    
    public static String toXml(BpmnModel model) {
        StringWriter writer = new StringWriter();
        serialize(model, writer);
        return writer.toString();
    }
    
    private static void serialize(BpmnModel model, Writer writer) {
        try {
            writer.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            writer.write("<definitions xmlns=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">\n");
            
            for (Process process : model.getProcesses()) {
                serializeProcess(process, writer, 2);
            }
            
            writer.write("</definitions>");
        } catch (IOException e) {
            throw new SerializationException("Failed to serialize model", e);
        }
    }
}
```

### JSON Serialization

```java
public class BpmnModelJsonSerializer {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public String toJson(BpmnModel model) {
        try {
            return objectMapper.writeValueAsString(model);
        } catch (JsonProcessingException e) {
            throw new SerializationException("Failed to serialize to JSON", e);
        }
    }
    
    public BpmnModel fromJson(String json) {
        try {
            return objectMapper.readValue(json, BpmnModel.class);
        } catch (JsonProcessingException e) {
            throw new DeserializationException("Failed to deserialize from JSON", e);
        }
    }
}
```

---

## Usage Examples

### Creating a Model Programmatically

```java
public class ModelBuilderExample {
    
    public BpmnModel createSimpleProcess() {
        BpmnModel model = new BpmnModel();
        
        // Create process
        Process process = new Process();
        process.setId("myProcess");
        process.setName("My Process");
        model.addProcess(process);
        
        // Create start event
        StartEvent startEvent = new StartEvent();
        startEvent.setId("start");
        startEvent.setName("Start");
        process.addFlowElement(startEvent);
        
        // Create user task
        UserTask userTask = new UserTask();
        userTask.setId("task1");
        userTask.setName("User Task");
        process.addFlowElement(userTask);
        
        // Create end event
        EndEvent endEvent = new EndEvent();
        endEvent.setId("end");
        endEvent.setName("End");
        process.addFlowElement(endEvent);
        
        // Create sequence flows
        SequenceFlow flow1 = new SequenceFlow();
        flow1.setId("flow1");
        flow1.setSourceRef(startEvent);
        flow1.setTargetRef(userTask);
        process.addFlowElement(flow1);
        
        SequenceFlow flow2 = new SequenceFlow();
        flow2.setId("flow2");
        flow2.setSourceRef(userTask);
        flow2.setTargetRef(endEvent);
        process.addFlowElement(flow2);
        
        return model;
    }
}
```

### Analyzing a Model

```java
public class ModelAnalyzer {
    
    public void analyze(BpmnModel model) {
        System.out.println("Process Count: " + model.getProcesses().size());
        
        for (Process process : model.getProcesses()) {
            System.out.println("\nProcess: " + process.getName());
            
            int taskCount = 0;
            int gatewayCount = 0;
            int eventCount = 0;
            
            for (FlowElement element : process.getFlowElements()) {
                if (element instanceof Task) {
                    taskCount++;
                } else if (element instanceof Gateway) {
                    gatewayCount++;
                } else if (element instanceof BPMNEvent) {
                    eventCount++;
                }
            }
            
            System.out.println("  Tasks: " + taskCount);
            System.out.println("  Gateways: " + gatewayCount);
            System.out.println("  Events: " + eventCount);
        }
    }
}
```

---

## Best Practices

### 1. Use Meaningful IDs

```java
// GOOD
userTask.setId("approve_order");

// BAD
userTask.setId("task1");
```

### 2. Validate Early

```java
ValidationResult result = BpmnModelValidator.validate(model);
if (!result.isValid()) {
    throw new ModelValidationException(result.getErrors());
}
```

### 3. Use Builders for Complex Models

```java
BpmnModel model = BpmnModelBuilder.create()
    .process("orderProcess")
    .startEvent("start")
    .userTask("approve")
        .assignee("${manager}")
    .endEvent("end")
    .build();
```

### 4. Document Custom Properties

```java
userTask.setProperty("custom:department", "sales");
userTask.setProperty("custom:priority", "high");
```

---

## API Reference

### Key Classes

- `BpmnModel` - Root model container
- `Process` - BPMN process definition
- `FlowElement` - Base for flow elements
- `Activity` - Task and sub-process base
- `Gateway` - Decision points
- `BPMNEvent` - Event base class
- `SequenceFlow` - Flow connections

### Key Interfaces

- `BpmnModelVisitor` - Model traversal
- `BpmnModelSerializer` - Serialization
- `BpmnModelValidator` - Validation

---

## See Also

- [Parent Module Documentation](../overview.md)
- [BPMN Converter](../engine-api/bpmn-converter.md)
- [Engine Documentation](../engine-api/README.md)
