import { useState } from 'react';
import { ExternalLink, Download, Loader2, RefreshCw } from 'lucide-react';
import { descargarBlobDesdeResponse } from '../../utils/descargarArchivo';
import { useToast } from '../../context/ToastContext';

// Barra de acciones común a los 3 tipos de informe: previsualizar (JSON ya cargado),
// ver versión HTML en una pestaña nueva y descargar el PDF oficial.
export default function InformeAccionesBar({
  titulo,
  subtitulo,
  onRefrescar,
  refrescando,
  cargarHtml,
  cargarPdf,
  nombreArchivo = 'informe.pdf',
  disabled = false,
}) {
  const { toast } = useToast();
  const [cargandoHtml, setCargandoHtml] = useState(false);
  const [cargandoPdf, setCargandoPdf] = useState(false);

  const handleVerHtml = async () => {
    setCargandoHtml(true);
    try {
      const html = await cargarHtml();
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        toast('Habilita las ventanas emergentes para ver el informe en HTML.', 'warning');
      }
    } catch (err) {
      toast(err.message || 'No se pudo abrir el informe en HTML.', 'error');
    } finally {
      setCargandoHtml(false);
    }
  };

  const handleDescargarPdf = async () => {
    setCargandoPdf(true);
    try {
      const res = await cargarPdf();
      await descargarBlobDesdeResponse(res, nombreArchivo);
    } catch (err) {
      toast(err.message || 'No se pudo descargar el PDF del informe.', 'error');
    } finally {
      setCargandoPdf(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-gray-800 dark:text-white">{titulo}</h2>
        {subtitulo && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitulo}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {onRefrescar && (
          <button
            onClick={onRefrescar}
            disabled={disabled || refrescando}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 dark:border-dark-muted text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-muted transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refrescando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        )}
        <button
          onClick={handleVerHtml}
          disabled={disabled || cargandoHtml}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 dark:border-dark-muted text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-muted transition-all disabled:opacity-50"
        >
          {cargandoHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          Ver HTML
        </button>
        <button
          onClick={handleDescargarPdf}
          disabled={disabled || cargandoPdf}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-brand hover:bg-brand-dark text-white transition-all shadow-lg shadow-brand/20 disabled:opacity-60"
        >
          {cargandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Descargar PDF
        </button>
      </div>
    </div>
  );
}
