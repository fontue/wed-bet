import { randomInt } from "node:crypto";
import type { LemonzaRng } from "./types";

export function createCryptoRng(): LemonzaRng {
  return { int(maxExclusive) { return randomInt(maxExclusive); } };
}

function hashSeed(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function createSeededRng(seed: string): LemonzaRng {
  let state = hashSeed(seed) || 0x6d2b79f5;
  return {
    int(maxExclusive) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new Error("INVALID_RNG_BOUND");
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      const unsigned = (value ^ (value >>> 14)) >>> 0;
      return Math.floor((unsigned / 4_294_967_296) * maxExclusive);
    },
  };
}
