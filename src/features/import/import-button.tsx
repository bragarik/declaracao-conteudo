// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Declaration } from '../declaration/declaration';
import { AI_INSTRUCTION, CSV_EXAMPLE, JSON_EXAMPLE, parseImport } from './import-data';
import { TimedAlert } from '../../components/ui/timed-alert';
import { ImportValidationError } from './import-diagnostics';

function SourceProblems({ diagnostic }: { diagnostic: ImportValidationError }) {
  const lines = diagnostic.source.split('\n');
  return <section class="space-y-4" aria-label="Problemas no arquivo">
    <h3 class="font-semibold">Trechos para revisar</h3>
    {diagnostic.issues.map((issue, index) => {
      const line = diagnostic.source.slice(0, issue.start).split('\n').length - 1;
      const first = Math.max(0, line - 1), last = Math.min(lines.length - 1, line + 1);
      let offset = lines.slice(0, first).reduce((total, text) => total + text.length + 1, 0);
      return <article key={index} class="space-y-2 rounded-box border border-base-300 p-3" aria-label={issue.path}>
        <p class="font-semibold">{issue.message}</p>
        {issue.suggestion && <p class="text-sm">Sugestão de nome: <code>{issue.suggestion}</code></p>}
        <pre class="import-source-fragment">{lines.slice(first, last + 1).map((text, index) => {
          const start = Math.max(0, Math.min(text.length, issue.start - offset));
          const end = Math.max(start, Math.min(text.length, issue.end - offset));
          offset += text.length + 1;
          return <span key={index} class="import-source-line"><span class="import-source-number" aria-hidden="true">{first + index + 1}</span><code>{text.slice(0, start)}{end > start ? <mark class={issue.kind === 'unknown' ? 'import-source-warning' : 'import-source-error'}>{text.slice(start, end)}</mark> : null}{text.slice(end)}</code></span>;
        })}</pre>
      </article>;
    })}
  </section>;
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return <div class={`rounded-box border p-2 ${value.trim() ? 'border-base-300' : 'import-preview-missing'}`}>
    <span class="font-semibold">{label}: </span>{value.trim() ? value : 'Ausente — manter valor atual'}
  </div>;
}

