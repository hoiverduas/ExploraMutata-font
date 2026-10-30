import { IonButton, IonSpinner } from '@ionic/react';
import { useState } from 'react';
import { fechaActualReservas, formatearFechaReserva } from '../domain/reservas';
import { disponibilidadApi } from '../services/disponibilidadApi';
import { horariosApi } from '../services/horariosApi';
import { hospedajeBookingApi } from '../services/hospedajeBookingApi';
import { tiposInventario } from '../types/oferta';
import type { EstadoDisponibilidad } from '../types/disponibilidad';
import type { FranjaHorariaResponse, SalidaProgramadaResponse } from '../types/horario';
import type { OfertaNegocioResponse, TipoInventario } from '../types/oferta';

const diasSemana = [
  { id: 1, nombre: 'Lunes' }, { id: 2, nombre: 'Martes' }, { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' }, { id: 5, nombre: 'Viernes' }, { id: 6, nombre: 'Sábado' }, { id: 7, nombre: 'Domingo' },
];
const sumarDias = (fecha: string, dias: number) => {
  const d = new Date(`${fecha}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0, 10);
};
const textoInventario = (valor: string) => valor.replaceAll('_', ' ').toLocaleLowerCase('es');

export default function GestionAgendaOferta({ negocioId, oferta }: { negocioId: string; oferta: OfertaNegocioResponse }) {
  const hoy = fechaActualReservas();
  const finVentana = sumarDias(hoy, 30);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [franjas, setFranjas] = useState<FranjaHorariaResponse[]>([]);
  const [salidas, setSalidas] = useState<SalidaProgramadaResponse[]>([]);
  const [controla, setControla] = useState(Boolean(oferta.controlaDisponibilidad));
  const [tipoInventario, setTipoInventario] = useState<TipoInventario>(oferta.tipoInventario ?? 'CUPO');
  const [capacidadInventario, setCapacidadInventario] = useState(oferta.capacidadPorInventario == null ? '' : String(oferta.capacidadPorInventario));
  const [requiereHorario, setRequiereHorario] = useState(Boolean(oferta.requiereHorario));
  const [rango, setRango] = useState({ fechaInicio: hoy, fechaFin: finVentana, cupoTotal: '10', estado: 'ABIERTA' as EstadoDisponibilidad });
  const [calendario, setCalendario] = useState({ fechaInicio: hoy, fechaFin: finVentana, cantidadUnidades: '1', estado: 'ABIERTA' as EstadoDisponibilidad });
  const [franja, setFranja] = useState({ diaSemana: '6', horaInicio: '08:00', horaFin: '', cupoTotal: '10', nombre: '', puntoEncuentro: '' });
  const [salida, setSalida] = useState({ fecha: hoy, horaInicio: '08:00', horaFin: '', cupoTotal: '10', nombre: '', puntoEncuentro: '' });

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const [franjasDatos, salidasDatos] = await Promise.all([
        horariosApi.listarFranjas(negocioId, oferta.id),
        horariosApi.listarSalidas(negocioId, oferta.id, hoy, finVentana),
      ]);
      setFranjas(franjasDatos); setSalidas(salidasDatos);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo consultar la agenda de la oferta.'); }
    finally { setCargando(false); }
  };

  const abrir = () => {
    const siguiente = !abierto; setAbierto(siguiente); setMensaje(''); setError('');
    if (siguiente) void cargar();
  };

  const ejecutar = async (accion: () => Promise<unknown>, mensajeExito: string) => {
    if (guardando) return;
    setGuardando(true); setError(''); setMensaje('');
    try { await accion(); setMensaje(mensajeExito); await cargar(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar la configuración.'); }
    finally { setGuardando(false); }
  };

  const guardarControl = () => {
    const capacidad = capacidadInventario.trim() ? Number(capacidadInventario) : null;
    if (capacidad !== null && (!Number.isSafeInteger(capacidad) || capacidad < 1)) return setError('La capacidad por inventario debe ser un entero mayor o igual a uno.');
    void ejecutar(() => disponibilidadApi.configurarControl(negocioId, oferta.id, {
      controlaDisponibilidad: controla,
      tipoInventario: controla ? tipoInventario : null,
      capacidadPorInventario: controla ? capacidad : null,
    }), 'Control de disponibilidad actualizado.');
  };

  const guardarDisponibilidad = () => {
    const cupo = Number(rango.cupoTotal);
    if (rango.fechaFin < rango.fechaInicio || !Number.isSafeInteger(cupo) || cupo < 0) return setError('Revisa el rango y el cupo total.');
    void ejecutar(() => disponibilidadApi.configurar(negocioId, oferta.id, { ...rango, cupoTotal: cupo }), 'Disponibilidad actualizada.');
  };

  const guardarCalendario = () => {
    const unidades = Number(calendario.cantidadUnidades);
    if (calendario.fechaFin < calendario.fechaInicio || !Number.isSafeInteger(unidades) || unidades < 0) return setError('Revisa el rango y la cantidad de unidades.');
    void ejecutar(() => hospedajeBookingApi.configurarCalendario(negocioId, oferta.id, { ...calendario, cantidadUnidades: unidades }), 'Calendario de alojamiento actualizado.');
  };

  const guardarRequiereHorario = () => void ejecutar(
    () => horariosApi.configurar(negocioId, oferta.id, requiereHorario),
    'Configuración de horarios actualizada.',
  );

  const crearFranja = () => {
    const diaSemana = Number(franja.diaSemana); const cupoTotal = Number(franja.cupoTotal);
    if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7 || !Number.isSafeInteger(cupoTotal) || cupoTotal < 1) return setError('Revisa el día y el cupo de la franja.');
    void ejecutar(() => horariosApi.crearFranja(negocioId, oferta.id, {
      diaSemana, horaInicio: franja.horaInicio, horaFin: franja.horaFin || null, cupoTotal,
      nombre: franja.nombre.trim() || null, puntoEncuentro: franja.puntoEncuentro.trim() || null, estado: 'ACTIVA',
    }), 'Franja recurrente creada.');
  };

  const cambiarFranja = (item: FranjaHorariaResponse) => void ejecutar(
    () => horariosApi.actualizarFranja(negocioId, oferta.id, item.id, {
      diaSemana: item.diaSemana, horaInicio: item.horaInicio, horaFin: item.horaFin, cupoTotal: item.cupoTotal,
      nombre: item.nombre, puntoEncuentro: item.puntoEncuentro, estado: item.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA',
    }),
    item.estado === 'ACTIVA' ? 'Franja desactivada.' : 'Franja activada.',
  );

  const crearSalida = () => {
    const cupoTotal = Number(salida.cupoTotal);
    if (!Number.isSafeInteger(cupoTotal) || cupoTotal < 1 || salida.fecha < hoy) return setError('Revisa la fecha y el cupo de la salida.');
    void ejecutar(() => horariosApi.crearSalida(negocioId, oferta.id, {
      fecha: salida.fecha, horaInicio: salida.horaInicio, horaFin: salida.horaFin || null, cupoTotal,
      nombre: salida.nombre.trim() || null, puntoEncuentro: salida.puntoEncuentro.trim() || null, estado: 'ABIERTA',
    }), 'Salida especial creada.');
  };

  const cerrarSalida = (item: SalidaProgramadaResponse) => {
    if (!item.id || item.origen !== 'ESPECIAL') return;
    void ejecutar(() => horariosApi.actualizarSalida(negocioId, oferta.id, item.id!, {
      fecha: item.fecha, horaInicio: item.horaInicio, horaFin: item.horaFin, cupoTotal: item.cupoTotal,
      nombre: item.nombre, puntoEncuentro: item.puntoEncuentro, estado: item.estado === 'ABIERTA' ? 'CERRADA' : 'ABIERTA',
    }), item.estado === 'ABIERTA' ? 'Salida cerrada.' : 'Salida abierta.');
  };

  return <div className="agenda-oferta">
    <IonButton size="small" fill="outline" disabled={guardando} onClick={abrir}>{abierto ? 'Ocultar disponibilidad y horarios' : 'Disponibilidad y horarios'}</IonButton>
    {abierto && <section className="gestion-form-panel">
      <h3>Disponibilidad y horarios</h3>
      {cargando ? <div className="loading-state"><IonSpinner/> Consultando configuración…</div> : <>
        {mensaje && <div className="notice-success" role="status">{mensaje}</div>}
        {error && <div className="notice-error" role="alert">{error}</div>}

        <div className="negocio-form">
          <label><input type="checkbox" checked={controla} onChange={e => setControla(e.target.checked)}/> Controlar disponibilidad</label>
          {controla && <><label>Inventario<select value={tipoInventario} onChange={e => setTipoInventario((tiposInventario.find(v => v === e.target.value) ?? 'CUPO'))}>{tiposInventario.map(tipo => <option key={tipo} value={tipo}>{textoInventario(tipo)}</option>)}</select></label>
          <label>Capacidad por inventario<input type="number" min={1} step={1} value={capacidadInventario} onChange={e => setCapacidadInventario(e.target.value)}/></label></>}
          <div className="form-actions"><IonButton size="small" disabled={guardando} onClick={guardarControl}>Guardar control</IonButton></div>
        </div>

        {oferta.categoria === 'HOSPEDAJE' ? <div className="negocio-form">
          <h4>Calendario de alojamiento</h4>
          <label>Desde<input type="date" min={hoy} value={calendario.fechaInicio} onChange={e => setCalendario(v => ({ ...v, fechaInicio: e.target.value }))}/></label>
          <label>Hasta<input type="date" min={calendario.fechaInicio} value={calendario.fechaFin} onChange={e => setCalendario(v => ({ ...v, fechaFin: e.target.value }))}/></label>
          <label>Unidades<input type="number" min={0} step={1} value={calendario.cantidadUnidades} onChange={e => setCalendario(v => ({ ...v, cantidadUnidades: e.target.value }))}/></label>
          <label>Estado<select value={calendario.estado} onChange={e => setCalendario(v => ({ ...v, estado: e.target.value as EstadoDisponibilidad }))}><option value="ABIERTA">Abierta</option><option value="CERRADA">Cerrada</option></select></label>
          <div className="form-actions"><IonButton size="small" disabled={guardando} onClick={guardarCalendario}>Guardar calendario</IonButton></div>
        </div> : controla && <div className="negocio-form">
          <h4>Cupos por rango de fechas</h4>
          <label>Desde<input type="date" min={hoy} value={rango.fechaInicio} onChange={e => setRango(v => ({ ...v, fechaInicio: e.target.value }))}/></label>
          <label>Hasta<input type="date" min={rango.fechaInicio} value={rango.fechaFin} onChange={e => setRango(v => ({ ...v, fechaFin: e.target.value }))}/></label>
          <label>Cupo total<input type="number" min={0} step={1} value={rango.cupoTotal} onChange={e => setRango(v => ({ ...v, cupoTotal: e.target.value }))}/></label>
          <label>Estado<select value={rango.estado} onChange={e => setRango(v => ({ ...v, estado: e.target.value as EstadoDisponibilidad }))}><option value="ABIERTA">Abierta</option><option value="CERRADA">Cerrada</option></select></label>
          <div className="form-actions"><IonButton size="small" disabled={guardando} onClick={guardarDisponibilidad}>Guardar disponibilidad</IonButton></div>
        </div>}

        <div className="negocio-form">
          <label><input type="checkbox" checked={requiereHorario} onChange={e => setRequiereHorario(e.target.checked)}/> Requiere seleccionar horario</label>
          <div className="form-actions"><IonButton size="small" disabled={guardando} onClick={guardarRequiereHorario}>Guardar uso de horarios</IonButton></div>
        </div>

        {requiereHorario && <>
          <div className="negocio-form">
            <h4>Nueva franja recurrente</h4>
            <label>Día<select value={franja.diaSemana} onChange={e => setFranja(v => ({ ...v, diaSemana: e.target.value }))}>{diasSemana.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></label>
            <label>Inicio<input type="time" value={franja.horaInicio} onChange={e => setFranja(v => ({ ...v, horaInicio: e.target.value }))}/></label>
            <label>Fin<input type="time" value={franja.horaFin} onChange={e => setFranja(v => ({ ...v, horaFin: e.target.value }))}/></label>
            <label>Cupo<input type="number" min={1} step={1} value={franja.cupoTotal} onChange={e => setFranja(v => ({ ...v, cupoTotal: e.target.value }))}/></label>
            <label>Nombre<input maxLength={150} value={franja.nombre} onChange={e => setFranja(v => ({ ...v, nombre: e.target.value }))}/></label>
            <label>Punto de encuentro<input maxLength={255} value={franja.puntoEncuentro} onChange={e => setFranja(v => ({ ...v, puntoEncuentro: e.target.value }))}/></label>
            <div className="form-actions"><IonButton size="small" disabled={guardando} onClick={crearFranja}>Crear franja</IonButton></div>
          </div>
          {franjas.length > 0 && <div className="negocios-list">{franjas.map(item => <article className="negocio-row" key={item.id}><div><strong>{diasSemana.find(d => d.id === item.diaSemana)?.nombre} · {item.horaInicio}{item.horaFin ? ` – ${item.horaFin}` : ''}</strong><p>{item.nombre || 'Franja recurrente'} · {item.cupoTotal} cupo(s){item.puntoEncuentro ? ` · ${item.puntoEncuentro}` : ''}</p></div><IonButton size="small" fill="outline" disabled={guardando} onClick={() => cambiarFranja(item)}>{item.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'}</IonButton></article>)}</div>}

          <div className="negocio-form">
            <h4>Nueva salida especial</h4>
            <label>Fecha<input type="date" min={hoy} value={salida.fecha} onChange={e => setSalida(v => ({ ...v, fecha: e.target.value }))}/></label>
            <label>Inicio<input type="time" value={salida.horaInicio} onChange={e => setSalida(v => ({ ...v, horaInicio: e.target.value }))}/></label>
            <label>Fin<input type="time" value={salida.horaFin} onChange={e => setSalida(v => ({ ...v, horaFin: e.target.value }))}/></label>
            <label>Cupo<input type="number" min={1} step={1} value={salida.cupoTotal} onChange={e => setSalida(v => ({ ...v, cupoTotal: e.target.value }))}/></label>
            <label>Nombre<input maxLength={150} value={salida.nombre} onChange={e => setSalida(v => ({ ...v, nombre: e.target.value }))}/></label>
            <label>Punto de encuentro<input maxLength={255} value={salida.puntoEncuentro} onChange={e => setSalida(v => ({ ...v, puntoEncuentro: e.target.value }))}/></label>
            <div className="form-actions"><IonButton size="small" disabled={guardando} onClick={crearSalida}>Crear salida</IonButton></div>
          </div>
          {salidas.length > 0 && <div className="negocios-list">{salidas.map(item => <article className="negocio-row" key={item.id ?? `${item.fecha}-${item.horaInicio}`}><div><strong>{formatearFechaReserva(item.fecha)} · {item.horaInicio}{item.horaFin ? ` – ${item.horaFin}` : ''}</strong><p>{item.nombre || 'Salida'} · {item.cupoDisponible}/{item.cupoTotal} cupo(s) · {item.origen === 'ESPECIAL' ? 'Especial' : 'Recurrente'} · {item.estado.toLocaleLowerCase('es')}</p></div>{item.id && item.origen === 'ESPECIAL' && <IonButton size="small" fill="outline" disabled={guardando} onClick={() => cerrarSalida(item)}>{item.estado === 'ABIERTA' ? 'Cerrar' : 'Abrir'}</IonButton>}</article>)}</div>}
        </>}
      </>}
    </section>}
  </div>;
}
