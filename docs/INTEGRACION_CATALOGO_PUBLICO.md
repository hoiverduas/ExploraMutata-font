# Catálogo público con múltiples categorías

La integración existente se adaptó al nuevo contrato; no se sustituyó el módulo, la infraestructura HTTP ni el backend. Un negocio puede pertenecer a varias categorías y aparecer en distintas secciones públicas.

## Contrato

`NegocioPublico` contiene `id`, `nombreComercial`, `categorias: CategoriaNegocio[]`, `descripcion: string | null`, `correoContacto` y `telefonoContacto`. No existe el campo de respuesta singular `categoria`.

Las seis categorías de negocio son HOSPEDAJE, RESTAURANTE, AVENTURA, VIDA_NOCTURNA, GUIA y TRANSPORTE. Las tarjetas y listados muestran todas sus etiquetas: Hospedaje, Restaurante, Aventura, Vida nocturna, Guía y Transporte. Un array vacío se presenta como «Sin categoría», sin inferir datos por nombre o descripción.

`src/domain/catalogoPublico.ts` comprueba el contrato antes de entregar la respuesta a las tarjetas. Si llega el modelo singular antiguo, un array inválido o una categoría ajena al contrato, muestra un error controlado y permite reintentar. No migra silenciosamente datos antiguos. Si ese error aparece con el backend real, revisar el DTO de respuesta y el controlador que serializan `/api/v1/public/negocios`; no se modificaron archivos del backend.

## Rutas y filtros

| Sección | Ruta | Consulta GET |
| --- | --- | --- |
| Catálogo general | `/catalogo` | `/api/v1/public/negocios` |
| Hospedajes | `/alojamientos` | `/api/v1/public/negocios?categoria=HOSPEDAJE` |
| Restaurantes | `/restaurantes` | `/api/v1/public/negocios?categoria=RESTAURANTE` |
| Aventuras | `/experiencias` | `/api/v1/public/negocios?categoria=AVENTURA` |
| Vida nocturna | `/vida-nocturna` | `/api/v1/public/negocios?categoria=VIDA_NOCTURNA` |
| Guías | `/guias` | `/api/v1/public/negocios?categoria=GUIA` |
| Transporte | `/transporte` | `/api/v1/public/negocios?categoria=TRANSPORTE` |

El filtro HTTP sigue recibiendo **una categoría individual** en `?categoria=...`. No se descarga el listado general para filtrarlo por categoría en el cliente. Las referencias singulares en la configuración de secciones y en los parámetros de servicio representan este filtro, no el campo antiguo del negocio.

`listarNegociosPublicos()` y `listarNegociosPorCategoria(categoria)` usan `apiRequest` con `public: true`, sin Authorization. No envían `estado`. El servidor es responsable de publicar únicamente negocios ACTIVO; el frontend no replica esa regla.

El catálogo general muestra una tarjeta por negocio. La deduplicación por ID es local a cada respuesta: no elimina el mismo negocio de otras secciones ni expande una tarjeta por cada categoría. Inicio sigue mostrando hasta tres negocios únicos del endpoint general.

## Destinos es independiente

DESTINO ya no es `CategoriaNegocio`, no aparece en selectores de negocios y no se envía al endpoint público.

`/destinos` se mantiene en la navegación turística y ahora consume su recurso independiente `/api/v1/public/destinos`. Su detalle por slug y las experiencias asociadas usan los controllers reales del backend `f72df2e`. No consulta el catálogo de negocios ni usa el JSON editorial como fallback. No se crearon APIs ni tablas nuevas. La integración de destinos, experiencias, ofertas y monedas está documentada en [INTEGRACION_TURISMO_OFERTAS_MONEDAS.md](INTEGRACION_TURISMO_OFERTAS_MONEDAS.md).

Las imágenes editoriales de Inicio siguen separadas de sus negocios públicos. Ningún listado de negocios recurre a `src/data/catalog.json` como respaldo.

## Formularios y listados ADMIN/OPERADOR

- `NegocioRequest` y `NegocioResponse` usan `categorias: CategoriaNegocio[]`, sin campo singular.
- `NegocioCampos` es el componente compartido por ADMIN y OPERADOR. Ofrece seis checkboxes y permite múltiples selecciones.
- Crear inicia con `[]`. Editar precarga el array completo y permite añadir o retirar selecciones; guardar envía el nuevo conjunto completo.
- Si el array está vacío, ambos handlers muestran «Selecciona al menos una categoría para el negocio.» y retornan antes de llamar a la API.
- Los listados Gestión de negocios y Mis negocios muestran todas las categorías. Se preservan descripción, estado, acciones e historial.
- Los servicios privados ya serializan `NegocioRequest`; no requieren cambios de rutas ni infraestructura HTTP para incluir el array.
- No se cambiaron JWT, roles, autenticación, solicitudes de operador, Mi Cuenta, ownership, transiciones ni permisos.

## Estados de la interfaz

Se conservan carga, error con reintento, listado vacío, búsqueda sin resultados, cancelación de consultas anteriores y actualización al regresar a una vista retenida por Ionic. No se agregaron imágenes ni datos de negocios inventados.

## Validación de multicategoría anterior y límites

