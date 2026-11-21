// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'preact/hooks';
import { emptyDeclaration, emptyItem } from './declaration';
import type { ContentItem, Person } from './declaration';
import { PrintDeclaration } from '../print/print-declaration';
import { declarationSnapshot, useHistory } from '../history/history';
import type { SavedDeclaration } from '../history/history';
import { HistoryList } from '../history/history-list';
import { navigate } from '../../app/router';
import type { Route } from '../../app/router';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import type { Confirmation } from '../../components/ui/confirm-dialog';
import { ImportButton } from '../import/import-button';
import { TimedAlert } from '../../components/ui/timed-alert';
import { mergeImport } from '../import/merge-import';
import { DocumentInput } from './document-input';

function attentionAttributes(path: string, attention: ReadonlySet<string>, label: string) {
  const marked = attention.has(path);
  return {
    'data-import-attention': marked ? 'true' : undefined,
    'aria-label': label,
    'aria-describedby': marked ? 'import-attention-note' : undefined,
    title: marked ? 'Campo vazio na importação. Valor anterior preservado; confira este campo.' : undefined,
  };
}

function FieldLabel({ label, path, attention }: { label: string; path: string; attention: ReadonlySet<string> }) {
  return <span class="flex flex-wrap items-center gap-2"><span>{label}</span>
    {attention.has(path) && <span aria-hidden="true" class="import-review-label">Revisar</span>}
  </span>;
}

const personFields: { key: keyof Person; label: string; autocomplete?: string; wide?: boolean }[] = [
  { key: 'name', label: 'Nome', autocomplete: 'name', wide: true },
  { key: 'document', label: 'CPF / CNPJ / documento estrangeiro', wide: true },
  { key: 'address', label: 'Endereço completo', autocomplete: 'street-address', wide: true },
  { key: 'city', label: 'Cidade', autocomplete: 'address-level2' },
  { key: 'state', label: 'UF', autocomplete: 'address-level1' },
  { key: 'postalCode', label: 'CEP', autocomplete: 'postal-code' },
];

