import { apiRequest } from './http';
import type {
  ConfigurarControlDisponibilidadRequest, ConfigurarDisponibilidadRequest,
  ControlDisponibilidadResponse, DisponibilidadOfertaResponse,
} from '../types/disponibilidad';

const rango = (desde: string, hasta: string) => {
  const p = new URLSearchParams({ desde, hasta });
  return p.toString();
};

export const disponibilidadApi = {
  consultarPublica(ofertaId: number, desde: string, hasta: string, options: { signal?: AbortSignal } = {}): Promise<DisponibilidadOfertaResponse> {
    return apiRequest<DisponibilidadOfertaResponse>(
      `/api/v1/public/ofertas/${encodeURIComponent(String(ofertaId))}/disponibilidad?${rango(desde, hasta)}`,
      { public: true, signal: options.signal },
    );
  },
  consultarOperador(negocioId: string, ofertaId: number, desde: string, hasta: string, options: { signal?: AbortSignal } = {}): Promise<DisponibilidadOfertaResponse> {
    return apiRequest<DisponibilidadOfertaResponse>(
      `/api/v1/operadores/negocios/${encodeURIComponent(negocioId)}/ofertas/${ofertaId}/disponibilidad?${rango(desde, hasta)}`,
      { signal: options.signal },
    );
  },
  configurar(negocioId: string, ofertaId: number, body: ConfigurarDisponibilidadRequest): Promise<DisponibilidadOfertaResponse> {
    return apiRequest<DisponibilidadOfertaResponse>(
      `/api/v1/operadores/negocios/${encodeURIComponent(negocioId)}/ofertas/${ofertaId}/disponibilidad`,
      { method: 'PUT', body: JSON.stringify(body) },
    );
  },
  configurarControl(negocioId: string, ofertaId: number, body: ConfigurarControlDisponibilidadRequest): Promise<ControlDisponibilidadResponse> {
    return apiRequest<ControlDisponibilidadResponse>(
      `/api/v1/operadores/negocios/${encodeURIComponent(negocioId)}/ofertas/${ofertaId}/disponibilidad/configuracion`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
  },
};
