import { IonButton, IonContent, IonPage, IonSearchbar } from '@ionic/react';
import { useCallback, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import TarjetaPaqueteComercial from '../components/TarjetaPaqueteComercial';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { paquetesComercialesApi } from '../services/paquetesComercialesApi';
import type { PaqueteComercialResponse } from '../types/paqueteComercial';

export default function PaquetesPage() {
  const cargar = useCallback((signal: AbortSignal) => paquetesComercialesApi.listarPublicos(undefined, { signal }), []);
  const consulta = useConsultaApi<PaqueteComercialResponse[]>(cargar, []);
  const [busqueda, setBusqueda] = useState('');
  const [personas, setPersonas] = useState('');
  const [duracion, setDuracion] = useState('');
  const texto = busqueda.trim().toLocaleLowerCase('es');
  const cantidad = personas ? Number(personas) : null;
  const visibles = consulta.datos.filter(paquete => `${paquete.nombre} ${paquete.negocioNombre} ${paquete.descripcion ?? ''}`.toLocaleLowerCase('es').includes(texto)
    && (!duracion || paquete.duracionUnidad === duracion)
    && (cantidad === null || (cantidad >= paquete.minimoPersonas && (paquete.maximoPersonas === null || cantidad <= paquete.maximoPersonas))));
  return <IonPage><BrandHeader title="Paquetes"/><IonContent fullscreen>
    <div className="marketplace-hero package-hero"><div className="page-width"><span className="eyebrow">TU PRÓXIMA HISTORIA</span><h1>Mutatá, en un <em>solo plan.</em></h1><p>Explora paquetes creados por negocios locales y encuentra los servicios que quieres vivir juntos.</p></div></div>
    <main className="page-width catalog-body"><NavegacionTuristica/>
      <div className="tourism-filters"><IonSearchbar value={busqueda} onIonInput={event => setBusqueda(event.detail.value ?? '')} placeholder="Buscar paquetes o negocios" debounce={150}/>
        <label>Personas<input type="number" min={1} step={1} inputMode="numeric" value={personas} onChange={event => setPersonas(event.target.value)} placeholder="Todas"/></label>
        <label>Duración<select value={duracion} onChange={event => setDuracion(event.target.value)}><option value="">Todas</option><option value="UNICO">Servicio único</option><option value="DIA">Días</option><option value="NOCHE">Noches</option><option value="SEMANA">Semanas</option><option value="MES">Meses</option></select></label>
        <IonButton fill="clear" disabled={consulta.cargando} onClick={() => void consulta.actualizar()}>Actualizar</IonButton>
      </div>
      <EstadoConsulta {...consulta} sinDatos={!visibles.length} mensajeVacio={consulta.datos.length ? 'No encontramos paquetes con esos filtros.' : 'No hay paquetes disponibles en este momento.'}>
        <div className="catalog-grid">{visibles.map(paquete => <TarjetaPaqueteComercial key={paquete.id} paquete={paquete}/>)}</div>
      </EstadoConsulta>
    </main>
  </IonContent></IonPage>;
}
