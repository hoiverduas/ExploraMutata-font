import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { formatearPrecio } from '../domain/precios';
import { comercialAdminApi } from '../services/comercialAdminApi';
import { finanzasAdminApi } from '../services/finanzasAdminApi';
import { ApiError } from '../services/http';
import { negociosApi } from '../services/negociosApi';
import type {
  CargoSuscripcionResponse,
  ContratoComercialResponse,
  ModeloComercial,
  PeriodicidadSuscripcion,
  PlanComercialRequest,
  PlanComercialResponse,
} from '../types/comercial';
import type { ReglaComisionResponse } from '../types/finanzas';
import type { Moneda } from '../types/moneda';
import type { NegocioResponse } from '../types/negocio';

const modelos: ModeloComercial[] = ['GRATIS', 'SUSCRIPCION', 'COMISION', 'MIXTO'];
const periodicidades: PeriodicidadSuscripcion[] = ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'];
const monedas: Moneda[] = ['COP', 'USD', 'EUR'];

const fecha = (valor: string | null) => valor ? new Date(valor).toLocaleString('es-CO') : '—';
const texto = (valor: string) => valor.replaceAll('_', ' ').toLocaleLowerCase('es');
const estadoClase = (valor: string) =>
  ['ACTIVO', 'PAGADO'].includes(valor) ? 'activo'
    : ['PRUEBA', 'PENDIENTE'].includes(valor) ? 'borrador'
      : 'inactivo';
const cobraSuscripcion = (modelo: ModeloComercial) => modelo === 'SUSCRIPCION' || modelo === 'MIXTO';
const requiereComision = (modelo: ModeloComercial) => modelo === 'COMISION' || modelo === 'MIXTO';

const planInicial = {
  codigo: '',
  nombre: '',
  descripcion: '',
  modelo: 'GRATIS' as ModeloComercial,
  valorSuscripcion: '0',
  moneda: 'COP' as Moneda,
  periodicidad: 'MENSUAL' as PeriodicidadSuscripcion,
  diasPrueba: '0',
  activo: true,
};

