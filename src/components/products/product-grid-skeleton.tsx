export function ProductGridSkeleton({ columns = 3 }: { columns?: number }) {
  const gridCols = {
    3: "grid-cols-2 md:grid-cols-3 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div className={`mt-10 grid ${gridCols[columns as keyof typeof gridCols] ?? gridCols[3]} gap-4`}>
      {Array.from({ length: columns === 4 ? 8 : 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-[28px] bg-white p-4 shadow-card">
          <div className="h-[250px] rounded-[20px] bg-brand-mist/60" />
          <div className="mt-4 space-y-2 px-2">
            <div className="h-5 w-3/4 rounded-full bg-brand-mist/60" />
            <div className="h-4 w-1/2 rounded-full bg-brand-mist/40" />
            <div className="mt-3 h-9 w-full rounded-full bg-brand-mist/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
