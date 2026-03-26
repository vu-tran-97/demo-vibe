'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo') || 'N/A';

  return (
    <div className="text-center py-[8rem] px-[2rem] max-w-[520px] mx-auto max-sm:py-[4rem] max-sm:px-[1rem]">
      <div className="text-[3rem] w-[80px] h-[80px] flex items-center justify-center mx-auto mb-[2rem] bg-[rgba(90,138,106,0.08)] text-success rounded-full font-light">
        &#10003;
      </div>

      <h2 className="font-display text-[1.75rem] font-normal text-charcoal mb-[0.5rem]">
        Order Confirmed!
      </h2>
      <p className="text-[0.9375rem] text-muted mb-[3rem]">
        Your payment has been received and your order is being processed.
      </p>

      <div className="bg-ivory rounded-[12px] px-[3rem] py-[2rem] mb-[3rem] max-sm:p-[1.5rem]">
        <p className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.06em] mb-[0.25rem]">
          Order Number
        </p>
        <p className="font-display text-[1.5rem] font-medium text-charcoal tracking-[0.02em] max-sm:text-[1.25rem]">
          {orderNo}
        </p>
      </div>

      <div className="flex flex-col gap-[0.5rem] items-center">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center justify-center w-full max-w-[280px] py-[0.75rem] px-[1.5rem] font-body text-[0.875rem] font-medium text-white bg-charcoal rounded-[8px] transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-soft"
        >
          View My Orders
        </Link>
        <Link
          href="/dashboard/products"
          className="text-[0.8125rem] text-gold-dark transition-colors duration-[200ms] hover:text-gold"
        >
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
        <div className="text-center py-[8rem] px-[2rem] max-w-[520px] mx-auto">
          <p>Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
