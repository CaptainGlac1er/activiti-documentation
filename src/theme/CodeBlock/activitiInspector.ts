/**
 * bpmn-js plugin module that marks elements carrying `activiti:`
 * properties.
 *
 * Register it on any bpmn-js viewer via the `additionalModules` option:
 *
 *   new NavigatedViewer({
 *     container,
 *     additionalModules: [activitiInspectorModule(xml)],
 *   });
 *
 * Once the diagram has been imported (`import.render.complete`), the module
 * attaches a dot badge (through the `overlays` service) to every element
 * `extractActivitiProperties` finds in the given *original* XML, and adds a
 * hover marker to those elements. The badge tooltip is rendered by the
 * surrounding React component, which keeps listening to `element.hover`
 * itself.
 *
 * The dot badges are interactive:
 *  - clicking a dot fires `PIN_EVENT` on the event bus (with the element
 *    and the dot's position in container coordinates) so the host can pin
 *    the tooltip on that element;
 *  - `mouseover`/`mousemove`/`mouseout` on a dot are re-fired as
 *    `element.hover`/`element.mousemove`/`element.out` for the underlying
 *    element, so hover state stays consistent while the cursor is on the
 *    dot instead of the element itself.
 */
import './activitiInspector.css';
import {extractActivitiProperties} from './bpmnLayout';

/** Type of the badge overlays added by this module. */
export const PROPS_OVERLAY_TYPE = 'activiti-props';

/** Marker class added to elements that carry Activiti properties. */
export const PROPS_HOVER_MARKER = 'props-hover';

/** Fired on the event bus when a dot badge is clicked. */
export const PIN_EVENT = 'activitiProps.pin';

/** A didi module declaration, as accepted by bpmn-js `additionalModules`. */
export interface BpmnModule {
  __init__?: string[];
  [serviceName: string]: unknown;
}

interface BpmnPoint {
  x: number;
  y: number;
}

interface BpmnElementBase {
  id: string;
  businessObject?: {name?: string} | null;
}

