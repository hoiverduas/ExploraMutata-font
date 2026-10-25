import { apiRequest } from './http';
import type { CotizacionOfertaRequest, CotizacionOfertaResponse } from '../types/cotizacion';

export const cotizacionApi = {
  cotizar: (ofertaId: number, body: CotizacionOfertaRequest, options: { signal?: AbortSignal } = {}) => apiRequest<CotizacionOfertaResponse>(
    `/api/v1/public/ofertas/${encodeURIComponent(String(ofertaId))}/cotizar`,
    { ...options, method: 'POST', public: true, body: JSON.stringify(body) },
  ),
};
