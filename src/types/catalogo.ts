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
}
