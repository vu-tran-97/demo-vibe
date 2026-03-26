import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory p-[2rem]">
      <div className="text-center max-w-[480px] animate-fade-up">
        <h1 className="font-display text-[8rem] max-sm:text-[5rem] font-light tracking-[-0.04em] text-charcoal leading-none">404</h1>
        <div className="w-[48px] h-px bg-gold mx-auto my-[1.5rem]" />
        <h2 className="font-display text-[1.75rem] max-sm:text-[1.375rem] font-normal text-charcoal mb-[1rem]">Page Not Found</h2>
        <p className="text-[0.9375rem] text-muted leading-[1.6] mb-[3rem]">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="inline-block py-[0.75rem] px-[2rem] text-[0.875rem] font-medium tracking-[0.02em] text-white bg-charcoal rounded-[8px] no-underline transition-all duration-[200ms] hover:bg-charcoal-light hover:shadow-soft hover:-translate-y-px">
          Go Home
        </Link>
      </div>
    </div>
  );
}
