import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, compassOutline, flashOutline, bedOutline, micOutline } from 'ionicons/icons';
import { Navigate, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import AccesoProtegido from './auth/AccesoProtegido';
import InicioPage from './pages/InicioPage';
import CatalogoPage from './pages/CatalogoPage';
import NegociosPage from './pages/NegociosPage';
import SofiaPage from './pages/SofiaPage';
import LoginPage from './pages/LoginPage';
import RegistroTuristaPage from './pages/RegistroTuristaPage';
import MiCuentaPage from './pages/MiCuentaPage';
import InvitarAdministradorPage from './pages/InvitarAdministradorPage';
import AceptarInvitacionPage from './pages/AceptarInvitacionPage';

setupIonicReact({ mode: 'md' });

const App = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/destinos" element={<CatalogoPage tipo="destinos" />} />
            <Route path="/experiencias" element={<CatalogoPage tipo="experiencias" />} />
            <Route path="/alojamientos" element={<CatalogoPage tipo="alojamientos" />} />
            <Route path="/sofia" element={<SofiaPage />} />
            <Route path="/ingresar" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroTuristaPage />} />
            <Route path="/aceptar-invitacion" element={<AceptarInvitacionPage />} />
            <Route path="/mi-cuenta" element={<AccesoProtegido><MiCuentaPage /></AccesoProtegido>} />
            <Route path="/gestion/negocios" element={<AccesoProtegido roles={['ADMIN','SUPER_ADMIN']}><NegociosPage /></AccesoProtegido>} />
            <Route path="/gestion/administradores/invitar" element={<AccesoProtegido roles={['SUPER_ADMIN']}><InvitarAdministradorPage /></AccesoProtegido>} />
            <Route path="/" element={<Navigate to="/inicio" replace />} />
          </IonRouterOutlet>
          <IonTabBar slot="bottom" className="explora-tabs">
            <IonTabButton tab="inicio" href="/inicio"><IonIcon icon={homeOutline} /><IonLabel>Inicio</IonLabel></IonTabButton>
            <IonTabButton tab="destinos" href="/destinos"><IonIcon icon={compassOutline} /><IonLabel>Destinos</IonLabel></IonTabButton>
            <IonTabButton tab="experiencias" href="/experiencias"><IonIcon icon={flashOutline} /><IonLabel>Aventuras</IonLabel></IonTabButton>
            <IonTabButton tab="alojamientos" href="/alojamientos"><IonIcon icon={bedOutline} /><IonLabel>Hospedajes</IonLabel></IonTabButton>
            <IonTabButton tab="sofia" href="/sofia"><IonIcon icon={micOutline} /><IonLabel>Sofía</IonLabel></IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;
