# Integración del módulo OPERADOR

Los contratos se contrastaron con los controladores, DTO y servicios del backend adjunto (ZIP, revisión `6d7e6d3c805bcbb83fd9040fc937941b62e7afe4`). El backend no se modificó. No se agregaron mocks ni datos de demostración.

## Archivos creados

- `src/types/operador.ts`
- `src/services/operadoresApi.ts`
- `src/services/operadorNegociosApi.ts`
- `src/pages/SolicitudOperadorPage.tsx`
- `src/pages/SolicitudesOperadorAdminPage.tsx`
- `src/pages/MisNegociosPage.tsx`
- `src/components/NegocioCampos.tsx`
- `src/components/HistorialNegocioModal.tsx`
- `src/domain/operadorNegocios.ts`
- `tests/operadorNegocios.test.mjs`
- `docs/INTEGRACION_OPERADOR.md`

## Archivos modificados

- `src/App.tsx`: tres rutas protegidas; navegación inferior conservada.
- `src/auth/AccesoProtegido.tsx`: limita las redirecciones de vistas retenidas por Ionic a la ruta activa, preservando el destino de regreso del login.
- `src/auth/AuthContext.tsx`: `refrescarUsuario()`, reutilizado en la restauración inicial y el login; evita aplicar respuestas posteriores a un cambio de sesión.
- `src/pages/MiCuentaPage.tsx`: accesos por rol, actualización al entrar y botón para actualizar el perfil.
- `src/pages/NegociosPage.tsx`: conserva su API y administración global; usa los campos y el historial extraídos a componentes compartidos.
- `src/types/negocio.ts`: `operadorId` nullable solo en la respuesta.
- `src/theme/styles.css`: estados de solicitudes y soporte del formulario de consulta deshabilitado.

## Rutas nuevas

| Ruta | Acceso |
| --- | --- |
| `/operador/solicitud` | Cualquier sesión autenticada |
| `/operador/negocios` | OPERADOR |
| `/gestion/operadores/solicitudes` | ADMIN o SUPER_ADMIN |

El operador entra desde Mi cuenta; no se añadió ninguna pestaña inferior.

## Endpoints integrados

Todos usan `apiRequest` con la sesión existente. Los identificadores se codifican en la URL. No se envían `operadorId`, estado, versión ni fechas en los formularios.

| Método | Endpoint | Datos |
| --- | --- | --- |
| POST | `/api/v1/operadores/solicitudes` | Sin body |
| GET | `/api/v1/operadores/solicitudes/me` | 404 equivale a no tener solicitud |
| PATCH | `/api/v1/operadores/solicitudes/{id}/cancelar` | Sin body; confirmación previa |
| GET | `/api/v1/admin/operadores/solicitudes` | Filtro opcional `estado` |
| PATCH | `/api/v1/admin/operadores/solicitudes/{id}/aprobar` | Sin body; confirmación previa |
| PATCH | `/api/v1/admin/operadores/solicitudes/{id}/rechazar` | `{ motivo }`, entre 5 y 500 caracteres |
| GET | `/api/v1/operadores/negocios` | `page` y `size` |
| GET | `/api/v1/operadores/negocios/{id}` | Consulta y carga para editar |
| POST | `/api/v1/operadores/negocios` | `NegocioRequest` |
| PUT | `/api/v1/operadores/negocios/{id}` | `NegocioRequest` |
| PATCH | `/api/v1/operadores/negocios/{id}/solicitar-revision` | `{ motivo }`, entre 5 y 500 caracteres |
| PATCH | `/api/v1/operadores/negocios/{id}/desactivar` | `{ motivo }`, entre 5 y 500 caracteres |
| GET | `/api/v1/operadores/negocios/{id}/historial-estados` | Historial real |
| GET | `/api/v1/usuarios/me` | Refresco de roles, sin renovar JWT |

## Comportamiento y compatibilidad

Se conservan los cuatro roles existentes. Los roles recibidos del servidor se reemplazan por el perfil actualizado, sin añadirlos artificialmente en el cliente. La aprobación conserva TURISTA en el backend.

