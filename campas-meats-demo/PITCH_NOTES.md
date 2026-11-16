# Pitch notes: current site → concept demo

Talking points, one per problem raised in the brief about the current Wix site.

| Problem on the current site | How the demo fixes it | Show it live |
|---|---|---|
| **Expired notices still showing** (Midsummer schedule, a February pop-up) | Every notice and event has an end date and **removes itself**: at build time *and* again in the visitor's browser, so it works even if nobody rebuilds for months. | Both stale items from the old site are in the demo data, and neither appears. Then use *Demo tools → Demo date* = 1 Dec: "Christmas hours" appears by itself. Set 1 Mar 2027: notices vanish and Events shows "new dates soon". |
| **Contradictory sales status** ("closed" and "coming soon" at once) | **One** status field: `open` / `sold out until <date>` / `closed`. Every part of the site reads it, so only one state can ever show. "Sold out until" reopens by itself on its date. A typo or missing date stops the build. | *Demo tools → Shop status*: flip through the three states. The status bar, shop banner, product buttons and checkout all change together. |
| **No prices** | Every product card has price, weight and a stock badge (*In stock / Running low / Sold out*). Prices are one number in a file. | Shop page. Placeholders show as `€XX/kg` until the owners fill them in. |
| **No contact details** | A Contact page with phone, email, address, a map link and opening hours, plus the address and hours in every footer. | Contact page. Holiday exceptions show above regular hours and expire by themselves. |
| **Leftover "[Events / Markets]" placeholder** | A real Events page built from a dated list. Past events hide; the next event is featured on the home page. When the list is empty, a friendly message replaces a blank or stale section. | Home: "Next event". Events page. |
| **Hard for owners to update** | All content is in plain files in `/content`, edited through a simple form-based CMS (Pages CMS) or a Google Sheet. Mistakes are caught before publishing. | Open `content/events.json` next to the Events page. Show the `.pages.yml` forms idea. |
| **Generic look** | A custom old-school butcher-shop identity: oxblood, cream and charcoal, a confident serif, rubber-stamp badges, double rules and a hand-drawn interactive beef chart. | Cuts page: click "Short loin" for the New York strip and its link into the shop. |
| **Finnish/English** | Full FI/EN with a switcher that keeps you on the same page. Finnish is the default, and titles and descriptions are in the page's language. | The EN/FI toggle in the header. |
| **Mobile & accessibility** | Mobile-first layout, keyboard-operable everything, visible focus rings, AA contrast, consistent 24-hour times. | Tab through the cut chart on a phone-width window. |
| **Online sales** | Cart + checkout flow with pickup (shop / event) and the two cold-box sizes. Paytrail or Stripe slots in at a marked spot. | Add a box → Checkout → "Place demo order". |

## Opening line
"Your current site makes customers guess: is it open, what does it cost, when's the next market? This version answers all three on the home page, and it can't go out of date, because every notice carries its own expiry date."

## Be upfront about
- This is a **concept**: prices, hours, events and contact details are placeholders (see `PLACEHOLDERS.md`).
- Real payments need a Paytrail or Stripe account and a small server function. That is not part of the demo.
