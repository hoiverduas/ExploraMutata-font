import { Link } from 'react-router-dom';
import { nombresCategoria } from '../data/categoriasCatalogo';
import { nombresModeloPrecio } from '../types/oferta';
import type { OfertaNegocioResponse } from '../types/oferta';
import type { CategoriaNegocio } from '../types/catalogo';
import PrecioOferta from './PrecioOferta';

// Fotografías editoriales del territorio, no fotografías aportadas por los negocios.
export const imagenEditorialCategoria: Record<CategoriaNegocio, string> = {
  AVENTURA: '/images/rio-bedo.webp', HOSPEDAJE: '/images/naturaleza-comunidad.webp',
  RESTAURANTE: '/images/cultura-local.webp', TRANSPORTE: '/images/hero-mutata.webp',
  GUIA: '/images/comunidad-jaikerazabi.webp', VIDA_NOCTURNA: '/images/cultura-local.webp',
};
const duraciones = { UNICO: 'servicio', DIA: 'día(s)', NOCHE: 'noche(s)', SEMANA: 'semana(s)', MES: 'mes(es)' };

export default function OfertaPublicaCard({ oferta }: { oferta: OfertaNegocioResponse }) {
  return <article className="catalog-card marketplace-card">
    <img className="marketplace-card-image" src={imagenEditorialCategoria[oferta.categoria]} alt="Paisajes y cultura de Mutatá, imagen editorial" loading="lazy"/>
    <div className="catalog-card-body marketplace-card-body"><span>{nombresCategoria[oferta.categoria]}</span><h2>{oferta.nombre}</h2>
      <p>{oferta.negocioNombreComercial}</p>
      {oferta.descripcionOferta && <p className="marketplace-card-description">{oferta.descripcionOferta}</p>}
      <div className="marketplace-badges"><span>{oferta.duracionCantidad} {duraciones[oferta.duracionUnidad]}</span>{oferta.capacidadMaxima !== null && <span>Capacidad: {oferta.capacidadMaxima} personas</span>}</div>
      <PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/><small>{nombresModeloPrecio[oferta.modeloPrecio]}</small>
      <div className="marketplace-actions"><Link className="marketplace-primary-link" to={`/negocios/${encodeURIComponent(oferta.negocioId)}/ofertas/${oferta.id}`}>Ver oferta <span aria-hidden="true">↗</span></Link></div>
    </div>
  </article>;
}
