import { nombresEstadoReserva } from '../domain/reservas';
import type { EstadoReserva } from '../types/reserva';

export default function EstadoReservaBadge({ estado }: { estado: EstadoReserva }) {
  return <span className={`status-pill status-reserva-${estado.toLowerCase()}`}>{nombresEstadoReserva[estado]}</span>;
}
