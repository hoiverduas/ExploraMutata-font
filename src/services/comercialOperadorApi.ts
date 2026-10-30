import { apiRequest } from './http';
import type { CargoSuscripcionResponse, ContratoComercialResponse, PlanComercialResponse } from '../types/comercial';

const root = '/api/v1/operadores/comercial';
const enc = encodeURIComponent;

export const comercialOperadorApi = {
  listarPlanes(): Promise<PlanComercialResponse[]> {
    return apiRequest<PlanComercialResponse[]>(root + '/planes');
  },
  contratoActual(negocioId: string): Promise<ContratoComercialResponse> {
    return apiRequest<ContratoComercialResponse>(root + '/negocios/' + enc(negocioId) + '/contrato');
  },
  listarCargos(negocioId: string): Promise<CargoSuscripcionResponse[]> {
    return apiRequest<CargoSuscripcionResponse[]>(root + '/negocios/' + enc(negocioId) + '/cargos');
  },
};
