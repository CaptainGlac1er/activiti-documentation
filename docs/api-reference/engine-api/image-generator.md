---
sidebar_label: Image Generator
slug: /api-reference/engine-api/image-generator
description: Generate SVG process diagrams from BPMN models with activity and flow highlighting.
---

# Activiti Image Generator Module

**Module:** `activiti-core/activiti-image-generator`
**Package:** `org.activiti.image`

The `activiti-image-generator` module renders BPMN 2.0 process diagrams as SVG images from `BpmnModel` instances. It reads diagram interchange (layout) information embedded in the BPMN model and draws all BPMN constructs — events, tasks, gateways, flows, sub-processes, pools, lanes, and text annotations. The generated SVG supports activity-level and flow-level highlighting for visualizing process execution state.

**Dependencies:** Apache Batik (`SVGGraphics2D`, `DOMGroupManager`, `GenericDOMImplementation`).

## Module Contents

| Class | Package | Role |
|---|---|---|
| `ProcessDiagramGenerator` | `org.activiti.image` | Interface — entry point for diagram generation |
| `DefaultProcessDiagramGenerator` | `org.activiti.image.impl` | Implementation — walks the BPMN model and draws every element |
| `DefaultProcessDiagramCanvas` | `org.activiti.image.impl` | Drawing surface — wraps `ProcessDiagramSVGGraphics2D` with BPMN-specific draw methods |
| `ProcessDiagramSVGGraphics2D` | `org.activiti.image.impl` | Extends Apache Batik `SVGGraphics2D` to assign `id` attributes to SVG groups |
| `ProcessDiagramDOMGroupManager` | `org.activiti.image.impl` | Extends Batik `DOMGroupManager`; exposes `setCurrentGroupId(String)` |
| `IconType` | `org.activiti.image.impl.icon` | Abstract base for event-type icons (timer, message, error, signal, etc.) |
| `TaskIconType` | `org.activiti.image.impl.icon` | Abstract base for task-type icons (user, service, script, etc.) |
| `ActivitiImageException` | `org.activiti.image.exception` | Runtime exception for image-generation errors |
| `ActivitiInterchangeInfoNotFoundException` | `org.activiti.image.exception` | Thrown when the BPMN model lacks diagram interchange (layout) data |

### Icon Implementations

**Task icons** (extend `TaskIconType`):

| Class | BPMN Element |
|---|---|
| `UserTaskIconType` | User Task |
| `ServiceTaskIconType` | Service Task |
| `ScriptTaskIconType` | Script Task |
| `SendTaskIconType` | Send Task |
| `ReceiveTaskIconType` | Receive Task |
| `ManualTaskIconType` | Manual Task |
| `BusinessRuleTaskIconType` | Business Rule Task |

**Event icons** (extend `IconType`):

| Class | Event Type |
|---|---|
| `TimerIconType` | Timer events |
| `MessageIconType` | Message events |
| `ErrorIconType` / `ErrorThrowIconType` | Error events |
| `SignalIconType` / `SignalThrowIconType` | Signal events |
| `CompensateIconType` / `CompensateThrowIconType` | Compensation events |
| `LinkCatchIconType` / `LinkThrowIconType` | Link events |

## ProcessDiagramGenerator (Interface)

`org.activiti.image.ProcessDiagramGenerator` is the public API. All `generateDiagram` methods return an `InputStream` containing the rendered SVG.

```java
public interface ProcessDiagramGenerator {

    InputStream generateDiagram(BpmnModel bpmnModel,
                                List<String> highLightedActivities,
                                List<String> highLightedFlows);

    InputStream generateDiagram(BpmnModel bpmnModel,
                                List<String> highLightedActivities);

    InputStream generateDiagram(BpmnModel bpmnModel,
                                String activityFontName,
                                String labelFontName,
                                String annotationFontName);

    InputStream generateDiagram(BpmnModel bpmnModel,
                                List<String> highLightedActivities,
                                List<String> highLightedFlows,
                                String activityFontName,
                                String labelFontName,
                                String annotationFontName);

    InputStream generateDiagram(BpmnModel bpmnModel,
                                List<String> highLightedActivities,
                                List<String> highLightedFlows,
                                String activityFontName,
                                String labelFontName,
                                String annotationFontName,
                                boolean generateDefaultDiagram);

    InputStream generateDiagram(BpmnModel bpmnModel,
                                List<String> highLightedActivities,
                                List<String> highLightedFlows,
                                List<String> currentActivities,
                                List<String> erroredActivities,
                                String activityFontName,
                                String labelFontName,
                                String annotationFontName,
                                boolean generateDefaultDiagram,
                                String defaultDiagramImageFileName);

    String getDefaultActivityFontName();
    String getDefaultLabelFontName();
    String getDefaultAnnotationFontName();
    String getDefaultDiagramImageFileName();
}
```

