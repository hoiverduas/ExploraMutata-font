import { formatearPrecio } from '../../domain/precios';
import type { CotizacionPaqueteResponse } from '../../types/paqueteTuristico';
import TotalesViaje from './TotalesViaje';

export default function CotizacionViaje({ cotizacion }: { cotizacion: CotizacionPaqueteResponse }) {
  return <section className="viaje-cotizacion" aria-label="Resumen de la cotización">
    <h2>Resumen de tu viaje</h2>
    {cotizacion.precioComercialAplicado && <p className="notice-success">Esta cotización conserva el precio comercial del paquete de origen.</p>}
    {cotizacion.items.map(({ itemId, cotizacion: item }) => <article className="viaje-cotizacion-item" key={itemId}>
      <div><h3>{item.ofertaNombre}</h3><p>{item.cantidadPersonas} personas{item.cantidadNoches != null && item.cantidadNoches > 0 ? ` · ${item.cantidadNoches} noches` : ''}{item.cantidadDias != null && item.cantidadDias > 0 ? ` · ${item.cantidadDias} días` : ''}{item.cantidadUnidades != null ? ` · ${item.cantidadUnidades} unidades` : ''}{item.cantidadTrayectos != null ? ` · ${item.cantidadTrayectos} trayectos` : ''}</p></div>
      <strong>{item.total === null ? 'Sin cotización disponible' : formatearPrecio(item.total, item.moneda)}</strong>
      {item.detalle && <p>{item.detalle}</p>}
      {!item.cotizacionDisponible && <p className="notice-error">Este servicio no está disponible para reservar con estos parámetros.</p>}
    </article>)}
    <TotalesViaje totales={cotizacion.totales}/>
    {!cotizacion.cotizacionCompleta && <p className="notice-error" role="alert">La cotización está incompleta. Revisa los servicios antes de reservar.</p>}
    <p className="viaje-note">La reserva se enviará a cada negocio. Consulta el estado de cada servicio después de reservar.</p>
  </section>;
}
