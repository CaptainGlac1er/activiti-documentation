import {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import type {Props} from '@theme/Mermaid';
import OriginalMermaid from '@theme-original/Mermaid';
import {MermaidContainerClassName} from '@docusaurus/theme-mermaid/client';
import styles from './styles.module.scss';

function Mermaid(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [diagramHtml, setDiagramHtml] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => {
    const container = wrapperRef.current?.querySelector(
      `.${MermaidContainerClassName}`,
    );
    if (!container) {
      return;
    }
    setDiagramHtml(container.innerHTML);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setDiagramHtml(null);
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
    <div ref={wrapperRef} className={styles.wrapper} onClick={open}>
      <OriginalMermaid {...props} />
      <button
        type="button"
        className={styles.zoomButton}
        title="View diagram in fullscreen"
        aria-label="View diagram in fullscreen"
        onClick={(event) => {
          event.stopPropagation();
          open();
        }}
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
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>
      {isOpen &&
        diagramHtml !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-label="Diagram in fullscreen view"
            onClick={close}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.closeButton}
              title="Close (Esc)"
              aria-label="Close fullscreen diagram"
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
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{__html: diagramHtml}}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

export default Mermaid;
