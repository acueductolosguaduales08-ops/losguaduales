import { createContext, useContext, useCallback, useState, useMemo } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const STYLES = {
  success: 'border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-300',
  info: 'border-l-4 border-brand text-brand-dark dark:text-brand-light',
  warning: 'border-l-4 border-amber-500 text-amber-700 dark:text-amber-300',
  error: 'border-l-4 border-red-500 text-red-700 dark:text-red-300',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 bg-white dark:bg-dark-card shadow-lg rounded-xl px-4 py-3 text-sm font-medium animate-[fadeIn_0.2s_ease] ${STYLES[t.type] || STYLES.info}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-gray-700 dark:text-gray-100">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
