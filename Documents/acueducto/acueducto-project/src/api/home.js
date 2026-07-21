import { api } from './client';

// Todos estos endpoints son públicos: no requieren sesión iniciada.
export const HomeAPI = {
  publicacionesDestacadas: (signal) =>
    api.get('/api/v1/publicaciones/destacadas', { isPublic: true, signal }),

  publicacionesPublicas: ({ page = 0, size = 12 } = {}, signal) =>
    api.get('/api/v1/publicaciones/publicas', { isPublic: true, params: { page, size }, signal }),

  categorias: (signal) =>
    api.get('/api/v1/publicaciones/categorias', { isPublic: true, signal }),

  etiquetas: (signal) =>
    api.get('/api/v1/publicaciones/etiquetas', { isPublic: true, signal }),

  videosPublicos: (signal) =>
    api.get('/api/v1/publicaciones/videos/publicos', { isPublic: true, signal }),

  reacciones: (publicacionId, signal) =>
    api.get(`/api/v1/publicaciones/${publicacionId}/reacciones`, { isPublic: true, signal }),

  reaccionar: (publicacionId, emoji) =>
    api.post(`/api/v1/publicaciones/${publicacionId}/reacciones`, undefined, { isPublic: true, params: { emoji } }),

  quitarReaccion: (publicacionId, emoji) =>
    api.del(`/api/v1/publicaciones/${publicacionId}/reacciones`, { isPublic: true, params: { emoji } }),

  notificacionesPublicas: ({ page = 0, size = 5 } = {}, signal) =>
    api.get('/api/v1/notificaciones/publicas', {
      isPublic: true,
      params: { page, size, sort: 'fechaPublicacion,desc' },
      signal,
    }),

  encuestasPublicas: (signal) =>
    api.get('/api/v1/encuestas/publicas', { isPublic: true, signal }),

  estadoServicio: (documento, signal) =>
    api.get('/api/v1/consultas/estado-servicio', { isPublic: true, params: { documento }, signal }),

  consultarFactura: (numeroFactura, signal) =>
    api.get(`/api/v1/facturas/qr/${encodeURIComponent(numeroFactura)}`, { isPublic: true, signal }),

  consultarRecibo: (numeroRecibo, signal) =>
    api.get(`/api/v1/recibos/qr/${encodeURIComponent(numeroRecibo)}`, { isPublic: true, signal }),
};
