export type CategoriaNegocio =
  | 'HOSPEDAJE'
  | 'RESTAURANTE'
  | 'AVENTURA'
  | 'VIDA_NOCTURNA'
  | 'GUIA'
  | 'TRANSPORTE';

export interface NegocioPublico {
  id: string;
  nombreComercial: string;
  categorias: CategoriaNegocio[];
  descripcion: string | null;
  correoContacto: string;
  telefonoContacto: string;
  whatsappContacto: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  direccion: string | null;
  municipio: string | null;
  vereda: string | null;
  ubicacionReferencia: string | null;
  latitud: number | null;
  longitud: number | null;
  comoLlegar: string | null;
}
