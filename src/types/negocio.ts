import type { CategoriaNegocio } from './catalogo';

export type TipoPersona = 'NATURAL' | 'JURIDICA';
export type TipoDocumento = 'CEDULA_CIUDADANIA' | 'CEDULA_EXTRANJERIA' | 'NIT' | 'PASAPORTE';
export type EstadoNegocio = 'PENDIENTE_VERIFICACION' | 'ACTIVO' | 'RECHAZADO' | 'SUSPENDIDO' | 'INACTIVO';

export interface NegocioRequest {
  categorias: CategoriaNegocio[];
  nombreComercial: string;
  razonSocial: string;
  tipoPersona: TipoPersona;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  correoContacto: string;
  telefonoContacto: string;
  descripcion: string;
}

export interface NegocioResponse extends NegocioRequest {
  id: string;
  operadorId: string | null;
  whatsappContacto: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  mostrarWhatsapp: boolean;
  mostrarInstagram: boolean;
  mostrarFacebook: boolean;
  notificacionesWhatsapp: boolean;
  direccion: string | null;
  municipio: string | null;
  vereda: string | null;
  ubicacionReferencia: string | null;
  latitud: number | null;
  longitud: number | null;
  comoLlegar: string | null;
  estado: EstadoNegocio;
  fechaCreacion: string;
  fechaActualizacion: string;
  version: number;
}

export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}
