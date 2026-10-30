import type { TipoInventario } from './oferta';

export type EstadoDisponibilidad = 'ABIERTA' | 'CERRADA';
export type UnidadCupo = 'PERSONA' | 'UNIDAD' | 'VEHICULO' | 'MESA' | 'GRUPO' | 'TRAYECTO' | 'RESERVA';

export interface DisponibilidadDiaResponse {
  fecha: string;
  cupoTotal: number;
  cupoReservado: number;
  cupoDisponible: number;
  estado: EstadoDisponibilidad;
}

export interface DisponibilidadOfertaResponse {
  ofertaId: number;
  controlaDisponibilidad: boolean;
  unidadCupo: UnidadCupo | null;
  tipoInventario: TipoInventario | null;
  capacidadPorInventario: number | null;
  dias: DisponibilidadDiaResponse[];
}

export interface ControlDisponibilidadResponse {
  ofertaId: number;
  controlaDisponibilidad: boolean;
  unidadCupo: UnidadCupo | null;
  tipoInventario: TipoInventario | null;
  capacidadPorInventario: number | null;
}

export interface ConfigurarDisponibilidadRequest {
  fechaInicio: string;
  fechaFin: string;
  cupoTotal: number;
  estado: EstadoDisponibilidad;
}

export interface ConfigurarControlDisponibilidadRequest {
  controlaDisponibilidad: boolean;
  tipoInventario: TipoInventario | null;
  capacidadPorInventario: number | null;
}
