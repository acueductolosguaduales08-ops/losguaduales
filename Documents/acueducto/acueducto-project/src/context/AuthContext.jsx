import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AuthAPI } from '../api/auth';
import { setSession, clearSession, getStoredUser, getAccessToken } from '../api/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!usuario && !!getAccessToken();
  const rol = usuario?.rol || null; // ASOCIADO | TESORERO | ADMINISTRADOR

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const data = await AuthAPI.login(username, password);
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        usuario: data.usuario,
      });
      setUsuario(data.usuario);
      return data.usuario;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } catch {
      // Si falla la llamada de logout igual limpiamos la sesión local
    } finally {
      clearSession();
      setUsuario(null);
    }
  }, []);

  const puedeEditar = rol === 'ADMINISTRADOR' || rol === 'TESORERO';

  const value = useMemo(
    () => ({ usuario, rol, isAuthenticated, loading, login, logout, puedeEditar }),
    [usuario, rol, isAuthenticated, loading, login, logout, puedeEditar]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
