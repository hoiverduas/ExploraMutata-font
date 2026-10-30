import type { CategoriaNegocio } from './catalogo';
import type { CotizacionOfertaResponse } from './cotizacion';
import type { Moneda } from './moneda';
import type { ModeloPrecioPaquete } from './paqueteComercial';
import type { EstadoReserva, ReservaResponse } from './reserva';

export const estadosPaqueteTuristico = ['BORRADOR', 'RESERVADO', 'CANCELADO'] as const;
export type EstadoPaqueteTuristico = typeof estadosPaqueteTuristico[number];

export const estadosResumenPaquete = [
  'BORRADOR', 'PENDIENTE', 'PARCIALMENTE_CONFIRMADO', 'CONFIRMADO',
  'PARCIALMENTE_RECHAZADO', 'RECHAZADO', 'CANCELADO', 'COMPLETADO', 'MIXTO',
] as const;
export type EstadoResumenPaquete = typeof estadosResumenPaquete[number];

export interface CrearPaqueteTuristicoRequest {
  nombre: string;
}

export interface ActualizarPaqueteTuristicoRequest {
  nombre: string;
}

export interface PaqueteTuristicoItemRequest {
  ofertaId: number;
  varianteId?: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  cantidadPersonas: number;
  cantidadTrayectos: number | null;
  franjaId?: string | null;
  salidaId?: string | null;
  orden: number | null;
  observaciones: string | null;
}

export interface PaqueteTuristicoItem extends PaqueteTuristicoItemRequest {
  id: string;
  varianteId: string | null;
  varianteNombre: string | null;
  ofertaNombre: string;
  categoria: CategoriaNegocio;
  negocioId: string;
  negocioNombreComercial: string;
  franjaHorariaId: string | null;
  salidaProgramadaId: string | null;
  orden: number;
  reservaId: string | null;
  estadoReserva: EstadoReserva | null;
  totalReserva: number | null;
  monedaReserva: Moneda | null;
}
export type PaqueteTuristicoItemResponse = PaqueteTuristicoItem;

export interface TotalesPaqueteResponse {
  cop: number | null;
  usd: number | null;
  eur: number | null;
  conversionCompleta: boolean;
}

export interface PaqueteTuristico {
  id: string;
  turistaId: string;
  nombre: string;
  estado: EstadoPaqueteTuristico;
  estadoResumen: EstadoResumenPaquete;
  paqueteComercialId: string | null;
  precioComercialAplicado: boolean | null;
  modeloPrecioComercial: ModeloPrecioPaquete | null;
  precioComercialBase: number | null;
  monedaComercial: Moneda | null;
  totalItems: number;
  totalesReserva: TotalesPaqueteResponse | null;
  fechaCotizacion: string | null;
  items: PaqueteTuristicoItem[];
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}
export type PaqueteTuristicoResponse = PaqueteTuristico;

export interface CotizacionItemPaqueteResponse {
  itemId: string;
  orden: number;
  cotizacion: CotizacionOfertaResponse;
}

export interface CotizacionPaqueteResponse {
  paqueteId: string;
  nombre: string;
  paqueteComercialId: string | null;
  precioComercialAplicado: boolean;
  modeloPrecioComercial: ModeloPrecioPaquete | null;
  precioComercialBase: number | null;
  monedaComercial: Moneda | null;
  cotizacionCompleta: boolean;
  totales: TotalesPaqueteResponse;
  items: CotizacionItemPaqueteResponse[];
}

export interface ReservaPaqueteResponse {
  paqueteId: string;
  estado: EstadoPaqueteTuristico;
  estadoResumen: EstadoResumenPaquete;
  totalReservas: number;
  totales: TotalesPaqueteResponse;
  reservas: ReservaResponse[];
}
