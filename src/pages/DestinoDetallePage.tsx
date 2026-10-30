import { IonContent, IonPage } from '@ionic/react';
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import TarjetaTuristica from '../components/TarjetaTuristica';
import GaleriaMultimediaPublica from '../components/GaleriaMultimediaPublica';
import UbicacionPublica from '../components/UbicacionPublica';
import { nombresDificultad, nombresTipoDestino } from '../data/turismo';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { destinosApi } from '../services/destinosApi';
import { destinoExperienciasApi } from '../services/destinoExperienciasApi';
import { ApiError } from '../services/http';
import type { DestinoPublico } from '../types/destino';
import type { ExperienciaPublica } from '../types/experiencia';

export default function DestinoDetallePage() {
  const { slug } = useParams<{ slug: string }>();
  const cargarDestino = useCallback((signal: AbortSignal) => {
    if (!slug) return Promise.reject(new ApiError(404, 'No encontramos este destino.'));
    return destinosApi.buscarPublico(slug, { signal });
  }, [slug]);
  const cargarExperiencias = useCallback((signal: AbortSignal) => {
    if (!slug) return Promise.reject(new ApiError(404, 'No encontramos este destino.'));
    return destinoExperienciasApi.experienciasPublicas(slug, { signal });
  }, [slug]);
  const destino = useConsultaApi<DestinoPublico | null>(cargarDestino, null);
  const experiencias = useConsultaApi<ExperienciaPublica[]>(cargarExperiencias, []);
  const datos = destino.datos;
  return <IonPage><BrandHeader title={datos?.nombre ?? 'Destino'}/><IonContent fullscreen><main className="page-width tourism-detail">
    <NavegacionTuristica/><div className="destination-editorial" aria-hidden="true"><img src="/images/rio-bedo.webp" alt=""/><span>Naturaleza y aventura en Mutatá</span></div>
    <EstadoConsulta {...destino} sinDatos={!datos} mensajeVacio="No encontramos este destino.">
      {datos && <><span className="eyebrow">{nombresTipoDestino[datos.tipo]}</span><h1>{datos.nombre}</h1>
        {datos.descripcion && <p className="tourism-description">{datos.descripcion}</p>}
        <GaleriaMultimediaPublica tipo="DESTINO" entidadId={datos.id}/>
        {(datos.direccion || datos.vereda || datos.municipio || datos.ubicacionReferencia) && <section><h2>Ubicación</h2><p>{[datos.direccion, datos.vereda, datos.municipio, datos.ubicacionReferencia].filter(Boolean).join(' · ')}</p></section>}
        {datos.comoLlegar && <section><h2>Cómo llegar</h2><p>{datos.comoLlegar}</p></section>}
        <UbicacionPublica tipo="DESTINO" entidadId={datos.id}/>
        {datos.recomendaciones && <section><h2>Recomendaciones</h2><p>{datos.recomendaciones}</p></section>}
        <section><h2>Experiencias en este destino</h2><EstadoConsulta {...experiencias} sinDatos={!experiencias.datos.length} mensajeVacio="No hay experiencias disponibles en este destino.">
          <div className="catalog-grid">{experiencias.datos.map(experiencia => <TarjetaTuristica key={experiencia.id} nombre={experiencia.nombre} descripcion={experiencia.descripcion} etiqueta={`Dificultad: ${nombresDificultad[experiencia.dificultad]}`} accion="Ver ofertas" ruta={`/destinos/${encodeURIComponent(datos.slug)}/experiencias/${encodeURIComponent(experiencia.slug)}`}/>)}</div>
        </EstadoConsulta></section>
      </>}
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
