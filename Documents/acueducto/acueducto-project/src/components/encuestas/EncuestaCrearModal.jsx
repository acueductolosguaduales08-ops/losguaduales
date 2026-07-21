import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import SimpleModal from './SimpleModal';
import { EncuestasAPI, TIPOS_PREGUNTA, normalizarTipoPregunta } from '../../api/encuestas';
import { useToast } from '../../context/ToastContext';

function nuevaPregunta(orden) {
  return {
    _key: Math.random().toString(36).slice(2),
    texto: '',
    tipo: 'TEXTO_CORTO',
    obligatoria: true,
    orden,
    opciones: [],
  };
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-300 dark:bg-dark-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
    </label>
  );
}

export default function EncuestaCrearModal({ open, onClose, onCreated }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [publico, setPublico] = useState(true);
  const [requiereAutenticacion, setRequiereAutenticacion] = useState(false);
  const [respuestaUnica, setRespuestaUnica] = useState(true);
  const [respuestasAnonimas, setRespuestasAnonimas] = useState(true);
  const [preguntas, setPreguntas] = useState([nuevaPregunta(0)]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setTitulo('');
    setDescripcion('');
    setFechaInicio('');
    setFechaFin('');
    setPublico(true);
    setRequiereAutenticacion(false);
    setRespuestaUnica(true);
    setRespuestasAnonimas(true);
    setPreguntas([nuevaPregunta(0)]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addPregunta = () => setPreguntas((prev) => [...prev, nuevaPregunta(prev.length)]);

  const removePregunta = (key) => setPreguntas((prev) => prev.filter((p) => p._key !== key));

  const updatePregunta = (key, patch) =>
    setPreguntas((prev) => prev.map((p) => (p._key === key ? { ...p, ...patch } : p)));

  const addOpcion = (key) => {
    updatePregunta(key, { opciones: [...(preguntas.find((p) => p._key === key)?.opciones || []), ''] });
  };

  const updateOpcion = (key, index, value) => {
    updatePregunta(key, {
      opciones: (preguntas.find((p) => p._key === key)?.opciones || []).map((op, i) => (i === index ? value : op)),
    });
  };

  const removeOpcion = (key, index) => {
    updatePregunta(key, {
      opciones: (preguntas.find((p) => p._key === key)?.opciones || []).filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast('El título es obligatorio.', 'warning');
      return;
    }
    if (preguntas.some((p) => !p.texto.trim())) {
      toast('Todas las preguntas necesitan un texto.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        publico,
        requiereAutenticacion,
        respuestaUnica,
        respuestasAnonimas,
        fechaInicio: fechaInicio ? new Date(fechaInicio).toISOString() : undefined,
        fechaFin: fechaFin ? new Date(fechaFin).toISOString() : undefined,
        preguntas: preguntas.map(({ _key, ...p }, i) => ({
          ...p,
          tipo: normalizarTipoPregunta(p.tipo),
          orden: i,
        })),
      };
      await EncuestasAPI.crear(payload);
      toast('Formulario creado correctamente.', 'success');
      onCreated?.();
      handleClose();
    } catch (err) {
      toast(err.message || 'No se pudo crear el formulario.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SimpleModal open={open} onClose={handleClose} title="Crear nuevo formulario" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título de la encuesta"
              className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Escribe una breve descripción…"
              className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 h-20 text-gray-800 dark:text-white outline-none focus:border-brand resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha inicio</label>
              <input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-brand [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Fecha fin</label>
              <input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-brand [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-gray-100 dark:border-gray-700/50 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Configuración general</h4>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Formulario público</span>
            <Toggle checked={publico} onChange={() => setPublico((v) => !v)} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Requiere autenticación</span>
            <Toggle checked={requiereAutenticacion} onChange={() => setRequiereAutenticacion((v) => !v)} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Respuesta única</span>
            <Toggle checked={respuestaUnica} onChange={() => setRespuestaUnica((v) => !v)} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Respuestas anónimas</span>
            <Toggle checked={respuestasAnonimas} onChange={() => setRespuestasAnonimas((v) => !v)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Preguntas</h4>
            <button
              type="button"
              onClick={addPregunta}
              className="text-brand text-sm hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Añadir
            </button>
          </div>

          {preguntas.map((p, index) => (
            <div
              key={p._key}
              className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 p-4 rounded-lg relative group"
            >
              {preguntas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePregunta(p._key)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={p.texto}
                    onChange={(e) => updatePregunta(p._key, { texto: e.target.value })}
                    placeholder={`Pregunta ${index + 1}`}
                    className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-white outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <select
                    value={p.tipo}
                    onChange={(e) => updatePregunta(p._key, { tipo: e.target.value })}
                    className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-white outline-none focus:border-brand"
                  >
                    {TIPOS_PREGUNTA.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {['OPCION_UNICA', 'OPCION_MULTIPLE', 'OPCIONES'].includes(p.tipo) && (
                <div className="mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Opciones</p>
                    <button
                      type="button"
                      onClick={() => addOpcion(p._key)}
                      className="text-brand text-xs hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar opción
                    </button>
                  </div>

                  {(p.opciones || []).map((opcion, idx) => (
                    <div key={`${p._key}-${idx}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opcion}
                        onChange={(e) => updateOpcion(p._key, idx, e.target.value)}
                        placeholder={`Opción ${idx + 1}`}
                        className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-white outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => removeOpcion(p._key, idx)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {(!p.opciones || p.opciones.length === 0) && (
                    <p className="text-xs text-gray-400">Agrega al menos una opción para esta pregunta.</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`req-${p._key}`}
                  checked={p.obligatoria}
                  onChange={(e) => updatePregunta(p._key, { obligatoria: e.target.checked })}
                  className="rounded bg-white dark:bg-dark-card border-gray-300 dark:border-gray-600 text-brand focus:ring-brand"
                />
                <label htmlFor={`req-${p._key}`} className="text-xs text-gray-500 dark:text-gray-400">
                  Obligatoria
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/70 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando…' : 'Guardar formulario'}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
}
