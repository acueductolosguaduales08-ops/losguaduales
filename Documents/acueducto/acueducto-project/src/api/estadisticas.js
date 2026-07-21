import { api } from './client';

// Módulo 14 — Estadísticas / Dashboard. Roles: ADMINISTRADOR, TESORERO.
// Base path: /api/v1/estadisticas
export const EstadisticasAPI = {
  // Dashboard general del sistema. Response body (DashboardResponse):
  // { asociadosActivos, asociadosSuspendidos, facturasPendientes, facturasVencidas,
  //   facturasPagadas, totalCarteraPendiente, ingresosMesActual, gastosMesActual,
  //   balanceMesActual, encuestasActivas }
  dashboard: (signal) => api.get('/api/v1/estadisticas/dashboard', { signal }),
};
