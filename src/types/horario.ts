export type EstadoFranjaHorario = 'ACTIVA' | 'INACTIVA';
export type EstadoSalidaProgramada = 'ABIERTA' | 'CERRADA' | 'CANCELADA';
export type OrigenSalidaProgramada = 'RECURRENTE' | 'ESPECIAL';

export interface FranjaHorariaResponse {
  id: string;
  ofertaId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string | null;
  cupoTotal: number;
  nombre: string | null;
  puntoEncuentro: string | null;
  estado: EstadoFranjaHorario;
}

export interface FranjaHorariaRequest {
  diaSemana: number;
  horaInicio: string;
  horaFin: string | null;
  cupoTotal: number;
  nombre: string | null;
  puntoEncuentro: string | null;
  estado: EstadoFranjaHorario | null;
}

export interface SalidaProgramadaResponse {
  id: string | null;
  ofertaId: number;
  franjaHorariaId: string | null;
  fecha: string;
  horaInicio: string;
  horaFin: string | null;
  cupoTotal: number;
  cupoReservado: number;
  cupoDisponible: number;
  nombre: string | null;
  puntoEncuentro: string | null;
  origen: OrigenSalidaProgramada;
  estado: EstadoSalidaProgramada;
}

export interface SalidaProgramadaRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string | null;
  cupoTotal: number;
  nombre: string | null;
  puntoEncuentro: string | null;
  estado: EstadoSalidaProgramada | null;
}

export interface HorariosOfertaResponse {
  ofertaId: number;
  requiereHorario: boolean;
  desde: string;
  hasta: string;
  salidas: SalidaProgramadaResponse[];
}

export interface HorarioCotizacionResponse {
  franjaId: string | null;
  salidaId: string | null;
  fecha: string;
  horaInicio: string;
  horaFin: string | null;
  nombre: string | null;
  puntoEncuentro: string | null;
  origen: OrigenSalidaProgramada;
  cupoTotal: number;
  cupoDisponible: number;
}
