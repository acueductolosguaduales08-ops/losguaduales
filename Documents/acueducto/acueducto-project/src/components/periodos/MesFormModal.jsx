import { useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { PeriodosAPI, NOMBRES_MESES } from '../../api/periodos';
import { useToast } from '../../context/ToastContext';

const inputCls =
  'w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';
const labelCls = 'block text-sm text-gray-500 dark:text-gray-400 mb-1';

// Modal para aperturar un mes contable (POST /api/v1/periodos/meses).
export default function MesFormModal({ open, anio, mesesRegistrados = [], onClose, onCreated }) {
  const { toast } = useToast();
  const [numeroMes, setNumeroMes] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const disponibles = useMemo(
    () =>
      NOMBRES_MESES.map((nombre, idx) => ({ nombre, numero: idx + 1 })).filter(
        ({ numero }) => !mesesRegistrados.includes(numero)
      ),
    [mesesRegistrados]
  );

  useEffect(() => {
    if (open) setNumeroMes(String(disponibles[0]?.numero ?? 1));
  }, [open, disponibles]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!anio) return;

    setSubmitting(true);
    try {
      const nuevo = await PeriodosAPI.crearMes(anio.id, Number(numeroMes));
      toast(`${NOMBRES_MESES[Number(numeroMes) - 1]} ${anio.anio} aperturado correctamente.`, 'success');
      onCreated?.(nuevo);
      onClose();
    } catch (err) {
      toast(err.message || 'No se pudo aperturar el mes contable.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease]">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Aperturar mes contable</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ejercicio <strong className="text-gray-800 dark:text-white">{anio?.anio}</strong>
          </p>

          {disponibles.length === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Todos los meses de este ejercicio ya están registrados.
            </p>
          ) : (
            <div>
              <label className={labelCls}>Mes</label>
              <select value={numeroMes} onChange={(e) => setNumeroMes(e.target.value)} className={inputCls}>
                {disponibles.map(({ nombre, numero }) => (
                  <option key={numero} value={numero}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              disabled={submitting || disponibles.length === 0}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Aperturar mes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
