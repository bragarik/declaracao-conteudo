// SPDX-License-Identifier: GPL-3.0-only
export interface ImportIssue {
  kind: 'unknown' | 'invalid';
  path: string;
  message: string;
  suggestion?: string;
  start: number;
  end: number;
}

export class ImportValidationError extends Error {
  readonly canProceed: boolean;
  constructor(readonly source: string, readonly issues: ImportIssue[]) {
    super(issues.map(issue => issue.message).join(' '));
    this.name = 'ImportValidationError';
    this.canProceed = issues.length > 0 && issues.every(issue => issue.kind === 'unknown');
  }
}

type Path = (string | number)[];
type Aliases = Record<string, readonly string[]>;
interface Schema { declaration: Aliases; person: Aliases; item: Aliases }
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const pathKey = (path: Path) => JSON.stringify(path);
const displayPath = (path: Path) => path.map((part, index) => typeof part === 'number' ? `[${part + 1}]` : `${index ? '.' : ''}${part}`).join('') || 'arquivo';

function distance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  let beforePrevious: number[] = [];
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++) {
      let cost = Math.min(next[j] + 1, previous[j + 1] + 1, previous[j] + (a[i] === b[j] ? 0 : 1));
      if (i > 0 && j > 0 && a[i] === b[j - 1] && a[i - 1] === b[j]) cost = Math.min(cost, beforePrevious[j - 1] + 1);
      next.push(cost);
    }
    beforePrevious = previous;
    previous = next;
  }
  return previous[b.length];
}
export function suggestField(name: string, aliases: Aliases): string | undefined {
  const normalized = normalize(name);
  if (normalized.length > 64) return undefined;
  let best: string | undefined, score = Math.min(2, Math.max(1, Math.floor(normalized.length / 3)));
  for (const names of Object.values(aliases)) for (const alias of names) {
    const candidate = distance(normalized, alias);
    if (candidate <= score) { best = names[0]; score = candidate - 0.01; }
  }
  return best;
}

// Indexa apenas posições: a sintaxe já foi validada por JSON.parse.
function jsonRanges(source: string) {
  const keys = new Map<string, { start: number; end: number }>();
  const values = new Map<string, { start: number; end: number }>();
  let cursor = 0;
  const skip = () => { while (/\s/.test(source[cursor] ?? '') && cursor < source.length) cursor++; };
  const string = () => {
    const start = cursor++;
    while (cursor < source.length) {
      if (source[cursor] === '\\') cursor += 2;
      else if (source[cursor++] === '"') break;
    }
    return { start, end: cursor };
  };
  function walk(path: Path) {
    skip(); const start = cursor;
    if (source[cursor] === '{') {
      cursor++; skip();
      while (source[cursor] !== '}') {
        const key = string();
        const child = [...path, JSON.parse(source.slice(key.start, key.end)) as string];
        keys.set(pathKey(child), key); skip(); cursor++; walk(child); skip();
        if (source[cursor] !== ',') break;
        cursor++; skip();
      }
      cursor++;
    } else if (source[cursor] === '[') {
      cursor++; skip(); let index = 0;
      while (source[cursor] !== ']') {
        walk([...path, index++]); skip();
        if (source[cursor] !== ',') break;
        cursor++; skip();
      }
      cursor++;
    } else if (source[cursor] === '"') string();
    else while (cursor < source.length && !/[\s,}\]]/.test(source[cursor])) cursor++;
    values.set(pathKey(path), { start, end: cursor });
  }
  walk([]);
  return { keys, values };
}

