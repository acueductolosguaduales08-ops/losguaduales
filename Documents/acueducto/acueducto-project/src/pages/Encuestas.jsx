import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EncuestasAPI } from '../api/encuestas';
import EncuestaAdminCard from '../components/encuestas/EncuestaAdminCard';
import EncuestaPublicCard from '../components/encuestas/EncuestaPublicCard';
import EncuestaQrModal from '../components/encuestas/EncuestaQrModal';
import EncuestaPreguntasModal from '../components/encuestas/EncuestaPreguntasModal';
import EncuestaStatsModal from '../components/encuestas/EncuestaStatsModal';
import EncuestaCrearModal from '../components/encuestas/EncuestaCrearModal';
import EncuestaResponderModal from '../components/encuestas/EncuestaResponderModal';
import EncuestaRespuestasModal from '../components/encuestas/EncuestaRespuestasModal';

export default function Encuestas() {
  const { puedeEditar } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(puedeEditar ? 'admin' : 'publico');
  const [adminItems, setAdminItems] = useState([]);
  const [publicItems, setPublicItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const codigo = searchParams.get('codigo');

  const [qrEncuesta, setQrEncuesta] = useState(null);
  const [preguntasEncuesta, setPreguntasEncuesta] = useState(null);
  const [statsEncuesta, setStatsEncuesta] = useState(null);
  const [respuestasEncuesta, setRespuestasEncuesta] = useState(null);
  const [responderEncuesta, setResponderEncuesta] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);

  const cargarAdmin = () => {
    if (!puedeEditar) return;
    EncuestasAPI.listarAdmin()
      .then((data) => setAdminItems(data || []))
      .catch(() => toast('No se pudieron cargar los formularios.', 'error'));
  };

  const cargarPublicas = () => {
    EncuestasAPI.listarPublicas()
      .then((data) => setPublicItems(data || []))
      .catch(() => toast('No se pudieron cargar las encuestas activas.', 'error'));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([puedeEditar ? EncuestasAPI.listarAdmin() : Promise.resolve([]), EncuestasAPI.listarPublicas()])
      .then(([admin, publicas]) => {
        setAdminItems(admin || []);
        setPublicItems(publicas || []);
      })
      .catch(() => toast('No se pudieron cargar las encuestas.', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!codigo) return;

    let activo = true;
    setLoading(true);
    EncuestasAPI.porCodigo(codigo)
      .then((encuesta) => {
        if (!activo) return;
        if (encuesta) {
          setResponderEncuesta(encuesta);
          setTab('publico');
        } else {
          toast('No se encontró ese formulario.', 'warning');
        }
      })
      .catch(() => {
        if (activo) toast('No se pudo abrir el formulario desde el QR.', 'error');
      })
      .finally(() => {
        if (activo) {
          setSearchParams({}, { replace: true });
          setLoading(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [codigo, searchParams, setSearchParams, toast]);

  const handleToggleActiva = async (encuesta) => {
    setBusyId(encuesta.id);
    try {
      if (encuesta.estado === 'ACTIVA') {
        await EncuestasAPI.desactivar(encuesta.id);
        toast('Formulario desactivado.', 'success');
      } else {
        await EncuestasAPI.activar(encuesta.id);
        toast('Formulario activado.', 'success');
      }
      cargarAdmin();
      cargarPublicas();
    } catch (err) {
      toast(err.message || 'No se pudo cambiar el estado.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleArchivar = async (encuesta) => {
    if (!window.confirm(`¿Archivar el formulario "${encuesta.titulo}"? Ya no será visible ni editable.`)) return;
    setBusyId(encuesta.id);
    try {
      await EncuestasAPI.archivar(encuesta.id);
      toast('Formulario archivado.', 'success');
      cargarAdmin();
      cargarPublicas();
    } catch (err) {
      toast(err.message || 'No se pudo archivar el formulario.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Encuestas</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tab === 'admin' ? 'Crea, edita y analiza tus encuestas.' : 'Selecciona una encuesta para participar.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {puedeEditar && (
              <div className="flex gap-2 bg-gray-100 dark:bg-dark-card p-1 rounded-xl order-2 sm:order-1 w-full sm:w-auto">
                <button
                  onClick={() => setTab('admin')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    tab === 'admin' ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Administración
                </button>
                <button
                  onClick={() => setTab('publico')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    tab === 'publico' ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Vista pública
                </button>
              </div>
            )}

            {tab === 'admin' && puedeEditar && (
              <button
                onClick={() => setCrearOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-brand/20 transition-colors order-1 sm:order-2"
              >
                <Plus className="w-4 h-4" />
                <span>Crear formulario</span>
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && tab === 'admin' && puedeEditar && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminItems.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full text-center py-10">
                Aún no has creado ningún formulario.
              </p>
            )}
            {adminItems.map((encuesta) => (
              <EncuestaAdminCard
                key={encuesta.id}
                encuesta={encuesta}
                busy={busyId === encuesta.id}
                onToggleActiva={handleToggleActiva}
                onShowQr={setQrEncuesta}
                onShowPreguntas={setPreguntasEncuesta}
                onShowStats={setStatsEncuesta}
                onShowRespuestas={setRespuestasEncuesta}
                onArchivar={handleArchivar}
              />
            ))}
          </div>
        )}

        {!loading && (tab === 'publico' || !puedeEditar) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicItems.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full text-center py-10">
                No hay encuestas activas por el momento.
              </p>
            )}
            {publicItems.map((encuesta) => (
              <EncuestaPublicCard
                key={encuesta.id}
                encuesta={encuesta}
                onShowQr={setQrEncuesta}
                onResponder={setResponderEncuesta}
              />
            ))}
          </div>
        )}
      </main>

      <EncuestaQrModal encuesta={qrEncuesta} onClose={() => setQrEncuesta(null)} />
      <EncuestaRespuestasModal encuesta={respuestasEncuesta} onClose={() => setRespuestasEncuesta(null)} />
      <EncuestaPreguntasModal encuesta={preguntasEncuesta} onClose={() => setPreguntasEncuesta(null)} />
      <EncuestaStatsModal encuesta={statsEncuesta} onClose={() => setStatsEncuesta(null)} />
      <EncuestaResponderModal
        encuesta={responderEncuesta}
        onClose={() => {
          setResponderEncuesta(null);
          setSearchParams({}, { replace: true });
        }}
        onResponded={() => {
          cargarPublicas();
          setSearchParams({}, { replace: true });
        }}
      />
      {puedeEditar && (
        <EncuestaCrearModal
          open={crearOpen}
          onClose={() => setCrearOpen(false)}
          onCreated={() => {
            cargarAdmin();
            cargarPublicas();
          }}
        />
      )}
    </div>
  );
}
