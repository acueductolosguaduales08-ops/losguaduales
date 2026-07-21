import { Receipt, FileText, ExternalLink, Download, Loader2, Ban, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { RecibosAPI } from '../../api/recibos';
import { descargarBlobDesdeResponse } from '../../utils/descargarArchivo';
import { useToast } from '../../context/ToastContext';

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

// Tarjeta de recibo: muestra los datos del comprobante y permite verlo en HTML o descargarlo en PDF.
export default function ReciboCard({ recibo, onNotificar }) {
  const { toast } = useToast();
  const [descargando, setDescargando] = useState(false);
  const anulado = recibo.estado === 'ANULADO';

  const handleVerHtml = async () => {
    try {
      const html = await RecibosAPI.html(recibo.numeroRecibo);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        toast('Habilita las ventanas emergentes para ver el recibo.', 'warning');
      }
    } catch (err) {
      toast(err.message || 'No se pudo abrir el recibo.', 'error');
    }
  };

  const handleDescargar = async () => {
    setDescargando(true);
    try {
      const res = await RecibosAPI.pdfRaw(recibo.numeroRecibo);
      await descargarBlobDesdeResponse(res, `${recibo.numeroRecibo}.pdf`);
    } catch (err) {
      toast(err.message || 'No se pudo descargar el recibo.', 'error');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border bg-white dark:bg-dark-card transition-colors ${
        anulado ? 'border-gray-200 dark:border-dark-muted opacity-70' : 'border-gray-200 dark:border-dark-muted hover:border-brand/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              anulado ? 'bg-gray-100 dark:bg-dark-muted text-gray-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <Receipt className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{recibo.numeroRecibo}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatFecha(recibo.fechaEmision)}</p>
          </div>
        </div>
        {anulado ? (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-muted text-gray-500 dark:text-gray-400">
            <Ban className="w-3 h-3" /> ANULADO
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            EMITIDO
          </span>
        )}
      </div>

      <div className="space-y-1 mb-3">
        {recibo.numeroFactura && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <FileText className="w-3.5 h-3.5 shrink-0" /> Factura {recibo.numeroFactura}
          </div>
        )}
        {recibo.asociadoNombre && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{recibo.asociadoNombre}</p>}
        {recibo.metodoPago && <p className="text-xs text-gray-400 dark:text-gray-500">{recibo.metodoPago}</p>}
      </div>

      {Number(recibo.saldoPendiente) > 0 && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2">
          Pago parcial · saldo restante en la factura: {formatCOP(recibo.saldoPendiente)}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-muted">
        <span className="text-lg font-black text-gray-800 dark:text-white">{formatCOP(recibo.valor)}</span>
        <div className="flex gap-1.5">
          {onNotificar && (
            <button
              onClick={() => onNotificar(recibo)}
              title="Notificar al asociado"
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-muted hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleVerHtml}
            title="Ver recibo"
            className="p-2 rounded-lg bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={handleDescargar}
            disabled={descargando}
            title="Descargar PDF"
            className="p-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors"
          >
            {descargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
