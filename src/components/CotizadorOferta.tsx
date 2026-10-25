import { IonButton } from '@ionic/react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useMoneda } from '../context/MonedaContext';
import { useViaje } from '../context/ViajeContext';
import { formatearPrecio } from '../domain/precios';
import { esFechaReservaValida, fechaActualReservas, formatearFechaReserva } from '../domain/reservas';
import { cotizacionApi } from '../services/cotizacionApi';
import { ApiError } from '../services/http';
import { reservasApi } from '../services/reservasApi';
import type { CotizacionOfertaRequest, CotizacionOfertaResponse } from '../types/cotizacion';
import type { Moneda } from '../types/moneda';
import type { OfertaNegocioResponse } from '../types/oferta';
import SelectorMoneda from './SelectorMoneda';

interface FormularioCotizacion {
  cantidadPersonas: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadTrayectos: string;
}
interface CotizacionVigente {
  respuesta: CotizacionOfertaResponse;
  parametros: CotizacionOfertaRequest;
  revision: number;
}
const camposMoneda: Record<Moneda, 'cop' | 'usd' | 'eur'> = { COP: 'cop', USD: 'usd', EUR: 'eur' };

function ResumenCotizacion({ cotizacion }: { cotizacion: CotizacionOfertaResponse }) {
  const { moneda } = useMoneda();
  const convertido = cotizacion.totalConvertido?.conversionDisponible ? cotizacion.totalConvertido[camposMoneda[moneda]] : null;
  const convertir = moneda !== cotizacion.moneda && convertido != null;
  const total = convertir ? convertido : cotizacion.total;
  return <div className="quote-summary" aria-live="polite"><h3>Tu cotización</h3><dl className="marketplace-facts">
    <div><dt>Personas</dt><dd>{cotizacion.cantidadPersonas}</dd></div><div><dt>Inicio</dt><dd>{formatearFechaReserva(cotizacion.fechaInicio)}</dd></div>
    {cotizacion.fechaFin && <div><dt>Fin</dt><dd>{formatearFechaReserva(cotizacion.fechaFin)}</dd></div>}
    {cotizacion.cantidadDias !== null && <div><dt>Días</dt><dd>{cotizacion.cantidadDias}</dd></div>}
    {cotizacion.cantidadNoches !== null && <div><dt>Noches</dt><dd>{cotizacion.cantidadNoches}</dd></div>}
    {cotizacion.cantidadUnidades !== null && <div><dt>Unidades cotizadas</dt><dd>{cotizacion.cantidadUnidades}</dd></div>}
    {cotizacion.cantidadTrayectos !== null && <div><dt>Trayectos</dt><dd>{cotizacion.cantidadTrayectos}</dd></div>}
  </dl><p>{cotizacion.detalle}</p>
    <p className="quote-price"><span>Total cotizado</span><strong>{total === null ? 'Precio por consultar' : formatearPrecio(total, convertir ? moneda : cotizacion.moneda)}</strong></p>
    {convertir && cotizacion.total !== null && <p>Referencia original: {formatearPrecio(cotizacion.total, cotizacion.moneda)}.{cotizacion.totalConvertido?.fechaTasa && ` Tasa del ${cotizacion.totalConvertido.fechaTasa}.`}</p>}
    {!convertir && moneda !== cotizacion.moneda && cotizacion.total !== null && <p>Conversión a {moneda} no disponible. Se conserva el total original en {cotizacion.moneda}.</p>}
  </div>;
}

