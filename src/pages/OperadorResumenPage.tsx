import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { businessOutline, layersOutline, calendarOutline, storefrontOutline, walletOutline, cardOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';

export default function OperadorResumenPage() {
  return <IonPage><BrandHeader title="Mi espacio de operador"/><IonContent fullscreen><main className="page-width profile-page operador-resumen">
    <span className="eyebrow">CRECE CON EL TERRITORIO</span><h1>Tu espacio de <em>operador.</em></h1><p>Organiza tus negocios, publica los servicios que ofreces y acompaña las reservas de los viajeros.</p>
    <div className="operador-resumen-grid">
      <section className="profile-actions"><h2>Mis negocios</h2><p>Consulta y actualiza la información de tus establecimientos.</p><Link className="profile-action" to="/operador/negocios"><IonIcon icon={businessOutline}/> Administrar negocios <span>→</span></Link></section>
      <section className="profile-actions"><h2>Ofertas</h2><p>Crea servicios de aventura, hospedaje, restaurante, transporte, guía y vida nocturna desde cada negocio.</p><Link className="profile-action" to="/operador/negocios"><IonIcon icon={storefrontOutline}/> Elegir negocio para gestionar ofertas <span>→</span></Link></section>
      <section className="profile-actions"><h2>Paquetes</h2><p>Combina tus ofertas y organiza el itinerario de un paquete comercial.</p><Link className="profile-action" to="/operador/negocios"><IonIcon icon={layersOutline}/> Elegir negocio para gestionar paquetes <span>→</span></Link></section>
      <section className="profile-actions"><h2>Reservas</h2><p>Revisa las solicitudes de tus clientes y gestiona su confirmación.</p><Link className="profile-action" to="/operador/reservas"><IonIcon icon={calendarOutline}/> Gestionar reservas <span>→</span></Link></section>
      <section className="profile-actions"><h2>Finanzas</h2><p>Consulta pagos, movimientos, cuentas de liquidación y dispersiones de tus negocios.</p><Link className="profile-action" to="/operador/finanzas"><IonIcon icon={walletOutline}/> Ver finanzas <span>→</span></Link></section>
      <section className="profile-actions"><h2>Plan comercial</h2><p>Consulta el plan, contrato vigente y cargos de suscripción de cada negocio.</p><Link className="profile-action" to="/operador/comercial"><IonIcon icon={cardOutline}/> Ver mi plan comercial <span>→</span></Link></section>
      <section className="profile-actions"><h2>Reseñas</h2><p>Lee las opiniones recibidas y responde como negocio.</p><Link className="profile-action" to="/operador/resenas"><IonIcon icon={storefrontOutline}/> Gestionar reseñas <span>→</span></Link></section>
    </div>
  </main></IonContent></IonPage>;
}
