import { useMoneda } from '../../context/MonedaContext';
import { formatearPrecio } from '../../domain/precios';
import type { Moneda } from '../../types/moneda';
import type { TotalesPaqueteResponse } from '../../types/paqueteTuristico';

export default function TotalesViaje({ totales, historico = false }: { totales: TotalesPaqueteResponse; historico?: boolean }) {
  const { moneda } = useMoneda();
  const valores: Record<Moneda, number | null> = { COP: totales.cop, USD: totales.usd, EUR: totales.eur };
  return <div className="viaje-totales">
    <span>{historico ? 'Totales guardados al reservar' : 'Total del viaje'}</span>
    {historico ? <div className="viaje-total-monedas">{(['COP','USD','EUR'] as const).map(codigo => valores[codigo] === null ? null : <strong key={codigo}>{formatearPrecio(valores[codigo], codigo)}</strong>)}</div>
      : <strong>{valores[moneda] === null ? `Total en ${moneda} no disponible` : formatearPrecio(valores[moneda], moneda)}</strong>}
    {!totales.conversionCompleta && <small>No están disponibles todas las conversiones de moneda. Consulta los valores mostrados.</small>}
    {historico && <small>Totales guardados en la fecha de la reserva. Los importes originales de cada servicio se muestran en el itinerario.</small>}
  </div>;
}
