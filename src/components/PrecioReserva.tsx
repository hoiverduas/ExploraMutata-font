import { formatearPrecio } from '../domain/precios';
import type { Moneda } from '../types/moneda';

export default function PrecioReserva({ precioReserva, monedaReserva }: { precioReserva: number | null; monedaReserva: Moneda }) {
  return <div className="reserva-precio"><span>Precio de referencia de la reserva</span>
    <strong>{precioReserva === null ? 'Precio no especificado' : formatearPrecio(precioReserva, monedaReserva)}</strong>
    <small>Moneda original de la reserva: {monedaReserva}.</small>
  </div>;
}
