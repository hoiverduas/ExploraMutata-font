import { apiRequest } from './http';
import type { ConfiguracionComercialPublicaResponse } from '../types/configuracionComercialOferta';

export const configuracionComercialOfertaApi = {
  obtenerPublica(ofertaId: number, options: { signal?: AbortSignal } = {}): Promise<ConfiguracionComercialPublicaResponse> {
    return apiRequest<ConfiguracionComercialPublicaResponse>(
      `/api/v1/public/ofertas/${encodeURIComponent(String(ofertaId))}/configuracion-comercial`,
      { public: true, signal: options.signal },
    );
  },
};
