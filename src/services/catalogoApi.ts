import { apiRequest } from './http';
import { validarCatalogoPublico } from '../domain/catalogoPublico';
import type { CategoriaNegocio, NegocioPublico } from '../types/catalogo';

const root = '/api/v1/public/negocios';
interface CatalogoOptions {
  signal?: AbortSignal;
}

export function listarNegociosPublicos(options: CatalogoOptions = {}): Promise<NegocioPublico[]> {
  return apiRequest<unknown>(root, { public: true, signal: options.signal }).then(validarCatalogoPublico);
}

export function listarNegociosPorCategoria(categoria: CategoriaNegocio, options: CatalogoOptions = {}): Promise<NegocioPublico[]> {
  return apiRequest<unknown>(`${root}?categoria=${encodeURIComponent(categoria)}`, {
    public: true,
    signal: options.signal,
  }).then(validarCatalogoPublico);
}
