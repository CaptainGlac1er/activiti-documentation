import { useState, type ReactNode } from 'react';
import { ExpandAllContext, DotWalkContext, DepthContext } from './contexts';
import File from './File';
import Dir from './Dir';
import styles from './styles.module.scss';

type DirectoryTreeProps = {
  children: ReactNode;
  rootName?: string;
  defaultExpanded?: boolean;
  expandAll?: boolean;
  dotWalk?: boolean;
};

const DirectoryTree = ({ children, rootName, defaultExpanded = false, expandAll, dotWalk }: DirectoryTreeProps) => {
  const [isRootOpen, setIsRootOpen] = useState(!!rootName && (defaultExpanded || expandAll || false));

  return (
    <div className={styles.directoryTree}>
      <ExpandAllContext.Provider value={expandAll ?? defaultExpanded ?? false}>
        <DotWalkContext.Provider value={dotWalk ?? true}>
          {rootName ? (
            <>
              <div className={styles.treeRoot}>
                <span className={styles.chevron} style={{ transform: isRootOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  {'\u25B6'}
                </span>
                <span className={styles.moduleIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </span>
                <span
                  className={styles.rootName}
                  onClick={() => setIsRootOpen(!isRootOpen)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsRootOpen(!isRootOpen); } }}
                >
                  {rootName}
                </span>
              </div>
              {isRootOpen && (
                <div className={styles.treeContent}>
                  <DepthContext.Provider value={1}>
                    {children}
                  </DepthContext.Provider>
                </div>
              )}
            </>
          ) : (
            <div className={styles.treeContent}>
              <DepthContext.Provider value={0}>
                {children}
              </DepthContext.Provider>
            </div>
          )}
        </DotWalkContext.Provider>
      </ExpandAllContext.Provider>
    </div>
  );
};

DirectoryTree.File = File;
DirectoryTree.Dir = Dir;

export default DirectoryTree;
