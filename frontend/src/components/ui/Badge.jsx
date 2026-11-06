// src/components/ui/Badge.jsx
// A colored status badge pill. Maps status strings to colors automatically.
// Used across tickets, projects, approvals, etc.

// Map each status value to a Tailwind color set
const STATUS_COLORS = {
  // Green — positive/done states
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  AVAILABLE: 'bg-emerald-100 text-emerald-700',

  // Yellow/Amber — waiting states
  PENDING: 'bg-amber-100 text-amber-700',
  PLANNED: 'bg-amber-100 text-amber-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',

  // Orange — attention needed
  ON_HOLD: 'bg-orange-100 text-orange-700',
  WAITING_CLIENT: 'bg-orange-100 text-orange-700',

  // Red — negative/blocked states
  CANCELLED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-red-100 text-red-700',
  INACTIVE: 'bg-red-100 text-red-700',
  CRITICAL: 'bg-red-100 text-red-700',
  DECOMMISSIONED: 'bg-red-100 text-red-700',

  // Blue — in-progress states
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',

  // Purple — open states
  OPEN: 'bg-purple-100 text-purple-700',
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',

  // Gray — closed/archived
  CLOSED: 'bg-slate-100 text-slate-600',
  ARCHIVED: 'bg-slate-100 text-slate-600',
  IN_REPAIR: 'bg-blue-100 text-blue-700',
};

/** Returns the Tailwind classes for a given status string. */
export function getStatusColor(status) {
  return STATUS_COLORS[status?.toUpperCase()] || 'bg-slate-100 text-slate-600';
}

/** Renders a colored pill badge for a given status. */
export default function Badge({ status, label, className = '' }) {
  // Use label if provided, otherwise format the status string nicely
  const displayLabel =
    label || (status ? status.replace(/_/g, ' ') : 'Unknown');

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${getStatusColor(status)}
        ${className}
      `}
    >
      {displayLabel}
    </span>
  );
}
