import { api } from './client';

// Nombre de categoría reservado: toda publicación con esta categoría
// se interpreta como contenido de Galería, no como publicación/noticia.
export const GALLERY_CATEGORY = 'gallery';

// Endpoints de gestión de publicaciones, categorías, etiquetas y videos.
// La mayoría requieren sesión de ADMINISTRADOR o TESORERO (JWT ya lo maneja el client).
export const PublicacionesAPI = {
  listarPublicas: ({ page = 0, size = 24 } = {}, signal) =>
    api.get('/api/v1/publicaciones/publicas', { isPublic: true, params: { page, size }, signal }),

  listarAdmin: ({ page = 0, size = 50 } = {}, signal) =>
    api.get('/api/v1/publicaciones/admin', { params: { page, size }, signal }),

  detalle: (id, signal) => api.get(`/api/v1/publicaciones/${id}`, { signal }),

  destacadas: (signal) => api.get('/api/v1/publicaciones/destacadas', { isPublic: true, signal }),

  crear: (payload) => api.post('/api/v1/publicaciones', payload),

  editar: (id, payload) => api.put(`/api/v1/publicaciones/${id}`, payload),

  publicar: (id) => api.post(`/api/v1/publicaciones/${id}/publicar`),

  ocultar: (id) => api.post(`/api/v1/publicaciones/${id}/ocultar`),

  destacar: (id, destacada) => api.patch(`/api/v1/publicaciones/${id}/destacar`, undefined, { params: { destacada } }),

  eliminar: (id) => api.del(`/api/v1/publicaciones/${id}`),

  categorias: (signal) => api.get('/api/v1/publicaciones/categorias', { isPublic: true, signal }),
  crearCategoria: (nombre) => api.post('/api/v1/publicaciones/categorias', { nombre }),

  etiquetas: (signal) => api.get('/api/v1/publicaciones/etiquetas', { isPublic: true, signal }),
  crearEtiqueta: (nombre, color) => api.post('/api/v1/publicaciones/etiquetas', { nombre, color }),

  videosPublicos: (signal) => api.get('/api/v1/publicaciones/videos/publicos', { isPublic: true, signal }),
  crearVideo: (payload) => api.post('/api/v1/publicaciones/videos', payload),
  ocultarVideo: (id) => api.patch(`/api/v1/publicaciones/videos/${id}/ocultar`),

  reacciones: (id, signal) => api.get(`/api/v1/publicaciones/${id}/reacciones`, { isPublic: true, signal }),
  reaccionar: (id, emoji) => api.post(`/api/v1/publicaciones/${id}/reacciones`, undefined, { isPublic: true, params: { emoji } }),
  quitarReaccion: (id, emoji) => api.del(`/api/v1/publicaciones/${id}/reacciones`, { isPublic: true, params: { emoji } }),
};
