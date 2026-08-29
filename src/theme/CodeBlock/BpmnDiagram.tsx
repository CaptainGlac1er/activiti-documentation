import React, {useEffect, useRef, useState} from 'react';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import {toRenderableBpmn} from './bpmnLayout';
import styles from './styles.module.scss';

interface BpmnCanvas {
  zoom(newScale?: number | 'fit-viewport'): number;
}

interface BpmnViewerInstance {
  importXML(xml: string): Promise<unknown>;
  get<T>(name: string): T;
  destroy(): void;
}

export default function BpmnDiagram({xml}: {xml: string}): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnViewerInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let viewer: BpmnViewerInstance | null = null;

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
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (viewer) {
        try {
          viewer.destroy();
        } catch {
          // viewer may already be detached
        }
      }
      viewerRef.current = null;
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
