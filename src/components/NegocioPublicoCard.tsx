import { Link } from 'react-router-dom';
import { imagenEditorialCategoria } from './OfertaPublicaCard';
import { nombresCategoria } from '../data/categoriasCatalogo';
import type { NegocioPublico } from '../types/catalogo';

export default function NegocioPublicoCard({ negocio }: { negocio: NegocioPublico }) {
  return <article className="catalog-card marketplace-card"><img className="marketplace-card-image" src={negocio.categorias.length ? imagenEditorialCategoria[negocio.categorias[0]] : '/images/hero-mutata.webp'} alt="Paisajes y cultura de Mutatá, imagen editorial" loading="lazy"/><div className="catalog-card-body marketplace-card-body">
    <span>{negocio.categorias.length ? negocio.categorias.map(categoria => nombresCategoria[categoria]).join(' · ') : 'Sin categoría'}</span>
    <h2>{negocio.nombreComercial}</h2>
    <p>{negocio.descripcion || 'Sin descripción disponible.'}</p>
    <div className="marketplace-actions"><Link className="marketplace-primary-link" to={`/negocios/${encodeURIComponent(negocio.id)}`}>Ver negocio <span aria-hidden="true">↗</span></Link></div>
  </div></article>;
}
