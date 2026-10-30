import { apiRequest } from './http';
import type {
  ExcepcionFranjaRequest, FranjaHorariaRequest, FranjaHorariaResponse, HorariosOfertaResponse,
  SalidaProgramadaRequest, SalidaProgramadaResponse,
} from '../types/horario';

const root = (negocioId: string, ofertaId: number) =>
  `/api/v1/operadores/negocios/${encodeURIComponent(negocioId)}/ofertas/${ofertaId}/horarios`;

export const horariosApi = {
  listarPublicos(ofertaId: number, desde: string, hasta: string, options: { signal?: AbortSignal } = {}): Promise<HorariosOfertaResponse> {
    const p = new URLSearchParams({ desde, hasta });
    return apiRequest<HorariosOfertaResponse>(
      `/api/v1/public/ofertas/${ofertaId}/horarios?${p}`,
      { public: true, signal: options.signal },
    );
  },
  configurar(negocioId: string, ofertaId: number, requiereHorario: boolean): Promise<{ ofertaId: number; requiereHorario: boolean }> {
    return apiRequest<{ ofertaId: number; requiereHorario: boolean }>(`${root(negocioId, ofertaId)}/configuracion`, {
      method: 'PATCH', body: JSON.stringify({ requiereHorario }),
    });
  },
  listarFranjas(negocioId: string, ofertaId: number): Promise<FranjaHorariaResponse[]> {
    return apiRequest<FranjaHorariaResponse[]>(`${root(negocioId, ofertaId)}/franjas`);
  },
  crearFranja(negocioId: string, ofertaId: number, body: FranjaHorariaRequest): Promise<FranjaHorariaResponse> {
    return apiRequest<FranjaHorariaResponse>(`${root(negocioId, ofertaId)}/franjas`, { method: 'POST', body: JSON.stringify(body) });
  },
  actualizarFranja(negocioId: string, ofertaId: number, franjaId: string, body: FranjaHorariaRequest): Promise<FranjaHorariaResponse> {
    return apiRequest<FranjaHorariaResponse>(`${root(negocioId, ofertaId)}/franjas/${encodeURIComponent(franjaId)}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  configurarExcepcionFranja(negocioId: string, ofertaId: number, franjaId: string, fecha: string, body: ExcepcionFranjaRequest): Promise<SalidaProgramadaResponse> {
    return apiRequest<SalidaProgramadaResponse>(
      `${root(negocioId, ofertaId)}/franjas/${encodeURIComponent(franjaId)}/fechas/${encodeURIComponent(fecha)}`,
      { method: 'PUT', body: JSON.stringify(body) },
    );
  },
  listarSalidas(negocioId: string, ofertaId: number, desde: string, hasta: string): Promise<SalidaProgramadaResponse[]> {
    const p = new URLSearchParams({ desde, hasta });
    return apiRequest<SalidaProgramadaResponse[]>(`${root(negocioId, ofertaId)}/salidas?${p}`);
  },
  crearSalida(negocioId: string, ofertaId: number, body: SalidaProgramadaRequest): Promise<SalidaProgramadaResponse> {
    return apiRequest<SalidaProgramadaResponse>(`${root(negocioId, ofertaId)}/salidas`, { method: 'POST', body: JSON.stringify(body) });
  },
  actualizarSalida(negocioId: string, ofertaId: number, salidaId: string, body: SalidaProgramadaRequest): Promise<SalidaProgramadaResponse> {
    return apiRequest<SalidaProgramadaResponse>(`${root(negocioId, ofertaId)}/salidas/${encodeURIComponent(salidaId)}`, { method: 'PUT', body: JSON.stringify(body) });
  },
};
