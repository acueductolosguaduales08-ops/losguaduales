import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { NotificacionesAPI } from '../api/notificaciones';
import { useAuth } from './AuthContext';
import {
  registrarServiceWorker,
  permisoNotificaciones,
  solicitarPermisoNotificaciones,
  mostrarNotificacionSistema,
} from '../utils/notificacionesSistema';

const NotificationsContext = createContext(null);

const POLL_INTERVAL_MS = 30000;
const TOAST_DURATION_MS = { BAJA: 5000, MEDIA: 6500, ALTA: 8000, URGENTE: 12000 };
const SEEN_IDS_KEY = 'acueducto_ntf_seen_ids';

function loadSeenIds() {
  try {
    const raw = sessionStorage.getItem(SEEN_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(set) {
  try {
    sessionStorage.setItem(SEEN_IDS_KEY, JSON.stringify([...set]));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [publicas, setPublicas] = useState([]);
  const [misNotificaciones, setMisNotificaciones] = useState([]);
  const [loadingPublicas, setLoadingPublicas] = useState(true);
  const [loadingMias, setLoadingMias] = useState(true);
  const [toasts, setToasts] = useState([]); // notificaciones flotantes activas
  const [detalle, setDetalle] = useState(null); // notificación abierta en modal
  const [permisoSistema, setPermisoSistema] = useState(() => permisoNotificaciones());

  const seenIds = useRef(loadSeenIds());
  const isFirstLoad = useRef(true);

  // Registra el Service Worker una sola vez (necesario para notificaciones
  // del sistema con imagen enriquecida). Falla en silencio si el navegador
  // no lo soporta o si no hay permiso todavía: no bloquea nada de la app.
  useEffect(() => {
    registrarServiceWorker();
  }, []);

  const activarNotificacionesSistema = useCallback(async () => {
    const resultado = await solicitarPermisoNotificaciones();
    setPermisoSistema(resultado);
    return resultado;
  }, []);

  // Muestra la notificación "fuera de la página" (del sistema/navegador)
  // para un aviso recién detectado. Usa el mismo título, descripción corta
  // e imagen (enlaceUrl) que el aviso dentro de la app, con el logo del
  // acueducto como ícono. Solo se dispara si el usuario ya concedió permiso.
  const notificarFueraPagina = useCallback((n) => {
    if (permisoNotificaciones() !== 'granted') return;
    mostrarNotificacionSistema({
      id: n.id,
      titulo: n.titulo,
      cuerpo: n.descripcionCorta,
      imagen: n.enlaceUrl || undefined,
    });
  }, []);

  const pushToast = useCallback((n) => {
    setToasts((prev) => {
      if (prev.some((t) => t.id === n.id)) return prev;
      return [...prev, n];
    });
    const duration = TOAST_DURATION_MS[n.prioridad] || TOAST_DURATION_MS.BAJA;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== n.id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchPublicas = useCallback(async () => {
    try {
      const res = await NotificacionesAPI.publicas({ page: 0, size: 10 });
      const content = res?.content || [];
      setPublicas(content);

      // Detecta notificaciones nuevas (no vistas en esta sesión) para lanzarlas flotando.
      const nuevas = content.filter((n) => !seenIds.current.has(n.id));
      if (!isFirstLoad.current) {
        nuevas.forEach((n) => {
          pushToast(n);
          notificarFueraPagina(n);
        });
      }
      content.forEach((n) => seenIds.current.add(n.id));
      saveSeenIds(seenIds.current);

      return content;
    } catch {
      return [];
    } finally {
      setLoadingPublicas(false);
    }
  }, [pushToast, notificarFueraPagina]);

  const fetchMisNotificaciones = useCallback(async () => {
    if (!isAuthenticated) {
      setMisNotificaciones([]);
      setLoadingMias(false);
      return [];
    }
    try {
      const res = await NotificacionesAPI.misNotificaciones({ page: 0, size: 10 });
      const content = res?.content || [];
      setMisNotificaciones(content);

      const nuevas = content.filter((n) => !seenIds.current.has(n.id));
      if (!isFirstLoad.current) {
        nuevas.forEach((n) => {
          pushToast(n);
          notificarFueraPagina(n);
        });
      }
      content.forEach((n) => seenIds.current.add(n.id));
      saveSeenIds(seenIds.current);

      return content;
    } catch {
      return [];
    } finally {
      setLoadingMias(false);
    }
  }, [isAuthenticated, pushToast, notificarFueraPagina]);

  const refetchAll = useCallback(async () => {
    await Promise.all([fetchPublicas(), fetchMisNotificaciones()]);
    isFirstLoad.current = false;
  }, [fetchPublicas, fetchMisNotificaciones]);

  // Carga inicial + polling periódico (simula tiempo real sin websockets).
  useEffect(() => {
    refetchAll();
    const interval = setInterval(() => {
      fetchPublicas();
      fetchMisNotificaciones();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const marcarLeida = useCallback(async (id) => {
    setMisNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    setPublicas((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    try {
      await NotificacionesAPI.marcarLeida(id);
    } catch {
      /* falla silenciosa: el estado optimista ya se actualizó en UI */
    }
  }, []);

  const abrirDetalle = useCallback(
    (n) => {
      setDetalle(n);
      if (!n.leida) marcarLeida(n.id);
    },
    [marcarLeida]
  );

  const cerrarDetalle = useCallback(() => setDetalle(null), []);

  const noLeidas = useMemo(() => {
    const combinadas = [...publicas, ...misNotificaciones];
    const unicas = new Map(combinadas.map((n) => [n.id, n]));
    return [...unicas.values()].filter((n) => !n.leida).length;
  }, [publicas, misNotificaciones]);

  const value = useMemo(
    () => ({
      publicas,
      misNotificaciones,
      loadingPublicas,
      loadingMias,
      toasts,
      detalle,
      noLeidas,
      permisoSistema,
      activarNotificacionesSistema,
      dismissToast,
      abrirDetalle,
      cerrarDetalle,
      marcarLeida,
      refetchAll,
    }),
    [
      publicas,
      misNotificaciones,
      loadingPublicas,
      loadingMias,
      toasts,
      detalle,
      noLeidas,
      permisoSistema,
      activarNotificacionesSistema,
      dismissToast,
      abrirDetalle,
      cerrarDetalle,
      marcarLeida,
      refetchAll,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>');
  return ctx;
}
