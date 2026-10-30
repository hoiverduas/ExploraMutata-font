export interface UbicacionNegocioRequest {
  direccion: string | null;
  municipio: string | null;
  vereda: string | null;
  ubicacionReferencia: string | null;
  latitud: number;
  longitud: number;
  comoLlegar: string | null;
}

export interface UbicacionNegocioResponse extends UbicacionNegocioRequest {
  negocioId: string;
  nombreComercial: string;
  urlGoogleMaps: string;
  urlWaze: string;
}

export interface PuntoEncuentroOfertaRequest {
  usarUbicacionNegocio: boolean;
  nombre: string | null;
  direccion: string | null;
  municipio: string | null;
  vereda: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  comoLlegar: string | null;
}

export interface PuntoEncuentroOfertaResponse {
  ofertaId: number;
  negocioId: string;
  usaUbicacionNegocio: boolean;
  nombre: string | null;
  direccion: string | null;
  municipio: string | null;
  vereda: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  comoLlegar: string | null;
  urlGoogleMaps: string | null;
  urlWaze: string | null;
}
