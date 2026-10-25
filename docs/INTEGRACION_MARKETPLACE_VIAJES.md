# Integración de marketplace, ofertas y viajes

Frontend: Explora Mutatá (Ionic React, TypeScript y router existentes).
Backend inspeccionado: `hoiverduas/ExploraMutata`, `main`, commit `4abf930`.
La implementación se contrastó con controllers, DTOs, enums, servicios, repositorios y seguridad de ese commit. No se modificó el backend, sus contratos ni sus migraciones.

## Flujos disponibles

- Inicio muestra destinos, paquetes publicados y negocios reales por categoría. Las fotografías existentes son editoriales del territorio; no representan fotos aportadas por cada negocio.
- Aventuras → destino → experiencia → ofertas → detalle y cotización. `/destinos` conserva su acceso anterior; `/aventuras` es la entrada principal.
- Catálogo por categoría → Ver negocio → ofertas y paquetes → Ver oferta → cotizar → agregar a Mi viaje o solicitar una reserva individual.
- Paquetes → detalle, condiciones e itinerario → cotizar → crear un viaje en borrador → revisar y reservar desde el viaje.
- Mi viaje selecciona un `PaqueteTuristico` BORRADOR real del usuario. Su contador procede de `totalItems`; no hay carrito local paralelo.
- Mis viajes permite crear borradores, consultarlos y continuar su composición. El detalle permite renombrar, editar/quitar servicios, cotizar, revisar en modal y reservar. Una vez reservado se bloquea la composición; cancelación y estados se resuelven con el backend.
- El resultado de reservar muestra las reservas individuales y sus estados reales, sin presentarlas como confirmadas automáticamente.
- Operador → Mis negocios → Gestionar ofertas / Gestionar paquetes. La gestión conserva la validación de propiedad del backend y las guardas JWT/roles existentes.

## Inventario

Páginas creadas:

- `src/pages/NegocioDetallePage.tsx`
- `src/pages/OfertaDetallePage.tsx`
- `src/pages/PaquetesPage.tsx`
- `src/pages/PaqueteDetallePage.tsx`
- `src/pages/MiViajePage.tsx`
- `src/pages/MisViajesPage.tsx`
- `src/pages/ViajeDetallePage.tsx`
- `src/pages/OperadorResumenPage.tsx`
- `src/pages/PaquetesOperadorPage.tsx`

Páginas modificadas:

- `InicioPage`, `DestinosPage`, `DestinoDetallePage`, `ExperienciasPublicasPage`, `ExperienciaDetallePage`.
- `MiCuentaPage`, `MisNegociosPage`, `OfertasNegocioPage`, `ReservasOperadorPage`, `NuevaReservaPage`.
- Los listados/detalles de reservas existentes reciben las mejoras a través de `ReservaDatos` y `PrecioReserva`, sin reescribir sus flujos.

Componentes creados:

- `CotizadorOferta`, `DatosOferta`, `OfertaPublicaCard`, `OfertaCampos`.
- `TarjetaPaqueteComercial`, `PaquetesComercialesNegocio`.
- `viaje/CrearViajeForm`, `viaje/EditarItemViaje`, `viaje/EstadoViajeBadge`, `viaje/ItinerarioViaje`, `viaje/CotizacionViaje`, `viaje/TotalesViaje`.

Integración compartida:

- `ViajeContext` y su provider dentro del `AuthProvider` existente.
- Router, cabecera con contador, navegación turística, barra inferior tras iniciar sesión, skeletons y empty states.
- CSS para cards, formularios por categoría, constructor de paquetes, itinerario, resumen y anchos móviles de 320/375/430 px. La revisión visual en navegador queda para la tarea de pruebas funcionales.
- Eliminado `src/data/catalog.json`, que ya no tenía consumidores.
- No se agregaron dependencias.

Servicios creados: `ofertasApi`, `cotizacionApi`, `paquetesTuristicosApi`, `paquetesComercialesApi`.
Servicios ampliados: `reservasApi` y `http` (mensajes de errores internos sin SQL/trazas).
Tipos creados: `oferta.ts`, `cotizacion.ts`, `paqueteTuristico.ts`, `paqueteComercial.ts`.
Tipo ampliado: `reserva.ts`.
No se introdujo `any` de TypeScript.

