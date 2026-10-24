import { Link } from 'react-router-dom';
import { categoriasCatalogo, seccionesCatalogo } from '../data/categoriasCatalogo';

export default function CatalogoCategorias({ rutaActual }: { rutaActual?: string }) {
  return <nav className="chip-filter catalog-categories" aria-label="Categorías del catálogo">
    {[seccionesCatalogo.todos, ...categoriasCatalogo].map(seccion => <Link key={seccion.ruta} to={seccion.ruta}
      className={`catalog-category${rutaActual === seccion.ruta ? ' catalog-category-selected' : ''}`}
      aria-current={rutaActual === seccion.ruta ? 'page' : undefined}>{seccion.nombre}</Link>)}
  </nav>;
}
