import { IonButton } from '@ionic/react';
import { useCallback, useMemo } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import type { OfertaExperienciaMonedaResponse } from '../types/ofertaExperiencia';
import type { MediaAssetResponse } from '../types/multimedia';
import PrecioOferta from './PrecioOferta';

const urlMedia = (media: MediaAssetResponse): string =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

export default function OfertaExperienciaCard({ oferta }: { oferta: OfertaExperienciaMonedaResponse }) {
  const cargar = useCallback(
    (signal: AbortSignal) => multimediaApi.listarPublica('OFERTA', String(oferta.id), { signal }),
    [oferta.id],
  );
  const multimedia = useConsultaApi<MediaAssetResponse[]>(cargar, []);
  const portada = useMemo(() => {
    const imagenes = multimedia.datos.filter(media => media.tipo === 'IMAGEN');
    return imagenes.find(media => media.rol === 'PORTADA')
      ?? [...imagenes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))[0];
  }, [multimedia.datos]);

  return <article className="catalog-card marketplace-card">
    {portada && <img
      className="marketplace-card-image marketplace-card-image-contain"
      src={urlMedia(portada)}
      alt={portada.altText ?? portada.titulo ?? `Portada de ${oferta.experienciaNombre}`}
      loading="lazy"
    />}
    <div className="catalog-card-body marketplace-card-body">
      <span>{oferta.experienciaNombre} · {oferta.destinoNombre}</span>
      <h2>{oferta.negocioNombreComercial}</h2>
      {oferta.descripcionOferta && <p className="marketplace-card-description">{oferta.descripcionOferta}</p>}
      <PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/>
      <p>{oferta.reservaRequerida
        ? 'Personaliza las fechas y viajeros antes de agregar esta aventura a tu viaje.'
        : 'Consulta los detalles de esta oferta con el negocio.'}</p>
      <IonButton className="btn-explora" routerLink={`/negocios/${encodeURIComponent(oferta.negocioId)}/ofertas/${oferta.id}`}>
        Ver oferta y cotizar
      </IonButton>
      <dl className="catalog-contact">
        <div><dt>Teléfono</dt><dd>{oferta.telefonoContacto
          ? <a href={`tel:${oferta.telefonoContacto.replace(/[^\d+]/g, '')}`}>{oferta.telefonoContacto}</a>
          : 'Teléfono no disponible'}</dd></div>
        <div><dt>Correo</dt><dd>{oferta.correoContacto
          ? <a href={`mailto:${encodeURIComponent(oferta.correoContacto)}`}>{oferta.correoContacto}</a>
          : 'Correo no disponible'}</dd></div>
      </dl>
    </div>
  </article>;
}
