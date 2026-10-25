import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useConsultaApi } from '../hooks/useConsultaApi';
import { ofertasApi } from '../services/ofertasApi';
import { destinosApi } from '../services/destinosApi';
import { experienciasApi } from '../services/experienciasApi';
import { nombresModeloPrecio } from '../types/oferta';
import type { OfertaNegocioResponse, OfertaRestauranteResponse, OfertaHospedajeResponse, OfertaTransporteResponse, OfertaGuiaResponse, OfertaVidaNocturnaResponse } from '../types/oferta';
import type { DestinoPublico } from '../types/destino';
import type { ExperienciaPublica } from '../types/experiencia';
import EstadoConsulta from './EstadoConsulta';

type Detalle =
  | { categoria: 'AVENTURA'; destino: DestinoPublico | undefined; experiencia: ExperienciaPublica | undefined }
  | { categoria: 'RESTAURANTE'; datos: OfertaRestauranteResponse }
  | { categoria: 'HOSPEDAJE'; datos: OfertaHospedajeResponse }
  | { categoria: 'TRANSPORTE'; datos: OfertaTransporteResponse }
  | { categoria: 'GUIA'; datos: OfertaGuiaResponse }
  | { categoria: 'VIDA_NOCTURNA'; datos: OfertaVidaNocturnaResponse };

const etiquetas: Record<string, string> = { CABANA: 'Cabaña', AUTOMOVIL: 'Automóvil', GUIA_LOCAL: 'Guía local', GUIA_NATURALEZA: 'Guía de naturaleza', GUIA_CULTURAL: 'Guía cultural', GUIA_AVENTURA: 'Guía de aventura', MENU_ESPECIAL: 'Menú especial', NO_APLICA: 'No aplica', IDA_Y_REGRESO: 'Ida y regreso' };
const etiqueta = (valor: string) => etiquetas[valor] ?? (valor.charAt(0) + valor.slice(1).toLocaleLowerCase('es')).replaceAll('_', ' ');
const duraciones = { UNICO: 'Servicio único', DIA: 'Día(s)', NOCHE: 'Noche(s)', SEMANA: 'Semana(s)', MES: 'Mes(es)' };

