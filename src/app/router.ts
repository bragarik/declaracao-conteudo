// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'preact/hooks';

export type Route = 'form' | 'history';
const currentRoute = (): Route => window.location.hash === '#/historico' ? 'history' : 'form';

export function useLocalRoute(): Route {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const onChange = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  useEffect(() => {
    document.title = route === 'history' ? 'Histórico — Declaração de conteúdo — Obsoleto' : 'Declaração de conteúdo — Obsoleto';
  }, [route]);
  return route;
}

export function navigate(route: Route) {
  window.location.hash = route === 'history' ? '/historico' : '/';
}
