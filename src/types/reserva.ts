import type { Moneda } from './moneda';

export const estadosReserva = ['PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA'] as const;
export type EstadoReserva = typeof estadosReserva[number];

export interface ReservaRequest {
  negocioExperienciaId: number;
  fechaReserva: string;
  cantidadPersonas: number;
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
  negocioId: string;
  negocioNombreComercial: string;
  destinoId: string;
  destinoNombre: string;
  destinoSlug: string;
  experienciaId: string;
  experienciaNombre: string;
  experienciaSlug: string;
  estado: EstadoReserva;
  motivoRechazo: string | null;
  precioReserva: number | null;
  monedaReserva: Moneda;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface ReservaOperadorFiltros {
  estado?: EstadoReserva;
  negocioId?: string;
  fecha?: string;
}
