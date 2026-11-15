import governmentsRaw from '../data/governments.json';
import warsRaw from '../data/wars.json';
import peopleRaw from '../data/people.json';
import imagesRaw from '../data/images.json';
import presidentsRaw from '../data/presidents.json';
import { compareDates, toYearFloat } from './dates';
import type { Government, HistEvent, Person, President, War, WikiImage } from './types';

const eventModules = import.meta.glob<{ default: HistEvent[] }>('../data/events/*.json', {
  eager: true,
});

export const events: HistEvent[] = Object.values(eventModules)
  .flatMap((m) => m.default)
  .sort((a, b) => compareDates(a.date, b.date));
export const wars = (warsRaw as War[]).slice().sort((a, b) => compareDates(a.start, b.start));
export const governments = (governmentsRaw as Government[])
  .slice()
  .sort((a, b) => compareDates(a.start, b.start));
export const people = peopleRaw as Person[];
export const presidents = presidentsRaw as President[];

/** Consecutive governments under the same PM merged into one term (state era only). */
export const pmTerms = governments
  .filter((g) => g.id !== 'yishuv')
  .reduce<{ pm: string; start: string; end: string | null; color: string; govIds: string[] }[]>((terms, g) => {
    const last = terms[terms.length - 1];
    if (last && last.pm === g.pm) {
      last.end = g.end;
      last.govIds.push(g.id);
    } else terms.push({ pm: g.pm, start: g.start, end: g.end, color: g.color, govIds: [g.id] });
    return terms;
  }, []);

/** Keyed by "event:<id>", "war:<id>" or "person:<id>"; produced by scripts/fetch-images.mjs */
export const images = imagesRaw as Record<string, WikiImage>;

export const eventById = new Map(events.map((e) => [e.id, e]));
export const warById = new Map(wars.map((w) => [w.id, w]));
export const govById = new Map(governments.map((g) => [g.id, g]));
export const personById = new Map(people.map((p) => [p.id, p]));

export function governmentAt(date: string): Government | undefined {
  const t = toYearFloat(date);
  return governments.find(
    (g) => toYearFloat(g.start) <= t && (g.end === null || t < toYearFloat(g.end)),
  );
}

export function warsAt(date: string): War[] {
  const t = toYearFloat(date);
  return wars.filter((w) => toYearFloat(w.start) <= t && t <= toYearFloat(w.end) + 1 / 365);
}

export function eventsBetween(start: string, end: string | null): HistEvent[] {
  const s = toYearFloat(start);
  const e = end ? toYearFloat(end) : Infinity;
  return events.filter((ev) => {
    const t = toYearFloat(ev.date);
    return t >= s && t <= e;
  });
}

export function eventsWithPerson(personId: string): HistEvent[] {
  return events.filter((e) => e.people?.includes(personId));
}

/** Greedy lane assignment so overlapping wars sit side by side on the ruler. */
export function warLanes(): { war: War; lane: number }[] {
  const laneEnds: number[] = [];
  return wars.map((war) => {
    const s = toYearFloat(war.start);
    let lane = laneEnds.findIndex((end) => end < s);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = toYearFloat(war.end) + 0.3;
    return { war, lane };
  });
}
