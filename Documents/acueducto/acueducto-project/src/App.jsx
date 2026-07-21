import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Intro from './components/common/Intro';
import Home from './pages/Home';
import ErrorBoundary from './components/common/ErrorBoundary';
import RouteLoading from './components/common/RouteLoading';
import { solicitarPermisoNotificaciones } from './utils/notificacionesSistema';

// Code-splitting por ruta: cada página se descarga solo cuando el usuario
// navega a ella, en vez de que el bundle inicial cargue las ~20 páginas de
// una sola vez. Home queda fuera del lazy() porque es la pantalla de
// entrada más común y así se ve al instante tras el Intro.
const Encuestas = lazy(() => import('./pages/Encuestas'));
const EscanearQr = lazy(() => import('./pages/EscanearQr'));
const CrearNotificacion = lazy(() => import('./pages/CrearNotificacion'));
const Medidores = lazy(() => import('./pages/Medidores'));
const Asociados = lazy(() => import('./pages/Asociados'));
const Lecturas = lazy(() => import('./pages/Lecturas'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Facturacion = lazy(() => import('./pages/Facturacion'));
const MisFacturas = lazy(() => import('./pages/MisFacturas'));
const PeriodosContables = lazy(() => import('./pages/PeriodosContables'));
const ReportesComunidad = lazy(() => import('./pages/ReportesComunidad'));
const Auditoria = lazy(() => import('./pages/Auditoria'));
const Estadisticas = lazy(() => import('./pages/Estadisticas'));
const Tesoreria = lazy(() => import('./pages/Tesoreria'));
const Recibos = lazy(() => import('./pages/Recibos'));
const Informes = lazy(() => import('./pages/Informes'));
const MiCuenta = lazy(() => import('./pages/MiCuenta'));

const INTRO_SEEN_KEY = 'acueducto_intro_seen';

function App() {
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem(INTRO_SEEN_KEY));

  const handleIntroFinish = () => {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    setShowIntro(false);
  };

  useEffect(() => {
    if (!showIntro) {
      const timer = setTimeout(() => solicitarPermisoNotificaciones(), 2000);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  if (showIntro) {
    return <Intro onFinish={handleIntroFinish} />;
  }

  return (
    <ErrorBoundary>
      <div className="app-enter">
      <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/encuestas" element={<Encuestas />} />
        <Route path="/escanear-qr" element={<EscanearQr />} />
        <Route path="/notificaciones/crear" element={<CrearNotificacion />} />
        <Route path="/medidores" element={<Medidores />} />
        <Route path="/asociados" element={<Asociados />} />
        <Route path="/lecturas" element={<Lecturas />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/facturacion" element={<Facturacion />} />
        <Route path="/mis-facturas" element={<MisFacturas />} />
        <Route path="/periodos-contables" element={<PeriodosContables />} />
        <Route path="/reportes-comunidad" element={<ReportesComunidad />} />
        <Route path="/auditoria" element={<Auditoria />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/tesoreria" element={<Tesoreria />} />
        <Route path="/recibos" element={<Recibos />} />
        <Route path="/informes" element={<Informes />} />
        <Route path="/mi-cuenta" element={<MiCuenta />} />
      </Routes>
      </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
