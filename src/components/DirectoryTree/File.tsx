import { useContext, type ReactNode } from 'react';
import { DepthContext } from './contexts';
import FileIcon from './FileIcon';
import styles from './styles.module.scss';

type FileProps = {
  name: string;
  icon?: string;
};

export default function File({ name, icon }: FileProps): ReactNode {
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
