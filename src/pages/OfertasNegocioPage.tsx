import { IonButton, IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { useAuth } from '../auth/AuthContext';
import OfertaCampos, { crearFormularioOferta } from '../components/OfertaCampos';
import type { FormularioOferta } from '../components/OfertaCampos';
import PrecioOferta from '../components/PrecioOferta';
import GestionAgendaOferta from '../components/GestionAgendaOferta';
import { categoriasCatalogo, nombresCategoria } from '../data/categoriasCatalogo';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { ApiError } from '../services/http';
import { destinosApi } from '../services/destinosApi';
import { destinoExperienciasApi } from '../services/destinoExperienciasApi';
import { ofertasApi } from '../services/ofertasApi';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import { estadosOferta, modelosPrecio, modelosPrecioPorCategoria, nombresModeloPrecio, unidadesDuracionOferta, tiposOfertaRestaurante, tiposServicioRestaurante, tiposAlojamiento, tiposHabitacion, tiposServicioTransporte, tiposVehiculo, tiposServicioGuia, tiposServicioVidaNocturna } from '../types/oferta';
import { monedas } from '../types/moneda';
import type { CamposOfertaEspecializadaRequest, OfertaNegocioRequest, OfertaNegocioResponse } from '../types/oferta';
import type { CategoriaNegocio } from '../types/catalogo';
import type { ExperienciaPublica } from '../types/experiencia';
import type { NegocioResponse } from '../types/negocio';

const opcional = (texto: string) => texto.trim() || null;
const numeroOpcional = (texto: string) => texto.trim() === '' ? null : Number(texto);
function mensajeError(error: unknown, alternativo: string) {
  if (error instanceof ApiError && error.status === 404) return 'La oferta o el negocio no existe o no pertenece a tu cuenta.';
  return error instanceof Error ? error.message : alternativo;
}
function comprobarOferta(oferta: OfertaNegocioResponse): void {
  if (!oferta || !categoriasCatalogo.some(categoria => categoria.categoria === oferta.categoria)
    || !modelosPrecio.includes(oferta.modeloPrecio) || !unidadesDuracionOferta.includes(oferta.duracionUnidad)
    || !monedas.includes(oferta.moneda) || !estadosOferta.includes(oferta.estado) || typeof oferta.nombre !== 'string'
    || (oferta.precioDesde != null && (typeof oferta.precioDesde !== 'number' || !Number.isFinite(oferta.precioDesde)))) {
    throw new Error('La información de una oferta no está disponible en el formato esperado. Actualiza el listado e inténtalo de nuevo.');
  }
}
function formularioDesdeOferta(oferta: OfertaNegocioResponse): FormularioOferta {
  comprobarOferta(oferta);
  return { ...crearFormularioOferta(oferta.categoria), nombre: oferta.nombre,
    destinoId: oferta.destinoId ?? '', experienciaId: oferta.experienciaId ?? '',
    precioDesde: oferta.precioDesde == null ? '' : String(oferta.precioDesde), moneda: oferta.moneda,
    modeloPrecio: oferta.modeloPrecio, personasIncluidas: oferta.personasIncluidas == null ? '' : String(oferta.personasIncluidas),
    capacidadMaxima: oferta.capacidadMaxima == null ? '' : String(oferta.capacidadMaxima), duracionCantidad: oferta.duracionCantidad == null ? '' : String(oferta.duracionCantidad),
    duracionUnidad: oferta.duracionUnidad, reservaRequerida: oferta.reservaRequerida, descripcionOferta: oferta.descripcionOferta ?? '' };
}
function validarFormulario(formulario: FormularioOferta): string | null {
  if (!formulario.nombre.trim() || formulario.nombre.trim().length > 150) return 'Indica el nombre de la oferta, hasta 150 caracteres.';
  if (formulario.descripcionOferta.length > 1000) return 'La descripción admite hasta 1000 caracteres.';
  const precio = numeroOpcional(formulario.precioDesde);
  if (precio !== null && (!Number.isFinite(precio) || precio < 0)) return 'El precio debe ser mayor o igual a cero, o quedar vacío para consultar.';
  const personas = numeroOpcional(formulario.personasIncluidas);
  const capacidad = numeroOpcional(formulario.capacidadMaxima);
  if ([personas, capacidad].some(valor => valor !== null && (!Number.isInteger(valor) || valor < 1))) return 'Personas incluidas y capacidad deben ser enteros mayores o iguales a uno.';
  if (personas !== null && capacidad !== null && personas > capacidad) return 'Las personas incluidas no pueden superar la capacidad máxima.';
  if (['POR_VEHICULO', 'POR_UNIDAD_Y_NOCHE', 'POR_MESA', 'POR_GRUPO'].includes(formulario.modeloPrecio) && capacidad === null) return 'Indica la capacidad máxima para este modelo de precio.';
  if (!modelosPrecioPorCategoria[formulario.categoria].includes(formulario.modeloPrecio)) return 'Selecciona un modelo de precio compatible con la categoría.';
  if (formulario.categoria !== 'TRANSPORTE') {
    const duracion = Number(formulario.duracionCantidad);
    if (!Number.isInteger(duracion) || duracion < 1) return 'Indica una duración entera mayor o igual a uno.';
    if (formulario.duracionUnidad === 'UNICO' && duracion !== 1) return 'Una duración de servicio único debe tener cantidad uno.';
  }
  switch (formulario.categoria) {
    case 'AVENTURA':
      if (!formulario.destinoId || !formulario.experienciaId) return 'Selecciona el destino y una experiencia asociada.';
      break;
    case 'RESTAURANTE':
      if ((formulario.tipoOfertaRestaurante === 'INDIVIDUAL' && formulario.items.length !== 1) || (formulario.tipoOfertaRestaurante === 'COMBO' && formulario.items.length < 2)) return formulario.tipoOfertaRestaurante === 'COMBO' ? 'Un combo requiere al menos dos elementos.' : 'Una oferta individual requiere exactamente un elemento.';
      if (formulario.items.some(item => !item.nombre.trim() || item.nombre.length > 150 || item.descripcion.length > 500 || !Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) < 1)) return 'Completa los elementos con nombre, cantidad entera positiva y textos dentro de sus límites.';
      break;
    case 'HOSPEDAJE': {
      const camas = numeroOpcional(formulario.cantidadCamas);
      if (camas !== null && (!Number.isInteger(camas) || camas < 1)) return 'La cantidad de camas debe ser un entero mayor o igual a uno.';
      break;
    }
    case 'TRANSPORTE': {
      if (!formulario.origen.trim() || !formulario.destinoTransporte.trim() || formulario.origen.length > 150 || formulario.destinoTransporte.length > 150) return 'Indica origen y destino, hasta 150 caracteres cada uno.';
      const trayectos = Number(formulario.trayectosPredeterminados);
      if (!Number.isInteger(trayectos) || trayectos < (formulario.tipoServicioTransporte === 'IDA_Y_REGRESO' ? 2 : 1)) return 'Indica los trayectos; ida y regreso requiere al menos dos.';
      break;
    }
    case 'GUIA':
      if (!formulario.idiomas.trim() || formulario.idiomas.length > 300 || formulario.puntoEncuentro.length > 200) return 'Indica los idiomas (hasta 300 caracteres) y revisa el punto de encuentro (hasta 200).';
      break;
    case 'VIDA_NOCTURNA': {
      const edad = numeroOpcional(formulario.edadMinima);
      if (edad !== null && (!Number.isInteger(edad) || edad < 0)) return 'La edad mínima debe ser un entero mayor o igual a cero.';
      if (formulario.condicionesAcceso.length > 500) return 'Las condiciones de acceso admiten hasta 500 caracteres.';
      break;
    }
  }
  return null;
}

