import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import EstadoReservaBadge from '../components/EstadoReservaBadge';
import EstadoViajeBadge from '../components/viaje/EstadoViajeBadge';
import TotalesViaje from '../components/viaje/TotalesViaje';
import CotizacionViaje from '../components/viaje/CotizacionViaje';
import ItinerarioViaje from '../components/viaje/ItinerarioViaje';
import EditarItemViaje from '../components/viaje/EditarItemViaje';
import { useViaje } from '../context/ViajeContext';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { paquetesTuristicosApi } from '../services/paquetesTuristicosApi';
import { ApiError } from '../services/http';
import type { CotizacionPaqueteResponse, PaqueteTuristico, PaqueteTuristicoItem, PaqueteTuristicoItemRequest, ReservaPaqueteResponse } from '../types/paqueteTuristico';

export default function ViajeDetallePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { usuario } = useAuth();
  const { seleccionarViaje } = useViaje();
  const cargar = useCallback((signal: AbortSignal) => {
    if (!id) throw new ApiError(404, 'El viaje no existe o no pertenece a tu cuenta.');
    return paquetesTuristicosApi.buscar(id, { signal });
  }, [id, usuario?.id]);
  const consulta = useConsultaApi<PaqueteTuristico | null>(cargar, null);
  const viaje = consulta.datos?.id === id && consulta.datos?.turistaId === usuario?.id ? consulta.datos : null;
  const [guardando, setGuardando] = useState(false);
  const ocupado = useRef(false);
  const visita = useRef(0);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cotizacion, setCotizacion] = useState<CotizacionPaqueteResponse | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [resultadoReserva, setResultadoReserva] = useState<ReservaPaqueteResponse | null>(null);
  const [itemEditando, setItemEditando] = useState<PaqueteTuristicoItem | null>(null);
  const [renombrando, setRenombrando] = useState(false);
  const [nombre, setNombre] = useState('');
  useLayoutEffect(() => {
    visita.current++; setError(''); setMensaje(''); setCotizacion(null); setResultadoReserva(null); setItemEditando(null); setConfirmando(false); setRenombrando(false);
    return () => { visita.current++; };
  }, [id, location.key, location.pathname, usuario?.id]);
  useEffect(() => { if (viaje && location.pathname === `/viajes/${id}`) seleccionarViaje(viaje); }, [viaje, seleccionarViaje, location.pathname, id]);
  useEffect(() => { setCotizacion(null); setConfirmando(false); }, [viaje?.version]);

  const modificar = async (operacion: () => Promise<PaqueteTuristico>, exito: string) => {
    if (ocupado.current || !viaje) return;
    ocupado.current = true; setGuardando(true); setError(''); setMensaje('');
    const actual = visita.current;
    try {
      const actualizado = await operacion();
      if (actual !== visita.current) return;
      seleccionarViaje(actualizado); setCotizacion(null); setItemEditando(null); setRenombrando(false);
      setMensaje(exito); await consulta.actualizar();
    } catch (err) {
      if (actual !== visita.current) return;
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el viaje.');
      if (err instanceof ApiError && err.status === 409) { setItemEditando(null); setRenombrando(false); setCotizacion(null); await consulta.actualizar(); }
    }
    finally { ocupado.current = false; setGuardando(false); }
  };
  const guardarNombre = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (viaje && nombre.trim()) void modificar(() => paquetesTuristicosApi.actualizar(viaje.id, { nombre: nombre.trim() }), 'Nombre actualizado.');
  };
  const guardarItem = async (body: PaqueteTuristicoItemRequest) => {
    if (!viaje || !itemEditando) return;
    await modificar(() => paquetesTuristicosApi.actualizarItem(viaje.id, itemEditando.id, body), 'Servicio actualizado. Cotiza de nuevo para conocer el total vigente.');
  };
  const quitar = (item: PaqueteTuristicoItem) => {
    if (!viaje || ocupado.current) return;
    if (!window.confirm(`¿Quitar «${item.ofertaNombre}» de este viaje?${viaje.paqueteComercialId ? ' El precio promocional del paquete puede dejar de aplicar.' : ''}`)) return;
    void modificar(() => paquetesTuristicosApi.eliminarItem(viaje.id, item.id), 'Servicio retirado del viaje.');
  };
  const cotizar = async () => {
    if (ocupado.current || !viaje || !viaje.items.length) return;
    ocupado.current = true; setGuardando(true); setError(''); setMensaje(''); setCotizacion(null);
    const actual = visita.current;
    try { const resultado = await paquetesTuristicosApi.cotizar(viaje.id); if (actual === visita.current) setCotizacion(resultado); }
    catch (err) { if (actual === visita.current) setError(err instanceof Error ? err.message : 'No se pudo cotizar tu viaje.'); }
    finally { ocupado.current = false; setGuardando(false); }
  };
  const reservar = async () => {
    if (ocupado.current || !viaje || !cotizacion?.cotizacionCompleta || cotizacion.paqueteId !== viaje.id) return;
    ocupado.current = true; setGuardando(true); setError(''); setMensaje('');
    const actual = visita.current;
    try {
      const resultado = await paquetesTuristicosApi.reservar(viaje.id);
      if (actual !== visita.current) return;
      setResultadoReserva(resultado); setConfirmando(false); setCotizacion(null);
      await consulta.actualizar();
    } catch (err) {
      if (actual !== visita.current) return;
      setError(err instanceof Error ? err.message : 'No se pudo reservar el viaje. Consulta su estado antes de volver a intentarlo.');
      if (err instanceof ApiError && err.status === 409) { setConfirmando(false); setCotizacion(null); await consulta.actualizar(); }
    }
    finally { ocupado.current = false; setGuardando(false); }
  };
  const cancelar = () => {
    if (!viaje || ocupado.current) return;
    const texto = viaje.estado === 'BORRADOR' ? '¿Cancelar este borrador de viaje?' : '¿Cancelar el viaje y las reservas que admitan cancelación?';
    if (window.confirm(texto)) void modificar(() => paquetesTuristicosApi.cancelar(viaje.id), 'El viaje fue cancelado.');
  };
  const editable = viaje?.estado === 'BORRADOR';
  const contieneCompletadas = viaje?.items.some(item => item.estadoReserva === 'COMPLETADA');

  return <IonPage><BrandHeader title={viaje?.nombre ?? 'Mi viaje'}/><IonContent fullscreen><main className="page-width viaje-page">
    <Link className="resource-inline-link" to="/viajes">← Mis viajes</Link>
    {mensaje && <p className="notice-success" role="status">{mensaje}</p>}{error && <p className="notice-error" role="alert">{error}</p>}
    <EstadoConsulta {...consulta} sinDatos={!viaje} mensajeVacio="El viaje no existe o no pertenece a tu cuenta.">
      {viaje && <>
        <div className="viaje-heading"><div><span className="eyebrow">MI VIAJE A MUTATÁ</span><h1>{viaje.nombre}</h1><EstadoViajeBadge estado={viaje.estadoResumen}/><p>{viaje.totalItems} servicios en tu itinerario.</p></div><IonButton disabled={guardando} fill="outline" onClick={() => void consulta.actualizar()}>Actualizar viaje</IonButton></div>
        {viaje.paqueteComercialId && <section className="viaje-origen"><p>Viaje basado en un paquete comercial. <Link className="resource-inline-link" to={`/paquetes/${encodeURIComponent(viaje.paqueteComercialId)}`}>Ver paquete de origen →</Link></p>{viaje.precioComercialAplicado ? <p>El precio comercial sigue aplicado a este viaje. Modificar servicios, fechas o composición puede hacer que deje de aplicar.</p> : <p>El precio promocional del paquete no está aplicado a esta composición. Consulta el precio vigente antes de reservar.</p>}</section>}
        {resultadoReserva && <section className="gestion-form-panel viaje-reservado" role="status"><h2>¡Tu viaje fue reservado!</h2><p>{resultadoReserva.totalReservas} servicios creados. Cada negocio gestionará su reserva.</p><EstadoViajeBadge estado={resultadoReserva.estadoResumen}/>{resultadoReserva.reservas.map(reserva => <article key={reserva.id} className="viaje-reserva-resultado"><Link to={`/reservas/${encodeURIComponent(reserva.id)}`}>{reserva.negocioNombreComercial}</Link><EstadoReservaBadge estado={reserva.estado}/></article>)}</section>}
        {editable && <div className="viaje-toolbar"><IonButton fill="outline" disabled={guardando} onClick={() => { setNombre(viaje.nombre); setRenombrando(true); }}>Cambiar nombre</IonButton><Link className="resource-inline-link" to="/catalogo">Agregar servicios →</Link></div>}
        {renombrando && editable && <form className="auth-form gestion-form-panel" onSubmit={guardarNombre}><label>Nombre del viaje<input maxLength={150} required disabled={guardando} value={nombre} onChange={event => setNombre(event.target.value)}/></label><div className="form-actions"><IonButton type="submit" disabled={guardando || !nombre.trim()}>Guardar nombre</IonButton><IonButton type="button" fill="clear" disabled={guardando} onClick={() => setRenombrando(false)}>Cancelar</IonButton></div></form>}
        <div className="viaje-layout"><section><h2>Tu itinerario</h2><ItinerarioViaje items={viaje.items} editable={editable} ocupado={guardando} editar={setItemEditando} eliminar={quitar}/></section><aside className="viaje-summary">
          {editable ? <><h2>Tu viaje, a tu medida</h2><p>Cuando termines de elegir los servicios, consulta el total de tu viaje.</p><IonButton expand="block" disabled={guardando || !viaje.items.length} onClick={() => void cotizar()}>{guardando ? 'Procesando…' : 'Cotizar viaje'}</IonButton>{cotizacion && <><TotalesViaje totales={cotizacion.totales}/><IonButton expand="block" disabled={guardando || !cotizacion.cotizacionCompleta} onClick={() => setConfirmando(true)}>Reservar viaje</IonButton></>}</>
            : <>{viaje.totalesReserva && <TotalesViaje totales={viaje.totalesReserva} historico/>}<p className="viaje-note">La composición ya no puede modificarse. Consulta el estado de cada reserva en tu itinerario.</p></>}
          {viaje.estado !== 'CANCELADO' && !contieneCompletadas && <IonButton expand="block" fill="clear" color="medium" disabled={guardando} onClick={cancelar}>Cancelar viaje</IonButton>}
          {contieneCompletadas && <p className="viaje-note">El viaje contiene servicios completados y no admite cancelación completa.</p>}
        </aside></div>
        {cotizacion && <CotizacionViaje cotizacion={cotizacion}/>}
      </>}
    </EstadoConsulta>
  </main>
  {itemEditando && <EditarItemViaje key={itemEditando.id} item={itemEditando} guardando={guardando} error={error} cerrar={() => { if (!guardando) { setItemEditando(null); setError(''); } }} guardar={guardarItem}/>}
  <IonModal isOpen={confirmando && Boolean(cotizacion)} backdropDismiss={!guardando} onDidDismiss={() => setConfirmando(false)}><IonHeader><IonToolbar><IonTitle>Reservar mi viaje</IonTitle><IonButtons slot="end"><IonButton disabled={guardando} onClick={() => setConfirmando(false)}>Cerrar</IonButton></IonButtons></IonToolbar></IonHeader><IonContent className="ion-padding"><div className="cambio-modal-content">{cotizacion && <CotizacionViaje cotizacion={cotizacion}/>}<p>Se crearán reservas individuales. Los negocios deben revisar su estado; no se realiza ningún pago en este paso.</p>{error && <p className="notice-error" role="alert">{error}</p>}<IonButton expand="block" disabled={guardando || !cotizacion?.cotizacionCompleta} onClick={() => void reservar()}>{guardando ? 'Reservando…' : 'Confirmar reservas del viaje'}</IonButton></div></IonContent></IonModal>
  </IonContent></IonPage>;
}
