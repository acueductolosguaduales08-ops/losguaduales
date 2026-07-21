import { useEffect, useMemo, useState } from 'react';
import { Loader2, User, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import SimpleModal from './SimpleModal';
import { EncuestasAPI } from '../../api/encuestas';
import { useToast } from '../../context/ToastContext';

// Agrupa las respuestas de todas las personas por pregunta, contando cuántas veces
// se repite cada valor (ignorando mayúsculas/minúsculas y espacios al comparar,
// para que respuestas "iguales o similares" queden agrupadas).
function agruparRespuestasPorPregunta(respuestas) {
  const porPregunta = new Map();

  (respuestas || []).forEach((persona) => {
    (persona.respuestas || []).forEach((r) => {
      const valor = (r.valor ?? '').toString().trim();
      if (!valor) return;
      const clave = valor.toLowerCase();

      if (!porPregunta.has(r.preguntaId)) {
        porPregunta.set(r.preguntaId, { texto: r.pregunta, conteos: new Map(), total: 0 });
      }
      const entry = porPregunta.get(r.preguntaId);
      entry.total += 1;
      if (!entry.conteos.has(clave)) {
        entry.conteos.set(clave, { label: valor, count: 0 });
      }
      entry.conteos.get(clave).count += 1;
    });
  });

  return Array.from(porPregunta.values()).map((p) => ({
    texto: p.texto,
    total: p.total,
    opciones: Array.from(p.conteos.values()).sort((a, b) => b.count - a.count),
  }));
}

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function RespuestaItem({ item }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
              {item.nombreRespondiente || 'Anónimo'}
            </p>
            <p className="text-xs text-gray-400">{formatFecha(item.fecha)}</p>
          </div>
        </div>
        {abierto ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
        )}
      </button>

      {abierto && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
          {(item.respuestas || []).map((r) => (
            <div key={r.preguntaId} className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{r.pregunta}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white">{r.valor || '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResumenPregunta({ texto, total, opciones }) {
  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">{texto}</p>
      <div className="space-y-2">
        {opciones.map((op) => {
          const porcentaje = total > 0 ? Math.round((op.count / total) * 100) : 0;
          return (
            <div key={op.label}>
              <div className="flex justify-between items-baseline text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-200 truncate mr-2">{op.label}</span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                  {op.count} ({porcentaje}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full" style={{ width: `${porcentaje}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EncuestaRespuestasModal({ encuesta, onClose }) {
  const [respuestas, setRespuestas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState('resumen'); // 'resumen' | 'individual'
  const { toast } = useToast();

  const resumen = useMemo(() => agruparRespuestasPorPregunta(respuestas), [respuestas]);

  useEffect(() => {
    if (!encuesta) return;
    setRespuestas(null);
    setLoading(true);
    EncuestasAPI.listarRespuestas(encuesta.id)
      .then(setRespuestas)
      .catch(() => toast('No se pudieron cargar las respuestas.', 'error'))
      .finally(() => setLoading(false));
  }, [encuesta]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SimpleModal
      open={!!encuesta}
      onClose={onClose}
      title={encuesta ? `Respuestas: ${encuesta.titulo}` : 'Respuestas'}
      maxWidth="max-w-lg"
    >
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && respuestas && respuestas.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">Aún no hay respuestas registradas.</p>
      )}

      {!loading && respuestas && respuestas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {respuestas.length} respuesta{respuestas.length !== 1 ? 's' : ''} recibida{respuestas.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-1 bg-gray-100 dark:bg-dark-bg p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setVista('resumen')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                  vista === 'resumen' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Resumen
              </button>
              <button
                type="button"
                onClick={() => setVista('individual')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                  vista === 'individual' ? 'bg-white dark:bg-dark-card text-brand shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Por persona
              </button>
            </div>
          </div>

          {vista === 'resumen' && (
            <div className="space-y-3">
              {resumen.map((p) => (
                <ResumenPregunta key={p.texto} texto={p.texto} total={p.total} opciones={p.opciones} />
              ))}
            </div>
          )}

          {vista === 'individual' &&
            respuestas.map((item) => <RespuestaItem key={item.id} item={item} />)}
        </div>
      )}
    </SimpleModal>
  );
}
