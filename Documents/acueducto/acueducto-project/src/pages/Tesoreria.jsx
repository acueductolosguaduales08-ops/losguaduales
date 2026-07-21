import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet,
  Loader2,
  RefreshCw,
  Wallet2,
  TrendingUp,
  TrendingDown,
  Scale,
  Hash,
  ShieldAlert,
  ListChecks,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BadgeDollarSign,
  Split,
  QrCode,
  History,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TesoreriaAPI } from '../api/tesoreria';
import { EstadisticasAPI } from '../api/estadisticas';
import { FacturasAPI } from '../api/facturas';
import RegistrarPagoModal from '../components/tesoreria/RegistrarPagoModal';
import RegistrarMovimientoModal from '../components/tesoreria/RegistrarMovimientoModal';
import RegistrarMultaModal from '../components/tesoreria/RegistrarMultaModal';
import MultasAsociadoModal from '../components/tesoreria/MultasAsociadoModal';
import AnularMovimientoModal from '../components/tesoreria/AnularMovimientoModal';
import MovimientoReciboModal from '../components/tesoreria/MovimientoReciboModal';
import MovimientoRow from '../components/tesoreria/MovimientoRow';
import HistorialNotificacionesModal from '../components/notificarDocumento/HistorialNotificacionesModal';

