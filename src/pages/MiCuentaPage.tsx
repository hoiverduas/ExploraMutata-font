import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import { logOutOutline, storefrontOutline, personAddOutline } from 'ionicons/icons';
import { Link, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { useAuth } from '../auth/AuthContext';

export default function MiCuentaPage() {
  const { usuario, tieneRol, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  if (!usuario) return null;
  const esAdmin = tieneRol('ADMIN','SUPER_ADMIN');
  return <IonPage><BrandHeader title="Mi cuenta"/><IonContent fullscreen>
    <main className="page-width profile-page">
      <span className="eyebrow">BIENVENIDO A EXPLORA MUTATÁ</span>
      <h1>Hola, <em>{usuario.nombres}.</em></h1>
      <div className="profile-card">
        <div className="profile-avatar" aria-hidden="true">{usuario.nombres.charAt(0).toUpperCase()}</div>
        <div><h2>{usuario.nombres} {usuario.apellidos}</h2><p>{usuario.correo}</p><p>{usuario.telefono || 'Celular no registrado'}</p>
          <div className="profile-tags">{usuario.roles.map(rol => <span key={rol}>{rol.replaceAll('_',' ')}</span>)}</div>
        </div>
      </div>
      {esAdmin && <section className="profile-actions"><h2>Administración</h2>
        <Link className="profile-action" to="/gestion/negocios"><IonIcon icon={storefrontOutline}/> Gestionar negocios <span>→</span></Link>
        {tieneRol('SUPER_ADMIN') && <Link className="profile-action" to="/gestion/administradores/invitar"><IonIcon icon={personAddOutline}/> Invitar administrador <span>→</span></Link>}
      </section>}
      {!esAdmin && <section className="profile-actions"><h2>Mi espacio de viajero</h2><p>Tu cuenta de turista está activa. Los recorridos, favoritos y reservas se habilitarán cuando sus módulos estén disponibles.</p></section>}
      <IonButton fill="outline" color="medium" onClick={() => { cerrarSesion(); navigate('/inicio', { replace: true }); }}>
        <IonIcon slot="start" icon={logOutOutline}/> Cerrar sesión
      </IonButton>
    </main>
  </IonContent></IonPage>;
}
