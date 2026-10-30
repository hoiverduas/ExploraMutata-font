# Integración 004 — Wompi / pagos

## Alcance

Esta integración conecta el frontend de Explora Mutatá con el módulo financiero ya existente en el backend.

Flujo principal:

```text
RESERVA
  -> ORDEN DE PAGO
  -> PREPARACIÓN WOMPI
  -> WEB CHECKOUT
  -> transaction.updated
  -> WEBHOOK BACKEND
  -> PAGO
  -> DISTRIBUCIONES
  -> MOVIMIENTOS
  -> LIQUIDACIÓN
  -> PAGOS A TERCEROS
  -> CONCILIACIÓN
```

El navegador nunca considera aprobado un pago solamente porque Wompi lo redirigió a la aplicación. El estado definitivo se obtiene del backend, cuyo webhook procesa `transaction.updated`.

## Rutas frontend

- `/reservas/:id`: detalle de reserva y pago del turista.
- `/pagos/resultado`: retorno de Wompi y consulta del estado interno.
- `/operador/finanzas`: cuentas de pago, movimientos, liquidaciones y dispersiones del operador.
- `/gestion/finanzas`: administración financiera para ADMIN/SUPER_ADMIN.

## Checkout Wompi

El backend entrega:

- llave pública
- moneda
- monto en centavos
- referencia
- firma de integridad
- URL de redirección

El frontend envía esos valores al Web Checkout oficial:

```text
https://checkout.wompi.co/p/
```

El secreto de integridad y la llave privada nunca se almacenan ni se calculan en el frontend.

### Variables backend — cobros

Ejemplo de sandbox:

```properties
wompi.enabled=true
wompi.ambiente=sandbox
wompi.url-base=https://sandbox.wompi.co/v1
wompi.llave-publica=${WOMPI_LLAVE_PUBLICA:}
wompi.llave-privada=${WOMPI_LLAVE_PRIVADA:}
wompi.secreto-integridad=${WOMPI_SECRETO_INTEGRIDAD:}
wompi.secreto-eventos=${WOMPI_SECRETO_EVENTOS:}
wompi.url-redireccion=http://localhost:5173/pagos/resultado
```

No guardar secretos reales en Git ni enviarlos al frontend.

## Webhook de cobros

El backend expone:

```text
POST /api/v1/webhooks/wompi
```

Wompi debe poder acceder a este endpoint desde Internet mediante HTTPS durante las pruebas de webhook. `localhost` no sirve como URL de evento externa.

La URL de redirección del Checkout sí puede apuntar al frontend local durante pruebas manuales, siempre que el navegador del usuario tenga acceso a esa URL.

## Pagos a Terceros

Es un producto independiente del Checkout de cobros.

Variables backend:

```properties
wompi.pagos-terceros.enabled=true
wompi.pagos-terceros.url-base=https://api.sandbox.payouts.wompi.co/v1
wompi.pagos-terceros.api-key=${WOMPI_PAGOS_TERCEROS_API_KEY:}
wompi.pagos-terceros.usuario-principal-id=${WOMPI_PAGOS_TERCEROS_USUARIO_PRINCIPAL_ID:}
wompi.pagos-terceros.secreto-eventos=${WOMPI_PAGOS_TERCEROS_SECRETO_EVENTOS:}
wompi.pagos-terceros.cuenta-origen-id=${WOMPI_PAGOS_TERCEROS_CUENTA_ORIGEN_ID:}
```

No usar las llaves `pub_test_` / `prv_test_` del Checkout como credenciales de Pagos a Terceros.

Mientras el producto no esté activado, el frontend mantiene disponibles las pantallas internas, pero las operaciones de bancos, cuentas origen, salud y dispersiones pueden devolver servicio no disponible.

## Prueba recomendada — turista

1. Crear una reserva.
2. Confirmarla o mantenerla en un estado admitido por el backend.
3. Abrir `/reservas/:id`.
4. Pulsar **Preparar pago con Wompi**.
5. Revisar referencia y valor a cobrar.
6. Pulsar **Pagar con Wompi**.
7. Completar una transacción sandbox.
8. Wompi redirige a `/pagos/resultado?id=...`.
9. La pantalla consulta la orden y sus intentos en Explora Mutatá.
10. Solo cuando el backend procese el webhook aprobado la orden se muestra como `PAGADA`.

## Prueba recomendada — operador

1. Entrar como OPERADOR.
2. Abrir `/operador/finanzas`.
3. Seleccionar un negocio.
4. Consultar movimientos y liquidaciones.
5. Cuando Pagos a Terceros esté activo, consultar bancos Wompi.
6. Registrar una cuenta bancaria.
7. Esperar/verificar su estado.

El número de cuenta completo no regresa al frontend después de registrarse; se presenta enmascarado.

## Prueba recomendada — administración

1. Entrar como ADMIN/SUPER_ADMIN.
2. Abrir `/gestion/finanzas`.
3. Verificar cuentas de pago pendientes.
4. Configurar la regla de comisión.
5. Crear una liquidación cuando existan distribuciones disponibles.
6. Enviar a Wompi solamente liquidaciones `LISTA` o `FALLIDA`.
7. Consultar/sincronizar la dispersión.
8. Para `ESTADO_INCIERTO`, reutilizar el endpoint idempotente; no crear una dispersión duplicada.
9. Ejecutar conciliaciones y reembolsos desde sus secciones correspondientes.

## Seguridad

- Los secretos Wompi permanecen en backend.
- El frontend usa únicamente la llave pública del Checkout.
- El webhook firmado es la fuente de verdad para aprobación.
- La cuenta bancaria queda cifrada en backend y se devuelve enmascarada.
- Las rutas financieras están protegidas por roles.
- El backend revalida el estado vigente de la reserva antes de preparar un Checkout Wompi.
