import { apiRequest } from './http';
import type {
  CalendarioHospedajeResponse, ConfigurarCalendarioHospedajeRequest, DisponibilidadHospedajeResponse,
} from '../types/hospedajeBooking';

const operadorRoot = (negocioId: string, ofertaId: number) =>
  `/api/v1/operadores/negocios/${encodeURIComponent(negocioId)}/ofertas/${ofertaId}/hospedaje`;

export const hospedajeBookingApi = {
  consultar(ofertaId: number, checkIn: string, checkOut: string, personas: number, options: { signal?: AbortSignal } = {}): Promise<DisponibilidadHospedajeResponse> {
    const p = new URLSearchParams({ checkIn, checkOut, personas: String(personas) });
    return apiRequest<DisponibilidadHospedajeResponse>(
      `/api/v1/public/ofertas/${ofertaId}/hospedaje/disponibilidad?${p}`,
      { public: true, signal: options.signal },
    );
  },
  calendarioOperador(negocioId: string, ofertaId: number, desde: string, hasta: string): Promise<CalendarioHospedajeResponse> {
    const p = new URLSearchParams({ desde, hasta });
    return apiRequest<CalendarioHospedajeResponse>(`${operadorRoot(negocioId, ofertaId)}/calendario?${p}`);
  },
  configurarCalendario(negocioId: string, ofertaId: number, body: ConfigurarCalendarioHospedajeRequest): Promise<CalendarioHospedajeResponse> {
    return apiRequest<CalendarioHospedajeResponse>(`${operadorRoot(negocioId, ofertaId)}/calendario`, {
      method: 'PUT', body: JSON.stringify(body),
    });
  },
};
