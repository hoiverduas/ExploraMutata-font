import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [carruselVisible, setCarruselVisible] = useState(false);
  const [paginaVisible, setPaginaVisible] = useState(() => document.visibilityState === 'visible');
  const carruselRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => setIndice(0), [tipo, entidadId, respaldo?.tipo, respaldo?.entidadId]);
  useEffect(() => {
    if (indice >= medios.length) setIndice(Math.max(0, medios.length - 1));
  }, [indice, medios.length]);

  useEffect(() => {
    if (!medios.length) {
      setCarruselVisible(false);
      return;
    }

    const elemento = carruselRef.current;
    if (!elemento) return;

    const actualizarVisible = () => {
      const rect = elemento.getBoundingClientRect();
      setCarruselVisible(
        rect.bottom > 0
        && rect.top < window.innerHeight
        && rect.right > 0
        && rect.left < window.innerWidth
      );
    };

    actualizarVisible();

    if (typeof IntersectionObserver === 'undefined') {
      setCarruselVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entradas => setCarruselVisible(Boolean(entradas[0]?.isIntersecting)),
      { threshold: 0.01, rootMargin: '80px 0px 80px 0px' },
    );

    observer.observe(elemento);
    window.addEventListener('resize', actualizarVisible);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', actualizarVisible);
    };
  }, [medios.length, tipo, entidadId]);

  useEffect(() => {
    const actualizarVisibilidad = () => setPaginaVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', actualizarVisibilidad);
    return () => document.removeEventListener('visibilitychange', actualizarVisibilidad);
  }, []);

  const actual = medios[indice];

  useEffect(() => {
    const video = videoRef.current;
    const activo = carruselVisible && paginaVisible;

    if (!video || actual?.tipo !== 'VIDEO') return;

    if (!activo) {
      video.pause();
      video.muted = true;
      return;
    }

    video.muted = true;
    void video.play().catch(() => undefined);

    return () => {
      video.pause();
      video.muted = true;
    };
  }, [actual?.id, actual?.tipo, carruselVisible, paginaVisible]);

  useEffect(() => {
    if (
      medios.length <= 1
      || !actual
      || actual.tipo === 'VIDEO'
      || !carruselVisible
      || !paginaVisible
    ) return;

    const temporizador = window.setTimeout(
      () => setIndice(valor => (valor + 1) % medios.length),
      2000,
    );

    return () => window.clearTimeout(temporizador);
  }, [actual?.id, actual?.tipo, medios.length, carruselVisible, paginaVisible]);

  if (consulta.cargando || consulta.error || !medios.length) return null;

  const anterior = () => setIndice(valor => (valor - 1 + medios.length) % medios.length);
  const siguiente = () => setIndice(valor => (valor + 1) % medios.length);

  return <section
    ref={carruselRef}
    className="destination-media-carousel"
    aria-label={etiqueta}
  >
    <div className="destination-media-stage">
      {actual.tipo === 'VIDEO'
        ? <video
            ref={videoRef}
            key={actual.id}
            className="destination-media-main"
            controls
            muted
            playsInline
            preload="auto"
            poster={actual.thumbnailUrl ?? undefined}
            onEnded={() => {
              if (medios.length > 1) {
                setIndice(valor => (valor + 1) % medios.length);
                return;
              }
              const video = videoRef.current;
              if (video) {
                video.currentTime = 0;
                void video.play().catch(() => undefined);
              }
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
