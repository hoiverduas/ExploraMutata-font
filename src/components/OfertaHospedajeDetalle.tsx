import { useCallback, useState } from 'react';
import BotonFavorito from './BotonFavorito';
import CotizadorOferta from './CotizadorOferta';
import PrecioOferta from './PrecioOferta';
import RedesContactoPublicas from './RedesContactoPublicas';
import UbicacionPublica from './UbicacionPublica';
import ConfiguracionComercialOfertaPublica from './ConfiguracionComercialOfertaPublica';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import { ofertasApi } from '../services/ofertasApi';
import type { MediaAssetResponse } from '../types/multimedia';
import type { OfertaHospedajeResponse, OfertaNegocioResponse } from '../types/oferta';

const FALLBACK_HOSPEDAJE = '/images/naturaleza-comunidad.webp';

const etiqueta = (valor: string | null | undefined) => {
  if (!valor) return '';
  const especiales: Record<string, string> = {
    CABANA: 'Cabaña',
    HABITACION: 'Habitación',
    APARTAMENTO: 'Apartamento',
    CASA: 'Casa',
    FINCA: 'Finca',
    HOSTAL: 'Hostal',
    CAMPING: 'Camping',
    GLAMPING: 'Glamping',
    SENCILLA: 'Sencilla',
    DOBLE: 'Doble',
    TRIPLE: 'Triple',
    CUADRUPLE: 'Cuádruple',
    FAMILIAR: 'Familiar',
    COMPARTIDA: 'Compartida',
    NO_APLICA: 'No aplica',
    AIRE_ACONDICIONADO: 'Aire acondicionado',
    BANO_PRIVADO: 'Baño privado',
    AGUA_CALIENTE: 'Agua caliente',
    MASCOTAS_PERMITIDAS: 'Mascotas permitidas',
    VISTA_RIO: 'Vista al río',
    ZONA_SOCIAL: 'Zona social',
    ACCESO_RIO: 'Acceso al río',
    ZONA_CAMPING: 'Zona de camping',
  };
  return especiales[valor] ?? (valor.charAt(0) + valor.slice(1).toLocaleLowerCase('es')).replaceAll('_', ' ');
};

const prioridad = (media: MediaAssetResponse) =>
  media.rol === 'PORTADA' ? -1000 : media.orden ?? 0;

const urlMedia = (media: MediaAssetResponse) =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

function resumenHospedaje(oferta: OfertaNegocioResponse, detalle: OfertaHospedajeResponse | null) {
  const partes: string[] = [];
  if (oferta.capacidadMaxima) partes.push(`${oferta.capacidadMaxima} huésped${oferta.capacidadMaxima === 1 ? '' : 'es'}`);
  if (detalle?.cantidadCamas) partes.push(`${detalle.cantidadCamas} cama${detalle.cantidadCamas === 1 ? '' : 's'}`);
  if (detalle?.banoPrivado) partes.push('baño privado');
  if (detalle?.incluyeDesayuno) partes.push('desayuno incluido');
  return partes.join(' · ');
}

