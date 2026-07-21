import { useEffect, useState } from 'react';
import { X, Loader2, ShieldAlert, BarChart3, Users, MessageCircle } from 'lucide-react';
import { TesoreriaAPI } from '../../api/tesoreria';
import { AsociadosAPI } from '../../api/asociados';
import { useToast } from '../../context/ToastContext';
import AsociadoPicker from './AsociadoPicker';
import NotificarModal from '../notificarDocumento/NotificarModal';

function formatCOP(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const ESTADO_BADGE = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  PAGADA: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  ANULADA: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

// Modal de consulta de multas. El backend solo expone GET /multas/asociado/{id} (sin listado
// global), así que el "Resumen general" se calcula en el cliente recorriendo todos los
// asociados bajo demanda (el tesorero lo dispara manualmente, no se ejecuta automáticamente).
export default function MultasAsociadoModal({ open, onClose }) {
  const { toast } = useToast();
  const [tab, setTab] = useState('asociado');

  const [asociado, setAsociado] = useState(null);
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [resumen, setResumen] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
  const [notificarOpen, setNotificarOpen] = useState(false);
  const [multaNotificar, setMultaNotificar] = useState(null);

  useEffect(() => {
    if (open) {
      setTab('asociado');
      setAsociado(null);
    }
  }, [open]);

  useEffect(() => {
    if (!asociado) {
      setMultas([]);
      return;
    }
    setLoading(true);
    TesoreriaAPI.listarMultasAsociado(asociado.id)
      .then((data) => setMultas(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => toast(err.message || 'No se pudieron cargar las multas.', 'error'))
      .finally(() => setLoading(false));
  }, [asociado]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const totalPendiente = multas.filter((m) => m.estado === 'PENDIENTE').reduce((acc, m) => acc + Number(m.valor || 0), 0);

  const calcularResumenGlobal = async () => {
    setCalculando(true);
    setResumen(null);
    try {
      const data = await AsociadosAPI.buscar(undefined, { size: 1000 });
      const asociados = Array.isArray(data) ? data : data?.content || [];
      setProgreso({ actual: 0, total: asociados.length });

      let totalMultas = 0;
      let pendientes = 0;
      let pagadas = 0;
      let anuladas = 0;
      let valorPendiente = 0;
      let valorPagado = 0;
      let valorTotal = 0;
      let asociadosConPendientes = 0;

      for (let i = 0; i < asociados.length; i++) {
        const a = asociados[i];
        // eslint-disable-next-line no-await-in-loop
        const resp = await TesoreriaAPI.listarMultasAsociado(a.id).catch(() => []);
        const ms = Array.isArray(resp) ? resp : resp?.content || [];
        let pendienteAsociado = 0;
        for (const m of ms) {
          totalMultas++;
          valorTotal += Number(m.valor || 0);
          if (m.estado === 'PENDIENTE') {
            pendientes++;
            valorPendiente += Number(m.valor || 0);
            pendienteAsociado += Number(m.valor || 0);
          } else if (m.estado === 'PAGADA') {
            pagadas++;
            valorPagado += Number(m.valor || 0);
          } else if (m.estado === 'ANULADA') {
            anuladas++;
          }
        }
        if (pendienteAsociado > 0) asociadosConPendientes++;
        setProgreso({ actual: i + 1, total: asociados.length });
      }

      setResumen({
        totalAsociados: asociados.length,
        totalMultas,
        pendientes,
        pagadas,
        anuladas,
        valorPendiente,
        valorPagado,
        valorTotal,
        asociadosConPendientes,
      });
    } catch (err) {
      toast(err.message || 'No se pudo calcular el resumen general de multas.', 'error');
    } finally {
      setCalculando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> Multas
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-1.5 shrink-0">
          <button
            onClick={() => setTab('asociado')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
              tab === 'asociado'
                ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Por asociado
          </button>
          <button
            onClick={() => setTab('resumen')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
              tab === 'resumen'
                ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Resumen general
          </button>
        </div>

        <div className="p-5 overflow-y-auto overscroll-contain custom-scroll space-y-4">
          {tab === 'asociado' && (
            <>
              <AsociadoPicker value={asociado} onChange={setAsociado} autoFocus />

              {loading && (
                <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Cargando multas…</span>
                </div>
              )}

              {!loading && asociado && multas.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                  Este asociado no tiene multas registradas.
                </p>
              )}

              {!loading && multas.length > 0 && (
                <>
                  {totalPendiente > 0 && (
                    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-lg px-3.5 py-2.5">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Total pendiente</span>
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{formatCOP(totalPendiente)}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {multas.map((m) => (
                      <div key={m.id} className="p-3 rounded-lg border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{m.motivo}</p>
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_BADGE[m.estado] || ESTADO_BADGE.PENDIENTE}`}>
                            {m.estado}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
                          <span>{formatFecha(m.fecha)}</span>
                          <span className="font-bold text-gray-800 dark:text-white text-sm">{formatCOP(m.valor)}</span>
                        </div>
                        <button
                          onClick={() => {
                            setMultaNotificar(m);
                            setNotificarOpen(true);
                          }}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Notificar al asociado
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'resumen' && (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                El sistema no tiene un listado global de multas: este resumen se calcula recorriendo cada asociado
                registrado. En acueductos con muchos asociados puede tardar unos segundos.
              </p>

              {!resumen && !calculando && (
                <button
                  onClick={calcularResumenGlobal}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
                >
                  <BarChart3 className="w-4 h-4" /> Calcular resumen general
                </button>
              )}

              {calculando && (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">
                    Consultando asociado {progreso.actual} de {progreso.total}…
                  </span>
                </div>
              )}

              {resumen && !calculando && (
                <>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center">
                      <span className="text-2xl font-black text-gray-800 dark:text-white">{resumen.totalMultas}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Multas totales</span>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center">
                      <span className="text-2xl font-black text-amber-500">{resumen.pendientes}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Por cobrar</span>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{resumen.pagadas}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Pagadas</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-xl p-3.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Valor por cobrar</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{formatCOP(resumen.valorPendiente)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Valor ya cobrado</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCOP(resumen.valorPagado)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-gray-200 dark:border-dark-muted">
                      <span className="text-gray-500 dark:text-gray-400">Valor total histórico</span>
                      <span className="font-bold text-gray-800 dark:text-white">{formatCOP(resumen.valorTotal)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {resumen.asociadosConPendientes} de {resumen.totalAsociados} asociados tienen multas pendientes por cobrar
                    {resumen.anuladas > 0 ? ` · ${resumen.anuladas} multa(s) anulada(s)` : ''}.
                  </p>

                  <button
                    onClick={calcularResumenGlobal}
                    className="w-full py-2 rounded-lg bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-colors"
                  >
                    Recalcular
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <NotificarModal
        open={notificarOpen}
        onClose={() => setNotificarOpen(false)}
        tipo="MULTA"
        documento={multaNotificar}
        documentoId={multaNotificar?.id}
        asociadoId={asociado?.id}
        asociadoNombre={asociado ? `${asociado.nombres} ${asociado.apellidos}` : undefined}
      />
    </div>
  );
}
