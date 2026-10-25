import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import PrecioOferta from '../components/PrecioOferta';
import SelectorMoneda from '../components/SelectorMoneda';
import { esFechaReservaValida, fechaActualReservas, formatearFechaReserva } from '../domain/reservas';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { negocioExperienciasApi } from '../services/negocioExperienciasApi';
import { reservasApi } from '../services/reservasApi';
import { ApiError } from '../services/http';
import { useAuth } from '../auth/AuthContext';
import { formatearPrecio } from '../domain/precios';
import type { OfertaExperienciaMonedaResponse } from '../types/ofertaExperiencia';

export default function NuevaReservaPage() {
  const { destinoSlug, experienciaSlug, ofertaId } = useParams<{ destinoSlug: string; experienciaSlug: string; ofertaId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const contextoVigente = useRef<object | null>(null);
  useLayoutEffect(() => {
    const contexto = {};
    contextoVigente.current = contexto;
    return () => { contextoVigente.current = null; };
  }, [location.key, location.pathname, usuario?.id]);
  const [fecha, setFecha] = useState('');
  const [personas, setPersonas] = useState('1');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const enviando = useRef(false);
  const cargar = useCallback(async (signal: AbortSignal) => {
    const id = Number(ofertaId);
    if (!destinoSlug || !experienciaSlug || !Number.isSafeInteger(id) || id <= 0) throw new ApiError(404, 'La oferta no está disponible para reservar.');
    const ofertas = await negocioExperienciasApi.listarPublicas(destinoSlug, experienciaSlug, { signal });
    const oferta = ofertas.find(item => item.id === id);
    if (!oferta) throw new ApiError(404, 'La oferta ya no está disponible para reservar.');
    if (!oferta.reservaRequerida) throw new ApiError(409, 'Esta oferta no requiere reserva.');
    return oferta;
  }, [destinoSlug, experienciaSlug, ofertaId]);
  const consulta = useConsultaApi<OfertaExperienciaMonedaResponse | null>(cargar, null);
  const oferta = consulta.datos?.id === Number(ofertaId) && consulta.datos.destinoSlug === destinoSlug && consulta.datos.experienciaSlug === experienciaSlug ? consulta.datos : null;
  const volver = destinoSlug && experienciaSlug ? `/destinos/${encodeURIComponent(destinoSlug)}/experiencias/${encodeURIComponent(experienciaSlug)}` : '/destinos';
  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enviando.current || consulta.cargando || !oferta) return;
    setError('');
    if (!esFechaReservaValida(fecha) || fecha < fechaActualReservas()) { setError('Selecciona una fecha válida de hoy o posterior.'); return; }
    const cantidadPersonas = Number(personas);
    if (!Number.isSafeInteger(cantidadPersonas) || cantidadPersonas < 1) { setError('Indica una cantidad entera de al menos una persona.'); return; }
    if (observaciones.length > 1000) { setError('Las observaciones admiten hasta 1000 caracteres.'); return; }
    const contextoEnvio = contextoVigente.current;
    if (!contextoEnvio) return;
    enviando.current = true; setGuardando(true);
    try {
      const reserva = await reservasApi.crearReserva({ negocioExperienciaId: oferta.id, fechaReserva: fecha, cantidadPersonas, observaciones: observaciones.trim() || null });
      if (contextoVigente.current !== contextoEnvio) return;
      navigate(`/reservas/${encodeURIComponent(reserva.id)}`, { replace: true, state: { reservaCreada: true } });
    } catch (err) {
      if (contextoVigente.current !== contextoEnvio) return;
      setError(err instanceof ApiError && err.status === 404 ? 'La oferta ya no está disponible para reservar.' : err instanceof Error ? err.message : 'No se pudo crear la reserva. Inténtalo de nuevo.');
    } finally {
      enviando.current = false;
      if (contextoVigente.current) setGuardando(false);
    }
  };

  return <IonPage><BrandHeader title="Reservar experiencia"/><IonContent fullscreen><main className="page-width reserva-form-page">
    <Link className="resource-inline-link" to={volver}>Volver a la experiencia</Link>
    <div className="gestion-heading"><div><span className="eyebrow">TU PRÓXIMA EXPERIENCIA</span><h1>Solicita tu <em>reserva.</em></h1><p>Envía tu solicitud. El negocio la revisará y confirmará su estado.</p></div></div>
    <EstadoConsulta {...consulta} sinDatos={!oferta} mensajeVacio="La oferta no está disponible para reservar.">
      {oferta && <>
        <section className="gestion-form-panel reserva-resumen"><h2>Tu experiencia</h2><dl className="reserva-info">
          <div><dt>Destino</dt><dd>{oferta.destinoNombre}</dd></div><div><dt>Experiencia</dt><dd>{oferta.experienciaNombre}</dd></div><div><dt>Negocio</dt><dd>{oferta.negocioNombreComercial}</dd></div>
          <div><dt>Fecha seleccionada</dt><dd>{fecha && esFechaReservaValida(fecha) ? formatearFechaReserva(fecha) : 'Selecciona una fecha'}</dd></div><div><dt>Cantidad de personas</dt><dd>{personas || 'Indica la cantidad'}</dd></div>
        </dl><p>Precio de referencia de la oferta</p><PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/><p>Referencia original: {oferta.precioDesde === null ? `precio a consultar (${oferta.moneda})` : formatearPrecio(oferta.precioDesde, oferta.moneda)}. Al enviar, se registra el precio de referencia vigente de la oferta.</p><SelectorMoneda/></section>
        <section className="gestion-form-panel"><form onSubmit={guardar}><fieldset disabled={guardando} className="negocio-form negocio-fieldset">
          <label>Fecha *<input type="date" required min={fechaActualReservas()} value={fecha} onChange={e => setFecha(e.target.value)}/></label>
          <label>Cantidad de personas *<input type="number" min={1} step={1} required value={personas} onChange={e => setPersonas(e.target.value)}/></label>
          <label className="form-full">Observaciones<textarea rows={4} maxLength={1000} value={observaciones} onChange={e => setObservaciones(e.target.value)}/></label>
          {error && <div className="notice-error form-full" role="alert">{error}</div>}
          <div className="form-actions"><IonButton type="submit" disabled={guardando}>{guardando ? 'Enviando solicitud…' : 'Solicitar reserva'}</IonButton><IonButton type="button" fill="outline" disabled={guardando} routerLink={volver}>Volver</IonButton></div>
        </fieldset></form></section>
      </>}
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
