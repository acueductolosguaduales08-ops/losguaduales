import { useEffect, useState } from 'react';
import { UserCircle2, Loader2, Mail, ShieldCheck, Gauge } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthAPI, ROLES_QUE_PUEDE_CREAR } from '../api/auth';
import CambiarPasswordForm from '../components/auth/CambiarPasswordForm';
import CrearUsuarioForm from '../components/auth/CrearUsuarioForm';

const ROL_LABEL = {
  ASOCIADO: 'Asociado',
  TESORERO: 'Tesorero',
  ADMINISTRADOR: 'Administrador',
};

export default function MiCuenta() {
  const { usuario, rol } = useAuth();
  const { toast } = useToast();
  const [perfil, setPerfil] = useState(usuario || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthAPI.perfil()
      .then(setPerfil)
      .catch((err) => toast(err.message || 'No se pudo cargar tu perfil.', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const puedeCrearCuentas = (ROLES_QUE_PUEDE_CREAR[rol] || []).length > 0;
  const p = perfil || usuario;

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-4xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex items-center gap-2 mb-6">
          <UserCircle2 className="w-6 h-6 text-brand shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mi cuenta</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Módulo 1 · Perfil, seguridad y gestión de cuentas de acceso
            </p>
          </div>
        </section>

        <div className="space-y-5">
          {/* Ficha de perfil */}
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando perfil…
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-black text-xl shrink-0">
                  {(p?.username || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-gray-800 dark:text-white truncate">{p?.username}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {p?.email || '—'}
                    </span>
                    {p?.asociadoId && (
                      <span className="flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5" /> Asociado #{p.asociadoId}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand">
                    {ROL_LABEL[p?.rol] || p?.rol || 'Sin rol'}
                  </span>
                  {p?.rol === 'ASOCIADO' && p?.asociadoId ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                      ID asociado: {p.asociadoId}
                    </span>
                  ) : null}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      p?.activo
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400'
                    }`}
                  >
                    {p?.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cambiar contraseña */}
          <CambiarPasswordForm />

          {/* Crear cuentas (solo administrador/tesorero) */}
          {puedeCrearCuentas && <CrearUsuarioForm />}
        </div>
      </main>
    </div>
  );
}
