import { formatearFechaReserva } from '../domain/reservas';
import type { ReservaResponse } from '../types/reserva';
import PrecioReserva from './PrecioReserva';
import { Link } from 'react-router-dom';

export default function ReservaDatos({ reserva, mostrarCliente = false }: { reserva: ReservaResponse; mostrarCliente?: boolean }) {
  return <div className="reserva-datos">
    <dl className="reserva-info">
      {reserva.destinoNombre && <div><dt>Destino</dt><dd>{reserva.destinoNombre}</dd></div>}
      {reserva.experienciaNombre && <div><dt>Experiencia</dt><dd>{reserva.experienciaNombre}</dd></div>}
      <div><dt>Negocio</dt><dd>{reserva.negocioNombreComercial}</dd></div>
      <div><dt>Fecha</dt><dd>{formatearFechaReserva(reserva.fechaReserva)}</dd></div>
      {reserva.fechaFin && <div><dt>Fecha de fin</dt><dd>{formatearFechaReserva(reserva.fechaFin)}</dd></div>}
      <div><dt>Cantidad de personas</dt><dd>{reserva.cantidadPersonas}</dd></div>
      {reserva.cantidadTrayectos != null && <div><dt>Trayectos</dt><dd>{reserva.cantidadTrayectos}</dd></div>}
      {reserva.paqueteId && <div><dt>Viaje</dt><dd>{mostrarCliente ? 'Forma parte de un viaje' : <Link to={`/viajes/${encodeURIComponent(reserva.paqueteId)}`}>Ver viaje asociado →</Link>}</dd></div>}
      {mostrarCliente && <>
        <div><dt>Cliente</dt><dd>{reserva.turistaNombres} {reserva.turistaApellidos}</dd></div>
        <div><dt>Correo del cliente</dt><dd>{reserva.turistaCorreo ? <a href={`mailto:${encodeURIComponent(reserva.turistaCorreo)}`}>{reserva.turistaCorreo}</a> : 'Correo no disponible'}</dd></div>
        <div><dt>Teléfono del cliente</dt><dd>{reserva.turistaTelefono ? <a href={`tel:${reserva.turistaTelefono.replace(/[^\d+]/g, '')}`}>{reserva.turistaTelefono}</a> : 'Teléfono no disponible'}</dd></div>
      </>}
    </dl>
    <PrecioReserva precioReserva={reserva.precioReserva} monedaReserva={reserva.monedaReserva} totalReserva={reserva.totalReserva}/>
    {reserva.detalleCotizacion && <p>{reserva.detalleCotizacion}</p>}
    <div><h3>Observaciones</h3><p>{reserva.observaciones || 'Sin observaciones.'}</p></div>
    {reserva.motivoRechazo && <div><h3>Motivo del rechazo</h3><p>{reserva.motivoRechazo}</p></div>}
  </div>;
}
