import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { PeriodosAPI } from '../../api/periodos';
import { useToast } from '../../context/ToastContext';

const inputCls =
  'w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';
const labelCls = 'block text-sm text-gray-500 dark:text-gray-400 mb-1';

// Modal de creación de año contable (POST /api/v1/periodos/anios).
export default function AnioFormModal({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const [anio, setAnio] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setAnio(String(new Date().getFullYear()));
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseInt(anio, 10);
    if (!val || Number.isNaN(val)) {
      toast('Ingresa un año contable válido.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const nuevo = await PeriodosAPI.crearAnio(val);
      toast(`Ejercicio contable ${val} creado correctamente.`, 'success');
      onCreated?.(nuevo);
      onClose();
    } catch (err) {
      toast(err.message || 'No se pudo crear el año contable.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xs bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease]">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Nuevo ejercicio contable</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>
              Año <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              autoFocus
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              placeholder="Ingrese el año"
              className={inputCls}
            />
          </div>

          <div className="pt-1 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear año
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
