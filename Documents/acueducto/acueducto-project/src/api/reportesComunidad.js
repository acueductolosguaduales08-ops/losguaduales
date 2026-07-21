import { api } from './client';

// Módulo 17 — Reportes de la Comunidad (fugas, quejas y reclamos de la comunidad).
export const ReportesComunidadAPI = {
  // Enviar un reporte. Público, sin sesión. Nombre y mensaje obligatorios; contacto opcional.
  enviar: (payload) =>
    api.post('/api/v1/publico/reportes', payload, { isPublic: true }),

  // Listado paginado de reportes. Exclusivo ADMINISTRADOR / TESORERO.
  listar: ({ page = 0, size = 20 } = {}, signal) =>
    api.get('/api/v1/reportes', {
      params: { page, size, sort: 'fechaCreacion,desc' },
      signal,
    }),
};
