import { IonButton, IonSpinner } from '@ionic/react';
import { useCallback } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { resenasApi } from '../services/resenasApi';
import type { ResenaPublicaResponse, ResumenResenasResponse } from '../types/resena';
import EstrellasCalificacion from './EstrellasCalificacion';

interface DatosResenas {
  resumen: ResumenResenasResponse;
  resenas: ResenaPublicaResponse[];
}

export default function ResenasNegocioPublicas({ negocioId }: { negocioId: string }) {
  const cargar = useCallback(async (signal: AbortSignal): Promise<DatosResenas> => {
    const [resumen, resenas] = await Promise.all([
      resenasApi.resumenPublico(negocioId, { signal }),
      resenasApi.listarPublicas(negocioId, { signal }),
    ]);
    return { resumen, resenas };
  }, [negocioId]);
  const consulta = useConsultaApi<DatosResenas | null>(cargar, null);

  if (consulta.cargando) return <section className="marketplace-section"><div className="loading-state"><IonSpinner/> Cargando reseñas…</div></section>;
  if (consulta.error) return <section className="marketplace-section"><div className="notice-error">{consulta.error}</div><IonButton fill="clear" onClick={() => void consulta.actualizar()}>Reintentar</IonButton></section>;
  if (!consulta.datos) return null;

  const { resumen, resenas } = consulta.datos;
  return <section className="marketplace-section reviews-section">
    <div className="section-heading"><span>OPINIONES DE VIAJEROS</span><h2>Reseñas del <em>negocio.</em></h2></div>
    <div className="reviews-summary">
      <strong>{resumen.promedio.toFixed(2)}</strong>
      <EstrellasCalificacion valor={Math.round(resumen.promedio)}/>
      <span>{resumen.cantidad} {resumen.cantidad === 1 ? 'reseña' : 'reseñas'}</span>
    </div>
    {resenas.length ? <div className="reviews-list">{resenas.map(resena => <article className="review-card" key={resena.id}>
      <EstrellasCalificacion valor={resena.calificacion}/>
      {resena.comentario && <p>{resena.comentario}</p>}
      <small>{new Date(resena.fechaCreacion).toLocaleDateString('es-CO')}</small>
      {resena.respuestaOperador && <div className="review-response"><strong>Respuesta del negocio</strong><p>{resena.respuestaOperador}</p>{resena.fechaRespuesta && <small>{new Date(resena.fechaRespuesta).toLocaleDateString('es-CO')}</small>}</div>}
    </article>)}</div> : <p className="empty-state">Este negocio todavía no tiene reseñas publicadas.</p>}
  </section>;
}
