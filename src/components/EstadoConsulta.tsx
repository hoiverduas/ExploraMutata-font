import { IonButton, IonSkeletonText } from '@ionic/react';
import type { ReactNode } from 'react';

interface Props {
  cargando: boolean;
  error: string;
  actualizar: () => Promise<void>;
  sinDatos?: boolean;
  mensajeVacio?: string;
  children: ReactNode;
}
export default function EstadoConsulta({ cargando, error, actualizar, sinDatos = false, mensajeVacio = 'No hay información disponible.', children }: Props) {
  if (cargando) return <div className="query-loading" role="status" aria-label="Cargando información"><span className="loading-label">Buscando opciones para ti…</span><div className="skeleton-grid" aria-hidden="true">{[1,2,3].map(id => <div className="skeleton-card" key={id}><IonSkeletonText animated className="skeleton-cover"/><IonSkeletonText animated/><IonSkeletonText animated style={{width:'65%'}}/></div>)}</div></div>;
  if (error) return <div><div className="notice-error" role="alert">{error}</div><IonButton fill="outline" onClick={() => void actualizar()}>Reintentar</IonButton></div>;
  if (sinDatos) return <p className="empty-state" role="status">{mensajeVacio}</p>;
  return <>{children}</>;
}
