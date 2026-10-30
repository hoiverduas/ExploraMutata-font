export type TipoRecursoFavorito = 'NEGOCIO' | 'EXPERIENCIA' | 'OFERTA' | 'DESTINO' | 'PAQUETE';

export interface FavoritoRequest {
  tipoRecurso: TipoRecursoFavorito;
  recursoId: string;
}

export interface FavoritoResponse extends FavoritoRequest {
  id: string;
  fechaCreacion: string;
}

export interface EstadoFavoritoResponse {
  favorito: boolean;
}
