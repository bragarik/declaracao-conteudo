// SPDX-License-Identifier: GPL-3.0-only
import type { Declaration, Person } from '../declaration/declaration';
import { formatDocument } from '../declaration/document-mask';
import './print.css';

function total(values: string[], money = false): string {
  const filled = values.map(value => value.trim()).filter(Boolean);
  if (!filled.length) return '';
  const numbers = filled.map(value => {
    const normalized = value.replace(/\s/g, '');
    const decimal = normalized.includes(',') ? normalized.replace(/\./g, '').replace(',', '.') : normalized;
    return /^\d+(?:\.\d+)?$/.test(decimal) ? Number(decimal) : NaN;
  });
  if (numbers.some(value => !Number.isFinite(value))) return '';
  const sum = money
    ? numbers.reduce((result, value) => result + Math.round(value * 100), 0) / 100
    : numbers.reduce((result, value) => result + value, 0);
  if (!Number.isFinite(sum)) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: money ? 2 : 0,
    maximumFractionDigits: money ? 2 : 10,
  }).format(sum);
}

function PersonBlock({ title, person }: { title: string; person: Person }) {
  return (
    <section class="print-person" aria-label={title}>
      <h2>{title}</h2>
      <div class="print-field"><strong>Nome:</strong> {person.name}</div>
      <div class="print-field print-address"><strong>Endereço:</strong> {person.address}</div>
      <div class="print-split">
        <div class="print-field"><strong>Cidade:</strong> {person.city}</div>
        <div class="print-field"><strong>UF:</strong> {person.state}</div>
      </div>
      <div class="print-split print-document-fields">
        <div class="print-field"><strong>CEP:</strong> {person.postalCode}</div>
        <div class="print-field print-document-number"><strong>CPF/CNPJ/Doc. estrangeiro:</strong><span>{formatDocument(person.document)}</span></div>
      </div>
    </section>
  );
}

function DateLine({ value }: { value: string }) {
  if (!value) return <span class="manual-date"><span /> de <span /> de <span /></span>;
  const [year, month, day] = value.split('-');
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return <span>{day} de {months[Number(month) - 1]} de {year}</span>;
}

export function PrintDeclaration({ declaration }: { declaration: Declaration }) {
  const rows = [...declaration.items];
  while (rows.length < 4) rows.push({ id: `blank-${rows.length}`, description: '', quantity: '', value: '' });

  return (
    <article class="print-document" aria-label="Declaração para impressão">
      <h1>Declaração de conteúdo</h1>
      <div class="print-people">
        <PersonBlock title="Remetente" person={declaration.sender} />
        <PersonBlock title="Destinatário" person={declaration.recipient} />
      </div>
      <table class="print-goods">
        <colgroup><col class="col-number" /><col /><col class="col-quantity" /><col class="col-value" /></colgroup>
        <thead>
          <tr><th colSpan={4} class="print-section-title">Identificação dos bens</th></tr>
          <tr><th scope="col">Item</th><th scope="col">Conteúdo</th><th scope="col">Quant.</th><th scope="col">Valor</th></tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={item.id}>
              <td>{item.description || item.quantity || item.value ? index + 1 : ''}</td>
              <td class="goods-description">{item.description}</td>
              <td>{item.quantity}</td>
              <td>{item.value}</td>
            </tr>
          ))}
          <tr class="print-totals"><th scope="row" colSpan={2}>Totais</th><td>{total(declaration.items.map(item => item.quantity))}</td><td>{total(declaration.items.map(item => item.value), true)}</td></tr>
          <tr class="print-weight"><th scope="row" colSpan={2}>Peso total (kg)</th><td colSpan={2}>{declaration.weight}</td></tr>
        </tbody>
      </table>
      <section class="print-statement">
        <h2>Declaração</h2>
        <p>Declaro que não me enquadro no conceito de contribuinte previsto no art. 4º da Lei Complementar nº 87/1996, uma vez que não realizo, com habitualidade ou em volume que caracterize intuito comercial, operações de circulação de mercadoria, ainda que se iniciem no exterior, ou estou dispensado da emissão da nota fiscal por força da legislação tributária vigente, responsabilizando-me, nos termos da lei e a quem de direito, por informações inverídicas.</p>
        <p>Declaro ainda que não estou postando conteúdo inflamável, explosivo, causador de combustão espontânea, tóxico, corrosivo, gás ou qualquer outro conteúdo que conste na lista de proibições e restrições disponível no site dos Correios: <span class="print-url">https://www.correios.com.br/enviar/proibicoes-e-restricoes/proibicoes-e-restricoes.</span></p>
        <div class="print-signing">
          <div class="print-place-date"><span class={declaration.location ? '' : 'manual-location'}>{declaration.location}</span>, <DateLine value={declaration.date} /></div>
          <div class="print-signature"><span />Assinatura do Declarante/Remetente</div>
        </div>
      </section>
      <aside class="print-observation"><strong>Observação:</strong><p>Constitui crime contra a ordem tributária suprimir ou reduzir tributo, ou contribuição social e qualquer acessório (Lei 8.137/90 Art. 1º, V).</p></aside>
    </article>
  );
}
