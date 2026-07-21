import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, MessageCircle, Mail, MessageSquareText, Copy, Check, AlertTriangle, Pencil } from 'lucide-react';
import { AsociadosAPI } from '../../api/asociados';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  normalizarTelefono,
  esCorreoValido,
  construirEnlaceWhatsApp,
  construirEnlaceMailto,
  construirEnlaceSms,
  copiarAlPortapapeles,
  abrirEnlace,
} from '../../utils/notificarDocumento/canales';
import { generarMensaje, generarAsunto } from '../../utils/notificarDocumento/plantillas';
import { obtenerPrefs, obtenerConfigInstitucional } from '../../utils/notificarDocumento/prefs';
import { registrarHistorial, ESTADOS_HISTORIAL } from '../../utils/notificarDocumento/historial';

const CANALES = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle, estado: ESTADOS_HISTORIAL.WHATSAPP },
  { value: 'GMAIL', label: 'Gmail', icon: Mail, estado: ESTADOS_HISTORIAL.GMAIL },
  { value: 'SMS', label: 'SMS', icon: MessageSquareText, estado: ESTADOS_HISTORIAL.SMS },
  { value: 'COPIAR', label: 'Copiar', icon: Copy, estado: ESTADOS_HISTORIAL.COPIADA },
];

function numeroDocumento(documento) {
  return documento?.numeroFactura || documento?.numeroRecibo || '';
}

function nombreUsuarioActual(usuario) {
  if (!usuario) return 'Usuario';
  if (usuario.nombres) return `${usuario.nombres} ${usuario.apellidos || ''}`.trim();
  return usuario.username || usuario.email || 'Usuario';
}

/**
 * Modal reutilizable del módulo de Notificaciones Inteligentes.
 *
 * Props:
 * - open, onClose
 * - tipo: 'FACTURA' (por ahora; ver plantillas.js para agregar más tipos)
 * - documento: objeto del documento (ej. la factura)
 * - documentoId, documentoNumero: para el registro en historial
 * - asociadoId, asociadoNombre: datos del asociado dueño del documento
 * - telefonoRegistrado, correoRegistrado: opcional, si ya se tienen a mano
 *   (evita una llamada extra a AsociadosAPI)
 */
