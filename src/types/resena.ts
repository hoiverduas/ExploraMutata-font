export type EstadoResena = 'PUBLICADA' | 'OCULTA' | 'RETIRADA';

export interface ResenaRequest {
  reservaId: string;
  calificacion: number;
  comentario: string | null;
}

export interface ActualizarResenaRequest {
  calificacion: number;
  comentario: string | null;
}

export interface ResponderResenaRequest {
  respuesta: string;
}

export interface ModerarResenaRequest {
  estado: 'PUBLICADA' | 'OCULTA';
  motivo: string | null;
}

export interface ResenaResponse {
  id: string;
  reservaId: string;
  negocioId: string;
  ofertaId: number;
  calificacion: number;
  comentario: string | null;
  estado: EstadoResena;
  respuestaOperador: string | null;
  fechaRespuesta: string | null;
  motivoModeracion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ResenaPublicaResponse {
  id: string;
  calificacion: number;
  comentario: string | null;
  respuestaOperador: string | null;
  fechaRespuesta: string | null;
  fechaCreacion: string;
}

export interface ResumenResenasResponse {
  negocioId: string;
  cantidad: number;
  promedio: number;
}
