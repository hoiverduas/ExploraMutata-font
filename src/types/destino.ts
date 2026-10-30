export const tiposDestino = [
  'CASCADA', 'RIO', 'BALNEARIO', 'MIRADOR', 'RESERVA_NATURAL', 'PARQUE', 'SITIO_CULTURAL', 'OTRO',
] as const;
export type TipoDestino = typeof tiposDestino[number];

export const estadosDestino = ['BORRADOR', 'PUBLICADO', 'INACTIVO'] as const;
export type EstadoDestino = typeof estadosDestino[number];

export interface DestinoRequest {
  nombre: string;
  tipo: TipoDestino;
  descripcion: string | null;
  ubicacionReferencia: string | null;
  direccion: string | null;
  municipio: string | null;
  vereda: string | null;
  latitud: number | null;
  longitud: number | null;
  comoLlegar: string | null;
  recomendaciones: string | null;
}

export interface DestinoPublico extends DestinoRequest {
  id: string;
  slug: string;
}

export interface Destino extends DestinoPublico {
  estado: EstadoDestino;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}
