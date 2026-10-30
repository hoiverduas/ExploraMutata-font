export type TipoEntidadMedia = 'NEGOCIO' | 'DESTINO' | 'EXPERIENCIA' | 'OFERTA' | 'PAQUETE_COMERCIAL';
export type TipoMedia = 'IMAGEN' | 'VIDEO';
export type RolMedia = 'PORTADA' | 'GALERIA' | 'VIDEO_PRINCIPAL' | 'REEL' | 'MINIATURA';
export type ProveedorMedia = 'LOCAL' | 'EXTERNO' | 'S3' | 'CLOUDINARY';
export type EstadoMedia = 'ACTIVO' | 'INACTIVO';

export interface MediaAssetResponse {
  id: string;
  entidadTipo: TipoEntidadMedia;
  entidadId: string;
  tipo: TipoMedia;
  rol: RolMedia;
  proveedor: ProveedorMedia;
  storageKey: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  titulo: string | null;
  descripcion: string | null;
  altText: string | null;
  orden: number | null;
  estado: EstadoMedia;
  autor: string | null;
  fuente: string | null;
  fuenteUrl: string | null;
  derechosConfirmados: boolean | null;
  fechaAutorizacion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}


export interface MediaUploadRequest {
  rol: RolMedia;
  titulo: string | null;
  descripcion: string | null;
  altText: string | null;
  orden: number | null;
  autor: string | null;
  fuente: string | null;
  fuenteUrl: string | null;
  derechosConfirmados: boolean;
  fechaAutorizacion: string | null;
}

export type MediaMetadataUpdateRequest = MediaUploadRequest;