Las comprobaciones siguientes corresponden a la tarea previa de multicategoría. En la integración posterior de destinos, experiencias, ofertas y monedas únicamente se ejecutó compilación/typecheck, sin pruebas funcionales ni E2E.

El backend del usuario sigue ejecutándose en su computadora. Desde el entorno en la nube, `GET localhost:8080/actuator/health` no conecta (curl código 7, sin respuesta HTTP). El proxy de Vite devuelve HTTP 500. Por ello no se afirman resultados de PostgreSQL ni de guardados autenticados.

| PRUEBA | RESULTADO | OBSERVACIÓN |
| --- | --- | --- |
| Build frontend | ✅ PASS | `npm run build`, TypeScript y Vite correctos; advertencia no bloqueante de chunks grandes. |
| Contrato, unicidad y reglas de operador | ✅ PASS | 18 pruebas puras: 9 del catálogo y 9 existentes de reglas de operador. No sustituyen las APIs. |
| Catálogo general | ⚠️ BLOQUEADA | GET público y manejo del error comprobados; respuesta 200 con negocios reales no disponible. |
| Hospedajes | ⚠️ BLOQUEADA | Query HOSPEDAJE correcta comprobada en Chromium; datos reales pendientes. |
| Restaurantes | ⚠️ BLOQUEADA | Query RESTAURANTE correcta; datos reales pendientes. |
| Aventuras | ⚠️ BLOQUEADA | Query AVENTURA correcta; datos reales pendientes. |
| Vida nocturna | ⚠️ BLOQUEADA | Query VIDA_NOCTURNA correcta; datos reales pendientes. |
| Guías | ⚠️ BLOQUEADA | Query GUIA correcta; datos reales pendientes. |
| Transporte | ⚠️ BLOQUEADA | Query TRANSPORTE correcta; datos reales pendientes. |
| Destino no consulta endpoint de negocio | ✅ PASS | En la tarea previa `/destinos` no emitía peticiones de negocios; ahora tiene su propia API de destinos, pendiente de pruebas funcionales. |
| Negocio real multicategoría aparece en varias secciones | ⚠️ BLOQUEADA | Requiere backend real y un negocio publicado con varias categorías. |
| No se duplica en catálogo general | ✅ PASS | Prueba pura de unicidad por ID; sin estado global entre secciones. Confirmación con datos reales pendiente. |
| Formulario ADMIN permite varias categorías | ✅ PASS | Ejecución aislada del componente compartido: seis opciones y selección múltiple. Guardado autenticado pendiente. |
| Formulario OPERADOR permite varias categorías | ✅ PASS | Mismo componente verificado; su ruta/servicio privado se mantiene. Guardado autenticado pendiente. |
| Edición conserva selección múltiple | ✅ PASS | Componente precargado con dos opciones; al retirar/añadir conserva el conjunto nuevo completo. Lectura/PUT real pendiente. |
| No permite guardar sin categoría | ⚠️ BLOQUEADA | Validación implementada y revisada en ambos handlers antes de la API; falta prueba de submit con sesión real. |
| No usa categoria singular en el modelo | ✅ PASS | Revisión de src y pruebas que rechazan el contrato antiguo; el singular HTTP sigue siendo válido. |
| No envía estado desde frontend público | ✅ PASS | Todas las consultas públicas observadas carecen de estado. |
| Visitante accede sin login | ✅ PASS | Las siete rutas de negocios abren y consultan sin Authorization ni redirección al login. |
| No hay pantalla blanca ante error de catálogo | ✅ PASS | Chromium muestra error y reintento, sin excepciones JavaScript; retorno a vista retenida y móvil de 390 px comprobados. Éxito con datos reales pendiente. |

Pruebas puras reproducibles:

```bash
node --experimental-strip-types --test tests/catalogoPublico.test.mjs tests/operadorNegocios.test.mjs
```

Las verificaciones de componentes usaron entradas de contrato aisladas, sin simular respuestas de red ni crear negocios en el backend. No constituyen la prueba funcional autenticada.

## Prueba pendiente con backend real

1. Ejecutar frontend y backend en la misma computadora (puertos 8100 y 8080) y comprobar health UP.
2. Como ADMIN u OPERADOR, crear o editar un negocio con HOSPEDAJE, RESTAURANTE y AVENTURA. Comprobar el payload `categorias`, ausencia del campo singular y validación si se retiran todas las opciones.
3. Publicarlo mediante el flujo administrativo existente. Sin sesión, comprobar que aparezca en Hospedajes, Restaurantes y Aventuras; que no aparezca en Transporte y que figure una sola vez en `/catalogo` y la vista previa de Inicio.
4. Volver a editar: deben precargarse todas las categorías. Cambiarlas por HOSPEDAJE, AVENTURA y TRANSPORTE; comprobar el conjunto completo del PUT y sus nuevas secciones públicas.
5. Comprobar un negocio antiguo con `categorias: []` en el catálogo general; debe mostrar «Sin categoría» sin fallar.
6. Comprobar la exclusión de negocios no activos en las respuestas del backend, sin agregar estado a los GET del frontend.

**FRONTEND ADAPTADO A MÚLTIPLES CATEGORÍAS: SÍ.**

**CATÁLOGO PÚBLICO CONECTADO AL NUEVO MODELO: SÍ en la implementación.** La validación funcional con el backend real continúa bloqueada por conectividad y no se declara completada.
