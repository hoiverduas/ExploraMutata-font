import type { Moneda, PrecioConvertidoResponse } from './moneda';
import type { ModeloPrecio } from './oferta';

export interface CotizacionOfertaRequest {
  cantidadPersonas: number;
  fechaInicio: string;
  fechaFin: string | null;
  cantidadTrayectos: number | null;
}
export interface CotizacionOfertaResponse {
  ofertaId: number;
  ofertaNombre: string;
  modeloPrecio: ModeloPrecio;
  precioBase: number | null;
  moneda: Moneda;
  cantidadPersonas: number;
  fechaInicio: string;
  fechaFin: string | null;
  cantidadDias: number | null;
  cantidadNoches: number | null;
  cantidadTrayectos: number | null;
  cantidadUnidades: number | null;
  total: number | null;
  totalConvertido: PrecioConvertidoResponse | null;
  cotizacionDisponible: boolean;
  detalle: string;
}
