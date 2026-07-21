import { api } from './client';

// Módulo 08 — Tesorería (pagos de facturas, multas, ingresos/gastos extraordinarios,
// anulación de movimientos y caja diaria). Base path: /api/v1/tesoreria
// Roles: ADMINISTRADOR, TESORERO (la anulación de movimientos es exclusiva del Administrador).
export const TesoreriaAPI = {
  // Registrar pago de factura. Operación atómica: actualiza la factura, crea el movimiento,
  // genera el recibo y notifica al asociado (Regla 8.5).
  // Body (RegistrarPagoRequest): { facturaId*, valor* (>0), metodoPagoId*, observaciones }.
  // Response (PagoResponse): { id, numeroFactura, asociadoId, valor, fecha, metodoPago, tesorero, numeroRecibo }.
  registrarPago: (payload) => api.post('/api/v1/tesoreria/pagos', payload),

  // Registrar multa. Body (MultaRequest): { asociadoId*, facturaId, motivo* (max 200), valor* (>0) }.
  registrarMulta: (payload) => api.post('/api/v1/tesoreria/multas', payload),

  // Listar multas de un asociado.
  listarMultasAsociado: (asociadoId, signal) =>
    api.get(`/api/v1/tesoreria/multas/asociado/${asociadoId}`, { signal }),

  // Registrar ingreso extraordinario (donaciones, reconexiones, afiliaciones, otros ingresos — Regla 8.4).
  // Body (MovimientoTesoreriaRequest): { valor*, metodoPagoId*, concepto* (max 200), categoria (max 60),
  //   observaciones, asociadoId, mesContableId*, comprobanteUrl }.
  registrarIngreso: (payload) => api.post('/api/v1/tesoreria/ingresos', payload),

  // Registrar gasto (servicios, materiales, reparaciones, personal, otros egresos — Regla 8.9).
  // Mismo shape de body que registrarIngreso.
  registrarGasto: (payload) => api.post('/api/v1/tesoreria/gastos', payload),

  // Anular movimiento. Exclusivo del Administrador (Regla 8.3). Query: motivo (requerido).
  anularMovimiento: (id, motivo) =>
    api.post(`/api/v1/tesoreria/movimientos/${id}/anular`, undefined, { params: { motivo } }),

  // Listar movimientos por tipo (ENTRADA | SALIDA), paginado.
  listarMovimientos: (tipo, params, signal) =>
    api.get('/api/v1/tesoreria/movimientos', { params: { tipo, ...params }, signal }),

  // Historial combinado (entradas y salidas juntas), paginado, admite sort (ej: fecha,desc).
  listarTodosMovimientos: (params, signal) => api.get('/api/v1/tesoreria/movimientos/todos', { params, signal }),

  // Caja diaria: ingresos, gastos, balance y conteo de movimientos del día actual (Regla 8.10).
  // Response (CajaDiariaResponse): { totalIngresos, totalGastos, balance, numeroMovimientos }.
  cajaDiaria: (signal) => api.get('/api/v1/tesoreria/caja-diaria', { signal }),
};

// Valores reales del enum TipoMovimiento (backend).
export const TIPOS_MOVIMIENTO = ['ENTRADA', 'SALIDA'];

// Valores reales del enum EstadoMulta (backend).
export const ESTADOS_MULTA = ['PENDIENTE', 'PAGADA', 'ANULADA'];