### Parameter Summary

| Parameter | Description |
|---|---|
| `bpmnModel` | The `BpmnModel` containing BPMN elements and their `GraphicInfo` layout data |
| `highLightedActivities` | IDs of activities already traversed (completed path) — drawn with a **blue** highlight |
| `highLightedFlows` | IDs of sequence flows already traversed — drawn with a **blue** highlight |
| `currentActivities` | IDs of activities currently executing — drawn with a **green** highlight |
| `erroredActivities` | IDs of activities that failed — drawn with a **red** highlight |
| `activityFontName` | Font name for activity labels (default: `"Arial"`) |
| `labelFontName` | Font name for flow labels (default: `"Arial"`) |
| `annotationFontName` | Font name for text annotations (default: `"Arial"`) |
| `generateDefaultDiagram` | If `true`, returns a fallback `/image/na.svg` when no layout data exists instead of throwing |
| `defaultDiagramImageFileName` | Custom classpath resource for the fallback image |

### Exceptions

- **`ActivitiInterchangeInfoNotFoundException`** — thrown when `bpmnModel.hasDiagramInterchangeInfo()` is `false` and `generateDefaultDiagram` is `false`.
- **`ActivitiImageException`** — thrown when generating the image fails (e.g., SVG serialization error) or when the default diagram resource cannot be loaded.

## DefaultProcessDiagramGenerator

`org.activiti.image.impl.DefaultProcessDiagramGenerator` is the sole implementation. It orchestrates rendering by:

1. **Preparing the BPMN model** — normalizes all `GraphicInfo` coordinates so they are non-negative (`prepareBpmnModel`).
2. **Initializing the canvas** — computes bounding box from all pools, flow nodes, artifacts, and lanes, then creates a `DefaultProcessDiagramCanvas` sized to fit (`initProcessDiagramCanvas`).
3. **Drawing in order**:
   - Pools (`drawPoolOrLane`)
   - Lanes (`drawPoolOrLane`)
   - Flow nodes via `ActivityDrawInstruction` callbacks (`drawActivity`)
   - Artifacts (text annotations, associations) via `ArtifactDrawInstruction` callbacks (`drawArtifact`)
4. **Generating the SVG** — calls `canvas.generateImage()` which serializes the Batik DOM to a `ByteArrayInputStream`.

### Draw Instructions

Each BPMN element type has a registered draw instruction defined in the constructor:

```java
protected Map<Class<? extends BaseElement>, ActivityDrawInstruction> activityDrawInstructions;
protected Map<Class<? extends BaseElement>, ArtifactDrawInstruction> artifactDrawInstructions;
```

**ActivityDrawInstruction** covers: `StartEvent`, `EndEvent`, `IntermediateCatchEvent`, `ThrowEvent`, `BoundaryEvent`, `Task`, `UserTask`, `ScriptTask`, `ServiceTask`, `ReceiveTask`, `SendTask`, `ManualTask`, `BusinessRuleTask`, `ExclusiveGateway`, `InclusiveGateway`, `ParallelGateway`, `EventGateway`, `SubProcess`, `Transaction`, `EventSubProcess`, `CallActivity`.

**ArtifactDrawInstruction** covers: `TextAnnotation`, `Association`.

Instructions are accessible via getters/setters for customization:

