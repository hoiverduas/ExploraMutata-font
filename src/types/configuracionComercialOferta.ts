import type { ModeloPrecio, UnidadDuracionOferta } from './oferta';

export type EstadoVariante = 'ACTIVA' | 'INACTIVA';
export type EstadoTarifa = 'ACTIVA' | 'INACTIVA';
export type TipoTarifa = 'GENERAL' | 'RANGO_PERSONAS' | 'TEMPORADA' | 'PROMOCION';
export type TipoInclusion =
  | 'SEGURO' | 'GUIA' | 'ALIMENTACION' | 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'REFRIGERIO'
  | 'TRANSPORTE' | 'ENTRADA' | 'EQUIPO' | 'REGISTRO_FOTOGRAFICO' | 'HOSPEDAJE'
  | 'ACTIVIDAD' | 'BEBIDA' | 'ACCESO' | 'OTRO';

export interface OfertaVarianteResponse {
  id: string;
  ofertaId: number;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  modeloPrecio: ModeloPrecio | null;
  personasIncluidas: number | null;
  capacidadMaxima: number | null;
  duracionCantidad: number | null;
  duracionUnidad: UnidadDuracionOferta | null;
  orden: number | null;
  estado: EstadoVariante;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface OfertaInclusionResponse {
  id: string;
  ofertaId: number;
  varianteId: string | null;
  tipo: TipoInclusion;
  nombre: string;
  descripcion: string | null;
  incluido: boolean;
  orden: number | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface OfertaTarifaResponse {
  id: string;
  ofertaId: number;
  varianteId: string | null;
  nombre: string;
  descripcion: string | null;
  tipo: TipoTarifa;
  precio: number;
  modeloPrecio: ModeloPrecio | null;
  minimoPersonas: number | null;
  maximoPersonas: number | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
  diasSemana: number[];
  prioridad: number | null;
  estado: EstadoTarifa;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface ConfiguracionComercialPublicaResponse {
  variantes: OfertaVarianteResponse[];
  inclusiones: OfertaInclusionResponse[];
  tarifas: OfertaTarifaResponse[];
}
