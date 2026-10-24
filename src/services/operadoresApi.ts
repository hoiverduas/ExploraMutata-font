import { apiRequest, ApiError } from './http';
import type { EstadoSolicitudOperador, SolicitudOperadorResponse } from '../types/operador';
const root = '/api/v1/operadores/solicitudes';
const admin = '/api/v1/admin/operadores/solicitudes';
export const operadoresApi = {
  solicitar: () => apiRequest<SolicitudOperadorResponse>(root, { method: 'POST' }),
  async miSolicitud(): Promise<SolicitudOperadorResponse | null> {
    try { return await apiRequest<SolicitudOperadorResponse>(`${root}/me`); }
    catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
  },
  cancelar: (id: string) => apiRequest<SolicitudOperadorResponse>(`${root}/${encodeURIComponent(id)}/cancelar`, { method: 'PATCH' }),
  listar: (estado?: EstadoSolicitudOperador) => apiRequest<SolicitudOperadorResponse[]>(`${admin}${estado ? `?estado=${estado}` : ''}`),
  aprobar: (id: string) => apiRequest<SolicitudOperadorResponse>(`${admin}/${encodeURIComponent(id)}/aprobar`, { method: 'PATCH' }),
  rechazar: (id: string, motivo: string) => apiRequest<SolicitudOperadorResponse>(`${admin}/${encodeURIComponent(id)}/rechazar`, { method: 'PATCH', body: JSON.stringify({ motivo }) }),
};
