export type Rol = 'TURISTA' | 'OPERADOR' | 'ADMIN' | 'SUPER_ADMIN';
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO' | string;

export interface UsuarioResponse {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  estado: EstadoUsuario;
  roles: Rol[];
  fechaCreacion: string;
}

export interface RegistroTuristaRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
}

export interface InvitarAdministradorRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
}

export interface InvitacionAdministradorResponse {
  correo: string;
  tokenInvitacion: string; // El backend actual lo devuelve solo para pruebas locales; no mostrarlo en pantalla.
  venceEn: string;
}
