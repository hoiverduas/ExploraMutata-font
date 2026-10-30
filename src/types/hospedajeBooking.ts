import type { EstadoDisponibilidad } from './disponibilidad';

export type OrigenDisponibilidad = 'MANUAL' | 'AUTO_HOSPEDAJE';

export interface NocheHospedajeResponse {
  fecha: string;
  unidadesTotales: number;
  unidadesReservadas: number;
  unidadesDisponibles: number;
  estado: EstadoDisponibilidad;
  origen: OrigenDisponibilidad;
}

export interface DisponibilidadHospedajeResponse {
  ofertaId: number;
  checkIn: string;
  checkOut: string;
  horaCheckIn: string | null;
  horaCheckOut: string | null;
  noches: number;
  personas: number;
  capacidadPorUnidad: number;
  unidadesNecesarias: number;
  cantidadUnidadesBase: number;
  disponible: boolean;
  detalle: string;
  nochesDetalle: NocheHospedajeResponse[];
}
