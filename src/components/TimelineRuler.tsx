import { useRef, useState } from 'react';
import { governments, warLanes } from '../lib/data';
import { END_YEAR, formatRange, START_YEAR, toYearFloat } from '../lib/dates';
import { scrollToYear } from '../lib/router';

const SPAN = END_YEAR + 1 - START_YEAR;
const pct = (t: number) => `${((Math.max(t, START_YEAR) - START_YEAR) / SPAN) * 100}%`;
const height = (s: number, e: number) =>
  `${((Math.min(e, END_YEAR + 1) - Math.max(s, START_YEAR)) / SPAN) * 100}%`;

const lanes = warLanes();
const laneCount = Math.max(...lanes.map((l) => l.lane)) + 1;

interface Tip {
  y: number;
  title: string;
  sub: string;
  color: string;
}

export function TimelineRuler({ currentYear }: { currentYear: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  const yearFromEvent = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.floor(START_YEAR + ((e.clientY - r.top) / r.height) * SPAN);
  };

  const ticks = [];
  for (let y = START_YEAR; y <= END_YEAR; y += 5) ticks.push(y);

  return (
    <aside className="fixed right-0 top-[var(--header-h)] bottom-0 z-30 hidden w-[168px] select-none border-l border-slate-200 bg-white/90 px-2 py-3 backdrop-blur md:block">
      <div className="mb-1 flex gap-1 text-[10px] font-bold text-slate-500">
        <span className="w-9 text-center">שנה</span>
        <span className="w-[52px] text-center">ממשלות</span>
        <span className="flex-1 text-center">מלחמות</span>
      </div>
      <div
        ref={ref}
        className="relative h-[calc(100%-1.25rem)] cursor-pointer"
        onClick={(e) => scrollToYear(yearFromEvent(e))}
        onMouseMove={(e) => setHoverYear(yearFromEvent(e))}
        onMouseLeave={() => {
          setHoverYear(null);
          setTip(null);
        }}
      >
        {/* years */}
        <div className="absolute inset-y-0 right-0 w-9">
          {ticks.map((y) => (
            <div
              key={y}
              className="absolute right-0 flex w-full -translate-y-1/2 items-center gap-0.5 text-[10px] font-semibold text-slate-500"
              style={{ top: pct(y) }}
            >
              <span>{y}</span>
              <span className="h-px flex-1 bg-slate-300" />
            </div>
          ))}
        </div>

        {/* governments */}
        <div className="absolute inset-y-0 right-10 w-[52px] overflow-hidden rounded bg-slate-100">
          {governments.map((g) => {
            const s = toYearFloat(g.start);
            const e = g.end ? toYearFloat(g.end) : END_YEAR + 1;
            return (
              <div
                key={g.id}
                className="absolute inset-x-0 flex items-center justify-center overflow-hidden border-b border-white/70 text-[9px] font-bold leading-none text-white transition-[filter] hover:brightness-110"
                style={{ top: pct(s), height: height(s, e), background: g.color }}
                onMouseEnter={(ev) =>
                  setTip({
                    y: ev.currentTarget.offsetTop + ev.currentTarget.offsetHeight / 2,
                    title: g.number ? `ממשלה ${g.number} · ${g.pmName}` : g.pmName,
                    sub: `${g.party} · ${formatRange(g.start, g.end)}`,
                    color: g.color,
                  })
                }
                onClick={(ev) => {
                  ev.stopPropagation();
                  scrollToYear(Math.floor(s));
                }}
              >
                <span className="truncate px-0.5">{e - s > 2.2 ? g.pmName.split(' ').at(-1) : ''}</span>
              </div>
            );
          })}
        </div>

        {/* wars */}
        <div className="absolute inset-y-0 left-0 right-[100px]">
          {lanes.map(({ war, lane }) => {
            const s = toYearFloat(war.start);
            const e = Math.max(toYearFloat(war.end), s + 0.35);
            return (
              <div
                key={war.id}
                className="absolute rounded-sm bg-gradient-to-b from-red-500 to-orange-500 shadow-sm ring-1 ring-white transition hover:from-red-600 hover:to-red-500"
                style={{
                  top: pct(s),
                  height: height(s, e),
                  right: `${(lane / laneCount) * 100}%`,
                  width: `${100 / laneCount - 6}%`,
                }}
                onMouseEnter={(ev) =>
                  setTip({
                    y: ev.currentTarget.offsetTop + Math.min(ev.currentTarget.offsetHeight / 2, 12),
                    title: war.name,
                    sub: formatRange(war.start, war.end),
                    color: '#dc2626',
                  })
                }
                onClick={(ev) => {
                  ev.stopPropagation();
                  scrollToYear(Math.floor(s));
                }}
              />
            );
          })}
        </div>

        {/* current position */}
        <div
          className="pointer-events-none absolute -left-1 -right-1 flex -translate-y-1/2 items-center transition-[top] duration-300"
          style={{ top: pct(currentYear + 0.5) }}
        >
          <span className="h-0.5 flex-1 bg-indigo-600" />
          <span className="absolute -right-0.5 rounded bg-indigo-600 px-1 text-[10px] font-bold text-white shadow">
            {currentYear}
          </span>
        </div>

        {hoverYear !== null && (
          <div
            className="pointer-events-none absolute inset-x-0 h-px bg-slate-400/70"
            style={{ top: pct(hoverYear + 0.5) }}
          />
        )}

        {tip && (
          <div
            className="pointer-events-none absolute right-full top-0 mr-3 w-56 -translate-y-1/2 rounded-xl border bg-white p-3 text-right shadow-xl"
            style={{ top: tip.y, borderColor: tip.color }}
          >
            <div className="text-sm font-bold" style={{ color: tip.color }}>
              {tip.title}
            </div>
            <div className="mt-0.5 text-xs text-slate-600">{tip.sub}</div>
          </div>
        )}
      </div>
    </aside>
  );
}

/** Compact decade strip shown instead of the ruler on small screens. */
export function MobileRuler({ currentYear }: { currentYear: number }) {
  const decades = [];
  for (let y = START_YEAR; y <= END_YEAR; y += 10) decades.push(y);
  return (
    <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
      {decades.map((d) => {
        const active = currentYear >= d && currentYear < d + 10;
        return (
          <button
            key={d}
            onClick={() => scrollToYear(d)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
              active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {d < 2000 ? `שנות ה-${String(d).slice(2)}` : `${d}–${d + 9}`}
          </button>
        );
      })}
    </nav>
  );
}
