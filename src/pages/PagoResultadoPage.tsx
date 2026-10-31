import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import PagoEstadoBadge from '../components/PagoEstadoBadge';
import { formatearPrecio } from '../domain/precios';
import { pagosApi, pagoWompiSesion } from '../services/pagosApi';
import type { OrdenPagoResponse, PagoResponse } from '../types/finanzas';

const finalesPago = new Set(['APROBADO','RECHAZADO','ANULADO','ERROR','REEMBOLSO_PARCIAL','REEMBOLSADO','CONTRACARGO']);
const esperar = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

export default function PagoResultadoPage() {
  const location = useLocation();
  const wompiId = new URLSearchParams(location.search).get('id');
  const sesion = pagoWompiSesion.obtener();
  const [orden, setOrden] = useState<OrdenPagoResponse | null>(null);
  const [intentos, setIntentos] = useState<PagoResponse[]>([]);
  const [cargando, setCargando] = useState(Boolean(sesion));
  const [error, setError] = useState('');
  const vivo = useRef(true);

  const consultar = useCallback(async () => {
    if (!sesion) return null;
    const [ordenActual, intentosActuales] = await Promise.all([
      pagosApi.buscarOrden(sesion.ordenId),
      pagosApi.listarIntentos(sesion.ordenId),
    ]);
    if (vivo.current) {
      setOrden(ordenActual);
      setIntentos(intentosActuales);
    }
    return { orden: ordenActual, intentos: intentosActuales };
  }, [sesion?.ordenId]);

  const sincronizar = useCallback(async () => {
    if (!sesion || !wompiId) return consultar();

    pagoWompiSesion.guardar({
      ...sesion,
      transaccionId: wompiId,
    });

    const ordenActual = await pagosApi.sincronizarWompi(sesion.ordenId, wompiId);
    const intentosActuales = await pagosApi.listarIntentos(sesion.ordenId);
    if (vivo.current) {
      setOrden(ordenActual);
      setIntentos(intentosActuales);
    }
    return { orden: ordenActual, intentos: intentosActuales };
  }, [consultar, sesion?.ordenId, wompiId]);

  const sincronizarAhora = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      await sincronizar();
    } catch (err) {
      if (vivo.current) setError(err instanceof Error ? err.message : 'No se pudo sincronizar el pago con Wompi.');
    } finally {
      if (vivo.current) setCargando(false);
    }
  }, [sincronizar]);

  useEffect(() => {
    vivo.current = true;
    if (!sesion) { setCargando(false); return () => { vivo.current = false; }; }
    void (async () => {
      setCargando(true); setError('');
      try {
        let resultado = wompiId ? await sincronizar() : await consultar();
        if (resultado) {
          let ultimo = [...resultado.intentos].sort((a,b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion))[0];
          if (resultado.orden.estado !== 'PAGADA' && !(ultimo && finalesPago.has(ultimo.estado))) {
            for (let intento = 0; intento < 6 && vivo.current; intento++) {
              await esperar(2000);
              resultado = await consultar();
              if (!resultado) break;
              ultimo = [...resultado.intentos].sort((a,b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion))[0];
              if (resultado.orden.estado === 'PAGADA' || (ultimo && finalesPago.has(ultimo.estado))) break;
            }
          }
        }
      } catch (err) {
        if (vivo.current) setError(err instanceof Error ? err.message : 'No se pudo confirmar el estado del pago.');
      } finally { if (vivo.current) setCargando(false); }
    })();
    return () => { vivo.current = false; };
  }, [consultar, sincronizar, sesion?.ordenId, wompiId]);

  const ultimo = [...intentos].sort((a,b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion))[0] ?? null;
  const aprobado = orden?.estado === 'PAGADA';
  const coincideTransaccion = !wompiId || !ultimo?.referenciaProveedor || wompiId === ultimo.referenciaProveedor;
  const mensajeAprobado = orden?.tipoPago === 'ANTICIPO'
    ? 'Anticipo confirmado. Vuelve a la reserva para consultar el saldo pendiente y pagarlo cuando corresponda.'
    : orden?.tipoPago === 'SALDO'
      ? 'Saldo confirmado. Con este pago completaste el valor pendiente de la reserva.'
      : 'Pago completo confirmado. La orden fue aprobada por el backend.';

  return <IonPage><BrandHeader title="Resultado del pago"/><IonContent fullscreen><main className="page-width gestion-page">
    <span className="eyebrow">WOMPI · EXPLORA MUTATÁ</span><h1>Estado de tu <em>pago.</em></h1>
    {!sesion ? <section className="gestion-form-panel"><h2>No encontramos la orden en esta sesión</h2><p>Vuelve a Mis reservas y abre la reserva que estabas pagando. Desde allí puedes consultar el estado o iniciar nuevamente el pago.</p><Link className="resource-inline-link" to="/reservas">Ir a Mis reservas →</Link></section> : <>
      {cargando && <div className="loading-state"><IonSpinner/> Esperando la confirmación del backend…</div>}
      {error && <div className="notice-error" role="alert">{error}</div>}
      {orden && <section className="gestion-form-panel">
        <div className="gestion-form-heading"><h2>Orden {orden.referencia}</h2><PagoEstadoBadge estado={orden.estado}/></div>
        <dl className="reserva-info">
          <div><dt>Tipo de pago</dt><dd>{orden.tipoPago === 'ANTICIPO' ? 'Anticipo' : orden.tipoPago === 'SALDO' ? 'Saldo' : 'Pago completo'}</dd></div>
          <div><dt>Valor cobrado</dt><dd>{formatearPrecio(orden.montoCobro, orden.monedaCobro)}</dd></div>
          {orden.tipoPago === 'ANTICIPO' && <div><dt>Porcentaje del total</dt><dd>{Number(orden.porcentajePago).toFixed(0)} %</dd></div>}
          {wompiId && <div><dt>Transacción Wompi</dt><dd>{wompiId}</dd></div>}
        </dl>
        {ultimo && <div className="quote-summary"><h3>Último evento registrado</h3><PagoEstadoBadge estado={ultimo.estado}/><p>{ultimo.mensajeEstado || 'Estado procesado por Explora Mutatá.'}</p></div>}
        {aprobado ? <div className="notice-success">{mensajeAprobado}</div>
          : ultimo && ['RECHAZADO','ANULADO','ERROR'].includes(ultimo.estado)
            ? <div className="notice-error">El intento no fue aprobado. Puedes volver a la reserva e intentar pagar nuevamente.</div>
            : <div className="notice-success">Wompi devolvió al navegador, pero Explora Mutatá aún espera o procesa el webhook. Usa “Actualizar estado” antes de repetir el pago.</div>}
        {!coincideTransaccion && <div className="notice-error">El identificador retornado por Wompi no coincide con el último intento registrado. No se tomará esta URL como comprobante de pago.</div>}
        <div className="form-actions"><IonButton fill="outline" disabled={cargando} onClick={() => void (wompiId ? sincronizarAhora() : consultar())}>{cargando ? 'Consultando…' : wompiId ? 'Sincronizar con Wompi' : 'Actualizar estado'}</IonButton><IonButton routerLink={`/reservas/${encodeURIComponent(sesion.reservaId)}`}>Volver a la reserva</IonButton></div>
      </section>}
    </>}
  </main></IonContent></IonPage>;
}
