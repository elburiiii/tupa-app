/**
 * DEMO CART: client-side only. Stored in localStorage; no order is ever sent anywhere.
 */
type Item = { name: string; price: number | null; unit: 'kg' | 'pkg'; weight: string; min: number | null; max: number | null; stock: string };
type Data = { catalog: Record<string, Item>; strings: { empty: string; remove: string; qty: string; perKg: string; perPkg: string; lang: 'fi' | 'en' } };

const KEY = 'campas-demo-cart';
const dataEl = document.getElementById('cart-catalog');
const data: Data | null = dataEl ? JSON.parse(dataEl.textContent || '{}') : null;

function read(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function write(cart: Record<string, number>) {
  try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {}
  render();
}

const money = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === 'fi' ? 'fi-FI' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(n);

/** Estimated line price. Unknown prices (still placeholders) stay unknown, so totals show €XX. */
function linePrice(item: Item, qty: number): number | null {
  if (item.price === null) return null;
  if (item.unit === 'pkg') return item.price * qty;
  if (item.min === null) return null;
  const avgKg = ((item.min + (item.max ?? item.min)) / 2) / 1000;
  return item.price * avgKg * qty;
}

export function cartLines() {
  if (!data) return [];
  const cart = read();
  return Object.entries(cart)
    .filter(([id, q]) => data.catalog[id] && q > 0)
    .map(([id, qty]) => ({ id, qty, item: data.catalog[id] }));
}

export function cartTotal(): number | null {
  let total = 0;
  for (const { item, qty } of cartLines()) {
    const p = linePrice(item, qty);
    if (p === null) return null;
    total += p;
  }
  return total;
}

function lineHTML(id: string, qty: number, item: Item, s: Data['strings']) {
  const unit = item.price === null ? `€XX${item.unit === 'kg' ? s.perKg : s.perPkg}` : `${money(item.price, s.lang)}${item.unit === 'kg' ? s.perKg : s.perPkg}`;
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  return `<li class="py-4">
    <div class="flex justify-between gap-4">
      <div><p class="font-serif text-lg leading-tight">${esc(item.name)}</p>
      <p class="text-sm text-ink-muted">${esc(item.weight)} · ${unit}</p></div>
      <button type="button" class="h-11 shrink-0 text-sm font-semibold text-oxblood underline" data-remove="${id}">${s.remove}<span class="sr-only">: ${esc(item.name)}</span></button>
    </div>
    <div class="mt-2 flex items-center gap-1" role="group" aria-label="${s.qty}: ${esc(item.name)}">
      <button type="button" class="h-11 w-11 border-2 border-oxblood text-lg font-bold text-oxblood" data-dec="${id}" aria-label="−1">−</button>
      <output class="w-10 text-center font-semibold tabular-nums" aria-live="polite">${qty}</output>
      <button type="button" class="h-11 w-11 border-2 border-oxblood text-lg font-bold text-oxblood" data-inc="${id}" aria-label="+1">+</button>
    </div>
  </li>`;
}

function render() {
  if (!data) return;
  const lines = cartLines();
  const count = lines.reduce((n, l) => n + l.qty, 0);
  document.querySelectorAll('[data-cart-count]').forEach((el) => (el.textContent = String(count)));
  const total = cartTotal();
  const totalText = total === null ? '€XX' : money(total, data.strings.lang);

  document.querySelectorAll<HTMLElement>('[data-cart-lines]').forEach((ul) => {
    ul.innerHTML = lines.map((l) => lineHTML(l.id, l.qty, l.item, data.strings)).join('');
  });
  document.querySelectorAll<HTMLElement>('[data-cart-empty]').forEach((el) => (el.hidden = lines.length > 0));
  document.querySelectorAll<HTMLElement>('[data-cart-total]').forEach((el) => (el.textContent = totalText));
  document.querySelectorAll<HTMLElement>('[data-checkout-link]').forEach((el) => el.toggleAttribute('hidden', lines.length === 0));
  document.querySelectorAll<HTMLElement>('[data-needs-items]').forEach((el) => (el.hidden = lines.length === 0));
}

function change(id: string, delta: number) {
  const cart = read();
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  if (!cart[id]) delete cart[id];
  write(cart);
}

// ---- Event wiring ----
document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-add-to-cart],[data-inc],[data-dec],[data-remove]');
  if (!t) return;
  if (t.dataset.addToCart) {
    if ((t as HTMLButtonElement).disabled) return;
    change(t.dataset.addToCart, 1);
    const live = document.getElementById('cart-live');
    if (live) live.textContent = t.dataset.addedMsg || '';
  } else if (t.dataset.inc) change(t.dataset.inc, 1);
  else if (t.dataset.dec) change(t.dataset.dec, -1);
  else if (t.dataset.remove) change(t.dataset.remove, -Infinity);
});

const dialog = document.getElementById('cart-dialog') as HTMLDialogElement | null;
document.querySelectorAll('[data-cart-open]').forEach((b) => b.addEventListener('click', () => dialog?.showModal()));
dialog?.querySelectorAll('[data-cart-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));
dialog?.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

/** Add-to-cart is only possible when the shop is open AND the product is in stock. */
document.addEventListener('campas:refresh', (e) => {
  const state = (e as CustomEvent).detail.state as string;
  document.querySelectorAll<HTMLButtonElement>('[data-add-to-cart]').forEach((b) => {
    const blocked = state !== 'open' || b.dataset.stock === 'sold-out';
    b.disabled = blocked;
    const label = b.querySelector('[data-btn-label]');
    if (label) label.textContent = blocked ? b.dataset.labelOff || '' : b.dataset.labelOn || '';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-place-order]').forEach((b) => (b.disabled = state !== 'open'));
});

window.addEventListener('storage', (e) => { if (e.key === KEY) render(); });
render();