export default function ComercialAdminPage() {
  const [planes, setPlanes] = useState<PlanComercialResponse[]>([]);
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [negocioId, setNegocioId] = useState('');
  const [contrato, setContrato] = useState<ContratoComercialResponse | null>(null);
  const [historial, setHistorial] = useState<ContratoComercialResponse[]>([]);
  const [cargos, setCargos] = useState<CargoSuscripcionResponse[]>([]);
  const [reglas, setReglas] = useState<ReglaComisionResponse[]>([]);
  const [planForm, setPlanForm] = useState(planInicial);
  const [planEditandoId, setPlanEditandoId] = useState<string | null>(null);
  const [contratoForm, setContratoForm] = useState({
    planComercialId: '',
    reglaComisionId: '',
    fechaInicio: '',
    renovacionAutomatica: true,
    observacion: '',
  });
  const [observacionAccion, setObservacionAccion] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [referenciasPago, setReferenciasPago] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const listarTodosLosNegocios = useCallback(async () => {
    const primera = await negociosApi.listar(0, 100);
    const lista = [...primera.contenido];
    for (let pagina = 1; pagina < primera.totalPaginas; pagina++) {
      const siguiente = await negociosApi.listar(pagina, 100);
      lista.push(...siguiente.contenido);
    }
    return [...new Map(lista.map(item => [item.id, item])).values()];
  }, []);

  const cargarBase = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const [planesDatos, negociosDatos] = await Promise.all([
        comercialAdminApi.listarPlanes(false),
        listarTodosLosNegocios(),
      ]);
      setPlanes(planesDatos);
      setNegocios(negociosDatos);
      setNegocioId(actual => actual || negociosDatos[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el modelo comercial.');
    } finally {
      setCargando(false);
    }
  }, [listarTodosLosNegocios]);

  const cargarNegocio = useCallback(async (id: string) => {
    if (!id) {
      setContrato(null); setHistorial([]); setCargos([]); setReglas([]);
      return;
    }
    setCargando(true); setError('');
    try {
      const actualPromise = comercialAdminApi.contratoActual(id)
        .catch(err => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        });
      const [actual, historico, cargosDatos, reglasDatos] = await Promise.all([
        actualPromise,
        comercialAdminApi.historialContratos(id),
        comercialAdminApi.listarCargos(id),
        finanzasAdminApi.historialComision(id),
      ]);
      setContrato(actual);
      setHistorial(historico);
      setCargos(cargosDatos);
      setReglas(reglasDatos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información comercial del negocio.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargarBase(); }, [cargarBase]);
  useEffect(() => { if (negocioId) void cargarNegocio(negocioId); }, [negocioId, cargarNegocio]);

  const planSeleccionado = useMemo(
    () => planes.find(item => item.id === contratoForm.planComercialId) ?? null,
    [planes, contratoForm.planComercialId],
  );
  const reglaVigente = useMemo(() => reglas.find(item => item.activa) ?? null, [reglas]);

  const limpiarMensajes = () => { setError(''); setMensaje(''); };

  const guardarPlan = async () => {
    if (guardando) return;
    limpiarMensajes();
    const codigo = planForm.codigo.trim();
    const nombre = planForm.nombre.trim();
    if (!codigo || !nombre) return setError('Código y nombre son obligatorios.');
    const conSuscripcion = cobraSuscripcion(planForm.modelo);
    const valor = Number(planForm.valorSuscripcion);
    const dias = Number(planForm.diasPrueba || 0);
    if (conSuscripcion && (!Number.isFinite(valor) || valor <= 0)) {
      return setError('Los planes SUSCRIPCION y MIXTO requieren un valor mayor que cero.');
    }
    if (!Number.isInteger(dias) || dias < 0 || dias > 365) {
      return setError('Los días de prueba deben estar entre 0 y 365.');
    }
    const body: PlanComercialRequest = {
      codigo,
      nombre,
      descripcion: planForm.descripcion.trim() || null,
      modelo: planForm.modelo,
      valorSuscripcion: conSuscripcion ? valor : 0,
      moneda: planForm.moneda,
      periodicidad: conSuscripcion ? planForm.periodicidad : null,
      diasPrueba: conSuscripcion ? dias : 0,
      activo: planForm.activo,
    };
    setGuardando(true);
    try {
      if (planEditandoId) await comercialAdminApi.actualizarPlan(planEditandoId, body);
      else await comercialAdminApi.crearPlan(body);
      setMensaje(planEditandoId ? 'Plan actualizado correctamente.' : 'Plan creado correctamente.');
      setPlanEditandoId(null);
      setPlanForm(planInicial);
      const actualizados = await comercialAdminApi.listarPlanes(false);
      setPlanes(actualizados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el plan.');
    } finally { setGuardando(false); }
  };

  const editarPlan = (plan: PlanComercialResponse) => {
    setPlanEditandoId(plan.id);
    setPlanForm({
      codigo: plan.codigo,
      nombre: plan.nombre,
      descripcion: plan.descripcion ?? '',
      modelo: plan.modelo,
      valorSuscripcion: String(plan.valorSuscripcion),
      moneda: plan.moneda,
      periodicidad: plan.periodicidad ?? 'MENSUAL',
      diasPrueba: String(plan.diasPrueba ?? 0),
      activo: plan.activo,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const asignarContrato = async () => {
    if (!negocioId || !planSeleccionado || guardando) return;
    limpiarMensajes();
    if (requiereComision(planSeleccionado.modelo) && !contratoForm.reglaComisionId) {
      return setError('El plan seleccionado requiere una regla de comisión vigente.');
    }
    setGuardando(true);
    try {
      await comercialAdminApi.asignarContrato(negocioId, {
        planComercialId: planSeleccionado.id,
        reglaComisionId: requiereComision(planSeleccionado.modelo) ? contratoForm.reglaComisionId : null,
        fechaInicio: contratoForm.fechaInicio ? new Date(contratoForm.fechaInicio).toISOString() : null,
        renovacionAutomatica: contratoForm.renovacionAutomatica,
        observacion: contratoForm.observacion.trim() || null,
      });
      setMensaje('Contrato comercial asignado. El contrato anterior, si existía, quedó cerrado.');
      setContratoForm(v => ({ ...v, observacion: '', fechaInicio: '' }));
      await cargarNegocio(negocioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar el contrato.');
    } finally { setGuardando(false); }
  };

  const cambiarEstado = async (accion: 'activar' | 'suspender' | 'cancelar') => {
    if (!contrato || guardando) return;
    limpiarMensajes();
    setGuardando(true);
    try {
      const body = { observacion: observacionAccion.trim() || null };
      if (accion === 'activar') await comercialAdminApi.activarContrato(contrato.id, body);
      if (accion === 'suspender') await comercialAdminApi.suspenderContrato(contrato.id, body);
      if (accion === 'cancelar') await comercialAdminApi.cancelarContrato(contrato.id, body);
      setObservacionAccion('');
      setMensaje('Estado del contrato actualizado.');
      await cargarNegocio(negocioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del contrato.');
    } finally { setGuardando(false); }
  };

  const generarCargo = async () => {
    if (!contrato || guardando) return;
    limpiarMensajes(); setGuardando(true);
    try {
      await comercialAdminApi.generarCargo(contrato.id, {
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento).toISOString() : null,
      });
      setFechaVencimiento('');
      setMensaje('Cargo de suscripción generado.');
      await cargarNegocio(negocioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el cargo.');
    } finally { setGuardando(false); }
  };

  const pagarCargo = async (cargo: CargoSuscripcionResponse) => {
    if (guardando) return;
    limpiarMensajes(); setGuardando(true);
    try {
      await comercialAdminApi.pagarCargo(cargo.id, {
        referenciaPago: referenciasPago[cargo.id]?.trim() || null,
        observacion: observacionAccion.trim() || null,
      });
      setMensaje('Cargo marcado como pagado.');
      await cargarNegocio(negocioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pago del cargo.');
    } finally { setGuardando(false); }
  };

  const anularCargo = async (cargo: CargoSuscripcionResponse) => {
    if (guardando) return;
    limpiarMensajes(); setGuardando(true);
    try {
      await comercialAdminApi.anularCargo(cargo.id, { observacion: observacionAccion.trim() || null });
      setMensaje('Cargo anulado.');
      await cargarNegocio(negocioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo anular el cargo.');
    } finally { setGuardando(false); }
  };

  return <IonPage><BrandHeader title="Modelo comercial" mostrarGestion={false}/><IonContent fullscreen>
    <main className="page-width gestion-page">
      <div className="gestion-heading"><div>
        <span className="eyebrow">ADMINISTRACIÓN · MODELO COMERCIAL</span>
        <h1>Planes, contratos y <em>suscripciones.</em></h1>
        <p>Gestiona GRATIS, SUSCRIPCIÓN, COMISIÓN y MIXTO sin duplicar la lógica financiera.</p>
      </div><IonButton fill="outline" disabled={cargando || guardando} onClick={() => void cargarBase()}>Actualizar</IonButton></div>

      {mensaje && <div className="notice-success" role="status">{mensaje}</div>}
      {error && <div className="notice-error" role="alert">{error}</div>}
      {cargando && <div className="loading-state"><IonSpinner/> Consultando modelo comercial…</div>}

      <section className="gestion-form-panel">
        <div className="gestion-form-heading"><div><h2>{planEditandoId ? 'Editar plan comercial' : 'Crear plan comercial'}</h2><p>Los planes de comisión usan la regla financiera vigente del negocio.</p></div></div>
        <div className="negocio-form">
          <label>Código<input maxLength={50} value={planForm.codigo} onChange={e => setPlanForm(v => ({ ...v, codigo: e.target.value }))}/></label>
          <label>Nombre<input maxLength={120} value={planForm.nombre} onChange={e => setPlanForm(v => ({ ...v, nombre: e.target.value }))}/></label>
          <label>Modelo<select value={planForm.modelo} onChange={e => setPlanForm(v => ({ ...v, modelo: e.target.value as ModeloComercial }))}>{modelos.map(item => <option key={item} value={item}>{texto(item)}</option>)}</select></label>
          <label>Moneda<select value={planForm.moneda} onChange={e => setPlanForm(v => ({ ...v, moneda: e.target.value as Moneda }))}>{monedas.map(item => <option key={item}>{item}</option>)}</select></label>
          {cobraSuscripcion(planForm.modelo) && <>
            <label>Valor de suscripción<input type="number" min="0.01" step="0.01" value={planForm.valorSuscripcion} onChange={e => setPlanForm(v => ({ ...v, valorSuscripcion: e.target.value }))}/></label>
            <label>Periodicidad<select value={planForm.periodicidad} onChange={e => setPlanForm(v => ({ ...v, periodicidad: e.target.value as PeriodicidadSuscripcion }))}>{periodicidades.map(item => <option key={item}>{texto(item)}</option>)}</select></label>
            <label>Días de prueba<input type="number" min={0} max={365} step={1} value={planForm.diasPrueba} onChange={e => setPlanForm(v => ({ ...v, diasPrueba: e.target.value }))}/></label>
          </>}
          <label>Descripción<textarea maxLength={600} value={planForm.descripcion} onChange={e => setPlanForm(v => ({ ...v, descripcion: e.target.value }))}/></label>
          <label><input type="checkbox" checked={planForm.activo} onChange={e => setPlanForm(v => ({ ...v, activo: e.target.checked }))}/> Plan activo</label>
          <div className="form-actions"><IonButton disabled={guardando} onClick={() => void guardarPlan()}>{planEditandoId ? 'Guardar cambios' : 'Crear plan'}</IonButton>{planEditandoId && <IonButton fill="outline" disabled={guardando} onClick={() => { setPlanEditandoId(null); setPlanForm(planInicial); }}>Cancelar edición</IonButton>}</div>
        </div>
        <div className="negocios-list">{planes.map(plan => <article className="negocio-row" key={plan.id}><div>
          <h3>{plan.nombre} · {plan.codigo}</h3>
          <p>{texto(plan.modelo)}{cobraSuscripcion(plan.modelo) ? ' · ' + formatearPrecio(plan.valorSuscripcion, plan.moneda) + ' · ' + texto(plan.periodicidad ?? '') : ''}{plan.diasPrueba ? ' · ' + plan.diasPrueba + ' días de prueba' : ''}</p>
          {plan.descripcion && <p>{plan.descripcion}</p>}
        </div><div className="negocio-row-actions"><span className={'status-pill status-' + (plan.activo ? 'activo' : 'inactivo')}>{plan.activo ? 'Activo' : 'Inactivo'}</span><IonButton size="small" fill="outline" onClick={() => editarPlan(plan)}>Editar</IonButton></div></article>)}
          {!planes.length && <p className="empty-state">No hay planes comerciales creados.</p>}
        </div>
      </section>

      <section className="gestion-form-panel">
        <h2>Contrato comercial por negocio</h2>
        <div className="negocio-form">
          <label>Negocio<select value={negocioId} onChange={e => setNegocioId(e.target.value)}><option value="">Selecciona un negocio</option>{negocios.map(item => <option key={item.id} value={item.id}>{item.nombreComercial}</option>)}</select></label>
        </div>
        {negocioId && <>
          {contrato ? <article className="negocio-row"><div>
            <h3>{contrato.planNombre} · {texto(contrato.modeloSnapshot)}</h3>
            <p>{formatearPrecio(contrato.valorSuscripcionSnapshot, contrato.monedaSnapshot)}{contrato.periodicidadSnapshot ? ' · ' + texto(contrato.periodicidadSnapshot) : ''} · inicio {fecha(contrato.fechaInicio)}</p>
            {contrato.fechaFinPrueba && <p>Prueba hasta {fecha(contrato.fechaFinPrueba)}</p>}
            {contrato.periodoActualDesde && <p>Período actual: {fecha(contrato.periodoActualDesde)} → {fecha(contrato.periodoActualHasta)}</p>}
            <p>Renovación automática: {contrato.renovacionAutomatica ? 'sí' : 'no'}{contrato.observacion ? ' · ' + contrato.observacion : ''}</p>
          </div><span className={'status-pill status-' + estadoClase(contrato.estado)}>{texto(contrato.estado)}</span></article> : <p className="empty-state">Este negocio todavía no tiene contrato comercial vigente.</p>}

          <div className="negocio-form">
            <label>Plan<select value={contratoForm.planComercialId} onChange={e => setContratoForm(v => ({ ...v, planComercialId: e.target.value, reglaComisionId: '' }))}><option value="">Selecciona un plan activo</option>{planes.filter(p => p.activo).map(plan => <option key={plan.id} value={plan.id}>{plan.nombre} · {texto(plan.modelo)}</option>)}</select></label>
            {planSeleccionado && requiereComision(planSeleccionado.modelo) && <label>Regla de comisión vigente<select value={contratoForm.reglaComisionId} onChange={e => setContratoForm(v => ({ ...v, reglaComisionId: e.target.value }))}><option value="">Selecciona la regla vigente</option>{reglas.filter(r => r.activa).map(regla => <option key={regla.id} value={regla.id}>{regla.tipo === 'PORCENTAJE' ? String(regla.porcentaje ?? 0) + '%' : formatearPrecio(regla.valorFijo ?? 0, regla.moneda)}</option>)}</select><small>{!reglaVigente && <>No hay regla vigente. <Link to="/gestion/finanzas">Configúrala en Finanzas</Link>.</>}</small></label>}
            <label>Fecha de inicio<input type="datetime-local" value={contratoForm.fechaInicio} onChange={e => setContratoForm(v => ({ ...v, fechaInicio: e.target.value }))}/></label>
            <label><input type="checkbox" checked={contratoForm.renovacionAutomatica} onChange={e => setContratoForm(v => ({ ...v, renovacionAutomatica: e.target.checked }))}/> Renovación automática</label>
            <label>Observación<textarea maxLength={600} value={contratoForm.observacion} onChange={e => setContratoForm(v => ({ ...v, observacion: e.target.value }))}/></label>
            <div className="form-actions"><IonButton disabled={guardando || !planSeleccionado} onClick={() => void asignarContrato()}>{contrato ? 'Cambiar plan / crear nuevo contrato' : 'Asignar contrato'}</IonButton></div>
          </div>

          {contrato && <div className="negocio-form">
            <label>Observación para acciones<textarea maxLength={600} value={observacionAccion} onChange={e => setObservacionAccion(e.target.value)}/></label>
            <div className="form-actions">
              {contrato.estado === 'SUSPENDIDO' && <IonButton disabled={guardando} onClick={() => void cambiarEstado('activar')}>Activar</IonButton>}
              {['ACTIVO', 'PRUEBA'].includes(contrato.estado) && <IonButton fill="outline" disabled={guardando} onClick={() => void cambiarEstado('suspender')}>Suspender</IonButton>}
              {!['CANCELADO', 'VENCIDO'].includes(contrato.estado) && <IonButton fill="outline" color="danger" disabled={guardando} onClick={() => void cambiarEstado('cancelar')}>Cancelar</IonButton>}
            </div>
          </div>}
        </>}
      </section>

      <section className="gestion-form-panel"><h2>Historial contractual</h2>
        <div className="negocios-list">{historial.map(item => <article className="negocio-row" key={item.id}><div><h3>{item.planNombre} · {texto(item.modeloSnapshot)}</h3><p>{fecha(item.fechaInicio)} → {fecha(item.fechaFin)}</p>{item.observacion && <p>{item.observacion}</p>}</div><span className={'status-pill status-' + estadoClase(item.estado)}>{texto(item.estado)}</span></article>)}{negocioId && !historial.length && <p className="empty-state">Sin historial contractual.</p>}</div>
      </section>

      <section className="gestion-form-panel"><h2>Cargos de suscripción</h2>
        {contrato && cobraSuscripcion(contrato.modeloSnapshot) && <div className="negocio-form">
          <label>Vencimiento opcional<input type="datetime-local" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)}/></label>
          <div className="form-actions"><IonButton disabled={guardando || contrato.estado !== 'ACTIVO'} onClick={() => void generarCargo()}>Generar cargo del período actual</IonButton></div>
        </div>}
        <div className="negocios-list">{cargos.map(cargo => <article className="negocio-row" key={cargo.id}><div>
          <h3>{formatearPrecio(cargo.monto, cargo.moneda)}</h3>
          <p>{fecha(cargo.periodoDesde)} → {fecha(cargo.periodoHasta)} · vence {fecha(cargo.fechaVencimiento)}</p>
          {cargo.referenciaPago && <p>Referencia: {cargo.referenciaPago}</p>}{cargo.observacion && <p>{cargo.observacion}</p>}
          {cargo.estado !== 'PAGADO' && cargo.estado !== 'ANULADO' && <label>Referencia de pago<input maxLength={180} value={referenciasPago[cargo.id] ?? ''} onChange={e => setReferenciasPago(v => ({ ...v, [cargo.id]: e.target.value }))}/></label>}
        </div><div className="negocio-row-actions"><span className={'status-pill status-' + estadoClase(cargo.estado)}>{texto(cargo.estado)}</span>{cargo.estado !== 'PAGADO' && cargo.estado !== 'ANULADO' && <><IonButton size="small" disabled={guardando} onClick={() => void pagarCargo(cargo)}>Marcar pagado</IonButton><IonButton size="small" fill="outline" color="danger" disabled={guardando} onClick={() => void anularCargo(cargo)}>Anular</IonButton></>}</div></article>)}{negocioId && !cargos.length && <p className="empty-state">No hay cargos de suscripción para este negocio.</p>}</div>
      </section>
    </main>
  </IonContent></IonPage>;
}
