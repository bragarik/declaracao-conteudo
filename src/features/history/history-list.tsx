// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'preact/hooks';
import { matchesSearch } from './history';
import type { SavedDeclaration } from './history';

export function HistoryList({ records, onEdit, onReuse, onDelete }: {
  records: SavedDeclaration[];
  onEdit: (record: SavedDeclaration) => void;
  onReuse: (record: SavedDeclaration) => void;
  onDelete: (record: SavedDeclaration) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = records.filter(record => matchesSearch(record, search));
  return (
    <section class="screen-only form-section space-y-5" aria-labelledby="history-title">
      <h2 id="history-title" class="text-xl font-semibold">Declarações salvas</h2>
      <p class="text-sm text-base-content/70">Salvas neste navegador. Limpar os dados do site também apaga o histórico.</p>
      <div class="flex flex-wrap items-end gap-3">
        <label class="form-field min-w-0 flex-1">
          <span>Pesquisar em todos os campos</span>
          <input class="input w-full" type="search" value={search}
            onInput={event => setSearch(event.currentTarget.value)} />
        </label>
        {search && <button class="btn btn-ghost" type="button" onClick={() => setSearch('')}>Limpar pesquisa</button>}
      </div>
      <p class="text-sm" role="status">{filtered.length} de {records.length} declarações</p>
      {!records.length ? <p>Nenhuma declaração salva ainda.</p> : !filtered.length ? <p>Nenhuma declaração encontrada.</p> : (
        <ul class="space-y-4">
          {filtered.map(record => (
            <li class="rounded-box border border-base-300 p-4" key={record.id}>
              <article class="space-y-3 break-words" aria-label={`Declaração ${record.declaration.recipient.name || record.declaration.sender.name || 'sem nome'}`}>
                <h3 class="font-semibold">{record.declaration.recipient.name || record.declaration.sender.name || 'Declaração sem nome'}</h3>
                <p class="text-sm">Remetente: {record.declaration.sender.name || 'Não preenchido'} · Destinatário: {record.declaration.recipient.name || 'Não preenchido'}</p>
                <p class="text-sm text-base-content/70">Atualizada em <time dateTime={record.updatedAt}>{new Date(record.updatedAt).toLocaleString('pt-BR')}</time> · {record.declaration.items.length} itens</p>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="btn btn-outline" onClick={() => onEdit(record)}>Editar</button>
                  <button type="button" class="btn btn-outline" onClick={() => onReuse(record)}>Reutilizar</button>
                  <button type="button" class="btn btn-ghost text-error" onClick={() => onDelete(record)}>Excluir</button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
