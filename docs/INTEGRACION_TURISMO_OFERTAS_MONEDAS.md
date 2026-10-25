# Integración técnica de destinos, experiencias, ofertas y monedas

Fuente de verdad: repositorio backend `hoiverduas/ExploraMutata`, rama `main`, commit `f72df2ed17218b0bd34573ecfe6c8cc6f01ac7b1`. Se inspeccionaron controllers, DTOs, enums, servicios y reglas de seguridad. No se modificó el backend ni se arrancó su aplicación. No se hicieron llamadas API, pruebas funcionales/E2E, pruebas manuales, reservas ni creación de datos.

La versión anterior `9a1e00b` no contenía ofertas ni monedas. La actualización que el usuario publicó durante esta tarea permitió inspeccionar e integrar esos contratos reales.

## Archivos creados

Tipos:

- `src/types/destino.ts`
- `src/types/experiencia.ts`
- `src/types/ofertaExperiencia.ts`
- `src/types/moneda.ts`

Servicios:

- `src/services/destinosApi.ts`
- `src/services/experienciasApi.ts`
- `src/services/destinoExperienciasApi.ts`
- `src/services/negocioExperienciasApi.ts`
- `src/services/monedasApi.ts`

Estado y consulta:

- `src/context/MonedaContext.tsx`
- `src/hooks/useConsultaApi.ts`
- `src/data/turismo.ts`

Componentes:

- `src/components/EstadoConsulta.tsx`
- `src/components/NavegacionTuristica.tsx`
- `src/components/TarjetaTuristica.tsx`
- `src/components/SelectorMoneda.tsx`
- `src/components/PrecioOferta.tsx`
- `src/components/OfertasPublicas.tsx`

Páginas:

- `src/pages/DestinoDetallePage.tsx`
- `src/pages/ExperienciasPublicasPage.tsx`
- `src/pages/ExperienciaDetallePage.tsx`
- `src/pages/DestinosAdminPage.tsx`
- `src/pages/ExperienciasAdminPage.tsx`
- `src/pages/DestinoExperienciasAdminPage.tsx`
- `src/pages/OfertasNegocioPage.tsx`

Documentación:

- `docs/INTEGRACION_TURISMO_OFERTAS_MONEDAS.md`

## Archivos modificados

- `src/App.tsx`: rutas nuevas y MonedaProvider, manteniendo AuthProvider y pestañas existentes.
- `src/auth/AccesoProtegido.tsx`: reconoce patrones de rutas con parámetros mediante matchPath; no cambia requisitos de sesión/roles ni la revalidación existente.
- `src/components/NegociosPublicos.tsx`: reutiliza EstadoConsulta para carga/error/vacío.
- `src/hooks/useCatalogoPublico.ts`: mantiene su interfaz y especialización en negocios; reutiliza el ciclo de consulta/cancelación/entrada de Ionic de useConsultaApi.
- `src/pages/DestinosPage.tsx`: sustituye la fuente editorial por el recurso público de destinos, sin fallback artificial.
- `src/pages/CatalogoPage.tsx`: acceso a destinos, experiencias turísticas y selector de moneda.
- `src/pages/InicioPage.tsx`: navegación al recurso de experiencias, destinos y negocios, conservando imágenes editoriales independientes.
- `src/pages/MiCuentaPage.tsx`: accesos ADMIN/SUPER_ADMIN a destinos y experiencias; relaciones dentro de cada destino.
- `src/pages/MisNegociosPage.tsx`: enlace a las ofertas del negocio seleccionado.
- `src/theme/styles.css`: estilos adicionales con los colores, tipografía, tarjetas y formularios existentes.
- `docs/INTEGRACION_CATALOGO_PUBLICO.md`: aclara la evolución del recurso independiente de destinos.

## Tipos TypeScript

- DestinoRequest, DestinoPublico, Destino, TipoDestino, EstadoDestino.
- ExperienciaRequest, ExperienciaPublica, Experiencia, DificultadExperiencia, EstadoExperiencia.
- NegocioExperienciaRequest, NegocioExperiencia, EstadoOfertaExperiencia, OfertaExperienciaMonedaResponse.
- Moneda y PrecioConvertidoResponse.

Los IDs de destino/experiencia/negocio son UUID representados como string. El ID de oferta es Long, representado como number. Los textos opcionales y precios/coordenadas admiten null. FechaTasa es una fecha YYYY-MM-DD; las fechas de creación/actualización son cadenas ISO. Todos los listados de recursos nuevos son arrays, no PaginaResponse.

