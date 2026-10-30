import { IonButton, IonSpinner } from '@ionic/react';
import { useState } from 'react';
import { formatearPrecio } from '../domain/precios';
import { configuracionComercialOfertaApi } from '../services/configuracionComercialOfertaApi';
import type {
  ModoPromocion,
  OfertaTarifaRequest,
  OfertaTarifaResponse,
  OfertaVarianteResponse,
  TipoDescuentoPromocion,
} from '../types/configuracionComercialOferta';
import type { OfertaNegocioResponse } from '../types/oferta';

const dias = [
  { id: 1, nombre: 'Lun' }, { id: 2, nombre: 'Mar' }, { id: 3, nombre: 'Mié' },
  { id: 4, nombre: 'Jue' }, { id: 5, nombre: 'Vie' }, { id: 6, nombre: 'Sáb' }, { id: 7, nombre: 'Dom' },
];

interface FormularioPromocion {
  nombre: string;
  descripcion: string;
  varianteId: string;
  modoPromocion: ModoPromocion;
  codigoPromocion: string;
  tipoDescuentoPromocion: TipoDescuentoPromocion;
  precio: string;
  valorDescuentoPromocion: string;
  minimoPersonas: string;
  maximoPersonas: string;
  fechaDesde: string;
  fechaHasta: string;
  diasSemana: number[];
  prioridad: string;
}

const inicial = (): FormularioPromocion => ({
  nombre: '',
  descripcion: '',
  varianteId: '',
  modoPromocion: 'AUTOMATICA',
  codigoPromocion: '',
  tipoDescuentoPromocion: 'PORCENTAJE',
  precio: '',
  valorDescuentoPromocion: '',
  minimoPersonas: '1',
  maximoPersonas: '',
  fechaDesde: '',
  fechaHasta: '',
  diasSemana: [],
  prioridad: '200',
});

const numeroOpcional = (valor: string) => valor.trim() === '' ? null : Number(valor);
const texto = (valor: string) => valor.replaceAll('_', ' ').toLocaleLowerCase('es');

