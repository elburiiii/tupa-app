/**
 * Keeps dated content honest in the browser, independent of when the site was last built.
 *
 *  [data-start][data-end]  shown only while start <= today <= end   (notices)
 *  [data-expires]          hidden once today > expires               (events, holiday hours)
 *  [data-first-only]       container: only its first still-valid child is shown (home "next event")
 *  [data-fresh-list]       container: [data-empty-state] child shows when nothing is left
 *  [data-notice-region]    hidden when it has no visible notices
 *  <html data-shop>        the one shop status; "sold-out" turns into "open" on its until-date
 *
 * "today" is the date in Finland. During a pitch it can be overridden with ?demoDate=YYYY-MM-DD
 * or the Demo tools panel (stored for this tab only).
 */
const DATE_KEY = 'campas-demo-date';
const STATUS_KEY = 'campas-demo-status';
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function finlandToday(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' }).format(new Date());
}
function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function store(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}

export function currentDay(): string {
  const fromUrl = new URLSearchParams(location.search).get('demoDate');
  if (fromUrl && ISO.test(fromUrl)) store()?.setItem(DATE_KEY, fromUrl);
  const demo = store()?.getItem(DATE_KEY);
  return demo && ISO.test(demo) ? demo : finlandToday();
}

function fmtUntil(iso: string, lang: string) {
  return new Intl.DateTimeFormat(lang === 'fi' ? 'fi-FI' : 'en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
}

export function apply() {
  const today = currentDay();
  const html = document.documentElement;

  // ---- Shop status (single source of truth) ----
  const override = store()?.getItem(STATUS_KEY) || '';
  let state = override || html.dataset.shopState || 'open';
  let until = override ? (override === 'sold-out' ? addDays(today, 7) : '') : html.dataset.shopUntil || '';
  if (state === 'sold-out' && until && today >= until) { state = 'open'; until = ''; }
  html.dataset.shop = state;
  document.querySelectorAll<HTMLElement>('[data-until-text]').forEach((el) => {
    const lang = el.dataset.lang || 'fi';
    if (until) el.textContent = lang === 'fi' ? `Loppuunmyyty – uutta lihaa ${fmtUntil(until, lang)} alkaen` : `Sold out — fresh stock from ${fmtUntil(until, lang)}`;
    else el.textContent = lang === 'fi' ? 'Loppuunmyyty' : 'Sold out';
  });

  // ---- Dated items ----
  document.querySelectorAll<HTMLElement>('[data-start][data-end]').forEach((el) => {
    el.hidden = !(el.dataset.start! <= today && today <= el.dataset.end!);
  });
  document.querySelectorAll<HTMLElement>('[data-expires]').forEach((el) => {
    el.hidden = today > el.dataset.expires!;
  });
  document.querySelectorAll<HTMLElement>('[data-first-only]').forEach((box) => {
    let shown = false;
    box.querySelectorAll<HTMLElement>(':scope > [data-expires]').forEach((el) => {
      if (!el.hidden && !shown) shown = true;
      else el.hidden = true;
    });
  });
  document.querySelectorAll<HTMLElement>('[data-fresh-list]').forEach((box) => {
    const any = Array.from(box.querySelectorAll<HTMLElement>('[data-expires]')).some((el) => !el.hidden);
    const empty = box.querySelector<HTMLElement>('[data-empty-state]');
    if (empty) empty.hidden = any;
    else box.hidden = !any; // no empty message defined: hide the whole block (e.g. holiday hours)
    const list = box.querySelector<HTMLElement>('[data-fresh-items]');
    if (list) list.hidden = !any;
  });
  document.querySelectorAll<HTMLElement>('[data-notice-region]').forEach((region) => {
    region.hidden = !Array.from(region.querySelectorAll<HTMLElement>('[data-start]')).some((el) => !el.hidden);
  });

  // ---- Demo tool inputs reflect the current state ----
  const dateInput = document.querySelector<HTMLInputElement>('[data-demo-date]');
  if (dateInput) dateInput.value = today;
  const statusSelect = document.querySelector<HTMLSelectElement>('[data-demo-status]');
  if (statusSelect) statusSelect.value = override;

  document.dispatchEvent(new CustomEvent('campas:refresh', { detail: { today, state } }));
}

function wireDemoTools() {
  document.querySelector<HTMLInputElement>('[data-demo-date]')?.addEventListener('change', (e) => {
    const v = (e.target as HTMLInputElement).value;
    if (ISO.test(v)) store()?.setItem(DATE_KEY, v);
    apply();
  });
  document.querySelector('[data-demo-reset]')?.addEventListener('click', () => {
    store()?.removeItem(DATE_KEY);
    store()?.removeItem(STATUS_KEY);
    const url = new URL(location.href);
    if (url.searchParams.has('demoDate')) { url.searchParams.delete('demoDate'); history.replaceState(null, '', url); }
    apply();
  });
  document.querySelector<HTMLSelectElement>('[data-demo-status]')?.addEventListener('change', (e) => {
    const v = (e.target as HTMLSelectElement).value;
    if (v) store()?.setItem(STATUS_KEY, v); else store()?.removeItem(STATUS_KEY);
    apply();
  });
}

wireDemoTools();
apply();
