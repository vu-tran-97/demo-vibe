export default function SettingsLoading() {
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

      <div className="max-w-[720px] mx-auto px-[2rem] py-[2rem] max-sm:px-[1rem]">
        <div className="h-[32px] bg-border-light rounded-[4px] animate-pulse w-[120px] mb-[2rem]" />

        <div className="bg-white rounded-[12px] border border-border-light p-[2rem] space-y-[1.5rem]">
          {/* Avatar */}
          <div className="flex items-center gap-[1rem]">
            <div className="w-[64px] h-[64px] bg-border-light rounded-full animate-pulse" />
            <div className="space-y-[0.5rem]">
              <div className="h-[18px] bg-border-light rounded-[4px] animate-pulse w-[150px]" />
              <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[200px]" />
            </div>
          </div>

          <div className="h-[1px] bg-border-light" />

          {/* Form Fields */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-[0.5rem]">
              <div className="h-[14px] bg-border-light rounded-[4px] animate-pulse w-[80px]" />
              <div className="h-[44px] bg-border-light rounded-[8px] animate-pulse" />
            </div>
          ))}

          <div className="h-[48px] bg-border-light rounded-[8px] animate-pulse w-[120px]" />
        </div>
      </div>
    </div>
  );
}
