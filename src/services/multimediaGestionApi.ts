import { apiRequest } from './http';
import type {
  MediaAssetResponse, MediaMetadataUpdateRequest, MediaUploadRequest, TipoEntidadMedia,
} from '../types/multimedia';

export interface ContextoMultimedia {
  tipo: TipoEntidadMedia;
  entidadId: string;
  negocioId?: string;
}

function base(contexto: ContextoMultimedia): string {
  const entidadId = encodeURIComponent(contexto.entidadId);
  switch (contexto.tipo) {
    case 'NEGOCIO': {
      if (!contexto.negocioId) throw new Error('Falta negocioId para administrar multimedia del negocio.');
      return `/api/v1/operadores/negocios/${encodeURIComponent(contexto.negocioId)}/multimedia`;
    }
    case 'OFERTA': {
      if (!contexto.negocioId) throw new Error('Falta negocioId para administrar multimedia de la oferta.');
      return `/api/v1/operadores/negocios/${encodeURIComponent(contexto.negocioId)}/ofertas/${entidadId}/multimedia`;
    }
    case 'PAQUETE_COMERCIAL': {
      if (!contexto.negocioId) throw new Error('Falta negocioId para administrar multimedia del paquete.');
      return `/api/v1/operadores/negocios/${encodeURIComponent(contexto.negocioId)}/paquetes-comerciales/${entidadId}/multimedia`;
    }
    case 'DESTINO':
      return `/api/v1/destinos/${entidadId}/multimedia`;
    case 'EXPERIENCIA':
      return `/api/v1/experiencias/${entidadId}/multimedia`;
  }
}

function metadataPart(metadata: MediaUploadRequest): Blob {
  return new Blob([JSON.stringify(metadata)], { type: 'application/json' });
}

export const multimediaGestionApi = {
  listar(contexto: ContextoMultimedia): Promise<MediaAssetResponse[]> {
    return apiRequest<MediaAssetResponse[]>(base(contexto));
  },
  subir(contexto: ContextoMultimedia, archivo: File, metadata: MediaUploadRequest): Promise<MediaAssetResponse> {
    const data = new FormData();
    data.append('metadata', metadataPart(metadata));
    data.append('archivo', archivo, archivo.name);
    return apiRequest<MediaAssetResponse>(`${base(contexto)}/upload`, { method: 'POST', body: data });
  },
  subirLote(contexto: ContextoMultimedia, archivos: File[], metadata: MediaUploadRequest): Promise<MediaAssetResponse[]> {
    const data = new FormData();
    data.append('metadata', metadataPart(metadata));
    archivos.forEach(archivo => data.append('archivos', archivo, archivo.name));
    return apiRequest<MediaAssetResponse[]>(`${base(contexto)}/upload-batch`, { method: 'POST', body: data });
  },
  actualizarMetadata(contexto: ContextoMultimedia, mediaId: string, body: MediaMetadataUpdateRequest): Promise<MediaAssetResponse> {
    return apiRequest<MediaAssetResponse>(`${base(contexto)}/${encodeURIComponent(mediaId)}/metadata`, {
      method: 'PATCH', body: JSON.stringify(body),
    });
  },
  activar(contexto: ContextoMultimedia, mediaId: string): Promise<MediaAssetResponse> {
    return apiRequest<MediaAssetResponse>(`${base(contexto)}/${encodeURIComponent(mediaId)}/activar`, { method: 'PATCH' });
  },
  desactivar(contexto: ContextoMultimedia, mediaId: string): Promise<MediaAssetResponse> {
    return apiRequest<MediaAssetResponse>(`${base(contexto)}/${encodeURIComponent(mediaId)}/desactivar`, { method: 'PATCH' });
  },
  marcarPortada(contexto: ContextoMultimedia, mediaId: string): Promise<MediaAssetResponse> {
    return apiRequest<MediaAssetResponse>(`${base(contexto)}/${encodeURIComponent(mediaId)}/portada`, { method: 'PATCH' });
  },
  eliminar(contexto: ContextoMultimedia, mediaId: string): Promise<void> {
    return apiRequest<void>(`${base(contexto)}/${encodeURIComponent(mediaId)}`, { method: 'DELETE' });
  },
};
