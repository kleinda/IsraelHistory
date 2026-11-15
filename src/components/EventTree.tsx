import { Landmark, Swords } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CATEGORY_BY_ID, inCategories } from '../lib/categories';
import { eventById, governments, wars } from '../lib/data';
import { compareDates, formatRange, yearOf } from '../lib/dates';
import { href } from '../lib/router';
import type { CategoryId, Government, HistEvent, War } from '../lib/types';
import { EventCard } from './EventCard';

type Item =
  | { kind: 'event'; date: string; event: HistEvent }
  | { kind: 'war'; date: string; war: War }
  | { kind: 'gov'; date: string; gov: Government };

interface Props {
  events: HistEvent[];
  activeCategories: Set<CategoryId>;
  /** When a category filter is on, government and war markers are hidden so only matches remain. */
  filtered: boolean;
}

export function EventTree({ events, activeCategories, filtered }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const years = useMemo(() => {
    const items: Item[] = [
      ...events
        .filter((e) => inCategories(e, activeCategories))
        .map((e) => ({ kind: 'event' as const, date: e.date, event: e })),
      ...(filtered ? [] : wars.map((w) => ({ kind: 'war' as const, date: w.start, war: w }))),
      ...(filtered ? [] : governments.map((g) => ({ kind: 'gov' as const, date: g.start, gov: g }))),
    ].sort((a, b) => compareDates(a.date, b.date) || (a.kind === 'event' ? 1 : -1));

    const byYear = new Map<number, Item[]>();
    for (const it of items) {
      const y = yearOf(it.date);
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y)!.push(it);
    }
    return [...byYear.entries()];
  }, [events, activeCategories, filtered]);

  const related = useMemo(() => {
    if (!hovered) return new Set<string>();
    const ids = new Set(eventById.get(hovered)?.related ?? []);
    for (const e of events) if (e.related?.includes(hovered)) ids.add(e.id);
    return ids;
  }, [hovered, events]);

  let side = 0;

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-32 pt-6">
      {/* trunk */}
      <div className="pointer-events-none absolute bottom-0 right-[37px] top-0 w-1.5 rounded-full bg-gradient-to-b from-sky-400 via-indigo-400 to-fuchsia-400 md:right-1/2 md:translate-x-1/2" />

      {years.map(([year, items]) => (
        <section key={year} data-year={year} className="relative scroll-mt-[calc(var(--header-h)+12px)] pb-6">
          <div className="sticky top-[calc(var(--header-h)+8px)] z-10 mb-4 flex justify-start md:justify-center">
            <span className="relative rounded-full bg-gradient-to-l from-indigo-600 to-sky-500 px-4 py-1 font-display text-xl text-white shadow-lg ring-4 ring-white">
              {year}
            </span>
          </div>

          <div className="space-y-4">
            {items.map((it) => {
              if (it.kind === 'gov') return <GovMarker key={`g-${it.gov.id}`} gov={it.gov} />;
              if (it.kind === 'war') return <WarBanner key={`w-${it.war.id}`} war={it.war} />;

              const e = it.event;
              const s = side++ % 2;
              const color = CATEGORY_BY_ID[e.category].color;
              return (
                <div key={e.id} className="grid grid-cols-[48px_1fr] items-center md:grid-cols-[1fr_64px_1fr]">
                  <div className="relative col-start-1 row-start-1 flex h-full items-center justify-center md:col-start-2">
                    <span
                      className={`absolute top-1/2 h-1 -translate-y-1/2 rounded-full left-0 right-1/2 ${
                        s ? 'md:left-0 md:right-1/2' : 'md:left-1/2 md:right-0'
                      }`}
                      style={{ background: color + '88' }}
                    />
                    <span
                      className="relative h-4 w-4 rounded-full border-[3px] border-white shadow"
                      style={{ background: color }}
                    />
                  </div>
                  <div className={`col-start-2 row-start-1 ${s ? 'md:col-start-3' : 'md:col-start-1'}`}>
                    <EventCard event={e} highlighted={related.has(e.id)} onHover={setHovered} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function GovMarker({ gov }: { gov: Government }) {
  return (
    <div className="relative flex justify-start pr-1 md:justify-center md:pr-0">
      <a
        href={href('gov', gov.id)}
        className="relative inline-flex items-center gap-2 rounded-full border-2 border-white px-4 py-1.5 text-sm font-bold text-white shadow-md transition hover:scale-105"
        style={{ background: gov.color }}
      >
        <Landmark className="h-4 w-4" />
        {gov.number ? `ממשלה ${gov.number}: ${gov.pmName}` : gov.pmName}
        <span className="font-normal opacity-80">· {gov.party}</span>
      </a>
    </div>
  );
}

function WarBanner({ war }: { war: War }) {
  return (
    <div className="relative pr-12 md:px-8">
      <a
        href={href('war', war.id)}
        className="group relative mx-auto flex max-w-2xl items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-l from-red-600 via-red-500 to-orange-500 p-4 text-white shadow-lg ring-4 ring-white transition hover:-translate-y-0.5 hover:shadow-xl"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Swords className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold opacity-90">{formatRange(war.start, war.end)}</div>
          <div className="font-display text-xl leading-tight">{war.name}</div>
          <p className="mt-0.5 line-clamp-1 text-sm opacity-90">{war.summary}</p>
        </div>
      </a>
    </div>
  );
}
