// SPDX-License-Identifier: GPL-3.0-only
import type { JSX } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { createDocumentMask } from './document-mask';

type Props = Omit<JSX.IntrinsicElements['input'], 'value' | 'onInput' | 'onChange' | 'ref' | 'role' | 'list' | 'type'> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function DocumentInput({ value, onValueChange, ...props }: Props) {
  const element = useRef<HTMLInputElement>(null);
  const mask = useRef<ReturnType<typeof createDocumentMask> | null>(null);
  const syncing = useRef(false);
  const onChange = useRef(onValueChange);
  onChange.current = onValueChange;
  useLayoutEffect(() => {
    if (!element.current) return;
    const instance = createDocumentMask(element.current);
    mask.current = instance;
    instance.on('accept', () => { if (!syncing.current) onChange.current(instance.unmaskedValue); });
    return () => { instance.destroy(); mask.current = null; };
  }, []);
  useLayoutEffect(() => {
    const instance = mask.current;
    if (instance && instance.value !== value && instance.unmaskedValue !== value) {
      syncing.current = true;
      try { instance.value = value; } finally { syncing.current = false; }
    }
  }, [value]);
  return <input {...props} ref={element} type="text" />;
}
