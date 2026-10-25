import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { monedas } from '../types/moneda';
import type { Moneda } from '../types/moneda';

const CLAVE_MONEDA = 'explora-mutata-moneda';
interface MonedaContextValue {
  moneda: Moneda;
  seleccionarMoneda(moneda: Moneda): void;
}
const MonedaContext = createContext<MonedaContextValue | undefined>(undefined);

function leerPreferencia(): Moneda {
  try {
    const guardada = window.localStorage.getItem(CLAVE_MONEDA);
    return monedas.find(moneda => moneda === guardada) ?? 'COP';
  } catch {
    return 'COP';
  }
}

export function MonedaProvider({ children }: { children: ReactNode }) {
  const [moneda, setMoneda] = useState<Moneda>(leerPreferencia);
  const seleccionarMoneda = useCallback((seleccion: Moneda) => {
    setMoneda(seleccion);
    try { window.localStorage.setItem(CLAVE_MONEDA, seleccion); }
    catch { /* La preferencia sigue disponible en memoria si el navegador bloquea el almacenamiento. */ }
  }, []);
  const value = useMemo(() => ({ moneda, seleccionarMoneda }), [moneda, seleccionarMoneda]);
  return <MonedaContext.Provider value={value}>{children}</MonedaContext.Provider>;
}

export function useMoneda(): MonedaContextValue {
  const value = useContext(MonedaContext);
  if (!value) throw new Error('useMoneda debe usarse dentro de MonedaProvider');
  return value;
}
