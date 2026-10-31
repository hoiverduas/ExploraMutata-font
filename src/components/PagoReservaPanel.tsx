import { IonButton, IonRange, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { formatearPrecio } from '../domain/precios';
import { ApiError } from '../services/http';
import { abrirWebCheckoutWompi, pagosApi, pagoWompiSesion } from '../services/pagosApi';
import { reservasApi } from '../services/reservasApi';
import type { OrdenPagoResponse, PagoResponse, TipoPagoReserva } from '../types/finanzas';
import type { ReservaResponse } from '../types/reserva';
import PagoEstadoBadge from './PagoEstadoBadge';

function ultimoIntento(intentos: PagoResponse[]): PagoResponse | null {
  return [...intentos].sort((a, b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion))[0] ?? null;
}

function redondearMoneda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function esOrdenActiva(orden: OrdenPagoResponse): boolean {
  return orden.estado === 'CREADA' || orden.estado === 'PENDIENTE';
}

function tipoPagoTexto(tipo: TipoPagoReserva): string {
  if (tipo === 'ANTICIPO') return 'Anticipo';
  if (tipo === 'SALDO') return 'Saldo pendiente';
  return 'Pago completo';
}

function ordenFoco(ordenes: OrdenPagoResponse[], reservaId: string): OrdenPagoResponse | null {
  const activa = ordenes.find(esOrdenActiva);
  if (activa) return activa;

  const sesion = pagoWompiSesion.obtener();
  if (sesion?.reservaId === reservaId) {
    const deSesion = ordenes.find(orden => orden.id === sesion.ordenId && orden.estado === 'PAGADA');
    if (deSesion) return deSesion;
  }

  return ordenes.find(orden => orden.estado === 'PAGADA') ?? null;
}

function totalPagado(ordenes: OrdenPagoResponse[]): number {
  return redondearMoneda(
    ordenes
      .filter(orden => orden.estado === 'PAGADA')
      .reduce((total, orden) => total + Number(orden.montoOriginal || 0), 0),
  );
}

export default function PagoReservaPanel({ reserva }: { reserva: ReservaResponse }) {
  const [ordenes, setOrdenes] = useState<OrdenPagoResponse[]>([]);
  const [intentos, setIntentos] = useState<PagoResponse[]>([]);
  const [porcentaje, setPorcentaje] = useState(50);
  const [paqueteConfirmado, setPaqueteConfirmado] = useState(reserva.paqueteId == null);
  const [cargando, setCargando] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState('');
  const activo = useRef(true);

  useEffect(() => {
    let cancelado = false;

    if (!reserva.paqueteId) {
      setPaqueteConfirmado(true);
      return () => { cancelado = true; };
    }

    setPaqueteConfirmado(false);
    void reservasApi.listarMisReservas()
      .then(reservas => {
        if (cancelado) return;
        const relacionadas = reservas.filter(item => item.paqueteId === reserva.paqueteId);
        const todasConfirmadas = relacionadas.length > 0 && relacionadas.every(item => {
          const estado = item.id === reserva.id ? reserva.estado : item.estado;
          return estado === 'CONFIRMADA' || estado === 'COMPLETADA';
        });
        setPaqueteConfirmado(todasConfirmadas);
      })
      .catch(() => {
        if (!cancelado) setPaqueteConfirmado(false);
      });

    return () => { cancelado = true; };
  }, [reserva.id, reserva.paqueteId, reserva.estado]);

  const totalReserva = redondearMoneda(Number(reserva.totalReserva ?? 0));
  const pagable = reserva.estado === 'CONFIRMADA'
    && paqueteConfirmado
    && totalReserva > 0;

  useEffect(() => {
    activo.current = true;
    if (!pagable) {
      setOrdenes([]);
      setIntentos([]);
      return () => { activo.current = false; };
    }

    const controller = new AbortController();
    setCargando(true);
    setError('');

    void pagosApi.listarOrdenesReserva(reserva.id, { signal: controller.signal })
      .then(async lista => {
        if (!activo.current) return;
        setOrdenes(lista);

        const foco = ordenFoco(lista, reserva.id);
        if (!foco) {
          setIntentos([]);
          return;
        }

        const listaIntentos = await pagosApi.listarIntentos(foco.id, { signal: controller.signal });
        if (activo.current) setIntentos(listaIntentos);
      })
      .catch(err => {
        if (!activo.current || (err instanceof DOMException && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : 'No se pudo consultar el estado de los pagos.');
      })
      .finally(() => {
        if (activo.current) setCargando(false);
      });

    return () => {
      activo.current = false;
      controller.abort();
    };
  }, [pagable, reserva.id]);

  const pagado = totalPagado(ordenes);
  const saldo = redondearMoneda(Math.max(totalReserva - pagado, 0));
  const pagoCompleto = saldo < 0.01;
  const primerPago = pagado < 0.01;
  const activa = ordenes.find(esOrdenActiva) ?? null;
  const foco = ordenFoco(ordenes, reserva.id);
  const intento = ultimoIntento(intentos);
  const montoSeleccionado = primerPago
    ? redondearMoneda(totalReserva * porcentaje / 100)
    : saldo;
  const saldoDespues = redondearMoneda(Math.max(saldo - montoSeleccionado, 0));

  const prepararOrden = async () => {
    if (cargando || pagando || !pagable || activa || pagoCompleto) return;

    setCargando(true);
    setError('');
    try {
      const porcentajeSolicitud = primerPago ? porcentaje : 100;
      const creada = await pagosApi.crearOrden(reserva.id, porcentajeSolicitud);
      if (!activo.current) return;

      setOrdenes(previas => [creada, ...previas.filter(orden => orden.id !== creada.id)]);
      setIntentos([]);
      pagoWompiSesion.guardar({
        ordenId: creada.id,
        reservaId: reserva.id,
        referencia: creada.referencia,
        iniciadoEn: new Date().toISOString(),
      });
    } catch (err) {
      if (activo.current) {
        setError(err instanceof Error ? err.message : 'No se pudo preparar el pago.');
      }
    } finally {
      if (activo.current) setCargando(false);
    }
  };

  const actualizar = async () => {
    if (cargando || !pagable) return;

    setCargando(true);
    setError('');
    try {
      const lista = await pagosApi.listarOrdenesReserva(reserva.id);
      const nuevoFoco = ordenFoco(lista, reserva.id);
      const listaIntentos = nuevoFoco ? await pagosApi.listarIntentos(nuevoFoco.id) : [];

      if (activo.current) {
        setOrdenes(lista);
        setIntentos(listaIntentos);
        if (totalPagado(lista) >= totalReserva) pagoWompiSesion.limpiar();
      }
    } catch (err) {
      if (activo.current) {
        setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado del pago.');
      }
    } finally {
      if (activo.current) setCargando(false);
    }
  };

  useIonViewWillEnter(() => {
    // Ionic conserva las páginas montadas. Al volver desde Wompi debemos
    // consultar nuevamente el backend para no dejar visible una orden ya pagada.
    setPagando(false);
    if (pagable) void actualizar();
  }, [pagable, reserva.id]);

  const pagar = async () => {
    if (!activa || pagando || !pagable || !esOrdenActiva(activa)) return;

    setPagando(true);
    setError('');
    try {
      const preparacion = await pagosApi.prepararWompi(activa.id);
      pagoWompiSesion.guardar({
        ordenId: activa.id,
        reservaId: reserva.id,
        referencia: preparacion.referencia,
        iniciadoEn: new Date().toISOString(),
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

  if (!pagable) return null;

  return <section className="gestion-form-panel pago-reserva-panel">
    <div className="gestion-form-heading">
      <div>
        <span className="eyebrow">PAGO SEGURO</span>
        <h2>Pago de la reserva</h2>
      </div>
      {foco && <PagoEstadoBadge estado={foco.estado}/>}
    </div>

    <dl className="reserva-info">
      <div><dt>Total de la reserva</dt><dd>{formatearPrecio(totalReserva, reserva.monedaReserva)}</dd></div>
      <div><dt>Total pagado</dt><dd>{formatearPrecio(pagado, reserva.monedaReserva)}</dd></div>
      <div><dt>Saldo pendiente</dt><dd>{formatearPrecio(saldo, reserva.monedaReserva)}</dd></div>
    </dl>

    {cargando && ordenes.length === 0 && <div className="quote-summary"><IonSpinner/><p>Consultando pagos de la reserva…</p></div>}

    {!cargando && pagoCompleto && <>
      <div className="notice-success" role="status">
        La reserva está pagada completamente. Los pagos fueron confirmados por Wompi mediante webhook.
      </div>
      {foco && <div className="form-actions">
        <IonButton fill="outline" disabled={cargando || pagando} onClick={() => void actualizar()}>
          {cargando ? <IonSpinner/> : 'Actualizar estado'}
        </IonButton>
      </div>}
    </>}

    {!pagoCompleto && !activa && primerPago && <>
      <div className="quote-summary">
        <h3>Elige cuánto deseas pagar ahora</h3>
        <p>Puedes pagar un anticipo entre 50 % y 100 %. Si eliges menos del 100 %, el saldo restante se pagará después.</p>
        <IonRange
          aria-label="Porcentaje del primer pago"
          min={50}
          max={100}
          step={1}
          snaps
          ticks
          pin
          value={porcentaje}
          pinFormatter={valor => `${valor}%`}
          onIonInput={event => {
            const valor = event.detail.value;
            if (typeof valor === 'number') setPorcentaje(Math.round(valor));
          }}
        />
        <dl className="reserva-info">
          <div><dt>Porcentaje seleccionado</dt><dd>{porcentaje} %</dd></div>
          <div><dt>Pagar ahora</dt><dd>{formatearPrecio(montoSeleccionado, reserva.monedaReserva)}</dd></div>
          <div><dt>Saldo después del pago</dt><dd>{formatearPrecio(saldoDespues, reserva.monedaReserva)}</dd></div>
        </dl>
      </div>
      <div className="form-actions">
        <IonButton disabled={cargando || pagando} onClick={() => void prepararOrden()}>
          {cargando ? 'Preparando…' : `Preparar pago del ${porcentaje} %`}
        </IonButton>
      </div>
    </>}

    {!pagoCompleto && !activa && !primerPago && <>
      <div className="quote-summary">
        <h3>Completar saldo pendiente</h3>
        <p>Tu anticipo ya fue confirmado. El siguiente pago completa el saldo restante de esta reserva.</p>
        <dl className="reserva-info">
          <div><dt>Ya pagaste</dt><dd>{formatearPrecio(pagado, reserva.monedaReserva)}</dd></div>
          <div><dt>Pagar ahora</dt><dd>{formatearPrecio(saldo, reserva.monedaReserva)}</dd></div>
        </dl>
      </div>
      <div className="form-actions">
        <IonButton disabled={cargando || pagando} onClick={() => void prepararOrden()}>
          {cargando ? 'Preparando…' : 'Preparar pago del saldo'}
        </IonButton>
        {foco && <IonButton fill="outline" disabled={cargando || pagando} onClick={() => void actualizar()}>
          {cargando ? <IonSpinner/> : 'Actualizar estado'}
        </IonButton>}
      </div>
    </>}

    {activa && <>
      <div className="quote-summary">
        <h3>{tipoPagoTexto(activa.tipoPago)}</h3>
        <p>
          {activa.tipoPago === 'ANTICIPO'
            ? `Esta orden corresponde al ${Number(activa.porcentajePago).toFixed(0)} % del total de la reserva.`
            : activa.tipoPago === 'SALDO'
              ? 'Esta orden completa el saldo que quedó pendiente después del anticipo.'
              : 'Esta orden cubre el valor completo de la reserva.'}
        </p>
      </div>
      <dl className="reserva-info">
        <div><dt>Referencia</dt><dd>{activa.referencia}</dd></div>
        <div><dt>Valor de este pago</dt><dd>{formatearPrecio(activa.montoOriginal, activa.monedaOriginal)}</dd></div>
        <div><dt>Valor a cobrar por Wompi</dt><dd>{formatearPrecio(activa.montoCobro, activa.monedaCobro)}</dd></div>
        {activa.fechaTasa && activa.monedaOriginal !== activa.monedaCobro
          && <div><dt>Fecha de conversión</dt><dd>{activa.fechaTasa}</dd></div>}
      </dl>

      {intento && <div className="quote-summary">
        <h3>Último intento</h3>
        <PagoEstadoBadge estado={intento.estado}/>
        <p>{intento.metodoPago ? `Método: ${intento.metodoPago}. ` : ''}{intento.mensajeEstado || 'Estado recibido desde la pasarela.'}</p>
      </div>}

      <div className="form-actions">
        <IonButton disabled={pagando || cargando} onClick={() => void pagar()}>
          {pagando
            ? 'Abriendo Wompi…'
            : intento && ['RECHAZADO', 'ERROR', 'ANULADO'].includes(intento.estado)
              ? 'Intentar pago de nuevo'
              : 'Pagar con Wompi'}
        </IonButton>
        <IonButton fill="outline" disabled={cargando || pagando} onClick={() => void actualizar()}>
          {cargando ? <IonSpinner/> : 'Actualizar estado'}
        </IonButton>
      </div>
    </>}

    {error && <div className="notice-error" role="alert">{error}</div>}
    <small>
      El pago solo se habilita después de la confirmación del negocio. En paquetes, todos los negocios deben haber confirmado.
      El estado definitivo del pago se confirma mediante el webhook firmado de Wompi.
    </small>
  </section>;
}
