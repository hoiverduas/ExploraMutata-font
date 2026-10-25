import type { Moneda, PrecioConvertidoResponse } from './moneda';

export const estadosOfertaExperiencia = ['BORRADOR', 'ACTIVA', 'INACTIVA'] as const;
export type EstadoOfertaExperiencia = typeof estadosOfertaExperiencia[number];

export interface NegocioExperienciaRequest {
  destinoId: string;
  experienciaId: string;
  precioDesde: number | null;
  moneda: Moneda;
  reservaRequerida: boolean;
  descripcionOferta: string | null;
}

export interface NegocioExperiencia extends NegocioExperienciaRequest {
  id: number;
  negocioId: string;
  estado: EstadoOfertaExperiencia;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface OfertaExperienciaMonedaResponse {
  id: number;
  negocioId: string;
  negocioNombreComercial: string;
  correoContacto: string;
  telefonoContacto: string;
  destinoId: string;
  destinoNombre: string;
  destinoSlug: string;
  experienciaId: string;
  experienciaNombre: string;
  experienciaSlug: string;
  precioDesde: number | null;
  moneda: Moneda;
  preciosConvertidos: PrecioConvertidoResponse | null;
  reservaRequerida: boolean;
  descripcionOferta: string | null;
}
