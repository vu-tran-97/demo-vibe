'use client';

import styles from './loading-spinner.module.css';

export function LoadingSpinner() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading...</p>
    </div>
  );
}