```java
Map<Class<? extends BaseElement>, ActivityDrawInstruction> getActivityDrawInstructions();
void setActivityDrawInstructions(Map<...> instructions);
Map<Class<? extends BaseElement>, ArtifactDrawInstruction> getArtifactDrawInstructions();
void setArtifactDrawInstructions(Map<...> instructions);
```

### Highlighting Logic

Three distinct highlight colors are applied by element type:

| State | Color (RGB) | Task/CallActivity | Gateway | Event |
|---|---|---|---|---|
| **Current** (active) | `#57FFAE` | `drawHighLightCurrent` | `drawGatewayHighLight` | `drawEventHighLight` |
| **Completed** (path) | `#3399FF` | `drawHighLightCompleted` | `drawGatewayHighLightCompleted` | `drawEventHighLightCompleted` |
| **Errored** | `#FF3757` | `drawHighLightErrored` | `drawGatewayHighLightErrored` | `drawEventHighLightErrored` |

Highlight overlay is drawn on top of the base element. Highlighted sequence flows are rendered in `#3399FF` with a 2px stroke.

### Connection Perfectionizer

`connectionPerfectionizer()` adjusts the start and end points of sequence flows so they terminate on the boundary of the connected shapes (rectangle, rhombus, or ellipse) rather than at their centers. Uses `DefaultProcessDiagramCanvas.connectionPerfectionizer()` with shape-specific intersection calculations.

### getLineCenter

`getLineCenter()` calculates the midpoint along a multi-segment flow path for positioning labels.

## DefaultProcessDiagramCanvas

`org.activiti.image.impl.DefaultProcessDiagramCanvas` is the primary drawing surface. It wraps `ProcessDiagramSVGGraphics2D` (a Batik `SVGGraphics2D`) and provides 60+ draw methods for individual BPMN constructs.

### Constants

```java
// Colors
TASK_BOX_COLOR            = new Color(249, 249, 249)
SUBPROCESS_BOX_COLOR      = new Color(255, 255, 255)
EVENT_COLOR               = new Color(255, 255, 255)
CONNECTION_COLOR          = new Color(88, 88, 88)
HIGHLIGHT_CURRENT_COLOR   = new Color(87, 255, 174)
HIGHLIGHT_COMPLETED_ACTIVITY_COLOR = new Color(51, 153, 255)
HIGHLIGHT_ERRORED_ACTIVITY_COLOR  = new Color(255, 55, 87)
LABEL_COLOR               = new Color(112, 146, 190)
TASK_BORDER_COLOR         = new Color(187, 187, 187)
EVENT_BORDER_COLOR        = new Color(88, 88, 88)
SUBPROCESS_BORDER_COLOR   = new Color(0, 0, 0)

// Sizes
FONT_SIZE         = 11
ARROW_WIDTH       = 5
CONDITIONAL_INDICATOR_WIDTH = 16
DEFAULT_INDICATOR_WIDTH  = 10
MARKER_WIDTH    = 12
ICON_PADDING    = 5
TEXT_PADDING    = 3
ANNOTATION_TEXT_PADDING = 7
```

### Shape Drawing Methods

| Method | Draws |
|---|---|
| `drawNoneStartEvent(id, graphicInfo)` | Plain start event (circle) |
| `drawTimerStartEvent(id, graphicInfo)` | Timer start event |
| `drawSignalStartEvent(id, graphicInfo)` | Signal start event |
| `drawMessageStartEvent(id, graphicInfo)` | Message start event |
| `drawErrorStartEvent(id, graphicInfo)` | Error start event |
| `drawNoneEndEvent(id, name, graphicInfo)` | Plain end event (thick-bordered circle) |
| `drawErrorEndEvent(id, name, graphicInfo)` | Error end event |
| `drawCatchingTimerEvent(...)` | Intermediate/boundary timer catch |
| `drawCatchingMessageEvent(...)` | Intermediate/boundary message catch |
| `drawCatchingSignalEvent(...)` | Intermediate/boundary signal catch |
| `drawCatchingErrorEvent(...)` | Boundary error catch |
| `drawCatchingCompensateEvent(...)` | Boundary compensation catch |
| `drawCatchingLinkEvent(...)` | Intermediate link catch |
| `drawThrowingSignalEvent(...)` | Throw signal event |
| `drawThrowingCompensateEvent(...)` | Throw compensation event |
| `drawThrowingLinkEvent(...)` | Throw link event |
| `drawThrowingNoneEvent(...)` | Throw none event |

