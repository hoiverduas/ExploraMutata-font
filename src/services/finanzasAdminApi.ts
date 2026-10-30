import { apiRequest } from './http';
import type {
  ConciliacionRequest, ConciliacionResponse, CuentaPagoNegocioResponse, DispersionPagoResponse,
  DistribucionPagoResponse, EstadoCuentaPago, LiquidacionResponse, ReembolsoRequest,
  ReembolsoResponse, ReglaComisionRequest, ReglaComisionResponse,
} from '../types/finanzas';

const root = '/api/v1/admin/finanzas';

export const finanzasAdminApi = {
  listarCuentas(estado?: EstadoCuentaPago): Promise<CuentaPagoNegocioResponse[]> {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    return apiRequest<CuentaPagoNegocioResponse[]>(`${root}/cuentas-pago${query}`);
  },
  verificarCuenta(cuentaId: string, identificadorBeneficiarioProveedor: string | null, observacion: string | null): Promise<CuentaPagoNegocioResponse> {
    return apiRequest<CuentaPagoNegocioResponse>(`${root}/cuentas-pago/${encodeURIComponent(cuentaId)}/verificar`, {
      method: 'PATCH',
      body: JSON.stringify({ identificadorBeneficiarioProveedor, observacion }),
    });
  },
  rechazarCuenta(cuentaId: string, motivo: string): Promise<CuentaPagoNegocioResponse> {
    return apiRequest<CuentaPagoNegocioResponse>(`${root}/cuentas-pago/${encodeURIComponent(cuentaId)}/rechazar`, {
      method: 'PATCH', body: JSON.stringify({ motivo }),
    });
  },
  configurarComision(negocioId: string, body: ReglaComisionRequest): Promise<ReglaComisionResponse> {
    return apiRequest<ReglaComisionResponse>(`${root}/negocios/${encodeURIComponent(negocioId)}/reglas-comision`, {
      method: 'POST', body: JSON.stringify(body),
    });
  },
  historialComision(negocioId: string): Promise<ReglaComisionResponse[]> {
    return apiRequest<ReglaComisionResponse[]>(`${root}/negocios/${encodeURIComponent(negocioId)}/reglas-comision`);
  },
  crearLiquidacion(negocioId: string, observacion?: string): Promise<LiquidacionResponse> {
    const p = new URLSearchParams();
    if (observacion?.trim()) p.set('observacion', observacion.trim());
    const q = p.toString() ? `?${p}` : '';
    return apiRequest<LiquidacionResponse>(`${root}/negocios/${encodeURIComponent(negocioId)}/liquidaciones${q}`, { method: 'POST' });
  },
  listarLiquidaciones(): Promise<LiquidacionResponse[]> {
    return apiRequest<LiquidacionResponse[]>(`${root}/liquidaciones`);
  },
  solicitarReembolso(pagoId: string, body: ReembolsoRequest): Promise<ReembolsoResponse> {
    return apiRequest<ReembolsoResponse>(`${root}/pagos/${encodeURIComponent(pagoId)}/reembolsos`, {
      method: 'POST', body: JSON.stringify(body),
    });
  },
  listarReembolsos(pagoId: string): Promise<ReembolsoResponse[]> {
    return apiRequest<ReembolsoResponse[]>(`${root}/pagos/${encodeURIComponent(pagoId)}/reembolsos`);
  },
  listarDistribuciones(pagoId: string): Promise<DistribucionPagoResponse[]> {
    return apiRequest<DistribucionPagoResponse[]>(`${root}/pagos/${encodeURIComponent(pagoId)}/distribuciones`);
  },
  conciliarWompi(body: ConciliacionRequest): Promise<ConciliacionResponse> {
    return apiRequest<ConciliacionResponse>(`${root}/conciliaciones/wompi`, { method: 'POST', body: JSON.stringify(body) });
  },
  listarConciliaciones(): Promise<ConciliacionResponse[]> {
    return apiRequest<ConciliacionResponse[]>(`${root}/conciliaciones`);
  },
  enviarLiquidacionWompi(liquidacionId: string): Promise<DispersionPagoResponse> {
    return apiRequest<DispersionPagoResponse>(`${root}/liquidaciones/${encodeURIComponent(liquidacionId)}/dispersiones/wompi`, { method: 'POST' });
  },
  listarDispersiones(liquidacionId: string): Promise<DispersionPagoResponse[]> {
    return apiRequest<DispersionPagoResponse[]>(`${root}/liquidaciones/${encodeURIComponent(liquidacionId)}/dispersiones`);
  },
  sincronizarDispersion(dispersionId: string): Promise<DispersionPagoResponse> {
    return apiRequest<DispersionPagoResponse>(`${root}/dispersiones/${encodeURIComponent(dispersionId)}/sincronizar`, { method: 'POST' });
  },
  reenviarEstadoIncierto(dispersionId: string): Promise<DispersionPagoResponse> {
    return apiRequest<DispersionPagoResponse>(`${root}/dispersiones/${encodeURIComponent(dispersionId)}/reenviar-estado-incierto`, { method: 'POST' });
  },
  bancosWompi(): Promise<unknown> {
    return apiRequest<unknown>(`${root}/wompi/bancos`);
  },
  cuentasOrigenWompi(): Promise<unknown> {
    return apiRequest<unknown>(`${root}/wompi/cuentas-origen`);
  },
  saludWompi(): Promise<unknown> {
    return apiRequest<unknown>(`${root}/wompi/salud`);
  },
};
