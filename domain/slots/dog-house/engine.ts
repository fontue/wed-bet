import {
  DOG_HOUSE_BASE_WEIGHTS,DOG_HOUSE_BONUS_REELS,DOG_HOUSE_BONUS_WEIGHT,DOG_HOUSE_COLUMNS,DOG_HOUSE_FREE_SPIN_REVEAL_WEIGHTS,
  DOG_HOUSE_FREE_WEIGHTS,DOG_HOUSE_FREE_WILD_WEIGHT,DOG_HOUSE_GRID_SIZE,DOG_HOUSE_MATH_VERSION,DOG_HOUSE_MAX_WIN_X,
  DOG_HOUSE_PAYLINES,DOG_HOUSE_REGULAR_SYMBOLS,DOG_HOUSE_SYMBOL_META,DOG_HOUSE_WILD_REELS,DOG_HOUSE_WILD_WEIGHT,isDogHouseRegular,
} from "./config";
import type {DogHouseCell,DogHouseLineWin,DogHouseRng,DogHouseRoundResult,DogHouseSpin,DogHouseSymbol} from "./types";

const choice=<T,>(entries:readonly {value:T;weight:number}[],rng:DogHouseRng):T=>{const total=entries.reduce((sum,item)=>sum+item.weight,0);let draw=rng.int(total);for(const item of entries){draw-=item.weight;if(draw<0)return item.value;}return entries.at(-1)!.value;};
const cellIndex=(reel:number,row:number)=>row*DOG_HOUSE_COLUMNS+reel;

function createCell(reel:number,id:number,rng:DogHouseRng,freeSpin:boolean):DogHouseCell{
  const weights=freeSpin?DOG_HOUSE_FREE_WEIGHTS:DOG_HOUSE_BASE_WEIGHTS;
  const entries:Array<{value:DogHouseSymbol;weight:number}>=DOG_HOUSE_REGULAR_SYMBOLS.map((value)=>({value,weight:weights[value]}));
  if(DOG_HOUSE_WILD_REELS.has(reel))entries.push({value:"WILD",weight:freeSpin?DOG_HOUSE_FREE_WILD_WEIGHT:DOG_HOUSE_WILD_WEIGHT});
  if(!freeSpin&&DOG_HOUSE_BONUS_REELS.has(reel))entries.push({value:"BONUS",weight:DOG_HOUSE_BONUS_WEIGHT});
  const symbol=choice(entries,rng);
  return symbol==="WILD"?{id,symbol,multiplier:rng.int(2)===0?2:3}:{id,symbol};
}

export function generateDogHouseGrid(rng:DogHouseRng,freeSpin=false,sticky=new Map<number,2|3>(),idOffset=0):DogHouseCell[]{
  const grid=Array.from({length:DOG_HOUSE_GRID_SIZE},(_,index)=>createCell(index%DOG_HOUSE_COLUMNS,idOffset+index+1,rng,freeSpin));
  for(const [index,multiplier] of sticky)grid[index]={id:idOffset+index+1,symbol:"WILD",multiplier};
  return grid;
}

export function evaluateDogHouseLines(grid:DogHouseCell[],stake:number):DogHouseLineWin[]{
  const wins:DogHouseLineWin[]=[];
  DOG_HOUSE_PAYLINES.forEach((rows,line)=>{
    const positions=rows.map((row,reel)=>cellIndex(reel,row));
    const first=grid[positions[0]]?.symbol;
    if(!first||!isDogHouseRegular(first))return;
    const matched:number[]=[];
    for(const position of positions){const cell=grid[position];if(cell.symbol!==first&&cell.symbol!=="WILD")break;matched.push(position);}
    if(matched.length<3)return;
    const count=Math.min(5,matched.length) as 3|4|5,payoutHundredths=DOG_HOUSE_SYMBOL_META[first].payouts[count-3];
    const wildPositions=matched.filter((position)=>grid[position].symbol==="WILD"),wilds=wildPositions.map((position)=>grid[position]);
    const wildMultiplier=wilds.length?wilds.reduce((sum,cell)=>sum+(cell.multiplier??1),0):1;
    const basePayout=Math.floor(stake*payoutHundredths/100);
    wins.push({line:line+1,symbol:first,count,positions:matched,payoutHundredths,basePayout,wildPositions,wildMultipliers:wilds.map((cell)=>cell.multiplier).filter((value):value is 2|3=>typeof value==="number"),wildMultiplier,payout:basePayout*wildMultiplier});
  });
  return wins;
}

function bonusCount(grid:DogHouseCell[]):number{return [0,2,4].filter((reel)=>[0,1,2].some((row)=>grid[cellIndex(reel,row)].symbol==="BONUS")).length;}
function runSpin(rng:DogHouseRng,stake:number,freeSpin:boolean,sticky:Map<number,2|3>,idOffset:number):DogHouseSpin{
  const grid=generateDogHouseGrid(rng,freeSpin,sticky,idOffset),wins=evaluateDogHouseLines(grid,stake);
  if(freeSpin)for(let index=0;index<grid.length;index+=1){const cell=grid[index];if(cell.symbol==="WILD"&&cell.multiplier)sticky.set(index,cell.multiplier);}
  return{grid,wins,payout:wins.reduce((sum,win)=>sum+win.payout,0),bonusCount:bonusCount(grid),stickyWilds:[...sticky].map(([index,multiplier])=>({index,multiplier}))};
}

export function runDogHouseRound(stake:number,rng:DogHouseRng,{includeBonus=true}:{includeBonus?:boolean}={}):DogHouseRoundResult{
  if(!Number.isSafeInteger(stake)||stake<=0)throw new Error("INVALID_STAKE");
  const base=runSpin(rng,stake,false,new Map(),0),bonusTriggered=base.bonusCount===3,bonusScatterPayout=bonusTriggered?stake*5:0;
  const freeSpinReveal=bonusTriggered?Array.from({length:9},()=>choice(DOG_HOUSE_FREE_SPIN_REVEAL_WEIGHTS,rng)):[];
  const awardedFreeSpins=freeSpinReveal.reduce((sum,value)=>sum+value,0),freeSpins:DogHouseSpin[]=[],sticky=new Map<number,2|3>();
  if(includeBonus&&bonusTriggered)for(let index=0;index<awardedFreeSpins;index+=1)freeSpins.push(runSpin(rng,stake,true,sticky,(index+1)*DOG_HOUSE_GRID_SIZE));
  const baseGamePayout=base.payout,bonusPayout=freeSpins.reduce((sum,spin)=>sum+spin.payout,0),uncapped=baseGamePayout+bonusScatterPayout+bonusPayout,cap=stake*DOG_HOUSE_MAX_WIN_X,totalPayout=Math.min(uncapped,cap);
  const maxLineMultiplier=Math.max(1,...base.wins.map((win)=>win.wildMultiplier),...freeSpins.flatMap((spin)=>spin.wins.map((win)=>win.wildMultiplier))),stickyWildCount=freeSpins.at(-1)?.stickyWilds.length??0,bestFreeSpin=Math.max(0,...freeSpins.map((spin)=>spin.payout));
  return{mathVersion:DOG_HOUSE_MATH_VERSION,stake,chargedAmount:stake,base,bonusTriggered,bonusScatterPayout,freeSpinReveal,awardedFreeSpins,freeSpins,baseGamePayout,bonusPayout,totalPayout,maxMultiplier:maxLineMultiplier,maxLineMultiplier,stickyWildCount,bestFreeSpin,maxWinCapped:uncapped>cap};
}
