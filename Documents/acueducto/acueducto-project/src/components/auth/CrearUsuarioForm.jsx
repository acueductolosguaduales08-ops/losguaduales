import { useEffect, useState } from 'react';
import { UserPlus, Loader2, Search, X, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthAPI, ROLES_QUE_PUEDE_CREAR } from '../../api/auth';
import { AsociadosAPI } from '../../api/asociados';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ROL_LABEL = {
  ASOCIADO: 'Asociado',
  TESORERO: 'Tesorero',
  ADMINISTRADOR: 'Administrador',
};

export default function CrearUsuarioForm() {
  const { rol: rolActual } = useAuth();
  const { toast } = useToast();
  const rolesPermitidos = ROLES_QUE_PUEDE_CREAR[rolActual] || [];

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [rol, setRol] = useState(rolesPermitidos[0] || '');

  // Vínculo con un asociado (obligatorio en la práctica cuando el rol es ASOCIADO).
  const [busquedaAsociado, setBusquedaAsociado] = useState('');
  const [resultadosAsociado, setResultadosAsociado] = useState([]);
  const [buscandoAsociado, setBuscandoAsociado] = useState(false);
  const [asociadoSeleccionado, setAsociadoSeleccionado] = useState(null);
  const [asociadoId, setAsociadoId] = useState('');

  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!busquedaAsociado.trim()) {
      setResultadosAsociado([]);
      return;
    }
    setBuscandoAsociado(true);
    const t = setTimeout(() => {
      AsociadosAPI.buscar(busquedaAsociado.trim())
        .then((data) => setResultadosAsociado(Array.isArray(data) ? data : data?.content || []))
        .catch(() => setResultadosAsociado([]))
        .finally(() => setBuscandoAsociado(false));
    }, 350);
    return () => clearTimeout(t);
  }, [busquedaAsociado]);

  if (rolesPermitidos.length === 0) return null;

  const limpiar = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setMostrarPassword(false);
    setRol(rolesPermitidos[0] || '');
    setBusquedaAsociado('');
    setResultadosAsociado([]);
    setAsociadoSeleccionado(null);
    setAsociadoId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      toast('Completa usuario, correo y contraseña.', 'warning');
      return;
    }
    if (password.length < 8) {
      toast('La contraseña debe tener al menos 8 caracteres.', 'warning');
      return;
    }

    if (rol === 'ASOCIADO') {
      const idAsociado = asociadoSeleccionado?.id ?? (asociadoId.trim() ? Number(asociadoId) : null);
      if (!idAsociado || Number.isNaN(idAsociado)) {
        toast('Ingresa el ID del asociado para crear esta cuenta.', 'warning');
        return;
      }

      if (idAsociado <= 0) {
        toast('El ID del asociado debe ser mayor a cero.', 'warning');
        return;
      }
    }

    setEnviando(true);
    try {
      const payload = {
        username: username.trim(),
        password,
        email: email.trim(),
        rol,
      };

      if (rol === 'ASOCIADO') {
        payload.asociadoId = asociadoSeleccionado?.id ?? Number(asociadoId);
      }

      await AuthAPI.crearUsuario(payload);
      toast(`Cuenta creada para ${username.trim()}.`, 'success');
      limpiar();
    } catch (err) {
      toast(err.message || 'No se pudo crear la cuenta de usuario.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
      <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-1">
        <UserPlus className="w-4 h-4 text-brand" /> Crear cuenta de usuario
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
        {rolActual === 'ADMINISTRADOR'
          ? 'Puedes crear cuentas de Tesorero, Administrador o Asociado.'
          : 'Puedes crear cuentas de Asociado.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="nombre.usuario"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingrese el correo"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Contraseña inicial</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
            </div>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <button
              type="button"
              onClick={() => setMostrarPassword((v) => !v)}
              tabIndex={-1}
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Se recomienda pedirle al usuario que la cambie en su primer ingreso.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Rol de la cuenta</label>
          <select
            value={rol}
            onChange={(e) => {
              setRol(e.target.value);
              setAsociadoSeleccionado(null);
              setBusquedaAsociado('');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg text-sm font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            {rolesPermitidos.map((r) => (
              <option key={r} value={r}>
                {ROL_LABEL[r]}
              </option>
            ))}
          </select>
        </div>

        {rol === 'ASOCIADO' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                ID del asociado
              </label>
              <input
                type="number"
                min="1"
                value={asociadoId}
                onChange={(e) => setAsociadoId(e.target.value)}
                placeholder="Ingrese el ID del asociado"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Ingresa el ID del asociado o selecciónalo abajo para enviarlo en el cuerpo de la solicitud.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Asociado vinculado
              </label>
              {asociadoSeleccionado ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {asociadoSeleccionado.nombres} {asociadoSeleccionado.apellidos}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {asociadoSeleccionado.tipoDocumento}: {asociadoSeleccionado.documento}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAsociadoSeleccionado(null);
                    setAsociadoId('');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-muted shrink-0"
                >
                  <X className="w-3.5 h-3.5" /> Cambiar
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busquedaAsociado}
                    onChange={(e) => setBusquedaAsociado(e.target.value)}
                    placeholder="Buscar por nombre o documento…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-dark-bg text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                  {buscandoAsociado && (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {resultadosAsociado.length > 0 && (
                  <div className="mt-2 border border-gray-200 dark:border-dark-muted rounded-xl divide-y divide-gray-100 dark:divide-dark-muted max-h-48 overflow-y-auto custom-scroll">
                    {resultadosAsociado.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => {
                          setAsociadoSeleccionado(a);
                          setAsociadoId(String(a.id));
                          setBusquedaAsociado('');
                          setResultadosAsociado([]);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors"
                      >
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                          {a.nombres} {a.apellidos}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {a.tipoDocumento}: {a.documento}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm bg-brand hover:bg-brand-dark text-white transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
        >
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Crear cuenta
        </button>
      </form>
    </div>
  );
}
