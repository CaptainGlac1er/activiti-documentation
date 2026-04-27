import { useContext, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ExpandAllContext, DotWalkContext, DepthContext } from './contexts';
import { collectChain } from './helpers';
import FolderIcon from './FolderIcon';
import styles from './styles.module.scss';

type DirProps = {
  name: string;
  defaultExpanded?: boolean;
  children: ReactNode;
};

export default function Dir({ name, defaultExpanded: propDefaultExpanded, children }: DirProps): ReactNode {
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
          {'\u25B6'}
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
