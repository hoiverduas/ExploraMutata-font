import { useIonViewWillEnter } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { negociosPublicosUnicos } from '../domain/catalogoPublico';
import { listarNegociosPorCategoria, listarNegociosPublicos } from '../services/catalogoApi';
import type { CategoriaNegocio, NegocioPublico } from '../types/catalogo';

export function useCatalogoPublico(categoria?: CategoriaNegocio) {
  const [negocios, setNegocios] = useState<NegocioPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const peticion = useRef<AbortController | null>(null);
  const primeraEntrada = useRef(true);

  const actualizar = useCallback(async () => {
    peticion.current?.abort();
    const controller = new AbortController();
    peticion.current = controller;
    setCargando(true); setError(''); setNegocios([]);
    try {
      const resultado = categoria
        ? await listarNegociosPorCategoria(categoria, { signal: controller.signal })
        : await listarNegociosPublicos({ signal: controller.signal });
      if (!controller.signal.aborted) setNegocios(negociosPublicosUnicos(resultado));
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo. Inténtalo de nuevo.');
    } finally {
      if (!controller.signal.aborted) setCargando(false);
    }
  }, [categoria]);

  useEffect(() => {
    void actualizar();
    return () => { peticion.current?.abort(); };
  }, [actualizar]);

  // Ionic conserva las páginas: al volver, consulta de nuevo lo publicado por el backend.
  useIonViewWillEnter(() => {
    if (primeraEntrada.current) primeraEntrada.current = false;
    else void actualizar();
  }, [actualizar]);

  return { negocios, cargando, error, actualizar };
}
