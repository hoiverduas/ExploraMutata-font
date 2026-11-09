import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { callOutline, locationOutline, mailOutline } from 'ionicons/icons';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import OfertaPublicaCard from '../components/OfertaPublicaCard';
import PaquetesComercialesNegocio from '../components/PaquetesComercialesNegocio';
import CarruselMultimediaPublico from '../components/CarruselMultimediaPublico';
import UbicacionPublica from '../components/UbicacionPublica';
import BotonFavorito from '../components/BotonFavorito';
import ResenasNegocioPublicas from '../components/ResenasNegocioPublicas';
import RestauranteNegocioDetalle from '../components/RestauranteNegocioDetalle';
import { categoriasCatalogo, nombresCategoria } from '../data/categoriasCatalogo';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { listarNegociosPublicos } from '../services/catalogoApi';
import { ofertasApi } from '../services/ofertasApi';
import { ApiError } from '../services/http';
import type { CategoriaNegocio, NegocioPublico } from '../types/catalogo';
import type { OfertaNegocioResponse } from '../types/oferta';

export default function NegocioDetallePage() {
  const { negocioId } = useParams<{ negocioId: string }>();
  const [categoria, setCategoria] = useState<CategoriaNegocio | ''>('');
  const cargarNegocio = useCallback(async (signal: AbortSignal) => {
    if (!negocioId) throw new ApiError(404, 'El negocio no está disponible.');
    // El contrato público ofrece un listado, no un endpoint de detalle por ID.
    const negocio = (await listarNegociosPublicos({ signal })).find(item => item.id === negocioId);
    if (!negocio) throw new ApiError(404, 'El negocio no está disponible.');
    return negocio;
  }, [negocioId]);
  const cargarOfertas = useCallback((signal: AbortSignal) => {
    if (!negocioId) return Promise.reject(new ApiError(404, 'El negocio no está disponible.'));
    return ofertasApi.listarPublicas(negocioId, categoria || undefined, { signal });
  }, [negocioId, categoria]);
  const consulta = useConsultaApi<NegocioPublico | null>(cargarNegocio, null);
  const ofertas = useConsultaApi<OfertaNegocioResponse[]>(cargarOfertas, []);

  const negocio = consulta.datos?.id === negocioId ? consulta.datos : null;
  const reservaDirecta = Boolean(negocio && (negocio.categorias.includes('HOSPEDAJE') || negocio.categorias.includes('TRANSPORTE')));
  const ofertasOrdenadas = [...ofertas.datos].sort((a, b) => Number(b.reservaRequerida) - Number(a.reservaRequerida));
  const tituloOfertas = negocio?.categorias.includes('HOSPEDAJE')
    ? 'Habitaciones y alojamientos disponibles.'
    : negocio?.categorias.includes('TRANSPORTE')
      ? 'Rutas y traslados disponibles.'
      : 'Ofertas de este negocio.';
  return <IonPage><BrandHeader title={negocio?.nombreComercial ?? 'Descubre un negocio'}/><IonContent fullscreen>
    <main className="page-width tourism-detail"><NavegacionTuristica/><Link className="resource-inline-link" to="/catalogo">Volver al catálogo</Link>
      <EstadoConsulta {...consulta} sinDatos={!negocio} mensajeVacio="El negocio no está disponible.">
        {negocio && (negocio.categorias.includes('RESTAURANTE')
          ? <RestauranteNegocioDetalle negocio={negocio}/>
          : <>
          <CarruselMultimediaPublico
            tipo="NEGOCIO"
            entidadId={negocio.id}
            etiqueta={`Fotos y videos de ${negocio.nombreComercial}`}
          />
          <section className="marketplace-hero marketplace-hero-without-image negocio-public-hero">
            <div className="marketplace-hero-copy">
              <span className="eyebrow">DESCUBRE MUTATÁ</span>
              <div className="detail-title-actions">
                <h1>{negocio.nombreComercial}</h1>
                <BotonFavorito tipo="NEGOCIO" recursoId={negocio.id}/>
              </div>
              <div className="marketplace-badges">{negocio.categorias.map(valor => <span key={valor}>{nombresCategoria[valor]}</span>)}</div>
              {negocio.descripcion && <p>{negocio.descripcion}</p>}
              <section className="negocio-contact-panel" aria-label="Información de contacto">
                <span className="negocio-contact-label">CONTACTO</span>
                <dl className="negocio-hero-contact">
                  <div className="negocio-contact-item">
                    <span className="negocio-contact-icon" aria-hidden="true"><IonIcon icon={callOutline}/></span>
                    <div>
                      <dt>Teléfono</dt>
                      <dd>{negocio.telefonoContacto ? <a href={`tel:${negocio.telefonoContacto.replace(/[^\d+]/g, '')}`}>{negocio.telefonoContacto}</a> : 'No disponible'}</dd>
                    </div>
                  </div>
                  <div className="negocio-contact-item">
                    <span className="negocio-contact-icon" aria-hidden="true"><IonIcon icon={mailOutline}/></span>
                    <div>
                      <dt>Correo</dt>
                      <dd>{negocio.correoContacto ? <a href={`mailto:${encodeURIComponent(negocio.correoContacto)}`}>{negocio.correoContacto}</a> : 'No disponible'}</dd>
                    </div>
                  </div>
                  {(negocio.direccion || negocio.vereda || negocio.municipio || negocio.ubicacionReferencia) && <div className="negocio-contact-item negocio-hero-location">
                    <span className="negocio-contact-icon" aria-hidden="true"><IonIcon icon={locationOutline}/></span>
                    <div>
                      <dt>Ubicación</dt>
                      <dd>{[negocio.direccion, negocio.vereda, negocio.municipio, negocio.ubicacionReferencia].filter(Boolean).join(' · ')}</dd>
                    </div>
                  </div>}
                </dl>
              </section>
            </div>
          </section>
          {reservaDirecta && <section className="marketplace-section priority-booking-section">
            <div className="section-heading"><span>RESERVA DESDE AQUÍ</span><h2>{tituloOfertas}</h2></div>
            <EstadoConsulta {...ofertas} sinDatos={!ofertasOrdenadas.length} mensajeVacio="Este negocio todavía no tiene opciones reservables publicadas.">
              <div className="catalog-grid">{ofertasOrdenadas.map(oferta => <OfertaPublicaCard oferta={oferta} key={oferta.id}/>)}</div>
            </EstadoConsulta>
          </section>}
          <UbicacionPublica tipo="NEGOCIO" entidadId={negocio.id}/>
          {!reservaDirecta && <section className="marketplace-section"><div className="section-heading"><span>ELIGE TU PRÓXIMO PLAN</span><h2>Ofertas de este <em>negocio.</em></h2></div>
            <div className="tourism-filters"><label>Categoría<select value={categoria} onChange={e => setCategoria(categoriasCatalogo.find(item => item.categoria === e.target.value)?.categoria ?? '')}><option value="">Todas las ofertas</option>{categoriasCatalogo.map(item => <option key={item.categoria} value={item.categoria}>{item.nombre}</option>)}</select></label></div>
            <EstadoConsulta {...ofertas} sinDatos={!ofertas.datos.length} mensajeVacio="Este negocio todavía no tiene ofertas publicadas para esta categoría."><div className="catalog-grid">{ofertasOrdenadas.map(oferta => <OfertaPublicaCard oferta={oferta} key={oferta.id}/>)}</div></EstadoConsulta>
          </section>}
          <ResenasNegocioPublicas negocioId={negocio.id}/><PaquetesComercialesNegocio negocioId={negocio.id}/>
        </>)}
      </EstadoConsulta>
    </main>
  </IonContent></IonPage>;
}
