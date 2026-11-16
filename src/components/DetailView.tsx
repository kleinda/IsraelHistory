import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Landmark,
  type LucideIcon,
  Swords,
  User,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import { CATEGORY_BY_ID } from '../lib/categories';
import {
  eventById,
  events,
  eventsBetween,
  eventsWithPerson,
  governmentAt,
  governments,
  govById,
  images,
  personById,
  warById,
  warsAt,
} from '../lib/data';
import { formatDate, formatRange } from '../lib/dates';
import { closeDetail, href } from '../lib/router';
import type { HistEvent, Route, WikiImage } from '../lib/types';
import { EventCard } from './EventCard';

interface Model {
  key: string;
  kicker: string;
  /** Secondary categories, shown as extra badges next to the kicker. */
  tags?: { label: string; color: string }[];
  title: string;
  when: string;
  summary?: string;
  body: string[];
  color: string;
  soft: string;
  icon: LucideIcon;
  image?: WikiImage;
  wiki?: string;
  context: { label: string; to: string; color: string }[];
  peopleIds: string[];
  related: HistEvent[];
  relatedLabel: string;
  prev?: string;
  next?: string;
}

function build(route: Exclude<Route, { type: 'home' | 'leaders' }>): Model | null {
  if (route.type === 'event') {
    const e = eventById.get(route.id);
    if (!e) return null;
    const cat = CATEGORY_BY_ID[e.category];
    const i = events.indexOf(e);
    const gov = governmentAt(e.date);
    const context = [
      ...(gov
        ? [{ label: gov.number ? `ממשלה ${gov.number} · ${gov.pmName}` : gov.pmName, to: href('gov', gov.id), color: gov.color }]
        : []),
      ...warsAt(e.date).map((w) => ({ label: w.name, to: href('war', w.id), color: '#dc2626' })),
    ];
    return {
      key: `event:${e.id}`,
      kicker: cat.label,
      tags: (e.also ?? []).map((c) => ({ label: CATEGORY_BY_ID[c].label, color: CATEGORY_BY_ID[c].color })),
      title: e.title,
      when: formatDate(e.date),
      summary: e.summary,
      body: e.body,
      color: cat.color,
      soft: cat.soft,
      icon: cat.icon,
      image: images[`event:${e.id}`],
      wiki: e.wiki,
      context,
      peopleIds: e.people ?? [],
      related: [
        ...(e.related ?? []).map((id) => eventById.get(id)!).filter(Boolean),
        ...events.filter((o) => o.related?.includes(e.id) && !e.related?.includes(o.id)),
      ],
      relatedLabel: 'אירועים קשורים',
      prev: events[i - 1] && href('event', events[i - 1].id),
      next: events[i + 1] && href('event', events[i + 1].id),
    };
  }
  if (route.type === 'war') {
    const w = warById.get(route.id);
    if (!w) return null;
    return {
      key: `war:${w.id}`,
      kicker: 'מלחמה / מבצע',
      title: w.name,
      when: formatRange(w.start, w.end),
      summary: w.summary,
      body: w.body,
      color: '#dc2626',
      soft: '#fee2e2',
      icon: Swords,
      image: images[`war:${w.id}`],
      wiki: w.wiki,
      context: [],
      peopleIds: w.people ?? [],
      related: eventsBetween(w.start, w.end),
      relatedLabel: 'אירועים בזמן המלחמה',
    };
  }
  if (route.type === 'gov') {
    const g = govById.get(route.id);
    if (!g) return null;
    const i = governments.indexOf(g);
    return {
      key: `gov:${g.id}`,
      kicker: g.number ? `הממשלה ה-${g.number}` : 'הנהגה',
      title: g.pmName,
      when: formatRange(g.start, g.end),
      summary: `${g.party}${g.note ? ` · ${g.note}` : ''}`,
      body: [],
      color: g.color,
      soft: g.color + '22',
      icon: Landmark,
      image: images[`person:${g.pm}`],
      context: [{ label: `על ${g.pmName}`, to: href('person', g.pm), color: g.color }],
      peopleIds: [],
      related: eventsBetween(g.start, g.end),
      relatedLabel: 'אירועים בתקופת הממשלה',
      prev: governments[i - 1] && href('gov', governments[i - 1].id),
      next: governments[i + 1] && href('gov', governments[i + 1].id),
    };
  }
  const p = personById.get(route.id);
  if (!p) return null;
  const headed = governments.filter((g) => g.pm === p.id);
  return {
    key: `person:${p.id}`,
    kicker: 'אישיות',
    title: p.name,
    when: p.role,
    body: [],
    color: '#4f46e5',
    soft: '#e0e7ff',
    icon: User,
    image: images[`person:${p.id}`],
    wiki: p.wiki,
    context: headed.map((g) => ({
      label: g.number ? `ממשלה ${g.number} (${formatRange(g.start, g.end)})` : g.pmName,
      to: href('gov', g.id),
      color: g.color,
    })),
    peopleIds: [],
    related: eventsWithPerson(p.id),
    relatedLabel: 'אירועים שבהם השתתף/ה',
  };
}

