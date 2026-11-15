import Fuse from 'fuse.js';
import { CalendarDays, Landmark, Search, Swords, User, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_BY_ID } from '../lib/categories';
import { events, governments, people, wars } from '../lib/data';
import { formatDate, formatRange } from '../lib/dates';
import { navigate } from '../lib/router';

type Kind = 'person' | 'war' | 'event' | 'gov';

interface Entry {
  kind: Kind;
  id: string;
  title: string;
  sub: string;
  keys: string;
  color: string;
}

const GROUPS: { kind: Kind; label: string; icon: typeof User }[] = [
  { kind: 'person', label: 'אישים', icon: User },
  { kind: 'war', label: 'מלחמות ומבצעים', icon: Swords },
  { kind: 'event', label: 'אירועים', icon: CalendarDays },
  { kind: 'gov', label: 'ממשלות', icon: Landmark },
];

const entries: Entry[] = [
  ...people.map((p) => ({
    kind: 'person' as const,
    id: p.id,
    title: p.name,
    sub: p.role,
    keys: (p.aliases ?? []).join(' '),
    color: '#4f46e5',
  })),
  ...wars.map((w) => ({
    kind: 'war' as const,
    id: w.id,
    title: w.name,
    sub: formatRange(w.start, w.end),
    keys: w.summary,
    color: '#dc2626',
  })),
  ...events.map((e) => ({
    kind: 'event' as const,
    id: e.id,
    title: e.title,
    sub: formatDate(e.date),
    keys: e.summary,
    color: CATEGORY_BY_ID[e.category].color,
  })),
  ...governments.map((g) => ({
    kind: 'gov' as const,
    id: g.id,
    title: g.number ? `ממשלה ${g.number}: ${g.pmName}` : g.pmName,
    sub: formatRange(g.start, g.end),
    keys: `${g.pmName} ${g.party}`,
    color: g.color,
  })),
];

const fuse = new Fuse(entries, {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'keys', weight: 1 },
  ],
  threshold: 0.34,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

export function SearchBar() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const grouped = useMemo(() => {
    if (q.trim().length < 2) return [];
    const term = q.trim();
    // Literal matches win; fuzzy search is only a fallback for typos.
    const literal = entries.filter((e) => e.title.includes(term) || e.keys.includes(term));
    const hits = literal.length
      ? literal.sort((a, b) => Number(b.title.includes(term)) - Number(a.title.includes(term)))
      : fuse.search(term, { limit: 40 }).map((r) => r.item);
    return GROUPS.map((g) => ({ ...g, items: hits.filter((h) => h.kind === g.kind).slice(0, 5) })).filter(
      (g) => g.items.length,
    );
  }, [q]);
  const flat = grouped.flatMap((g) => g.items);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const choose = (en: Entry) => {
    navigate(en.kind, en.id);
    setOpen(false);
    setQ('');
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, flat.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter' && flat[active]) {
            choose(flat[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="חפשו אישים, מלחמות ואירועים… (למשל: אלטלנה, בגין, לבון)"
        className="h-11 w-full rounded-full border-2 border-slate-200 bg-white pl-10 pr-11 text-[15px] shadow-inner outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        role="combobox"
        aria-expanded={open && flat.length > 0}
      />
      {q && (
        <button
          onClick={() => setQ('')}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100"
          aria-label="נקה"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          {grouped.length === 0 && <div className="p-4 text-center text-sm text-slate-500">לא נמצאו תוצאות</div>}
          {grouped.map((g) => (
            <div key={g.kind} className="mb-1">
              <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-xs font-bold text-slate-500">
                <g.icon className="h-3.5 w-3.5" />
                {g.label}
              </div>
              {g.items.map((it) => {
                const idx = flat.indexOf(it);
                return (
                  <button
                    key={it.kind + it.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(it)}
                    onMouseEnter={() => setActive(idx)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right transition ${
                      idx === active ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: it.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900">{it.title}</span>
                      <span className="block truncate text-xs text-slate-500">{it.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
