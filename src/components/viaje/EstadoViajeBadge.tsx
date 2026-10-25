import type { EstadoResumenPaquete } from '../../types/paqueteTuristico';

export const nombresEstadoViaje: Record<EstadoResumenPaquete, string> = {
  BORRADOR: 'Borrador', PENDIENTE: 'Pendiente', PARCIALMENTE_CONFIRMADO: 'Parcialmente confirmado',
  CONFIRMADO: 'Confirmado', PARCIALMENTE_RECHAZADO: 'Parcialmente rechazado', RECHAZADO: 'Rechazado',
  CANCELADO: 'Cancelado', COMPLETADO: 'Completado', MIXTO: 'Estado mixto',
};
export default function EstadoViajeBadge({ estado }: { estado: EstadoResumenPaquete }) {
  return <span className={`status-pill status-viaje-${estado.toLowerCase()}`}>{nombresEstadoViaje[estado]}</span>;
}
