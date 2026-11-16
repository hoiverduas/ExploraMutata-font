import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Las rutas públicas disponen de un título y descripción específicos.
// Las rutas dinámicas necesitan una segunda fase de SEO con sus datos reales y prerenderizado.
type SeoPagina = { titulo: string; descripcion: string };

const seoPaginas: Record<string, SeoPagina> = {
  '/inicio': {
    titulo: 'Mutatá, Antioquia: turismo y qué hacer | Explora Mutatá',
    descripcion: 'Descubre qué hacer en Mutatá, Antioquia: turismo en Urabá, ríos, aventuras, restaurantes, hospedajes y reservas de experiencias en Explora Mutatá.',
  },
  '/aventuras': {
    titulo: 'Aventuras y turismo en Mutatá, Urabá | Explora Mutatá',
    descripcion: 'Explora lugares naturales, ríos, destinos y aventuras en Mutatá, Antioquia. Conoce experiencias turísticas y organiza tu viaje por Urabá.',
  },
  '/experiencias': {
    titulo: 'Experiencias y turismo de aventura en Mutatá | Explora Mutatá',
    descripcion: 'Conoce operadores de aventura, naturaleza y actividades turísticas de Mutatá y el Urabá antioqueño. Encuentra experiencias para tu viaje.',
  },
  '/alojamientos': {
    titulo: 'Hoteles y hospedajes en Mutatá, Antioquia | Explora Mutatá',
    descripcion: 'Encuentra hoteles y hospedajes publicados en Mutatá, Antioquia. Consulta alojamientos, ofertas y opciones de reserva para visitar Urabá.',
  },
  '/restaurantes': {
    titulo: 'Restaurantes en Mutatá, Antioquia | Explora Mutatá',
    descripcion: 'Descubre restaurantes en Mutatá y la gastronomía del Urabá antioqueño. Consulta opciones para comer, platos y negocios locales.',
  },
  '/paquetes': {
    titulo: 'Paquetes turísticos y reservas en Mutatá | Explora Mutatá',
    descripcion: 'Explora paquetes turísticos y opciones de reserva de experiencias en Mutatá, Antioquia. Organiza planes, hospedajes y aventuras en Urabá.',
  },
  '/transporte': {
    titulo: 'Transporte turístico en Mutatá y Urabá | Explora Mutatá',
    descripcion: 'Conoce servicios de transporte para visitar Mutatá, Antioquia, y explorar destinos de Urabá. Consulta operadores y opciones disponibles.',
  },
  '/vida-nocturna': {
    titulo: 'Vida nocturna en Mutatá, Antioquia | Explora Mutatá',
    descripcion: 'Descubre lugares y establecimientos de vida nocturna publicados en Mutatá, Antioquia. Explora planes locales en Urabá.',
  },
  '/guias': {
    titulo: 'Guías turísticos de Mutatá, Antioquia | Explora Mutatá',
    descripcion: 'Encuentra guías locales y descubre destinos naturales, cultura y turismo en Mutatá, Urabá, Antioquia.',
  },
  '/catalogo': {
    titulo: 'Turismo, restaurantes y alojamientos en Mutatá | Explora Mutatá',
    descripcion: 'Explora negocios turísticos en Mutatá, Antioquia: restaurantes, hospedajes, transporte, aventura y servicios para tu viaje a Urabá.',
  },
  '/nosotros': {
    titulo: 'Explora Mutatá | Plataforma de turismo en Urabá',
    descripcion: 'Conoce Explora Mutatá, una plataforma que conecta turistas con experiencias, restaurantes, hospedajes y negocios de Mutatá, Antioquia.',
  },
};

const tituloGeneral = 'Mutatá, Antioquia: turismo y qué hacer | Explora Mutatá';
const descripcionGeneral = 'Descubre qué hacer en Mutatá, Antioquia: turismo en Urabá, aventuras, restaurantes, hospedajes y paquetes turísticos.';

function actualizarMeta(selector: string, atributo: string, contenido: string) {
  const meta = document.head.querySelector<HTMLMetaElement>(selector);
  if (meta) meta.setAttribute('content', contenido);
  else {
    const nuevo = document.createElement('meta');
    const separador = atributo.indexOf(':');
    const clave = atributo.slice(0, separador);
    const valor = atributo.slice(separador + 1);
    nuevo.setAttribute(clave, valor);
    nuevo.setAttribute('content', contenido);
    document.head.appendChild(nuevo);
  }
}

export default function SeoRutas() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pagina = seoPaginas[pathname];
    const titulo = pagina?.titulo ?? tituloGeneral;
    const descripcion = pagina?.descripcion ?? descripcionGeneral;

    document.title = titulo;
    actualizarMeta('meta[name="description"]', 'name:description', descripcion);
    actualizarMeta('meta[property="og:title"]', 'property:og:title', titulo);
    actualizarMeta('meta[property="og:description"]', 'property:og:description', descripcion);
    actualizarMeta('meta[name="twitter:title"]', 'name:twitter:title', titulo);
    actualizarMeta('meta[name="twitter:description"]', 'name:twitter:description', descripcion);

    // No canonizar fichas dinámicas o páginas privadas hacia una categoría.
    const existente = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (pagina) {
      const canonical = existente ?? document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = 'https://exploramutata.com' + pathname;
      if (!existente) document.head.appendChild(canonical);
    } else {
      existente?.remove();
    }
  }, [pathname]);

  return null;
}
