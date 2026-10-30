import { apiRequest } from './http';
import type { DisponibilidadHospedajeResponse } from '../types/hospedajeBooking';

export const hospedajeBookingApi = {
  consultar(ofertaId: number, checkIn: string, checkOut: string, personas: number, options: { signal?: AbortSignal } = {}): Promise<DisponibilidadHospedajeResponse> {
    const p = new URLSearchParams({ checkIn, checkOut, personas: String(personas) });
    return apiRequest<DisponibilidadHospedajeResponse>(
      `/api/v1/public/ofertas/${ofertaId}/hospedaje/disponibilidad?${p}`,
      { public: true, signal: options.signal },
    );
  },
};
