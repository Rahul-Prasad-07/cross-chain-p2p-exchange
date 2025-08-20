import { BorshCoder, Idl } from "@coral-xyz/anchor";
import idlJson from "./idl/swap.json" with { type: "json" };

export const IDL = idlJson as unknown as Idl;
export const coder = new BorshCoder(IDL);

/** Find an IDL instruction by name */
export function idlIx(name: string) {
    const found = (IDL.instructions as any[]).find((ix) => ix.name === name);
    return found || null;
}
