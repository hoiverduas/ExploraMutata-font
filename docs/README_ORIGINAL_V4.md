# Explora Mutatá · Ionic React + TypeScript + Capacitor

Evolución v4 (estados sin autenticación) de la versión **v10 Mobile First** de Explora Mutatá.

## Tecnologías

- Ionic React 9 + React 19 + TypeScript.
- Vite y React Router 6.
- Capacitor 8 para Android e iOS (proyectos nativos aún no generados).
- Backend existente: Java 25, Spring Boot 4.1.1, WebFlux, Spring Data R2DBC y PostgreSQL.

## Qué incluye

- Inicio mobile-first inspirado en la v10 (textos, colores, fotografías y branding reutilizados).
- Páginas de destinos (12), experiencias (11) y alojamientos (3) a partir del catálogo v10, **todos demostrativos**.
- Acceso a la interfaz v10 de voz de Sofía mediante `public/voz.html` (la ejecución del agente exige Internet, permisos de micrófono y verificación en los dispositivos reales).
- Panel local de negocios: listado paginado, consulta individual, registro POST, edición PUT, **seis transiciones de estado PATCH con confirmación y consulta del historial**, errores HTTP y actualización del estado desde el backend.
- **Administración habilitada solo al ejecutar `npm run dev`**, sin usuario ni contraseña, para pruebas locales. En las compilaciones públicas queda bloqueada.

## Requisitos

Node.js >= 22 y npm. Para crear aplicaciones móviles: Android Studio (Android) y Xcode en macOS (iOS).

## Ejecutar en tu Mac

1. Descomprime el proyecto y abre una terminal en la carpeta `explora-mutata-ionic`.
2. Inicia tu backend Java en `http://localhost:8080`.
3. Instala las dependencias y lanza Ionic:

```bash
npm install
npm run dev
```

4. Abre `http://localhost:8100`.
5. En desarrollo, selecciona **Gestión** en el encabezado o abre `http://localhost:8100/gestion/negocios`.
6. Prueba registrar un negocio con un documento *distinto* al ya usado en la base de datos, para no obtener `409 Conflict`.

### Conexión con Spring Boot

`vite.config.ts` implementa un proxy local desde `/api/...` hacia `http://localhost:8080/api/...`, por lo que **en desarrollo desde el navegador no necesitas cambiar CORS**.

Para conectar el **Android/iPhone físico**, `localhost` apunta al teléfono, no a tu Mac. Usa una URL HTTPS accesible para el backend, revisa CORS y configura la variable de entorno de Vite antes de construir:

```env
VITE_API_URL=https://api.tudominio.com
```

El frontend solo incluye `VITE_API_URL`; **nunca coloques claves privadas o contraseñas en variables VITE_** porque quedan expuestas en el cliente.

### Producir el sitio web para Netlify

```bash
npm run build
```

Publica `dist/`; el archivo `netlify.toml` está configurado para rutas SPA. Se oculta el panel de administración en producción. La web turística mantiene un catálogo demostrativo y **no procesa pagos ni reservas reales**.

### Habilitar Android e iOS con Capacitor

Una vez instaladas dependencias:

```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
npx cap open ios
```

> Para Android se requiere Android Studio. Para iOS se requiere Mac y Xcode. Antes de compilar para móviles, configura un backend HTTPS externo y verifica las necesidades de micrófono del asistente Sofía.

## Seguridad imprescindible antes de publicar gestión

- Incorporar módulo `identidad` (autenticación JWT/OAuth2) y relación usuarios-negocios en el backend.
- Aplicar autorización **desde el servidor** a GET de información privada, PUT por propietario y PATCH administrador.
- Separar DTO público (sin NIT/documento de identificación o correo administrativo) y DTO privado.
- No habilitar cambios administrativos en una versión pública sin autenticación y autorización del backend.

La protección `import.meta.env.DEV` es solamente una **medida de contención en la interfaz**, **no sustituye** la seguridad del backend.

## Arquitectura de carpetas

```
src/
├── App.tsx                    # navegación con Ionic Tabs
├── components/BrandHeader.tsx # identidad visual original
├── data/catalog.json         # catálogo v10 (demostrativo)
├── pages/
│   ├── InicioPage.tsx
│   ├── CatalogoPage.tsx
│   ├── SofiaPage.tsx
│   └── NegociosPage.tsx
├── services/negociosApi.ts    # cliente HTTP, /api/v1/negocios
├── types/negocio.ts          # contrato TS de la API Java
└── theme/                    # colores, estilo y responsive
public/
├── images/                   # fotografías del diseño v10
├── voz.html                  # demo de voz original
└── favicon.png
```

No modificar el repositorio del backend para instalar Ionic; lo ideal es tener **repositorios separados** para backend y aplicación frontend.

## Estado de verificación de esta entrega

El código fuente y su estructura han sido creados y revisados estáticamente. La instalación de paquetes y la compilación `npm run build` **no pudieron ejecutarse aquí porque la descarga de paquetes se agotó por tiempo**. Ejecuta `npm install && npm run build` en tu Mac para validar las dependencias y, si aparece un problema, comparte el log para corregirlo.


## Gestión de los cinco estados — versión v4 (sin seguridad)

Esta entrega se ajusta al backend más reciente de Explora Mutatá, que no tiene Spring Security ni roles. **No solicita credenciales ni envía Authorization**. Las solicitudes modifican la BD real local.

| Estado | Acción visible | Endpoint | Cuerpo JSON |
|---|---|---|---|
| `PENDIENTE_VERIFICACION` | Aprobar | `PATCH /api/v1/negocios/{id}/aprobar` | `{ "verificacionConfirmada": true, "observacion": "..." }` |
| `PENDIENTE_VERIFICACION` | Rechazar | `PATCH /api/v1/negocios/{id}/rechazar` | `{ "motivo": "..." }` |
| `ACTIVO` | Suspender | `PATCH /api/v1/negocios/{id}/suspender` | `{ "motivo": "..." }` |
| `ACTIVO` / `SUSPENDIDO` | Desactivar | `PATCH /api/v1/negocios/{id}/desactivar` | `{ "motivo": "..." }` |
| `SUSPENDIDO` | Reactivar | `PATCH /api/v1/negocios/{id}/reactivar` | `{ "motivo": "..." }` |
| `RECHAZADO` / `INACTIVO` | Nueva revisión | `PATCH /api/v1/negocios/{id}/solicitar-revision` | `{ "motivo": "..." }` |

**Historial:** `GET /api/v1/negocios/{id}/historial-estados`.

El modal pide motivo de 5 a 500 caracteres (aprobar admite observación de 5 a 450 caracteres) y solicita marcar la confirmación de verificación al aprobar. En los cambios solo se muestra éxito cuando el servidor devuelve HTTP 200 y se recarga el listado. Error 409 indica transición inválida o conflicto concurrente.

### Ejecutar

```bash
npm install
npm run dev
```

Abrir `http://localhost:8100/gestion/negocios` y mantener `./gradlew bootRun` en el proyecto Spring Boot (puerto 8080). El proxy Vite reenvía `/api` al backend.

### Seguridad (pendiente)

El panel de administración se oculta en builds de producción por `import.meta.env.DEV`, **pero el backend no tiene protección por roles**. No lo expongas a la red pública, ni compartas un backend abierto. En desarrollo local, configura `server.address=127.0.0.1` y no uses una IP pública.

Para pruebas en móvil físico, se necesitará acceso seguro al backend y habilitar autenticación antes de publicar.
