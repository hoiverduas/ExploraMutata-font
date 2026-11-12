import { IonButton, IonContent, IonModal, IonPage } from '@ionic/react';
import { useCallback, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import DatosOferta from '../components/DatosOferta';
import CotizadorOferta from '../components/CotizadorOferta';
import PrecioOferta from '../components/PrecioOferta';
import CarruselMultimediaPublico from '../components/CarruselMultimediaPublico';
import UbicacionPublica from '../components/UbicacionPublica';
import ConfiguracionComercialOfertaPublica from '../components/ConfiguracionComercialOfertaPublica';
import BotonFavorito from '../components/BotonFavorito';
import OfertaHospedajeDetalle from '../components/OfertaHospedajeDetalle';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { ofertasApi } from '../services/ofertasApi';
import { ApiError } from '../services/http';
import { nombresModeloPrecio } from '../types/oferta';
import type { OfertaNegocioResponse, OfertaRestauranteResponse } from '../types/oferta';

export default function OfertaDetallePage() {
  const { negocioId, ofertaId } = useParams<{ negocioId: string; ofertaId: string }>();
  const [searchParams] = useSearchParams();
  const [modalPlatoAbierto, setModalPlatoAbierto] = useState(false);
  const paqueteOrigen = searchParams.get('paquete')?.trim() || null;
  const cargar = useCallback((signal: AbortSignal) => {
    const id = Number(ofertaId);
    if (!negocioId || !Number.isSafeInteger(id) || id <= 0) return Promise.reject(new ApiError(404, 'La oferta no está disponible.'));
    return ofertasApi.buscarPublica(negocioId, id, { signal });
  }, [negocioId, ofertaId]);
  const cargarRestaurante = useCallback(async (signal: AbortSignal) => {
    const id = Number(ofertaId);
    if (!negocioId || !Number.isSafeInteger(id) || id <= 0) return null;
    const carta = await ofertasApi.restaurante.listarPublicas(negocioId, { signal });
    return carta.find(item => item.oferta.id === id) ?? null;
  }, [negocioId, ofertaId]);
  const consulta = useConsultaApi<OfertaNegocioResponse | null>(cargar, null);
  const restaurante = useConsultaApi<OfertaRestauranteResponse | null>(cargarRestaurante, null);
  const oferta = consulta.datos?.id === Number(ofertaId) && consulta.datos.negocioId === negocioId ? consulta.datos : null;
  const detalleRestaurante = restaurante.datos?.oferta.id === Number(ofertaId) ? restaurante.datos : null;
  const esPlatoDia = oferta?.categoria === 'RESTAURANTE' && detalleRestaurante?.tipoOferta === 'PLATO_DIA';
  return <IonPage><BrandHeader title={oferta?.nombre ?? 'Descubre una oferta'}/><IonContent fullscreen><main className="page-width tourism-detail">
    <NavegacionTuristica/>{paqueteOrigen
      ? <Link className="resource-inline-link package-return-link" to={`/paquetes/${encodeURIComponent(paqueteOrigen)}`}>← Volver al paquete</Link>
      : negocioId && <Link className="resource-inline-link" to={`/negocios/${encodeURIComponent(negocioId)}`}>Volver al negocio</Link>}
    <EstadoConsulta {...consulta} sinDatos={!oferta} mensajeVacio="La oferta no está disponible.">
      {oferta && (oferta.categoria === 'HOSPEDAJE'
        ? <OfertaHospedajeDetalle oferta={oferta}/>
        : <>
          <CarruselMultimediaPublico
            tipo="OFERTA"
            entidadId={String(oferta.id)}
            etiqueta={`Fotos y videos de ${oferta.nombre}`}
            respaldo={oferta.experienciaId ? { tipo: 'EXPERIENCIA', entidadId: oferta.experienciaId } : null}
          />
          <section className="marketplace-hero marketplace-hero-without-image">
            <div className="marketplace-hero-copy"><span className="eyebrow">{nombresCategoria[oferta.categoria]}</span><div className="detail-title-actions"><h1>{oferta.nombre}</h1><BotonFavorito tipo="OFERTA" recursoId={String(oferta.id)}/></div><Link to={`/negocios/${encodeURIComponent(oferta.negocioId)}`}>{oferta.negocioNombreComercial}</Link>{oferta.descripcionOferta && <p>{oferta.descripcionOferta}</p>}<PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/><small>{nombresModeloPrecio[oferta.modeloPrecio]}</small></div>
          </section>
          <UbicacionPublica tipo="OFERTA" entidadId={String(oferta.id)}/>
          <ConfiguracionComercialOfertaPublica ofertaId={oferta.id} moneda={oferta.moneda}/>
          {esPlatoDia
            ? <>
                <div className="offer-layout">
                  <DatosOferta key={`datos-${oferta.negocioId}-${oferta.id}`} oferta={oferta}/>
                  <section className="gestion-form-panel restaurante-plate-info">
                    <span className="eyebrow">PLATO DEL DÍA</span>
                    <h2>Reserva este plato sin salir del detalle</h2>
                    <p>Selecciona la cantidad de porciones, la fecha y el horario disponibles. Esta reserva corresponde al plato, no a una mesa.</p>
                    <IonButton className="btn-explora" onClick={() => setModalPlatoAbierto(true)}>Reservar plato</IonButton>
                  </section>
                </div>
                <IonModal isOpen={modalPlatoAbierto} onDidDismiss={() => setModalPlatoAbierto(false)} className="public-agenda-modal">
                  <IonContent className="ion-padding">
                    <div className="public-agenda-modal-content">
                      <div className="public-agenda-modal-top">
                        <div><span className="eyebrow">PLATO DEL DÍA</span><h2>Reservar {oferta.nombre}</h2><p>Elige las porciones y la disponibilidad para confirmar tu reserva.</p></div>
                        <IonButton fill="clear" onClick={() => setModalPlatoAbierto(false)}>Cerrar</IonButton>
                      </div>
                      <CotizadorOferta key={`plato-dia-${oferta.negocioId}-${oferta.id}`} oferta={oferta} tipoRestaurante="PLATO_DIA"/>
                    </div>
                  </IonContent>
                </IonModal>
              </>
            : oferta.categoria === 'RESTAURANTE' && !oferta.reservaRequerida
              ? <div className="offer-layout">
                  <DatosOferta key={`datos-${oferta.negocioId}-${oferta.id}`} oferta={oferta}/>
                  <section className="gestion-form-panel restaurante-plate-info">
                    <span className="eyebrow">MENÚ DEL RESTAURANTE</span>
                    <h2>Este plato no requiere reserva individual</h2>
                    <p>Consulta el precio y los detalles del plato aquí. Si deseas reservar una mesa, hazlo desde la ficha del restaurante.</p>
                    <Link className="marketplace-primary-link" to={`/negocios/${encodeURIComponent(oferta.negocioId)}?seccion=reservas`}>Reservar mesa en el restaurante</Link>
                  </section>
                </div>
              : <div className="offer-layout"><DatosOferta key={`datos-${oferta.negocioId}-${oferta.id}`} oferta={oferta}/><CotizadorOferta key={`cotizador-${oferta.negocioId}-${oferta.id}`} oferta={oferta} tipoRestaurante={detalleRestaurante?.tipoOferta ?? null}/></div>}
        </>)}
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
