export const dificultadesExperiencia = ['BAJA', 'MEDIA', 'ALTA', 'NO_APLICA'] as const;
export type DificultadExperiencia = typeof dificultadesExperiencia[number];

export const estadosExperiencia = ['BORRADOR', 'ACTIVA', 'INACTIVA'] as const;
export type EstadoExperiencia = typeof estadosExperiencia[number];

export interface ExperienciaRequest {
  nombre: string;
  descripcion: string | null;
  duracionReferencia: string | null;
  dificultad: DificultadExperiencia;
  recomendaciones: string | null;
}

export interface ExperienciaPublica extends ExperienciaRequest {
  id: string;
  slug: string;
}

export interface Experiencia extends ExperienciaPublica {
  estado: EstadoExperiencia;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}