export function diagnoseJson(value: unknown, content: string, source: string, schema: Schema): ImportIssue[] {
  const ranges = jsonRanges(content), offset = source.indexOf(content), issues: ImportIssue[] = [];
  function issue(path: Path, message: string, kind: ImportIssue['kind'] = 'invalid', suggestion?: string, markValue = false) {
    const range = (markValue ? ranges.values : ranges.keys).get(pathKey(path)) ?? ranges.values.get(pathKey(path)) ?? { start: 0, end: 1 };
    issues.push({ kind, path: displayPath(path), message, suggestion, start: range.start + offset, end: range.end + offset });
  }
  function checkFields(data: Record<string, unknown>, aliases: Aliases, path: Path) {
    const found = new Map<string, { value: unknown; path: Path }>();
    for (const [key, value] of Object.entries(data)) {
      const canonical = Object.keys(aliases).find(field => aliases[field].includes(normalize(key)));
      const child = [...path, key];
      if (!canonical) { issue(child, `Campo desconhecido: ${displayPath(child)}.`, 'unknown', suggestField(key, aliases)); continue; }
      if (found.has(canonical)) issue(child, `Mais de um campo informa ${aliases[canonical][0]} neste trecho.`);
      found.set(canonical, { value, path: child });
    }
    return found;
  }
  function scalar(value: unknown, path: Path, isDate = false) {
    if (value !== null && typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) {
      issue(path, `${displayPath(path)} deve conter texto ou número.`, 'invalid', undefined, true); return;
    }
    if (isDate && value !== null && String(value)) {
      const date = String(value).trim().replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, '$3-$2-$1');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
        issue(path, `${displayPath(path)} contém data inválida. Use AAAA-MM-DD ou DD/MM/AAAA.`, 'invalid', undefined, true);
      }
    }
  }
  function person(value: unknown, path: Path) {
    if (value === null || typeof value === 'string') return;
    if (!object(value)) { issue(path, `${displayPath(path)} deve conter os campos de uma pessoa.`, 'invalid', undefined, true); return; }
    for (const field of checkFields(value, schema.person, path).values()) scalar(field.value, field.path);
  }
  function entry(value: unknown, path: Path) {
    if (!object(value)) { issue(path, 'Cada declaração deve ser um objeto JSON.', 'invalid', undefined, true); return; }
    const names = Object.keys(value).map(normalize);
    if (names.some(name => name === 'records' || name === 'declaracoes')) {
      const fields = checkFields(value, { version: ['version'], records: ['records', 'declaracoes'] }, path);
      const records = fields.get('records');
      if (records && Array.isArray(records.value)) records.value.forEach((record, index) => entry(record, [...records.path, index]));
      else if (records) issue(records.path, 'A lista de declarações deve ser uma lista JSON.', 'invalid', undefined, true);
      return;
    }
    if (names.some(name => name === 'declaration' || name === 'declaracao')) {
      const fields = checkFields(value, { declaration: ['declaration', 'declaracao'], id: ['id'], createdAt: ['createdat'], updatedAt: ['updatedat'] }, path);
      const field = fields.get('declaration'); if (field) entry(field.value, field.path);
      return;
    }
    const fields = checkFields(value, schema.declaration, path);
    if (!fields.size) issue(path, 'Nenhum campo de declaração foi reconhecido neste objeto.', 'invalid', undefined, true);
    for (const [key, field] of fields) {
      if (key === 'sender' || key === 'recipient') person(field.value, field.path);
      else if (key === 'items') {
        if (!Array.isArray(field.value)) { issue(field.path, 'Os bens devem ser uma lista JSON.', 'invalid', undefined, true); continue; }
        field.value.forEach((item, index) => {
          const child = [...field.path, index];
          if (!object(item)) { issue(child, `Bem ${index + 1}: informe os campos do bem em um objeto.`, 'invalid', undefined, true); return; }
          for (const [key, property] of checkFields(item, schema.item, child)) if (key !== 'id') scalar(property.value, property.path);
        });
      } else scalar(field.value, field.path, key === 'date');
    }
  }
  if (Array.isArray(value)) value.forEach((item, index) => entry(item, [index]));
  else entry(value, []);
  return issues;
}

export function jsonSyntaxIssue(source: string, content: string, error: unknown): ImportValidationError {
  const message = error instanceof Error ? error.message : '';
  const match = message.match(/position (\d+)/i);
  let position = match ? Number(match[1]) : Math.max(0, content.length - 1);
  const lineColumn = message.match(/line (\d+) column (\d+)/i);
  if (!match && lineColumn) position = content.split('\n').slice(0, Number(lineColumn[1]) - 1).reduce((sum, line) => sum + line.length + 1, 0) + Number(lineColumn[2]) - 1;
  const start = Math.min(content.length - 1, position) + source.indexOf(content);
  return new ImportValidationError(source, [{ kind: 'invalid', path: 'JSON', message: 'JSON inválido. Confira vírgulas, aspas e chaves neste trecho.', start, end: start + 1 }]);
}
