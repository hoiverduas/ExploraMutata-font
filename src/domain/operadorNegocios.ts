import type { EstadoNegocio } from '../types/negocio';

export type AccionOperador = 'desactivar' | 'solicitar-revision';
export const accionesOperador: Record<EstadoNegocio, readonly AccionOperador[]> = {
  PENDIENTE_VERIFICACION: ['desactivar'],
  ACTIVO: ['desactivar'],
  RECHAZADO: ['solicitar-revision'],
  INACTIVO: ['solicitar-revision'],
  SUSPENDIDO: [],
};
export const puedeEditarNegocioOperador = (estado: EstadoNegocio) =>
  estado === 'PENDIENTE_VERIFICACION' || estado === 'RECHAZADO' || estado === 'INACTIVO';
