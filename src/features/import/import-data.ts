// SPDX-License-Identifier: GPL-3.0-only
import { emptyDeclaration, emptyItem, emptyPerson } from '../declaration/declaration';
import type { Declaration, Person } from '../declaration/declaration';
import { diagnoseJson, ImportValidationError, jsonSyntaxIssue, suggestField } from './import-diagnostics';

export const JSON_EXAMPLE = `{
  "remetente": { "nome": "Ana", "endereco": "Rua A, 10", "cidade": "São Paulo", "uf": "SP", "cep": "01000-000", "documento": "" },
  "destinatario": { "nome": "Bruno", "endereco": "Rua B, 20", "cidade": "Curitiba", "uf": "PR", "cep": "80000-000", "documento": "" },
  "itens": [{ "conteudo": "Livro", "quantidade": "1", "valor": "29,90" }],
  "peso": "0,5",
  "local": "São Paulo",
  "data": "2026-11-21"
}`;
export const CSV_EXAMPLE = `remetente_nome;destinatario_nome;conteudo;quantidade;valor;peso;local;data
Ana;Bruno;Livro;1;29,90;0,5;São Paulo;2026-11-21
Ana;Bruno;Revista;2;10,00;0,5;São Paulo;2026-11-21`;
const AI_TEMPLATE = JSON.stringify(JSON.parse(JSON_EXAMPLE), (_key, value) => typeof value === 'string' ? '' : value, 2);
export const AI_INSTRUCTION = `Extraia da fonte fornecida os dados para uma declaração de conteúdo. Retorne somente JSON válido, sem explicações ou blocos Markdown, seguindo o modelo abaixo. Não invente informações: use texto vazio ("") para campos ausentes. Use valores como texto, datas no formato AAAA-MM-DD e valor total por linha de bem (não valor unitário). Inclua todos os bens em "itens". Para mais de uma declaração, retorne uma lista de objetos com esse mesmo formato.\n\n${AI_TEMPLATE}\n\nFonte de dados:\n[cole aqui a fonte]`;

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function fields(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, data] of Object.entries(value)) {
    const normalized = normalize(key);
    if (Object.hasOwn(result, normalized)) throw new Error(`Campo repetido: ${key}.`);
    result[normalized] = data;
  }
  return result;
}
const pick = (data: Record<string, unknown>, names: string[]) => names.map(name => data[name]).find(value => value !== undefined);
function text(value: unknown, field = 'valor'): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  throw new Error(`Campo ${field}: informe texto ou número.`);
}
const personAliases: Record<keyof Person, string[]> = {
  name: ['nome', 'name'], address: ['endereco', 'enderecocompleto', 'address'],
  city: ['cidade', 'city'], state: ['uf', 'estado', 'state'], postalCode: ['cep', 'postalcode'],
  document: ['documento', 'cpf', 'cnpj', 'cpfcnpj', 'document', 'documentoestrangeiro'],
};
const scalarAliases = { weight: ['peso', 'pesototal', 'pesototalkg', 'weight'], location: ['local', 'location'], date: ['data', 'date'] };
const itemAliases = { description: ['conteudo', 'descricao', 'description', 'content'], quantity: ['quantidade', 'quant', 'qtd', 'quantity'], value: ['valor', 'valorr', 'value'] };
const jsonSchema = {
  declaration: { sender: ['remetente', 'sender'], recipient: ['destinatario', 'recipient'], items: ['itens', 'bens', 'items'], ...scalarAliases },
  person: personAliases,
  item: { ...itemAliases, id: ['id'] },
};

