import { formatearPrecio } from '../domain/precios';
import type { Moneda } from '../types/moneda';

export default function PrecioReserva({ precioReserva, monedaReserva, totalReserva }: { precioReserva: number | null; monedaReserva: Moneda; totalReserva?: number | null }) {
  const importe = totalReserva ?? precioReserva;
  return <div className="reserva-precio"><span>{totalReserva != null ? 'Total reservado' : 'Precio de referencia reservado'}</span>
    <strong>{importe == null ? 'Precio no especificado' : formatearPrecio(importe, monedaReserva)}</strong>
    <small>Moneda original de la reserva: {monedaReserva}.</small>
  </div>;
}
