// SPDX-License-Identifier: GPL-3.0-only
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

let server, parseImport, ImportValidationError;
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), cacheDir: fileURLToPath(new URL('../node_modules/.vite-import-tests', import.meta.url)), configFile: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null } });
  ({ parseImport } = await server.ssrLoadModule('/src/features/import/import-data.ts'));
  ({ ImportValidationError } = await server.ssrLoadModule('/src/features/import/import-diagnostics.ts'));
});
after(async () => { await server?.close(); });

function diagnostic(source, options) {
  try { parseImport(source, options); assert.fail('Esperava diagnóstico de importação.'); }
  catch (error) { assert.ok(error instanceof ImportValidationError, error.message); return error; }
}
const sample = {
  remetente: { nome: 'Pessoa Remetente', endereco: 'Rua Exemplo, 100', cidade: 'Cidade A', uf: 'SP', cep: '01000-000', documento: '' },
  destinatario: { nome: 'Pessoa Destinatária', endereco: 'Rua Modelo, 200', cidade: 'Cidade B', uf: 'SP', cep: '02000-000', documento: '' },
  itens: [{ conteudo: 'Micro Blocos de Montar - Castelo Medieval com Iluminação, sem Caixa', quantidade: '1', valor: '132,86' }],
  pessso: '', locas: 'Mogi Mirim', data: '',
};

test('mostra os dois nomes desconhecidos do exemplo, inclusive o de valor vazio', () => {
  const source = JSON.stringify(sample, null, 2), error = diagnostic(source);
  assert.equal(error.canProceed, true);
  assert.deepEqual(error.issues.map(issue => [issue.path, issue.suggestion]), [['pessso', 'peso'], ['locas', 'local']]);
  assert.deepEqual(error.issues.map(issue => source.slice(issue.start, issue.end)), ['"pessso"', '"locas"']);
});

test('ignorar avisos importa somente campos reconhecidos, sem renomear o arquivo', () => {
  const source = JSON.stringify(sample);
  const { declarations: [result] } = parseImport(source, { ignoreUnknown: true });
  assert.equal(result.sender.name, sample.remetente.nome);
  assert.equal(result.recipient.name, sample.destinatario.nome);
  assert.equal(result.items[0].value, '132,86');
  assert.equal(result.weight, ''); assert.equal(result.location, '');
  assert.ok(source.includes('pessso'));
});

test('corrigir os nomes permite importar sem ignorar avisos', () => {
  const source = JSON.stringify(sample).replace('"pessso"', '"peso"').replace('"locas"', '"local"');
  assert.equal(parseImport(source).declarations[0].location, 'Mogi Mirim');
});

test('localiza a propriedade real sem confundir seu nome com texto em valores', () => {
  const source = JSON.stringify({ remetente: { nome: 'texto com "locas": em valor' }, destinatario: { locas: 'X' }, itens: [{ conteudo: 'locas', quantidae: '2' }] });
  const error = diagnostic(source);
  assert.deepEqual(error.issues.map(issue => issue.path), ['destinatario.locas', 'itens[1].quantidae']);
  assert.deepEqual(error.issues.map(issue => source.slice(issue.start, issue.end)), ['"locas"', '"quantidae"']);
  assert.equal(error.issues[1].suggestion, 'quantidade');
});

test('preserva posições com BOM, espaços iniciais, bloco Markdown e chaves escapadas', () => {
  const source = '\uFEFF  ```json\n' + String.raw`{"remetente":{"nome":"Ana"},"\u006cocas":"X"}` + '\n```  ';
  const error = diagnostic(source);
  assert.equal(error.issues[0].suggestion, 'local');
  assert.equal(source.slice(error.issues[0].start, error.issues[0].end), String.raw`"\u006cocas"`);
});

test('envelopes e modelo interno continuam aceitos; arrays mantêm os caminhos', () => {
  const valid = { version: 1, records: [{ id: 'x', createdAt: 'ignored', updatedAt: 'ignored', declaration: { sender: { name: 'Ana' }, items: [{ id: 'item-x', description: 'Livro', quantity: '1', value: '0' }], date: '' } }] };
  assert.equal(parseImport(JSON.stringify(valid)).declarations[0].items[0].value, '0');
  valid.records[0].declaration.sender.nmoe = 'Y';
  const issue = diagnostic(JSON.stringify(valid)).issues[0];
  assert.equal(issue.path, 'records[1].declaration.sender.nmoe');
  assert.equal(issue.suggestion, 'nome');
});

test('data e tipos inválidos mostram o valor e continuam bloqueados ao ignorar nomes', () => {
  const source = '{"data":"2026-02-31","remetente":{"nome":true},"locas":"X"}';
  const error = diagnostic(source);
  assert.equal(error.canProceed, false);
  assert.deepEqual(error.issues.filter(issue => issue.kind === 'invalid').map(issue => source.slice(issue.start, issue.end)), ['"2026-02-31"', 'true']);
  assert.equal(diagnostic(source, { ignoreUnknown: true }).canProceed, false);
});

test('sintaxe incorreta não é ignorada; campos opcionais vazios são aceitos', () => {
  assert.equal(diagnostic('{"remetente":', { ignoreUnknown: true }).canProceed, false);
  assert.equal(parseImport('{"remetente":{},"itens":[],"data":""}').declarations[0].items.length, 0);
});

test('aliases duplicados são bloqueados para evitar escolher um valor arbitrário', () => {
  const error = diagnostic('{"remetente":{"nome":"Ana","name":"Bruna"}}');
  assert.equal(error.canProceed, false); assert.match(error.issues[0].message, /Mais de um campo/);
});

test('CSV destaca colunas desconhecidas e aceita continuar com as reconhecidas', () => {
  const source = 'remetente_nome;conteudo;pessso;locas\nAna;Livro;;Mogi Mirim';
  const error = diagnostic(source);
  assert.equal(error.canProceed, true);
  assert.deepEqual(error.issues.map(issue => source.slice(issue.start, issue.end)), ['pessso', 'locas']);
  assert.deepEqual(error.issues.map(issue => issue.suggestion), ['peso', 'local']);
  assert.equal(parseImport(source, { ignoreUnknown: true }).declarations[0].items[0].description, 'Livro');
});
