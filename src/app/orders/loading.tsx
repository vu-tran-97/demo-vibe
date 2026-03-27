export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-[100] bg-white border-b border-border-light shadow-subtle">
        <div className="max-w-[1280px] mx-auto px-[2rem] py-[0.75rem] flex items-center gap-[2rem] max-sm:px-[1rem]">
          <div className="w-[80px] h-[28px] bg-border-light rounded-[4px] animate-pulse" />
          <div className="flex-1 max-w-[640px] h-[42px] bg-border-light rounded-[8px] animate-pulse" />
          <div className="flex items-center gap-[1rem]">
            <div className="w-[40px] h-[40px] bg-border-light rounded-[8px] animate-pulse" />
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-[2rem] py-[2rem] max-sm:px-[1rem]">
        <div className="h-[32px] bg-border-light rounded-[4px] animate-pulse w-[180px] mb-[2rem]" />

        <div className="space-y-[1rem]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-[12px] border border-border-light p-[1.5rem]"
            >
              <div className="flex items-center justify-between mb-[1rem]">
                <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[120px]" />
                <div className="h-[24px] bg-border-light rounded-full animate-pulse w-[80px]" />
              </div>
              <div className="flex gap-[1rem]">
                <div className="w-[80px] h-[80px] bg-border-light rounded-[8px] animate-pulse shrink-0" />
                <div className="flex-1 space-y-[0.5rem]">
                  <div className="h-[16px] bg-border-light rounded-[4px] animate-pulse w-[60%]" />
                  <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[30%]" />
                  <div className="h-[18px] bg-border-light rounded-[4px] animate-pulse w-[20%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
