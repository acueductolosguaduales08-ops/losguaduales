import {
  API_BASE_URL,
  getAccessToken,
  getRefreshToken,
  setSession,
  clearSession,
} from './config';

// Error de API enriquecido con status y payload del backend
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError('Sesión expirada', 401, null);

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new ApiError('No se pudo renovar la sesión', res.status, null);
        const data = await res.json();
        setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Cliente central de peticiones. Maneja JSON, auth por Bearer token,
 * reintento automático en 401 (refresh) y normalización de errores.
 */
export async function apiRequest(path, { method = 'GET', body, params, isPublic = false, signal, raw = false } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const doFetch = async (token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  };

  let token = isPublic ? null : getAccessToken();
  let res = await doFetch(token);

  // Si el token expiró y no es público, intenta refrescar una vez
  if (res.status === 401 && !isPublic && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await doFetch(token);
    } catch {
      clearSession();
    }
  }

  if (!res.ok) {
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    // El backend responde el detalle específico en "mensaje" (p.ej. reglas de negocio 9.6/9.8);
    // "error" solo trae la categoría genérica ("Error de validacion").
    const message = data?.mensaje || data?.message || data?.error || defaultMessageFor(res.status);
    throw new ApiError(message, res.status, data);
  }

  if (res.status === 204) return null;
  if (raw) return res;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

function defaultMessageFor(status) {
  switch (status) {
    case 401:
      return 'Debes iniciar sesión para continuar.';
    case 403:
      return 'No tienes permisos para realizar esta acción.';
    case 404:
      return 'No se encontró el recurso solicitado.';
    case 422:
      return 'Los datos enviados no son válidos.';
    case 500:
      return 'Ocurrió un error en el servidor. Intenta más tarde.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}

export const api = {
  get: (path, opts) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => apiRequest(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => apiRequest(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => apiRequest(path, { ...opts, method: 'DELETE' }),
};

/**
 * Sube un archivo como multipart/form-data (sin Content-Type manual, el
 * navegador define el boundary). Reutiliza el mismo manejo de auth/refresh/errores.
 */
export async function apiUpload(path, { paramName = 'archivo', file, params, signal } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const doFetch = async (token) => {
    const formData = new FormData();
    formData.append(paramName, file);
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url.toString(), { method: 'POST', headers, body: formData, signal });
  };

  let token = getAccessToken();
  let res = await doFetch(token);

  if (res.status === 401 && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await doFetch(token);
    } catch {
      clearSession();
    }
  }

  if (!res.ok) {
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    const message = data?.mensaje || data?.message || data?.error || defaultMessageFor(res.status);
    throw new ApiError(message, res.status, data);
  }

  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}
