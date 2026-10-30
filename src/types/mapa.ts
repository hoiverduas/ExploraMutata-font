import type { CategoriaNegocio } from './catalogo';

export type TipoPuntoMapa = 'DESTINO' | 'NEGOCIO' | 'OFERTA';

export interface PuntoMapaResponse {
  tipo: TipoPuntoMapa;
  entidadId: string;
  negocioId: string | null;
  ofertaId: number | null;
  destinoId: string | null;
  nombre: string;
  categorias: CategoriaNegocio[];
  latitud: number;
  longitud: number;
  distanciaKm: number | null;
  direccion: string | null;
  municipio: string | null;
  vereda: string | null;
  referencia: string | null;
  comoLlegar: string | null;
  urlGoogleMaps: string;
  urlWaze: string;
}
