import { useCallback } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import type { MediaAssetResponse, TipoEntidadMedia } from '../types/multimedia';

const prioridad = (media: MediaAssetResponse) =>
  media.rol === 'PORTADA' ? -1000 : media.rol === 'VIDEO_PRINCIPAL' ? -500 : media.orden ?? 0;

function urlMedia(media: MediaAssetResponse): string {
  if (media.url) return media.url;
  return `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;
}

export default function GaleriaMultimediaPublica({ tipo, entidadId }: { tipo: TipoEntidadMedia; entidadId: string }) {
  const cargar = useCallback(
    (signal: AbortSignal) => multimediaApi.listarPublica(tipo, entidadId, { signal }),
    [tipo, entidadId],
  );
  const consulta = useConsultaApi<MediaAssetResponse[]>(cargar, []);
  const medios = [...consulta.datos].sort((a, b) => prioridad(a) - prioridad(b));

  if (consulta.cargando || consulta.error || !medios.length) return null;

  return <section className="marketplace-section" aria-label="Galería multimedia">
    <h2>Galería</h2>
    <div className="catalog-grid">
      {medios.map(media => media.tipo === 'VIDEO'
        ? <article className="catalog-card" key={media.id}>
            <video controls preload="metadata" poster={media.thumbnailUrl ?? undefined} style={{ width: '100%', display: 'block' }}>
              <source src={urlMedia(media)} type={media.mimeType ?? undefined}/>
              Tu navegador no puede reproducir este video.
            </video>
            {(media.titulo || media.descripcion) && <div className="catalog-card-body">{media.titulo && <h3>{media.titulo}</h3>}{media.descripcion && <p>{media.descripcion}</p>}</div>}
          </article>
        : <article className="catalog-card" key={media.id}>
            <img className="marketplace-card-image" src={urlMedia(media)} alt={media.altText ?? media.titulo ?? ''} loading="lazy"/>
            {(media.titulo || media.descripcion) && <div className="catalog-card-body">{media.titulo && <h3>{media.titulo}</h3>}{media.descripcion && <p>{media.descripcion}</p>}</div>}
          </article>)}
    </div>
  </section>;
}
