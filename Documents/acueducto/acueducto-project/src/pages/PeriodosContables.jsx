import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  FileText,
  DollarSign,
  Droplet,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PeriodosAPI } from '../api/periodos';
import { InformesAPI } from '../api/informes';
import AnioFormModal from '../components/periodos/AnioFormModal';
import MesFormModal from '../components/periodos/MesFormModal';
import MesDetalleModal from '../components/periodos/MesDetalleModal';
import ReabrirMesModal from '../components/periodos/ReabrirMesModal';

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ESTADO_BADGE = {
  ABIERTO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REABIERTO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CERRADO: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400',
};

export default function PeriodosContables() {
  const { rol } = useAuth();
  const { toast } = useToast();
  const puedeVer = rol === 'ADMINISTRADOR' || rol === 'TESORERO';
  const esAdmin = rol === 'ADMINISTRADOR';

  // --- Años ---
  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [selectedYearId, setSelectedYearId] = useState(null);

  // --- Meses del año seleccionado ---
  const [months, setMonths] = useState([]);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [selectedMonthId, setSelectedMonthId] = useState(null);

  // --- Resumen del mes activo ---
  const [resumenMes, setResumenMes] = useState(null);
  const [loadingResumenMes, setLoadingResumenMes] = useState(false);

  // --- Resumen agregado del año (informe anual) ---
  const [resumenAnio, setResumenAnio] = useState(null);
  const [loadingResumenAnio, setLoadingResumenAnio] = useState(false);

  // --- Filtros ---
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS'); // TODOS | ABIERTO | CERRADO

  // --- Modales ---
  const [showAnioModal, setShowAnioModal] = useState(false);
  const [showMesModal, setShowMesModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showReabrirModal, setShowReabrirModal] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  // --- Cargar años ---
  const cargarAnios = () => {
    setLoadingYears(true);
    PeriodosAPI.listarAnios()
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setYears(lista);
        setSelectedYearId((prev) => (prev && lista.some((y) => y.id === prev) ? prev : lista[0]?.id ?? null));
      })
      .catch((err) => toast(err.message || 'No se pudieron cargar los años contables.', 'error'))
      .finally(() => setLoadingYears(false));
  };

  useEffect(() => {
    if (puedeVer) cargarAnios();
  }, [puedeVer]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Cargar meses del año seleccionado ---
  const cargarMeses = (anioId, { preserveSelection = true } = {}) => {
    if (!anioId) {
      setMonths([]);
      setSelectedMonthId(null);
      return;
    }
    setLoadingMonths(true);
    PeriodosAPI.listarMeses(anioId)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setMonths(lista);
        setSelectedMonthId((prev) => {
          if (preserveSelection && prev && lista.some((m) => m.id === prev)) return prev;
          return lista[0]?.id ?? null;
        });
      })
      .catch((err) => toast(err.message || 'No se pudieron cargar los meses del ejercicio.', 'error'))
      .finally(() => setLoadingMonths(false));
  };

  useEffect(() => {
    cargarMeses(selectedYearId);
  }, [selectedYearId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Cargar resumen del informe anual (dashboard superior) ---
  useEffect(() => {
    if (!selectedYearId) {
      setResumenAnio(null);
      return;
    }
    setLoadingResumenAnio(true);
    InformesAPI.periodoAnio(selectedYearId)
      .then(setResumenAnio)
      .catch(() => setResumenAnio(null)) // widget secundario: si falla, simplemente se oculta
      .finally(() => setLoadingResumenAnio(false));
  }, [selectedYearId]);

  // --- Cargar resumen del mes activo ---
  useEffect(() => {
    if (!selectedMonthId) {
      setResumenMes(null);
      return;
    }
    setLoadingResumenMes(true);
    PeriodosAPI.resumenMes(selectedMonthId)
      .then(setResumenMes)
      .catch((err) => {
        toast(err.message || 'No se pudo cargar el resumen del período.', 'error');
        setResumenMes(null);
      })
      .finally(() => setLoadingResumenMes(false));
  }, [selectedMonthId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Handlers ---
  const handleAnioCreated = (nuevo) => {
    setYears((prev) => [...prev, nuevo].sort((a, b) => a.anio - b.anio));
    setSelectedYearId(nuevo.id);
  };

  const handleMesCreated = (nuevo) => {
    setMonths((prev) => [...prev, nuevo].sort((a, b) => a.numeroMes - b.numeroMes));
    setSelectedMonthId(nuevo.id);
    if (selectedYearId) InformesAPI.periodoAnio(selectedYearId).then(setResumenAnio).catch(() => {});
  };

  const handleCerrarMes = async (mes) => {
    setCerrando(true);
    try {
      const actualizado = await PeriodosAPI.cerrarMes(mes.id);
      toast(`Período ${mes.nombreMes} ${mes.anio} cerrado correctamente.`, 'success');
      setMonths((prev) => prev.map((m) => (m.id === actualizado.id ? actualizado : m)));
      setShowDetalleModal(false);
      PeriodosAPI.resumenMes(actualizado.id).then(setResumenMes).catch(() => {});
      if (selectedYearId) InformesAPI.periodoAnio(selectedYearId).then(setResumenAnio).catch(() => {});
    } catch (err) {
      toast(err.message || 'No se pudo cerrar el período.', 'error');
    } finally {
      setCerrando(false);
    }
  };

  const handleReopened = (actualizado) => {
    setMonths((prev) => prev.map((m) => (m.id === actualizado.id ? actualizado : m)));
    PeriodosAPI.resumenMes(actualizado.id).then(setResumenMes).catch(() => {});
    if (selectedYearId) InformesAPI.periodoAnio(selectedYearId).then(setResumenAnio).catch(() => {});
  };

  // --- Derivados ---
  const filteredMonths = useMemo(() => {
    return months.filter((m) => {
      const matchSearch = m.nombreMes.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'TODOS' ? true : statusFilter === 'ABIERTO' ? m.estado !== 'CERRADO' : m.estado === 'CERRADO';
      return matchSearch && matchStatus;
    });
  }, [months, search, statusFilter]);

  const activeMes = months.find((m) => m.id === selectedMonthId) || null;
  const selectedYearObj = years.find((y) => y.id === selectedYearId) || null;
  const mesesRegistrados = months.map((m) => m.numeroMes);

  const cobro =
    resumenMes && resumenMes.facturasGeneradas
      ? Math.round((resumenMes.facturasPagadas / resumenMes.facturasGeneradas) * 100)
      : 0;

  if (!puedeVer) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo Administradores y Tesoreros pueden gestionar los períodos contables. Inicia sesión con una cuenta
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
            <Calendar className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Períodos contables</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Módulo 5 · Gestiona ejercicios y meses contables, y controla su cierre y reapertura
              </p>
            </div>
          </div>
          {esAdmin && (
            <button
              onClick={() => setShowAnioModal(true)}
              className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-sm font-semibold shrink-0"
            >
              <Plus className="w-5 h-5" />
              Nuevo año contable
            </button>
          )}
        </section>

        {loadingYears && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando años contables…</span>
          </div>
        )}

        {!loadingYears && years.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">Aún no hay ejercicios contables registrados.</p>
            {esAdmin && (
              <button
                onClick={() => setShowAnioModal(true)}
                className="text-brand hover:underline text-sm font-semibold"
              >
                Crear el primer año contable
              </button>
            )}
          </div>
        )}

        {!loadingYears && years.length > 0 && (
          <>
            {/* Dashboard resumen del ejercicio */}
            <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-brand" />
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">
                    Resumen del ejercicio {selectedYearObj?.anio ?? '—'}
                  </h2>
                </div>
                <div className="flex gap-1.5 flex-wrap">
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
              </div>

              {loadingResumenAnio ? (
                <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Cargando resumen…</span>
                </div>
              ) : resumenAnio ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Ingresos del año
                    </p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ${fmtMoney(resumenAnio.totalIngresos)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      Gastos: <span className="text-red-500 dark:text-red-400 font-bold">${fmtMoney(resumenAnio.totalGastos)}</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Balance
                    </p>
                    <p
                      className={`text-xl font-black ${
                        Number(resumenAnio.balance) >= 0 ? 'text-brand' : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      ${fmtMoney(resumenAnio.balance)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Ingresos menos gastos</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Consumo total
                    </p>
                    <p className="text-xl font-black text-sky-600 dark:text-sky-400">
                      {Number(resumenAnio.totalM3Consumidos || 0).toLocaleString()} m³
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Agua facturada acumulada</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-xl p-4">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Meses registrados
                    </p>
                    <p className="text-xl font-black text-gray-800 dark:text-white">{months.length}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {months.filter((m) => m.estado !== 'CERRADO').length} abiertos
                      </span>{' '}
                      ·{' '}
                      <span className="font-bold">{months.filter((m) => m.estado === 'CERRADO').length} cerrados</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                  No hay datos agregados disponibles para este ejercicio todavía.
                </p>
              )}
            </section>

            {/* Cuerpo: lista de meses + detalle del mes activo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Columna izquierda: lista de meses */}
              <section className="lg:col-span-5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-4 flex flex-col gap-3 max-h-[600px]">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar mes…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg pl-9 pr-3 py-2 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <div className="flex gap-1 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg p-1">
                    <span className="flex items-center gap-1 text-[9px] text-gray-500 dark:text-gray-400 px-2 shrink-0">
                      <Filter className="w-3 h-3" /> Estado:
                    </span>
                    {['TODOS', 'ABIERTO', 'CERRADO'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all ${
                          statusFilter === s
                            ? 'bg-brand text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        {s === 'TODOS' ? 'Todos' : s === 'ABIERTO' ? 'Abiertos' : 'Cerrados'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Meses ({filteredMonths.length})
                  </span>
                  {esAdmin && (
                    <button
                      onClick={() => setShowMesModal(true)}
                      className="flex items-center gap-1 text-[10px] font-bold bg-brand hover:bg-brand-dark text-white px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Aperturar mes
                    </button>
                  )}
                </div>

                <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 custom-scroll">
                  {loadingMonths && (
                    <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Cargando meses…</span>
                    </div>
                  )}

                  {!loadingMonths && filteredMonths.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 dark:border-dark-muted rounded-xl text-gray-400 dark:text-gray-500 text-xs text-center gap-2">
                      <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      <p>
                        {months.length === 0
                          ? 'Aún no hay meses registrados en este ejercicio.'
                          : 'Sin resultados para los filtros activos.'}
                      </p>
                      {months.length > 0 && (
                        <button
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('TODOS');
                          }}
                          className="text-brand hover:underline font-semibold"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  )}

                  {!loadingMonths &&
                    filteredMonths.map((m) => {
                      const isSelected = selectedMonthId === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMonthId(m.id);
                            setShowDetalleModal(true);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'border-brand bg-brand/10'
                              : 'border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                                isSelected
                                  ? 'bg-brand text-white'
                                  : 'bg-white dark:bg-dark-muted text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {String(m.numeroMes).padStart(2, '0')}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-gray-800 dark:text-white">{m.nombreMes}</p>
                              <p className="text-[9px] text-gray-500 dark:text-gray-400">
                                Desde {m.fechaApertura || '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[8px] px-2 py-0.5 rounded-md font-extrabold uppercase ${
                                ESTADO_BADGE[m.estado] || ESTADO_BADGE.CERRADO
                              }`}
                            >
                              {m.estado}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                          </div>
                        </button>
                      );
                    })}
                </div>
              </section>

              {/* Columna derecha: dashboard del mes activo */}
              <section className="lg:col-span-7 flex flex-col gap-3">
                {!activeMes ? (
                  <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 h-full min-h-[300px]">
                    <Calendar className="w-12 h-12 text-gray-200 dark:text-dark-muted" />
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">Ningún período seleccionado</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                      Selecciona un mes de la lista para ver sus métricas y gestionar el estado del período.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Cabecera del mes */}
                    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-brand font-bold">
                            Período seleccionado
                          </span>
                          <h2 className="text-xl font-black text-gray-800 dark:text-white mt-0.5 flex items-center gap-2 flex-wrap">
                            {activeMes.nombreMes} {activeMes.anio}
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                ESTADO_BADGE[activeMes.estado] || ESTADO_BADGE.CERRADO
                              }`}
                            >
                              {activeMes.estado}
                            </span>
                          </h2>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                            Apertura: {activeMes.fechaApertura || '—'}
                            {activeMes.fechaCierre && ` · Cierre: ${activeMes.fechaCierre}`}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowDetalleModal(true)}
                          className="text-xs font-semibold text-brand hover:underline shrink-0"
                        >
                          Ver detalle y acciones
                        </button>
                      </div>
                    </div>

                    {/* KPIs */}
                    {loadingResumenMes ? (
                      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-10 flex items-center justify-center gap-2 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Cargando métricas del período…</span>
                      </div>
                    ) : resumenMes ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Facturación
                              </span>
                              <FileText className="w-4 h-4 text-brand" />
                            </div>
                            <p className="text-2xl font-black text-gray-800 dark:text-white">
                              {resumenMes.facturasGeneradas}
                            </p>
                            <div className="border-t border-gray-200 dark:border-dark-muted pt-2.5 space-y-1.5 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Pagadas</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {resumenMes.facturasPagadas}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Pendientes</span>
                                <span
                                  className={`font-bold ${
                                    resumenMes.facturasPendientes > 0
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-gray-800 dark:text-white'
                                  }`}
                                >
                                  {resumenMes.facturasPendientes}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Vencidas</span>
                                <span
                                  className={`font-bold ${
                                    resumenMes.facturasVencidas > 0
                                      ? 'text-red-500 dark:text-red-400'
                                      : 'text-gray-800 dark:text-white'
                                  }`}
                                >
                                  {resumenMes.facturasVencidas}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Caja y balance
                              </span>
                              <DollarSign className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                              ${fmtMoney(resumenMes.totalIngresos)}
                            </p>
                            <div className="border-t border-gray-200 dark:border-dark-muted pt-2.5 space-y-1.5 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Gastos</span>
                                <span className="font-bold text-red-500 dark:text-red-400">
                                  ${fmtMoney(resumenMes.totalGastos)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Balance</span>
                                <span className="font-bold text-brand">${fmtMoney(resumenMes.balance)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Consumo
                              </span>
                              <Droplet className="w-4 h-4 text-sky-500" />
                            </div>
                            <p className="text-2xl font-black text-sky-600 dark:text-sky-400">
                              {Number(resumenMes.totalM3Consumidos || 0).toLocaleString()} m³
                            </p>
                            <div className="border-t border-gray-200 dark:border-dark-muted pt-2.5 space-y-1.5 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Promedio</span>
                                <span className="font-bold text-gray-800 dark:text-white">
                                  {resumenMes.promedioConsumo} m³
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Activos</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {resumenMes.asociadosActivos}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Suspendidos</span>
                                <span
                                  className={`font-bold ${
                                    resumenMes.asociadosSuspendidos > 0
                                      ? 'text-red-500 dark:text-red-400'
                                      : 'text-gray-800 dark:text-white'
                                  }`}
                                >
                                  {resumenMes.asociadosSuspendidos}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Barra de eficiencia de cobro */}
                        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-brand/10 rounded-xl">
                              <TrendingUp className="w-4 h-4 text-brand" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800 dark:text-white">Eficiencia de cobro</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                Facturas pagadas sobre total generadas
                              </p>
                            </div>
                          </div>
                          <div className="w-full sm:w-56 shrink-0 sm:ml-auto">
                            <div className="flex justify-between text-[10px] font-bold mb-1.5">
                              <span className="text-gray-500 dark:text-gray-400">Progreso</span>
                              <span
                                className={
                                  cobro >= 80
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : cobro >= 50
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-red-500 dark:text-red-400'
                                }
                              >
                                {cobro}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-dark-muted h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  cobro >= 80 ? 'bg-emerald-500' : cobro >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${cobro}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-10 text-center text-sm text-gray-400 dark:text-gray-500">
                        No se pudo cargar el resumen de este período.
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      {/* Modales */}
      <AnioFormModal open={showAnioModal} onClose={() => setShowAnioModal(false)} onCreated={handleAnioCreated} />
      <MesFormModal
        open={showMesModal}
        anio={selectedYearObj}
        mesesRegistrados={mesesRegistrados}
        onClose={() => setShowMesModal(false)}
        onCreated={handleMesCreated}
      />
      <MesDetalleModal
        open={showDetalleModal}
        mes={activeMes}
        esAdmin={esAdmin}
        cerrando={cerrando}
        onClose={() => setShowDetalleModal(false)}
        onCerrar={handleCerrarMes}
        onSolicitarReabrir={() => {
          setShowDetalleModal(false);
          setShowReabrirModal(true);
        }}
      />
      <ReabrirMesModal
        open={showReabrirModal}
        mes={activeMes}
        onClose={() => setShowReabrirModal(false)}
        onReopened={handleReopened}
      />
    </div>
  );
}
