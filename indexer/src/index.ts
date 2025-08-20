import {
  Connection,
  VersionedTransactionResponse,
  ConfirmedSignatureInfo,
  Finality
} from "@solana/web3.js";
import {
  RPC_URL,
  WS_URL,
  PROGRAM_ID,
  BATCH_SIZE,
  RECONCILE_EVERY_MS,
  LOG_LEVEL
} from "./config.js";
import {
  ready,
  upsertTx,
  appendEvent,
  upsertOfferSnapshot,
  getCursor,
  setCursor,
  markRolledBack,
  findConfirmedNotFinalized
} from "./db.js";
import {
  decodeProgramInstructions,
  mapAccountsByIdlName,
  buildEventAndSnapshot
} from "./parser.js";

function log(level: string, ...args: any[]) {
  const order = { debug: 0, info: 1, warn: 2, error: 3 } as any;
  if (order[level] >= order[LOG_LEVEL]) console.log(`[${level}]`, ...args);
}

async function handleTx(
  tx: VersionedTransactionResponse,
  status: "confirmed" | "finalized",
  conn?: Connection
) {
  if (!tx.transaction.signatures || tx.transaction.signatures.length === 0) return;
  const signature = tx.transaction.signatures[0];
  const slot = tx.slot;
  const blockTime = tx.blockTime || null;

  await upsertTx(signature, slot, status, blockTime, PROGRAM_ID.toBase58());

  const decoded = decodeProgramInstructions(tx);

  if (!decoded || decoded.length === 0) {
    log("debug", `No decoded instructions for ${signature}`);
    return;
  }

  for (const d of decoded) {
    const named = mapAccountsByIdlName(d.name, d.accounts);

    log("debug", `Instruction decoded: ${d.name} signature=${signature} slot=${slot}`);
    log("debug", "  named accounts:", named);
    log("debug", "  raw args:", d.data);

    const { event, snapshot } = buildEventAndSnapshot(
      d.name,
      d.data,
      named,
      signature,
      slot
    );

    if (event) {
      log("info", `Event [${event.kind}] for offer ${event.offerPda} at slot ${slot}`);
      await appendEvent(event);
    } else {
      log("debug", `No event built for ix ${d.name}`);
    }
    if (snapshot) {
      await upsertOfferSnapshot(snapshot);
    }
  }
}

async function backfill(conn: Connection) {
  const cursor = await getCursor();
  log("info", "Backfill starting from slot >", cursor.last_finalized_slot);

  let current = cursor.last_finalized_slot;
  const latest = await conn.getSlot("finalized");

  while (current < latest) {
    const sigs: ConfirmedSignatureInfo[] = await conn.getSignaturesForAddress(
      PROGRAM_ID,
      { before: cursor.last_seen_signature || undefined, limit: BATCH_SIZE },
      "finalized"
    );

    if (sigs.length === 0) break;

    for (const sig of sigs.reverse()) {
      const tx = await conn.getTransaction(sig.signature, {
        commitment: "finalized",
        maxSupportedTransactionVersion: 0
      });
      if (tx) await handleTx(tx as VersionedTransactionResponse, "finalized", conn);
      current = sig.slot;
      await setCursor(current, sig.signature);
    }
  }

  log("info", "Backfill complete. Cursor set to slot", current);
}

async function tail(conn: Connection) {
  log("info", "Live tail started (logsSubscribe)");

  const subId = await conn.onLogs(PROGRAM_ID, async (logInfo) => {
    try {
      const sig = logInfo.signature;

      log("info", `Raw program logs for tx ${sig}:`);
      for (const l of logInfo.logs) {
        log("info", "   ", l);
      }

      const tx = await conn.getTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0
      });
      if (tx) await handleTx(tx as VersionedTransactionResponse, "confirmed", conn);
    } catch (e) {
      log("error", "Error in log callback", e);
    }
  }, "confirmed" as Finality);

  return subId;
}

async function reconcile(conn: Connection) {
  const inflight = await findConfirmedNotFinalized();
  for (const row of inflight) {
    const tx = await conn.getTransaction(row.signature, {
      commitment: "finalized",
      maxSupportedTransactionVersion: 0
    });
    if (tx) {
      await handleTx(tx as VersionedTransactionResponse, "finalized", conn);
    } else {
      log("warn", `Tx ${row.signature} rolled back`);
      await markRolledBack(row.signature);
    }
  }
}

async function main() {
  await ready();
  const conn = new Connection(RPC_URL, {
    wsEndpoint: WS_URL,
    commitment: "confirmed"
  });
  log("info", "Connecting to RPC:", RPC_URL);
  log("info", "Program:", PROGRAM_ID.toBase58());

  await backfill(conn);
  await tail(conn);

  setInterval(() => {
    reconcile(conn).catch((e) => log("error", "Reconcile error", e));
  }, RECONCILE_EVERY_MS);
}

main().catch((e) => {
  console.error("Fatal error", e);
  process.exit(1);
});
