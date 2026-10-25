import { IonContent, IonPage, IonButton, IonIcon } from '@ionic/react';
import { arrowForwardOutline, micOutline } from 'ionicons/icons';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import NavegacionTuristica from '../components/NavegacionTuristica';
import NegociosPublicos from '../components/NegociosPublicos';
import TarjetaTuristica from '../components/TarjetaTuristica';
import TarjetaPaqueteComercial from '../components/TarjetaPaqueteComercial';
import EstadoConsulta from '../components/EstadoConsulta';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { destinosApi } from '../services/destinosApi';
import { paquetesComercialesApi } from '../services/paquetesComercialesApi';
import { nombresTipoDestino } from '../data/turismo';
import type { DestinoPublico } from '../types/destino';
import type { CategoriaNegocio } from '../types/catalogo';

const servicios: { categoria: CategoriaNegocio; titulo: string; texto: string; ruta: string }[] = [
  { categoria: 'HOSPEDAJE', titulo: 'Un lugar para descansar', texto: 'DÓNDE HOSPEDARTE', ruta: '/alojamientos' },
  { categoria: 'RESTAURANTE', titulo: 'Sabores que cuentan historias', texto: 'GASTRONOMÍA LOCAL', ruta: '/restaurantes' },
  { categoria: 'TRANSPORTE', titulo: 'El camino también es parte del viaje', texto: 'CÓMO MOVERTE', ruta: '/transporte' },
  { categoria: 'VIDA_NOCTURNA', titulo: 'Mutatá después del atardecer', texto: 'VIDA NOCTURNA', ruta: '/vida-nocturna' },
];
export default function InicioPage() {
  const catalogo = useCatalogoPublico();
  const cargarDestinos = useCallback((signal: AbortSignal) => destinosApi.listarPublicos(undefined, { signal }), []);
  const destinos = useConsultaApi<DestinoPublico[]>(cargarDestinos, []);
  const cargarPaquetes = useCallback((signal: AbortSignal) => paquetesComercialesApi.listarPublicos(undefined, { signal }), []);
  const paquetes = useConsultaApi(cargarPaquetes, []);
  return <IonPage><BrandHeader/><IonContent fullscreen>
    <section className="hero-home">
      <div className="hero-home-bg"/>
      <div className="hero-home-copy page-width"><span className="eyebrow">EL CORAZÓN NATURAL DE URABÁ</span>
        <h1>Descubre Mutatá.<br/><em>Vive tu propia aventura.</em></h1>
        <p>Naturaleza, sabores y experiencias auténticas. Encuentra tu lugar, conoce a quienes lo hacen especial y construye un viaje a tu medida.</p>
        <div className="hero-actions"><IonButton className="btn-explora" routerLink="/aventuras">Explorar aventuras <IonIcon icon={arrowForwardOutline} slot="end"/></IonButton><IonButton fill="outline" color="light" routerLink="/mi-viaje">Armar mi viaje</IonButton></div>
        <div className="hero-note"><span>01 · Descubre</span><span>02 · Combina</span><span>03 · Reserva</span></div>
      </div>
    </section>
    <main className="page-width home-content"><NavegacionTuristica/>
      <section className="home-section"><div className="section-heading"><span>AVENTURAS POR DESCUBRIR</span><h2>Tu próximo recuerdo <em>empieza aquí.</em></h2><p>Elige un destino y encuentra las experiencias y ofertas disponibles.</p></div>
        <EstadoConsulta {...destinos} sinDatos={!destinos.datos.length} mensajeVacio="Pronto encontrarás nuevos destinos para tu próxima aventura."><div className="catalog-grid">{destinos.datos.slice(0,3).map(destino => <TarjetaTuristica key={destino.id} nombre={destino.nombre} descripcion={destino.descripcion} etiqueta={nombresTipoDestino[destino.tipo]} ruta={`/destinos/${encodeURIComponent(destino.slug)}`}/>)}</div></EstadoConsulta>
        <Link className="catalog-detail-link" to="/aventuras">Todas las aventuras →</Link>
      </section>
      <section className="home-section"><div className="section-heading"><span>VIAJES CON TODO EL SENTIDO</span><h2>Planes para <em>dejarte llevar.</em></h2><p>Explora los paquetes publicados por los negocios del territorio.</p></div>
        <EstadoConsulta {...paquetes} sinDatos={!paquetes.datos.length} mensajeVacio="No hay paquetes disponibles en este momento."><div className="catalog-grid">{paquetes.datos.slice(0,3).map(paquete => <TarjetaPaqueteComercial key={paquete.id} paquete={paquete}/>)}</div></EstadoConsulta>
        <Link className="catalog-detail-link" to="/paquetes">Explorar paquetes →</Link>
      </section>
      <section className="trip-invitation"><div><span className="eyebrow">UN VIAJE, MUCHAS POSIBILIDADES</span><h2>Hazlo <em>a tu manera.</em></h2><p>Combina aventuras, hospedaje, comida y transporte de distintos negocios en Mi viaje. Cotiza antes de reservar.</p></div><IonButton className="btn-explora" routerLink="/mi-viaje">Comenzar mi viaje <IonIcon icon={arrowForwardOutline} slot="end"/></IonButton></section>
      {servicios.map(seccion => <section className="home-section" key={seccion.categoria}><div className="section-heading"><span>{seccion.texto}</span><h2>{seccion.titulo}</h2></div><NegociosPublicos negocios={catalogo.negocios.filter(negocio => negocio.categorias.includes(seccion.categoria)).slice(0,3)} cargando={catalogo.cargando} error={catalogo.error} actualizar={catalogo.actualizar} mensajeVacio="Aún no hay negocios publicados en esta categoría."/><Link className="catalog-detail-link" to={seccion.ruta}>Explorar opciones →</Link></section>)}
      <section className="sofia-teaser"><div className="sofia-icon" aria-hidden="true">✦</div><div><strong>¿No sabes por dónde empezar?</strong><p>Sofía te ayuda a descubrir Mutatá por voz.</p></div><IonButton fill="clear" color="light" routerLink="/sofia"><IonIcon icon={micOutline} slot="start"/>Hablar con Sofía</IonButton></section>
      <section className="culture-preview"><img src="/images/cultura-local.webp" alt="Artesanía y cultura local de Mutatá" loading="lazy"/><div><span className="eyebrow">RAÍCES VIVAS</span><h2>La verdadera riqueza está en <em>su gente.</em></h2><p>Conoce los saberes, historias y tradiciones del territorio con respeto por sus comunidades.</p><Link className="catalog-detail-link" to="/guias">Explorar con un guía local →</Link></div></section>
      <div className="disclaimer-bottom">Proyecto independiente de turismo. No es el sitio oficial de la Alcaldía de Mutatá. Las solicitudes de reserva están sujetas a la confirmación de cada negocio.</div>
    </main>
  </IonContent></IonPage>;
}