### Task Drawing Methods

| Method | Draws |
|---|---|
| `drawTask(id, name, graphicInfo)` | Generic task (rounded rectangle with icon) |
| `drawUserTask(id, name, graphicInfo)` | User task |
| `drawServiceTask(id, name, graphicInfo)` | Service task |
| `drawScriptTask(id, name, graphicInfo)` | Script task |
| `drawReceiveTask(id, name, graphicInfo)` | Receive task |
| `drawSendTask(id, name, graphicInfo)` | Send task |
| `drawManualTask(id, name, graphicInfo)` | Manual task |
| `drawBusinessRuleTask(id, name, graphicInfo)` | Business rule task |
| `drawCollapsedSubProcess(id, name, graphicInfo, isTriggeredByEvent)` | Collapsed sub-process |
| `drawCollapsedCallActivity(id, name, graphicInfo)` | Collapsed call activity |
| `drawExpandedSubProcess(id, name, graphicInfo, type)` | Expanded sub-process / transaction / event sub-process |

### Gateway Drawing Methods

| Method | Draws |
|---|---|
| `drawExclusiveGateway(id, graphicInfo)` | Exclusive gateway (X in rhombus) |
| `drawParallelGateway(id, graphicInfo)` | Parallel gateway (+ in rhombus) |
| `drawInclusiveGateway(id, graphicInfo)` | Inclusive gateway (circle in rhombus) |
| `drawEventBasedGateway(id, graphicInfo)` | Event-based gateway (pentagon in rhombus) |

### Flow & Artifact Methods

| Method | Draws |
|---|---|
| `drawSequenceflow(xPoints, yPoints, conditional, isDefault, highLighted)` | Sequence flow with optional arrow, conditional indicator, default indicator |
| `drawAssociation(xPoints, yPoints, direction, highLighted)` | Dashed association line |
| `drawPoolOrLane(id, name, graphicInfo)` | Pool or lane with vertical label |
| `drawTextAnnotation(id, text, graphicInfo)` | Note-shaped text annotation |
| `drawLabel(text, graphicInfo, centered)` | Flow label text |

### Marker Methods

| Method | Draws |
|---|---|
| `drawActivityMarkers(x, y, w, h, multiInstanceSequential, multiInstanceParallel, collapsed)` | Composed marker bar (multi-instance and/or collapsed) |
| `drawMultiInstanceMarker(sequential, x, y, w, h)` | Three horizontal lines (sequential) or three vertical lines (parallel) |
| `drawCollapsedMarker(x, y, w, h)` | Plus-sign in small rectangle |

### Highlight Overlay Methods

| Method | Color |
|---|---|
| `drawHighLightCurrent(graphicInfo)` | Green `#57FFAE` |
| `drawHighLightCompleted(graphicInfo)` | Blue `#3399FF` |
| `drawHighLightErrored(graphicInfo)` | Red `#FF3757` |
| `drawGatewayHighLightCompleted(graphicInfo)` | Blue (rhombus overlay) |
| `drawGatewayHighLightErrored(graphicInfo)` | Red (rhombus overlay) |
| `drawEventHighLightCompleted(graphicInfo)` | Blue (circle overlay) |
| `drawEventHighLightErrored(graphicInfo)` | Red (circle overlay) |

### Utility Methods

| Method | Purpose |
|---|---|
| `generateImage()` | Serializes the Batik SVG DOM to an `InputStream` (UTF-8) |
| `close()` | Disposes the graphics context |
| `connectionPerfectionizer(sourceShapeType, targetShapeType, ...)` | Adjusts flow endpoint coordinates to shape boundaries |
| `createShape(SHAPE_TYPE, GraphicInfo)` | Creates `Rectangle2D`, `Ellipse2D`, or `Path2D` for intersection math |
| `getIntersection(Shape, Line2D)` | Calculates where a flow line intersects a shape's border |
| `fitTextToWidth(original, width)` | Truncates text with "..." to fit available width |

