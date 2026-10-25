import { IonContent, IonPage, IonSearchbar } from '@ionic/react';
import { useCallback, useState } from 'react';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import TarjetaTuristica from '../components/TarjetaTuristica';
import { nombresTipoDestino } from '../data/turismo';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { destinosApi } from '../services/destinosApi';
import { tiposDestino } from '../types/destino';
import type { DestinoPublico, TipoDestino } from '../types/destino';

export default function DestinosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState<TipoDestino | ''>('');
  const cargar = useCallback((signal: AbortSignal) => destinosApi.listarPublicos(tipo || undefined, { signal }), [tipo]);
  const consulta = useConsultaApi<DestinoPublico[]>(cargar, []);
  const texto = busqueda.trim().toLocaleLowerCase('es');
  const destinos = consulta.datos.filter(destino => `${destino.nombre} ${destino.descripcion ?? ''}`.toLocaleLowerCase('es').includes(texto));
  return <IonPage><BrandHeader title="Destinos"/><IonContent fullscreen>
    <div className="catalog-hero page-width"><span className="eyebrow">◆ NATURALEZA Y CULTURA</span><h1>Rincones que te roban el aliento</h1><p>Descubre los destinos de Mutatá y las experiencias disponibles en cada lugar.</p></div>
    <main className="page-width catalog-body"><NavegacionTuristica/>
      <div className="tourism-filters"><IonSearchbar value={busqueda} onIonInput={e => setBusqueda(e.detail.value ?? '')} placeholder="Buscar destinos" debounce={150}/>
        <label>Tipo de destino<select value={tipo} onChange={e => setTipo(tiposDestino.find(valor => valor === e.target.value) ?? '')}><option value="">Todos</option>{tiposDestino.map(valor => <option key={valor} value={valor}>{nombresTipoDestino[valor]}</option>)}</select></label></div>
      <EstadoConsulta {...consulta} sinDatos={!destinos.length} mensajeVacio={texto ? 'No encontramos destinos con esa búsqueda.' : 'No hay destinos disponibles.'}>
        <div className="catalog-grid">{destinos.map(destino => <TarjetaTuristica key={destino.id} nombre={destino.nombre} descripcion={destino.descripcion} etiqueta={nombresTipoDestino[destino.tipo]} ruta={`/destinos/${encodeURIComponent(destino.slug)}`}/>)}</div>
      </EstadoConsulta>
    </main>
  </IonContent></IonPage>;
}
