import { IonContent, IonPage } from '@ionic/react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import GestorMultimedia from '../components/GestorMultimedia';

export default function MultimediaPaqueteOperadorPage() {
  const { negocioId, paqueteId } = useParams<{ negocioId: string; paqueteId: string }>();
  return <IonPage><BrandHeader title="Multimedia del paquete"/><IonContent fullscreen><main className="page-width gestion-page">
    {negocioId && <Link className="resource-inline-link" to={`/operador/negocios/${encodeURIComponent(negocioId)}/paquetes`}>Volver a los paquetes</Link>}
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Contenido del <em>paquete.</em></h1><p>Administra la portada, galería y videos que verá el viajero.</p></div></div>
    {negocioId && paqueteId
      ? <GestorMultimedia contexto={{ tipo: 'PAQUETE_COMERCIAL', entidadId: paqueteId, negocioId }} titulo="Fotos y videos del paquete"/>
      : <div className="notice-error">No se pudo identificar el paquete.</div>}
  </main></IonContent></IonPage>;
}
