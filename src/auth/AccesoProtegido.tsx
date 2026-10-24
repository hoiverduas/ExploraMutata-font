import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Rol } from '../types/usuario';

export default function AccesoProtegido({ children, roles, ruta }: { children: ReactNode; roles?: Rol[]; ruta?: string }) {
  const { usuario, cargandoSesion } = useAuth();
  const location = useLocation();
  // Ionic conserva vistas anteriores: sus guardas no deben redirigir otra ruta activa.
  if (ruta && location.pathname !== ruta) return null;
  if (cargandoSesion) return <IonPage><IonContent className="ion-padding"><div className="auth-loading"><IonSpinner /> Verificando sesión…</div></IonContent></IonPage>;
  if (!usuario) return <Navigate replace to={`/ingresar?continuar=${encodeURIComponent(location.pathname)}`} />;
  if (roles && !roles.some(rol => usuario.roles.includes(rol))) return <Navigate replace to="/mi-cuenta" />;
  return <>{children}</>;
}
