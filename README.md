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


## Salida a producción

Antes de desplegar el frontend:

1. Ejecuta `npm ci` y `npm run build`.
2. Configura `VITE_API_URL` con la URL HTTPS pública del backend cuando frontend y API estén en dominios diferentes.
3. Verifica que el backend permita el origen público del frontend mediante CORS.
4. Configura en el backend la URL pública de retorno de Wompi hacia `/pagos/resultado`; no uses localhost en producción.
5. Prueba como mínimo: registro/login, catálogo, detalle de negocio, cotización, reserva, confirmación/rechazo, pago Wompi, reseñas y vistas de operador/admin.
6. No publiques llaves privadas, secretos de integridad, credenciales de base de datos ni tokens dentro de variables `VITE_*`.

Netlify usa `npm run build`, publica `dist` y redirige las rutas SPA hacia `index.html`.
