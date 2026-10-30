import { IonContent, IonPage } from '@ionic/react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import GestorMultimedia from '../components/GestorMultimedia';

export default function MultimediaAdminPage({ tipo }: { tipo: 'DESTINO' | 'EXPERIENCIA' }) {
  const params = useParams<{ destinoId: string; experienciaId: string }>();
  const id = tipo === 'DESTINO' ? params.destinoId : params.experienciaId;
  const regreso = tipo === 'DESTINO' ? '/gestion/destinos' : '/gestion/experiencias';
  return <IonPage><BrandHeader title={tipo === 'DESTINO' ? 'Multimedia del destino' : 'Multimedia de la experiencia'}/><IonContent fullscreen><main className="page-width gestion-page">
    <Link className="resource-inline-link" to={regreso}>Volver a gestión</Link>
    <div className="gestion-heading"><div><span className="eyebrow">ADMINISTRACIÓN · MULTIMEDIA</span><h1>Contenido de la <em>{tipo === 'DESTINO' ? 'aventura' : 'experiencia'}.</em></h1><p>Sube y organiza imágenes y videos con su información de derechos y autoría.</p></div></div>
    {id ? <GestorMultimedia contexto={{ tipo, entidadId: id }} titulo={tipo === 'DESTINO' ? 'Fotos y videos del destino' : 'Fotos y videos de la experiencia'}/> : <div className="notice-error">No se pudo identificar el recurso.</div>}
  </main></IonContent></IonPage>;
}
