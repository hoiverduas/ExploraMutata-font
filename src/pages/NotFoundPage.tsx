import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return <IonPage>
    <BrandHeader title="Página no encontrada"/>
    <IonContent fullscreen>
      <main className="page-width not-found-page">
        <span className="eyebrow">EXPLORA MUTATÁ</span>
        <strong className="not-found-code">404</strong>
        <h1>Este camino no está disponible.</h1>
        <p>La página que buscas pudo cambiar, dejar de estar publicada o tener una dirección incorrecta.</p>
        <div className="marketplace-actions">
          <IonButton onClick={() => navigate('/inicio')}>Volver al inicio</IonButton>
          <IonButton fill="outline" onClick={() => navigate('/catalogo')}>Explorar el catálogo</IonButton>
        </div>
      </main>
    </IonContent>
  </IonPage>;
}
