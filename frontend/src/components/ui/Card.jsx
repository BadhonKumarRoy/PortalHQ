// src/components/ui/Card.jsx
// A simple white card container with a shadow and rounded corners.
// Optionally shows a title and an action button in the header.

export default function Card({ title, children, action, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-card border border-slate-100 ${className}`}>
      {/* Card header — only shown if title or action is provided */}
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {title && (
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          )}
          {/* Optional action button/element on the right */}
          {action && <div>{action}</div>}
        </div>
      )}
      {/* Card body */}
      <div className="p-6">{children}</div>
    </div>
  );
}
