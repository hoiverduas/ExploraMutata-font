export type EstadoSolicitudOperador = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
export interface SolicitudOperadorResponse {
  id: string;
  usuarioId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  estado: EstadoSolicitudOperador;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaRevision: string | null;
  revisadaPor: string | null;
  motivoRechazo: string | null;
}