export default function OfertaHospedajeDetalle({ oferta }: { oferta: OfertaNegocioResponse }) {
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [mensajeCompartir, setMensajeCompartir] = useState('');

  const cargarDetalle = useCallback(
    (signal: AbortSignal) => ofertasApi.hospedaje.buscarPublica(oferta.negocioId, oferta.id, { signal }),
    [oferta.negocioId, oferta.id, oferta.version],
  );
  const detalleConsulta = useConsultaApi<OfertaHospedajeResponse | null>(cargarDetalle, null);

  const cargarMedia = useCallback(
    (signal: AbortSignal) => multimediaApi.listarPublica('OFERTA', String(oferta.id), { signal }),
    [oferta.id, oferta.version],
  );
  const mediaConsulta = useConsultaApi<MediaAssetResponse[]>(cargarMedia, []);

  const detalle = detalleConsulta.datos;
  const fotos = [...mediaConsulta.datos]
    .filter(media => media.tipo === 'IMAGEN')
    .sort((a, b) => prioridad(a) - prioridad(b));
  const portada = fotos.find(media => media.rol === 'PORTADA') ?? fotos[0] ?? null;
  const fotosOrdenadas = portada
    ? [portada, ...fotos.filter(media => media.id !== portada.id)]
    : fotos;
  const fotosVista = fotosOrdenadas.slice(0, 5);
  const resumen = resumenHospedaje(oferta, detalle);

  const compartir = async () => {
    setMensajeCompartir('');
    const datos = { title: oferta.nombre, text: `Conoce ${oferta.nombre} en Explora Mutatá`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(datos);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setMensajeCompartir('Enlace copiado');
      window.setTimeout(() => setMensajeCompartir(''), 1800);
    } catch {
      setMensajeCompartir('');
    }
  };

  const imagenEn = (indice: number) => fotosVista[indice] ?? null;

  return <>
    <section className="hospedaje-heading">
      <div>
        <span className="eyebrow">ALOJAMIENTO · EXPLORA MUTATÁ</span>
        <h1>{oferta.nombre}</h1>
      </div>
      <div className="hospedaje-heading-actions">
        <button type="button" className="hospedaje-text-action" onClick={() => void compartir()}>↗ Compartir</button>
        <BotonFavorito tipo="OFERTA" recursoId={String(oferta.id)}/>
        {mensajeCompartir && <small role="status">{mensajeCompartir}</small>}
      </div>
    </section>

    <section className="hospedaje-photo-grid" aria-label="Fotos del alojamiento">
      {[0, 1, 2, 3, 4].map(indice => {
        const media = imagenEn(indice);
        const src = media ? urlMedia(media) : indice === 0 ? FALLBACK_HOSPEDAJE : '';
        return <button
          type="button"
          className={`hospedaje-photo hospedaje-photo-${indice + 1}${src ? '' : ' hospedaje-photo-empty'}`}
          key={media?.id ?? `placeholder-${indice}`}
          onClick={() => fotosOrdenadas.length && setGaleriaAbierta(true)}
          disabled={!src}
          aria-label={src ? `Abrir fotografía ${indice + 1}` : undefined}
        >
          {src && <img src={src} alt={media?.altText ?? media?.titulo ?? oferta.nombre}/>}
        </button>;
      })}
      {fotosOrdenadas.length > 0 && <button type="button" className="hospedaje-show-all" onClick={() => setGaleriaAbierta(true)}>
        ▦ Mostrar todas las fotos{fotosOrdenadas.length > 5 ? ` (${fotosOrdenadas.length})` : ''}
      </button>}
    </section>

    <div className="hospedaje-detail-layout">
      <div className="hospedaje-main-column">
        <section className="hospedaje-intro">
          <div>
            <h2>{detalle ? `${etiqueta(detalle.tipoAlojamiento)} en Mutatá, Antioquia` : 'Alojamiento en Mutatá, Antioquia'}</h2>
            {resumen && <p className="hospedaje-summary-line">{resumen}</p>}
          </div>
          <div className="hospedaje-host-chip">
            <span>Alojamiento ofrecido por</span>
            <strong>{oferta.negocioNombreComercial}</strong>
            <small>Operador de Explora Mutatá</small>
          </div>
        </section>

        {detalle && <section className="hospedaje-highlight-list">
          <article>
            <span aria-hidden="true">◷</span>
            <div><strong>Check-in</strong><p>{detalle.horaCheckIn ? `Desde las ${detalle.horaCheckIn.slice(0, 5)}` : 'Consulta el horario con el alojamiento'}</p></div>
          </article>
          <article>
            <span aria-hidden="true">↗</span>
            <div><strong>Check-out</strong><p>{detalle.horaCheckOut ? `Hasta las ${detalle.horaCheckOut.slice(0, 5)}` : 'Consulta el horario con el alojamiento'}</p></div>
          </article>
          <article>
            <span aria-hidden="true">⌂</span>
            <div><strong>Estadía</strong><p>Mínimo {detalle.estadiaMinimaNoches ?? 1} noche(s){detalle.estadiaMaximaNoches ? ` · máximo ${detalle.estadiaMaximaNoches}` : ''}</p></div>
          </article>
        </section>}

        {oferta.descripcionOferta && <section className="hospedaje-section">
          <h2>Acerca de este alojamiento</h2>
          <p className="hospedaje-description">{oferta.descripcionOferta}</p>
        </section>}

        {detalle && <section className="hospedaje-section">
          <h2>¿Dónde vas a dormir?</h2>
          <div className="hospedaje-sleep-grid">
            <article className="hospedaje-sleep-card">
              {fotosOrdenadas[1] && <img src={urlMedia(fotosOrdenadas[1])} alt={fotosOrdenadas[1].altText ?? 'Espacio para dormir'}/>}
              <div>
                <strong>{detalle.tipoHabitacion === 'NO_APLICA' ? etiqueta(detalle.tipoAlojamiento) : `Habitación ${etiqueta(detalle.tipoHabitacion).toLocaleLowerCase('es')}`}</strong>
                <p>{detalle.cantidadCamas ? `${detalle.cantidadCamas} cama${detalle.cantidadCamas === 1 ? '' : 's'}` : 'Distribución según disponibilidad'}{detalle.banoPrivado ? ' · baño privado' : ''}</p>
              </div>
            </article>
          </div>
        </section>}

        {detalle?.amenidades.length ? <section className="hospedaje-section">
          <h2>Lo que ofrece este alojamiento</h2>
          <div className="hospedaje-amenities">
            {detalle.amenidades.map(amenidad => <div key={amenidad}><span aria-hidden="true">✓</span><span>{etiqueta(amenidad)}</span></div>)}
          </div>
        </section> : null}

        <ConfiguracionComercialOfertaPublica ofertaId={oferta.id} moneda={oferta.moneda}/>

        <section className="hospedaje-section">
          <h2>Ubicación</h2>
          <UbicacionPublica tipo="OFERTA" entidadId={String(oferta.id)}/>
        </section>

        <section className="hospedaje-section">
          <h2>Contacto del alojamiento</h2>
          <RedesContactoPublicas
            whatsapp={oferta.negocioWhatsapp}
            instagramUrl={oferta.negocioInstagramUrl}
            facebookUrl={oferta.negocioFacebookUrl}
          />
        </section>

        <section className="hospedaje-section hospedaje-policies">
          <h2>Lo que debes saber</h2>
          <div>
            <article><strong>Horarios</strong><p>{detalle?.horaCheckIn ? `Check-in desde las ${detalle.horaCheckIn.slice(0, 5)}.` : 'Consulta el check-in con el alojamiento.'} {detalle?.horaCheckOut ? `Check-out hasta las ${detalle.horaCheckOut.slice(0, 5)}.` : ''}</p></article>
            <article><strong>Reserva</strong><p>{oferta.reservaRequerida ? 'La reserva se confirma a través de Explora Mutatá y vuelve a validar disponibilidad y precio.' : 'Coordina directamente con el alojamiento.'}</p></article>
            <article><strong>Capacidad</strong><p>{oferta.capacidadMaxima ? `Hasta ${oferta.capacidadMaxima} huésped${oferta.capacidadMaxima === 1 ? '' : 'es'} por unidad.` : 'Consulta la capacidad con el alojamiento.'}</p></article>
          </div>
        </section>
      </div>

      <aside className="hospedaje-booking-column">
        <div className="hospedaje-booking-sticky">
          <div className="hospedaje-price-head">
            <span>Desde</span>
            <PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/>
          </div>
          <CotizadorOferta oferta={oferta}/>
        </div>
      </aside>
    </div>

    {galeriaAbierta && <div className="hospedaje-gallery-overlay" role="dialog" aria-modal="true" aria-label="Recorrido fotográfico">
      <div className="hospedaje-gallery-dialog">
        <div className="hospedaje-gallery-header">
          <div><span className="eyebrow">RECORRIDO FOTOGRÁFICO</span><h2>{oferta.nombre}</h2></div>
          <button type="button" onClick={() => setGaleriaAbierta(false)} aria-label="Cerrar galería">✕</button>
        </div>
        <div className="hospedaje-gallery-all">
          {fotosOrdenadas.map((media, indice) => <figure key={media.id}>
            <img src={urlMedia(media)} alt={media.altText ?? media.titulo ?? `Fotografía ${indice + 1} del alojamiento`}/>
            {(media.titulo || media.descripcion) && <figcaption><strong>{media.titulo ?? `Foto ${indice + 1}`}</strong>{media.descripcion && <span>{media.descripcion}</span>}</figcaption>}
          </figure>)}
        </div>
      </div>
    </div>}
  </>;
}
