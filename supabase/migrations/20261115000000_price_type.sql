-- How a contract is priced. For spot-price electricity (pörssisähkö) the energy
-- price changes hourly, so we store the fixed parts instead:
--   spot_margin_cents_kwh = margin (marginaali), c/kWh
--   price_amount          = monthly fee (perusmaksu), with price_period = 'month'
create type public.price_type as enum ('fixed', 'spot', 'variable');

alter table public.contracts
  add column price_type public.price_type not null default 'fixed',
  add column spot_margin_cents_kwh numeric(6,3) check (spot_margin_cents_kwh >= 0),
  add constraint contracts_spot_margin_only_for_spot
    check (price_type = 'spot' or spot_margin_cents_kwh is null);
