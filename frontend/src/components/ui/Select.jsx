// src/components/ui/Select.jsx
// A styled select (dropdown) input. Same look and feel as Input.jsx.

export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],   // Array of { value, label }
  error,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Label */}
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select dropdown */}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white
          border rounded-xl outline-none transition-all duration-200 cursor-pointer
          focus:ring-2 focus:ring-accent/40 focus:border-accent
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:ring-red-200' : 'border-slate-200'}
        `}
      >
        {/* Placeholder option */}
        <option value="" disabled>
          {placeholder}
        </option>
        {/* Render each option */}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Error message */}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
