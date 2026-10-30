import { IonButton, IonContent, IonIcon, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { logOutOutline, storefrontOutline, personAddOutline } from 'ionicons/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import { useAuth } from '../auth/AuthContext';

export default function MiCuentaPage() {
  const { usuario, tieneRol, cerrarSesion, refrescarUsuario } = useAuth();
  const navigate = useNavigate();
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const actualizar = async () => {
    setActualizando(true); setError('');
    try { await refrescarUsuario(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil.'); }
    finally { setActualizando(false); }
  };
  useIonViewWillEnter(() => { void actualizar(); }, [refrescarUsuario]);
  if (!usuario) return <IonPage><BrandHeader title="Mi cuenta"/><IonContent fullscreen>
    <div className="auth-loading"><IonSpinner/><span>Cargando tu cuenta…</span></div>
  </IonContent></IonPage>;
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
      {error && <div role="alert" className="notice-error">{error}</div>}
      <IonButton fill="outline" disabled={actualizando} onClick={() => void actualizar()}>{actualizando ? 'Actualizando…' : 'Actualizar perfil'}</IonButton>
      {tieneRol('TURISTA') && !tieneRol('OPERADOR') && <section className="profile-actions"><h2>Ofrece tus servicios</h2><Link className="profile-action" to="/operador/solicitud"><IonIcon icon={storefrontOutline}/> Quiero ofrecer servicios <span>→</span></Link><p>Solicita acceso para registrar y administrar tus servicios turísticos.</p></section>}
      {tieneRol('OPERADOR') && <section className="profile-actions"><h2>Mi espacio de operador</h2><Link className="profile-action" to="/operador">Resumen de mi actividad <span>→</span></Link><Link className="profile-action" to="/operador/reservas"><IonIcon icon={storefrontOutline}/> Reservas recibidas <span>→</span></Link><Link className="profile-action" to="/operador/negocios"><IonIcon icon={storefrontOutline}/> Mis negocios <span>→</span></Link><Link className="profile-action" to="/operador/finanzas"><IonIcon icon={storefrontOutline}/> Pagos y liquidaciones <span>→</span></Link><Link className="profile-action" to="/operador/comercial"><IonIcon icon={storefrontOutline}/> Mi plan comercial <span>→</span></Link><Link className="profile-action" to="/operador/resenas"><IonIcon icon={storefrontOutline}/> Reseñas de mis negocios <span>→</span></Link><Link className="profile-action" to="/operador/solicitud">Estado de mi solicitud <span>→</span></Link></section>}
      {esAdmin && <section className="profile-actions"><h2>Administración</h2>
        <Link className="profile-action" to="/gestion/destinos"><IonIcon icon={storefrontOutline}/> Destinos y sus experiencias <span>→</span></Link>
        <Link className="profile-action" to="/gestion/experiencias"><IonIcon icon={storefrontOutline}/> Experiencias turísticas <span>→</span></Link>
        <Link className="profile-action" to="/gestion/negocios"><IonIcon icon={storefrontOutline}/> Gestionar negocios <span>→</span></Link>
        <Link className="profile-action" to="/gestion/finanzas"><IonIcon icon={storefrontOutline}/> Administración financiera <span>→</span></Link>
        <Link className="profile-action" to="/gestion/comercial"><IonIcon icon={storefrontOutline}/> Modelo comercial <span>→</span></Link>
        <Link className="profile-action" to="/gestion/resenas"><IonIcon icon={storefrontOutline}/> Moderación de reseñas <span>→</span></Link>
        <Link className="profile-action" to="/gestion/operadores/solicitudes"><IonIcon icon={personAddOutline}/> Solicitudes de operadores <span>→</span></Link>
        {tieneRol('SUPER_ADMIN') && <Link className="profile-action" to="/gestion/administradores/invitar"><IonIcon icon={personAddOutline}/> Invitar administrador <span>→</span></Link>}
      </section>}
      {tieneRol('TURISTA') && <section className="profile-actions"><h2>Mi espacio de viajero</h2><Link className="profile-action" to="/mi-viaje">Armar mi viaje <span>→</span></Link><Link className="profile-action" to="/viajes">Mis viajes <span>→</span></Link><Link className="profile-action" to="/reservas"><IonIcon icon={storefrontOutline}/> Mis reservas <span>→</span></Link><Link className="profile-action" to="/favoritos">Mis favoritos <span>→</span></Link><Link className="profile-action" to="/mis-resenas">Mis reseñas <span>→</span></Link><p>Consulta tus solicitudes, favoritos y opiniones.</p></section>}
      <IonButton fill="outline" color="medium" onClick={() => { cerrarSesion(); navigate('/inicio', { replace: true }); }}>
        <IonIcon slot="start" icon={logOutOutline}/> Cerrar sesión
      </IonButton>
    </main>
  </IonContent></IonPage>;
}
