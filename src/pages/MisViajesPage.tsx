import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import CrearViajeForm from '../components/viaje/CrearViajeForm';
import EstadoViajeBadge from '../components/viaje/EstadoViajeBadge';
import TotalesViaje from '../components/viaje/TotalesViaje';
import { formatearFechaReserva } from '../domain/reservas';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { paquetesTuristicosApi } from '../services/paquetesTuristicosApi';
import type { PaqueteTuristico } from '../types/paqueteTuristico';

function rangoFechas(viaje: PaqueteTuristico): string {
  const fechas = viaje.items.flatMap(item => [item.fechaInicio, ...(item.fechaFin ? [item.fechaFin] : [])]).sort();
  return fechas.length ? `${formatearFechaReserva(fechas[0])}${fechas.at(-1) !== fechas[0] ? ` – ${formatearFechaReserva(fechas.at(-1)!)}` : ''}` : '';
}

export default function MisViajesPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [creando, setCreando] = useState(false);
  const cargar = useCallback((signal: AbortSignal) => paquetesTuristicosApi.listar({ signal }), [usuario?.id]);
  const consulta = useConsultaApi<PaqueteTuristico[]>(cargar, []);
  return <IonPage><BrandHeader title="Mis viajes"/><IonContent fullscreen><main className="page-width viaje-page">
    <Link className="resource-inline-link" to="/mi-cuenta">Mi cuenta</Link>
    <div className="gestion-heading"><div><span className="eyebrow">TUS HISTORIAS EN MUTATÁ</span><h1>Mis <em>viajes.</em></h1><p>Todos los servicios de tu próxima escapada, en un solo lugar.</p></div><IonButton onClick={() => setCreando(true)}>Armar un viaje</IonButton></div>
    {creando && <CrearViajeForm onCancelar={() => setCreando(false)} onCreado={viaje => navigate(`/viajes/${encodeURIComponent(viaje.id)}`)}/>}
    <EstadoConsulta {...consulta}>
      {!consulta.datos.length ? <div className="empty-state"><h2>Todavía no tienes viajes</h2><p>Descubre ofertas y construye una aventura a tu medida.</p><IonButton onClick={() => setCreando(true)}>Crear mi primer viaje</IonButton><Link className="resource-inline-link" to="/paquetes">Explorar paquetes →</Link></div> : <div className="viajes-grid">
        {consulta.datos.map(viaje => <article key={viaje.id} className="viaje-card"><div className="viaje-card-cover" aria-hidden="true"/><div className="viaje-card-body"><EstadoViajeBadge estado={viaje.estadoResumen}/><h2>{viaje.nombre}</h2><p>{viaje.totalItems} {viaje.totalItems === 1 ? 'servicio' : 'servicios'}</p>
          {viaje.items.length > 0 && <p>{rangoFechas(viaje)}</p>}
          {viaje.totalesReserva ? <TotalesViaje totales={viaje.totalesReserva} historico/> : <p className="viaje-note">{viaje.estado === 'BORRADOR' ? 'Cotiza al terminar de elegir tus servicios.' : 'Sin total histórico disponible.'}</p>}
          <Link className="resource-inline-link" to={`/viajes/${encodeURIComponent(viaje.id)}`}>{viaje.estado === 'BORRADOR' ? 'Continuar armando mi viaje' : 'Ver mi viaje'} →</Link>
        </div></article>)}
      </div>}
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
