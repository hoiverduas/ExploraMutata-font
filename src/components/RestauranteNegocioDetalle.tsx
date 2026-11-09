import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { callOutline, locationOutline, mailOutline, restaurantOutline } from 'ionicons/icons';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import BotonFavorito from './BotonFavorito';
import CarruselMultimediaPublico from './CarruselMultimediaPublico';
import OfertaPublicaCard, { imagenEditorialCategoria } from './OfertaPublicaCard';
import PaquetesComercialesNegocio from './PaquetesComercialesNegocio';
import PrecioOferta from './PrecioOferta';
import ResenasNegocioPublicas from './ResenasNegocioPublicas';
import UbicacionPublica from './UbicacionPublica';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { multimediaApi } from '../services/multimediaApi';
import { ofertasApi } from '../services/ofertasApi';
import type { NegocioPublico } from '../types/catalogo';
import type { MediaAssetResponse } from '../types/multimedia';
import type { OfertaNegocioResponse, OfertaRestauranteResponse, TipoServicioRestaurante } from '../types/oferta';

const nombresServicio: Record<TipoServicioRestaurante, string> = {
  DESAYUNO: 'Desayuno',
  ALMUERZO: 'Almuerzo',
  CENA: 'Cena',
  MERIENDA: 'Merienda',
  POSTRE: 'Postre',
  BEBIDA: 'Bebida',
  SNACK: 'Snack',
  MENU_ESPECIAL: 'Menú especial',
  OTRO: 'Otro',
};

const prioridad = (media: MediaAssetResponse) => {
  if (media.rol === 'PORTADA') return -2000;
  if (media.rol === 'MINIATURA') return -1000;
  return media.orden ?? 0;
};

const urlMedia = (media: MediaAssetResponse) =>
  media.url || `/api/v1/public/multimedia/${encodeURIComponent(media.id)}/archivo`;

function RestauranteOfertaCard({ detalle }: { detalle: OfertaRestauranteResponse }) {
  const oferta = detalle.oferta;
  const cargarMedia = useCallback(
    async (signal: AbortSignal) => {
      const propios = await multimediaApi.listarPublica('OFERTA', String(oferta.id), { signal });
      const fotos = propios.filter(media => media.tipo === 'IMAGEN');
      if (fotos.length) return fotos;
      const negocio = await multimediaApi.listarPublica('NEGOCIO', oferta.negocioId, { signal });
      return negocio.filter(media => media.tipo === 'IMAGEN');
    },
    [oferta.id, oferta.negocioId, oferta.version],
  );
  const multimedia = useConsultaApi<MediaAssetResponse[]>(cargarMedia, []);
  const portada = [...multimedia.datos].sort((a, b) => prioridad(a) - prioridad(b))[0];
  const imagen = portada ? urlMedia(portada) : imagenEditorialCategoria.RESTAURANTE;

  return <article className="restaurante-menu-card">
    <Link className="restaurante-menu-image-link" to={`/negocios/${encodeURIComponent(oferta.negocioId)}/ofertas/${oferta.id}`}>
      <img src={imagen} alt={portada?.altText ?? portada?.titulo ?? oferta.nombre} loading="lazy"/>
    </Link>
    <div className="restaurante-menu-card-body">
      <div className="restaurante-menu-card-top">
        <span>{detalle.tipoOferta === 'COMBO' ? 'Combo' : 'Plato / servicio'}</span>
        {oferta.reservaRequerida && <span className="restaurante-reserva-chip">Reserva</span>}
      </div>
      <h3>{oferta.nombre}</h3>
      {oferta.descripcionOferta && <p>{oferta.descripcionOferta}</p>}
      {detalle.items.length > 0 && <div className="restaurante-menu-items">
        {detalle.items.slice(0, 4).map(item => <span key={item.id}>
          {nombresServicio[item.tipoServicio]} · {item.nombre}{item.cantidad > 1 ? ` ×${item.cantidad}` : ''}
        </span>)}
        {detalle.items.length > 4 && <small>+{detalle.items.length - 4} elementos más</small>}
      </div>}
      <PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/>
      <Link
        className={`restaurante-menu-action ${oferta.reservaRequerida ? 'restaurante-menu-action-primary' : 'restaurante-menu-action-secondary'}`}
        to={`/negocios/${encodeURIComponent(oferta.negocioId)}/ofertas/${oferta.id}`}
      >
        <span>{oferta.reservaRequerida ? 'Ver y reservar' : 'Ver detalle'}</span>
        <span className="restaurante-menu-action-arrow" aria-hidden="true">→</span>
      </Link>
    </div>
  </article>;
}

