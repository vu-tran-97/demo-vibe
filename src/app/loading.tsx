export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      {/* Top Bar Skeleton */}
      <div className="bg-charcoal h-[32px] max-sm:hidden" />

      {/* Header Skeleton */}
      <header className="sticky top-0 z-[100] bg-white border-b border-border-light shadow-subtle">
        <div className="max-w-[1280px] mx-auto px-[2rem] py-[0.75rem] flex items-center gap-[2rem] max-sm:px-[1rem] max-sm:py-[0.625rem]">
          <div className="w-[80px] h-[28px] bg-border-light rounded-[4px] animate-pulse" />
          <div className="flex-1 max-w-[640px] h-[42px] bg-border-light rounded-[8px] animate-pulse" />
          <div className="flex items-center gap-[1rem]">
            <div className="w-[40px] h-[40px] bg-border-light rounded-[8px] animate-pulse" />
            <div className="w-[40px] h-[40px] bg-border-light rounded-[8px] animate-pulse" />
          </div>
        </div>
      </header>

      {/* Category Nav Skeleton */}
      <nav className="bg-white border-b border-border-light">
        <div className="max-w-[1280px] mx-auto px-[2rem] py-[0.625rem] flex gap-[0.5rem] max-sm:px-[1rem]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[32px] rounded-full bg-border-light animate-pulse shrink-0"
              style={{ width: `${60 + (i % 3) * 20}px` }}
            />
          ))}
        </div>
      </nav>

      {/* Banner Skeleton */}
      <section className="max-w-[1280px] mx-auto px-[2rem] pt-[1.5rem] w-full max-sm:px-[1rem]">
        <div className="w-full h-[320px] bg-border-light rounded-[12px] animate-pulse max-sm:h-[200px]" />
      </section>

      {/* Product Grid Skeleton */}
      <section className="flex-1 py-[2rem] pb-[4rem]">
        <div className="max-w-[1280px] mx-auto px-[2rem] max-sm:px-[1rem]">
          {/* Sort Bar */}
          <div className="h-[56px] mb-[1.5rem] bg-white rounded-[8px] border border-border-light animate-pulse" />

          {/* Grid */}
          <div className="grid grid-cols-4 gap-[1rem] max-md:grid-cols-3 max-sm:grid-cols-2 max-sm:gap-[0.5rem]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-[12px] overflow-hidden border border-border-light"
              >
                <div className="aspect-square bg-border-light animate-pulse" />
                <div className="p-[1rem] space-y-[0.5rem]">
                  <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[85%]" />
                  <div className="h-[12px] bg-border-light rounded-[4px] animate-pulse w-[50%]" />
                  <div className="h-[18px] bg-border-light rounded-[4px] animate-pulse w-[40%]" />
                  <div className="h-[1px] bg-border-light mt-[0.5rem]" />
                  <div className="flex justify-between">
                    <div className="h-[12px] bg-border-light rounded-[4px] animate-pulse w-[30%]" />
                    <div className="h-[12px] bg-border-light rounded-[4px] animate-pulse w-[20%]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
