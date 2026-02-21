export function SkeletonCard() {
  return (
    <div className="swiss-card animate-pulse">
      <div className="h-4 bg-swiss-muted w-1/3 mb-4" />
      <div className="h-8 bg-swiss-muted w-2/3 mb-2" />
      <div className="h-4 bg-swiss-muted w-1/2" />
    </div>
  )
}

export function SkeletonGauge() {
  return (
    <div className="swiss-card animate-pulse">
      <div className="h-4 bg-swiss-muted w-1/3 mb-8" />
      <div className="w-48 h-48 mx-auto rounded-full border-8 border-swiss-muted" />
      <div className="h-6 bg-swiss-muted w-1/2 mx-auto mt-8" />
    </div>
  )
}
