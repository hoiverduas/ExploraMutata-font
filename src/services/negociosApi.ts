import type { NegocioRequest, NegocioResponse, PaginaResponse } from '../types/negocio';
import { apiRequest } from './http';

export type AccionEstado = 'aprobar' | 'rechazar' | 'suspender' | 'reactivar' | 'desactivar' | 'solicitar-revision';
export interface HistorialEstado {
  id: string;
  negocioId: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  motivo: string;
  actor: string;
  fechaCambio: string;
}

// API protegida: apiRequest agrega Authorization: Bearer <JWT> desde la sesión.
const root = '/api/v1/negocios';
const request = apiRequest;

export const negociosApi = {
  listar(page = 0, size = 10): Promise<PaginaResponse<NegocioResponse>> {
    return request<PaginaResponse<NegocioResponse>>(`${root}?page=${page}&size=${size}`);
  },
  buscar(id: string): Promise<NegocioResponse> {
    return request<NegocioResponse>(`${root}/${encodeURIComponent(id)}`);
  },
  registrar(body: NegocioRequest): Promise<NegocioResponse> {
    return request<NegocioResponse>(root, { method: 'POST', body: JSON.stringify(body) });
  },
  actualizar(id: string, body: NegocioRequest): Promise<NegocioResponse> {
    return request<NegocioResponse>(`${root}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  cambiarEstado(id: string, accion: AccionEstado, motivo: string, verificacionConfirmada = false): Promise<NegocioResponse> {
    const body = accion === 'aprobar'
      ? { verificacionConfirmada, observacion: motivo }
      : { motivo };
    return request<NegocioResponse>(`${root}/${encodeURIComponent(id)}/${accion}`, {
      method: 'PATCH', body: JSON.stringify(body),
    });
  },
  historialEstados(id: string): Promise<HistorialEstado[]> {
    return request<HistorialEstado[]>(`${root}/${encodeURIComponent(id)}/historial-estados`);
  },
};
