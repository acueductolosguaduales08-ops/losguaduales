import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, FileStack, Loader2, Search, UserRound, History } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FacturasAPI, ESTADOS_FACTURA } from '../api/facturas';
import { AsociadosAPI } from '../api/asociados';
import { descargarBlobDesdeResponse } from '../utils/descargarArchivo';
import FacturaCard from '../components/facturas/FacturaCard';
import FacturaDetalleModal from '../components/facturas/FacturaDetalleModal';
import GenerarFacturacionModal from '../components/facturas/GenerarFacturacionModal';
import ConceptoAdicionalModal from '../components/facturas/ConceptoAdicionalModal';
import AnularFacturaModal from '../components/facturas/AnularFacturaModal';
import NotificarModal from '../components/notificarDocumento/NotificarModal';
import HistorialNotificacionesModal from '../components/notificarDocumento/HistorialNotificacionesModal';

const FILTROS_ESTADO = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'PAGADA_PARCIAL', label: 'Pago parcial' },
  { value: 'PAGADA', label: 'Pagadas' },
  { value: 'VENCIDA', label: 'Vencidas' },
  { value: 'ANULADA', label: 'Anuladas' },
];

const TABS = [
  { value: 'estado', label: 'Por estado' },
  { value: 'todas', label: 'Historial completo' },
  { value: 'asociado', label: 'Por asociado' },
];

