import { NavLink, useLocation } from 'react-router-dom';
import { useViaje } from '../context/ViajeContext';
import SelectorMoneda from './SelectorMoneda';

const secciones = [
  ['/inicio', 'Inicio'], ['/aventuras', 'Aventuras'], ['/alojamientos', 'Hospedajes'],
  ['/restaurantes', 'Restaurantes'], ['/transporte', 'Transporte'], ['/vida-nocturna', 'Vida nocturna'],
  ['/paquetes', 'Paquetes'],
];
export default function NavegacionTuristica() {
  const { cantidadItems } = useViaje();
  const { pathname } = useLocation();
  const enInicio = pathname === '/' || pathname === '/inicio';
  return <div className="tourism-navigation"><nav className="chip-filter catalog-categories" aria-label="Explorar Mutatá">
    {secciones.map(([ruta, nombre]) => <NavLink end className={({ isActive }) => `catalog-category${isActive ? ' selected' : ''}`} key={ruta} to={ruta}>{ruta === '/inicio' && !enInicio ? '← Regresar al inicio' : nombre}</NavLink>)}
    <NavLink className={({ isActive }) => `catalog-category${isActive ? ' selected' : ''}`} to="/mi-viaje">Mi viaje{cantidadItems > 0 ? ` (${cantidadItems})` : ''}</NavLink>
  </nav><SelectorMoneda/></div>;
}
