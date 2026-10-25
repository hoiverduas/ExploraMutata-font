import { IonContent, IonPage, IonSearchbar } from '@ionic/react';
import { useCallback, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import TarjetaTuristica from '../components/TarjetaTuristica';
import { nombresDificultad } from '../data/turismo';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { experienciasApi } from '../services/experienciasApi';
import { dificultadesExperiencia } from '../types/experiencia';
import type { DificultadExperiencia, ExperienciaPublica } from '../types/experiencia';

export default function ExperienciasPublicasPage() {
  const [busqueda, setBusqueda] = useState('');
  const [dificultad, setDificultad] = useState<DificultadExperiencia | ''>('');
  const cargar = useCallback((signal: AbortSignal) => experienciasApi.listarPublicas(dificultad || undefined, { signal }), [dificultad]);
  const consulta = useConsultaApi<ExperienciaPublica[]>(cargar, []);
  const texto = busqueda.trim().toLocaleLowerCase('es');
  const experiencias = consulta.datos.filter(experiencia => `${experiencia.nombre} ${experiencia.descripcion ?? ''}`.toLocaleLowerCase('es').includes(texto));
  return <IonPage><BrandHeader title="Experiencias turísticas"/><IonContent fullscreen>
    <div className="catalog-hero page-width"><span className="eyebrow">◆ EXPLORA MUTATÁ</span><h1>Experiencias para sentir el lugar</h1><p>Conoce las actividades disponibles y descubre dónde realizarlas.</p></div>
    <main className="page-width catalog-body"><NavegacionTuristica/>
      <div className="tourism-filters"><IonSearchbar value={busqueda} onIonInput={e => setBusqueda(e.detail.value ?? '')} placeholder="Buscar experiencias" debounce={150}/>
        <label>Dificultad<select value={dificultad} onChange={e => setDificultad(dificultadesExperiencia.find(valor => valor === e.target.value) ?? '')}><option value="">Todas</option>{dificultadesExperiencia.map(valor => <option key={valor} value={valor}>{nombresDificultad[valor]}</option>)}</select></label></div>
      <EstadoConsulta {...consulta} sinDatos={!experiencias.length} mensajeVacio={texto ? 'No encontramos experiencias con esa búsqueda.' : 'No hay experiencias disponibles.'}>
        <div className="catalog-grid">{experiencias.map(experiencia => <TarjetaTuristica key={experiencia.id} nombre={experiencia.nombre} descripcion={experiencia.descripcion} etiqueta={`Dificultad: ${nombresDificultad[experiencia.dificultad]}`} ruta={`/catalogo/experiencias/${encodeURIComponent(experiencia.slug)}`}/>)}</div>
      </EstadoConsulta>
    </main>
  </IonContent></IonPage>;
}
