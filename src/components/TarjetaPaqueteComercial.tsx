import { Link } from 'react-router-dom';
import type { PaqueteComercialResponse } from '../types/paqueteComercial';
import { nombresModeloPaquete } from '../types/paqueteComercial';
import PrecioOferta from './PrecioOferta';

const unidades = { UNICO: 'servicio', DIA: 'día(s)', NOCHE: 'noche(s)', SEMANA: 'semana(s)', MES: 'mes(es)' } as const;
export default function TarjetaPaqueteComercial({ paquete }: { paquete: PaqueteComercialResponse }) {
  return <article className="catalog-card package-card">
    <div className="package-card-image"><img src="/images/naturaleza-comunidad.webp" alt="" loading="lazy"/><span className="package-duration">{paquete.duracionCantidad} {unidades[paquete.duracionUnidad]}</span></div>
    <div className="catalog-card-body"><span>PAQUETE · {paquete.negocioNombre}</span><h2>{paquete.nombre}</h2>
      {paquete.descripcion && <p className="package-card-description">{paquete.descripcion}</p>}
      <p>{paquete.totalItems} servicio(s) · Desde {paquete.minimoPersonas} persona(s){paquete.maximoPersonas !== null ? ` · Máximo ${paquete.maximoPersonas}` : ''}</p>
      {paquete.precio !== null && paquete.moneda ? <><PrecioOferta precioDesde={paquete.precio} moneda={paquete.moneda}/><small>{nombresModeloPaquete[paquete.modeloPrecio]}</small></> : <p>Precio según los servicios incluidos. Consulta la cotización.</p>}
      <Link className="resource-inline-link" to={`/paquetes/${encodeURIComponent(paquete.id)}`}>Ver paquete <span aria-hidden="true">→</span></Link>
    </div>
  </article>;
}