export default function OfertasNegocioPage() {
  const { negocioId } = useParams<{ negocioId: string }>();
  const { usuario } = useAuth();
  const location = useLocation();
  const contexto = `${usuario?.id ?? ''}:${negocioId ?? ''}:${location.key}`;
  const contextoActual = useRef(contexto);
  contextoActual.current = contexto;
  const montado = useRef(true);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  const [negocio, setNegocio] = useState<NegocioResponse | null>(null);
  const [ofertas, setOfertas] = useState<OfertaNegocioResponse[]>([]);
  const [filtro, setFiltro] = useState<CategoriaNegocio | ''>('');
  const [experiencias, setExperiencias] = useState<ExperienciaPublica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoExperiencias, setCargandoExperiencias] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errorExperiencias, setErrorExperiencias] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<FormularioOferta>(() => crearFormularioOferta('AVENTURA'));
  const revision = useRef(0);
  const operacion = useRef(false);
  const cargarDestinos = useCallback((signal: AbortSignal) => destinosApi.listarPublicos(undefined, { signal }), []);
  const { datos: destinos, cargando: cargandoDestinos, error: errorDestinos, actualizar: actualizarDestinos } = useConsultaApi(cargarDestinos, []);
  const ocupado = guardando || consultando;

  const cargar = useCallback(async () => {
    const actual = ++revision.current;
    const contextoCarga = contextoActual.current;
    const vigente = () => montado.current && contextoCarga === contextoActual.current && actual === revision.current;
    setCargando(true); setError('');
    if (!negocioId) { setNegocio(null); setOfertas([]); setError('No se indicó el negocio.'); setCargando(false); return; }
    try {
      const propietario = await operadorNegociosApi.buscar(negocioId);
      if (!vigente()) return;
      if (!Array.isArray(propietario.categorias) || propietario.categorias.some(categoria => !categoriasCatalogo.some(opcion => opcion.categoria === categoria))) throw new Error('Las categorías de este negocio no están disponibles. Actualiza su información antes de gestionar ofertas.');
      const listado = await ofertasApi.listar(negocioId);
      if (!Array.isArray(listado)) throw new Error('No se pudo interpretar el listado de ofertas.');
      listado.forEach(comprobarOferta);
      if (vigente()) { setNegocio(propietario); setOfertas(listado); }
    } catch (err) {
      if (vigente()) { setNegocio(null); setOfertas([]); setError(mensajeError(err, 'No se pudieron cargar las ofertas del negocio.')); }
    } finally { if (montado.current && actual === revision.current) setCargando(false); }
  }, [negocioId, usuario?.id]);
  useEffect(() => { setMostrarFormulario(false); setEditandoId(null); setNegocio(null); setOfertas([]); void cargar(); return () => { revision.current++; }; }, [cargar]);
  useIonViewWillEnter(() => { void cargar(); }, [cargar]);

  useEffect(() => {
    const controller = new AbortController();
    setExperiencias([]); setErrorExperiencias('');
    if (!mostrarFormulario || formulario.categoria !== 'AVENTURA' || !formulario.destinoId) { setCargandoExperiencias(false); return () => controller.abort(); }
    const destino = destinos.find(item => item.id === formulario.destinoId);
    if (!destino) { setCargandoExperiencias(false); return () => controller.abort(); }
    setCargandoExperiencias(true);
    void destinoExperienciasApi.experienciasPublicas(destino.slug, { signal: controller.signal })
      .then(resultado => { if (!controller.signal.aborted) setExperiencias(resultado); })
      .catch(err => { if (!controller.signal.aborted) setErrorExperiencias(mensajeError(err, 'No se pudieron cargar las experiencias del destino.')); })
      .finally(() => { if (!controller.signal.aborted) setCargandoExperiencias(false); });
    return () => controller.abort();
  }, [destinos, formulario.categoria, formulario.destinoId, mostrarFormulario]);

  const nuevo = () => {
    if (!negocio?.categorias.length || operacion.current) return;
    setFormulario(crearFormularioOferta(negocio.categorias[0])); setEditandoId(null); setError(''); setMensaje(''); setMostrarFormulario(true);
  };
  const editar = async (id: number) => {
    if (!negocioId || operacion.current) return;
    operacion.current = true; setConsultando(true); setError(''); setMensaje('');
    const actual = revision.current;
    const contextoEdicion = contextoActual.current;
    const vigente = () => montado.current && contextoEdicion === contextoActual.current && actual === revision.current;
    try {
      const oferta = await ofertasApi.buscar(negocioId, id);
      if (!vigente()) return;
      let valores = formularioDesdeOferta(oferta);
      switch (oferta.categoria) {
        case 'RESTAURANTE': {
          const detalle = await ofertasApi.restaurante.buscar(negocioId, id);
          if (!tiposOfertaRestaurante.includes(detalle.tipoOferta) || !Array.isArray(detalle.items) || detalle.items.some(item => !tiposServicioRestaurante.includes(item.tipoServicio))) throw new Error('Los elementos de esta oferta no están disponibles en el formato esperado.');
          valores = { ...formularioDesdeOferta(detalle.oferta), tipoOfertaRestaurante: detalle.tipoOferta, items: [...detalle.items].sort((a, b) => a.orden - b.orden).map(item => ({ tipoServicio: item.tipoServicio, nombre: item.nombre, descripcion: item.descripcion ?? '', cantidad: String(item.cantidad) })) }; break;
        }
        case 'HOSPEDAJE': {
          const detalle = await ofertasApi.hospedaje.buscar(negocioId, id);
          if (!tiposAlojamiento.includes(detalle.tipoAlojamiento) || !tiposHabitacion.includes(detalle.tipoHabitacion)) throw new Error('El alojamiento no está disponible en el formato esperado.');
          valores = { ...formularioDesdeOferta(detalle.oferta), tipoAlojamiento: detalle.tipoAlojamiento, tipoHabitacion: detalle.tipoHabitacion, cantidadCamas: detalle.cantidadCamas == null ? '' : String(detalle.cantidadCamas), banoPrivado: detalle.banoPrivado, incluyeDesayuno: detalle.incluyeDesayuno }; break;
        }
        case 'TRANSPORTE': {
          const detalle = await ofertasApi.transporte.buscar(negocioId, id);
          if (!tiposServicioTransporte.includes(detalle.tipoServicio) || !tiposVehiculo.includes(detalle.tipoVehiculo)) throw new Error('El transporte no está disponible en el formato esperado.');
          valores = { ...formularioDesdeOferta(detalle.oferta), tipoServicioTransporte: detalle.tipoServicio, origen: detalle.origen ?? '', destinoTransporte: detalle.destino ?? '', tipoVehiculo: detalle.tipoVehiculo, trayectosPredeterminados: String(detalle.trayectosPredeterminados) }; break;
        }
        case 'GUIA': {
          const detalle = await ofertasApi.guia.buscar(negocioId, id);
          if (!tiposServicioGuia.includes(detalle.tipoServicio)) throw new Error('El servicio de guía no está disponible en el formato esperado.');
          valores = { ...formularioDesdeOferta(detalle.oferta), tipoServicioGuia: detalle.tipoServicio, idiomas: detalle.idiomas ?? '', puntoEncuentro: detalle.puntoEncuentro ?? '', incluyeEquipo: detalle.incluyeEquipo }; break;
        }
        case 'VIDA_NOCTURNA': {
          const detalle = await ofertasApi.vidaNocturna.buscar(negocioId, id);
          if (!tiposServicioVidaNocturna.includes(detalle.tipoServicio)) throw new Error('El servicio de vida nocturna no está disponible en el formato esperado.');
          valores = { ...formularioDesdeOferta(detalle.oferta), tipoServicioVidaNocturna: detalle.tipoServicio, edadMinima: detalle.edadMinima == null ? '' : String(detalle.edadMinima), incluyeConsumo: detalle.incluyeConsumo, condicionesAcceso: detalle.condicionesAcceso ?? '' }; break;
        }
      }
      if (vigente()) { setFormulario(valores); setEditandoId(id); setMostrarFormulario(true); }
    } catch (err) { if (vigente()) setError(mensajeError(err, 'No se pudo consultar la oferta.')); }
    finally { operacion.current = false; if (montado.current) setConsultando(false); }
  };
  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!negocioId || !negocio || operacion.current) return;
    setError(''); setMensaje('');
    const invalido = validarFormulario(formulario);
    if (invalido) { setError(invalido); return; }
    const base = { nombre: formulario.nombre.trim(), precioDesde: numeroOpcional(formulario.precioDesde), moneda: formulario.moneda,
      modeloPrecio: formulario.modeloPrecio, personasIncluidas: numeroOpcional(formulario.personasIncluidas), capacidadMaxima: numeroOpcional(formulario.capacidadMaxima),
      reservaRequerida: formulario.reservaRequerida, descripcionOferta: opcional(formulario.descripcionOferta) };
    const duracion: CamposOfertaEspecializadaRequest = { ...base, duracionCantidad: Number(formulario.duracionCantidad), duracionUnidad: formulario.duracionUnidad };
    const contextoGuardado = contextoActual.current;
    operacion.current = true; setGuardando(true);
    try {
      switch (formulario.categoria) {
        case 'AVENTURA': {
          const body: OfertaNegocioRequest = { ...duracion, categoria: 'AVENTURA', destinoId: formulario.destinoId, experienciaId: formulario.experienciaId };
          if (editandoId === null) await ofertasApi.registrar(negocioId, body); else await ofertasApi.actualizar(negocioId, editandoId, body); break;
        }
        case 'RESTAURANTE': {
          const body = { ...duracion, tipoOferta: formulario.tipoOfertaRestaurante, items: formulario.items.map((item, indice) => ({ tipoServicio: item.tipoServicio, nombre: item.nombre.trim(), descripcion: opcional(item.descripcion), cantidad: Number(item.cantidad), orden: indice + 1 })) };
          if (editandoId === null) await ofertasApi.restaurante.registrar(negocioId, body); else await ofertasApi.restaurante.actualizar(negocioId, editandoId, body); break;
        }
        case 'HOSPEDAJE': {
          const body = { ...duracion, tipoAlojamiento: formulario.tipoAlojamiento, tipoHabitacion: formulario.tipoHabitacion, cantidadCamas: numeroOpcional(formulario.cantidadCamas), banoPrivado: formulario.banoPrivado, incluyeDesayuno: formulario.incluyeDesayuno };
          if (editandoId === null) await ofertasApi.hospedaje.registrar(negocioId, body); else await ofertasApi.hospedaje.actualizar(negocioId, editandoId, body); break;
        }
        case 'TRANSPORTE': {
          const body = { ...base, tipoServicio: formulario.tipoServicioTransporte, origen: formulario.origen.trim(), destino: formulario.destinoTransporte.trim(), tipoVehiculo: formulario.tipoVehiculo, trayectosPredeterminados: Number(formulario.trayectosPredeterminados) };
          if (editandoId === null) await ofertasApi.transporte.registrar(negocioId, body); else await ofertasApi.transporte.actualizar(negocioId, editandoId, body); break;
        }
        case 'GUIA': {
          const body = { ...duracion, tipoServicio: formulario.tipoServicioGuia, idiomas: formulario.idiomas.trim(), puntoEncuentro: opcional(formulario.puntoEncuentro), incluyeEquipo: formulario.incluyeEquipo };
          if (editandoId === null) await ofertasApi.guia.registrar(negocioId, body); else await ofertasApi.guia.actualizar(negocioId, editandoId, body); break;
        }
        case 'VIDA_NOCTURNA': {
          const body = { ...duracion, tipoServicio: formulario.tipoServicioVidaNocturna, edadMinima: numeroOpcional(formulario.edadMinima), incluyeConsumo: formulario.incluyeConsumo, condicionesAcceso: opcional(formulario.condicionesAcceso) };
          if (editandoId === null) await ofertasApi.vidaNocturna.registrar(negocioId, body); else await ofertasApi.vidaNocturna.actualizar(negocioId, editandoId, body); break;
        }
      }
      if (!montado.current || contextoGuardado !== contextoActual.current) return;
      setMostrarFormulario(false); setMensaje(editandoId === null ? 'Oferta creada como borrador.' : 'Oferta actualizada.'); await cargar();
    } catch (err) { if (montado.current && contextoGuardado === contextoActual.current) setError(mensajeError(err, 'No se pudo guardar la oferta.')); }
    finally { operacion.current = false; if (montado.current) setGuardando(false); }
  };
  const cambiarEstado = async (oferta: OfertaNegocioResponse, activar: boolean) => {
    if (!negocioId || operacion.current || !window.confirm(`¿${activar ? 'Activar' : 'Desactivar'} «${oferta.nombre}»?`)) return;
    const contextoCambio = contextoActual.current;
    operacion.current = true; setGuardando(true); setError(''); setMensaje('');
    try {
      if (activar) await ofertasApi.activar(negocioId, oferta.id); else await ofertasApi.desactivar(negocioId, oferta.id);
      if (!montado.current || contextoCambio !== contextoActual.current) return;
      setMensaje(activar ? 'Oferta activada.' : 'Oferta desactivada.'); await cargar();
    } catch (err) { if (montado.current && contextoCambio === contextoActual.current) setError(mensajeError(err, 'No se pudo cambiar el estado de la oferta.')); }
    finally { operacion.current = false; if (montado.current) setGuardando(false); }
  };
  const visibles = filtro ? ofertas.filter(oferta => oferta.categoria === filtro) : ofertas;

  return <IonPage><BrandHeader title="Ofertas de mi negocio"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Ofertas de <em>mi negocio.</em></h1>{negocio && <p>{negocio.nombreComercial}</p>}</div>{negocio && <IonButton className="btn-explora" disabled={ocupado || cargando || !negocio.categorias.length} onClick={nuevo}>Nueva oferta</IonButton>}</div>
    <Link className="resource-inline-link" to="/operador/negocios">Volver a Mis negocios</Link>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}{error && <div className="notice-error" role="alert">{error}</div>}
    {cargando ? <div className="loading-state"><IonSpinner/> Cargando ofertas…</div> : !negocio ? <IonButton fill="outline" onClick={() => void cargar()}>Reintentar</IonButton> : mostrarFormulario ? <section className="gestion-form-panel">
      <div className="gestion-form-heading"><h2>{editandoId === null ? 'Nueva oferta' : 'Editar oferta'}</h2><IonButton fill="clear" disabled={guardando} onClick={() => setMostrarFormulario(false)}>Volver al listado</IonButton></div>
      {formulario.categoria === 'AVENTURA' && <>{errorDestinos && <div><div role="alert" className="notice-error">{errorDestinos}</div><IonButton fill="outline" onClick={() => void actualizarDestinos()}>Actualizar destinos</IonButton></div>}{errorExperiencias && <div role="alert" className="notice-error">{errorExperiencias}</div>}{cargandoDestinos && <p role="status">Cargando destinos…</p>}</>}
      <form onSubmit={guardar}><fieldset className="negocio-form negocio-fieldset" disabled={guardando}>
        <OfertaCampos formulario={formulario} cambiar={setFormulario} categorias={negocio.categorias} editando={editandoId !== null} destinos={destinos} experiencias={experiencias} cargandoExperiencias={cargandoExperiencias}/>
        <div className="form-actions"><IonButton type="submit" disabled={guardando || (formulario.categoria === 'AVENTURA' && (cargandoDestinos || cargandoExperiencias))}>{guardando ? 'Guardando…' : 'Guardar oferta'}</IonButton><IonButton type="button" fill="outline" disabled={guardando} onClick={() => setMostrarFormulario(false)}>Cancelar</IonButton></div>
      </fieldset></form>
    </section> : <>
      <div className="chip-filter oferta-panel-filtros" aria-label="Filtrar ofertas por categoría"><IonButton fill={filtro === '' ? 'solid' : 'outline'} size="small" disabled={ocupado} onClick={() => setFiltro('')}>Todas</IonButton>{categoriasCatalogo.map(categoria => <IonButton key={categoria.categoria} size="small" fill={filtro === categoria.categoria ? 'solid' : 'outline'} disabled={ocupado} onClick={() => setFiltro(categoria.categoria)}>{nombresCategoria[categoria.categoria]}</IonButton>)}</div>
      <div className="gestion-list-heading"><h2>Ofertas de este negocio</h2><IonButton fill="outline" disabled={ocupado} onClick={() => void cargar()}>Actualizar</IonButton></div>
      {!negocio.categorias.length && <p className="notice-error">Asigna al menos una categoría a tu negocio antes de crear una oferta.</p>}
      {consultando ? <div className="loading-state"><IonSpinner/> Consultando oferta…</div> : <div className="negocios-list">{visibles.map(oferta => <article className="negocio-row" key={oferta.id}><div className="negocio-row-main"><span className="eyebrow">{nombresCategoria[oferta.categoria]}</span><h3>{oferta.nombre}</h3><p>{oferta.descripcionOferta || 'Consulta los detalles de esta oferta.'}</p><PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/><small>{nombresModeloPrecio[oferta.modeloPrecio]}{oferta.capacidadMaxima ? ` · Hasta ${oferta.capacidadMaxima} personas` : ''}</small></div><div className="negocio-row-right"><span className={`status-pill status-${oferta.estado === 'ACTIVA' ? 'activo' : oferta.estado === 'INACTIVA' ? 'inactivo' : 'borrador'}`}>{oferta.estado === 'ACTIVA' ? 'Activa' : oferta.estado === 'INACTIVA' ? 'Inactiva' : 'Borrador'}</span><div className="negocio-row-actions"><Link className="resource-inline-link" to={`/operador/negocios/${encodeURIComponent(negocio.id)}/ofertas/${oferta.id}/contenido`}>Contenido y punto de encuentro</Link><IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void editar(oferta.id)}>Editar</IonButton>{oferta.estado === 'ACTIVA' ? <IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void cambiarEstado(oferta, false)}>Desactivar</IonButton> : <IonButton size="small" fill="outline" disabled={ocupado} onClick={() => void cambiarEstado(oferta, true)}>Activar</IonButton>}</div><GestionAgendaOferta negocioId={negocio.id} oferta={oferta}/></div></article>)}{!visibles.length && <p className="empty-state">No hay ofertas para esta categoría. Crea una para comenzar.</p>}</div>}
    </>}
  </main></IonContent></IonPage>;
}
