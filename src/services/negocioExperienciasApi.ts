import { apiRequest } from './http';
import type { NegocioExperiencia, NegocioExperienciaRequest, OfertaExperienciaMonedaResponse } from '../types/ofertaExperiencia';

const root = (negocioId: string) => `/api/v1/operadores/negocios/${encodeURIComponent(negocioId)}/ofertas-experiencias`;
const item = (negocioId: string, ofertaId: number) => `${root(negocioId)}/${encodeURIComponent(String(ofertaId))}`;
interface PublicOptions {
  signal?: AbortSignal;
}

export const negocioExperienciasApi = {
  listar(negocioId: string): Promise<NegocioExperiencia[]> {
    return apiRequest<NegocioExperiencia[]>(root(negocioId));
  },
  buscar(negocioId: string, ofertaId: number): Promise<NegocioExperiencia> {
    return apiRequest<NegocioExperiencia>(item(negocioId, ofertaId));
  },
  crear(negocioId: string, body: NegocioExperienciaRequest): Promise<NegocioExperiencia> {
    return apiRequest<NegocioExperiencia>(root(negocioId), { method: 'POST', body: JSON.stringify(body) });
  },
  actualizar(negocioId: string, ofertaId: number, body: NegocioExperienciaRequest): Promise<NegocioExperiencia> {
    return apiRequest<NegocioExperiencia>(item(negocioId, ofertaId), { method: 'PUT', body: JSON.stringify(body) });
  },
  activar(negocioId: string, ofertaId: number): Promise<NegocioExperiencia> {
    return apiRequest<NegocioExperiencia>(`${item(negocioId, ofertaId)}/activar`, { method: 'PATCH' });
  },
  desactivar(negocioId: string, ofertaId: number): Promise<NegocioExperiencia> {
    return apiRequest<NegocioExperiencia>(`${item(negocioId, ofertaId)}/desactivar`, { method: 'PATCH' });
  },
  listarPublicas(destinoSlug: string, experienciaSlug: string, options: PublicOptions = {}): Promise<OfertaExperienciaMonedaResponse[]> {
    return apiRequest<OfertaExperienciaMonedaResponse[]>(`/api/v1/public/destinos/${encodeURIComponent(destinoSlug)}/experiencias/${encodeURIComponent(experienciaSlug)}/ofertas`, {
      public: true, signal: options.signal,
    });
  },
};
