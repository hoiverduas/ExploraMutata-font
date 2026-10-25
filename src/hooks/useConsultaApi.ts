import { useIonViewWillEnter } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// El cargador debe ser estable (useCallback) y propagar la señal al servicio API.
export function useConsultaApi<T>(cargar: (signal: AbortSignal) => Promise<T>, valorInicial: T) {
  const inicial = useRef(valorInicial);
  const [datos, setDatos] = useState<T>(valorInicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const peticion = useRef<AbortController | null>(null);
  const primeraEntrada = useRef(true);

  const actualizar = useCallback(async () => {
    peticion.current?.abort();
    const controller = new AbortController();
    peticion.current = controller;
    setCargando(true); setError(''); setDatos(inicial.current);
    try {
      const resultado = await cargar(controller.signal);
      if (!controller.signal.aborted) setDatos(resultado);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No se pudo cargar la información. Inténtalo de nuevo.');
    } finally {
      if (!controller.signal.aborted) setCargando(false);
    }
  }, [cargar]);

  useEffect(() => {
    void actualizar();
    return () => { peticion.current?.abort(); };
  }, [actualizar]);

  useIonViewWillEnter(() => {
    if (primeraEntrada.current) primeraEntrada.current = false;
    else void actualizar();
  }, [actualizar]);

  return { datos, cargando, error, actualizar };
}
