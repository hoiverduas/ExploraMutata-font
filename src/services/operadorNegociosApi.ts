import { apiRequest, ApiError } from './http';
import type { NegocioRequest, NegocioResponse, PaginaResponse } from '../types/negocio';
import type { HistorialEstado } from './negociosApi';
import type { RedesNegocioRequest } from '../types/redesNegocio';
const root = '/api/v1/operadores/negocios';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try { return await apiRequest<T>(path, options); }
  catch (error) {
    if (error instanceof ApiError && error.status === 404) throw new ApiError(404, 'El negocio no existe o no pertenece a tu cuenta.');
    if (error instanceof ApiError && error.status === 403) throw new ApiError(403, 'No tienes permisos para realizar esta acción.');
    throw error;
  }
}
const item = (id: string) => `${root}/${encodeURIComponent(id)}`;
export const operadorNegociosApi = {
  listar: (page = 0, size = 10) => request<PaginaResponse<NegocioResponse>>(`${root}?page=${page}&size=${size}`),
  buscar: (id: string) => request<NegocioResponse>(item(id)),
  registrar: (body: NegocioRequest) => request<NegocioResponse>(root, { method: 'POST', body: JSON.stringify(body) }),
  actualizar: (id: string, body: NegocioRequest) => request<NegocioResponse>(item(id), { method: 'PUT', body: JSON.stringify(body) }),
  actualizarRedes: (id: string, body: RedesNegocioRequest) => request<NegocioResponse>(`${item(id)}/redes`, { method: 'PUT', body: JSON.stringify(body) }),
  solicitarRevision: (id: string, motivo: string) => request<NegocioResponse>(`${item(id)}/solicitar-revision`, { method: 'PATCH', body: JSON.stringify({ motivo }) }),
  desactivar: (id: string, motivo: string) => request<NegocioResponse>(`${item(id)}/desactivar`, { method: 'PATCH', body: JSON.stringify({ motivo }) }),
  historialEstados: (id: string) => request<HistorialEstado[]>(`${item(id)}/historial-estados`),
};
