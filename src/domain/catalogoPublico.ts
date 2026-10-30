import type { CategoriaNegocio, NegocioPublico } from '../types/catalogo';

const categoriasValidas: readonly CategoriaNegocio[] = ['HOSPEDAJE', 'RESTAURANTE', 'AVENTURA', 'VIDA_NOCTURNA', 'GUIA', 'TRANSPORTE'];

function esCategoria(valor: unknown): valor is CategoriaNegocio {
  return categoriasValidas.some(categoria => categoria === valor);
}
function esTextoNullable(valor: unknown): valor is string | null {
  return valor === null || typeof valor === 'string';
}
function esNumeroNullable(valor: unknown): valor is number | null {
  return valor === null || typeof valor === 'number';
}

function esNegocioPublico(valor: unknown): valor is NegocioPublico {
  if (!valor || typeof valor !== 'object') return false;
  const negocio = valor as Record<string, unknown>;
  return typeof negocio.id === 'string'
    && typeof negocio.nombreComercial === 'string'
    && Array.isArray(negocio.categorias) && negocio.categorias.every(esCategoria)
    && esTextoNullable(negocio.descripcion)
    && typeof negocio.correoContacto === 'string'
    && typeof negocio.telefonoContacto === 'string'
    && esTextoNullable(negocio.whatsappContacto)
    && esTextoNullable(negocio.instagramUrl)
    && esTextoNullable(negocio.facebookUrl)
    && esTextoNullable(negocio.direccion)
    && esTextoNullable(negocio.municipio)
    && esTextoNullable(negocio.vereda)
    && esTextoNullable(negocio.ubicacionReferencia)
    && esNumeroNullable(negocio.latitud)
    && esNumeroNullable(negocio.longitud)
    && esTextoNullable(negocio.comoLlegar);
}

export function validarCatalogoPublico(respuesta: unknown): NegocioPublico[] {
  if (!Array.isArray(respuesta) || !respuesta.every(esNegocioPublico)) {
    throw new Error('La respuesta del catálogo público no coincide con el contrato actual del backend.');
  }
  return respuesta;
}

// La unicidad es local a cada listado, nunca global entre secciones o categorías.
export function negociosPublicosUnicos(negocios: NegocioPublico[]): NegocioPublico[] {
  return [...new Map(negocios.map(negocio => [negocio.id, negocio])).values()];
}
