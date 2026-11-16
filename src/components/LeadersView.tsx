import { motion } from 'framer-motion';
import { Crown, Landmark, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { chiefs, personById, pmTerms, presidents } from '../lib/data';
import { formatRange, parts, toYearFloat } from '../lib/dates';
import { closeDetail, href } from '../lib/router';
import type { Officeholder } from '../lib/types';
import { Overlay } from './DetailView';

const PX_PER_YEAR = 64;
const T0 = toYearFloat('1948-05-14');
const now = new Date();
const TODAY = now.getFullYear() + now.getMonth() / 12 + (now.getDate() - 1) / 365;
const FIRST_YEAR = 1948;
const LAST_YEAR = now.getFullYear();
const y = (t: number) => (t - T0) * PX_PER_YEAR;

// Cycled so neighbouring office holders always get different colours.
const PRESIDENT_COLORS = ['#7c3aed', '#0e7490', '#be123c', '#4d7c0f', '#c2410c', '#1d4ed8'];
const CHIEF_COLORS = ['#3f6212', '#9a3412', '#155e75', '#86198f', '#a16207', '#1e3a8a', '#b91c1c'];

const GRID = 'grid grid-cols-[34px_1fr_1fr_1fr] gap-1.5 md:grid-cols-[56px_1fr_1fr_1fr] md:gap-3';

interface Block {
  key: string;
  name: string;
  start: string;
  end: string | null;
  color: string;
  to?: string;
  acting?: boolean;
  note?: string;
}

const pmBlocks: Block[] = pmTerms.map((t) => ({
  key: `${t.pm}-${t.start}`,
  name: personById.get(t.pm)?.name ?? t.pm,
  start: t.start,
  end: t.end,
  color: t.color,
  to: href('person', t.pm),
  note: t.end === null ? 'מכהן' : undefined,
}));

function officeBlocks(list: Officeholder[], palette: string[]): Block[] {
  let colorIndex = 0;
  return list.map((p) => ({
    key: p.id,
    name: p.name,
    start: p.start,
    end: p.end,
    color: p.acting ? '#94a3b8' : palette[colorIndex++ % palette.length],
    to: p.person && href('person', p.person),
    acting: p.acting,
    note: p.end === null ? 'מכהן' : p.note,
  }));
}
const presidentBlocks = officeBlocks(presidents, PRESIDENT_COLORS);
const chiefBlocks = officeBlocks(chiefs, CHIEF_COLORS);

/** "26.1.1954" – short enough to fit narrow mobile columns. */
const short = (d: string) => {
  const [yr, m, day] = parts(d);
  return [day, m, yr].filter(Boolean).join('.');
};

function duration(start: string, end: string | null): string {
  const months = Math.round(((end ? toYearFloat(end) : TODAY) - toYearFloat(start)) * 12);
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  if (yrs === 0) return `${mo} חודשים`;
  const ys = yrs === 1 ? 'שנה' : yrs === 2 ? 'שנתיים' : `${yrs} שנים`;
  return mo ? `${ys} ו-${mo} ח׳` : ys;
}

export function LeadersView() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDetail();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []);

  const years: number[] = [];
  for (let yr = FIRST_YEAR + 1; yr <= LAST_YEAR; yr++) years.push(yr);
  const height = y(TODAY) + 24;

  return (
    <Overlay closeSide="right">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="bg-gradient-to-l from-indigo-700 via-violet-600 to-fuchsia-600 px-6 pb-8 pt-20 text-white">
          <div className="mx-auto max-w-5xl">
            <h1 className="font-display text-4xl md:text-5xl">מנהיגי המדינה</h1>
            <p className="mt-2 max-w-2xl text-white/90">
              ראשי הממשלה, הנשיאים והרמטכ״לים מקום המדינה ועד היום, זה מול זה על ציר הזמן. כל צבע הוא מנהיג
              אחר; גובה הפס הוא אורך הכהונה. לחיצה על שם פותחת את דף האישיות.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-2 pb-24 md:px-6">
          <div className={`sticky top-0 z-10 ${GRID} bg-slate-50/95 py-3 backdrop-blur`}>
            <span />
            <ColumnTitle icon={Landmark} label="ראשי ממשלה" />
            <ColumnTitle icon={Crown} label="נשיאים" />
            <ColumnTitle icon={Shield} label="רמטכ״לים" />
          </div>

          <div className={`relative ${GRID}`} style={{ height }}>
            {/* year grid */}
            {years.map((yr) => (
              <div
                key={yr}
                className={`pointer-events-none absolute inset-x-0 border-t ${yr % 10 === 0 ? 'border-slate-300' : 'border-slate-200/70'}`}
                style={{ top: y(yr) }}
              >
                <span
                  className={`absolute right-0 -translate-y-1/2 bg-slate-50 pl-1 text-[10px] md:text-xs ${
                    yr % 10 === 0 ? 'font-bold text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {yr}
                </span>
              </div>
            ))}
            <div className="pointer-events-none absolute right-0 top-0 -translate-y-1/2 text-[10px] font-bold leading-none text-indigo-600 md:text-xs">
              1948
            </div>

            <span />
            <Column blocks={pmBlocks} />
            <Column blocks={presidentBlocks} />
            <Column blocks={chiefBlocks} />

            {/* today */}
            <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-rose-500" style={{ top: y(TODAY) }}>
              <span className="absolute right-0 top-1 rounded bg-rose-500 px-1.5 text-[11px] font-bold text-white">היום</span>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            פסים אפורים: יושבי ראש הכנסת שמילאו את מקום הנשיא בין כהונות (יוסף שפרינצק, קדיש לוז, אברהם בורג, דליה
            איציק). ממלאי מקום שכיהנו שבועות ספורים מוצגים כפס דק; ריחוף מציג פרטים. עמודת הרמטכ״לים מתחילה ב-26
            במאי 1948, יום הקמת צה״ל.
          </p>
        </div>
      </motion.div>
    </Overlay>
  );
}

function ColumnTitle({ icon: Icon, label }: { icon: typeof Crown; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-amber-100 to-yellow-200 px-1 py-2 text-xs font-bold text-amber-950 shadow-sm ring-1 ring-amber-300 md:gap-2 md:text-base">
      <Icon className="hidden h-4 w-4 text-amber-700 sm:block" />
      {label}
    </div>
  );
}

function Column({ blocks }: { blocks: Block[] }) {
  return (
    <div className="relative">
      {blocks.map((b) => {
        const top = y(Math.max(toYearFloat(b.start), T0));
        const h = y(b.end ? toYearFloat(b.end) : TODAY) - top;
        const tip = `${b.name}${b.acting ? ' (ממלא מקום)' : ''}\n${formatRange(b.start, b.end)}${b.note ? `\n${b.note}` : ''}`;
        const style = {
          top: top + 1,
          height: Math.max(h - 2, 3),
          background: b.acting
            ? `repeating-linear-gradient(135deg, ${b.color}, ${b.color} 6px, #cbd5e1 6px, #cbd5e1 12px)`
            : `linear-gradient(160deg, ${b.color}, ${b.color}dd)`,
        };
        const Tag = b.to ? 'a' : 'div';
        return (
          <Tag
            key={b.key}
            href={b.to}
            title={tip}
            style={style}
            className={`absolute inset-x-0 flex flex-col overflow-hidden rounded-md px-1.5 shadow-sm ${b.acting ? 'text-slate-900' : 'text-white'} ${h >= 80 ? 'justify-start pt-1.5 md:pt-3' : 'justify-center'} ring-1 ring-white/60 transition hover:z-10 hover:brightness-110 md:rounded-xl md:px-3`}
          >
            {h >= 50 ? (
              <>
                <span className="line-clamp-2 text-xs font-bold leading-tight md:text-base">{b.name}</span>
                {/* Narrow columns: start and end on their own lines, so the dash never starts a line. */}
                <span className="flex flex-col text-[10px] leading-tight opacity-95 md:block md:text-xs">
                  <span>
                    {short(b.start)}
                    <span className="hidden md:inline"> –</span>
                  </span>{' '}
                  <span>
                    <span className="md:hidden">עד </span>
                    {b.end ? short(b.end) : 'היום'}
                  </span>
                </span>
                {h >= 80 && (
                  <span className="mt-0.5 text-[10px] leading-tight opacity-80 md:text-[11px]">
                    {duration(b.start, b.end)}
                    {b.note && <span className="hidden md:inline"> · {b.note}</span>}
                  </span>
                )}
              </>
            ) : h >= 20 ? (
              <span className="truncate text-[10px] font-bold leading-tight md:text-xs">
                {b.name}
                <span className="hidden font-normal md:inline">
                  {' '}· {short(b.start)}–{b.end ? short(b.end) : 'היום'}
                </span>
              </span>
            ) : null}
          </Tag>
        );
      })}
    </div>
  );
}
