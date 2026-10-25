import { NavLink } from 'react-router-dom';
import { useViaje } from '../context/ViajeContext';
import SelectorMoneda from './SelectorMoneda';

const secciones = [
  ['/inicio', 'Inicio'], ['/aventuras', 'Aventuras'], ['/alojamientos', 'Hospedajes'],
  ['/restaurantes', 'Restaurantes'], ['/transporte', 'Transporte'], ['/vida-nocturna', 'Vida nocturna'],
  ['/paquetes', 'Paquetes'],
];
export default function NavegacionTuristica() {
  const { cantidadItems } = useViaje();
  return <div className="tourism-navigation"><nav className="chip-filter catalog-categories" aria-label="Explorar Mutatá">
    {secciones.map(([ruta, nombre]) => <NavLink end className={({ isActive }) => `catalog-category${isActive ? ' selected' : ''}`} key={ruta} to={ruta}>{nombre}</NavLink>)}
    <NavLink className={({ isActive }) => `catalog-category${isActive ? ' selected' : ''}`} to="/mi-viaje">Mi viaje{cantidadItems > 0 ? ` (${cantidadItems})` : ''}</NavLink>
  </nav><SelectorMoneda/></div>;
}
