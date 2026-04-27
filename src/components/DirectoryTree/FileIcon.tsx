import clsx from 'clsx';
import styles from './styles.module.scss';

export default function FileIcon({ name }: { name: string }) {
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
