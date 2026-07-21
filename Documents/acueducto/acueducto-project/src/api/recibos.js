import { api } from './client';

// Módulo 09 — Recibos (comprobantes generados automáticamente al registrar un pago).
// Base path: /api/v1/recibos
//
// Nota: el endpoint público GET /api/v1/recibos/qr/{numeroRecibo} (consulta vía código QR)
// ya está implementado en HomeAPI.consultarRecibo y disponible sin autenticación desde la
// pantalla de inicio (tarjeta "Consultar factura o recibo" y el escáner de /escanear-qr),
// por lo que no se duplica aquí.
export const RecibosAPI = {
  // Listar recibos de un asociado (paginado). Roles: ADMINISTRADOR, TESORERO, ASOCIADO (propio).
  listarPorAsociado: (asociadoId, params, signal) =>
    api.get(`/api/v1/recibos/asociado/${asociadoId}`, { params, signal }),

  // Ver recibo en HTML (versión oficial en línea). Roles: ADMINISTRADOR, TESORERO, ASOCIADO.
  html: (numeroRecibo, signal) =>
    api.get(`/api/v1/recibos/${encodeURIComponent(numeroRecibo)}/html`, { signal }),

  // Descargar recibo en PDF. Devuelve la Response cruda (usar con descargarBlobDesdeResponse).
  pdfRaw: (numeroRecibo, signal) =>
    api.get(`/api/v1/recibos/${encodeURIComponent(numeroRecibo)}/pdf`, { signal, raw: true }),
};

// Valores reales del enum EstadoRecibo (backend).
export const ESTADOS_RECIBO = ['EMITIDO', 'ANULADO'];
