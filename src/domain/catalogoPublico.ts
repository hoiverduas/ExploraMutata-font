import type { CategoriaNegocio, NegocioPublico } from '../types/catalogo';

const categoriasValidas: readonly CategoriaNegocio[] = ['HOSPEDAJE', 'RESTAURANTE', 'AVENTURA', 'VIDA_NOCTURNA', 'GUIA', 'TRANSPORTE'];

function esCategoria(valor: unknown): valor is CategoriaNegocio {
  return categoriasValidas.some(categoria => categoria === valor);
}

function esNegocioPublico(valor: unknown): valor is NegocioPublico {
  if (!valor || typeof valor !== 'object') return false;
  return 'id' in valor && typeof valor.id === 'string'
    && 'nombreComercial' in valor && typeof valor.nombreComercial === 'string'
    && 'categorias' in valor && Array.isArray(valor.categorias) && valor.categorias.every(esCategoria)
    && 'descripcion' in valor && (valor.descripcion === null || typeof valor.descripcion === 'string')
    && 'correoContacto' in valor && typeof valor.correoContacto === 'string'
    && 'telefonoContacto' in valor && typeof valor.telefonoContacto === 'string';
}

export function validarCatalogoPublico(respuesta: unknown): NegocioPublico[] {
  if (!Array.isArray(respuesta) || !respuesta.every(esNegocioPublico)) {
    throw new Error('La respuesta del catálogo no coincide con el contrato esperado: cada negocio debe incluir categorias como un array de categorías de negocio válidas.');
  }
  return respuesta;
}

// La unicidad es local a cada listado, nunca global entre secciones o categorías.
export function negociosPublicosUnicos(negocios: NegocioPublico[]): NegocioPublico[] {
  return [...new Map(negocios.map(negocio => [negocio.id, negocio])).values()];
}
