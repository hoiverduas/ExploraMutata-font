import { apiRequest } from './http';
import type { CategoriaNegocio } from '../types/catalogo';
import type { PuntoMapaResponse, TipoPuntoMapa } from '../types/mapa';

interface PublicOptions { signal?: AbortSignal }
interface FiltrosMapa {
  tipo?: TipoPuntoMapa;
  categoria?: CategoriaNegocio;
}
interface FiltrosCercanos extends FiltrosMapa {
  latitud: number;
  longitud: number;
  radioKm?: number;
}

function query<T extends object>(params: T): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([clave, valor]) => {
    if (valor !== undefined) search.set(clave, String(valor));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const mapaApi = {
  listarPuntos(filtros: FiltrosMapa = {}, options: PublicOptions = {}): Promise<PuntoMapaResponse[]> {
    return apiRequest<PuntoMapaResponse[]>(`/api/v1/public/mapa/puntos${query(filtros)}`, {
      public: true,
      signal: options.signal,
    });
  },
  buscarCercanos(filtros: FiltrosCercanos, options: PublicOptions = {}): Promise<PuntoMapaResponse[]> {
    return apiRequest<PuntoMapaResponse[]>(`/api/v1/public/mapa/cercanos${query(filtros)}`, {
      public: true,
      signal: options.signal,
    });
  },
};