## Endpoints integrados

| Método | Endpoint | Resultado / body |
| --- | --- | --- |
| GET | `/api/v1/destinos` | Destino[] |
| GET | `/api/v1/destinos/estado/{estado}` | Destino[] |
| GET | `/api/v1/destinos/{id}` | Destino |
| POST | `/api/v1/destinos` | DestinoRequest → Destino |
| PUT | `/api/v1/destinos/{id}` | DestinoRequest → Destino |
| PATCH | `/api/v1/destinos/{id}/publicar` | Sin body → Destino |
| PATCH | `/api/v1/destinos/{id}/desactivar` | Sin body → Destino |
| GET | `/api/v1/experiencias` | Experiencia[] |
| GET | `/api/v1/experiencias/estado/{estado}` | Experiencia[] |
| GET | `/api/v1/experiencias/{id}` | Experiencia |
| POST | `/api/v1/experiencias` | ExperienciaRequest → Experiencia |
| PUT | `/api/v1/experiencias/{id}` | ExperienciaRequest → Experiencia |
| PATCH | `/api/v1/experiencias/{id}/activar` | Sin body → Experiencia |
| PATCH | `/api/v1/experiencias/{id}/desactivar` | Sin body → Experiencia |
| GET | `/api/v1/destinos/{destinoId}/experiencias` | Experiencia[] |
| PUT | `/api/v1/destinos/{destinoId}/experiencias` | `{ experienciasIds: string[] }` → Experiencia[] |
| GET | `/api/v1/public/destinos?tipo=…` | Filtro opcional, DestinoPublico[] |
| GET | `/api/v1/public/destinos/{slug}` | DestinoPublico |
| GET | `/api/v1/public/experiencias?dificultad=…` | Filtro opcional, ExperienciaPublica[] |
| GET | `/api/v1/public/experiencias/{slug}` | ExperienciaPublica |
| GET | `/api/v1/public/destinos/{slug}/experiencias` | ExperienciaPublica[] |
| GET | `/api/v1/public/experiencias/{slug}/destinos` | DestinoPublico[] |
| GET | `/api/v1/operadores/negocios/{negocioId}/ofertas-experiencias` | NegocioExperiencia[] |
| POST | `/api/v1/operadores/negocios/{negocioId}/ofertas-experiencias` | NegocioExperienciaRequest → NegocioExperiencia |
| GET | `/api/v1/operadores/negocios/{negocioId}/ofertas-experiencias/{ofertaId}` | NegocioExperiencia |
| PUT | `/api/v1/operadores/negocios/{negocioId}/ofertas-experiencias/{ofertaId}` | NegocioExperienciaRequest → NegocioExperiencia |
| PATCH | `/api/v1/operadores/negocios/{negocioId}/ofertas-experiencias/{ofertaId}/activar` | Sin body → NegocioExperiencia |
| PATCH | `/api/v1/operadores/negocios/{negocioId}/ofertas-experiencias/{ofertaId}/desactivar` | Sin body → NegocioExperiencia |
| GET | `/api/v1/public/destinos/{destinoSlug}/experiencias/{experienciaSlug}/ofertas` | OfertaExperienciaMonedaResponse[] |
| GET | `/api/v1/public/monedas/convertir?monto=…&origen=…` | PrecioConvertidoResponse |

Se reutiliza apiRequest y su error ApiError. Los métodos protegidos usan el JWT de la sesión existente. Los métodos públicos usan public:true sin Authorization. No se cambió la URL API: VITE_API_URL vacío sigue usando el proxy de Vite hacia localhost:8080.

## Páginas y navegación

| Ruta frontend | Acceso / integración |
| --- | --- |
| `/destinos` | Público: listado y filtro por tipo |
| `/destinos/:slug` | Público: destino real y experiencias asociadas |
| `/catalogo/experiencias` | Público: listado y filtro por dificultad |
| `/catalogo/experiencias/:slug` | Público: detalle y destinos asociados |
| `/destinos/:destinoSlug/experiencias/:experienciaSlug` | Público: experiencia en destino y ofertas de negocios |
| `/gestion/destinos` | ADMIN/SUPER_ADMIN: crear, editar, publicar y desactivar |
| `/gestion/experiencias` | ADMIN/SUPER_ADMIN: crear, editar, activar y desactivar |
| `/gestion/destinos/:destinoId/experiencias` | ADMIN/SUPER_ADMIN: consultar y reemplazar asociaciones |
| `/operador/negocios/:negocioId/ofertas` | OPERADOR: ofertas dentro de Mis negocios |

