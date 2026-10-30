import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import EstadoReservaBadge from '../components/EstadoReservaBadge';
import ReservaDatos from '../components/ReservaDatos';
import PagoReservaPanel from '../components/PagoReservaPanel';
import ResenaReservaPanel from '../components/ResenaReservaPanel';
import { puedeCancelarReserva } from '../domain/reservas';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { ApiError } from '../services/http';
import { reservasApi } from '../services/reservasApi';
import type { ReservaResponse } from '../types/reserva';

function mensajeError(error: unknown, alternativo: string) {
  if (error instanceof ApiError && error.status === 404) return 'La reserva no existe o no pertenece a tu cuenta.';
  return error instanceof Error ? error.message : alternativo;
}

export default function ReservaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const estadoNavegacion: unknown = useLocation().state;
  const reservaCreada = Boolean(estadoNavegacion && typeof estadoNavegacion === 'object' && 'reservaCreada' in estadoNavegacion && estadoNavegacion.reservaCreada === true);
  const cargar = useCallback(async (signal: AbortSignal) => {
    if (!id) throw new ApiError(404, 'La reserva no existe o no pertenece a tu cuenta.');
    try { return await reservasApi.obtenerReserva(id, { signal }); }
    catch (error) { throw new Error(mensajeError(error, 'No se pudo consultar la reserva.')); }
  }, [id]);
  const consulta = useConsultaApi<ReservaResponse | null>(cargar, null);
  const reserva = consulta.datos?.id === id ? consulta.datos : null;
  const ocupado = useRef(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const visita = useRef(0);
  useEffect(() => {
    visita.current++;
    setMensaje(''); setErrorAccion('');
    return () => { visita.current++; };
  }, [id]);

  const cancelar = async () => {
    if (ocupado.current || !reserva || !puedeCancelarReserva(reserva.estado)) return;
    if (!window.confirm('¿Quieres cancelar esta reserva?')) return;
    ocupado.current = true;
    const visitaActual = visita.current;
    setGuardando(true); setMensaje(''); setErrorAccion('');
    try {
      await reservasApi.cancelarReserva(reserva.id);
      if (visitaActual !== visita.current) return;
      setMensaje('La reserva fue cancelada correctamente.');
      await consulta.actualizar();
    } catch (error) {
      if (visitaActual !== visita.current) return;
      setErrorAccion(mensajeError(error, 'No se pudo cancelar la reserva. Inténtalo de nuevo.'));
      // Consultar el estado vigente sin repetir la cancelación ni ocultar el conflicto.
      if (error instanceof ApiError && error.status === 409) await consulta.actualizar();
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  };

  return <IonPage><BrandHeader title="Detalle de la reserva"/><IonContent fullscreen>
    <main className="page-width gestion-page">
      <Link className="resource-inline-link" to="/reservas">Volver a Mis reservas</Link>
      <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE VIAJERO</span><h1>Tu <em>reserva.</em></h1></div>
        <IonButton fill="outline" disabled={guardando || consulta.cargando} onClick={() => void consulta.actualizar()}>Actualizar reserva</IonButton>
      </div>
      {reservaCreada && reserva && !mensaje && !errorAccion && <div className="notice-success" role="status">Tu solicitud de reserva se creó correctamente. Consulta aquí su estado.</div>}
      {mensaje && <div className="notice-success" role="status">{mensaje}</div>}
      {errorAccion && <div className="notice-error" role="alert">{errorAccion}</div>}
      <EstadoConsulta {...consulta} sinDatos={!reserva} mensajeVacio="La reserva no existe o no pertenece a tu cuenta.">
        {reserva && <section className="gestion-form-panel reserva-card">
          <div className="gestion-form-heading"><h2>{reserva.negocioNombreComercial}</h2><EstadoReservaBadge estado={reserva.estado}/></div>
          <ReservaDatos reserva={reserva}/>
          <PagoReservaPanel reserva={reserva}/><ResenaReservaPanel reserva={reserva}/>
          {puedeCancelarReserva(reserva.estado) && <div className="form-actions"><IonButton fill="outline" color="medium" disabled={guardando || consulta.cargando} onClick={() => void cancelar()}>{guardando ? 'Cancelando…' : 'Cancelar reserva'}</IonButton></div>}
        </section>}
      </EstadoConsulta>
    </main>
  </IonContent></IonPage>;
}
