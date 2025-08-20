-- Transactions we've processed (for idempotency + reorg awareness)
create table if not exists dex_txs (
  signature text primary key,
  slot bigint not null,
  status text not null check (status in ('confirmed','finalized','rolled_back')),
  block_time timestamptz,
  program_id text not null
);

-- Offer snapshots (current best-known state, rebuildable by replay)
create table if not exists offers (
  offer_pda text primary key,
  trade_id text,
  maker text,
  external_seller_sol text,
  external_seller_evm bytea,
  token_a_offered text,
  token_b_wanted  text,
  is_taker_native boolean,
  chain_id text,
  buyer_sol text,
  is_swap_completed boolean default false,
  last_slot bigint not null
);

-- Append-only events (auditable history)
create table if not exists offer_events (
  id bigserial primary key,
  offer_pda text not null,
  signature text not null references dex_txs(signature),
  slot bigint not null,
  kind text not null check (kind in ('created','deposit_native','deposit_spl','finalized','closed')),
  payload jsonb not null,
  unique (offer_pda, kind, signature)
);

-- Durable cursor for backfill
create table if not exists cursors (
  name text primary key,
  last_finalized_slot bigint not null default 0,
  last_seen_signature text
);

-- Seed default cursor
insert into cursors (name, last_finalized_slot)
values ('main', 0)
on conflict (name) do nothing;

create index if not exists idx_offer_events_offer on offer_events(offer_pda);
create index if not exists idx_dex_txs_slot on dex_txs(slot);
