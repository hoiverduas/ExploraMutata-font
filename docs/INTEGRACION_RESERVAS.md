# Integración técnica del módulo Reservas

Fuente de verdad inspeccionada: backend `hoiverduas/ExploraMutata`, rama main, commit `d095aad567d7b3b9deb6b4bbe0b6ba214f652c63`. Se leyeron controllers, DTOs, enum, servicio, mapper y reglas de seguridad. No se modificó el backend ni se ejecutaron endpoints, health, pruebas funcionales o E2E, ni se crearon datos de prueba.

## Archivos creados

- `src/types/reserva.ts`
- `src/services/reservasApi.ts`
- `src/domain/precios.ts`
- `src/domain/reservas.ts`
- `src/components/EstadoReservaBadge.tsx`
- `src/components/PrecioReserva.tsx`
- `src/components/ReservaDatos.tsx`
- `src/pages/NuevaReservaPage.tsx`
- `src/pages/MisReservasPage.tsx`
- `src/pages/ReservaDetallePage.tsx`
- `src/pages/ReservasOperadorPage.tsx`
- `docs/INTEGRACION_RESERVAS.md`

## Archivos modificados

- `src/App.tsx`: rutas protegidas de creación, listado/detalle TURISTA y gestión OPERADOR.
- `src/components/OfertasPublicas.tsx`: botón Reservar solo para ofertas que requieren reserva; visitantes continúan por el login existente.
- `src/components/PrecioOferta.tsx`: reutiliza el formateador puro extraído, conservando su conversión/preferencia global.
- `src/pages/InicioPage.tsx`: retira el texto antiguo «sin reservas reales».
- `src/pages/LoginPage.tsx`: conserva continuar al pasar al registro.
- `src/pages/RegistroTuristaPage.tsx`: conserva continuar al volver al login y tras registrar la cuenta.
- `src/pages/MiCuentaPage.tsx`: Mis reservas para TURISTA y Reservas recibidas para OPERADOR.
- `src/theme/styles.css`: estilos de reservas y badges compatibles con los formularios/tarjetas existentes y móvil.

## Tipos TypeScript

- `EstadoReserva`: PENDIENTE, CONFIRMADA, RECHAZADA, CANCELADA, COMPLETADA.
- `ReservaRequest`: negocioExperienciaId (number), fechaReserva (fecha civil YYYY-MM-DD), cantidadPersonas (number entero), observaciones (string|null).
- `RechazarReservaRequest`: motivo (string).
- `ReservaResponse`: request más id UUID, datos del turista permitidos por el DTO, negocio, destino, experiencia, estado, motivoRechazo, precioReserva, monedaReserva, fechas y versión. No se presenta la versión ni los identificadores técnicos como información del usuario.
- `ReservaOperadorFiltros`: estado, negocioId y fecha opcionales.

IDs de reserva, negocio y turista son UUID/string. El ID de la oferta es Long/number. Todos los listados son arrays, sin paginación de reservas. Son nullable turistaTelefono, observaciones, motivoRechazo y precioReserva; monedaReserva usa el tipo Moneda existente.

## Servicio y endpoints

Se reutiliza apiRequest y la sesión JWT existente. Ningún componente llama fetch directamente ni proporciona tokens manualmente.

| Método frontend | HTTP | Endpoint | Body / query |
| --- | --- | --- | --- |
| crearReserva | POST | `/api/v1/reservas` | Solo negocioExperienciaId, fechaReserva, cantidadPersonas, observaciones |
| listarMisReservas | GET | `/api/v1/reservas/me` | Sin filtros |
| obtenerReserva | GET | `/api/v1/reservas/{reservaId}` | Sin body |
| cancelarReserva | PATCH | `/api/v1/reservas/{reservaId}/cancelar` | Sin body |
| listarReservasOperador | GET | `/api/v1/operadores/reservas` | estado, negocioId y fecha opcionales |
| obtenerReservaOperador | GET | `/api/v1/operadores/reservas/{reservaId}` | Sin body |
| confirmarReserva | PATCH | `/api/v1/operadores/reservas/{reservaId}/confirmar` | Sin body |
| rechazarReserva | PATCH | `/api/v1/operadores/reservas/{reservaId}/rechazar` | `{ motivo }` |
| completarReserva | PATCH | `/api/v1/operadores/reservas/{reservaId}/completar` | Sin body |

La creación serializa explícitamente los cuatro campos permitidos. No envía turistaId, estado, precioReserva ni monedaReserva, aunque el objeto recibido por el servicio tuviera propiedades adicionales. Los GET admiten AbortSignal y los filtros presentes se codifican con URLSearchParams. El parámetro del filtro operador se llama `fecha`, no `fechaReserva`.

## Flujo TURISTA y visitante

