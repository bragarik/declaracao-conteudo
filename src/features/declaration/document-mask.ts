// SPDX-License-Identifier: GPL-3.0-only
import IMask from 'imask/holder';
import 'imask/masked/pattern';
import 'imask/masked/dynamic';
import { pipe } from 'imask/masked/pipe';
import type { MaskedDynamicOptions } from 'imask/masked/dynamic';

const cpf = /^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;
const cnpj = /^(?:[a-z\d]{12}\d{2}|[a-z\d]{2}\.[a-z\d]{3}\.[a-z\d]{3}\/[a-z\d]{4}-\d{2})$/i;
const cpfPattern = '000.000.000-00';
const cnpjPattern = 'XX.XXX.XXX/XXXX-00';
const definitions = { X: /[a-z\d]/i };

export function documentIdentity(value: string): string {
  return cpf.test(value) || cnpj.test(value) ? value.replace(/[.\/-]/g, '') : value;
}

export function formatDocument(value: string): string {
  if (cpf.test(value)) return pipe(documentIdentity(value), { mask: cpfPattern });
  if (cnpj.test(value)) return pipe(documentIdentity(value), { mask: cnpjPattern, definitions });
  return value;
}

export function documentMaskOptions(): MaskedDynamicOptions {
  return {
    mask: [{ mask: cpfPattern }, { mask: cnpjPattern, definitions }, { mask: /^[\s\S]*$/ }],
    prepare: value => documentIdentity(value),
    dispatch: (appended, masked, _flags, tail) => {
      const candidate = masked.rawInputValue + appended + tail.toString();
      return masked.compiledMasks[cpf.test(candidate) ? 0 : cnpj.test(candidate) ? 1 : 2];
    },
  };
}

export const createDocumentMask = (element: HTMLInputElement) => IMask(element, documentMaskOptions());
