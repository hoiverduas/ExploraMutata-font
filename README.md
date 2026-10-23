# Explora Mutatá — Ionic React + TypeScript + Capacitor

**Versión integrada de turistas, login JWT, perfiles, roles, invitaciones y gestión protegida de negocios.** Conserva la versión Mobile First v10 del sitio turístico, destinos, experiencias, alojamientos y Sofía.

## Ejecutar en Mac

```bash
npm install
npm run dev
```

1. Backend Spring Boot debe estar iniciado en `http://localhost:8080`.
2. Abre `http://localhost:8100`.
3. Crea turista en `/registro`, luego inicia sesión en `/ingresar`.
4. Con SUPER_ADMIN: `/mi-cuenta` → invitar administrador.
5. El invitado activa la cuenta con el vínculo recibido en su correo.
6. Con ADMIN o SUPER_ADMIN: `/gestion/negocios`.

Consulta **[README_INTEGRACION_USUARIOS.md](README_INTEGRACION_USUARIOS.md)** para rutas, configuración, seguridad y pruebas.

Para compilar: `npm run build`. Para sincronizar Capacitor: `npm run cap:sync`.

**No** incluyas secretos de Brevo, JWT o credenciales backend en archivos `VITE_*`.
