import type { Moneda } from '../types/moneda';

const locales: Record<Moneda, string> = { COP: 'es-CO', USD: 'en-US', EUR: 'es-ES' };
export const formatearPrecio = (valor: number, moneda: Moneda) => new Intl.NumberFormat(locales[moneda], {
  style: 'currency', currency: moneda, currencyDisplay: 'code',
}).format(valor);
