import {
  IonButton, IonContent, IonIcon, IonModal, IonPage, IonSpinner,
} from '@ionic/react';
import {
  addOutline, calendarOutline, chevronBackOutline, chevronForwardOutline, timeOutline,
} from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import { disponibilidadApi } from '../services/disponibilidadApi';
import { horariosApi } from '../services/horariosApi';
import { ofertasApi } from '../services/ofertasApi';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import { reservasApi } from '../services/reservasApi';
import type { DisponibilidadDiaResponse } from '../types/disponibilidad';
import type { SalidaProgramadaResponse } from '../types/horario';
import type { NegocioResponse } from '../types/negocio';
import type { OfertaNegocioResponse } from '../types/oferta';
import type { ReservaResponse } from '../types/reserva';

const nombresMes = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const diasSemana = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const fechaIso = (fecha: Date) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const inicioMes = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), 1);
const finMes = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
const moverMes = (fecha: Date, delta: number) => new Date(fecha.getFullYear(), fecha.getMonth() + delta, 1);

function construirCeldas(fecha: Date) {
  const primero = inicioMes(fecha);
  const ultimo = finMes(fecha);
  const primerDiaLunes = (primero.getDay() + 6) % 7;
  const celdas: Array<{ fecha: Date; actual: boolean }> = [];
  for (let i = primerDiaLunes - 1; i >= 0; i--) {
    const d = new Date(primero);
    d.setDate(primero.getDate() - i - 1);
    celdas.push({ fecha: d, actual: false });
  }
  for (let dia = 1; dia <= ultimo.getDate(); dia++) {
    celdas.push({ fecha: new Date(fecha.getFullYear(), fecha.getMonth(), dia), actual: true });
  }
  let siguiente = 1;
  while (celdas.length % 7 !== 0 || celdas.length < 42) {
    celdas.push({ fecha: new Date(fecha.getFullYear(), fecha.getMonth() + 1, siguiente++), actual: false });
  }
  return celdas;
}

