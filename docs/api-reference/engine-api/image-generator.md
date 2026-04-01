---
sidebar_label: Image Generator
slug: /activiti-core/image-generator
description: Generate visual representations of BPMN process diagrams with highlighting and custom styling.
---

# Activiti Image Generator Module - Technical Documentation

**Module:** `activiti-core/activiti-image-generator`

**Target Audience:** Senior Software Engineers, UI/UX Developers

**Version:** 8.7.2-SNAPSHOT

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Image Rendering Pipeline](#image-rendering-pipeline)
- [Style Templates](#style-templates)
- [Highlighting Logic](#highlighting-logic)
- [Format Support](#format-support)
- [Performance Optimization](#performance-optimization)
- [Customization](#customization)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

The **activiti-image-generator** module provides capabilities to generate visual representations of BPMN process diagrams. It creates PNG, SVG, and other image formats from BPMN models, with support for highlighting active execution paths, custom styling, and various output configurations.

This module is essential for:
- **Process visualization** in user interfaces
- **Audit and reporting** of process execution
- **Debugging** workflow behavior
- **Documentation** generation
- **Monitoring dashboards** showing active processes

### Key Features

- **Multiple Formats**: PNG, SVG, PDF support with format-specific optimizations
- **Process Highlighting**: Show active execution paths in real-time
- **Custom Styling**: Themes, color schemes, and element-specific styles
- **Zoom Levels**: Multiple resolution outputs for different display needs
- **Annotation Support**: Render labels, descriptions, and custom annotations
- **Performance Optimized**: Fast rendering for large diagrams with caching
- **Extensible Pipeline**: Custom renderers and style templates

### Module Structure

```
activiti-image-generator/
├── src/main/java/org/activiti/image/
│   ├── ImageGenerator.java              # Main generation API
│   ├── renderers/
│   │   ├── PngRenderer.java             # PNG image output
│   │   ├── SvgRenderer.java             # SVG vector output
│   │   ├── PdfRenderer.java             # PDF document output
│   │   └── ConnectionRenderer.java      # Flow connection rendering
│   ├── styles/
│   │   ├── StyleTemplate.java           # Style configuration
│   │   ├── DefaultStyle.java            # Default styling
│   │   ├── CustomStyle.java             # Custom styling
│   │   └── HighlightStyle.java          # Highlight styling
│   ├── highlight/
│   │   ├── HighlightManager.java        # Highlight control
│   │   ├── PathHighlighter.java         # Path calculation
│   │   └── HighlightData.java           # Highlight information
│   ├── utils/
│   │   ├── DiagramCalculator.java       # Diagram metrics
│   │   ├── ImageUtils.java              # Image utilities
│   │   └── TextRenderer.java            # Text rendering
│   └── model/
│       ├── DiagramElement.java          # Element representation
│       ├── DiagramConnection.java       # Connection representation
│       └── DiagramData.java             # Complete diagram data
└── src/test/java/
```

---

## Key Classes and Their Responsibilities

### ImageGenerator

**Purpose:** Main entry point for generating process diagram images from BPMN models.

**Responsibilities:**
- Coordinating the complete image generation pipeline
- Managing renderer selection based on output format
- Applying style templates to diagrams
- Handling highlight overlays for active processes
- Managing image caching and optimization
- Providing unified API for all image operations

**Key Properties:**
- `styleTemplate` - Current style configuration
- `highlightManager` - Active highlight settings
- `rendererFactory` - Creates format-specific renderers
- `cacheEnabled` - Whether caching is active

**Key Methods:**
- `generate(BpmnModel, OutputStream, ImageFormat)` - Generate image
- `generate(BpmnModel, HighlightManager, OutputStream, ImageFormat)` - Generate with highlights
- `generateAsImage(BpmnModel)` - Return BufferedImage directly
- `setStyleTemplate(StyleTemplate)` - Apply custom styles
- `setHighlightManager(HighlightManager)` - Configure highlighting
- `enableCache(boolean)` - Enable/disable caching

**When to Use:** This is your primary API for all image generation needs. Use this class instead of accessing renderers directly.

**Design Pattern:** Facade pattern - simplifies complex rendering pipeline

**Thread Safety:** Thread-safe for read operations. Style changes should be synchronized.

**Performance:** Typical rendering time: 50-500ms depending on diagram complexity

---

### DiagramCalculator

**Purpose:** Analyzes BPMN models to calculate diagram metrics and prepare rendering data.

**Responsibilities:**
- Calculating bounding boxes for diagrams
- Determining optimal canvas size
- Converting BPMN elements to diagram elements
- Computing connection paths between elements
- Extracting text labels and annotations
- Optimizing element ordering for rendering

**Key Properties:**
- `bounds` - Diagram bounding rectangle
- `elements` - List of diagram elements
- `connections` - List of flow connections
- `texts` - List of text annotations

**Key Methods:**
- `calculateDiagram(BpmnModel)` - Full diagram calculation
- `calculateBounds(BpmnModel)` - Get diagram bounds
- `calculateElements(BpmnModel)` - Extract elements
- `calculateConnections(BpmnModel)` - Map connections
- `getCanvasSize(BpmnModel)` - Determine canvas dimensions

**When to Use:** Internally by ImageGenerator. Use directly if you need diagram metrics without rendering.

**Design Pattern:** Analyzer pattern - extracts and computes diagram information

**Important:** Must be called before rendering to prepare diagram data

---

### StyleTemplate

**Purpose:** Central configuration for all visual styling of diagram elements.

**Responsibilities:**
- Defining colors for different element types
- Managing font styles and sizes
- Configuring stroke widths and patterns
- Providing highlight style overrides
- Supporting theme switching
- Caching style lookups for performance

**Key Properties:**
- `name` - Template identifier
- `elementStyles` - Map of element type to style
- `connectionStyles` - Map of connection type to style
- `defaultStyle` - Fallback style
- `highlightStyle` - Active element style

**Key Methods:**
- `getElementStyle(String elementType)` - Get style for element
- `getConnectionStyle(String connectionType)` - Get style for connection
- `getHighlightStyle()` - Get highlight style
- `setDefaultStyle(Style)` - Set default style
- `addElementStyle(String, Style)` - Add custom element style

**When to Use:** To customize the appearance of generated images. Create templates for different use cases (e.g., print, web, debug).

**Design Pattern:** Registry pattern - stores and retrieves style configurations

**Example Use Cases:**
- Dark mode vs light mode themes
- Print-optimized styles (high contrast)
- Accessibility styles (larger fonts, colorblind-friendly)

---

### HighlightManager

**Purpose:** Controls which elements appear highlighted in the generated image.

**Responsibilities:**
- Tracking active activities and flows
- Applying highlight styles to active elements
- Managing highlight state
- Calculating highlight paths
- Supporting multiple highlight modes

**Key Properties:**
- `activeActivityIds` - Set of highlighted activities
- `activeSequenceFlowIds` - Set of highlighted flows
- `highlightStyle` - Style for highlighted elements
- `highlightMode` - Highlight behavior (overlay, replace, etc.)

**Key Methods:**
- `isHighlighted(String elementId)` - Check if element highlighted
- `isFlowHighlighted(String flowId)` - Check if flow highlighted
- `getStyleForElement(DiagramElement)` - Get appropriate style
- `getStyleForConnection(DiagramConnection)` - Get connection style
- `addHighlightedActivity(String id)` - Add to highlight set
- `clearHighlights()` - Remove all highlights

**When to Use:** When you need to show the current state of a running process. Essential for monitoring and debugging.

**Design Pattern:** State pattern - manages highlight state

**Integration:** Works with HistoryService to determine active elements

---

### PngRenderer

**Purpose:** Generates PNG raster images from diagram data.

**Responsibilities:**
- Creating BufferedImage instances
- Rendering elements with Graphics2D
- Applying anti-aliasing and rendering hints
- Writing PNG files with compression
- Managing color profiles
- Optimizing for web display

**Key Properties:**
- `imageType` - BufferedImage type (RGB, ARGB, etc.)
- `compressionLevel` - PNG compression (0-9)
- `dpi` - Dots per inch for resolution
- `antiAliasing` - Whether to use anti-aliasing

**Key Methods:**
- `render(DiagramData, StyleTemplate, HighlightManager, OutputStream)` - Generate PNG
- `createBufferedImage(int width, int height)` - Create image buffer
- `configureGraphics(Graphics2D)` - Set rendering hints
- `writePng(BufferedImage, OutputStream)` - Write PNG file

**When to Use:** For web display, email attachments, and general-purpose images. Best format for photos and complex graphics.

**Design Pattern:** Concrete Renderer in Strategy pattern

**Performance:** Fast rendering, moderate file size. Typical: 100-500KB for medium diagrams

**Limitations:** Raster format - loses quality when zoomed

---

### SvgRenderer

**Purpose:** Generates SVG vector graphics from diagram data.

**Responsibilities:**
- Creating SVG XML documents
- Rendering elements as vector shapes
- Preserving scalability
- Supporting CSS styling
- Managing SVG namespaces
- Optimizing for web and print

**Key Properties:**
- `version` - SVG version (1.1, 2.0)
- `encoding` - Character encoding (UTF-8)
- `compression` - Whether to minify
- `cssExternal` - Use external CSS or inline

**Key Methods:**
- `render(DiagramData, StyleTemplate, HighlightManager, OutputStream)` - Generate SVG
- `writeSvgHeader(Writer)` - Write XML declaration
- `renderElement(Writer, DiagramElement)` - Write element SVG
- `renderConnection(Writer, DiagramConnection)` - Write connection SVG
- `colorToHex(Color)` - Convert color to hex

**When to Use:** For responsive web displays, print documents, and when scalability is important. Best for diagrams that need zooming.

**Design Pattern:** Concrete Renderer in Strategy pattern

**Performance:** Slower rendering, smaller file size. Typical: 10-100KB for medium diagrams

**Advantages:** Infinite scalability, editable in vector tools, searchable text

---

### PathHighlighter

**Purpose:** Calculates which elements should be highlighted based on process execution path.

**Responsibilities:**
- Analyzing execution history
- Determining active activities
- Calculating flow paths between activities
- Identifying completed vs pending elements
- Supporting multi-instance highlighting
- Managing highlight timing

**Key Properties:**
- `activityPath` - Ordered list of executed activities
- `currentActivity` - Currently executing activity
- `completedActivities` - Finished activities
- `pendingActivities` - Waiting activities

**Key Methods:**
- `highlightPath(List<String> activityPath)` - Highlight execution path
- `calculateActiveFlows(List<String> path)` - Find flows in path
- `findFlowBetween(String source, String target)` - Locate connection
- `getCompletedActivities()` - Get finished activities
- `getCurrentActivity()` - Get active activity

**When to Use:** To automatically determine what to highlight based on process state. Use with HistoryService data.

**Design Pattern:** Calculator pattern - computes highlight data

**Integration:** Typically called from HighlightManager with history data

---

### ConnectionRenderer

**Purpose:** Specialized renderer for sequence flows and connections between elements.

**Responsibilities:**
- Drawing flow lines (straight, curved, orthogonal)
- Rendering flow arrows and markers
- Applying flow styles and colors
- Handling flow labels
- Managing flow routing
- Supporting conditional flow indicators

**Key Properties:**
- `flowType` - Line style (straight, curve, orthogonal)
- `arrowSize` - Arrowhead dimensions
- `lineWidth` - Flow line thickness
- `cornerRadius` - Curve smoothness

**Key Methods:**
- `render(Graphics2D, DiagramConnection, Style)` - Draw connection
- `drawStraightLine(Graphics2D, Point, Point)` - Straight flow
- `drawCurvedLine(Graphics2D, Point, Point)` - Curved flow
- `drawArrow(Graphics2D, Point, double angle)` - Arrowhead
- `calculatePath(DiagramConnection)` - Compute flow path

**When to Use:** Internally by PngRenderer. Use directly for custom connection rendering.

**Design Pattern:** Specialized Renderer

**Flow Types:**
- **Straight:** Direct line between elements
- **Curved:** Smooth bezier curves
- **Orthogonal:** Right-angle routing (most common in BPMN)

---

### DiagramElement

**Purpose:** Internal representation of a BPMN element for rendering.

**Responsibilities:**
- Storing element position and dimensions
- Tracking element type and ID
- Managing element style
- Holding label text
- Supporting element metadata
- Enabling element transformation

**Key Properties:**
- `id` - Element identifier
- `type` - Element type (START_EVENT, USER_TASK, etc.)
- `x`, `y` - Position coordinates
- `width`, `height` - Dimensions
- `style` - Applied style
- `label` - Display text

**Key Methods:**
- `getX()`, `getY()` - Get position
- `getWidth()`, `getHeight()` - Get dimensions
- `getType()` - Get element type
- `getStyle()` - Get applied style
- `setLabel(String)` - Set label text

**When to Use:** Internally by rendering pipeline. Represents elements during rendering.

**Design Pattern:** Data Transfer Object (DTO)

**Important:** Not the same as BPMN model elements - optimized for rendering

---

## Architecture

### Rendering Pipeline

```
BPMN Model + Execution Data
         │
         ▼
┌─────────────────┐
│ Diagram         │
│ Calculator      │
│ (Layout)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Style           │
│ Applicator      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Highlight       │
│ Manager         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Renderer        │
│ (PNG/SVG/PDF)   │
└────────┬────────┘
         │
         ▼
    Image Output
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ImageGenerator                           │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Diagram         │  │ Style           │                 │
│  │ Calculator      │  │ Manager         │                 │
│  └────────┬────────┘  └────────┬────────┘                 │
│           │                    │                           │
│           └────────┬───────────┘                           │
│                    │                                       │
│                    ▼                                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Rendering Engine                         │  │
│  │  - Element rendering                                 │  │
│  │  - Connection rendering                              │  │
│  │  - Text rendering                                    │  │
│  │  - Highlight rendering                               │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Output Formatters                       │  │
│  │  - PngRenderer                                       │  │
│  │  - SvgRenderer                                       │  │
│  │  - PdfRenderer                                       │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Image Rendering Pipeline

### Diagram Calculator

```java
public class DiagramCalculator {
    
    public DiagramData calculateDiagram(BpmnModel model) {
        DiagramData data = new DiagramData();
        
        // Calculate bounding box
        Rectangle bounds = calculateBounds(model);
        data.setBounds(bounds);
        
        // Calculate element positions
        List<DiagramElement> elements = calculateElements(model);
        data.setElements(elements);
        
        // Calculate connections
        List<DiagramConnection> connections = calculateConnections(model);
        data.setConnections(connections);
        
        // Calculate text labels
        List<DiagramText> texts = calculateTexts(model);
        data.setTexts(texts);
        
        return data;
    }
    
    private Rectangle calculateBounds(BpmnModel model) {
        int minX = Integer.MAX_VALUE;
        int minY = Integer.MAX_VALUE;
        int maxX = Integer.MIN_VALUE;
        int maxY = Integer.MIN_VALUE;
        
        for (Process process : model.getProcesses()) {
            for (FlowElement element : process.getFlowElements()) {
                if (element instanceof BaseElement) {
                    BaseElement base = (BaseElement) element;
                    int x = base.getX() != null ? base.getX() : 0;
                    int y = base.getY() != null ? base.getY() : 0;
                    int width = base.getWidth() != null ? base.getWidth() : 0;
                    int height = base.getHeight() != null ? base.getHeight() : 0;
                    
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x + width);
                    maxY = Math.max(maxY, y + height);
                }
            }
        }
        
        return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    }
    
    private List<DiagramElement> calculateElements(BpmnModel model) {
        List<DiagramElement> elements = new ArrayList<>();
        
        for (Process process : model.getProcesses()) {
            for (FlowElement flowElement : process.getFlowElements()) {
                DiagramElement diagramElement = convertToDiagramElement(flowElement);
                elements.add(diagramElement);
            }
        }
        
        return elements;
    }
}
```

### Element Renderer

```java
public class ElementRenderer {
    
    public void render(Graphics2D graphics, DiagramElement element) {
        switch (element.getType()) {
            case START_EVENT:
                renderStartEvent(graphics, element);
                break;
            case END_EVENT:
                renderEndEvent(graphics, element);
                break;
            case USER_TASK:
                renderUserTask(graphics, element);
                break;
            case SERVICE_TASK:
                renderServiceTask(graphics, element);
                break;
            case EXCLUSIVE_GATEWAY:
                renderExclusiveGateway(graphics, element);
                break;
            case PARALLEL_GATEWAY:
                renderParallelGateway(graphics, element);
                break;
            // ... more element types
        }
    }
    
    private void renderUserTask(Graphics2D graphics, DiagramElement element) {
        // Set style
        Style style = element.getStyle();
        graphics.setColor(style.getFillColor());
        graphics.setStroke(style.getStroke());
        
        // Draw rectangle
        Rectangle2D rect = new Rectangle2D.Double(
            element.getX(), 
            element.getY(), 
            element.getWidth(), 
            element.getHeight());
        
        graphics.fill(rect);
        graphics.draw(rect);
        
        // Draw icon
        drawTaskIcon(graphics, element.getX() + 10, element.getY() + 10);
        
        // Draw label
        if (element.getLabel() != null) {
            graphics.setColor(style.getTextColor());
            graphics.setFont(style.getTextFont());
            graphics.drawString(
                element.getLabel(), 
                element.getX() + element.getWidth() / 2, 
                element.getY() + element.getHeight() + 20);
        }
    }
    
    private void renderStartEvent(Graphics2D graphics, DiagramElement element) {
        Style style = element.getStyle();
        graphics.setColor(style.getFillColor());
        graphics.setStroke(style.getStroke());
        
        // Draw circle
        Ellipse2D circle = new Ellipse2D.Double(
            element.getX(), 
            element.getY(), 
            element.getWidth(), 
            element.getHeight());
        
        graphics.fill(circle);
        graphics.draw(circle);
    }
}
```

---

## Style Templates

### Style Template

```java
public class StyleTemplate {
    
    private String name;
    private Map<String, Style> elementStyles = new HashMap<>();
    private Map<String, Style> connectionStyles = new HashMap<>();
    private Style defaultStyle;
    private Style highlightStyle;
    
    public Style getElementStyle(String elementType) {
        return elementStyles.getOrDefault(
            elementType, 
            defaultStyle);
    }
    
    public Style getConnectionStyle(String connectionType) {
        return connectionStyles.getOrDefault(
            connectionType, 
            defaultStyle);
    }
    
    public Style getHighlightStyle() {
        return highlightStyle;
    }
}
```

### Default Style

```java
public class DefaultStyle implements Style {
    
    private static final Color DEFAULT_FILL = Color.WHITE;
    private static final Color DEFAULT_STROKE = Color.BLACK;
    private static final Color DEFAULT_TEXT = Color.BLACK;
    private static final Font DEFAULT_FONT = new Font("Arial", Font.PLAIN, 12);
    private static final Stroke DEFAULT_STROKE_WIDTH = new BasicStroke(2.0f);
    
    @Override
    public Color getFillColor() {
        return DEFAULT_FILL;
    }
    
    @Override
    public Color getStrokeColor() {
        return DEFAULT_STROKE;
    }
    
    @Override
    public Color getTextColor() {
        return DEFAULT_TEXT;
    }
    
    @Override
    public Font getTextFont() {
        return DEFAULT_FONT;
    }
    
    @Override
    public Stroke getStroke() {
        return DEFAULT_STROKE_WIDTH;
    }
}
```

### Custom Style

```java
public class CustomStyle implements Style {
    
    private final Color fillColor;
    private final Color strokeColor;
    private final Color textColor;
    private final Font textFont;
    private final Stroke stroke;
    
    public CustomStyle(Builder builder) {
        this.fillColor = builder.fillColor;
        this.strokeColor = builder.strokeColor;
        this.textColor = builder.textColor;
        this.textFont = builder.textFont;
        this.stroke = builder.stroke;
    }
    
    // Getters...
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private Color fillColor = Color.WHITE;
        private Color strokeColor = Color.BLACK;
        private Color textColor = Color.BLACK;
        private Font textFont = new Font("Arial", Font.PLAIN, 12);
        private Stroke stroke = new BasicStroke(2.0f);
        
        public Builder fillColor(Color color) {
            this.fillColor = color;
            return this;
        }
        
        public Builder strokeColor(Color color) {
            this.strokeColor = color;
            return this;
        }
        
        // More builder methods...
        
        public CustomStyle build() {
            return new CustomStyle(this);
        }
    }
}
```

---

## Highlighting Logic

### Highlight Manager

```java
public class HighlightManager {
    
    private final Set<String> activeActivityIds;
    private final Set<String> activeSequenceFlowIds;
    private final Style highlightStyle;
    
    public HighlightManager(Set<String> activeActivityIds, 
                           Set<String> activeSequenceFlowIds,
                           Style highlightStyle) {
        this.activeActivityIds = activeActivityIds;
        this.activeSequenceFlowIds = activeSequenceFlowIds;
        this.highlightStyle = highlightStyle;
    }
    
    public boolean isHighlighted(String elementId) {
        return activeActivityIds.contains(elementId);
    }
    
    public boolean isFlowHighlighted(String flowId) {
        return activeSequenceFlowIds.contains(flowId);
    }
    
    public Style getStyleForElement(DiagramElement element) {
        if (isHighlighted(element.getId())) {
            return highlightStyle;
        }
        return element.getStyle();
    }
    
    public Style getStyleForConnection(DiagramConnection connection) {
        if (isFlowHighlighted(connection.getId())) {
            return highlightStyle;
        }
        return connection.getStyle();
    }
}
```

### Path Highlighter

```java
public class PathHighlighter {
    
    public HighlightData highlightPath(List<String> activityPath) {
        HighlightData data = new HighlightData();
        
        // Highlight activities in path
        data.setActiveActivities(new HashSet<>(activityPath));
        
        // Calculate sequence flows between activities
        Set<String> activeFlows = calculateActiveFlows(activityPath);
        data.setActiveSequenceFlows(activeFlows);
        
        return data;
    }
    
    private Set<String> calculateActiveFlows(List<String> activityPath) {
        Set<String> activeFlows = new HashSet<>();
        
        for (int i = 0; i < activityPath.size() - 1; i++) {
            String source = activityPath.get(i);
            String target = activityPath.get(i + 1);
            
            // Find flow between source and target
            String flowId = findFlowBetween(source, target);
            if (flowId != null) {
                activeFlows.add(flowId);
            }
        }
        
        return activeFlows;
    }
}
```

---

## Format Support

### PNG Renderer

```java
public class PngRenderer implements ImageRenderer {
    
    @Override
    public void render(DiagramData data, 
                      StyleTemplate style,
                      HighlightManager highlight,
                      OutputStream output) 
            throws IOException {
        
        // Calculate image size
        int width = data.getBounds().width + 100;
        int height = data.getBounds().height + 100;
        
        // Create image
        BufferedImage image = new BufferedImage(
            width, height, BufferedImage.TYPE_INT_RGB);
        
        Graphics2D graphics = image.createGraphics();
        
        // Anti-aliasing
        graphics.setRenderingHint(
            RenderingHints.KEY_ANTIALIASING, 
            RenderingHints.VALUE_ANTIALIAS_ON);
        
        // Render background
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, width, height);
        
        // Render connections first (so they're behind elements)
        ConnectionRenderer connectionRenderer = new ConnectionRenderer();
        for (DiagramConnection connection : data.getConnections()) {
            Style styleToUse = highlight.getStyleForConnection(connection);
            connectionRenderer.render(graphics, connection, styleToUse);
        }
        
        // Render elements
        ElementRenderer elementRenderer = new ElementRenderer();
        for (DiagramElement element : data.getElements()) {
            Style styleToUse = highlight.getStyleForElement(element);
            elementRenderer.render(graphics, element, styleToUse);
        }
        
        // Render text
        TextRenderer textRenderer = new TextRenderer();
        for (DiagramText text : data.getTexts()) {
            textRenderer.render(graphics, text, style);
        }
        
        graphics.dispose();
        
        // Write PNG
        ImageIO.write(image, "PNG", output);
    }
}
```

### SVG Renderer

```java
public class SvgRenderer implements ImageRenderer {
    
    @Override
    public void render(DiagramData data, 
                      StyleTemplate style,
                      HighlightManager highlight,
                      OutputStream output) 
            throws IOException {
        
        Writer writer = new OutputStreamWriter(output, StandardCharsets.UTF_8);
        
        // SVG header
        writer.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        writer.write("<svg xmlns=\"http://www.w3.org/2000/svg\" ");
        writer.write("width=\"" + data.getBounds().width + "\" ");
        writer.write("height=\"" + data.getBounds().height + "\">\n");
        
        // Render connections
        for (DiagramConnection connection : data.getConnections()) {
            renderConnection(writer, connection, highlight);
        }
        
        // Render elements
        for (DiagramElement element : data.getElements()) {
            renderElement(writer, element, highlight);
        }
        
        // Render text
        for (DiagramText text : data.getTexts()) {
            renderText(writer, text);
        }
        
        writer.write("</svg>");
        writer.flush();
    }
    
    private void renderElement(Writer writer, 
                              DiagramElement element,
                              HighlightManager highlight) 
                    throws IOException {
        
        Style style = highlight.getStyleForElement(element);
        
        switch (element.getType()) {
            case START_EVENT:
                writer.write("<circle cx=\"" + (element.getX() + element.getWidth()/2) + "\" ");
                writer.write("cy=\"" + (element.getY() + element.getHeight()/2) + "\" ");
                writer.write("r=\"" + element.getWidth()/2 + "\" ");
                writer.write("fill=\"" + colorToHex(style.getFillColor()) + "\" ");
                writer.write("stroke=\"" + colorToHex(style.getStrokeColor()) + "\"/>\n");
                break;
            // ... more element types
        }
    }
}
```

---

## Performance Optimization

### Image Caching

```java
public class CachedImageGenerator {
    
    private final Map<String, BufferedImage> imageCache = 
        new ConcurrentHashMap<>();
    
    public BufferedImage generateImage(String processKey, 
                                      BpmnModel model,
                                      HighlightData highlight) {
        String cacheKey = generateCacheKey(processKey, highlight);
        
        return imageCache.computeIfAbsent(cacheKey, key -> {
            // Generate image
            return doGenerateImage(model, highlight);
        });
    }
    
    private String generateCacheKey(String processKey, HighlightData highlight) {
        return processKey + ":" + highlight.getActiveActivities().hashCode();
    }
    
    public void invalidateCache(String processKey) {
        imageCache.keySet().removeIf(key -> key.startsWith(processKey + ":"));
    }
}
```

### Lazy Rendering

```java
public class LazyImageGenerator {
    
    private final ExecutorService rendererPool;
    
    public CompletableFuture<BufferedImage> generateImageAsync(
            BpmnModel model, 
            HighlightData highlight) {
        
        return CompletableFuture.supplyAsync(() -> {
            return doGenerateImage(model, highlight);
        }, rendererPool);
    }
    
    private BufferedImage doGenerateImage(BpmnModel model, 
                                         HighlightData highlight) {
        // Rendering logic
    }
}
```

---

## Customization

### Custom Renderer

```java
public class CustomRenderer implements ImageRenderer {
    
    @Override
    public void render(DiagramData data, 
                      StyleTemplate style,
                      HighlightManager highlight,
                      OutputStream output) 
            throws IOException {
        
        // Custom rendering logic
        // Add watermarks, logos, custom annotations, etc.
    }
}
```

### Custom Style Template

```java
public class CustomStyleTemplate extends StyleTemplate {
    
    public CustomStyleTemplate() {
        setName("Custom");
        
        // Define custom styles
        elementStyles.put("userTask", CustomStyle.builder()
            .fillColor(new Color(240, 240, 255))
            .strokeColor(new Color(100, 100, 200))
            .build());
        
        highlightStyle = CustomStyle.builder()
            .fillColor(Color.YELLOW)
            .strokeColor(Color.ORANGE)
            .build();
    }
}
```

---

## Usage Examples

### Basic Image Generation

```java
public class ImageGenerationExample {
    
    public void generateProcessImage() throws IOException {
        // Load BPMN model
        BpmnModel model = loadBpmnModel("process.bpmn");
        
        // Create image generator
        ImageGenerator generator = new ImageGenerator();
        
        // Generate PNG
        try (OutputStream output = 
                new FileOutputStream("process.png")) {
            generator.generate(model, output, ImageFormat.PNG);
        }
    }
}
```

### Highlighted Image Generation

```java
public class HighlightedImageExample {
    
    public void generateHighlightedImage() throws IOException {
        BpmnModel model = loadBpmnModel("process.bpmn");
        
        // Get active elements
        Set<String> activeActivities = getActiveActivities();
        Set<String> activeFlows = getActiveFlows();
        
        // Create highlight manager
        HighlightManager highlight = new HighlightManager(
            activeActivities, 
            activeFlows,
            new HighlightStyle());
        
        // Generate image with highlighting
        ImageGenerator generator = new ImageGenerator();
        
        try (OutputStream output = 
                new FileOutputStream("process-highlighted.png")) {
            generator.generate(model, highlight, output, ImageFormat.PNG);
        }
    }
}
```

### SVG Generation

```java
public class SvgGenerationExample {
    
    public void generateSvg() throws IOException {
        BpmnModel model = loadBpmnModel("process.bpmn");
        
        ImageGenerator generator = new ImageGenerator();
        
        try (OutputStream output = 
                new FileOutputStream("process.svg")) {
            generator.generate(model, output, ImageFormat.SVG);
        }
    }
}
```

---

## Best Practices

### 1. Use Appropriate Image Size

```java
// Calculate optimal size based on diagram complexity
int width = model.getFlowElements().size() * 150;
int height = model.getProcesses().size() * 200;
```

### 2. Cache Generated Images

```java
@Cacheable(value = "processImages", key = "#model.id + ':' + #highlight")
public BufferedImage generateImage(BpmnModel model, HighlightData highlight) {
    return imageGenerator.generate(model, highlight);
}
```

### 3. Use Async Rendering for Large Diagrams

```java
CompletableFuture<BufferedImage> imageFuture = 
    generator.generateImageAsync(model, highlight);

// Continue with other work
imageFuture.thenAccept(image -> saveImage(image));
```

### 4. Choose Right Format

```java
// PNG for web display
ImageFormat.PNG

// SVG for scalable diagrams
ImageFormat.SVG

// PDF for documentation
ImageFormat.PDF
```

---

## API Reference

### Key Classes

- `ImageGenerator` - Main image generation API
- `PngRenderer` - PNG output
- `SvgRenderer` - SVG output
- `PdfRenderer` - PDF output
- `HighlightManager` - Highlighting control
- `StyleTemplate` - Style management

### Key Methods

```java
// Image generation
void generate(BpmnModel model, OutputStream output, ImageFormat format)
void generate(BpmnModel model, HighlightManager highlight, 
              OutputStream output, ImageFormat format)
BufferedImage generateAsImage(BpmnModel model)

// Styling
void setStyleTemplate(StyleTemplate template)
StyleTemplate getCurrentStyleTemplate()

// Highlighting
void setHighlightManager(HighlightManager highlight)
```

---

## See Also

- [Parent Module Documentation](../overview.md)
- [BPMN Model](../engine-api/bpmn-model.md)
- [BPMN Layout](../activiti-bpmn-layout/README.md)
