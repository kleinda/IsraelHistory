// Validates everything under src/data. Run with `npm run validate`.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const DATA = join(import.meta.dirname, '..', 'src', 'data');
const read = (f: string) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));

const hdate = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'date must be YYYY[-MM[-DD]]');
const category = z.enum([
  'politics', 'military', 'terror', 'affair', 'peace', 'aliyah', 'economy',
  'society', 'culture', 'science', 'disaster', 'shoah',
]);

const Event = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    date: hdate,
    title: z.string().min(2),
    summary: z.string().min(10),
    body: z.array(z.string().min(20)).min(1),
    category,
    also: z.array(category).min(1).optional(),
    importance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    people: z.array(z.string()).optional(),
    related: z.array(z.string()).optional(),
    wiki: z.string().optional(),
  })
  .strict();
const War = z
  .object({
    id: z.string(), name: z.string(), start: hdate, end: hdate, summary: z.string(),
    body: z.array(z.string()).min(1), people: z.array(z.string()).optional(), wiki: z.string().optional(),
  })
  .strict();
const Gov = z
  .object({
    id: z.string(), number: z.number().nullable(), pm: z.string(), pmName: z.string(), party: z.string(),
    start: hdate, end: hdate.nullable(), color: z.string().regex(/^#[0-9a-f]{6}$/), note: z.string().optional(),
  })
  .strict();
const Person = z
  .object({
    id: z.string(), name: z.string(), role: z.string(),
    aliases: z.array(z.string()).optional(), wiki: z.string().optional(),
  })
  .strict();

const Officeholder = z
  .object({
    id: z.string(), person: z.string().optional(), name: z.string(), start: hdate, end: hdate.nullable(),
    acting: z.boolean().optional(), note: z.string().optional(),
  })
  .strict();

const errors: string[] = [];
const parse = <T>(schema: z.ZodType<T>, items: unknown[], where: string): T[] =>
  items.flatMap((it, i) => {
    const r = schema.safeParse(it);
    if (r.success) return [r.data];
    errors.push(`${where}[${i}] ${(it as { id?: string }).id ?? ''}: ${r.error.issues.map((x) => `${x.path.join('.')} ${x.message}`).join('; ')}`);
    return [];
  });

const people = parse(Person, read('people.json'), 'people');
const wars = parse(War, read('wars.json'), 'wars');
const govs = parse(Gov, read('governments.json'), 'governments');
const presidents = parse(Officeholder, read('presidents.json'), 'presidents');
const chiefs = parse(Officeholder, read('chiefs.json'), 'chiefs');
const events = readdirSync(join(DATA, 'events'))
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => parse(Event, read(join('events', f)), f));

const personIds = new Set(people.map((p) => p.id));
const eventIds = new Set<string>();
const dupes = (ids: string[], what: string) => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`duplicate ${what} id: ${id}`);
    seen.add(id);
  }
};
dupes(people.map((p) => p.id), 'person');
dupes(wars.map((w) => w.id), 'war');
dupes(govs.map((g) => g.id), 'government');
dupes(events.map((e) => e.id), 'event');
events.forEach((e) => eventIds.add(e.id));

const yearOk = (d: string) => +d.slice(0, 4) >= 1940 && +d.slice(0, 4) <= 2026;
for (const e of events) {
  if (!yearOk(e.date)) errors.push(`event ${e.id}: date ${e.date} out of range`);
  for (const p of e.people ?? []) if (!personIds.has(p)) errors.push(`event ${e.id}: unknown person "${p}"`);
  for (const r of e.related ?? []) if (!eventIds.has(r)) errors.push(`event ${e.id}: unknown related "${r}"`);
  if (e.also?.includes(e.category)) errors.push(`event ${e.id}: "also" repeats the primary category`);
  if (e.also && new Set(e.also).size !== e.also.length) errors.push(`event ${e.id}: duplicate "also" entries`);
}

// Category balance: a filter is only useful if it neither swallows the site nor shows almost nothing.
const counts = new Map<string, number>();
for (const e of events) for (const c of [e.category, ...(e.also ?? [])]) counts.set(c, (counts.get(c) ?? 0) + 1);
for (const c of category.options) {
  const n = counts.get(c) ?? 0;
  if (n < 8) errors.push(`category ${c}: only ${n} events (min 8)`);
  if (n > events.length * 0.3) errors.push(`category ${c}: ${n} events, over 30% of the site`);
}
for (const w of wars) {
  if (w.end < w.start) errors.push(`war ${w.id}: ends before it starts`);
  for (const p of w.people ?? []) if (!personIds.has(p)) errors.push(`war ${w.id}: unknown person "${p}"`);
}
const sorted = [...govs].sort((a, b) => a.start.localeCompare(b.start));
sorted.forEach((g, i) => {
  if (!personIds.has(g.pm)) errors.push(`government ${g.id}: unknown pm "${g.pm}"`);
  const next = sorted[i + 1];
  if (next && g.end !== next.start) errors.push(`government ${g.id} ends ${g.end} but ${next.id} starts ${next.start}`);
});

for (const [list, what] of [[presidents, 'president'], [chiefs, 'chief of staff']] as const) {
  list.forEach((p, i) => {
    if (p.person && !personIds.has(p.person)) errors.push(`${what} ${p.id}: unknown person "${p.person}"`);
    const next = list[i + 1];
    if (next && p.end !== next.start) errors.push(`${what} ${p.id} ends ${p.end} but ${next.id} starts ${next.start}`);
    if (!next && p.end !== null) errors.push(`${what} ${p.id}: the last one must have end null`);
  });
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`  categories: ${[...counts].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(', ')}`);
console.log(`✓ ${events.length} events, ${wars.length} wars, ${govs.length} governments, ${people.length} people, ${presidents.length} presidents, ${chiefs.length} chiefs of staff`);
