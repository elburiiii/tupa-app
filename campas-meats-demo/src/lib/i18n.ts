export type Lang = 'fi' | 'en';
export const LANGS: Lang[] = ['fi', 'en'];
export const DEFAULT_LANG: Lang = 'fi';

/** Every page has a key; the language switcher swaps to the same key in the other language. */
export const ROUTES = {
  home: { fi: '/', en: '/en/' },
  story: { fi: '/tarina/', en: '/en/story/' },
  cuts: { fi: '/leikkaukset/', en: '/en/cuts/' },
  shop: { fi: '/kauppa/', en: '/en/shop/' },
  checkout: { fi: '/kassa/', en: '/en/checkout/' },
  delivery: { fi: '/toimitus/', en: '/en/delivery/' },
  events: { fi: '/tapahtumat/', en: '/en/events/' },
  contact: { fi: '/yhteystiedot/', en: '/en/contact/' },
} as const;
export type RouteKey = keyof typeof ROUTES;

export const NAV: RouteKey[] = ['story', 'cuts', 'shop', 'delivery', 'events', 'contact'];

export const href = (key: RouteKey, lang: Lang) => ROUTES[key][lang];

/** Pick the _fi or _en field from a content record. */
export function tr<T extends Record<string, unknown>>(obj: T, field: string, lang: Lang): string {
  return String(obj[`${field}_${lang}`] ?? '');
}

export const UI = {
  fi: {
    langName: 'Suomi',
    otherLangLabel: 'In English',
    skip: 'Siirry sisältöön',
    menu: 'Valikko',
    close: 'Sulje',
    nav: { home: 'Etusivu', story: 'Tarinamme', cuts: 'Leikkaukset', shop: 'Kauppa', checkout: 'Kassa', delivery: 'Toimitus & nouto', events: 'Tapahtumat', contact: 'Yhteystiedot' },
    demoBanner: 'Konseptidemo, tekijä Elia Valtonen – ei Campas Meatsin virallinen sivusto.',
    demoTools: 'Demon päivämäärä',
    demoToolsHelp: 'Kokeile, miten sivusto muuttuu eri päivinä.',
    demoReset: 'Tänään',
    example: 'Esimerkki',
    placeholder: 'Täydennettävä',
    status: {
      open: 'Myymälä ja verkkokauppa avoinna',
      'sold-out': 'Loppuunmyyty',
      soldOutUntil: (d: string) => `Loppuunmyyty – uutta lihaa ${d} alkaen`,
      closed: 'Suljettu toistaiseksi',
    },
    stock: { 'in-stock': 'Varastossa', low: 'Vähissä', 'sold-out': 'Loppu' },
    addToCart: 'Lisää koriin',
    unavailable: 'Ei tilattavissa',
    cart: 'Ostoskori',
    cartEmpty: 'Ostoskori on tyhjä.',
    cartTotal: 'Yhteensä (arvio)',
    cartRemove: 'Poista',
    cartQty: 'Määrä',
    toCheckout: 'Siirry kassalle',
    continueShopping: 'Jatka ostoksia',
    perKg: '/kg',
    perPkg: '/pkt',
    approx: 'n.',
    weight: 'Paino',
    nextEvent: 'Seuraava tapahtuma',
    noEvents: 'Uusia tapahtumia julkaistaan pian. Seuraa meitä tai tule käymään myymälässä.',
    allEvents: 'Kaikki tapahtumat',
    readMore: 'Lue lisää',
    hours: 'Aukioloajat',
    closedDay: 'Suljettu',
    exceptions: 'Poikkeusaukiolot',
    exampleHours: 'Esimerkkiaukioloajat – vahvistetaan',
    days: { mon: 'Maanantai', tue: 'Tiistai', wed: 'Keskiviikko', thu: 'Torstai', fri: 'Perjantai', sat: 'Lauantai', sun: 'Sunnuntai' },
    phone: 'Puhelin',
    email: 'Sähköposti',
    address: 'Osoite',
    openMap: 'Avaa kartta',
    opensNewTab: '(avautuu uuteen välilehteen)',
    imagePlaceholder: 'Kuvapaikka',
    noticesLabel: 'Ajankohtaista',
  },
  en: {
    langName: 'English',
    otherLangLabel: 'Suomeksi',
    skip: 'Skip to content',
    menu: 'Menu',
    close: 'Close',
    nav: { home: 'Home', story: 'Our story', cuts: 'Cuts', shop: 'Shop', checkout: 'Checkout', delivery: 'Delivery & pickup', events: 'Events', contact: 'Contact' },
    demoBanner: 'Concept demo by Elia Valtonen — not the official Campas Meats site.',
    demoTools: 'Demo date',
    demoToolsHelp: 'See how the site changes on different days.',
    demoReset: 'Today',
    example: 'Example',
    placeholder: 'To be filled in',
    status: {
      open: 'Shop and online store open',
      'sold-out': 'Sold out',
      soldOutUntil: (d: string) => `Sold out — fresh stock from ${d}`,
      closed: 'Closed until further notice',
    },
    stock: { 'in-stock': 'In stock', low: 'Running low', 'sold-out': 'Sold out' },
    addToCart: 'Add to cart',
    unavailable: 'Not available',
    cart: 'Cart',
    cartEmpty: 'Your cart is empty.',
    cartTotal: 'Total (estimate)',
    cartRemove: 'Remove',
    cartQty: 'Quantity',
    toCheckout: 'Go to checkout',
    continueShopping: 'Continue shopping',
    perKg: '/kg',
    perPkg: '/pack',
    approx: 'approx.',
    weight: 'Weight',
    nextEvent: 'Next event',
    noEvents: 'New dates are announced soon. Follow us or visit the shop.',
    allEvents: 'All events',
    readMore: 'Read more',
    hours: 'Opening hours',
    closedDay: 'Closed',
    exceptions: 'Holiday hours',
    exampleHours: 'Example hours — to be confirmed',
    days: { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' },
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    openMap: 'Open map',
    opensNewTab: '(opens in a new tab)',
    imagePlaceholder: 'Image placeholder',
    noticesLabel: 'Notices',
  },
} as const;

/* ---------- Formatting: one helper per kind, so every page writes things the same way ---------- */

const LOCALE: Record<Lang, string> = { fi: 'fi-FI', en: 'en-GB' };

/** 24-hour times everywhere. Finnish convention uses a period (10.00), English a colon (10:00). */
export function fmtTime(t: string, lang: Lang): string {
  return lang === 'fi' ? t.replace(':', '.') : t;
}
export function fmtTimeRange(a: string, b: string, lang: Lang): string {
  if (!a) return '';
  return b ? `${fmtTime(a, lang)}–${fmtTime(b, lang)}` : fmtTime(a, lang);
}

export function fmtDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { ...opts, timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
}
export function fmtShortDate(iso: string, lang: Lang): string {
  return fmtDate(iso, lang, { day: 'numeric', month: 'numeric', year: 'numeric' });
}

/** Unknown prices render as the visible placeholder €XX. */
export function fmtPrice(price: number | null, lang: Lang): string {
  if (price === null) return '€XX';
  return new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: 'EUR' }).format(price);
}

export function fmtWeight(min: number | null, max: number | null, lang: Lang): string {
  if (min === null) return '[XXX g]';
  const f = (g: number) =>
    g >= 1000 ? `${new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 1 }).format(g / 1000)}` : `${g}`;
  const unit = min >= 1000 ? 'kg' : 'g';
  return max && max !== min ? `${f(min)}–${f(max)} ${unit}` : `${f(min)} ${unit}`;
}
