import { nombresCategoria } from '../data/categoriasCatalogo';
import type { NegocioPublico } from '../types/catalogo';

export default function NegocioPublicoCard({ negocio }: { negocio: NegocioPublico }) {
  return <article className="catalog-card"><div className="catalog-card-body">
    <span>{negocio.categorias.length ? negocio.categorias.map(categoria => nombresCategoria[categoria]).join(' · ') : 'Sin categoría'}</span>
    <h2>{negocio.nombreComercial}</h2>
    <p>{negocio.descripcion || 'Sin descripción disponible.'}</p>
    <dl className="catalog-contact">
      <div><dt>Teléfono</dt><dd>{negocio.telefonoContacto
        ? <a href={`tel:${negocio.telefonoContacto.replace(/[^\d+]/g, '')}`}>{negocio.telefonoContacto}</a>
        : 'Teléfono no disponible'}</dd></div>
      <div><dt>Correo</dt><dd>{negocio.correoContacto
        ? <a href={`mailto:${encodeURIComponent(negocio.correoContacto)}`}>{negocio.correoContacto}</a>
        : 'Correo no disponible'}</dd></div>
    </dl>
  </div></article>;
}
