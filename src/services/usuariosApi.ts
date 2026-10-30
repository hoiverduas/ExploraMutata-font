import { apiRequest } from './http';
import type {
  RegistroTuristaRequest, UsuarioResponse, LoginRequest, LoginResponse,
  AceptarInvitacionRequest, InvitarAdministradorRequest, InvitacionAdministradorResponse,
} from '../types/usuario';

export const usuariosApi = {
  registroTurista: (datos: RegistroTuristaRequest) =>
    apiRequest<UsuarioResponse>('/api/v1/auth/registro', {
      method: 'POST', public: true, body: JSON.stringify(datos),
    }),
  login: (correo: string, contrasena: string) => {
    const datos: LoginRequest = { correo, contrasena };
    return apiRequest<LoginResponse>('/api/v1/auth/login', {
      method: 'POST', public: true, body: JSON.stringify(datos),
    });
  },
  me: (token?: string) => apiRequest<UsuarioResponse>('/api/v1/usuarios/me', { token }),
  invitarAdministrador: (datos: InvitarAdministradorRequest) =>
    apiRequest<InvitacionAdministradorResponse>('/api/v1/admin/administradores/invitaciones', {
      method: 'POST', body: JSON.stringify(datos),
    }),
  aceptarInvitacion: (tokenInvitacion: string, contrasena: string) => {
    const datos: AceptarInvitacionRequest = { tokenInvitacion, contrasena };
    return apiRequest<UsuarioResponse>('/api/v1/auth/aceptar-invitacion', {
      method: 'POST', public: true, body: JSON.stringify(datos),
    });
  },
};