export default function CotizadorOferta({ oferta }: { oferta: OfertaNegocioResponse }) {
  const { usuario, tieneRol } = useAuth();
  const { agregarOferta, guardando: guardandoViaje } = useViaje();
  const location = useLocation();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState<FormularioCotizacion>({ cantidadPersonas: '1', fechaInicio: '', fechaFin: '', cantidadTrayectos: '' });
  const [observaciones, setObservaciones] = useState('');
  const [cotizada, setCotizada] = useState<CotizacionVigente | null>(null);
  const [cotizando, setCotizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const revision = useRef(0);
  const consulta = useRef<AbortController | null>(null);
  const contexto = useRef<object | null>(null);
  const mutando = useRef(false);
  const usaNoches = ['POR_NOCHE', 'POR_PERSONA_Y_NOCHE', 'POR_UNIDAD_Y_NOCHE'].includes(oferta.modeloPrecio);
  const mostrarFin = usaNoches || ['POR_DIA', 'POR_PERSONA_Y_DIA'].includes(oferta.modeloPrecio) || oferta.duracionUnidad !== 'UNICO';
  const mostrarTrayectos = oferta.categoria === 'TRANSPORTE';

  useLayoutEffect(() => {
    contexto.current = {};
    revision.current++;
    consulta.current?.abort(); setCotizada(null); setCotizando(false); setError('');
    return () => { contexto.current = null; revision.current++; consulta.current?.abort(); };
  }, [location.pathname, location.key, oferta.id, oferta.version, usuario?.id]);

  const cambiar = (campo: keyof FormularioCotizacion, valor: string) => {
    if (mutando.current) return;
    revision.current++; consulta.current?.abort(); setCotizada(null); setCotizando(false); setError('');
    setFormulario(actual => ({ ...actual, [campo]: valor }));
  };
  const cotizar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (cotizando || mutando.current || (consulta.current && !consulta.current.signal.aborted)) return;
    setError('');
    const cantidadPersonas = Number(formulario.cantidadPersonas);
    const cantidadTrayectos = mostrarTrayectos && formulario.cantidadTrayectos.trim() ? Number(formulario.cantidadTrayectos) : null;
    const fechaFin = mostrarFin && formulario.fechaFin ? formulario.fechaFin : null;
    if (!Number.isSafeInteger(cantidadPersonas) || cantidadPersonas < 1) { setError('Indica una cantidad entera de al menos una persona.'); return; }
    if (!esFechaReservaValida(formulario.fechaInicio) || formulario.fechaInicio < fechaActualReservas()) { setError('Selecciona una fecha de inicio de hoy o posterior.'); return; }
    if (fechaFin && (!esFechaReservaValida(fechaFin) || fechaFin < formulario.fechaInicio || (usaNoches && fechaFin === formulario.fechaInicio))) { setError('Revisa la fecha de fin; para alojamiento por noche debe ser posterior al inicio.'); return; }
    if (usaNoches && oferta.duracionUnidad === 'UNICO' && !fechaFin) { setError('Selecciona una fecha de salida para cotizar las noches.'); return; }
    if (cantidadTrayectos !== null && (!Number.isSafeInteger(cantidadTrayectos) || cantidadTrayectos < 1)) { setError('Indica una cantidad entera de trayectos mayor o igual a uno.'); return; }
    const parametros: CotizacionOfertaRequest = { cantidadPersonas, fechaInicio: formulario.fechaInicio, fechaFin, cantidadTrayectos };
    const controller = new AbortController(); consulta.current?.abort(); consulta.current = controller;
    const version = ++revision.current; const origen = contexto.current;
    setCotizando(true); setCotizada(null);
    try {
      const respuesta = await cotizacionApi.cotizar(oferta.id, parametros, { signal: controller.signal });
      if (!controller.signal.aborted && origen === contexto.current && version === revision.current) setCotizada({ respuesta, parametros, revision: version });
    } catch (err) {
      if (!controller.signal.aborted && origen === contexto.current && version === revision.current) setError(err instanceof Error ? err.message : 'No se pudo cotizar la oferta. Inténtalo de nuevo.');
    } finally {
      if (consulta.current === controller) consulta.current = null;
      if (!controller.signal.aborted && origen === contexto.current && version === revision.current) setCotizando(false);
    }
  };
  const continuar = async (accion: 'agregar' | 'reservar') => {
    if (mutando.current || guardandoViaje || !cotizada || cotizada.revision !== revision.current || !usuario || !tieneRol('TURISTA') || !oferta.reservaRequerida) return;
    if (observaciones.length > 1000) { setError('Las observaciones admiten hasta 1000 caracteres.'); return; }
    if (accion === 'reservar' && !cotizada.respuesta.cotizacionDisponible) return;
    if (accion === 'reservar' && !window.confirm('¿Solicitar esta reserva con los datos cotizados? El negocio revisará tu solicitud.')) return;
    const origen = contexto.current; if (!origen) return;
    const datos = cotizada.respuesta;
    mutando.current = true; setGuardando(true); setError('');
    try {
      if (accion === 'agregar') {
        await agregarOferta({ ofertaId: oferta.id, fechaInicio: datos.fechaInicio, fechaFin: datos.fechaFin,
          cantidadPersonas: datos.cantidadPersonas, cantidadTrayectos: datos.cantidadTrayectos,
          orden: null, observaciones: observaciones.trim() || null });
        if (origen === contexto.current) navigate('/mi-viaje');
      } else {
        const reserva = await reservasApi.crearReserva({ negocioExperienciaId: oferta.id, fechaReserva: datos.fechaInicio,
          fechaFin: datos.fechaFin, cantidadPersonas: datos.cantidadPersonas, cantidadTrayectos: datos.cantidadTrayectos,
          observaciones: observaciones.trim() || null });
        if (origen === contexto.current) navigate(`/reservas/${encodeURIComponent(reserva.id)}`, { state: { reservaCreada: true } });
      }
    } catch (err) {
      if (origen === contexto.current) {
        setError(err instanceof Error ? err.message : 'No se pudo completar la solicitud. Inténtalo de nuevo.');
        if (err instanceof ApiError && err.status === 409) setCotizada(null);
      }
    }
    finally { mutando.current = false; if (contexto.current) setGuardando(false); }
  };
  return <section className="gestion-form-panel offer-quote" id="cotizar"><span className="eyebrow">PLANEA TU EXPERIENCIA</span><h2>Cotiza esta oferta</h2><p>Elige tus fechas y viajeros para conocer el precio de tu plan.</p><SelectorMoneda/>
    <form className="negocio-form quote-form" onSubmit={cotizar}><label>Personas<input type="number" required min={1} step={1} disabled={guardando} value={formulario.cantidadPersonas} onChange={e => cambiar('cantidadPersonas', e.target.value)}/></label>
      <label>Fecha de inicio<input type="date" required min={fechaActualReservas()} disabled={guardando} value={formulario.fechaInicio} onChange={e => cambiar('fechaInicio', e.target.value)}/></label>
      {mostrarFin && <label>Fecha de fin{usaNoches && oferta.duracionUnidad === 'UNICO' ? ' *' : ' (opcional)'}<input type="date" min={formulario.fechaInicio || fechaActualReservas()} disabled={guardando} value={formulario.fechaFin} onChange={e => cambiar('fechaFin', e.target.value)}/></label>}
      {mostrarTrayectos && <label>Trayectos (opcional)<input type="number" min={1} step={1} disabled={guardando} value={formulario.cantidadTrayectos} onChange={e => cambiar('cantidadTrayectos', e.target.value)} placeholder="Según la oferta"/></label>}
      <div className="form-actions"><IonButton type="submit" disabled={cotizando || guardando}>{cotizando ? 'Cotizando…' : cotizada ? 'Volver a cotizar' : 'Cotizar oferta'}</IonButton></div>
    </form>
    {cotizada && cotizada.revision === revision.current && <><ResumenCotizacion cotizacion={cotizada.respuesta}/>
      {oferta.reservaRequerida && <><label className="cambio-label">Observaciones (opcional)<textarea rows={3} maxLength={1000} disabled={guardando} value={observaciones} onChange={e => setObservaciones(e.target.value)}/></label>
        {!usuario ? <Link className="marketplace-primary-link" to={`/ingresar?continuar=${encodeURIComponent(location.pathname)}`}>Inicia sesión para agregar o reservar</Link> : !tieneRol('TURISTA') ? <p>Necesitas una cuenta de turista para agregar servicios o solicitar reservas.</p> : <div className="marketplace-actions"><IonButton disabled={guardando || guardandoViaje} onClick={() => void continuar('agregar')}>{guardando ? 'Guardando…' : 'Agregar a mi viaje'}</IonButton><IonButton fill="outline" disabled={guardando || guardandoViaje || !cotizada.respuesta.cotizacionDisponible} onClick={() => void continuar('reservar')}>Reservar esta oferta</IonButton></div>}
      </>}
      {!oferta.reservaRequerida && <p>Esta oferta no requiere reserva. Consulta con el negocio para coordinar el servicio.</p>}
    </>}
    {error && <div className="notice-error" role="alert">{error}</div>}
    <small>La cotización puede actualizarse cuando solicites la reserva. No incluye un pago en línea.</small>
  </section>;
}
