import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import EstadoReservaBadge from '../components/EstadoReservaBadge';
import ReservaDatos from '../components/ReservaDatos';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { reservasApi } from '../services/reservasApi';
import type { EstadoReserva, ReservaResponse } from '../types/reserva';

const prioridadEstado: Record<EstadoReserva, number> = {
  PENDIENTE: 0,
  CONFIRMADA: 1,
  RECHAZADA: 2,
  CANCELADA: 3,
  COMPLETADA: 4,
};

function mensajeEstado(reserva: ReservaResponse): string {
  switch (reserva.estado) {
    case 'PENDIENTE':
      return 'Esperando confirmación del negocio. El pago se habilitará cuando el negocio confirme la reserva.';
    case 'CONFIRMADA':
      return 'El negocio confirmó tu reserva. Ya puedes entrar al detalle y elegir cuánto pagar entre 50 % y 100 %.';
    case 'RECHAZADA':
      return reserva.motivoRechazo
        ? `El negocio rechazó la solicitud: ${reserva.motivoRechazo}`
        : 'El negocio rechazó esta solicitud de reserva.';
    case 'CANCELADA':
      return 'Esta reserva fue cancelada.';
    case 'COMPLETADA':
      return 'La reserva fue completada.';
  }
}

function textoAccion(estado: EstadoReserva): string {
  if (estado === 'PENDIENTE') return 'Ver estado';
  if (estado === 'CONFIRMADA') return 'Continuar al pago';
  return 'Ver detalle';
}

export default function MisReservasPage() {
  const cargar = useCallback((signal: AbortSignal) => reservasApi.listarMisReservas({ signal }), []);
  const consulta = useConsultaApi<ReservaResponse[]>(cargar, []);
  const reservasOrdenadas = [...consulta.datos].sort((a, b) => {
    const prioridad = prioridadEstado[a.estado] - prioridadEstado[b.estado];
    if (prioridad !== 0) return prioridad;
    return b.fechaCreacion.localeCompare(a.fechaCreacion);
  });
  const pendientes = consulta.datos.filter(reserva => reserva.estado === 'PENDIENTE').length;
  const confirmadas = consulta.datos.filter(reserva => reserva.estado === 'CONFIRMADA').length;

  return <IonPage><BrandHeader title="Mis reservas"/><IonContent fullscreen>
    <main className="page-width gestion-page">
      <Link className="resource-inline-link" to="/mi-cuenta">Volver a Mi cuenta</Link>
      <div className="gestion-heading"><div>
        <span className="eyebrow">MI ESPACIO DE VIAJERO</span>
        <h1>Mis <em>reservas.</em></h1>
        <p>Aquí quedan guardadas todas tus solicitudes para que puedas volver y consultar su estado en cualquier momento.</p>
      </div>
        <IonButton fill="outline" disabled={consulta.cargando} onClick={() => void consulta.actualizar()}>
          {consulta.cargando ? 'Actualizando…' : 'Actualizar reservas'}
        </IonButton>
      </div>

      {consulta.datos.length > 0 && <div className="quote-summary" role="status">
        <h3>Estado de tus solicitudes</h3>
        <p>
          {pendientes > 0 ? `${pendientes} pendiente${pendientes === 1 ? '' : 's'} de confirmación. ` : ''}
          {confirmadas > 0 ? `${confirmadas} confirmada${confirmadas === 1 ? '' : 's'} lista${confirmadas === 1 ? '' : 's'} para pago.` : ''}
          {pendientes === 0 && confirmadas === 0 ? 'No tienes reservas esperando confirmación o pago.' : ''}
        </p>
      </div>}

      <EstadoConsulta {...consulta} sinDatos={!consulta.datos.length} mensajeVacio="Aún no tienes reservas.">
        <div className="negocios-list">
          {reservasOrdenadas.map(reserva => <article className="gestion-form-panel reserva-card" key={reserva.id}>
            <div className="gestion-form-heading">
              <h2>{reserva.negocioNombreComercial}</h2>
              <EstadoReservaBadge estado={reserva.estado}/>
            </div>

            <div className={reserva.estado === 'PENDIENTE' ? 'quote-summary' : reserva.estado === 'CONFIRMADA' ? 'notice-success' : ''}>
              <strong>{reserva.estado === 'PENDIENTE' ? 'Solicitud enviada' : reserva.estado === 'CONFIRMADA' ? 'Reserva confirmada' : 'Estado de la reserva'}</strong>
              <p>{mensajeEstado(reserva)}</p>
            </div>

            <ReservaDatos reserva={reserva}/>

            <div className="marketplace-actions">
              <Link
                className={reserva.estado === 'CONFIRMADA' ? 'marketplace-primary-link' : 'resource-inline-link'}
                to={`/reservas/${encodeURIComponent(reserva.id)}`}
              >
                {textoAccion(reserva.estado)} <span aria-hidden="true">→</span>
              </Link>
              {reserva.estado === 'COMPLETADA' && <Link className="marketplace-primary-link" to={`/reservas/${encodeURIComponent(reserva.id)}`}>Escribir reseña</Link>}
            </div>
          </article>)}
        </div>
      </EstadoConsulta>
    </main>
  </IonContent></IonPage>;
}
