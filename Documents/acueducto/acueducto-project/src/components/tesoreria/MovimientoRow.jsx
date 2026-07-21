import { ArrowDownCircle, ArrowUpCircle, FileText, Receipt, Ban, User } from 'lucide-react';

function formatCOP(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function formatFechaHora(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// Fila de movimiento (entrada o salida) para el historial de tesorería.
// El backend no expone un campo de estado/anulado en MovimientoTesoreriaResponse, así que
// la acción de anular se ofrece siempre al Administrador; el propio backend valida si aplica.
// onVerDetalle (opcional) abre el modal con el detalle del movimiento y las acciones
// de ver/descargar el recibo asociado.
export default function MovimientoRow({ movimiento: m, onAnular, onVerDetalle }) {
  const esEntrada = m.tipo === 'ENTRADA';

  return (
    <div
      onClick={onVerDetalle ? () => onVerDetalle(m) : undefined}
      role={onVerDetalle ? 'button' : undefined}
      tabIndex={onVerDetalle ? 0 : undefined}
      className={`flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-white dark:bg-dark-card hover:border-brand/40 transition-colors ${
        onVerDetalle ? 'cursor-pointer' : ''
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          esEntrada
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
        }`}
      >
        {esEntrada ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{m.concepto || 'Sin concepto'}</p>
          {m.categoria && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-dark-muted text-gray-500 dark:text-gray-400 font-semibold shrink-0">
              {m.categoria}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 flex-wrap">
          <span className="font-mono">{m.numeroFormateado}</span>
          <span>{formatFechaHora(m.fecha)}</span>
          {m.usuario && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {m.usuario}
            </span>
          )}
          {m.facturaNumero && (
            <span className="flex items-center gap-1 text-brand/80">
              <FileText className="w-3 h-3" /> {m.facturaNumero}
            </span>
          )}
          {m.reciboNumero && (
            <span className="flex items-center gap-1 text-brand/80">
              <Receipt className="w-3 h-3" /> {m.reciboNumero}
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${esEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
          {esEntrada ? '+' : '-'}
          {formatCOP(m.valor)}
        </p>
      </div>

      {onAnular && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAnular(m);
          }}
          title="Anular movimiento"
          className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Ban className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