## Contratos respetados

Ofertas genéricas:

- Operador: `/api/v1/operadores/negocios/{negocioId}/ofertas`: GET/POST; `/{ofertaId}`: GET/PUT; `/{ofertaId}/activar` y `/desactivar`: PATCH.
- Público: GET `/api/v1/public/negocios/{negocioId}/ofertas`, con categoría opcional.
- Especialidades: segmentos `restaurante`, `hospedaje`, `transporte`, `guia`, `vida-nocturna` bajo las raíces anteriores. GET/POST y GET/PUT individual en operador; solo GET listado en público.
- Las respuestas especializadas anidan `oferta`; sus requests son planos. Transporte no envía campos de duración que su DTO no acepta.
- Aventura usa el contrato genérico con destino/experiencia reales. Los demás formularios usan sus DTOs específicos y enums exactos.
- No existe GET público global o individual de ofertas. Los adaptadores de detalle buscan en los listados públicos reales por negocio; no se inventó un endpoint.
- El negocio público tampoco expone GET individual: se resuelve desde el catálogo existente.

Cotización:

- POST público `/api/v1/public/ofertas/{ofertaId}/cotizar`.
- Body: `cantidadPersonas`, `fechaInicio`, `fechaFin`, `cantidadTrayectos`.
- El backend devuelve fechas efectivas, días, noches, unidades, trayectos, total, disponibilidad y conversiones. El frontend no replica fórmulas, capacidad por vehículo/habitación/mesa/grupo ni tasas de cambio.
- El enum real no incluye `POR_VEHICULO_Y_TRAYECTO`: `POR_VEHICULO` ya resuelve sus unidades y trayectos en el servidor.
- Las duraciones reales son `UNICO`, `DIA`, `NOCHE`, `SEMANA`, `MES`; no se inventó una unidad de horas.
- La cotización se invalida al cambiar parámetros, oferta, visita o sesión. Botones y referencias impiden doble envío; las respuestas obsoletas no redirigen la navegación actual.

Paquetes turísticos (TURISTA):

- `/api/v1/paquetes`: POST; `/me`: GET; `/{id}`: GET/PATCH.
- `/{id}/items`: POST; `/{id}/items/{itemId}`: PUT/DELETE.
- `/{id}/cotizar`, `/{id}/reservar`: POST; `/{id}/cancelar`: PATCH.
- Item: `ofertaId`, `fechaInicio`, `fechaFin`, `cantidadPersonas`, `cantidadTrayectos`, `orden`, `observaciones`.
- Se separa el estado de composición (`BORRADOR`, `RESERVADO`, `CANCELADO`) del estado consolidado. El itinerario se ordena por fecha y orden.
- Los conflictos 409 actualizan la consulta sin repetir la escritura y conservan el mensaje de error.

Paquetes comerciales:

- GET público `/api/v1/public/paquetes-comerciales`, filtro opcional `negocioId`; GET `/{id}`; POST `/{id}/cotizar`.
- POST TURISTA `/api/v1/paquetes-comerciales/{id}/crear-viaje` devuelve un paquete turístico, seleccionado en el contexto existente.
- Raíz OPERADOR `/api/v1/operadores/negocios/{negocioId}/paquetes-comerciales`: GET/POST; `/{id}` GET/PUT; items POST/PUT/DELETE; estados PATCH publicar/desactivar/borrador.
- Constructor con ofertas del negocio, días del itinerario, orden mediante subir/bajar, vigencia y condiciones. Solo BORRADOR admite composición. `COLABORATIVO` no puede crearse/publicarse desde la interfaz.
- Modelos reales: `SUMA_COMPONENTES`, `PRECIO_FIJO`, `POR_PERSONA`, `POR_GRUPO`.
- Los totales autoritativos de la cotización comercial pueden diferir de los precios de cada componente; no se suman para sustituir el precio del paquete.
- No hay un campo agregado de «precio anterior de componentes». Se muestran los importes individuales reales en el desglose, sin inventar un descuento o una cifra «Antes».
- El viaje conserva `paqueteComercialId` y `precioComercialAplicado`. Cualquier cambio de item puede perder el precio promocional; el backend decide el resultado. Renombrar no cambia esa composición.

