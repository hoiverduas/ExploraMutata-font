import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import type { MediaAssetResponse } from '../types/multimedia';

const prioridad = (media: MediaAssetResponse) => {
  if (media.rol === 'PORTADA') return -2000;
  if (media.rol === 'VIDEO_PRINCIPAL') return -1500;
  return media.orden ?? 0;
};

const urlMedia = (media: MediaAssetResponse): string =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

export default function HeroInicioMultimedia() {
  const cargar = useCallback(
    (signal: AbortSignal) => multimediaApi.listarPublica('INICIO', 'inicio', { signal }),
    [],
  );
  const consulta = useConsultaApi<MediaAssetResponse[]>(cargar, []);
  const medios = useMemo(
    () => [...consulta.datos].sort((a, b) => prioridad(a) - prioridad(b)),
    [consulta.datos],
  );
  const [indice, setIndice] = useState(0);
  const [visible, setVisible] = useState(true);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (indice >= medios.length) setIndice(0);
  }, [indice, medios.length]);

  useEffect(() => {
    const elemento = contenedorRef.current;
    if (!elemento) return;
    const observer = new IntersectionObserver(
      entradas => setVisible(Boolean(entradas[0]?.isIntersecting) && document.visibilityState === 'visible'),
      { threshold: 0.3 },
    );
    observer.observe(elemento);

    const pagina = () => {
      const enVista = elemento.getBoundingClientRect().bottom > 0
        && elemento.getBoundingClientRect().top < window.innerHeight;
      setVisible(document.visibilityState === 'visible' && enVista);
    };
    document.addEventListener('visibilitychange', pagina);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', pagina);
    };
  }, []);

  const actual = medios[indice];

  useEffect(() => {
    const video = videoRef.current;
    if (!video || actual?.tipo !== 'VIDEO') return;
    if (!visible) {
      video.pause();
      video.muted = true;
      return;
    }
    video.currentTime = 0;
    video.muted = false;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
    return () => {
      video.pause();
      video.muted = true;
    };
  }, [actual?.id, actual?.tipo, visible]);

  useEffect(() => {
    if (!actual || medios.length <= 1 || !visible) return;
    const duracion = actual.tipo === 'VIDEO' ? 5000 : 2000;
    const temporizador = window.setTimeout(
      () => setIndice(valor => (valor + 1) % medios.length),
      duracion,
    );
    return () => window.clearTimeout(temporizador);
  }, [actual?.id, actual?.tipo, medios.length, visible]);

  if (consulta.cargando || consulta.error || !medios.length) {
    return <div className="hero-home-bg" aria-hidden="true"/>;
  }

  return <div ref={contenedorRef} className="hero-home-media" aria-hidden="true">
    {actual.tipo === 'VIDEO'
      ? <video
          ref={videoRef}
          key={actual.id}
          className="hero-home-media-item"
          playsInline
          preload="auto"
          loop
          muted={!visible}
          poster={actual.thumbnailUrl ?? undefined}
        >
          <source src={urlMedia(actual)} type={actual.mimeType ?? undefined}/>
        </video>
      : <img
          key={actual.id}
          className="hero-home-media-item"
          src={urlMedia(actual)}
          alt=""
        />}
    <div className="hero-home-shade"/>
  </div>;
}
