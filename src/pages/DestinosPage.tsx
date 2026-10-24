import { IonChip, IonContent, IonLabel, IonPage, IonSearchbar } from '@ionic/react';
import { useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import catalog from '../data/catalog.json';

// Destinos será un recurso independiente de negocios. Conserva su fuente editorial
// mientras se construye ese módulo; no consulta ni clasifica negocios públicos.
export default function DestinosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const categorias = ['Todos', ...new Set(catalog.attractions.map(item => item.category))];
  const consulta = busqueda.trim().toLocaleLowerCase('es');
  const destinos = catalog.attractions.filter(item =>
    `${item.title} ${item.description}`.toLocaleLowerCase('es').includes(consulta)
    && (filtro === 'Todos' || item.category === filtro));

  return <IonPage><BrandHeader title="Destinos"/><IonContent fullscreen>
    <div className="catalog-hero page-width"><span className="eyebrow">◆ NATURALEZA</span><h1>Rincones que te roban el aliento</h1><p>Conoce ríos, cascadas, rutas y comunidades de Mutatá.</p></div>
    <main className="page-width catalog-body">
      <IonSearchbar value={busqueda} onIonInput={e => setBusqueda(e.detail.value ?? '')} placeholder="Buscar destinos" debounce={150}/>
      <div className="chip-filter">{categorias.map(categoria => <IonChip key={categoria} color={categoria === filtro ? 'primary' : undefined} outline={categoria !== filtro} onClick={() => setFiltro(categoria)}><IonLabel>{categoria}</IonLabel></IonChip>)}</div>
      <div className="catalog-grid">{destinos.map(destino => <article className="catalog-card" key={destino.id}><img src={destino.imageUrl} alt={destino.title} loading="lazy"/><div className="catalog-card-body"><span>{destino.category}</span><h2>{destino.title}</h2><p>{destino.description}</p></div></article>)}</div>
      {!destinos.length && <p className="empty-state">No encontramos destinos con esos filtros.</p>}
      <div className="disclaimer-bottom">Información turística de referencia. Los destinos naturales se presentan por separado del catálogo de negocios.</div>
    </main>
  </IonContent></IonPage>;
}
