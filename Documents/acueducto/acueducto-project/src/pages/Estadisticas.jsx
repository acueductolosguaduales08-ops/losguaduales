import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Activity,
  ClipboardList,
  RefreshCw,
  DollarSign,
  Loader2,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EstadisticasAPI } from '../api/estadisticas';

const fmtMoney = (n) =>
  '$' + Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const DEFAULT_DATA = {
  asociadosActivos: 0,
  asociadosSuspendidos: 0,
  facturasPendientes: 0,
  facturasVencidas: 0,
  facturasPagadas: 0,
  totalCarteraPendiente: 0,
  ingresosMesActual: 0,
  gastosMesActual: 0,
  balanceMesActual: 0,
  encuestasActivas: 0,
};

function ProgressBar({ progress, colorClass = 'bg-brand', label, value }) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-bold text-gray-800 dark:text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-dark-muted h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatMini({ icon: Icon, label, value, tone = 'text-brand' }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted shrink-0">
        <Icon className={`w-5 h-5 ${tone}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-800 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

export default function Estadisticas() {
  const { rol } = useAuth();
  const { toast } = useToast();
  const puedeVer = rol === 'ADMINISTRADOR' || rol === 'TESORERO';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const cargar = useCallback(
    ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      return EstadisticasAPI.dashboard()
        .then((res) => {
          setData({ ...DEFAULT_DATA, ...res });
          setLastUpdated(new Date());
        })
        .catch((err) => toast(err.message || 'No se pudo cargar el panel de estadísticas.', 'error'))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [toast]
  );

  useEffect(() => {
    if (puedeVer) cargar();
  }, [puedeVer]); // eslint-disable-line react-hooks/exhaustive-deps

  const d = data || DEFAULT_DATA;

  const totalAsociados = d.asociadosActivos + d.asociadosSuspendidos;
  const porcentajeActivos = totalAsociados > 0 ? (d.asociadosActivos / totalAsociados) * 100 : 0;

  const totalFacturas = d.facturasPagadas + d.facturasPendientes + d.facturasVencidas;
  const tasaRecaudo = totalFacturas > 0 ? (d.facturasPagadas / totalFacturas) * 100 : 0;

  const margenOperativo = d.ingresosMesActual > 0 ? (d.balanceMesActual / d.ingresosMesActual) * 100 : 0;

  const recaudoColor = useMemo(
    () => (tasaRecaudo >= 80 ? 'bg-emerald-500' : tasaRecaudo >= 50 ? 'bg-amber-500' : 'bg-red-500'),
    [tasaRecaudo]
  );
  const recaudoText = useMemo(
    () =>
      tasaRecaudo >= 80
        ? 'text-emerald-600 dark:text-emerald-400'
        : tasaRecaudo >= 50
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-500 dark:text-red-400',
    [tasaRecaudo]
  );

  if (!puedeVer) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <LayoutDashboard className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden ver el panel de estadísticas. Inicia sesión con una cuenta
            autorizada.
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
            <LayoutDashboard className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Panel de control</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Módulo 14 · Resumen general del acueducto ·{' '}
                {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && !loading && (
              <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                Actualizado {lastUpdated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => cargar({ silent: true })}
              disabled={loading || refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-brand hover:bg-brand-dark text-white transition-all shadow-lg shadow-brand/20 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </section>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando estadísticas…</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Fila superior de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Asociados */}
              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Asociados
                    </p>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">{totalAsociados}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted">
                    <Users className="w-5 h-5 text-brand" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {d.asociadosActivos} activos
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-red-500 dark:text-red-400 font-semibold">
                    {d.asociadosSuspendidos} susp.
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-dark-muted h-1.5 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${porcentajeActivos}%` }} />
                  <div className="bg-red-400 h-full transition-all duration-700" style={{ width: `${100 - porcentajeActivos}%` }} />
                </div>
              </div>

              {/* Balance mensual */}
              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Balance del mes
                    </p>
                    <h3
                      className={`text-xl font-black truncate ${
                        d.balanceMesActual >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {fmtMoney(d.balanceMesActual)}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted shrink-0">
                    <Wallet className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px] mt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Ingresos</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{fmtMoney(d.ingresosMesActual)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Gastos</span>
                    <span className="font-semibold text-red-500 dark:text-red-400">
                      -{fmtMoney(d.gastosMesActual)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cartera pendiente */}
              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Cartera pendiente
                    </p>
                    <h3 className="text-xl font-black text-red-500 dark:text-red-400 truncate">
                      {fmtMoney(d.totalCarteraPendiente)}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
                  Deuda acumulada por facturas pendientes o vencidas.
                </p>
              </div>

              {/* Eficiencia de recaudo */}
              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Eficiencia de recaudo
                    </p>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">
                      {tasaRecaudo.toFixed(1)}
                      <span className="text-sm text-gray-400 dark:text-gray-500">%</span>
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted">
                    <TrendingUp className="w-5 h-5 text-brand" />
                  </div>
                </div>
                <ProgressBar
                  progress={tasaRecaudo}
                  colorClass={recaudoColor}
                  label={`${d.facturasPagadas} de ${totalFacturas} pagadas`}
                  value={<span className={recaudoText}>{tasaRecaudo.toFixed(0)}%</span>}
                />
              </div>
            </div>

            {/* Fila intermedia */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Estado de facturación */}
              <div className="lg:col-span-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-5">
                  <FileText className="w-4 h-4 text-brand" /> Estado de facturación
                </h3>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                      {d.facturasPagadas}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Pagadas</span>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-amber-500 dark:text-amber-400 mb-1">
                      {d.facturasPendientes}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Pendientes</span>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-red-500 dark:text-red-400 mb-1">
                      {d.facturasVencidas}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Vencidas</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Distribución del período
                  </p>
                  <ProgressBar
                    progress={totalFacturas > 0 ? (d.facturasPagadas / totalFacturas) * 100 : 0}
                    colorClass="bg-emerald-500"
                    label="Facturas pagadas"
                    value={`${totalFacturas > 0 ? ((d.facturasPagadas / totalFacturas) * 100).toFixed(1) : 0}%`}
                  />
                  <ProgressBar
                    progress={totalFacturas > 0 ? (d.facturasPendientes / totalFacturas) * 100 : 0}
                    colorClass="bg-amber-500"
                    label="Facturas pendientes (al día)"
                    value={`${totalFacturas > 0 ? ((d.facturasPendientes / totalFacturas) * 100).toFixed(1) : 0}%`}
                  />
                  <ProgressBar
                    progress={totalFacturas > 0 ? (d.facturasVencidas / totalFacturas) * 100 : 0}
                    colorClass="bg-red-500"
                    label="Facturas vencidas (mora)"
                    value={`${totalFacturas > 0 ? ((d.facturasVencidas / totalFacturas) * 100).toFixed(1) : 0}%`}
                  />
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-5">
                    <Activity className="w-4 h-4 text-brand" /> Desempeño financiero
                  </h3>

                  <div className="space-y-4">
                    <StatMini icon={DollarSign} label="Ingresos del mes" value={fmtMoney(d.ingresosMesActual)} tone="text-emerald-500" />
                    <StatMini icon={ClipboardList} label="Gastos del mes" value={fmtMoney(d.gastosMesActual)} tone="text-red-500" />
                  </div>

                  <div className="mt-5 p-3.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Margen operativo</span>
                      <span
                        className={`text-sm font-bold ${
                          margenOperativo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        {margenOperativo.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-dark-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          margenOperativo >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, Math.abs(margenOperativo)))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5 border-l-4 ${
                    d.encuestasActivas > 0 ? 'border-l-brand' : 'border-l-gray-200 dark:border-l-dark-muted'
                  }`}
                >
                  <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-1">Participación ciudadana</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Módulo de encuestas y formularios.</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-gray-800 dark:text-white">{d.encuestasActivas}</span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                        d.encuestasActivas > 0
                          ? 'bg-brand/10 text-brand'
                          : 'bg-gray-100 dark:bg-dark-muted text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {d.encuestasActivas === 1 ? 'Encuesta activa' : 'Encuestas activas'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
