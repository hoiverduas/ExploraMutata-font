import { apiRequest } from './http';
import type { ConfiguracionComercialPublicaResponse, OfertaTarifaRequest, OfertaTarifaResponse } from '../types/configuracionComercialOferta';

const operadorRoot = (negocioId: string, ofertaId: number) =>
  '/api/v1/operadores/negocios/' + encodeURIComponent(negocioId)
  + '/ofertas/' + encodeURIComponent(String(ofertaId)) + '/configuracion-comercial';

export const configuracionComercialOfertaApi = {
  obtenerPublica(ofertaId: number, options: { signal?: AbortSignal } = {}): Promise<ConfiguracionComercialPublicaResponse> {
    return apiRequest<ConfiguracionComercialPublicaResponse>(
      `/api/v1/public/ofertas/${encodeURIComponent(String(ofertaId))}/configuracion-comercial`,
      { public: true, signal: options.signal },
    );
  },
  listarTarifas(negocioId: string, ofertaId: number): Promise<OfertaTarifaResponse[]> {
    return apiRequest<OfertaTarifaResponse[]>(operadorRoot(negocioId, ofertaId) + '/tarifas');
  },
  crearTarifa(negocioId: string, ofertaId: number, body: OfertaTarifaRequest): Promise<OfertaTarifaResponse> {
    return apiRequest<OfertaTarifaResponse>(operadorRoot(negocioId, ofertaId) + '/tarifas', {
      method: 'POST', body: JSON.stringify(body),
    });
  },
  actualizarTarifa(negocioId: string, ofertaId: number, tarifaId: string, body: OfertaTarifaRequest): Promise<OfertaTarifaResponse> {
    return apiRequest<OfertaTarifaResponse>(operadorRoot(negocioId, ofertaId) + '/tarifas/' + encodeURIComponent(tarifaId), {
      method: 'PUT', body: JSON.stringify(body),
    });
  },
  activarTarifa(negocioId: string, ofertaId: number, tarifaId: string): Promise<OfertaTarifaResponse> {
    return apiRequest<OfertaTarifaResponse>(operadorRoot(negocioId, ofertaId) + '/tarifas/' + encodeURIComponent(tarifaId) + '/activar', { method: 'PATCH' });
  },
  desactivarTarifa(negocioId: string, ofertaId: number, tarifaId: string): Promise<OfertaTarifaResponse> {
    return apiRequest<OfertaTarifaResponse>(operadorRoot(negocioId, ofertaId) + '/tarifas/' + encodeURIComponent(tarifaId) + '/desactivar', { method: 'PATCH' });
  },
};