interface BpmnShapeElement extends BpmnElementBase {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BpmnConnectionElement extends BpmnElementBase {
  /** Full polyline, including start and end points. */
  waypoints: BpmnPoint[];
}

export type BpmnElement = BpmnShapeElement | BpmnConnectionElement;

/** Payload of {@link PIN_EVENT}. */
export interface BpmnInspectPinEvent {
  element: BpmnElement;
  /** Dot center relative to the canvas container's top-left. */
  x: number;
  y: number;
}

interface BpmnElementRegistry {
  get(id: string): BpmnElement | null;
}

interface BpmnEvent {
  element: BpmnElement;
}

interface BpmnEventBus {
  on(event: string, callback: (event: BpmnEvent) => void): void;
  fire(event: string, data: BpmnInspectPinEvent): void;
}

interface BpmnCanvas {
  addMarker(id: string, marker: string): void;
  removeMarker(id: string, marker: string): void;
  getContainer(): HTMLElement;
}

/** Re-fires interaction events for a target element (InteractionEvents). */
interface BpmnInteractionEvents {
  triggerMouseEvent(
    eventName: string,
    event: MouseEvent,
    element: BpmnElement,
  ): void;
}

interface BpmnOverlayPosition {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

interface BpmnOverlays {
  add(
    element: BpmnElement,
    type: string,
    overlay: {position: BpmnOverlayPosition; html: string | HTMLElement},
  ): string;
}

// Badge geometry: 9px primary fill + 1.5px white ring = 12px badge, the same
// visual as an SVG circle with r=4.5 and stroke-width 1.5.
const DOT_SIZE = 12;
const DOT_HALF = DOT_SIZE / 2;
// For shapes, the badge center sits this far in from the top-right corner.
const CORNER_OFFSET = 7;

function polylineMidpoint(points: BpmnPoint[]): BpmnPoint {
  const segments: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const len = Math.hypot(
      points[i + 1].x - points[i].x,
      points[i + 1].y - points[i].y,
    );
    segments.push(len);
    total += len;
  }
  let remaining = total / 2;
  for (let i = 0; i < segments.length; i += 1) {
    if (remaining <= segments[i] || i === segments.length - 1) {
      const t = segments[i] > 0 ? remaining / segments[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    remaining -= segments[i];
  }
  return points[points.length - 1];
}

/**
 * Where the badge overlay lands for an element: the top-right corner for
 * shapes, the midpoint of the polyline for connections. Offsets are
 * relative to the element origin as interpreted by the `overlays` service:
 * the top-left of the bounds for shapes, the top-left of the waypoint
 * bounding box for connections.
 */
export function badgePosition(el: BpmnElement): BpmnOverlayPosition | null {
  if ('waypoints' in el && el.waypoints) {
    const points = el.waypoints;
    if (points.length < 2) {
      return null;
    }
    const minX = Math.min(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const mid = polylineMidpoint(points);
    return {
      left: mid.x - minX - DOT_HALF,
      top: mid.y - minY - DOT_HALF,
    };
  }
  return {
    top: CORNER_OFFSET - DOT_HALF,
    right: CORNER_OFFSET + DOT_HALF,
  };
}

/**
 * Creates the clickable dot badge for an element. The dot forwards its own
 * mouse events as interaction events of the underlying element (so hover
 * and cursor tracking are seamless while the cursor is on the dot) and
 * fires {@link PIN_EVENT} on click.
 */
function createDot(
  element: BpmnElement,
  canvas: BpmnCanvas,
  eventBus: BpmnEventBus,
  interactionEvents: BpmnInteractionEvents,
): HTMLDivElement {
  const dot = document.createElement('div');
  dot.className = 'bpmn-activiti-props-dot';

  dot.addEventListener('click', () => {
    const containerRect = canvas.getContainer().getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    eventBus.fire(PIN_EVENT, {
      element,
      x: dotRect.left + dotRect.width / 2 - containerRect.left,
      y: dotRect.top + dotRect.height / 2 - containerRect.top,
    });
  });

  for (const type of ['mouseover', 'mousemove', 'mouseout'] as const) {
    dot.addEventListener(type, (event: MouseEvent) => {
      interactionEvents.triggerMouseEvent(type, event, element);
    });
  }

  return dot;
}

/**
 * Builds the plugin module for the given original BPMN XML. The XML is
 * captured in a closure, so every viewer instance inspects the diagram it
 * actually renders.
 */
export function activitiInspectorModule(xml: string): BpmnModule {
  function ActivitiPropertiesInspector(
    eventBus: BpmnEventBus,
    overlays: BpmnOverlays,
    canvas: BpmnCanvas,
    elementRegistry: BpmnElementRegistry,
    interactionEvents: BpmnInteractionEvents,
  ): void {
    const propMap = extractActivitiProperties(xml);
    if (propMap.size === 0) {
      return;
    }

    eventBus.on('import.render.complete', () => {
      for (const id of propMap.keys()) {
        const el = elementRegistry.get(id);
        if (!el) {
          continue;
        }
        const position = badgePosition(el);
        if (!position) {
          continue;
        }
        overlays.add(el, PROPS_OVERLAY_TYPE, {
          position,
          html: createDot(el, canvas, eventBus, interactionEvents),
        });
      }
    });

    eventBus.on('element.hover', (e) => {
      if (propMap.has(e.element.id)) {
        canvas.addMarker(e.element.id, PROPS_HOVER_MARKER);
      }
    });

    eventBus.on('element.out', (e) => {
      if (propMap.has(e.element.id)) {
        canvas.removeMarker(e.element.id, PROPS_HOVER_MARKER);
      }
    });
  }

  // didi resolves constructor arguments via $inject, because parameter
  // names are mangled by minification.
  ActivitiPropertiesInspector.$inject = [
    'eventBus',
    'overlays',
    'canvas',
    'elementRegistry',
    'interactionEvents',
  ];

  return {
    __init__: ['activitiPropertiesInspector'],
    activitiPropertiesInspector: ['type', ActivitiPropertiesInspector],
  };
}
