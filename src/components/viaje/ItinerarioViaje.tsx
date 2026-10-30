import { IonButton, IonIcon } from '@ionic/react';
import { bedOutline, busOutline, compassOutline, restaurantOutline, peopleOutline, moonOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import EstadoReservaBadge from '../EstadoReservaBadge';
import { formatearPrecio } from '../../domain/precios';
import type { CategoriaNegocio } from '../../types/catalogo';
import type { PaqueteTuristicoItem } from '../../types/paqueteTuristico';

const iconos: Record<CategoriaNegocio, string> = { AVENTURA: compassOutline, HOSPEDAJE: bedOutline, RESTAURANTE: restaurantOutline, TRANSPORTE: busOutline, GUIA: peopleOutline, VIDA_NOCTURNA: moonOutline };
const fechaTexto = (fecha: string) => new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
interface Props {
  items: PaqueteTuristicoItem[];
  editable: boolean;
  ocupado: boolean;
  editar(item: PaqueteTuristicoItem): void;
  eliminar(item: PaqueteTuristicoItem): void;
}
export default function ItinerarioViaje({ items, editable, ocupado, editar, eliminar }: Props) {
  const ordenados = [...items].sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio) || a.orden - b.orden);
  const fechas = [...new Set(ordenados.map(item => item.fechaInicio))];
  if (!items.length) return <div className="empty-state"><h2>Tu próxima historia empieza aquí</h2><p>Aún no has agregado servicios a tu viaje.</p><Link className="resource-inline-link" to="/catalogo">Explorar ofertas →</Link></div>;
  return <div className="viaje-itinerario">{fechas.map(fecha => <section className="viaje-dia" key={fecha}>
    <h2>{fechaTexto(fecha)}</h2>
    {ordenados.filter(item => item.fechaInicio === fecha).map(item => <article className="viaje-item" key={item.id}>
      <div className="viaje-item-icon"><IonIcon icon={iconos[item.categoria]}/></div>
      <div className="viaje-item-body"><span className="eyebrow">{item.categoria.replaceAll('_', ' ')}</span><h3>{item.ofertaNombre}</h3><p>{item.negocioNombreComercial}</p>
        {item.varianteNombre && <p><strong>Opción:</strong> {item.varianteNombre}</p>}
        <p>{item.cantidadPersonas} personas{item.fechaFin ? ` · hasta ${fechaTexto(item.fechaFin)}` : ''}{item.cantidadTrayectos != null ? ` · ${item.cantidadTrayectos} trayectos` : ''}{(item.franjaHorariaId || item.salidaProgramadaId) ? ' · horario seleccionado' : ''}</p>
        {item.observaciones && <p>{item.observaciones}</p>}
        {item.estadoReserva && <EstadoReservaBadge estado={item.estadoReserva}/>}
        {item.monedaReserva && <p className="viaje-precio-historico"><strong>Precio reservado: {item.totalReserva === null ? 'No especificado' : formatearPrecio(item.totalReserva, item.monedaReserva)}</strong></p>}
        {item.reservaId && <Link className="resource-inline-link" to={`/reservas/${encodeURIComponent(item.reservaId)}`}>Ver reserva individual →</Link>}
        {editable && <div className="viaje-item-actions"><IonButton fill="outline" size="small" disabled={ocupado} onClick={() => editar(item)}>Editar servicio</IonButton><IonButton fill="clear" color="medium" size="small" disabled={ocupado} onClick={() => eliminar(item)}>Quitar</IonButton></div>}
      </div>
    </article>)}
  </section>)}</div>;
}
