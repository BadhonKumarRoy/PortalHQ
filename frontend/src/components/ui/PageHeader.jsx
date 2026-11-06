// src/components/ui/PageHeader.jsx
// A consistent page header with title, optional subtitle, and an action button.
// Used at the top of every main page.

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Title and subtitle on the left */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Action button/element on the right (optional) */}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
