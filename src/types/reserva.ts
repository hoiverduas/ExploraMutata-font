import type { Moneda } from './moneda';
import type { ModeloPrecio } from './oferta';

export const estadosReserva = ['PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA'] as const;
export type EstadoReserva = typeof estadosReserva[number];

export interface ReservaRequest {
  negocioExperienciaId: number;
  fechaReserva: string;
  fechaFin?: string | null;
  cantidadPersonas: number;
  cantidadTrayectos?: number | null;
  observaciones: string | null;
}

export interface RechazarReservaRequest {
  motivo: string;
}

export interface ReservaResponse extends ReservaRequest {
  id: string;
  turistaId: string;
  turistaNombres: string;
  turistaApellidos: string;
  turistaCorreo: string;
  turistaTelefono: string | null;
  paqueteId: string | null;
  paqueteItemId: string | null;
  negocioId: string;
  negocioNombreComercial: string;
  destinoId: string | null;
  destinoNombre: string | null;
  destinoSlug: string | null;
  experienciaId: string | null;
  experienciaNombre: string | null;
  experienciaSlug: string | null;
  fechaFin: string | null;
  cantidadTrayectos: number | null;
  estado: EstadoReserva;
  motivoRechazo: string | null;
  precioReserva: number | null;
  monedaReserva: Moneda;
  modeloPrecioReserva: ModeloPrecio | null;
  precioUnitarioReserva: number | null;
  totalReserva: number | null;
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
