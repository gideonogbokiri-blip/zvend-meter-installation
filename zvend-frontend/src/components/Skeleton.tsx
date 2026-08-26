export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer rounded-lg ${className}`} />
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="hidden h-4 w-20 md:block" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      ))}
    </div>
  )
}
