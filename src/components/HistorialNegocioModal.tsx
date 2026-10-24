import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
import type { HistorialEstado } from '../services/negociosApi';
interface Props {
  abierto: boolean;
  cerrar: () => void;
  historial: HistorialEstado[];
  cargandoHistorial: boolean;
  error: string;
}
export default function HistorialNegocioModal({ abierto, cerrar, historial, cargandoHistorial, error }: Props) {
  return (
    <IonModal isOpen={abierto} onDidDismiss={cerrar}>
      <IonHeader><IonToolbar><IonTitle>Historial de estados</IonTitle><IonButtons slot="end">
        <IonButton onClick={cerrar}>Cerrar</IonButton>
      </IonButtons></IonToolbar></IonHeader>
      <IonContent className="ion-padding">
        {cargandoHistorial && <IonSpinner/>}
        {error && <div className="notice-error" role="alert">{error}</div>}
        {!cargandoHistorial && !historial.length && !error && <p>Sin cambios registrados en el historial.</p>}
        {historial.map(h => <article className="historial-item" key={h.id}>
          <strong>{h.estadoAnterior ?? 'REGISTRO'} → {h.estadoNuevo}</strong>
          <p>{h.motivo}</p><small>{h.actor} · {new Date(h.fechaCambio).toLocaleString('es-CO')}</small>
        </article>)}
      </IonContent>
    </IonModal>
  );
}