export default function NotificarModal({
  open,
  onClose,
  tipo = 'FACTURA',
  documento,
  documentoId,
  documentoNumero,
  asociadoId,
  asociadoNombre,
  telefonoRegistrado,
  correoRegistrado,
}) {
  const { usuario } = useAuth();
  const { toast } = useToast();

  const [cargandoAsociado, setCargandoAsociado] = useState(false);
  const [telefono, setTelefono] = useState(telefonoRegistrado || '');
  const [correo, setCorreo] = useState(correoRegistrado || '');

  const [canal, setCanal] = useState('WHATSAPP');
  const [origenDestinatario, setOrigenDestinatario] = useState('registrado'); // 'registrado' | 'manual'
  const [destinatarioManual, setDestinatarioManual] = useState('');

  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Cargar teléfono/correo del asociado si no vinieron ya como props.
  useEffect(() => {
    if (!open) return;
    setTelefono(telefonoRegistrado || '');
    setCorreo(correoRegistrado || '');

    if (telefonoRegistrado || correoRegistrado) return;

    if (asociadoId) {
      setCargandoAsociado(true);
      AsociadosAPI.obtener(asociadoId)
        .then((a) => {
          setTelefono(a?.telefonoPrincipal || a?.telefono || '');
          setCorreo(a?.correo || a?.email || '');
        })
        .catch(() => {
          // Si falla, el usuario puede escribir el destinatario manualmente.
        })
        .finally(() => setCargandoAsociado(false));
      return;
    }

    // Respaldo: si el documento no trae el id del asociado, intentamos ubicarlo
    // por nombre exacto. Solo se usa si hay una única coincidencia inequívoca;
    // de lo contrario se deja en manual para no arriesgar enviar al destinatario
    // equivocado.
    const nombreBusqueda = (asociadoNombre || documento?.asociadoNombre || '').trim();
    if (!nombreBusqueda) return;

    setCargandoAsociado(true);
    AsociadosAPI.buscar(nombreBusqueda)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        const coincidencias = lista.filter(
          (a) => `${a.nombres} ${a.apellidos}`.trim().toLowerCase() === nombreBusqueda.toLowerCase()
        );
        if (coincidencias.length === 1) {
          setTelefono(coincidencias[0]?.telefonoPrincipal || coincidencias[0]?.telefono || '');
          setCorreo(coincidencias[0]?.correo || coincidencias[0]?.email || '');
        }
      })
      .catch(() => {
        // Si falla, el usuario puede escribir el destinatario manualmente.
      })
      .finally(() => setCargandoAsociado(false));
  }, [open, asociadoId, asociadoNombre, documento, telefonoRegistrado, correoRegistrado]);

  // Generar el mensaje con la plantilla correspondiente al abrir el modal.
  useEffect(() => {
    if (!open || !documento) return;
    let cancelado = false;
    setGenerando(true);
    setEditando(false);

    obtenerConfigInstitucional()
      .then((institucional) => {
        if (cancelado) return;
        const prefs = obtenerPrefs();
        const texto = generarMensaje({ tipo, documento, asociadoNombre, institucional, prefs });
        setMensaje(texto);
      })
      .catch(() => {
        if (!cancelado) toast('No se pudo generar el mensaje automáticamente.', 'error');
      })
      .finally(() => {
        if (!cancelado) setGenerando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, documento, tipo, asociadoNombre]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    setCanal('WHATSAPP');
    setOrigenDestinatario('registrado');
    setDestinatarioManual('');
    setCopiado(false);
  }, [open]);

  const requiereCorreo = canal === 'GMAIL';

  const valorRegistrado = requiereCorreo ? correo : telefono;
  const hayRegistrado = requiereCorreo ? esCorreoValido(correo) : !!normalizarTelefono(telefono);

  const destinatarioFinal = origenDestinatario === 'registrado' ? valorRegistrado : destinatarioManual;

  const destinatarioValido = useMemo(() => {
    if (canal === 'COPIAR') return true;
    if (requiereCorreo) return esCorreoValido(destinatarioFinal);
    return !!normalizarTelefono(destinatarioFinal);
  }, [canal, requiereCorreo, destinatarioFinal]);

  if (!open) return null;

  const registrar = (estado) => {
    registrarHistorial({
      tipoDocumento: tipo,
      documentoId: documentoId ?? documento?.id,
      documentoNumero: documentoNumero ?? numeroDocumento(documento),
      asociadoNombre: asociadoNombre || documento?.asociadoNombre,
      canal,
      destinatario: canal === 'COPIAR' ? '—' : destinatarioFinal,
      usuario: nombreUsuarioActual(usuario),
      estado,
    });
  };

  const handleCopiar = async () => {
    const ok = await copiarAlPortapapeles(mensaje);
    if (ok) {
      setCopiado(true);
      registrar(ESTADOS_HISTORIAL.COPIADA);
      toast('Mensaje copiado correctamente.', 'success');
      setTimeout(() => setCopiado(false), 2000);
    } else {
      toast('No se pudo copiar el mensaje. Selecciónalo y cópialo manualmente.', 'error');
    }
  };

  const handleAbrirCanal = () => {
    if (!destinatarioValido) {
      toast('Ingresa un destinatario válido antes de continuar.', 'warning');
      return;
    }

    let url = null;
    let estado = null;
    if (canal === 'WHATSAPP') {
      url = construirEnlaceWhatsApp(destinatarioFinal, mensaje);
      estado = ESTADOS_HISTORIAL.WHATSAPP;
    } else if (canal === 'SMS') {
      url = construirEnlaceSms(destinatarioFinal, mensaje);
      estado = ESTADOS_HISTORIAL.SMS;
    } else if (canal === 'GMAIL') {
      url = construirEnlaceMailto(destinatarioFinal, generarAsunto({ tipo, documento }), mensaje);
      estado = ESTADOS_HISTORIAL.GMAIL;
    }

    if (!url) {
      toast('No se pudo preparar el enlace para este canal.', 'error');
      return;
    }

    abrirEnlace(url);
    registrar(estado);
    onClose();
  };

  const canalActivo = CANALES.find((c) => c.value === canal);

  return (
    <div className="fixed inset-0 z-[95] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Notificar</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {documentoNumero || numeroDocumento(documento) || generarAsunto({ tipo, documento: documento || {} })} ·{' '}
              {asociadoNombre || documento?.asociadoNombre}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto overscroll-contain custom-scroll space-y-5">
          {/* Selección de canal */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Medio de comunicación</p>
            <div className="grid grid-cols-4 gap-2">
              {CANALES.map((c) => {
                const Icon = c.icon;
                const activo = canal === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => {
                      setCanal(c.value);
                      setOrigenDestinatario('registrado');
                    }}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      activo
                        ? 'bg-brand border-brand text-white'
                        : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-brand hover:text-brand'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selección de destinatario */}
          {canal !== 'COPIAR' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                {requiereCorreo ? 'Correo del destinatario' : 'Número del destinatario'}
              </p>

              {cargandoAsociado ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Consultando datos del asociado…
                </div>
              ) : (
                <div className="space-y-2">
                  {hayRegistrado ? (
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={origenDestinatario === 'registrado'}
                        onChange={() => setOrigenDestinatario('registrado')}
                        className="accent-brand"
                      />
                      Usar el {requiereCorreo ? 'correo' : 'teléfono'} registrado: <span className="font-mono">{valorRegistrado}</span>
                    </label>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      El asociado no tiene {requiereCorreo ? 'correo' : 'teléfono'} registrado. Ingrésalo manualmente.
                    </p>
                  )}

                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                    <input
                      type="radio"
                      checked={origenDestinatario === 'manual'}
                      onChange={() => setOrigenDestinatario('manual')}
                      className="accent-brand"
                    />
                    Escribir {requiereCorreo ? 'un correo' : 'un número'} diferente
                  </label>

                  {origenDestinatario === 'manual' && (
                    <input
                      type={requiereCorreo ? 'email' : 'tel'}
                      value={destinatarioManual}
                      onChange={(e) => setDestinatarioManual(e.target.value)}
                      placeholder={requiereCorreo ? 'correo@ejemplo.com' : '300 123 4567'}
                      className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
                    />
                  )}

                  {!destinatarioValido && destinatarioFinal && (
                    <p className="text-xs text-red-500">
                      {requiereCorreo ? 'Ese correo no parece válido.' : 'Ese número no parece válido.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vista previa / edición del mensaje */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vista previa del mensaje</p>
              <button
                onClick={() => setEditando((v) => !v)}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" /> {editando ? 'Listo' : 'Editar'}
              </button>
            </div>

            {generando ? (
              <div className="flex items-center gap-2 text-gray-400 text-xs py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Generando mensaje…
              </div>
            ) : editando ? (
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={10}
                className="w-full px-3 py-2.5 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white font-mono"
              />
            ) : (
              <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg p-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scroll">
                {mensaje}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-dark-muted shrink-0 flex flex-wrap gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-muted hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors"
          >
            Cancelar
          </button>

          {canal === 'COPIAR' ? (
            <button
              onClick={handleCopiar}
              disabled={generando}
              className="flex-[2] flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark disabled:opacity-60 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiado ? 'Copiado' : 'Copiar mensaje'}
            </button>
          ) : (
            <button
              onClick={handleAbrirCanal}
              disabled={generando || !destinatarioValido}
              className="flex-[2] flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark disabled:opacity-40 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              {canalActivo && <canalActivo.icon className="w-4 h-4" />}
              Abrir {canalActivo?.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
