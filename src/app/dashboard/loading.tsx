export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Sidebar Skeleton */}
      <aside className="w-[260px] bg-white border-r border-border-light p-[1.5rem] shrink-0 max-md:hidden">
        <div className="w-[80px] h-[28px] bg-border-light rounded-[4px] animate-pulse mb-[2rem]" />
        <div className="space-y-[0.5rem]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[40px] bg-border-light rounded-[8px] animate-pulse"
            />
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 p-[2rem] max-sm:p-[1rem]">
        {/* Page Title */}
        <div className="h-[32px] bg-border-light rounded-[4px] animate-pulse w-[200px] mb-[2rem]" />

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-[1rem] mb-[2rem] max-md:grid-cols-2 max-sm:grid-cols-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[100px] bg-white rounded-[12px] border border-border-light p-[1.5rem] animate-pulse"
            >
              <div className="h-[12px] bg-border-light rounded-[4px] w-[60%] mb-[0.75rem]" />
              <div className="h-[24px] bg-border-light rounded-[4px] w-[40%]" />
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[12px] border border-border-light p-[1.5rem]">
          <div className="h-[24px] bg-border-light rounded-[4px] animate-pulse w-[150px] mb-[1.5rem]" />
          <div className="space-y-[1rem]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[56px] bg-border-light rounded-[8px] animate-pulse"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
