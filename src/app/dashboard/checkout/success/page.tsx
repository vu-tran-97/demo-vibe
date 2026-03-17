'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import styles from './success.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo') || 'N/A';

  return (
    <div className={styles.success}>
      <div className={styles.successIcon}>&#10003;</div>

      <h2 className={styles.title}>Order Confirmed!</h2>
      <p className={styles.subtitle}>
        Your payment has been received and your order is being processed.
      </p>

      <div className={styles.orderCard}>
        <p className={styles.orderLabel}>Order Number</p>
        <p className={styles.orderNumber}>{orderNo}</p>
      </div>

      <div className={styles.actions}>
        <Link href="/dashboard/orders" className={styles.primaryLink}>
          View My Orders
        </Link>
        <Link href="/dashboard/products" className={styles.secondaryLink}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.success}>
          <p>Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
