import type { Moneda } from './moneda';
import type { ModeloPrecio } from './oferta';
import type { TipoDescuentoPromocion } from './configuracionComercialOferta';

export const estadosReserva = ['PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA'] as const;
export type EstadoReserva = typeof estadosReserva[number];

export interface ReservaRequest {
  negocioExperienciaId: number;
  fechaReserva: string;
  fechaFin?: string | null;
  cantidadPersonas: number;
  cantidadTrayectos?: number | null;
  franjaId?: string | null;
  salidaId?: string | null;
  varianteId?: string | null;
  codigoPromocion?: string | null;
  observaciones: string | null;
}

export interface RechazarReservaRequest {
  motivo: string;
}

export interface ReservaResponse {
  id: string;
  turistaId: string;
  turistaNombres: string;
  turistaApellidos: string;
  turistaCorreo: string;
  turistaTelefono: string | null;
  negocioExperienciaId: number;
  paqueteId: string | null;
  paqueteItemId: string | null;
  varianteId: string | null;
  varianteNombre: string | null;
  tarifasAplicadas: string | null;
  negocioId: string;
  negocioNombreComercial: string;
  destinoId: string | null;
  destinoNombre: string | null;
  destinoSlug: string | null;
  experienciaId: string | null;
  experienciaNombre: string | null;
  experienciaSlug: string | null;
  fechaReserva: string;
  fechaFin: string | null;
  cantidadPersonas: number;
  cantidadTrayectos: number | null;
  franjaHorariaId: string | null;
  salidaProgramadaId: string | null;
  horaInicioReserva: string | null;
  horaFinReserva: string | null;
  cantidadUnidadesAlojamiento: number | null;
  horaCheckInAlojamiento: string | null;
  horaCheckOutAlojamiento: string | null;
  observaciones: string | null;
  estado: EstadoReserva;
  motivoRechazo: string | null;
  precioReserva: number | null;
  monedaReserva: Moneda;
  modeloPrecioReserva: ModeloPrecio | null;
  precioUnitarioReserva: number | null;
  totalReserva: number | null;
  subtotalReserva: number | null;
  descuentoReserva: number | null;
  promocionId: string | null;
  promocionNombre: string | null;
  promocionCodigo: string | null;
  tipoDescuentoPromocion: TipoDescuentoPromocion | null;
  valorDescuentoPromocion: number | null;
  detalleCotizacion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface ReservaOperadorFiltros {
  estado?: EstadoReserva;
  negocioId?: string;
  fecha?: string;
}
