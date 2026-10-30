import { apiRequest } from './http';
import type { EstadoFavoritoResponse, FavoritoRequest, FavoritoResponse, TipoRecursoFavorito } from '../types/favorito';

const root = '/api/v1/favoritos';

export const favoritosApi = {
  agregar(body: FavoritoRequest): Promise<FavoritoResponse> {
    return apiRequest<FavoritoResponse>(root, { method: 'POST', body: JSON.stringify(body) });
  },
  listar(tipo?: TipoRecursoFavorito, options: { signal?: AbortSignal } = {}): Promise<FavoritoResponse[]> {
    const query = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
    return apiRequest<FavoritoResponse[]>(`${root}${query}`, { signal: options.signal });
  },
  estado(tipo: TipoRecursoFavorito, recursoId: string, options: { signal?: AbortSignal } = {}): Promise<EstadoFavoritoResponse> {
    return apiRequest<EstadoFavoritoResponse>(
      `${root}/${encodeURIComponent(tipo)}/${encodeURIComponent(recursoId)}/estado`,
      { signal: options.signal },
    );
  },
  eliminar(tipo: TipoRecursoFavorito, recursoId: string): Promise<void> {
    return apiRequest<void>(`${root}/${encodeURIComponent(tipo)}/${encodeURIComponent(recursoId)}`, { method: 'DELETE' });
  },
};