function ImportDialog({ onClose, onImport }: {
  onClose: () => void; onImport: (declaration: Declaration) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ReturnType<typeof parseImport> | null>(null);
  const [selection, setSelection] = useState(0);
  const [validation, setValidation] = useState<{ target: 'source' | 'file' | 'selection'; message: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [diagnostic, setDiagnostic] = useState<ImportValidationError | null>(null);
  const [acknowledgedSource, setAcknowledgedSource] = useState<string | null>(null);
  useEffect(() => {
    const element = dialog.current, opener = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); };
  }, []);
  useEffect(() => {
    if (validation) dialog.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [validation]);
  function identify(value: string, acknowledge = false, ignoreUnknown = false) {
    setChecked(true); setError(''); setParsed(null); setValidation(null); setDiagnostic(null); setAcknowledgedSource(null);
    try {
      const result = parseImport(value, { ignoreUnknown });
      setParsed(result); setSelection(result.declarations.length === 1 ? 0 : -1);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível ler os dados.';
      if (error instanceof ImportValidationError) {
        setDiagnostic(error);
        if (acknowledge && error.canProceed) setAcknowledgedSource(value);
      }
      setError(message); setValidation({ target: 'source', message });
      return null;
    }
  }
  const selected = parsed?.declarations[selection];
  function fillForm() {
    const ignoreUnknown = diagnostic?.canProceed === true && acknowledgedSource === source;
    const result = parsed ?? identify(source, true, ignoreUnknown);
    if (!result) return;
    const index = parsed ? selection : result.declarations.length === 1 ? 0 : -1;
    if (index < 0) {
      const message = 'O arquivo contém várias declarações. Escolha qual deseja usar.';
      setError(message); setValidation({ target: 'selection', message });
      return;
    }
    onClose(); onImport(result.declarations[index]);
  }
  return (
    <dialog ref={dialog} class="modal screen-only" aria-labelledby="import-title" onCancel={event => { event.preventDefault(); onClose(); }}>
      <div class="modal-box w-11/12 max-w-3xl space-y-5">
        <h2 id="import-title" class="text-xl font-bold">Importar declaração</h2>
        <p>Selecione um arquivo ou cole a resposta da IA. O formato é identificado pelo conteúdo. Campos vazios não alteram os valores atuais e ficam amarelos para revisão. Bens são associados pela ordem das linhas. Nada será salvo automaticamente.</p>
        <details class="rounded-box border border-base-300 p-4 text-sm">
          <summary class="cursor-pointer font-semibold">Layout esperado e instrução para IA</summary>
          <div class="mt-4 space-y-4">
            <p>Peça à IA para extrair os dados da sua fonte e retornar o modelo abaixo. Campos ausentes ficam vazios, sem inventar informações.</p>
            <button type="button" class="btn btn-outline" onClick={async () => {
              try { await navigator.clipboard.writeText(AI_INSTRUCTION); setNotice('Instrução para IA copiada.'); }
              catch { setNotice(''); setError('Não foi possível copiar. Você pode selecionar a instrução abaixo manualmente.'); }
            }}>Copiar instrução para IA</button>
            <details><summary class="cursor-pointer underline">Ver instrução completa</summary><pre class="mt-2 whitespace-pre-wrap break-words rounded-box bg-base-200 p-3">{AI_INSTRUCTION}</pre></details>
            <p class="font-semibold">JSON: uma declaração, ou uma lista para escolher uma delas</p>
            <pre class="overflow-x-auto rounded-box bg-base-200 p-3">{JSON_EXAMPLE}</pre>
            <p class="font-semibold">CSV: uma declaração por arquivo e uma linha por bem</p>
            <pre class="overflow-x-auto rounded-box bg-base-200 p-3">{CSV_EXAMPLE}</pre>
            <p>Separadores aceitos: ponto e vírgula, vírgula ou tabulação. Use aspas em campos que contenham o separador ou quebras de linha. Dados de remetente e destinatário podem ser repetidos ou preenchidos em uma das linhas, sem divergências.</p>
            <p>Campos de pessoa: nome, endereco, cidade, uf, cep e documento, com prefixo remetente_ ou destinatario_ no CSV. Bens: conteudo, quantidade e valor. Gerais: peso, local e data (AAAA-MM-DD ou DD/MM/AAAA). Valor é o total da linha.</p>
          </div>
        </details>
        {error && <TimedAlert kind="error" message={diagnostic ? `${diagnostic.issues.length} trecho(s) do arquivo precisam de revisão.` : error} onDismiss={() => setError('')} />}
        {notice && <TimedAlert kind="success" message={notice} onDismiss={() => setNotice('')} />}
        <label class="form-field">
          <span>Arquivo JSON ou CSV</span>
          <input type="file" accept=".json,.csv,.txt,application/json,text/csv,text/plain" class="file-input w-full" disabled={loading}
            aria-invalid={validation?.target === 'file' || undefined}
            aria-describedby={validation?.target === 'file' ? 'import-validation' : undefined}
            onChange={async event => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              setLoading(true); setParsed(null); setError(''); setValidation(null); setDiagnostic(null); setAcknowledgedSource(null);
              try { const value = await file.text(); setSource(value); identify(value); }
              catch { const message = 'Não foi possível abrir o arquivo.'; setError(message); setValidation({ target: 'file', message }); }
              finally { setLoading(false); }
            }} />
        </label>
        <label class="form-field">
          <span>Ou cole os dados</span>
          <textarea class="textarea w-full font-mono" rows={6} autoFocus value={source} disabled={loading}
            aria-invalid={validation?.target === 'source' || undefined}
            aria-describedby={validation?.target === 'source' ? 'import-validation' : undefined}
            onInput={event => {
              const value = event.currentTarget.value;
              setSource(value); setParsed(null); setError(''); setValidation(null); setDiagnostic(null); setAcknowledgedSource(null);
              if (checked) identify(value);
            }} />
        </label>
        {validation && <p id="import-validation" class="text-sm text-error">{diagnostic ? 'Confira os trechos destacados abaixo.' : validation.message}</p>}
        {diagnostic && <SourceProblems diagnostic={diagnostic} />}
        {diagnostic?.canProceed && <p class="rounded-box border border-warning p-3 text-sm" role="status">
          {acknowledgedSource === source
            ? 'Clique novamente em Preencher formulário para continuar ignorando os campos desconhecidos. Os demais dados serão importados.'
            : 'Revise os trechos destacados. Campos desconhecidos podem ser ignorados após confirmar novamente o mesmo conteúdo.'}
        </p>}
        {parsed && <section class="space-y-3 rounded-box border border-base-300 p-4" aria-label="Prévia da importação">
          <p role="status" class="font-semibold">Formato identificado: {parsed.format}</p>
          {parsed.declarations.length > 1 && <label class="form-field"><span>Escolha a declaração</span>
            <select class="select w-full" aria-label="Escolha a declaração" value={selection}
              aria-invalid={validation?.target === 'selection' || undefined}
              aria-describedby={validation?.target === 'selection' ? 'import-validation' : undefined}
              onChange={event => { setSelection(Number(event.currentTarget.value)); setValidation(null); setError(''); }}>
              <option value={-1} disabled>Selecione uma declaração</option>
              {parsed.declarations.map((item, index) => <option key={index} value={index}>{index + 1} — {item.sender.name || 'Remetente vazio'} / {item.recipient.name || 'Destinatário vazio'}</option>)}
            </select>
          </label>}
          {selected && <div class="space-y-3 break-words text-sm">
            {([['Remetente', selected.sender], ['Destinatário', selected.recipient]] as const).map(([title, person]) => <div key={title}>
              <p class="mb-2 font-semibold">{title}</p>
              <div class="grid gap-2 sm:grid-cols-2">
                <PreviewField label="Nome" value={person.name} /><PreviewField label="Endereço" value={person.address} />
                <PreviewField label="Cidade" value={person.city} /><PreviewField label="UF" value={person.state} />
                <PreviewField label="CEP" value={person.postalCode} /><PreviewField label="Documento" value={person.document} />
              </div>
            </div>)}
            <p>{selected.items.length} bens</p>
            <ul class="space-y-2">{selected.items.map((item, index) => <li key={item.id} class="space-y-2">
              <p class="font-semibold">Bem {index + 1}</p><PreviewField label="Conteúdo" value={item.description} />
              <div class="grid grid-cols-2 gap-2"><PreviewField label="Quantidade" value={item.quantity} /><PreviewField label="Valor" value={item.value} /></div>
            </li>)}</ul>
            {!selected.items.length && <p class="import-preview-missing rounded-box border p-2">Nenhum bem informado. Os bens atuais serão mantidos e destacados.</p>}
            <PreviewField label="Peso" value={selected.weight} /><PreviewField label="Local" value={selected.location} /><PreviewField label="Data" value={selected.date} />
          </div>}
        </section>}
        <div class="modal-action flex-wrap">
          <button type="button" class="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button type="button" class="btn btn-primary" disabled={loading} onClick={fillForm}>{validation && !diagnostic?.canProceed ? 'Identificar dados' : 'Preencher formulário'}</button>
        </div>
      </div>
      <div class="modal-backdrop" onClick={onClose}><button type="button" tabIndex={-1} aria-label="Fechar importação">Fechar</button></div>
    </dialog>
  );
}

export function ImportButton({ onImport }: { onImport: (declaration: Declaration) => void }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" class="btn btn-outline" onClick={() => setOpen(true)}>Importar</button>
    {open && <ImportDialog onClose={() => setOpen(false)} onImport={onImport} />}
  </>;
}
