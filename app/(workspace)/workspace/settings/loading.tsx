export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8 p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 w-56 bg-muted rounded" />
        <div className="h-4 w-80 bg-muted rounded" />
        <div className="h-1 w-24 bg-primary/20 rounded-full" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-28 bg-muted rounded-lg" />
        ))}
      </div>

      {/* Card skeleton */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-3 w-64 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-border/50">
              <div className="h-10 w-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
