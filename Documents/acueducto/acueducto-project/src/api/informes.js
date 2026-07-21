import { api } from './client';

// Módulo 16 — Informes (mensual, anual y de seguimiento a un asociado).
// Roles: ADMINISTRADOR, TESORERO (definido a nivel de clase en el backend).
// Base path: /api/v1/informes
export const InformesAPI = {
  // --- Informe de período: mes ---
  // Datos del informe mensual (JSON) — InformePeriodoResponse. Útil para previsualizar antes de generar el documento.
  periodoMes: (mesContableId, signal) => api.get(`/api/v1/informes/periodo/mes/${mesContableId}`, { signal }),

  // Versión HTML del informe mensual (para ver en línea).
  periodoMesHtml: (mesContableId, signal) => api.get(`/api/v1/informes/periodo/mes/${mesContableId}/html`, { signal }),

  // Descarga binaria del PDF del informe mensual. Devuelve la Response cruda (usar con descargarBlobDesdeResponse).
  periodoMesPdfRaw: (mesContableId, signal) =>
    api.get(`/api/v1/informes/periodo/mes/${mesContableId}/pdf`, { signal, raw: true }),

  // --- Informe de período: año ---
  // Datos del informe anual (JSON) — InformePeriodoResponse.
  periodoAnio: (anioContableId, signal) => api.get(`/api/v1/informes/periodo/anio/${anioContableId}`, { signal }),

  // Versión HTML del informe anual.
  periodoAnioHtml: (anioContableId, signal) => api.get(`/api/v1/informes/periodo/anio/${anioContableId}/html`, { signal }),

  // Descarga binaria del PDF del informe anual.
  periodoAnioPdfRaw: (anioContableId, signal) =>
    api.get(`/api/v1/informes/periodo/anio/${anioContableId}/pdf`, { signal, raw: true }),

  // --- Informe de seguimiento a un asociado ---
  // Datos del informe de seguimiento (JSON) — InformeAsociadoResponse.
  asociado: (asociadoId, signal) => api.get(`/api/v1/informes/asociado/${asociadoId}`, { signal }),

  // Versión HTML del informe de seguimiento al asociado.
  asociadoHtml: (asociadoId, signal) => api.get(`/api/v1/informes/asociado/${asociadoId}/html`, { signal }),

  // Descarga binaria del PDF del informe de seguimiento al asociado.
  asociadoPdfRaw: (asociadoId, signal) => api.get(`/api/v1/informes/asociado/${asociadoId}/pdf`, { signal, raw: true }),
};
