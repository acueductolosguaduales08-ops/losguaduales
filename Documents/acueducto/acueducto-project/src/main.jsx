import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import { ReportesComunidadProvider } from './context/ReportesComunidadContext.jsx';
import NotificationToasts from './components/notifications/NotificationToasts.jsx';
import NotificationDetailModal from './components/notifications/NotificationDetailModal.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationsProvider>
              <ReportesComunidadProvider>
                <App />
                {/* Notificaciones flotantes y modal de detalle: montados una sola vez,
                    siguen al usuario sin importar la ruta activa. */}
                <NotificationToasts />
                <NotificationDetailModal />
              </ReportesComunidadProvider>
            </NotificationsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
