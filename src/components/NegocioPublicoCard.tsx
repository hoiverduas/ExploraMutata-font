import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { imagenEditorialCategoria } from './OfertaPublicaCard';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import type { NegocioPublico } from '../types/catalogo';
import type { MediaAssetResponse } from '../types/multimedia';
import BotonFavorito from './BotonFavorito';

const prioridad = (media: MediaAssetResponse) =>
  media.rol === 'PORTADA' ? -1000 : media.orden ?? 0;

const urlMedia = (media: MediaAssetResponse) =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

export default function NegocioPublicoCard({ negocio }: { negocio: NegocioPublico }) {
  const cargarMedia = useCallback(
    (signal: AbortSignal) => multimediaApi.listarPublica('NEGOCIO', negocio.id, { signal }),
    [negocio.id],
  );
  const multimedia = useConsultaApi<MediaAssetResponse[]>(cargarMedia, []);
  const portada = [...multimedia.datos]
    .filter(media => media.tipo === 'IMAGEN')
    .sort((a, b) => prioridad(a) - prioridad(b))[0];

  const imagen = portada
    ? urlMedia(portada)
    : negocio.categorias.length
      ? imagenEditorialCategoria[negocio.categorias[0]]
      : '/images/hero-mutata.webp';

  return <article className="catalog-card marketplace-card">
    <img
      className="marketplace-card-image"
      src={imagen}
      alt={portada?.altText ?? portada?.titulo ?? `${negocio.nombreComercial}, imagen principal`}
      loading="lazy"
    />
    <div className="catalog-card-body marketplace-card-body">
      <span>{negocio.categorias.length ? negocio.categorias.map(categoria => nombresCategoria[categoria]).join(' · ') : 'Sin categoría'}</span>
      <h2>{negocio.nombreComercial}</h2>
      <p>{negocio.descripcion || 'Sin descripción disponible.'}</p>
      <div className="marketplace-actions">
        <Link className="marketplace-primary-link" to={`/negocios/${encodeURIComponent(negocio.id)}`}>Ver negocio <span aria-hidden="true">↗</span></Link>
        <BotonFavorito tipo="NEGOCIO" recursoId={negocio.id} compacto/>
      </div>
    </div>
  </article>;
}
