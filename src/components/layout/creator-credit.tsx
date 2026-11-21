// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'preact/hooks';
import './creator-credit.css';

const message = 'criando experiências digitais';

export function CreatorCredit() {
  const root = useRef<HTMLSpanElement>(null);
  const mobilePlayed = useRef(false);
  useEffect(() => {
    const credit = root.current!;
    const link = credit.querySelector('a')!;
    const output = credit.querySelector<HTMLElement>('[data-credit-output]')!;
    const shine = credit.querySelector<HTMLElement>('.credit-shine')!;
    const desktop = matchMedia('(width > 900px) and (hover: hover) and (pointer: fine)');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      if (reduce.matches) return;
      const timers = new Set<number>();
      let observer: IntersectionObserver | undefined;
      let visible = false, active = false, popup = false, hovered = false, focused = false;
      let shownAt = 0;
      let startTimer: number | undefined, closeTimer: number | undefined, navigation: number | undefined;
      let typingTimer: number | undefined, shineTimer: number | undefined, hideTimer: number | undefined;
      let shineAnimation: Animation | undefined;
      const later = (callback: () => void, delay: number) => {
        const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay);
        timers.add(id);
        return id;
      };
      const cancel = (id: number | undefined) => {
        if (id !== undefined) { clearTimeout(id); timers.delete(id); }
      };
      const stopShine = () => {
        cancel(shineTimer); shineTimer = undefined;
        shineAnimation?.cancel(); shineAnimation = undefined;
      };
      const playShine = () => {
        shineAnimation?.cancel();
        shineAnimation = shine.animate([
          { opacity: 0, backgroundPosition: '150% 0' },
          { opacity: 1, offset: 0.075 },
          { opacity: 1, backgroundPosition: '-150% 0', offset: 0.9 },
          { opacity: 0, backgroundPosition: '-150% 0' },
        ], { duration: 2000, easing: 'ease-in-out' });
      };
      const startShine = (delay = desktop.matches ? 8000 : 4000) => {
        if (!active || document.hidden || navigation !== undefined || shineTimer !== undefined) return;
        if (!desktop.matches && (!visible || popup)) return;
        shineTimer = later(() => {
          shineTimer = undefined;
          playShine();
          startShine();
        }, delay);
      };
      const hide = () => {
        cancel(startTimer); startTimer = undefined;
        cancel(closeTimer); closeTimer = undefined;
        cancel(typingTimer); typingTimer = undefined;
        stopShine();
        active = false; popup = false;
        credit.classList.remove('is-active', 'has-terminal');
      };
      const show = (terminal = true, automatic = false) => {
        cancel(closeTimer); closeTimer = undefined;
        if (active && (!terminal || popup)) return;
        cancel(hideTimer); cancel(typingTimer); stopShine();
        active = true; popup = terminal; shownAt = performance.now();
        credit.classList.add('is-active');
        credit.classList.toggle('has-terminal', terminal);
        output.textContent = '';
        playShine();
        if (terminal) {
          const started = performance.now() + 300;
          const type = () => {
            const length = Math.max(0, Math.min(message.length, Math.floor((performance.now() - started) / 1100 * message.length)));
            output.textContent = message.slice(0, length);
            if (length < message.length) typingTimer = later(type, 30);
            else typingTimer = undefined;
          };
          typingTimer = later(type, 300);
        }
        if (automatic) hideTimer = later(hide, 7500);
        startShine();
      };
      const requestClose = () => {
        cancel(closeTimer);
        const remaining = Math.max(0, 3000 - (performance.now() - shownAt));
        closeTimer = later(() => { closeTimer = undefined; if (!hovered && !focused) hide(); }, remaining);
      };
      const enter = () => { hovered = true; show(); };
      const leave = () => { hovered = false; if (!focused) requestClose(); };
      const focus = () => { focused = true; show(); };
      const blur = () => { focused = false; if (!hovered) requestClose(); };
      const dismiss = () => {
        cancel(navigation); navigation = undefined;
        hovered = false; focused = false;
        hide();
      };
      const followMobile = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.detail === 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
          || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
        event.preventDefault();
        if (navigation !== undefined) return;
        mobilePlayed.current = true;
        cancel(startTimer); startTimer = undefined;
        show();
        navigation = later(() => { navigation = undefined; window.location.assign(link.href); }, 4000);
      };
      const scheduleStart = () => {
        if (desktop.matches || !visible || mobilePlayed.current || startTimer !== undefined || document.hidden) return;
        startTimer = later(() => {
          startTimer = undefined;
          if (!visible || mobilePlayed.current || document.hidden) return;
          mobilePlayed.current = true;
          show(false, true);
        }, 2000);
      };
      const resume = () => { scheduleStart(); startShine(); };
      const visibility = () => { if (document.hidden) dismiss(); else resume(); };
      if (desktop.matches) {
        link.addEventListener('pointerenter', enter);
        link.addEventListener('pointerleave', leave);
        link.addEventListener('focus', focus);
        link.addEventListener('blur', blur);
        hovered = link.matches(':hover');
        focused = document.activeElement === link;
        if (hovered || focused) show();
      } else {
        link.addEventListener('click', followMobile);
        observer = new IntersectionObserver(entries => {
          visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.8);
          if (!visible) {
            cancel(startTimer); startTimer = undefined;
            stopShine();
            if (active && !popup) hide();
            return;
          }
          scheduleStart(); startShine();
        }, { threshold: 0.8 });
        observer.observe(link);
      }
      window.addEventListener('blur', dismiss);
      window.addEventListener('pagehide', dismiss);
      window.addEventListener('focus', resume);
      document.addEventListener('visibilitychange', visibility);
      cleanup = () => {
        observer?.disconnect();
        timers.forEach(id => clearTimeout(id)); timers.clear();
        shineAnimation?.cancel();
        credit.classList.remove('is-active', 'has-terminal'); output.textContent = '';
        link.removeEventListener('pointerenter', enter); link.removeEventListener('pointerleave', leave);
        link.removeEventListener('focus', focus); link.removeEventListener('blur', blur);
        link.removeEventListener('click', followMobile);
        window.removeEventListener('blur', dismiss); window.removeEventListener('pagehide', dismiss);
        window.removeEventListener('focus', resume); document.removeEventListener('visibilitychange', visibility);
      };
    };
    setup();
    desktop.addEventListener('change', setup); reduce.addEventListener('change', setup);
    return () => { cleanup(); desktop.removeEventListener('change', setup); reduce.removeEventListener('change', setup); };
  }, []);
  return (
    <span ref={root} class="creator-credit" data-creator-credit>
      <a class="creator-link" href="https://ricardobragalab.pages.dev">
        <span class="credit-brace credit-brace-left" aria-hidden="true">{'{'}</span>
        <span class="credit-name">Site criado por Ricardo Braga Lab.<span class="credit-shine" aria-hidden="true">Site criado por Ricardo Braga Lab.</span></span>
        <span class="credit-brace credit-brace-right" aria-hidden="true">{'}'}</span>
      </a>
      <span class="credit-terminal" aria-hidden="true">
        <span class="credit-terminal-bar"><span class="credit-dots"><span /><span /><span /></span><span class="credit-terminal-label">BRAGA LAB</span></span>
        <span class="credit-command"><span>&gt; </span><span data-credit-output /><span class="credit-caret">_</span></span>
      </span>
    </span>
  );
}