### SHAPE_TYPE Enum

```java
public enum SHAPE_TYPE {
    Rectangle,   // Tasks, activities, text annotations
    Rhombus,     // Gateways
    Ellipse      // Events
}
```

## ProcessDiagramSVGGraphics2D

`org.activiti.image.impl.ProcessDiagramSVGGraphics2D` extends Apache Batik's `SVGGraphics2D`. It configures a custom `ProcessDiagramDOMGroupManager` and exposes:

```java
public void setCurrentGroupId(String id)
```

This assigns the `id` attribute to the current SVG `<g>` element, allowing generated SVG groups to be identified by BPMN element ID. Tests verify this with `svg.getElementById(elementId)`.

## ProcessDiagramDOMGroupManager

`org.activiti.image.impl.ProcessDiagramDOMGroupManager` extends Batik's `DOMGroupManager`. It stores the current `<g>` element and sets its `id` attribute when `setCurrentGroupId(String)` is called.

## IconType and TaskIconType

### IconType (abstract)

```java
public abstract class IconType {
    abstract Integer getWidth();
    abstract Integer getHeight();
    abstract String getAnchorValue();
    abstract String getFillValue();
    abstract String getStyleValue();
    abstract String getDValue();        // SVG path "d" attribute
    abstract String getStrokeValue();
    abstract String getStrokeWidth();
    abstract void drawIcon(int imageX, int imageY, int iconPadding,
                           ProcessDiagramSVGGraphics2D svgGenerator);
}
```

Two drawing strategies exist:

- **Event icons** (extend `IconType` directly, e.g., `TimerIconType`, `MessageIconType`): implement `drawIcon` using `fill`/`stroke` attributes on an SVG `<path>` inside a translated `<g>` tag. They return concrete `getWidth()`/`getHeight()` values for centering.

- **Task icons** (extend `TaskIconType`): `TaskIconType` provides a default `drawIcon` implementation that creates an SVG `<path>` with `anchors` and `style` attributes. Subclasses only override `getDValue()` (path data) and `getStyleValue()` (fill color). Methods like `getWidth()`, `getHeight()`, `getFillValue()` return `null`.

### TaskIconType (abstract)

```java
public abstract class TaskIconType extends IconType {
    // getAnchorValue() -> "top left"
    // getStrokeValue() -> null
    // getFillValue()   -> null
    // getWidth()       -> null
    // getHeight()      -> null
    // getStrokeWidth() -> null
    // drawIcon(...)    -> draws <g transform="translate(...)"> <path d="..." anchors="top left" style="..."> </g>
}
```

## Usage Examples

### Basic SVG Generation (No Highlights)

```java
ProcessDiagramGenerator generator = new DefaultProcessDiagramGenerator();

BpmnModel bpmnModel = repositoryService.getBpmnModel(processDefinitionId);

try (InputStream svgStream = generator.generateDiagram(
        bpmnModel,
        Collections.emptyList(),
        Collections.emptyList())) {

    // svgStream contains the SVG diagram
    Files.copy(svgStream, outputPath, StandardCopyOption.REPLACE_EXISTING);
}
```

### Highlight Current Activity

```java
ProcessDiagramGenerator generator = new DefaultProcessDiagramGenerator();

// Get the currently active activity IDs for a running process instance
List<String> activeActivityIds = runtimeService.getActiveActivityIds(processInstanceId);

BpmnModel bpmnModel = repositoryService.getBpmnModel(processDefinitionId);

try (InputStream svgStream = generator.generateDiagram(bpmnModel, activeActivityIds)) {
    // Activities in activeActivityIds are highlighted in green (#57FFAE)
}
```

### Highlight Completed Path (Activities + Flows)

