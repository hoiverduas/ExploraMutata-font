import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import EstadoReservaBadge from '../components/EstadoReservaBadge';
import ReservaDatos from '../components/ReservaDatos';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { reservasApi } from '../services/reservasApi';
import type { ReservaResponse } from '../types/reserva';

export default function MisReservasPage() {
  const cargar = useCallback((signal: AbortSignal) => reservasApi.listarMisReservas({ signal }), []);
  const consulta = useConsultaApi<ReservaResponse[]>(cargar, []);
  return <IonPage><BrandHeader title="Mis reservas"/><IonContent fullscreen>
    <main className="page-width gestion-page">
      <Link className="resource-inline-link" to="/mi-cuenta">Volver a Mi cuenta</Link>
      <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE VIAJERO</span><h1>Mis <em>reservas.</em></h1><p>Consulta tus solicitudes y su estado.</p></div>
        <IonButton fill="outline" disabled={consulta.cargando} onClick={() => void consulta.actualizar()}>Actualizar reservas</IonButton>
      </div>
      <EstadoConsulta {...consulta} sinDatos={!consulta.datos.length} mensajeVacio="Aún no tienes reservas.">
        <div className="negocios-list">{consulta.datos.map(reserva => <article className="gestion-form-panel reserva-card" key={reserva.id}>
          <div className="gestion-form-heading"><h2>{reserva.negocioNombreComercial}</h2><EstadoReservaBadge estado={reserva.estado}/></div>
          <ReservaDatos reserva={reserva}/>
          <div className="marketplace-actions"><Link className="resource-inline-link" to={`/reservas/${encodeURIComponent(reserva.id)}`}>Ver detalle de la reserva <span aria-hidden="true">→</span></Link>{reserva.estado === 'COMPLETADA' && <Link className="marketplace-primary-link" to={`/reservas/${encodeURIComponent(reserva.id)}`}>Escribir reseña</Link>}</div>
        </article>)}</div>
      </EstadoConsulta>
    </main>
  </IonContent></IonPage>;
}
