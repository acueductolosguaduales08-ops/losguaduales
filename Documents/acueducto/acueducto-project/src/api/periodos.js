import { api } from './client';

// Módulo 05 — Períodos Contables (años y meses contables, cierre y reapertura).
// Base path: /api/v1/periodos
export const PeriodosAPI = {
  // Listar años contables. Roles: ADMINISTRADOR, TESORERO.
  listarAnios: (signal) => api.get('/api/v1/periodos/anios', { signal }),

  // Crear año contable. Roles: ADMINISTRADOR. Body (AnioContableRequest): { anio }.
  crearAnio: (anio) => api.post('/api/v1/periodos/anios', { anio }),

  // Listar meses de un año. Roles: ADMINISTRADOR, TESORERO.
  listarMeses: (anioId, signal) => api.get(`/api/v1/periodos/anios/${anioId}/meses`, { signal }),

  // Aperturar mes contable. Roles: ADMINISTRADOR. Body (MesContableRequest): { anioContableId, numeroMes }.
  crearMes: (anioContableId, numeroMes) => api.post('/api/v1/periodos/meses', { anioContableId, numeroMes }),

  // Cerrar período — valida lecturas/facturas completas antes de cerrar (Regla 9.8). Roles: ADMINISTRADOR.
  cerrarMes: (mesId) => api.post(`/api/v1/periodos/meses/${mesId}/cerrar`),

  // Reabrir período para corrección administrativa, queda en auditoría (Regla 9.6). Roles: ADMINISTRADOR.
  reabrirMes: (mesId, motivo) =>
    api.post(`/api/v1/periodos/meses/${mesId}/reabrir`, undefined, { params: { motivo } }),

  // Resumen de indicadores del período: facturación, tesorería, consumo y asociados.
  resumenMes: (mesId, signal) => api.get(`/api/v1/periodos/meses/${mesId}/resumen`, { signal }),
};

// Valores reales del enum EstadoMes (backend).
export const ESTADOS_MES = ['ABIERTO', 'CERRADO', 'REABIERTO'];

export const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
