import type { DogHouseCell, DogHouseSymbol } from "@/domain/slots/dog-house/types";

const REGULAR:DogHouseSymbol[]=["BRUNO","BELLA","PUG","DACHSHUND","COLLAR","BONE","A","K","Q","J","TEN"];
const repeat=(values:DogHouseSymbol[],length:number)=>Array.from({length},(_,index)=>values[index%values.length]);

export const BASE_PRESENTATION_STRIPS:ReadonlyArray<readonly DogHouseSymbol[]>=[
  repeat([...REGULAR,"BONUS","COLLAR","A","DACHSHUND"],24),
  repeat([...REGULAR,"WILD","BONE","K","BELLA"],24),
  repeat([...REGULAR,"BONUS","WILD","Q","PUG"],26),
  repeat([...REGULAR,"WILD","COLLAR","TEN","BRUNO"],24),
  repeat([...REGULAR,"BONUS","BONE","J","DACHSHUND"],24),
];

export const FREE_SPIN_PRESENTATION_STRIPS:ReadonlyArray<readonly DogHouseSymbol[]>=[
  repeat(["BRUNO","BELLA","PUG","DACHSHUND","COLLAR","BONE","A","K","Q","J","TEN","PUG","BONE"],25),
  repeat(["BRUNO","WILD","BELLA","PUG","COLLAR","A","K","WILD","Q","BONE","TEN","DACHSHUND"],26),
  repeat(["PUG","WILD","BRUNO","BELLA","COLLAR","WILD","A","K","BONE","Q","J","TEN"],27),
  repeat(["BELLA","WILD","DACHSHUND","PUG","BONE","K","Q","WILD","COLLAR","A","TEN","BRUNO"],26),
  repeat(["BRUNO","BELLA","PUG","DACHSHUND","COLLAR","BONE","A","K","Q","J","TEN","BELLA","COLLAR"],25),
];

const hash=(value:string)=>{let result=2166136261;for(let index=0;index<value.length;index+=1){result^=value.charCodeAt(index);result=Math.imul(result,16777619);}return result>>>0;};
const next=(state:number)=>{let value=state||0x9e3779b9;value^=value<<13;value^=value>>>17;value^=value<<5;return value>>>0;};

export function buildPresentationStrip({reel,roundSeed,spinIndex,isFreeSpin}:{reel:number;roundSeed:string;spinIndex:number;isFreeSpin:boolean}):DogHouseCell[]{
  const source=[...(isFreeSpin?FREE_SPIN_PRESENTATION_STRIPS:BASE_PRESENTATION_STRIPS)[reel]],result:DogHouseCell[]=[];
  let state=hash(`${roundSeed}:${spinIndex}:${reel}:${isFreeSpin?"free":"base"}`);
  while(source.length){state=next(state);const index=state%source.length,symbol=source.splice(index,1)[0];state=next(state);result.push({id:-(reel+1)*10_000-result.length-1,symbol,...(symbol==="WILD"?{multiplier:(state%2===0?2:3) as 2|3}:{})});}
  return result;
}
