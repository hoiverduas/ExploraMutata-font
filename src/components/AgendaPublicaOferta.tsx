import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { disponibilidadApi } from '../services/disponibilidadApi';
import { horariosApi } from '../services/horariosApi';
import type { DisponibilidadDiaResponse, UnidadCupo } from '../types/disponibilidad';
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

const formatearCorta = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Por elegir';
  const [y,m,d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(y, m - 1, d));
};

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
  fechaInicioSeleccionada: string;
  fechaFinSeleccionada: string;
  seleccionarRango: boolean;
  onConfirmar: (fechaInicio: string, fechaFin: string) => void;
}

export default function AgendaPublicaOferta({
  oferta,
  personas,
  fechaInicioSeleccionada,
  fechaFinSeleccionada,
  seleccionarRango,
  onConfirmar,
}: Props) {
  const [mes, setMes] = useState(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaInicioSeleccionada)) {
      const [y,m] = fechaInicioSeleccionada.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return inicioMes(new Date());
  });
  const [dias, setDias] = useState<DisponibilidadDiaResponse[]>([]);
  const [unidadCupo, setUnidadCupo] = useState<UnidadCupo | null>(null);
  const [salidas, setSalidas] = useState<SalidaProgramadaResponse[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [inicio, setInicio] = useState(fechaInicioSeleccionada);
  const [fin, setFin] = useState(seleccionarRango ? fechaFinSeleccionada : '');

  const requiereHorario = Boolean(oferta.categoria !== 'HOSPEDAJE' && oferta.requiereHorario);
  const desde = fechaIso(inicioMes(mes));
  const hasta = fechaIso(finMes(mes));
  const celdas = useMemo(() => construirCeldas(mes), [mes]);
  const hoy = fechaIso(new Date());
  const cantidad = Number.isSafeInteger(personas) && personas > 0 ? personas : 1;
  const esHospedaje = oferta.categoria === 'HOSPEDAJE';

  useEffect(() => {
    setInicio(fechaInicioSeleccionada);
    setFin(seleccionarRango ? fechaFinSeleccionada : '');
  }, [fechaInicioSeleccionada, fechaFinSeleccionada, seleccionarRango]);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError('');
    setDias([]);
    setSalidas([]);
    setUnidadCupo(null);

    const tareas: Promise<void>[] = [];

    if (oferta.controlaDisponibilidad) {
      tareas.push(
        disponibilidadApi.consultarPublica(oferta.id, desde, hasta, { signal: controller.signal })
          .then(r => {
            if (!controller.signal.aborted) {
              setDias(r.dias);
              setUnidadCupo(r.unidadCupo);
            }
          }),
      );
    }

    if (requiereHorario) {
      tareas.push(
        horariosApi.listarPublicos(oferta.id, desde, hasta, { signal: controller.signal })
          .then(r => {
            if (!controller.signal.aborted) setSalidas(r.salidas);
          }),
      );
    }

    if (!tareas.length) {
      setCargando(false);
      return () => controller.abort();
    }

    void Promise.all(tareas)
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'No se pudo consultar la agenda.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });

    return () => controller.abort();
  }, [oferta.id, oferta.controlaDisponibilidad, requiereHorario, desde, hasta]);

  const estadoFecha = (iso: string) => {
    if (iso < hoy) return { disponible: false, texto: 'Pasada' };

    if (requiereHorario) {
      const delDia = salidas.filter(s => s.fecha === iso && s.estado === 'ABIERTA');
      const disponibles = delDia.filter(s => s.cupoDisponible >= cantidad);
      if (!delDia.length) return { disponible: false, texto: 'Sin horarios' };
      if (!disponibles.length) return { disponible: false, texto: 'Completo' };
      return { disponible: true, texto: `${disponibles.length} horario${disponibles.length === 1 ? '' : 's'}` };
    }

    if (oferta.controlaDisponibilidad) {
      const dia = dias.find(d => d.fecha === iso);
      if (!dia || dia.estado !== 'ABIERTA') return { disponible: false, texto: 'Cerrado' };

      const demandaDirecta = unidadCupo === 'PERSONA';
      if (demandaDirecta && dia.cupoDisponible < cantidad) return { disponible: false, texto: 'Completo' };
      if (dia.cupoDisponible <= 0) return { disponible: false, texto: 'Completo' };

      const etiqueta = unidadCupo === 'UNIDAD'
        ? `${dia.cupoDisponible} unidad${dia.cupoDisponible === 1 ? '' : 'es'}`
        : `${dia.cupoDisponible} cupo${dia.cupoDisponible === 1 ? '' : 's'}`;

      return { disponible: true, texto: etiqueta };
    }

    return { disponible: true, texto: 'Consultar' };
  };

  const seleccionar = (iso: string) => {
    if (!seleccionarRango) {
      setInicio(iso);
      setFin('');
      return;
    }

    if (!inicio || fin || iso <= inicio) {
      setInicio(iso);
      setFin('');
      return;
    }

    setFin(iso);
  };

  const puedeConfirmar = Boolean(inicio) && (!seleccionarRango || Boolean(fin));
  const puedeMesAnterior = fechaIso(finMes(moverMes(mes, -1))) >= hoy;
  const tituloInicio = esHospedaje ? 'Entrada' : 'Inicio';
  const tituloFin = esHospedaje ? 'Salida' : 'Fin';

  return <section className="public-agenda" aria-label="Agenda de disponibilidad">
    <div className="public-agenda-heading">
      <div>
        <span className="eyebrow">AGENDA DE DISPONIBILIDAD</span>
        <h3>{seleccionarRango ? 'Escoge tus fechas' : 'Escoge una fecha disponible'}</h3>
        <p>{seleccionarRango
          ? `Selecciona primero ${tituloInicio.toLowerCase()} y luego ${tituloFin.toLowerCase()}.`
          : 'Las fechas ocupadas o cerradas no pueden seleccionarse.'}</p>
      </div>
      <span className="public-agenda-readonly">Solo consulta</span>
    </div>

    {seleccionarRango && <div className="public-agenda-range-summary">
      <div className={inicio ? 'is-filled' : ''}>
        <small>{tituloInicio}</small>
        <strong>{formatearCorta(inicio)}</strong>
      </div>
      <span>→</span>
      <div className={fin ? 'is-filled' : ''}>
        <small>{tituloFin}</small>
        <strong>{formatearCorta(fin)}</strong>
      </div>
    </div>}

    <div className="public-agenda-toolbar">
      <IonButton fill="clear" aria-label="Mes anterior" disabled={!puedeMesAnterior} onClick={() => setMes(actual => moverMes(actual, -1))}>
        <IonIcon icon={chevronBackOutline}/>
      </IonButton>
      <strong>{nombresMes[mes.getMonth()]} {mes.getFullYear()}</strong>
      <IonButton fill="clear" aria-label="Mes siguiente" onClick={() => setMes(actual => moverMes(actual, 1))}>
        <IonIcon icon={chevronForwardOutline}/>
      </IonButton>
    </div>

    <div className="public-agenda-legend">
      <span><i className="public-agenda-dot is-available"/>Disponible</span>
      <span><i className="public-agenda-dot is-full"/>Completo / cerrado</span>
      <span><i className="public-agenda-dot is-selected"/>Seleccionado</span>
      {seleccionarRango && <span><i className="public-agenda-dot is-range"/>Rango</span>}
    </div>

    {cargando
      ? <div className="loading-state"><IonSpinner/> Consultando disponibilidad…</div>
      : error
        ? <div className="notice-error">{error}</div>
        : <>
          <div className="public-agenda-weekdays">{diasSemana.map(d => <strong key={d}>{d}</strong>)}</div>
          <div className="public-agenda-grid">
            {celdas.map(({ fecha, actual }) => {
              const iso = fechaIso(fecha);
              const estado = estadoFecha(iso);
              const esInicio = inicio === iso;
              const esFin = fin === iso;
              const dentroRango = Boolean(inicio && fin && iso > inicio && iso < fin);
              const seleccionado = esInicio || esFin;
              const deshabilitado = !actual || !estado.disponible;

              return <button
                type="button"
                key={iso}
                className={`public-agenda-day ${!actual ? 'is-outside' : ''} ${estado.disponible && actual ? 'is-available' : 'is-full'} ${seleccionado ? 'is-selected' : ''} ${dentroRango ? 'is-in-range' : ''}`}
                disabled={deshabilitado}
                aria-pressed={seleccionado}
                onClick={() => seleccionar(iso)}
              >
                <span>{fecha.getDate()}</span>
                {actual && <small>{esInicio ? tituloInicio : esFin ? tituloFin : estado.texto}</small>}
              </button>;
            })}
          </div>
        </>}

    <div className="public-agenda-actions">
      {seleccionarRango && inicio && !fin && <small>Ahora selecciona la fecha de {tituloFin.toLowerCase()}.</small>}
      <IonButton
        expand="block"
        disabled={!puedeConfirmar}
        onClick={() => onConfirmar(inicio, seleccionarRango ? fin : '')}
      >
        {seleccionarRango ? 'Usar estas fechas' : 'Usar esta fecha'}
      </IonButton>
    </div>

    <small className="public-agenda-note">Explora Mutatá vuelve a validar disponibilidad y cupos al momento de cotizar y reservar.</small>
  </section>;
}
