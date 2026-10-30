import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ofertasApi } from '../../services/ofertasApi';
import type { OfertaNegocioResponse } from '../../types/oferta';
import { fechaActualReservas } from '../../domain/reservas';
import type { PaqueteTuristicoItem, PaqueteTuristicoItemRequest } from '../../types/paqueteTuristico';

interface Props {
  item: PaqueteTuristicoItem;
  guardando: boolean;
  error: string;
  cerrar(): void;
  guardar(body: PaqueteTuristicoItemRequest): Promise<void>;
}
export default function EditarItemViaje({ item, guardando, error, cerrar, guardar }: Props) {
  const [form, setForm] = useState<PaqueteTuristicoItemRequest>({
    ofertaId: item.ofertaId,
    varianteId: item.varianteId,
    fechaInicio: item.fechaInicio,
    fechaFin: item.fechaFin,
    cantidadPersonas: item.cantidadPersonas,
    cantidadTrayectos: item.cantidadTrayectos,
    franjaId: item.salidaProgramadaId ? null : item.franjaHorariaId,
    salidaId: item.salidaProgramadaId,
    orden: item.orden,
    observaciones: item.observaciones,
  });
  const [oferta, setOferta] = useState<OfertaNegocioResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorOferta, setErrorOferta] = useState('');
  const enviando = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setErrorOferta('');
    void ofertasApi.buscarPublica(item.negocioId, item.ofertaId, { signal: controller.signal }).then(oferta => {
      if (!controller.signal.aborted) setOferta(oferta);
    }).catch(err => {
      if (!controller.signal.aborted) setErrorOferta(err instanceof Error ? err.message : 'No se pudieron consultar los parámetros del servicio.');
    }).finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => { controller.abort(); };
  }, [item.negocioId, item.ofertaId]);
  const requiereFechas = Boolean(oferta?.modeloPrecio.includes('DIA') || oferta?.modeloPrecio.includes('NOCHE') || (oferta && oferta.duracionUnidad !== 'UNICO'));
  const finObligatorio = Boolean(oferta?.modeloPrecio.includes('NOCHE') && oferta.duracionUnidad === 'UNICO');
  const requiereTrayectos = oferta?.categoria === 'TRANSPORTE';
  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enviando.current || guardando || cargando || errorOferta) return;
    enviando.current = true;
    try { await guardar({ ...form, fechaFin: requiereFechas || item.fechaFin ? form.fechaFin : null, cantidadTrayectos: requiereTrayectos ? form.cantidadTrayectos : null, observaciones: form.observaciones?.trim() || null }); }
    finally { enviando.current = false; }
  };
  return <IonModal isOpen backdropDismiss={!guardando} onDidDismiss={cerrar}><IonHeader><IonToolbar><IonTitle>Editar servicio del viaje</IonTitle><IonButtons slot="end"><IonButton disabled={guardando} onClick={cerrar}>Cerrar</IonButton></IonButtons></IonToolbar></IonHeader><IonContent className="ion-padding"><div className="cambio-modal-content"><h2>{item.ofertaNombre}</h2><p>{item.negocioNombreComercial}</p>
    {cargando ? <div className="loading-state"><IonSpinner/> Consultando servicio…</div> : errorOferta ? <p className="notice-error" role="alert">{errorOferta}</p> : <form className="auth-form" onSubmit={event => void enviar(event)}>
      <label>Personas<input type="number" min={1} step={1} required disabled={guardando} value={form.cantidadPersonas} onChange={event => setForm(actual => ({ ...actual, cantidadPersonas: Number(event.target.value) }))}/></label>
      <label>Fecha de inicio<input type="date" required min={fechaActualReservas()} disabled={guardando} value={form.fechaInicio} onChange={event => setForm(actual => ({ ...actual, fechaInicio: event.target.value }))}/></label>
      {(requiereFechas || item.fechaFin) && <label>Fecha de fin{finObligatorio ? ' *' : ' (opcional)'}<input type="date" required={finObligatorio} min={form.fechaInicio} disabled={guardando} value={form.fechaFin ?? ''} onChange={event => setForm(actual => ({ ...actual, fechaFin: event.target.value || null }))}/></label>}
      {requiereTrayectos && <label>Trayectos (opcional)<input type="number" min={1} step={1} disabled={guardando} value={form.cantidadTrayectos ?? ''} onChange={event => setForm(actual => ({ ...actual, cantidadTrayectos: event.target.value ? Number(event.target.value) : null }))}/></label>}
      <label>Orden del servicio<input type="number" min={1} step={1} required disabled={guardando} value={form.orden ?? 1} onChange={event => setForm(actual => ({ ...actual, orden: Number(event.target.value) }))}/></label>
      <label>Observaciones<textarea rows={3} maxLength={1000} disabled={guardando} value={form.observaciones ?? ''} onChange={event => setForm(actual => ({ ...actual, observaciones: event.target.value }))}/></label>
      {item.varianteNombre && <p className="viaje-note">Opción seleccionada: <strong>{item.varianteNombre}</strong>.</p>}
      {(item.franjaHorariaId || item.salidaProgramadaId) && <p className="viaje-note">Se conservará el horario seleccionado. Si cambias la fecha y ya no corresponde con ese horario, la nueva cotización te pedirá ajustar el servicio.</p>}
      <p className="viaje-note">Al cambiar el servicio tendrás que cotizar de nuevo. Revisa disponibilidad, horario, unidades y precio en la nueva cotización.</p>
      {error && <p className="notice-error" role="alert">{error}</p>}
      <div className="form-actions"><IonButton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</IonButton><IonButton type="button" fill="outline" disabled={guardando} onClick={cerrar}>Cancelar</IonButton></div>
    </form>}
  </div></IonContent></IonModal>;
}
