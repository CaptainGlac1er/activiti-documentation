import React, {useEffect, useRef, useState} from 'react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import {
  activitiInspectorModule,
  PIN_EVENT,
} from './activitiInspector';
import type {BpmnInspectPinEvent} from './activitiInspector';
import {extractActivitiProperties, toRenderableBpmn} from './bpmnLayout';
import type {ActivitiProperty} from './bpmnLayout';
import styles from './styles.module.scss';

interface BpmnCanvas {
  zoom(newScale?: number | 'fit-viewport'): number;
  resized(): void;
}

interface BpmnElement {
  id: string;
  businessObject?: {name?: string} | null;
}

interface BpmnHoverEvent {
  element: BpmnElement;
  originalEvent?: MouseEvent | null;
}

type BpmnEventHandler = (event: BpmnHoverEvent) => void;
type BpmnPinHandler = (event: BpmnInspectPinEvent) => void;

interface BpmnEventBus {
  on(event: string, callback: BpmnEventHandler | BpmnPinHandler): void;
  off(event: string, callback: BpmnEventHandler | BpmnPinHandler): void;
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
  /** Right offset (container width - x); used for the flipped position. */
  right: number;
  title: string;
  props: ActivitiProperty[];
  elementId: string;
  /** Pinned via a dot badge click; survives the mouse leaving the element. */
  pinned: boolean;
}

export default function BpmnDiagram({
  xml,
  fullscreen,
}: {xml: string; fullscreen: boolean}): React.ReactNode {
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
    let moveHandler: BpmnEventHandler | null = null;
    let outHandler: BpmnEventHandler | null = null;
    let pinHandler: BpmnPinHandler | null = null;
    let viewboxHandler: BpmnEventHandler | null = null;

    async function init(): Promise<void> {
      try {
        const finalXml = await toRenderableBpmn(xml);
        const {default: NavigatedViewer} =
          await import('bpmn-js/lib/NavigatedViewer');
        const container = containerRef.current;
        if (cancelled || !container) {
          return;
        }
        viewer = new NavigatedViewer({
          container,
          // Plugin: dot badges + hover marker for elements carrying
          // `activiti:` properties.
          additionalModules: [activitiInspectorModule(xml)],
        }) as unknown as BpmnViewerInstance;
        viewerRef.current = viewer;
        await viewer.importXML(finalXml);
        if (cancelled) {
          return;
        }
        viewer.get<BpmnCanvas>('canvas').zoom('fit-viewport');
        wireTooltip(viewer);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }

    // Shows the `activiti:` properties of the hovered element in a tooltip.
    // Only one tooltip is ever open: hovering or pinning a new element
    // replaces the current one. The dot badges and the hover marker
    // themselves come from the `activitiInspectorModule` plugin.
    //
    // `element.hover` fires only when the mouse *enters* an element, so the
    // cursor position is additionally tracked via `element.mousemove` while
    // the tooltip is visible. Clicking a dot badge pins the tooltip on that
    // element (it then survives the mouse leaving); zooming/panning closes
    // it, since its anchored position would go stale. Touch users can still
    // switch to "View code" for the full XML.
    function wireTooltip(activeViewer: BpmnViewerInstance): void {
      const propMap = extractActivitiProperties(xml);
      if (propMap.size === 0) {
        return;
      }
      const bus = activeViewer.get<BpmnEventBus>('eventBus');
      eventBus = bus;
      const container = containerRef.current;

      hoverHandler = (e: BpmnHoverEvent): void => {
        const props = propMap.get(e.element.id);
        if (!props || !e.originalEvent || !container) {
          return;
        }
        const rect = container.getBoundingClientRect();
        const x = e.originalEvent.clientX - rect.left;
        const y = e.originalEvent.clientY - rect.top;
        const name = e.element.businessObject?.name;
        setTooltip((prev) =>
          // re-hovering the element of an open pinned tooltip keeps it pinned
          prev && prev.pinned && prev.elementId === e.element.id
            ? prev
            : {
                x,
                y,
                flip: x > rect.width / 2,
                right: rect.width - x,
                title: name ? `${name} · ${e.element.id}` : e.element.id,
                props,
                elementId: e.element.id,
                pinned: false,
              },
        );
      };

      moveHandler = (e: BpmnHoverEvent): void => {
        if (!e.originalEvent || !container) {
          return;
        }
        const rect = container.getBoundingClientRect();
        const x = e.originalEvent.clientX - rect.left;
        const y = e.originalEvent.clientY - rect.top;
        setTooltip((prev) =>
          prev && !prev.pinned && prev.elementId === e.element.id
            ? {
                ...prev,
                x,
                y,
                flip: x > rect.width / 2,
                right: rect.width - x,
              }
            : prev,
        );
      };

      outHandler = (): void => {
        setTooltip((prev) => (prev && prev.pinned ? prev : null));
      };

      pinHandler = (e: BpmnInspectPinEvent): void => {
        const props = propMap.get(e.element.id);
        if (!props || !container) {
          return;
        }
        const rect = container.getBoundingClientRect();
        const name = e.element.businessObject?.name;
        setTooltip((prev) =>
          // clicking the same dot again unpins
          prev && prev.pinned && prev.elementId === e.element.id
            ? null
            : {
                x: e.x,
                y: e.y,
                flip: e.x > rect.width / 2,
                right: rect.width - e.x,
                title: name ? `${name} · ${e.element.id}` : e.element.id,
                props,
                elementId: e.element.id,
                pinned: true,
              },
        );
      };

      // a pinned tooltip is anchored to the dot's on-screen position; zooming
      // or panning would leave it floating in the wrong place
      viewboxHandler = (): void => {
        setTooltip(null);
      };

      bus.on('element.hover', hoverHandler);
      bus.on('element.mousemove', moveHandler);
      bus.on('element.out', outHandler);
      bus.on(PIN_EVENT, pinHandler);
      bus.on('canvas.viewbox.changed', viewboxHandler);
    }

    init();

    return () => {
      cancelled = true;
      if (eventBus) {
        if (hoverHandler) {
          eventBus.off('element.hover', hoverHandler);
        }
        if (moveHandler) {
          eventBus.off('element.mousemove', moveHandler);
        }
        if (outHandler) {
          eventBus.off('element.out', outHandler);
        }
        if (pinHandler) {
          eventBus.off(PIN_EVENT, pinHandler);
        }
        if (viewboxHandler) {
          eventBus.off('canvas.viewbox.changed', viewboxHandler);
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

  // diagram-js does not watch its container's size, so re-measure and
  // refit when the panel toggles fullscreen
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    const canvas = viewer.get<BpmnCanvas>('canvas');
    canvas.resized();
    canvas.zoom('fit-viewport');
  }, [fullscreen]);

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
          // Flipped tooltips are positioned with `right` (not `left` +
          // transform), so their shrink-to-fit width gets the full space
          // to the left of the cursor instead of the sliver to its right.
          style={
            tooltip.flip
              ? {right: tooltip.right, top: tooltip.y}
              : {left: tooltip.x, top: tooltip.y}
          }
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
