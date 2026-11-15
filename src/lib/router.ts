import { useEffect, useState } from 'react';
import type { Route } from './types';

function parse(hash: string): Route {
  const m = hash.match(/^#\/(event|war|gov|person)\/(.+)$/);
  return m ? { type: m[1] as 'event', id: decodeURIComponent(m[2]) } : { type: 'home' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function href(type: 'event' | 'war' | 'gov' | 'person', id: string): string {
  return `#/${type}/${encodeURIComponent(id)}`;
}

export function navigate(type: 'event' | 'war' | 'gov' | 'person', id: string) {
  window.location.hash = href(type, id);
}

export function closeDetail() {
  // Keep the scroll position of the tree: replace the hash without jumping.
  history.pushState(null, '', window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function scrollToYear(year: number) {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-year]'));
  const target =
    sections.find((s) => Number(s.dataset.year) >= year) ?? sections[sections.length - 1];
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
