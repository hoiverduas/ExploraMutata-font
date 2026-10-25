import { IonContent, IonPage, IonButton, IonIcon } from '@ionic/react';
import { arrowForwardOutline, micOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import BrandHeader from '../components/BrandHeader';
import CatalogoCategorias from '../components/CatalogoCategorias';
import NavegacionTuristica from '../components/NavegacionTuristica';
import NegociosPublicos from '../components/NegociosPublicos';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';

const categorias = [
  { nombre: 'Ríos y paisajes', subtitulo: 'NATURALEZA', ruta: '/destinos', imagen: '/images/rio-puenteadero.webp' },
  { nombre: 'Experiencias únicas', subtitulo: 'AVENTURA', ruta: '/catalogo/experiencias', imagen: '/images/rio-bedo.webp' },
  { nombre: 'Dónde quedarte', subtitulo: 'DESCANSO', ruta: '/alojamientos', imagen: '/images/naturaleza-comunidad.webp' },
  { nombre: 'Nuestra cultura', subtitulo: 'TRADICIÓN', ruta: '/destinos', imagen: '/images/cultura-local.webp' },
];

export default function InicioPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { negocios, cargando, error, actualizar } = useCatalogoPublico();
  return <IonPage>
    <BrandHeader />
    <IonContent fullscreen>
      <div className="prototype-ribbon">EXPLORA MUTATÁ · TURISMO Y EXPERIENCIAS LOCALES</div>
      <section className="hero-home">
        <div className="hero-home-bg" />
        <div className="hero-home-copy page-width">
          <span className="eyebrow">◆ EL CORAZÓN NATURAL DE URABÁ</span>
          <h1>Hay lugares que se visitan.<br/><em>Mutatá se vive.</em></h1>
          <p>Ríos que cuentan historias, selva que abraza y una cultura que te recibe con los brazos abiertos. Tu próxima aventura comienza aquí.</p>
          <IonButton className="btn-explora" onClick={() => navigate('/destinos')}>Descubrir destinos <IonIcon icon={arrowForwardOutline} slot="end" /></IonButton>
          <IonButton fill="outline" color="light" onClick={() => navigate(usuario ? "/mi-cuenta" : "/registro")} style={{ marginLeft: 12 }}>
            {usuario ? "Mi cuenta" : "Crear cuenta de turista"}
          </IonButton>
        </div>
      </section>
      <main className="page-width home-content">
        <div className="section-heading"><span>DESCUBRE MUTATÁ</span><h2>¿Qué te gustaría <em>vivir hoy?</em></h2></div>
        <div className="category-grid">
          {categorias.map((categoria,i) => <button className="category-tile" key={categoria.nombre} style={{ backgroundImage: `linear-gradient(0deg, rgba(11,36,34,.82), rgba(11,36,34,.07)),url('${categoria.imagen}')` }} onClick={() => navigate(categoria.ruta)}>
            <small>0{i+1} · {categoria.subtitulo}</small><strong>{categoria.nombre}</strong><span aria-hidden="true">↗</span>
          </button>)}
        </div>
        <NavegacionTuristica/>
        <CatalogoCategorias/>
        <section className="sofia-teaser"><div className="sofia-icon">✦</div><div><strong>¿No sabes por dónde empezar?</strong><p>Sofía te ayuda a descubrir Mutatá por voz.</p></div><IonButton fill="clear" color="light" onClick={() => navigate('/sofia')}><IonIcon icon={micOutline} slot="start" /> Hablar</IonButton></section>
        <div className="section-heading feature-section"><span>SERVICIOS DEL TERRITORIO</span><h2>Descubre los negocios de <em>Mutatá.</em></h2></div>
        <NegociosPublicos negocios={negocios.slice(0,3)} cargando={cargando} error={error} actualizar={actualizar} mensajeVacio="Todavía no hay negocios publicados."/>
        <IonButton fill="outline" onClick={() => navigate('/catalogo')}>Ver catálogo completo <IonIcon icon={arrowForwardOutline} slot="end"/></IonButton>
        <section className="culture-preview"><img src="/images/cultura-local.webp" alt="Artesanía y cultura local" /><div><span className="eyebrow">RAÍCES VIVAS</span><h2>La verdadera riqueza está en <em>su gente.</em></h2><p>Un espacio para conocer los saberes, historias y tradiciones del territorio con respeto por sus comunidades.</p></div></section>
        <div className="disclaimer-bottom">Proyecto independiente de turismo. No es el sitio oficial de la Alcaldía de Mutatá. Consulta directamente con cada negocio para conocer sus servicios.</div>
      </main>
    </IonContent>
  </IonPage>;
}
