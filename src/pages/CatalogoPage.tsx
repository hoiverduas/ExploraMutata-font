import { IonButton, IonContent, IonPage, IonSearchbar } from '@ionic/react';
import { useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import CatalogoCategorias from '../components/CatalogoCategorias';
import NegociosPublicos from '../components/NegociosPublicos';
import { seccionesCatalogo } from '../data/categoriasCatalogo';
import type { TipoCatalogo } from '../data/categoriasCatalogo';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';

export default function CatalogoPage({ tipo }: { tipo: TipoCatalogo }) {
  const [busqueda, setBusqueda] = useState('');
  const config = seccionesCatalogo[tipo];
  const categoria = 'categoria' in config ? config.categoria : undefined;
  const { negocios, cargando, error, actualizar } = useCatalogoPublico(categoria);
  const consulta = busqueda.trim().toLocaleLowerCase('es');
  const visibles = negocios.filter(negocio =>
    `${negocio.nombreComercial} ${negocio.descripcion ?? ''}`.toLocaleLowerCase('es').includes(consulta));

  return <IonPage><BrandHeader title={config.nombre}/><IonContent fullscreen>
    <div className="catalog-hero page-width"><span className="eyebrow">◆ {config.etiqueta}</span><h1>{config.titulo}</h1><p>{config.texto}</p></div>
    <main className="page-width catalog-body">
      <CatalogoCategorias rutaActual={config.ruta}/>
      <div className="catalog-tools"><IonSearchbar value={busqueda} onIonInput={e => setBusqueda(e.detail.value ?? '')} placeholder="Buscar en el catálogo" debounce={150}/>
        <IonButton fill="clear" disabled={cargando} onClick={() => void actualizar()}>Actualizar</IonButton></div>
      <NegociosPublicos negocios={visibles} cargando={cargando} error={error} actualizar={actualizar}
        mensajeVacio={consulta ? 'No encontramos negocios con esa búsqueda.' : tipo === 'todos' ? 'Todavía no hay negocios publicados.' : undefined}/>
    </main>
  </IonContent></IonPage>;
}
