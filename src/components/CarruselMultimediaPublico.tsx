import { useCallback, useEffect, useMemo, useState } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import type { MediaAssetResponse, TipoEntidadMedia } from '../types/multimedia';

const prioridad = (media: MediaAssetResponse) => {
  if (media.rol === 'PORTADA') return -2000;
  if (media.rol === 'VIDEO_PRINCIPAL') return -1500;
  return media.orden ?? 0;
};

const urlMedia = (media: MediaAssetResponse): string =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

export default function CarruselMultimediaPublico({
  tipo,
  entidadId,
  etiqueta = 'Multimedia',
  respaldo,
}: {
  tipo: TipoEntidadMedia;
  entidadId: string;
  etiqueta?: string;
  respaldo?: { tipo: TipoEntidadMedia; entidadId: string } | null;
}) {
  const cargar = useCallback(
    async (signal: AbortSignal) => {
      const principales = await multimediaApi.listarPublica(tipo, entidadId, { signal });
      if (principales.length || !respaldo?.entidadId) return principales;
      return multimediaApi.listarPublica(respaldo.tipo, respaldo.entidadId, { signal });
    },
    [tipo, entidadId, respaldo?.tipo, respaldo?.entidadId],
  );
  const consulta = useConsultaApi<MediaAssetResponse[]>(cargar, []);
  const medios = useMemo(
    () => [...consulta.datos].sort((a, b) => prioridad(a) - prioridad(b)),
    [consulta.datos],
  );
  const [indice, setIndice] = useState(0);
  const [sobreCarrusel, setSobreCarrusel] = useState(false);
  const [videoReproduciendo, setVideoReproduciendo] = useState(false);

  useEffect(() => setIndice(0), [tipo, entidadId, respaldo?.tipo, respaldo?.entidadId]);
  useEffect(() => {
    if (indice >= medios.length) setIndice(Math.max(0, medios.length - 1));
  }, [indice, medios.length]);

  useEffect(() => {
    if (medios.length <= 1 || sobreCarrusel || videoReproduciendo) return;
    const temporizador = window.setInterval(() => {
      setIndice(valor => (valor + 1) % medios.length);
    }, 5000);
    return () => window.clearInterval(temporizador);
  }, [medios.length, sobreCarrusel, videoReproduciendo]);

  if (consulta.cargando || consulta.error || !medios.length) return null;

  const actual = medios[indice];
  const anterior = () => setIndice(valor => (valor - 1 + medios.length) % medios.length);
  const siguiente = () => setIndice(valor => (valor + 1) % medios.length);

  return <section
    className="destination-media-carousel"
    aria-label={etiqueta}
    onMouseEnter={() => setSobreCarrusel(true)}
    onMouseLeave={() => setSobreCarrusel(false)}
  >
    <div className="destination-media-stage">
      {actual.tipo === 'VIDEO'
        ? <video
            key={actual.id}
            className="destination-media-main"
            controls
            autoPlay
            playsInline
            preload="auto"
            poster={actual.thumbnailUrl ?? undefined}
            onPlay={() => setVideoReproduciendo(true)}
            onPause={() => setVideoReproduciendo(false)}
            onEnded={() => {
              setVideoReproduciendo(false);
              setIndice(valor => (valor + 1) % medios.length);
            }}
          >
            <source src={urlMedia(actual)} type={actual.mimeType ?? undefined}/>
            Tu navegador no puede reproducir este video.
          </video>
        : <img
            key={actual.id}
            className="destination-media-main"
            src={urlMedia(actual)}
            alt={actual.altText ?? actual.titulo ?? ''}
          />}

      {medios.length > 1 && <>
        <button type="button" className="destination-carousel-arrow destination-carousel-prev" onClick={anterior} aria-label="Ver anterior">‹</button>
        <button type="button" className="destination-carousel-arrow destination-carousel-next" onClick={siguiente} aria-label="Ver siguiente">›</button>
      </>}

      <div className="destination-media-overlay">
        <div>
          {actual.titulo && <strong>{actual.titulo}</strong>}
          {actual.descripcion && <span>{actual.descripcion}</span>}
        </div>
        <span className="destination-media-count">{indice + 1} / {medios.length}</span>
      </div>
    </div>

    {medios.length > 1 && <div className="destination-media-thumbnails" aria-label="Seleccionar foto o video">
      {medios.map((media, posicion) => <button
        type="button"
        key={media.id}
        className={`destination-media-thumb${posicion === indice ? ' is-active' : ''}`}
        onClick={() => setIndice(posicion)}
        aria-label={`Ver ${media.titulo || (media.tipo === 'VIDEO' ? 'video' : 'imagen')} ${posicion + 1}`}
      >
        {media.tipo === 'VIDEO'
          ? media.thumbnailUrl
            ? <img src={media.thumbnailUrl} alt=""/>
            : <span className="destination-media-video-thumb">▶</span>
          : <img src={urlMedia(media)} alt=""/>}
        {media.tipo === 'VIDEO' && <span className="destination-media-video-badge">Video</span>}
      </button>)}
    </div>}
  </section>;
}
