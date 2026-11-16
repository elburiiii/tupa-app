# Placeholders to confirm with Campas Meats

Nothing below was invented as fact. Each item is either a visible placeholder or is clearly labelled **Esimerkki / Example** on the site. Replace them in `/content` before the site goes live.

## Contact & business details (`content/site.json`)
| Field | Current value |
|---|---|
| Phone | `[phone]` |
| Email | `[email]` |
| Instagram | `[instagram handle]` |
| Business ID (Y-tunnus) | `[Y-tunnus / business ID]` |
| Fourth partner farm name | `[Wagyu-cross farm name]` |
| Postal code | not shown (address is "Horninkatu 7, Salo"): add it if wanted |

The map link is a plain Google Maps search for "Horninkatu 7, Salo, Finland".

## Shop status (`content/status.json`)
- Set to `open` for the demo. Confirm the real current state.

## Opening hours (`content/hours.json`): **all example values**
- Weekly hours (Wed–Sat) are illustrative and labelled "Esimerkkiaukioloajat – vahvistetaan / Example hours — to be confirmed".
- Holiday exceptions (Midsummer Eve, 23–26 Dec 2026) are examples, each with `is_example: true`.

## Prices & weights (`content/products.json`, `content/delivery.json`)
- **Every product price** shows as `€XX/kg` or `€XX/pkt` (`price: null`).
- **Every product pack weight** shows as `[XXX g]`, except the two boxes.
- **Delivery prices** for the small and large box show as `€XX`.
- Cart and checkout totals show `€XX` until real prices are filled in.
- Box sizes (5.6 L ≈ 2.5–3.5 kg, 25 L ≈ 10–12 kg) are **from the brief**, not placeholders.

## Product range (`content/products.json`): **illustrative**
All products except the two selection boxes are examples tagged "Esimerkki / Example": Ribeye, New York strip, Wagyu-cross ribeye, House sausage, Italian fennel sausage, Brisket, Butcher's grind. Their stock levels (one "low", one "sold out") are set to show the badges. No product is attributed to a specific farm.

## Delivery details (`content/delivery.json`)
- `[lähetyspäivät]` / `[dispatch days]`
- `[tilausten viimeinen kellonaika]` / `[order cut-off time]`
- `[carrier]`

## Notices (`content/notices.json`): **all examples**
- Midsummer hours 2026 (already expired, so it is never shown; it demonstrates the auto-hide)
- "Christmas pre-orders are open" (1 Nov – 18 Dec 2026)
- "Christmas opening hours" (1–26 Dec 2026, appears by itself on 1 Dec)

## Events (`content/events.json`): **all examples**
- Tampere pop-up, 14 Feb 2026 (past, so hidden: demonstrates the auto-hide)
- Tampere pop-up, 28 Nov 2026
- Christmas market, Salo, 12–13 Dec 2026
- Tampere pop-up, 23 Jan 2027
- Every venue is `[venue]` / `[market name]`. Times are examples.

## Images
Every image is a hatched **placeholder block** with a shot-list caption (e.g. "Photo: Roberto's hands and knife at the butcher block…"). No stock photos and no photos of people are used.

## Copy written for the demo
- Story page (`content/pages/story.*.md`) uses only facts from the brief: founders, New York training, partner farms, sales channels, tagline and the "one bite at a time" line. Have the owners review the wording.
- Short product and cut descriptions are general butchery descriptions, not claims about Campas Meats' specific products.
- **No reviews, awards, certifications, founding year or origin claims** appear anywhere.
