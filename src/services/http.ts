const baseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const ACCESS_TOKEN_KEY = 'explora-mutata.jwt';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const sessionToken = {
  get: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(ACCESS_TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(ACCESS_TOKEN_KEY),
};

export interface ApiOptions extends RequestInit {
  public?: boolean;
  token?: string;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { public: isPublic = false, token, ...init } = options;
  const authToken = isPublic ? null : (token ?? sessionToken.get());
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body != null ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (!response.ok) {
    let message = '';
    try {
      const data: unknown = await response.json();
      if (data && typeof data === 'object') {
        const error = data as Record<string, unknown>;
        // Los fallos internos nunca deben presentar SQL, excepciones o trazas al viajero.
        if (response.status < 500) message = [error.detail, error.message, error.title]
          .find((value): value is string => typeof value === 'string' && Boolean(value.trim())
            && value.length <= 450 && !/(?:java\.|org\.|exception|stack\s*trace|\bSQL\b|\bselect\b.+\bfrom\b|\bat\s+\w+\.\w+\()/i.test(value)
            && !/^[\s]*[\[{]/.test(value)) ?? '';
      }
    } catch { /* A veces el servidor no devuelve JSON. */ }
    if (!message) {
      message = ({
        400: 'Los datos enviados no son válidos.',
        401: 'Credenciales incorrectas o sesión vencida.',
        403: 'No tienes permisos para realizar esta acción.',
        404: 'El recurso solicitado no existe.',
        409: 'Existe un conflicto con el estado actual de los datos.',
        422: 'No se pudo procesar la solicitud.',
        500: 'No pudimos completar la solicitud. Inténtalo de nuevo más tarde.',
        502: 'El servicio externo no respondió correctamente.',
      } as Record<number, string>)[response.status] ?? `No se pudo completar la solicitud (HTTP ${response.status}).`;
    }
    if (response.status === 401 && !isPublic && authToken) {
      window.dispatchEvent(new Event('explora:sesion-caducada'));
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
