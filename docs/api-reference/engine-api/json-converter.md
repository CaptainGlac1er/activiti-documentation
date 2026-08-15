---
sidebar_label: JSON Converter
slug: /api-reference/engine-api/json-converter
title: "JSON Converter"
description: Converts between the Activiti BPMN modeler editor JSON format and the BpmnModel object model.
---

# Activiti JSON Converter Module

**Module:** `activiti-core/activiti-json-converter`

## Overview

The `activiti-json-converter` module converts between the **Activiti BPMN modeler's JSON format** and the `BpmnModel` object model. It is used by the Activiti modeler to serialize and deserialize process definitions created in the visual editor.

This module does **not** handle runtime objects (`ProcessInstance`, `Task`, etc.). Its sole purpose is translating the editor's JSON representation of BPMN diagrams into the `BpmnModel` in-memory object graph (and vice versa), which can then be converted to BPMN 2.0 XML.

## Package Structure

```
org.activiti.editor.constants
  |-- EditorJsonConstants        # JSON structure key constants
  |-- ModelDataJsonConstants     # Model metadata JSON key constants
  |-- StencilConstants           # Stencil ID and property name constants

org.activiti.editor.language.json.converter
  |-- BpmnJsonConverter          # Main entry point
  |-- BaseBpmnJsonConverter      # Abstract base for element converters
  |-- BpmnJsonConverterUtil      # Shared utility methods
  |-- ActivityProcessor          # Interface for nested element processing
  |-- FormAwareConverter         # Interface: form map injection
  |-- FormKeyAwareConverter      # Interface: form key map injection
  |-- DecisionTableAwareConverter    # Interface: decision table map injection
  |-- DecisionTableKeyAwareConverter # Interface: decision table key map injection
  |-- <Element>JsonConverter     # Per-element converters (see below)
  |-- util/
  |     |-- JsonConverterUtil    # JSON property extraction utilities
  |     |-- CollectionUtils      # Collection null-safety helpers

org.activiti.editor.language.json.model
  |-- ModelInfo                  # Simple POJO (id, name, key)
```

## Main API: BpmnJsonConverter

The `BpmnJsonConverter` class (`org.activiti.editor.language.json.converter.BpmnJsonConverter`) is the entry point with two conversion directions:

### BpmnModel to Editor JSON

```java
public ObjectNode convertToJson(BpmnModel model)
public ObjectNode convertToJson(BpmnModel model,
                                Map<String, ModelInfo> formKeyMap,
                                Map<String, ModelInfo> decisionTableKeyMap)
```

Converts a `BpmnModel` (including `Process`, flow elements, pools, lanes, graphics, and layout info) into the editor's JSON `ObjectNode`. The resulting JSON contains:

- `resourceId`: set to `"canvas"`
- `stencil`: `"BPMNDiagram"`
- `stencilset`: BPMN 2.0 stencilset reference
- `bounds`: canvas dimensions
- `childShapes`: array of shape nodes representing pools, lanes, flow elements, edges, and artifacts
- `properties`: process-level properties (ID, name, documentation, namespace, messages, signals, listeners, data objects)

The optional `formKeyMap` and `decisionTableKeyMap` resolve form and DMN decision table references to `ModelInfo` objects.

### Editor JSON to BpmnModel

```java
public BpmnModel convertToBpmnModel(JsonNode modelNode)
public BpmnModel convertToBpmnModel(JsonNode modelNode,
                                    Map<String, String> formKeyMap,
                                    Map<String, String> decisionTableKeyMap)
```

Parses the editor JSON into a `BpmnModel` with all processes, flow elements, pools, lanes, sequence flows, graphic info (`GraphicInfo`), and flow route geometry (`addFlowGraphicInfoList`). Uses geometry calculations (line-circle, line-rectangle, line-gateway intersections) to reconstruct connection routing.

The optional `formKeyMap` and `decisionTableKeyMap` resolve form and DMN references back to their keys.

## Converter Architecture

### Two Registries

`BpmnJsonConverter` maintains two static maps populated in a `static {}` block:

| Map | Key Type | Value | Direction |
|-----|----------|-------|-----------|
| `convertersToJsonMap` | `Class<? extends BaseElement>` | `Class<? extends BaseBpmnJsonConverter>` | BpmnModel -> JSON |
| `convertersToBpmnMap` | `String` (stencil ID) | `Class<? extends BaseBpmnJsonConverter>` | JSON -> BpmnModel |

