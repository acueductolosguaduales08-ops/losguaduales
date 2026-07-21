import { useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FacturasAPI } from '../api/facturas';
import { descargarBlobDesdeResponse } from '../utils/descargarArchivo';
import FacturaCard from '../components/facturas/FacturaCard';
import FacturaDetalleModal from '../components/facturas/FacturaDetalleModal';

// Historial de facturas del propio asociado autenticado
// (GET /api/v1/facturas/asociado/{asociadoId}, restringido a @asociadoSecurity.esPropio).
export default function MisFacturas() {
  const { usuario, rol } = useAuth();
  const { toast } = useToast();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [facturaDetalle, setFacturaDetalle] = useState(null);
  const [descargandoId, setDescargandoId] = useState(null);

  const asociadoId = usuario?.asociadoId;

  useEffect(() => {
    if (rol !== 'ASOCIADO' || !asociadoId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    FacturasAPI.listarPorAsociado(asociadoId)
      .then((data) => setFacturas(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => toast(err.message || 'No se pudieron cargar tus facturas.', 'error'))
      .finally(() => setLoading(false));
  }, [rol, asociadoId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (rol !== 'ASOCIADO') {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Sección exclusiva de asociados</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Inicia sesión con tu cuenta de asociado para ver tu historial de facturas.
          </p>
        </main>
      </div>
    );
  }

  const facturasOrdenadas = [...facturas].sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision));
  const saldoTotal = facturas.reduce((acc, f) => acc + (f.estado !== 'ANULADA' ? f.saldoPendiente || 0 : 0), 0);

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mis facturas</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Historial completo de tu servicio de acueducto</p>
            </div>
          </div>
          {!loading && facturas.length > 0 && (
            <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-xl px-4 py-2.5 text-right shrink-0">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Saldo total pendiente</p>
              <p className="text-lg font-black text-red-600 dark:text-red-400">
                {saldoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
        </section>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando tus facturas…</span>
          </div>
        )}

        {!loading && facturasOrdenadas.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Aún no tienes facturas registradas.</p>
          </div>
        )}

        {!loading && facturasOrdenadas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facturasOrdenadas.map((f) => (
              <FacturaCard
                key={f.id}
                factura={f}
                mostrarAsociado={false}
                onVerDetalle={(fac) => {
                  setFacturaDetalle(fac);
                  setDetalleOpen(true);
                }}
                onDescargarPdf={handleDescargarPdf}
                descargandoPdf={descargandoId === f.id}
              />
            ))}
          </div>
        )}
      </main>

      <FacturaDetalleModal open={detalleOpen} factura={facturaDetalle} onClose={() => setDetalleOpen(false)} />
    </div>
  );
}
