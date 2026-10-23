import { apiRequest } from './http';
import type {
  RegistroTuristaRequest, UsuarioResponse, LoginResponse,
  InvitarAdministradorRequest, InvitacionAdministradorResponse,
} from '../types/usuario';

export const usuariosApi = {
  registroTurista: (datos: RegistroTuristaRequest) =>
    apiRequest<UsuarioResponse>('/api/v1/auth/registro', {
      method: 'POST', public: true, body: JSON.stringify(datos),
    }),
  login: (correo: string, contrasena: string) =>
    apiRequest<LoginResponse>('/api/v1/auth/login', {
      method: 'POST', public: true, body: JSON.stringify({ correo, contrasena }),
    }),
  me: (token?: string) => apiRequest<UsuarioResponse>('/api/v1/usuarios/me', { token }),
  invitarAdministrador: (datos: InvitarAdministradorRequest) =>
    apiRequest<InvitacionAdministradorResponse>('/api/v1/admin/administradores/invitaciones', {
      method: 'POST', body: JSON.stringify(datos),
    }),
  aceptarInvitacion: (tokenInvitacion: string, contrasena: string) =>
    apiRequest<UsuarioResponse>('/api/v1/auth/aceptar-invitacion', {
      method: 'POST', public: true, body: JSON.stringify({ tokenInvitacion, contrasena }),
    }),
};
