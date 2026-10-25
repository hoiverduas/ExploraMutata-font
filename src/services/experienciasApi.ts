import { apiRequest } from './http';
import type { DificultadExperiencia, EstadoExperiencia, Experiencia, ExperienciaPublica, ExperienciaRequest } from '../types/experiencia';

const root = '/api/v1/experiencias';
const publicRoot = '/api/v1/public/experiencias';
const item = (id: string) => `${root}/${encodeURIComponent(id)}`;
interface PublicOptions {
  signal?: AbortSignal;
}

export const experienciasApi = {
  listar(estado?: EstadoExperiencia): Promise<Experiencia[]> {
    return apiRequest<Experiencia[]>(estado ? `${root}/estado/${encodeURIComponent(estado)}` : root);
  },
  buscar(id: string): Promise<Experiencia> {
    return apiRequest<Experiencia>(item(id));
  },
  crear(body: ExperienciaRequest): Promise<Experiencia> {
    return apiRequest<Experiencia>(root, { method: 'POST', body: JSON.stringify(body) });
  },
  actualizar(id: string, body: ExperienciaRequest): Promise<Experiencia> {
    return apiRequest<Experiencia>(item(id), { method: 'PUT', body: JSON.stringify(body) });
  },
  activar(id: string): Promise<Experiencia> {
    return apiRequest<Experiencia>(`${item(id)}/activar`, { method: 'PATCH' });
  },
  desactivar(id: string): Promise<Experiencia> {
    return apiRequest<Experiencia>(`${item(id)}/desactivar`, { method: 'PATCH' });
  },
  listarPublicas(dificultad?: DificultadExperiencia, options: PublicOptions = {}): Promise<ExperienciaPublica[]> {
    const path = dificultad ? `${publicRoot}?dificultad=${encodeURIComponent(dificultad)}` : publicRoot;
    return apiRequest<ExperienciaPublica[]>(path, { public: true, signal: options.signal });
  },
  buscarPublica(slug: string, options: PublicOptions = {}): Promise<ExperienciaPublica> {
    return apiRequest<ExperienciaPublica>(`${publicRoot}/${encodeURIComponent(slug)}`, { public: true, signal: options.signal });
  },
};
