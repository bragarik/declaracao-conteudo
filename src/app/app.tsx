// SPDX-License-Identifier: GPL-3.0-only
import { DeclarationForm } from '../features/declaration/declaration-form';
import { useLocalRoute } from './router';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { SiteFooter } from '../components/layout/site-footer';
import { ObsoleteNotice } from '../components/layout/obsolete-notice';

export function App() {
  const route = useLocalRoute();
  return (
    <main class="app-layout mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <header class="screen-only space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="flex flex-wrap items-center gap-2 font-semibold text-primary">Declaração de conteúdo <span class="rounded-full border border-warning/50 bg-warning/15 px-2.5 py-1 text-xs text-base-content">Obsoleto</span></p>
          <ThemeToggle />
        </div>
        <ObsoleteNotice />
        <nav class="flex flex-wrap gap-3" aria-label="Navegação principal">
          <a class={`btn ${route === 'form' ? 'btn-primary' : 'btn-outline'}`} href="#/" aria-current={route === 'form' ? 'page' : undefined}>Formulário</a>
          <a class={`btn ${route === 'history' ? 'btn-primary' : 'btn-outline'}`} href="#/historico" aria-current={route === 'history' ? 'page' : undefined}>Histórico</a>
        </nav>
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{route === 'history' ? 'Histórico de declarações antigas' : 'Formulário antigo de declaração'}</h1>
        <p class="max-w-2xl text-base-content/75">{route === 'history'
          ? 'Consulte os registros salvos neste navegador. Eles não são declarações eletrônicas autorizadas.'
          : 'Modelo obsoleto preservado para consulta. Para os envios que exigem DC-e, utilize os canais oficiais indicados acima.'}</p>
      </header>
      <DeclarationForm route={route} />
      <SiteFooter />
    </main>
  );
}
