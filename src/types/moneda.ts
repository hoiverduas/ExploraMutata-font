export const monedas = ['COP', 'USD', 'EUR'] as const;
export type Moneda = typeof monedas[number];

export interface PrecioConvertidoResponse {
  cop: number | null;
  usd: number | null;
  eur: number | null;
  fechaTasa: string | null;
  conversionDisponible: boolean;
}
