// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'preact/hooks';
import { TimedAlert } from '../../components/ui/timed-alert';
import { supportOptions } from './support-data';

function SupportDialog({ onClose, opener }: { onClose: () => void; opener: HTMLButtonElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [selected, setSelected] = useState(supportOptions[0]);
  const [feedback, setFeedback] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const [copyCount, setCopyCount] = useState(0);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(selected.value);
      setFeedback({ message: `${selected.label}: dado de recebimento copiado.`, kind: 'success' });
    } catch {
      input.current?.focus();
      input.current?.select();
      setFeedback({ message: 'Selecione e copie com Ctrl+C ou ⌘C.', kind: 'error' });
    }
    setCopyCount(count => count + 1);
  }
  return (
    <dialog ref={dialog} class="modal screen-only" aria-labelledby="support-title" aria-describedby="support-description"
      onCancel={event => { event.preventDefault(); onClose(); }}>
      <div class="modal-box space-y-5">
        <div class="flex items-start justify-between gap-4">
          <h2 id="support-title" class="text-xl font-bold">Apoiar o projeto</h2>
          <button type="button" class="btn btn-sm btn-ghost" autoFocus aria-label="Fechar apoio ao projeto" onClick={onClose}>Fechar</button>
        </div>
        <p id="support-description">Gostou da ferramenta? Você pode contribuir voluntariamente para apoiar seu desenvolvimento.</p>
        <p class="text-sm text-base-content/70">Escolha o meio de apoio e o valor no aplicativo do banco, na carteira ou no PayPal.</p>
        <div class="flex flex-wrap gap-2" role="group" aria-label="Meios de apoio">
          {supportOptions.map(option => <button key={option.id} type="button" class={`btn btn-sm ${option.id === selected.id ? 'btn-primary' : 'btn-outline'}`}
            aria-pressed={option.id === selected.id} onClick={() => { setSelected(option); setFeedback(null); }}>{option.label}</button>)}
        </div>
        <section class="space-y-3" aria-label={`Receber apoio por ${selected.label}`}>
          <h3 class="font-semibold">{selected.label}</h3>
          <p class="text-sm text-base-content/70">{selected.note}</p>
          <img class="mx-auto h-auto w-52 max-w-full rounded-lg bg-white" src={selected.qr} width="256" height="256" alt={`QR Code de recebimento — ${selected.label}`} />
          <label class="form-field" for="support-value">{selected.id === 'pix' ? 'Pix Copia e Cola' : selected.id === 'paypal' ? 'Link de recebimento' : 'Endereço de recebimento'}</label>
          <textarea id="support-value" ref={input} class="textarea textarea-bordered w-full break-all text-sm" readOnly spellcheck={false} rows={3} value={selected.value} />
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline" onClick={() => void copy()}>{selected.id === 'paypal' ? 'Copiar link' : 'Copiar'}</button>
            {selected.url && <a class="btn btn-primary" href={selected.url} target="_blank" rel="noopener noreferrer">Abrir PayPal<span class="sr-only"> (abre em nova aba)</span></a>}
          </div>
        </section>
        {feedback && <TimedAlert {...feedback} refreshKey={copyCount} onDismiss={() => setFeedback(null)} />}
      </div>
      <div class="modal-backdrop" onClick={onClose}><button type="button" tabIndex={-1} aria-label="Fechar apoio">Fechar</button></div>
    </dialog>
  );
}

export function ProjectSupport() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} type="button" class="btn btn-sm btn-ghost gap-2" aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      Apoiar o projeto
    </button>
    {open && <SupportDialog opener={trigger.current} onClose={() => setOpen(false)} />}
  </>;
}
