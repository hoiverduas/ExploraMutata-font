import test from 'node:test';
import assert from 'node:assert/strict';
import { accionesOperador, puedeEditarNegocioOperador } from '../src/domain/operadorNegocios.ts';

for (const estado of ['PENDIENTE_VERIFICACION', 'RECHAZADO', 'INACTIVO']) {
  test(`El operador puede editar ${estado}`, () => assert.equal(puedeEditarNegocioOperador(estado), true));
}
for (const estado of ['ACTIVO', 'SUSPENDIDO']) {
  test(`El operador no puede editar ${estado}`, () => assert.equal(puedeEditarNegocioOperador(estado), false));
}
test('Solo pendientes y activos permiten desactivación', () => {
  assert.deepEqual(Object.keys(accionesOperador).filter(e => accionesOperador[e].includes('desactivar')).sort(), ['ACTIVO', 'PENDIENTE_VERIFICACION']);
});
test('Solo rechazados e inactivos permiten nueva revisión', () => {
  assert.deepEqual(Object.keys(accionesOperador).filter(e => accionesOperador[e].includes('solicitar-revision')).sort(), ['INACTIVO', 'RECHAZADO']);
});
test('Un negocio suspendido no ofrece cambios de estado al operador', () => assert.deepEqual(accionesOperador.SUSPENDIDO, []));
test('Nunca se ofrecen acciones administrativas al operador', () => {
  for (const acciones of Object.values(accionesOperador)) {
    for (const accion of acciones) assert.ok(!['aprobar', 'rechazar', 'suspender', 'reactivar'].includes(accion));
  }
});