- La tarjeta pública muestra Reservar cuando reservaRequerida es true. Un visitante accede por una ruta protegida que conserva slugs e ID de oferta en el pathname, permitiendo volver desde el login sin depender de estado de navegación temporal.
- El paso opcional de registro conserva la continuación hasta volver a iniciar sesión. No se cambia la autenticación ni el JWT.
- La nueva página vuelve a resolver la oferta desde el listado público real del destino/experiencia. No se inventa un endpoint público por ID de oferta ni se usa un identificador editable en el formulario.
- Formulario: fecha, cantidad de personas y observaciones. El resumen muestra destino, experiencia, negocio, precio y moneda originales, conversión visual existente y los datos elegidos.
- Fecha mínima según America/Bogota, la zona utilizada por el servicio de reservas. Se envía la fecha civil sin convertirla a timestamp. El backend conserva la validación final.
- Cantidad entera mínima1, sin máximo arbitrario; observaciones opcionales de máximo1000. El envío usa la oferta canónica recuperada, no valores de precio/estado/propietario del formulario.
- La respuesta de creación lleva al detalle y muestra feedback. Una respuesta tardía no redirige ni aplica errores si el usuario cambió de visita o cuenta. No se repite ni se considera cancelada una creación ya enviada.
- Mis reservas muestra datos reales, badges y precio histórico. El detalle hace su propio GET y permite cancelar solo en PENDIENTE/CONFIRMADA, con confirmación y protección contra doble envío.

## Flujo OPERADOR

Reservas recibidas está dentro de Mi Cuenta del operador. No se añadió otro dashboard ni pestañas inferiores.

El listado consume los filtros del backend, sin descargar todas las reservas para filtrarlas en el cliente. El selector de negocios carga todas las páginas de negocios propios y se actualiza al regresar a la vista Ionic; una falla del selector no oculta el listado de reservas. El filtro de fecha permite fechas históricas.

El resumen muestra cliente, negocio, destino, experiencia, fecha, personas, estado, observaciones y precio histórico. El detalle modal hace GET de la reserva y muestra exclusivamente los datos de cliente incluidos en el DTO: nombres, apellidos, correo y teléfono. Nunca pide operadorId ni modifica ownership.

| Estado | TURISTA | OPERADOR |
| --- | --- | --- |
| PENDIENTE | Cancelar | Confirmar o rechazar |
| CONFIRMADA | Cancelar | Completar |
| RECHAZADA | Consultar | Consultar |
| CANCELADA | Consultar | Consultar |
| COMPLETADA | Consultar | Consultar |

Confirmar/completar requieren confirmación visual. Rechazar abre un modal con motivo no vacío y máximo1000, sin inventar mínimo de cinco caracteres. No se agregan restricciones de fecha a las transiciones que el backend no tenga.

Las acciones bloquean el doble envío, actualizan listado/detalle y presentan feedback. Un 409 conserva el mensaje y consulta el estado vigente sin repetir el PATCH. Los errores 404 no exponen información de cuentas/negocios ajenos.

## Precio histórico y moneda

Las reservas muestran únicamente precioReserva y monedaReserva de su respuesta. `PrecioReserva` no consume MonedaContext ni consulta conversiones actuales. `domain/precios.ts` comparte solo el formateador puro Intl.NumberFormat con PrecioOferta.

No se utiliza el precio actual de la oferta para mostrar una reserva existente. No se multiplica ningún precio por cantidadPersonas ni se calcula un total. El cero es válido; el precio null se muestra como no especificado, sin convertirlo en cero. El selector global continúa sirviendo a las ofertas y al resumen previo a la solicitud, sin alterar el importe histórico de las reservas.

## Seguridad y condiciones reales

- `/api/v1/reservas/**` requiere rol TURISTA.
- `/api/v1/operadores/reservas/**` requiere OPERADOR.
- La guarda existente protege las rutas y conserva su revalidación de roles.
- Crear requiere oferta ACTIVA con reservaRequerida=true, negocio ACTIVO, destino PUBLICADO y experiencia ACTIVA. El backend es la autoridad final, incluida cualquier variación entre cargar la oferta y enviarla.
- La propiedad de las reservas se comprueba en backend. TURISTA no recibe controles de confirmar/rechazar/completar; las vistas OPERADOR no reciben controles de creación/cancelación turística.
- No se cambiaron seguridad, entidades, services, controllers ni Liquibase del backend.

## Rutas frontend

| Ruta | Rol |
| --- | --- |
| `/destinos/:destinoSlug/experiencias/:experienciaSlug/reservar/:ofertaId` | TURISTA; visitante pasa primero por login |
| `/reservas` | TURISTA |
| `/reservas/:id` | TURISTA |
| `/operador/reservas` | OPERADOR |

## Validación técnica

- BUILD: PASS, `npm run build`.
- TYPECHECK: PASS, incluido mediante `tsc -b` en el build.
- LINT: NO CONFIGURADO; el proyecto no contiene script lint.
- Advertencia existente no bloqueante de chunks mayores a500kB.
- Revisión estática de contratos, payloads, transiciones, fechas civiles y manejo de respuestas tardías; git diff --check correcto.
- BACKEND MODIFICADO: NO.
- PRUEBAS FUNCIONALES: NO EJECUTADAS.
- No se ejecutaron pruebas unitarias/E2E, navegadores automatizados ni llamadas a endpoints/health; no se crearon reservas ni usuarios artificiales.

## Pendientes fuera de esta tarea

- Pruebas funcionales por rol y de propiedad/concurrencia con backend real.
- Pruebas E2E y revisión visual responsive.
- Pagos y checkout.
- Disponibilidad/cupos y reglas de tarifa/total cuando exista contrato backend.