function date(value: string): string {
  if (!value) return '';
  const normalized = value.trim().replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, '$3-$2-$1');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || !Number.isFinite(Date.parse(normalized)) || new Date(normalized).toISOString().slice(0, 10) !== normalized) {
    throw new Error('Data inválida. Use AAAA-MM-DD ou DD/MM/AAAA.');
  }
  return normalized;
}
function person(value: unknown, field: string): Person {
  if (value === undefined || value === null) return emptyPerson();
  if (typeof value === 'string') return { ...emptyPerson(), name: value };
  if (!object(value)) throw new Error(`Campo ${field}: informe os campos da pessoa conforme o layout.`);
  const data = fields(value), result = emptyPerson();
  for (const key of Object.keys(personAliases) as (keyof Person)[]) result[key] = text(pick(data, personAliases[key]), `${field}.${personAliases[key][0]}`);
  return result;
}
function fromObject(value: unknown): Declaration {
  if (!object(value)) throw new Error('Cada declaração deve ser um objeto JSON.');
  const data = fields(value);
  if (data.declaration !== undefined || data.declaracao !== undefined) return fromObject(data.declaration ?? data.declaracao);
  const recognized = ['remetente', 'sender', 'destinatario', 'recipient', 'itens', 'bens', 'items', ...Object.values(scalarAliases).flat()];
  if (!recognized.some(key => Object.hasOwn(data, key))) throw new Error('Nenhum campo de declaração reconhecido. Consulte Layout esperado.');
  const result = emptyDeclaration();
  result.sender = person(pick(data, ['remetente', 'sender']), 'remetente');
  result.recipient = person(pick(data, ['destinatario', 'recipient']), 'destinatario');
  result.weight = text(pick(data, scalarAliases.weight), 'peso'); result.location = text(pick(data, scalarAliases.location), 'local'); result.date = date(text(pick(data, scalarAliases.date), 'data'));
  const items = pick(data, ['itens', 'bens', 'items']);
  if (items !== undefined) {
    if (!Array.isArray(items)) throw new Error('O campo itens deve ser uma lista.');
    result.items = items.map((value, index) => {
      if (!object(value)) throw new Error(`Bem ${index + 1}: informe conteúdo, quantidade e valor em um objeto.`);
      const item = fields(value);
      return { id: `item-${index}`, description: text(pick(item, itemAliases.description), `itens[${index + 1}].conteudo`), quantity: text(pick(item, itemAliases.quantity), `itens[${index + 1}].quantidade`), value: text(pick(item, itemAliases.value), `itens[${index + 1}].valor`) };
    });
  }
  return result;
}

