import { useEffect, useState } from 'react';
import { X, Loader2, FileStack, TriangleAlert } from 'lucide-react';
import { FacturasAPI } from '../../api/facturas';
import { PeriodosAPI, NOMBRES_MESES } from '../../api/periodos';
import { useToast } from '../../context/ToastContext';

// Modal para generar la facturación masiva de un período contable
// (POST /api/v1/facturas/generar-mes). Procesa todas las lecturas pendientes del mes.
export default function GenerarFacturacionModal({ open, onClose, onGenerado }) {
  const { toast } = useToast();
  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [months, setMonths] = useState([]);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [selectedMonthId, setSelectedMonthId] = useState(null);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedMonthId(null);
    setLoadingYears(true);
    PeriodosAPI.listarAnios()
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setYears(lista);
        setSelectedYearId(lista[0]?.id ?? null);
      })
      .catch((err) => toast(err.message || 'No se pudieron cargar los años contables.', 'error'))
      .finally(() => setLoadingYears(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedYearId) {
      setMonths([]);
      return;
    }
    setLoadingMonths(true);
    PeriodosAPI.listarMeses(selectedYearId)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setMonths(lista.slice().sort((a, b) => a.numeroMes - b.numeroMes));
      })
      .catch((err) => toast(err.message || 'No se pudieron cargar los meses del ejercicio.', 'error'))
      .finally(() => setLoadingMonths(false));
  }, [selectedYearId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const mesSeleccionado = months.find((m) => m.id === selectedMonthId) || null;
  const mesCerrado = mesSeleccionado?.estado === 'CERRADO';

  const handleGenerar = async () => {
    if (!selectedMonthId) {
      toast('Selecciona el período contable a facturar.', 'warning');
      return;
    }
    setGenerando(true);
    try {
      const facturas = await FacturasAPI.generarMes(selectedMonthId);
      const cantidad = Array.isArray(facturas) ? facturas.length : facturas?.content?.length || 0;
      toast(`Se generaron ${cantidad} factura(s) para el período seleccionado.`, 'success');
      onGenerado?.();
      onClose();
    } catch (err) {
      toast(err.message || 'No se pudo generar la facturación del mes.', 'error');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease]">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileStack className="w-5 h-5 text-brand" /> Generar facturación del mes
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Se generará una factura por cada lectura pendiente del período seleccionado. Esta acción no se puede
            deshacer directamente; las facturas generadas solo pueden anularse una por una.
          </p>

          {loadingYears ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando años…
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {years.map((y) => (
                <button
                  key={y.id}
                  onClick={() => setSelectedYearId(y.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    selectedYearId === y.id
                      ? 'bg-brand border-brand text-white'
                      : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-brand'
                  }`}
                >
                  {y.anio}
                </button>
              ))}
            </div>
          )}

          {loadingMonths ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando meses…
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {months.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMonthId(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedMonthId === m.id
                      ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                      : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400'
                  }`}
                >
                  {NOMBRES_MESES[m.numeroMes - 1]}
                  {m.estado === 'CERRADO' && ' 🔒'}
                </button>
              ))}
              {!loadingMonths && months.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">Este ejercicio no tiene meses aperturados.</p>
              )}
            </div>
          )}

          {mesCerrado && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-lg p-3">
              <TriangleAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Este período está cerrado. Verifica con el backend si aún permite generar facturación sobre un mes
                cerrado antes de continuar.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-dark-muted flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerar}
            disabled={generando || !selectedMonthId}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
          >
            {generando && <Loader2 className="w-4 h-4 animate-spin" />}
            Generar facturación
          </button>
        </div>
      </div>
    </div>
  );
}
