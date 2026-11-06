// src/components/ui/Input.jsx
// A styled form input with a label, error state, and clean focus ring.

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input field */}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`
          w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white
          border rounded-xl outline-none transition-all duration-200
          placeholder:text-slate-400
          focus:ring-2 focus:ring-accent/40 focus:border-accent
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-slate-200'}
        `}
        {...props}
      />

      {/* Error message shown below the input */}
      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
}
