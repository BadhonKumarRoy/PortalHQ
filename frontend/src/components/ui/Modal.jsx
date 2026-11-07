// src/components/ui/Modal.jsx
// A reusable modal dialog with an overlay backdrop.
// Supports both 'isOpen' and 'open' props for seamless compatibility.

import { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  isOpen,
  open,
  onClose,
  title,
  children,
  size = 'md',
}) {
  // Support either `isOpen` or `open` prop
  const visible = Boolean(isOpen !== undefined ? isOpen : open);

  // Close the modal when the user presses the Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (visible) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [visible, onClose]);

  // Prevent scrolling the page behind the modal
  useEffect(() => {
    if (visible) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  // Don't render anything if the modal is closed
  if (!visible) return null;

  return (
    // Dark backdrop — clicking it closes the modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Modal panel — stop click propagation so clicking inside doesn't close it */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-2xl w-full ${SIZE_CLASSES[size]}
          animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Modal body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