function formatCOP(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

const TABS = [
  { value: 'todos', label: 'Todos los movimientos' },
  { value: 'ENTRADA', label: 'Entradas' },
  { value: 'SALIDA', label: 'Salidas' },
];

function KpiCard({ icon: Icon, label, value, tone, sub }) {
  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="p-2 rounded-xl bg-gray-100 dark:bg-dark-muted shrink-0">
          <Icon className={`w-4 h-4 ${tone}`} />
        </div>
      </div>
      <h3 className={`text-xl font-black truncate ${tone}`}>{value}</h3>
      {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ progress, colorClass, label, value }) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-bold text-gray-800 dark:text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-dark-muted h-2.5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Tesoreria() {
  const { rol } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const esAdmin = rol === 'ADMINISTRADOR';
  const puedeGestionar = esAdmin || rol === 'TESORERO';

  const [caja, setCaja] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [facturasParciales, setFacturasParciales] = useState(null);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [tab, setTab] = useState('todos');
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMov, setCargandoMov] = useState(false);
  const [totalMov, setTotalMov] = useState(null);

  const [pagoOpen, setPagoOpen] = useState(false);
  const [facturaIdInicial, setFacturaIdInicial] = useState(null);
  const [movModalOpen, setMovModalOpen] = useState(false);
  const [movModalTipo, setMovModalTipo] = useState('ingreso');
  const [multaOpen, setMultaOpen] = useState(false);
  const [multasConsultaOpen, setMultasConsultaOpen] = useState(false);
  const [historialNotifOpen, setHistorialNotifOpen] = useState(false);
  const [anularOpen, setAnularOpen] = useState(false);
  const [movimientoAnular, setMovimientoAnular] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [movimientoDetalle, setMovimientoDetalle] = useState(null);

  const cargarResumen = useCallback(
    ({ silent = false } = {}) => {
      if (silent) setRefrescando(true);
      else setCargandoResumen(true);
      return Promise.all([
        TesoreriaAPI.cajaDiaria(),
        EstadisticasAPI.dashboard(),
        FacturasAPI.listarPorEstado('PAGADA_PARCIAL', { size: 1 }),
      ])
        .then(([cajaData, dashData, parcialesData]) => {
          setCaja(cajaData);
          setDashboard(dashData);
          setFacturasParciales(
            Array.isArray(parcialesData) ? parcialesData.length : parcialesData?.totalElements ?? 0
          );
        })
        .catch((err) => toast(err.message || 'No se pudo cargar el resumen de tesorería.', 'error'))
        .finally(() => {
          setCargandoResumen(false);
          setRefrescando(false);
        });
    },
    [toast]
  );

  const cargarMovimientos = useCallback(() => {
    setCargandoMov(true);
    const peticion =
      tab === 'todos'
        ? TesoreriaAPI.listarTodosMovimientos({ sort: 'fecha,desc' })
        : TesoreriaAPI.listarMovimientos(tab, { sort: 'fecha,desc' });

    peticion
      .then((data) => {
        if (Array.isArray(data)) {
          setMovimientos(data);
          setTotalMov(data.length);
        } else {
          setMovimientos(data?.content || []);
          setTotalMov(typeof data?.totalElements === 'number' ? data.totalElements : data?.content?.length ?? null);
        }
      })
      .catch((err) => toast(err.message || 'No se pudieron cargar los movimientos.', 'error'))
      .finally(() => setCargandoMov(false));
  }, [tab, toast]);

  useEffect(() => {
    if (!puedeGestionar) return;
    cargarResumen();
  }, [puedeGestionar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!puedeGestionar) return;
    cargarMovimientos();
  }, [puedeGestionar, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si llegamos desde /tesoreria?facturaId=… (botón "Registrar pago" en Facturación o en Home),
  // abrimos directamente el modal de pago con esa factura precargada.
  useEffect(() => {
    const facturaId = searchParams.get('facturaId');
    if (facturaId) {
      setFacturaIdInicial(Number(facturaId));
      setPagoOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refrescarTodo = () => {
    cargarResumen({ silent: true });
    cargarMovimientos();
  };

  const d = dashboard || {};
  const totalFacturas = (d.facturasPagadas || 0) + (d.facturasPendientes || 0) + (d.facturasVencidas || 0);
  const tasaRecaudo = totalFacturas > 0 ? (d.facturasPagadas / totalFacturas) * 100 : 0;
  const recaudoColor = tasaRecaudo >= 80 ? 'bg-emerald-500' : tasaRecaudo >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const recaudoText =
    tasaRecaudo >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : tasaRecaudo >= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-500 dark:text-red-400';

  const c = caja || { totalIngresos: 0, totalGastos: 0, balance: 0, numeroMovimientos: 0 };

  if (!puedeGestionar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden gestionar la tesorería del acueducto.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        {/* Encabezado */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tesorería</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Módulo 8 · Caja diaria, pagos, multas y movimientos ·{' '}
                {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={refrescarTodo}
            disabled={cargandoResumen || refrescando}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-700 dark:text-white transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refrescando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </section>

        {/* Acciones rápidas */}
        <section className="flex flex-wrap gap-2.5 mb-6">
          <button
            onClick={() => {
              setFacturaIdInicial(null);
              setPagoOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-colors"
          >
            <Wallet2 className="w-4 h-4" /> Registrar pago
          </button>
          <button
            onClick={() => {
              setMovModalTipo('ingreso');
              setMovModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-lg shadow-brand/20 transition-colors"
          >
            <TrendingUp className="w-4 h-4" /> Registrar ingreso
          </button>
          <button
            onClick={() => {
              setMovModalTipo('gasto');
              setMovModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-lg shadow-red-600/20 transition-colors"
          >
            <TrendingDown className="w-4 h-4" /> Registrar gasto
          </button>
          <button
            onClick={() => setMultaOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 transition-colors"
          >
            <ShieldAlert className="w-4 h-4" /> Registrar multa
          </button>
          <button
            onClick={() => setMultasConsultaOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-700 dark:text-white text-sm font-semibold transition-colors"
          >
            <ListChecks className="w-4 h-4" /> Consultar multas
          </button>
          <button
            onClick={() => setHistorialNotifOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-700 dark:text-white text-sm font-semibold transition-colors"
          >
            <History className="w-4 h-4" /> Historial de notificaciones
          </button>
          <button
            onClick={() => navigate('/escanear-qr?origin=tesoreria')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold shadow-lg shadow-gray-800/20 transition-colors"
          >
            <QrCode className="w-4 h-4" /> Escanear QR para pagar
          </button>
        </section>

        {cargandoResumen ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando panel de tesorería…</span>
          </div>
        ) : (
          <>
            {/* Caja diaria */}
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
              <Wallet2 className="w-3.5 h-3.5" /> Caja diaria de hoy
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard icon={TrendingUp} label="Ingresos" value={formatCOP(c.totalIngresos)} tone="text-emerald-600 dark:text-emerald-400" />
              <KpiCard icon={TrendingDown} label="Gastos" value={formatCOP(c.totalGastos)} tone="text-red-500 dark:text-red-400" />
              <KpiCard
                icon={Scale}
                label="Balance"
                value={formatCOP(c.balance)}
                tone={c.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}
              />
              <KpiCard icon={Hash} label="Movimientos" value={c.numeroMovimientos ?? 0} tone="text-brand" sub="Contabilizados hoy" />
            </div>

            {/* Metas de cobro */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="lg:col-span-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-5">
                  <Target className="w-4 h-4 text-brand" /> Metas de cobro
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{d.facturasPagadas ?? 0}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Pagadas</span>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center">
                    <Split className="w-4 h-4 text-sky-500 mb-1" />
                    <span className="text-3xl font-black text-sky-500 dark:text-sky-400 mb-1">{facturasParciales ?? 0}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 text-center">Pago parcial</span>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-500 mb-1" />
                    <span className="text-3xl font-black text-amber-500 dark:text-amber-400 mb-1">{d.facturasPendientes ?? 0}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Pendientes</span>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-500 mb-1" />
                    <span className="text-3xl font-black text-red-500 dark:text-red-400 mb-1">{d.facturasVencidas ?? 0}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Vencidas</span>
                  </div>
                </div>

                <ProgressBar
                  progress={tasaRecaudo}
                  colorClass={recaudoColor}
                  label={`${d.facturasPagadas ?? 0} de ${totalFacturas} facturas cobradas al 100%`}
                  value={<span className={recaudoText}>{tasaRecaudo.toFixed(0)}%</span>}
                />
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                  Sin ningún pago:{' '}
                  <strong className="text-gray-600 dark:text-gray-300">{(d.facturasPendientes ?? 0) + (d.facturasVencidas ?? 0)}</strong>{' '}
                  factura(s) ({d.facturasPendientes ?? 0} pendientes + {d.facturasVencidas ?? 0} vencidas). Además hay{' '}
                  <strong className="text-gray-600 dark:text-gray-300">{facturasParciales ?? 0}</strong> factura(s) con pago
                  parcial a las que aún les falta saldo por cobrar.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5 flex flex-col">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
                  <BadgeDollarSign className="w-4 h-4 text-brand" /> Cartera pendiente
                </h3>
                <p className="text-2xl font-black text-red-500 dark:text-red-400 mb-1">{formatCOP(d.totalCarteraPendiente)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Deuda acumulada por facturas pendientes o vencidas de todo el sistema.
                </p>
                <div className="mt-auto pt-3 border-t border-gray-200 dark:border-dark-muted space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Ingresos del mes</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCOP(d.ingresosMesActual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Gastos del mes</span>
                    <span className="font-semibold text-red-500 dark:text-red-400">{formatCOP(d.gastosMesActual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Balance del mes</span>
                    <span
                      className={`font-bold ${
                        d.balanceMesActual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {formatCOP(d.balanceMesActual)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Historial de movimientos */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Movimientos</h2>
            {totalMov !== null && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {totalMov} movimiento{totalMov === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className="flex gap-1.5 mb-4 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  tab === t.value
                    ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-dark-muted bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {cargandoMov && (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando movimientos…</span>
            </div>
          )}

          {!cargandoMov && movimientos.length === 0 && (
            <div className="text-center py-16">
              <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No hay movimientos para mostrar con este filtro.</p>
            </div>
          )}

          {!cargandoMov && movimientos.length > 0 && (
            <div className="space-y-2">
              {movimientos.map((m) => (
                <MovimientoRow
                  key={m.id}
                  movimiento={m}
                  onVerDetalle={(mov) => {
                    setMovimientoDetalle(mov);
                    setDetalleOpen(true);
                  }}
                  onAnular={
                    esAdmin
                      ? (mov) => {
                          setMovimientoAnular(mov);
                          setAnularOpen(true);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <RegistrarPagoModal
        open={pagoOpen}
        facturaIdInicial={facturaIdInicial}
        onClose={() => {
          setPagoOpen(false);
          setFacturaIdInicial(null);
        }}
        onSaved={refrescarTodo}
      />
      <RegistrarMovimientoModal open={movModalOpen} tipo={movModalTipo} onClose={() => setMovModalOpen(false)} onSaved={refrescarTodo} />
      <RegistrarMultaModal open={multaOpen} onClose={() => setMultaOpen(false)} onSaved={refrescarTodo} />
      <MultasAsociadoModal open={multasConsultaOpen} onClose={() => setMultasConsultaOpen(false)} />
      <HistorialNotificacionesModal open={historialNotifOpen} onClose={() => setHistorialNotifOpen(false)} tipoDocumento="MULTA" />
      <AnularMovimientoModal
        open={anularOpen}
        movimiento={movimientoAnular}
        onClose={() => setAnularOpen(false)}
        onSaved={refrescarTodo}
      />
      <MovimientoReciboModal
        open={detalleOpen}
        movimiento={movimientoDetalle}
        onClose={() => setDetalleOpen(false)}
      />
    </div>
  );
}
