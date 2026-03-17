import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.code}>404</h1>
        <div className={styles.divider} />
        <h2 className={styles.title}>Page Not Found</h2>
        <p className={styles.description}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className={styles.homeLink}>
          Go Home
        </Link>
      </div>
    </div>
  );
}
