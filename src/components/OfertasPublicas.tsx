import { useCallback } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { negocioExperienciasApi } from '../services/negocioExperienciasApi';
import type { OfertaExperienciaMonedaResponse } from '../types/ofertaExperiencia';
import EstadoConsulta from './EstadoConsulta';
import OfertaExperienciaCard from './OfertaExperienciaCard';

export default function OfertasPublicas({ destinoSlug, experienciaSlug }: { destinoSlug: string; experienciaSlug: string }) {
  const cargar = useCallback((signal: AbortSignal) => negocioExperienciasApi.listarPublicas(destinoSlug, experienciaSlug, { signal }), [destinoSlug, experienciaSlug]);
  const consulta = useConsultaApi<OfertaExperienciaMonedaResponse[]>(cargar, []);
  return <section><h2>Ofertas disponibles</h2><EstadoConsulta {...consulta} sinDatos={!consulta.datos.length} mensajeVacio="No hay ofertas disponibles.">
    <div className="catalog-grid">{consulta.datos.map(oferta => <OfertaExperienciaCard key={oferta.id} oferta={oferta}/>)}</div>
  </EstadoConsulta></section>;
}
