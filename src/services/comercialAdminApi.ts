import { apiRequest } from './http';
import type {
  CambioEstadoContratoRequest,
  CargoSuscripcionResponse,
  ContratoComercialRequest,
  ContratoComercialResponse,
  GenerarCargoSuscripcionRequest,
  PagarCargoSuscripcionRequest,
  PlanComercialRequest,
  PlanComercialResponse,
} from '../types/comercial';

const root = '/api/v1/admin/comercial';
const enc = encodeURIComponent;

export const comercialAdminApi = {
  listarPlanes(soloActivos = false): Promise<PlanComercialResponse[]> {
    return apiRequest<PlanComercialResponse[]>(root + '/planes?soloActivos=' + soloActivos);
  },
  crearPlan(body: PlanComercialRequest): Promise<PlanComercialResponse> {
    return apiRequest<PlanComercialResponse>(root + '/planes', {
      method: 'POST', body: JSON.stringify(body),
    });
  },
  actualizarPlan(planId: string, body: PlanComercialRequest): Promise<PlanComercialResponse> {
    return apiRequest<PlanComercialResponse>(root + '/planes/' + enc(planId), {
      method: 'PUT', body: JSON.stringify(body),
    });
  },
  asignarContrato(negocioId: string, body: ContratoComercialRequest): Promise<ContratoComercialResponse> {
    return apiRequest<ContratoComercialResponse>(root + '/negocios/' + enc(negocioId) + '/contratos', {
      method: 'POST', body: JSON.stringify(body),
    });
  },
  contratoActual(negocioId: string): Promise<ContratoComercialResponse> {
    return apiRequest<ContratoComercialResponse>(root + '/negocios/' + enc(negocioId) + '/contrato');
  },
  historialContratos(negocioId: string): Promise<ContratoComercialResponse[]> {
    return apiRequest<ContratoComercialResponse[]>(root + '/negocios/' + enc(negocioId) + '/contratos');
  },
  activarContrato(contratoId: string, body: CambioEstadoContratoRequest): Promise<ContratoComercialResponse> {
    return apiRequest<ContratoComercialResponse>(root + '/contratos/' + enc(contratoId) + '/activar', {
      method: 'PATCH', body: JSON.stringify(body),
    });
  },
  suspenderContrato(contratoId: string, body: CambioEstadoContratoRequest): Promise<ContratoComercialResponse> {
    return apiRequest<ContratoComercialResponse>(root + '/contratos/' + enc(contratoId) + '/suspender', {
      method: 'PATCH', body: JSON.stringify(body),
    });
  },
  cancelarContrato(contratoId: string, body: CambioEstadoContratoRequest): Promise<ContratoComercialResponse> {
    return apiRequest<ContratoComercialResponse>(root + '/contratos/' + enc(contratoId) + '/cancelar', {
      method: 'PATCH', body: JSON.stringify(body),
    });
  },
  generarCargo(contratoId: string, body: GenerarCargoSuscripcionRequest): Promise<CargoSuscripcionResponse> {
    return apiRequest<CargoSuscripcionResponse>(root + '/contratos/' + enc(contratoId) + '/cargos', {
      method: 'POST', body: JSON.stringify(body),
    });
  },
  pagarCargo(cargoId: string, body: PagarCargoSuscripcionRequest): Promise<CargoSuscripcionResponse> {
    return apiRequest<CargoSuscripcionResponse>(root + '/cargos/' + enc(cargoId) + '/pagar', {
      method: 'PATCH', body: JSON.stringify(body),
    });
  },
  anularCargo(cargoId: string, body: CambioEstadoContratoRequest): Promise<CargoSuscripcionResponse> {
    return apiRequest<CargoSuscripcionResponse>(root + '/cargos/' + enc(cargoId) + '/anular', {
      method: 'PATCH', body: JSON.stringify(body),
    });
  },
  listarCargos(negocioId: string): Promise<CargoSuscripcionResponse[]> {
    return apiRequest<CargoSuscripcionResponse[]>(root + '/negocios/' + enc(negocioId) + '/cargos');
  },
};
