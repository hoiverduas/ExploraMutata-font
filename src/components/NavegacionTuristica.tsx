import { Link } from 'react-router-dom';
import SelectorMoneda from './SelectorMoneda';

export default function NavegacionTuristica() {
  return <div className="tourism-navigation"><nav className="chip-filter catalog-categories" aria-label="Explorar Mutatá">
    <Link className="catalog-category" to="/destinos">Destinos</Link>
    <Link className="catalog-category" to="/catalogo/experiencias">Experiencias turísticas</Link>
    <Link className="catalog-category" to="/catalogo">Negocios</Link>
  </nav><SelectorMoneda/></div>;
}