export default function GestionPromocionesOferta({ negocioId, oferta }: { negocioId: string; oferta: OfertaNegocioResponse }) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [promociones, setPromociones] = useState<OfertaTarifaResponse[]>([]);
  const [variantes, setVariantes] = useState<OfertaVarianteResponse[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioPromocion>(inicial);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const [tarifas, publica] = await Promise.all([
        configuracionComercialOfertaApi.listarTarifas(negocioId, oferta.id),
        configuracionComercialOfertaApi.obtenerPublica(oferta.id),
      ]);
      setPromociones(tarifas.filter(item => item.tipo === 'PROMOCION'));
      setVariantes(publica.variantes.filter(item => item.estado === 'ACTIVA'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron consultar las promociones.');
    } finally {
      setCargando(false);
    }
  };

  const abrir = () => {
    const siguiente = !abierto;
    setAbierto(siguiente); setError(''); setMensaje('');
    if (siguiente) void cargar();
  };

  const cambiarDia = (dia: number) => setFormulario(actual => ({
    ...actual,
    diasSemana: actual.diasSemana.includes(dia)
      ? actual.diasSemana.filter(item => item !== dia)
      : [...actual.diasSemana, dia].sort(),
  }));

  const limpiar = () => {
    setFormulario(inicial());
    setEditandoId(null);
    setError('');
  };

  const editar = (item: OfertaTarifaResponse) => {
    setEditandoId(item.id);
    setFormulario({
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      varianteId: item.varianteId ?? '',
      modoPromocion: item.modoPromocion ?? 'AUTOMATICA',
      codigoPromocion: item.codigoPromocion ?? '',
      tipoDescuentoPromocion: item.tipoDescuentoPromocion ?? 'PRECIO_ESPECIAL',
      precio: item.precio == null ? '' : String(item.precio),
      valorDescuentoPromocion: item.valorDescuentoPromocion == null ? '' : String(item.valorDescuentoPromocion),
      minimoPersonas: item.minimoPersonas == null ? '1' : String(item.minimoPersonas),
      maximoPersonas: item.maximoPersonas == null ? '' : String(item.maximoPersonas),
      fechaDesde: item.fechaDesde ?? '',
      fechaHasta: item.fechaHasta ?? '',
      diasSemana: item.diasSemana ?? [],
      prioridad: item.prioridad == null ? '200' : String(item.prioridad),
    });
  };

  const guardar = async () => {
    if (guardando) return;
    setError(''); setMensaje('');
    const nombre = formulario.nombre.trim();
    if (!nombre || nombre.length > 150) return setError('Indica un nombre de promoción de máximo 150 caracteres.');
    if (formulario.descripcion.length > 1000) return setError('La descripción admite hasta 1000 caracteres.');
    if (formulario.fechaDesde && formulario.fechaHasta && formulario.fechaHasta < formulario.fechaDesde) {
      return setError('La fecha final no puede ser anterior a la fecha inicial.');
    }

    const minimo = numeroOpcional(formulario.minimoPersonas);
    const maximo = numeroOpcional(formulario.maximoPersonas);
    if (minimo !== null && (!Number.isSafeInteger(minimo) || minimo < 1)) return setError('El mínimo de personas debe ser un entero mayor o igual a uno.');
    if (maximo !== null && (!Number.isSafeInteger(maximo) || maximo < 1)) return setError('El máximo de personas debe ser un entero mayor o igual a uno.');
    if (minimo !== null && maximo !== null && minimo > maximo) return setError('El mínimo de personas no puede superar el máximo.');

    const prioridad = numeroOpcional(formulario.prioridad);
    if (prioridad !== null && !Number.isSafeInteger(prioridad)) return setError('La prioridad debe ser un número entero.');

    let precio: number | null = null;
    let valorDescuento: number | null = null;
    if (formulario.tipoDescuentoPromocion === 'PRECIO_ESPECIAL') {
      precio = numeroOpcional(formulario.precio);
      if (precio === null || !Number.isFinite(precio) || precio < 0) return setError('Indica el precio especial de la promoción.');
    } else {
      valorDescuento = numeroOpcional(formulario.valorDescuentoPromocion);
      if (valorDescuento === null || !Number.isFinite(valorDescuento) || valorDescuento <= 0) return setError('Indica el valor del descuento.');
      if (formulario.tipoDescuentoPromocion === 'PORCENTAJE' && valorDescuento > 100) return setError('El porcentaje no puede superar 100.');
    }

    const codigo = formulario.codigoPromocion.trim().toUpperCase();
    if (formulario.modoPromocion === 'CODIGO' && !codigo) return setError('Las promociones por código requieren un código.');
    if (codigo && !/^[A-Z0-9_-]+$/.test(codigo)) return setError('El código solo puede usar letras, números, guion y guion bajo.');

    const body: OfertaTarifaRequest = {
      varianteId: formulario.varianteId || null,
      nombre,
      descripcion: formulario.descripcion.trim() || null,
      tipo: 'PROMOCION',
      precio,
      modeloPrecio: null,
      minimoPersonas: minimo,
      maximoPersonas: maximo,
      fechaDesde: formulario.fechaDesde || null,
      fechaHasta: formulario.fechaHasta || null,
      diasSemana: formulario.diasSemana,
      prioridad,
      modoPromocion: formulario.modoPromocion,
      codigoPromocion: formulario.modoPromocion === 'CODIGO' ? codigo : null,
      tipoDescuentoPromocion: formulario.tipoDescuentoPromocion,
      valorDescuentoPromocion: valorDescuento,
    };

    setGuardando(true);
    try {
      if (editandoId) {
        await configuracionComercialOfertaApi.actualizarTarifa(negocioId, oferta.id, editandoId, body);
        setMensaje('Promoción actualizada.');
      } else {
        await configuracionComercialOfertaApi.crearTarifa(negocioId, oferta.id, body);
        setMensaje('Promoción creada.');
      }
      limpiar();
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la promoción.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (item: OfertaTarifaResponse) => {
    if (guardando) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      if (item.estado === 'ACTIVA') {
        await configuracionComercialOfertaApi.desactivarTarifa(negocioId, oferta.id, item.id);
        setMensaje('Promoción desactivada.');
      } else {
        await configuracionComercialOfertaApi.activarTarifa(negocioId, oferta.id, item.id);
        setMensaje('Promoción activada.');
      }
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado de la promoción.');
    } finally {
      setGuardando(false);
    }
  };

  const resumenDescuento = (item: OfertaTarifaResponse) => {
    if (item.tipoDescuentoPromocion === 'PORCENTAJE') return String(item.valorDescuentoPromocion ?? 0) + '% de descuento';
    if (item.tipoDescuentoPromocion === 'VALOR_FIJO') return formatearPrecio(item.valorDescuentoPromocion ?? 0, oferta.moneda) + ' de descuento';
    return 'Precio especial ' + formatearPrecio(item.precio ?? 0, oferta.moneda);
  };

  return <div className="agenda-oferta">
    <IonButton size="small" fill="outline" disabled={guardando} onClick={abrir}>{abierto ? 'Ocultar promociones' : 'Promociones'}</IonButton>
    {abierto && <section className="gestion-form-panel">
      <div className="gestion-form-heading"><div><h3>Promociones de la oferta</h3><p>Configura promociones automáticas o por código. Aplica también a ofertas de aventura.</p></div></div>
      {cargando ? <div className="loading-state"><IonSpinner/> Consultando promociones…</div> : <>
        {mensaje && <div className="notice-success" role="status">{mensaje}</div>}
        {error && <div className="notice-error" role="alert">{error}</div>}
        <div className="negocio-form">
          <label>Nombre<input maxLength={150} value={formulario.nombre} onChange={e => setFormulario(v => ({ ...v, nombre: e.target.value }))}/></label>
          <label>Aplicación<select value={formulario.modoPromocion} onChange={e => setFormulario(v => ({ ...v, modoPromocion: e.target.value as ModoPromocion, codigoPromocion: e.target.value === 'AUTOMATICA' ? '' : v.codigoPromocion }))}><option value="AUTOMATICA">Automática</option><option value="CODIGO">Código promocional</option></select></label>
          {formulario.modoPromocion === 'CODIGO' && <label>Código<input maxLength={50} value={formulario.codigoPromocion} onChange={e => setFormulario(v => ({ ...v, codigoPromocion: e.target.value.toUpperCase() }))} placeholder="AVENTURA20"/></label>}
          <label>Tipo de descuento<select value={formulario.tipoDescuentoPromocion} onChange={e => setFormulario(v => ({ ...v, tipoDescuentoPromocion: e.target.value as TipoDescuentoPromocion }))}><option value="PORCENTAJE">Porcentaje</option><option value="VALOR_FIJO">Valor fijo</option><option value="PRECIO_ESPECIAL">Precio especial</option></select></label>
          {formulario.tipoDescuentoPromocion === 'PRECIO_ESPECIAL'
            ? <label>Precio especial<input type="number" min={0} step="0.01" value={formulario.precio} onChange={e => setFormulario(v => ({ ...v, precio: e.target.value }))}/></label>
            : <label>{formulario.tipoDescuentoPromocion === 'PORCENTAJE' ? 'Porcentaje' : 'Valor de descuento'}<input type="number" min="0.0001" max={formulario.tipoDescuentoPromocion === 'PORCENTAJE' ? 100 : undefined} step="0.01" value={formulario.valorDescuentoPromocion} onChange={e => setFormulario(v => ({ ...v, valorDescuentoPromocion: e.target.value }))}/></label>}
          {variantes.length > 0 && <label>Variante (opcional)<select value={formulario.varianteId} onChange={e => setFormulario(v => ({ ...v, varianteId: e.target.value }))}><option value="">Toda la oferta</option>{variantes.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>}
          <label>Mínimo de personas<input type="number" min={1} step={1} value={formulario.minimoPersonas} onChange={e => setFormulario(v => ({ ...v, minimoPersonas: e.target.value }))}/></label>
          <label>Máximo de personas (opcional)<input type="number" min={1} step={1} value={formulario.maximoPersonas} onChange={e => setFormulario(v => ({ ...v, maximoPersonas: e.target.value }))}/></label>
          <label>Desde<input type="date" value={formulario.fechaDesde} onChange={e => setFormulario(v => ({ ...v, fechaDesde: e.target.value }))}/></label>
          <label>Hasta<input type="date" min={formulario.fechaDesde || undefined} value={formulario.fechaHasta} onChange={e => setFormulario(v => ({ ...v, fechaHasta: e.target.value }))}/></label>
          <label>Prioridad<input type="number" step={1} value={formulario.prioridad} onChange={e => setFormulario(v => ({ ...v, prioridad: e.target.value }))}/></label>
          <label className="form-full">Descripción<textarea maxLength={1000} value={formulario.descripcion} onChange={e => setFormulario(v => ({ ...v, descripcion: e.target.value }))}/></label>
          <div className="form-full"><span>Días de la semana (vacío = todos)</span><div className="chip-filter">{dias.map(dia => <IonButton key={dia.id} type="button" size="small" fill={formulario.diasSemana.includes(dia.id) ? 'solid' : 'outline'} onClick={() => cambiarDia(dia.id)}>{dia.nombre}</IonButton>)}</div></div>
          <div className="form-actions"><IonButton size="small" disabled={guardando} onClick={() => void guardar()}>{editandoId ? 'Guardar cambios' : 'Crear promoción'}</IonButton>{editandoId && <IonButton size="small" fill="outline" disabled={guardando} onClick={limpiar}>Cancelar edición</IonButton>}</div>
        </div>

        <div className="negocios-list">{promociones.map(item => <article className="negocio-row" key={item.id}><div>
          <h4>{item.nombre}</h4>
          <p>{resumenDescuento(item)} · {item.modoPromocion === 'CODIGO' ? 'Código ' + (item.codigoPromocion ?? '') : 'Automática'} · prioridad {item.prioridad ?? 0}</p>
          {(item.fechaDesde || item.fechaHasta) && <p>Vigencia: {item.fechaDesde ?? 'sin inicio'} → {item.fechaHasta ?? 'sin fin'}</p>}
          {(item.minimoPersonas || item.maximoPersonas) && <p>Personas: {item.minimoPersonas ?? 1}{item.maximoPersonas ? ' a ' + item.maximoPersonas : ' o más'}</p>}
          {item.descripcion && <p>{item.descripcion}</p>}
        </div><div className="negocio-row-actions"><span className={'status-pill status-' + (item.estado === 'ACTIVA' ? 'activo' : 'inactivo')}>{texto(item.estado)}</span><IonButton size="small" fill="outline" disabled={guardando} onClick={() => editar(item)}>Editar</IonButton><IonButton size="small" fill="outline" disabled={guardando} onClick={() => void cambiarEstado(item)}>{item.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'}</IonButton></div></article>)}
          {!promociones.length && <p className="empty-state">Esta oferta todavía no tiene promociones configuradas.</p>}
        </div>
      </>}
    </section>}
  </div>;
}
