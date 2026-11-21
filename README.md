# Declaração de conteúdo — Obsoleto

> Este projeto gera o modelo antigo em papel e está obsoleto. Ele não emite DC-e, e o impresso gerado não substitui uma declaração eletrônica autorizada. O formulário e o histórico local foram preservados para consulta.

## Como emitir atualmente

A partir de **6 de abril de 2026**, a DC-e substituiu a declaração antiga nos envios abrangidos pela exigência, conforme o [comunicado dos Correios](https://saladeimprensa.correios.com.br/arquivos/13666).

1. Para pessoa física, use o [emissor oficial web](https://dce.receita.pr.gov.br/) ou o aplicativo DC-e para [Android](https://play.google.com/store/apps/details?id=br.gov.pr.celepar.sefa.dce) ou [iPhone](https://apps.apple.com/br/app/dce/id6753601602), com acesso pela conta gov.br.
2. Preencha remetente, destinatário, endereços, descrição dos bens, quantidades e valores unitários.
3. Conclua a emissão e obtenha a DACE, documento auxiliar com QR Code e protocolo de autorização, para acompanhar o envio. Consulte as [orientações da SEFAZ-PE](https://www.sefaz.pe.gov.br/Servicos/Nota-Fiscal-Avulsa/Paginas/DCe.aspx?ID=3).

Os Correios também oferecem emissão no atendimento das agências, mediante apresentação dos dados necessários. Consulte o [FAQ oficial](https://dfe-portal.svrs.rs.gov.br/Dce/Faq) para as condições de uso e o enquadramento do seu envio. Informações conferidas em **23/11/2026**.

## Sobre o projeto antigo

Aplicação estática em Preact, TypeScript, Vite, Tailwind CSS e DaisyUI com tema claro.

## Consultar o modelo antigo no GitHub Pages

Após ativar a publicação descrita em **Publicação**, acesse [Declaração de conteúdo no GitHub Pages](https://bragarik.github.io/declaracao-conteudo/). A aplicação funciona diretamente no navegador, sem instalação.

As instruções abaixo descrevem as funcionalidades antigas e não realizam a emissão de DC-e.

1. Preencha os dados de remetente, destinatário e bens, ou use **Importar** para carregar JSON ou CSV. Todos os campos são opcionais; também é possível imprimir em branco.
2. Clique em **Salvar** para guardar a declaração neste navegador. O destaque no botão indica alterações ainda não salvas.
3. Abra **Histórico** para pesquisar, editar, reutilizar ou excluir declarações.
4. Clique em **Imprimir declaração**. Na janela do navegador, escolha **A4**, desative os cabeçalhos e rodapés e selecione a impressora ou **Salvar como PDF**.

As declarações ficam no armazenamento local do navegador usado para acessar o site. Elas não são enviadas ao GitHub nem sincronizadas entre dispositivos. Os dados salvos em localhost não aparecem automaticamente no endereço do Pages; limpar os dados do site apaga o histórico.

## Organização do projeto

```text
src/
  main.tsx                  # Montagem da aplicação
  app/                      # Componente principal e rotas locais
  components/ui/            # Modal, alertas e seletor de tema
  features/
    declaration/            # Modelo, formulário e máscara de documentos
    history/                # Armazenamento, pesquisa e lista de declarações
    import/                 # Leitura JSON/CSV, diagnósticos e aplicação dos dados
    print/                  # Documento e estilos de impressão
  styles/global.css         # Tema e estilos de tela
tests/                     # Testes automatizados
scripts/                   # Publicação do build
.github/workflows/         # Automação do GitHub Pages
```

Os componentes específicos ficam junto da funcionalidade correspondente. Componentes de interface compartilhados ficam em `components/ui/`. A entrada `main.tsx` apenas carrega os estilos e monta `App`; os testes importam os módulos de cada funcionalidade.

## Executar localmente

Use Node.js 22.12 ou superior e npm.

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite no terminal.

## Verificar e gerar o build

```sh
npm run build
```

O comando verifica os tipos e gera o site estático em `dist/`. Para servir esse resultado localmente:

```sh
npm run preview
```

## Publicação

O build utiliza caminhos relativos para permitir hospedagem em um subdiretório do GitHub Pages.
O workflow `.github/workflows/github-pages.yml` executa a verificação de tipos e o build em cada push para `main`, e publica apenas o conteúdo de `dist/` na raiz da branch `gh-pages`, com `.nojekyll`. Também pode ser iniciado manualmente pela aba Actions. A publicação preserva o histórico da branch e remove arquivos antigos do build.

Para ativar no repositório de destino:

1. Envie o projeto para a branch `main` do repositório escolhido.
2. Configure em **Settings → Secrets and variables → Actions** o segredo **PAGES_DEPLOY_TOKEN**, com um token pessoal autorizado a escrever o conteúdo desse repositório (Contents: Read and write, para token com permissões granulares).
3. Execute **Publicar GitHub Pages** na aba Actions. A primeira execução cria a branch `gh-pages`.
4. Em **Settings → Pages**, selecione **Deploy from a branch**, branch **gh-pages** e pasta **/ (root)**.
5. Após selecionar a origem, confira a execução **pages build and deployment** e o endereço exibido pelo Pages. Os próximos pushes para `main` passam a atualizar o site automaticamente. Se não houver mudança no build, nenhum commit adicional será criado.

O token pessoal permite disparar o Pages por branch: [commits feitos com o GITHUB_TOKEN padrão não iniciam esse build](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). O segredo é utilizado somente na etapa de publicação e não é incluído nos arquivos do site.

Repositório de destino: https://github.com/bragarik/declaracao-conteudo. O remoto origin está configurado; a automação foi testada em repositório local. Envio autenticado e ativação do Pages ainda pendentes.

## Estado atual

Projeto marcado como obsoleto, com aviso permanente nas páginas de formulário e histórico e orientação para os canais oficiais da DC-e. As funcionalidades antigas descritas abaixo foram preservadas para consulta. Todos os campos são opcionais; novas declarações começam com a data de hoje no fuso local do navegador, que pode ser editada ou apagada. A lista de bens permite adicionar e remover itens. O botão Salvar guarda o modelo antigo no histórico deste navegador, incluindo formulários em branco.

## Imprimir

Clique em **Imprimir declaração** ou use a impressão do navegador. O documento usa uma via A4 em preto e branco, com margens laterais de 4 mm e superior/inferior de 6 mm, e continuação automática para outras páginas quando necessário. Campos vazios são permitidos; local e data vazios ganham linhas e a assinatura é manual. O formulário vazio mantém quatro linhas de bens para preenchimento à mão.

Na janela de impressão, selecione A4 e desative os cabeçalhos e rodapés do navegador para não acrescentar URL e data ao formulário. Use **Salvar como PDF** se desejar um arquivo.

A coluna Valor corresponde ao valor informado para a linha; o total soma esses valores, sem multiplicá-los pela quantidade. Sem valores preenchidos, os totais ficam em branco. Se uma coluna contiver um número não reconhecido, seu total fica em branco, sem bloquear a impressão nem alterar o texto digitado.

## Histórico local

Abra a página **Histórico** pelo botão no topo (`#/historico`). O botão **Formulário** retorna ao preenchimento (`#/`). As rotas usam hash, sem exigir redirecionamento no GitHub Pages. Navegar entre as páginas preserva os dados ainda não salvos durante a sessão; recarregar a página descarta esse rascunho.

O botão **Salvar** pulsa discretamente quando há alterações não salvas, inclusive após importar ou reutilizar uma declaração. O destaque desaparece ao salvar ou reverter os dados. Com redução de movimento ativada, o destaque fica fixo.

Use **Salvar** para criar uma declaração ou guardar alterações no registro em edição. **Nova declaração** abre um formulário vazio. No histórico, **Editar** altera o registro existente; **Reutilizar** abre uma cópia para salvar como nova; **Excluir** pede confirmação. A lista mostra primeiro os registros atualizados mais recentemente.

A pesquisa procura em todos os campos da declaração, incluindo bens, valores, peso e data (também no formato dia/mês/ano). Aceita trechos e ignora acentos e diferenças de maiúsculas e minúsculas. **Limpar pesquisa** restaura a lista completa.

As alterações do formulário precisam ser salvas antes de recarregar a página. O histórico é local ao navegador e endereço do site: limpar os dados do site o apaga; mudar do endereço local para GitHub Pages não transfere os registros. Em caso de armazenamento indisponível ou dados ilegíveis, a aplicação mostra o erro e preserva o formulário e os dados existentes, mantendo a impressão disponível.

Antes de salvar, a aplicação verifica se já existe uma declaração com os mesmos dados, ignorando diferenças de maiúsculas e minúsculas. Identidades internas e datas de criação/alteração não participam da comparação. Uma duplicata é bloqueada com mensagem, sem sobrescrever registros nem apagar o formulário. A edição do próprio registro continua permitida; alterações que o tornem igual a outro registro são bloqueadas.

## Tema e avisos

O botão no topo alterna entre **Sistema → Modo claro → Modo noturno → Sistema**. Em Sistema, informa claro/escuro e acompanha a preferência fornecida pelo navegador via prefers-color-scheme. A escolha manual é lembrada; retornar a Sistema remove essa preferência. A impressão permanece em preto e branco, independentemente do tema.

Confirmações de exclusão e de descarte de alterações usam modais DaisyUI, com Cancelar e suporte a Escape. Mensagens de sucesso e erro usam alertas DaisyUI no topo do conteúdo, com duração de 20 segundos, barra inferior de tempo restante e botão Fechar. Esses elementos não aparecem no documento impresso.

## Importar dados de uma IA

Clique em **Importar** e expanda **Layout esperado e instrução para IA** dentro do modal para consultar exemplos de JSON e CSV e usar **Copiar instrução para IA**. Passe essa instrução e a fonte de dados à IA; depois cole o resultado ou selecione um arquivo. O formato é detectado pelo conteúdo, incluindo JSON em bloco Markdown.

Cole os dados e clique em **Preencher formulário**: a identificação ocorre na própria ação, sem etapa separada obrigatória. Se houver erro de estrutura ou valor, o botão passa a **Identificar dados** e a entrada com problema fica marcada; ao corrigir, a ação de preencher volta. Campos de nome desconhecido seguem a confirmação de avisos descrita abaixo. A prévia fica disponível para arquivos identificados ou dados em revisão. Se o JSON trouxer várias declarações, escolha uma. A importação não salva automaticamente: revise e clique em Salvar quando desejar. Ao editar uma declaração já salva, os dados importados preenchem esse mesmo registro em edição. Alterações não salvas exigem confirmação antes de substituição.

JSON aceita remetente/destinatario/itens/peso/local/data, os equivalentes do modelo interno e listas/envelopes de histórico. O exemplo completo está no modal. CSV usa cabeçalho, uma declaração por arquivo e uma linha por bem, com separador ponto e vírgula, vírgula ou tabulação. Campos de pessoa usam prefixo remetente_ ou destinatario_ e nome, endereco, cidade, uf, cep e documento; bens usam conteudo, quantidade e valor; gerais usam peso, local e data. Dados gerais podem aparecer em uma das linhas ou ser repetidos sem divergências. Use aspas quando houver separadores ou quebras de linha dentro de um campo. Datas aceitam AAAA-MM-DD ou DD/MM/AAAA. Na fonte, campos ausentes devem ficar vazios; ao aplicar a importação, esses campos preservam os valores atuais e recebem destaque amarelo para revisão. O valor do bem corresponde ao total da linha.

Na importação, dados vazios, ausentes ou contendo só espaços não apagam valores atuais. O campo recebe fundo e borda amarelos e indicação **Revisar**, mesmo que continue vazio. A prévia do modal também marca os campos ausentes em amarelo, indicando que o valor atual será mantido. Ao editar manualmente esse campo, o destaque é removido. As marcações não são salvas no histórico e não impedem salvar ou imprimir.

Bens são associados pela ordem das linhas. Campos vazios preservam o valor da linha correspondente; linhas antigas que não constarem da importação são mantidas e destacadas, e linhas adicionais são acrescentadas. O valor zero é considerado preenchido. Se a fonte não informar data, a data atual do formulário é mantida e destacada para revisão.

## Revisar avisos da importação

Nomes desconhecidos são mostrados no modal com o trecho original destacado e uma sugestão quando disponível. Por exemplo, `pessso` e `locas` geram avisos com sugestões de `peso` e `local`.

O primeiro clique em **Preencher formulário** mostra os avisos. Um segundo clique, sem editar o conteúdo, ignora os nomes desconhecidos e aplica apenas os campos reconhecidos; não há renomeação automática. Se você editar o texto ou escolher outro arquivo, a confirmação anterior perde a validade e os dados são verificados novamente. Erros de sintaxe ou valores incompatíveis precisam ser corrigidos para continuar.

Remover um bem exige confirmação em modal. **Cancelar** ou Escape preservam o item; confirmar remove apenas o item selecionado.

## Testes

```sh
npm test
```

Os testes verificam os diagnósticos de importação e suas posições no arquivo, sugestões, continuação com campos reconhecidos e casos inválidos. `npm run build` inclui a verificação de tipos.

## Máscaras de documentos

Os campos de documento do remetente e destinatário usam [IMask](https://imask.js.org/guide.html), integrado diretamente ao Preact. CPF completo recebe máscara de 11 dígitos; CNPJ completo recebe máscara de 14 posições. O padrão alfanumérico do CNPJ também é aceito, conforme [o formato atual informado pela Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/julho/receita-federal-gera-o-primeiro-cnpj-em-formato-alfanumerico).

A máscara é escolhida pelo formato completo, sem validar dígitos verificadores. Outros tamanhos e textos ficam livres, permitindo documentos estrangeiros sem cortar caracteres. O campo continua opcional. A formatação também aparece na impressão; busca e detecção de duplicatas reconhecem CPF/CNPJ com ou sem pontuação. Importar dados preserva a indicação amarela de revisão quando o documento não veio preenchido.

## Crédito e apoio

O rodapé mostra o link para [Ricardo Braga Lab](https://ricardobragalab.pages.dev), seguindo a referência do projeto Mari, e o botão **Apoiar o projeto**. O modal oferece Pix, Bitcoin, Lightning e PayPal, com QR Code local e cópia do dado de recebimento, seguindo o collection-to-play. Os dados públicos ficam em `src/features/support/support-data.ts` e os QR Codes em `src/features/support/assets/`; ao mudar um dado, atualize também o QR Code correspondente.

O crédito reproduz a animação da referência Mari: no celular, após dois segundos com pelo menos 80% do link visível, chaves e brilho aparecem automaticamente uma vez por visita, por cerca de oito segundos. Ao tocar, o terminal digita a mensagem e navega após quatro segundos; ações de teclado e abertura em nova aba continuam nativas. No computador, hover ou foco mostra o terminal por pelo menos três segundos, com brilho recorrente e pontos animados. A preferência de redução de movimento desativa esses efeitos e a espera de navegação. A implementação usa animações nativas do navegador, sem dependência adicional.

A contribuição é voluntária, com valor escolhido no banco, carteira ou PayPal. Rodapé e modal ficam ocultos na impressão. A interface de apoio não carrega serviços externos; o PayPal abre somente ao clicar no link.

## Licença

Este projeto usa a **GNU General Public License v3.0 (GPL-3.0-only)**. O texto completo está em [LICENSE](LICENSE). As dependências mantêm suas respectivas licenças.
