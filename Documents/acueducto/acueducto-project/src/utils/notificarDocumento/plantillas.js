import { NOMBRES_MESES } from '../../api/periodos';

// Plantillas del módulo de Notificaciones Inteligentes.
// Cada función recibe datos reales del documento + configuración institucional
// + preferencias de redacción, y devuelve el texto final del mensaje.
// Los ejemplos del documento de especificación son solo referencia: aquí se
// generan con datos reales y un formato más limpio.

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente de pago',
  PAGADA_PARCIAL: 'Con abono parcial',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
};

function formatCOP(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function periodoDesdeFecha(iso) {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return `${NOMBRES_MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// Envuelve un emoji: si el usuario desactivó los emojis, devuelve cadena vacía.
function emoji(simbolo, usarEmojis) {
  return usarEmojis ? `${simbolo} ` : '';
}

function lineaFirma({ institucional, prefs }) {
  if (prefs.firma?.trim()) return prefs.firma.trim();
  const nombre = institucional?.nombreAcueducto || 'el Acueducto';
  return `El equipo de ${nombre}`;
}

function lineasContacto({ institucional, prefs }) {
  if (!prefs.incluirInstruccionesPago && !institucional?.telefonoPrincipal && !institucional?.correo) return [];
  const lineas = [];
  if (institucional?.telefonoPrincipal) lineas.push(`${emoji('📞', prefs.usarEmojis)}Tel: ${institucional.telefonoPrincipal}`);
  if (institucional?.correo) lineas.push(`${emoji('📧', prefs.usarEmojis)}Correo: ${institucional.correo}`);
  if (prefs.horarioAtencion?.trim()) lineas.push(`${emoji('🕒', prefs.usarEmojis)}Horario: ${prefs.horarioAtencion.trim()}`);
  return lineas;
}

function generarMensajeFactura({ documento: f, asociadoNombre, institucional, prefs }) {
  const nombreAcueducto = institucional?.nombreAcueducto || 'el Acueducto';
  const nombre = asociadoNombre || f.asociadoNombre || 'asociado(a)';
  const periodo = periodoDesdeFecha(f.fechaEmision);

  const lineas = [];
  lineas.push(`${emoji('💧', prefs.usarEmojis)}${prefs.saludo}, ${nombre}!`);
  lineas.push('');
  lineas.push(`Le informamos que su factura de ${nombreAcueducto} ya está disponible.`);
  lineas.push('');
  lineas.push(`${emoji('🧾', prefs.usarEmojis)}Factura No. ${f.numeroFactura}`);
  if (periodo) lineas.push(`${emoji('📅', prefs.usarEmojis)}Periodo: ${periodo}`);
  lineas.push(`Fecha de emisión: ${formatFecha(f.fechaEmision)}`);
  if (f.consumoM3 != null) lineas.push(`${emoji('💦', prefs.usarEmojis)}Consumo: ${f.consumoM3} m³`);
  if (f.valorConsumo != null) lineas.push(`${emoji('💰', prefs.usarEmojis)}Valor consumo: ${formatCOP(f.valorConsumo)}`);
  if (f.cargoAdministracion) lineas.push(`Cargo de administración: ${formatCOP(f.cargoAdministracion)}`);
  if (f.valoresAdicionales > 0) lineas.push(`Conceptos adicionales: ${formatCOP(f.valoresAdicionales)}`);
  if (f.totalMultas > 0) lineas.push(`${emoji('⚠️', prefs.usarEmojis)}Multas: ${formatCOP(f.totalMultas)}`);
  lineas.push(`${emoji('💵', prefs.usarEmojis)}Total a pagar: ${formatCOP(f.total)}`);
  if (f.estado === 'PAGADA_PARCIAL') lineas.push(`Saldo pendiente: ${formatCOP(f.saldoPendiente)}`);
  lineas.push(`Estado: ${ESTADO_LABEL[f.estado] || f.estado}`);
  if (f.fechaLimitePago && f.estado !== 'PAGADA') {
    lineas.push(`${emoji('📆', prefs.usarEmojis)}Fecha límite de pago: ${formatFecha(f.fechaLimitePago)}`);
  }

  if (prefs.incluirInstruccionesPago && f.estado !== 'PAGADA' && f.estado !== 'ANULADA') {
    if (institucional?.banco && institucional?.numeroCuenta) {
      lineas.push('');
      lineas.push('Puede realizar su pago a través de:');
      lineas.push(`${institucional.banco} — ${institucional.tipoCuenta || 'Cuenta'} No. ${institucional.numeroCuenta}`);
      if (institucional.titularCuenta) lineas.push(`A nombre de: ${institucional.titularCuenta}`);
    }
  }

  const contacto = lineasContacto({ institucional, prefs });
  if (contacto.length) {
    lineas.push('');
    lineas.push('Cualquier inquietud, contáctenos:');
    lineas.push(...contacto);
  }

  lineas.push('');
  lineas.push(`${emoji('🙏', prefs.usarEmojis)}Gracias por hacer parte de ${nombreAcueducto}.`);
  lineas.push(lineaFirma({ institucional, prefs }));

  return lineas.join('\n');
}

function generarMensajeRecibo({ documento: r, asociadoNombre, institucional, prefs }) {
  const nombreAcueducto = institucional?.nombreAcueducto || 'el Acueducto';
  const nombre = asociadoNombre || r.asociadoNombre || 'asociado(a)';

  const lineas = [];
  lineas.push(`${emoji('✅', prefs.usarEmojis)}¡Pago recibido con éxito!`);
  lineas.push('');
  lineas.push(`Estimado(a) ${nombre},`);
  lineas.push(`Confirmamos la recepción de su pago en ${nombreAcueducto}.`);
  lineas.push('');
  lineas.push(`${emoji('🧾', prefs.usarEmojis)}Recibo No. ${r.numeroRecibo}`);
  if (r.numeroFactura) lineas.push(`Factura relacionada: ${r.numeroFactura}`);
  lineas.push(`${emoji('💰', prefs.usarEmojis)}Valor pagado: ${formatCOP(r.valor)}`);
  if (r.metodoPago) lineas.push(`${emoji('💳', prefs.usarEmojis)}Medio de pago: ${r.metodoPago}`);
  lineas.push(`${emoji('📅', prefs.usarEmojis)}Fecha: ${formatFecha(r.fechaEmision)}`);
  if (r.saldoPendiente > 0) lineas.push(`Saldo restante en la factura: ${formatCOP(r.saldoPendiente)}`);

  const contacto = lineasContacto({ institucional, prefs });
  if (contacto.length) {
    lineas.push('');
    lineas.push('Cualquier inquietud, contáctenos:');
    lineas.push(...contacto);
  }

  lineas.push('');
  lineas.push(`${emoji('🙏', prefs.usarEmojis)}Gracias por mantener sus pagos al día.`);
  lineas.push(lineaFirma({ institucional, prefs }));

  return lineas.join('\n');
}

function generarMensajeMulta({ documento: m, asociadoNombre, institucional, prefs }) {
  const nombreAcueducto = institucional?.nombreAcueducto || 'el Acueducto';
  const nombre = asociadoNombre || 'asociado(a)';

  const lineas = [];
  lineas.push(`${emoji('⚠️', prefs.usarEmojis)}${prefs.saludo}, ${nombre}.`);
  lineas.push('');
  lineas.push(`Le informamos que se ha registrado una multa a su cuenta en ${nombreAcueducto}.`);
  lineas.push('');
  lineas.push(`Motivo: ${m.motivo}`);
  lineas.push(`${emoji('💰', prefs.usarEmojis)}Valor: ${formatCOP(m.valor)}`);
  lineas.push(`${emoji('📅', prefs.usarEmojis)}Fecha: ${formatFecha(m.fecha)}`);
  if (m.estado) lineas.push(`Estado: ${m.estado === 'PENDIENTE' ? 'Pendiente de pago' : m.estado}`);
  lineas.push('');
  lineas.push('Este valor se sumará a su próxima factura. Si tiene dudas sobre este cobro, contáctenos.');

  const contacto = lineasContacto({ institucional, prefs });
  if (contacto.length) {
    lineas.push('');
    lineas.push(...contacto);
  }

  lineas.push('');
  lineas.push(lineaFirma({ institucional, prefs }));

  return lineas.join('\n');
}

function generarMensajeSuspension({ documento: s, asociadoNombre, institucional, prefs }) {
  const nombreAcueducto = institucional?.nombreAcueducto || 'el Acueducto';
  const nombre = asociadoNombre || 'asociado(a)';

  const lineas = [];
  lineas.push(`${emoji('🚫', prefs.usarEmojis)}${prefs.saludo}, ${nombre}.`);
  lineas.push('');
  lineas.push(`Le informamos que su servicio de acueducto con ${nombreAcueducto} ha sido suspendido.`);
  lineas.push('');
  if (s.motivo) lineas.push(`Motivo: ${s.motivo}`);
  lineas.push(`${emoji('📅', prefs.usarEmojis)}Fecha de suspensión: ${formatFecha(s.fecha)}`);
  lineas.push('');
  lineas.push('Para conocer el valor pendiente y el procedimiento de reactivación, por favor contáctenos:');

  const contacto = lineasContacto({ institucional, prefs });
  if (contacto.length) lineas.push(...contacto);

  lineas.push('');
  lineas.push('Quedamos atentos para ayudarle a normalizar su servicio lo antes posible.');
  lineas.push(lineaFirma({ institucional, prefs }));

  return lineas.join('\n');
}

function generarMensajeReactivacion({ documento: r, asociadoNombre, institucional, prefs }) {
  const nombreAcueducto = institucional?.nombreAcueducto || 'el Acueducto';
  const nombre = asociadoNombre || 'asociado(a)';

  const lineas = [];
  lineas.push(`${emoji('✅', prefs.usarEmojis)}${prefs.saludo}, ${nombre}!`);
  lineas.push('');
  lineas.push(`Le confirmamos que su servicio de acueducto con ${nombreAcueducto} ha sido reactivado.`);
  lineas.push('');
  lineas.push(`${emoji('📅', prefs.usarEmojis)}Fecha de reactivación: ${formatFecha(r.fecha)}`);
  if (r.motivo) lineas.push(`Motivo: ${r.motivo}`);

  const contacto = lineasContacto({ institucional, prefs });
  if (contacto.length) {
    lineas.push('');
    lineas.push(...contacto);
  }

  lineas.push('');
  lineas.push(`${emoji('🙏', prefs.usarEmojis)}Gracias por ponerse al día con ${nombreAcueducto}.`);
  lineas.push(lineaFirma({ institucional, prefs }));

  return lineas.join('\n');
}

// Registro de plantillas disponibles por tipo de documento.
const GENERADORES = {
  FACTURA: generarMensajeFactura,
  RECIBO: generarMensajeRecibo,
  MULTA: generarMensajeMulta,
  SUSPENSION: generarMensajeSuspension,
  REACTIVACION: generarMensajeReactivacion,
};

export const TIPOS_DOCUMENTO_DISPONIBLES = Object.keys(GENERADORES);

export function generarAsunto({ tipo, documento }) {
  if (tipo === 'FACTURA') return `Factura ${documento.numeroFactura}`;
  if (tipo === 'RECIBO') return `Recibo de pago ${documento.numeroRecibo}`;
  if (tipo === 'MULTA') return 'Multa registrada en su cuenta';
  if (tipo === 'SUSPENSION') return 'Suspensión de su servicio de acueducto';
  if (tipo === 'REACTIVACION') return 'Reactivación de su servicio de acueducto';
  return 'Notificación';
}

export function generarMensaje({ tipo, documento, asociadoNombre, institucional, prefs }) {
  const generador = GENERADORES[tipo];
  if (!generador) {
    throw new Error(`Aún no hay una plantilla para el tipo de documento "${tipo}".`);
  }
  return generador({ documento, asociadoNombre, institucional, prefs });
}
