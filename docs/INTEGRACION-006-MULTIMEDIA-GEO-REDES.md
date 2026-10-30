# Integración 006 — Multimedia + geolocalización + redes/WhatsApp

## Alcance

Esta integración conecta las capacidades ya existentes del backend para:

- multimedia real de negocios, ofertas, paquetes, destinos y experiencias;
- ubicación del negocio;
- punto de encuentro de la oferta;
- WhatsApp, Instagram y Facebook del negocio;
- visibilidad pública de redes;
- uso del WhatsApp para notificaciones.

No añade migraciones ni cambia el dominio backend.

---

## Rutas frontend

### Operador

```text
/operador/negocios/{negocioId}/contenido
/operador/negocios/{negocioId}/ofertas/{ofertaId}/contenido
/operador/negocios/{negocioId}/paquetes/{paqueteId}/multimedia
```

### Administración

```text
/gestion/destinos/{destinoId}/multimedia
/gestion/experiencias/{experienciaId}/multimedia
```

Todas mantienen las protecciones de rol existentes:

- negocio/oferta/paquete: OPERADOR propietario;
- destino/experiencia: ADMIN o SUPER_ADMIN.

---

## Multimedia

El frontend usa los endpoints multipart reales del backend. No convierte archivos a base64.

Soporta:

- upload individual;
- upload por lote;
- imágenes;
- videos;
- metadata;
- orden;
- autor/fuente;
- confirmación de derechos;
- portada;
- activar/desactivar;
- eliminación física del registro y almacenamiento mediante el backend.

### Roles

```text
PORTADA
GALERIA
VIDEO_PRINCIPAL
REEL
MINIATURA
```

Reglas reflejadas en frontend y backend:

- PORTADA y MINIATURA requieren imagen.
- VIDEO_PRINCIPAL y REEL requieren video.
- La carga por lote solo admite GALERIA o REEL.
- Solo una imagen puede quedar como portada del recurso.
- Los archivos subidos se editan mediante /metadata.
- Para reemplazar el binario se elimina y vuelve a subir.

### Límites actuales del backend

Valores por defecto de `app.media.storage`:

```text
Imagen: 15 MB
Video: 250 MB
Lote: 20 archivos
Proveedor por defecto: LOCAL
Ruta local: ./data/uploads
```

La validación del servidor sigue siendo la fuente definitiva.

---

## Negocio: redes y WhatsApp

Endpoint:

```text
PUT /api/v1/operadores/negocios/{id}/redes
```

Campos:

```text
whatsappContacto
instagramUrl
facebookUrl
mostrarWhatsapp
mostrarInstagram
mostrarFacebook
notificacionesWhatsapp
```

El formulario acepta:

- WhatsApp colombiano de 10 dígitos o formato internacional;
- Instagram con URL válida de instagram.com o @usuario;
- Facebook con facebook.com, fb.com o @usuario.

Reglas:

- no se puede hacer público un canal que no esté configurado;
- no se pueden activar notificaciones por WhatsApp sin número;
- visibilidad pública y notificaciones son configuraciones separadas.

El catálogo público solo devuelve WhatsApp/Instagram/Facebook cuando el toggle correspondiente está habilitado.

---

## Ubicación del negocio

Endpoints:

```text
GET /api/v1/operadores/negocios/{negocioId}/ubicacion
PUT /api/v1/operadores/negocios/{negocioId}/ubicacion
```

Campos:

```text
direccion
municipio
vereda
ubicacionReferencia
latitud
longitud
comoLlegar
```

El frontend valida:

- latitud entre -90 y 90;
- longitud entre -180 y 180.

También puede pedir al navegador las coordenadas del dispositivo. El usuario conserva el control del permiso de geolocalización.

La ubicación guardada alimenta:

- ficha pública;
- mapa público;
- Google Maps;
- Waze;
- punto base para ofertas.

---

## Punto de encuentro de una oferta

Endpoints:

```text
GET /api/v1/operadores/negocios/{negocioId}/ofertas/{ofertaId}/punto-encuentro
PUT /api/v1/operadores/negocios/{negocioId}/ofertas/{ofertaId}/punto-encuentro
```

Dos modos:

1. usar la ubicación del negocio;
2. definir ubicación específica de la oferta.

Cuando se define ubicación propia se configuran nombre, dirección, municipio, vereda, referencia, coordenadas y cómo llegar.

La ficha pública de la oferta ya consume `TipoPuntoMapa.OFERTA`, por lo que el resultado aparece en ubicación, Google Maps y Waze.

---

## Accesos desde la interfaz

### Mis negocios

Cada negocio incluye:

```text
Contenido, ubicación y redes
Gestionar ofertas
Gestionar paquetes
```

### Ofertas

Cada oferta incluye:

```text
Contenido y punto de encuentro
```

### Paquetes

El paquete seleccionado incluye:

```text
Multimedia
```

### Administración

Destinos y experiencias incluyen:

```text
Multimedia
```

---

## Prueba recomendada

### Operador — negocio

1. Iniciar sesión como OPERADOR.
2. Abrir Mis negocios.
3. Elegir "Contenido, ubicación y redes".
4. Configurar WhatsApp/Instagram/Facebook.
5. Probar toggles de visibilidad.
6. Guardar coordenadas.
7. Subir una imagen como GALERIA.
8. Marcarla como portada.
9. Subir varias imágenes como GALERIA.
10. Subir un video como VIDEO_PRINCIPAL.
11. Abrir la ficha pública y validar la galería, redes y ubicación.

### Operador — oferta

1. Abrir las ofertas del negocio.
2. Elegir "Contenido y punto de encuentro".
3. Probar "Usar ubicación del negocio".
4. Después probar un punto propio.
5. Subir contenido de la oferta.
6. Revisar la ficha pública.

### Operador — paquete

1. Abrir el constructor del paquete.
2. Elegir "Multimedia".
3. Subir portada/galería/video.
4. Revisar el paquete público.

### ADMIN

1. Abrir Gestión de destinos.
2. Entrar a Multimedia de un destino.
3. Subir y ordenar contenido.
4. Repetir en Gestión de experiencias.
5. Validar ambos contenidos en las fichas públicas.

---

## Nota técnica multipart

`apiRequest` fue ajustado para no establecer manualmente:

```text
Content-Type: application/json
```

cuando el body es `FormData`.

El navegador genera automáticamente:

```text
multipart/form-data; boundary=...
```

Esto es obligatorio para que Spring WebFlux pueda resolver correctamente:

```java
@RequestPart("metadata")
@RequestPart("archivo")
@RequestPart("archivos")
```
