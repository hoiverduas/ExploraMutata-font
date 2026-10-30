import { apiRequest } from './http';
import type {
  ConciliacionRequest, ConciliacionResponse, CuentaPagoNegocioResponse, DispersionPagoResponse,
  DistribucionPagoResponse, EstadoCuentaPago, LiquidacionResponse, ReembolsoRequest,
  ReembolsoResponse, ReglaComisionRequest, ReglaComisionResponse, WompiCuentaOrigen,
} from '../types/finanzas';

const root = '/api/v1/admin/finanzas';

function extraerCuentasOrigen(payload: unknown): WompiCuentaOrigen[] {
  const candidatos = (valor: unknown): unknown[] => {
    if (Array.isArray(valor)) return valor;
    if (!valor || typeof valor !== 'object') return [];
    const obj = valor as Record<string, unknown>;
    for (const clave of ['data', 'items', 'accounts', 'results', 'content']) {
      const encontrado = candidatos(obj[clave]);
      if (encontrado.length) return encontrado;
    }
    return [];
  };

  return candidatos(payload).flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const cuenta = item as Record<string, unknown>;
    if (typeof cuenta.id !== 'string' || typeof cuenta.status !== 'string') return [];
    const bancoRaw = cuenta.bank;
    const banco = bancoRaw && typeof bancoRaw === 'object'
      ? bancoRaw as Record<string, unknown>
      : null;

    return [{
      id: cuenta.id,
      balanceInCents: typeof cuenta.balanceInCents === 'number' ? cuenta.balanceInCents : null,
      number: typeof cuenta.number === 'string' ? cuenta.number : null,
      status: cuenta.status,
      isMain: typeof cuenta.isMain === 'boolean' ? cuenta.isMain : null,
      accountType: typeof cuenta.accountType === 'string' ? cuenta.accountType : null,
      bank: banco ? {
        code: typeof banco.code === 'string' ? banco.code : null,
        name: typeof banco.name === 'string' ? banco.name : null,
      } : null,
      updatedAt: typeof cuenta.updatedAt === 'string' ? cuenta.updatedAt : null,
    }];
  });
}

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
  async cuentasOrigenWompi(): Promise<WompiCuentaOrigen[]> {
    const payload = await apiRequest<unknown>(`${root}/wompi/cuentas-origen`);
    return extraerCuentasOrigen(payload);
  },
  saludWompi(): Promise<unknown> {
    return apiRequest<unknown>(`${root}/wompi/salud`);
  },
};
