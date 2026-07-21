import { X, Info, AlertTriangle, ShieldAlert, Siren } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';

const WAVE_PATH =
  'M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320Z';

const PRIORIDAD_STYLE = {
  URGENTE: { cls: 'ntf-alta', Icon: Siren },
  ALTA: { cls: 'ntf-alta', Icon: ShieldAlert },
  MEDIA: { cls: 'ntf-media', Icon: AlertTriangle },
  BAJA: { cls: 'ntf-baja', Icon: Info },
};

/**
 * Notificaciones flotantes: aparecen sobre cualquier página (montadas una sola vez
 * en main.jsx), se auto-ocultan tras un tiempo según prioridad, y al hacer clic
 * abren el modal de detalle. No dependen de la ruta activa: siguen al usuario.
 */
export default function NotificationToasts() {
  const { toasts, dismissToast, abrirDetalle } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[90] flex flex-col gap-3 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map((n) => {
        const { cls, Icon } = PRIORIDAD_STYLE[n.prioridad] || PRIORIDAD_STYLE.BAJA;
        return (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              dismissToast(n.id);
              abrirDetalle(n);
            }}
            className={`ntf-item ${cls} pointer-events-auto cursor-pointer animate-[toastIn_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]`}
          >
            <svg className="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
              <path d={WAVE_PATH} fillOpacity="1" />
            </svg>
            <div className="icon-container shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col justify-center items-start flex-grow overflow-hidden">
              <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate w-full">{n.titulo}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">{n.descripcionCorta}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(n.id);
              }}
              aria-label="Cerrar notificación"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
