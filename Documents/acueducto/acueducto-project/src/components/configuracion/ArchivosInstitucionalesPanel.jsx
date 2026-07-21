import { useEffect, useState } from 'react';
import { Loader2, Link2, CheckCircle2, ImageOff, Trash2 } from 'lucide-react';
import { ConfiguracionAPI } from '../../api/configuracion';
import { useToast } from '../../context/ToastContext';

const TABS = [
  { value: 'LOGO', label: 'Logo' },
  { value: 'FIRMA', label: 'Firma' },
  { value: 'SELLO', label: 'Sello' },
];

export default function ArchivosInstitucionalesPanel() {
  const { toast } = useToast();
  const [tipoActivo, setTipoActivo] = useState('LOGO');
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urlNueva, setUrlNueva] = useState('');
  const [nombreUrlNueva, setNombreUrlNueva] = useState('');
  const [registrandoUrl, setRegistrandoUrl] = useState(false);
  const [activandoId, setActivandoId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  const cargar = (tipo = tipoActivo) => {
    setLoading(true);
    ConfiguracionAPI.listarArchivos(tipo)
      .then((data) => setArchivos(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => toast(err.message || 'No se pudieron cargar los archivos.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar(tipoActivo);
  }, [tipoActivo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegistrarUrl = async (e) => {
    e.preventDefault();
    if (!urlNueva.trim()) {
      toast('Pega la URL de la imagen.', 'warning');
      return;
    }
    setRegistrandoUrl(true);
    try {
      await ConfiguracionAPI.registrarArchivoUrl(tipoActivo, urlNueva.trim(), nombreUrlNueva.trim() || undefined);
      toast('Imagen registrada.', 'success');
      setUrlNueva('');
      setNombreUrlNueva('');
      cargar(tipoActivo);
    } catch (err) {
      toast(err.message || 'No se pudo registrar la imagen.', 'error');
    } finally {
      setRegistrandoUrl(false);
    }
  };

  const handleActivar = async (archivo) => {
    setActivandoId(archivo.id);
    try {
      await ConfiguracionAPI.activarArchivo(archivo.id);
      setArchivos((prev) => prev.map((a) => ({ ...a, activo: a.id === archivo.id })));
      toast(`${TABS.find((t) => t.value === tipoActivo)?.label} activado.`, 'success');
    } catch (err) {
      toast(err.message || 'No se pudo activar el archivo.', 'error');
    } finally {
      setActivandoId(null);
    }
  };

  const handleEliminar = async (archivo) => {
    setEliminandoId(archivo.id);
    try {
      await ConfiguracionAPI.eliminarArchivo(archivo.id);
      setArchivos((prev) => prev.filter((a) => a.id !== archivo.id));
      toast('Imagen eliminada de la lista.', 'success');
    } catch (err) {
      toast(err.message || 'No se pudo eliminar.', 'error');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide mb-1">
          Archivos institucionales
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Pega el enlace de una imagen en internet (igual que en las publicaciones); el logo, firma y sello
          activos se usarán en las facturas y documentos generados.
        </p>
      </div>

      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTipoActivo(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              tipoActivo === t.value
                ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleRegistrarUrl} className="flex flex-col gap-2 border border-gray-200 dark:border-dark-muted rounded-lg p-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
          <Link2 className="w-3.5 h-3.5" /> Registrar imagen desde URL
        </div>
        <input
          type="url"
          value={urlNueva}
          onChange={(e) => setUrlNueva(e.target.value)}
          placeholder="https://…"
          className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-1.5 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-brand"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={nombreUrlNueva}
            onChange={(e) => setNombreUrlNueva(e.target.value)}
            placeholder="Nombre (opcional)"
            className="flex-grow bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-1.5 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={registrandoUrl}
            className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-xs font-semibold shrink-0"
          >
            {registrandoUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Registrar'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando archivos…</span>
        </div>
      )}

      {!loading && archivos.length === 0 && (
        <div className="text-center py-8">
          <ImageOff className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No hay {TABS.find((t) => t.value === tipoActivo)?.label.toLowerCase()} registrado todavía.
          </p>
        </div>
      )}

      {!loading && archivos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {archivos.map((a) => (
            <div
              key={a.id}
              className={`relative rounded-lg border p-3 flex flex-col items-center gap-2 transition-colors ${
                a.activo
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg'
              }`}
            >
              {a.activo && (
                <span className="absolute top-1.5 right-1.5 text-brand">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              )}
              {!a.activo && (
                <button
                  onClick={() => handleEliminar(a)}
                  disabled={eliminandoId === a.id}
                  title="Quitar de la lista"
                  className="absolute top-1.5 left-1.5 text-gray-300 hover:text-red-500 disabled:opacity-60"
                >
                  {eliminandoId === a.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              <div className="w-16 h-16 rounded bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted flex items-center justify-center overflow-hidden">
                {a.ruta ? (
                  <img src={a.ruta} alt={a.nombreArchivo} className="w-full h-full object-contain" />
                ) : (
                  <ImageOff className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 text-center truncate w-full" title={a.nombreArchivo}>
                {a.nombreArchivo}
              </p>
              <button
                onClick={() => handleActivar(a)}
                disabled={a.activo || activandoId === a.id}
                className="text-[11px] font-semibold px-2 py-1 rounded-full border w-full transition-colors disabled:opacity-60 border-gray-300 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-muted disabled:hover:bg-transparent"
              >
                {activandoId === a.id ? (
                  <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                ) : a.activo ? (
                  'En uso'
                ) : (
                  'Usar este'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
