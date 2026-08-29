import React, {
  Suspense,
  useCallback,
  useEffect,
  isValidElement,
  lazy,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import OriginalCodeBlock from '@theme-original/CodeBlock';
import type {Props} from '@theme/CodeBlock';
import {isBpmnXml} from './bpmnLayout';
import styles from './styles.module.scss';

const BpmnDiagram = lazy(() => import('./BpmnDiagram'));

function maybeStringifyChildren(children: ReactNode): string {
  const array = React.Children.toArray(children);
  if (array.some((el) => isValidElement(el))) {
    return '';
  }
  return array.join('');
}

export default function CodeBlock(props: Props): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const code = maybeStringifyChildren(props.children);
  const isBpmn = isBpmnXml(props.language, code);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  return (
    <div className={styles.wrapper}>
      <OriginalCodeBlock {...props} />
      {isBpmn && (
        <button
          type="button"
          className={styles.bpmnButton}
          title="View BPMN diagram"
          aria-label="View BPMN diagram"
          onClick={() => setIsOpen(true)}
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
      {isOpen && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="BPMN diagram"
          onClick={close}
        >
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            title="Close (Esc)"
            aria-label="Close BPMN diagram"
            onClick={(event) => {
              event.stopPropagation();
              close();
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div
            className={styles.content}
            onClick={(event) => event.stopPropagation()}
          >
            <Suspense fallback={<div className={styles.status}>Loading diagram…</div>}>
              <BpmnDiagram xml={code} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
