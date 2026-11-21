// SPDX-License-Identifier: GPL-3.0-only
export interface Person {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  document: string;
}

export interface ContentItem {
  id: string;
  description: string;
  quantity: string;
  value: string;
}

export interface Declaration {
  sender: Person;
  recipient: Person;
  items: ContentItem[];
  weight: string;
  location: string;
  date: string;
}

export const emptyPerson = (): Person => ({
  name: '', address: '', city: '', state: '', postalCode: '', document: '',
});

export const emptyItem = (id: string): ContentItem => ({
  id, description: '', quantity: '', value: '',
});

export const emptyDeclaration = (): Declaration => {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    sender: emptyPerson(), recipient: emptyPerson(), items: [emptyItem('item-0')],
    weight: '', location: '', date,
  };
};
