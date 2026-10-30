import { IonButton, IonSpinner } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { formatearPrecio } from '../domain/precios';
import { ApiError } from '../services/http';
import { abrirWebCheckoutWompi, pagosApi, pagoWompiSesion } from '../services/pagosApi';
import type { OrdenPagoResponse, PagoResponse } from '../types/finanzas';
import type { ReservaResponse } from '../types/reserva';
import PagoEstadoBadge from './PagoEstadoBadge';

function ultimoIntento(intentos: PagoResponse[]): PagoResponse | null {
  return [...intentos].sort((a, b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion))[0] ?? null;
}

export default function PagoReservaPanel({ reserva }: { reserva: ReservaResponse }) {
  const [orden, setOrden] = useState<OrdenPagoResponse | null>(null);
  const [intentos, setIntentos] = useState<PagoResponse[]>([]);
  const [cargando, setCargando] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState('');
  const activo = useRef(true);
  const pagable = (reserva.estado === 'PENDIENTE' || reserva.estado === 'CONFIRMADA')
    && reserva.totalReserva != null && reserva.totalReserva > 0;

  useEffect(() => {
    activo.current = true;
    const sesion = pagoWompiSesion.obtener();
    if (sesion?.reservaId === reserva.id) {
      setCargando(true);
      void Promise.all([
        pagosApi.buscarOrden(sesion.ordenId),
        pagosApi.listarIntentos(sesion.ordenId),
      ]).then(([ordenActual, intentosActuales]) => {
        if (!activo.current) return;
        setOrden(ordenActual);
        setIntentos(intentosActuales);
      }).catch(() => {
        if (activo.current) pagoWompiSesion.limpiar();
      }).finally(() => { if (activo.current) setCargando(false); });
    }
    return () => { activo.current = false; };
  }, [reserva.id]);

  const prepararOrden = async () => {
    if (cargando || pagando || !pagable) return;
    setCargando(true); setError('');
    try {
      const creada = await pagosApi.crearOrden(reserva.id);
      const lista = await pagosApi.listarIntentos(creada.id);
      if (!activo.current) return;
      setOrden(creada); setIntentos(lista);
      pagoWompiSesion.guardar({
        ordenId: creada.id, reservaId: reserva.id, referencia: creada.referencia, iniciadoEn: new Date().toISOString(),
      });
    } catch (err) {
      if (activo.current) setError(err instanceof Error ? err.message : 'No se pudo preparar el pago.');
    } finally { if (activo.current) setCargando(false); }
  };

  const actualizar = async () => {
    if (!orden || cargando) return;
    setCargando(true); setError('');
    try {
      const [ordenActual, lista] = await Promise.all([pagosApi.buscarOrden(orden.id), pagosApi.listarIntentos(orden.id)]);
      if (activo.current) { setOrden(ordenActual); setIntentos(lista); }
    } catch (err) {
      if (activo.current) setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado del pago.');
    } finally { if (activo.current) setCargando(false); }
  };

  const pagar = async () => {
    if (!orden || pagando || !['CREADA', 'PENDIENTE'].includes(orden.estado) || !pagable) return;
    setPagando(true); setError('');
    try {
      const preparacion = await pagosApi.prepararWompi(orden.id);
      pagoWompiSesion.guardar({
        ordenId: orden.id, reservaId: reserva.id, referencia: preparacion.referencia, iniciadoEn: new Date().toISOString(),
      });
      abrirWebCheckoutWompi(preparacion);
    } catch (err) {
      setPagando(false);
      const texto = err instanceof Error ? err.message : 'No fue posible iniciar el checkout de Wompi.';
      setError(err instanceof ApiError && err.status === 503
        ? `${texto} Revisa que Wompi Checkout esté habilitado y configurado en el backend.`
        : texto);
    }
  };

  if (!pagable && !orden) return null;
  const intento = ultimoIntento(intentos);

  return <section className="gestion-form-panel pago-reserva-panel">
    <div className="gestion-form-heading"><div><span className="eyebrow">PAGO SEGURO</span><h2>Pago de la reserva</h2></div>{orden && <PagoEstadoBadge estado={orden.estado}/>}</div>
    {!orden ? <>
      <p>Explora Mutatá generará una orden asociada únicamente a esta reserva. El monto final vuelve a validarse en el backend.</p>
      <IonButton disabled={cargando || !pagable} onClick={() => void prepararOrden()}>{cargando ? 'Preparando…' : 'Preparar pago con Wompi'}</IonButton>
    </> : <>
      <dl className="reserva-info">
        <div><dt>Referencia</dt><dd>{orden.referencia}</dd></div>
        <div><dt>Valor de la reserva</dt><dd>{formatearPrecio(orden.montoOriginal, orden.monedaOriginal)}</dd></div>
        <div><dt>Valor a cobrar</dt><dd>{formatearPrecio(orden.montoCobro, orden.monedaCobro)}</dd></div>
        {orden.fechaTasa && orden.monedaOriginal !== orden.monedaCobro && <div><dt>Fecha de conversión</dt><dd>{orden.fechaTasa}</dd></div>}
      </dl>
      {intento && <div className="quote-summary"><h3>Último intento</h3><PagoEstadoBadge estado={intento.estado}/><p>{intento.metodoPago ? `Método: ${intento.metodoPago}. ` : ''}{intento.mensajeEstado || 'Estado recibido desde la pasarela.'}</p></div>}
      <div className="form-actions">
        {['CREADA', 'PENDIENTE'].includes(orden.estado) && pagable && <IonButton disabled={pagando || cargando} onClick={() => void pagar()}>{pagando ? 'Abriendo Wompi…' : intento && ['RECHAZADO','ERROR','ANULADO'].includes(intento.estado) ? 'Intentar pago de nuevo' : 'Pagar con Wompi'}</IonButton>}
        <IonButton fill="outline" disabled={cargando || pagando} onClick={() => void actualizar()}>{cargando ? <IonSpinner/> : 'Actualizar estado'}</IonButton>
      </div>
      {orden.estado === 'PAGADA' && <div className="notice-success" role="status">El backend confirmó el pago aprobado por Wompi.</div>}
      {(orden.estado === 'CANCELADA' || orden.estado === 'VENCIDA') && <div className="notice-error" role="status">Esta orden ya no admite nuevos intentos de pago.</div>}
    </>}
    {error && <div className="notice-error" role="alert">{error}</div>}
    <small>El estado definitivo se confirma mediante el webhook firmado de Wompi; la pantalla no acepta como prueba de pago un resultado enviado solo por el navegador.</small>
  </section>;
}
