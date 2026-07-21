import { api } from './client';

// Módulo 06 — Configuración del Sistema (datos institucionales, tarifas, métodos de pago
// y archivos institucionales: logo, firma y sello).
// Base path: /api/v1/configuracion
export const ConfiguracionAPI = {
  // Consultar configuración actual. Roles: ADMINISTRADOR, TESORERO.
  obtener: (signal) => api.get('/api/v1/configuracion', { signal, isPublic: true }),

  // Actualizar configuración (tarifas, datos institucionales, cuenta bancaria). Roles: ADMINISTRADOR.
  // Los cambios de tarifa solo afectan facturas nuevas.
  actualizar: (payload) => api.put('/api/v1/configuracion', payload),

  // --- Métodos de pago ---
  crearMetodoPago: (nombre) => api.post('/api/v1/configuracion/metodos-pago', { nombre }),
  listarMetodosPago: (signal) => api.get('/api/v1/configuracion/metodos-pago', { signal }),
  activarMetodoPago: (id, activo) => api.patch(`/api/v1/configuracion/metodos-pago/${id}`, undefined, { params: { activo } }),

  // --- Archivos institucionales (logo, firma, sello) ---
  // Igual que las imágenes de publicaciones: solo por URL, nada se sube al servidor.
  // tipo: LOGO | FIRMA | SELLO.
  registrarArchivoUrl: (tipo, url, nombreArchivo) =>
    api.post(`/api/v1/configuracion/archivos/${tipo}/url`, { url, nombreArchivo: nombreArchivo || null }),

  // Activar un archivo institucional (selecciona cuál logo/firma/sello se usa en los documentos).
  activarArchivo: (archivoId) => api.patch(`/api/v1/configuracion/archivos/${archivoId}/activar`),

  // Quitar una URL registrada de la lista.
  eliminarArchivo: (archivoId) => api.del(`/api/v1/configuracion/archivos/${archivoId}`),

  // Listar archivos institucionales por tipo.
  listarArchivos: (tipo, signal) => api.get(`/api/v1/configuracion/archivos/${tipo}`, { signal }),
};

// Valores reales del enum TipoArchivoInstitucional (backend).
export const TIPOS_ARCHIVO = ['LOGO', 'FIRMA', 'SELLO'];
