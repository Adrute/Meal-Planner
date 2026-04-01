export default function PageLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-8 w-44 bg-slate-100 rounded-xl" />
          <div className="h-4 w-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-24" />
        ))}
      </div>
      {/* Content cards */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 h-52" />
      <div className="bg-white rounded-2xl border border-slate-100 p-6 h-64" />
    </div>
  )
}
