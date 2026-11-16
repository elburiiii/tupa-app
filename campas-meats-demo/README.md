# Campas Meats — concept redesign (sales demo)

> **Concept demo by Elia Valtonen — not the official Campas Meats site.**
> Private pitch material. Every page carries `noindex, nofollow` and `robots.txt` blocks all crawlers.
> No real payments, no real orders, no invented prices or contact details (see `PLACEHOLDERS.md`).

Astro + Tailwind CSS, fully static output. Finnish is the default language (`/`), English lives under `/en/`.

## Run it

Requires Node.js 22.23.4 or newer (Astro 7).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/ (also validates all content)
npm run preview    # serve the built site
```

### Demo tools (for the pitch)

The fixed banner at the bottom has a **Demo tools** panel:

- **Demo date**: pretend it is another day. Notices, events and holiday hours appear and disappear live. You can also add `?demoDate=2026-12-24` to any URL.
- **Shop status**: flip between *open*, *sold out* and *closed* to show that only one state is ever shown.

Both only affect the current browser tab. **Today** resets them.

---

## How the owners update the site

All editable content is in plain files in **`/content`**. Nothing in `src/` needs touching for day-to-day updates.

| What | File | Notes |
|---|---|---|
| Shop open / sold out / closed | `content/status.json` | **The one switch.** See below. |
| Notices (holiday hours, pop-ups, stock news) | `content/notices.json` | Each has `start` and `end`; it disappears after `end`. |
| Markets & pop-ups | `content/events.json` | Past events hide themselves; the next one shows on the home page. |
| Products, prices, weights, stock | `content/products.json` | `price: null` shows as `€XX`. |
| Opening hours + holiday exceptions | `content/hours.json` | 24-hour `HH:MM`. Exceptions disappear after their date. |
| Delivery options & prices | `content/delivery.json` | |
| Address, phone, email, farms | `content/site.json` | |
| Beef cut chart texts | `content/cuts.json` | |
| "Our story" text | `content/pages/story.fi.md`, `story.en.md` | Plain Markdown. |

Every text field comes in pairs: `title_fi` / `title_en`, `body_fi` / `body_en`, and so on.
Each JSON file starts with a `_help` line explaining its fields.

### Shop status: one field, no contradictions

```json
{ "state": "sold-out", "until": "2026-12-01", "note_fi": "", "note_en": "" }
```

- `state` is exactly one of `open`, `sold-out` or `closed`. The status bar, shop page, product buttons and checkout all read this one value, so the site can never say "closed" and "coming soon" at the same time.
- `sold-out` **requires** an `until` date and **switches back to `open` by itself** on that date.
- Notices cannot open or close the shop. They are information only.

### Notices

```json
{
  "id": "christmas-hours-2026",
  "type": "hours",
  "start": "2026-12-01",
  "end": "2026-12-26",
  "title_fi": "Joulun aukioloajat", "title_en": "Christmas opening hours",
  "body_fi": "…", "body_en": "…",
  "link": "contact",
  "is_example": false
}
```

A notice shows from `start` to `end`, both days included, and then disappears. You can add notices weeks in advance: they appear by themselves on their start date. `link` can be `shop`, `events`, `contact`, `delivery`, `cuts`, `story` or empty.

### Events

Add a row with `date` (and optional `end_date` for multi-day markets), `start_time`/`end_time` in `HH:MM`, and Finnish and English titles. Order does not matter. The site sorts by date, hides finished events, and puts the next one on the home page. With no upcoming events, a friendly "new dates soon" message shows instead of an empty list or a stale one.

### Stock & prices

In `products.json` set `stock` to `in-stock`, `low` or `sold-out`, and `price` to a number in euros (`24.9`). `price_unit` is `kg` or `pkg`. A sold-out product keeps its card but can't be added to the cart.

### Why it can't go stale

1. **At build time** anything already expired is left out of the HTML.
2. **In the browser**, a tiny script (`src/scripts/freshness.ts`) re-checks every date against *today in Finland* on each page load. So even if nobody rebuilds the site for months, expired notices, past events and old holiday hours still disappear, and a "sold out until" past its date turns back into "open".
3. Optionally, a **scheduled nightly rebuild** (Netlify/Vercel/Cloudflare build hook or a GitHub Actions `schedule:` trigger) keeps the HTML itself tidy too.

### Mistakes are caught before they go live

`npm run build` validates every file (`src/lib/content.ts`). A typo like `"state": "opne"`, a date like `2026-13-01`, an `end` before its `start`, or `sold-out` without an `until` date stops the build with a plain message:

```
content/status.json has a problem:
  • until: "sold-out" needs an until date (YYYY-MM-DD)
```

So a broken edit never replaces the live site.

---

## Letting non-technical owners edit

Both options below need no coding from the owners. With either one, the hosting service rebuilds the site automatically after each change.

### Option A: git-based editor (recommended)

[Pages CMS](https://pagescms.org) is free and runs in the browser. The owners sign in with GitHub and edit notices, events, products and the shop status through simple forms (date pickers, dropdowns for `open/sold-out/closed`). Each save is a git commit, and the host (Netlify, Vercel, Cloudflare Pages) rebuilds in about a minute.

A starter config is included: **`.pages.yml`**. Check the field options against the Pages CMS docs when setting it up for real. If this folder becomes its own repository, remove the `campas-meats-demo/` prefix from the paths. Decap CMS or TinaCMS would work the same way over the same files.

### Option B: Google Sheet

If the owners would rather use a spreadsheet:

1. Make a Sheet with one tab each for events, notices and products. The column headers are exactly the JSON keys (`id`, `date`, `start_time`, `title_fi`, `title_en` …).
2. Use **File → Share → Publish to web**, choose the tab, then **CSV**, and copy the link.
3. Import it:
   ```bash
   npm run sheet-import -- events "https://docs.google.com/…/pub?gid=…&output=csv"
   ```
   This rewrites `content/events.json`. Run it as a step in the hosting build (or a scheduled GitHub Action) so a nightly rebuild always picks up the latest Sheet. The build's validation still applies: a bad cell stops the build and names the row's field, and the previous good version stays live.

---

## Project map

```
content/              ← everything owners edit (JSON + Markdown)
src/lib/content.ts    ← loads + validates /content, date rules
src/lib/i18n.ts       ← routes FI/EN, UI strings, date/time/price formatting (24-hour times)
src/scripts/          ← freshness (dates/status), cart (demo only), menu
src/components/       ← UI pieces incl. CutDiagram.astro (hand-drawn SVG)
src/components/pages/ ← one component per page, rendered in both languages
src/pages/            ← thin routes: /tarina/ ↔ /en/story/ etc.
scripts/sheet-to-json.mjs ← Google Sheet CSV → content JSON
```

### Payments

Cart and checkout are **UI only**. They are stored in the browser and send nothing. `src/components/pages/Checkout.astro` has a clearly marked comment block showing where **Paytrail** (common in Finland) or **Stripe** Checkout would plug in, via a small serverless function that recalculates prices from `content/products.json`.

### Accessibility notes

Semantic landmarks, skip link, one `h1` per page, visible 3 px focus rings, AA colour contrast (checked with axe-core: no WCAG 2.1 A/AA violations on the tested pages), keyboard-operable cut chart (each region is a toggle button, plus a duplicate button list), described image placeholders, `lang` on every page and on the language switcher, and consistent 24-hour times (`10.00–17.00` in Finnish, `10:00–17:00` in English).
