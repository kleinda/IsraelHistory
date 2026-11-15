// Looks up every `wiki` title on English Wikipedia and stores, per item:
// a freely-licensed lead image (pilicense=free) and the Hebrew article title.
// Output: src/data/images.json. Run with `npm run images`.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(import.meta.dirname, '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const UA = 'IsraelHistoryTimeline/0.1 (educational, non-commercial)';

const items = [
  ...readdirSync(join(DATA, 'events')).flatMap((f) =>
    read(join('events', f)).map((e) => ({ key: `event:${e.id}`, wiki: e.wiki })),
  ),
  ...read('wars.json').map((w) => ({ key: `war:${w.id}`, wiki: w.wiki })),
  ...read('people.json').map((p) => ({ key: `person:${p.id}`, wiki: p.wiki })),
].filter((i) => i.wiki);

const titles = [...new Set(items.map((i) => i.wiki))];
const info = new Map(); // requested title -> { src, file, heTitle, enTitle }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (res.status !== 429 || attempt > 5) throw new Error(`${res.status} ${url}`);
    await sleep(2000 * 2 ** attempt);
  }
}

/** For titles that don't exist, take the top search hit; logged so it can be reviewed. */
async function search(title) {
  const params = new URLSearchParams({ action: 'query', format: 'json', list: 'search', srsearch: title, srlimit: '1' });
  const json = await get(`https://en.wikipedia.org/w/api.php?${params}`);
  return json.query.search[0]?.title;
}

async function query(batch) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    titles: batch.join('|'),
    prop: 'pageimages|langlinks',
    piprop: 'thumbnail|name',
    pithumbsize: '1200',
    pilicense: 'free',
    lllang: 'he',
    lllimit: 'max',
  });
  const pages = new Map();
  let cont = {};
  let alias = new Map(batch.map((t) => [t, t]));
  do {
    const json = await get(`https://en.wikipedia.org/w/api.php?${params}&${new URLSearchParams(cont)}`);
    // Map normalized/redirected titles back to what we asked for.
    for (const step of [...(json.query.normalized ?? []), ...(json.query.redirects ?? [])]) {
      for (const [orig, cur] of alias) if (cur === step.from) alias.set(orig, step.to);
    }
    for (const p of json.query.pages ?? []) {
      const prev = pages.get(p.title) ?? {};
      pages.set(p.title, {
        missing: p.missing,
        src: prev.src ?? p.thumbnail?.source,
        file: prev.file ?? p.pageimage,
        heTitle: prev.heTitle ?? p.langlinks?.[0]?.title,
      });
    }
    cont = json.continue ?? null;
  } while (cont);

  const missing = [];
  for (const [orig, cur] of alias) {
    const p = pages.get(cur);
    if (!p || p.missing) missing.push(orig);
    else info.set(orig, { ...p, enTitle: cur });
  }
  return missing;
}

const missing = [];
for (let i = 0; i < titles.length; i += 20) {
  missing.push(...(await query(titles.slice(i, i + 20))));
  process.stdout.write(`\r${Math.min(i + 20, titles.length)}/${titles.length}`);
  await sleep(500);
}
console.log();

for (const orig of missing) {
  const found = await search(orig);
  if (!found) {
    console.warn(`  ! no article for: ${orig}`);
    continue;
  }
  console.warn(`  ~ ${orig}  →  ${found}`);
  const before = info.size;
  await query([found]);
  if (info.has(found)) info.set(orig, info.get(found));
  else if (info.size === before) console.warn(`  ! could not load: ${found}`);
  await sleep(500);
}

const out = {};
let withImage = 0;
for (const { key, wiki } of items) {
  const p = info.get(wiki);
  if (!p) continue;
  out[key] = {
    ...(p.src && { src: p.src, page: `https://en.wikipedia.org/wiki/File:${encodeURIComponent(p.file)}` }),
    ...(p.heTitle && { heTitle: p.heTitle }),
    enTitle: p.enTitle,
  };
  if (p.src) withImage++;
}
writeFileSync(join(DATA, 'images.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`✓ ${Object.keys(out).length} entries, ${withImage} with a free image`);
