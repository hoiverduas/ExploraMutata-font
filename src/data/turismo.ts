import type { TipoDestino } from '../types/destino';
import type { DificultadExperiencia } from '../types/experiencia';

export const nombresTipoDestino: Record<TipoDestino, string> = {
  CASCADA: 'Cascada', RIO: 'Río', BALNEARIO: 'Balneario', MIRADOR: 'Mirador',
  RESERVA_NATURAL: 'Reserva natural', PARQUE: 'Parque', SITIO_CULTURAL: 'Sitio cultural', OTRO: 'Otro',
};
export const nombresDificultad: Record<DificultadExperiencia, string> = {
  BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', NO_APLICA: 'No aplica',
};
