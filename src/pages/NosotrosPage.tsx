import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import { arrowForwardOutline, briefcaseOutline, compassOutline, restaurantOutline, bedOutline, busOutline } from 'ionicons/icons';
import BrandHeader from '../components/BrandHeader';
import FooterInstitucional from '../components/FooterInstitucional';

const categorias = [
  { icono: bedOutline, titulo: 'Alojamientos', texto: 'Hospedajes y espacios para descansar.' },
  { icono: restaurantOutline, titulo: 'Gastronomía', texto: 'Restaurantes y sabores del territorio.' },
  { icono: compassOutline, titulo: 'Experiencias', texto: 'Naturaleza, cultura y aventura.' },
  { icono: busOutline, titulo: 'Transporte', texto: 'Opciones para moverte y llegar a cada experiencia.' },
];

export default function NosotrosPage() {
  return <IonPage>
    <BrandHeader title="Sobre Explora Mutatá"/>
    <IonContent fullscreen>
      <main className="about-page">
        <section className="about-hero">
          <div className="page-width about-hero-inner">
            <div>
              <span className="eyebrow">SOBRE EXPLORA MUTATÁ</span>
              <h1>Conectamos viajeros con <em>nuestro territorio.</em></h1>
              <p>Explora Mutatá es una plataforma creada para conectar a turistas con los negocios, emprendimientos, alojamientos, restaurantes, transportadores, guías y prestadores de experiencias del municipio de Mutatá.</p>
              <p>Nuestro objetivo es facilitar que los visitantes puedan descubrir, reservar y pagar servicios turísticos desde un mismo lugar, mientras los operadores locales cuentan con herramientas para promocionar y administrar sus servicios.</p>
              <div className="about-actions">
                <IonButton className="btn-explora" routerLink="/aventuras">Explorar Mutatá <IonIcon icon={arrowForwardOutline} slot="end"/></IonButton>
                <IonButton fill="outline" routerLink="/operador/solicitud"><IonIcon icon={briefcaseOutline} slot="start"/>Quiero ofrecer mis servicios</IonButton>
              </div>
            </div>
            <img src="/images/cultura-local.webp" alt="Cultura y territorio de Mutatá" loading="eager"/>
          </div>
        </section>

        <div className="page-width about-content">
          <section className="about-purpose-grid">
            <article id="mision">
              <span className="eyebrow">NUESTRA MISIÓN</span>
              <h2>Impulsar el turismo desde lo local.</h2>
              <p>Impulsar el turismo de Mutatá mediante una plataforma digital que conecte a viajeros con operadores y emprendimientos locales, facilitando la promoción, reserva y comercialización de experiencias, alojamientos, gastronomía, transporte y demás servicios turísticos del territorio.</p>
              <p>Buscamos fortalecer la economía local, facilitar el acceso de los negocios a herramientas digitales y brindar a los visitantes una forma sencilla y confiable de descubrir Mutatá.</p>
            </article>

            <article id="vision">
              <span className="eyebrow">NUESTRA VISIÓN</span>
              <h2>Ser una puerta digital al Urabá.</h2>
              <p>Ser la principal plataforma digital de turismo de Mutatá y convertirse progresivamente en un referente para la promoción y comercialización de experiencias turísticas del Urabá antioqueño.</p>
              <p>Queremos contribuir a que más visitantes conozcan el territorio, generando oportunidades para los operadores locales mediante tecnología, reservas digitales, pagos y promoción de sus servicios.</p>
            </article>
          </section>

          <section className="about-categories">
            <div className="section-heading">
              <span>TODO EN UN MISMO LUGAR</span>
              <h2>Descubre, reserva y <em>vive Mutatá.</em></h2>
              <p>Una plataforma pensada para viajeros y para quienes hacen posible cada experiencia en el territorio.</p>
            </div>
            <div className="about-category-grid">
              {categorias.map(item => <article key={item.titulo}>
                <IonIcon icon={item.icono}/>
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>
              </article>)}
            </div>
          </section>

          <section className="about-dual">
            <article>
              <span className="eyebrow">PARA VIAJEROS</span>
              <h2>Descubre → Reserva → Paga → Vive</h2>
              <p>Encuentra opciones del territorio, revisa disponibilidad, reserva y paga desde un mismo lugar.</p>
              <IonButton fill="clear" routerLink="/catalogo">Explorar opciones <IonIcon icon={arrowForwardOutline} slot="end"/></IonButton>
            </article>
            <article>
              <span className="eyebrow">PARA OPERADORES</span>
              <h2>Publica → Recibe reservas → Crece</h2>
              <p>Administra tu negocio, tus ofertas, fotografías, disponibilidad, reservas y pagos desde Explora Mutatá.</p>
              <IonButton fill="clear" routerLink="/operador/solicitud">Quiero participar <IonIcon icon={arrowForwardOutline} slot="end"/></IonButton>
            </article>
          </section>
        </div>
      </main>
      <FooterInstitucional/>
    </IonContent>
  </IonPage>;
}
