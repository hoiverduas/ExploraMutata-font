import { IonButtons, IonButton, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/react';
import { businessOutline, personCircleOutline, logInOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function BrandHeader({ title, mostrarGestion = true }: { title?: string; mostrarGestion?: boolean }) {
  const navigate = useNavigate();
  const { usuario, tieneRol } = useAuth();
  return (
    <IonHeader translucent>
      <IonToolbar className="explora-toolbar">
        <div className="brand-logo" onClick={() => navigate('/inicio')} role="link" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') navigate('/inicio'); }}>
          <img src="/images/escudo-mutata.png" alt="" />
          <span>explora<strong>mutatá</strong><small>ANTIOQUIA · COLOMBIA</small></span>
        </div>
        {title && <IonTitle className="title-desktop">{title}</IonTitle>}
        <IonButtons slot="end">
          {mostrarGestion && tieneRol('ADMIN','SUPER_ADMIN') &&
            <IonButton aria-label="Gestión de negocios" onClick={() => navigate('/gestion/negocios')}>
              <IonIcon icon={businessOutline} slot="start" /><span className="gestion-text">Gestión</span>
            </IonButton>}
          <IonButton aria-label={usuario ? 'Mi cuenta' : 'Iniciar sesión'} onClick={() => navigate(usuario ? '/mi-cuenta' : '/ingresar')}>
            <IonIcon icon={usuario ? personCircleOutline : logInOutline} slot="start" />
            <span className="gestion-text">{usuario ? 'Mi cuenta' : 'Ingresar'}</span>
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}
