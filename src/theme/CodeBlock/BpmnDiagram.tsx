import React, {useEffect, useRef, useState} from 'react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import {extractActivitiProperties, toRenderableBpmn} from './bpmnLayout';
import type {ActivitiProperty} from './bpmnLayout';
import styles from './styles.module.scss';

interface BpmnCanvas {
  zoom(newScale?: number | 'fit-viewport'): number;
  addMarker(id: string, marker: string): void;
  removeMarker(id: string, marker: string): void;
  getLayer(name: string): SVGGElement | null;
}

interface BpmnPoint {
  x: number;
  y: number;
}

interface BpmnElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BpmnElement {
  id: string;
  type?: string;
  bounds: BpmnElementBounds | null;
  start?: BpmnPoint | null;
  end?: BpmnPoint | null;
  vertices?: BpmnPoint[];
  businessObject?: {name?: string} | null;
}

interface BpmnElementRegistry {
  get(id: string): BpmnElement | null;
}

interface BpmnHoverEvent {
  element: BpmnElement;
  originalEvent?: MouseEvent | null;
}

type BpmnEventHandler = (event: BpmnHoverEvent) => void;

interface BpmnEventBus {
  on(event: string, callback: BpmnEventHandler): void;
  off(event: string, callback: BpmnEventHandler): void;
}

interface BpmnViewerInstance {
  importXML(xml: string): Promise<unknown>;
  get<T>(name: string): T;
  destroy(): void;
}

interface TooltipState {
  x: number;
  y: number;
  flip: boolean;
  title: string;
  props: ActivitiProperty[];
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function polylineMidpoint(
  points: Array<{x: number; y: number}>,
): {x: number; y: number} {
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
 * Where the property dot lands for an element: the top-right corner for
 * shapes, the midpoint of the line for sequence flows.
 */
function indicatorPosition(el: BpmnElement): {x: number; y: number} | null {
  if (el.type === 'connection' && el.start && el.end) {
    return polylineMidpoint([el.start, ...(el.vertices ?? []), el.end]);
  }
  if (!el.bounds) {
    return null;
  }
  return {x: el.bounds.x + el.bounds.width - 7, y: el.bounds.y + 7};
}

export default function BpmnDiagram({xml}: {xml: string}): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnViewerInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    let cancelled = false;
    let viewer: BpmnViewerInstance | null = null;
    let eventBus: BpmnEventBus | null = null;
    let hoverHandler: BpmnEventHandler | null = null;
    let outHandler: BpmnEventHandler | null = null;

    async function init(): Promise<void> {
      try {
        const finalXml = await toRenderableBpmn(xml);
        const {default: NavigatedViewer} =
          await import('bpmn-js/lib/NavigatedViewer');
        const container = containerRef.current;
        if (cancelled || !container) {
          return;
        }
        viewer = new NavigatedViewer({container}) as unknown as BpmnViewerInstance;
        viewerRef.current = viewer;
        await viewer.importXML(finalXml);
        if (cancelled) {
          return;
        }
        const canvas = viewer.get<BpmnCanvas>('canvas');
        canvas.zoom('fit-viewport');
        wirePropertyInspection(viewer, canvas);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }

    // Marks elements that carry `activiti:` properties with a dot badge and
    // shows the properties in a tooltip on hover. Touch users can still see
    // the dots and switch to "View code" for the full XML.
    function wirePropertyInspection(
      activeViewer: BpmnViewerInstance,
      canvas: BpmnCanvas,
    ): void {
      const propMap = extractActivitiProperties(xml);
      if (propMap.size === 0) {
        return;
      }
      const registry = activeViewer.get<BpmnElementRegistry>('elementRegistry');
      const bus = activeViewer.get<BpmnEventBus>('eventBus');
      eventBus = bus;
      const container = containerRef.current;

      const layer = canvas.getLayer('extra');
      if (layer) {
        for (const id of propMap.keys()) {
          const el = registry.get(id);
          const pos = el ? indicatorPosition(el) : null;
          if (!pos) {
            continue;
          }
          const group = document.createElementNS(SVG_NS, 'g');
          const dot = document.createElementNS(SVG_NS, 'circle');
          dot.setAttribute('cx', String(pos.x));
          dot.setAttribute('cy', String(pos.y));
          dot.setAttribute('r', '4.5');
          dot.setAttribute('class', styles.propsDot);
          group.appendChild(dot);
          layer.appendChild(group);
        }
      }

      hoverHandler = (e: BpmnHoverEvent): void => {
        const props = propMap.get(e.element.id);
        if (!props || !e.originalEvent || !container) {
          return;
        }
        canvas.addMarker(e.element.id, 'props-hover');
        const rect = container.getBoundingClientRect();
        const x = e.originalEvent.clientX - rect.left;
        const y = e.originalEvent.clientY - rect.top;
        const name = e.element.businessObject?.name;
        setTooltip({
          x,
          y,
          flip: x > rect.width / 2,
          title: name ? `${name} · ${e.element.id}` : e.element.id,
          props,
        });
      };

      outHandler = (e: BpmnHoverEvent): void => {
        canvas.removeMarker(e.element.id, 'props-hover');
        setTooltip(null);
      };

      bus.on('element.hover', hoverHandler);
      bus.on('element.out', outHandler);
    }

    init();

    return () => {
      cancelled = true;
      if (eventBus) {
        if (hoverHandler) {
          eventBus.off('element.hover', hoverHandler);
        }
        if (outHandler) {
          eventBus.off('element.out', outHandler);
        }
      }
      if (viewer) {
        try {
          viewer.destroy();
        } catch {
          // viewer may already be detached
        }
      }
      viewerRef.current = null;
      setTooltip(null);
    };
  }, [xml]);

  const zoomBy = (factor: number): void => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    const canvas = viewer.get<BpmnCanvas>('canvas');
    const current = canvas.zoom();
    canvas.zoom(Math.min(4, Math.max(0.2, current * factor)));
  };

  const fitViewport = (): void => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    viewer.get<BpmnCanvas>('canvas').zoom('fit-viewport');
  };

  return (
    <div className={styles.viewer}>
      <div ref={containerRef} className={styles.canvas} />
      {tooltip && (
        <div
          className={
            tooltip.flip
              ? `${styles.tooltip} ${styles.tooltipFlip}`
              : styles.tooltip
          }
          style={{left: tooltip.x, top: tooltip.y}}
          role="tooltip"
        >
          <div className={styles.tooltipTitle}>{tooltip.title}</div>
          <ul className={styles.tooltipList}>
            {tooltip.props.map((prop, i) => (
              <li key={`${i}-${prop.label}`}>
                <span className={styles.tooltipLabel}>{prop.label}</span>
                {prop.value != null && (
                  <span className={styles.tooltipValue}>{prop.value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {loading && !error && <div className={styles.status}>Rendering diagram…</div>}
      {error && (
        <div className={styles.error} role="alert">
          <span>
            Could not render this BPMN diagram: {error}. Use the “View code”
            button above to inspect the source XML.
          </span>
        </div>
      )}
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Diagram zoom controls"
      >
        <button
          type="button"
          className={styles.toolButton}
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className={styles.toolButton}
          onClick={() => zoomBy(0.8)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className={styles.toolButton}
          onClick={fitViewport}
          aria-label="Fit diagram to window"
          title="Fit diagram"
        >
          ⤢
        </button>
      </div>
    </div>
  );
}
