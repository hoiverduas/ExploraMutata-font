import test from 'node:test';
import assert from 'node:assert/strict';
import { validarCatalogoPublico, negociosPublicosUnicos } from '../src/domain/catalogoPublico.ts';

// Entradas de contrato para pruebas puras: no se sustituyen fetch ni endpoints reales.
const entrada = categorias => ({ id: 'contrato', nombreComercial: '', categorias, descripcion: null, correoContacto: '', telefonoContacto: '' });

test('Acepta y conserva todas las categorías del nuevo contrato', () => {
  const categorias = ['HOSPEDAJE', 'RESTAURANTE', 'AVENTURA', 'TRANSPORTE'];
  const resultado = validarCatalogoPublico([entrada(categorias)]);
  assert.deepEqual(resultado[0].categorias, categorias);
  assert.equal(resultado.length, 1);
});
test('Un negocio antiguo con array vacío no recibe categorías inventadas', () => {
  assert.deepEqual(validarCatalogoPublico([entrada([])])[0].categorias, []);
});
test('Acepta las seis categorías de negocio admitidas', () => {
  const categorias = ['HOSPEDAJE', 'RESTAURANTE', 'AVENTURA', 'VIDA_NOCTURNA', 'GUIA', 'TRANSPORTE'];
  assert.deepEqual(validarCatalogoPublico([entrada(categorias)])[0].categorias, categorias);
});
test('Rechaza la respuesta singular antigua con un error de contrato', () => {
  const { categorias, ...sinCategorias } = entrada([]);
  assert.throws(() => validarCatalogoPublico([{ ...sinCategorias, categoria: 'HOSPEDAJE' }]), /contrato esperado/);
});
test('Rechaza null o texto en categorias en lugar de array', () => {
  for (const categorias of [null, 'HOSPEDAJE', undefined]) {
    assert.throws(() => validarCatalogoPublico([entrada(categorias)]), /categorias/);
  }
});
test('Destinos naturales y categorías desconocidas no pertenecen a negocios', () => {
  for (const categoria of ['DESTINO', 'OTRA']) {
    assert.throws(() => validarCatalogoPublico([entrada([categoria])]), /categorías de negocio válidas/);
  }
});
test('Rechaza un contenedor o campos incompatibles sin pasar datos rotos a las tarjetas', () => {
  assert.throws(() => validarCatalogoPublico({ contenido: [] }), /contrato esperado/);
  assert.throws(() => validarCatalogoPublico([{ ...entrada([]), nombreComercial: null }]), /contrato esperado/);
});
test('Un registro multicategoría no se expande y se muestra una vez por id', () => {
  const negocio = entrada(['HOSPEDAJE', 'RESTAURANTE', 'AVENTURA']);
  assert.deepEqual(negociosPublicosUnicos([negocio, negocio]), [negocio]);
});
test('La deduplicación de una sección nunca elimina negocios de otra sección', () => {
  const negocio = entrada(['HOSPEDAJE', 'RESTAURANTE']);
  assert.equal(negociosPublicosUnicos([negocio]).length, 1);
  assert.equal(negociosPublicosUnicos([negocio]).length, 1);
});