export default function Facturacion() {
  const { rol } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const esAdmin = rol === 'ADMINISTRADOR';
  const puedeGestionar = esAdmin || rol === 'TESORERO';

  const [tab, setTab] = useState('estado');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busquedaFactura, setBusquedaFactura] = useState('');

  // Búsqueda de asociado para la pestaña "Por asociado"
  const [busquedaAsociado, setBusquedaAsociado] = useState('');
  const [asociadosEncontrados, setAsociadosEncontrados] = useState([]);
  const [buscandoAsociados, setBuscandoAsociados] = useState(false);
  const [asociadoSeleccionado, setAsociadoSeleccionado] = useState(null);

  const [generarOpen, setGenerarOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [facturaDetalle, setFacturaDetalle] = useState(null);
  const [facturaIdDesdeUrl, setFacturaIdDesdeUrl] = useState(null);
  const [conceptoOpen, setConceptoOpen] = useState(false);
  const [facturaConcepto, setFacturaConcepto] = useState(null);
  const [anularOpen, setAnularOpen] = useState(false);
  const [facturaAnular, setFacturaAnular] = useState(null);
  const [descargandoId, setDescargandoId] = useState(null);
  const [notificarOpen, setNotificarOpen] = useState(false);
  const [facturaNotificar, setFacturaNotificar] = useState(null);
  const [historialOpen, setHistorialOpen] = useState(false);

  useEffect(() => {
    const verId = searchParams.get('ver');
    if (verId) {
      setFacturaDetalle(null);
      setFacturaIdDesdeUrl(Number(verId));
      setDetalleOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cargar = () => {
    if (!puedeGestionar) return;
    setLoading(true);

    let peticion;
    if (tab === 'estado') {
      peticion = estadoFiltro
        ? FacturasAPI.listarPorEstado(estadoFiltro)
        : Promise.all(ESTADOS_FACTURA.map((e) => FacturasAPI.listarPorEstado(e).catch(() => ({ content: [] })))).then(
            (paginas) => ({ content: paginas.flatMap((p) => (Array.isArray(p) ? p : p?.content || [])) })
          );
    } else if (tab === 'todas') {
      peticion = FacturasAPI.listarTodas({ sort: 'fechaEmision,desc' });
    } else if (tab === 'asociado' && asociadoSeleccionado) {
      peticion = FacturasAPI.listarPorAsociado(asociadoSeleccionado.id);
    } else {
      setFacturas([]);
      setLoading(false);
      return;
    }

    peticion
      .then((data) => setFacturas(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => toast(err.message || 'No se pudieron cargar las facturas.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, [tab, estadoFiltro, asociadoSeleccionado]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setBusquedaFactura('');
  }, [tab]);

  // Búsqueda de asociados con pequeño debounce
  useEffect(() => {
    if (tab !== 'asociado' || !busquedaAsociado.trim()) {
      setAsociadosEncontrados([]);
      return;
    }
    setBuscandoAsociados(true);
    const t = setTimeout(() => {
      AsociadosAPI.buscar(busquedaAsociado.trim())
        .then((data) => setAsociadosEncontrados(Array.isArray(data) ? data : data?.content || []))
        .catch(() => setAsociadosEncontrados([]))
        .finally(() => setBuscandoAsociados(false));
    }, 350);
    return () => clearTimeout(t);
  }, [busquedaAsociado, tab]);

  const facturasOrdenadas = useMemo(
    () => [...facturas].sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision)),
    [facturas]
  );

  const facturasFiltradas = useMemo(() => {
    const texto = busquedaFactura.trim().toLowerCase();
    if (!texto) return facturasOrdenadas;
    return facturasOrdenadas.filter((f) => {
      const numero = String(f.numeroFactura || '').toLowerCase();
      const asociado = String(f.asociadoNombre || '').toLowerCase();
      return numero.includes(texto) || asociado.includes(texto);
    });
  }, [facturasOrdenadas, busquedaFactura]);

  const handleDescargarPdf = async (factura) => {
    setDescargandoId(factura.id);
    try {
      const res = await FacturasAPI.pdfRaw(factura.id);
      await descargarBlobDesdeResponse(res, `${factura.numeroFactura}.pdf`);
    } catch (err) {
      toast(err.message || 'No se pudo descargar el PDF.', 'error');
    } finally {
      setDescargandoId(null);
    }
  };

  const handleNotificar = (factura) => {
    setFacturaNotificar(factura);
    setNotificarOpen(true);
  };

  if (!puedeGestionar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden gestionar la facturación. Si eres asociado, consulta tus
            facturas desde tu perfil.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Facturación</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Módulo 7 · Genera, consulta y administra las facturas del acueducto
              </p>
            </div>
          </div>
          {esAdmin && (
            <button
              onClick={() => setGenerarOpen(true)}
              className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-sm font-semibold shrink-0"
            >
              <FileStack className="w-5 h-5" />
              Generar facturación del mes
            </button>
          )}
        </section>

        <div className="flex justify-end mb-2">
          <button
            onClick={() => setHistorialOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-dark-muted text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors"
          >
            <History className="w-4 h-4" /> Historial de notificaciones
          </button>
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

        {tab === 'estado' && (
          <div className="flex items-center gap-1.5 flex-wrap mb-6">
            {FILTROS_ESTADO.map((f) => (
              <button
                key={f.value}
                onClick={() => setEstadoFiltro(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  estadoFiltro === f.value
                    ? 'bg-brand border-brand text-white'
                    : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-brand'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'asociado' && (
          <div className="mb-6 space-y-3">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busquedaAsociado}
                onChange={(e) => {
                  setBusquedaAsociado(e.target.value);
                  setAsociadoSeleccionado(null);
                }}
                placeholder="Buscar asociado por documento, nombre o teléfono…"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
              />
            </div>

            {buscandoAsociados && (
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando…
              </div>
            )}

            {!asociadoSeleccionado && asociadosEncontrados.length > 0 && (
              <div className="max-w-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-lg divide-y divide-gray-200 dark:divide-dark-muted overflow-hidden">
                {asociadosEncontrados.slice(0, 6).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAsociadoSeleccionado(a);
                      setBusquedaAsociado(`${a.nombres} ${a.apellidos}`);
                      setAsociadosEncontrados([]);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center gap-2"
                  >
                    <UserRound className="w-4 h-4 text-brand/70 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 dark:text-white truncate">
                        {a.nombres} {a.apellidos}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{a.documento}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {asociadoSeleccionado && (
              <div className="max-w-md bg-brand/10 border border-brand/30 rounded-lg px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-brand dark:text-brand-light font-semibold">
                  {asociadoSeleccionado.nombres} {asociadoSeleccionado.apellidos}
                </span>
                <button
                  onClick={() => {
                    setAsociadoSeleccionado(null);
                    setBusquedaAsociado('');
                  }}
                  className="text-xs text-brand dark:text-brand-light hover:underline"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando facturas…</span>
          </div>
        )}

        {!loading && tab === 'asociado' && !asociadoSeleccionado && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-16">
            Busca y selecciona un asociado para ver su historial de facturas.
          </p>
        )}

        {!loading && facturasOrdenadas.length > 0 && (tab !== 'asociado' || asociadoSeleccionado) && (
          <div className="relative mb-4 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busquedaFactura}
              onChange={(e) => setBusquedaFactura(e.target.value)}
              placeholder="Buscar por número de factura o nombre de asociado…"
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
            />
          </div>
        )}

        {!loading && facturasOrdenadas.length === 0 && (tab !== 'asociado' || asociadoSeleccionado) && (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No hay facturas para mostrar con este filtro.</p>
          </div>
        )}

        {!loading && facturasOrdenadas.length > 0 && facturasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Ninguna factura coincide con la búsqueda.</p>
          </div>
        )}

        {!loading && facturasFiltradas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facturasFiltradas.map((f) => (
              <FacturaCard
                key={f.id}
                factura={f}
                onVerDetalle={(fac) => {
                  setFacturaDetalle(fac);
                  setDetalleOpen(true);
                }}
                onDescargarPdf={handleDescargarPdf}
                onNotificar={handleNotificar}
                descargandoPdf={descargandoId === f.id}
                onAgregarConcepto={
                  esAdmin
                    ? (fac) => {
                        setFacturaConcepto(fac);
                        setConceptoOpen(true);
                      }
                    : undefined
                }
                onAnular={
                  esAdmin
                    ? (fac) => {
                        setFacturaAnular(fac);
                        setAnularOpen(true);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </main>

      <GenerarFacturacionModal open={generarOpen} onClose={() => setGenerarOpen(false)} onGenerado={cargar} />
      <FacturaDetalleModal
        open={detalleOpen}
        factura={facturaDetalle}
        facturaId={facturaIdDesdeUrl}
        onClose={() => {
          setDetalleOpen(false);
          setFacturaIdDesdeUrl(null);
        }}
      />
      <ConceptoAdicionalModal
        open={conceptoOpen}
        factura={facturaConcepto}
        onClose={() => setConceptoOpen(false)}
        onSaved={cargar}
      />
      <AnularFacturaModal open={anularOpen} factura={facturaAnular} onClose={() => setAnularOpen(false)} onSaved={cargar} />
      <NotificarModal
        open={notificarOpen}
        onClose={() => setNotificarOpen(false)}
        tipo="FACTURA"
        documento={facturaNotificar}
        documentoId={facturaNotificar?.id}
        documentoNumero={facturaNotificar?.numeroFactura}
        asociadoId={facturaNotificar?.asociadoId}
        asociadoNombre={facturaNotificar?.asociadoNombre}
      />
      <HistorialNotificacionesModal open={historialOpen} onClose={() => setHistorialOpen(false)} tipoDocumento="FACTURA" />
    </div>
  );
}
