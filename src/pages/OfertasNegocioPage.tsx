import { IonButton, IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import PrecioOferta from '../components/PrecioOferta';
import { ApiError } from '../services/http';
import { destinosApi } from '../services/destinosApi';
import { destinoExperienciasApi } from '../services/destinoExperienciasApi';
import { negocioExperienciasApi } from '../services/negocioExperienciasApi';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import { monedas } from '../types/moneda';
import type { Moneda } from '../types/moneda';
import type { DestinoPublico } from '../types/destino';
import type { ExperienciaPublica } from '../types/experiencia';
import type { NegocioResponse } from '../types/negocio';
import type { EstadoOfertaExperiencia, NegocioExperiencia, NegocioExperienciaRequest } from '../types/ofertaExperiencia';

interface FormularioOferta {
  destinoId: string;
  experienciaId: string;
  precioDesde: string;
  moneda: Moneda;
  reservaRequerida: boolean;
  descripcionOferta: string;
}
const formularioVacio: FormularioOferta = {
  destinoId: '', experienciaId: '', precioDesde: '', moneda: 'COP', reservaRequerida: false, descripcionOferta: '',
};
const nombresEstado: Record<EstadoOfertaExperiencia, string> = { BORRADOR: 'Borrador', ACTIVA: 'Activa', INACTIVA: 'Inactiva' };
function mensajeError(error: unknown, alternativo: string) {
  if (error instanceof ApiError && error.status === 404) return 'La oferta o el negocio no existe o no pertenece a tu cuenta.';
  return error instanceof Error ? error.message : alternativo;
}

export default function OfertasNegocioPage() {
  const { negocioId } = useParams<{ negocioId: string }>();
  const [negocio, setNegocio] = useState<NegocioResponse | null>(null);
  const [ofertas, setOfertas] = useState<NegocioExperiencia[]>([]);
  const [destinos, setDestinos] = useState<DestinoPublico[]>([]);
  const [experienciasPorDestino, setExperienciasPorDestino] = useState<Record<string, ExperienciaPublica[]>>({});
  const [experienciasDisponibles, setExperienciasDisponibles] = useState<ExperienciaPublica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoExperiencias, setCargandoExperiencias] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errorCatalogo, setErrorCatalogo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<FormularioOferta>({ ...formularioVacio });
  const revisionCarga = useRef(0);
  const ocupado = guardando || consultando;

  const cargar = useCallback(async () => {
    const revision = ++revisionCarga.current;
    setCargando(true); setError('');
    if (!negocioId) { setNegocio(null); setError('No se indicó el negocio.'); setCargando(false); return; }
    try {
      // Verificar la pertenencia antes de consultar las ofertas del negocio indicado.
      const detalle = await operadorNegociosApi.buscar(negocioId);
      if (revision !== revisionCarga.current) return;
      const [listado, publicados] = await Promise.all([negocioExperienciasApi.listar(negocioId), destinosApi.listarPublicos()]);
      if (revision !== revisionCarga.current) return;
      setNegocio(detalle); setOfertas(listado); setDestinos(publicados);
      const relacionados = publicados.filter(destino => listado.some(oferta => oferta.destinoId === destino.id));
      // Resolver nombres desde el catálogo público; si deja de estar disponible se mantiene el ID.
      const consultas = relacionados.map(async destino => {
        try {
          const experiencias = await destinoExperienciasApi.experienciasPublicas(destino.slug);
          if (revision === revisionCarga.current) setExperienciasPorDestino(actual => ({ ...actual, [destino.id]: experiencias }));
        } catch {
          if (revision === revisionCarga.current) setExperienciasPorDestino(actual => ({ ...actual, [destino.id]: [] }));
        }
      });
      void Promise.all(consultas);
    } catch (err) {
      if (revision === revisionCarga.current) { setNegocio(null); setOfertas([]); setDestinos([]); setError(mensajeError(err, 'No se pudieron cargar las ofertas del negocio.')); }
    } finally { if (revision === revisionCarga.current) setCargando(false); }
  }, [negocioId]);
  useEffect(() => {
    setMostrarFormulario(false); setEditandoId(null); setExperienciasPorDestino({});
    void cargar(); return () => { revisionCarga.current++; };
  }, [cargar]);
  useIonViewWillEnter(() => { void cargar(); }, [cargar]);

  useEffect(() => {
    const controller = new AbortController();
    setExperienciasDisponibles([]); setErrorCatalogo('');
    if (!mostrarFormulario || !formulario.destinoId) { setCargandoExperiencias(false); return () => controller.abort(); }
    const destino = destinos.find(item => item.id === formulario.destinoId);
    if (!destino) { setCargandoExperiencias(false); return () => controller.abort(); }
    setCargandoExperiencias(true);
    void destinoExperienciasApi.experienciasPublicas(destino.slug, { signal: controller.signal })
      .then(experiencias => {
        if (!controller.signal.aborted) {
          setExperienciasDisponibles(experiencias);
          setExperienciasPorDestino(actual => ({ ...actual, [destino.id]: experiencias }));
        }
      })
      .catch(err => {
        if (!controller.signal.aborted) setErrorCatalogo(mensajeError(err, 'No se pudieron cargar las experiencias de este destino.'));
      })
      .finally(() => { if (!controller.signal.aborted) setCargandoExperiencias(false); });
    return () => controller.abort();
  }, [destinos, formulario.destinoId, mostrarFormulario]);

  const campo = <K extends keyof FormularioOferta>(nombre: K, valor: FormularioOferta[K]) =>
    setFormulario(actual => ({ ...actual, [nombre]: valor }));
  const nuevo = () => {
    setFormulario({ ...formularioVacio }); setEditandoId(null); setError(''); setMensaje(''); setMostrarFormulario(true);
  };
  const editar = async (ofertaId: number) => {
    if (!negocioId || ocupado) return;
    setConsultando(true); setError(''); setMensaje('');
    try {
      const oferta = await negocioExperienciasApi.buscar(negocioId, ofertaId);
      setFormulario({ destinoId: oferta.destinoId, experienciaId: oferta.experienciaId,
        precioDesde: oferta.precioDesde === null ? '' : String(oferta.precioDesde), moneda: oferta.moneda,
        reservaRequerida: oferta.reservaRequerida, descripcionOferta: oferta.descripcionOferta ?? '' });
      setEditandoId(oferta.id); setMostrarFormulario(true);
    } catch (err) { setError(mensajeError(err, 'No se pudo consultar la oferta.')); }
    finally { setConsultando(false); }
  };
  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!negocioId || !negocio || guardando || cargandoExperiencias) return;
    setError(''); setMensaje('');
    if (!formulario.destinoId || !formulario.experienciaId) { setError('Selecciona un destino y una experiencia asociada.'); return; }
    const precioDesde = formulario.precioDesde.trim() === '' ? null : Number(formulario.precioDesde);
    if (precioDesde !== null && (!Number.isFinite(precioDesde) || precioDesde < 0)) { setError('El precio debe ser un número mayor o igual a cero, o quedar vacío.'); return; }
    if (formulario.descripcionOferta.length > 1000) { setError('La descripción de la oferta admite hasta 1000 caracteres.'); return; }
    const body: NegocioExperienciaRequest = { destinoId: formulario.destinoId, experienciaId: formulario.experienciaId,
      precioDesde, moneda: formulario.moneda, reservaRequerida: formulario.reservaRequerida,
      descripcionOferta: formulario.descripcionOferta.trim() || null };
    setGuardando(true);
    try {
      if (editandoId !== null) await negocioExperienciasApi.actualizar(negocioId, editandoId, body);
      else await negocioExperienciasApi.crear(negocioId, body);
      setMostrarFormulario(false); setMensaje(editandoId !== null ? 'Oferta actualizada correctamente.' : 'Oferta creada como borrador.');
      await cargar();
    } catch (err) { setError(mensajeError(err, 'No se pudo guardar la oferta.')); }
    finally { setGuardando(false); }
  };
  const cambiarEstado = async (oferta: NegocioExperiencia, activar: boolean) => {
    if (!negocioId || ocupado || !window.confirm(`¿${activar ? 'Activar' : 'Desactivar'} esta oferta?`)) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      if (activar) await negocioExperienciasApi.activar(negocioId, oferta.id); else await negocioExperienciasApi.desactivar(negocioId, oferta.id);
      setMensaje(activar ? 'Oferta activada.' : 'Oferta desactivada.'); await cargar();
    } catch (err) { setError(mensajeError(err, 'No se pudo cambiar el estado de la oferta.')); }
    finally { setGuardando(false); }
  };
  const destinoNoDisponible = formulario.destinoId && !destinos.some(destino => destino.id === formulario.destinoId);
  const experienciaNoDisponible = formulario.experienciaId && !cargandoExperiencias && !experienciasDisponibles.some(experiencia => experiencia.id === formulario.experienciaId);

  return <IonPage><BrandHeader title="Ofertas de mi negocio"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Ofertas de <em>experiencias.</em></h1>{negocio && <p>{negocio.nombreComercial}</p>}</div>{negocio && <IonButton className="btn-explora" disabled={ocupado || cargando} onClick={nuevo}>Crear oferta</IonButton>}</div>
    <Link className="resource-inline-link" to="/operador/negocios">Volver a Mis negocios</Link>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}{error && <div className="notice-error" role="alert">{error}</div>}
    {cargando ? <div className="loading-state"><IonSpinner/> Cargando ofertas…</div> : !negocio ? <IonButton fill="outline" onClick={() => void cargar()}>Reintentar</IonButton> : mostrarFormulario ? <section className="gestion-form-panel">
      <div className="gestion-form-heading"><h2>{editandoId !== null ? 'Editar oferta' : 'Crear oferta'}</h2><IonButton fill="clear" disabled={guardando} onClick={() => setMostrarFormulario(false)}>Volver al listado</IonButton></div>
      <form onSubmit={guardar}><fieldset disabled={guardando} className="negocio-form negocio-fieldset">
        <label>Destino *<select required value={formulario.destinoId} onChange={e => setFormulario(actual => ({ ...actual, destinoId: e.target.value, experienciaId: '' }))}>
          <option value="">Selecciona un destino publicado</option>{destinoNoDisponible && <option value={formulario.destinoId}>Destino no disponible en el catálogo (ID: {formulario.destinoId})</option>}
          {destinos.map(destino => <option key={destino.id} value={destino.id}>{destino.nombre}</option>)}
        </select></label>
        <label>Experiencia asociada *<select required disabled={!formulario.destinoId || cargandoExperiencias} value={formulario.experienciaId} onChange={e => campo('experienciaId', e.target.value)}>
          <option value="">{cargandoExperiencias ? 'Cargando experiencias…' : 'Selecciona una experiencia'}</option>{experienciaNoDisponible && <option value={formulario.experienciaId}>Experiencia no disponible en el catálogo (ID: {formulario.experienciaId})</option>}
          {experienciasDisponibles.map(experiencia => <option key={experiencia.id} value={experiencia.id}>{experiencia.nombre}</option>)}
        </select></label>
        {cargandoExperiencias && <div className="loading-state form-full" role="status"><IonSpinner/> Cargando experiencias del destino…</div>}
        {errorCatalogo && <div className="notice-error form-full" role="alert">{errorCatalogo}</div>}
        {destinoNoDisponible && <p className="form-full">El destino guardado ya no está disponible en el catálogo público. Puedes seleccionar otro destino publicado.</p>}
        {experienciaNoDisponible && <p className="form-full">La experiencia guardada no aparece entre las disponibles para este destino. Su identificador se conserva hasta que elijas otra.</p>}
        {!cargandoExperiencias && formulario.destinoId && !experienciasDisponibles.length && !errorCatalogo && !destinoNoDisponible && <p className="empty-state form-full">Este destino no tiene experiencias públicas disponibles.</p>}
        <label>Precio desde<input type="number" min={0} step="any" value={formulario.precioDesde} onChange={e => campo('precioDesde', e.target.value)} placeholder="Opcional"/></label>
        <label>Moneda *<select required value={formulario.moneda} onChange={e => campo('moneda', monedas.find(moneda => moneda === e.target.value) ?? formulario.moneda)}>{monedas.map(moneda => <option key={moneda} value={moneda}>{moneda}</option>)}</select></label>
        <label className="resource-reserva-check form-full"><input type="checkbox" checked={formulario.reservaRequerida} onChange={e => campo('reservaRequerida', e.target.checked)}/><span>Requiere reserva previa</span></label>
        <label className="form-full">Descripción de la oferta<textarea rows={4} maxLength={1000} value={formulario.descripcionOferta} onChange={e => campo('descripcionOferta', e.target.value)}/></label>
        <div className="form-actions"><IonButton type="submit" disabled={guardando || cargandoExperiencias}>{guardando ? 'Guardando…' : 'Guardar oferta'}</IonButton><IonButton type="button" fill="outline" disabled={guardando} onClick={() => setMostrarFormulario(false)}>Cancelar</IonButton></div>
      </fieldset></form>
    </section> : <>
      <div className="gestion-list-heading"><h2>Ofertas de este negocio</h2><IonButton fill="outline" disabled={ocupado} onClick={() => void cargar()}>Actualizar</IonButton></div>
      {consultando ? <div className="loading-state"><IonSpinner/> Consultando oferta…</div> : <div className="negocios-list">{ofertas.map(oferta => {
        const destino = destinos.find(item => item.id === oferta.destinoId);
        const experiencia = experienciasPorDestino[oferta.destinoId]?.find(item => item.id === oferta.experienciaId);
        return <article className="negocio-row" key={oferta.id}><div className="negocio-row-main"><h3>{destino?.nombre ?? `Destino: ${oferta.destinoId}`}</h3><p>{experiencia?.nombre ?? `Experiencia: ${oferta.experienciaId}`}</p><p>{oferta.descripcionOferta || 'Sin descripción de la oferta'}</p><PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda}/><small>{oferta.reservaRequerida ? 'Requiere reserva' : 'No requiere reserva'}</small></div><div className="negocio-row-right"><span className={`status-pill status-${oferta.estado === 'ACTIVA' ? 'activo' : oferta.estado === 'INACTIVA' ? 'inactivo' : 'borrador'}`}>{nombresEstado[oferta.estado]}</span><div className="negocio-row-actions"><IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void editar(oferta.id)}>Editar</IonButton>{oferta.estado !== 'ACTIVA' && <IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void cambiarEstado(oferta, true)}>Activar</IonButton>}{oferta.estado === 'ACTIVA' && <IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void cambiarEstado(oferta, false)}>Desactivar</IonButton>}</div></div></article>;
      })}{!ofertas.length && <p className="empty-state">Todavía no hay ofertas registradas para este negocio.</p>}</div>}
    </>}
  </main></IonContent></IonPage>;
}
