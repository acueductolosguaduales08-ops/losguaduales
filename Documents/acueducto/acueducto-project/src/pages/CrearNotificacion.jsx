import { useState } from 'react';
import { BellPlus, Sparkles, Send, Image as ImageIcon, MonitorSmartphone } from 'lucide-react';
import Header from '../components/layout/Header';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { NotificacionesAPI } from '../api/notificaciones';
import {
  soportaNotificacionesSistema,
  permisoNotificaciones,
  solicitarPermisoNotificaciones,
  mostrarNotificacionSistema,
} from '../utils/notificacionesSistema';

function nowLocalInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inAMonthLocalInput() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const initialForm = {
  titulo: '',
  descripcionCorta: '',
  contenidoCompleto: '',
  tipo: 'PUBLICA',
  prioridad: 'BAJA',
  fechaPublicacion: nowLocalInput(),
  fechaVencimiento: inAMonthLocalInput(),
  destinatarioId: '',
  enlaceUrl: '',
  enviarFueraPagina: false,
};

// Valores reales que exige el backend para TipoNotificacion (ver swagger): PUBLICA, ASOCIADO, ADMINISTRATIVA.
// Se muestran como "Pública / Privada / Interna" porque es como se nombran en el resto de la app.
const TIPOS = [
  { value: 'PUBLICA', label: 'Pública', hint: 'Visible para todos' },
  { value: 'ASOCIADO', label: 'Privada', hint: 'Solo para un asociado puntual — requiere el ID de usuario destinatario' },
  { value: 'ADMINISTRATIVA', label: 'Interna', hint: 'Solo administradores o tesorería' },
];

const PRIORIDADES = ['BAJA', 'NORMAL', 'MEDIA', 'ALTA', 'URGENTE'];

const inputCls =
  'w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-brand transition-colors';

const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5';