export default function RestauranteNegocioDetalle({ negocio }: { negocio: NegocioPublico }) {
  const cargarCarta = useCallback(
    (signal: AbortSignal) => ofertasApi.restaurante.listarPublicas(negocio.id, { signal }),
    [negocio.id],
  );
  const cargarTodas = useCallback(
    (signal: AbortSignal) => ofertasApi.listarPublicas(negocio.id, undefined, { signal }),
    [negocio.id],
  );
  const carta = useConsultaApi<OfertaRestauranteResponse[]>(cargarCarta, []);
  const todas = useConsultaApi<OfertaNegocioResponse[]>(cargarTodas, []);
  const cartaOrdenada = [...carta.datos].sort((a, b) => Number(b.oferta.reservaRequerida) - Number(a.oferta.reservaRequerida));
  const otrasOfertas = todas.datos.filter(oferta => oferta.categoria !== 'RESTAURANTE');
  const reservable = cartaOrdenada.find(item => item.oferta.reservaRequerida)?.oferta ?? null;
  const ubicacion = [negocio.direccion, negocio.vereda, negocio.municipio].filter(Boolean).join(' · ');

  return <>
    <CarruselMultimediaPublico
      tipo="NEGOCIO"
      entidadId={negocio.id}
      etiqueta={`Fotos y videos de ${negocio.nombreComercial}`}
    />

    <section className="restaurante-hero" id="informacion">
      <div className="restaurante-hero-main">
        <span className="eyebrow">SABORES DE MUTATÁ</span>
        <div className="detail-title-actions restaurante-title-row">
          <h1>{negocio.nombreComercial}</h1>
          <BotonFavorito tipo="NEGOCIO" recursoId={negocio.id}/>
        </div>
        <div className="restaurante-badges">
          <span><IonIcon icon={restaurantOutline}/> Restaurante</span>
          {ubicacion && <span><IonIcon icon={locationOutline}/>{ubicacion}</span>}
        </div>
        {negocio.descripcion && <p className="restaurante-description">{negocio.descripcion}</p>}
      </div>

      <aside className="restaurante-contact-card" aria-label="Contacto del restaurante">
        <span className="restaurante-contact-kicker">CONTACTO DIRECTO</span>
        {negocio.telefonoContacto && <a href={`tel:${negocio.telefonoContacto.replace(/[^\d+]/g, '')}`}>
          <IonIcon icon={callOutline}/><span><small>Teléfono</small><strong>{negocio.telefonoContacto}</strong></span>
        </a>}
        {negocio.correoContacto && <a href={`mailto:${encodeURIComponent(negocio.correoContacto)}`}>
          <IonIcon icon={mailOutline}/><span><small>Correo</small><strong>{negocio.correoContacto}</strong></span>
        </a>}
      </aside>
    </section>

    <nav className="restaurante-subnav" aria-label="Secciones del restaurante">
      <a href="#informacion">Información</a>
      <a href="#carta">Menú</a>
      <a href="#reservas">Reservas</a>
      <a href="#ubicacion">Ubicación</a>
      <a href="#opiniones">Opiniones</a>
    </nav>

    <div className="restaurante-layout">
      <div className="restaurante-main-column">
        <section className="restaurante-section" id="carta">
          <div className="restaurante-section-heading">
            <div><span>PRUEBA LOS SABORES LOCALES</span><h2>Menú y <em>platos destacados.</em></h2></div>
            <span className="restaurante-section-count">{cartaOrdenada.length} {cartaOrdenada.length === 1 ? 'opción' : 'opciones'}</span>
          </div>

          {carta.cargando
            ? <div className="loading-state"><IonSpinner/> Cargando la carta…</div>
            : carta.error
              ? <div><div className="notice-error">{carta.error}</div><IonButton fill="clear" onClick={() => void carta.actualizar()}>Reintentar</IonButton></div>
              : cartaOrdenada.length
                ? <div className="restaurante-menu-grid">{cartaOrdenada.map(detalle => <RestauranteOfertaCard key={detalle.oferta.id} detalle={detalle}/>)}</div>
                : <div className="restaurante-empty-menu">
                    <IonIcon icon={restaurantOutline}/>
                    <strong>La carta digital está en preparación.</strong>
                    <p>Los platos aparecerán aquí cuando el restaurante publique su carta digital.</p>
                  </div>}
        </section>

        <section className="restaurante-section" id="ubicacion">
          <div className="restaurante-section-heading"><div><span>ENCUÉNTRALO FÁCIL</span><h2>Ubicación y <em>cómo llegar.</em></h2></div></div>
          <UbicacionPublica tipo="NEGOCIO" entidadId={negocio.id}/>
        </section>

        {otrasOfertas.length > 0 && <section className="restaurante-section">
          <div className="restaurante-section-heading"><div><span>MÁS PARA DISFRUTAR</span><h2>Otros planes del <em>negocio.</em></h2></div></div>
          <div className="catalog-grid">{otrasOfertas.map(oferta => <OfertaPublicaCard oferta={oferta} key={oferta.id}/>)}</div>
        </section>}
      </div>

      <aside className="restaurante-side-column" id="reservas">
        <div className="restaurante-booking-card">
          <span className="restaurante-contact-kicker">RESERVAS</span>
          <h2>Reserva tu experiencia gastronómica</h2>
          <p>{reservable
            ? 'Elige la opción disponible y continúa con fecha, personas y disponibilidad real.'
            : 'Este restaurante todavía no tiene una opción de reserva en línea publicada.'}</p>

          {reservable && <Link className="restaurante-booking-primary" to={`/negocios/${encodeURIComponent(negocio.id)}/ofertas/${reservable.id}`}>
            Elegir fecha y reservar
          </Link>}

          <div className="restaurante-booking-note">
            <strong>Confirmación desde Explora Mutatá</strong>
            <span>Cuando el operador confirme, recibirás la actualización de tu reserva.</span>
          </div>
        </div>

        <div className="restaurante-info-card">
          <h3>Información del restaurante</h3>
          {ubicacion && <p><IonIcon icon={locationOutline}/><span>{ubicacion}</span></p>}
          {negocio.ubicacionReferencia && <p><IonIcon icon={locationOutline}/><span>{negocio.ubicacionReferencia}</span></p>}
          {negocio.telefonoContacto && <p><IonIcon icon={callOutline}/><span>{negocio.telefonoContacto}</span></p>}
        </div>
      </aside>
    </div>

    <div id="opiniones"><ResenasNegocioPublicas negocioId={negocio.id}/></div>
    <PaquetesComercialesNegocio negocioId={negocio.id}/>
  </>;
}
