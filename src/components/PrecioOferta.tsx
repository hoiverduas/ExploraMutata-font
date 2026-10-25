import { useEffect, useState } from 'react';
import { useMoneda } from '../context/MonedaContext';
import { monedasApi } from '../services/monedasApi';
import { formatearPrecio } from '../domain/precios';
import type { Moneda, PrecioConvertidoResponse } from '../types/moneda';

interface Props {
  precioDesde: number | null;
  moneda: Moneda;
  preciosConvertidos?: PrecioConvertidoResponse | null;
}
interface ConversionConsultada {
  precioDesde: number;
  monedaOrigen: Moneda;
  precios: PrecioConvertidoResponse | null;
}
const campos: Record<Moneda, 'cop' | 'usd' | 'eur'> = { COP: 'cop', USD: 'usd', EUR: 'eur' };

export default function PrecioOferta({ precioDesde, moneda: monedaOrigen, preciosConvertidos }: Props) {
  const { moneda: monedaSeleccionada } = useMoneda();
  const [consulta, setConsulta] = useState<ConversionConsultada | null>(null);
  const consultaActual = consulta && consulta.precioDesde === precioDesde && consulta.monedaOrigen === monedaOrigen ? consulta : null;
  const necesitaConsulta = precioDesde !== null && monedaSeleccionada !== monedaOrigen && preciosConvertidos == null && !consultaActual;

  useEffect(() => {
    if (!necesitaConsulta || precioDesde === null) return;
    const controller = new AbortController();
    void monedasApi.convertir(precioDesde, monedaOrigen, { signal: controller.signal })
      .then(precios => {
        if (!controller.signal.aborted) setConsulta({ precioDesde, monedaOrigen, precios });
      })
      .catch(() => {
        // Un fallo de conversión no impide consultar la oferta ni modifica su precio original.
        if (!controller.signal.aborted) setConsulta({ precioDesde, monedaOrigen, precios: null });
      });
    return () => controller.abort();
  }, [necesitaConsulta, precioDesde, monedaOrigen]);

  if (precioDesde === null) return <p className="oferta-precio">Consulta el precio con el negocio.</p>;
  if (monedaSeleccionada === monedaOrigen) return <p className="oferta-precio"><strong>Desde {formatearPrecio(precioDesde, monedaOrigen)}</strong></p>;

  const precios = preciosConvertidos ?? consultaActual?.precios;
  const convertido = precios?.conversionDisponible ? precios[campos[monedaSeleccionada]] : null;
  if (convertido != null) return <p className="oferta-precio">
    <strong>Desde {formatearPrecio(convertido, monedaSeleccionada)}</strong>
    <small>Precio convertido{precios?.fechaTasa ? ` · Tasa del ${precios.fechaTasa}` : ''}.</small>
  </p>;

  return <p className="oferta-precio"><strong>Desde {formatearPrecio(precioDesde, monedaOrigen)}</strong>
    <small>{necesitaConsulta
      ? `Consultando conversión a ${monedaSeleccionada}…`
      : `Conversión a ${monedaSeleccionada} no disponible. Se muestra el precio original en ${monedaOrigen}.`}</small>
  </p>;
}
