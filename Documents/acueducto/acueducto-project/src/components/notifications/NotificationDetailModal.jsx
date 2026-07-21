import { useState } from 'react';
import { X, Calendar, ExternalLink, ImageOff, ShieldAlert, AlertTriangle, Info, Siren } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';

const PRIORIDAD_BADGE = {
  URGENTE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  ALTA: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  MEDIA: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  NORMAL: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  BAJA: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
};

const PRIORIDAD_ICON = {
  URGENTE: Siren,
  ALTA: ShieldAlert,
  MEDIA: AlertTriangle,
  NORMAL: Info,
  BAJA: Info,
};

// El backend devuelve PUBLICA / ASOCIADO / ADMINISTRATIVA (ver swagger); se muestran como Pública/Privada/Interna.
const TIPO_LABEL = {
  PUBLICA: 'Pública',
  ASOCIADO: 'Privada',
  ADMINISTRATIVA: 'Interna',
};

const TIPO_BADGE = {
  PUBLICA: 'bg-brand/10 text-brand dark:text-brand-light border-brand/20',
  ASOCIADO: 'bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20',
  ADMINISTRATIVA: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function NotificationDetailModal() {
  const { detalle, cerrarDetalle } = useNotifications();
  const [imgError, setImgError] = useState(false);

  if (!detalle) return null;

  const PrioridadIcon = PRIORIDAD_ICON[detalle.prioridad] || Info;
  const tieneImagen = !!detalle.enlaceUrl && !imgError;

  return (
    <div className="fixed inset-0 z-[95] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain touch-pan-y">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={cerrarDetalle}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-muted overflow-hidden animate-[modalPop_0.2s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-muted">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${TIPO_BADGE[detalle.tipo] || TIPO_BADGE.PUBLICA}`}>
              {TIPO_LABEL[detalle.tipo] || detalle.tipo}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border flex items-center gap-1 ${PRIORIDAD_BADGE[detalle.prioridad] || PRIORIDAD_BADGE.BAJA}`}>
              <PrioridadIcon className="w-3 h-3" />
              {detalle.prioridad}
            </span>
          </div>
          <button
            onClick={cerrarDetalle}
            aria-label="Cerrar"
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75dvh] overflow-y-auto overscroll-contain custom-scroll">
          <div className="relative w-full h-44 rounded-xl mb-5 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-dark-muted bg-gradient-to-br from-gray-100 to-gray-50 dark:from-dark-muted dark:to-dark-bg">
            {tieneImagen ? (
              <img
                src={detalle.enlaceUrl}
                alt={detalle.titulo}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center gap-1.5 p-4 text-center">
                <div className="p-2.5 rounded-full bg-brand/10 border border-brand/20 text-brand">
                  <ImageOff className="w-6 h-6" />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Sin adjunto gráfico</span>
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 leading-snug">{detalle.titulo}</h3>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatFecha(detalle.fechaPublicacion)}</span>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {detalle.contenidoCompleto || detalle.descripcionCorta}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg/40 flex justify-end gap-3">
          {detalle.enlaceUrl && (
            <a
              href={detalle.enlaceUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs text-white bg-brand hover:bg-brand-dark rounded-xl font-bold transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver recurso
            </a>
          )}
          <button
            onClick={cerrarDetalle}
            className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-dark-muted/50 hover:bg-gray-200 dark:hover:bg-dark-muted rounded-xl font-bold transition-all border border-gray-200 dark:border-dark-muted"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
