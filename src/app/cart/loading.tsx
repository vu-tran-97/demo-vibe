export default function CartLoading() {
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
        <div className="h-[32px] bg-border-light rounded-[4px] animate-pulse w-[150px] mb-[2rem]" />

        <div className="grid grid-cols-[1fr_360px] gap-[2rem] max-md:grid-cols-1">
          {/* Cart Items */}
          <div className="space-y-[1rem]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-[1rem] bg-white rounded-[12px] border border-border-light p-[1rem]"
              >
                <div className="w-[100px] h-[100px] bg-border-light rounded-[8px] animate-pulse shrink-0" />
                <div className="flex-1 space-y-[0.5rem]">
                  <div className="h-[16px] bg-border-light rounded-[4px] animate-pulse w-[70%]" />
                  <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[40%]" />
                  <div className="h-[20px] bg-border-light rounded-[4px] animate-pulse w-[25%]" />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-[12px] border border-border-light p-[1.5rem] h-fit">
            <div className="h-[20px] bg-border-light rounded-[4px] animate-pulse w-[50%] mb-[1.5rem]" />
            <div className="space-y-[0.75rem] mb-[1.5rem]">
              <div className="flex justify-between">
                <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[30%]" />
                <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[20%]" />
              </div>
              <div className="flex justify-between">
                <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[25%]" />
                <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[15%]" />
              </div>
              <div className="h-[1px] bg-border-light" />
              <div className="flex justify-between">
                <div className="h-[18px] bg-border-light rounded-[4px] animate-pulse w-[20%]" />
                <div className="h-[18px] bg-border-light rounded-[4px] animate-pulse w-[25%]" />
              </div>
            </div>
            <div className="h-[48px] bg-border-light rounded-[8px] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
