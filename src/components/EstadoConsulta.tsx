import { IonButton, IonSpinner } from '@ionic/react';
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
  if (cargando) return <div className="loading-state" role="status"><IonSpinner name="crescent"/> Cargando…</div>;
  if (error) return <div><div className="notice-error" role="alert">{error}</div><IonButton fill="outline" onClick={() => void actualizar()}>Reintentar</IonButton></div>;
  if (sinDatos) return <p className="empty-state" role="status">{mensajeVacio}</p>;
  return <>{children}</>;
}
