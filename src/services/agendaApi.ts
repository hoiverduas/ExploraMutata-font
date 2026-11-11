import { apiRequest } from './http';
import type { BloqueoAgendaResponse, CrearBloqueoAgendaRequest } from '../types/agenda';

const root = '/api/v1/operadores/agenda';

export const agendaApi = {
  listar(negocioId: string, ofertaId: number, desde: string, hasta: string): Promise<BloqueoAgendaResponse[]> {
    const p = new URLSearchParams({ negocioId, ofertaId: String(ofertaId), desde, hasta });
    return apiRequest<BloqueoAgendaResponse[]>(`${root}/bloqueos?${p}`);
  },
  crear(negocioId: string, ofertaId: number, body: CrearBloqueoAgendaRequest): Promise<BloqueoAgendaResponse> {
    return apiRequest<BloqueoAgendaResponse>(
      `${root}/negocios/${encodeURIComponent(negocioId)}/ofertas/${ofertaId}/bloqueos`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  },
  cancelar(id: string): Promise<BloqueoAgendaResponse> {
    return apiRequest<BloqueoAgendaResponse>(
      `${root}/bloqueos/${encodeURIComponent(id)}/cancelar`,
      { method: 'PATCH' },
    );
  },
};
