import clsx from 'clsx';
import styles from './styles.module.scss';

export default function FolderIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span className={clsx(styles.folderIcon, isOpen && styles.folderOpen)}>
      {isOpen ? '\uD83D\uDCC2' : '\uD83D\uDCC1'}
    </span>
  );
}