export default function AgendaOperadorPage() {
  const [mes, setMes] = useState(() => inicioMes(new Date()));
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [negocioId, setNegocioId] = useState('');
  const [ofertas, setOfertas] = useState<OfertaNegocioResponse[]>([]);
  const [ofertaId, setOfertaId] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadDiaResponse[]>([]);
  const [salidas, setSalidas] = useState<SalidaProgramadaResponse[]>([]);
  const [reservas, setReservas] = useState<ReservaResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoAgenda, setCargandoAgenda] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [cupoDia, setCupoDia] = useState('0');
  const [estadoDia, setEstadoDia] = useState<'ABIERTA'|'CERRADA'>('ABIERTA');
  const [guardandoDia, setGuardandoDia] = useState(false);
  const [salidaEditando, setSalidaEditando] = useState<SalidaProgramadaResponse | null>(null);
  const [cupoSalida, setCupoSalida] = useState('1');
  const [estadoSalida, setEstadoSalida] = useState<'ABIERTA'|'CERRADA'|'CANCELADA'>('ABIERTA');
  const [horaInicioSalida, setHoraInicioSalida] = useState('');
  const [horaFinSalida, setHoraFinSalida] = useState('');

  const oferta = ofertas.find(item => String(item.id) === ofertaId) ?? null;
  const desde = fechaIso(inicioMes(mes));
  const hasta = fechaIso(finMes(mes));
  const celdas = useMemo(() => construirCeldas(mes), [mes]);

  useEffect(() => {
    let activo = true;
    void (async () => {
      setCargando(true); setError('');
      try {
        const primera = await operadorNegociosApi.listar(0, 100);
        const todos = [...primera.contenido];
        for (let pagina = 1; pagina < primera.totalPaginas; pagina++) {
          const siguiente = await operadorNegociosApi.listar(pagina, 100);
          todos.push(...siguiente.contenido);
        }
        if (!activo) return;
        const unicos = [...new Map(todos.map(n => [n.id, n])).values()];
        setNegocios(unicos);
        if (unicos.length) setNegocioId(actual => actual || unicos[0].id);
      } catch (err) {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudieron cargar tus negocios.');
      } finally { if (activo) setCargando(false); }
    })();
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!negocioId) { setOfertas([]); setOfertaId(''); return; }
    let activo = true;
    setError('');
    void ofertasApi.listarOperador(negocioId)
      .then(datos => {
        if (!activo) return;
        setOfertas(datos);
        setOfertaId(actual => datos.some(o => String(o.id) === actual) ? actual : (datos[0] ? String(datos[0].id) : ''));
      })
      .catch(err => { if (activo) setError(err instanceof Error ? err.message : 'No se pudieron cargar las ofertas.'); });
    return () => { activo = false; };
  }, [negocioId]);

  const cargarAgenda = async () => {
    if (!negocioId || !oferta) {
      setDisponibilidad([]); setSalidas([]); setReservas([]);
      return;
    }
    setCargandoAgenda(true); setError(''); setMensaje('');
    try {
      const [reservasOperador, datosDisponibilidad, datosSalidas] = await Promise.all([
        reservasApi.listarReservasOperador({ negocioId }),
        oferta.requiereHorario
          ? Promise.resolve(null)
          : disponibilidadApi.consultarOperador(negocioId, oferta.id, desde, hasta),
        oferta.requiereHorario
          ? horariosApi.listarSalidas(negocioId, oferta.id, desde, hasta)
          : Promise.resolve([] as SalidaProgramadaResponse[]),
      ]);
      setReservas(reservasOperador.filter(r =>
        r.negocioExperienciaId === oferta.id
        && r.fechaReserva >= desde
        && r.fechaReserva <= hasta
        && !['CANCELADA','RECHAZADA'].includes(r.estado)
      ));
      setDisponibilidad(datosDisponibilidad?.dias ?? []);
      setSalidas(datosSalidas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la agenda.');
    } finally { setCargandoAgenda(false); }
  };

  useEffect(() => { void cargarAgenda(); }, [negocioId, ofertaId, desde, hasta]);

  const infoDia = (iso: string) => disponibilidad.find(d => d.fecha === iso);
  const salidasDia = (iso: string) => salidas.filter(s => s.fecha === iso);
  const reservasDia = (iso: string) => reservas.filter(r => r.fechaReserva === iso);

  const abrirDia = (iso: string) => {
    setFechaSeleccionada(iso);
    const actual = infoDia(iso);
    setCupoDia(String(actual?.cupoTotal ?? oferta?.capacidadMaxima ?? 0));
    setEstadoDia(actual?.estado ?? 'ABIERTA');
    setMensaje('');
    setError('');
  };

  const guardarDia = async () => {
    if (!fechaSeleccionada || !oferta || !negocioId || guardandoDia) return;
    const cupo = Number(cupoDia);
    if (!Number.isSafeInteger(cupo) || cupo < 0) return setError('El cupo debe ser un número entero igual o mayor que cero.');
    setGuardandoDia(true); setError(''); setMensaje('');
    try {
      await disponibilidadApi.configurar(negocioId, oferta.id, {
        fechaInicio: fechaSeleccionada,
        fechaFin: fechaSeleccionada,
        cupoTotal: cupo,
        estado: estadoDia,
      });
      setMensaje('Disponibilidad actualizada.');
      await cargarAgenda();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la disponibilidad.');
    } finally { setGuardandoDia(false); }
  };

  const abrirSalida = (salida: SalidaProgramadaResponse) => {
    setSalidaEditando(salida);
    setCupoSalida(String(salida.cupoTotal));
    setEstadoSalida(salida.estado);
    setHoraInicioSalida(salida.horaInicio);
    setHoraFinSalida(salida.horaFin ?? '');
    setError(''); setMensaje('');
  };

  const guardarSalida = async () => {
    if (!salidaEditando || !oferta || !negocioId) return;
    const cupo = Number(cupoSalida);
    if (!Number.isSafeInteger(cupo) || cupo < 1) return setError('El cupo total debe ser al menos 1.');
    try {
      await horariosApi.actualizarSalida(negocioId, oferta.id, salidaEditando.id!, {
        fecha: salidaEditando.fecha,
        horaInicio: horaInicioSalida,
        horaFin: horaFinSalida || null,
        cupoTotal: cupo,
        nombre: salidaEditando.nombre,
        puntoEncuentro: salidaEditando.puntoEncuentro,
        estado: estadoSalida,
      });
      setSalidaEditando(null);
      setMensaje('Horario actualizado.');
      await cargarAgenda();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el horario.');
    }
  };

  const hoy = fechaIso(new Date());

  return <IonPage>
    <BrandHeader title="Agenda y disponibilidad"/>
    <IonContent fullscreen>
      <main className="page-width gestion-page agenda-page">
        <div className="gestion-heading">
          <div>
            <span className="eyebrow">MI ESPACIO DE OPERADOR</span>
            <h1>Agenda y <em>disponibilidad.</em></h1>
            <p>Visualiza tus reservas, revisa los cupos disponibles y ajusta la capacidad de cada fecha u horario.</p>
          </div>
          <IonButton fill="outline" disabled={cargandoAgenda || !oferta} onClick={() => void cargarAgenda()}>Actualizar agenda</IonButton>
        </div>

        <section className="agenda-filtros gestion-form-panel">
          <div className="negocio-form">
            <label>Negocio
              <select value={negocioId} disabled={cargando} onChange={e => setNegocioId(e.target.value)}>
                <option value="">Selecciona un negocio</option>
                {negocios.map(n => <option key={n.id} value={n.id}>{n.nombreComercial}</option>)}
              </select>
            </label>
            <label>Oferta
              <select value={ofertaId} disabled={!negocioId} onChange={e => setOfertaId(e.target.value)}>
                <option value="">Selecciona una oferta</option>
                {ofertas.map(o => <option key={o.id} value={String(o.id)}>{o.nombre}</option>)}
              </select>
            </label>
          </div>
          {oferta && <div className="agenda-resumen">
            <span><strong>{oferta.requiereHorario ? 'Por horarios' : 'Por fecha'}</strong></span>
            <span>{oferta.controlaDisponibilidad ? 'Control de disponibilidad activo' : 'Disponibilidad sin control configurado'}</span>
          </div>}
        </section>

        {mensaje && <div className="notice-success" role="status">{mensaje}</div>}
        {error && <div className="notice-error" role="alert">{error}</div>}

        <section className="agenda-calendar gestion-form-panel">
          <div className="agenda-calendar-toolbar">
            <IonButton fill="clear" aria-label="Mes anterior" onClick={() => setMes(actual => moverMes(actual, -1))}><IonIcon icon={chevronBackOutline}/></IonButton>
            <div><span className="eyebrow">CALENDARIO</span><h2>{nombresMes[mes.getMonth()]} {mes.getFullYear()}</h2></div>
            <IonButton fill="clear" aria-label="Mes siguiente" onClick={() => setMes(actual => moverMes(actual, 1))}><IonIcon icon={chevronForwardOutline}/></IonButton>
          </div>

          <div className="agenda-legend">
            <span><i className="agenda-dot agenda-dot-disponible"/>Disponible</span>
            <span><i className="agenda-dot agenda-dot-reserva"/>Reserva Explora</span>
            <span><i className="agenda-dot agenda-dot-completo"/>Completo / cerrado</span>
          </div>

          {cargandoAgenda ? <div className="loading-state"><IonSpinner/> Cargando agenda…</div> : <>
            <div className="agenda-weekdays">{diasSemana.map(d => <strong key={d}>{d}</strong>)}</div>
            <div className="agenda-grid">
              {celdas.map(({ fecha, actual }) => {
                const iso = fechaIso(fecha);
                const dia = infoDia(iso);
                const slots = salidasDia(iso);
                const reservasFecha = reservasDia(iso);
                const reservado = oferta?.requiereHorario
                  ? slots.reduce((total, s) => total + s.cupoReservado, 0)
                  : (dia?.cupoReservado ?? 0);
                const disponible = oferta?.requiereHorario
                  ? slots.reduce((total, s) => total + s.cupoDisponible, 0)
                  : (dia?.cupoDisponible ?? 0);
                const cerrado = oferta?.requiereHorario
                  ? slots.length > 0 && slots.every(s => s.estado !== 'ABIERTA' || s.cupoDisponible <= 0)
                  : dia?.estado === 'CERRADA' || (dia != null && dia.cupoDisponible <= 0);
                return <button
                  type="button"
                  key={iso}
                  className={`agenda-day ${actual ? '' : 'agenda-day-outside'} ${iso === hoy ? 'agenda-day-today' : ''}`}
                  onClick={() => abrirDia(iso)}
                  disabled={!oferta || !actual}
                >
                  <span className="agenda-day-number">{fecha.getDate()}</span>
                  {oferta && actual && <>
                    {reservasFecha.length > 0 && <span className="agenda-event agenda-event-reserva"><IonIcon icon={calendarOutline}/>{reservasFecha.length} reserva{reservasFecha.length === 1 ? '' : 's'}</span>}
                    {oferta.requiereHorario && slots.slice(0,2).map(slot => <span className="agenda-event agenda-event-slot" key={slot.id ?? `${slot.fecha}-${slot.horaInicio}`}><IonIcon icon={timeOutline}/>{slot.horaInicio.slice(0,5)} · {slot.cupoDisponible} libres</span>)}
                    {!oferta.requiereHorario && dia && <span className={`agenda-event ${cerrado ? 'agenda-event-completo' : 'agenda-event-disponible'}`}>{reservado}/{dia.cupoTotal} ocupados</span>}
                    {oferta.requiereHorario && slots.length > 2 && <span className="agenda-event-more">+{slots.length - 2} horarios</span>}
                    {oferta.requiereHorario && slots.length > 0 && <span className={`agenda-capacity ${cerrado ? 'is-full' : ''}`}>{disponible} cupos libres</span>}
                  </>}
                </button>;
              })}
            </div>
          </>}
        </section>
      </main>

      <IonModal isOpen={fechaSeleccionada !== null} onDidDismiss={() => setFechaSeleccionada(null)}>
        <IonContent className="ion-padding">
          <div className="cambio-modal-content agenda-day-modal">
            <span className="eyebrow">DISPONIBILIDAD</span>
            <h2>{fechaSeleccionada}</h2>
            {oferta?.requiereHorario ? <>
              <p>Administra cada salida programada. Los cupos ya reservados no pueden eliminarse reduciendo la capacidad.</p>
              <div className="agenda-slots-list">
                {fechaSeleccionada && salidasDia(fechaSeleccionada).map(s => <article key={s.id ?? s.horaInicio}>
                  <div><strong>{s.nombre || 'Horario'}</strong><span>{s.horaInicio.slice(0,5)}{s.horaFin ? ` – ${s.horaFin.slice(0,5)}` : ''}</span></div>
                  <div><span>{s.cupoReservado} reservados</span><span>{s.cupoDisponible} disponibles</span></div>
                  <IonButton size="small" fill="outline" onClick={() => abrirSalida(s)}>Modificar</IonButton>
                </article>)}
                {fechaSeleccionada && salidasDia(fechaSeleccionada).length === 0 && <p className="empty-state">No hay horarios programados para esta fecha.</p>}
              </div>
            </> : <>
              <div className="negocio-form">
                <label>Cupo total
                  <input type="number" min={0} step={1} value={cupoDia} onChange={e => setCupoDia(e.target.value)}/>
                </label>
                <label>Estado
                  <select value={estadoDia} onChange={e => setEstadoDia(e.target.value as 'ABIERTA'|'CERRADA')}>
                    <option value="ABIERTA">Disponible</option>
                    <option value="CERRADA">Cerrado</option>
                  </select>
                </label>
              </div>
              {fechaSeleccionada && infoDia(fechaSeleccionada) && <div className="agenda-day-stats">
                <span><strong>{infoDia(fechaSeleccionada)?.cupoReservado}</strong> reservados</span>
                <span><strong>{infoDia(fechaSeleccionada)?.cupoDisponible}</strong> disponibles</span>
              </div>}
              <p className="cambio-advertencia">No podrás bajar el cupo total por debajo de los cupos que ya están reservados.</p>
              <IonButton expand="block" disabled={guardandoDia} onClick={() => void guardarDia()}>{guardandoDia ? 'Guardando…' : 'Guardar disponibilidad'}</IonButton>
            </>}
            <IonButton expand="block" fill="clear" onClick={() => setFechaSeleccionada(null)}>Cerrar</IonButton>
          </div>
        </IonContent>
      </IonModal>

      <IonModal isOpen={salidaEditando !== null} onDidDismiss={() => setSalidaEditando(null)}>
        <IonContent className="ion-padding">
          <div className="cambio-modal-content">
            <span className="eyebrow">HORARIO</span>
            <h2>Modificar salida</h2>
            <div className="negocio-form">
              <label>Hora inicio<input type="time" value={horaInicioSalida} onChange={e => setHoraInicioSalida(e.target.value)}/></label>
              <label>Hora fin<input type="time" value={horaFinSalida} onChange={e => setHoraFinSalida(e.target.value)}/></label>
              <label>Cupo total<input type="number" min={1} value={cupoSalida} onChange={e => setCupoSalida(e.target.value)}/></label>
              <label>Estado<select value={estadoSalida} onChange={e => setEstadoSalida(e.target.value as 'ABIERTA'|'CERRADA'|'CANCELADA')}>
                <option value="ABIERTA">Disponible</option><option value="CERRADA">Cerrado</option><option value="CANCELADA">Cancelado</option>
              </select></label>
            </div>
            <p className="cambio-advertencia">Si ya existen reservas, el backend protege los cupos ocupados. Reprogramar horarios con clientes debe comunicarse a los afectados.</p>
            <IonButton expand="block" onClick={() => void guardarSalida()}>Guardar horario</IonButton>
            <IonButton expand="block" fill="clear" onClick={() => setSalidaEditando(null)}>Cancelar</IonButton>
          </div>
        </IonContent>
      </IonModal>
    </IonContent>
  </IonPage>;
}
