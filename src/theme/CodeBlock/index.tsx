import React, {Suspense, lazy, useState} from 'react';
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

  const code = maybeStringifyChildren(props.children);
  const isBpmn = isBpmnXml(props.language, code);

  if (isBpmn && showDiagram) {
    return (
      <div className={styles.diagramPanel}>
        <div className={styles.diagramHeader}>
          <span className={styles.diagramTitle}>BPMN diagram</span>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowDiagram(false)}
          >
            View code
          </button>
        </div>
        <Suspense fallback={<div className={styles.status}>Rendering diagram…</div>}>
          <BpmnDiagram xml={code} />
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
