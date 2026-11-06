// src/components/ui/StatCard.jsx
// Dashboard stat card — shows a large number with an icon and change indicator.
// Used on dashboard pages to highlight key metrics.

export default function StatCard({ title, value, icon: Icon, change, color = '#36ADA3', loading = false }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex items-start gap-4">
      {/* Colored icon circle */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }} // Transparent version of the color
      >
        {Icon && <Icon size={22} style={{ color }} />}
      </div>

      {/* Numbers and labels */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        {loading ? (
          <div className="h-8 w-20 bg-slate-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-3xl font-bold text-slate-800 mt-0.5">
            {value ?? '—'}
          </p>
        )}
        {/* Change indicator e.g. "+12% from last month" */}
        {change && (
          <p className="text-xs text-slate-400 mt-1">{change}</p>
        )}
      </div>
    </div>
  );
}
