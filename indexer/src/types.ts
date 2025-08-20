export type Finality = "confirmed" | "finalized";

export type EventKind = "created" | "deposit_native" | "deposit_spl" | "finalized" | "closed";

export interface OfferSnapshot {
  offerPda: string;
  tradeId?: string;
  maker?: string;
  externalSellerSol?: string;
  externalSellerEvm?: Buffer;
  tokenAOffered?: string;
  tokenBWanted?: string;
  isTakerNative?: boolean;
  chainId?: string;
  buyerSol?: string | null;
  isSwapCompleted?: boolean;
  lastSlot: number;
}

export interface OfferEvent {
  offerPda: string;
  signature: string;
  slot: number;
  kind: EventKind;
  payload: any;
}

export interface CursorRow {
  name: string;
  last_finalized_slot: number;
  last_seen_signature: string | null;
}
