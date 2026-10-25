import { apiRequest } from './http';
import type { Destino, DestinoPublico, DestinoRequest, EstadoDestino, TipoDestino } from '../types/destino';

const root = '/api/v1/destinos';
const publicRoot = '/api/v1/public/destinos';
const item = (id: string) => `${root}/${encodeURIComponent(id)}`;
interface PublicOptions {
  signal?: AbortSignal;
}

export const destinosApi = {
  listar(estado?: EstadoDestino): Promise<Destino[]> {
    return apiRequest<Destino[]>(estado ? `${root}/estado/${encodeURIComponent(estado)}` : root);
  },
  buscar(id: string): Promise<Destino> {
    return apiRequest<Destino>(item(id));
  },
  crear(body: DestinoRequest): Promise<Destino> {
    return apiRequest<Destino>(root, { method: 'POST', body: JSON.stringify(body) });
  },
  actualizar(id: string, body: DestinoRequest): Promise<Destino> {
    return apiRequest<Destino>(item(id), { method: 'PUT', body: JSON.stringify(body) });
  },
  publicar(id: string): Promise<Destino> {
    return apiRequest<Destino>(`${item(id)}/publicar`, { method: 'PATCH' });
  },
  desactivar(id: string): Promise<Destino> {
    return apiRequest<Destino>(`${item(id)}/desactivar`, { method: 'PATCH' });
  },
  listarPublicos(tipo?: TipoDestino, options: PublicOptions = {}): Promise<DestinoPublico[]> {
    const path = tipo ? `${publicRoot}?tipo=${encodeURIComponent(tipo)}` : publicRoot;
    return apiRequest<DestinoPublico[]>(path, { public: true, signal: options.signal });
  },
  buscarPublico(slug: string, options: PublicOptions = {}): Promise<DestinoPublico> {
    return apiRequest<DestinoPublico>(`${publicRoot}/${encodeURIComponent(slug)}`, { public: true, signal: options.signal });
  },
};
