// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'preact/hooks';

export function TimedAlert({ message, kind, refreshKey, onDismiss }: {
  message: string;
  kind: 'success' | 'error';
  refreshKey?: unknown;
  onDismiss: () => void;
}) {
  const bar = useRef<HTMLDivElement>(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    const animation = bar.current?.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 20000, fill: 'forwards' });
    const timer = window.setTimeout(() => dismiss.current(), 20000);
    return () => { window.clearTimeout(timer); animation?.cancel(); };
  }, [message, refreshKey]);
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} class={`screen-only alert ${kind === 'error' ? 'alert-error' : 'alert-success'} timed-alert`}>
      <div class="flex items-start justify-between gap-4 p-4">
        <span class="min-w-0 break-words">{message}</span>
        <button type="button" class="shrink-0 underline" aria-label="Fechar aviso" onClick={onDismiss}>Fechar</button>
      </div>
      <div ref={bar} class="alert-timer" aria-hidden="true" />
    </div>
  );
}
