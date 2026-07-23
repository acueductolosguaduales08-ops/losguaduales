import { X } from 'lucide-react';

const DESKTOP_WIDTH = {
  'max-w-sm': 'sm:max-w-sm',
  'max-w-md': 'sm:max-w-md',
  'max-w-lg': 'sm:max-w-lg',
  'max-w-xl': 'sm:max-w-xl',
  'max-w-2xl': 'sm:max-w-2xl',
};

export default function SimpleModal({ open, onClose, title, maxWidth = 'max-w-md', children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] animate-modalOverlayIn" onClick={onClose}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={`
          fixed inset-0 sm:relative sm:mx-auto sm:my-auto
          bg-white dark:bg-dark-card
          flex flex-col
          sm:rounded-xl sm:shadow-2xl sm:border sm:border-gray-100 sm:dark:border-gray-700
          ${DESKTOP_WIDTH[maxWidth] || 'sm:max-w-md'}
          sm:max-h-[85dvh]
          animate-modalMobileIn sm:animate-modalIn
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        <div className="px-5 pb-3 pt-1 sm:pt-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}