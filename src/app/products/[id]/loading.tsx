export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-[100] bg-white border-b border-border-light shadow-subtle">
        <div className="max-w-[1280px] mx-auto px-[2rem] py-[0.75rem] flex items-center gap-[2rem] max-sm:px-[1rem]">
          <div className="w-[80px] h-[28px] bg-border-light rounded-[4px] animate-pulse" />
          <div className="flex-1 max-w-[640px] h-[42px] bg-border-light rounded-[8px] animate-pulse" />
          <div className="flex items-center gap-[1rem]">
            <div className="w-[40px] h-[40px] bg-border-light rounded-[8px] animate-pulse" />
            <div className="w-[40px] h-[40px] bg-border-light rounded-[8px] animate-pulse" />
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-[2rem] py-[2rem] max-sm:px-[1rem]">
        {/* Breadcrumb */}
        <div className="h-[16px] bg-border-light rounded-[4px] animate-pulse w-[200px] mb-[2rem]" />

        <div className="grid grid-cols-2 gap-[3rem] max-md:grid-cols-1">
          {/* Image */}
          <div className="aspect-square bg-border-light rounded-[12px] animate-pulse" />

          {/* Details */}
          <div className="space-y-[1.5rem]">
            <div className="h-[32px] bg-border-light rounded-[4px] animate-pulse w-[80%]" />
            <div className="h-[16px] bg-border-light rounded-[4px] animate-pulse w-[40%]" />
            <div className="h-[28px] bg-border-light rounded-[4px] animate-pulse w-[30%]" />
            <div className="space-y-[0.5rem]">
              <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-full" />
              <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[90%]" />
              <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[70%]" />
            </div>
            <div className="h-[48px] bg-border-light rounded-[8px] animate-pulse w-full" />
            <div className="h-[48px] bg-border-light rounded-[8px] animate-pulse w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
