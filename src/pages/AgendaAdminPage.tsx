import { IonButton, IonContent, IonIcon, IonModal, IonPage, IonSpinner } from '@ionic/react';
import { calendarOutline, chevronBackOutline, chevronForwardOutline, timeOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import { agendaAdminApi } from '../services/agendaAdminApi';
import { negociosApi } from '../services/negociosApi';
import type { AgendaAdminOfertaResponse, AgendaAdminResponse } from '../types/agendaAdmin';
import type { NegocioResponse } from '../types/negocio';

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

export default function AgendaAdminPage() {
  const [mes, setMes] = useState(() => inicioMes(new Date()));
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [negocioId, setNegocioId] = useState('');
  const [ofertas, setOfertas] = useState<AgendaAdminOfertaResponse[]>([]);
  const [ofertaId, setOfertaId] = useState('');
  const [agenda, setAgenda] = useState<AgendaAdminResponse | null>(null);
  const [cargandoNegocios, setCargandoNegocios] = useState(true);
  const [cargandoAgenda, setCargandoAgenda] = useState(false);
  const [error, setError] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);

  const desde = fechaIso(inicioMes(mes));
  const hasta = fechaIso(finMes(mes));
  const celdas = useMemo(() => construirCeldas(mes), [mes]);
  const oferta = ofertas.find(item => String(item.id) === ofertaId) ?? null;

  useEffect(() => {
    let activo = true;
    void (async () => {
      setCargandoNegocios(true); setError('');
      try {
        const primera = await negociosApi.listar(0, 100);
        const todos = [...primera.contenido];
        for (let pagina = 1; pagina < primera.totalPaginas; pagina++) {
          const siguiente = await negociosApi.listar(pagina, 100);
          todos.push(...siguiente.contenido);
        }
        if (!activo) return;
        setNegocios(todos);
        if (todos.length) setNegocioId(todos[0].id);
      } catch (err) {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudieron cargar los negocios.');
      } finally { if (activo) setCargandoNegocios(false); }
    })();
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!negocioId) {
      setOfertas([]); setOfertaId(''); setAgenda(null); return;
    }
    let activo = true;
    setError('');
    void agendaAdminApi.listarOfertas(negocioId)
      .then(datos => {
        if (!activo) return;
        setOfertas(datos);
        setOfertaId(actual => datos.some(o => String(o.id) === actual) ? actual : (datos[0] ? String(datos[0].id) : ''));
      })
      .catch(err => { if (activo) setError(err instanceof Error ? err.message : 'No se pudieron cargar las ofertas del negocio.'); });
    return () => { activo = false; };
  }, [negocioId]);

  const cargarAgenda = async () => {
    if (!negocioId || !oferta) {
      setAgenda(null);
      return;
    }
    setCargandoAgenda(true); setError('');
    try {
      setAgenda(await agendaAdminApi.consultar(negocioId, oferta.id, desde, hasta));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar la agenda.');
      setAgenda(null);
    } finally { setCargandoAgenda(false); }
  };

  useEffect(() => { void cargarAgenda(); }, [negocioId, ofertaId, desde, hasta]);

  const infoDia = (iso: string) => agenda?.dias.find(d => d.fecha === iso);
  const salidasDia = (iso: string) => agenda?.salidas.filter(s => s.fecha === iso) ?? [];
  const reservasDia = (iso: string) => agenda?.reservas.filter(r => r.fechaReserva === iso) ?? [];
  const bloqueosDia = (iso: string) => agenda?.bloqueos.filter(b => b.fecha === iso && b.estado === 'ACTIVO') ?? [];
  const hoy = fechaIso(new Date());

  return <IonPage>
    <BrandHeader title="Agenda de operadores" mostrarGestion={false}/>
    <IonContent fullscreen>
      <main className="page-width gestion-page agenda-page">
        <div className="notice-success">Vista administrativa de solo lectura. Los cupos, horarios y bloqueos solo pueden ser modificados por el operador responsable.</div>

        <div className="gestion-heading">
          <div>
            <span className="eyebrow">ADMINISTRACIÓN · AGENDA</span>
            <h1>Agenda de <em>operadores.</em></h1>
            <p>Consulta reservas, ocupación, horarios, disponibilidad y bloqueos sin modificar la operación del negocio.</p>
          </div>
          <IonButton fill="outline" disabled={cargandoAgenda || !oferta} onClick={() => void cargarAgenda()}>Actualizar agenda</IonButton>
        </div>

        <section className="agenda-filtros gestion-form-panel">
          <div className="negocio-form">
            <label>Negocio
              <select value={negocioId} disabled={cargandoNegocios} onChange={e => setNegocioId(e.target.value)}>
                <option value="">Selecciona un negocio</option>
                {negocios.map(n => <option key={n.id} value={n.id}>{n.nombreComercial}</option>)}
              </select>
            </label>
            <label>Oferta
              <select value={ofertaId} disabled={!negocioId} onChange={e => setOfertaId(e.target.value)}>
                <option value="">Selecciona una oferta</option>
                {ofertas.map(o => <option key={o.id} value={String(o.id)}>{o.nombre} · {o.estado}</option>)}
              </select>
            </label>
          </div>
          {oferta && <div className="agenda-resumen">
            <span><strong>{oferta.requiereHorario ? 'Por horarios' : 'Por fecha'}</strong></span>
            <span>{oferta.controlaDisponibilidad ? 'Control de disponibilidad activo' : 'Sin control de disponibilidad'}</span>
            <span>Modo solo lectura</span>
          </div>}
        </section>

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
            <span><i className="agenda-dot agenda-dot-external"/>Reserva externa / bloqueo</span>
            <span><i className="agenda-dot agenda-dot-completo"/>Completo / cerrado</span>
          </div>

          {cargandoAgenda ? <div className="loading-state"><IonSpinner/> Consultando agenda…</div> : <>
            <div className="agenda-weekdays">{diasSemana.map(d => <strong key={d}>{d}</strong>)}</div>
            <div className="agenda-grid">
              {celdas.map(({ fecha, actual }) => {
                const iso = fechaIso(fecha);
                const dia = infoDia(iso);
                const slots = salidasDia(iso);
                const reservas = reservasDia(iso);
                const bloqueos = bloqueosDia(iso);
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
                  onClick={() => actual && setFechaSeleccionada(iso)}
                  disabled={!oferta || !actual}
                >
                  <span className="agenda-day-number">{fecha.getDate()}</span>
                  {oferta && actual && <>
                    {reservas.length > 0 && <span className="agenda-event agenda-event-reserva"><IonIcon icon={calendarOutline}/>{reservas.length} reserva{reservas.length === 1 ? '' : 's'}</span>}
                    {bloqueos.length > 0 && <span className="agenda-event agenda-event-external">{bloqueos.reduce((t,b)=>t+b.cantidad,0)} cupos externos</span>}
                    {oferta.requiereHorario && slots.slice(0,2).map(slot => <span className="agenda-event agenda-event-slot" key={slot.id}><IonIcon icon={timeOutline}/>{slot.horaInicio.slice(0,5)} · {slot.cupoDisponible} libres</span>)}
                    {!oferta.requiereHorario && dia && <span className={`agenda-event ${cerrado ? 'agenda-event-completo' : 'agenda-event-disponible'}`}>{dia.cupoReservado}/{dia.cupoTotal} ocupados</span>}
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
            <span className="eyebrow">SOLO LECTURA</span>
            <h2>{fechaSeleccionada}</h2>
            {fechaSeleccionada && <>
              {infoDia(fechaSeleccionada) && <div className="agenda-day-stats">
                <span><strong>{infoDia(fechaSeleccionada)?.cupoReservado}</strong> ocupados</span>
                <span><strong>{infoDia(fechaSeleccionada)?.cupoDisponible}</strong> disponibles</span>
              </div>}

              {salidasDia(fechaSeleccionada).length > 0 && <div className="agenda-slots-list">
                {salidasDia(fechaSeleccionada).map(s => <article key={s.id}>
                  <div><strong>{s.nombre || 'Horario'}</strong><span>{s.horaInicio.slice(0,5)}{s.horaFin ? ` – ${s.horaFin.slice(0,5)}` : ''}</span></div>
                  <div><span>{s.cupoReservado} ocupados</span><span>{s.cupoDisponible} disponibles</span></div>
                  <span className="status-pill">{s.estado}</span>
                </article>)}
              </div>}

              {reservasDia(fechaSeleccionada).length > 0 && <section className="agenda-admin-detail">
                <h3>Reservas Explora Mutatá</h3>
                {reservasDia(fechaSeleccionada).map(r => <article key={r.id}>
                  <span>{r.horaInicio ? r.horaInicio.slice(0,5) : 'Sin horario'}</span>
                  <strong>{r.cantidadPersonas} {r.cantidadPersonas === 1 ? 'persona' : 'personas'}</strong>
                  <small>{r.estado}</small>
                </article>)}
              </section>}

              {bloqueosDia(fechaSeleccionada).length > 0 && <section className="agenda-admin-detail">
                <h3>Reservas externas / bloqueos</h3>
                {bloqueosDia(fechaSeleccionada).map(b => <article key={b.id}>
                  <span>{b.horaInicio ? b.horaInicio.slice(0,5) : 'Todo el día'}</span>
                  <strong>{b.cantidad} cupo{b.cantidad === 1 ? '' : 's'}</strong>
                  <small>{b.tipo.replaceAll('_',' ')} · {b.origen.replaceAll('_',' ')}</small>
                </article>)}
              </section>}

              {!infoDia(fechaSeleccionada) && !salidasDia(fechaSeleccionada).length && !reservasDia(fechaSeleccionada).length && !bloqueosDia(fechaSeleccionada).length && <p className="empty-state">No hay actividad registrada para esta fecha.</p>}
            </>}
            <IonButton expand="block" fill="clear" onClick={() => setFechaSeleccionada(null)}>Cerrar</IonButton>
          </div>
        </IonContent>
      </IonModal>
    </IonContent>
  </IonPage>;
}
