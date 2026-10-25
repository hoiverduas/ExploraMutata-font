import { ApiError, apiRequest } from './http';
import type { CategoriaNegocio } from '../types/catalogo';
import type {
  OfertaNegocioRequest, OfertaNegocioResponse,
  OfertaRestauranteRequest, OfertaRestauranteResponse,
  OfertaHospedajeRequest, OfertaHospedajeResponse,
  OfertaTransporteRequest, OfertaTransporteResponse,
  OfertaGuiaRequest, OfertaGuiaResponse,
  OfertaVidaNocturnaRequest, OfertaVidaNocturnaResponse,
} from '../types/oferta';

const privado = (negocioId: string) => `/api/v1/operadores/negocios/${encodeURIComponent(negocioId)}/ofertas`;
const publico = (negocioId: string) => `/api/v1/public/negocios/${encodeURIComponent(negocioId)}/ofertas`;
type OpcionesConsulta = { signal?: AbortSignal };
const idOferta = (ofertaId: number) => encodeURIComponent(String(ofertaId));

function especialidad<Request, Response extends { oferta: OfertaNegocioResponse }>(segmento: string) {
  const root = (negocioId: string) => `${privado(negocioId)}/${segmento}`;
  const listarPublicas = (negocioId: string, options: OpcionesConsulta = {}) => apiRequest<Response[]>(`${publico(negocioId)}/${segmento}`, { ...options, public: true });
  return {
    listar: (negocioId: string) => apiRequest<Response[]>(root(negocioId)),
    buscar: (negocioId: string, ofertaId: number) => apiRequest<Response>(`${root(negocioId)}/${idOferta(ofertaId)}`),
    registrar: (negocioId: string, body: Request) => apiRequest<Response>(root(negocioId), { method: 'POST', body: JSON.stringify(body) }),
    actualizar: (negocioId: string, ofertaId: number, body: Request) => apiRequest<Response>(`${root(negocioId)}/${idOferta(ofertaId)}`, { method: 'PUT', body: JSON.stringify(body) }),
    listarPublicas,
    async buscarPublica(negocioId: string, ofertaId: number, options: OpcionesConsulta = {}): Promise<Response> {
      // El backend expone un listado público especializado, no un GET individual.
      const respuesta = (await listarPublicas(negocioId, options)).find(item => item.oferta.id === ofertaId);
      if (!respuesta) throw new ApiError(404, 'La oferta no está disponible.');
      return respuesta;
    },
  };
}
const listar = (negocioId: string) => apiRequest<OfertaNegocioResponse[]>(privado(negocioId));
const buscar = (negocioId: string, ofertaId: number) => apiRequest<OfertaNegocioResponse>(`${privado(negocioId)}/${idOferta(ofertaId)}`);
const listarPublicas = (negocioId: string, categoria?: CategoriaNegocio, options: OpcionesConsulta = {}) => apiRequest<OfertaNegocioResponse[]>(`${publico(negocioId)}${categoria ? `?categoria=${encodeURIComponent(categoria)}` : ''}`, { ...options, public: true });

export const ofertasApi = {
  listar,
  listarOperador: listar,
  buscar,
  buscarOperador: buscar,
  registrar: (negocioId: string, body: OfertaNegocioRequest) => apiRequest<OfertaNegocioResponse>(privado(negocioId), { method: 'POST', body: JSON.stringify(body) }),
  actualizar: (negocioId: string, ofertaId: number, body: OfertaNegocioRequest) => apiRequest<OfertaNegocioResponse>(`${privado(negocioId)}/${idOferta(ofertaId)}`, { method: 'PUT', body: JSON.stringify(body) }),
  activar: (negocioId: string, ofertaId: number) => apiRequest<OfertaNegocioResponse>(`${privado(negocioId)}/${idOferta(ofertaId)}/activar`, { method: 'PATCH' }),
  desactivar: (negocioId: string, ofertaId: number) => apiRequest<OfertaNegocioResponse>(`${privado(negocioId)}/${idOferta(ofertaId)}/desactivar`, { method: 'PATCH' }),
  listarPublicas,
  async buscarPublica(negocioId: string, ofertaId: number, options: OpcionesConsulta = {}): Promise<OfertaNegocioResponse> {
    const oferta = (await listarPublicas(negocioId, undefined, options)).find(item => item.id === ofertaId);
    if (!oferta) throw new ApiError(404, 'La oferta no está disponible.');
    return oferta;
  },
  restaurante: especialidad<OfertaRestauranteRequest, OfertaRestauranteResponse>('restaurante'),
  hospedaje: especialidad<OfertaHospedajeRequest, OfertaHospedajeResponse>('hospedaje'),
  transporte: especialidad<OfertaTransporteRequest, OfertaTransporteResponse>('transporte'),
  guia: especialidad<OfertaGuiaRequest, OfertaGuiaResponse>('guia'),
  vidaNocturna: especialidad<OfertaVidaNocturnaRequest, OfertaVidaNocturnaResponse>('vida-nocturna'),
};
