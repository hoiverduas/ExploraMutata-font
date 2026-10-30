import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import { formatearPrecio } from '../domain/precios';
import { ApiError } from '../services/http';
import { finanzasOperadorApi } from '../services/finanzasOperadorApi';
import { operadorNegociosApi } from '../services/operadorNegociosApi';
import type {
  CuentaPagoNegocioResponse, DispersionPagoResponse, LiquidacionResponse,
  MovimientoFinancieroResponse, TipoCuentaBancariaWompi, WompiBanco,
} from '../types/finanzas';
import type { NegocioResponse } from '../types/negocio';

const fecha = (valor: string | null) => valor ? new Date(valor).toLocaleString('es-CO') : '—';
const estadoTexto = (valor: string) => valor.replaceAll('_', ' ').toLocaleLowerCase('es');

export default function FinanzasOperadorPage() {
  const [negocios, setNegocios] = useState<NegocioResponse[]>([]);
  const [negocioId, setNegocioId] = useState('');
  const [cuentas, setCuentas] = useState<CuentaPagoNegocioResponse[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionResponse[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoFinancieroResponse[]>([]);
  const [dispersiones, setDispersiones] = useState<Record<string, DispersionPagoResponse[]>>({});
  const [bancos, setBancos] = useState<WompiBanco[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cargandoBancos, setCargandoBancos] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [form, setForm] = useState({
    bancoIdWompi: '', tipoCuentaWompi: 'AHORROS' as TipoCuentaBancariaWompi,
    numeroCuenta: '', titular: '', predeterminada: true,
  });

  const cargarNegocios = useCallback(async () => {
    const primera = await operadorNegociosApi.listar(0, 100);
    const lista = [...primera.contenido];
    for (let pagina = 1; pagina < primera.totalPaginas; pagina++) {
      const otra = await operadorNegociosApi.listar(pagina, 100);
      lista.push(...otra.contenido);
    }
    const unicos = [...new Map(lista.map(item => [item.id, item])).values()];
    setNegocios(unicos);
    setNegocioId(actual => actual || unicos[0]?.id || '');
  }, []);

  const cargarFinanzas = useCallback(async (id: string) => {
    if (!id) { setCuentas([]); setLiquidaciones([]); setMovimientos([]); return; }
    const [cuentasDatos, liquidacionesDatos, movimientosDatos] = await Promise.all([
      finanzasOperadorApi.listarCuentas(id),
      finanzasOperadorApi.listarLiquidaciones(id),
      finanzasOperadorApi.listarMovimientos(id),
    ]);
    setCuentas(cuentasDatos);
    setLiquidaciones(liquidacionesDatos);
    setMovimientos(movimientosDatos);
  }, []);

  useEffect(() => {
    let vivo = true;
    setCargando(true); setError('');
    void cargarNegocios().catch(err => {
      if (vivo) setError(err instanceof Error ? err.message : 'No se pudieron cargar tus negocios.');
    }).finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [cargarNegocios]);

  useEffect(() => {
    if (!negocioId) return;
    let vivo = true;
    setCargando(true); setError('');
    void cargarFinanzas(negocioId).catch(err => {
      if (vivo) setError(err instanceof Error ? err.message : 'No se pudo cargar la información financiera.');
    }).finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [negocioId, cargarFinanzas]);

  const cargarBancos = async () => {
    if (cargandoBancos) return;
    setCargandoBancos(true); setError('');
    try {
      const resultado = await finanzasOperadorApi.listarBancosWompi();
      setBancos(resultado);
      if (!resultado.length) setError('Wompi no devolvió bancos disponibles. Verifica la activación de Pagos a Terceros.');
    } catch (err) {
      const texto = err instanceof Error ? err.message : 'No se pudieron consultar los bancos de Wompi.';
      setError(err instanceof ApiError && err.status === 503
        ? `${texto} Pagos a Terceros todavía puede estar pendiente de activación o configuración.`
        : texto);
    } finally { setCargandoBancos(false); }
  };

  const registrarCuenta = async () => {
    if (!negocioId || guardando) return;
    const banco = bancos.find(item => item.id === form.bancoIdWompi);
    if (!banco) return setError('Selecciona un banco consultado desde Wompi.');
    if (!/^[0-9]{6,20}$/.test(form.numeroCuenta)) return setError('El número de cuenta debe tener entre 6 y 20 dígitos.');
    if (!form.titular.trim() || form.titular.trim().length > 180) return setError('Indica el titular de la cuenta.');
    setGuardando(true); setError(''); setMensaje('');
    try {
      await finanzasOperadorApi.registrarCuenta(negocioId, {
        proveedor: 'WOMPI',
        entidadFinanciera: banco.nombre,
        bancoIdWompi: banco.id,
        tipoCuentaWompi: form.tipoCuentaWompi,
        numeroCuenta: form.numeroCuenta,
        titular: form.titular.trim(),
        predeterminada: form.predeterminada,
      });
      setForm({ bancoIdWompi: '', tipoCuentaWompi: 'AHORROS', numeroCuenta: '', titular: '', predeterminada: true });
      setMensaje('Cuenta registrada y enviada a verificación.');
      await cargarFinanzas(negocioId);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar la cuenta.'); }
    finally { setGuardando(false); }
  };

  const verDispersiones = async (liquidacionId: string) => {
    if (!negocioId) return;
    setError('');
    try {
      const datos = await finanzasOperadorApi.listarDispersiones(negocioId, liquidacionId);
      setDispersiones(actual => ({ ...actual, [liquidacionId]: datos }));
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron consultar las dispersiones.'); }
  };

  const negocio = negocios.find(item => item.id === negocioId);

  return <IonPage><BrandHeader title="Finanzas de mis negocios"/><IonContent fullscreen><main className="page-width gestion-page">
    <div className="gestion-heading"><div><span className="eyebrow">MI ESPACIO DE OPERADOR</span><h1>Pagos y <em>liquidaciones.</em></h1><p>Consulta tus movimientos y prepara la cuenta donde recibirás las liquidaciones.</p></div><IonButton fill="outline" disabled={cargando || !negocioId} onClick={() => void cargarFinanzas(negocioId)}>Actualizar</IonButton></div>
    {mensaje && <div className="notice-success" role="status">{mensaje}</div>}
    {error && <div className="notice-error" role="alert">{error}</div>}
    {cargando && !negocios.length ? <div className="loading-state"><IonSpinner/> Cargando finanzas…</div> : <>
      <section className="gestion-form-panel"><label>Negocio<select value={negocioId} onChange={e => setNegocioId(e.target.value)}><option value="">Selecciona un negocio</option>{negocios.map(item => <option key={item.id} value={item.id}>{item.nombreComercial}</option>)}</select></label>{negocio && <p>Información financiera de <strong>{negocio.nombreComercial}</strong>.</p>}</section>

      {negocioId && <><section className="gestion-form-panel"><h2>Cuenta para recibir liquidaciones</h2><p>La cuenta se registra cifrada en el backend; el frontend solo vuelve a mostrar su referencia enmascarada.</p>
        <div className="form-actions"><IonButton fill="outline" disabled={cargandoBancos || guardando} onClick={() => void cargarBancos()}>{cargandoBancos ? 'Consultando Wompi…' : bancos.length ? 'Actualizar bancos Wompi' : 'Consultar bancos Wompi'}</IonButton></div>
        {bancos.length > 0 && <div className="negocio-form">
          <label>Banco<select value={form.bancoIdWompi} onChange={e => setForm(v => ({ ...v, bancoIdWompi: e.target.value }))}><option value="">Selecciona</option>{bancos.map(b => <option key={b.id} value={b.id}>{b.nombre}{b.codigo ? ` · ${b.codigo}` : ''}</option>)}</select></label>
          <label>Tipo de cuenta<select value={form.tipoCuentaWompi} onChange={e => setForm(v => ({ ...v, tipoCuentaWompi: e.target.value as TipoCuentaBancariaWompi }))}><option value="AHORROS">Ahorros</option><option value="CORRIENTE">Corriente</option></select></label>
          <label>Número de cuenta<input inputMode="numeric" maxLength={20} value={form.numeroCuenta} onChange={e => setForm(v => ({ ...v, numeroCuenta: e.target.value.replace(/\D/g, '') }))}/></label>
          <label>Titular<input maxLength={180} value={form.titular} onChange={e => setForm(v => ({ ...v, titular: e.target.value }))}/></label>
          <label><input type="checkbox" checked={form.predeterminada} onChange={e => setForm(v => ({ ...v, predeterminada: e.target.checked }))}/> Usar como cuenta predeterminada</label>
          <div className="form-actions"><IonButton disabled={guardando} onClick={() => void registrarCuenta()}>{guardando ? 'Registrando…' : 'Registrar cuenta'}</IonButton></div>
        </div>}
        <div className="negocios-list">{cuentas.map(cuenta => <article className="negocio-row" key={cuenta.id}><div><h3>{cuenta.entidadFinanciera}</h3><p>{cuenta.tipoCuentaWompi.toLocaleLowerCase('es')} · {cuenta.referenciaDestinoEnmascarada} · {cuenta.titular}</p>{cuenta.observacionVerificacion && <p>{cuenta.observacionVerificacion}</p>}</div><span className={`status-pill status-${cuenta.estado === 'ACTIVA' ? 'activo' : cuenta.estado === 'PENDIENTE_VERIFICACION' ? 'borrador' : 'inactivo'}`}>{estadoTexto(cuenta.estado)}</span></article>)}{!cuentas.length && <p className="empty-state">No hay cuentas registradas para este negocio.</p>}</div>
      </section>

      <section className="gestion-form-panel"><h2>Liquidaciones</h2><div className="negocios-list">{liquidaciones.map(item => <article className="negocio-row" key={item.id}><div><h3>{formatearPrecio(item.monto, item.moneda)}</h3><p>{estadoTexto(item.estado)} · creada {fecha(item.fechaCreacion)}{item.fechaPago ? ` · pagada ${fecha(item.fechaPago)}` : ''}</p>{item.observacion && <p>{item.observacion}</p>}{dispersiones[item.id] && <div>{dispersiones[item.id].map(d => <p key={d.id}><strong>Intento {d.numeroIntento}:</strong> {estadoTexto(d.estado)}{d.referenciaTransaccionProveedor ? ` · ${d.referenciaTransaccionProveedor}` : ''}{d.mensajeError ? ` · ${d.mensajeError}` : ''}</p>)}</div>}</div><IonButton size="small" fill="outline" onClick={() => void verDispersiones(item.id)}>Ver dispersiones</IonButton></article>)}{!liquidaciones.length && <p className="empty-state">Aún no hay liquidaciones para este negocio.</p>}</div></section>

      <section className="gestion-form-panel"><h2>Movimientos financieros</h2><div className="negocios-list">{movimientos.map(item => <article className="negocio-row" key={item.id}><div><h3>{item.naturaleza === 'DEBITO' ? '−' : '+'}{formatearPrecio(item.monto, item.moneda)}</h3><p>{estadoTexto(item.tipo)} · {item.concepto}</p><small>{fecha(item.fechaCreacion)} · {item.referencia}</small></div></article>)}{!movimientos.length && <p className="empty-state">Aún no hay movimientos financieros registrados.</p>}</div></section></>}
    </>}
  </main></IonContent></IonPage>;
}
