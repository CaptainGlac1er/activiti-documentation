import React, {Suspense, lazy, useEffect, useRef, useState} from 'react';
import OriginalCodeBlock from '@theme-original/CodeBlock';
import type {Props} from '@theme/CodeBlock';
import {isBpmnXml} from './bpmnLayout';
import styles from './styles.module.scss';

const BpmnDiagram = lazy(() => import('./BpmnDiagram'));

function maybeStringifyChildren(children: React.ReactNode): string {
  const array = React.Children.toArray(children);
  if (array.some((el) => React.isValidElement(el))) {
    return '';
  }
  return array.join('');
}

export default function CodeBlock(props: Props): React.ReactNode {
  const [showDiagram, setShowDiagram] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFullscreenChange = () => {
      // the `!== null` guard avoids a stale `null === null` match after
      // this panel has unmounted
      setIsFullscreen(
        document.fullscreenElement !== null &&
          document.fullscreenElement === panelRef.current,
      );
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void panelRef.current?.requestFullscreen();
    }
  };

  const code = maybeStringifyChildren(props.children);
  const isBpmn = isBpmnXml(props.language, code);

  if (isBpmn && showDiagram) {
    return (
      <div ref={panelRef} className={styles.diagramPanel}>
        <div className={styles.diagramHeader}>
          <span className={styles.diagramTitle}>BPMN diagram</span>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.maximizeButton}
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Expand to fullscreen'}
              aria-label={
                isFullscreen ? 'Exit fullscreen' : 'Expand to fullscreen'
              }
            >
              {isFullscreen ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 4v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V4" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 20v-3a2 2 0 0 1 2-2h3" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowDiagram(false)}
            >
              View code
            </button>
          </div>
        </div>
        <Suspense fallback={<div className={styles.status}>Rendering diagram…</div>}>
          <BpmnDiagram xml={code} fullscreen={isFullscreen} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <OriginalCodeBlock {...props} />
      {isBpmn && (
        <button
          type="button"
          className={styles.bpmnButton}
          title="View BPMN diagram"
          aria-label="View BPMN diagram"
          onClick={() => setShowDiagram(true)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="5" cy="6" r="2.5" />
            <rect x="11" y="3.5" width="8" height="5" rx="1" />
            <circle cx="15" cy="17" r="2.5" />
            <path d="M7.5 6H11" />
            <path d="M15 8.5V14.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
