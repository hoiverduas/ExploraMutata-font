# Despliegue del frontend Explora Mutatá en AWS Amplify

Este repositorio contiene **Ionic + React + Vite**. El build `npm run build`
produce una SPA estática en `dist/`; no necesita SSR ni servidor Node en EC2.

## Prerrequisitos

- Backend Spring Boot publicado a través de un **origen HTTPS** (por ejemplo,
  `https://api.ejemplo.com`). La API de EC2 ligada a `127.0.0.1:8080` todavía
  no es accesible desde los navegadores de turistas.
- Variables y CORS del backend ajustados al dominio real del frontend.
- No introducir contraseñas ni tokens en variables `VITE_*`: Vite las publica
  en el JavaScript final.

## Amplify Hosting

1. En AWS Amplify Hosting, conecta el repositorio
   `hoiverduas/ExploraMutata-font` y la rama aprobada para producción.
2. Configura **VITE_API_URL** con el origen HTTPS público y real del backend,
   sin `/api` ni barra final: `https://api.ejemplo.com` es solo un ejemplo.
3. Amplify leerá `amplify.yml`: ejecuta `npm ci`, valida
   `VITE_API_URL` y compila con `npm run build`. Publica `dist/`.
4. En **Hosting → Rewrites and redirects**, agrega una regla SPA **200 (Rewrite)**
   para rutas sin extensión, manteniendo intactos los assets estáticos:

   Source:
   `</^[^.]+$|\\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|avif|mp4|webm)$)([^.]+$)/>`

   Target: `/index.html`

   Type: `200 (Rewrite)`

   No se configura desde `netlify.toml`, que corresponde a otro proveedor.
5. Una vez desplegado, toma la URL HTTPS que Amplify genere y configura el
   backend: `APP_FRONTEND_URL` y `app.cors.allowed-origins` deben incluir
   esa URL exacta. Reconstruye/reinicia de forma controlada si corresponde.
6. Revisa desde una ventana privada las rutas de inicio, negocios, experiencias,
   login, reservas, carga de imágenes y llamadas API en **Network**.
   Una recarga directa en una ruta interna no debe producir 403/404.

## Requisitos pendientes antes de publicar al público

- Exponer Spring Boot a través de HTTPS, sin abrir `8080` al público.
- Validar el primer superadministrador y deshabilitar bootstrap demo en producción.
- Migrar únicamente datos reales aprobados a PostgreSQL RDS.
- Conectar multimedia a S3 y comprobar objetos/URLs con permisos correctos.
- Validar callbacks y ambiente de Wompi y notificaciones WhatsApp.

No se realiza un despliegue real solo por añadir esta configuración al repositorio.
