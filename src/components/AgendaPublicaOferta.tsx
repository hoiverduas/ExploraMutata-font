import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { disponibilidadApi } from '../services/disponibilidadApi';
import { horariosApi } from '../services/horariosApi';
import type { DisponibilidadDiaResponse } from '../types/disponibilidad';
import type { SalidaProgramadaResponse } from '../types/horario';
import type { OfertaNegocioResponse } from '../types/oferta';

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

interface Props {
  oferta: OfertaNegocioResponse;
  personas: number;
  fechaSeleccionada: string;
  onSeleccionarFecha: (fecha: string) => void;
}

export default function AgendaPublicaOferta({ oferta, personas, fechaSeleccionada, onSeleccionarFecha }: Props) {
  const [mes, setMes] = useState(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaSeleccionada)) {
      const [y,m] = fechaSeleccionada.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return inicioMes(new Date());
  });
  const [dias, setDias] = useState<DisponibilidadDiaResponse[]>([]);
  const [salidas, setSalidas] = useState<SalidaProgramadaResponse[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const requiereHorario = Boolean(oferta.categoria !== 'HOSPEDAJE' && oferta.requiereHorario);
  const desde = fechaIso(inicioMes(mes));
  const hasta = fechaIso(finMes(mes));
  const celdas = useMemo(() => construirCeldas(mes), [mes]);
  const hoy = fechaIso(new Date());
  const cantidad = Number.isSafeInteger(personas) && personas > 0 ? personas : 1;

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError(''); setDias([]); setSalidas([]);

    const tareas: Promise<void>[] = [];
    if (oferta.controlaDisponibilidad) {
      tareas.push(disponibilidadApi.consultarPublica(oferta.id, desde, hasta, { signal: controller.signal })
        .then(r => { if (!controller.signal.aborted) setDias(r.dias); }));
    }
    if (requiereHorario) {
      tareas.push(horariosApi.listarPublicos(oferta.id, desde, hasta, { signal: controller.signal })
        .then(r => { if (!controller.signal.aborted) setSalidas(r.salidas); }));
    }

    if (!tareas.length) {
      setCargando(false);
      return () => controller.abort();
    }

    void Promise.all(tareas)
      .catch(err => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No se pudo consultar la agenda.');
      })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });

    return () => controller.abort();
  }, [oferta.id, oferta.controlaDisponibilidad, requiereHorario, desde, hasta]);

  const estadoFecha = (iso: string) => {
    if (iso < hoy) return { disponible: false, texto: 'Pasada', cupos: 0 };

    if (requiereHorario) {
      const delDia = salidas.filter(s => s.fecha === iso && s.estado === 'ABIERTA');
      const disponibles = delDia.filter(s => s.cupoDisponible >= cantidad);
      const cupos = disponibles.reduce((total, s) => total + s.cupoDisponible, 0);
      if (!delDia.length) return { disponible: false, texto: 'Sin horarios', cupos: 0 };
      if (!disponibles.length) return { disponible: false, texto: 'Completo', cupos: 0 };
      return { disponible: true, texto: `${disponibles.length} horario${disponibles.length === 1 ? '' : 's'}`, cupos };
    }

    if (oferta.controlaDisponibilidad) {
      const dia = dias.find(d => d.fecha === iso);
      if (!dia || dia.estado !== 'ABIERTA') return { disponible: false, texto: 'Cerrado', cupos: 0 };
      if (dia.cupoDisponible < cantidad) return { disponible: false, texto: 'Completo', cupos: dia.cupoDisponible };
      return { disponible: true, texto: `${dia.cupoDisponible} cupo${dia.cupoDisponible === 1 ? '' : 's'}`, cupos: dia.cupoDisponible };
    }

    return { disponible: true, texto: 'Consultar', cupos: 0 };
  };

  const puedeMesAnterior = fechaIso(finMes(moverMes(mes, -1))) >= hoy;

  return <section className="public-agenda" aria-label="Agenda de disponibilidad">
    <div className="public-agenda-heading">
      <div>
        <span className="eyebrow">AGENDA DE DISPONIBILIDAD</span>
        <h3>Escoge una fecha disponible</h3>
        <p>Las fechas ocupadas o cerradas no pueden seleccionarse.</p>
      </div>
      <span className="public-agenda-readonly">Solo consulta</span>
    </div>

    <div className="public-agenda-toolbar">
      <IonButton fill="clear" aria-label="Mes anterior" disabled={!puedeMesAnterior} onClick={() => setMes(actual => moverMes(actual, -1))}><IonIcon icon={chevronBackOutline}/></IonButton>
      <strong>{nombresMes[mes.getMonth()]} {mes.getFullYear()}</strong>
      <IonButton fill="clear" aria-label="Mes siguiente" onClick={() => setMes(actual => moverMes(actual, 1))}><IonIcon icon={chevronForwardOutline}/></IonButton>
    </div>

    <div className="public-agenda-legend">
      <span><i className="public-agenda-dot is-available"/>Disponible</span>
      <span><i className="public-agenda-dot is-full"/>Completo / cerrado</span>
      <span><i className="public-agenda-dot is-selected"/>Seleccionado</span>
    </div>

    {cargando ? <div className="loading-state"><IonSpinner/> Consultando disponibilidad…</div> : error ? <div className="notice-error">{error}</div> : <>
      <div className="public-agenda-weekdays">{diasSemana.map(d => <strong key={d}>{d}</strong>)}</div>
      <div className="public-agenda-grid">
        {celdas.map(({ fecha, actual }) => {
          const iso = fechaIso(fecha);
          const estado = estadoFecha(iso);
          const seleccionado = fechaSeleccionada === iso;
          const deshabilitado = !actual || !estado.disponible;
          return <button
            type="button"
            key={iso}
            className={`public-agenda-day ${!actual ? 'is-outside' : ''} ${estado.disponible && actual ? 'is-available' : 'is-full'} ${seleccionado ? 'is-selected' : ''}`}
            disabled={deshabilitado}
            aria-pressed={seleccionado}
            onClick={() => onSeleccionarFecha(iso)}
          >
            <span>{fecha.getDate()}</span>
            {actual && <small>{estado.texto}</small>}
          </button>;
        })}
      </div>
    </>}
    <small className="public-agenda-note">Explora Mutatá vuelve a validar los cupos al momento de reservar.</small>
  </section>;
}
