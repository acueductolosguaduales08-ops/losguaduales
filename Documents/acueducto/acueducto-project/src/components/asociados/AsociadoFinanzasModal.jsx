import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { AsociadosAPI } from '../../api/asociados';
import { useToast } from '../../context/ToastContext';

function formatCOP(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

// Modal de resumen financiero (GET /api/v1/asociados/{id}/resumen-financiero).
export default function AsociadoFinanzasModal({ open, asociado, onClose }) {
  const { toast } = useToast();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !asociado) return;
    const controller = new AbortController();
    setLoading(true);
    setResumen(null);
    AsociadosAPI.resumenFinanciero(asociado.id, controller.signal)
      .then(setResumen)
      .catch((err) => {
        if (err.name !== 'AbortError') toast(err.message || 'No se pudo cargar el resumen financiero.', 'error');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, asociado]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !asociado) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease]">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Resumen financiero</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {asociado.nombres} {asociado.apellidos}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Calculando resumen…</span>
            </div>
          )}

          {!loading && resumen && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-50 dark:bg-dark-bg border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-lg text-center">
                  <span className="block text-gray-500 dark:text-gray-400 text-xs mb-1">Total pagado</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCOP(resumen.totalPagado)}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-dark-bg border border-red-200 dark:border-red-900/50 p-4 rounded-lg text-center">
                  <span className="block text-gray-500 dark:text-gray-400 text-xs mb-1">Total pendiente</span>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCOP(resumen.totalPendiente)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-muted divide-y divide-gray-200 dark:divide-dark-muted text-sm">
                <div className="p-3 flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total facturas emitidas</span>
                  <span className="font-mono text-gray-800 dark:text-white">{resumen.totalFacturas}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Facturas pagadas</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{resumen.facturasPagadas}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Facturas pendientes</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{resumen.facturasPendientes}</span>
                </div>
                <div className="p-3 flex justify-between bg-amber-50 dark:bg-amber-900/10">
                  <span className="text-gray-500 dark:text-gray-400">Multas activas (monto)</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    {resumen.numeroMultas} ({formatCOP(resumen.totalMultas)})
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
