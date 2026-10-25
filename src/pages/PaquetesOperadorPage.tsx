import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { formatearPrecio } from '../domain/precios';
import { esFechaReservaValida } from '../domain/reservas';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { ApiError } from '../services/http';
import { ofertasApi } from '../services/ofertasApi';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import { paquetesComercialesApi } from '../services/paquetesComercialesApi';
import type { NegocioResponse } from '../types/negocio';
import { monedas } from '../types/moneda';
import type { Moneda } from '../types/moneda';
import type { OfertaNegocioResponse, UnidadDuracionOferta } from '../types/oferta';
import { unidadesDuracionOferta } from '../types/oferta';
import type { ModeloPrecioPaquete, PaqueteComercialItemRequest, PaqueteComercialItemResponse, PaqueteComercialRequest, PaqueteComercialResponse } from '../types/paqueteComercial';
import { modelosPrecioPaquete, nombresEstadoPaqueteComercial, nombresModeloPaquete } from '../types/paqueteComercial';

interface Datos { negocio: NegocioResponse; paquetes: PaqueteComercialResponse[]; ofertas: OfertaNegocioResponse[] }
interface FormularioPaquete {
  nombre: string; descripcion: string; duracionCantidad: string; duracionUnidad: UnidadDuracionOferta;
  modeloPrecio: ModeloPrecioPaquete; precio: string; moneda: Moneda; minimoPersonas: string; maximoPersonas: string;
  capacidadGrupo: string; incluye: string; noIncluye: string; condiciones: string; politicaCancelacion: string; vigenciaDesde: string; vigenciaHasta: string;
}
interface FormularioItem { ofertaId: string; diaInicio: string; diaFin: string; cantidadTrayectos: string; orden: string; observaciones: string }
const nuevoFormulario = (): FormularioPaquete => ({ nombre: '', descripcion: '', duracionCantidad: '1', duracionUnidad: 'DIA', modeloPrecio: 'SUMA_COMPONENTES', precio: '', moneda: 'COP', minimoPersonas: '1', maximoPersonas: '', capacidadGrupo: '', incluye: '', noIncluye: '', condiciones: '', politicaCancelacion: '', vigenciaDesde: '', vigenciaHasta: '' });
const nuevoItem = (): FormularioItem => ({ ofertaId: '', diaInicio: '1', diaFin: '', cantidadTrayectos: '', orden: '', observaciones: '' });
const textoOpcional = (valor: string) => valor.trim() || null;
function entero(valor: string, nombre: string, opcional = false): number | null {
  if (!valor.trim() && opcional) return null;
  const numero = Number(valor);
  if (!valor.trim() || !Number.isSafeInteger(numero) || numero < 1) throw new Error(`${nombre} debe ser un número entero mayor que cero.`);
  return numero;
}
function bodyItem(item: PaqueteComercialItemResponse, orden = item.orden): PaqueteComercialItemRequest {
  return { ofertaId: item.ofertaId, diaInicio: item.diaInicio, diaFin: item.diaFin, cantidadTrayectos: item.cantidadTrayectos, orden, observaciones: item.observaciones };
}
const nombresDuracion: Record<UnidadDuracionOferta, string> = { UNICO: 'Servicio único', DIA: 'Días', NOCHE: 'Noches', SEMANA: 'Semanas', MES: 'Meses' };

