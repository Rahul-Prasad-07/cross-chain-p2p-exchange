import "dotenv/config";
import { PublicKey } from "@solana/web3.js";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const RPC_URL = process.env.RPC_URL || required("RPC_URL");
export const WS_URL = process.env.WS_URL || undefined;
export const PROGRAM_ID = new PublicKey(required("PROGRAM_ID"));
export const DATABASE_URL = process.env.DATABASE_URL || required("DATABASE_URL");
export const BATCH_SIZE = Number(process.env.BATCH_SIZE || 1000);
export const RECONCILE_EVERY_MS = Number(process.env.RECONCILE_EVERY_MS || 30000);
export const LOG_LEVEL = (process.env.LOG_LEVEL || "info") as "debug" | "info" | "warn" | "error";
