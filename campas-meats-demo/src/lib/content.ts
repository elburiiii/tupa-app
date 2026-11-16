/**
 * Loads every file in /content and validates it. If an owner makes a typo
 * (e.g. a date like "2026-13-01" or a status of "opne"), the build stops with a
 * message naming the file and field, instead of publishing a broken page.
 */
import { z } from 'zod';
import siteRaw from '../../content/site.json';
import statusRaw from '../../content/status.json';
import hoursRaw from '../../content/hours.json';
import noticesRaw from '../../content/notices.json';
import eventsRaw from '../../content/events.json';
import productsRaw from '../../content/products.json';
import deliveryRaw from '../../content/delivery.json';
import cutsRaw from '../../content/cuts.json';
import { todayInFinland, isActive, isNotExpired } from './dates';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date written as YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().startsWith(s), 'is not a real calendar date');
const time24 = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be a 24-hour time written as HH:MM');
const optTime = z.union([z.literal(''), time24]);
const optDate = z.union([z.literal(''), isoDate]);

const SiteSchema = z.object({
  name: z.string(),
  tagline_fi: z.string(),
  tagline_en: z.string(),
  founders: z.string(),
  address_street: z.string(),
  address_city: z.string(),
  address_country_fi: z.string(),
  address_country_en: z.string(),
  map_url: z.string().url(),
  phone: z.string(),
  email: z.string(),
  instagram: z.string(),
  business_id: z.string(),
  partner_farms: z.array(z.string()),
});

// One field, three mutually exclusive states. "sold-out" must say until when.
const StatusSchema = z
  .object({
    state: z.enum(['open', 'sold-out', 'closed']),
    until: optDate,
    note_fi: z.string().default(''),
    note_en: z.string().default(''),
  })
  .superRefine((s, ctx) => {
    if (s.state === 'sold-out' && !s.until) {
      ctx.addIssue({ code: 'custom', path: ['until'], message: '"sold-out" needs an until date (YYYY-MM-DD)' });
    }
    if (s.state !== 'sold-out' && s.until) {
      ctx.addIssue({ code: 'custom', path: ['until'], message: 'until is only used with "sold-out"; clear it' });
    }
  });

