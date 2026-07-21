import { api } from './client';

export const EncuestasAPI = {
  // Administración (requiere sesión ADMINISTRADOR o TESORERO)
  listarAdmin: (signal) => api.get('/api/v1/encuestas/admin', { signal }),

  crear: (payload) => api.post('/api/v1/encuestas', payload),

  activar: (id) => api.post(`/api/v1/encuestas/${id}/activar`),

  desactivar: (id) => api.post(`/api/v1/encuestas/${id}/desactivar`),

  archivar: (id) => api.del(`/api/v1/encuestas/${id}`),

  estadisticas: (id, signal) => api.get(`/api/v1/encuestas/${id}/estadisticas`, { signal }),

  // Público (sin sesión)
  listarPublicas: (signal) => api.get('/api/v1/encuestas/publicas', { isPublic: true, signal }),

  detalle: (id, signal) => api.get(`/api/v1/encuestas/${id}`, { isPublic: true, signal }),

  porCodigo: (codigo, signal) => api.get(`/api/v1/encuestas/codigo/${codigo}`, { isPublic: true, signal }),

  responder: (id, payload) => api.post(`/api/v1/encuestas/${id}/responder`, payload, { isPublic: true }),

  // Admin/Tesorero: ver todas las respuestas de un formulario
  listarRespuestas: (id, signal) => api.get(`/api/v1/encuestas/${id}/respuestas`, { signal }),
};

// Tipos de pregunta soportados por el backend
export const TIPOS_PREGUNTA = [
  { value: 'TEXTO_CORTO', label: 'Texto corto' },
  { value: 'TEXTO_LARGO', label: 'Texto largo' },
  { value: 'SI_NO', label: 'Sí / No' },
  { value: 'ESCALA', label: '5 estrellas' },
  { value: 'OPCION_UNICA', label: 'Opciones personalizadas' },
];

export function normalizarTipoPregunta(tipo) {
  switch (tipo) {
    case 'ESTRELLAS':
    case 'ESCALA':
      return 'ESCALA';
    case 'OPCIONES':
    case 'OPCION_UNICA':
    case 'OPCION_MULTIPLE':
      return 'OPCION_UNICA';
    default:
      return tipo;
  }
}
