import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { paquetesTuristicosApi } from '../services/paquetesTuristicosApi';
import type { PaqueteTuristico, PaqueteTuristicoItemRequest } from '../types/paqueteTuristico';

interface ViajeContextValue {
  borrador: PaqueteTuristico | null;
  cantidadItems: number;
  cargando: boolean;
  guardando: boolean;
  error: string;
  refrescarViaje(): Promise<void>;
  asegurarBorrador(nombre?: string): Promise<PaqueteTuristico>;
  seleccionarViaje(viaje: PaqueteTuristico): void;
  agregarOferta(item: PaqueteTuristicoItemRequest): Promise<PaqueteTuristico>;
}
const ViajeContext = createContext<ViajeContextValue | undefined>(undefined);

export function ViajeProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const turistaId = usuario?.roles.includes('TURISTA') ? usuario.id : null;
  const sesionActual = useRef(turistaId);
  sesionActual.current = turistaId;
  const seleccionado = useRef<PaqueteTuristico | null>(null);
  const consultaActual = useRef<AbortController | null>(null);
  const pendiente = useRef<{ usuarioId: string; promesa: Promise<PaqueteTuristico> } | null>(null);
  const mutacion = useRef(false);
  const [estado, setEstado] = useState<{ usuarioId: string | null; borrador: PaqueteTuristico | null }>({ usuarioId: null, borrador: null });
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const seleccionarViaje = useCallback((viaje: PaqueteTuristico) => {
    if (sesionActual.current !== viaje.turistaId) return;
    const afectaBorrador = viaje.estado === 'BORRADOR' || seleccionado.current?.id === viaje.id;
    if (viaje.estado === 'BORRADOR') {
      consultaActual.current?.abort();
      seleccionado.current = viaje;
      setEstado({ usuarioId: viaje.turistaId, borrador: viaje });
    } else if (seleccionado.current?.id === viaje.id) {
      consultaActual.current?.abort();
      seleccionado.current = null;
      setEstado({ usuarioId: viaje.turistaId, borrador: null });
    }
    if (afectaBorrador) setCargando(false);
  }, []);

  const refrescarViaje = useCallback(async () => {
    consultaActual.current?.abort();
    if (!turistaId) return;
    const controller = new AbortController();
    consultaActual.current = controller;
    setCargando(true); setError('');
    try {
      const viajes = await paquetesTuristicosApi.listar({ signal: controller.signal });
      if (controller.signal.aborted || sesionActual.current !== turistaId) return;
      const borradores = viajes.filter(viaje => viaje.estado === 'BORRADOR');
      const activo = borradores.find(viaje => viaje.id === seleccionado.current?.id) ?? borradores[0] ?? null;
      seleccionado.current = activo;
      setEstado({ usuarioId: turistaId, borrador: activo });
    } catch (err) {
      if (!controller.signal.aborted && sesionActual.current === turistaId) setError(err instanceof Error ? err.message : 'No se pudo consultar tu viaje.');
    } finally {
      if (!controller.signal.aborted && sesionActual.current === turistaId) setCargando(false);
    }
  }, [turistaId]);

  useEffect(() => {
    seleccionado.current = null; pendiente.current = null;
    setEstado({ usuarioId: turistaId, borrador: null }); setError('');
    setCargando(false); setGuardando(false);
    if (turistaId) void refrescarViaje();
    return () => { consultaActual.current?.abort(); };
  }, [turistaId, refrescarViaje]);

  const asegurarBorrador = useCallback((nombre = 'Mi viaje a Mutatá'): Promise<PaqueteTuristico> => {
    if (!turistaId || sesionActual.current !== turistaId) return Promise.reject(new Error('Inicia sesión con tu cuenta de turista para armar tu viaje.'));
    if (pendiente.current?.usuarioId === turistaId) return pendiente.current.promesa;
    const promesa = (async () => {
      const viajes = await paquetesTuristicosApi.listar();
      if (sesionActual.current !== turistaId) throw new Error('La sesión cambió. Vuelve a abrir tu viaje.');
      const borrador = viajes.find(viaje => viaje.id === seleccionado.current?.id && viaje.estado === 'BORRADOR')
        ?? viajes.find(viaje => viaje.estado === 'BORRADOR')
        ?? await paquetesTuristicosApi.crear({ nombre: nombre.trim() || 'Mi viaje a Mutatá' });
      if (sesionActual.current !== turistaId) throw new Error('La sesión cambió. Vuelve a abrir tu viaje.');
      seleccionarViaje(borrador);
      return borrador;
    })().finally(() => { if (pendiente.current?.promesa === promesa) pendiente.current = null; });
    pendiente.current = { usuarioId: turistaId, promesa };
    return promesa;
  }, [turistaId, seleccionarViaje]);

  const agregarOferta = useCallback(async (item: PaqueteTuristicoItemRequest) => {
    if (mutacion.current) throw new Error('Espera a que termine de agregarse el servicio actual.');
    mutacion.current = true; setGuardando(true); setError('');
    const usuarioId = turistaId;
    try {
      const viaje = await asegurarBorrador();
      if (sesionActual.current !== usuarioId) throw new Error('La sesión cambió. Vuelve a intentarlo.');
      const actualizado = await paquetesTuristicosApi.agregarItem(viaje.id, item);
      if (sesionActual.current === usuarioId) seleccionarViaje(actualizado);
      return actualizado;
    } finally { mutacion.current = false; if (sesionActual.current === usuarioId) setGuardando(false); }
  }, [asegurarBorrador, seleccionarViaje, turistaId]);

  const borrador = estado.usuarioId === turistaId ? estado.borrador : null;
  const value = useMemo(() => ({ borrador, cantidadItems: borrador?.totalItems ?? 0, cargando, guardando, error, refrescarViaje, asegurarBorrador, seleccionarViaje, agregarOferta }),
    [borrador, cargando, guardando, error, refrescarViaje, asegurarBorrador, seleccionarViaje, agregarOferta]);
  return <ViajeContext.Provider value={value}>{children}</ViajeContext.Provider>;
}

export function useViaje(): ViajeContextValue {
  const value = useContext(ViajeContext);
  if (!value) throw new Error('useViaje debe usarse dentro de ViajeProvider');
  return value;
}
