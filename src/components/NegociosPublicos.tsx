import EstadoConsulta from './EstadoConsulta';
import NegocioPublicoCard from './NegocioPublicoCard';
import type { NegocioPublico } from '../types/catalogo';

interface Props {
  negocios: NegocioPublico[];
  cargando: boolean;
  error: string;
  actualizar: () => Promise<void>;
  mensajeVacio?: string;
}

export default function NegociosPublicos({ negocios, cargando, error, actualizar, mensajeVacio = 'Todavía no hay negocios publicados en esta categoría.' }: Props) {
  return <EstadoConsulta cargando={cargando} error={error} actualizar={actualizar} sinDatos={!negocios.length} mensajeVacio={mensajeVacio}>
    <div className="catalog-grid">{negocios.map(negocio => <NegocioPublicoCard key={negocio.id} negocio={negocio}/>)}</div>
  </EstadoConsulta>;
}
