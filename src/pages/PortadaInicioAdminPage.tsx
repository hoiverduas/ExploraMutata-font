import { IonContent, IonPage } from '@ionic/react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import GestorMultimedia from '../components/GestorMultimedia';

export default function PortadaInicioAdminPage() {
  return <IonPage><BrandHeader title="Portada de inicio"/><IonContent fullscreen>
    <main className="page-width gestion-page">
      <Link className="resource-inline-link" to="/gestion/negocios">Volver a gestión</Link>
      <div className="gestion-heading">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN · PORTADA</span>
          <h1>Contenido de <em>Inicio.</em></h1>
          <p>Sube fotos y videos para la portada principal de Explora Mutatá, define la portada y organiza el orden de reproducción.</p>
        </div>
      </div>
      <GestorMultimedia
        contexto={{ tipo: 'INICIO', entidadId: 'inicio' }}
        titulo="Fotos y videos de la portada"
      />
    </main>
  </IonContent></IonPage>;
}
