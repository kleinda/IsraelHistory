import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { DetailView } from './components/DetailView';
import { EventTree } from './components/EventTree';
import { SearchBar } from './components/SearchBar';
import { MobileRuler, TimelineRuler } from './components/TimelineRuler';
import { CATEGORIES, inCategories } from './lib/categories';
import { events } from './lib/data';
import { START_YEAR } from './lib/dates';
import { useRoute } from './lib/router';
import type { CategoryId } from './lib/types';

const ALL = new Set(CATEGORIES.map((c) => c.id));

export default function App() {
  const route = useRoute();
  const [active, setActive] = useState<Set<CategoryId>>(ALL);
  const [currentYear, setCurrentYear] = useState(START_YEAR);
  const headerRef = useRef<HTMLElement>(null);

  // Expose the header height to CSS so the ruler and sticky year badges sit below it.
  useEffect(() => {
    const el = headerRef.current!;
    const ro = new ResizeObserver(() =>
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = (headerRef.current?.offsetHeight ?? 0) + 80;
        let year = START_YEAR;
        for (const s of document.querySelectorAll<HTMLElement>('[data-year]')) {
          if (s.getBoundingClientRect().top <= line) year = Number(s.dataset.year);
          else break;
        }
        setCurrentYear(year);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Each click shows only that category; clicking the active one again shows everything.
  const toggle = (id: CategoryId) =>
    setActive((prev) => (prev.size === 1 && prev.has(id) ? ALL : new Set([id])));

  const filtered = active.size !== ALL.size;
  const shown = filtered ? events.filter((e) => inCategories(e, active)).length : events.length;

  // A new filter starts the reader at the first matching event, not wherever they were.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [active]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eef2ff,_#f8fafc_40%)]">
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md"
      >
        <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-6">
          <a href="#" className="flex shrink-0 items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xl text-white shadow">
              ✡
            </span>
            <span>
              <span className="block font-display text-xl leading-none text-slate-900">ציר הזמן של ישראל</span>
              <span className="text-xs font-medium text-slate-500">
                1940–2026 · {events.length} אירועים
              </span>
            </span>
          </a>
          <SearchBar />
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5">
          {CATEGORIES.map((c) => {
            const on = filtered && active.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold transition"
                style={{
                  borderColor: c.color,
                  background: on ? c.color : 'white',
                  color: on ? 'white' : c.color,
                  opacity: on || !filtered ? 1 : 0.55,
                }}
              >
                <c.icon className="h-3.5 w-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>
        {filtered && (
          <div className="flex items-center gap-3 border-t border-slate-100 bg-indigo-50/70 px-4 py-1.5 text-sm">
            <span className="text-slate-700">
              מוצגים <b>{shown}</b> אירועים בקטגוריה:{' '}
              <b>{CATEGORIES.filter((c) => active.has(c.id)).map((c) => c.label).join(', ')}</b>
            </span>
            <button
              onClick={() => setActive(ALL)}
              className="mr-auto shrink-0 rounded-full bg-white px-3 py-0.5 text-xs font-bold text-indigo-700 shadow-sm ring-1 ring-indigo-200 hover:bg-indigo-100"
            >
              ✕ הצג הכל
            </button>
          </div>
        )}
        <MobileRuler currentYear={currentYear} />
      </header>

      <TimelineRuler currentYear={currentYear} />

      <main className="md:mr-[168px]">
        <EventTree events={events} activeCategories={active} filtered={filtered} />
        <footer className="pb-10 text-center text-xs text-slate-400">
          התוכן נכתב כסקירה חינוכית · תמונות: Wikimedia Commons ברישיונות חופשיים · המידע עדכני לנובמבר 2026
        </footer>
      </main>

      <AnimatePresence>{route.type !== 'home' && <DetailView key="detail" route={route} />}</AnimatePresence>
    </div>
  );
}
