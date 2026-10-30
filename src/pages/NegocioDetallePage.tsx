import { IonContent, IonPage } from '@ionic/react';
import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import OfertaPublicaCard, { imagenEditorialCategoria } from '../components/OfertaPublicaCard';
import PaquetesComercialesNegocio from '../components/PaquetesComercialesNegocio';
import GaleriaMultimediaPublica from '../components/GaleriaMultimediaPublica';
import RedesContactoPublicas from '../components/RedesContactoPublicas';
import UbicacionPublica from '../components/UbicacionPublica';
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
  return <IonPage><BrandHeader title={negocio?.nombreComercial ?? 'Descubre un negocio'}/><IonContent fullscreen>
    <main className="page-width tourism-detail"><NavegacionTuristica/><Link className="resource-inline-link" to="/catalogo">Volver al catálogo</Link>
      <EstadoConsulta {...consulta} sinDatos={!negocio} mensajeVacio="El negocio no está disponible.">
        {negocio && <>
          <section className="marketplace-hero"><img className="marketplace-hero-image" src={negocio.categorias.length ? imagenEditorialCategoria[negocio.categorias[0]] : '/images/hero-mutata.webp'} alt="Paisajes de Mutatá, imagen editorial"/>
            <div className="marketplace-hero-copy"><span className="eyebrow">DESCUBRE MUTATÁ</span><h1>{negocio.nombreComercial}</h1><div className="marketplace-badges">{negocio.categorias.map(valor => <span key={valor}>{nombresCategoria[valor]}</span>)}</div>{negocio.descripcion && <p>{negocio.descripcion}</p>}</div>
          </section>
          <GaleriaMultimediaPublica tipo="NEGOCIO" entidadId={negocio.id}/>
          <section className="marketplace-section"><h2>Conecta con el negocio</h2><dl className="catalog-contact">
            <div><dt>Teléfono</dt><dd>{negocio.telefonoContacto ? <a href={`tel:${negocio.telefonoContacto.replace(/[^\d+]/g, '')}`}>{negocio.telefonoContacto}</a> : 'Teléfono no disponible'}</dd></div>
            <div><dt>Correo</dt><dd>{negocio.correoContacto ? <a href={`mailto:${encodeURIComponent(negocio.correoContacto)}`}>{negocio.correoContacto}</a> : 'Correo no disponible'}</dd></div>
            {(negocio.direccion || negocio.vereda || negocio.municipio || negocio.ubicacionReferencia) && <div><dt>Ubicación</dt><dd>{[negocio.direccion, negocio.vereda, negocio.municipio, negocio.ubicacionReferencia].filter(Boolean).join(' · ')}</dd></div>}
          </dl>
          <RedesContactoPublicas whatsapp={negocio.whatsappContacto} instagramUrl={negocio.instagramUrl} facebookUrl={negocio.facebookUrl}/>
          </section>
          <UbicacionPublica tipo="NEGOCIO" entidadId={negocio.id}/>
          <section className="marketplace-section"><div className="section-heading"><span>ELIGE TU PRÓXIMO PLAN</span><h2>Ofertas de este <em>negocio.</em></h2></div>
            <div className="tourism-filters"><label>Categoría<select value={categoria} onChange={e => setCategoria(categoriasCatalogo.find(item => item.categoria === e.target.value)?.categoria ?? '')}><option value="">Todas las ofertas</option>{categoriasCatalogo.map(item => <option key={item.categoria} value={item.categoria}>{item.nombre}</option>)}</select></label></div>
            <EstadoConsulta {...ofertas} sinDatos={!ofertas.datos.length} mensajeVacio="Este negocio todavía no tiene ofertas publicadas para esta categoría."><div className="catalog-grid">{ofertas.datos.map(oferta => <OfertaPublicaCard oferta={oferta} key={oferta.id}/>)}</div></EstadoConsulta>
          </section>
          <PaquetesComercialesNegocio negocioId={negocio.id}/>
        </>}
      </EstadoConsulta>
    </main>
  </IonContent></IonPage>;
}
