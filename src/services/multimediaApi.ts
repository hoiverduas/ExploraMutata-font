import { apiRequest } from './http';
import type { MediaAssetResponse, TipoEntidadMedia } from '../types/multimedia';

interface PublicOptions { signal?: AbortSignal }

function ruta(tipo: TipoEntidadMedia, entidadId: string): string {
  const id = encodeURIComponent(entidadId);
  switch (tipo) {
    case 'NEGOCIO': return `/api/v1/public/negocios/${id}/multimedia`;
    case 'DESTINO': return `/api/v1/public/destinos/${id}/multimedia`;
    case 'EXPERIENCIA': return `/api/v1/public/experiencias/${id}/multimedia`;
    case 'OFERTA': return `/api/v1/public/ofertas/${id}/multimedia`;
    case 'PAQUETE_COMERCIAL': return `/api/v1/public/paquetes-comerciales/${id}/multimedia`;
  }
}

export const multimediaApi = {
  listarPublica(tipo: TipoEntidadMedia, entidadId: string, options: PublicOptions = {}): Promise<MediaAssetResponse[]> {
    return apiRequest<MediaAssetResponse[]>(ruta(tipo, entidadId), {
      public: true,
      signal: options.signal,
    });
  },
};
