// SPDX-License-Identifier: GPL-3.0-only
import pixQr from './assets/pix.svg';
import bitcoinQr from './assets/bitcoin.svg';
import lightningQr from './assets/lightning.svg';
import paypalQr from './assets/paypal.svg';

export interface SupportOption {
  id: string;
  label: string;
  value: string;
  note: string;
  qr: string;
  url?: string;
}

// Dados públicos de recebimento reutilizados do projeto collection-to-play.
export const supportOptions: readonly SupportOption[] = [
  {
    id: 'pix',
    label: "Pix",
    value: "00020126870014BR.GOV.BCB.PIX0136e55c5a8e-2dd8-4ad0-a601-30a5dfc380380225Doacao Collection to play5204000053039865802BR5922RICARDO CASSIANO BRAGA6009SAO PAULO622605222PbJ3t2ykvYJnABO15WZTr63048618",
    note: "Copie o código ou leia o QR Code no aplicativo do seu banco.",
    qr: pixQr,
  },
  {
    id: 'bitcoin',
    label: "Bitcoin",
    value: "BC1QKU5HUK3PHDWHGLFRQ583RVR8UQMMSG49GV7KRN",
    note: "Endereço de recebimento na rede principal do Bitcoin.",
    qr: bitcoinQr,
  },
  {
    id: 'lightning',
    label: "Lightning — sats",
    value: "lnurl1dp68gurn8ghj7ampd3kx2ar0veekzar0wd5xjtnrdakj7tnhv4kxctttdehhwm30d3h82unvwqhkx7twd93kzmr5v9kxc7fcxgt45zg2",
    note: "Use uma carteira compatível com Lightning Address ou LNURL.",
    qr: lightningQr,
  },
  {
    id: 'paypal',
    label: "PayPal",
    value: "https://www.paypal.com/donate/?business=bragarik%40gmail.com&currency_code=BRL&item_name=Declaracao%20de%20conteudo",
    note: "Conclua o apoio na página do PayPal.",
    qr: paypalQr,
    url: "https://www.paypal.com/donate/?business=bragarik%40gmail.com&currency_code=BRL&item_name=Declaracao%20de%20conteudo",
  },
];
