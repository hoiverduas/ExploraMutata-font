import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import CrearViajeForm from '../components/viaje/CrearViajeForm';
import { useViaje } from '../context/ViajeContext';

export default function MiViajePage() {
  const { borrador, cargando, error, refrescarViaje } = useViaje();
  const [creando, setCreando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  if (borrador && location.pathname === '/mi-viaje') return <Navigate replace to={`/viajes/${encodeURIComponent(borrador.id)}`}/>;
  return <IonPage><BrandHeader title="Mi viaje"/><IonContent fullscreen><main className="page-width viaje-page">
    <span className="eyebrow">A TU RITMO, A TU MANERA</span><h1>Mi viaje a <em>Mutatá.</em></h1><p>Combina aventuras, hospedajes, gastronomía y transporte de los negocios que elijas.</p>
    {cargando ? <div className="loading-state" role="status"><IonSpinner/> Buscando tu viaje en preparación…</div> : error ? <div><p className="notice-error" role="alert">{error}</p><IonButton onClick={() => void refrescarViaje()}>Reintentar</IonButton></div> : creando ? <CrearViajeForm onCancelar={() => setCreando(false)} onCreado={viaje => navigate(`/viajes/${encodeURIComponent(viaje.id)}`, { replace: true })}/> : <section className="viaje-empty gestion-form-panel"><h2>Tu viaje empieza con una idea</h2><p>Aún no tienes un viaje en borrador. Crea uno o empieza explorando ofertas y paquetes.</p><IonButton onClick={() => setCreando(true)}>Crear mi viaje</IonButton><div className="viaje-empty-links"><Link className="resource-inline-link" to="/catalogo">Explorar ofertas →</Link><Link className="resource-inline-link" to="/paquetes">Descubrir paquetes →</Link></div></section>}
    <Link className="resource-inline-link" to="/viajes">Ver todos mis viajes →</Link>
  </main></IonContent></IonPage>;
}
