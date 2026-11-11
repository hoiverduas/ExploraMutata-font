import { IonContent, IonPage } from '@ionic/react';
import BrandHeader from '../components/BrandHeader';
export default function SofiaPage() {
  return <IonPage><BrandHeader title="Sofía"/><IonContent fullscreen>
    <main className="page-width sofia-page"><div className="sofia-visual">✦</div><span className="eyebrow">TU GUÍA VIRTUAL</span>
      <h1>Conoce a <em>Sofía.</em></h1><p>Tu acompañante para descubrir rutas, naturaleza y experiencias en Mutatá.</p>
      <a className="sofia-link" href="/voz.html">Hablar con Sofía ↗</a>
      <small>Usa el micrófono para conversar con Sofía y descubrir opciones según lo que buscas.</small>
    </main>
  </IonContent></IonPage>;
}
