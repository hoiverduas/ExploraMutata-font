import { apiRequest } from './http';
import type { OrdenPagoResponse, PagoResponse, PreparacionPagoWompiResponse } from '../types/finanzas';

const root = '/api/v1/pagos';
const STORAGE_KEY = 'explora-mutata.pago-wompi';

export interface PagoWompiSesion {
  ordenId: string;
  reservaId: string;
  referencia: string;
  iniciadoEn: string;
}

export const pagoWompiSesion = {
  guardar(valor: PagoWompiSesion) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(valor));
  },
  obtener(): PagoWompiSesion | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const valor: unknown = JSON.parse(raw);
      if (!valor || typeof valor !== 'object') return null;
      const item = valor as Record<string, unknown>;
      if (typeof item.ordenId !== 'string' || typeof item.reservaId !== 'string' || typeof item.referencia !== 'string') return null;
      return {
        ordenId: item.ordenId,
        reservaId: item.reservaId,
        referencia: item.referencia,
        iniciadoEn: typeof item.iniciadoEn === 'string' ? item.iniciadoEn : '',
      };
    } catch {
      return null;
    }
  },
  limpiar() {
    sessionStorage.removeItem(STORAGE_KEY);
  },
};

export function abrirWebCheckoutWompi(preparacion: PreparacionPagoWompiResponse) {
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = 'https://checkout.wompi.co/p/';
  form.style.display = 'none';

  const campos: Record<string, string> = {
    'public-key': preparacion.llavePublica,
    currency: preparacion.moneda,
    'amount-in-cents': String(preparacion.montoCentavos),
    reference: preparacion.referencia,
    'signature:integrity': preparacion.firmaIntegridad,
  };
  if (preparacion.urlRedireccion) campos['redirect-url'] = preparacion.urlRedireccion;

  Object.entries(campos).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

export const pagosApi = {
  crearOrden(reservaId: string, porcentajePago: number): Promise<OrdenPagoResponse> {
    return apiRequest<OrdenPagoResponse>(`${root}/ordenes/reservas/${encodeURIComponent(reservaId)}`, {
      method: 'POST',
      body: JSON.stringify({ porcentajePago }),
    });
  },
  listarOrdenesReserva(reservaId: string, options: { signal?: AbortSignal } = {}): Promise<OrdenPagoResponse[]> {
    return apiRequest<OrdenPagoResponse[]>(`${root}/ordenes/reservas/${encodeURIComponent(reservaId)}`, {
      signal: options.signal,
    });
  },
  buscarOrden(ordenId: string, options: { signal?: AbortSignal } = {}): Promise<OrdenPagoResponse> {
    return apiRequest<OrdenPagoResponse>(`${root}/ordenes/${encodeURIComponent(ordenId)}`, { signal: options.signal });
  },
  prepararWompi(ordenId: string): Promise<PreparacionPagoWompiResponse> {
    return apiRequest<PreparacionPagoWompiResponse>(`${root}/ordenes/${encodeURIComponent(ordenId)}/wompi`, { method: 'POST' });
  },
  listarIntentos(ordenId: string, options: { signal?: AbortSignal } = {}): Promise<PagoResponse[]> {
    return apiRequest<PagoResponse[]>(`${root}/ordenes/${encodeURIComponent(ordenId)}/intentos`, { signal: options.signal });
  },
};
