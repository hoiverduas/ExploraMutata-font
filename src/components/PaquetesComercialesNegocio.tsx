import { useCallback } from 'react';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { paquetesComercialesApi } from '../services/paquetesComercialesApi';
import type { PaqueteComercialResponse } from '../types/paqueteComercial';
import EstadoConsulta from './EstadoConsulta';
import TarjetaPaqueteComercial from './TarjetaPaqueteComercial';

export default function PaquetesComercialesNegocio({ negocioId }: { negocioId: string }) {
  const cargar = useCallback((signal: AbortSignal) => paquetesComercialesApi.listarPublicos(negocioId, { signal }), [negocioId]);
  const consulta = useConsultaApi<PaqueteComercialResponse[]>(cargar, []);
  return <section><h2>Paquetes del negocio</h2><EstadoConsulta {...consulta} sinDatos={!consulta.datos.length} mensajeVacio="Este negocio todavía no tiene paquetes publicados.">
    <div className="catalog-grid">{consulta.datos.map(paquete => <TarjetaPaqueteComercial key={paquete.id} paquete={paquete}/>)}</div>
  </EstadoConsulta></section>;
}
