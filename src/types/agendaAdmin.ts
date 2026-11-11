import type { EstadoReserva } from './reserva';
import type { EstadoOferta } from './oferta';
import type { EstadoDisponibilidad } from './disponibilidad';
import type { EstadoSalidaProgramada } from './horario';
import type { EstadoBloqueoAgenda, OrigenBloqueoAgenda, TipoBloqueoAgenda } from './agenda';

export interface AgendaAdminOfertaResponse {
  id: number;
  nombre: string;
  requiereHorario: boolean | null;
  controlaDisponibilidad: boolean | null;
  capacidadMaxima: number | null;
  estado: EstadoOferta;
}

export interface AgendaAdminDiaResponse {
  fecha: string;
  cupoTotal: number;
  cupoReservado: number;
  cupoDisponible: number;
  estado: EstadoDisponibilidad;
}

export interface AgendaAdminSalidaResponse {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string | null;
  cupoTotal: number;
  cupoReservado: number;
  cupoDisponible: number;
  nombre: string | null;
  estado: EstadoSalidaProgramada;
}

export interface AgendaAdminReservaResponse {
  id: string;
  fechaReserva: string;
  fechaFin: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  cantidadPersonas: number;
  estado: EstadoReserva;
}

export interface AgendaAdminBloqueoResponse {
  id: string;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  cantidad: number;
  tipo: TipoBloqueoAgenda;
  origen: OrigenBloqueoAgenda;
  estado: EstadoBloqueoAgenda;
}

export interface AgendaAdminResponse {
  ofertaId: number;
  ofertaNombre: string;
  requiereHorario: boolean | null;
  desde: string;
  hasta: string;
  dias: AgendaAdminDiaResponse[];
  salidas: AgendaAdminSalidaResponse[];
  reservas: AgendaAdminReservaResponse[];
  bloqueos: AgendaAdminBloqueoResponse[];
}
