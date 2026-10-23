import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { sessionToken } from '../services/http';
import { usuariosApi } from '../services/usuariosApi';
import type { Rol, UsuarioResponse } from '../types/usuario';

interface AuthContextValue {
  usuario: UsuarioResponse | null;
  cargandoSesion: boolean;
  iniciarSesion(correo: string, contrasena: string): Promise<UsuarioResponse>;
  cerrarSesion(): void;
  tieneRol(...roles: Rol[]): boolean;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioResponse | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(Boolean(sessionToken.get()));

  const cerrarSesion = useCallback(() => {
    sessionToken.clear();
    setUsuario(null);
    setCargandoSesion(false);
  }, []);

  useEffect(() => {
    let activo = true;
    const token = sessionToken.get();
    if (token) {
      usuariosApi.me(token)
        .then(perfil => { if (activo) setUsuario(perfil); })
        .catch(() => { if (activo) cerrarSesion(); })
        .finally(() => { if (activo) setCargandoSesion(false); });
    }
    return () => { activo = false; };
  }, [cerrarSesion]);

  useEffect(() => {
    window.addEventListener('explora:sesion-caducada', cerrarSesion);
    return () => window.removeEventListener('explora:sesion-caducada', cerrarSesion);
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    const respuesta = await usuariosApi.login(correo.trim().toLowerCase(), contrasena);
    sessionToken.set(respuesta.accessToken);
    try {
      const perfil = await usuariosApi.me(respuesta.accessToken);
      setUsuario(perfil);
      return perfil;
    } catch (error) {
      cerrarSesion();
      throw error;
    }
  }, [cerrarSesion]);

  const tieneRol = (...roles: Rol[]) => Boolean(usuario && roles.some(rol => usuario.roles.includes(rol)));

  return <AuthContext.Provider value={{ usuario, cargandoSesion, iniciarSesion, cerrarSesion, tieneRol }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
