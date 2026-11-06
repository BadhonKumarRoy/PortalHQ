// src/components/ui/Button.jsx
// A reusable button component with multiple variants, sizes, and states.
// Use this everywhere instead of raw <button> tags for consistent styling.

import { Loader2 } from 'lucide-react';

// Style maps for each button variant and size
const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-600 focus:ring-primary-300 border border-transparent',
  secondary: 'bg-white text-primary border border-primary/30 hover:bg-slate-50 focus:ring-slate-200',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 border border-transparent',
  success: 'bg-accent text-white hover:bg-accent-500 focus:ring-accent-200 border border-transparent',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Show spinner when loading, otherwise show optional icon */}
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
}
