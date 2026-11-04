import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { nombresModeloPrecio } from '../types/oferta';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import type { OfertaNegocioResponse } from '../types/oferta';
import type { CategoriaNegocio } from '../types/catalogo';
import type { MediaAssetResponse } from '../types/multimedia';
import PrecioOferta from './PrecioOferta';
import BotonFavorito from './BotonFavorito';

// Fotografías editoriales del territorio usadas únicamente como fallback.
export const imagenEditorialCategoria: Record<CategoriaNegocio, string> = {
  AVENTURA: '/images/rio-bedo.webp', HOSPEDAJE: '/images/naturaleza-comunidad.webp',
  RESTAURANTE: '/images/cultura-local.webp', TRANSPORTE: '/images/hero-mutata.webp',
  GUIA: '/images/comunidad-jaikerazabi.webp', VIDA_NOCTURNA: '/images/cultura-local.webp',
};
const duraciones = { UNICO: 'servicio', DIA: 'día(s)', NOCHE: 'noche(s)', SEMANA: 'semana(s)', MES: 'mes(es)' };

const prioridad = (media: MediaAssetResponse) =>
  media.rol === 'PORTADA' ? -1000 : media.orden ?? 0;

const urlMedia = (media: MediaAssetResponse) =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

export default function OfertaPublicaCard({ oferta }: { oferta: OfertaNegocioResponse }) {
  const cargarMedia = useCallback(
    async (signal: AbortSignal) => {
      const mediaOferta = await multimediaApi.listarPublica('OFERTA', String(oferta.id), { signal });
      const fotosOferta = mediaOferta.filter(media => media.tipo === 'IMAGEN');
      if (fotosOferta.length) return fotosOferta;

      if (oferta.experienciaId) {
        const mediaExperiencia = await multimediaApi.listarPublica('EXPERIENCIA', oferta.experienciaId, { signal });
        const fotosExperiencia = mediaExperiencia.filter(media => media.tipo === 'IMAGEN');
        if (fotosExperiencia.length) return fotosExperiencia;
      }

      const mediaNegocio = await multimediaApi.listarPublica('NEGOCIO', oferta.negocioId, { signal });
      return mediaNegocio.filter(media => media.tipo === 'IMAGEN');
    },
    [oferta.id, oferta.experienciaId, oferta.negocioId, oferta.version],
  );
  const multimedia = useConsultaApi<MediaAssetResponse[]>(cargarMedia, []);
  const portada = [...multimedia.datos].sort((a, b) => prioridad(a) - prioridad(b))[0];
  const imagen = portada ? urlMedia(portada) : imagenEditorialCategoria[oferta.categoria];

  return <article className="catalog-card marketplace-card">
    <img
      className="marketplace-card-image"
      src={imagen}
      alt={portada?.altText ?? portada?.titulo ?? `${oferta.nombre}, imagen principal`}
      loading="lazy"
    />
    <div className="catalog-card-body marketplace-card-body">
      <span>{nombresCategoria[oferta.categoria]}</span>
      <h2>{oferta.nombre}</h2>
      <p>{oferta.negocioNombreComercial}</p>
      {oferta.descripcionOferta && <p className="marketplace-card-description">{oferta.descripcionOferta}</p>}
      <div className="marketplace-badges">
        <span>{oferta.duracionCantidad} {duraciones[oferta.duracionUnidad]}</span>
        {oferta.capacidadMaxima !== null && <span>Capacidad: {oferta.capacidadMaxima} personas</span>}
      </div>
      <PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/>
      <small>{nombresModeloPrecio[oferta.modeloPrecio]}</small>
      <div className="marketplace-actions">
        <Link className="marketplace-primary-link" to={`/negocios/${encodeURIComponent(oferta.negocioId)}/ofertas/${oferta.id}`}>Ver oferta <span aria-hidden="true">↗</span></Link>
        <BotonFavorito tipo="OFERTA" recursoId={String(oferta.id)} compacto/>
      </div>
    </div>
  </article>;
}
