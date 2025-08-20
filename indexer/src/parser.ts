import {
    VersionedTransactionResponse,
    PublicKey,
    CompiledInstruction
} from "@solana/web3.js";
import { coder, idlIx } from "./coder.js";
import { PROGRAM_ID } from "./config.js";
import { OfferEvent, OfferSnapshot } from "./types.js";
import BN from "bn.js";

/** Resolve the flat account key array for compiled-instruction indexing */
export function resolveAccountKeys(tx: VersionedTransactionResponse): PublicKey[] {
    const anyMsg: any = tx.transaction.message;

    if (Array.isArray(anyMsg.accountKeys)) {
        // legacy format (array of PublicKey)
        return anyMsg.accountKeys as PublicKey[];
    }

    const staticKeys: PublicKey[] = anyMsg.staticAccountKeys as PublicKey[] || [];
    const w: PublicKey[] = tx.meta?.loadedAddresses?.writable || [];
    const r: PublicKey[] = tx.meta?.loadedAddresses?.readonly || [];
    return [...staticKeys, ...w, ...r];
}

/** Safe buffer conversion across web3.js versions */
function toBuffer(d: any): Buffer {
    if (!d) return Buffer.from([]);
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

/** Helper: normalize compiled instruction shape to a common object */
function normalizeCompiledIx(ix: any): CompiledInstruction & { accountIndexes?: number[] } {
    const out: any = { ...ix };
    if (Array.isArray(ix.accounts) && ix.accounts.length > 0) {
        out.accountIndexes = ix.accounts.map((a: any) => (typeof a === "number" ? a : null)).filter((x: any) => x !== null);
    } else if (Array.isArray(ix.accountKeyIndexes)) {
        out.accountIndexes = ix.accountKeyIndexes;
    } else {
        out.accountIndexes = [];
    }
    return out;
}

/** Decode program-owned instructions in a transaction */
export function decodeProgramInstructions(
    tx: VersionedTransactionResponse
): Array<{
    name: string;
    data: any;
    ix: CompiledInstruction;
    accounts: PublicKey[];
}> {
    const keys = resolveAccountKeys(tx);
    const msg: any = tx.transaction.message;

    const outerRaw: any[] = msg.compiledInstructions ?? msg.instructions ?? [];
    const outer: any[] = outerRaw.map(normalizeCompiledIx);

    const innerRaw: any[] = tx.meta?.innerInstructions ?? [];
    const inner: any[] = innerRaw.flatMap((g: any) => (g.instructions || []).map(normalizeCompiledIx));

    const compiled: any[] = [...outer, ...inner];

    const decoded: Array<{
        name: string;
        data: any;
        ix: CompiledInstruction;
        accounts: PublicKey[];
    }> = [];

    for (const rawIx of compiled) {
        const programIdIndex = rawIx.programIdIndex;
        if (programIdIndex == null) continue;
        const programId = keys[programIdIndex];
        if (!programId) continue;
        if (!programId.equals(PROGRAM_ID)) continue;

        const dataBuf = toBuffer(rawIx.data);
        let dec: any;
        try {
            dec = coder.instruction.decode(dataBuf);
        } catch (e) {
            continue;
        }
        if (!dec) continue;

        const accountIdxs: number[] = rawIx.accountIndexes ?? rawIx.accounts ?? [];
        let accountPks: PublicKey[] = [];
        if (Array.isArray(accountIdxs) && accountIdxs.length > 0 && typeof accountIdxs[0] === "number") {
            accountPks = accountIdxs.map((i: number) => keys[i]).filter(Boolean);
        } else if (Array.isArray(rawIx.accounts) && rawIx.accounts.length > 0 && rawIx.accounts[0]?.toBase58) {
            accountPks = rawIx.accounts as PublicKey[];
        } else {
            accountPks = [];
        }

        if (!accountPks || accountPks.length === 0) {
            console.warn(`Instruction decoded but no resolved accounts available: ${dec.name}`);
        }

        decoded.push({ name: dec.name, data: dec.data, ix: rawIx as CompiledInstruction, accounts: accountPks });
    }

    return decoded;
}

/** Map accounts by IDL names for a given decoded instruction */
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

/** Find the offer PDA for any of our instructions */
export function pickOfferPda(ixName: string, named: Record<string, string>): string | null {
    return named["interchainOffer"] || named["offer"] || null;
}

/** Build semantic OfferEvent + minimal snapshot mutation */
export function buildEventAndSnapshot(
    ixName: string,
    args: any,
    named: Record<string, string>,
    signature: string,
    slot: number
): { event: OfferEvent | null; snapshot: OfferSnapshot | null } {
    const offerPda = pickOfferPda(ixName, named);
    if (!offerPda) return { event: null, snapshot: null };

    const bnStr = (x: any) => {
        if (x == null) return undefined;
        if (BN.isBN(x)) return (x as BN).toString();
        if (typeof x === "number") return String(x);
        if (typeof x === "bigint") return x.toString();
        return String(x);
    };

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

    const snapshot: OfferSnapshot = {
        offerPda,
        lastSlot: slot
    };

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
    } else if (kind === "deposit_native" || kind === "deposit_spl") {
        if (buyerSol) snapshot.buyerSol = buyerSol;
        if (tokenAOfferedAmount) snapshot.tokenAOffered = tokenAOfferedAmount;
        if (tokenBWantedAmount) snapshot.tokenBWanted = tokenBWantedAmount;
    } else if (kind === "finalized") {
        snapshot.isSwapCompleted = true;
    }

    return { event, snapshot };
}