| Estado del negocio | Acciones del operador |
| --- | --- |
| PENDIENTE_VERIFICACION | Consultar, editar, historial, desactivar |
| RECHAZADO | Consultar, editar, historial, solicitar revisión |
| INACTIVO | Consultar, editar, historial, solicitar revisión |
| ACTIVO | Consultar, historial, desactivar |
| SUSPENDIDO | Consultar, historial |

El backend sigue siendo responsable de autorizar cada petición y comprobar la propiedad. Los errores 400/401/403/409 conservan el manejo existente; el servicio de negocios del operador transforma 404 en «El negocio no existe o no pertenece a tu cuenta». No se ocultan errores de conectividad como ausencia de solicitud. Se conserva la validación de razón social para persona jurídica y todos los límites del formulario administrativo.

En Chromium se detectó que las guardas de páginas retenidas por Ionic sobrescribían `continuar` con `/ingresar`. Se añadió una comprobación opcional de ruta activa y se utiliza en las rutas protegidas existentes y nuevas para conservar el destino original del login.

No se detectaron diferencias entre las rutas/DTO pedidos y el ZIP. El listado administrativo de solicitudes se recibe como array (el controlador devuelve Flux), mientras que negocios usa `PaginaResponse`. No se cambió el contrato ni se inventaron endpoints.

## Flujo de prueba manual con backend real

1. Ejecutar el backend con Java 25, PostgreSQL y su configuración real. Arrancar el frontend con `npm run dev`; por defecto usa el proxy al puerto 8080. Para un backend remoto, configurar la URL pública en `VITE_API_URL` y habilitar el origen del frontend en el backend.
2. Registrarse e ingresar como turista. En Mi cuenta, abrir «Quiero ofrecer servicios». Sin solicitudes debe aparecer la opción de enviar; un 404 de `/me` no debe bloquear la pantalla.
3. Enviar y comprobar PENDIENTE; cancelar con confirmación y volver a enviar si se quiere comprobar CANCELADA.
4. En otra sesión de administrador, abrir Mi cuenta → Solicitudes de operadores. Probar filtros y rechazo con motivo; el turista debe poder reenviar después de RECHAZADA.
5. Aprobar una solicitud pendiente. En la sesión del turista, volver a Mi cuenta o pulsar Actualizar perfil; comprobar TURISTA y OPERADOR con el mismo JWT.
6. Abrir Mis negocios, registrar un negocio real y comprobar PENDIENTE_VERIFICACION. Para persona jurídica, razón social es obligatoria. Consultar, editar e inspeccionar historial.
7. Desde la gestión administrativa existente, comprobar que el negocio aparece y aprobarlo. Actualizar Mis negocios: debe aparecer ACTIVO y no permitir edición; sí historial y desactivación con motivo.
8. Para un negocio rechazado, editar y solicitar nueva revisión; comprobar PENDIENTE_VERIFICACION. Repetir desde INACTIVO.
9. Suspender desde administración: el operador solo debe poder consultar e inspeccionar historial.
10. Con dos operadores reales, verificar que cada listado solo contiene sus negocios y que consultar uno ajeno responde 404. Comprobar además que el servidor rechaza acciones administrativas del operador. Estas comprobaciones requieren usuarios y negocios reales; no se crearon cuentas ni datos falsos.
11. Verificar login, registro, invitación de administradores, catálogo, Sofía y barra inferior. Esta última debe seguir apareciendo únicamente con sesión iniciada.

## Validación realizada

- `npm run build`: correcto (TypeScript y Vite); queda la advertencia existente sobre tamaño de chunks.
- `node --experimental-strip-types --test tests/operadorNegocios.test.mjs`: 9 pruebas correctas sobre restricciones de edición y acciones; sin mocks ni peticiones simuladas.
- Chromium real sin sesión: las tres rutas nuevas redirigen al login, conservan su ruta en `continuar`, la barra inferior queda oculta y el inicio público sigue accesible. Sin errores JavaScript en estas visitas.
- Contratos y reglas contrastados con el código real del ZIP.
- El flujo autenticado completo está pendiente: no hay backend escuchando en `localhost:8080` en este entorno. La máquina tiene Java 21, mientras el proyecto requiere Java 25; tampoco están inyectadas las variables requeridas por ese backend. No se afirma que las operaciones remotas hayan pasado.
