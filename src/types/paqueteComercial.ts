import type { CategoriaNegocio } from './catalogo';
import type { CotizacionOfertaResponse } from './cotizacion';
import type { Moneda } from './moneda';
import type { ModeloPrecio, UnidadDuracionOferta } from './oferta';
import type { PaqueteTuristicoResponse, TotalesPaqueteResponse } from './paqueteTuristico';

export const estadosPaqueteComercial = ['BORRADOR', 'PUBLICADO', 'INACTIVO'] as const;
export type EstadoPaqueteComercial = typeof estadosPaqueteComercial[number];
export type TipoPaqueteComercial = 'PROPIO' | 'COLABORATIVO';
export const modelosPrecioPaquete = ['SUMA_COMPONENTES', 'PRECIO_FIJO', 'POR_PERSONA', 'POR_GRUPO'] as const;
export type ModeloPrecioPaquete = typeof modelosPrecioPaquete[number];

export interface PaqueteComercialRequest {
  nombre: string;
  descripcion: string | null;
  tipo: TipoPaqueteComercial;
  duracionCantidad: number;
  duracionUnidad: UnidadDuracionOferta;
  modeloPrecio: ModeloPrecioPaquete;
  precio: number | null;
  moneda: Moneda | null;
  minimoPersonas: number;
  maximoPersonas: number | null;
  capacidadGrupo: number | null;
  incluye: string | null;
  noIncluye: string | null;
  condiciones: string | null;
  politicaCancelacion: string | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
}
export interface PaqueteComercialItemRequest {
  ofertaId: number;
  diaInicio: number;
  diaFin: number | null;
  cantidadTrayectos: number | null;
  orden: number | null;
  observaciones: string | null;
}
export interface PaqueteComercialItemResponse extends PaqueteComercialItemRequest {
  id: string;
  ofertaNombre: string;
  categoria: CategoriaNegocio;
  modeloPrecio: ModeloPrecio;
  precioBase: number | null;
  moneda: Moneda;
}
export interface PaqueteComercialResponse extends PaqueteComercialRequest {
  id: string;
  negocioId: string;
  negocioNombre: string;
  estado: EstadoPaqueteComercial;
  totalItems: number;
  items: PaqueteComercialItemResponse[];
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}
export interface CotizarPaqueteComercialRequest {
  fechaInicio: string;
  cantidadPersonas: number;
}
export interface CrearViajeDesdePaqueteRequest extends CotizarPaqueteComercialRequest {
  nombre: string | null;
}
export interface CotizacionItemPaqueteComercialResponse {
  itemId: string;
  orden: number;
  cotizacion: CotizacionOfertaResponse;
}
export interface CotizacionPaqueteComercialResponse {
  paqueteComercialId: string;
  nombre: string;
  modeloPrecio: ModeloPrecioPaquete;
  precioBasePaquete: number | null;
  monedaPaquete: Moneda | null;
  cantidadPersonas: number;
  cantidadGrupos: number | null;
  fechaInicio: string;
  fechaFin: string;
  cotizacionCompleta: boolean;
  totales: TotalesPaqueteResponse;
  items: CotizacionItemPaqueteComercialResponse[];
  detallePrecio: string;
}
export type ViajeDesdePaquete = PaqueteTuristicoResponse;
export const nombresModeloPaquete: Record<ModeloPrecioPaquete, string> = {
  SUMA_COMPONENTES: 'Suma de componentes', PRECIO_FIJO: 'Precio fijo', POR_PERSONA: 'Por persona', POR_GRUPO: 'Por grupo',
};
export const nombresEstadoPaqueteComercial: Record<EstadoPaqueteComercial, string> = {
  BORRADOR: 'Borrador', PUBLICADO: 'Publicado', INACTIVO: 'Inactivo',
};
