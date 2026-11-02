import { useCallback, useMemo } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import type { DestinoPublico } from '../types/destino';
import type { MediaAssetResponse } from '../types/multimedia';
import TarjetaTuristica from './TarjetaTuristica';

const urlMedia = (media: MediaAssetResponse): string =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

export default function TarjetaDestino({
  destino,
  etiqueta,
  favorito = false,
  ruta,
}: {
  destino: DestinoPublico;
  etiqueta: string;
  favorito?: boolean;
  ruta?: string;
}) {
  const cargar = useCallback(
    (signal: AbortSignal) => multimediaApi.listarPublica('DESTINO', destino.id, { signal }),
    [destino.id],
  );
  const multimedia = useConsultaApi<MediaAssetResponse[]>(cargar, []);

  const portada = useMemo(() => {
    const imagenes = multimedia.datos.filter(media => media.tipo === 'IMAGEN');
    const principal = imagenes.find(media => media.rol === 'PORTADA')
      ?? [...imagenes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))[0];
    return principal ? urlMedia(principal) : null;
  }, [multimedia.datos]);

  return <TarjetaTuristica
    nombre={destino.nombre}
    descripcion={destino.descripcion}
    etiqueta={etiqueta}
    ruta={ruta ?? `/destinos/${encodeURIComponent(destino.slug)}`}
    imagenUrl={portada}
    favorito={favorito ? { tipo: 'DESTINO', recursoId: destino.id } : undefined}
  />;
}
