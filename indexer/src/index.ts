import {
  Connection,
  PublicKey,
  VersionedTransactionResponse,
  LogsCallback,
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

import { OfferEvent } from "./types.js";
import { logger } from "./logger.js";
import { startApiServer } from "./api.js";

function log(level: "debug" | "info" | "warn" | "error", ...args: any[]) {
  logger(level, LOG_LEVEL, ...args);
}

async function handleTx(
  tx: VersionedTransactionResponse,
  status: "confirmed" | "finalized"
) {
  if (!tx.transaction.signatures || tx.transaction.signatures.length === 0) return;
  const signature = tx.transaction.signatures[0];
  const slot = tx.slot;
  const blockTime = tx.blockTime || null;

  await upsertTx(signature, slot, status, blockTime, PROGRAM_ID.toBase58());

  const decoded = decodeProgramInstructions(tx);

  for (const d of decoded) {
    const named = mapAccountsByIdlName(d.name, d.accounts);
    const { event, snapshot } = buildEventAndSnapshot(
      d.name,
      d.data,
      named,
      signature,
      slot
    );

    log("debug", `Decoded instruction`, {
      ixName: d.name,
      accounts: named,
      args: d.data
    });

    if (event) {
      log("info", `Event [${event.kind}] for offer ${event.offerPda} at slot ${slot} sig=${signature}`);
      await appendEvent(event as OfferEvent);
    }
    if (snapshot) {
      await upsertOfferSnapshot(snapshot);
    }
  }
}

/* Backfill by scanning signatures for the program in finalized commitment.
   Uses the durable cursor.
*/
async function backfill(conn: Connection) {
  const cursor = await getCursor();
  log("info", "Backfill starting from slot >", cursor.last_finalized_slot);
  let current = cursor.last_finalized_slot;

  // get signatures for address in pages (we use before=last_seen_signature)
  let before: string | undefined = cursor.last_seen_signature ?? undefined;

  while (true) {
    const sigs: ConfirmedSignatureInfo[] = await conn.getSignaturesForAddress(
      PROGRAM_ID,
      { before: before || undefined, limit: BATCH_SIZE },
      "finalized"
    );

    if (sigs.length === 0) {
      log("info", "No more signatures to backfill (page empty).");
      break;
    }

    // note: getSignaturesForAddress returns newest -> oldest; we need to process oldest -> newest
    for (const sig of sigs.reverse()) {
      const tx = await conn.getTransaction(sig.signature, {
        commitment: "finalized",
        maxSupportedTransactionVersion: 0
      });
      if (tx) {
        try {
          await handleTx(tx, "finalized");
        } catch (e) {
          log("error", "Error handling tx during backfill", sig.signature, e);
        }
      } else {
        log("warn", "Skipped fetching tx during backfill (null tx)", sig.signature);
      }
      current = sig.slot;
      before = sig.signature;
      await setCursor(current, sig.signature);
    }

    // small pause to avoid rate limits (optional)
    await new Promise((r) => setTimeout(r, 150));
  }

  log("info", "Backfill complete. Cursor set to slot", current);
}

/* Live logs tail using onLogs / logsSubscribe */
async function tail(conn: Connection) {
  log("info", "Live tail started (logsSubscribe)");
  const subId = await conn.onLogs(PROGRAM_ID, async (logInfo) => {
    try {
      const sig = logInfo.signature;
      log("info", `Raw program logs for tx ${sig}:`);
      for (const l of logInfo.logs) {
        // print only the meaningful program logs
        log("info", "   ", l);
      }

      // Fetch + decode tx at confirmed
      const tx = await conn.getTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0
      });
      if (tx) {
        try {
          await handleTx(tx, "confirmed");
        } catch (e) {
          log("error", "Error handling confirmed tx", sig, e);
        }
      } else {
        log("warn", "Log callback: could not fetch tx for signature (maybe pruned?)", sig);
      }
    } catch (e) {
      log("error", "Error in log callback", e);
    }
  }, "confirmed" as Finality);

  log("info", "Subscription id:", subId);
  return subId;
}

/* Reconcile: check confirmed txs we saved and see if they became finalized or rolled back */
async function reconcile(conn: Connection) {
  const inflight = await findConfirmedNotFinalized();
  for (const row of inflight) {
    try {
      const tx = await conn.getTransaction(row.signature, {
        commitment: "finalized",
        maxSupportedTransactionVersion: 0
      });
      if (tx) {
        log("info", "Reconciling: tx finalized", row.signature);
        await handleTx(tx, "finalized");
      } else {
        log("warn", `Tx ${row.signature} rolled back`);
        await markRolledBack(row.signature);
      }
    } catch (e) {
      log("error", "Error reconciling tx", row.signature, e);
    }
  }
}

async function main() {
  await ready();
  // start API server
  startApiServer();

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