function csvRows(source: string, separator: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false, closed = false;
  const finish = () => { row.push(cell); cell = ''; closed = false; };
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"') { if (source[index + 1] === '"') { cell += '"'; index++; } else { quoted = false; closed = true; } }
      else cell += char;
    } else if (char === separator) finish();
    else if (char === '\r' || char === '\n') {
      if (char === '\r' && source[index + 1] === '\n') index++;
      finish(); if (row.some(value => value.trim())) rows.push(row); row = [];
    } else if (char === '"' && !cell && !closed) quoted = true;
    else if (closed) { if (!/\s/.test(char)) throw new Error('CSV inválido: conteúdo após fechamento de aspas.'); }
    else { if (char === '"') throw new Error('CSV inválido: aspas devem envolver o campo inteiro.'); cell += char; }
  }
  if (quoted) throw new Error('CSV inválido: há aspas sem fechamento.');
  finish(); if (row.some(value => value.trim())) rows.push(row);
  return rows;
}
function fromCsv(source: string, original: string, ignoreUnknown: boolean): Declaration {
  // O cabeçalho identifica o separador; campos entre aspas não participam da contagem.
  const header = source.split(/\r?\n/, 1)[0];
  let quoted = false; const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };
  for (let index = 0; index < header.length; index++) {
    if (header[index] === '"') { if (quoted && header[index + 1] === '"') index++; else quoted = !quoted; }
    else if (!quoted && header[index] in counts) counts[header[index]]++;
  }
  const separator = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const [head, ...rows] = csvRows(source, separator);
  if (!head || !rows.length) throw new Error('O CSV precisa de cabeçalho e pelo menos uma linha de dados.');
  const columns = head.map(normalize);
  if (new Set(columns).size !== columns.length || columns.some(key => !key)) throw new Error('Há colunas vazias ou repetidas no CSV.');
  const mapping = new Map<string, string[]>();
  for (const [who, prefixes] of [['sender', ['remetente', 'sender']], ['recipient', ['destinatario', 'recipient']]] as const) {
    for (const [field, aliases] of Object.entries(personAliases)) for (const prefix of prefixes) for (const alias of aliases) {
      mapping.set(prefix + alias, [who, field]); mapping.set(alias + prefix, [who, field]);
    }
  }
  for (const [field, aliases] of Object.entries(scalarAliases)) for (const alias of aliases) mapping.set(alias, [field]);
  for (const [field, aliases] of Object.entries(itemAliases)) for (const alias of aliases) mapping.set(alias, ['items', field]);
  const unknown = columns.map((key, index) => ({ key, index })).filter(({ key }) => !mapping.has(key) && key !== 'item');
  if (unknown.length && !ignoreUnknown) {
    const aliases = Object.fromEntries([...mapping.keys()].map(name => [name, [name]]));
    const ranges: { start: number; end: number }[] = [];
    let start = 0, quoted = false;
    for (let index = 0; index <= header.length; index++) {
      if (header[index] === '"') { if (quoted && header[index + 1] === '"') index++; else quoted = !quoted; }
      if (index === header.length || (!quoted && header[index] === separator)) { ranges.push({ start, end: index }); start = index + 1; }
    }
    const offset = original.indexOf(source);
    throw new ImportValidationError(original, unknown.map(({ key, index }) => ({
      kind: 'unknown', path: head[index], message: `Coluna desconhecida: ${head[index]}.`, suggestion: suggestField(key, aliases),
      start: (ranges[index]?.start ?? 0) + offset, end: (ranges[index]?.end ?? header.length) + offset,
    })));
  }
  const paths = columns.map(key => mapping.get(key)).filter(Boolean).map(path => path!.join('.'));
  if (!paths.length || new Set(paths).size !== paths.length) throw new Error('Use uma coluna para cada campo do layout.');
  const result = emptyDeclaration(); result.items = []; result.date = '';
  for (const [index, row] of rows.entries()) {
    if (row.length > head.length) throw new Error(`Linha ${index + 2}: colunas excedentes; confira separador e aspas.`);
    const item = emptyItem(`item-${index}`);
    columns.forEach((column, cell) => {
      const path = mapping.get(column), value = row[cell] ?? '';
      if (!path) return;
      if (path[0] === 'items') { item[path[1] as 'description' | 'quantity' | 'value'] = value; return; }
      const target = path.length === 2 ? result[path[0] as 'sender' | 'recipient'] : result;
      const field = path.at(-1)! as keyof typeof target;
      const normalized = field === 'date' ? date(value) : value;
      const previous = target[field];
      if (previous && normalized && previous !== normalized) throw new Error(`Linha ${index + 2}: dados divergentes em ${column}. Use um CSV por declaração.`);
      if (normalized) Object.assign(target, { [field]: normalized });
    });
    if (item.description || item.quantity || item.value) result.items.push(item);
  }
  if (!result.items.length) result.items = [emptyItem('item-0')];
  return result;
}

export function parseImport(source: string, options: { ignoreUnknown?: boolean } = {}): { format: 'JSON' | 'CSV'; declarations: Declaration[] } {
  let clean = source.replace(/^\uFEFF/, '').trim();
  if (!clean) throw new Error('Selecione um arquivo ou cole os dados.');
  const fence = clean.match(/^```(?:json|csv)?\s*\n([\s\S]*?)\n```$/i);
  if (fence) clean = fence[1].trim();
  if (clean.startsWith('{') || clean.startsWith('[')) {
    let value: unknown;
    try { value = JSON.parse(clean); } catch (error) { throw jsonSyntaxIssue(source, clean, error); }
    const issues = diagnoseJson(value, clean, source, jsonSchema);
    const blocking = options.ignoreUnknown ? issues.filter(issue => issue.kind !== 'unknown') : issues;
    if (blocking.length) throw new ImportValidationError(source, blocking);
    if (object(value)) { const data = fields(value); value = data.records ?? data.declaracoes ?? value; }
    const entries = Array.isArray(value) ? value : [value];
    if (!entries.length) throw new Error('O JSON não contém declarações.');
    return { format: 'JSON', declarations: entries.map(fromObject) };
  }
  return { format: 'CSV', declarations: [fromCsv(clean, source, options.ignoreUnknown === true)] };
}
