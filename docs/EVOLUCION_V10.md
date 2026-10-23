# De la v10 estática al frontend Ionic React

## Lo que reutilizamos de Explora_Mutata_v10_Mobile_First_Lista_Netlify.zip

- Fotografías y escudo usado en el prototipo.
- Marca «explora mutatá», tonos verde bosque y acentos melocotón.
- Mensaje hero «Hay lugares que se visitan. Mutatá se vive».
- Cuatro accesos móviles: naturaleza, aventuras, descanso y cultura.
- Catálogo local de destinos, experiencias y alojamientos, transformado de `catalog.js` a `src/data/catalog.json`.
- Interfaz de voz Sofía en `public/voz.html`, manteniendo el identificador público del agente del prototipo.
- Navegación inferior adaptada a `IonTabBar` e Ionic Pages.

## Lo que cambió

La portada y el catálogo ahora están escritos con **componentes React TSX** y no con el HTML + `site.js` originales. Los estilos se reimplementaron con variables en CSS compatibles con Ionic, conservando la dirección visual de v10 pero no un calco pixel-perfect.

El panel de negocios usa `GET /api/v1/negocios`, `GET /api/v1/negocios/{id}`, `POST /api/v1/negocios` y `PUT /api/v1/negocios/{id}`.

## Aún pendiente

- Completar conversión pixel-perfect de todo el diseño v10 (modal de reserva y chat de texto).
- Autenticación y autorización de panel administrativo; APIs públicas seguras.
- Fuente de catálogo real desde backend (en vez de JSON de demostración).
- Comprobar que Sofía y los permisos de micrófono funcionan en WebView de iOS y Android.
- Android/iOS generados desde `npx cap add`; pruebas en dispositivo.
