import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, compassOutline, flashOutline, bedOutline, micOutline } from 'ionicons/icons';
import { Navigate, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AccesoProtegido from './auth/AccesoProtegido';
import InicioPage from './pages/InicioPage';
import CatalogoPage from './pages/CatalogoPage';
import DestinosPage from './pages/DestinosPage';
import NegociosPage from './pages/NegociosPage';
import SofiaPage from './pages/SofiaPage';
import LoginPage from './pages/LoginPage';
import RegistroTuristaPage from './pages/RegistroTuristaPage';
import MiCuentaPage from './pages/MiCuentaPage';
import InvitarAdministradorPage from './pages/InvitarAdministradorPage';
import AceptarInvitacionPage from './pages/AceptarInvitacionPage';

import SolicitudOperadorPage from './pages/SolicitudOperadorPage';
import SolicitudesOperadorAdminPage from './pages/SolicitudesOperadorAdminPage';
import MisNegociosPage from './pages/MisNegociosPage';

setupIonicReact({ mode: 'md' });

function AppNavigation() {
  const { usuario, cargandoSesion } = useAuth();
  return (
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/catalogo" element={<CatalogoPage tipo="todos" />} />
            <Route path="/restaurantes" element={<CatalogoPage tipo="restaurantes" />} />
            <Route path="/vida-nocturna" element={<CatalogoPage tipo="vida-nocturna" />} />
            <Route path="/guias" element={<CatalogoPage tipo="guias" />} />
            <Route path="/transporte" element={<CatalogoPage tipo="transporte" />} />
            <Route path="/destinos" element={<DestinosPage />} />
            <Route path="/experiencias" element={<CatalogoPage tipo="experiencias" />} />
            <Route path="/alojamientos" element={<CatalogoPage tipo="alojamientos" />} />
            <Route path="/sofia" element={<SofiaPage />} />
            <Route path="/ingresar" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroTuristaPage />} />
            <Route path="/aceptar-invitacion" element={<AceptarInvitacionPage />} />
            <Route path="/operador/solicitud" element={<AccesoProtegido ruta="/operador/solicitud"><SolicitudOperadorPage /></AccesoProtegido>} />
            <Route path="/operador/negocios" element={<AccesoProtegido ruta="/operador/negocios" roles={['OPERADOR']}><MisNegociosPage /></AccesoProtegido>} />
            <Route path="/gestion/operadores/solicitudes" element={<AccesoProtegido ruta="/gestion/operadores/solicitudes" roles={['ADMIN','SUPER_ADMIN']}><SolicitudesOperadorAdminPage /></AccesoProtegido>} />
            <Route path="/mi-cuenta" element={<AccesoProtegido ruta="/mi-cuenta"><MiCuentaPage /></AccesoProtegido>} />
            <Route path="/gestion/negocios" element={<AccesoProtegido ruta="/gestion/negocios" roles={['ADMIN','SUPER_ADMIN']}><NegociosPage /></AccesoProtegido>} />
            <Route path="/gestion/administradores/invitar" element={<AccesoProtegido ruta="/gestion/administradores/invitar" roles={['SUPER_ADMIN']}><InvitarAdministradorPage /></AccesoProtegido>} />
            <Route path="/" element={<Navigate to="/inicio" replace />} />
          </IonRouterOutlet>
          <IonTabBar slot="bottom" className="explora-tabs" hidden={cargandoSesion || !usuario}>
            <IonTabButton tab="inicio" href="/inicio"><IonIcon icon={homeOutline} /><IonLabel>Inicio</IonLabel></IonTabButton>
            <IonTabButton tab="destinos" href="/destinos"><IonIcon icon={compassOutline} /><IonLabel>Destinos</IonLabel></IonTabButton>
            <IonTabButton tab="experiencias" href="/experiencias"><IonIcon icon={flashOutline} /><IonLabel>Aventuras</IonLabel></IonTabButton>
            <IonTabButton tab="alojamientos" href="/alojamientos"><IonIcon icon={bedOutline} /><IonLabel>Hospedajes</IonLabel></IonTabButton>
            <IonTabButton tab="sofia" href="/sofia"><IonIcon icon={micOutline} /><IonLabel>Sofía</IonLabel></IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
  );
}

const App = () => (
  <IonApp>
    <AuthProvider><AppNavigation /></AuthProvider>
  </IonApp>
);

export default App;
