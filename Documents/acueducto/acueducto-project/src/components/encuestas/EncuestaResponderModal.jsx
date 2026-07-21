import { useEffect, useState } from 'react';
import { Loader2, Star, CheckCircle2, Lock } from 'lucide-react';
import SimpleModal from './SimpleModal';
import { EncuestasAPI } from '../../api/encuestas';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { yaRespondioEncuesta, marcarEncuestaRespondida } from '../../utils/encuestasLocal';

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-amber-400"
        >
          <Star className="w-6 h-6" fill={n <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function EncuestaResponderModal({ encuesta, onClose, onResponded }) {
  const [respuestas, setRespuestas] = useState({});
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const { toast } = useToast();
  const { usuario, isAuthenticated } = useAuth();

  // true si la encuesta es anónima (no pide nombre)
  const esAnonima = encuesta?.respuestasAnonimas === true || encuesta?.anonimas === true;
  // Si hay sesión, usar el nombre del usuario automáticamente
  const nombreAutomatic = isAuthenticated ? (usuario?.username || usuario?.nombre || '') : '';
  // Pedir nombre si no es anónima y no hay sesión
  const pedirNombre = !esAnonima && !isAuthenticated;
  // Si la encuesta tiene activada "respuesta única" (definido al crearla) y este navegador ya la respondió
  const yaRespondida = encuesta?.respuestaUnica === true && yaRespondioEncuesta(encuesta?.id);

  useEffect(() => {
    if (encuesta) {
      setRespuestas({});
      setNombre('');
      setEnviado(false);
    }
  }, [encuesta]);

  if (!encuesta) return null;

  const preguntasOrdenadas = (encuesta.preguntas || []).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const setRespuesta = (preguntaId, valor) => setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const faltantes = preguntasOrdenadas.filter(
      (p) => p.obligatoria && (respuestas[p.id] === undefined || respuestas[p.id] === '')
    );
    if (faltantes.length > 0) {
      toast('Responde las preguntas obligatorias antes de enviar.', 'warning');
      return;
    }
    if (pedirNombre && !nombre.trim()) {
      toast('Por favor ingresa tu nombre para continuar.', 'warning');
      return;
    }

    setEnviando(true);
    try {
      const nombreFinal = esAnonima ? undefined : (nombreAutomatic || nombre.trim() || undefined);
      const payload = {
        ...(nombreFinal ? { nombre: nombreFinal } : {}),
        respuestas: preguntasOrdenadas.map((p) => ({
          preguntaId: p.id,
          valor: respuestas[p.id] ?? '',
        })),
      };
      await EncuestasAPI.responder(encuesta.id, payload);
      if (encuesta.respuestaUnica === true) marcarEncuestaRespondida(encuesta.id);
      setEnviado(true);
      onResponded?.();
    } catch (err) {
      toast(err.message || 'No se pudo enviar tu respuesta.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SimpleModal
      open={!!encuesta}
      onClose={onClose}
      title={encuesta.titulo}
      maxWidth="max-w-xl"
      footer={
        !enviado &&
        !yaRespondida && (
          <>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/70 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={enviando}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors flex items-center gap-2"
            >
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
              {enviando ? 'Enviando…' : 'Enviar respuestas'}
            </button>
          </>
        )
      }
    >
      {yaRespondida ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400">Encuesta ya respondida</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Este formulario solo admite una respuesta por persona y ya enviaste la tuya desde este dispositivo.
          </p>
        </div>
      ) : enviado ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">¡Gracias por participar!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tu respuesta fue enviada correctamente.</p>
        </div>
      ) : (
        <>
          {encuesta.descripcion && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{encuesta.descripcion}</p>}

          {/* Nombre del respondiente */}
          {pedirNombre && (
            <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-1.5">
                Tu nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="¿Cómo te llamas?"
                className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-brand text-sm"
              />
            </div>
          )}
          {!esAnonima && isAuthenticated && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Respondiendo como <span className="font-semibold text-brand">{nombreAutomatic}</span>
            </p>
          )}

          <div className="space-y-6">
            {preguntasOrdenadas.map((p) => (
              <div key={p.id}>
                <label className="block text-base mb-2 text-gray-800 dark:text-white">
                  {p.texto} {p.obligatoria && <span className="text-red-500">*</span>}
                </label>

                {p.tipo === 'TEXTO_CORTO' && (
                  <input
                    type="text"
                    value={respuestas[p.id] || ''}
                    onChange={(e) => setRespuesta(p.id, e.target.value)}
                    placeholder="Tu respuesta"
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-brand"
                  />
                )}

                {p.tipo === 'TEXTO_LARGO' && (
                  <textarea
                    value={respuestas[p.id] || ''}
                    onChange={(e) => setRespuesta(p.id, e.target.value)}
                    placeholder="Tu respuesta"
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-brand resize-none"
                  />
                )}

                {p.tipo === 'SI_NO' && (
                  <div className="flex gap-3">
                    {['Sí', 'No'].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setRespuesta(p.id, op)}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          respuestas[p.id] === op
                            ? 'bg-brand text-white'
                            : 'bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                )}

                {['ESCALA', 'ESTRELLAS'].includes(p.tipo) && (
                  <StarRating value={respuestas[p.id] || 0} onChange={(v) => setRespuesta(p.id, v)} />
                )}

                {['OPCION_UNICA', 'OPCION_MULTIPLE', 'OPCIONES'].includes(p.tipo) && (
                  <div className="space-y-2">
                    {(p.opciones || []).map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setRespuesta(p.id, op)}
                        className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                          respuestas[p.id] === op
                            ? 'bg-brand/10 border-brand text-brand-dark dark:text-brand-light'
                            : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </SimpleModal>
  );
}
