import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import { formatearPrecio } from '../domain/precios';
import { finanzasAdminApi } from '../services/finanzasAdminApi';
import { ApiError } from '../services/http';
import { negociosApi } from '../services/negociosApi';
import type {
  ConciliacionResponse, CuentaPagoNegocioResponse, DiagnosticoWompiPagosTerceros, DispersionPagoResponse,
  DistribucionPagoResponse, EstadoCuentaPago, LiquidacionResponse, ReembolsoResponse,
  ReglaComisionResponse, TipoReglaComision, WompiCuentaOrigen,
} from '../types/finanzas';
import type { NegocioResponse } from '../types/negocio';

const estadosCuenta: Array<EstadoCuentaPago | ''> = ['', 'PENDIENTE_VERIFICACION', 'ACTIVA', 'RECHAZADA', 'INACTIVA'];
const estadoTexto = (valor: string) => valor.replaceAll('_', ' ').toLocaleLowerCase('es');
const fecha = (valor: string | null) => valor ? new Date(valor).toLocaleString('es-CO') : '—';

const contarElementosWompi = (valor: unknown): number => {
  if (Array.isArray(valor)) return valor.length;
  if (!valor || typeof valor !== 'object') return 0;
  const obj = valor as Record<string, unknown>;
  for (const clave of ['data', 'items', 'banks', 'results', 'content']) {
    const cantidad = contarElementosWompi(obj[clave]);
    if (cantidad > 0) return cantidad;
  }
  return 0;
};

const nombreCuentaOrigen = (cuenta: WompiCuentaOrigen) =>
  cuenta.id === 'WOMPI_ACCOUNT' ? 'Wompi Cuenta' : (cuenta.bank?.name || 'Cuenta origen');

const referenciaCuentaOrigen = (cuenta: WompiCuentaOrigen) => {
  if (cuenta.id === 'WOMPI_ACCOUNT') return 'Cuenta virtual de Wompi';
  if (!cuenta.number) return 'Número no informado';
  return cuenta.number.length <= 4 ? cuenta.number : `••••${cuenta.number.slice(-4)}`;
};

const saldoCuentaOrigen = (cuenta: WompiCuentaOrigen) =>
  cuenta.balanceInCents == null ? 'Saldo no informado' : formatearPrecio(cuenta.balanceInCents / 100, 'COP');

const descripcionTipoDestino = (cuenta: CuentaPagoNegocioResponse) =>
  cuenta.tipoDestino === 'DEPOSITO_ELECTRONICO'
    ? 'depósito electrónico'
    : estadoTexto(cuenta.tipoCuentaWompi);

