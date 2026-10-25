import type { EstadoReserva } from '../types/reserva';

export const nombresEstadoReserva: Record<EstadoReserva, string> = {
  PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', RECHAZADA: 'Rechazada', CANCELADA: 'Cancelada', COMPLETADA: 'Completada',
};
export const puedeCancelarReserva = (estado: EstadoReserva) => estado === 'PENDIENTE' || estado === 'CONFIRMADA';

// La reserva es una fecha civil. Su mínimo sigue la zona que usa el servicio backend.
export function fechaActualReservas(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const valor = (tipo: string) => partes.find(parte => parte.type === tipo)?.value ?? '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

export function esFechaReservaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const instante = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(instante.getTime()) && instante.toISOString().slice(0, 10) === fecha;
}

export function formatearFechaReserva(fecha: string): string {
  if (!esFechaReservaValida(fecha)) return fecha;
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${fecha}T00:00:00Z`));
}
