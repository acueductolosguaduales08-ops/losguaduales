import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, Info, AlertTriangle, ShieldAlert, Siren, Inbox, BellRing, BellOff } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';
import { useAuth } from '../../context/AuthContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const PRIORIDAD_STYLE = {
  URGENTE: { dot: 'bg-red-500', Icon: Siren, iconCls: 'text-red-500 bg-red-500/10' },
  ALTA: { dot: 'bg-red-400', Icon: ShieldAlert, iconCls: 'text-red-500 bg-red-500/10' },
  MEDIA: { dot: 'bg-amber-400', Icon: AlertTriangle, iconCls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
  NORMAL: { dot: 'bg-blue-400', Icon: Info, iconCls: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
  BAJA: { dot: 'bg-emerald-400', Icon: Info, iconCls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
};

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function NotificationRow({ n, onOpen }) {
  const { dot, Icon, iconCls } = PRIORIDAD_STYLE[n.prioridad] || PRIORIDAD_STYLE.BAJA;
  return (
    <button
      onClick={() => onOpen(n)}
      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors hover:bg-gray-100 dark:hover:bg-dark-muted/60 ${
        !n.leida ? 'bg-brand/[0.04] dark:bg-brand/[0.06]' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconCls}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {!n.leida && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />}
          <p className={`text-sm truncate ${!n.leida ? 'font-bold text-gray-800 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
            {n.titulo}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.descripcionCorta}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{formatFecha(n.fechaPublicacion)}</p>
      </div>
    </button>
  );
}

export default function NotificationsBellDropdown({ open, onClose }) {
  const [tab, setTab] = useState('mias'); // 'mias' | 'publicas'
  const { isAuthenticated } = useAuth();
  const {
    publicas,
    misNotificaciones,
    loadingPublicas,
    loadingMias,
    abrirDetalle,
    marcarLeida,
    permisoSistema,
    activarNotificacionesSistema,
  } = useNotifications();

  useLockBodyScroll(open);

  if (!open) return null;

  const lista = tab === 'mias' ? misNotificaciones : publicas;
  const loading = tab === 'mias' ? loadingMias : loadingPublicas;

  const handleOpen = (n) => {
    onClose();
    abrirDetalle(n);
  };

  const marcarTodasLeidas = () => {
    lista.filter((n) => !n.leida).forEach((n) => marcarLeida(n.id));
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed left-2 right-2 top-[68px] sm:left-auto sm:right-4 z-50 sm:w-[380px] max-w-full max-h-[calc(100dvh-84px)] flex flex-col bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-muted overflow-hidden animate-[modalPop_0.18s_ease]">
        {/* Header */}
        <div className="p-3.5 border-b border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg/40 flex items-center justify-between shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Notificaciones</h3>
          <button
            onClick={marcarTodasLeidas}
            className="text-[11px] font-semibold text-brand hover:text-brand-dark dark:hover:text-brand-light transition-colors flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
          </button>
        </div>

        {/* Notificaciones del sistema (fuera de la página) */}
        {permisoSistema === 'default' && (
          <button
            onClick={activarNotificacionesSistema}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[11px] font-semibold text-brand bg-brand/5 hover:bg-brand/10 border-b border-gray-200 dark:border-dark-muted transition-colors shrink-0"
          >
            <BellRing className="w-3.5 h-3.5 shrink-0" />
            Activar notificaciones fuera de la página
          </button>
        )}
        {permisoSistema === 'denied' && (
          <div className="flex items-center gap-2 px-3.5 py-2 text-[10px] text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-dark-muted shrink-0">
            <BellOff className="w-3.5 h-3.5 shrink-0" />
            Notificaciones del sistema bloqueadas por el navegador.
          </div>
        )}

        {/* Tabs: Públicas / Mis notificaciones */}
        <div className="flex border-b border-gray-200 dark:border-dark-muted bg-gray-50/60 dark:bg-dark-bg/20 shrink-0">
          <button
            onClick={() => setTab('mias')}
            className={`flex-1 py-2.5 text-[11px] font-bold tracking-wide uppercase transition-colors border-b-2 ${
              tab === 'mias'
                ? 'text-brand border-brand'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Mis notificaciones
          </button>
          <button
            onClick={() => setTab('publicas')}
            className={`flex-1 py-2.5 text-[11px] font-bold tracking-wide uppercase transition-colors border-b-2 ${
              tab === 'publicas'
                ? 'text-brand border-brand'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Públicas
          </button>
        </div>

        {/* Listado */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-2 space-y-1">
          {loading && (
            <div className="space-y-2 p-2">
              <div className="h-14 rounded-xl bg-gray-100 dark:bg-dark-muted/50 animate-pulse" />
              <div className="h-14 rounded-xl bg-gray-100 dark:bg-dark-muted/50 animate-pulse" />
            </div>
          )}

          {!loading && tab === 'mias' && !isAuthenticated && (
            <div className="flex flex-col items-center text-center gap-2 py-10 px-4">
              <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Inicia sesión para ver tus notificaciones privadas e internas.
              </p>
            </div>
          )}

          {!loading && lista.length === 0 && (tab === 'publicas' || isAuthenticated) && (
            <div className="flex flex-col items-center text-center gap-2 py-10 px-4">
              <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              <p className="text-xs text-gray-400 dark:text-gray-500">No hay notificaciones por ahora.</p>
            </div>
          )}

          {!loading && lista.map((n) => <NotificationRow key={n.id} n={n} onOpen={handleOpen} />)}
        </div>

      </div>
    </>,
    document.body
  );
}
