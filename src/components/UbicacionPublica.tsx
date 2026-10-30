import { useCallback } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { mapaApi } from '../services/mapaApi';
import type { PuntoMapaResponse, TipoPuntoMapa } from '../types/mapa';

export default function UbicacionPublica({ tipo, entidadId }: { tipo: TipoPuntoMapa; entidadId: string }) {
  const cargar = useCallback(
    (signal: AbortSignal) => mapaApi.listarPuntos({ tipo }, { signal }),
    [tipo],
  );
  const consulta = useConsultaApi<PuntoMapaResponse[]>(cargar, []);
  const punto = consulta.datos.find(item => item.entidadId === entidadId);

  if (consulta.cargando || consulta.error || !punto) return null;

  const ubicacion = [punto.direccion, punto.vereda, punto.municipio].filter(Boolean).join(' · ');
  return <section className="marketplace-section">
    <h2>Ubicación y cómo llegar</h2>
    {ubicacion && <p>{ubicacion}</p>}
    {punto.referencia && <p>{punto.referencia}</p>}
    {punto.comoLlegar && <p>{punto.comoLlegar}</p>}
    <div className="marketplace-actions">
      {punto.urlGoogleMaps && <a className="resource-inline-link" href={punto.urlGoogleMaps} target="_blank" rel="noreferrer">Abrir en Google Maps</a>}
      {punto.urlWaze && <a className="resource-inline-link" href={punto.urlWaze} target="_blank" rel="noreferrer">Abrir en Waze</a>}
    </div>
  </section>;
}
