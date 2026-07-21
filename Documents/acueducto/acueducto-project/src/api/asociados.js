import { api } from './client';

// Módulo 02 — Asociados (registro, estado de servicio y resumen financiero).
// Base path: /api/v1/asociados — ADMINISTRADOR y TESORERO gestionan; ASOCIADO solo ve lo propio.
export const AsociadosAPI = {
  // Crear asociado. Body (AsociadoRequest): tipoDocumento*, documento*, nombres*, apellidos*,
  // fechaNacimiento, telefonoPrincipal*, telefonoAlternativo, correo, direccion*, barrioVereda,
  // observaciones, numeroMedidor*, fechaAfiliacion.
  crear: (payload) => api.post('/api/v1/asociados', payload),

  // Editar asociado. Mismo shape que crear.
  editar: (id, payload) => api.put(`/api/v1/asociados/${id}`, payload),

  // Buscar/listar asociados por documento, nombre, apellidos o teléfono.
  // `extraParams` permite pasar paginación (ej: { size: 500 }) para listados completos.
  buscar: (q, extraParams, signal) => api.get('/api/v1/asociados', { params: { q, ...extraParams }, signal }),

  // Filtrar por estado de servicio (ACTIVO | SUSPENDIDO | INACTIVO).
  filtrarPorEstado: (estado, signal) => api.get('/api/v1/asociados/filtrar', { params: { estado }, signal }),

  // Ver detalle de un asociado.
  obtener: (id, signal) => api.get(`/api/v1/asociados/${id}`, { signal }),

  // Resumen financiero calculado dinámicamente (facturas, pagos, multas).
  resumenFinanciero: (id, signal) => api.get(`/api/v1/asociados/${id}/resumen-financiero`, { signal }),

  // Cambiar estado del servicio (no afecta el acceso a la plataforma). Body: { estado, motivo }.
  cambiarEstadoServicio: (id, payload) => api.patch(`/api/v1/asociados/${id}/estado-servicio`, payload),

  // Archivar asociado (baja lógica, nunca se elimina físicamente si tiene historial).
  archivar: (id) => api.del(`/api/v1/asociados/${id}`),
};

// Valores reales del enum EstadoServicio (backend).
export const ESTADOS_SERVICIO = ['ACTIVO', 'SUSPENDIDO', 'INACTIVO'];

// Valores reales del enum TipoDocumento (backend).
export const TIPOS_DOCUMENTO = ['CC', 'CE', 'TI', 'NIT', 'PASAPORTE'];
