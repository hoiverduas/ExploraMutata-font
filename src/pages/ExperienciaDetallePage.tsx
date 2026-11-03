import { IonContent, IonPage } from '@ionic/react';
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import NavegacionTuristica from '../components/NavegacionTuristica';
import OfertasPublicas from '../components/OfertasPublicas';
import CarruselMultimediaPublico from '../components/CarruselMultimediaPublico';
import BotonFavorito from '../components/BotonFavorito';
import { nombresDificultad } from '../data/turismo';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { destinoExperienciasApi } from '../services/destinoExperienciasApi';
import { destinosApi } from '../services/destinosApi';
import { experienciasApi } from '../services/experienciasApi';
import { ApiError } from '../services/http';
import type { DestinoPublico } from '../types/destino';
import type { ExperienciaPublica } from '../types/experiencia';

export default function ExperienciaDetallePage() {
  const params = useParams<{ slug: string; destinoSlug: string; experienciaSlug: string }>();
  const slug = params.experienciaSlug ?? params.slug;
  const destinoSlug = params.destinoSlug;
  const cargarExperiencia = useCallback(async (signal: AbortSignal) => {
    if (!slug) throw new ApiError(404, 'No encontramos esta experiencia.');
    if (!destinoSlug) return experienciasApi.buscarPublica(slug, { signal });
    const disponibles = await destinoExperienciasApi.experienciasPublicas(destinoSlug, { signal });
    const experiencia = disponibles.find(item => item.slug === slug);
    if (!experiencia) throw new ApiError(404, 'Esta experiencia no está disponible en este destino.');
    return experiencia;
  }, [slug, destinoSlug]);
  const cargarDestinos = useCallback(async (signal: AbortSignal) => {
    if (!slug) throw new ApiError(404, 'No encontramos esta experiencia.');
    if (destinoSlug) return [await destinosApi.buscarPublico(destinoSlug, { signal })];
    return destinoExperienciasApi.destinosPublicos(slug, { signal });
  }, [slug, destinoSlug]);
  const experiencia = useConsultaApi<ExperienciaPublica | null>(cargarExperiencia, null);
  const destinos = useConsultaApi<DestinoPublico[]>(cargarDestinos, []);
  const datos = experiencia.datos;
  return <IonPage><BrandHeader title={datos?.nombre ?? 'Experiencia'}/><IonContent fullscreen><main className="page-width tourism-detail">
    <NavegacionTuristica/><div className="adventure-path" aria-label="Tu ruta de aventura"><span>Aventuras</span><span aria-hidden="true">→</span><span>{destinos.datos[0]?.nombre || "Destino"}</span><span aria-hidden="true">→</span><strong>{datos?.nombre || "Experiencia"}</strong><span aria-hidden="true">→</span><span>Ofertas</span></div>
    <EstadoConsulta {...experiencia} sinDatos={!datos} mensajeVacio="No encontramos esta experiencia.">
      {datos && <><span className="eyebrow">EXPERIENCIAS DE MUTATÁ</span><div className="detail-title-actions"><h1>{datos.nombre}</h1><BotonFavorito tipo="EXPERIENCIA" recursoId={datos.id}/></div>
        {datos.descripcion && <p className="tourism-description">{datos.descripcion}</p>}
        <CarruselMultimediaPublico tipo="EXPERIENCIA" entidadId={datos.id} etiqueta={`Fotos y videos de ${datos.nombre}`}/>
        <dl className="tourism-facts"><div><dt>Dificultad</dt><dd>{nombresDificultad[datos.dificultad]}</dd></div>{datos.duracionReferencia && <div><dt>Duración de referencia</dt><dd>{datos.duracionReferencia}</dd></div>}</dl>
        {datos.recomendaciones && <section><h2>Recomendaciones</h2><p>{datos.recomendaciones}</p></section>}
        {destinoSlug && slug && !destinos.cargando && !destinos.error && destinos.datos.length > 0 && <OfertasPublicas destinoSlug={destinoSlug} experienciaSlug={slug}/>}
      </>}
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
