import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, compassOutline, bedOutline, bagHandleOutline, mapOutline } from 'ionicons/icons';
import { Navigate, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AccesoProtegido from './auth/AccesoProtegido';
import InicioPage from './pages/InicioPage';
import CatalogoPage from './pages/CatalogoPage';
import DestinosPage from './pages/DestinosPage';
import DestinoDetallePage from './pages/DestinoDetallePage';
import ExperienciasPublicasPage from './pages/ExperienciasPublicasPage';
import ExperienciaDetallePage from './pages/ExperienciaDetallePage';
import DestinosAdminPage from './pages/DestinosAdminPage';
import ExperienciasAdminPage from './pages/ExperienciasAdminPage';
import DestinoExperienciasAdminPage from './pages/DestinoExperienciasAdminPage';
import OfertasNegocioPage from './pages/OfertasNegocioPage';
import NuevaReservaPage from './pages/NuevaReservaPage';
import MisReservasPage from './pages/MisReservasPage';
import ReservaDetallePage from './pages/ReservaDetallePage';
import ReservasOperadorPage from './pages/ReservasOperadorPage';
import NegocioDetallePage from './pages/NegocioDetallePage';
import OfertaDetallePage from './pages/OfertaDetallePage';
import PaquetesPage from './pages/PaquetesPage';
import PaqueteDetallePage from './pages/PaqueteDetallePage';
import PaquetesOperadorPage from './pages/PaquetesOperadorPage';
import MiViajePage from './pages/MiViajePage';
import MisViajesPage from './pages/MisViajesPage';
import ViajeDetallePage from './pages/ViajeDetallePage';
import OperadorResumenPage from './pages/OperadorResumenPage';
import { ViajeProvider, useViaje } from './context/ViajeContext';
import { MonedaProvider } from './context/MonedaContext';
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
  const { cantidadItems } = useViaje();
  return (
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/aventuras" element={<DestinosPage />} />
            <Route path="/negocios/:negocioId" element={<NegocioDetallePage />} />
            <Route path="/negocios/:negocioId/ofertas/:ofertaId" element={<OfertaDetallePage />} />
            <Route path="/paquetes" element={<PaquetesPage />} />
            <Route path="/paquetes/:paqueteId" element={<PaqueteDetallePage />} />
            <Route path="/mi-viaje" element={<AccesoProtegido ruta="/mi-viaje" roles={['TURISTA']}><MiViajePage /></AccesoProtegido>} />
            <Route path="/viajes" element={<AccesoProtegido ruta="/viajes" roles={['TURISTA']}><MisViajesPage /></AccesoProtegido>} />
            <Route path="/viajes/:id" element={<AccesoProtegido ruta="/viajes/:id" roles={['TURISTA']}><ViajeDetallePage /></AccesoProtegido>} />
            <Route path="/operador" element={<AccesoProtegido ruta="/operador" roles={['OPERADOR']}><OperadorResumenPage /></AccesoProtegido>} />
            <Route path="/operador/negocios/:negocioId/paquetes" element={<AccesoProtegido ruta="/operador/negocios/:negocioId/paquetes" roles={['OPERADOR']}><PaquetesOperadorPage /></AccesoProtegido>} />
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/catalogo" element={<CatalogoPage tipo="todos" />} />
            <Route path="/restaurantes" element={<CatalogoPage tipo="restaurantes" />} />
            <Route path="/vida-nocturna" element={<CatalogoPage tipo="vida-nocturna" />} />
            <Route path="/guias" element={<CatalogoPage tipo="guias" />} />
            <Route path="/transporte" element={<CatalogoPage tipo="transporte" />} />
            <Route path="/catalogo/experiencias" element={<ExperienciasPublicasPage />} />
            <Route path="/catalogo/experiencias/:slug" element={<ExperienciaDetallePage />} />
            <Route path="/destinos/:slug" element={<DestinoDetallePage />} />
            <Route path="/destinos/:destinoSlug/experiencias/:experienciaSlug" element={<ExperienciaDetallePage />} />
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
            <Route path="/reservas" element={<AccesoProtegido ruta="/reservas" roles={['TURISTA']}><MisReservasPage /></AccesoProtegido>} />
            <Route path="/reservas/:id" element={<AccesoProtegido ruta="/reservas/:id" roles={['TURISTA']}><ReservaDetallePage /></AccesoProtegido>} />
            <Route path="/destinos/:destinoSlug/experiencias/:experienciaSlug/reservar/:ofertaId" element={<AccesoProtegido ruta="/destinos/:destinoSlug/experiencias/:experienciaSlug/reservar/:ofertaId" roles={['TURISTA']}><NuevaReservaPage /></AccesoProtegido>} />
            <Route path="/operador/reservas" element={<AccesoProtegido ruta="/operador/reservas" roles={['OPERADOR']}><ReservasOperadorPage /></AccesoProtegido>} />
            <Route path="/mi-cuenta" element={<AccesoProtegido ruta="/mi-cuenta"><MiCuentaPage /></AccesoProtegido>} />
            <Route path="/gestion/destinos" element={<AccesoProtegido ruta="/gestion/destinos" roles={['ADMIN','SUPER_ADMIN']}><DestinosAdminPage /></AccesoProtegido>} />
            <Route path="/gestion/experiencias" element={<AccesoProtegido ruta="/gestion/experiencias" roles={['ADMIN','SUPER_ADMIN']}><ExperienciasAdminPage /></AccesoProtegido>} />
            <Route path="/gestion/destinos/:destinoId/experiencias" element={<AccesoProtegido ruta="/gestion/destinos/:destinoId/experiencias" roles={['ADMIN','SUPER_ADMIN']}><DestinoExperienciasAdminPage /></AccesoProtegido>} />
            <Route path="/operador/negocios/:negocioId/ofertas" element={<AccesoProtegido ruta="/operador/negocios/:negocioId/ofertas" roles={['OPERADOR']}><OfertasNegocioPage /></AccesoProtegido>} />
            <Route path="/gestion/negocios" element={<AccesoProtegido ruta="/gestion/negocios" roles={['ADMIN','SUPER_ADMIN']}><NegociosPage /></AccesoProtegido>} />
            <Route path="/gestion/administradores/invitar" element={<AccesoProtegido ruta="/gestion/administradores/invitar" roles={['SUPER_ADMIN']}><InvitarAdministradorPage /></AccesoProtegido>} />
            <Route path="/" element={<Navigate to="/inicio" replace />} />
          </IonRouterOutlet>
          <IonTabBar slot="bottom" className="explora-tabs" hidden={cargandoSesion || !usuario}>
            <IonTabButton tab="inicio" href="/inicio"><IonIcon icon={homeOutline} /><IonLabel>Inicio</IonLabel></IonTabButton>
            <IonTabButton tab="aventuras" href="/aventuras"><IonIcon icon={compassOutline} /><IonLabel>Aventuras</IonLabel></IonTabButton>
            <IonTabButton tab="alojamientos" href="/alojamientos"><IonIcon icon={bedOutline} /><IonLabel>Hospedajes</IonLabel></IonTabButton>
            <IonTabButton tab="paquetes" href="/paquetes"><IonIcon icon={bagHandleOutline} /><IonLabel>Paquetes</IonLabel></IonTabButton>
            <IonTabButton tab="mi-viaje" href="/mi-viaje"><IonIcon icon={mapOutline} /><IonLabel>Mi viaje{cantidadItems > 0 ? ` (${cantidadItems})` : ''}</IonLabel></IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
  );
}

const App = () => (
  <IonApp>
    <MonedaProvider><AuthProvider><ViajeProvider><AppNavigation /></ViajeProvider></AuthProvider></MonedaProvider>
  </IonApp>
);

export default App;