La ruta existente `/experiencias` continúa siendo el catálogo de negocios de categoría AVENTURA y la pestaña Aventuras mantiene esa función. El recurso turístico Experiencia tiene rutas propias `/catalogo/experiencias`, evitando sustituir silenciosamente el catálogo de negocios. Inicio y la navegación pública ofrecen acceso a ambos recursos.

## Integración ADMIN

Los formularios respetan los límites y enums del backend. No editan ni envían id, slug, estado, fechas o versión. Coordenadas opcionales: ambas o ninguna, latitud -90..90 y longitud -180..180. La publicación y activación usan sus PATCH, con confirmación y manejo de errores existentes.

La relación destino-experiencia carga el conjunto actual y todas las experiencias administrativas. El PUT reemplaza el conjunto completo (máximo100), incluyendo la posibilidad de retirarlas todas. No se inventaron operaciones POST o DELETE para esta relación.

## Integración OPERADOR

El acceso nace de cada negocio en Mis negocios. La consulta protegida del negocio entrega el nombre y mantiene al backend como autoridad de ownership. No se solicita operadorId manualmente.

El formulario obtiene destinos del catálogo público y solo carga experiencias asociadas al destino elegido. Se cancelan consultas anteriores al cambiar la selección. La edición precarga los valores y conserva identificadores existentes si esos recursos dejan de aparecer públicamente, sin fingir sus nombres. El backend valida definitivamente relación, propiedad y estados.

El request únicamente envía destinoId, experienciaId, precioDesde, moneda, reservaRequerida y descripcionOferta. El precio vacío se convierte en null; se admite cero y valores mayores, y la descripción tiene máximo1000. Se envía precio/moneda originales, nunca valores convertidos.

Editar ofertas ACTIVA está permitido por el servicio real y se conserva. Activar/desactivar usa los PATCH específicos; el backend valida que el negocio esté ACTIVO, el destino PUBLICADO, la experiencia ACTIVA y la relación vigente. No hay endpoint ADMIN global de ofertas en esta versión y no se inventó uno.

## Integración pública

Destino muestra nombre, tipo, descripción, ubicación, cómo llegar, recomendaciones y experiencias asociadas. El detalle de experiencia muestra dificultad, duración, recomendaciones, destino y ofertas reales disponibles. Las ofertas muestran nombre del negocio, contactos, descripción, reserva requerida y precio.

No se añaden imágenes que no existen en los DTO, ni reservas, pagos, cupos o disponibilidad no implementados. Los recursos utilizan estados de carga/error/vacío y reintento. Las fallas de consultas secundarias no eliminan el detalle principal ya disponible.

## Integración monedas

MonedaProvider comparte COP/USD/EUR. Solo la preferencia se persiste en localStorage con clave explora-mutata-moneda, default COP, tolerando almacenamiento bloqueado. No se guardan tasas en localStorage.

PrecioOferta usa Intl.NumberFormat y los importes cop/usd/eur recibidos. Las ofertas públicas ya incluyen preciosConvertidos; no se calcula ni se aplica una tasa local. Cuando falta esa respuesta y se pide otra moneda, el componente consulta monedasApi.convertir con precio y origen originales. La consulta admite cancelación.

Si no hay conversión, conversionDisponible es false, el importe convertido es null o falla la consulta, se muestra el precio original con aviso discreto. Un precioDesde null indica consultar el precio con el negocio; nunca se transforma en cero. Un cero real sigue siendo un precio válido. No se bloquea el catálogo por una conversión fallida.

## Validación técnica

- Build: PASS, `npm run build` (incluye `tsc -b` y `vite build`).
- Typecheck: PASS, ejecutado como parte del build con strict/noUnusedLocals/noUnusedParameters.
- Lint: NO CONFIGURADO; package.json no contiene script lint y no se añadió infraestructura nueva.
- Advertencia existente no bloqueante: chunk principal mayor de 500 kB.

No se ejecutaron pruebas unitarias, funcionales, manuales ni E2E para esta integración. No se inició un navegador de prueba ni se invocaron los endpoints. Las únicas comprobaciones fueron lectura estática de contratos/código, git diff --check y compilación/typecheck.

## Pendientes

- Pruebas funcionales reales por rol.
- Pruebas E2E.
- Validación completa de estados, ownership, asociaciones, ofertas y fallback de conversión con backend real.
- Revisión responsive visual en una tarea de pruebas posterior.
