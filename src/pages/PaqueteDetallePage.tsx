import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import PrecioOferta from '../components/PrecioOferta';
import GaleriaMultimediaPublica from '../components/GaleriaMultimediaPublica';
import TotalesViaje from '../components/viaje/TotalesViaje';
import { useViaje } from '../context/ViajeContext';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { formatearPrecio } from '../domain/precios';
import { esFechaReservaValida, fechaActualReservas, formatearFechaReserva } from '../domain/reservas';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { ApiError } from '../services/http';
import { paquetesComercialesApi } from '../services/paquetesComercialesApi';
import type { CotizacionPaqueteComercialResponse, PaqueteComercialResponse } from '../types/paqueteComercial';
import { nombresModeloPaquete } from '../types/paqueteComercial';

const duraciones = { UNICO: 'servicio', DIA: 'día(s)', NOCHE: 'noche(s)', SEMANA: 'semana(s)', MES: 'mes(es)' } as const;
export default function PaqueteDetallePage() {
  const { paqueteId } = useParams<{ paqueteId: string }>();
  const cargar = useCallback((signal: AbortSignal) => {
    if (!paqueteId) return Promise.reject(new ApiError(404, 'Este paquete no está disponible.'));
    return paquetesComercialesApi.buscarPublico(paqueteId, { signal });
  }, [paqueteId]);
  const consulta = useConsultaApi<PaqueteComercialResponse | null>(cargar, null);
  const paquete = consulta.datos?.id === paqueteId ? consulta.datos : null;
  const { usuario, tieneRol } = useAuth();
  const { seleccionarViaje } = useViaje();
  const navigate = useNavigate();
  const location = useLocation();
  const [fechaInicio, setFechaInicio] = useState('');
  const [personas, setPersonas] = useState('');
  const [nombreViaje, setNombreViaje] = useState('');
  const [cotizacion, setCotizacion] = useState<CotizacionPaqueteComercialResponse | null>(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState<'cotizando' | 'creando' | null>(null);
  const enCurso = useRef(false);
  const revision = useRef(0);
  useLayoutEffect(() => {
    revision.current++;
    enCurso.current = false; setOcupado(null);
    setCotizacion(null);
    return () => { revision.current++; };
  }, [location.key, location.pathname, usuario?.id]);
  useEffect(() => {
    revision.current++; setFechaInicio(''); setPersonas(''); setNombreViaje(''); setCotizacion(null); setError('');
    return () => { revision.current++; };
  }, [paqueteId]);
  useEffect(() => { setCotizacion(null); }, [paquete?.version]);
  const invalidar = () => { setCotizacion(null); setError(''); };
  const cotizar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enCurso.current || !paquete) return;
    const cantidad = Number(personas);
    if (!esFechaReservaValida(fechaInicio) || fechaInicio < fechaActualReservas() || !Number.isSafeInteger(cantidad) || cantidad < paquete.minimoPersonas || (paquete.maximoPersonas !== null && cantidad > paquete.maximoPersonas)) {
      setError('Elige una fecha de hoy o futura y una cantidad de personas dentro de los límites del paquete.'); return;
    }
    enCurso.current = true; setOcupado('cotizando'); setError(''); setCotizacion(null);
    const actual = revision.current;
    try {
      const resultado = await paquetesComercialesApi.cotizarPublico(paquete.id, { fechaInicio, cantidadPersonas: cantidad });
      if (actual === revision.current) setCotizacion(resultado);
    } catch (err) { if (actual === revision.current) setError(err instanceof Error ? err.message : 'No se pudo cotizar el paquete.'); }
    finally { if (actual === revision.current) { enCurso.current = false; setOcupado(null); } }
  };
  const crearViaje = async () => {
    if (enCurso.current || !paquete || !cotizacion?.cotizacionCompleta) return;
    if (!usuario) {
      navigate(`/ingresar?continuar=${encodeURIComponent(location.pathname + location.search)}`); return;
    }
    if (!tieneRol('TURISTA')) { setError('Necesitas una cuenta con rol turista para crear tu viaje.'); return; }
    if (!window.confirm('Se creará un viaje en borrador con los servicios de este paquete. Podrás revisarlo antes de reservar. ¿Continuar?')) return;
    enCurso.current = true; setOcupado('creando'); setError('');
    const actual = revision.current;
    try {
      const viaje = await paquetesComercialesApi.crearViaje(paquete.id, {
        fechaInicio: cotizacion.fechaInicio, cantidadPersonas: cotizacion.cantidadPersonas, nombre: nombreViaje.trim() || null,
      });
      if (actual !== revision.current) return;
      seleccionarViaje(viaje);
      navigate(`/viajes/${encodeURIComponent(viaje.id)}`);
    } catch (err) { if (actual === revision.current) setError(err instanceof Error ? err.message : 'No se pudo crear tu viaje.'); }
    finally { if (actual === revision.current) { enCurso.current = false; setOcupado(null); } }
  };

  return <IonPage><BrandHeader title={paquete?.nombre ?? 'Paquete turístico'}/><IonContent fullscreen><main className="page-width tourism-detail package-detail">
    <NavegacionTuristica/><Link className="resource-inline-link" to="/paquetes">Volver a paquetes</Link>
    <EstadoConsulta {...consulta} sinDatos={!paquete} mensajeVacio="Este paquete no está disponible.">
      {paquete && <><div className="package-detail-heading"><div><span className="eyebrow">UN PLAN DE <Link to={`/negocios/${encodeURIComponent(paquete.negocioId)}`}>{paquete.negocioNombre}</Link></span><h1>{paquete.nombre}</h1><p>{paquete.descripcion}</p></div><img src="/images/naturaleza-comunidad.webp" alt=""/></div>
        <GaleriaMultimediaPublica tipo="PAQUETE_COMERCIAL" entidadId={paquete.id}/>
        <dl className="tourism-facts"><div><dt>Duración</dt><dd>{paquete.duracionCantidad} {duraciones[paquete.duracionUnidad]}</dd></div><div><dt>Personas</dt><dd>Mínimo {paquete.minimoPersonas}{paquete.maximoPersonas !== null ? ` · Máximo ${paquete.maximoPersonas}` : ''}</dd></div><div><dt>Precio</dt><dd>{nombresModeloPaquete[paquete.modeloPrecio]}{paquete.capacidadGrupo !== null ? ` · Hasta ${paquete.capacidadGrupo} personas por grupo` : ''}</dd></div></dl>
        {paquete.precio !== null && paquete.moneda && <PrecioOferta precioDesde={paquete.precio} moneda={paquete.moneda}/>}
        <div className="package-inclusions">{paquete.incluye && <section><h2>Qué incluye</h2><p>{paquete.incluye}</p></section>}{paquete.noIncluye && <section><h2>No incluye</h2><p>{paquete.noIncluye}</p></section>}</div>
        <section><h2>Tu itinerario</h2><div className="package-itinerary">{[...paquete.items].sort((a,b) => (a.orden ?? 0) - (b.orden ?? 0)).map(item => <article className="historial-item" key={item.id}><span className="eyebrow">DÍA {item.diaInicio}{item.diaFin !== null && item.diaFin !== item.diaInicio ? ` – ${item.diaFin}` : ''}</span><h3>{item.ofertaNombre}</h3><p>{nombresCategoria[item.categoria]}{item.cantidadTrayectos !== null ? ` · ${item.cantidadTrayectos} trayecto(s)` : ''}</p>{item.observaciones && <p>{item.observaciones}</p>}</article>)}</div></section>
        {paquete.condiciones && <section><h2>Condiciones</h2><p>{paquete.condiciones}</p></section>}{paquete.politicaCancelacion && <section><h2>Política de cancelación</h2><p>{paquete.politicaCancelacion}</p></section>}
        {(paquete.vigenciaDesde || paquete.vigenciaHasta) && <p>Vigencia: {paquete.vigenciaDesde ? formatearFechaReserva(paquete.vigenciaDesde) : 'Desde su publicación'}{paquete.vigenciaHasta ? ` hasta ${formatearFechaReserva(paquete.vigenciaHasta)}` : ', sin fecha final informada'}.</p>}
        <section className="gestion-form-panel package-booking"><span className="eyebrow">PREPARA TU VIAJE</span><h2>Cotiza este paquete</h2><p>El precio final y las fechas de cada servicio se calculan con el negocio.</p>
          <form onSubmit={cotizar}><fieldset className="negocio-form negocio-fieldset" disabled={Boolean(ocupado)}><label>Fecha de inicio<input type="date" required min={fechaActualReservas()} value={fechaInicio} onChange={event => { setFechaInicio(event.target.value); invalidar(); }}/></label><label>Personas<input type="number" required min={paquete.minimoPersonas} max={paquete.maximoPersonas ?? undefined} step={1} value={personas} onChange={event => { setPersonas(event.target.value); invalidar(); }}/></label><label className="form-full">Nombre para tu viaje (opcional)<input maxLength={150} value={nombreViaje} onChange={event => setNombreViaje(event.target.value)}/></label><div className="form-actions"><IonButton type="submit" disabled={Boolean(ocupado)}>{ocupado === 'cotizando' ? 'Cotizando…' : 'Cotizar paquete'}</IonButton></div></fieldset></form>
          {error && <div role="alert" className="notice-error">{error}</div>}
          {cotizacion && <div className="package-quotation"><h3>Tu plan para {cotizacion.cantidadPersonas} persona(s)</h3><p>{formatearFechaReserva(cotizacion.fechaInicio)} – {formatearFechaReserva(cotizacion.fechaFin)}</p><p>{cotizacion.detallePrecio}</p><TotalesViaje totales={cotizacion.totales}/>
            <details><summary>Ver cotización de los componentes</summary>{cotizacion.items.map(({ itemId, cotizacion: parte }) => <article className="viaje-cotizacion-item" key={itemId}><h4>{parte.ofertaNombre}</h4><p>{parte.total !== null ? formatearPrecio(parte.total, parte.moneda) : 'Precio no disponible'}</p><small>{parte.detalle}</small></article>)}</details>
            <p>Se creará un viaje en borrador con este paquete. Después podrás revisarlo y reservarlo. El precio comercial se conservará según la respuesta del negocio.</p>
            {!cotizacion.cotizacionCompleta && <p className="notice-error">La cotización no está completa. Revisa el paquete antes de continuar.</p>}
            <IonButton className="btn-explora" disabled={Boolean(ocupado) || !cotizacion.cotizacionCompleta} onClick={() => void crearViaje()}>{ocupado === 'creando' ? 'Creando tu viaje…' : usuario ? 'Agregar a mi viaje' : 'Iniciar sesión y agregar a mi viaje'}</IonButton>
          </div>}
        </section>
      </>}
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
