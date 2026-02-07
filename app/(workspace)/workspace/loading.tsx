export default function WorkspaceLoading() {
  return (
    <div className="flex flex-col gap-8 p-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded" />
        <div className="h-1 w-24 bg-primary/20 rounded-full" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between h-full">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-7 w-12 bg-muted rounded" />
              </div>
              <div className="h-10 w-10 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Content cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-card rounded-xl border border-border p-5">
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
