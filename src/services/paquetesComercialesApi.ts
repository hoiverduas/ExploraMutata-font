import { apiRequest, ApiError } from './http';
import type { ApiOptions } from './http';
import type { CotizacionPaqueteComercialResponse, CotizarPaqueteComercialRequest, CrearViajeDesdePaqueteRequest, PaqueteComercialItemRequest, PaqueteComercialRequest, PaqueteComercialResponse, ViajeDesdePaquete } from '../types/paqueteComercial';

interface Options { signal?: AbortSignal }
const publico = '/api/v1/public/paquetes-comerciales';
const operador = (negocioId: string) => `/api/v1/operadores/negocios/${encodeURIComponent(negocioId)}/paquetes-comerciales`;
const item = (negocioId: string, paqueteId: string) => `${operador(negocioId)}/${encodeURIComponent(paqueteId)}`;
async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  try { return await apiRequest<T>(path, options); }
  catch (error) {
    if (error instanceof ApiError && error.status === 404) throw new ApiError(404, options.public
      ? 'Este paquete no está disponible.' : 'El paquete o el negocio no existe o no pertenece a tu cuenta.');
    throw error;
  }
}
export const paquetesComercialesApi = {
  listarPublicos(negocioId?: string, options: Options = {}) {
    const query = negocioId ? `?${new URLSearchParams({ negocioId })}` : '';
    return request<PaqueteComercialResponse[]>(`${publico}${query}`, { public: true, signal: options.signal });
  },
  buscarPublico(paqueteId: string, options: Options = {}) {
    return request<PaqueteComercialResponse>(`${publico}/${encodeURIComponent(paqueteId)}`, { public: true, signal: options.signal });
  },
  cotizarPublico(paqueteId: string, body: CotizarPaqueteComercialRequest, options: Options = {}) {
    return request<CotizacionPaqueteComercialResponse>(`${publico}/${encodeURIComponent(paqueteId)}/cotizar`, { public: true, method: 'POST', body: JSON.stringify(body), signal: options.signal });
  },
  crearViaje(paqueteId: string, body: CrearViajeDesdePaqueteRequest) {
    return request<ViajeDesdePaquete>(`/api/v1/paquetes-comerciales/${encodeURIComponent(paqueteId)}/crear-viaje`, { method: 'POST', body: JSON.stringify(body) });
  },
  listar(negocioId: string, options: Options = {}) {
    return request<PaqueteComercialResponse[]>(operador(negocioId), { signal: options.signal });
  },
  buscar(negocioId: string, paqueteId: string, options: Options = {}) {
    return request<PaqueteComercialResponse>(item(negocioId, paqueteId), { signal: options.signal });
  },
  crear(negocioId: string, body: PaqueteComercialRequest) {
    return request<PaqueteComercialResponse>(operador(negocioId), { method: 'POST', body: JSON.stringify(body) });
  },
  actualizar(negocioId: string, paqueteId: string, body: PaqueteComercialRequest) {
    return request<PaqueteComercialResponse>(item(negocioId, paqueteId), { method: 'PUT', body: JSON.stringify(body) });
  },
  agregarItem(negocioId: string, paqueteId: string, body: PaqueteComercialItemRequest) {
    return request<PaqueteComercialResponse>(`${item(negocioId, paqueteId)}/items`, { method: 'POST', body: JSON.stringify(body) });
  },
  actualizarItem(negocioId: string, paqueteId: string, itemId: string, body: PaqueteComercialItemRequest) {
    return request<PaqueteComercialResponse>(`${item(negocioId, paqueteId)}/items/${encodeURIComponent(itemId)}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  eliminarItem(negocioId: string, paqueteId: string, itemId: string) {
    return request<PaqueteComercialResponse>(`${item(negocioId, paqueteId)}/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
  },
  cambiarEstado(negocioId: string, paqueteId: string, accion: 'publicar' | 'desactivar' | 'borrador') {
    return request<PaqueteComercialResponse>(`${item(negocioId, paqueteId)}/${accion}`, { method: 'PATCH' });
  },
};
