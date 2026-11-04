import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import type { MediaAssetResponse } from '../types/multimedia';
import type { PaqueteComercialResponse } from '../types/paqueteComercial';
import { nombresModeloPaquete } from '../types/paqueteComercial';
import PrecioOferta from './PrecioOferta';
import BotonFavorito from './BotonFavorito';

const unidades = { UNICO: 'servicio', DIA: 'día(s)', NOCHE: 'noche(s)', SEMANA: 'semana(s)', MES: 'mes(es)' } as const;

const urlMedia = (media: MediaAssetResponse): string =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

export default function TarjetaPaqueteComercial({ paquete }: { paquete: PaqueteComercialResponse }) {
  const cargarMedia = useCallback(
    (signal: AbortSignal) => multimediaApi.listarPublica('PAQUETE_COMERCIAL', paquete.id, { signal }),
    [paquete.id, paquete.version],
  );
  const multimedia = useConsultaApi<MediaAssetResponse[]>(cargarMedia, []);
  const portada = useMemo(() => {
    const imagenes = multimedia.datos.filter(media => media.tipo === 'IMAGEN');
    return imagenes.find(media => media.rol === 'PORTADA')
      ?? imagenes.find(media => media.rol === 'MINIATURA')
      ?? [...imagenes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))[0]
      ?? null;
  }, [multimedia.datos]);

  const imagen = portada ? urlMedia(portada) : '/images/naturaleza-comunidad.webp';

  return <article className="catalog-card package-card">
    <div className="package-card-image"><img className="package-card-cover-image" src={imagen} alt={portada?.altText ?? portada?.titulo ?? `Portada de ${paquete.nombre}`} loading="lazy"/><span className="package-duration">{paquete.duracionCantidad} {unidades[paquete.duracionUnidad]}</span></div>
    <div className="catalog-card-body"><span>PAQUETE · {paquete.negocioNombre}</span><h2>{paquete.nombre}</h2>
      {paquete.descripcion && <p className="package-card-description">{paquete.descripcion}</p>}
      <p>{paquete.totalItems} servicio(s) · Desde {paquete.minimoPersonas} persona(s){paquete.maximoPersonas !== null ? ` · Máximo ${paquete.maximoPersonas}` : ''}</p>
      {paquete.precio !== null && paquete.moneda ? <><PrecioOferta precioDesde={paquete.precio} moneda={paquete.moneda}/><small>{nombresModeloPaquete[paquete.modeloPrecio]}</small></> : <p>Precio según los servicios incluidos. Consulta la cotización.</p>}
      <div className="marketplace-actions"><Link className="resource-inline-link" to={`/paquetes/${encodeURIComponent(paquete.id)}`}>Ver paquete <span aria-hidden="true">→</span></Link><BotonFavorito tipo="PAQUETE" recursoId={paquete.id} compacto/></div>
    </div>
  </article>;
}
