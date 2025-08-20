import { Pool } from "pg";
import { DATABASE_URL, LOG_LEVEL } from "./config.js";
import { CursorRow, OfferEvent, OfferSnapshot } from "./types.js";

const pool = new Pool({ connectionString: DATABASE_URL });

function log(level: string, ...args: any[]) {
  if (["debug", "info", "warn", "error"].indexOf(LOG_LEVEL) === -1) return;
  const order = { debug: 0, info: 1, warn: 2, error: 3 } as any;
  if (order[level] >= order[LOG_LEVEL]) console.log(`[${level}]`, ...args);
}

export async function upsertTx(signature: string, slot: number, status: "confirmed" | "finalized", blockTime: number | null, programId: string) {
  const bt = blockTime ? new Date(blockTime * 1000).toISOString() : null;
  await pool.query(
    `insert into dex_txs (signature, slot, status, block_time, program_id)
     values ($1,$2,$3,$4,$5)
     on conflict (signature) do update set
       slot=excluded.slot,
       status=excluded.status,
       block_time=excluded.block_time,
       program_id=excluded.program_id`,
    [signature, slot, status, bt, programId]
  );
}

export async function markRolledBack(signature: string) {
  await pool.query(
    `update dex_txs set status='rolled_back' where signature=$1`,
    [signature]
  );
  log("info", `Marked rolled_back ${signature}`);
}

export async function upsertOfferSnapshot(s: OfferSnapshot) {
  await pool.query(
    `insert into offers (offer_pda, trade_id, maker, external_seller_sol, external_seller_evm,
                         token_a_offered, token_b_wanted, is_taker_native, chain_id, buyer_sol,
                         is_swap_completed, last_slot)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     on conflict (offer_pda) do update set
       trade_id = coalesce(excluded.trade_id, offers.trade_id),
       maker = coalesce(excluded.maker, offers.maker),
       external_seller_sol = coalesce(excluded.external_seller_sol, offers.external_seller_sol),
       external_seller_evm = coalesce(excluded.external_seller_evm, offers.external_seller_evm),
       token_a_offered = coalesce(excluded.token_a_offered, offers.token_a_offered),
       token_b_wanted = coalesce(excluded.token_b_wanted, offers.token_b_wanted),
       is_taker_native = coalesce(excluded.is_taker_native, offers.is_taker_native),
       chain_id = coalesce(excluded.chain_id, offers.chain_id),
       buyer_sol = coalesce(excluded.buyer_sol, offers.buyer_sol),
       is_swap_completed = coalesce(excluded.is_swap_completed, offers.is_swap_completed),
       last_slot = greatest(offers.last_slot, excluded.last_slot)`,
    [
      s.offerPda, s.tradeId ?? null, s.maker ?? null, s.externalSellerSol ?? null,
      s.externalSellerEvm ?? null, s.tokenAOffered ?? null, s.tokenBWanted ?? null,
      s.isTakerNative ?? null, s.chainId ?? null, s.buyerSol ?? null,
      s.isSwapCompleted ?? null, s.lastSlot
    ]
  );
}

export async function appendEvent(ev: OfferEvent) {
  await pool.query(
    `insert into offer_events (offer_pda, signature, slot, kind, payload)
     values ($1,$2,$3,$4,$5)
     on conflict (offer_pda, kind, signature) do nothing`,
    [ev.offerPda, ev.signature, ev.slot, ev.kind, ev.payload]
  );
}

export async function getCursor(): Promise<CursorRow> {
  const r = await pool.query(`select name, last_finalized_slot, last_seen_signature from cursors where name='main'`);
  if (r.rowCount === 0) throw new Error("Cursor not seeded");
  return r.rows[0];
}

export async function setCursor(slot: number, sig: string | null) {
  await pool.query(
    `update cursors set last_finalized_slot=$1, last_seen_signature=$2 where name='main'`,
    [slot, sig]
  );
}

export async function findConfirmedNotFinalized(): Promise<{ signature: string }[]> {
  const r = await pool.query(`select signature from dex_txs where status='confirmed' order by slot desc limit 1000`);
  return r.rows;
}

export async function ready() {
  try {
    await pool.query("select 1");
    log("info", "DB connected");
  } catch (e) {
    log("error", "DB connection failed", e);
    throw e;
  }
}
