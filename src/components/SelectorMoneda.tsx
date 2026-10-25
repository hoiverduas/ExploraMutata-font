import { useId } from 'react';
import { useMoneda } from '../context/MonedaContext';
import { monedas } from '../types/moneda';
import type { Moneda } from '../types/moneda';

const nombres: Record<Moneda, string> = {
  COP: 'COP · Peso colombiano',
  USD: 'USD · Dólar estadounidense',
  EUR: 'EUR · Euro',
};

export default function SelectorMoneda() {
  const id = useId();
  const { moneda, seleccionarMoneda } = useMoneda();
  return <label className="selector-moneda" htmlFor={id}>Moneda
    <select id={id} value={moneda} aria-label="Moneda para mostrar los precios" onChange={event => {
      const seleccion = monedas.find(opcion => opcion === event.currentTarget.value);
      if (seleccion) seleccionarMoneda(seleccion);
    }}>
      {monedas.map(opcion => <option key={opcion} value={opcion}>{nombres[opcion]}</option>)}
    </select>
  </label>;
}
