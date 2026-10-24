import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Rol } from '../types/usuario';

function VerificandoSesion({ permisos = false }: { permisos?: boolean }) {
  return <IonPage><IonContent className="ion-padding"><div className="auth-loading"><IonSpinner /><span>{permisos ? 'Verificando permisos…' : 'Cargando tu cuenta…'}</span></div></IonContent></IonPage>;
}

function RevalidarRol({ children, roles }: { children: ReactNode; roles: Rol[] }) {
  const { refrescarUsuario } = useAuth();
  const [resultado, setResultado] = useState<'pendiente' | 'permitido' | 'denegado'>('pendiente');
  const [error, setError] = useState('');
  // Se monta únicamente para la visita activa sin permisos en memoria.
  // La clave de la guarda identifica la visita y los roles requeridos.
  const rolesClave = roles.join(',');
  useEffect(() => {
    let activo = true;
    const requeridos = rolesClave.split(',');
    void refrescarUsuario().then(perfil => {
      if (activo) setResultado(perfil && requeridos.some(rol => perfil.roles.includes(rol as Rol)) ? 'permitido' : 'denegado');
    }).catch(err => {
      if (activo) setError(err instanceof Error ? err.message : 'No se pudieron actualizar tus permisos. Vuelve a Mi cuenta e inténtalo de nuevo.');
    });
    return () => { activo = false; };
  }, [refrescarUsuario, rolesClave]);

  if (error) return <IonPage><IonContent className="ion-padding"><div role="alert" className="notice-error">{error}</div><IonButton routerLink="/mi-cuenta">Volver a Mi cuenta</IonButton></IonContent></IonPage>;
  if (resultado === 'pendiente') return <VerificandoSesion permisos />;
  if (resultado === 'denegado') return <Navigate replace to="/mi-cuenta" />;
  return <>{children}</>;
}

export default function AccesoProtegido({ children, roles, ruta }: { children: ReactNode; roles?: Rol[]; ruta?: string }) {
  const { usuario, cargandoSesion } = useAuth();
  const location = useLocation();
  const rutaActiva = !ruta || location.pathname === ruta;
  const requiereRoles = Boolean(roles?.length);

  if (!usuario) {
    // Una vista retenida no debe redirigir desde otra ruta ni restaurar datos de una sesión cerrada.
    if (!rutaActiva) return null;
    if (cargandoSesion) return <VerificandoSesion />;
    return <Navigate replace to={`/ingresar?continuar=${encodeURIComponent(location.pathname)}`} />;
  }
  if (requiereRoles && roles && !roles.some(rol => usuario.roles.includes(rol))) {
    if (!rutaActiva) return null;
    return <RevalidarRol key={`${location.key}:${location.pathname}:${usuario.id}:${roles.join(',')}`} roles={roles}>{children}</RevalidarRol>;
  }
  // Ionic oculta las páginas autorizadas retenidas y necesita su IonPage para las transiciones.
  // Mantenerlas montadas evita registrar de nuevo la página al volver a Mi cuenta.
  return <>{children}</>;
}
