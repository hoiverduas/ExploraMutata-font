import { apiRequest } from './http';
import type { RechazarReservaRequest, ReservaOperadorFiltros, ReservaRequest, ReservaResponse } from '../types/reserva';

const root = '/api/v1/reservas';
const operadorRoot = '/api/v1/operadores/reservas';
const item = (id: string) => `${root}/${encodeURIComponent(id)}`;
const operadorItem = (id: string) => `${operadorRoot}/${encodeURIComponent(id)}`;
interface RequestOptions {
  signal?: AbortSignal;
}

export const reservasApi = {
  crearReserva(body: ReservaRequest): Promise<ReservaResponse> {
    return apiRequest<ReservaResponse>(root, {
      method: 'POST',
      body: JSON.stringify({
        negocioExperienciaId: body.negocioExperienciaId,
        fechaReserva: body.fechaReserva,
        fechaFin: body.fechaFin ?? null,
        cantidadPersonas: body.cantidadPersonas,
        cantidadTrayectos: body.cantidadTrayectos ?? null,
        observaciones: body.observaciones,
      }),
    });
  },
  listarMisReservas(options: RequestOptions = {}): Promise<ReservaResponse[]> {
    return apiRequest<ReservaResponse[]>(`${root}/me`, { signal: options.signal });
  },
  obtenerReserva(id: string, options: RequestOptions = {}): Promise<ReservaResponse> {
    return apiRequest<ReservaResponse>(item(id), { signal: options.signal });
  },
  cancelarReserva(id: string): Promise<ReservaResponse> {
    return apiRequest<ReservaResponse>(`${item(id)}/cancelar`, { method: 'PATCH' });
  },
  listarReservasOperador(filtros: ReservaOperadorFiltros = {}, options: RequestOptions = {}): Promise<ReservaResponse[]> {
    const parametros = new URLSearchParams();
    if (filtros.estado) parametros.set('estado', filtros.estado);
    if (filtros.negocioId) parametros.set('negocioId', filtros.negocioId);
    if (filtros.fecha) parametros.set('fecha', filtros.fecha);
    const query = parametros.toString();
    return apiRequest<ReservaResponse[]>(`${operadorRoot}${query ? `?${query}` : ''}`, { signal: options.signal });
  },
  obtenerReservaOperador(id: string, options: RequestOptions = {}): Promise<ReservaResponse> {
    return apiRequest<ReservaResponse>(operadorItem(id), { signal: options.signal });
  },
  confirmarReserva(id: string): Promise<ReservaResponse> {
    return apiRequest<ReservaResponse>(`${operadorItem(id)}/confirmar`, { method: 'PATCH' });
  },
  rechazarReserva(id: string, request: RechazarReservaRequest): Promise<ReservaResponse> {
    return apiRequest<ReservaResponse>(`${operadorItem(id)}/rechazar`, {
      method: 'PATCH', body: JSON.stringify({ motivo: request.motivo }),
    });
  },
  completarReserva(id: string): Promise<ReservaResponse> {
    return apiRequest<ReservaResponse>(`${operadorItem(id)}/completar`, { method: 'PATCH' });
  },
};
