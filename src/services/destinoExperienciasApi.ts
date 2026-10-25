import { apiRequest } from './http';
import type { DestinoPublico } from '../types/destino';
import type { Experiencia, ExperienciaPublica } from '../types/experiencia';

const root = '/api/v1/destinos';
const publicRoot = '/api/v1/public';
const relacion = (destinoId: string) => `${root}/${encodeURIComponent(destinoId)}/experiencias`;
interface PublicOptions {
  signal?: AbortSignal;
}

export const destinoExperienciasApi = {
  listar(destinoId: string): Promise<Experiencia[]> {
    return apiRequest<Experiencia[]>(relacion(destinoId));
  },
  reemplazar(destinoId: string, experienciasIds: string[]): Promise<Experiencia[]> {
    return apiRequest<Experiencia[]>(relacion(destinoId), {
      method: 'PUT', body: JSON.stringify({ experienciasIds }),
    });
  },
  experienciasPublicas(destinoSlug: string, options: PublicOptions = {}): Promise<ExperienciaPublica[]> {
    return apiRequest<ExperienciaPublica[]>(`${publicRoot}/destinos/${encodeURIComponent(destinoSlug)}/experiencias`, {
      public: true, signal: options.signal,
    });
  },
  destinosPublicos(experienciaSlug: string, options: PublicOptions = {}): Promise<DestinoPublico[]> {
    return apiRequest<DestinoPublico[]>(`${publicRoot}/experiencias/${encodeURIComponent(experienciaSlug)}/destinos`, {
      public: true, signal: options.signal,
    });
  },
};
