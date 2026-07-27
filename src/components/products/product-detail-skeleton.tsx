export function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="aspect-square rounded-[28px] bg-brand-mist/60" />
      <div className="space-y-4">
        <div className="h-4 w-20 rounded-full bg-brand-mist/40" />
        <div className="h-8 w-3/4 rounded-full bg-brand-mist/60" />
        <div className="h-4 w-1/2 rounded-full bg-brand-mist/40" />
        <div className="mt-6 space-y-2">
          <div className="h-4 w-full rounded-full bg-brand-mist/40" />
          <div className="h-4 w-full rounded-full bg-brand-mist/40" />
          <div className="h-4 w-2/3 rounded-full bg-brand-mist/40" />
        </div>
        <div className="mt-8 flex items-center gap-4">
          <div className="h-10 w-32 rounded-full bg-brand-mist/60" />
          <div className="h-10 w-10 rounded-full bg-brand-mist/40" />
          <div className="h-10 w-10 rounded-full bg-brand-mist/40" />
          <div className="h-10 w-10 rounded-full bg-brand-mist/40" />
        </div>
        <div className="mt-8 flex gap-4">
          <div className="h-14 w-full rounded-full bg-brand-mist/60" />
          <div className="h-14 w-14 rounded-full bg-brand-mist/40" />
        </div>
      </div>
    </div>
  );
}