export default function CrearNotificacion() {
  const { toast } = useToast();
  const { puedeEditar } = useAuth();
  const { refetchAll } = useNotifications();

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [permisoSistema, setPermisoSistema] = useState(() => permisoNotificaciones());

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'enlaceUrl') setImgError(false);
  };

  const handleToggleFueraPagina = async (e) => {
    const activar = e.target.checked;
    setForm((prev) => ({ ...prev, enviarFueraPagina: activar }));
    if (!activar) return;

    if (!soportaNotificacionesSistema()) {
      toast('Este navegador no soporta notificaciones del sistema.', 'warning');
      setForm((prev) => ({ ...prev, enviarFueraPagina: false }));
      return;
    }
    if (permisoSistema === 'default') {
      const resultado = await solicitarPermisoNotificaciones();
      setPermisoSistema(resultado);
      if (resultado !== 'granted') {
        toast('No se concedió el permiso; igual se enviará la marca a los destinatarios.', 'warning');
      }
    } else if (permisoSistema === 'denied') {
      toast('Tienes bloqueadas las notificaciones del navegador. Actívalas en los permisos del sitio para ver la vista previa.', 'warning');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.descripcionCorta || !form.contenidoCompleto) {
      toast('Completa título, descripción corta y contenido completo.', 'warning');
      return;
    }
    if (form.tipo === 'ASOCIADO' && !form.destinatarioId.trim()) {
      toast('Las notificaciones privadas requieren el ID de usuario destinatario.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await NotificacionesAPI.crear({
        titulo: form.titulo,
        descripcionCorta: form.descripcionCorta,
        contenidoCompleto: form.contenidoCompleto,
        tipo: form.tipo,
        prioridad: form.prioridad,
        fechaPublicacion: form.fechaPublicacion ? new Date(form.fechaPublicacion).toISOString() : new Date().toISOString(),
        fechaVencimiento: form.fechaVencimiento ? new Date(form.fechaVencimiento).toISOString() : null,
        destinatarioId: form.destinatarioId.trim() ? Number(form.destinatarioId.trim()) : null,
        enlaceUrl: form.enlaceUrl || null,
        // Campo adicional (best-effort): si el backend llega a soportarlo, permite
        // marcar cuáles notificaciones deben salir también fuera de la página.
        // Si el backend lo ignora, no afecta el resto del envío.
        notificarExterna: form.enviarFueraPagina,
      });
      toast('Notificación creada y publicada.', 'success');

      if (form.enviarFueraPagina && permisoNotificaciones() === 'granted') {
        // Confirmación inmediata para quien la crea: así ve exactamente cómo
        // llegará la notificación de sistema (logo, texto e imagen) a los
        // destinatarios (público/privada/interna, según el tipo elegido).
        mostrarNotificacionSistema({
          titulo: form.titulo,
          cuerpo: form.descripcionCorta,
          imagen: form.enlaceUrl || undefined,
        });
      }

      setForm({ ...initialForm, fechaPublicacion: nowLocalInput(), fechaVencimiento: inAMonthLocalInput() });
      setImgError(false);
      refetchAll();
    } catch (err) {
      toast(err.message || 'No se pudo crear la notificación.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!puedeEditar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <BellPlus className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores o tesorería pueden crear notificaciones. Inicia sesión con una cuenta autorizada.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-3xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <div className="flex items-center gap-2 mb-6">
          <BellPlus className="w-6 h-6 text-brand" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Crear notificación</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Módulo 11 · Avisos para asociados y administrativos</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200 dark:border-dark-muted">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 rounded">POST</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">/api/v1/notificaciones</span>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Formulario de creación
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Título de la notificación</label>
                <input
                  type="text"
                  required
                  value={form.titulo}
                  onChange={handleChange('titulo')}
                  placeholder="Título de la notificación"
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Descripción corta</label>
                <input
                  type="text"
                  required
                  value={form.descripcionCorta}
                  onChange={handleChange('descripcionCorta')}
                  placeholder="Resumen breve que se muestra en la lista"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Tipo</label>
                <select value={form.tipo} onChange={handleChange('tipo')} className={inputCls}>
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {TIPOS.find((t) => t.value === form.tipo)?.hint}
                </p>
              </div>

              <div>
                <label className={labelCls}>Prioridad</label>
                <select value={form.prioridad} onChange={handleChange('prioridad')} className={inputCls}>
                  {PRIORIDADES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {form.tipo === 'ASOCIADO' && (
                <div className="sm:col-span-2">
                  <label className={labelCls}>ID de usuario destinatario</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.destinatarioId}
                    onChange={handleChange('destinatarioId')}
                    placeholder="Número de ID"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    Debes conocer el ID numérico del usuario (no hay buscador por ahora, revisa el módulo de usuarios).
                  </p>
                </div>
              )}

              <div>
                <label className={labelCls}>Fecha publicación</label>
                <input
                  type="datetime-local"
                  required
                  value={form.fechaPublicacion}
                  onChange={handleChange('fechaPublicacion')}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Fecha vencimiento</label>
                <input
                  type="datetime-local"
                  value={form.fechaVencimiento}
                  onChange={handleChange('fechaVencimiento')}
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>
                  <span className="flex items-center justify-between">
                    <span>Enlace de imagen / recurso (enlaceUrl)</span>
                    <span className="text-[9px] text-brand font-normal lowercase normal-case">opcional</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={form.enlaceUrl}
                  onChange={handleChange('enlaceUrl')}
                  placeholder="https://..."
                  className={inputCls}
                />
                {form.enlaceUrl && (
                  <div className="mt-2 h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
                    {!imgError ? (
                      <img
                        src={form.enlaceUrl}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> No se pudo cargar la imagen
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enviarFueraPagina}
                    onChange={handleToggleFueraPagina}
                    className="mt-0.5 w-4 h-4 accent-brand shrink-0"
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-white">
                      <MonitorSmartphone className="w-4 h-4 text-brand" />
                      Enviar también fuera de la página
                    </span>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Además del aviso dentro de la app, se mostrará como notificación del sistema (logo,
                      título, descripción corta e imagen) a los destinatarios según el tipo elegido arriba
                      (Pública, Privada o Interna) — mismo alcance de siempre, solo que también sale fuera
                      de la página. Requiere que el destinatario tenga las notificaciones del navegador
                      activadas.
                    </span>
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Contenido completo (detalle extendido)</label>
                <textarea
                  rows={5}
                  required
                  value={form.contenidoCompleto}
                  onChange={handleChange('contenidoCompleto')}
                  placeholder="Escribe aquí los detalles del comunicado..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Publicando...' : 'Crear y publicar notificación'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