export default function DatosOferta({ oferta }: { oferta: OfertaNegocioResponse }) {
  const cargar = useCallback(async (signal: AbortSignal): Promise<Detalle> => {
    switch (oferta.categoria) {
      case 'RESTAURANTE': return { categoria: 'RESTAURANTE', datos: await ofertasApi.restaurante.buscarPublica(oferta.negocioId, oferta.id, { signal }) };
      case 'HOSPEDAJE': return { categoria: 'HOSPEDAJE', datos: await ofertasApi.hospedaje.buscarPublica(oferta.negocioId, oferta.id, { signal }) };
      case 'TRANSPORTE': return { categoria: 'TRANSPORTE', datos: await ofertasApi.transporte.buscarPublica(oferta.negocioId, oferta.id, { signal }) };
      case 'GUIA': return { categoria: 'GUIA', datos: await ofertasApi.guia.buscarPublica(oferta.negocioId, oferta.id, { signal }) };
      case 'VIDA_NOCTURNA': return { categoria: 'VIDA_NOCTURNA', datos: await ofertasApi.vidaNocturna.buscarPublica(oferta.negocioId, oferta.id, { signal }) };
      case 'AVENTURA': {
        const [destinos, experiencias] = await Promise.all([destinosApi.listarPublicos(undefined, { signal }), experienciasApi.listarPublicas(undefined, { signal })]);
        return { categoria: 'AVENTURA', destino: destinos.find(item => item.id === oferta.destinoId), experiencia: experiencias.find(item => item.id === oferta.experienciaId) };
      }
    }
  }, [oferta.categoria, oferta.negocioId, oferta.id, oferta.destinoId, oferta.experienciaId]);
  const consulta = useConsultaApi<Detalle | null>(cargar, null);
  const detalle = consulta.datos;
  return <section className="marketplace-section"><h2>Acerca de esta oferta</h2>
    <dl className="marketplace-facts"><div><dt>Modalidad</dt><dd>{nombresModeloPrecio[oferta.modeloPrecio]}</dd></div><div><dt>Duración</dt><dd>{oferta.duracionCantidad} · {duraciones[oferta.duracionUnidad]}</dd></div>
      {oferta.capacidadMaxima !== null && <div><dt>Capacidad por unidad</dt><dd>{oferta.capacidadMaxima} personas</dd></div>}{oferta.personasIncluidas !== null && <div><dt>Personas incluidas</dt><dd>{oferta.personasIncluidas}</dd></div>}
      <div><dt>Reserva</dt><dd>{oferta.reservaRequerida ? 'Requiere solicitud de reserva' : 'Atención directa con el negocio'}</dd></div>
    </dl>
    <EstadoConsulta {...consulta} sinDatos={!detalle} mensajeVacio="No hay información adicional disponible.">
      {detalle?.categoria === 'AVENTURA' && <dl className="marketplace-facts">
        {detalle.destino && <div><dt>Destino</dt><dd><Link to={`/destinos/${encodeURIComponent(detalle.destino.slug)}`}>{detalle.destino.nombre}</Link></dd></div>}
        {detalle.experiencia && <div><dt>Experiencia</dt><dd>{detalle.experiencia.nombre}</dd></div>}
        {detalle.destino && detalle.experiencia && <div><dt>Descubre el lugar</dt><dd><Link to={`/destinos/${encodeURIComponent(detalle.destino.slug)}/experiencias/${encodeURIComponent(detalle.experiencia.slug)}`}>Explorar esta aventura</Link></dd></div>}
      </dl>}
      {detalle?.categoria === 'RESTAURANTE' && <><h3>{detalle.datos.tipoOferta === 'COMBO' ? 'Este combo incluye' : 'Servicio de alimentación'}</h3><ul className="marketplace-includes">{[...detalle.datos.items].sort((a,b) => a.orden - b.orden).map(item => <li key={item.id}><strong>{item.nombre}</strong><span>{etiqueta(item.tipoServicio)} · {item.cantidad} unidad(es)</span>{item.descripcion && <p>{item.descripcion}</p>}</li>)}</ul></>}
      {detalle?.categoria === 'HOSPEDAJE' && <dl className="marketplace-facts"><div><dt>Alojamiento</dt><dd>{etiqueta(detalle.datos.tipoAlojamiento)}</dd></div><div><dt>Habitación</dt><dd>{etiqueta(detalle.datos.tipoHabitacion)}</dd></div>{detalle.datos.cantidadCamas !== null && <div><dt>Camas</dt><dd>{detalle.datos.cantidadCamas}</dd></div>}<div><dt>Baño privado</dt><dd>{detalle.datos.banoPrivado ? 'Sí' : 'No'}</dd></div><div><dt>Desayuno incluido</dt><dd>{detalle.datos.incluyeDesayuno ? 'Sí' : 'No'}</dd></div></dl>}
      {detalle?.categoria === 'TRANSPORTE' && <dl className="marketplace-facts"><div><dt>Recorrido</dt><dd>{detalle.datos.origen} → {detalle.datos.destino}</dd></div><div><dt>Servicio</dt><dd>{etiqueta(detalle.datos.tipoServicio)}</dd></div><div><dt>Vehículo</dt><dd>{etiqueta(detalle.datos.tipoVehiculo)}</dd></div><div><dt>Trayectos predeterminados</dt><dd>{detalle.datos.trayectosPredeterminados}</dd></div></dl>}
      {detalle?.categoria === 'GUIA' && <dl className="marketplace-facts"><div><dt>Servicio</dt><dd>{etiqueta(detalle.datos.tipoServicio)}</dd></div><div><dt>Idiomas</dt><dd>{detalle.datos.idiomas}</dd></div>{detalle.datos.puntoEncuentro && <div><dt>Punto de encuentro</dt><dd>{detalle.datos.puntoEncuentro}</dd></div>}<div><dt>Equipo incluido</dt><dd>{detalle.datos.incluyeEquipo ? 'Sí' : 'No'}</dd></div></dl>}
      {detalle?.categoria === 'VIDA_NOCTURNA' && <dl className="marketplace-facts"><div><dt>Servicio</dt><dd>{etiqueta(detalle.datos.tipoServicio)}</dd></div>{detalle.datos.edadMinima !== null && <div><dt>Edad mínima</dt><dd>{detalle.datos.edadMinima} años</dd></div>}<div><dt>Consumo incluido</dt><dd>{detalle.datos.incluyeConsumo ? 'Sí' : 'No'}</dd></div>{detalle.datos.condicionesAcceso && <div><dt>Condiciones de acceso</dt><dd>{detalle.datos.condicionesAcceso}</dd></div>}</dl>}
    </EstadoConsulta>
  </section>;
}