function PersonFields({ title, prefix, value, attention, onChange }: {
  title: string;
  prefix: string;
  value: Person;
  attention: ReadonlySet<string>;
  onChange: (key: keyof Person, value: string) => void;
}) {
  return (
    <fieldset class="form-section min-w-0">
      <legend class="text-xl font-semibold">{title}</legend>
      <div class="grid gap-4 sm:grid-cols-2">
        {personFields.map(({ key, label, autocomplete, wide }) => (
          <label key={key} class={`form-field ${wide ? 'sm:col-span-2' : ''}`}>
            <FieldLabel label={label} path={`${prefix}.${key}`} attention={attention} />
            {key === 'address' ? (
              <textarea class="textarea w-full" rows={2} name={`${prefix}-${key}`}
                {...attentionAttributes(`${prefix}.${key}`, attention, label)}
                autoComplete={`section-${prefix} ${autocomplete}`}
                value={value[key]} onInput={event => onChange(key, event.currentTarget.value)} />
            ) : key === 'document' ? (
              <DocumentInput class="input w-full" name={`${prefix}-${key}`}
                {...attentionAttributes(`${prefix}.${key}`, attention, label)}
                autoComplete="off" value={value[key]} onValueChange={document => onChange(key, document)} />
            ) : (
              <input class="input w-full" type="text" name={`${prefix}-${key}`}
                {...attentionAttributes(`${prefix}.${key}`, attention, label)}
                autoComplete={autocomplete ? `section-${prefix} ${autocomplete}` : 'off'}
                value={value[key]} onInput={event => onChange(key, event.currentTarget.value)} />
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DeclarationForm({ route }: { route: Route }) {
  const [draft, setDraft] = useState(emptyDeclaration);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNeedsSave, setNewNeedsSave] = useState(false);
  const [notice, setNotice] = useState<{ text: string; key: number } | null>(null);
  const noticeSequence = useRef(0);
  const setMessage = (text: string) => setNotice(text ? { text, key: ++noticeSequence.current } : null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [attention, setAttention] = useState<Set<string>>(new Set());
  const clearAttention = (path: string) => setAttention(current => {
    if (!current.has(path)) return current;
    const next = new Set(current); next.delete(path); return next;
  });
  const history = useHistory();
  const baseline = useRef(declarationSnapshot(draft));
  const blankSnapshot = useRef(baseline.current);
  const draftSnapshot = declarationSnapshot(draft);
  const savedRecord = editingId ? history.records.find(record => record.id === editingId) : undefined;
  const pendingSave = editingId
    ? !savedRecord || draftSnapshot !== declarationSnapshot(savedRecord.declaration)
    : newNeedsSave || draftSnapshot !== blankSnapshot.current;
  const form = useRef<HTMLFormElement>(null);
  const focusRecord = useRef(false);
  const sequence = useRef(1);
  const addButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (route === 'form' && focusRecord.current) {
      focusRecord.current = false;
      form.current?.querySelector<HTMLInputElement>('[name="sender-name"]')?.focus({ preventScroll: true });
    }
  }, [route]);
  const withDiscardConfirmation = (action: () => void, description?: string) => {
    if (draftSnapshot === baseline.current) action();
    else setConfirmation(description
      ? { title: 'Aplicar importação?', description, confirmLabel: 'Aplicar importação', onConfirm: action }
      : { title: 'Descartar alterações?', description: 'As alterações que ainda não foram salvas serão descartadas.', confirmLabel: 'Descartar alterações', onConfirm: action });
  };
  const openRecord = (record: SavedDeclaration, reuse: boolean) => {
    withDiscardConfirmation(() => {
      const copy = structuredClone(record.declaration);
      copy.items = copy.items.map((item, index) => ({ ...item, id: `item-${index}` }));
      sequence.current = copy.items.length;
      baseline.current = declarationSnapshot(copy);
      setDraft(copy);
      setAttention(new Set());
      setEditingId(reuse ? null : record.id);
      setNewNeedsSave(reuse);
      setMessage(reuse ? 'Cópia aberta. Clique em Salvar para criar uma nova declaração.' : 'Declaração aberta para edição.');
      focusRecord.current = true;
      navigate('form');
    });
  };
  const updatePerson = (who: 'sender' | 'recipient', key: keyof Person, value: string) => {
    clearAttention(`${who}.${key}`);
    setDraft(current => ({ ...current, [who]: { ...current[who], [key]: value } }));
  };
  const updateItem = (id: string, key: keyof Omit<ContentItem, 'id'>, value: string) => {
    clearAttention(`items.${id}.${key}`);
    setDraft(current => ({
      ...current, items: current.items.map(item => item.id === id ? { ...item, [key]: value } : item),
    }));
  };

  return (
    <>
    {notice && <TimedAlert key={notice.key} kind="success" message={notice.text} onDismiss={() => setNotice(null)} />}
    {history.error && <TimedAlert kind="error" message={history.error} refreshKey={history.errorKey} onDismiss={history.clearError} />}
    <div class={`screen-only ${route === 'form' ? '' : 'route-hidden'}`}>
    <form ref={form} class="screen-only flex flex-col gap-6" noValidate onSubmit={event => event.preventDefault()}>
      <div class="flex flex-wrap justify-end gap-3">
        <ImportButton onImport={incoming => {
          const merged = mergeImport(draft, incoming, () => `item-${sequence.current++}`);
          const apply = () => {
            setDraft(merged.declaration);
            if (!editingId) setNewNeedsSave(true);
            setAttention(merged.attention);
            setMessage('Importação aplicada. Campos vazios preservaram os valores atuais e foram destacados em amarelo para revisão.');
          };
          if (JSON.stringify(draft) === JSON.stringify(merged.declaration)) apply();
          else withDiscardConfirmation(apply, 'Os campos preenchidos no arquivo substituirão os valores atuais. Campos vazios manterão os valores existentes e serão destacados em amarelo.');
        }} />
        <button type="button" class="btn btn-outline" onClick={() => {
          withDiscardConfirmation(() => {
            const blank = emptyDeclaration();
            baseline.current = declarationSnapshot(blank);
            blankSnapshot.current = baseline.current;
            setDraft(blank); setEditingId(null); sequence.current = 1;
            setNewNeedsSave(false);
            setAttention(new Set());
            setMessage('Nova declaração em branco.');
          });
        }}>Nova declaração</button>
        <button type="button" class={`btn btn-primary ${pendingSave ? 'save-pending' : ''}`}
          aria-describedby="save-state" title={pendingSave ? 'Há alterações ainda não salvas' : 'Salvar declaração'}
          onClick={() => {
          const id = history.save(draft, editingId);
          if (id) { setEditingId(id); setNewNeedsSave(false); baseline.current = declarationSnapshot(draft); setMessage('Declaração salva neste navegador.'); }
          else setMessage('');
        }}>Salvar</button>
        <button type="button" class="btn btn-primary" onClick={() => window.print()}>Imprimir declaração</button>
      </div>
      <p id="save-state" role="status" class={`text-sm ${pendingSave ? 'font-semibold text-primary' : 'text-base-content/70'}`}>
        {pendingSave ? 'Alterações não salvas.' : editingId ? 'Tudo salvo.' : 'Nova declaração.'}
      </p>
      {attention.size > 0 && <p id="import-attention-note" class="text-sm">Campos em amarelo vieram vazios ou ausentes na importação. Os valores anteriores foram mantidos. Confira cada campo; ao editá-lo, o destaque é removido. Os bens são associados pela ordem das linhas.</p>}
      <div class="grid items-start gap-6 lg:grid-cols-2">
        <PersonFields title="Remetente" prefix="sender" value={draft.sender} attention={attention}
          onChange={(key, value) => updatePerson('sender', key, value)} />
        <PersonFields title="Destinatário" prefix="recipient" value={draft.recipient} attention={attention}
          onChange={(key, value) => updatePerson('recipient', key, value)} />
      </div>
      <section class="form-section space-y-5" aria-labelledby="items-title">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 id="items-title" class="text-xl font-semibold">Identificação dos bens</h2>
          <span class="text-sm text-base-content/70" role="status">{draft.items.length} {draft.items.length === 1 ? 'item' : 'itens'}</span>
        </div>
        <div class="space-y-4">
          {draft.items.map((item, index) => (
            <fieldset class="item-fields rounded-box border border-base-300 p-4" key={item.id}>
              <legend class="px-2 font-semibold">Item {index + 1}</legend>
              <label class="form-field item-description">
                <FieldLabel label="Conteúdo" path={`items.${item.id}.description`} attention={attention} />
                <textarea class="textarea w-full" rows={2} name={`${item.id}-description`}
                  {...attentionAttributes(`items.${item.id}.description`, attention, 'Conteúdo')}
                  value={item.description} onInput={event => updateItem(item.id, 'description', event.currentTarget.value)} />
              </label>
              <label class="form-field">
                <FieldLabel label="Quantidade" path={`items.${item.id}.quantity`} attention={attention} />
                <input class="input w-full" type="text" inputMode="numeric" name={`${item.id}-quantity`}
                  {...attentionAttributes(`items.${item.id}.quantity`, attention, 'Quantidade')}
                  value={item.quantity} onInput={event => updateItem(item.id, 'quantity', event.currentTarget.value)} />
              </label>
              <label class="form-field">
                <FieldLabel label="Valor (R$)" path={`items.${item.id}.value`} attention={attention} />
                <input class="input w-full" type="text" inputMode="decimal" name={`${item.id}-value`}
                  {...attentionAttributes(`items.${item.id}.value`, attention, 'Valor (R$)')}
                  value={item.value} onInput={event => updateItem(item.id, 'value', event.currentTarget.value)} />
              </label>
              <button class="btn btn-ghost text-error" type="button" aria-label={`Remover item ${index + 1}`}
                onClick={() => {
                  setConfirmation({
                    title: 'Remover item?',
                    description: `O item ${index + 1}${item.description ? ` (${item.description.slice(0, 100)})` : ''} será removido da declaração.`,
                    confirmLabel: 'Remover item',
                    onConfirm: () => {
                      setDraft(current => ({ ...current, items: current.items.filter(row => row.id !== item.id) }));
                      setAttention(current => new Set([...current].filter(path => !path.startsWith(`items.${item.id}.`))));
                      window.setTimeout(() => addButton.current?.focus(), 0);
                    },
                  });
                }}>Remover</button>
            </fieldset>
          ))}
        </div>
        <button class="btn btn-outline btn-primary" type="button" ref={addButton} onClick={() => {
          const id = `item-${sequence.current++}`;
          setDraft(current => ({ ...current, items: [...current.items, emptyItem(id)] }));
        }}>Adicionar item</button>
        <label class="form-field max-w-xs">
          <FieldLabel label="Peso total (kg)" path="weight" attention={attention} />
          <input class="input w-full" type="text" inputMode="decimal" name="weight"
            {...attentionAttributes('weight', attention, 'Peso total (kg)')}
            value={draft.weight} onInput={event => { clearAttention('weight'); setDraft(current => ({ ...current, weight: event.currentTarget.value })); }} />
        </label>
      </section>
      <section class="form-section space-y-5" aria-labelledby="signature-title">
        <h2 id="signature-title" class="text-xl font-semibold">Local, data e assinatura</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="form-field">
            <FieldLabel label="Local" path="location" attention={attention} />
            <input class="input w-full" type="text" name="location" value={draft.location}
              {...attentionAttributes('location', attention, 'Local')}
              onInput={event => { clearAttention('location'); setDraft(current => ({ ...current, location: event.currentTarget.value })); }} />
          </label>
          <label class="form-field">
            <FieldLabel label="Data" path="date" attention={attention} />
            <input class="input w-full" type="date" name="date" value={draft.date}
              {...attentionAttributes('date', attention, 'Data')}
              onInput={event => { clearAttention('date'); setDraft(current => ({ ...current, date: event.currentTarget.value })); }} />
          </label>
        </div>
        <p class="text-sm text-base-content/70">Local e data podem ficar em branco para preenchimento manual. A assinatura será feita à mão no documento.</p>
      </section>
    </form>
    </div>
    <div class={`screen-only ${route === 'history' ? '' : 'route-hidden'}`}>
    <HistoryList records={history.records} onEdit={record => openRecord(record, false)} onReuse={record => openRecord(record, true)}
      onDelete={record => {
        setConfirmation({
          title: 'Excluir declaração?',
          description: `A declaração de ${record.declaration.recipient.name || record.declaration.sender.name || 'nome não preenchido'} será removida do histórico. Esta ação não pode ser desfeita.`,
          confirmLabel: 'Excluir declaração',
          onConfirm: () => {
            if (history.remove(record.id)) {
              if (editingId === record.id) { setEditingId(null); setNewNeedsSave(true); }
              setMessage('Declaração excluída do histórico.');
            } else setMessage('');
          },
        });
      }} />
    </div>
    {confirmation && <ConfirmDialog confirmation={confirmation} onClose={() => setConfirmation(null)} />}
    <PrintDeclaration declaration={draft} />
    </>
  );
}
