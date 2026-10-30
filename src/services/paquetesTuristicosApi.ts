import { apiRequest } from './http';
import type {
  ActualizarPaqueteTuristicoRequest, CotizacionPaqueteResponse, CrearPaqueteTuristicoRequest,
  PaqueteTuristico, PaqueteTuristicoItemRequest, ReservaPaqueteResponse,
} from '../types/paqueteTuristico';

const root = '/api/v1/paquetes';
const item = (id: string) => `${root}/${encodeURIComponent(id)}`;
const composicion = (id: string, itemId: string) => `${item(id)}/items/${encodeURIComponent(itemId)}`;
interface RequestOptions {
  signal?: AbortSignal;
}

function contenido(body: PaqueteTuristicoItemRequest) {
  return JSON.stringify({
    ofertaId: body.ofertaId,
    varianteId: body.varianteId ?? null,
    fechaInicio: body.fechaInicio,
    fechaFin: body.fechaFin,
    cantidadPersonas: body.cantidadPersonas,
    cantidadTrayectos: body.cantidadTrayectos,
    franjaId: body.franjaId ?? null,
    salidaId: body.salidaId ?? null,
    orden: body.orden,
    observaciones: body.observaciones,
  });
}

export const paquetesTuristicosApi = {
  crear(body: CrearPaqueteTuristicoRequest): Promise<PaqueteTuristico> {
    return apiRequest<PaqueteTuristico>(root, { method: 'POST', body: JSON.stringify({ nombre: body.nombre }) });
  },
  listar(options: RequestOptions = {}): Promise<PaqueteTuristico[]> {
    return apiRequest<PaqueteTuristico[]>(`${root}/me`, { signal: options.signal });
  },
  buscar(id: string, options: RequestOptions = {}): Promise<PaqueteTuristico> {
    return apiRequest<PaqueteTuristico>(item(id), { signal: options.signal });
  },
  actualizar(id: string, body: ActualizarPaqueteTuristicoRequest): Promise<PaqueteTuristico> {
    return apiRequest<PaqueteTuristico>(item(id), { method: 'PATCH', body: JSON.stringify({ nombre: body.nombre }) });
  },
  agregarItem(id: string, body: PaqueteTuristicoItemRequest): Promise<PaqueteTuristico> {
    return apiRequest<PaqueteTuristico>(`${item(id)}/items`, { method: 'POST', body: contenido(body) });
  },
  actualizarItem(id: string, itemId: string, body: PaqueteTuristicoItemRequest): Promise<PaqueteTuristico> {
    return apiRequest<PaqueteTuristico>(composicion(id, itemId), { method: 'PUT', body: contenido(body) });
  },
  eliminarItem(id: string, itemId: string): Promise<PaqueteTuristico> {
    return apiRequest<PaqueteTuristico>(composicion(id, itemId), { method: 'DELETE' });
  },
  cotizar(id: string): Promise<CotizacionPaqueteResponse> {
    return apiRequest<CotizacionPaqueteResponse>(`${item(id)}/cotizar`, { method: 'POST' });
  },
  reservar(id: string): Promise<ReservaPaqueteResponse> {
    return apiRequest<ReservaPaqueteResponse>(`${item(id)}/reservar`, { method: 'POST' });
  },
  cancelar(id: string): Promise<PaqueteTuristico> {
    return apiRequest<PaqueteTuristico>(`${item(id)}/cancelar`, { method: 'PATCH' });
  },
};
