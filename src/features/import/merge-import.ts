// SPDX-License-Identifier: GPL-3.0-only
import { emptyItem } from '../declaration/declaration';
import type { Declaration, Person } from '../declaration/declaration';

export function mergeImport(current: Declaration, incoming: Declaration, createItemId: () => string) {
  const declaration = structuredClone(current);
  const attention = new Set<string>();
  const merge = (previous: string, next: string | undefined, path: string): string => {
    if (!next?.trim()) { attention.add(path); return previous; }
    return next;
  };
  for (const who of ['sender', 'recipient'] as const) {
    for (const key of Object.keys(declaration[who]) as (keyof Person)[]) {
      declaration[who][key] = merge(current[who][key], incoming[who][key], `${who}.${key}`);
    }
  }
  for (const key of ['weight', 'location', 'date'] as const) declaration[key] = merge(current[key], incoming[key], key);
  declaration.items = Array.from({ length: Math.max(current.items.length, incoming.items.length) }, (_, index) => {
    const previous = current.items[index] ?? emptyItem(createItemId());
    const next = incoming.items[index];
    return {
      id: previous.id,
      description: merge(previous.description, next?.description, `items.${previous.id}.description`),
      quantity: merge(previous.quantity, next?.quantity, `items.${previous.id}.quantity`),
      value: merge(previous.value, next?.value, `items.${previous.id}.value`),
    };
  });
  return { declaration, attention };
}