Reservas y moneda:

- POST conserva `negocioExperienciaId` para el ID genérico, y ahora admite `fechaFin` y `cantidadTrayectos`.
- Respuesta ampliada con `paqueteId`, `paqueteItemId`, fechas, modelo/precio unitario/total reservados y detalle de cotización. Los datos destino/experiencia son nullable para servicios de otras categorías.
- `totalReserva` y `monedaReserva` muestran el importe histórico. No se recalculan con el selector de moneda ni se multiplican por personas en el cliente.
- Los totales consolidados guardados proceden del backend. En cotizaciones se usa la preferencia COP/USD/EUR existente y solo las conversiones proporcionadas por backend.
- El operador ve referencia al viaje, sin enlaces privados de turista ni controles para reservas de otros negocios.
- Se mantiene el enlace anterior de reserva de aventura como acceso al nuevo detalle/cotizador.

## Rutas

Públicas principales:

- `/inicio`, `/aventuras`, `/destinos`, `/destinos/:slug`.
- `/destinos/:destinoSlug/experiencias/:experienciaSlug`.
- `/catalogo`, `/experiencias` (operadores de aventura), `/catalogo/experiencias`, `/catalogo/experiencias/:slug`.
- `/alojamientos`, `/restaurantes`, `/transporte`, `/guias`, `/vida-nocturna`.
- `/negocios/:negocioId`, `/negocios/:negocioId/ofertas/:ofertaId`.
- `/paquetes`, `/paquetes/:paqueteId`.

TURISTA:

- `/mi-viaje`, `/viajes`, `/viajes/:id`.
- `/reservas`, `/reservas/:id` y enlace anterior `/destinos/:destinoSlug/experiencias/:experienciaSlug/reservar/:ofertaId`.

OPERADOR:

- `/operador`, `/operador/negocios`.
- `/operador/negocios/:negocioId/ofertas`.
- `/operador/negocios/:negocioId/paquetes`.
- `/operador/reservas`.

Las rutas de autenticación, solicitudes de operador, Mi cuenta y ADMIN existentes se conservan.

## Limitaciones del contrato actual

- El DTO público de negocio no tiene foto propia, dirección ni horarios. Se usan fotos editoriales existentes y no se inventan esos atributos.
- Los destinos/experiencias no entregan conteos agregados de operadores ni precio mínimo por destino. Las ofertas y sus precios se muestran al entrar en su listado.
- No hay catálogo global de ofertas con filtros de precio/capacidad. Se usan filtros reales de categoría por negocio y búsquedas sobre los listados ya consultados, sin descargar ofertas de todos los negocios en cascada.
- No se implementan pagos ni los demás módulos excluidos por la solicitud.

## Error backend detectado por inspección estática

Archivos y métodos:

- `ofertas/service/impl/OfertaNegocioServiceImpl.java`: `esVisiblePublicamente` comprueba la asociación destino-experiencia.
- `ofertas/cotizacion/service/impl/CotizacionOfertaServiceImpl.java`: `validarOfertaPublica` comprueba los estados de oferta, negocio, destino y experiencia, pero omite esa asociación.
- `reservas/service/impl/ReservaServiceImpl.java`: `buscarOfertaReservable` también omite la asociación y usa el cotizador anterior.

Problema: si se desvincula una experiencia del destino después de activar la oferta, el listado público la oculta, pero el cotizador y la reserva no aplican esa misma regla.
Impacto: un ID conocido o una oferta ya agregada a un borrador puede seguir siendo cotizable/reservable con la relación eliminada. No se alteró el backend ni se crearon datos para reproducirlo. Es un hallazgo de lectura de código, no una prueba E2E ejecutada.

## Validación

- `npm run build`: PASS; ejecuta `tsc -b` y Vite.
- Typecheck: PASS dentro del build.
- Lint: NO CONFIGURADO (no existe script en package.json).
- Advertencia no bloqueante: tamaño del bundle principal mayor de 500 kB.
- `git diff --check`: PASS.
- Backend modificado: NO.
- Pruebas funcionales, E2E, navegador automatizado y llamadas para crear usuarios/reservas: NO EJECUTADAS.
- Pendiente para otra tarea: validación funcional y visual con el backend real en ejecución.
