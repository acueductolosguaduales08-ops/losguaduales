import { api } from './client';

// Módulo 01 — Autenticación. Base path: /api/v1/auth
export const AuthAPI = {
  // Login público. Response (LoginResponse): { accessToken, refreshToken, tokenType, expiresInMs, usuario }.
  login: (username, password) =>
    api.post('/api/v1/auth/login', { username, password }, { isPublic: true }),

  // Refrescar token de acceso. Response (LoginResponse) igual que login.
  refresh: (refreshToken) =>
    api.post('/api/v1/auth/refresh', { refreshToken }, { isPublic: true }),

  // Cerrar sesión activa.
  logout: () => api.post('/api/v1/auth/logout'),

  // Crear cuenta de usuario. Roles: ADMINISTRADOR (puede crear TESORERO/ADMINISTRADOR),
  // TESORERO (solo puede crear ASOCIADO). Body (CrearUsuarioRequest):
  // { username*, password* (min 8), email*, rol*, asociadoId }.
  // Response (UsuarioResponse): { id, username, email, rol, activo, asociadoId }.
  crearUsuario: (payload) => api.post('/api/v1/auth/usuarios', payload),

  // Perfil del usuario autenticado. Response (UsuarioResponse) igual que crearUsuario.
  perfil: (signal) => api.get('/api/v1/auth/perfil', { signal }),

  // Cambiar contraseña propia. Body (CambiarPasswordRequest): { passwordActual*, passwordNueva* (min 8) }.
  cambiarPassword: (payload) => api.put('/api/v1/auth/cambiar-password', payload),
};

// Valores reales del enum Rol (backend).
export const ROLES = ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'];

// Roles que cada rol tiene permitido crear al dar de alta una cuenta (Regla del módulo 01).
export const ROLES_QUE_PUEDE_CREAR = {
  ADMINISTRADOR: ['TESORERO', 'ADMINISTRADOR', 'ASOCIADO'],
  TESORERO: ['ASOCIADO'],
};
