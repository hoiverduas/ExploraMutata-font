import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonPage, IonSpinner, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import BrandHeader from '../components/BrandHeader';
import EstadoReservaBadge from '../components/EstadoReservaBadge';
import ReservaDatos from '../components/ReservaDatos';
import PrecioReserva from '../components/PrecioReserva';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { formatearFechaReserva as fechaVisible, nombresEstadoReserva as nombresEstado } from '../domain/reservas';
import { ApiError } from '../services/http';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import { reservasApi } from '../services/reservasApi';
import { estadosReserva } from '../types/reserva';
import type { NegocioResponse } from '../types/negocio';
import type { EstadoReserva, ReservaOperadorFiltros, ReservaResponse } from '../types/reserva';

type AccionReserva = 'confirmar' | 'rechazar' | 'completar';
const mensajeReserva = (error: unknown, alternativo: string) =>
  error instanceof ApiError && error.status === 404
    ? 'La reserva no existe o no pertenece a tus negocios.'
    : error instanceof Error ? error.message : alternativo;

export default function ReservasOperadorPage() {
  const [estado, setEstado] = useState<EstadoReserva | ''>('');
  const [negocioId, setNegocioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [cargandoNegocios, setCargandoNegocios] = useState(true);
  const [errorNegocios, setErrorNegocios] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<ReservaResponse | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [rechazando, setRechazando] = useState<ReservaResponse | null>(null);
  const [motivo, setMotivo] = useState('');
  const [errorRechazo, setErrorRechazo] = useState('');
  const busy = useRef(false);
  const peticionDetalle = useRef<AbortController | null>(null);
  const detalleActivo = useRef<string | null>(null);
  const revisionNegocios = useRef(0);
  const primeraEntradaNegocios = useRef(true);

  const consultar = useCallback(async (signal: AbortSignal) => {
    const filtros: ReservaOperadorFiltros = {
      ...(estado ? { estado } : {}), ...(negocioId ? { negocioId } : {}), ...(fecha ? { fecha } : {}),
    };
    try { return await reservasApi.listarReservasOperador(filtros, { signal }); }
    catch (err) { throw new Error(mensajeReserva(err, 'No se pudieron cargar las reservas de tus negocios.')); }
  }, [estado, negocioId, fecha]);
  const { datos: reservas, cargando, error, actualizar } = useConsultaApi<ReservaResponse[]>(consultar, []);

  const cargarNegocios = useCallback(async () => {
    const revision = ++revisionNegocios.current;
    setCargandoNegocios(true); setErrorNegocios('');
    try {
      const primeraPagina = await operadorNegociosApi.listar(0, 100);
      if (revision !== revisionNegocios.current) return;
      const disponibles = [...primeraPagina.contenido];
      for (let pagina = 1; pagina < primeraPagina.totalPaginas; pagina++) {
        const siguiente = await operadorNegociosApi.listar(pagina, 100);
        if (revision !== revisionNegocios.current) return;
        disponibles.push(...siguiente.contenido);
      }
      setNegocios([...new Map(disponibles.map(negocio => [negocio.id, negocio])).values()]);
    } catch (err) {
      if (revision === revisionNegocios.current) setErrorNegocios(err instanceof Error ? err.message : 'No se pudo cargar el selector de negocios.');
    } finally { if (revision === revisionNegocios.current) setCargandoNegocios(false); }
  }, []);
  useEffect(() => { void cargarNegocios(); return () => { revisionNegocios.current++; }; }, [cargarNegocios]);
  useIonViewWillEnter(() => {
    if (primeraEntradaNegocios.current) primeraEntradaNegocios.current = false;
    else void cargarNegocios();
  }, [cargarNegocios]);

  const cargarDetalle = useCallback(async (id: string) => {
    peticionDetalle.current?.abort();
    const controller = new AbortController();
    peticionDetalle.current = controller;
    setCargandoDetalle(true); setErrorDetalle(''); setDetalle(null);
    try {
      const resultado = await reservasApi.obtenerReservaOperador(id, { signal: controller.signal });
      if (!controller.signal.aborted && detalleActivo.current === id) setDetalle(resultado);
    } catch (err) {
      if (!controller.signal.aborted && detalleActivo.current === id) setErrorDetalle(mensajeReserva(err, 'No se pudo consultar la reserva.'));
    } finally { if (!controller.signal.aborted && detalleActivo.current === id) setCargandoDetalle(false); }
  }, []);
  useEffect(() => {
    if (detalleId) void cargarDetalle(detalleId);
    return () => { peticionDetalle.current?.abort(); };
  }, [detalleId, cargarDetalle]);
  const abrirDetalle = (reserva: ReservaResponse) => {
    if (busy.current) return;
    detalleActivo.current = reserva.id; setDetalle(null); setErrorDetalle(''); setCargandoDetalle(true); setDetalleId(reserva.id); setErrorAccion('');
  };
  const cerrarDetalle = () => {
    if (busy.current) return;
    peticionDetalle.current?.abort(); detalleActivo.current = null;
    setDetalleId(null); setDetalle(null); setErrorDetalle('');
  };
  const abrirRechazo = (reserva: ReservaResponse) => {
    if (busy.current) return;
    setRechazando(reserva); setMotivo(''); setErrorRechazo(''); setErrorAccion(''); setMensaje('');
  };
  const actuar = async (reserva: ReservaResponse, accion: AccionReserva) => {
    if (busy.current) return;
    if (accion === 'rechazar' && (!motivo.trim() || motivo.trim().length > 1000)) {
      setErrorRechazo('Escribe un motivo de hasta 1000 caracteres.'); return;
    }
    if (accion !== 'rechazar' && !window.confirm(`¿${accion === 'confirmar' ? 'Confirmar' : 'Marcar como completada'} la reserva de ${reserva.turistaNombres} ${reserva.turistaApellidos}?`)) return;
    busy.current = true; setGuardando(true); setErrorAccion(''); setErrorRechazo(''); setMensaje('');
    try {
      if (accion === 'confirmar') await reservasApi.confirmarReserva(reserva.id);
      else if (accion === 'rechazar') await reservasApi.rechazarReserva(reserva.id, { motivo: motivo.trim() });
      else await reservasApi.completarReserva(reserva.id);
      setRechazando(null); setMotivo('');
      setMensaje(accion === 'confirmar' ? 'Reserva confirmada.' : accion === 'rechazar' ? 'Reserva rechazada.' : 'Reserva completada.');
      await Promise.all([actualizar(), detalleActivo.current === reserva.id ? cargarDetalle(reserva.id) : Promise.resolve()]);
    } catch (err) {
      const texto = mensajeReserva(err, 'No se pudo actualizar la reserva.');
      if (err instanceof ApiError && err.status === 409) {
        setRechazando(null); setErrorAccion(texto);
        await Promise.all([actualizar(), detalleActivo.current === reserva.id ? cargarDetalle(reserva.id) : Promise.resolve()]);
      } else if (accion === 'rechazar') setErrorRechazo(texto); else setErrorAccion(texto);
    } finally { busy.current = false; setGuardando(false); }
  };
  const acciones = (reserva: ReservaResponse) => <>
    {reserva.estado === 'PENDIENTE' && <><IonButton size="small" disabled={guardando} onClick={() => void actuar(reserva, 'confirmar')}>Confirmar</IonButton><IonButton size="small" fill="outline" disabled={guardando} onClick={() => abrirRechazo(reserva)}>Rechazar</IonButton></>}
    {reserva.estado === 'CONFIRMADA' && <IonButton size="small" disabled={guardando} onClick={() => void actuar(reserva, 'completar')}>Completar</IonButton>}
  </>;
  const enviarRechazo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (rechazando) void actuar(rechazando, 'rechazar');
  };

  return <IonPage><BrandHeader title="Reservas de mis negocios"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Reservas de <em>mis negocios.</em></h1><p>Consulta las solicitudes de los viajeros y gestiona su confirmación.</p></div><IonButton fill="outline" disabled={cargando || guardando} onClick={() => void actualizar()}>Actualizar reservas</IonButton></div>
    <section className="gestion-form-panel"><div className="reservas-filtros negocio-form">
      <label>Estado<select disabled={guardando} value={estado} onChange={e => setEstado(estadosReserva.find(opcion => opcion === e.target.value) ?? '')}><option value="">Todos</option>{estadosReserva.map(opcion => <option key={opcion} value={opcion}>{nombresEstado[opcion]}</option>)}</select></label>
      <label>Negocio<select disabled={guardando || cargandoNegocios} value={negocioId} onChange={e => setNegocioId(negocios.find(negocio => negocio.id === e.target.value)?.id ?? '')}><option value="">Todos mis negocios</option>{negocios.map(negocio => <option key={negocio.id} value={negocio.id}>{negocio.nombreComercial}</option>)}</select></label>
      <label>Fecha de la reserva<input type="date" disabled={guardando} value={fecha} onChange={e => setFecha(e.target.value)}/></label>
    </div>
      {cargandoNegocios && <p role="status">Cargando tus negocios…</p>}
      {errorNegocios && <div><div className="notice-error" role="alert">{errorNegocios}</div><IonButton fill="clear" disabled={cargandoNegocios || guardando} onClick={() => void cargarNegocios()}>Reintentar negocios</IonButton></div>}
    </section>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}{errorAccion && <div className="notice-error" role="alert">{errorAccion}</div>}
    {cargando ? <div className="loading-state" role="status"><IonSpinner/> Cargando reservas…</div> : error ? <div><div className="notice-error" role="alert">{error}</div><IonButton fill="outline" onClick={() => void actualizar()}>Reintentar reservas</IonButton></div> : <div className="negocios-list">
      {reservas.map(reserva => <article className="negocio-row" key={reserva.id}><div className="negocio-row-main reserva-operador-resumen"><h3>{reserva.experienciaNombre || "Servicio reservado"}</h3><p>{[reserva.destinoNombre, reserva.negocioNombreComercial].filter(Boolean).join(' · ')}</p><p>{fechaVisible(reserva.fechaReserva)} · {reserva.cantidadPersonas} {reserva.cantidadPersonas === 1 ? 'persona' : 'personas'}</p><p>{reserva.turistaNombres} {reserva.turistaApellidos} · {reserva.turistaCorreo}</p><PrecioReserva precioReserva={reserva.precioReserva} monedaReserva={reserva.monedaReserva} totalReserva={reserva.totalReserva}/><p><strong>Observaciones:</strong> {reserva.observaciones || 'Sin observaciones.'}</p>{reserva.paqueteId && <p className="trip-reference">Parte de un viaje turístico</p>}</div><div className="negocio-row-right"><EstadoReservaBadge estado={reserva.estado}/><div className="negocio-row-actions"><IonButton size="small" fill="outline" disabled={guardando} onClick={() => abrirDetalle(reserva)}>Ver detalle</IonButton>{acciones(reserva)}</div></div></article>)}
      {!reservas.length && <p className="empty-state" role="status">No hay reservas para los filtros seleccionados.</p>}
    </div>}
  </main>
  <IonModal isOpen={detalleId !== null} backdropDismiss={!guardando} onDidDismiss={cerrarDetalle}><IonHeader><IonToolbar><IonTitle>Detalle de la reserva</IonTitle><IonButtons slot="end"><IonButton disabled={guardando} onClick={cerrarDetalle}>Cerrar</IonButton></IonButtons></IonToolbar></IonHeader><IonContent className="ion-padding"><div className="cambio-modal-content">
    {cargandoDetalle ? <div className="loading-state" role="status"><IonSpinner/> Consultando reserva…</div> : errorDetalle ? <div><div className="notice-error" role="alert">{errorDetalle}</div><IonButton fill="outline" disabled={guardando} onClick={() => { if (detalleId) void cargarDetalle(detalleId); }}>Reintentar detalle</IonButton></div> : detalle && <>
      <EstadoReservaBadge estado={detalle.estado}/><ReservaDatos reserva={detalle} mostrarCliente/>
      {errorAccion && <div className="notice-error" role="alert">{errorAccion}</div>}
      <div className="cambio-modal-actions">{acciones(detalle)}</div>
    </>}
  </div></IonContent></IonModal>
  <IonModal isOpen={rechazando !== null} backdropDismiss={!guardando} onDidDismiss={() => { if (!busy.current) { setRechazando(null); setMotivo(''); setErrorRechazo(''); } }}><IonHeader><IonToolbar><IonTitle>Rechazar reserva</IonTitle><IonButtons slot="end"><IonButton disabled={guardando} onClick={() => { setRechazando(null); setMotivo(''); setErrorRechazo(''); }}>Cerrar</IonButton></IonButtons></IonToolbar></IonHeader><IonContent className="ion-padding"><div className="cambio-modal-content">
    {rechazando && <p>Reserva de {rechazando.turistaNombres} {rechazando.turistaApellidos} para {rechazando.experienciaNombre || rechazando.negocioNombreComercial}, el {fechaVisible(rechazando.fechaReserva)}.</p>}
    <form onSubmit={enviarRechazo}><label className="cambio-label">Motivo del rechazo *<textarea required maxLength={1000} rows={4} disabled={guardando} value={motivo} onChange={e => setMotivo(e.target.value)}/></label><p>Escribe el motivo, hasta 1000 caracteres.</p>
      {errorRechazo && <div className="notice-error" role="alert">{errorRechazo}</div>}
      <div className="cambio-modal-actions"><IonButton type="button" fill="outline" disabled={guardando} onClick={() => { setRechazando(null); setMotivo(''); setErrorRechazo(''); }}>Cancelar</IonButton><IonButton type="submit" disabled={guardando || !motivo.trim() || motivo.trim().length > 1000}>{guardando ? 'Guardando…' : 'Confirmar rechazo'}</IonButton></div>
    </form>
  </div></IonContent></IonModal>
  </IonContent></IonPage>;
}
