import { useCallback } from 'react';
import { IonButton } from '@ionic/react';
import { useAuth } from '../auth/AuthContext';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { negocioExperienciasApi } from '../services/negocioExperienciasApi';
import type { OfertaExperienciaMonedaResponse } from '../types/ofertaExperiencia';
import EstadoConsulta from './EstadoConsulta';
import PrecioOferta from './PrecioOferta';

export default function OfertasPublicas({ destinoSlug, experienciaSlug }: { destinoSlug: string; experienciaSlug: string }) {
  const { usuario, tieneRol } = useAuth();
  const cargar = useCallback((signal: AbortSignal) => negocioExperienciasApi.listarPublicas(destinoSlug, experienciaSlug, { signal }), [destinoSlug, experienciaSlug]);
  const consulta = useConsultaApi<OfertaExperienciaMonedaResponse[]>(cargar, []);
  return <section><h2>Ofertas disponibles</h2><EstadoConsulta {...consulta} sinDatos={!consulta.datos.length} mensajeVacio="No hay ofertas disponibles.">
    <div className="catalog-grid">{consulta.datos.map(oferta => <article className="catalog-card" key={oferta.id}><div className="catalog-card-body">
      <span>{oferta.experienciaNombre} · {oferta.destinoNombre}</span><h2>{oferta.negocioNombreComercial}</h2>
      {oferta.descripcionOferta && <p>{oferta.descripcionOferta}</p>}
      <PrecioOferta precioDesde={oferta.precioDesde} moneda={oferta.moneda} preciosConvertidos={oferta.preciosConvertidos}/>
      <p>{oferta.reservaRequerida ? 'Envía una solicitud para reservar esta experiencia.' : 'No requiere reserva previa.'}</p>
      {oferta.reservaRequerida && (!usuario || tieneRol('TURISTA')) && <IonButton className="btn-explora" routerLink={`/destinos/${encodeURIComponent(oferta.destinoSlug)}/experiencias/${encodeURIComponent(oferta.experienciaSlug)}/reservar/${oferta.id}`}>Reservar</IonButton>}
      {oferta.reservaRequerida && usuario && !tieneRol('TURISTA') && <p>Para solicitar una reserva necesitas una cuenta de turista.</p>}
      <dl className="catalog-contact">
        <div><dt>Teléfono</dt><dd>{oferta.telefonoContacto ? <a href={`tel:${oferta.telefonoContacto.replace(/[^\d+]/g, '')}`}>{oferta.telefonoContacto}</a> : 'Teléfono no disponible'}</dd></div>
        <div><dt>Correo</dt><dd>{oferta.correoContacto ? <a href={`mailto:${encodeURIComponent(oferta.correoContacto)}`}>{oferta.correoContacto}</a> : 'Correo no disponible'}</dd></div>
      </dl>
    </div></article>)}</div>
  </EstadoConsulta></section>;
}
