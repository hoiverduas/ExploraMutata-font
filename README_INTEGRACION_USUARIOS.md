# Explora Mutatá — Integración frontend de usuarios, roles e invitaciones

Esta versión parte de **ExploraMutata_Ionic_v4_Estados_Sin_Security.zip** y **conserva** el catálogo turístico, Sofía, el diseño v10 Mobile First y la gestión de negocios existente. Añade el módulo de seguridad que ya funciona en Spring Boot WebFlux.

## Backend necesario

Java 25 + Spring Boot 4.1.1, rutas reales del backend:

| Método | Endpoint | Auth | Pantalla |
|---|---|---|---|
| POST | `/api/v1/auth/registro` | Pública | `/registro` |
| POST | `/api/v1/auth/login` | Pública | `/ingresar` |
| GET | `/api/v1/usuarios/me` | Bearer | `/mi-cuenta` |
| POST | `/api/v1/admin/administradores/invitaciones` | SUPER_ADMIN | `/gestion/administradores/invitar` |
| POST | `/api/v1/auth/aceptar-invitacion` | Pública, token invitación | `/aceptar-invitacion?token=...` |
| CRUD/PATCH | `/api/v1/negocios/...` | ADMIN/SUPER_ADMIN | `/gestion/negocios` |

El backend vigente debe aceptar `telefono` en `InvitarAdministradorRequest` y persistirlo en `InvitacionAdminEntity`, de acuerdo con el ajuste ya realizado. El archivo de referencia *antiguo* `ExploraMutata_Usuarios_Seguridad_JWT_SuperAdmin_v1.zip` no tenía aún ese campo.

## Instalación / pruebas en Mac

```bash
npm install
npm run dev
```

- Inicia antes el backend en `http://localhost:8080`.
- Abre `http://localhost:8100`.
- Prueba `http://localhost:8100/registro` con un correo nuevo: debe crear **TURISTA**, nunca ADMIN.
- Inicia sesión con `/ingresar`; debe consultar el perfil de `/api/v1/usuarios/me`.
- Inicia como SUPER_ADMIN y entra a `/mi-cuenta` → **Invitar administrador**.
- El correo debe contener `http://localhost:8100/aceptar-invitacion?token=...`.
- Tras activar, inicia sesión como ADMIN y comprueba acceso a `/gestion/negocios`.
- Un TURISTA no debe ver los accesos administrativos y debe recibir 403 desde Spring Boot si intenta usar endpoints ADMIN.

## Variables de entorno del frontend

En web local usa el proxy de `vite.config.ts`. `.env` puede contener:

```dotenv
VITE_API_URL=
```

Si publicas la web, usa la URL pública HTTPS real de Spring Boot:

```dotenv
VITE_API_URL=https://api.tudominio.com
```

En **el backend** establece `APP_FRONTEND_URL` a la dirección real donde está alojado Ionic, no localhost, y habilita CORS exclusivamente para ese origen HTTPS. Para iOS/Android físicos `localhost` no apunta a tu ordenador: necesitas un backend accesible vía HTTPS.

## Seguridad y alcance

- El JWT se guarda en `sessionStorage` solo para este MVP web; no se registra en logs.
- Los permisos se verifican también en el servidor; ocultar rutas en React no constituye control de acceso.
- **No** almacenes `BREVO_API_KEY`, claves SMTP, secretos JWT ni contraseñas en `VITE_*` o dentro del frontend.
- `InvitacionAdministradorResponse` del backend todavía incluye `tokenInvitacion` en pruebas locales. El frontend lo **ignora** y nunca lo muestra. En producción elimina ese campo de la API.
- La invitación se genera antes de enviarse con Brevo. Si el envío falla, queda en BD; evita repetirla indiscriminadamente. Pendiente: outbox y reenvío idempotente.
- El enlace de activación retira el parámetro `token` de la barra del navegador al abrirse; no instales analítica o capturadores de sesiones en la página de aceptación.
- `sessionStorage` no es almacenamiento seguro nativo de credenciales para Capacitor. Antes de publicar aplicaciones móviles, implementar un almacén seguro del sistema operativo y renovar el esquema de sesión.
- El frontend no implementa edición de perfil, recuperación de contraseña, reservas, favoritos ni registro de propietarios; **no existen aún endpoints backend verificados** para esas operaciones.
- La integración de WhatsApp quedó aplazada; el frontend solo muestra el flujo de invitación por correo.

## Archivos añadidos

- `src/services/http.ts` — cliente HTTP, gestión de errores y header Bearer
- `src/services/usuariosApi.ts` — contratos API de usuario/auth/invitaciones
- `src/types/usuario.ts` — DTO TypeScript
- `src/auth/AuthContext.tsx` — sesión y perfiles
- `src/auth/AccesoProtegido.tsx` — control de rutas
- `src/pages/LoginPage.tsx`, `RegistroTuristaPage.tsx`, `MiCuentaPage.tsx`, `InvitarAdministradorPage.tsx`, `AceptarInvitacionPage.tsx`

## Archivos existentes actualizados

- `src/App.tsx`: rutas y contexto JWT.
- `src/components/BrandHeader.tsx`: cuenta y gestión solo para roles ADMIN/SUPER_ADMIN.
- `src/services/negociosApi.ts`: utiliza el JWT para los endpoints protegidos.
- `src/pages/NegociosPage.tsx`: elimina el antiguo bloqueo por `import.meta.env.DEV` y el acceso sin seguridad.
- `src/theme/styles.css`: diseño responsive de formularios y perfiles.
