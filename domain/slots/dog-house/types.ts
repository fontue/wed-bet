export type DogHouseRegularSymbol = "BRUNO" | "BELLA" | "PUG" | "DACHSHUND" | "COLLAR" | "BONE" | "A" | "K" | "Q" | "J" | "TEN";
export type DogHouseSymbol = DogHouseRegularSymbol | "WILD" | "BONUS";

export interface DogHouseCell { id:number; symbol:DogHouseSymbol; multiplier?:2|3 }
export interface DogHouseLineWin {
  line:number; symbol:DogHouseRegularSymbol; count:3|4|5; positions:number[];
  payoutHundredths:number; basePayout:number; wildPositions:number[]; wildMultipliers?:Array<2|3>; wildMultiplier:number; payout:number;
}
export interface DogHouseSpin {
  grid:DogHouseCell[]; wins:DogHouseLineWin[]; payout:number; bonusCount:number;
  stickyWilds:Array<{index:number;multiplier:2|3}>;
}
export interface DogHouseRoundResult {
  mathVersion:string; stake:number; chargedAmount:number; base:DogHouseSpin;
  bonusTriggered:boolean; bonusScatterPayout:number; freeSpinReveal:number[];
  awardedFreeSpins:number; freeSpins:DogHouseSpin[]; baseGamePayout:number;
  bonusPayout:number; totalPayout:number; maxMultiplier:number; maxLineMultiplier:number;
  stickyWildCount:number; bestFreeSpin:number; maxWinCapped:boolean;
}
export interface DogHouseRng { int(maxExclusive:number):number }
