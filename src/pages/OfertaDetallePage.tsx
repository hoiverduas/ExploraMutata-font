import { IonContent, IonPage } from '@ionic/react';
import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import DatosOferta from '../components/DatosOferta';
import CotizadorOferta from '../components/CotizadorOferta';
import PrecioOferta from '../components/PrecioOferta';
import GaleriaMultimediaPublica from '../components/GaleriaMultimediaPublica';
import RedesContactoPublicas from '../components/RedesContactoPublicas';
import UbicacionPublica from '../components/UbicacionPublica';
import { imagenEditorialCategoria } from '../components/OfertaPublicaCard';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { ofertasApi } from '../services/ofertasApi';
import { ApiError } from '../services/http';
import { nombresModeloPrecio } from '../types/oferta';
import type { OfertaNegocioResponse } from '../types/oferta';

export default function OfertaDetallePage() {
  const { negocioId, ofertaId } = useParams<{ negocioId: string; ofertaId: string }>();
  const cargar = useCallback((signal: AbortSignal) => {
    const id = Number(ofertaId);
    if (!negocioId || !Number.isSafeInteger(id) || id <= 0) return Promise.reject(new ApiError(404, 'La oferta no está disponible.'));
    return ofertasApi.buscarPublica(negocioId, id, { signal });
  }, [negocioId, ofertaId]);
  const consulta = useConsultaApi<OfertaNegocioResponse | null>(cargar, null);
  const oferta = consulta.datos?.id === Number(ofertaId) && consulta.datos.negocioId === negocioId ? consulta.datos : null;
  return <IonPage><BrandHeader title={oferta?.nombre ?? 'Descubre una oferta'}/><IonContent fullscreen><main className="page-width tourism-detail">
    <NavegacionTuristica/>{negocioId && <Link className="resource-inline-link" to={`/negocios/${encodeURIComponent(negocioId)}`}>Volver al negocio</Link>}
    <EstadoConsulta {...consulta} sinDatos={!oferta} mensajeVacio="La oferta no está disponible.">
      {oferta && <>
        <section className="marketplace-hero"><img className="marketplace-hero-image" src={imagenEditorialCategoria[oferta.categoria]} alt="Naturaleza y cultura de Mutatá, imagen editorial"/>
          <div className="marketplace-hero-copy"><span className="eyebrow">{nombresCategoria[oferta.categoria]}</span><h1>{oferta.nombre}</h1><Link to={`/negocios/${encodeURIComponent(oferta.negocioId)}`}>{oferta.negocioNombreComercial}</Link>{oferta.descripcionOferta && <p>{oferta.descripcionOferta}</p>}<PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/><small>{nombresModeloPrecio[oferta.modeloPrecio]}</small></div>
        </section>
        <GaleriaMultimediaPublica tipo="OFERTA" entidadId={String(oferta.id)}/>
        <section className="marketplace-section"><h2>Contacto del negocio</h2>
          <RedesContactoPublicas whatsapp={oferta.negocioWhatsapp} instagramUrl={oferta.negocioInstagramUrl} facebookUrl={oferta.negocioFacebookUrl}/>
        </section>
        <UbicacionPublica tipo="OFERTA" entidadId={String(oferta.id)}/>
        <div className="offer-layout"><DatosOferta key={`datos-${oferta.negocioId}-${oferta.id}`} oferta={oferta}/><CotizadorOferta key={`cotizador-${oferta.negocioId}-${oferta.id}`} oferta={oferta}/></div>
      </>}
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
