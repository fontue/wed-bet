import type { DogHouseSlotRound } from "@/domain/models";
import { runDogHouseRound } from "@/domain/slots/dog-house/engine";
import { createSeededRng } from "@/domain/slots/sweet-lemonza/rng";
const round=(seed:string):DogHouseSlotRound=>{const result=runDogHouseRound(100,createSeededRng(seed));return{id:`lab-${seed}`,gameId:"casa-degli-sposi",mathVersion:result.mathVersion,userId:"lab",stake:100,mode:"STANDARD",chargedAmount:100,baseWin:result.baseGamePayout,scatterWin:result.bonusScatterPayout,bonusWin:result.bonusPayout,totalWin:result.totalPayout,balanceBefore:100_000,balanceAfter:99_900+result.totalPayout,bonusTriggered:result.bonusTriggered,maxMultiplier:result.maxMultiplier,idempotencyKey:seed,result,createdAt:"2026-01-01T00:00:00.000Z"};};
export const DOG_HOUSE_SCENARIOS=[
  {id:"loss",title:"Losing spin",round:round("fixture-0")},
  {id:"line",title:"Simple line",round:round("fixture-16")},
  {id:"multiple",title:"Multiple lines",round:round("fixture-5")},
  {id:"wild",title:"Wild multiplier",round:round("fixture-25")},
  {id:"bonus",title:"Full bonus",round:round("fixture-71")},
  {id:"sticky",title:"Several Sticky Wild",round:round("fixture-89")},
  {id:"big",title:"Big win",round:round("fixture-29")},
] as const;
