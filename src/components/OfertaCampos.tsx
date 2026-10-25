import { IonButton } from '@ionic/react';
import type { CategoriaNegocio } from '../types/catalogo';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { monedas } from '../types/moneda';
import type { Moneda } from '../types/moneda';
import type { DestinoPublico } from '../types/destino';
import type { ExperienciaPublica } from '../types/experiencia';
import {
  modelosPrecioPorCategoria, nombresModeloPrecio, unidadesDuracionOferta,
  tiposOfertaRestaurante, tiposServicioRestaurante, tiposAlojamiento, tiposHabitacion,
  tiposServicioTransporte, tiposVehiculo, tiposServicioGuia, tiposServicioVidaNocturna,
} from '../types/oferta';
import type {
  ModeloPrecio, UnidadDuracionOferta, TipoOfertaRestaurante, TipoServicioRestaurante,
  TipoAlojamiento, TipoHabitacion, TipoServicioTransporte, TipoVehiculo, TipoServicioGuia, TipoServicioVidaNocturna,
} from '../types/oferta';

export interface ItemRestauranteFormulario {
  tipoServicio: TipoServicioRestaurante;
  nombre: string;
  descripcion: string;
  cantidad: string;
}
export interface FormularioOferta {
  nombre: string;
  categoria: CategoriaNegocio;
  destinoId: string;
  experienciaId: string;
  precioDesde: string;
  moneda: Moneda;
  modeloPrecio: ModeloPrecio;
  personasIncluidas: string;
  capacidadMaxima: string;
  duracionCantidad: string;
  duracionUnidad: UnidadDuracionOferta;
  reservaRequerida: boolean;
  descripcionOferta: string;
  tipoOfertaRestaurante: TipoOfertaRestaurante;
  items: ItemRestauranteFormulario[];
  tipoAlojamiento: TipoAlojamiento;
  tipoHabitacion: TipoHabitacion;
  cantidadCamas: string;
  banoPrivado: boolean;
  incluyeDesayuno: boolean;
  tipoServicioTransporte: TipoServicioTransporte;
  origen: string;
  destinoTransporte: string;
  tipoVehiculo: TipoVehiculo;
  trayectosPredeterminados: string;
  tipoServicioGuia: TipoServicioGuia;
  idiomas: string;
  puntoEncuentro: string;
  incluyeEquipo: boolean;
  tipoServicioVidaNocturna: TipoServicioVidaNocturna;
  edadMinima: string;
  incluyeConsumo: boolean;
  condicionesAcceso: string;
}
export function crearFormularioOferta(categoria: CategoriaNegocio): FormularioOferta {
  return {
    nombre: '', categoria, destinoId: '', experienciaId: '', precioDesde: '', moneda: 'COP', modeloPrecio: 'FIJO',
    personasIncluidas: '', capacidadMaxima: '', duracionCantidad: '1', duracionUnidad: 'UNICO', reservaRequerida: false,
    descripcionOferta: '', tipoOfertaRestaurante: 'INDIVIDUAL', items: [{ tipoServicio: 'DESAYUNO', nombre: '', descripcion: '', cantidad: '1' }],
    tipoAlojamiento: 'HABITACION', tipoHabitacion: 'NO_APLICA', cantidadCamas: '', banoPrivado: false, incluyeDesayuno: false,
    tipoServicioTransporte: 'TRASLADO', origen: '', destinoTransporte: '', tipoVehiculo: 'OTRO', trayectosPredeterminados: '1',
    tipoServicioGuia: 'OTRO', idiomas: '', puntoEncuentro: '', incluyeEquipo: false,
    tipoServicioVidaNocturna: 'OTRO', edadMinima: '', incluyeConsumo: false, condicionesAcceso: '',
  };
}
const etiquetaEnum = (valor: string) => valor.toLocaleLowerCase('es').replaceAll('_', ' ').replace(/^./, letra => letra.toLocaleUpperCase('es'));
function CampoLista<T extends string>({ etiqueta, opciones, valor, cambiar, labels, disabled = false }: {
  etiqueta: string; opciones: readonly T[]; valor: T; cambiar: (valor: T) => void; labels?: Record<T, string>; disabled?: boolean;
}) {
  return <label>{etiqueta}<select required disabled={disabled} value={valor} onChange={event => {
    const seleccion = opciones.find(opcion => opcion === event.currentTarget.value);
    if (seleccion) cambiar(seleccion);
  }}>{opciones.map(opcion => <option key={opcion} value={opcion}>{labels?.[opcion] ?? etiquetaEnum(opcion)}</option>)}</select></label>;
}
interface Props {
  formulario: FormularioOferta;
  cambiar: (formulario: FormularioOferta) => void;
  categorias: CategoriaNegocio[];
  editando: boolean;
  destinos: DestinoPublico[];
  experiencias: ExperienciaPublica[];
  cargandoExperiencias: boolean;
}
export default function OfertaCampos({ formulario, cambiar, categorias, editando, destinos, experiencias, cargandoExperiencias }: Props) {
  const campo = <K extends keyof FormularioOferta>(nombre: K, valor: FormularioOferta[K]) => cambiar({ ...formulario, [nombre]: valor });
  const opcionesCategoria = categorias.includes(formulario.categoria) ? categorias : [formulario.categoria, ...categorias];
  const destinoAusente = formulario.destinoId && !destinos.some(destino => destino.id === formulario.destinoId);
  const experienciaAusente = formulario.experienciaId && !experiencias.some(experiencia => experiencia.id === formulario.experienciaId);
  const actualizarItem = <K extends keyof ItemRestauranteFormulario>(indice: number, nombre: K, valor: ItemRestauranteFormulario[K]) =>
    campo('items', formulario.items.map((item, posicion) => posicion === indice ? { ...item, [nombre]: valor } : item));
  const moverItem = (indice: number, desplazamiento: number) => {
    const copia = [...formulario.items];
    const destino = indice + desplazamiento;
    if (destino < 0 || destino >= copia.length) return;
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    campo('items', copia);
  };
  return <>
    <label>Nombre de la oferta *<input required maxLength={150} value={formulario.nombre} onChange={e => campo('nombre', e.target.value)}/></label>
    <CampoLista etiqueta="Categoría *" opciones={opcionesCategoria} valor={formulario.categoria} labels={nombresCategoria} disabled={editando} cambiar={categoria => cambiar({ ...formulario, categoria, modeloPrecio: 'FIJO', destinoId: '', experienciaId: '' })}/>
    <label className="form-full">Descripción<textarea rows={3} maxLength={1000} value={formulario.descripcionOferta} onChange={e => campo('descripcionOferta', e.target.value)}/></label>
    {formulario.categoria === 'AVENTURA' && <>
      <label>Destino *<select required value={formulario.destinoId} onChange={e => cambiar({ ...formulario, destinoId: e.target.value, experienciaId: '' })}>
        <option value="">Selecciona un destino</option>{destinoAusente && <option value={formulario.destinoId}>Destino guardado no disponible en el catálogo</option>}{destinos.map(destino => <option key={destino.id} value={destino.id}>{destino.nombre}</option>)}
      </select></label>
      <label>Experiencia *<select required disabled={!formulario.destinoId || cargandoExperiencias} value={formulario.experienciaId} onChange={e => campo('experienciaId', e.target.value)}>
        <option value="">{cargandoExperiencias ? 'Cargando experiencias…' : 'Selecciona una experiencia'}</option>{experienciaAusente && <option value={formulario.experienciaId}>Experiencia guardada no disponible en el catálogo</option>}{experiencias.map(experiencia => <option key={experiencia.id} value={experiencia.id}>{experiencia.nombre}</option>)}
      </select></label>
    </>}
    <label>Precio desde<input type="number" min={0} step="any" value={formulario.precioDesde} placeholder="Consultar precio" onChange={e => campo('precioDesde', e.target.value)}/></label>
    <CampoLista etiqueta="Moneda *" opciones={monedas} valor={formulario.moneda} cambiar={moneda => campo('moneda', moneda)}/>
    <CampoLista etiqueta="Modelo de precio *" opciones={modelosPrecioPorCategoria[formulario.categoria]} valor={formulario.modeloPrecio} labels={nombresModeloPrecio} cambiar={modelo => campo('modeloPrecio', modelo)}/>
    <label>Personas incluidas<input type="number" min={1} step={1} value={formulario.personasIncluidas} onChange={e => campo('personasIncluidas', e.target.value)}/></label>
    <label>Capacidad máxima<input type="number" min={1} step={1} required={['POR_VEHICULO', 'POR_UNIDAD_Y_NOCHE', 'POR_MESA', 'POR_GRUPO'].includes(formulario.modeloPrecio)} value={formulario.capacidadMaxima} onChange={e => campo('capacidadMaxima', e.target.value)}/></label>
    {formulario.categoria !== 'TRANSPORTE' && <>
      <CampoLista etiqueta="Unidad de duración *" opciones={unidadesDuracionOferta} valor={formulario.duracionUnidad} cambiar={unidad => cambiar({ ...formulario, duracionUnidad: unidad, duracionCantidad: unidad === 'UNICO' ? '1' : formulario.duracionCantidad })}/>
      <label>Cantidad de duración *<input type="number" required min={1} step={1} disabled={formulario.duracionUnidad === 'UNICO'} value={formulario.duracionCantidad} onChange={e => campo('duracionCantidad', e.target.value)}/></label>
    </>}
    <label className="resource-reserva-check form-full"><input type="checkbox" checked={formulario.reservaRequerida} onChange={e => campo('reservaRequerida', e.target.checked)}/><span>Requiere reserva previa</span></label>
    {formulario.categoria === 'RESTAURANTE' && <>
      <CampoLista etiqueta="Tipo de oferta *" opciones={tiposOfertaRestaurante} valor={formulario.tipoOfertaRestaurante} cambiar={tipo => campo('tipoOfertaRestaurante', tipo)}/>
      <div className="form-full oferta-items"><h3>Qué incluye</h3><p>{formulario.tipoOfertaRestaurante === 'COMBO' ? 'Añade al menos dos elementos al combo.' : 'La oferta individual debe contener un elemento.'}</p>
        {formulario.items.map((item, indice) => <fieldset className="negocio-form oferta-menu-item" key={indice}><legend>Elemento {indice + 1}</legend>
          <CampoLista etiqueta="Servicio *" opciones={tiposServicioRestaurante} valor={item.tipoServicio} cambiar={tipo => actualizarItem(indice, 'tipoServicio', tipo)}/>
          <label>Nombre *<input required maxLength={150} value={item.nombre} onChange={e => actualizarItem(indice, 'nombre', e.target.value)}/></label>
          <label className="form-full">Descripción<textarea maxLength={500} rows={2} value={item.descripcion} onChange={e => actualizarItem(indice, 'descripcion', e.target.value)}/></label>
          <label>Cantidad *<input type="number" required min={1} step={1} value={item.cantidad} onChange={e => actualizarItem(indice, 'cantidad', e.target.value)}/></label>
          <div className="form-actions"><IonButton type="button" size="small" fill="clear" disabled={indice === 0} onClick={() => moverItem(indice, -1)}>Subir</IonButton><IonButton type="button" size="small" fill="clear" disabled={indice === formulario.items.length - 1} onClick={() => moverItem(indice, 1)}>Bajar</IonButton><IonButton type="button" size="small" fill="outline" onClick={() => campo('items', formulario.items.filter((_, posicion) => posicion !== indice))}>Retirar elemento</IonButton></div>
        </fieldset>)}
        <IonButton type="button" fill="outline" onClick={() => campo('items', [...formulario.items, { tipoServicio: 'DESAYUNO', nombre: '', descripcion: '', cantidad: '1' }])}>Agregar elemento</IonButton>
      </div>
    </>}
    {formulario.categoria === 'HOSPEDAJE' && <>
      <CampoLista etiqueta="Tipo de alojamiento *" opciones={tiposAlojamiento} valor={formulario.tipoAlojamiento} cambiar={valor => campo('tipoAlojamiento', valor)}/>
      <CampoLista etiqueta="Tipo de habitación *" opciones={tiposHabitacion} valor={formulario.tipoHabitacion} cambiar={valor => campo('tipoHabitacion', valor)}/>
      <label>Cantidad de camas<input type="number" min={1} step={1} value={formulario.cantidadCamas} onChange={e => campo('cantidadCamas', e.target.value)}/></label>
      <label className="resource-reserva-check"><input type="checkbox" checked={formulario.banoPrivado} onChange={e => campo('banoPrivado', e.target.checked)}/><span>Baño privado</span></label>
      <label className="resource-reserva-check"><input type="checkbox" checked={formulario.incluyeDesayuno} onChange={e => campo('incluyeDesayuno', e.target.checked)}/><span>Desayuno incluido</span></label>
    </>}
    {formulario.categoria === 'TRANSPORTE' && <>
      <CampoLista etiqueta="Tipo de servicio *" opciones={tiposServicioTransporte} valor={formulario.tipoServicioTransporte} cambiar={valor => campo('tipoServicioTransporte', valor)}/>
      <CampoLista etiqueta="Vehículo *" opciones={tiposVehiculo} valor={formulario.tipoVehiculo} cambiar={valor => campo('tipoVehiculo', valor)}/>
      <label>Origen *<input required maxLength={150} value={formulario.origen} onChange={e => campo('origen', e.target.value)}/></label>
      <label>Destino *<input required maxLength={150} value={formulario.destinoTransporte} onChange={e => campo('destinoTransporte', e.target.value)}/></label>
      <label>Trayectos predeterminados *<input type="number" required min={formulario.tipoServicioTransporte === 'IDA_Y_REGRESO' ? 2 : 1} step={1} value={formulario.trayectosPredeterminados} onChange={e => campo('trayectosPredeterminados', e.target.value)}/></label>
    </>}
    {formulario.categoria === 'GUIA' && <>
      <CampoLista etiqueta="Tipo de servicio *" opciones={tiposServicioGuia} valor={formulario.tipoServicioGuia} cambiar={valor => campo('tipoServicioGuia', valor)}/>
      <label>Idiomas *<input required maxLength={300} value={formulario.idiomas} onChange={e => campo('idiomas', e.target.value)}/></label>
      <label className="form-full">Punto de encuentro<input maxLength={200} value={formulario.puntoEncuentro} onChange={e => campo('puntoEncuentro', e.target.value)}/></label>
      <label className="resource-reserva-check form-full"><input type="checkbox" checked={formulario.incluyeEquipo} onChange={e => campo('incluyeEquipo', e.target.checked)}/><span>Equipo incluido</span></label>
    </>}
    {formulario.categoria === 'VIDA_NOCTURNA' && <>
      <CampoLista etiqueta="Tipo de servicio *" opciones={tiposServicioVidaNocturna} valor={formulario.tipoServicioVidaNocturna} cambiar={valor => campo('tipoServicioVidaNocturna', valor)}/>
      <label>Edad mínima<input type="number" min={0} step={1} value={formulario.edadMinima} onChange={e => campo('edadMinima', e.target.value)}/></label>
      <label className="resource-reserva-check form-full"><input type="checkbox" checked={formulario.incluyeConsumo} onChange={e => campo('incluyeConsumo', e.target.checked)}/><span>Incluye consumo</span></label>
      <label className="form-full">Condiciones de acceso<textarea maxLength={500} rows={3} value={formulario.condicionesAcceso} onChange={e => campo('condicionesAcceso', e.target.value)}/></label>
    </>}
  </>;
}
