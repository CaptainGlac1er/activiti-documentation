import React, { createContext, useContext, useState, type ReactNode, type ReactElement } from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';

type FileProps = {
  name: string;
  icon?: string;
};

type DirProps = {
  name: string;
  defaultExpanded?: boolean;
  children: ReactNode;
};

type ChainResult = { names: string[]; remainingChildren: ReactNode[] };

const ExpandAllContext = createContext(false);
const DotWalkContext = createContext(true);
const DepthContext = createContext(0);

function isDirElement(el: ReactElement): boolean {
  return el.props?.children != null;
}

function collectChain(name: string, children: ReactNode): ChainResult {
  const arr = React.Children.toArray(children) as ReactElement[];

  if (arr.length !== 1 || !isDirElement(arr[0])) {
    return { names: [name], remainingChildren: arr };
  }

  const inner = collectChain(arr[0].props.name, arr[0].props.children);
  return { names: [name, ...inner.names], remainingChildren: inner.remainingChildren };
}

function FileIcon({ name }: { name: string }) {
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : '';

  if (ext === 'java') return <span className={styles.badge}>J</span>;
  if (ext === 'xml') return <span className={clsx(styles.badge, styles.badgeX)}>X</span>;
  if (ext === 'yaml' || ext === 'yml') return <span className={clsx(styles.badge, styles.badgeY)}>Y</span>;
  if (ext === 'json') return <span className={styles.badge}>J</span>;
  if (ext === 'md' || ext === 'mdx') return <span className={clsx(styles.badge, styles.badgeM)}>M</span>;
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return <span className={clsx(styles.badge, styles.badgeTs)}>TS</span>;
  if (['scss', 'css'].includes(ext)) return <span className={clsx(styles.badge, styles.badgeC)}>C</span>;
  if (ext === 'properties') return <span className={clsx(styles.badge, styles.badgeP)}>P</span>;
  if (ext === 'sh' || ext === 'bash') return <span className={clsx(styles.badge, styles.badgeS)}>S</span>;

  return <span className={clsx(styles.badge, styles.badgeDefault)}>F</span>;
}

function FolderIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span className={clsx(styles.folderIcon, isOpen && styles.folderOpen)}>
      {isOpen ? '📂' : '📁'}
    </span>
  );
}

function File({ name, icon }: FileProps) {
  const depth = useContext(DepthContext);

  return (
    <div className={styles.treeItem} style={{ '--depth': depth } as React.CSSProperties}>
      <div className={styles.itemRow}>
        <span className={styles.indent} />
        {icon ? <span className={styles.itemIcon}>{icon}</span> : <FileIcon name={name} />}
        <span className={styles.itemName}>{name}</span>
      </div>
    </div>
  );
}

function Dir({ name, defaultExpanded: propDefaultExpanded, children }: DirProps) {
  const expandAll = useContext(ExpandAllContext);
  const dotWalk = useContext(DotWalkContext);
  const depth = useContext(DepthContext);
  const [isOpen, setIsOpen] = useState(propDefaultExpanded ?? expandAll ?? false);

  let displayName = name;
  let renderChildren = children;

  if (dotWalk) {
    const chain = collectChain(name, children);
    if (chain.names.length > 1) {
      displayName = chain.names.join('/');
      renderChildren = chain.remainingChildren;
    }
  }

  return (
    <div className={styles.treeDir} style={{ '--depth': depth } as React.CSSProperties}>
      <div
        className={clsx(styles.itemRow, styles.dirRow)}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen); } }}
      >
        <span className={styles.indent} />
        <span className={styles.chevron} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          &#9654;
        </span>
        <FolderIcon isOpen={isOpen} />
        <span className={clsx(styles.itemName, styles.dirName)}>{displayName}</span>
      </div>
      {isOpen && (
        <div className={styles.treeChildren}>
          <DepthContext.Provider value={depth + 1}>
            {renderChildren}
          </DepthContext.Provider>
        </div>
      )}
    </div>
  );
}

function DirectoryTree({
  children,
  rootName,
  defaultExpanded = false,
  expandAll,
  dotWalk,
}: {
  children: ReactNode;
  rootName?: string;
  defaultExpanded?: boolean;
  expandAll?: boolean;
  dotWalk?: boolean;
}) {
  const [isRootOpen, setIsRootOpen] = useState(!!rootName && (defaultExpanded || expandAll || false));

  return (
    <div className={styles.directoryTree}>
      <ExpandAllContext.Provider value={expandAll ?? defaultExpanded ?? false}>
        <DotWalkContext.Provider value={dotWalk ?? true}>
          {rootName ? (
            <>
              <div className={styles.treeRoot}>
                <span className={styles.chevron} style={{ transform: isRootOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  &#9654;
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
}

DirectoryTree.File = File;
DirectoryTree.Dir = Dir;

export default DirectoryTree;
