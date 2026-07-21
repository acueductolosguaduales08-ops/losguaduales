import { api } from './client';

// Módulo 13 — Auditoría (registro de acciones del sistema). Solo ADMINISTRADOR.
// Base path: /api/v1/auditoria
export const AuditoriaAPI = {
  // Listar toda la auditoría (paginado). params: { page, size, sort }.
  listar: (params, signal) => api.get('/api/v1/auditoria', { params, signal }),

  // Filtrar auditoría por módulo (paginado).
  filtrarPorModulo: (modulo, params, signal) =>
    api.get(`/api/v1/auditoria/modulo/${encodeURIComponent(modulo)}`, { params, signal }),

  // Filtrar auditoría por usuario (paginado).
  filtrarPorUsuario: (usuario, params, signal) =>
    api.get(`/api/v1/auditoria/usuario/${encodeURIComponent(usuario)}`, { params, signal }),

  // Consultar si el registro de auditoría está activo. -> { activa: boolean }
  obtenerEstado: (signal) => api.get('/api/v1/auditoria/estado', { signal }),

  // Desactivar el registro de auditoría (deja de registrar nuevas acciones).
  // El swagger pide "nombre" como query param obligatorio (quien ejecuta la acción),
  // ya que esta acción sí queda registrada como último movimiento.
  desactivar: (nombre) => api.patch('/api/v1/auditoria/desactivar', undefined, { params: { nombre } }),

  // Reactivar el registro de auditoría. También pide "nombre" como query param.
  activar: (nombre) => api.patch('/api/v1/auditoria/activar', undefined, { params: { nombre } }),
};
