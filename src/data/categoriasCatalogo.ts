import type { CategoriaNegocio } from '../types/catalogo';

interface SeccionCatalogo {
  categoria?: CategoriaNegocio;
  ruta: string;
  nombre: string;
  etiqueta: string;
  titulo: string;
  texto: string;
}

const todasLasSecciones = {
  todos: { ruta: '/catalogo', nombre: 'Todos', etiqueta: 'EXPLORA MUTATÁ', titulo: 'Turismo y negocios en Mutatá, Urabá', texto: 'Explora restaurantes, hospedajes, aventura y servicios turísticos de Mutatá, Antioquia.' },
  alojamientos: { categoria: 'HOSPEDAJE', ruta: '/alojamientos', nombre: 'Hospedajes', etiqueta: 'DESCANSO', titulo: 'Hoteles y hospedajes en Mutatá', texto: 'Descubre dónde alojarte en Mutatá, Antioquia, y consulta las ofertas y opciones de reserva de los hospedajes publicados.' },
  restaurantes: { categoria: 'RESTAURANTE', ruta: '/restaurantes', nombre: 'Restaurantes', etiqueta: 'SABORES LOCALES', titulo: 'Restaurantes en Mutatá, Antioquia', texto: 'Descubre dónde comer en Mutatá y Urabá: restaurantes locales, platos y opciones gastronómicas disponibles en la plataforma.' },
  experiencias: { categoria: 'AVENTURA', ruta: '/experiencias', nombre: 'Operadores de aventura', etiqueta: 'AVENTURAS', titulo: 'Turismo y aventuras en Mutatá', texto: 'Explora actividades al aire libre, naturaleza y operadores de aventura en Mutatá, Antioquia.' },
  'vida-nocturna': { categoria: 'VIDA_NOCTURNA', ruta: '/vida-nocturna', nombre: 'Vida nocturna', etiqueta: 'AL CAER LA NOCHE', titulo: 'Vida nocturna en Mutatá', texto: 'Consulta opciones para disfrutar de la vida nocturna y los establecimientos publicados de Mutatá, Antioquia.' },
  guias: { categoria: 'GUIA', ruta: '/guias', nombre: 'Guías', etiqueta: 'CONOCIMIENTO LOCAL', titulo: 'Guías turísticos en Mutatá', texto: 'Encuentra guías locales para explorar los destinos naturales de Mutatá, en la región de Urabá, Antioquia.' },
  transporte: { categoria: 'TRANSPORTE', ruta: '/transporte', nombre: 'Transporte', etiqueta: 'RECORRE MUTATÁ', titulo: 'Transporte turístico en Mutatá', texto: 'Consulta opciones de transporte para moverte por Mutatá y descubrir el Urabá antioqueño.' },
} satisfies Record<string, SeccionCatalogo>;

export const { todos, ...seccionesPorCategoria } = todasLasSecciones;
export const seccionesCatalogo = { todos, ...seccionesPorCategoria };
export type TipoCatalogo = keyof typeof seccionesCatalogo;
// Solo categorías de negocios; «Todos» y Destinos son conceptos de navegación independientes.
export const categoriasCatalogo = Object.values(seccionesPorCategoria);
export const nombresCategoria: Record<CategoriaNegocio, string> = {
  HOSPEDAJE: 'Hospedaje', RESTAURANTE: 'Restaurante', AVENTURA: 'Aventura',
  VIDA_NOCTURNA: 'Vida nocturna', GUIA: 'Guía', TRANSPORTE: 'Transporte',
};
