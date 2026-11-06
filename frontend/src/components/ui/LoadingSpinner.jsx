// src/components/ui/LoadingSpinner.jsx
// A simple centered spinning circle animation.
// Show this whenever a page is waiting for data to load.

export default function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-2',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      {/* Spinning circle */}
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-slate-200 border-t-accent`}
      />
      {/* Optional loading message */}
      {message && (
        <p className="text-sm text-slate-400">{message}</p>
      )}
    </div>
  );
}
