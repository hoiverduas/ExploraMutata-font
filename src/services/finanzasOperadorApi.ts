import { apiRequest } from './http';
import type {
  CuentaPagoNegocioRequest, CuentaPagoNegocioResponse, DispersionPagoResponse,
  LiquidacionResponse, MovimientoFinancieroResponse, WompiBanco,
} from '../types/finanzas';

const root = '/api/v1/operadores/finanzas';

function extraerBancos(payload: unknown): WompiBanco[] {
  const candidatos = (valor: unknown): unknown[] => {
    if (Array.isArray(valor)) return valor;
    if (!valor || typeof valor !== 'object') return [];
    const obj = valor as Record<string, unknown>;
    for (const clave of ['data', 'items', 'banks', 'results', 'content']) {
      const encontrado = candidatos(obj[clave]);
      if (encontrado.length) return encontrado;
    }
    return [];
  };

  return candidatos(payload).flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const banco = item as Record<string, unknown>;
    const id = [banco.id, banco.bankId, banco.bank_id].find(v => typeof v === 'string');
    const nombre = [banco.name, banco.nombre, banco.bankName, banco.bank_name].find(v => typeof v === 'string');
    const codigo = [banco.code, banco.codigo, banco.bankCode, banco.bank_code].find(v => typeof v === 'string' || typeof v === 'number');
    const depositoElectronico = [banco.isElectronicDeposit, banco.depositoElectronico, banco.is_electronic_deposit]
      .find(v => typeof v === 'boolean');
    if (typeof id !== 'string' || typeof nombre !== 'string') return [];
    return [{
      id,
      nombre,
      codigo: codigo == null ? null : String(codigo),
      depositoElectronico: depositoElectronico === true,
    }];
  });
}

export const finanzasOperadorApi = {
  registrarCuenta(negocioId: string, body: CuentaPagoNegocioRequest): Promise<CuentaPagoNegocioResponse> {
    return apiRequest<CuentaPagoNegocioResponse>(`${root}/negocios/${encodeURIComponent(negocioId)}/cuentas-pago`, {
      method: 'POST', body: JSON.stringify(body),
    });
  },
  listarCuentas(negocioId: string): Promise<CuentaPagoNegocioResponse[]> {
    return apiRequest<CuentaPagoNegocioResponse[]>(`${root}/negocios/${encodeURIComponent(negocioId)}/cuentas-pago`);
  },
  listarLiquidaciones(negocioId: string): Promise<LiquidacionResponse[]> {
    return apiRequest<LiquidacionResponse[]>(`${root}/negocios/${encodeURIComponent(negocioId)}/liquidaciones`);
  },
  listarMovimientos(negocioId: string): Promise<MovimientoFinancieroResponse[]> {
    return apiRequest<MovimientoFinancieroResponse[]>(`${root}/negocios/${encodeURIComponent(negocioId)}/movimientos`);
  },
  listarDispersiones(negocioId: string, liquidacionId: string): Promise<DispersionPagoResponse[]> {
    return apiRequest<DispersionPagoResponse[]>(`${root}/negocios/${encodeURIComponent(negocioId)}/liquidaciones/${encodeURIComponent(liquidacionId)}/dispersiones`);
  },
  async listarBancosWompi(): Promise<WompiBanco[]> {
    const payload = await apiRequest<unknown>(`${root}/wompi/bancos`);
    return extraerBancos(payload);
  },
};
