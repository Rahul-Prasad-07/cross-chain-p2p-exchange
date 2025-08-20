import {
    VersionedTransactionResponse,
    PublicKey,
    CompiledInstruction
} from "@solana/web3.js";
import { coder, idlIx } from "./coder.js";
import { PROGRAM_ID } from "./config.js";
import { OfferEvent, OfferSnapshot } from "./types.js";
import BN from "bn.js";
import { logger } from "./logger.js";
import { LOG_LEVEL } from "./config.js";

/** helper: resolve account keys (unchanged) */
export function resolveAccountKeys(tx: VersionedTransactionResponse): PublicKey[] {
    const anyMsg: any = tx.transaction.message;
    if (Array.isArray(anyMsg.accountKeys)) {
        return anyMsg.accountKeys as PublicKey[];
    }
    const staticKeys: PublicKey[] = anyMsg.staticAccountKeys as PublicKey[];
    const w: PublicKey[] = tx.meta?.loadedAddresses?.writable || [];
    const r: PublicKey[] = tx.meta?.loadedAddresses?.readonly || [];
    return [...staticKeys, ...w, ...r];
}

function toBuffer(d: any): Buffer {
    if (Buffer.isBuffer(d)) return d as Buffer;
    if (d?.type === "Buffer" && Array.isArray(d?.data)) return Buffer.from(d.data);
    if (d instanceof Uint8Array) return Buffer.from(d);
    if (typeof d === "string") {
        try { return Buffer.from(d, "base64"); } catch { }
        try { return Buffer.from(d, "hex"); } catch { }
    }
    if (d?.data && Array.isArray(d.data)) {
        try { return Buffer.from(d.data[0], d.data[1] || "base64"); } catch { }
    }
    return Buffer.from([]);
}

export function decodeProgramInstructions(tx: VersionedTransactionResponse) {
    const keys = resolveAccountKeys(tx);
    const msg: any = tx.transaction.message;
    const outer: CompiledInstruction[] = msg.compiledInstructions ?? msg.instructions ?? [];
    const inner: CompiledInstruction[] = (tx.meta?.innerInstructions || [])
        .flatMap((inner2: any) => inner2.instructions || []);
    const compiled: CompiledInstruction[] = [...outer, ...inner];

    const decoded: Array<{ name: string; data: any; ix: CompiledInstruction; accounts: PublicKey[] }> = [];

    for (const ix of compiled) {
        const programId = keys[ix.programIdIndex];
        if (!programId || !programId.equals(PROGRAM_ID)) continue;

        const dataBuf = toBuffer(ix.data);
        let dec: any;
        try {
            dec = coder.instruction.decode(dataBuf);
        } catch (err) {
            logger("debug", LOG_LEVEL, "Failed to decode instruction bytes for program, raw data hex:", dataBuf.toString("hex"));
            continue;
        }
        if (!dec) {
            logger("debug", LOG_LEVEL, "Decoded returned null for instruction", dataBuf.toString("hex"));
            continue;
        }

        if (!ix.accounts || ix.accounts.length === 0) {
            logger("warn", LOG_LEVEL, `Skipping instruction with no accounts: ${dec.name} data(hex)=${dataBuf.toString("hex")}`, ix);
            continue;
        }

        const accountPks = ix.accounts.map((i: number) => keys[i]);
        decoded.push({ name: dec.name, data: dec.data, ix, accounts: accountPks });
    }

    return decoded;
}

export function mapAccountsByIdlName(ixName: string, accountPks: PublicKey[]) {
    const spec = idlIx(ixName);
    const out: Record<string, string> = {};
    if (!spec) return out;
    const idlAccounts: any[] = spec.accounts || [];
    for (let i = 0; i < idlAccounts.length && i < accountPks.length; i++) {
        const name = idlAccounts[i].name as string;
        out[name] = accountPks[i].toBase58();
    }
    return out;
}

