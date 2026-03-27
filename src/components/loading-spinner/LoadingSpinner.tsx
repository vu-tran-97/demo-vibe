'use client';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-[4rem] px-[2rem] gap-[1rem]">
      <div className="w-8 h-8 border-[3px] border-border-light border-t-gold rounded-full animate-spin" />
      <p className="text-[0.875rem] text-muted">Loading...</p>
    </div>
  );
}
