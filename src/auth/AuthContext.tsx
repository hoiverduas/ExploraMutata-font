import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { sessionToken } from '../services/http';
import { usuariosApi } from '../services/usuariosApi';
import type { Rol, UsuarioResponse } from '../types/usuario';

interface AuthContextValue {
  usuario: UsuarioResponse | null;
  cargandoSesion: boolean;
  iniciarSesion(correo: string, contrasena: string): Promise<UsuarioResponse>;
  cerrarSesion(): void;
  refrescarUsuario(): Promise<UsuarioResponse | null>;
  tieneRol(...roles: Rol[]): boolean;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const revision = useRef(0);
  const perfilPendiente = useRef<{
    token: string;
    revision: number;
    promesa: Promise<UsuarioResponse | null>;
  } | null>(null);
  const [usuario, setUsuario] = useState<UsuarioResponse | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(Boolean(sessionToken.get()));

  const cerrarSesion = useCallback(() => {
    revision.current++;
    perfilPendiente.current = null;
    sessionToken.clear();
    setUsuario(null);
    setCargandoSesion(false);
  }, []);

  const refrescarUsuario = useCallback((): Promise<UsuarioResponse | null> => {
    const token = sessionToken.get();
    if (!token) return Promise.resolve(null);
    const revisionSesion = revision.current;
    const pendiente = perfilPendiente.current;
    if (pendiente?.token === token && pendiente.revision === revisionSesion) return pendiente.promesa;

    // Una misma consulta sirve a la pantalla y a la guarda sin invalidar sus resultados.
    const promesa = usuariosApi.me(token).then(perfil => {
      if (revisionSesion !== revision.current || sessionToken.get() !== token) return null;
      setUsuario(perfil);
      return perfil;
    }).finally(() => {
      if (perfilPendiente.current?.promesa === promesa) perfilPendiente.current = null;
    });
    perfilPendiente.current = { token, revision: revisionSesion, promesa };
    return promesa;
  }, []);

  useEffect(() => {
    let activo = true;
    void refrescarUsuario()
      .catch(() => { if (activo) cerrarSesion(); })
      .finally(() => { if (activo) setCargandoSesion(false); });
    return () => { activo = false; revision.current++; };
  }, [cerrarSesion, refrescarUsuario]);

  useEffect(() => {
    window.addEventListener('explora:sesion-caducada', cerrarSesion);
    return () => window.removeEventListener('explora:sesion-caducada', cerrarSesion);
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    const respuesta = await usuariosApi.login(correo.trim().toLowerCase(), contrasena);
    sessionToken.set(respuesta.accessToken);
    try {
      const perfil = await refrescarUsuario();
      if (!perfil) throw new Error("La sesión cambió. Vuelve a ingresar.");
      return perfil;
    } catch (error) {
      cerrarSesion();
      throw error;
    }
  }, [cerrarSesion, refrescarUsuario]);

  const tieneRol = (...roles: Rol[]) => Boolean(usuario && roles.some(rol => usuario.roles.includes(rol)));

  return <AuthContext.Provider value={{ usuario, cargandoSesion, iniciarSesion, cerrarSesion, refrescarUsuario, tieneRol }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
