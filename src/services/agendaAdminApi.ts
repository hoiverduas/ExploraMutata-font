import { apiRequest } from './http';
import type { AgendaAdminOfertaResponse, AgendaAdminResponse } from '../types/agendaAdmin';

const root = '/api/v1/admin/agenda';

export const agendaAdminApi = {
  listarOfertas(negocioId: string): Promise<AgendaAdminOfertaResponse[]> {
    return apiRequest<AgendaAdminOfertaResponse[]>(
      `${root}/negocios/${encodeURIComponent(negocioId)}/ofertas`
    );
  },
  consultar(negocioId: string, ofertaId: number, desde: string, hasta: string): Promise<AgendaAdminResponse> {
    const p = new URLSearchParams({ negocioId, ofertaId: String(ofertaId), desde, hasta });
    return apiRequest<AgendaAdminResponse>(`${root}?${p}`);
  },
};
