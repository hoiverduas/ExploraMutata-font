import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import EstadoConsulta from '../components/EstadoConsulta';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { negocioExperienciasApi } from '../services/negocioExperienciasApi';
import { ApiError } from '../services/http';
import type { OfertaExperienciaMonedaResponse } from '../types/ofertaExperiencia';

// Conserva los enlaces anteriores y continúa por el cotizador de ofertas genéricas.
export default function NuevaReservaPage() {
  const { destinoSlug, experienciaSlug, ofertaId } = useParams<{ destinoSlug: string; experienciaSlug: string; ofertaId: string }>();
  const cargar = useCallback(async (signal: AbortSignal) => {
    if (!destinoSlug || !experienciaSlug || !ofertaId || !Number.isSafeInteger(Number(ofertaId))) throw new ApiError(404, 'No encontramos esta oferta.');
    const ofertas = await negocioExperienciasApi.listarPublicas(destinoSlug, experienciaSlug, { signal });
    const oferta = ofertas.find(item => item.id === Number(ofertaId));
    if (!oferta) throw new ApiError(404, 'Esta oferta ya no está disponible.');
    return oferta;
  }, [destinoSlug, experienciaSlug, ofertaId]);
  const consulta = useConsultaApi<OfertaExperienciaMonedaResponse | null>(cargar, null);
  const oferta = consulta.datos?.id === Number(ofertaId) ? consulta.datos : null;
  return <IonPage><BrandHeader title="Reservar una experiencia"/><IonContent fullscreen><main className="page-width reserva-form-page">
    <div className="gestion-heading"><div><span className="eyebrow">TU PRÓXIMA AVENTURA</span><h1>Prepara tu <em>experiencia.</em></h1></div></div>
    <EstadoConsulta {...consulta} sinDatos={!oferta} mensajeVacio="Esta oferta ya no está disponible.">
      {oferta && <section className="gestion-form-panel"><h2>{oferta.experienciaNombre} · {oferta.destinoNombre}</h2><p>{oferta.negocioNombreComercial}</p><p>Elige tus fechas y personas para consultar el precio antes de reservar o agregar la experiencia a Mi viaje.</p><IonButton routerLink={`/negocios/${encodeURIComponent(oferta.negocioId)}/ofertas/${oferta.id}`}>Cotizar y continuar</IonButton></section>}
    </EstadoConsulta>
  </main></IonContent></IonPage>;
}
