-- 1. Spread the seeded demo records over the last ~10 weeks so time-series analytics are meaningful.
with seeded as (
  select id, row_number() over (order by id) as rn
  from public.land_records
  where created_at = timestamptz '2026-08-31 16:57:37.114257+00'
)
update public.land_records lr
set created_at = now() - ((s.rn * 5 + 3) || ' days')::interval + ((s.rn * 3) || ' hours')::interval
from seeded s
where lr.id = s.id;

-- 2. Realign audit events for those records to sit just after the (new) record timestamp.
with ordered as (
  select ae.id, row_number() over (partition by ae.record_id order by ae.created_at, ae.id) as rn, lr.created_at as base
  from public.audit_events ae
  join public.land_records lr on lr.id = ae.record_id
)
update public.audit_events ae
set created_at = o.base + ((o.rn - 1) * 40 || ' seconds')::interval
from ordered o
where ae.id = o.id and ae.created_at < o.base;

-- 3. Realign officer decisions to fall after their record's creation.
update public.officer_decisions od
set created_at = lr.created_at + interval '2 days'
from public.land_records lr
where lr.id = od.record_id and od.created_at < lr.created_at;

-- 4. Give the demo a spread of named revenue officers instead of a single "Demo Officer".
with numbered as (
  select id, row_number() over (order by created_at) as rn from public.officer_decisions
)
update public.officer_decisions od
set officer_name = case (n.rn % 3)
  when 0 then 'Tehsildar A. Kulkarni'
  when 1 then 'Circle Officer R. Deshpande'
  else 'Talathi S. More'
end
from numbered n
where od.id = n.id and od.officer_name = 'Demo Officer';

-- 5. Keep officer audit events consistent with the renamed actors.
update public.audit_events ae
set actor = od.officer_name
from public.officer_decisions od
where ae.record_id = od.record_id
  and ae.event_type = 'officer'
  and ae.actor = 'Demo Officer';