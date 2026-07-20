import type { DogHouseSlotRound } from "@/domain/models";
import { runDogHouseRound } from "@/domain/slots/dog-house/engine";
import { createSeededRng } from "@/domain/slots/sweet-lemonza/rng";

const round=(seed:string):DogHouseSlotRound=>{const result=runDogHouseRound(100,createSeededRng(seed));return{id:`lab-${seed}`,gameId:"casa-degli-sposi",mathVersion:result.mathVersion,userId:"lab",stake:100,mode:"STANDARD",chargedAmount:100,baseWin:result.baseGamePayout,scatterWin:result.bonusScatterPayout,bonusWin:result.bonusPayout,totalWin:result.totalPayout,balanceBefore:100_000,balanceAfter:99_900+result.totalPayout,bonusTriggered:result.bonusTriggered,maxMultiplier:result.maxMultiplier,idempotencyKey:seed,result,createdAt:"2026-01-01T00:00:00.000Z"};};
const reveal=(value:1|2|3)=>{const item=structuredClone(round("patch-342")),total=value*9,source=item.result.freeSpins;item.id+=`-reveal-${total}`;item.result.freeSpinReveal=Array(9).fill(value);item.result.awardedFreeSpins=total;item.result.freeSpins=Array.from({length:total},(_,index)=>structuredClone(source[index%source.length]));item.result.bonusPayout=item.result.freeSpins.reduce((sum,spin)=>sum+spin.payout,0);item.bonusWin=item.result.bonusPayout;item.result.totalPayout=item.result.baseGamePayout+item.result.bonusScatterPayout+item.result.bonusPayout;item.totalWin=item.result.totalPayout;item.balanceAfter=item.balanceBefore-item.chargedAmount+item.totalWin;return item;};

export const DOG_HOUSE_SCENARIOS=[
  {id:"loss",title:"Losing spin",round:round("fixture-0")},
  {id:"line",title:"Simple payline",round:round("fixture-16")},
  {id:"multiple",title:"Many paylines",round:round("fixture-5")},
  {id:"wild-2",title:"Wild 2X",round:round("fixture-25")},
  {id:"wild-sum",title:"Wild 2X + 3X",round:round("patch-34")},
  {id:"anticipation-miss",title:"Anticipation miss",round:round("patch-26")},
  {id:"anticipation-hit",title:"Anticipation hit",round:round("patch-342")},
  {id:"reveal-9",title:"Bonus reveal 9",round:reveal(1)},
  {id:"reveal-18",title:"Bonus reveal 18",round:reveal(2)},
  {id:"reveal-27",title:"Bonus reveal 27",round:reveal(3)},
  {id:"sticky-first",title:"First Sticky Wild",round:round("patch-342")},
  {id:"sticky-many",title:"Multiple Sticky Wild",round:round("patch-428")},
  {id:"big",title:"Big win",round:round("fixture-29")},
] as const;
