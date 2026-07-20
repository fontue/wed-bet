import assert from "node:assert/strict";
import { DOG_HOUSE_PAYLINES } from "../domain/slots/dog-house/config.ts";
import { evaluateDogHouseLines, runDogHouseRound } from "../domain/slots/dog-house/engine.ts";
import { createSeededRng } from "../domain/slots/sweet-lemonza/rng.ts";
import type { DogHouseCell } from "../domain/slots/dog-house/types.ts";
import { getDogHouseState, spinDogHouse } from "../infrastructure/mock/store.ts";

const cell=(id:number,symbol:DogHouseCell["symbol"],multiplier?:2|3):DogHouseCell=>({id,symbol,...(multiplier?{multiplier}:{})});
const grid=Array.from({length:15},(_,index)=>cell(index+1,"TEN"));
grid[5]=cell(6,"BRUNO");grid[6]=cell(7,"WILD",2);grid[7]=cell(8,"BRUNO");grid[8]=cell(9,"WILD",3);grid[9]=cell(10,"BRUNO");
const middle=evaluateDogHouseLines(grid,100).find((win)=>win.line===1)!;
assert.equal(DOG_HOUSE_PAYLINES.length,20);
assert.equal(middle.symbol,"BRUNO");assert.equal(middle.count,5);assert.equal(middle.wildMultiplier,5);assert.equal(middle.payout,37_500);

for(let index=0;index<1_000;index+=1){const round=runDogHouseRound(100,createSeededRng(`dog-${index}`));assert.ok(round.awardedFreeSpins===0||(round.awardedFreeSpins>=9&&round.awardedFreeSpins<=27));assert.ok(round.freeSpins.every((spin)=>spin.bonusCount===0));assert.ok(round.totalPayout<=675_000);}
const before=getDogHouseState("u-sofia"),first=spinDogHouse({userId:"u-sofia",stake:20,idempotencyKey:"dog-house-idempotency-test"}),repeat=spinDogHouse({userId:"u-sofia",stake:20,idempotencyKey:"dog-house-idempotency-test"}),after=getDogHouseState("u-sofia");
assert.equal(first.round.id,repeat.round.id);assert.equal(first.balance,repeat.balance);assert.equal(after.history.length,before.history.length+1);assert.equal(first.round.chargedAmount,20);
console.log("Все проверки Casa degli Sposi пройдены.");
