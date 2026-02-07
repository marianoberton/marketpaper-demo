export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-8 p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-xl border border-border border-l-4 border-l-primary/30 p-4">
            <div className="flex items-center justify-between h-full">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-8 w-14 bg-muted rounded" />
              </div>
              <div className="h-12 w-12 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <div className="h-5 w-40 bg-muted rounded" />
        </div>
        <div className="p-5 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="h-10 w-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-56 bg-muted rounded" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
              <div className="h-6 w-16 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
