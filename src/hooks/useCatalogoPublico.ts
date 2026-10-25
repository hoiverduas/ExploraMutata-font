import { useCallback } from 'react';
import { negociosPublicosUnicos } from '../domain/catalogoPublico';
import { listarNegociosPorCategoria, listarNegociosPublicos } from '../services/catalogoApi';
import type { CategoriaNegocio, NegocioPublico } from '../types/catalogo';
import { useConsultaApi } from './useConsultaApi';

export function useCatalogoPublico(categoria?: CategoriaNegocio) {
  const cargar = useCallback(async (signal: AbortSignal) => {
    const resultado = categoria
      ? await listarNegociosPorCategoria(categoria, { signal })
      : await listarNegociosPublicos({ signal });
    return negociosPublicosUnicos(resultado);
  }, [categoria]);
  const { datos, ...consulta } = useConsultaApi<NegocioPublico[]>(cargar, []);
  return { negocios: datos, ...consulta };
}
