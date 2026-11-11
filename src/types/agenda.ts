export type TipoBloqueoAgenda = 'RESERVA_EXTERNA' | 'BLOQUEO';
export type OrigenBloqueoAgenda = 'WHATSAPP' | 'TELEFONO' | 'PRESENCIAL' | 'OTRA_PLATAFORMA' | 'OPERADOR' | 'OTRO';
export type EstadoBloqueoAgenda = 'ACTIVO' | 'CANCELADO';

export interface CrearBloqueoAgendaRequest {
  fecha: string;
  salidaProgramadaId: string | null;
  cantidad: number;
  tipo: TipoBloqueoAgenda;
  origen: OrigenBloqueoAgenda;
  clienteNombre: string | null;
  clienteTelefono: string | null;
  observacion: string | null;
}

export interface BloqueoAgendaResponse extends CrearBloqueoAgendaRequest {
  id: string;
  negocioId: string;
  ofertaId: number;
  disponibilidadId: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  estado: EstadoBloqueoAgenda;
  fechaCreacion: string;
  fechaActualizacion: string;
}