export default function PaquetesOperadorPage() {
  const { negocioId } = useParams<{ negocioId: string }>();
  const { usuario } = useAuth();
  const location = useLocation();
  const cargar = useCallback(async (signal: AbortSignal): Promise<Datos> => {
    if (!negocioId) throw new ApiError(404, 'El negocio no existe o no pertenece a tu cuenta.');
    const negocio = await operadorNegociosApi.buscar(negocioId);
    if (signal.aborted) throw new Error('Consulta cancelada.');
    const [paquetes, ofertas] = await Promise.all([paquetesComercialesApi.listar(negocioId, { signal }), ofertasApi.listar(negocioId)]);
    return { negocio, paquetes, ofertas };
  }, [negocioId, usuario?.id]);
  const consulta = useConsultaApi<Datos | null>(cargar, null);
  const [paquete, setPaquete] = useState<PaqueteComercialResponse | null>(null);
  const [formularioAbierto, setFormularioAbierto] = useState<'paquete' | 'item' | null>(null);
  const [editandoPaquete, setEditandoPaquete] = useState<string | null>(null);
  const [editandoItem, setEditandoItem] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioPaquete>(nuevoFormulario);
  const [itemForm, setItemForm] = useState<FormularioItem>(nuevoItem);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const enCurso = useRef(false);
  const revision = useRef(0);
  useLayoutEffect(() => {
    revision.current++;
    enCurso.current = false; setGuardando(false);
    return () => { revision.current++; };
  }, [location.key, location.pathname, usuario?.id]);
  useEffect(() => {
    revision.current++; setPaquete(null); setFormularioAbierto(null); setMensaje(''); setError('');
    return () => { revision.current++; };
  }, [negocioId]);
  useEffect(() => {
    if (!consulta.datos) return;
    setPaquete(actual => actual ? consulta.datos?.paquetes.find(elemento => elemento.id === actual.id) ?? null : null);
  }, [consulta.datos]);
  const actualizar = <K extends keyof FormularioPaquete>(campo: K, valor: FormularioPaquete[K]) => setFormulario(actual => ({ ...actual, [campo]: valor }));
  const actualizarItem = (campo: keyof FormularioItem, valor: string) => setItemForm(actual => ({ ...actual, [campo]: valor }));
  const ejecutar = async (accion: () => Promise<PaqueteComercialResponse>, exito: string) => {
    if (enCurso.current) return;
    enCurso.current = true; setGuardando(true); setError(''); setMensaje('');
    const actual = revision.current;
    try {
      const resultado = await accion();
      if (actual !== revision.current) return;
      setPaquete(resultado); setFormularioAbierto(null); setMensaje(exito);
      await consulta.actualizar();
    } catch (err) {
      if (actual !== revision.current) return;
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio.');
      // El estado consultado tras un conflicto es el guardado por el backend, sin reintentar la escritura.
      await consulta.actualizar();
    } finally { if (actual === revision.current) { enCurso.current = false; setGuardando(false); } }
  };
  const abrirPaquete = (actual?: PaqueteComercialResponse) => {
    setError(''); setMensaje(''); setEditandoPaquete(actual?.id ?? null);
    setFormulario(actual ? {
      nombre: actual.nombre, descripcion: actual.descripcion ?? '', duracionCantidad: String(actual.duracionCantidad), duracionUnidad: actual.duracionUnidad,
      modeloPrecio: actual.modeloPrecio, precio: actual.precio === null ? '' : String(actual.precio), moneda: actual.moneda ?? 'COP', minimoPersonas: String(actual.minimoPersonas),
      maximoPersonas: actual.maximoPersonas === null ? '' : String(actual.maximoPersonas), capacidadGrupo: actual.capacidadGrupo === null ? '' : String(actual.capacidadGrupo),
      incluye: actual.incluye ?? '', noIncluye: actual.noIncluye ?? '', condiciones: actual.condiciones ?? '', politicaCancelacion: actual.politicaCancelacion ?? '', vigenciaDesde: actual.vigenciaDesde ?? '', vigenciaHasta: actual.vigenciaHasta ?? '',
    } : nuevoFormulario());
    setFormularioAbierto('paquete');
  };
  const guardarPaquete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!negocioId || enCurso.current) return;
    try {
      const minimo = entero(formulario.minimoPersonas, 'El mínimo de personas')!;
      const maximo = entero(formulario.maximoPersonas, 'El máximo de personas', true);
      if (maximo !== null && maximo < minimo) throw new Error('El máximo de personas no puede ser menor que el mínimo.');
      if ((formulario.vigenciaDesde && !esFechaReservaValida(formulario.vigenciaDesde)) || (formulario.vigenciaHasta && !esFechaReservaValida(formulario.vigenciaHasta))) throw new Error('Comprueba las fechas de vigencia.');
      if (formulario.vigenciaDesde && formulario.vigenciaHasta && formulario.vigenciaHasta < formulario.vigenciaDesde) throw new Error('La vigencia final no puede ser anterior a la inicial.');
      const suma = formulario.modeloPrecio === 'SUMA_COMPONENTES';
      const precio = suma ? null : Number(formulario.precio);
      if (!suma && (!formulario.precio.trim() || precio === null || !Number.isFinite(precio) || precio < 0)) throw new Error('Ingresa un precio válido, igual o mayor que cero.');
      const body: PaqueteComercialRequest = {
        nombre: formulario.nombre.trim(), descripcion: textoOpcional(formulario.descripcion), tipo: 'PROPIO',
        duracionCantidad: entero(formulario.duracionCantidad, 'La duración')!, duracionUnidad: formulario.duracionUnidad,
        modeloPrecio: formulario.modeloPrecio, precio, moneda: suma ? null : formulario.moneda,
        minimoPersonas: minimo, maximoPersonas: maximo, capacidadGrupo: formulario.modeloPrecio === 'POR_GRUPO' ? entero(formulario.capacidadGrupo, 'La capacidad del grupo') : null,
        incluye: textoOpcional(formulario.incluye), noIncluye: textoOpcional(formulario.noIncluye), condiciones: textoOpcional(formulario.condiciones), politicaCancelacion: textoOpcional(formulario.politicaCancelacion),
        vigenciaDesde: formulario.vigenciaDesde || null, vigenciaHasta: formulario.vigenciaHasta || null,
      };
      if (!body.nombre) throw new Error('El nombre del paquete es obligatorio.');
      void ejecutar(() => editandoPaquete ? paquetesComercialesApi.actualizar(negocioId, editandoPaquete, body) : paquetesComercialesApi.crear(negocioId, body), editandoPaquete ? 'Paquete actualizado.' : 'Paquete creado en borrador. Añade las ofertas de tu negocio.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Revisa los datos del paquete.'); }
  };
  const abrirItem = (actual?: PaqueteComercialItemResponse) => {
    setError(''); setEditandoItem(actual?.id ?? null);
    setItemForm(actual ? { ofertaId: String(actual.ofertaId), diaInicio: String(actual.diaInicio), diaFin: actual.diaFin === null ? '' : String(actual.diaFin), cantidadTrayectos: actual.cantidadTrayectos === null ? '' : String(actual.cantidadTrayectos), orden: actual.orden === null ? '' : String(actual.orden), observaciones: actual.observaciones ?? '' } : nuevoItem());
    setFormularioAbierto('item');
  };
  const guardarItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!negocioId || !paquete || enCurso.current) return;
    try {
      const ofertaId = entero(itemForm.ofertaId, 'La oferta')!;
      if (!consulta.datos?.ofertas.some(oferta => oferta.id === ofertaId)) throw new Error('Selecciona una oferta de este negocio.');
      const diaInicio = entero(itemForm.diaInicio, 'El día de inicio')!;
      const diaFin = entero(itemForm.diaFin, 'El día final', true);
      if (diaFin !== null && diaFin < diaInicio) throw new Error('El día final no puede ser menor que el inicial.');
      const body: PaqueteComercialItemRequest = { ofertaId, diaInicio, diaFin, cantidadTrayectos: entero(itemForm.cantidadTrayectos, 'Los trayectos', true), orden: entero(itemForm.orden, 'El orden', true), observaciones: textoOpcional(itemForm.observaciones) };
      void ejecutar(() => editandoItem ? paquetesComercialesApi.actualizarItem(negocioId, paquete.id, editandoItem, body) : paquetesComercialesApi.agregarItem(negocioId, paquete.id, body), editandoItem ? 'Servicio actualizado en el itinerario.' : 'Servicio agregado al paquete.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Revisa los datos del servicio.'); }
  };
  const cambiarEstado = (accion: 'publicar' | 'desactivar' | 'borrador') => {
    if (!negocioId || !paquete || enCurso.current) return;
    const verbo = accion === 'publicar' ? 'publicar' : accion === 'desactivar' ? 'desactivar' : 'volver a borrador';
    if (!window.confirm(`¿Quieres ${verbo} este paquete?`)) return;
    void ejecutar(() => paquetesComercialesApi.cambiarEstado(negocioId, paquete.id, accion), 'Estado del paquete actualizado.');
  };
  const eliminarItem = (item: PaqueteComercialItemResponse) => {
    if (!negocioId || !paquete || !window.confirm(`¿Quitar «${item.ofertaNombre}» de este paquete?`)) return;
    void ejecutar(() => paquetesComercialesApi.eliminarItem(negocioId, paquete.id, item.id), 'Servicio eliminado del paquete.');
  };
  const itemsOrdenados = paquete ? [...paquete.items].sort((a,b) => (a.orden ?? 0) - (b.orden ?? 0)) : [];
  const moverItem = (indice: number, direccion: -1 | 1) => {
    if (!negocioId || !paquete || enCurso.current) return;
    const destino = indice + direccion;
    if (destino < 0 || destino >= itemsOrdenados.length) return;
    const ordenados = [...itemsOrdenados];
    [ordenados[indice], ordenados[destino]] = [ordenados[destino], ordenados[indice]];
    const visitaActual = revision.current;
    void ejecutar(async () => {
      let resultado = paquete;
      // No existe endpoint de reordenación masiva: se guardan los órdenes mediante PUT de cada item.
      for (let posicion = 0; posicion < ordenados.length; posicion++) {
        if (visitaActual !== revision.current) throw new Error('La visita cambió. Actualiza el itinerario para consultar el orden guardado.');
        const item = ordenados[posicion];
        if (item.orden !== posicion + 1) resultado = await paquetesComercialesApi.actualizarItem(negocioId, paquete.id, item.id, bodyItem(item, posicion + 1));
      }
      return resultado;
    }, 'Orden del itinerario actualizado.');
  };
  const editable = paquete?.estado === 'BORRADOR' && paquete.tipo === 'PROPIO';
  const ocupada = guardando || consulta.cargando;

  return <IonPage><BrandHeader title="Paquetes de mi negocio"/><IonContent fullscreen><main className="page-width gestion-page package-builder">
    <Link className="resource-inline-link" to="/operador/negocios">Volver a Mis negocios</Link>
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Construye tus <em>paquetes.</em></h1><p>{consulta.datos?.negocio.nombreComercial ?? 'Combina los servicios de tu negocio en un plan turístico.'}</p></div><IonButton className="btn-explora" disabled={ocupada || !consulta.datos} onClick={() => abrirPaquete()}>Nuevo paquete</IonButton></div>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}{error && <div className="notice-error" role="alert">{error}</div>}
    <EstadoConsulta {...consulta} sinDatos={!consulta.datos} mensajeVacio="El negocio no está disponible.">
      <div className="package-builder-layout"><aside className="package-builder-list"><h2>Mis paquetes</h2>{consulta.datos?.paquetes.map(actual => <button type="button" className={`package-builder-option ${paquete?.id === actual.id ? 'package-builder-option-selected' : ''}`} key={actual.id} disabled={ocupada} onClick={() => { setPaquete(actual); setFormularioAbierto(null); setError(''); setMensaje(''); }}><strong>{actual.nombre}</strong><span>{nombresEstadoPaqueteComercial[actual.estado]} · {actual.totalItems} servicio(s)</span></button>)}{!consulta.datos?.paquetes.length && <p className="empty-state">Todavía no has creado paquetes para este negocio.</p>}<p className="viaje-note">Los paquetes propios incluyen ofertas de este negocio. Los paquetes colaborativos aún no están disponibles.</p></aside>
      <div className="package-builder-main">
      {formularioAbierto === 'paquete' ? <section className="gestion-form-panel"><h2>{editandoPaquete ? 'Editar paquete' : 'Crear paquete'}</h2><form onSubmit={guardarPaquete}><fieldset disabled={ocupada} className="negocio-form negocio-fieldset">
        <label className="form-full">Nombre<input required maxLength={150} value={formulario.nombre} onChange={event => actualizar('nombre', event.target.value)}/></label><label className="form-full">Descripción<textarea maxLength={2000} rows={3} value={formulario.descripcion} onChange={event => actualizar('descripcion', event.target.value)}/></label>
        <label>Duración<input type="number" required min={1} step={1} value={formulario.duracionCantidad} onChange={event => actualizar('duracionCantidad', event.target.value)}/></label><label>Unidad de duración<select value={formulario.duracionUnidad} onChange={event => actualizar('duracionUnidad', event.target.value as UnidadDuracionOferta)}>{unidadesDuracionOferta.map(unidad => <option key={unidad} value={unidad}>{nombresDuracion[unidad]}</option>)}</select></label>
        <label>Modelo de precio<select value={formulario.modeloPrecio} onChange={event => actualizar('modeloPrecio', event.target.value as ModeloPrecioPaquete)}>{modelosPrecioPaquete.map(modelo => <option key={modelo} value={modelo}>{nombresModeloPaquete[modelo]}</option>)}</select></label>
        {formulario.modeloPrecio !== 'SUMA_COMPONENTES' && <><label>Precio<input type="number" required min={0} step="0.01" value={formulario.precio} onChange={event => actualizar('precio', event.target.value)}/></label><label>Moneda<select value={formulario.moneda} onChange={event => actualizar('moneda', event.target.value as Moneda)}>{monedas.map(moneda => <option key={moneda}>{moneda}</option>)}</select></label></>}
        <label>Mínimo de personas<input type="number" min={1} step={1} required value={formulario.minimoPersonas} onChange={event => actualizar('minimoPersonas', event.target.value)}/></label><label>Máximo de personas (opcional)<input type="number" min={1} step={1} value={formulario.maximoPersonas} onChange={event => actualizar('maximoPersonas', event.target.value)}/></label>
        {formulario.modeloPrecio === 'POR_GRUPO' && <label>Personas por grupo<input type="number" required min={1} step={1} value={formulario.capacidadGrupo} onChange={event => actualizar('capacidadGrupo', event.target.value)}/></label>}
        <label>Vigencia desde<input type="date" value={formulario.vigenciaDesde} onChange={event => actualizar('vigenciaDesde', event.target.value)}/></label><label>Vigencia hasta<input type="date" value={formulario.vigenciaHasta} onChange={event => actualizar('vigenciaHasta', event.target.value)}/></label>
        {(['incluye','noIncluye','condiciones','politicaCancelacion'] as const).map(campo => <label className="form-full" key={campo}>{{ incluye: 'Qué incluye', noIncluye: 'No incluye', condiciones: 'Condiciones', politicaCancelacion: 'Política de cancelación' }[campo]}<textarea rows={3} maxLength={2000} value={formulario[campo]} onChange={event => actualizar(campo, event.target.value)}/></label>)}
        <div className="form-actions"><IonButton type="submit" disabled={ocupada}>{guardando ? 'Guardando…' : 'Guardar paquete'}</IonButton><IonButton fill="outline" disabled={ocupada} onClick={() => setFormularioAbierto(null)}>Cancelar</IonButton></div>
      </fieldset></form></section> : paquete ? <>
        <section className="gestion-form-panel"><div className="gestion-form-heading"><h2>{paquete.nombre}</h2><span className={`status-pill status-${paquete.estado.toLowerCase()}`}>{nombresEstadoPaqueteComercial[paquete.estado]}</span></div><p>{paquete.descripcion}</p>{paquete.tipo === 'COLABORATIVO' && <p className="viaje-note">Paquete colaborativo: la edición y publicación aún no están disponibles.</p>}<p>{paquete.duracionCantidad} {nombresDuracion[paquete.duracionUnidad].toLocaleLowerCase('es')} · {nombresModeloPaquete[paquete.modeloPrecio]}</p>{paquete.precio !== null && paquete.moneda && <p>{formatearPrecio(paquete.precio, paquete.moneda)}</p>}
          <div className="form-actions">{editable && <><IonButton fill="outline" disabled={ocupada} onClick={() => abrirPaquete(paquete)}>Editar información</IonButton><IonButton disabled={ocupada} onClick={() => abrirItem()}>Agregar oferta</IonButton></>}{paquete.estado !== 'PUBLICADO' && <IonButton disabled={ocupada || consulta.datos?.negocio.estado !== 'ACTIVO' || paquete.tipo !== 'PROPIO'} onClick={() => cambiarEstado('publicar')}>Publicar</IonButton>}{paquete.estado === 'PUBLICADO' && <IonButton fill="outline" disabled={ocupada} onClick={() => cambiarEstado('desactivar')}>Desactivar</IonButton>}{paquete.estado === 'INACTIVO' && <IonButton fill="outline" disabled={ocupada} onClick={() => cambiarEstado('borrador')}>Volver a borrador</IonButton>}</div>
          {!editable && <p className="viaje-note">Para modificarlo, desactiva el paquete publicado y vuelve a borrador.</p>}
        </section>
        {formularioAbierto === 'item' && editable && <section className="gestion-form-panel"><h2>{editandoItem ? 'Editar servicio' : 'Agregar oferta al itinerario'}</h2><form onSubmit={guardarItem}><fieldset disabled={ocupada} className="negocio-form negocio-fieldset"><label className="form-full">Oferta de este negocio<select required value={itemForm.ofertaId} onChange={event => actualizarItem('ofertaId', event.target.value)}><option value="">Selecciona una oferta</option>{consulta.datos?.ofertas.map(oferta => <option key={oferta.id} value={oferta.id}>{oferta.nombre} · {nombresCategoria[oferta.categoria]} · {oferta.estado}{!oferta.reservaRequerida ? ' · No reservable' : ''}</option>)}</select></label><label>Día de inicio<input type="number" required min={1} step={1} value={itemForm.diaInicio} onChange={event => actualizarItem('diaInicio', event.target.value)}/></label><label>Día final (si aplica)<input type="number" min={1} step={1} value={itemForm.diaFin} onChange={event => actualizarItem('diaFin', event.target.value)}/></label><label>Trayectos (si aplica)<input type="number" min={1} step={1} value={itemForm.cantidadTrayectos} onChange={event => actualizarItem('cantidadTrayectos', event.target.value)}/></label><label>Orden (opcional)<input type="number" min={1} step={1} value={itemForm.orden} onChange={event => actualizarItem('orden', event.target.value)}/></label><label className="form-full">Indicaciones del itinerario<textarea rows={3} maxLength={1000} value={itemForm.observaciones} onChange={event => actualizarItem('observaciones', event.target.value)}/></label><p className="form-full viaje-note">Para publicar, las ofertas deben estar activas y permitir reserva. El itinerario debe respetar la duración del paquete.</p><div className="form-actions"><IonButton type="submit" disabled={ocupada}>{guardando ? 'Guardando…' : 'Guardar servicio'}</IonButton><IonButton fill="outline" disabled={ocupada} onClick={() => setFormularioAbierto(null)}>Cancelar</IonButton></div></fieldset></form></section>}
        <section><h2>Itinerario del paquete</h2>{itemsOrdenados.map((item, indice) => <article key={item.id} className="historial-item package-itinerary-item"><span className="eyebrow">DÍA {item.diaInicio}{item.diaFin !== null && item.diaFin !== item.diaInicio ? ` – ${item.diaFin}` : ''}</span><h3>{item.ofertaNombre}</h3><p>{nombresCategoria[item.categoria]}{item.cantidadTrayectos !== null ? ` · ${item.cantidadTrayectos} trayecto(s)` : ''}</p>{item.observaciones && <p>{item.observaciones}</p>}{editable && <div className="form-actions"><IonButton size="small" fill="outline" disabled={ocupada} onClick={() => abrirItem(item)}>Editar</IonButton><IonButton size="small" fill="clear" disabled={ocupada || indice === 0} onClick={() => moverItem(indice,-1)} aria-label={`Subir ${item.ofertaNombre}`}>↑ Subir</IonButton><IonButton size="small" fill="clear" disabled={ocupada || indice === itemsOrdenados.length-1} onClick={() => moverItem(indice,1)} aria-label={`Bajar ${item.ofertaNombre}`}>↓ Bajar</IonButton><IonButton size="small" fill="clear" color="medium" disabled={ocupada} onClick={() => eliminarItem(item)}>Quitar</IonButton></div>}</article>)}{!itemsOrdenados.length && <p className="empty-state">Agrega las ofertas que incluye este paquete para construir su itinerario.</p>}</section>
      </> : <p className="empty-state">Selecciona un paquete o crea uno para comenzar.</p>}
      </div></div>
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