function bnStr(x: any) {
    if (x == null) return undefined;
    if (BN.isBN(x)) return (x as BN).toString();
    if (typeof x === "number") return String(x);
    if (typeof x === "bigint") return x.toString();
    return String(x);
}

function bufToHex(b?: Buffer | Uint8Array | null) {
    if (!b) return null;
    return Buffer.from(b).toString("hex");
}

export function pickOfferPda(ixName: string, named: Record<string, string>) {
    return named["interchainOffer"] || named["offer"] || null;
}

export function buildEventAndSnapshot(ixName: string, args: any, named: Record<string, string>, signature: string, slot: number) {
    const offerPda = pickOfferPda(ixName, named);
    if (!offerPda) return { event: null, snapshot: null };

    const tradeId = bnStr(args.tradeId);
    const externalSellerSol = named["externalSellerSol"];
    const externalSellerEvm = args.externalSellerEvm ? Buffer.from(args.externalSellerEvm) : undefined;
    const tokenAOfferedAmount = bnStr(args.tokenAOfferedAmount);
    const tokenBWantedAmount = bnStr(args.tokenBWantedAmount);
    const isTakerNative = typeof args.isTakerNative === "boolean" ? args.isTakerNative : undefined;
    const chainId = bnStr(args.chainId);
    const maker = named["maker"];
    const buyerSol = named["buyerSol"] ?? undefined;

    let kind: any = null;
    if (ixName === "relay_offer_clone") kind = "created";
    else if (ixName === "interchain_origin_evm_deposit_seller_native") kind = "deposit_native";
    else if (ixName === "interchain_origin_evm_deposit_seller_spl") kind = "deposit_spl";
    else if (ixName === "finalize_interchain_origin_evm_offer") kind = "finalized";
    else if (ixName === "deposit_seller_native") kind = "deposit_native";
    else if (ixName === "deposit_seller_spl") kind = "deposit_spl";
    else if (ixName === "finalize_intrachain_offer") kind = "finalized";

    if (!kind) return { event: null, snapshot: null };

    const event: OfferEvent = {
        offerPda,
        signature,
        slot,
        kind,
        payload: {
            ixName,
            args: {
                tradeId,
                tokenAOfferedAmount,
                tokenBWantedAmount,
                isTakerNative,
                chainId
            },
            accounts: named
        }
    };

    const snapshot: OfferSnapshot = { offerPda, lastSlot: slot };

    if (kind === "created") {
        Object.assign(snapshot, {
            tradeId,
            maker,
            externalSellerSol,
            externalSellerEvm,
            tokenAOffered: tokenAOfferedAmount,
            tokenBWanted: tokenBWantedAmount,
            isTakerNative,
            chainId,
            buyerSol: null,
            isSwapCompleted: false
        });

        // Log a friendly created line
        logger("info", LOG_LEVEL, `CREATED: trade=${tradeId} offer=${offerPda} maker=${maker} externalSol=${externalSellerSol} externalEvm=${bufToHex(externalSellerEvm)} tokenA=${tokenAOfferedAmount} tokenB=${tokenBWantedAmount} takerNative=${isTakerNative}`);
    } else if (kind === "deposit_native" || kind === "deposit_spl") {
        if (buyerSol) snapshot.buyerSol = buyerSol;
        if (tokenAOfferedAmount) snapshot.tokenAOffered = tokenAOfferedAmount;
        if (tokenBWantedAmount) snapshot.tokenBWanted = tokenBWantedAmount;

        logger("info", LOG_LEVEL, `DEPOSIT: offer=${offerPda} buyer=${buyerSol ?? named['buyer'] ?? 'unknown'} tokenA=${tokenAOfferedAmount ?? 'n/a'} tokenB=${tokenBWantedAmount ?? 'n/a'}`);
    } else if (kind === "finalized") {
        snapshot.isSwapCompleted = true;
        logger("info", LOG_LEVEL, `FINALIZED: offer=${offerPda} trade=${tradeId} slot=${slot}`);
    }

    return { event, snapshot };
}
