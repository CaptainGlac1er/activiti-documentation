import { useContext, useState, type ReactNode, Children, type ReactElement } from 'react';
import clsx from 'clsx';
import { ExpandAllContext, DotWalkContext, DepthContext, ShowFirstContext } from './contexts';
import { collectChain } from './helpers';
import FolderIcon from './FolderIcon';
import File from './File';
import styles from './styles.module.scss';

type DirProps = {
  name: string;
  defaultExpanded?: boolean;
  showFirst?: number;
  children: ReactNode;
};

function isFileElement(node: ReactNode): node is ReactElement {
  if (typeof node !== 'object' || node === null || !('$$typeof' in node)) return false;
  const el = node as ReactElement;
  return el.type === File;
}

export default function Dir({ name, defaultExpanded: propDefaultExpanded, showFirst: propShowFirst, children }: DirProps): ReactNode {
  const expandAll = useContext(ExpandAllContext);
  const dotWalk = useContext(DotWalkContext);
  const depth = useContext(DepthContext);
  const globalShowFirst = useContext(ShowFirstContext);
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

  const showFirstLimit = propShowFirst ?? globalShowFirst;

  const childArray = Children.toArray(renderChildren);
  const dirs = childArray.filter((c) => !isFileElement(c));
  const files = childArray.filter(isFileElement);
  const hasMore = showFirstLimit !== null && files.length > showFirstLimit;

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
          {'\u25B6'}
        </span>
        <FolderIcon isOpen={isOpen} />
        <span className={clsx(styles.itemName, styles.dirName)}>{displayName}</span>
        {childArray.length > 0 && (
          <span className={clsx(styles.badge, styles.badgeDefault)}>
            {childArray.length}
          </span>
        )}
      </div>
      {isOpen && (
        <div className={styles.treeChildren}>
          <DepthContext.Provider value={depth + 1}>
            {dirs}
            {hasMore ? (
              <TruncatedChildren children={files} showFirst={showFirstLimit} />
            ) : (
              files
            )}
          </DepthContext.Provider>
        </div>
      )}
    </div>
  );
}

type TruncatedProps = {
  children: ReactNode[];
  showFirst: number;
};

function TruncatedChildren({ children, showFirst }: TruncatedProps): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? children : children.slice(0, showFirst);
  const hiddenCount = children.length - showFirst;

  return (
    <>
      {visible}
      {!expanded && hiddenCount > 0 && (
        <div className={styles.treeItem}>
          <div
            className={clsx(styles.itemRow, styles.showMoreRow)}
            onClick={() => setExpanded(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(true); } }}
          >
            <span className={styles.indent} />
            <span className={styles.showMoreText}>+{hiddenCount} more…</span>
          </div>
        </div>
      )}
      {expanded && (
        <div className={styles.treeItem}>
          <div
            className={clsx(styles.itemRow, styles.showMoreRow)}
            onClick={() => setExpanded(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(false); } }}
          >
            <span className={styles.indent} />
            <span className={styles.showMoreText}>− collapse {hiddenCount}</span>
          </div>
        </div>
      )}
    </>
  );
}
