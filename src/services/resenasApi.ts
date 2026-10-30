import { apiRequest } from './http';
import type {
  ActualizarResenaRequest, ModerarResenaRequest, ResenaPublicaResponse, ResenaRequest,
  ResenaResponse, ResponderResenaRequest, ResumenResenasResponse,
} from '../types/resena';

export const resenasApi = {
  crear(body: ResenaRequest): Promise<ResenaResponse> {
    return apiRequest<ResenaResponse>('/api/v1/resenas', { method: 'POST', body: JSON.stringify(body) });
  },
  mias(options: { signal?: AbortSignal } = {}): Promise<ResenaResponse[]> {
    return apiRequest<ResenaResponse[]>('/api/v1/resenas/me', { signal: options.signal });
  },
  actualizar(resenaId: string, body: ActualizarResenaRequest): Promise<ResenaResponse> {
    return apiRequest<ResenaResponse>(`/api/v1/resenas/${encodeURIComponent(resenaId)}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  retirar(resenaId: string): Promise<ResenaResponse> {
    return apiRequest<ResenaResponse>(`/api/v1/resenas/${encodeURIComponent(resenaId)}/retirar`, { method: 'PATCH' });
  },
  listarPublicas(negocioId: string, options: { signal?: AbortSignal } = {}): Promise<ResenaPublicaResponse[]> {
    return apiRequest<ResenaPublicaResponse[]>(`/api/v1/public/resenas/negocios/${encodeURIComponent(negocioId)}`, {
      public: true, signal: options.signal,
    });
  },
  resumenPublico(negocioId: string, options: { signal?: AbortSignal } = {}): Promise<ResumenResenasResponse> {
    return apiRequest<ResumenResenasResponse>(`/api/v1/public/resenas/negocios/${encodeURIComponent(negocioId)}/resumen`, {
      public: true, signal: options.signal,
    });
  },
  listarOperador(negocioId: string, options: { signal?: AbortSignal } = {}): Promise<ResenaResponse[]> {
    return apiRequest<ResenaResponse[]>(`/api/v1/operadores/resenas/negocios/${encodeURIComponent(negocioId)}`, { signal: options.signal });
  },
  responder(resenaId: string, body: ResponderResenaRequest): Promise<ResenaResponse> {
    return apiRequest<ResenaResponse>(`/api/v1/operadores/resenas/${encodeURIComponent(resenaId)}/respuesta`, {
      method: 'PUT', body: JSON.stringify(body),
    });
  },
  moderar(resenaId: string, body: ModerarResenaRequest): Promise<ResenaResponse> {
    return apiRequest<ResenaResponse>(`/api/v1/admin/resenas/${encodeURIComponent(resenaId)}/moderar`, {
      method: 'PATCH', body: JSON.stringify(body),
    });
  },
};
