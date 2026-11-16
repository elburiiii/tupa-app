#!/usr/bin/env node
/**
 * Google Sheet → /content JSON.
 *
 * Owners keep events / notices / products in a Google Sheet (one tab each, column names
 * identical to the JSON keys, e.g. id, date, start_time, title_fi, title_en ...).
 * In Sheets: File → Share → Publish to web → choose the tab → CSV. Copy that URL.
 *
 * Usage:
 *   npm run sheet-import -- events   <csv-url-or-file>
 *   npm run sheet-import -- notices  <csv-url-or-file>
 *   npm run sheet-import -- products <csv-url-or-file>
 *
 * The script rewrites the list inside content/<kind>.json and keeps its _help text.
 * Run `npm run build` afterwards: the build validates every row and names any bad cell.
 */
import { readFile, writeFile } from 'node:fs/promises';

const [kind, src] = process.argv.slice(2);
const LISTS = { events: 'events', notices: 'notices', products: 'products' };
if (!LISTS[kind] || !src) {
  console.error('Usage: npm run sheet-import -- <events|notices|products> <csv-url-or-file>');
  process.exit(1);
}

const text = /^https?:\/\//.test(src) ? await (await fetch(src)).text() : await readFile(src, 'utf8');

/** Minimal RFC 4180 CSV parser (quoted fields, commas and newlines inside quotes). */
function parseCSV(s) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

const NUMBER_OR_NULL = new Set(['price', 'weight_min_g', 'weight_max_g']);
const BOOLEAN = new Set(['is_example']);

const [header, ...body] = parseCSV(text);
const items = body.map((r) => {
  const o = {};
  header.forEach((h, i) => {
    const key = h.trim();
    if (!key) return;
    let v = (r[i] ?? '').trim();
    if (NUMBER_OR_NULL.has(key)) v = v === '' ? null : Number(v.replace(',', '.'));
    else if (BOOLEAN.has(key)) v = /^(true|yes|kyllä|x|1)$/i.test(v);
    o[key] = v;
  });
  return o;
});

const file = new URL(`../content/${kind}.json`, import.meta.url);
const current = JSON.parse(await readFile(file, 'utf8'));
current[LISTS[kind]] = items;
await writeFile(file, JSON.stringify(current, null, 2) + '\n');
console.log(`Wrote ${items.length} ${kind} to content/${kind}.json. Now run: npm run build`);