```java
ProcessDiagramGenerator generator = new DefaultProcessDiagramGenerator();

// Collect completed activity IDs and flow IDs from history
List<String> highlightedActivities = historyService.createHistoricActivityInstanceQuery()
        .processInstanceId(processInstanceId)
        .finished()
        .list()
        .stream()
        .map(HistoricActivityInstance::getActivityId)
        .collect(Collectors.toList());

List<String> highlightedFlows = historyService.createHistoricActivityInstanceQuery()
        .processInstanceId(processInstanceId)
        .finished()
        .list()
        .stream()
        .flatMap(h -> h.getStartTime() != null
                ? h.getEndTime() != null ? Stream.of(h.getActivityId()) : Stream.empty()
                : Stream.empty())
        .collect(Collectors.toList());
// Or collect sequence flow IDs from HistoricSequenceFlow

BpmnModel bpmnModel = repositoryService.getBpmnModel(processDefinitionId);

try (InputStream svgStream = generator.generateDiagram(
        bpmnModel,
        highlightedActivities,
        highlightedFlows)) {
    // Activities and flows are highlighted in blue (#3399FF)
}
```

### Three-State Highlighting (Current, Completed, Errored)

```java
ProcessDiagramGenerator generator = new DefaultProcessDiagramGenerator();

List<String> highlightedActivities = getCompletedActivities(processInstanceId);
List<String> highlightedFlows = getCompletedFlows(processInstanceId);
List<String> currentActivities = runtimeService.getActiveActivityIds(processInstanceId);
List<String> erroredActivities = getErroredActivities(processInstanceId);

BpmnModel bpmnModel = repositoryService.getBpmnModel(processDefinitionId);

try (InputStream svgStream = generator.generateDiagram(
        bpmnModel,
        highlightedActivities,
        highlightedFlows,
        currentActivities,
        erroredActivities,
        "Arial", "Arial", "Arial",
        false, null)) {
    // Completed = blue, current = green, errored = red
}
```

### Custom Fonts and Fallback Diagram

```java
ProcessDiagramGenerator generator = new DefaultProcessDiagramGenerator();

BpmnModel bpmnModel = repositoryService.getBpmnModel(processDefinitionId);

try (InputStream svgStream = generator.generateDiagram(
        bpmnModel,
        Collections.emptyList(),
        Collections.emptyList(),
        "DejaVu Sans",      // activity font
        "DejaVu Sans",      // label font
        "DejaVu Sans",      // annotation font
        true,               // generateDefaultDiagram — don't throw if no layout data
        null)) {            // use default fallback image (/image/na.svg)

    // Returns the fallback SVG if bpmnModel.hasDiagramInterchangeInfo() is false
}
```

### Accessing SVG Element IDs

Each BPMN element in the generated SVG is wrapped in a `<g>` tag whose `id` attribute matches the element's BPMN `id`. This enables CSS targeting and DOM lookups:

```java
// The SVG output contains elements like:
// <g id="usertask1"> ... </g>
// <g id="exclusivegateway1"> ... </g>
// <g id="startevent1"> ... </g>
```

## Rendering Order

`DefaultProcessDiagramGenerator.generateProcessDiagram()` draws elements in this order:

1. **Pools** — `drawPoolOrLane()` for each `Pool` in the model
2. **Lanes** — `drawPoolOrLane()` for each `Lane` in each `Process`
3. **Flow nodes** — iterates `FlowNode`s via `findFlowElementsOfType(FlowNode.class)`:
   - Draw the shape (event circle, task rectangle, gateway rhombus, etc.)
   - Draw multi-instance and collapsed markers
   - Draw highlight overlays (current, completed, errored)
   - Draw outgoing sequence flows with arrowheads, conditional/default indicators
   - Draw sequence flow labels
   - Recurse into nested `FlowElementsContainer` children (sub-process contents)
4. **Artifacts** — text annotations and associations from each `Process` and `SubProcess`

## Default Values

| Setting | Default |
|---|---|
| Activity font name | `"Arial"` (bold, 11px) |
| Label font name | `"Arial"` (italic, 10px) |
| Annotation font name | `"Arial"` (plain, 11px) |
| Fallback diagram | `/image/na.svg` (classpath resource) |
| Task fill color | `#F9F9F9` |
| Task border color | `#BBBBBB` |
| Event fill color | `#FFFFFF` |
| Event border color | `#585858` |
| Connection color | `#585858` |
| Label color | `#7092BE` |

## See Also

- [BPMN Model](./bpmn-model.mdx)
- [BPMN Layout (GraphicInfo)](./bpmn-layout.mdx)
