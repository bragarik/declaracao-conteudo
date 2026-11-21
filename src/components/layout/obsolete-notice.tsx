// SPDX-License-Identifier: GPL-3.0-only
export function ObsoleteNotice() {
  return (
    <section class="alert alert-warning block space-y-4" aria-labelledby="obsolete-title">
      <h2 id="obsolete-title" class="text-xl font-bold">Aplicativo obsoleto — utilize a DC-e</h2>
      <p>
        Desde 6 de abril de 2026, a Declaração de Conteúdo Eletrônica (DC-e) substituiu o modelo antigo em papel nos envios abrangidos pela exigência.
        {' '}Esta aplicação gera somente o formulário antigo: não emite DC-e e seu impresso não substitui uma declaração eletrônica autorizada.
      </p>
      <div class="space-y-2">
        <h3 class="font-bold">Como emitir atualmente</h3>
        <ol class="list-decimal space-y-1 pl-5">
          <li>Acesse o emissor oficial para pessoa física ou instale o aplicativo DC-e e entre com sua conta gov.br.</li>
          <li>Informe os dados de remetente e destinatário, os endereços, a descrição dos bens, as quantidades e os valores unitários.</li>
          <li>Conclua a emissão e obtenha a DACE, documento auxiliar com QR Code e protocolo da autorização, para acompanhar o envio.</li>
        </ol>
        <p>Você também pode solicitar a emissão no atendimento de uma agência dos Correios, levando os dados do envio.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <a class="btn btn-neutral" href="https://dce.receita.pr.gov.br/" target="_blank" rel="noopener noreferrer">Abrir emissor oficial<span class="sr-only"> (abre em nova aba)</span></a>
        <a class="btn btn-outline border-current text-inherit hover:bg-black/10 hover:text-inherit" href="https://play.google.com/store/apps/details?id=br.gov.pr.celepar.sefa.dce" target="_blank" rel="noopener noreferrer">App Android<span class="sr-only"> (abre em nova aba)</span></a>
        <a class="btn btn-outline border-current text-inherit hover:bg-black/10 hover:text-inherit" href="https://apps.apple.com/br/app/dce/id6753601602" target="_blank" rel="noopener noreferrer">App iPhone<span class="sr-only"> (abre em nova aba)</span></a>
      </div>
      <p class="text-sm">
        Confira as regras e exceções aplicáveis ao seu envio nas orientações oficiais:
        {' '}<a class="underline underline-offset-2" href="https://saladeimprensa.correios.com.br/arquivos/13666" target="_blank" rel="noopener noreferrer">Correios<span class="sr-only"> (abre em nova aba)</span></a>,
        {' '}<a class="underline underline-offset-2" href="https://dfe-portal.svrs.rs.gov.br/Dce/Faq" target="_blank" rel="noopener noreferrer">Portal da DC-e<span class="sr-only"> (abre em nova aba)</span></a>
        {' '}e <a class="underline underline-offset-2" href="https://www.sefaz.pe.gov.br/Servicos/Nota-Fiscal-Avulsa/Paginas/DCe.aspx?ID=3" target="_blank" rel="noopener noreferrer">orientações sobre a DACE<span class="sr-only"> (abre em nova aba)</span></a>.
        {' '}Informações conferidas em 23/11/2026.
      </p>
      <p class="border-t border-current/25 pt-3 text-sm">O formulário e o histórico abaixo estão preservados para consulta do modelo antigo. Este projeto não é um serviço oficial dos Correios.</p>
    </section>
  );
}
