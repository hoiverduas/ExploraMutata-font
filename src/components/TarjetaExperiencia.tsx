import { useCallback, useMemo } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import type { ExperienciaPublica } from '../types/experiencia';
import type { MediaAssetResponse } from '../types/multimedia';
import TarjetaTuristica from './TarjetaTuristica';

const urlMedia = (media: MediaAssetResponse): string =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

export default function TarjetaExperiencia({
  experiencia,
  etiqueta,
  ruta,
  favorito = false,
}: {
  experiencia: ExperienciaPublica;
  etiqueta: string;
  ruta: string;
  favorito?: boolean;
}) {
  const cargar = useCallback(
    (signal: AbortSignal) => multimediaApi.listarPublica('EXPERIENCIA', experiencia.id, { signal }),
    [experiencia.id],
  );
  const multimedia = useConsultaApi<MediaAssetResponse[]>(cargar, []);

  const portada = useMemo(() => {
    const imagenes = multimedia.datos.filter(media => media.tipo === 'IMAGEN');
    const principal = imagenes.find(media => media.rol === 'PORTADA')
      ?? [...imagenes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))[0];
    return principal ? urlMedia(principal) : null;
  }, [multimedia.datos]);

  return <TarjetaTuristica
    nombre={experiencia.nombre}
    descripcion={experiencia.descripcion}
    etiqueta={etiqueta}
    ruta={ruta}
    accion="Ver experiencia"
    imagenUrl={portada}
    favorito={favorito ? { tipo: 'EXPERIENCIA', recursoId: experiencia.id } : undefined}
  />;
}
