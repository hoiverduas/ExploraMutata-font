import { IonButton, IonSpinner } from '@ionic/react';
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
  if (cargando) return <div className="loading-state" role="status"><IonSpinner name="crescent"/> Cargando negocios…</div>;
  if (error) return <div><div className="notice-error" role="alert">{error}</div><IonButton fill="outline" onClick={() => void actualizar()}>Reintentar</IonButton></div>;
  if (!negocios.length) return <p className="empty-state" role="status">{mensajeVacio}</p>;
  return <div className="catalog-grid">{negocios.map(negocio => <NegocioPublicoCard key={negocio.id} negocio={negocio}/>)}</div>;
}
