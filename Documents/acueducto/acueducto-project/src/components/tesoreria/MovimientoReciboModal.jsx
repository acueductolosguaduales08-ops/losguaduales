import { useState } from 'react';
import { X, Receipt, ExternalLink, Download, Loader2, FileText, User, CalendarClock, Info } from 'lucide-react';
import { RecibosAPI } from '../../api/recibos';
import { descargarBlobDesdeResponse } from '../../utils/descargarArchivo';
import { useToast } from '../../context/ToastContext';

function formatCOP(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function formatFechaHora(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// Modal de detalle de un movimiento: muestra la información completa y,
// cuando el movimiento tiene un recibo asociado (pagos de factura), permite
// verlo en HTML o descargarlo en PDF (mismo patrón que ReciboCard).
export default function MovimientoReciboModal({ open, movimiento, onClose }) {
  const { toast } = useToast();
  const [abriendo, setAbriendo] = useState(false);
  const [descargando, setDescargando] = useState(false);

  if (!open || !movimiento) return null;

  const esEntrada = movimiento.tipo === 'ENTRADA';
  const tieneRecibo = Boolean(movimiento.reciboNumero);

  const handleVerHtml = async () => {
    if (!tieneRecibo) return;
    setAbriendo(true);
    try {
      const html = await RecibosAPI.html(movimiento.reciboNumero);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        toast('Habilita las ventanas emergentes para ver el recibo.', 'warning');
      }
    } catch (err) {
      toast(err.message || 'No se pudo abrir el recibo.', 'error');
    } finally {
      setAbriendo(false);
    }
  };

  const handleDescargar = async () => {
    if (!tieneRecibo) return;
    setDescargando(true);
    try {
      const res = await RecibosAPI.pdfRaw(movimiento.reciboNumero);
      await descargarBlobDesdeResponse(res, `${movimiento.reciboNumero}.pdf`);
    } catch (err) {
      toast(err.message || 'No se pudo descargar el recibo.', 'error');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease]">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Detalle del movimiento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-1 truncate">
              {movimiento.concepto || 'Sin concepto'}
            </p>
            <p className={`text-2xl font-black ${esEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {esEntrada ? '+' : '-'}
              {formatCOP(movimiento.valor)}
            </p>
          </div>

          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-mono">{movimiento.numeroFormateado}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-gray-400 shrink-0" />
              {formatFechaHora(movimiento.fecha)}
            </div>
            {movimiento.usuario && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                {movimiento.usuario}
              </div>
            )}
            {movimiento.facturaNumero && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                Factura {movimiento.facturaNumero}
              </div>
            )}
          </div>

          {tieneRecibo ? (
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleVerHtml}
                disabled={abriendo}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 disabled:opacity-60 text-gray-700 dark:text-white text-sm font-semibold transition-colors"
              >
                {abriendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Ver recibo
              </button>
              <button
                onClick={handleDescargar}
                disabled={descargando}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {descargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Descargar
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              Este movimiento no tiene un recibo asociado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
