// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'preact/hooks';

export interface Confirmation {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export function ConfirmDialog({ confirmation, onClose }: { confirmation: Confirmation; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog ref={ref} class="modal screen-only" aria-labelledby="confirmation-title" aria-describedby="confirmation-description"
      onCancel={event => { event.preventDefault(); onClose(); }}>
      <div class="modal-box">
        <h2 id="confirmation-title" class="text-xl font-bold">{confirmation.title}</h2>
        <p id="confirmation-description" class="py-4 break-words">{confirmation.description}</p>
        <div class="modal-action flex-wrap">
          <button type="button" class="btn btn-outline" autoFocus onClick={onClose}>Cancelar</button>
          <button type="button" class="btn btn-error" onClick={() => { onClose(); confirmation.onConfirm(); }}>{confirmation.confirmLabel}</button>
        </div>
      </div>
      <div class="modal-backdrop" onClick={onClose}><button type="button" tabIndex={-1} aria-label="Fechar confirmação">Fechar</button></div>
    </dialog>
  );
}
