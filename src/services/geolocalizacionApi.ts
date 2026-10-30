import { apiRequest } from './http';
import type {
  PuntoEncuentroOfertaRequest, PuntoEncuentroOfertaResponse,
  UbicacionNegocioRequest, UbicacionNegocioResponse,
} from '../types/geolocalizacion';

const negocio = (negocioId: string) => `/api/v1/operadores/negocios/${encodeURIComponent(negocioId)}`;

export const geolocalizacionApi = {
  consultarUbicacion(negocioId: string): Promise<UbicacionNegocioResponse> {
    return apiRequest<UbicacionNegocioResponse>(`${negocio(negocioId)}/ubicacion`);
  },
  guardarUbicacion(negocioId: string, body: UbicacionNegocioRequest): Promise<UbicacionNegocioResponse> {
    return apiRequest<UbicacionNegocioResponse>(`${negocio(negocioId)}/ubicacion`, {
      method: 'PUT', body: JSON.stringify(body),
    });
  },
  consultarPuntoEncuentro(negocioId: string, ofertaId: number): Promise<PuntoEncuentroOfertaResponse> {
    return apiRequest<PuntoEncuentroOfertaResponse>(
      `${negocio(negocioId)}/ofertas/${encodeURIComponent(String(ofertaId))}/punto-encuentro`,
    );
  },
  guardarPuntoEncuentro(negocioId: string, ofertaId: number, body: PuntoEncuentroOfertaRequest): Promise<PuntoEncuentroOfertaResponse> {
    return apiRequest<PuntoEncuentroOfertaResponse>(
      `${negocio(negocioId)}/ofertas/${encodeURIComponent(String(ofertaId))}/punto-encuentro`,
      { method: 'PUT', body: JSON.stringify(body) },
    );
  },
};
