import { api } from './client';

// Módulo 03 — Medidores (inventario y estado físico de los medidores de agua).
// Base path: /api/v1/medidores — todo el módulo requiere rol ADMINISTRADOR (definido a nivel de clase en el backend).
export const MedidoresAPI = {
  // Registrar medidor. Body (MedidorRequest): numero*, asociadoId, fechaInstalacion, ubicacion, observaciones.
  crear: (payload) => api.post('/api/v1/medidores', payload),

  // Editar medidor. Mismo shape que crear.
  editar: (id, payload) => api.put(`/api/v1/medidores/${id}`, payload),

  // Cambiar estado físico del medidor (ACTIVO | EN_MANTENIMIENTO | DANADO | RETIRADO).
  cambiarEstado: (id, estado) => api.patch(`/api/v1/medidores/${id}/estado`, undefined, { params: { estado } }),

  // Listar todos los medidores.
  listar: (signal) => api.get('/api/v1/medidores', { signal }),

  // Ver detalle de un medidor.
  obtener: (id, signal) => api.get(`/api/v1/medidores/${id}`, { signal }),
};

// Valores reales del enum EstadoMedidor (backend).
export const ESTADOS_MEDIDOR = ['ACTIVO', 'EN_MANTENIMIENTO', 'DANADO', 'RETIRADO'];
