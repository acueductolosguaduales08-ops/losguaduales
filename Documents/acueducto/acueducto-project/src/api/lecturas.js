import { api } from './client';

// Módulo 04 — Lecturas y Consumo (registro de lecturas de medidor, cálculo automático de consumo).
// Base path: /api/v1/lecturas — todo el módulo requiere rol ADMINISTRADOR (definido a nivel de clase).
export const LecturasAPI = {
  // Registrar lectura. Body (LecturaRequest): medidorId*, mesContableId*, fechaLectura*, lecturaActual* (>=0), observaciones.
  // El backend calcula el consumo (actual - anterior); nunca puede ser negativo.
  crear: (payload) => api.post('/api/v1/lecturas', payload),

  // Editar lectura. Solo si aún no ha generado factura. Mismo shape que crear.
  editar: (id, payload) => api.put(`/api/v1/lecturas/${id}`, payload),

  // Ver detalle de una lectura.
  obtener: (id, signal) => api.get(`/api/v1/lecturas/${id}`, { signal }),

  // Historial de consumo de un asociado (todas sus lecturas).
  historialAsociado: (asociadoId, signal) => api.get(`/api/v1/lecturas/asociado/${asociadoId}`, { signal }),

  // Lecturas registradas en un período contable (usado antes de facturar el mes).
  porMes: (mesContableId, signal) => api.get(`/api/v1/lecturas/mes/${mesContableId}`, { signal }),
};
