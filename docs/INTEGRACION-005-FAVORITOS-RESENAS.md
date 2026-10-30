# Integración 005 — Favoritos + reseñas

## Alcance

Integra en el frontend la Fase 044 del backend.

## Favoritos

Tipos soportados:

- NEGOCIO
- EXPERIENCIA
- OFERTA
- DESTINO
- PAQUETE

Endpoints:

```text
POST   /api/v1/favoritos
GET    /api/v1/favoritos
GET    /api/v1/favoritos/{tipo}/{recursoId}/estado
DELETE /api/v1/favoritos/{tipo}/{recursoId}
```

El botón de favorito se muestra en tarjetas y detalles públicos. Si el visitante no ha iniciado sesión, se dirige al login conservando la ruta de retorno.

Ruta del turista:

```text
/favoritos
```

La página resuelve los IDs guardados contra el catálogo público y muestra nombres/rutas reales. Si un recurso dejó de estar publicado, el favorito se conserva pero se marca como no disponible.

## Reseñas del turista

Reglas backend conservadas:

- Solo reservas COMPLETADAS.
- Una reseña por reserva.
- Calificación de 1 a 5.
- Comentario opcional, máximo 2000 caracteres.
- Solo una reseña PUBLICADA puede editarse.
- RETIRADA no se elimina físicamente ni puede volver a editarse.

Endpoints:

```text
POST  /api/v1/resenas
GET   /api/v1/resenas/me
PUT   /api/v1/resenas/{resenaId}
PATCH /api/v1/resenas/{resenaId}/retirar
```

Rutas:

```text
/reservas/{id}
/mis-resenas
```

El detalle de una reserva COMPLETADA permite crear, editar o retirar la reseña según su estado.

## Reseñas públicas

Endpoints:

```text
GET /api/v1/public/resenas/negocios/{negocioId}
GET /api/v1/public/resenas/negocios/{negocioId}/resumen
```

La ficha pública del negocio muestra:

- promedio
- cantidad
- estrellas
- comentario
- fecha
- respuesta del operador

No se expone identidad, correo, teléfono ni documento del turista.

## Operador

Ruta:

```text
/operador/resenas
```

Endpoints:

```text
GET /api/v1/operadores/resenas/negocios/{negocioId}
PUT /api/v1/operadores/resenas/{resenaId}/respuesta
```

El operador únicamente consulta reseñas de sus propios negocios. Puede responder PUBLICADA u OCULTA y no puede responder RETIRADA, respetando la validación del backend.

## Administración

Ruta:

```text
/gestion/resenas
```

Se añadió un endpoint de lectura para completar la moderación administrativa:

```text
GET /api/v1/admin/resenas/negocios/{negocioId}
```

Este endpoint no cambia reglas de negocio ni esquema; devuelve las reseñas del negocio con todos sus estados para que ADMIN/SUPER_ADMIN pueda descubrir también las OCULTA.

Moderación:

```text
PATCH /api/v1/admin/resenas/{resenaId}/moderar
```

Reglas conservadas:

- ADMIN puede cambiar entre PUBLICADA y OCULTA.
- Ocultar requiere motivo.
- RETIRADA por el turista no puede republicarse.
- No existe borrado físico desde frontend.

## Rutas protegidas

```text
/favoritos             -> TURISTA
/mis-resenas           -> TURISTA
/operador/resenas      -> OPERADOR
/gestion/resenas       -> ADMIN / SUPER_ADMIN
```

## Prueba manual recomendada

### Turista

1. Iniciar sesión.
2. Abrir negocio/destino/experiencia/oferta/paquete.
3. Guardar y quitar favoritos.
4. Abrir `/favoritos`.
5. Completar una reserva.
6. Abrir el detalle de la reserva.
7. Crear reseña.
8. Editarla.
9. Verla públicamente en la ficha del negocio.
10. Retirarla y comprobar que desaparece de la vista pública.

### Operador

1. Abrir `/operador/resenas`.
2. Seleccionar un negocio propio.
3. Consultar reseñas.
4. Responder una PUBLICADA.
5. Comprobar la respuesta en la ficha pública.

### Administración

1. Abrir `/gestion/resenas`.
2. Seleccionar un negocio.
3. Ocultar una reseña indicando motivo.
4. Confirmar que desaparece de la vista pública.
5. Publicarla nuevamente.
6. Confirmar que una RETIRADA no ofrece acción de republicación.