Each element converter calls `fillTypes(...)` from the static block to register itself in both maps.

### BaseBpmnJsonConverter

Abstract class that all element converters extend. It handles:

- **Shape node creation**: `createChildShape()` with bounds, stencil, resource ID, child shapes, and outgoing references
- **Common BpmnModel -> JSON properties**:
  - `overrideid`, `name`, `documentation`
  - `asynchronousdefinition`, `exclusivedefinition`
  - Multi-instance: `multiinstance_type`, `multiinstance_cardinality`, `multiinstance_collection`, `multiinstance_variable`, `multiinstance_condition`
  - Task listeners (`tasklisteners`) and execution listeners (`executionlisteners`)
  - Data input/output associations
  - Form properties (`formproperties`)
  - Field extensions (`servicetaskfields`)
  - Event definitions (error, signal, message, timer, terminate)
- **Common JSON -> BpmnModel processing**:
  - Extracts `name`, `documentation` from properties
  - Converts execution listeners and task listeners
  - Converts multi-instance characteristics
  - Converts form properties for `StartEvent` and `UserTask`
  - Converts timer, signal, message, and error event definitions
  - Adds the element to the parent (`Process`, `SubProcess`, or `Lane`)

Every concrete converter must implement three abstract methods:

```java
protected abstract void convertElementToJson(ObjectNode propertiesNode, BaseElement baseElement);
protected abstract BaseElement convertJsonToElement(JsonNode elementNode, JsonNode modelNode, Map<String, JsonNode> shapeMap);
protected abstract String getStencilId(BaseElement baseElement);
```

## Element Converters

Each BPMN element type has a dedicated converter class. Below is the complete list:

### Start Events

**`StartEventJsonConverter`** handles:
- `StartNoneEvent` — with initiator, form key, and form properties
- `StartTimerEvent` — timer duration, cycle, date definitions
- `StartErrorEvent` — error reference
- `StartMessageEvent` — message reference
- `StartSignalEvent` — signal reference

Implements `FormAwareConverter` and `FormKeyAwareConverter` to resolve form references.

### End Events

**`EndEventJsonConverter`** handles:
- `EndNoneEvent` — default end event
- `EndErrorEvent` — error reference
- `EndCancelEvent` — cancel definition (for transactions)
- `EndTerminateEvent` — terminate definition with `terminateall` and `terminateMultiInstance` flags

### Boundary Events

**`BoundaryEventJsonConverter`** handles:
- `BoundaryTimerEvent` — timer definition
- `BoundaryErrorEvent` — error reference
- `BoundarySignalEvent` — signal reference
- `BoundaryMessageEvent` — message reference
- `BoundaryCancelEvent` — cancel definition
- `BoundaryCompensationEvent` — compensate definition

Resolves the attached-to activity by traversing the `outgoing` references of parent shapes.

### Intermediate Catch Events

**`CatchEventJsonConverter`** handles:
- `CatchTimerEvent` — timer definition
- `CatchSignalEvent` — signal reference
- `CatchMessageEvent` — message reference

### Intermediate Throw Events

**`ThrowEventJsonConverter`** handles:
- `ThrowNoneEvent` — message throw
- `ThrowSignalEvent` — signal throw

### Task Elements

| Converter | Stencil ID | BPMN Class | Notes |
|-----------|-----------|------------|-------|
| `UserTaskJsonConverter` | `UserTask` | `UserTask` | Assignee, candidates, priority, due date, form key, form properties, IDM integration. Implements `FormAwareConverter`, `FormKeyAwareConverter`. |
| `ServiceTaskJsonConverter` | `ServiceTask` | `ServiceTask` | Class/expression/delegate expression, result variable, field extensions, mail/Camel/Mule/DMN subtypes. Implements `DecisionTableKeyAwareConverter`. |
| `ScriptTaskJsonConverter` | `ScriptTask` | `ScriptTask` | Script format and script text. |
| `SendTaskJsonConverter` | `SendTask` | `SendTask` | Minimal implementation: empty `convertElementToJson`; `convertJsonToElement` returns a bare `SendTask`. |
| `ReceiveTaskJsonConverter` | `ReceiveTask` | `ReceiveTask` | — |
| `ManualTaskJsonConverter` | `ManualTask` | `ManualTask` | — |
| `BusinessRuleTaskJsonConverter` | `BusinessRule` | `BusinessRuleTask` | Rule class, input variables, result variable, rules list, exclude variables. |
| `MailTaskJsonConverter` | `MailTask` | `ServiceTask` (type="mail") | To, from, subject, CC, BCC, text, HTML, charset. |
| `CamelTaskJsonConverter` | `CamelTask` | `ServiceTask` (type="camel") | Camel context. |
| `MuleTaskJsonConverter` | `MuleTask` | `ServiceTask` (type="mule") | Endpoint URL, language, payload expression, result variable. |
| `DecisionTaskJsonConverter` | `DecisionTask` | `ServiceTask` (type="dmn") | DMN decision table reference. Implements `DecisionTableAwareConverter`. |