export function DetailView({ route }: { route: Exclude<Route, { type: 'home' | 'leaders' }> }) {
  const m = build(route);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail();
      // RTL: the left arrow moves forward in time.
      if (e.key === 'ArrowLeft' && m?.next) window.location.hash = m.next;
      if (e.key === 'ArrowRight' && m?.prev) window.location.hash = m.prev;
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [m?.next, m?.prev]);

  useEffect(() => {
    document.getElementById('detail-scroll')?.scrollTo({ top: 0 });
  }, [m?.key]);

  if (!m) {
    return (
      <Overlay>
        <div className="p-20 text-center text-xl">הדף לא נמצא</div>
      </Overlay>
    );
  }

  const Icon = m.icon;

  return (
    <Overlay>
      <motion.div
        key={m.key}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* hero */}
        <div
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}bb 60%, #0f172a)` }}
        >
          {m.image?.src && (
            <img
              src={m.image.src}
              alt={m.title}
              className="absolute inset-0 h-full w-full object-cover object-[center_15%] opacity-45"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
          <div className="relative mx-auto flex min-h-[44vh] max-w-4xl flex-col justify-end px-6 pb-10 pt-24 text-white">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/40 backdrop-blur">
                <Icon className="h-8 w-8" />
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">{m.kicker}</span>
              {m.tags?.map((t) => (
                <span
                  key={t.label}
                  className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold backdrop-blur"
                  style={{ background: t.color + '99' }}
                >
                  {t.label}
                </span>
              ))}
            </div>
            <h1 className="font-display text-4xl leading-tight drop-shadow md:text-6xl">{m.title}</h1>
            <div className="mt-3 flex items-center gap-2 text-lg opacity-95">
              <CalendarDays className="h-5 w-5" />
              {m.when}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-6 pb-28 pt-10">
          {m.context.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {m.context.map((c) => (
                <a
                  key={c.to}
                  href={c.to}
                  className="rounded-full px-3 py-1 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                  style={{ background: c.color }}
                >
                  {c.label}
                </a>
              ))}
            </div>
          )}

          {m.summary && (
            <p
              className="mb-8 rounded-2xl border-r-8 p-5 text-xl font-medium leading-relaxed text-slate-800"
              style={{ borderColor: m.color, background: m.soft }}
            >
              {m.summary}
            </p>
          )}

          <div className="space-y-5 text-[17px] leading-8 text-slate-700">
            {m.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {m.peopleIds.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-lg font-bold text-slate-900">אישים מרכזיים</h2>
              <div className="flex flex-wrap gap-2">
                {m.peopleIds.map((pid) => {
                  const p = personById.get(pid);
                  if (!p) return null;
                  const img = images[`person:${p.id}`];
                  return (
                    <a
                      key={pid}
                      href={href('person', pid)}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-4 pr-1 shadow-sm transition hover:border-indigo-400 hover:shadow"
                    >
                      {img?.src ? (
                        <img src={img.src} alt="" className="h-8 w-8 rounded-full object-cover object-top" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          <User className="h-4 w-4" />
                        </span>
                      )}
                      <span className="text-sm font-semibold">{p.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {m.related.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-lg font-bold text-slate-900">
                {m.relatedLabel} <span className="text-slate-400">({m.related.length})</span>
              </h2>
              <div className="grid items-start gap-3 sm:grid-cols-2">
                {m.related.map((e) => (
                  <EventCard key={e.id} event={{ ...e, importance: Math.min(e.importance, 2) as 1 | 2 }} />
                ))}
              </div>
            </div>
          )}

          {(m.image?.heTitle || m.image?.page) && (
            <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500">
              {m.image?.heTitle && (
                <a
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                  href={`https://he.wikipedia.org/wiki/${encodeURIComponent(m.image.heTitle)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" /> לקריאה נוספת בוויקיפדיה
                </a>
              )}
              {m.image?.page && (
                <a href={m.image.page} target="_blank" rel="noreferrer" className="hover:underline">
                  מקור התמונה: Wikimedia Commons
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* prev / next */}
      {(m.prev || m.next) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex justify-center gap-3">
          {m.prev && (
            <button
              onClick={() => (window.location.hash = m.prev!)}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold shadow-xl ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              <ArrowRight className="h-4 w-4" /> הקודם
            </button>
          )}
          {m.next && (
            <button
              onClick={() => (window.location.hash = m.next!)}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold shadow-xl ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              הבא <ArrowLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </Overlay>
  );
}

export function Overlay({ children, closeSide = 'left' }: { children: React.ReactNode; closeSide?: 'left' | 'right' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      id="detail-scroll"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-50"
    >
      <button
        onClick={closeDetail}
        className={`fixed ${closeSide === 'left' ? 'left-5 h-11 w-11' : 'right-2 h-9 w-9 md:right-5 md:h-11 md:w-11'} top-5 z-20 flex items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg ring-1 ring-slate-200 backdrop-blur transition hover:scale-105`}
        aria-label="סגור"
      >
        <X className="h-6 w-6" />
      </button>
      {children}
    </motion.div>
  );
}