const HoursSchema = z.object({
  is_example: z.boolean(),
  regular: z
    .array(z.object({ day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']), open: optTime, close: optTime }))
    .length(7),
  exceptions: z.array(
    z.object({
      date: isoDate,
      open: optTime,
      close: optTime,
      label_fi: z.string(),
      label_en: z.string(),
      is_example: z.boolean().default(false),
    }),
  ),
});

const NoticeSchema = z
  .object({
    id: z.string(),
    type: z.enum(['hours', 'popup', 'stock', 'info']),
    start: isoDate,
    end: isoDate,
    title_fi: z.string(),
    title_en: z.string(),
    body_fi: z.string(),
    body_en: z.string(),
    link: z.enum(['', 'shop', 'events', 'contact', 'delivery', 'cuts', 'story']).default(''),
    is_example: z.boolean().default(false),
  })
  .refine((n) => n.end >= n.start, { message: 'end is before start', path: ['end'] });

const EventSchema = z
  .object({
    id: z.string(),
    date: isoDate,
    end_date: optDate,
    start_time: optTime,
    end_time: optTime,
    kind: z.enum(['market', 'popup', 'tasting', 'other']),
    title_fi: z.string(),
    title_en: z.string(),
    venue: z.string(),
    city: z.string(),
    map_url: z.union([z.literal(''), z.string().url()]),
    body_fi: z.string(),
    body_en: z.string(),
    is_example: z.boolean().default(false),
  })
  .refine((e) => !e.end_date || e.end_date >= e.date, { message: 'end_date is before date', path: ['end_date'] });

const ProductSchema = z.object({
  id: z.string(),
  category: z.enum(['steaks', 'sausages', 'selections', 'boxes']),
  name_fi: z.string(),
  name_en: z.string(),
  desc_fi: z.string(),
  desc_en: z.string(),
  price: z.number().positive().nullable(),
  price_unit: z.enum(['kg', 'pkg']),
  weight_min_g: z.number().positive().nullable(),
  weight_max_g: z.number().positive().nullable(),
  stock: z.enum(['in-stock', 'low', 'sold-out']),
  cut: z.string().default(''),
  image_label_fi: z.string(),
  image_label_en: z.string(),
  is_example: z.boolean().default(false),
});

const DeliverySchema = z.object({
  options: z.array(
    z.object({
      id: z.string(),
      title_fi: z.string(),
      title_en: z.string(),
      body_fi: z.string(),
      body_en: z.string(),
      price: z.number().nonnegative().nullable(),
      free: z.boolean(),
    }),
  ),
  dispatch_days_fi: z.string(),
  dispatch_days_en: z.string(),
  carrier: z.string(),
  order_cutoff_fi: z.string(),
  order_cutoff_en: z.string(),
});

const CutSchema = z.object({
  id: z.enum(['neck', 'chuck', 'rib', 'shortloin', 'tenderloin', 'sirloin', 'round', 'brisket', 'plate', 'flank', 'shank']),
  name_fi: z.string(),
  name_en: z.string(),
  us_name: z.string(),
  body_fi: z.string(),
  body_en: z.string(),
  best_fi: z.string(),
  best_en: z.string(),
});

function load<T extends z.ZodTypeAny>(file: string, schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`\n\ncontent/${file} has a problem:\n${lines.join('\n')}\n`);
  }
  return result.data;
}

export const site = load('site.json', SiteSchema, siteRaw);
export const status = load('status.json', StatusSchema, statusRaw);
export const hours = load('hours.json', HoursSchema, hoursRaw);
export const notices = load('notices.json', z.object({ notices: z.array(NoticeSchema) }), noticesRaw).notices;
export const events = load('events.json', z.object({ events: z.array(EventSchema) }), eventsRaw)
  .events.slice()
  .sort((a, b) => a.date.localeCompare(b.date));
export const products = load('products.json', z.object({ products: z.array(ProductSchema) }), productsRaw).products;
export const delivery = load('delivery.json', DeliverySchema, deliveryRaw);
export const cuts = load('cuts.json', z.object({ cuts: z.array(CutSchema) }), cutsRaw).cuts;

export type Notice = z.infer<typeof NoticeSchema>;
export type EventItem = z.infer<typeof EventSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Status = z.infer<typeof StatusSchema>;

// Unique ids, so cart keys and anchors never collide.
for (const [file, list] of [
  ['notices.json', notices],
  ['events.json', events],
  ['products.json', products],
] as const) {
  const seen = new Set<string>();
  for (const item of list) {
    if (seen.has(item.id)) throw new Error(`content/${file}: id "${item.id}" is used twice`);
    seen.add(item.id);
  }
}

/** The date the build ran (Finnish time). Pages only ship items that hadn't expired by now. */
export const BUILD_DAY = todayInFinland();

export const eventEnd = (e: EventItem) => e.end_date || e.date;

/** Notices not yet expired at build time. Future ones are shipped hidden so they can switch on by themselves. */
export const liveNotices = notices
  .filter((n) => isNotExpired(n.end, BUILD_DAY))
  .sort((a, b) => a.start.localeCompare(b.start));
export const noticeVisibleAtBuild = (n: Notice) => isActive(n.start, n.end, BUILD_DAY);

export const upcomingEvents = events.filter((e) => isNotExpired(eventEnd(e), BUILD_DAY));

export const upcomingExceptions = hours.exceptions
  .filter((x) => isNotExpired(x.date, BUILD_DAY))
  .sort((a, b) => a.date.localeCompare(b.date));

/**
 * Resolve the single shop status for a given day. A "sold-out" whose until-date has
 * arrived becomes "open", so the site can never say "sold out until" a date in the past.
 */
export function effectiveStatus(today: string): 'open' | 'sold-out' | 'closed' {
  if (status.state === 'sold-out' && status.until && today >= status.until) return 'open';
  return status.state;
}
