import { IonContent, IonPage, IonSearchbar, IonChip, IonLabel } from '@ionic/react';
import { useMemo, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import catalog from '../data/catalog.json';

type Tipo = 'destinos' | 'experiencias' | 'alojamientos';
const configs = {
  destinos: { k: 'attractions', etiqueta: 'NATURALEZA', titulo: 'Rincones que te roban el aliento', texto: 'Conoce ríos, cascadas, rutas y comunidades de Mutatá.' },
  experiencias: { k: 'experiences', etiqueta: 'AVENTURAS', titulo: 'Experiencias para sentir el lugar', texto: 'Actividades demostrativas. Cupos y operadores todavía no se encuentran verificados.' },
  alojamientos: { k: 'stays', etiqueta: 'DESCANSO', titulo: 'Encuentra tu próximo refugio', texto: 'Los alojamientos son fichas de ejemplo; no representan negocios reales.' },
} as const;

export default function CatalogoPage({tipo}: {tipo: Tipo}) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const config = configs[tipo];
  const items = catalog[config.k];
  const categorias = useMemo(() => ['Todos', ...new Set(items.map(i => 'category' in i ? i.category : 'location' in i ? i.location : 'Otros'))], [items]);
  const visibles = items.filter(item => {
    const texto = `${item.title} ${item.description}`.toLocaleLowerCase('es');
    const categoria = 'category' in item ? item.category : 'location' in item ? item.location : 'Otros';
    return texto.includes(busqueda.toLocaleLowerCase('es')) && (filtro === 'Todos' || filtro === categoria);
  });
  return <IonPage><BrandHeader title={config.titulo}/><IonContent fullscreen>
    <div className="catalog-hero page-width"><span className="eyebrow">◆ {config.etiqueta}</span><h1>{config.titulo}</h1><p>{config.texto}</p></div>
    <main className="page-width catalog-body">
      <IonSearchbar value={busqueda} onIonInput={e => setBusqueda(e.detail.value ?? '')} placeholder="Buscar en el catálogo" debounce={150} />
      <div className="chip-filter">{categorias.map(c=><IonChip key={c} color={c===filtro?'primary':undefined} outline={c!==filtro} onClick={()=>setFiltro(c)}><IonLabel>{c}</IonLabel></IonChip>)}</div>
      <div className="catalog-grid">{visibles.map(item => <article className="catalog-card" key={item.id}><img src={item.imageUrl} alt={item.title} loading="lazy"/><div className="catalog-card-body"><span>{'category' in item ? item.category : 'location' in item ? item.location : 'FICHA DE PRUEBA'}</span><h2>{item.title}</h2><p>{item.description}</p><strong>Información de demostración</strong></div></article>)}</div>
      {visibles.length===0 && <p className="empty-state">No encontramos resultados con esos filtros.</p>}
      <div className="disclaimer-bottom">Este catálogo es de demostración. No se han conectado reservas, cupos ni pagos reales.</div>
    </main>
  </IonContent></IonPage>;
}
