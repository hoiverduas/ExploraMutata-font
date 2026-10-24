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
  todos: { ruta: '/catalogo', nombre: 'Todos', etiqueta: 'EXPLORA MUTATÁ', titulo: 'Descubre los negocios de Mutatá', texto: 'Conoce los establecimientos y servicios turísticos del territorio.' },
  alojamientos: { categoria: 'HOSPEDAJE', ruta: '/alojamientos', nombre: 'Hospedajes', etiqueta: 'DESCANSO', titulo: 'Encuentra tu próximo refugio', texto: 'Explora los hospedajes de Mutatá y contacta directamente con cada establecimiento.' },
  restaurantes: { categoria: 'RESTAURANTE', ruta: '/restaurantes', nombre: 'Restaurantes', etiqueta: 'SABORES LOCALES', titulo: 'Sabores para conocer Mutatá', texto: 'Descubre los restaurantes del territorio y sus datos de contacto.' },
  experiencias: { categoria: 'AVENTURA', ruta: '/experiencias', nombre: 'Aventuras', etiqueta: 'AVENTURAS', titulo: 'Experiencias para sentir el lugar', texto: 'Encuentra servicios de aventura para conocer Mutatá.' },
  'vida-nocturna': { categoria: 'VIDA_NOCTURNA', ruta: '/vida-nocturna', nombre: 'Vida nocturna', etiqueta: 'AL CAER LA NOCHE', titulo: 'Disfruta las noches de Mutatá', texto: 'Conoce los establecimientos de vida nocturna del territorio.' },
  guias: { categoria: 'GUIA', ruta: '/guias', nombre: 'Guías', etiqueta: 'CONOCIMIENTO LOCAL', titulo: 'Descubre Mutatá acompañado', texto: 'Encuentra guías locales y contacta directamente para conocer sus servicios.' },
  transporte: { categoria: 'TRANSPORTE', ruta: '/transporte', nombre: 'Transporte', etiqueta: 'RECORRE MUTATÁ', titulo: 'Conecta con tu próximo destino', texto: 'Consulta los servicios de transporte del territorio y sus datos de contacto.' },
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
