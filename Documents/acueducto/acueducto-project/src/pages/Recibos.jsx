import { useEffect, useState } from 'react';
import { Receipt, Loader2, Search, ExternalLink, Download, History } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RecibosAPI } from '../api/recibos';
import { descargarBlobDesdeResponse } from '../utils/descargarArchivo';
import AsociadoPicker from '../components/tesoreria/AsociadoPicker';
import ReciboCard from '../components/recibos/ReciboCard';
import NotificarModal from '../components/notificarDocumento/NotificarModal';
import HistorialNotificacionesModal from '../components/notificarDocumento/HistorialNotificacionesModal';

// Módulo 09 — Recibos.
// Nota: la consulta pública por código QR (GET /api/v1/recibos/qr/{numeroRecibo}) no se
// implementa aquí porque ya está disponible en la pantalla de inicio (tarjeta de consulta
// y escáner de QR), tal como indica el requerimiento.
export default function Recibos() {
  const { rol, usuario } = useAuth();
  const { toast } = useToast();
  const esGestor = rol === 'ADMINISTRADOR' || rol === 'TESORERO';
  const esAsociado = rol === 'ASOCIADO';

  const [asociado, setAsociado] = useState(null);
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(esAsociado);

  const [numeroBusqueda, setNumeroBusqueda] = useState('');
  const [buscandoNumero, setBuscandoNumero] = useState(false);
  const [descargandoNumero, setDescargandoNumero] = useState(false);
  const [notificarOpen, setNotificarOpen] = useState(false);
  const [reciboNotificar, setReciboNotificar] = useState(null);
  const [historialOpen, setHistorialOpen] = useState(false);

  const handleNotificar = (recibo) => {
    setReciboNotificar(recibo);
    setNotificarOpen(true);
  };

  // Un asociado ve automáticamente sus propios recibos.
  useEffect(() => {
    if (!esAsociado || !usuario?.asociadoId) return;
    setLoading(true);
    RecibosAPI.listarPorAsociado(usuario.asociadoId)
      .then((data) => setRecibos(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => toast(err.message || 'No se pudieron cargar tus recibos.', 'error'))
      .finally(() => setLoading(false));
  }, [esAsociado, usuario]); // eslint-disable-line react-hooks/exhaustive-deps

  // Un tesorero/administrador busca los recibos del asociado seleccionado.
  useEffect(() => {
    if (!esGestor || !asociado) {
      setRecibos([]);
      return;
    }
    setLoading(true);
    RecibosAPI.listarPorAsociado(asociado.id)
      .then((data) => setRecibos(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => toast(err.message || 'No se pudieron cargar los recibos del asociado.', 'error'))
      .finally(() => setLoading(false));
  }, [esGestor, asociado]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerPorNumero = async () => {
    const numero = numeroBusqueda.trim();
    if (!numero) return;
    setBuscandoNumero(true);
    try {
      const html = await RecibosAPI.html(numero);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        toast('Habilita las ventanas emergentes para ver el recibo.', 'warning');
      }
    } catch (err) {
      toast(err.message || 'No se encontró ese número de recibo.', 'error');
    } finally {
      setBuscandoNumero(false);
    }
  };

  const handleDescargarPorNumero = async () => {
    const numero = numeroBusqueda.trim();
    if (!numero) return;
    setDescargandoNumero(true);
    try {
      const res = await RecibosAPI.pdfRaw(numero);
      await descargarBlobDesdeResponse(res, `${numero}.pdf`);
    } catch (err) {
      toast(err.message || 'No se encontró ese número de recibo.', 'error');
    } finally {
      setDescargandoNumero(false);
    }
  };

  if (!esGestor && !esAsociado) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">No tienes permisos para consultar este módulo.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-5xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Recibos</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Módulo 9 · {esAsociado ? 'Comprobantes de tus pagos' : 'Comprobantes de pago generados por tesorería'}
              </p>
            </div>
          </div>
          {esGestor && (
            <button
              onClick={() => setHistorialOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-dark-muted text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors shrink-0"
            >
              <History className="w-4 h-4" /> Historial de notificaciones
            </button>
          )}
        </section>

        {esGestor && (
          <>
            {/* Consulta directa por número de recibo */}
            <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Consulta rápida por número de recibo
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={numeroBusqueda}
                    onChange={(e) => setNumeroBusqueda(e.target.value)}
                    placeholder="Ingrese el número de recibo"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleVerPorNumero}
                    disabled={!numeroBusqueda.trim() || buscandoNumero}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-sm font-semibold text-gray-700 dark:text-white transition-colors disabled:opacity-50"
                  >
                    {buscandoNumero ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} Ver
                  </button>
                  <button
                    onClick={handleDescargarPorNumero}
                    disabled={!numeroBusqueda.trim() || descargandoNumero}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {descargandoNumero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Búsqueda por asociado */}
            <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-4 mb-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Recibos por asociado</p>
              <AsociadoPicker value={asociado} onChange={setAsociado} />
            </div>
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando recibos…</span>
          </div>
        )}

        {!loading && esGestor && !asociado && (
          <div className="text-center py-16">
            <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Busca un asociado para ver su historial de recibos.</p>
          </div>
        )}

        {!loading && (esAsociado || asociado) && recibos.length === 0 && (
          <div className="text-center py-16">
            <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {esAsociado ? 'Aún no tienes recibos generados.' : 'Este asociado no tiene recibos registrados.'}
            </p>
          </div>
        )}

        {!loading && recibos.length > 0 && (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              {recibos.length} recibo{recibos.length === 1 ? '' : 's'} encontrado{recibos.length === 1 ? '' : 's'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recibos.map((r) => (
                <ReciboCard key={r.id} recibo={r} onNotificar={esGestor ? handleNotificar : undefined} />
              ))}
            </div>
          </>
        )}
      </main>

      <NotificarModal
        open={notificarOpen}
        onClose={() => setNotificarOpen(false)}
        tipo="RECIBO"
        documento={reciboNotificar}
        documentoId={reciboNotificar?.id}
        documentoNumero={reciboNotificar?.numeroRecibo}
        asociadoId={asociado?.id}
        asociadoNombre={reciboNotificar?.asociadoNombre || (asociado ? `${asociado.nombres} ${asociado.apellidos}` : undefined)}
      />
      <HistorialNotificacionesModal open={historialOpen} onClose={() => setHistorialOpen(false)} tipoDocumento="RECIBO" />
    </div>
  );
}
