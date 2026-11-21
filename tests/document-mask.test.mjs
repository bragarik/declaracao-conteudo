// SPDX-License-Identifier: GPL-3.0-only
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import IMask from 'imask';

let server, formatDocument, documentIdentity, documentMaskOptions;
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), cacheDir: fileURLToPath(new URL('../node_modules/.vite-document-tests', import.meta.url)), configFile: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null } });
  ({ formatDocument, documentIdentity, documentMaskOptions } = await server.ssrLoadModule('/src/features/declaration/document-mask.ts'));
});
after(async () => { await server?.close(); });

test('formata CPF completo e preserva zeros iniciais', () => {
  assert.equal(formatDocument('01234567890'), '012.345.678-90');
  assert.equal(formatDocument('012.345.678-90'), '012.345.678-90');
});
test('formata CNPJ numérico e alfanumérico', () => {
  assert.equal(formatDocument('12345678901234'), '12.345.678/9012-34');
  assert.equal(formatDocument('00000000E08G12'), '00.000.000/E08G-12');
  assert.equal(formatDocument('00.000.000/E08G-12'), '00.000.000/E08G-12');
});
test('outros tamanhos e documentos estrangeiros não são cortados nem alterados', () => {
  for (const value of ['', '123', '1234567890', '123456789012', '1234567890123', '123456789012345', 'AB-123/XY', 'DOC 123.456-X', '123.456.789-01A']) {
    assert.equal(formatDocument(value), value);
    assert.equal(documentIdentity(value), value);
  }
});
test('identidade de CPF/CNPJ é igual com e sem máscara; texto livre é preservado', () => {
  assert.equal(documentIdentity('012.345.678-90'), '01234567890');
  assert.equal(documentIdentity('12.345.678/9012-34'), '12345678901234');
  assert.equal(documentIdentity('00.000.000/E08G-12'), '00000000E08G12');
  assert.equal(documentIdentity('AB-123/XY'), 'AB-123/XY');
});
test('máscara dinâmica alterna CPF, texto livre e CNPJ durante a digitação', () => {
  const model = IMask.createMask(documentMaskOptions());
  for (const character of '12345678901') model.append(character);
  assert.equal(model.value, '123.456.789-01');
  model.append('2'); assert.equal(model.value, '123456789012');
  model.append('3'); assert.equal(model.value, '1234567890123');
  model.append('4'); assert.equal(model.value, '12.345.678/9012-34');
  model.append('A'); assert.equal(model.value, '12345678901234A');
});
test('colagem mantém CPF/CNPJ e texto livre, incluindo pontuação estrangeira', () => {
  for (const [value, formatted] of [['01234567890', '012.345.678-90'], ['12.345.678/9012-34', '12.345.678/9012-34'], ['00000000E08G12', '00.000.000/E08G-12'], ['AB-123/XY', 'AB-123/XY'], ['123.456.789-01A', '123.456.789-01A']]) {
    const model = IMask.createMask(documentMaskOptions()); model.resolve(value);
    assert.equal(model.value, formatted);
  }
});
