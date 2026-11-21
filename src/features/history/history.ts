// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'preact/hooks';
import type { Declaration, Person } from '../declaration/declaration';
import { documentIdentity, formatDocument } from '../declaration/document-mask';

export const HISTORY_KEY = 'declaracao-conteudo:history:v1';
export interface SavedDeclaration {
  id: string;
  createdAt: string;
  updatedAt: string;
  declaration: Declaration;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isPerson(value: unknown): value is Person {
  return isObject(value) && ['name', 'address', 'city', 'state', 'postalCode', 'document'].every(key => typeof value[key] === 'string');
}
function isSaved(value: unknown): value is SavedDeclaration {
  if (!isObject(value) || typeof value.id !== 'string' || !value.id ||
      typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) ||
      typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) return false;
  const draft = value.declaration;
  return isObject(draft) && isPerson(draft.sender) && isPerson(draft.recipient) &&
    ['weight', 'location', 'date'].every(key => typeof draft[key] === 'string') &&
    Array.isArray(draft.items) && draft.items.every(item => isObject(item) &&
      ['id', 'description', 'quantity', 'value'].every(key => typeof item[key] === 'string'));
}
function readHistory(): SavedDeclaration[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (!isObject(data) || data.version !== 1 || !Array.isArray(data.records) || !data.records.every(isSaved)) {
    throw new Error('Invalid history');
  }
  const records = data.records as SavedDeclaration[];
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error('Duplicate identities');
  return records.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}
const readError = 'Não foi possível ler o histórico local. Os dados armazenados foram preservados. O formulário e a impressão continuam disponíveis.';

export function declarationSnapshot(declaration: Declaration): string {
  const personKey = (person: Person) => [person.name, person.address, person.city, person.state, person.postalCode, documentIdentity(person.document)];
  return JSON.stringify([
    personKey(declaration.sender), personKey(declaration.recipient),
    declaration.items.map(item => [item.description, item.quantity, item.value]),
    declaration.weight, declaration.location, declaration.date,
  ]);
}

const declarationKey = (declaration: Declaration) => declarationSnapshot(declaration).toLocaleLowerCase('pt-BR');

export function useHistory() {
  const [state, setState] = useState<{ records: SavedDeclaration[]; error: string }>(() => {
    try { return { records: readHistory(), error: '' }; }
    catch { return { records: [], error: readError }; }
  });
  useEffect(() => {
    const update = (event: StorageEvent) => {
      if (event.key !== HISTORY_KEY && event.key !== null) return;
      try { setState({ records: readHistory(), error: '' }); }
      catch { setState(current => ({ ...current, error: readError })); }
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  function commit(change: (records: SavedDeclaration[]) => SavedDeclaration[]): boolean {
    let current: SavedDeclaration[];
    try { current = readHistory(); }
    catch { setState(previous => ({ ...previous, error: readError })); return false; }
    try {
      const records = change(current).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, records }));
      setState({ records, error: '' });
      return true;
    } catch (error) {
      setState(previous => ({ ...previous, error: error instanceof Error && error.message === 'Duplicate declaration'
        ? 'Já existe uma declaração salva com os mesmos dados. Nenhuma alteração foi salva.'
        : error instanceof Error && error.message === 'Missing record'
        ? 'Esta declaração foi excluída em outra aba. Use Nova declaração ou reutilize outro registro.'
        : 'Não foi possível salvar a alteração no navegador. O formulário foi mantido; tente novamente ou libere espaço no armazenamento.' }));
      return false;
    }
  }
  function save(declaration: Declaration, editingId: string | null): string | null {
    const id = editingId ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const saved = commit(records => {
      const existing = records.find(record => record.id === id);
      if (editingId && !existing) throw new Error('Missing record');
      const key = declarationKey(declaration);
      if (records.some(record => record.id !== editingId && declarationKey(record.declaration) === key)) {
        throw new Error('Duplicate declaration');
      }
      return [{ id, createdAt: existing?.createdAt ?? now, updatedAt: now, declaration: structuredClone(declaration) },
        ...records.filter(record => record.id !== id)];
    });
    return saved ? id : null;
  }
  const remove = (id: string) => commit(records => records.filter(record => record.id !== id));
  const clearError = () => setState(current => ({ ...current, error: '' }));
  return { ...state, save, remove, clearError, errorKey: state };
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
export function matchesSearch(record: SavedDeclaration, query: string): boolean {
  const draft = record.declaration;
  const fields = [...Object.values(draft.sender), ...Object.values(draft.recipient),
    ...draft.items.flatMap(item => [item.description, item.quantity, item.value]),
    draft.weight, draft.location, draft.date,
    formatDocument(draft.sender.document), documentIdentity(draft.sender.document),
    formatDocument(draft.recipient.document), documentIdentity(draft.recipient.document)];
  if (draft.date) fields.push(draft.date.split('-').reverse().join('/'));
  const search = normalize(query.trim());
  return !search || fields.some(field => normalize(field).includes(search));
}