export default function FinanzasAdminPage() {
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [negocioId, setNegocioId] = useState('');
  const [cuentas, setCuentas] = useState<CuentaPagoNegocioResponse[]>([]);
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuentaPago | ''>('');
  const [reglas, setReglas] = useState<ReglaComisionResponse[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionResponse[]>([]);
  const [dispersiones, setDispersiones] = useState<Record<string, DispersionPagoResponse[]>>({});
  const [conciliaciones, setConciliaciones] = useState<ConciliacionResponse[]>([]);
  const [distribuciones, setDistribuciones] = useState<DistribucionPagoResponse[]>([]);
  const [reembolsos, setReembolsos] = useState<ReembolsoResponse[]>([]);
  const [pagoId, setPagoId] = useState('');
  const [diagnostico, setDiagnostico] = useState<DiagnosticoWompiPagosTerceros | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [comision, setComision] = useState({ tipo: 'PORCENTAJE' as TipoReglaComision, valor: '10', observacion: '' });
  const [liquidacionObs, setLiquidacionObs] = useState('');
  const [reembolso, setReembolso] = useState({ monto: '', motivo: '' });
  const [conciliacion, setConciliacion] = useState({
    desde: '', hasta: '', totalProveedor: '', cantidadProveedor: '', observacion: '',
  });

  const cargarNegocios = useCallback(async () => {
    const primera = await negociosApi.listar(0, 100);
    const lista = [...primera.contenido];
    for (let pagina = 1; pagina < primera.totalPaginas; pagina++) {
      const otra = await negociosApi.listar(pagina, 100);
      lista.push(...otra.contenido);
    }
    const unicos = [...new Map(lista.map(item => [item.id, item])).values()];
    setNegocios(unicos);
    setNegocioId(actual => actual || unicos[0]?.id || '');
  }, []);

  const cargarBase = useCallback(async () => {
    const [cuentasDatos, liquidacionesDatos, conciliacionesDatos] = await Promise.all([
      finanzasAdminApi.listarCuentas(estadoCuenta || undefined),
      finanzasAdminApi.listarLiquidaciones(),
      finanzasAdminApi.listarConciliaciones(),
    ]);
    setCuentas(cuentasDatos);
    setLiquidaciones(liquidacionesDatos);
    setConciliaciones(conciliacionesDatos);
  }, [estadoCuenta]);

  useEffect(() => {
    let vivo = true;
    setCargando(true); setError('');
    void Promise.all([cargarNegocios(), cargarBase()]).catch(err => {
      if (vivo) setError(err instanceof Error ? err.message : 'No se pudo cargar la administración financiera.');
    }).finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [cargarNegocios, cargarBase]);

  useEffect(() => {
    if (!negocioId) { setReglas([]); return; }
    let vivo = true;
    void finanzasAdminApi.historialComision(negocioId)
      .then(datos => { if (vivo) setReglas(datos); })
      .catch(err => { if (vivo) setError(err instanceof Error ? err.message : 'No se pudo cargar el historial de comisión.'); });
    return () => { vivo = false; };
  }, [negocioId]);

  const ejecutar = async (accion: () => Promise<unknown>, exito: string, recargar = true) => {
    if (guardando) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      await accion();
      setMensaje(exito);
      if (recargar) await cargarBase();
      if (negocioId) setReglas(await finanzasAdminApi.historialComision(negocioId));
    } catch (err) {
      const texto = err instanceof Error ? err.message : 'No se pudo completar la operación.';
      setError(err instanceof ApiError && err.status === 503
        ? `${texto} Si la operación usa Pagos a Terceros, verifica que Wompi ya haya activado el producto y sus llaves.`
        : texto);
    } finally { setGuardando(false); }
  };

  const verificar = (cuenta: CuentaPagoNegocioResponse) => {
    const observacion = window.prompt('Observación de verificación (opcional):', cuenta.observacionVerificacion ?? '');
    if (observacion === null) return;
    void ejecutar(
      () => finanzasAdminApi.verificarCuenta(cuenta.id, cuenta.identificadorBeneficiarioProveedor, observacion.trim() || null),
      'Cuenta de pago verificada.',
    );
  };

  const rechazar = (cuenta: CuentaPagoNegocioResponse) => {
    const motivo = window.prompt('Motivo del rechazo (mínimo 5 caracteres):', '');
    if (motivo === null || motivo.trim().length < 5) return setError('El motivo debe tener al menos 5 caracteres.');
    void ejecutar(() => finanzasAdminApi.rechazarCuenta(cuenta.id, motivo.trim()), 'Cuenta de pago rechazada.');
  };

  const guardarComision = () => {
    if (!negocioId) return;
    const valor = Number(comision.valor);
    if (!Number.isFinite(valor) || valor < 0 || (comision.tipo === 'PORCENTAJE' && valor > 100)) return setError('Revisa el valor de la comisión.');
    void ejecutar(() => finanzasAdminApi.configurarComision(negocioId, {
      tipo: comision.tipo,
      porcentaje: comision.tipo === 'PORCENTAJE' ? valor : null,
      valorFijo: comision.tipo === 'VALOR_FIJO' ? valor : null,
      moneda: 'COP',
      observacion: comision.observacion.trim() || null,
    }), 'Regla de comisión actualizada.');
  };

  const crearLiquidacion = () => {
    if (!negocioId) return;
    void ejecutar(() => finanzasAdminApi.crearLiquidacion(negocioId, liquidacionObs), 'Liquidación creada.');
  };

  const verDispersiones = async (id: string) => {
    try {
      const datos = await finanzasAdminApi.listarDispersiones(id);
      setDispersiones(actual => ({ ...actual, [id]: datos }));
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron consultar las dispersiones.'); }
  };

  const enviarWompi = (id: string) => {
    if (!window.confirm('¿Enviar esta liquidación por Wompi Pagos a Terceros?')) return;
    void ejecutar(async () => {
      const dispersion = await finanzasAdminApi.enviarLiquidacionWompi(id);
      setDispersiones(actual => ({ ...actual, [id]: [dispersion, ...(actual[id] ?? [])] }));
    }, 'La dispersión fue enviada a Wompi.');
  };

  const sincronizar = (dispersion: DispersionPagoResponse) => void ejecutar(async () => {
    const actualizada = await finanzasAdminApi.sincronizarDispersion(dispersion.id);
    setDispersiones(actual => ({
      ...actual,
      [dispersion.liquidacionId]: (actual[dispersion.liquidacionId] ?? []).map(item => item.id === actualizada.id ? actualizada : item),
    }));
  }, 'Estado sincronizado con Wompi.', false);

  const reenviar = (dispersion: DispersionPagoResponse) => void ejecutar(async () => {
    const actualizada = await finanzasAdminApi.reenviarEstadoIncierto(dispersion.id);
    setDispersiones(actual => ({
      ...actual,
      [dispersion.liquidacionId]: (actual[dispersion.liquidacionId] ?? []).map(item => item.id === actualizada.id ? actualizada : item),
    }));
  }, 'Solicitud reenviada con la misma idempotencia.', false);

  const consultarPago = async () => {
    if (!pagoId.trim()) return setError('Indica el ID interno del pago.');
    setCargando(true); setError('');
    try {
      const [dist, reem] = await Promise.all([
        finanzasAdminApi.listarDistribuciones(pagoId.trim()),
        finanzasAdminApi.listarReembolsos(pagoId.trim()),
      ]);
      setDistribuciones(dist); setReembolsos(reem);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo consultar el pago.'); }
    finally { setCargando(false); }
  };

  const solicitarReembolso = () => {
    const monto = Number(reembolso.monto);
    if (!pagoId.trim() || !Number.isFinite(monto) || monto <= 0 || reembolso.motivo.trim().length < 5) return setError('Indica pago, monto y un motivo de al menos 5 caracteres.');
    void ejecutar(async () => {
      await finanzasAdminApi.solicitarReembolso(pagoId.trim(), { monto, motivo: reembolso.motivo.trim() });
      setReembolsos(await finanzasAdminApi.listarReembolsos(pagoId.trim()));
      setDistribuciones(await finanzasAdminApi.listarDistribuciones(pagoId.trim()));
    }, 'Reembolso solicitado.', false);
  };

  const conciliar = () => {
    const total = Number(conciliacion.totalProveedor);
    const cantidad = Number(conciliacion.cantidadProveedor);
    if (!conciliacion.desde || !conciliacion.hasta || conciliacion.hasta <= conciliacion.desde || !Number.isFinite(total) || total < 0 || !Number.isSafeInteger(cantidad) || cantidad < 0) return setError('Revisa el periodo, total y cantidad reportados por Wompi.');
    void ejecutar(() => finanzasAdminApi.conciliarWompi({
      desde: new Date(conciliacion.desde).toISOString(),
      hasta: new Date(conciliacion.hasta).toISOString(),
      totalProveedor: total,
      cantidadProveedor: cantidad,
      observacion: conciliacion.observacion.trim() || null,
    }), 'Conciliación ejecutada.');
  };

  const diagnosticarWompi = async () => {
    setGuardando(true); setError(''); setDiagnostico(null);
    try {
      const [cuentasOrigen, bancos] = await Promise.all([
        finanzasAdminApi.cuentasOrigenWompi(),
        finanzasAdminApi.bancosWompi(),
      ]);
      setDiagnostico({ cuentasOrigen, bancos });
    } catch (err) {
      const texto = err instanceof Error ? err.message : 'No se pudo consultar Wompi Pagos a Terceros.';
      setError(err instanceof ApiError && err.status === 503
        ? `${texto} El producto puede seguir pendiente de activación o faltan las credenciales específicas de Pagos a Terceros.`
        : texto);
    } finally { setGuardando(false); }
  };

  return <IonPage><BrandHeader title="Administración financiera" mostrarGestion={false}/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">ADMINISTRACIÓN · FINANZAS</span><h1>Pagos, comisiones y <em>liquidaciones.</em></h1><p>Panel administrativo conectado al módulo financiero del backend.</p></div><IonButton fill="outline" disabled={cargando || guardando} onClick={() => void cargarBase()}>Actualizar</IonButton></div>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}{error && <div className="notice-error" role="alert">{error}</div>}
    {cargando && <div className="loading-state"><IonSpinner/> Consultando finanzas…</div>}

    <section className="gestion-form-panel"><div className="gestion-form-heading"><h2>Cuentas de pago de negocios</h2><label>Estado<select value={estadoCuenta} onChange={e => setEstadoCuenta(estadosCuenta.find(v => v === e.target.value) ?? '')}>{estadosCuenta.map(v => <option key={v || 'TODAS'} value={v}>{v ? estadoTexto(v) : 'Todas'}</option>)}</select></label></div>
      <div className="negocios-list">{cuentas.map(cuenta => <article className="negocio-row" key={cuenta.id}><div><h3>{cuenta.entidadFinanciera} · {cuenta.referenciaDestinoEnmascarada}</h3><p>{cuenta.titular} · {descripcionTipoDestino(cuenta)} · negocio {cuenta.negocioId}</p>{cuenta.observacionVerificacion && <p>{cuenta.observacionVerificacion}</p>}</div><div className="negocio-row-actions"><span className={`status-pill status-${cuenta.estado === 'ACTIVA' ? 'activo' : cuenta.estado === 'PENDIENTE_VERIFICACION' ? 'borrador' : 'inactivo'}`}>{estadoTexto(cuenta.estado)}</span>{cuenta.estado === 'PENDIENTE_VERIFICACION' && <><IonButton size="small" onClick={() => verificar(cuenta)}>Verificar</IonButton><IonButton size="small" fill="outline" onClick={() => rechazar(cuenta)}>Rechazar</IonButton></>}</div></article>)}{!cuentas.length && <p className="empty-state">No hay cuentas para el filtro seleccionado.</p>}</div>
    </section>

    <section className="gestion-form-panel"><h2>Comisión y liquidación por negocio</h2><div className="negocio-form">
      <label>Negocio<select value={negocioId} onChange={e => setNegocioId(e.target.value)}><option value="">Selecciona</option>{negocios.map(n => <option key={n.id} value={n.id}>{n.nombreComercial}</option>)}</select></label>
      <label>Tipo de comisión<select value={comision.tipo} onChange={e => setComision(v => ({ ...v, tipo: e.target.value as TipoReglaComision }))}><option value="PORCENTAJE">Porcentaje</option><option value="VALOR_FIJO">Valor fijo COP</option></select></label>
      <label>{comision.tipo === 'PORCENTAJE' ? 'Porcentaje' : 'Valor fijo COP'}<input type="number" min={0} max={comision.tipo === 'PORCENTAJE' ? 100 : undefined} step={comision.tipo === 'PORCENTAJE' ? '0.0001' : '0.01'} value={comision.valor} onChange={e => setComision(v => ({ ...v, valor: e.target.value }))}/></label>
      <label>Observación<input maxLength={500} value={comision.observacion} onChange={e => setComision(v => ({ ...v, observacion: e.target.value }))}/></label>
      <div className="form-actions"><IonButton disabled={guardando || !negocioId} onClick={guardarComision}>Guardar comisión</IonButton></div>
    </div>
    {reglas.length > 0 && <div className="negocios-list">{reglas.map(r => <article className="negocio-row" key={r.id}><div><strong>{r.tipo === 'PORCENTAJE' ? `${r.porcentaje ?? 0}%` : formatearPrecio(r.valorFijo ?? 0, r.moneda)}</strong><p>{r.activa ? 'Vigente' : 'Histórica'} · desde {fecha(r.vigenteDesde)}{r.observacion ? ` · ${r.observacion}` : ''}</p></div></article>)}</div>}
    <div className="negocio-form"><label>Observación de liquidación<input maxLength={500} value={liquidacionObs} onChange={e => setLiquidacionObs(e.target.value)}/></label><div className="form-actions"><IonButton fill="outline" disabled={guardando || !negocioId} onClick={crearLiquidacion}>Crear liquidación del negocio</IonButton></div></div>
    </section>

    <section className="gestion-form-panel"><h2>Liquidaciones y Pagos a Terceros</h2><div className="negocios-list">{liquidaciones.map(item => <article className="negocio-row" key={item.id}><div><h3>{formatearPrecio(item.monto, item.moneda)}</h3><p>{estadoTexto(item.estado)} · negocio {item.negocioId} · {fecha(item.fechaCreacion)}</p>{item.observacion && <p>{item.observacion}</p>}{dispersiones[item.id]?.map(d => <div className="quote-summary" key={d.id}><strong>Intento {d.numeroIntento}: {estadoTexto(d.estado)}</strong><p>{d.estadoTransaccionProveedor || d.mensajeError || 'Sin detalle adicional.'}</p><div className="form-actions"><IonButton size="small" fill="outline" disabled={guardando} onClick={() => sincronizar(d)}>Sincronizar</IonButton>{d.estado === 'ESTADO_INCIERTO' && <IonButton size="small" fill="outline" disabled={guardando} onClick={() => reenviar(d)}>Reenviar misma idempotencia</IonButton>}</div></div>)}</div><div className="negocio-row-actions"><IonButton size="small" fill="outline" onClick={() => void verDispersiones(item.id)}>Dispersiones</IonButton>{['LISTA','FALLIDA'].includes(item.estado) && <IonButton size="small" disabled={guardando} onClick={() => enviarWompi(item.id)}>Enviar por Wompi</IonButton>}</div></article>)}{!liquidaciones.length && <p className="empty-state">No hay liquidaciones creadas.</p>}</div></section>

    <section className="gestion-form-panel"><h2>Reembolsos por pago</h2><p>El backend trabaja con el ID interno del pago; no se usa directamente el ID de transacción del navegador.</p><div className="negocio-form"><label>ID del pago<input value={pagoId} onChange={e => setPagoId(e.target.value)}/></label><div className="form-actions"><IonButton fill="outline" onClick={() => void consultarPago()}>Consultar pago</IonButton></div>
      <label>Monto a reembolsar<input type="number" min="0.01" step="0.01" value={reembolso.monto} onChange={e => setReembolso(v => ({ ...v, monto: e.target.value }))}/></label><label>Motivo<textarea minLength={5} maxLength={500} value={reembolso.motivo} onChange={e => setReembolso(v => ({ ...v, motivo: e.target.value }))}/></label><div className="form-actions"><IonButton disabled={guardando} onClick={solicitarReembolso}>Solicitar reembolso</IonButton></div></div>
      {distribuciones.map(d => <p key={d.id}>{estadoTexto(d.tipoBeneficiario)}: {formatearPrecio(d.monto, d.moneda)} · reembolsado {formatearPrecio(d.montoReembolsado, d.moneda)} · {estadoTexto(d.estado)}</p>)}
      {reembolsos.map(r => <p key={r.id}>{formatearPrecio(r.monto, r.moneda)} · {estadoTexto(r.estado)} · {r.motivo}</p>)}
    </section>

    <section className="gestion-form-panel"><h2>Conciliación Wompi</h2><div className="negocio-form"><label>Desde<input type="datetime-local" value={conciliacion.desde} onChange={e => setConciliacion(v => ({ ...v, desde: e.target.value }))}/></label><label>Hasta<input type="datetime-local" value={conciliacion.hasta} onChange={e => setConciliacion(v => ({ ...v, hasta: e.target.value }))}/></label><label>Total reportado por Wompi<input type="number" min={0} step="0.01" value={conciliacion.totalProveedor} onChange={e => setConciliacion(v => ({ ...v, totalProveedor: e.target.value }))}/></label><label>Cantidad reportada<input type="number" min={0} step={1} value={conciliacion.cantidadProveedor} onChange={e => setConciliacion(v => ({ ...v, cantidadProveedor: e.target.value }))}/></label><label>Observación<input maxLength={1000} value={conciliacion.observacion} onChange={e => setConciliacion(v => ({ ...v, observacion: e.target.value }))}/></label><div className="form-actions"><IonButton disabled={guardando} onClick={conciliar}>Conciliar</IonButton></div></div>
      <div className="negocios-list">{conciliaciones.map(c => <article className="negocio-row" key={c.id}><div><strong>{estadoTexto(c.estado)}</strong><p>Interno {formatearPrecio(c.totalInterno, 'COP')} · proveedor {formatearPrecio(c.totalProveedor, 'COP')} · diferencia {formatearPrecio(c.diferencia, 'COP')}</p><small>{fecha(c.desde)} → {fecha(c.hasta)} · {c.cantidadInterna}/{c.cantidadProveedor} transacciones</small></div></article>)}</div>
    </section>

    <section className="gestion-form-panel">
      <div className="gestion-form-heading">
        <div><h2>Wompi Pagos a Terceros</h2><p>Valida la conexión del backend y consulta las cuentas desde las que Explora Mutatá puede dispersar liquidaciones.</p></div>
        <span className={`status-pill status-${diagnostico ? 'activo' : 'borrador'}`}>{diagnostico ? 'conectado' : 'sin validar'}</span>
      </div>
      <IonButton fill="outline" disabled={guardando} onClick={() => void diagnosticarWompi()}>{guardando ? 'Consultando…' : diagnostico ? 'Volver a validar conexión' : 'Validar conexión con Wompi'}</IonButton>
      {diagnostico && <>
        <div className="notice-success" role="status">La integración operativa con Pagos a Terceros respondió correctamente desde el backend: cuentas origen y bancos están disponibles. Las credenciales privadas nunca se exponen al navegador.</div>
        <h3>Cuentas origen disponibles</h3>
        <div className="negocios-list">
          {diagnostico.cuentasOrigen.map(cuenta => <article className="negocio-row" key={cuenta.id}>
            <div>
              <h3>{nombreCuentaOrigen(cuenta)}</h3>
              <p>{referenciaCuentaOrigen(cuenta)} · {cuenta.accountType ? estadoTexto(cuenta.accountType) : 'tipo no informado'} · {saldoCuentaOrigen(cuenta)}</p>
              <small>ID técnico: {cuenta.id}{cuenta.updatedAt ? ` · actualizado ${fecha(cuenta.updatedAt)}` : ''}</small>
              {cuenta.id === 'WOMPI_ACCOUNT' && <p>Esta cuenta puede usarse como origen de las dispersiones de prueba configurando <strong>WOMPI_PAGOS_TERCEROS_CUENTA_ORIGEN_ID=WOMPI_ACCOUNT</strong> en el backend.</p>}
            </div>
            <span className={`status-pill status-${cuenta.status === 'ACTIVE' ? 'activo' : 'inactivo'}`}>{estadoTexto(cuenta.status)}</span>
          </article>)}
          {!diagnostico.cuentasOrigen.length && <p className="empty-state">Wompi respondió, pero no devolvió cuentas origen disponibles.</p>}
        </div>
        <p>Bancos disponibles para registrar cuentas de operadores: <strong>{contarElementosWompi(diagnostico.bancos)}</strong>.</p>
        <small>El envío de una liquidación se realiza desde la sección “Liquidaciones y Pagos a Terceros”. El frontend solo llama al backend; API Key, usuario principal y secretos permanecen del lado servidor.</small>
      </>}
    </section>
  </main></IonContent></IonPage>;
}
