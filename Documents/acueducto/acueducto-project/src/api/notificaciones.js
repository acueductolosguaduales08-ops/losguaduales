import { api } from './client';

// Módulo 11 — Notificaciones (avisos públicos, para asociados y administrativos).
export const NotificacionesAPI = {
  // Listado paginado de notificaciones públicas (visibles para todos, sin sesión).
  publicas: ({ page = 0, size = 10 } = {}, signal) =>
    api.get('/api/v1/notificaciones/publicas', {
      isPublic: true,
      params: { page, size, sort: 'fechaPublicacion,desc' },
      signal,
    }),

  // Listado paginado de "mis notificaciones" (requiere sesión: ASOCIADO/ADMINISTRATIVA + PUBLICA relevantes al usuario).
  misNotificaciones: ({ page = 0, size = 10 } = {}, signal) =>
    api.get('/api/v1/notificaciones/mis-notificaciones', {
      params: { page, size, sort: 'fechaPublicacion,desc' },
      signal,
    }),

  // Crear notificación (uso administrativo/tesorería).
  crear: (payload) => api.post('/api/v1/notificaciones', payload),

  // Marcar como leída.
  marcarLeida: (id) => api.patch(`/api/v1/notificaciones/${id}/leida`),

  // Eliminar definitivamente.
  eliminar: (id) => api.del(`/api/v1/notificaciones/${id}`),
};