### Gateways

| Converter | Stencil ID | BPMN Class |
|-----------|-----------|------------|
| `ExclusiveGatewayJsonConverter` | `ExclusiveGateway` | `ExclusiveGateway` |
| `ParallelGatewayJsonConverter` | `ParallelGateway` | `ParallelGateway` |
| `InclusiveGatewayJsonConverter` | `InclusiveGateway` | `InclusiveGateway` |
| `EventGatewayJsonConverter` | `EventGateway` | `EventGateway` |

### Scope Constructs

| Converter | Stencil ID | BPMN Class | Notes |
|-----------|-----------|------------|-------|
| `SubProcessJsonConverter` | `SubProcess` | `SubProcess`, `Transaction` | Recursive via `ActivityProcessor`. Supports `istransaction` flag. Data objects. Implements all four `*AwareConverter` interfaces. |
| `EventSubProcessJsonConverter` | `EventSubProcess` | `SubProcess` (triggeredByEvent) | — |
| `CallActivityJsonConverter` | `CallActivity` | `CallActivity` | Called element, in/out parameters with source/sourceExpression/target. |

### Connectors & Artifacts

| Converter | Stencil ID | BPMN Class | Notes |
|-----------|-----------|------------|-------|
| `SequenceFlowJsonConverter` | `SequenceFlow` | `SequenceFlow` | Condition expressions (plain, variable-based, outcome-based), default flow flag, execution listeners. Overrides `convertToJson` for docker geometry. |
| `MessageFlowJsonConverter` | `MessageFlow` | `MessageFlow` | Source/target references. |
| `AssociationJsonConverter` | `Association` | `Association` | Source/target, association direction. |
| `TextAnnotationJsonConverter` | `TextAnnotation` | `TextAnnotation` | Text content. |
| `DataStoreJsonConverter` | `DataStore` | `DataStoreReference` | Data store reference. |

## Editor JSON Structure

The editor uses a stencil-based JSON format. Top-level structure:

```json
{
  "resourceId": "canvas",
  "stencil": { "id": "BPMNDiagram" },
  "stencilset": {
    "namespace": "http://b3mn.org/stencilset/bpmn2.0#",
    "url": "../editor/stencilsets/bpmn2.0/bpmn2.0.json"
  },
  "bounds": {
    "lowerRight": { "x": 1485, "y": 700 },
    "upperLeft": { "x": 0, "y": 0 }
  },
  "childShapes": [ ... ],
  "properties": {
    "process_id": "myProcess",
    "name": "My Process",
    ...
  }
}
```

Each shape node in `childShapes` has:

```json
{
  "resourceId": "shape_abc123",
  "stencil": { "id": "UserTask" },
  "bounds": {
    "lowerRight": { "x": 280, "y": 140 },
    "upperLeft": { "x": 140, "y": 70 }
  },
  "childShapes": [ ... ],
  "outgoing": [ { "resourceId": "flow_123" }, ... ],
  "properties": {
    "overrideid": "UserTask_1",
    "name": "Review Document",
    "documentation": "...",
    "asynchronousdefinition": false,
    "exclusivedefinition": true,
    ...
  }
}
```

Flow and edge nodes additionally include `dockers` (connection points) and `target`:

```json
{
  "resourceId": "flow_123",
  "stencil": { "id": "SequenceFlow" },
  "dockers": [ { "x": 50, "y": 25 }, { "x": 100, "y": 70 } ],
  "target": { "resourceId": "shape_def456" },
  "outgoing": [ { "resourceId": "shape_def456" } ],
  "properties": {
    "overrideid": "Flow_1",
    "name": "Approved",
    "conditionsequenceflow": "${approved == true}"
  }
}
```

Pool shapes contain nested `childShapes` with lane definitions, and their `outgoing` array can reference boundary events and message flows.

## Element Property Payloads

The modeler serializes each element's configuration as a flat `properties` object on the shape node (see [Editor JSON Structure](#editor-json-structure)). The property-name vocabulary is defined in `StencilConstants` (`activiti-core/activiti-json-converter/src/main/java/org/activiti/editor/constants/StencilConstants.java`). A modeler (or any programmatic producer of editor JSON) must emit these exact names, and a consumer must read them back.

### Property names per element type

| Element / concern | Property names | Notes |
|---|---|---|
| **Common (all shapes)** | `overrideid`, `name`, `documentation`, `asynchronousdefinition`, `exclusivedefinition` | Boolean properties accept `true`/`false` or `"Yes"`/`"No"` |
| **Process (canvas `properties`)** | `process_id`, `process_version`, `process_author`, `process_namespace`, `process_executable` | `process_executable` is written only when the process is *not* executable (value `"No"`); see [Modeler Integration Notes](#modeler-integration-notes) |
| **Service task** | `servicetaskclass`, `servicetaskexpression`, `servicetaskdelegateexpression`, `servicetaskresultvariable`, `servicetaskfields` | Class, expression, and delegate-expression are mutually exclusive; `servicetaskfields` is a wrapper object holding a `fields` array (each field: `name` plus `stringValue` or `expression`; `string` is also accepted when parsing) |
| **Mail task** | `mailtaskto`, `mailtaskfrom`, `mailtasksubject`, `mailtaskcc`, `mailtaskbcc`, `mailtasktext`, `mailtaskhtml`, `mailtaskcharset` | Stencil ID `MailTask`; converted to a `ServiceTask` of type `mail` |
| **Mule task** | `muletaskendpointurl`, `muletasklanguage`, `muletaskpayloadexpression`, `muletaskresultvariable` | Stencil ID `MuleTask`; converted to a `ServiceTask` of type `mule` |
| **DMN (decision) task** | `decisiontaskdecisiontablereference` | Stencil ID `DecisionTask`; value is an object with sub-keys `decisiontablereferenceid`, `decisiontablereferencename`, `decisionTableReferenceKey` |
| **Multi-instance (any activity)** | `multiinstance_type`, `multiinstance_cardinality`, `multiinstance_collection`, `multiinstance_variable`, `multiinstance_condition` | `multiinstance_type` is parsed case-insensitively (`sequential`/`parallel`; `none` disables multi-instance); `convertToJson` writes `Sequential`/`Parallel` |
| **Timer definitions** | `timerdurationdefinition`, `timercycledefinition`, `timerdatedefinition`, `timerenddatedefinition` | Used by start, catch, and boundary timer events. When parsing, a date takes precedence over a cycle, which takes precedence over a duration; `timerenddatedefinition` sets the end date of a cyclic timer |
| **User task** | `usertaskassignment`, `prioritydefinition`, `duedatedefinition`, `assignee`, `owner`, `candidateUsers`, `candidateGroups`, `categorydefinition`, `formkeydefinition` | |
| **Form properties (user task, start event)** | `formproperties` | Wrapper object holding a `formProperties` array; each property: `id`, `name`, `type`, `expression`, `variable`, `datePattern`, `required`, `readable`, `writable`, and `enumValues` (array of `{ "id", "name" }` items) when `type` is `enum` |
| **Listeners** | `tasklisteners`, `executionlisteners` | Wrapper objects; each listener item uses `event`, `className`, `expression`, `delegateExpression`, and `fields` |

### Property object examples

Each example is a complete shape node as it appears in `childShapes`.

**1. Service task with class implementation and one field injection**

```json
{
  "resourceId": "shape_service_1",
  "stencil": { "id": "ServiceTask" },
  "bounds": {
    "lowerRight": { "x": 320, "y": 140 },
    "upperLeft": { "x": 180, "y": 70 }
  },
  "outgoing": [ { "resourceId": "flow_1" } ],
  "properties": {
    "overrideid": "ServiceTask_1",
    "name": "Send Notification",
    "servicetaskclass": "com.example.notify.NotifyService",
    "servicetaskfields": {
      "fields": [
        { "name": "message", "stringValue": "Order approved" }
      ]
    }
  }
}
```

**2. User task with one form property**

```json
{
  "resourceId": "shape_usertask_1",
  "stencil": { "id": "UserTask" },
  "bounds": {
    "lowerRight": { "x": 460, "y": 140 },
    "upperLeft": { "x": 320, "y": 70 }
  },
  "outgoing": [ { "resourceId": "flow_2" } ],
  "properties": {
    "overrideid": "UserTask_1",
    "name": "Review Order",
    "assignee": "${manager}",
    "formproperties": {
      "formProperties": [
        { "id": "approved", "name": "Approved", "type": "boolean" }
      ]
    }
  }
}
```

**3. Timer boundary event (time duration)**

```json
{
  "resourceId": "shape_boundary_timer_1",
  "stencil": { "id": "BoundaryTimerEvent" },
  "bounds": {
    "lowerRight": { "x": 310, "y": 150 },
    "upperLeft": { "x": 280, "y": 120 }
  },
  "properties": {
    "overrideid": "BoundaryTimerEvent_1",
    "name": "Timeout",
    "timerdurationdefinition": "PT1H"
  }
}
```

A boundary event is a sibling shape, not a child shape: the attached activity's shape must list this shape's `resourceId` in its own `outgoing` array — that is how `BoundaryEventJsonConverter` resolves the attached reference.

**4. Multi-instance service task**

```json
{
  "resourceId": "shape_service_2",
  "stencil": { "id": "ServiceTask" },
  "bounds": {
    "lowerRight": { "x": 600, "y": 140 },
    "upperLeft": { "x": 460, "y": 70 }
  },
  "outgoing": [ { "resourceId": "flow_3" } ],
  "properties": {
    "overrideid": "ServiceTask_2",
    "name": "Process Items",
    "servicetaskexpression": "${itemService.process(item)}",
    "multiinstance_type": "parallel",
    "multiinstance_collection": "items",
    "multiinstance_variable": "item"
  }
}
```

## Property Constants

All JSON property names and stencil IDs are defined as constants:

- **`EditorJsonConstants`**: Structural keys — `childShapes`, `resourceId`, `properties`, `stencil`, `id`, `bounds`, `lowerRight`, `upperLeft`, `x`, `y`, `dockers`, `outgoing`, `items`.

- **`StencilConstants`**: Stencil IDs (`UserTask`, `ServiceTask`, `StartNoneEvent`, `ExclusiveGateway`, etc.) and property names (`overrideid`, `name`, `documentation`, `process_id`, `assignee`, `candidateUsers`, `servicetaskclass`, `formkeydefinition`, `timerdurationdefinition`, `multiinstance_type`, `asynchronousdefinition`, `conditionsequenceflow`, etc.).

- **`ModelDataJsonConstants`**: Model metadata keys — `modelId`, `name`, `revision`, `description`.

## ModelInfo

`ModelInfo` is a simple POJO with three fields (`id`, `name`, `key`) used to reference external models such as forms or DMN decision tables.

## Geometry Processing

When converting JSON to BpmnModel, `BpmnJsonConverter` reconstructs:

- **Shape positions**: Extracted from `bounds.upperLeft` and `bounds.lowerRight` into `GraphicInfo` objects stored in `bpmnModel.getLocationMap()`.
- **Flow routes**: Docker points on edges are converted into a list of `GraphicInfo` waypoints via `bpmnModel.addFlowGraphicInfoList()`. The converter uses geometric intersection calculations against circles (events), rectangles (tasks), and diamond polylines (gateways) to snap connection endpoints to element boundaries.

When converting BpmnModel to JSON, `GraphicInfo` positions and flow routes are written back into `bounds` and `dockers`.

## Namespace

Extension elements added during conversion use the namespace:

```
http://activiti.com/modeler   (prefix: modeler)
```

This namespace is defined as `NAMESPACE` in `BaseBpmnJsonConverter`.

## Conversion Flow

### BpmnModel -> JSON

1. `BpmnJsonConverter.convertToJson()` creates the root model node with bounds, stencil, and stencilset.
2. Process-level properties (ID, name, namespace, messages, signals, listeners, data objects) are written.
3. If pools exist, each pool and its lanes are converted with nested `childShapes`.
4. Flow elements are looked up in `convertersToJsonMap` by their Java class.
5. Each converter's `convertToJson()` is called, which delegates to `convertElementToJson()` for element-specific properties.
6. Sequence flows and boundary events are added to parent `outgoing` arrays.
7. Sub-processes recursively call back into `BpmnJsonConverter` via `ActivityProcessor.processFlowElements()`.

### JSON -> BpmnModel

1. `BpmnJsonConverter.convertToBpmnModel()` creates a new `BpmnModel`.
2. Shape `bounds` are recursively read into `GraphicInfo` objects via `readShapeDI()`.
3. Edge docker points are read and flow routes computed via `readEdgeDI()`.
4. Pool shapes are processed first, creating `Pool`, `Process`, and `Lane` objects.
5. Each shape's stencil ID is looked up in `convertersToBpmnMap`.
6. Each converter's `convertToBpmnModel()` calls `convertJsonToElement()` for element-specific parsing.
7. Sequence flows have their source/target resolved, and incoming/outgoing lists are populated in `postProcessElements()`.
8. Boundary events are attached to their parent activities.
9. Gateway flow ordering (stored as `EDITOR_FLOW_ORDER` extension elements) is applied and cleaned up.

## Helper Classes

### BpmnJsonConverterUtil

Static utility methods shared across converters:

- `createChildShape()` — builds a shape node with bounds, stencil, and empty childShapes/outgoing
- `createBoundsNode()` / `createPositionNode()` — builds bounds geometry nodes
- `createResourceNode()` — builds `{"resourceId": "..."}` nodes
- `getStencilId()` / `getElementId()` — extracts stencil ID and element override ID from a shape node
- `convertListenersToJson()` / `convertJsonToListeners()` — execution and task listener conversion
- `convertEventListenersToJson()` / `parseEventListeners()` — global event listener conversion
- `convertMessagesToJson()` / `convertJsonToMessages()` — message definition conversion
- `convertSignalDefinitionsToJson()` — signal definition conversion
- `convertDataPropertiesToJson()` / `convertJsonToDataProperties()` — valued data object conversion (string, int, long, double, boolean, datetime)
- `validateIfNodeIsTextual()` — recursively parses textually-encoded JSON nodes
- `lookForSourceRef()` — traverses childShapes to find which shape lists a given ID in its outgoing

### JsonConverterUtil

Lower-level JSON property extraction:

- `getPropertyValueAsString()` — reads a property from the shape's `properties` node
- `getPropertyValueAsBoolean()` — boolean conversion with "Yes"/"No" support
- `getPropertyValueAsList()` — comma-separated list splitting
- `getProperty()` — navigates to `objectNode.properties[name]`
- `getBpmnProcessModelChildShapesPropertyValues()` — recursive search for a property across all child shapes
- `getBpmnProcessModelFormReferences()` — finds form references on UserTask and StartNoneEvent shapes
- `getBpmnProcessModelDecisionTableReferences()` — finds decision table references on DecisionTask shapes
- `getAppModelReferencedProcessModels()` / `getAppModelReferencedModelIds()` — app model processing
- `JsonLookupResult` — inner class holding id, name, and JsonNode for lookup results

## Usage

The converter is typically used by the Activiti modeler REST layer:

```java
// Editor JSON -> BpmnModel (for deployment)
BpmnJsonConverter converter = new BpmnJsonConverter();
BpmnModel bpmnModel = converter.convertToBpmnModel(modelJsonNode, formKeyMap, decisionTableKeyMap);

// BpmnModel -> Editor JSON (for loading in the editor)
ObjectNode editorJson = converter.convertToJson(bpmnModel, formKeyMap, decisionTableKeyMap);
```

The resulting `BpmnModel` can be passed to `BpmnXMLConverter` to generate BPMN 2.0 XML for deployment.

### Full round trip: editor JSON to deployment

The complete pipeline from editor JSON to a deployed process definition:

```java
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.activiti.bpmn.converter.BpmnXMLConverter;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.editor.language.json.converter.BpmnJsonConverter;
import org.activiti.engine.RepositoryService;
import org.activiti.engine.repository.Deployment;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

// 1. Read the editor JSON produced by the modeler
byte[] jsonBytes = Files.readAllBytes(Paths.get("model.json"));
ObjectMapper objectMapper = new ObjectMapper();
JsonNode editorJson = objectMapper.readTree(jsonBytes);

// 2. Editor JSON -> BpmnModel
BpmnJsonConverter jsonConverter = new BpmnJsonConverter();
BpmnModel bpmnModel = jsonConverter.convertToBpmnModel(editorJson);

// 3. BpmnModel -> BPMN 2.0 XML
BpmnXMLConverter xmlConverter = new BpmnXMLConverter();
byte[] bpmnXml = xmlConverter.convertToXML(bpmnModel);

// 4. Deploy the generated XML
Deployment deployment = repositoryService.createDeployment()
        .addString("order-process.bpmn20.xml", new String(bpmnXml, StandardCharsets.UTF_8))
        .deploy();
```

Method signatures:

- `BpmnJsonConverter.convertToBpmnModel(JsonNode modelNode)` — or `convertToBpmnModel(JsonNode modelNode, Map<String, String> formKeyMap, Map<String, String> decisionTableKeyMap)`.
- `BpmnXMLConverter.convertToXML(BpmnModel model)` returns `byte[]` (UTF-8); an overload `convertToXML(BpmnModel model, String encoding)` accepts a different encoding.
- `RepositoryService.createDeployment()` returns a `DeploymentBuilder`; `DeploymentBuilder.addString(String resourceName, String text)` registers the resource, and `deploy()` performs the deployment.

### Modeler Integration Notes

- **Standalone libraries.** `activiti-json-converter` and `activiti-bpmn-layout` have no production consumer inside this repository — the Activiti modeler and its REST layer are not part of this codebase. These modules are consumed externally (the only in-repo references are the test suites of `activiti-bpmn-converter`).
- **Default target namespace.** `convertToBpmnModel` sets the model's target namespace to `http://activiti.org/test` up front, and only overrides it if the canvas `properties` node carries a non-empty `process_namespace` value. If the editor JSON has no `process_namespace` property, the generated `<definitions>` element carries `targetNamespace="http://activiti.org/test"`.
- **Non-executable marker.** `convertToJson` writes the canvas property `process_executable` with the value `"No"` for non-executable processes, and does the same for non-executable pools (collaborations). Executable processes and pools omit the property entirely.

### Custom Element Converter Registration

The converter uses two static maps populated at class load time:

- `convertersToJsonMap` — maps `Class<? extends BaseElement>` to JSON converters (BpmnModel → editor JSON)
- `convertersToBpmnMap` — maps stencil ID strings to BPMN converters (editor JSON → BpmnModel)

For custom BPMN elements, you can add converters to these maps. This requires modifying the static registration — typically done by creating a subclass of `BpmnJsonConverter` or using reflection:

```java
// Add custom converter for a proprietary element.
// Both maps are Map<?, Class<? extends BaseBpmnJsonConverter>> — the values must
// be converter CLASS objects (as every built-in fillTypes() does), not instances:
// convertersToJsonMap.put(MyCustomElement.class, MyCustomElementJsonConverter.class);
// convertersToBpmnMap.put("MyCustomElement", MyCustomElementJsonConverter.class);
```

This is an advanced customization for teams building proprietary modeler integrations.

### ModelInfo and Form/DMN Resolution

`ModelInfo` is a simple POJO with `id`, `name`, and `key` fields — it does not hold any maps itself. The conversion methods accept `formKeyMap` and `decisionTableKeyMap` as separate parameters. These maps are constructed by looking up referenced model IDs in the model registry, extracting the form key or decision table key from each `ModelInfo`, and passing the resulting maps to the converter:

```java
Map<String, String> formKeyMap = new HashMap<>();
formKeyMap.put("model-123", "my-form-key");

Map<String, String> decisionTableKeyMap = new HashMap<>();
decisionTableKeyMap.put("model-456", "my-decision-table-key");

BpmnModel model = converter.convertToBpmnModel(jsonNode, formKeyMap, decisionTableKeyMap);
```

## See Also

- [BPMN Model](./bpmn-model.mdx)
- [BPMN XML Converter](./bpmn-converter.mdx)
- [Model API](../../advanced/model-api.md) — Model staging, editing, and deployment workflow
