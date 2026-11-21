// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';

const THEME_KEY = 'declaracao-conteudo:theme';
type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [preference, setPreference] = useState<Theme | null>(() => {
    try { const saved = localStorage.getItem(THEME_KEY); return saved === 'dark' || saved === 'light' ? saved : null; }
    catch { return null; }
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const theme = preference ?? (systemDark ? 'dark' : 'light');
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const choose = (value: Theme | null) => {
    setPreference(value);
    try { if (value) localStorage.setItem(THEME_KEY, value); else localStorage.removeItem(THEME_KEY); }
    catch { /* A escolha continua válida nesta sessão. */ }
  };
  const dark = theme === 'dark';
  return (
    <button type="button" class="btn btn-outline"
      title={preference === null ? 'Próximo: modo claro' : preference === 'light' ? 'Próximo: modo noturno' : 'Próximo: tema do sistema'}
      onClick={() => choose(preference === null ? 'light' : preference === 'light' ? 'dark' : null)}>
      <span aria-hidden="true">{dark ? '☾' : '☀'}</span>
      {preference === null ? `Sistema: ${dark ? 'escuro' : 'claro'}` : dark ? 'Modo noturno' : 'Modo claro'}
    </button>
  );
}
