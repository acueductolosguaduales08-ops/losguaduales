import { api } from './client';

// Módulo 07 — Facturación (generación mensual, conceptos adicionales, anulación,
// consulta e impresión de facturas). Base path: /api/v1/facturas
export const FacturasAPI = {
  // Procesa todas las lecturas pendientes del período y genera una factura por cada una.
  // Roles: ADMINISTRADOR. Body: { mesContableId }. Devuelve la lista de facturas generadas.
  generarMes: (mesContableId) => api.post('/api/v1/facturas/generar-mes', { mesContableId }),

  // Agregar concepto adicional (recargo, ajuste, etc.) a una factura ya emitida.
  // Roles: ADMINISTRADOR. Body: { facturaId, descripcion, valor (>0) }.
  agregarConcepto: (payload) => api.post('/api/v1/facturas/conceptos', payload),

  // Anular factura. Roles: ADMINISTRADOR. Query: motivo (requerido).
  anular: (id, motivo) => api.post(`/api/v1/facturas/${id}/anular`, undefined, { params: { motivo } }),

  // Ver detalle. Roles: ADMINISTRADOR, TESORERO, ASOCIADO (solo la propia).
  obtener: (id, signal) => api.get(`/api/v1/facturas/${id}`, { signal }),

  // Listar facturas de un asociado (paginado). Roles: ADMINISTRADOR, TESORERO, ASOCIADO (propio).
  listarPorAsociado: (asociadoId, params, signal) =>
    api.get(`/api/v1/facturas/asociado/${asociadoId}`, { params, signal }),

  // Listar por estado (paginado). Roles: ADMINISTRADOR, TESORERO. Query: estado (requerido).
  listarPorEstado: (estado, params, signal) => api.get('/api/v1/facturas', { params: { estado, ...params }, signal }),

  // Historial completo, sin filtrar (paginado, admite sort). Roles: ADMINISTRADOR, TESORERO.
  listarTodas: (params, signal) => api.get('/api/v1/facturas/todas', { params, signal }),

  // Versión HTML de la factura oficial (para ver en línea).
  html: (id, signal) => api.get(`/api/v1/facturas/${id}/html`, { signal }),

  // Descarga binaria del PDF de la factura. Devuelve la Response cruda (usar con descargarBlob).
  pdfRaw: (id, signal) => api.get(`/api/v1/facturas/${id}/pdf`, { signal, raw: true }),

  // Consulta pública vía código QR / número de factura. Sin autenticación.
  consultarPorQr: (numeroFactura, signal) =>
    api.get(`/api/v1/facturas/qr/${encodeURIComponent(numeroFactura)}`, { isPublic: true, signal }),
};

// Valores reales del enum EstadoFactura (backend).
export const ESTADOS_FACTURA = ['PENDIENTE', 'PAGADA_PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA'];
