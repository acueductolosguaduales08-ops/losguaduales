import { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Search, Loader2, History } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AsociadosAPI } from '../api/asociados';
import AsociadoCard from '../components/asociados/AsociadoCard';
import AsociadoFormModal from '../components/asociados/AsociadoFormModal';
import AsociadoEstadoModal from '../components/asociados/AsociadoEstadoModal';
import AsociadoDetalleModal from '../components/asociados/AsociadoDetalleModal';
import AsociadoFinanzasModal from '../components/asociados/AsociadoFinanzasModal';
import AsociadoArchivarModal from '../components/asociados/AsociadoArchivarModal';
import HistorialNotificacionesModal from '../components/notificarDocumento/HistorialNotificacionesModal';

const FILTROS_ESTADO = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'SUSPENDIDO', label: 'Suspendidos' },
  { value: 'INACTIVO', label: 'Inactivos' },
];

export default function Asociados() {
  const { rol } = useAuth();
  const { toast } = useToast();
  const puedeGestionar = rol === 'ADMINISTRADOR' || rol === 'TESORERO';

  const [asociados, setAsociados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [asociadoEditando, setAsociadoEditando] = useState(null);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [asociadoEstado, setAsociadoEstado] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [asociadoDetalle, setAsociadoDetalle] = useState(null);
  const [finanzasOpen, setFinanzasOpen] = useState(false);
  const [asociadoFinanzas, setAsociadoFinanzas] = useState(null);
  const [archivarOpen, setArchivarOpen] = useState(false);
  const [asociadoArchivar, setAsociadoArchivar] = useState(null);
  const [historialNotifOpen, setHistorialNotifOpen] = useState(false);

  const cargar = () => {
    setLoading(true);
    const peticion = filtroEstado
      ? AsociadosAPI.filtrarPorEstado(filtroEstado)
      : AsociadosAPI.buscar(busqueda.trim() || undefined);

    peticion
      .then((data) => setAsociados(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => toast(err.message || 'No se pudieron cargar los asociados.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (puedeGestionar) cargar();
  }, [puedeGestionar, filtroEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda con pequeño debounce, solo cuando no hay filtro de estado activo.
  useEffect(() => {
    if (!puedeGestionar || filtroEstado) return;
    const t = setTimeout(cargar, 350);
    return () => clearTimeout(t);
  }, [busqueda]); // eslint-disable-line react-hooks/exhaustive-deps

  const asociadosOrdenados = useMemo(
    () => [...asociados].sort((a, b) => (a.archivado === b.archivado ? 0 : a.archivado ? 1 : -1)),
    [asociados]
  );

  if (!puedeGestionar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden gestionar el directorio de asociados. Inicia sesión con una
            cuenta autorizada.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Directorio de asociados</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Módulo 2 · Gestiona el registro, estado de servicio e historial financiero
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-grow sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por documento, nombre o teléfono…"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer shrink-0"
            >
              {FILTROS_ESTADO.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setHistorialNotifOpen(true)}
              className="bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-700 dark:text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold shrink-0"
            >
              <History className="w-4 h-4" />
              Historial de notificaciones
            </button>
            <button
              onClick={() => {
                setAsociadoEditando(null);
                setFormOpen(true);
              }}
              className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-sm font-semibold shrink-0"
            >
              <Plus className="w-5 h-5" />
              Nuevo asociado
            </button>
          </div>
        </section>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando asociados…</span>
          </div>
        )}

        {!loading && asociadosOrdenados.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {busqueda || filtroEstado ? 'Ningún asociado coincide con la búsqueda.' : 'Aún no hay asociados registrados.'}
            </p>
          </div>
        )}

        {!loading && asociadosOrdenados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {asociadosOrdenados.map((a) => (
              <AsociadoCard
                key={a.id}
                asociado={a}
                onVerDetalle={(as) => {
                  setAsociadoDetalle(as);
                  setDetalleOpen(true);
                }}
                onFinanzas={(as) => {
                  setAsociadoFinanzas(as);
                  setFinanzasOpen(true);
                }}
                onCambiarEstado={(as) => {
                  setAsociadoEstado(as);
                  setEstadoOpen(true);
                }}
                onEditar={(as) => {
                  setAsociadoEditando(as);
                  setFormOpen(true);
                }}
                onArchivar={(as) => {
                  setAsociadoArchivar(as);
                  setArchivarOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <AsociadoFormModal
        open={formOpen}
        asociado={asociadoEditando}
        onClose={() => setFormOpen(false)}
        onSaved={cargar}
      />
      <AsociadoEstadoModal
        open={estadoOpen}
        asociado={asociadoEstado}
        onClose={() => setEstadoOpen(false)}
        onSaved={cargar}
      />
      <AsociadoDetalleModal open={detalleOpen} asociado={asociadoDetalle} onClose={() => setDetalleOpen(false)} />
      <AsociadoFinanzasModal
        open={finanzasOpen}
        asociado={asociadoFinanzas}
        onClose={() => setFinanzasOpen(false)}
      />
      <AsociadoArchivarModal
        open={archivarOpen}
        asociado={asociadoArchivar}
        onClose={() => setArchivarOpen(false)}
        onSaved={cargar}
      />
      <HistorialNotificacionesModal open={historialNotifOpen} onClose={() => setHistorialNotifOpen(false)} />
    </div>
  );
}
