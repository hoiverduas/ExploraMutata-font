import { apiRequest } from './http';
import type { Moneda, PrecioConvertidoResponse } from '../types/moneda';

interface PublicOptions {
  signal?: AbortSignal;
}

export const monedasApi = {
  convertir(monto: number, origen: Moneda, options: PublicOptions = {}): Promise<PrecioConvertidoResponse> {
    const parametros = new URLSearchParams({ monto: String(monto), origen });
    return apiRequest<PrecioConvertidoResponse>(`/api/v1/public/monedas/convertir?${parametros}`, {
      public: true, signal: options.signal,
    });
  },
};
